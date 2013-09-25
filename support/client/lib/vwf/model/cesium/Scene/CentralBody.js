/*global define*/
define([
        '../Core/buildModuleUrl',
        '../Core/combine',
        '../Core/loadImage',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/destroyObject',
        '../Core/BoundingRectangle',
        '../Core/BoundingSphere',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Cartographic',
        '../Core/ComponentDatatype',
        '../Core/Ellipsoid',
        '../Core/Extent',
        '../Core/FeatureDetection',
        '../Core/GeographicProjection',
        '../Core/Geometry',
        '../Core/GeometryAttribute',
        '../Core/Intersect',
        '../Core/Math',
        '../Core/Matrix4',
        '../Core/Occluder',
        '../Core/PrimitiveType',
        '../Core/Transforms',
        '../Renderer/BufferUsage',
        '../Renderer/ClearCommand',
        '../Renderer/CommandLists',
        '../Renderer/DepthFunction',
        '../Renderer/DrawCommand',
        '../Renderer/createShaderSource',
        './CentralBodySurface',
        './CentralBodySurfaceShaderSet',
        './CreditDisplay',
        './EllipsoidTerrainProvider',
        './ImageryLayerCollection',
        './Material',
        './SceneMode',
        './TerrainProvider',
        './ViewportQuad',
        '../Shaders/CentralBodyFS',
        '../Shaders/CentralBodyFSDepth',
        '../Shaders/CentralBodyFSPole',
        '../Shaders/CentralBodyVS',
        '../Shaders/CentralBodyVSDepth',
        '../Shaders/CentralBodyVSPole',
        '../ThirdParty/when'
    ], function(
        buildModuleUrl,
        combine,
        loadImage,
        defaultValue,
        defined,
        destroyObject,
        BoundingRectangle,
        BoundingSphere,
        Cartesian2,
        Cartesian3,
        Cartographic,
        ComponentDatatype,
        Ellipsoid,
        Extent,
        FeatureDetection,
        GeographicProjection,
        Geometry,
        GeometryAttribute,
        Intersect,
        CesiumMath,
        Matrix4,
        Occluder,
        PrimitiveType,
        Transforms,
        BufferUsage,
        ClearCommand,
        CommandLists,
        DepthFunction,
        DrawCommand,
        createShaderSource,
        CentralBodySurface,
        CentralBodySurfaceShaderSet,
        CreditDisplay,
        EllipsoidTerrainProvider,
        ImageryLayerCollection,
        Material,
        SceneMode,
        TerrainProvider,
        ViewportQuad,
        CentralBodyFS,
        CentralBodyFSDepth,
        CentralBodyFSPole,
        CentralBodyVS,
        CentralBodyVSDepth,
        CentralBodyVSPole,
        when) {
    "use strict";

    /**
     * DOC_TBA
     *
     * @alias CentralBody
     * @constructor
     *
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] Determines the size and shape of the
     * central body.
     */
    var CentralBody = function(ellipsoid) {
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        var terrainProvider = new EllipsoidTerrainProvider({ellipsoid : ellipsoid});
        var imageryLayerCollection = new ImageryLayerCollection();

        /**
         * The terrain provider providing surface geometry for this central body.
         * @type {TerrainProvider}
         */
        this.terrainProvider = terrainProvider;

        this._ellipsoid = ellipsoid;
        this._imageryLayerCollection = imageryLayerCollection;
        this._surface = new CentralBodySurface({
            terrainProvider : terrainProvider,
            imageryLayerCollection : imageryLayerCollection
        });

        this._occluder = new Occluder(new BoundingSphere(Cartesian3.ZERO, ellipsoid.getMinimumRadius()), Cartesian3.ZERO);

        this._surfaceShaderSet = new CentralBodySurfaceShaderSet(TerrainProvider.attributeIndices);

        this._rsColor = undefined;
        this._rsColorWithoutDepthTest = undefined;

        var clearDepthCommand = new ClearCommand();
        clearDepthCommand.depth = 1.0;
        clearDepthCommand.stencil = 0;
        clearDepthCommand.owner = this;
        this._clearDepthCommand = clearDepthCommand;

        this._depthCommand = new DrawCommand();
        this._depthCommand.primitiveType = PrimitiveType.TRIANGLES;
        this._depthCommand.boundingVolume = new BoundingSphere(Cartesian3.ZERO, ellipsoid.getMaximumRadius());
        this._depthCommand.owner = this;

        this._northPoleCommand = new DrawCommand();
        this._northPoleCommand.primitiveType = PrimitiveType.TRIANGLE_FAN;
        this._northPoleCommand.owner = this;
        this._southPoleCommand = new DrawCommand();
        this._southPoleCommand.primitiveType = PrimitiveType.TRIANGLE_FAN;
        this._southPoleCommand.owner = this;

        this._drawNorthPole = false;
        this._drawSouthPole = false;

        this._commandLists = new CommandLists();

        /**
         * Determines the color of the north pole. If the day tile provider imagery does not
         * extend over the north pole, it will be filled with this color before applying lighting.
         *
         * @type {Cartesian3}
         * @default Cartesian3(2.0 / 255.0, 6.0 / 255.0, 18.0 / 255.0)
         */
        this.northPoleColor = new Cartesian3(2.0 / 255.0, 6.0 / 255.0, 18.0 / 255.0);

        /**
         * Determines the color of the south pole. If the day tile provider imagery does not
         * extend over the south pole, it will be filled with this color before applying lighting.
         *
         * @type {Cartesian3}
         * @default Cartesian3(1.0, 1.0, 1.0)
         */
        this.southPoleColor = new Cartesian3(1.0, 1.0, 1.0);

        /**
         * Determines if the central body will be shown.
         *
         * @type {Boolean}
         * @default true
         */
        this.show = true;

        this._mode = SceneMode.SCENE3D;
        this._projection = undefined;

        /**
         * The normal map to use for rendering waves in the ocean.  Setting this property will
         * only have an effect if the configured terrain provider includes a water mask.
         *
         * @type {String}
         * @default buildModuleUrl('Assets/Textures/waterNormalsSmall.jpg')
         */
        this.oceanNormalMapUrl = buildModuleUrl('Assets/Textures/waterNormalsSmall.jpg');

        /**
         * True if primitives such as billboards, polylines, labels, etc. should be depth-tested
         * against the terrain surface, or false if such primitives should always be drawn on top
         * of terrain unless they're on the opposite side of the globe.  The disadvantage of depth
         * testing primitives against terrain is that slight numerical noise or terrain level-of-detail
         * switched can sometimes make a primitive that should be on the surface disappear underneath it.
         *
         * @type {Boolean}
         * @default false
         */
        this.depthTestAgainstTerrain = false;

        /**
         * The size of the terrain tile cache, expressed as a number of tiles.  Any additional
         * tiles beyond this number will be freed, as long as they aren't needed for rendering
         * this frame.  A larger number will consume more memory but will show detail faster
         * when, for example, zooming out and then back in.
         *
         * @type {Number}
         * @default 100
         */
        this.tileCacheSize = 100;

        this._lastOceanNormalMapUrl = undefined;
        this._oceanNormalMap = undefined;
        this._zoomedOutOceanSpecularIntensity = 0.5;
        this._showingPrettyOcean = false;
        this._hasWaterMask = false;

        var that = this;

        this._drawUniforms = {
            u_zoomedOutOceanSpecularIntensity : function() {
                return that._zoomedOutOceanSpecularIntensity;
            },
            u_oceanNormalMap : function() {
                return that._oceanNormalMap;
            }
        };
    };

    /**
     * Gets an ellipsoid describing the shape of this central body.
     *
     * @memberof CentralBody
     *
     * @returns {Ellipsoid}
     */
    CentralBody.prototype.getEllipsoid = function() {
        return this._ellipsoid;
    };

    /**
     * Gets the collection of image layers that will be rendered on this central body.
     *
     * @memberof CentralBody
     *
     * @returns {ImageryLayerCollection}
     */
    CentralBody.prototype.getImageryLayers = function() {
        return this._imageryLayerCollection;
    };

    var depthQuadScratch = FeatureDetection.supportsTypedArrays() ? new Float32Array(12) : [];

    function computeDepthQuad(centralBody, frameState) {
        var radii = centralBody._ellipsoid.getRadii();
        var p = frameState.camera.getPositionWC();

        // Find the corresponding position in the scaled space of the ellipsoid.
        var q = centralBody._ellipsoid.getOneOverRadii().multiplyComponents(p);

        var qMagnitude = q.magnitude();
        var qUnit = q.normalize();

        // Determine the east and north directions at q.
        var eUnit = Cartesian3.UNIT_Z.cross(q).normalize();
        var nUnit = qUnit.cross(eUnit).normalize();

        // Determine the radius of the 'limb' of the ellipsoid.
        var wMagnitude = Math.sqrt(q.magnitudeSquared() - 1.0);

        // Compute the center and offsets.
        var center = qUnit.multiplyByScalar(1.0 / qMagnitude);
        var scalar = wMagnitude / qMagnitude;
        var eastOffset = eUnit.multiplyByScalar(scalar);
        var northOffset = nUnit.multiplyByScalar(scalar);

        // A conservative measure for the longitudes would be to use the min/max longitudes of the bounding frustum.
        var upperLeft = radii.multiplyComponents(center.add(northOffset).subtract(eastOffset));
        var upperRight = radii.multiplyComponents(center.add(northOffset).add(eastOffset));
        var lowerLeft = radii.multiplyComponents(center.subtract(northOffset).subtract(eastOffset));
        var lowerRight = radii.multiplyComponents(center.subtract(northOffset).add(eastOffset));

        depthQuadScratch[0] = upperLeft.x;
        depthQuadScratch[1] = upperLeft.y;
        depthQuadScratch[2] = upperLeft.z;
        depthQuadScratch[3] = lowerLeft.x;
        depthQuadScratch[4] = lowerLeft.y;
        depthQuadScratch[5] = lowerLeft.z;
        depthQuadScratch[6] = upperRight.x;
        depthQuadScratch[7] = upperRight.y;
        depthQuadScratch[8] = upperRight.z;
        depthQuadScratch[9] = lowerRight.x;
        depthQuadScratch[10] = lowerRight.y;
        depthQuadScratch[11] = lowerRight.z;
        return depthQuadScratch;
    }

    function computePoleQuad(centralBody, frameState, maxLat, maxGivenLat, viewProjMatrix, viewportTransformation) {
        var pt1 = centralBody._ellipsoid.cartographicToCartesian(new Cartographic(0.0, maxGivenLat));
        var pt2 = centralBody._ellipsoid.cartographicToCartesian(new Cartographic(Math.PI, maxGivenLat));
        var radius = pt1.subtract(pt2).magnitude() * 0.5;

        var center = centralBody._ellipsoid.cartographicToCartesian(new Cartographic(0.0, maxLat));

        var right;
        var dir = frameState.camera.direction;
        if (1.0 - Cartesian3.UNIT_Z.negate().dot(dir) < CesiumMath.EPSILON6) {
            right = Cartesian3.UNIT_X;
        } else {
            right = dir.cross(Cartesian3.UNIT_Z).normalize();
        }

        var screenRight = center.add(right.multiplyByScalar(radius));
        var screenUp = center.add(Cartesian3.UNIT_Z.cross(right).normalize().multiplyByScalar(radius));

        Transforms.pointToWindowCoordinates(viewProjMatrix, viewportTransformation, center, center);
        Transforms.pointToWindowCoordinates(viewProjMatrix, viewportTransformation, screenRight, screenRight);
        Transforms.pointToWindowCoordinates(viewProjMatrix, viewportTransformation, screenUp, screenUp);

        var halfWidth = Math.floor(Math.max(screenUp.subtract(center).magnitude(), screenRight.subtract(center).magnitude()));
        var halfHeight = halfWidth;

        return new BoundingRectangle(
                Math.floor(center.x) - halfWidth,
                Math.floor(center.y) - halfHeight,
                halfWidth * 2.0,
                halfHeight * 2.0);
    }

    var viewportScratch = new BoundingRectangle();
    var vpTransformScratch = new Matrix4();
    var polePositionsScratch = FeatureDetection.supportsTypedArrays() ? new Float32Array(8) : [];

    function fillPoles(centralBody, context, frameState) {
        var terrainProvider = centralBody._surface._terrainProvider;
        if (frameState.mode !== SceneMode.SCENE3D) {
            return;
        }

        if (!terrainProvider.isReady()) {
            return;
        }
        var terrainMaxExtent = terrainProvider.getTilingScheme().getExtent();

        var viewProjMatrix = context.getUniformState().getViewProjection();
        var viewport = viewportScratch;
        viewport.width = context.getCanvas().clientWidth;
        viewport.height = context.getCanvas().clientHeight;
        var viewportTransformation = Matrix4.computeViewportTransformation(viewport, 0.0, 1.0, vpTransformScratch);
        var latitudeExtension = 0.05;

        var extent;
        var boundingVolume;
        var frustumCull;
        var occludeePoint;
        var occluded;
        var geometry;
        var rect;
        var occluder = centralBody._occluder;

        // handle north pole
        if (terrainMaxExtent.north < CesiumMath.PI_OVER_TWO) {
            extent = new Extent(
                -Math.PI,
                terrainMaxExtent.north,
                Math.PI,
                CesiumMath.PI_OVER_TWO
            );
            boundingVolume = BoundingSphere.fromExtent3D(extent, centralBody._ellipsoid);
            frustumCull = frameState.cullingVolume.getVisibility(boundingVolume) === Intersect.OUTSIDE;
            occludeePoint = Occluder.computeOccludeePointFromExtent(extent, centralBody._ellipsoid);
            occluded = (occludeePoint && !occluder.isPointVisible(occludeePoint, 0.0)) || !occluder.isBoundingSphereVisible(boundingVolume);

            centralBody._drawNorthPole = !frustumCull && !occluded;
            if (centralBody._drawNorthPole) {
                rect = computePoleQuad(centralBody, frameState, extent.north, extent.south - latitudeExtension, viewProjMatrix, viewportTransformation);
                polePositionsScratch[0] = rect.x;
                polePositionsScratch[1] = rect.y;
                polePositionsScratch[2] = rect.x + rect.width;
                polePositionsScratch[3] = rect.y;
                polePositionsScratch[4] = rect.x + rect.width;
                polePositionsScratch[5] = rect.y + rect.height;
                polePositionsScratch[6] = rect.x;
                polePositionsScratch[7] = rect.y + rect.height;

                if (!defined(centralBody._northPoleCommand.vertexArray)) {
                    centralBody._northPoleCommand.boundingVolume = BoundingSphere.fromExtent3D(extent, centralBody._ellipsoid);
                    geometry = new Geometry({
                        attributes : {
                            position : new GeometryAttribute({
                                componentDatatype : ComponentDatatype.FLOAT,
                                componentsPerAttribute : 2,
                                values : polePositionsScratch
                            })
                        }
                    });
                    centralBody._northPoleCommand.vertexArray = context.createVertexArrayFromGeometry({
                        geometry : geometry,
                        attributeIndices : {
                            position : 0
                        },
                        bufferUsage : BufferUsage.STREAM_DRAW
                    });
                } else {
                    centralBody._northPoleCommand.vertexArray.getAttribute(0).vertexBuffer.copyFromArrayView(polePositionsScratch);
                }
            }
        }

        // handle south pole
        if (terrainMaxExtent.south > -CesiumMath.PI_OVER_TWO) {
            extent = new Extent(
                -Math.PI,
                -CesiumMath.PI_OVER_TWO,
                Math.PI,
                terrainMaxExtent.south
            );
            boundingVolume = BoundingSphere.fromExtent3D(extent, centralBody._ellipsoid);
            frustumCull = frameState.cullingVolume.getVisibility(boundingVolume) === Intersect.OUTSIDE;
            occludeePoint = Occluder.computeOccludeePointFromExtent(extent, centralBody._ellipsoid);
            occluded = (occludeePoint && !occluder.isPointVisible(occludeePoint)) || !occluder.isBoundingSphereVisible(boundingVolume);

            centralBody._drawSouthPole = !frustumCull && !occluded;
            if (centralBody._drawSouthPole) {
                rect = computePoleQuad(centralBody, frameState, extent.south, extent.north + latitudeExtension, viewProjMatrix, viewportTransformation);
                polePositionsScratch[0] = rect.x;
                polePositionsScratch[1] = rect.y;
                polePositionsScratch[2] = rect.x + rect.width;
                polePositionsScratch[3] = rect.y;
                polePositionsScratch[4] = rect.x + rect.width;
                polePositionsScratch[5] = rect.y + rect.height;
                polePositionsScratch[6] = rect.x;
                polePositionsScratch[7] = rect.y + rect.height;

                 if (!defined(centralBody._southPoleCommand.vertexArray)) {
                     centralBody._southPoleCommand.boundingVolume = BoundingSphere.fromExtent3D(extent, centralBody._ellipsoid);
                     geometry = new Geometry({
                         attributes : {
                             position : new GeometryAttribute({
                                 componentDatatype : ComponentDatatype.FLOAT,
                                 componentsPerAttribute : 2,
                                 values : polePositionsScratch
                             })
                         }
                     });
                     centralBody._southPoleCommand.vertexArray = context.createVertexArrayFromGeometry({
                         geometry : geometry,
                         attributeIndices : {
                             position : 0
                         },
                         bufferUsage : BufferUsage.STREAM_DRAW
                     });
                 } else {
                     centralBody._southPoleCommand.vertexArray.getAttribute(0).vertexBuffer.copyFromArrayView(polePositionsScratch);
                 }
            }
        }

        var poleIntensity = 0.0;
        var baseLayer = centralBody._imageryLayerCollection.getLength() > 0 ? centralBody._imageryLayerCollection.get(0) : undefined;
        if (defined(baseLayer) && defined(baseLayer.getImageryProvider()) && defined(baseLayer.getImageryProvider().getPoleIntensity)) {
            poleIntensity = baseLayer.getImageryProvider().getPoleIntensity();
        }

        var drawUniforms = {
            u_dayIntensity : function() {
                return poleIntensity;
            }
        };

        var that = centralBody;
        if (!defined(centralBody._northPoleCommand.uniformMap)) {
            var northPoleUniforms = combine([drawUniforms, {
                u_color : function() {
                    return that.northPoleColor;
                }
            }], false, false);
            centralBody._northPoleCommand.uniformMap = combine([northPoleUniforms, centralBody._drawUniforms], false, false);
        }

        if (!defined(centralBody._southPoleCommand.uniformMap)) {
            var southPoleUniforms = combine([drawUniforms, {
                u_color : function() {
                    return that.southPoleColor;
                }
            }], false, false);
            centralBody._southPoleCommand.uniformMap = combine([southPoleUniforms, centralBody._drawUniforms], false, false);
        }
    }

    /**
     * @private
     */
    CentralBody.prototype.update = function(context, frameState, commandList) {
        if (!this.show) {
            return;
        }

        var width = context.getCanvas().clientWidth;
        var height = context.getCanvas().clientHeight;

        if (width === 0 || height === 0) {
            return;
        }

        var mode = frameState.mode;
        var projection = frameState.scene2D.projection;
        var modeChanged = false;

        if (this._mode !== mode || !defined(this._rsColor)) {
            modeChanged = true;
            if (mode === SceneMode.SCENE3D || mode === SceneMode.COLUMBUS_VIEW) {
                this._rsColor = context.createRenderState({ // Write color and depth
                    cull : {
                        enabled : true
                    },
                    depthTest : {
                        enabled : true
                    }
                });
                this._rsColorWithoutDepthTest = context.createRenderState({ // Write color, not depth
                    cull : {
                        enabled : true
                    }
                });
                this._depthCommand.renderState = context.createRenderState({ // Write depth, not color
                    cull : {
                        enabled : true
                    },
                    depthTest : {
                        enabled : true,
                        func : DepthFunction.ALWAYS
                    },
                    colorMask : {
                        red : false,
                        green : false,
                        blue : false,
                        alpha : false
                    }
                });
            } else {
                this._rsColor = context.createRenderState({
                    cull : {
                        enabled : true
                    }
                });
                this._rsColorWithoutDepthTest = context.createRenderState({
                    cull : {
                        enabled : true
                    }
                });
                this._depthCommand.renderState = context.createRenderState({
                    cull : {
                        enabled : true
                    }
                });
            }
        }

        this._northPoleCommand.renderState = this._rsColorWithoutDepthTest;
        this._southPoleCommand.renderState = this._rsColorWithoutDepthTest;

        // update depth plane
        var depthQuad = computeDepthQuad(this, frameState);

        // depth plane
        if (!this._depthCommand.vertexArray) {
            var geometry = new Geometry({
                attributes : {
                    position : new GeometryAttribute({
                        componentDatatype : ComponentDatatype.FLOAT,
                        componentsPerAttribute : 3,
                        values : depthQuad
                    })
                },
                indices : [0, 1, 2, 2, 1, 3],
                primitiveType : PrimitiveType.TRIANGLES
            });
            this._depthCommand.vertexArray = context.createVertexArrayFromGeometry({
                geometry : geometry,
                attributeIndices : {
                    position : 0
                },
                bufferUsage : BufferUsage.DYNAMIC_DRAW
            });
        } else {
            this._depthCommand.vertexArray.getAttribute(0).vertexBuffer.copyFromArrayView(depthQuad);
        }

        var shaderCache = context.getShaderCache();

        if (!defined(this._depthCommand.shaderProgram)) {
            this._depthCommand.shaderProgram = shaderCache.getShaderProgram(
                CentralBodyVSDepth,
                CentralBodyFSDepth, {
                    position : 0
                });
        }

        if (this._surface._terrainProvider.hasWaterMask() &&
            this.oceanNormalMapUrl !== this._lastOceanNormalMapUrl) {

            this._lastOceanNormalMapUrl = this.oceanNormalMapUrl;

            var that = this;
            when(loadImage(this.oceanNormalMapUrl), function(image) {
                that._oceanNormalMap = that._oceanNormalMap && that._oceanNormalMap.destroy();
                that._oceanNormalMap = context.createTexture2D({
                    source : image
                });
            });
        }

        // Initial compile or re-compile if uber-shader parameters changed
        var projectionChanged = this._projection !== projection;
        var hasWaterMask = this._surface._terrainProvider.hasWaterMask();
        var hasWaterMaskChanged = this._hasWaterMask !== hasWaterMask;

        if (!defined(this._surfaceShaderSet) ||
            !defined(this._northPoleCommand.shaderProgram) ||
            !defined(this._southPoleCommand.shaderProgram) ||
            modeChanged ||
            projectionChanged ||
            hasWaterMaskChanged ||
            (defined(this._oceanNormalMap)) !== this._showingPrettyOcean) {

            var getPosition3DMode = 'vec4 getPosition(vec3 position3DWC) { return getPosition3DMode(position3DWC); }';
            var getPosition2DMode = 'vec4 getPosition(vec3 position3DWC) { return getPosition2DMode(position3DWC); }';
            var getPositionColumbusViewMode = 'vec4 getPosition(vec3 position3DWC) { return getPositionColumbusViewMode(position3DWC); }';
            var getPositionMorphingMode = 'vec4 getPosition(vec3 position3DWC) { return getPositionMorphingMode(position3DWC); }';

            var getPositionMode;

            switch (mode) {
            case SceneMode.SCENE3D:
                getPositionMode = getPosition3DMode;
                break;
            case SceneMode.SCENE2D:
                getPositionMode = getPosition2DMode;
                break;
            case SceneMode.COLUMBUS_VIEW:
                getPositionMode = getPositionColumbusViewMode;
                break;
            case SceneMode.MORPHING:
                getPositionMode = getPositionMorphingMode;
                break;
            }

            var get2DYPositionFractionGeographicProjection = 'float get2DYPositionFraction() { return get2DGeographicYPositionFraction(); }';
            var get2DYPositionFractionMercatorProjection = 'float get2DYPositionFraction() { return get2DMercatorYPositionFraction(); }';

            var get2DYPositionFraction;

            if (projection instanceof GeographicProjection) {
                get2DYPositionFraction = get2DYPositionFractionGeographicProjection;
            } else {
                get2DYPositionFraction = get2DYPositionFractionMercatorProjection;
            }

            this._surfaceShaderSet.baseVertexShaderString = createShaderSource({
                defines : [hasWaterMask ? 'SHOW_REFLECTIVE_OCEAN' : ''],
                sources : [CentralBodyVS, getPositionMode, get2DYPositionFraction]
            });

            var showPrettyOcean = hasWaterMask && defined(this._oceanNormalMap);

            this._surfaceShaderSet.baseFragmentShaderString = createShaderSource({
                defines : [
                    (hasWaterMask ? 'SHOW_REFLECTIVE_OCEAN' : ''),
                    (showPrettyOcean ? 'SHOW_OCEAN_WAVES' : '')
                ],
                sources : [CentralBodyFS]
            });
            this._surfaceShaderSet.invalidateShaders();

            var poleShaderProgram = shaderCache.replaceShaderProgram(this._northPoleCommand.shaderProgram,
                CentralBodyVSPole, CentralBodyFSPole, TerrainProvider.attributeIndices);

            this._northPoleCommand.shaderProgram = poleShaderProgram;
            this._southPoleCommand.shaderProgram = poleShaderProgram;

            this._showingPrettyOcean = defined(this._oceanNormalMap);
            this._hasWaterMask = hasWaterMask;
        }

        var cameraPosition = frameState.camera.getPositionWC();

        this._occluder.setCameraPosition(cameraPosition);

        fillPoles(this, context, frameState);

        this._mode = mode;
        this._projection = projection;

        var pass = frameState.passes;
        var commandLists = this._commandLists;
        commandLists.removeAll();

        if (pass.color) {
            var colorCommandList = commandLists.colorList;

            // render quads to fill the poles
            if (mode === SceneMode.SCENE3D) {
                if (this._drawNorthPole) {
                    colorCommandList.push(this._northPoleCommand);
                }

                if (this._drawSouthPole) {
                    colorCommandList.push(this._southPoleCommand);
                }
            }

            // Don't show the ocean specular highlights when zoomed out in 2D and Columbus View.
            if (mode === SceneMode.SCENE3D) {
                this._zoomedOutOceanSpecularIntensity = 0.5;
            } else {
                this._zoomedOutOceanSpecularIntensity = 0.0;
            }

            this._surface._tileCacheSize = this.tileCacheSize;
            this._surface.setTerrainProvider(this.terrainProvider);
            this._surface.update(context,
                    frameState,
                    colorCommandList,
                    this._drawUniforms,
                    this._surfaceShaderSet,
                    this._rsColor,
                    this._projection);

            displayCredits(this, frameState);

            // render depth plane
            if (mode === SceneMode.SCENE3D || mode === SceneMode.COLUMBUS_VIEW) {
                if (!this.depthTestAgainstTerrain) {
                    colorCommandList.push(this._clearDepthCommand);
                    if (mode === SceneMode.SCENE3D) {
                        colorCommandList.push(this._depthCommand);
                    }
                }
            }
        }

        if (pass.pick) {
            // Not actually pickable, but render depth-only so primitives on the backface
            // of the globe are not picked.
            commandLists.pickList.push(this._depthCommand);
        }

        if (!commandLists.empty()) {
            commandList.push(commandLists);
        }
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @memberof CentralBody
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     *
     * @see CentralBody#destroy
     */
    CentralBody.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
     * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
     * <br /><br />
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     *
     * @memberof CentralBody
     *
     * @returns {undefined}
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see CentralBody#isDestroyed
     *
     * @example
     * centralBody = centralBody && centralBody.destroy();
     */
    CentralBody.prototype.destroy = function() {
        this._northPoleCommand.vertexArray = this._northPoleCommand.vertexArray && this._northPoleCommand.vertexArray.destroy();
        this._southPoleCommand.vertexArray = this._southPoleCommand.vertexArray && this._southPoleCommand.vertexArray.destroy();

        this._surfaceShaderSet = this._surfaceShaderSet && this._surfaceShaderSet.destroy();

        this._northPoleCommand.shaderProgram = this._northPoleCommand.shaderProgram && this._northPoleCommand.shaderProgram.release();
        this._southPoleCommand.shaderProgram = this._northPoleCommand.shaderProgram;

        this._depthCommand.shaderProgram = this._depthCommand.shaderProgram && this._depthCommand.shaderProgram.release();
        this._depthCommand.vertexArray = this._depthCommand.vertexArray && this._depthCommand.vertexArray.destroy();

        this._surface = this._surface && this._surface.destroy();

        this._oceanNormalMap = this._oceanNormalMap && this._oceanNormalMap.destroy();

        return destroyObject(this);
    };

    function displayCredits(centralBody, frameState) {
        var creditDisplay = frameState.creditDisplay;
        var credit = centralBody._surface._terrainProvider.getCredit();
        if (defined(credit)) {
            creditDisplay.addCredit(credit);
        }

        var imageryLayerCollection = centralBody._imageryLayerCollection;
        for ( var i = 0, len = imageryLayerCollection.getLength(); i < len; ++i) {
            var layer = imageryLayerCollection.get(i);
            if (layer.show) {
                credit = layer.getImageryProvider().getCredit();
                if (defined(credit)) {
                    creditDisplay.addCredit(credit);
                }
            }
        }
    }

    return CentralBody;
});
