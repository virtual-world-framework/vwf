/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/destroyObject',
        '../Core/Matrix4',
        '../Core/BoundingSphere',
        '../Core/Geometry',
        '../Core/GeometryAttribute',
        '../Core/GeometryAttributes',
        '../Core/GeometryInstance',
        '../Core/GeometryInstanceAttribute',
        '../Core/ComponentDatatype',
        '../Core/TaskProcessor',
        '../Core/GeographicProjection',
        '../Core/clone',
        '../Renderer/BufferUsage',
        '../Renderer/VertexLayout',
        '../Renderer/DrawCommand',
        '../Renderer/createShaderSource',
        '../Renderer/CullFace',
        '../Renderer/Pass',
        './PrimitivePipeline',
        './PrimitiveState',
        './SceneMode',
        '../ThirdParty/when'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        destroyObject,
        Matrix4,
        BoundingSphere,
        Geometry,
        GeometryAttribute,
        GeometryAttributes,
        GeometryInstance,
        GeometryInstanceAttribute,
        ComponentDatatype,
        TaskProcessor,
        GeographicProjection,
        clone,
        BufferUsage,
        VertexLayout,
        DrawCommand,
        createShaderSource,
        CullFace,
        Pass,
        PrimitivePipeline,
        PrimitiveState,
        SceneMode,
        when) {
    "use strict";

    var EMPTY_ARRAY = [];

    /**
     * A primitive represents geometry in the {@link Scene}.  The geometry can be from a single {@link GeometryInstance}
     * as shown in example 1 below, or from an array of instances, even if the geometry is from different
     * geometry types, e.g., an {@link ExtentGeometry} and an {@link EllipsoidGeometry} as shown in Code Example 2.
     * <p>
     * A primitive combines geometry instances with an {@link Appearance} that describes the full shading, including
     * {@link Material} and {@link RenderState}.  Roughly, the geometry instance defines the structure and placement,
     * and the appearance defines the visual characteristics.  Decoupling geometry and appearance allows us to mix
     * and match most of them and add a new geometry or appearance independently of each other.
     * </p>
     * <p>
     * Combining multiple instances into one primitive is called batching, and significantly improves performance for static data.
     * Instances can be individually picked; {@link Scene#pick} returns their {@link GeometryInstance#id}.  Using
     * per-instance appearances like {@link PerInstanceColorAppearance}, each instance can also have a unique color.
     * </p>
     * <p>
     * {@link Geometry} can either be created and batched on a web worker or the main thread. The first two examples
     * show geometry that will be created on a web worker by using the descriptions of the geometry. The third example
     * shows how to create the geometry on the main thread by explicitly calling the <code>createGeometry</code> method.
     * </p>
     *
     * @alias Primitive
     * @constructor
     *
     * @param {Array|GeometryInstance} [options.geometryInstances] The geometry instances - or a single geometry instance - to render.
     * @param {Appearance} [options.appearance] The appearance used to render the primitive.
     * @param {Boolean} [options.show=true] Determines if this primitive will be shown.
     * @param {Boolean} [options.vertexCacheOptimize=false] When <code>true</code>, geometry vertices are optimized for the pre and post-vertex-shader caches.
     * @param {Boolean} [options.releaseGeometryInstances=true] When <code>true</code>, the primitive does not keep a reference to the input <code>geometryInstances</code> to save memory.
     * @param {Boolean} [options.allow3DOnly=false] When <code>true</code>, each geometry instance will only be rendered in 3D to save GPU memory.
     * @param {Boolean} [options.allowPicking=true] When <code>true</code>, each geometry instance will only be pickable with {@link Scene#pick}.  When <code>false</code>, GPU memory is saved.
     * @param {Boolean} [options.asynchronous=true] Determines if the primitive will be created asynchronously or block until ready.
     * @param {Boolean} [options.debugShowBoundingVolume=false] For debugging only. Determines if this primitive's commands' bounding spheres are shown.
     *
     * @example
     * // 1. Draw a translucent ellipse on the surface with a checkerboard pattern
     * var instance = new GeometryInstance({
     *   geometry : new EllipseGeometry({
     *       vertexFormat : VertexFormat.POSITION_AND_ST,
     *       ellipsoid : ellipsoid,
     *       center : ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-100, 20)),
     *       semiMinorAxis : 500000.0,
     *       semiMajorAxis : 1000000.0,
     *       rotation : CesiumMath.PI_OVER_FOUR
     *   }),
     *   id : 'object returned when this instance is picked and to get/set per-instance attributes'
     * });
     * var primitive = new Primitive({
     *   geometryInstances : instance,
     *   appearance : new EllipsoidSurfaceAppearance({
     *     material : Material.fromType('Checkerboard')
     *   })
     * });
     * scene.getPrimitives().add(primitive);
     *
     * // 2. Draw different instances each with a unique color
     * var extentInstance = new GeometryInstance({
     *   geometry : new ExtentGeometry({
     *     vertexFormat : VertexFormat.POSITION_AND_NORMAL,
     *     extent : new Extent(
     *       CesiumMath.toRadians(-140.0),
     *       CesiumMath.toRadians(30.0),
     *       CesiumMath.toRadians(-100.0),
     *       CesiumMath.toRadians(40.0))
     *     }),
     *   id : 'extent',
     *   attribute : {
     *     color : new ColorGeometryInstanceAttribute(0.0, 1.0, 1.0, 0.5)
     *   }
     * });
     * var ellipsoidInstance = new GeometryInstance({
     *   geometry : new EllipsoidGeometry({
     *     vertexFormat : VertexFormat.POSITION_AND_NORMAL,
     *     radii : new Cartesian3(500000.0, 500000.0, 1000000.0)
     *   }),
     *   modelMatrix : Matrix4.multiplyByTranslation(Transforms.eastNorthUpToFixedFrame(
     *     ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-95.59777, 40.03883))), new Cartesian3(0.0, 0.0, 500000.0)),
     *   id : 'ellipsoid',
     *   attribute : {
     *     color : ColorGeometryInstanceAttribute.fromColor(Color.AQUA)
     *   }
     * });
     * var primitive = new Primitive({
     *   geometryInstances : [extentInstance, ellipsoidInstance],
     *   appearance : new PerInstanceColorAppearance()
     * });
     * scene.getPrimitives().add(primitive);
     *
     * // 3. Create the geometry on the main thread.
     * var primitive = new Primitive({
     *   geometryInstances : new GeometryInstance({
     *       geometry : EllipsoidGeometry.createGeometry(new EllipsoidGeometry({
     *         vertexFormat : VertexFormat.POSITION_AND_NORMAL,
     *         radii : new Cartesian3(500000.0, 500000.0, 1000000.0)
     *       })),
     *       modelMatrix : Matrix4.multiplyByTranslation(Transforms.eastNorthUpToFixedFrame(
     *         ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-95.59777, 40.03883))), new Cartesian3(0.0, 0.0, 500000.0)),
     *       id : 'ellipsoid',
     *       attribute : {
     *         color : ColorGeometryInstanceAttribute.fromColor(Color.AQUA)
     *       }
     *   }),
     *   appearance : new PerInstanceColorAppearance()
     * });
     * scene.getPrimitives().add(primitive);
     *
     * @see GeometryInstance
     * @see Appearance
     */
    var Primitive = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        /**
         * The geometry instances rendered with this primitive.  This may
         * be <code>undefined</code> if <code>options.releaseGeometryInstances</code>
         * is <code>true</code> when the primitive is constructed.
         * <p>
         * Changing this property after the primitive is rendered has no effect.
         * </p>
         *
         * @type Array
         *
         * @default undefined
         */
        this.geometryInstances = options.geometryInstances;

        /**
         * The {@link Appearance} used to shade this primitive.  Each geometry
         * instance is shaded with the same appearance.  Some appearances, like
         * {@link PerInstanceColorAppearance} allow giving each instance unique
         * properties.
         *
         * @type Appearance
         *
         * @default undefined
         */
        this.appearance = options.appearance;
        this._appearance = undefined;
        this._material = undefined;

        /**
         * The 4x4 transformation matrix that transforms the primitive (all geometry instances) from model to world coordinates.
         * When this is the identity matrix, the primitive is drawn in world coordinates, i.e., Earth's WGS84 coordinates.
         * Local reference frames can be used by providing a different transformation matrix, like that returned
         * by {@link Transforms.eastNorthUpToFixedFrame}.  This matrix is available to GLSL vertex and fragment
         * shaders via {@link czm_model} and derived uniforms.
         *
         * @type Matrix4
         *
         * @default Matrix4.IDENTITY
         *
         * @example
         * var origin = ellipsoid.cartographicToCartesian(
         *   Cartographic.fromDegrees(-95.0, 40.0, 200000.0));
         * p.modelMatrix = Transforms.eastNorthUpToFixedFrame(origin);
         *
         * @see czm_model
         */
        this.modelMatrix = Matrix4.clone(Matrix4.IDENTITY);
        this._modelMatrix = new Matrix4();

        /**
         * Determines if the primitive will be shown.  This affects all geometry
         * instances in the primitive.
         *
         * @type Boolean
         *
         * @default true
         */
        this.show = defaultValue(options.show, true);

        /**
         * When <code>true</code>, geometry vertices are optimized for the pre and post-vertex-shader caches.
         *
         * @type {Boolean}
         *
         * @default true
         *
         * @readonly
         */
        this.vertexCacheOptimize = defaultValue(options.vertexCacheOptimize, false);

        /**
         * When <code>true</code>, the primitive does not keep a reference to the input <code>geometryInstances</code> to save memory.
         *
         * @type {Boolean}
         *
         * @default true
         *
         * @readonly
         */
        this.releaseGeometryInstances = defaultValue(options.releaseGeometryInstances, true);

        /**
         * When <code>true</code>, each geometry instance will only be rendered in 3D to save GPU memory.
         *
         * @type {Boolean}
         *
         * @default false
         *
         * @readonly
         */
        this.allow3DOnly = defaultValue(options.allow3DOnly, false);

        /**
         * When <code>true</code>, each geometry instance will only be pickable with {@link Scene#pick}.  When <code>false</code>, GPU memory is saved.         *
         *
         * @type {Boolean}
         *
         * @default true
         *
         * @readonly
         */
        this.allowPicking = defaultValue(options.allowPicking, true);

        /**
         * Determines if the geometry instances will be created and batched on
         * a web worker.
         *
         * @type Boolean
         *
         * @default true
         *
         * @private
         */
        this.asynchronous = defaultValue(options.asynchronous, true);

        /**
         * This property is for debugging only; it is not for production use nor is it optimized.
         * <p>
         * Draws the bounding sphere for each {@see DrawCommand} in the primitive.
         * </p>
         *
         * @type {Boolean}
         *
         * @default false
         */
        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);

        this._translucent = undefined;

        this._state = PrimitiveState.READY;
        this._createdGeometries = [];
        this._geometries = [];
        this._vaAttributes = undefined;
        this._error = undefined;

        this._boundingSphere = undefined;
        this._boundingSphereWC = undefined;
        this._boundingSphereCV = undefined;
        this._boundingSphere2D = undefined;
        this._perInstanceAttributeIndices = undefined;
        this._instanceIds = [];
        this._lastPerInstanceAttributeIndex = 0;
        this._dirtyAttributes = [];

        this._va = [];
        this._attributeIndices = undefined;
        this._primitiveType = undefined;

        this._frontFaceRS = undefined;
        this._backFaceRS = undefined;
        this._sp = undefined;

        this._pickRS = undefined;
        this._pickSP = undefined;
        this._pickIds = [];

        this._colorCommands = [];
        this._pickCommands = [];
    };

    function cloneAttribute(attribute) {
        return new GeometryAttribute({
            componentDatatype : attribute.componentDatatype,
            componentsPerAttribute : attribute.componentsPerAttribute,
            normalize : attribute.normalize,
            values : new attribute.values.constructor(attribute.values)
        });
    }

    function cloneGeometry(geometry) {
        var attributes = geometry.attributes;
        var newAttributes = new GeometryAttributes();
        for (var property in attributes) {
            if (attributes.hasOwnProperty(property) && defined(attributes[property])) {
                newAttributes[property] = cloneAttribute(attributes[property]);
            }
        }

        var indices;
        if (defined(geometry.indices)) {
            var sourceValues = geometry.indices;
            indices = new sourceValues.constructor(sourceValues);
        }

        return new Geometry({
            attributes : newAttributes,
            indices : indices,
            primitiveType : geometry.primitiveType,
            boundingSphere : BoundingSphere.clone(geometry.boundingSphere)
        });
    }

    function cloneGeometryInstanceAttribute(attribute) {
        return new GeometryInstanceAttribute({
            componentDatatype : attribute.componentDatatype,
            componentsPerAttribute : attribute.componentsPerAttribute,
            normalize : attribute.normalize,
            value : new attribute.value.constructor(attribute.value)
        });
    }

    function cloneInstance(instance, geometry) {
        var attributes = instance.attributes;
        var newAttributes = {};
        for (var property in attributes) {
            if (attributes.hasOwnProperty(property)) {
                newAttributes[property] = cloneGeometryInstanceAttribute(attributes[property]);
            }
        }

        return new GeometryInstance({
            geometry : geometry,
            modelMatrix : Matrix4.clone(instance.modelMatrix),
            attributes : newAttributes
        });
    }

    var positionRegex = /attribute\s+vec(?:3|4)\s+(.*)3DHigh;/g;

    function createColumbusViewShader(primitive, vertexShaderSource) {
        var match;

        var forwardDecl = '';
        var attributes = '';
        var computeFunctions = '';

        while ((match = positionRegex.exec(vertexShaderSource)) !== null) {
            var name = match[1];

            var functionName = 'vec4 czm_compute' + name[0].toUpperCase() + name.substr(1) + '()';
            forwardDecl += functionName + ';\n';

            if (!primitive.allow3DOnly) {
                attributes +=
                    'attribute vec3 ' + name + '2DHigh;\n' +
                    'attribute vec3 ' + name + '2DLow;\n';

                computeFunctions +=
                    functionName + '\n' +
                    '{\n' +
                    '    vec4 p;\n' +
                    '    if (czm_morphTime == 1.0)\n' +
                    '    {\n' +
                    '        p = czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow);\n' +
                    '    }\n' +
                    '    else if (czm_morphTime == 0.0)\n' +
                    '    {\n' +
                    '        p = czm_translateRelativeToEye(' + name + '2DHigh.zxy, ' + name + '2DLow.zxy);\n' +
                    '    }\n' +
                    '    else\n' +
                    '    {\n' +
                    '        p = czm_columbusViewMorph(\n' +
                    '                czm_translateRelativeToEye(' + name + '2DHigh.zxy, ' + name + '2DLow.zxy),\n' +
                    '                czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow),\n' +
                    '                czm_morphTime);\n' +
                    '    }\n' +
                    '    return p;\n' +
                    '}\n\n';
            } else {
                computeFunctions +=
                    functionName + '\n' +
                    '{\n' +
                    '    return czm_translateRelativeToEye(' + name + '3DHigh, ' + name + '3DLow);\n' +
                    '}\n\n';
            }
        }

        return createShaderSource({ sources : [forwardDecl, attributes, vertexShaderSource, computeFunctions] });
    }

    function createPickVertexShaderSource(vertexShaderSource) {
        var renamedVS = vertexShaderSource.replace(/void\s+main\s*\(\s*(?:void)?\s*\)/g, 'void czm_old_main()');
        var pickMain =
            'attribute vec4 pickColor; \n' +
            'varying vec4 czm_pickColor; \n' +
            'void main() \n' +
            '{ \n' +
            '    czm_old_main(); \n' +
            '    czm_pickColor = pickColor; \n' +
            '}';

        return renamedVS + '\n' + pickMain;
    }

    function appendShow(primitive, vertexShaderSource) {
        if (!defined(primitive._attributeIndices.show)) {
            return vertexShaderSource;
        }

        var renamedVS = vertexShaderSource.replace(/void\s+main\s*\(\s*(?:void)?\s*\)/g, 'void czm_non_show_main()');
        var showMain =
            'attribute float show;\n' +
            'void main() \n' +
            '{ \n' +
            '    czm_non_show_main(); \n' +
            '    gl_Position *= show; \n' +
            '}';

        return renamedVS + '\n' + showMain;
    }

    function validateShaderMatching(shaderProgram, attributeIndices) {
        // For a VAO and shader program to be compatible, the VAO must have
        // all active attribute in the shader program.  The VAO may have
        // extra attributes with the only concern being a potential
        // performance hit due to extra memory bandwidth and cache pollution.
        // The shader source could have extra attributes that are not used,
        // but there is no guarantee they will be optimized out.
        //
        // Here, we validate that the VAO has all attributes required
        // to match the shader program.
        var shaderAttributes = shaderProgram.getVertexAttributes();

        for (var name in shaderAttributes) {
            if (shaderAttributes.hasOwnProperty(name)) {
                if (!defined(attributeIndices[name])) {
                    throw new DeveloperError('Appearance/Geometry mismatch.  The appearance requires vertex shader attribute input \'' + name +
                        '\', which was not computed as part of the Geometry.  Use the appearance\'s vertexFormat property when constructing the geometry.');
                }
            }
        }
    }

    function createPickIds(context, primitive, instances) {
        var pickColors = [];
        var length = instances.length;

        for (var i = 0; i < length; ++i) {
            var pickObject = {
                primitive : defaultValue(instances[i].pickPrimitive, primitive)
            };

            if (defined(instances[i].id)) {
                pickObject.id = instances[i].id;
            }

            var pickId = context.createPickId(pickObject);
            primitive._pickIds.push(pickId);
            pickColors.push(pickId.color);
        }

        return pickColors;
    }

    var taskProcessor = new TaskProcessor('taskDispatcher', Number.POSITIVE_INFINITY);

    /**
     * @private
     */
    Primitive.prototype.update = function(context, frameState, commandList) {
        if (!this.show ||
            ((!defined(this.geometryInstances)) && (this._va.length === 0)) ||
            (defined(this.geometryInstances) && Array.isArray(this.geometryInstances) && this.geometryInstances.length === 0) ||
            (!defined(this.appearance)) ||
            (frameState.mode !== SceneMode.SCENE3D && this.allow3DOnly) ||
            (!frameState.passes.render && !frameState.passes.pick)) {
            return;
        }

        var projection = frameState.scene2D.projection;
        var colorCommand;
        var pickCommand;
        var geometry;
        var attributes;
        var attribute;
        var length;
        var i;
        var j;
        var index;
        var promise;
        var instances;
        var clonedInstances;
        var geometries;
        var allowPicking = this.allowPicking;

        var that = this;

        if (this._state !== PrimitiveState.COMPLETE && this._state !== PrimitiveState.COMBINED) {

            if (this.asynchronous) {
                if (this._state === PrimitiveState.FAILED) {
                    throw this._error;
                } else if (this._state === PrimitiveState.READY) {
                    instances = (Array.isArray(this.geometryInstances)) ? this.geometryInstances : [this.geometryInstances];

                    length = instances.length;
                    var promises = [];

                    for (i = 0; i < length; ++i) {
                        geometry = instances[i].geometry;
                        this._instanceIds.push(instances[i].id);

                        if (defined(geometry.attributes) && defined(geometry.primitiveType)) {
                            this._createdGeometries.push({
                                geometry : cloneGeometry(geometry),
                                index : i
                            });
                        } else {
                            promises.push(taskProcessor.scheduleTask({
                                task : geometry._workerName,
                                geometry : geometry,
                                index : i
                            }));
                        }
                    }

                    this._state = PrimitiveState.CREATING;

                    when.all(promises, function(results) {
                        that._geometries = results;
                        that._state = PrimitiveState.CREATED;
                    }, function(error) {
                        that._error = error;
                        that._state = PrimitiveState.FAILED;
                    });
                } else if (this._state === PrimitiveState.CREATED) {
                    instances = (Array.isArray(this.geometryInstances)) ? this.geometryInstances : [this.geometryInstances];
                    clonedInstances = new Array(instances.length);

                    geometries = this._geometries.concat(this._createdGeometries);
                    length = geometries.length;
                    for (i = 0; i < length; ++i) {
                        geometry = geometries[i];
                        index = geometry.index;
                        clonedInstances[index] = cloneInstance(instances[index], geometry.geometry);
                    }

                    length = clonedInstances.length;
                    var transferableObjects = [];
                    PrimitivePipeline.transferInstances(clonedInstances, transferableObjects);

                    promise = taskProcessor.scheduleTask({
                        task : 'combineGeometry',
                        instances : clonedInstances,
                        pickIds : allowPicking ? createPickIds(context, this, instances) : undefined,
                        ellipsoid : projection.getEllipsoid(),
                        isGeographic : projection instanceof GeographicProjection,
                        elementIndexUintSupported : context.getElementIndexUint(),
                        allow3DOnly : this.allow3DOnly,
                        allowPicking : allowPicking,
                        vertexCacheOptimize : this.vertexCacheOptimize,
                        modelMatrix : this.modelMatrix
                    }, transferableObjects);

                    this._state = PrimitiveState.COMBINING;

                    when(promise, function(result) {
                        PrimitivePipeline.receiveGeometries(result.geometries);
                        PrimitivePipeline.receivePerInstanceAttributes(result.vaAttributes);

                        that._geometries = result.geometries;
                        that._attributeIndices = result.attributeIndices;
                        that._vaAttributes = result.vaAttributes;
                        that._perInstanceAttributeIndices = result.vaAttributeIndices;
                        Matrix4.clone(result.modelMatrix, that.modelMatrix);
                        that._state = PrimitiveState.COMBINED;
                    }, function(error) {
                        that._error = error;
                        that._state = PrimitiveState.FAILED;
                    });
                }
            } else {
                instances = (Array.isArray(this.geometryInstances)) ? this.geometryInstances : [this.geometryInstances];
                length = instances.length;
                geometries = this._createdGeometries;

                for (i = 0; i < length; ++i) {
                    geometry = instances[i].geometry;
                    this._instanceIds.push(instances[i].id);

                    if (defined(geometry.attributes) && defined(geometry.primitiveType)) {
                        geometries.push({
                            geometry : cloneGeometry(geometry),
                            index : i
                        });
                    } else {
                        geometries.push({
                            geometry : geometry.constructor.createGeometry(geometry),
                            index : i
                        });
                    }
                }

                clonedInstances = new Array(instances.length);
                length = geometries.length;
                for (i = 0; i < length; ++i) {
                    geometry = geometries[i];
                    index = geometry.index;
                    clonedInstances[index] = cloneInstance(instances[index], geometry.geometry);
                }

                var result = PrimitivePipeline.combineGeometry({
                    instances : clonedInstances,
                    pickIds : allowPicking ? createPickIds(context, this, instances) : undefined,
                    ellipsoid : projection.getEllipsoid(),
                    projection : projection,
                    elementIndexUintSupported : context.getElementIndexUint(),
                    allow3DOnly : this.allow3DOnly,
                    allowPicking : allowPicking,
                    vertexCacheOptimize : this.vertexCacheOptimize,
                    modelMatrix : this.modelMatrix
                });

                this._geometries = result.geometries;
                this._attributeIndices = result.attributeIndices;
                this._vaAttributes = result.vaAttributes;
                this._perInstanceAttributeIndices = result.vaAttributeIndices;
                Matrix4.clone(result.modelMatrix, this.modelMatrix);

                this._state = PrimitiveState.COMBINED;
            }
        }

        var attributeIndices = this._attributeIndices;

        if (this._state === PrimitiveState.COMBINED) {
            geometries = this._geometries;
            var vaAttributes = this._vaAttributes;

            this._boundingSphere = BoundingSphere.clone(geometries[0].boundingSphere);

            var va = [];
            length = geometries.length;
            for (i = 0; i < length; ++i) {
                geometry = geometries[i];

                attributes = vaAttributes[i];
                var vaLength = attributes.length;
                for (j = 0; j < vaLength; ++j) {
                    attribute = attributes[j];
                    attribute.vertexBuffer = context.createVertexBuffer(attribute.values, BufferUsage.DYNAMIC_DRAW);
                    delete attribute.values;
                }

                va.push(context.createVertexArrayFromGeometry({
                    geometry : geometry,
                    attributeIndices : attributeIndices,
                    bufferUsage : BufferUsage.STATIC_DRAW,
                    vertexLayout : VertexLayout.INTERLEAVED,
                    vertexArrayAttributes : attributes
                }));
            }

            this._va = va;
            this._primitiveType = geometries[0].primitiveType;

            if (this.releaseGeometryInstances) {
                this.geometryInstances = undefined;
            }

            this._geomtries = undefined;
            this._createdGeometries = undefined;
            this._state = PrimitiveState.COMPLETE;
        }

        if (this._state !== PrimitiveState.COMPLETE) {
            return;
        }

        // Create or recreate render state and shader program if appearance/material changed
        var appearance = this.appearance;
        var material = appearance.material;
        var createRS = false;
        var createSP = false;

        if (this._appearance !== appearance) {
            this._appearance = appearance;
            this._material = material;
            createRS = true;
            createSP = true;
        } else if (this._material !== material ) {
            this._material = material;
            createSP = true;
        }

        var translucent = this._appearance.isTranslucent();
        if (this._translucent !== translucent) {
            this._translucent = translucent;
            createRS = true;
        }

        if (defined(this._material)) {
            this._material.update(context);
        }

        var twoPasses = appearance.closed && translucent;

        if (createRS) {
            var renderState = appearance.getRenderState();

            if (twoPasses) {
                var rs = clone(renderState, false);
                rs.cull = {
                    enabled : true,
                    face : CullFace.BACK
                };
                this._frontFaceRS = context.createRenderState(rs);

                rs.cull.face = CullFace.FRONT;
                this._backFaceRS = context.createRenderState(rs);
            } else {
                this._frontFaceRS = context.createRenderState(renderState);
                this._backFaceRS = this._frontFaceRS;
            }

            if (allowPicking) {
                // Only need backface pass for picking when two-pass rendering is used.
                this._pickRS = this._backFaceRS;
            } else {
                // Still occlude if not pickable.
                var pickRS = clone(renderState, false);
                pickRS.colorMask = {
                    red : false,
                    green : false,
                    blue : false,
                    alpha : false
                };
                this._pickRS = context.createRenderState(pickRS);
            }
        }

        if (createSP) {
            var shaderCache = context.getShaderCache();
            var vs = createColumbusViewShader(this, appearance.vertexShaderSource);
            vs = appendShow(this, vs);
            var fs = appearance.getFragmentShaderSource();

            this._sp = shaderCache.replaceShaderProgram(this._sp, vs, fs, attributeIndices);
            validateShaderMatching(this._sp, attributeIndices);

            if (allowPicking) {
                var pickFS = createShaderSource({ sources : [fs], pickColorQualifier : 'varying' });
                this._pickSP = shaderCache.replaceShaderProgram(this._pickSP, createPickVertexShaderSource(vs), pickFS, attributeIndices);
            } else {
                this._pickSP = shaderCache.getShaderProgram(vs, fs, attributeIndices);
            }

            validateShaderMatching(this._pickSP, attributeIndices);
        }

        var colorCommands = this._colorCommands;
        var pickCommands = this._pickCommands;

        if (createRS || createSP) {
            var uniforms = (defined(material)) ? material._uniforms : undefined;
            var pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;

            colorCommands.length = this._va.length * (twoPasses ? 2 : 1);
            pickCommands.length = this._va.length;

            length = colorCommands.length;
            var vaIndex = 0;
            var m = 0;
            for (i = 0; i < length; ++i) {
                if (twoPasses) {
                    colorCommand = colorCommands[i];
                    if (!defined(colorCommand)) {
                        colorCommand = colorCommands[i] = new DrawCommand();
                    }
                    colorCommand.owner = this;
                    colorCommand.primitiveType = this._primitiveType;
                    colorCommand.vertexArray = this._va[vaIndex];
                    colorCommand.renderState = this._backFaceRS;
                    colorCommand.shaderProgram = this._sp;
                    colorCommand.uniformMap = uniforms;
                    colorCommand.pass = pass;

                    ++i;
                }

                colorCommand = colorCommands[i];
                if (!defined(colorCommand)) {
                    colorCommand = colorCommands[i] = new DrawCommand();
                }
                colorCommand.owner = this;
                colorCommand.primitiveType = this._primitiveType;
                colorCommand.vertexArray = this._va[vaIndex];
                colorCommand.renderState = this._frontFaceRS;
                colorCommand.shaderProgram = this._sp;
                colorCommand.uniformMap = uniforms;
                colorCommand.pass = pass;

                pickCommand = pickCommands[m];
                if (!defined(pickCommand)) {
                    pickCommand = pickCommands[m] = new DrawCommand();
                }
                pickCommand.owner = this;
                pickCommand.primitiveType = this._primitiveType;
                pickCommand.vertexArray = this._va[vaIndex];
                pickCommand.renderState = this._pickRS;
                pickCommand.shaderProgram = this._pickSP;
                pickCommand.uniformMap = uniforms;
                pickCommand.pass = pass;
                ++m;

                ++vaIndex;
            }
        }

        // Update per-instance attributes
        if (this._dirtyAttributes.length > 0) {
            attributes = this._dirtyAttributes;
            length = attributes.length;
            for (i = 0; i < length; ++i) {
                attribute = attributes[i];
                var value = attribute.value;
                var indices = attribute.indices;
                var indicesLength = indices.length;
                for (j = 0; j < indicesLength; ++j) {
                    index = indices[j];
                    var offset = index.offset;
                    var count = index.count;

                    var vaAttribute = index.attribute;
                    var componentDatatype = vaAttribute.componentDatatype;
                    var componentsPerAttribute = vaAttribute.componentsPerAttribute;

                    var typedArray = ComponentDatatype.createTypedArray(componentDatatype, count * componentsPerAttribute);
                    for (var k = 0; k < count; ++k) {
                        typedArray.set(value, k * componentsPerAttribute);
                    }

                    var offsetInBytes = offset * componentsPerAttribute * componentDatatype.sizeInBytes;
                    vaAttribute.vertexBuffer.copyFromArrayView(typedArray, offsetInBytes);
                }
                attribute.dirty = false;
            }

            attributes.length = 0;
        }

        if (!Matrix4.equals(this.modelMatrix, this._modelMatrix)) {
            Matrix4.clone(this.modelMatrix, this._modelMatrix);
            this._boundingSphereWC = BoundingSphere.transform(this._boundingSphere, this.modelMatrix, this._boundingSphereWC);
            if (!this.allow3DOnly && defined(this._boundingSphere)) {
                this._boundingSphereCV = BoundingSphere.projectTo2D(this._boundingSphereWC, projection, this._boundingSphereCV);
                this._boundingSphere2D = BoundingSphere.clone(this._boundingSphereCV, this._boundingSphere2D);
                this._boundingSphere2D.center.x = 0.0;
            }
        }

        var boundingSphere;
        if (frameState.mode === SceneMode.SCENE3D) {
            boundingSphere = this._boundingSphereWC;
        } else if (frameState.mode === SceneMode.COLUMBUS_VIEW) {
            boundingSphere = this._boundingSphereCV;
        } else if (frameState.mode === SceneMode.SCENE2D && defined(this._boundingSphere2D)) {
            boundingSphere = this._boundingSphere2D;
        } else if (defined(this._boundingSphereWC) && defined(this._boundingSphereCV)) {
            boundingSphere = BoundingSphere.union(this._boundingSphereWC, this._boundingSphereCV);
        }

        var passes = frameState.passes;
        if (passes.render) {
            length = colorCommands.length;
            for (i = 0; i < length; ++i) {
                colorCommands[i].modelMatrix = this.modelMatrix;
                colorCommands[i].boundingVolume = boundingSphere;
                colorCommands[i].debugShowBoundingVolume = this.debugShowBoundingVolume;

                commandList.push(colorCommands[i]);
            }
        }

        if (passes.pick) {
            length = pickCommands.length;
            for (i = 0; i < length; ++i) {
                pickCommands[i].modelMatrix = this.modelMatrix;
                pickCommands[i].boundingVolume = boundingSphere;

                commandList.push(pickCommands[i]);
            }
        }
    };

    function createGetFunction(name, perInstanceAttributes) {
        return function() {
            return perInstanceAttributes[name].value;
        };
    }

    function createSetFunction(name, perInstanceAttributes, dirtyList) {
        return function (value) {
            if (!defined(value) || !defined(value.length) || value.length < 1 || value.length > 4) {
                throw new DeveloperError('value must be and array with length between 1 and 4.');
            }

            var attribute = perInstanceAttributes[name];
            attribute.value = value;
            if (!attribute.dirty) {
                dirtyList.push(attribute);
                attribute.dirty = true;
            }
        };
    }

    /**
     * Returns the modifiable per-instance attributes for a {@link GeometryInstance}.
     *
     * @param {Object} id The id of the {@link GeometryInstance}.
     *
     * @returns {Object} The typed array in the attribute's format or undefined if the is no instance with id.
     *
     * @exception {DeveloperError} id is required.
     * @exception {DeveloperError} must call update before calling getGeometryInstanceAttributes.
     *
     * @example
     * var attributes = primitive.getGeometryInstanceAttributes('an id');
     * attributes.color = ColorGeometryInstanceAttribute.toValue(Color.AQUA);
     * attributes.show = ShowGeometryInstanceAttribute.toValue(true);
     */
    Primitive.prototype.getGeometryInstanceAttributes = function(id) {
        if (!defined(id)) {
            throw new DeveloperError('id is required');
        }

        if (!defined(this._perInstanceAttributeIndices)) {
            throw new DeveloperError('must call update before calling getGeometryInstanceAttributes');
        }

        var index = -1;
        var lastIndex = this._lastPerInstanceAttributeIndex;
        var ids = this._instanceIds;
        var length = ids.length;
        for (var i = 0; i < length; ++i) {
            var curIndex = (lastIndex + i) % length;
            if (id === ids[curIndex]) {
                index = curIndex;
                break;
            }
        }

        if (index === -1) {
            return undefined;
        }

        var perInstanceAttributes = this._perInstanceAttributeIndices[index];
        var attributes = {};
        var properties = {};
        var hasProperties = false;

        for (var name in perInstanceAttributes) {
            if (perInstanceAttributes.hasOwnProperty(name)) {
                hasProperties = true;
                properties[name] = {
                    get : createGetFunction(name, perInstanceAttributes),
                    set : createSetFunction(name, perInstanceAttributes, this._dirtyAttributes)
                };
            }
        }

        if (hasProperties) {
            defineProperties(attributes, properties);
        }

        this._lastPerInstanceAttributeIndex = index;

        return attributes;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <p>
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     * </p>
     *
     * @memberof Primitive
     *
     * @returns {Boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
     *
     * @see Primitive#destroy
     */
    Primitive.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the WebGL resources held by this object.  Destroying an object allows for deterministic
     * release of WebGL resources, instead of relying on the garbage collector to destroy this object.
     * <p>
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     * </p>
     *
     * @memberof Primitive
     *
     * @returns {undefined}
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see Primitive#isDestroyed
     *
     * @example
     * e = e && e.destroy();
     */
    Primitive.prototype.destroy = function() {
        var length;
        var i;

        this._sp = this._sp && this._sp.release();
        this._pickSP = this._pickSP && this._pickSP.release();

        var va = this._va;
        length = va.length;
        for (i = 0; i < length; ++i) {
            va[i].destroy();
        }
        this._va = undefined;

        var pickIds = this._pickIds;
        length = pickIds.length;
        for (i = 0; i < length; ++i) {
            pickIds[i].destroy();
        }
        this._pickIds = undefined;

        return destroyObject(this);
    };

    return Primitive;
});