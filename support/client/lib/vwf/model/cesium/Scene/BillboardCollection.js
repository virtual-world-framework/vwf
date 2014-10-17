/*global define*/
define([
        '../Core/BoundingSphere',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Color',
        '../Core/ComponentDatatype',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/EncodedCartesian3',
        '../Core/IndexDatatype',
        '../Core/Matrix4',
        '../Renderer/BufferUsage',
        '../Renderer/createShaderSource',
        '../Renderer/DrawCommand',
        '../Renderer/VertexArrayFacade',
        '../Shaders/BillboardCollectionFS',
        '../Shaders/BillboardCollectionVS',
        './Billboard',
        './BlendingState',
        './HorizontalOrigin',
        './Pass',
        './SceneMode'
    ], function(
        BoundingSphere,
        Cartesian2,
        Cartesian3,
        Color,
        ComponentDatatype,
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        EncodedCartesian3,
        IndexDatatype,
        Matrix4,
        BufferUsage,
        createShaderSource,
        DrawCommand,
        VertexArrayFacade,
        BillboardCollectionFS,
        BillboardCollectionVS,
        Billboard,
        BlendingState,
        HorizontalOrigin,
        Pass,
        SceneMode) {
    "use strict";

    var SHOW_INDEX = Billboard.SHOW_INDEX;
    var POSITION_INDEX = Billboard.POSITION_INDEX;
    var PIXEL_OFFSET_INDEX = Billboard.PIXEL_OFFSET_INDEX;
    var EYE_OFFSET_INDEX = Billboard.EYE_OFFSET_INDEX;
    var HORIZONTAL_ORIGIN_INDEX = Billboard.HORIZONTAL_ORIGIN_INDEX;
    var VERTICAL_ORIGIN_INDEX = Billboard.VERTICAL_ORIGIN_INDEX;
    var SCALE_INDEX = Billboard.SCALE_INDEX;
    var IMAGE_INDEX_INDEX = Billboard.IMAGE_INDEX_INDEX;
    var COLOR_INDEX = Billboard.COLOR_INDEX;
    var ROTATION_INDEX = Billboard.ROTATION_INDEX;
    var ALIGNED_AXIS_INDEX = Billboard.ALIGNED_AXIS_INDEX;
    var SCALE_BY_DISTANCE_INDEX = Billboard.SCALE_BY_DISTANCE_INDEX;
    var TRANSLUCENCY_BY_DISTANCE_INDEX = Billboard.TRANSLUCENCY_BY_DISTANCE_INDEX;
    var PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX = Billboard.PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX;
    var NUMBER_OF_PROPERTIES = Billboard.NUMBER_OF_PROPERTIES;

    // PERFORMANCE_IDEA:  Use vertex compression so we don't run out of
    // vec4 attributes (WebGL minimum: 8)
    var attributeLocations = {
        positionHigh : 0,
        positionLow : 1,
        pixelOffsetAndTranslate : 2,
        eyeOffsetAndScale : 3,
        textureCoordinatesAndImageSize : 4,
        originAndShow : 5,
        direction : 6,
        pickColor : 7,  // pickColor and color shared an index because pickColor is only used during
        color : 7,      // the 'pick' pass and 'color' is only used during the 'color' pass.
        rotationAndAlignedAxis : 8,
        scaleByDistance : 9,
        translucencyByDistance : 10,
        pixelOffsetScaleByDistance : 11
    };

    // Identifies to the VertexArrayFacade the attributes that are used only for the pick
    // pass or only for the color pass.
    var allPassPurpose = 'all';
    var colorPassPurpose = 'color';
    var pickPassPurpose = 'pick';

    /**
     * A renderable collection of billboards.  Billboards are viewport-aligned
     * images positioned in the 3D scene.
     * <br /><br />
     * <div align='center'>
     * <img src='images/Billboard.png' width='400' height='300' /><br />
     * Example billboards
     * </div>
     * <br /><br />
     * Billboards are added and removed from the collection using {@link BillboardCollection#add}
     * and {@link BillboardCollection#remove}.  All billboards in a collection reference images
     * from the same texture atlas, which is assigned using {@link BillboardCollection#textureAtlas}.
     *
     * @alias BillboardCollection
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] The 4x4 transformation matrix that transforms each billboard from model to world coordinates.
     * @param {Boolean} [options.debugShowBoundingVolume=false] For debugging only. Determines if this primitive's commands' bounding spheres are shown.
     *
     * @performance For best performance, prefer a few collections, each with many billboards, to
     * many collections with only a few billboards each.  Organize collections so that billboards
     * with the same update frequency are in the same collection, i.e., billboards that do not
     * change should be in one collection; billboards that change every frame should be in another
     * collection; and so on.
     *
     * @see BillboardCollection#add
     * @see BillboardCollection#remove
     * @see BillboardCollection#textureAtlas
     * @see Billboard
     * @see TextureAtlas
     * @see LabelCollection
     *
     * @example
     * // Create a billboard collection with two billboards
     * var billboards = new Cesium.BillboardCollection();
     * var atlas = new TextureAtlas({
     *   scene : scene,
     *   images : images
     * });
     * billboards.textureAtlas = atlas;
     * billboards.add({
     *   position : { x : 1.0, y : 2.0, z : 3.0 },
     *   imageIndex : 0
     * });
     * billboards.add({
     *   position : { x : 4.0, y : 5.0, z : 6.0 },
     *   imageIndex : 1
     * });
     *
     * @demo {@link http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Billboards.html|Cesium Sandcastle Billboard Demo}
     */
    var BillboardCollection = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        this._textureAtlas = undefined;
        this._textureAtlasGUID = undefined;
        this._destroyTextureAtlas = true;
        this._sp = undefined;
        this._rs = undefined;
        this._vaf = undefined;
        this._spPick = undefined;

        this._billboards = [];
        this._billboardsToUpdate = [];
        this._billboardsToUpdateIndex = 0;
        this._billboardsRemoved = false;
        this._createVertexArray = false;

        this._shaderRotation = false;
        this._compiledShaderRotation = false;
        this._compiledShaderRotationPick = false;

        this._shaderScaleByDistance = false;
        this._compiledShaderScaleByDistance = false;
        this._compiledShaderScaleByDistancePick = false;

        this._shaderTranslucencyByDistance = false;
        this._compiledShaderTranslucencyByDistance = false;
        this._compiledShaderTranslucencyByDistancePick = false;

        this._shaderPixelOffsetScaleByDistance = false;
        this._compiledShaderPixelOffsetScaleByDistance = false;
        this._compiledShaderPixelOffsetScaleByDistancePick = false;

        this._propertiesChanged = new Uint32Array(NUMBER_OF_PROPERTIES);

        this._maxSize = 0.0;
        this._maxEyeOffset = 0.0;
        this._maxScale = 1.0;
        this._maxPixelOffset = 0.0;
        this._allHorizontalCenter = true;

        this._baseVolume = new BoundingSphere();
        this._baseVolumeWC = new BoundingSphere();
        this._baseVolume2D = new BoundingSphere();
        this._boundingVolume = new BoundingSphere();
        this._boundingVolumeDirty = false;

        this._colorCommands = [];
        this._pickCommands = [];

        /**
         * The 4x4 transformation matrix that transforms each billboard in this collection from model to world coordinates.
         * When this is the identity matrix, the billboards are drawn in world coordinates, i.e., Earth's WGS84 coordinates.
         * Local reference frames can be used by providing a different transformation matrix, like that returned
         * by {@link Transforms.eastNorthUpToFixedFrame}.
         *
         * @type {Matrix4}
         * @default {@link Matrix4.IDENTITY}
         *
         * @see Transforms.eastNorthUpToFixedFrame
         *
         * @example
         * var center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
         * billboards.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
         * billboards.add({ imageIndex: 0, position : new Cesium.Cartesian3(0.0, 0.0, 0.0) }); // center
         * billboards.add({ imageIndex: 0, position : new Cesium.Cartesian3(1000000.0, 0.0, 0.0) }); // east
         * billboards.add({ imageIndex: 0, position : new Cesium.Cartesian3(0.0, 1000000.0, 0.0) }); // north
         * billboards.add({ imageIndex: 0, position : new Cesium.Cartesian3(0.0, 0.0, 1000000.0) }); // up
         * ]);
         */
        this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
        this._modelMatrix = Matrix4.clone(Matrix4.IDENTITY);

        /**
         * This property is for debugging only; it is not for production use nor is it optimized.
         * <p>
         * Draws the bounding sphere for each {@link DrawCommand} in the primitive.
         * </p>
         *
         * @type {Boolean}
         *
         * @default false
         */
        this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);

        this._mode = SceneMode.SCENE3D;

        // The buffer usage for each attribute is determined based on the usage of the attribute over time.
        this._buffersUsage = [
                              BufferUsage.STATIC_DRAW, // SHOW_INDEX
                              BufferUsage.STATIC_DRAW, // POSITION_INDEX
                              BufferUsage.STATIC_DRAW, // PIXEL_OFFSET_INDEX
                              BufferUsage.STATIC_DRAW, // EYE_OFFSET_INDEX
                              BufferUsage.STATIC_DRAW, // HORIZONTAL_ORIGIN_INDEX
                              BufferUsage.STATIC_DRAW, // VERTICAL_ORIGIN_INDEX
                              BufferUsage.STATIC_DRAW, // SCALE_INDEX
                              BufferUsage.STATIC_DRAW, // IMAGE_INDEX_INDEX
                              BufferUsage.STATIC_DRAW, // COLOR_INDEX
                              BufferUsage.STATIC_DRAW, // ROTATION_INDEX
                              BufferUsage.STATIC_DRAW, // ALIGNED_AXIS_INDEX
                              BufferUsage.STATIC_DRAW, // SCALE_BY_DISTANCE_INDEX
                              BufferUsage.STATIC_DRAW, // TRANSLUCENCY_BY_DISTANCE_INDEX
                              BufferUsage.STATIC_DRAW  // PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX
                          ];

        var that = this;
        this._uniforms = {
            u_atlas : function() {
                return that._textureAtlas.texture;
            }
        };
    };

    defineProperties(BillboardCollection.prototype, {
        /**
         * Returns the number of billboards in this collection.  This is commonly used with
         * {@link BillboardCollection#get} to iterate over all the billboards
         * in the collection.
         * @memberof BillboardCollection.prototype
         * @type {Number}
         */
        length : {
            get : function() {
                removeBillboards(this);
                return this._billboards.length;
            }
        },

        /**
         * Gets and sets the textureAtlas.
         * @memberof BillboardCollection.prototype
         * @type {TextureAtlas}
         *
         * @example
         * // Set the texture atlas
         * // Assigns a texture atlas with two images to a billboard collection.
         * // Two billboards, each referring to one of the images, are then
         * // added to the collection.
         * var billboards = new Cesium.BillboardCollection();
         * var images = [image0, image1];
         * var atlas = new TextureAtlas({
         *   scene : scene,
         *   images : images
         * });
         * billboards.textureAtlas = atlas;
         * billboards.add({
         *   // ...
         *   imageIndex : 0
         * });
         * billboards.add({
         *   // ...
         *   imageIndex : 1
         * });
         */
        textureAtlas : {
            get : function() {
                return this._textureAtlas;
            },
            set : function(value) {
                if (this._textureAtlas !== value) {
                    this._textureAtlas = this._destroyTextureAtlas && this._textureAtlas && this._textureAtlas.destroy();
                    this._textureAtlas = value;
                    this._createVertexArray = true; // New per-billboard texture coordinates
                }
            }
        },

        /**
         * Gets and sets the destroyTextureAtlas, which determines if the texture atlas is
         * destroyed when the collection is destroyed.
         *
         * If the texture atlas is used by more than one collection, set this to <code>false</code>,
         * and explicitly destroy the atlas to avoid attempting to destroy it multiple times.
         *
         * @memberof BillboardCollection.prototype
         * @type {Boolean}
         *
         * @example
         * // Set destroyTextureAtlas
         * // Destroy a billboard collection but not its texture atlas.
         *
         * var atlas = new TextureAtlas({
         *   scene : scene,
         *   images : images
         * });
         * billboards.textureAtlas = atlas;
         * billboards.destroyTextureAtlas = false;
         * billboards = billboards.destroy();
         * console.log(atlas.isDestroyed()); // False
         */
        destroyTextureAtlas : {
            get : function() {
                return this._destroyTextureAtlas;
            },
            set : function(value) {
                this._destroyTextureAtlas = value;
            }
        }
    });

    /**
     * Creates and adds a billboard with the specified initial properties to the collection.
     * The added billboard is returned so it can be modified or removed from the collection later.
     *
     * @param {Object}[billboard] A template describing the billboard's properties as shown in Example 1.
     * @returns {Billboard} The billboard that was added to the collection.
     *
     * @performance Calling <code>add</code> is expected constant time.  However, the collection's vertex buffer
     * is rewritten - an <code>O(n)</code> operation that also incurs CPU to GPU overhead.  For
     * best performance, add as many billboards as possible before calling <code>update</code>.
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see BillboardCollection#remove
     * @see BillboardCollection#removeAll
     *
     * @example
     * // Example 1:  Add a billboard, specifying all the default values.
     * var b = billboards.add({
     *   show : true,
     *   position : Cesium.Cartesian3.ZERO,
     *   pixelOffset : Cesium.Cartesian2.ZERO,
     *   eyeOffset : Cesium.Cartesian3.ZERO,
     *   horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
     *   verticalOrigin : Cesium.VerticalOrigin.CENTER,
     *   scale : 1.0,
     *   imageIndex : 0,
     *   color : Cesium.Color.WHITE,
     *   id : undefined
     * });
     *
     * @example
     * // Example 2:  Specify only the billboard's cartographic position.
     * var b = billboards.add({
     *   position : ellipsoid.cartographicToCartesian(new Cesium.Cartographic(longitude, latitude, height))
     * });
     */
    BillboardCollection.prototype.add = function(billboard) {
        var b = new Billboard(billboard, this);
        b._index = this._billboards.length;

        this._billboards.push(b);
        this._createVertexArray = true;

        return b;
    };

    /**
     * Removes a billboard from the collection.
     *
     * @param {Billboard} billboard The billboard to remove.
     * @returns {Boolean} <code>true</code> if the billboard was removed; <code>false</code> if the billboard was not found in the collection.
     *
     * @performance Calling <code>remove</code> is expected constant time.  However, the collection's vertex buffer
     * is rewritten - an <code>O(n)</code> operation that also incurs CPU to GPU overhead.  For
     * best performance, remove as many billboards as possible before calling <code>update</code>.
     * If you intend to temporarily hide a billboard, it is usually more efficient to call
     * {@link Billboard#show} instead of removing and re-adding the billboard.
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see BillboardCollection#add
     * @see BillboardCollection#removeAll
     * @see Billboard#show
     *
     * @example
     * var b = billboards.add(...);
     * billboards.remove(b);  // Returns true
     */
    BillboardCollection.prototype.remove = function(billboard) {
        if (this.contains(billboard)) {
            this._billboards[billboard._index] = null; // Removed later
            this._billboardsRemoved = true;
            this._createVertexArray = true;
            billboard._destroy();
            return true;
        }

        return false;
    };

    /**
     * Removes all billboards from the collection.
     *
     * @performance <code>O(n)</code>.  It is more efficient to remove all the billboards
     * from a collection and then add new ones than to create a new collection entirely.
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see BillboardCollection#add
     * @see BillboardCollection#remove
     *
     * @example
     * billboards.add(...);
     * billboards.add(...);
     * billboards.removeAll();
     */
    BillboardCollection.prototype.removeAll = function() {
        this._destroyBillboards();
        this._billboards = [];
        this._billboardsToUpdate = [];
        this._billboardsToUpdateIndex = 0;
        this._billboardsRemoved = false;

        this._createVertexArray = true;
    };

    function removeBillboards(billboardCollection) {
        if (billboardCollection._billboardsRemoved) {
            billboardCollection._billboardsRemoved = false;

            var newBillboards = [];
            var billboards = billboardCollection._billboards;
            var length = billboards.length;
            for (var i = 0, j = 0; i < length; ++i) {
                var billboard = billboards[i];
                if (billboard) {
                    billboard._index = j++;
                    newBillboards.push(billboard);
                }
            }

            billboardCollection._billboards = newBillboards;
        }
    }

    BillboardCollection.prototype._updateBillboard = function(billboard, propertyChanged) {
        if (!billboard._dirty) {
            this._billboardsToUpdate[this._billboardsToUpdateIndex++] = billboard;
        }

        ++this._propertiesChanged[propertyChanged];
    };

    /**
     * Check whether this collection contains a given billboard.
     *
     * @param {Billboard} [billboard] The billboard to check for.
     * @returns {Boolean} true if this collection contains the billboard, false otherwise.
     *
     * @see BillboardCollection#get
     */
    BillboardCollection.prototype.contains = function(billboard) {
        return defined(billboard) && billboard._billboardCollection === this;
    };

    /**
     * Returns the billboard in the collection at the specified index.  Indices are zero-based
     * and increase as billboards are added.  Removing a billboard shifts all billboards after
     * it to the left, changing their indices.  This function is commonly used with
     * {@link BillboardCollection#length} to iterate over all the billboards
     * in the collection.
     *
     * @param {Number} index The zero-based index of the billboard.
     * @returns {Billboard} The billboard at the specified index.
     *
     * @performance Expected constant time.  If billboards were removed from the collection and
     * {@link BillboardCollection#update} was not called, an implicit <code>O(n)</code>
     * operation is performed.
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see BillboardCollection#length
     *
     * @example
     * // Toggle the show property of every billboard in the collection
     * var len = billboards.length;
     * for (var i = 0; i < len; ++i) {
     *   var b = billboards.get(i);
     *   b.show = !b.show;
     * }
     */
    BillboardCollection.prototype.get = function(index) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(index)) {
            throw new DeveloperError('index is required.');
        }
        //>>includeEnd('debug');

        removeBillboards(this);
        return this._billboards[index];
    };


    function getDirectionsVertexBuffer(context) {
        var sixteenK = 16 * 1024;

        var directionsVertexBuffer = context.cache.billboardCollection_directionsVertexBuffer;
        if (defined(directionsVertexBuffer)) {
            return directionsVertexBuffer;
        }

        var directions = new Uint8Array(sixteenK * 4 * 2);
        for (var i = 0, j = 0; i < sixteenK; ++i) {
            directions[j++] = 0;
            directions[j++] = 0;

            directions[j++] = 255;
            directions[j++] = 0.0;

            directions[j++] = 255;
            directions[j++] = 255;

            directions[j++] = 0.0;
            directions[j++] = 255;
        }

        // PERFORMANCE_IDEA:  Should we reference count billboard collections, and eventually delete this?
        // Is this too much memory to allocate up front?  Should we dynamically grow it?
        directionsVertexBuffer = context.createVertexBuffer(directions, BufferUsage.STATIC_DRAW);
        directionsVertexBuffer.vertexArrayDestroyable = false;
        context.cache.billboardCollection_directionsVertexBuffer = directionsVertexBuffer;
        return directionsVertexBuffer;
    }

    function getIndexBuffer(context) {
        var sixteenK = 16 * 1024;

        var indexBuffer = context.cache.billboardCollection_indexBuffer;
        if (defined(indexBuffer)) {
            return indexBuffer;
        }

        var length = sixteenK * 6;
        var indices = new Uint16Array(length);
        for (var i = 0, j = 0; i < length; i += 6, j += 4) {
            indices[i] = j;
            indices[i + 1] = j + 1;
            indices[i + 2] = j + 2;

            indices[i + 3] = j + 0;
            indices[i + 4] = j + 2;
            indices[i + 5] = j + 3;
        }

        // PERFORMANCE_IDEA:  Should we reference count billboard collections, and eventually delete this?
        // Is this too much memory to allocate up front?  Should we dynamically grow it?
        indexBuffer = context.createIndexBuffer(indices, BufferUsage.STATIC_DRAW, IndexDatatype.UNSIGNED_SHORT);
        indexBuffer.vertexArrayDestroyable = false;
        context.cache.billboardCollection_indexBuffer = indexBuffer;
        return indexBuffer;
    }

    BillboardCollection.prototype.computeNewBuffersUsage = function() {
        var buffersUsage = this._buffersUsage;
        var usageChanged = false;

        var properties = this._propertiesChanged;
        for ( var k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
            var newUsage = (properties[k] === 0) ? BufferUsage.STATIC_DRAW : BufferUsage.STREAM_DRAW;
            usageChanged = usageChanged || (buffersUsage[k] !== newUsage);
            buffersUsage[k] = newUsage;
        }

        return usageChanged;
    };

    function createVAF(context, numberOfBillboards, buffersUsage) {
        // Different billboard collections share the same vertex buffer for directions.
        var directionVertexBuffer = getDirectionsVertexBuffer(context);

        return new VertexArrayFacade(context, [{
            index : attributeLocations.positionHigh,
            componentsPerAttribute : 3,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[POSITION_INDEX]
        }, {
            index : attributeLocations.positionLow,
            componentsPerAttribute : 3,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[POSITION_INDEX]
        }, {
            index : attributeLocations.pixelOffsetAndTranslate,
            componentsPerAttribute : 4,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[PIXEL_OFFSET_INDEX]
        }, {
            index : attributeLocations.eyeOffsetAndScale,
            componentsPerAttribute : 4,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[SCALE_INDEX] // buffersUsage[EYE_OFFSET_INDEX] ignored
        }, {
            index : attributeLocations.textureCoordinatesAndImageSize,
            componentsPerAttribute : 4,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[IMAGE_INDEX_INDEX]
        }, {
            index : attributeLocations.pickColor,
            componentsPerAttribute : 4,
            normalize : true,
            componentDatatype : ComponentDatatype.UNSIGNED_BYTE,
            usage : BufferUsage.STATIC_DRAW,
            purpose : pickPassPurpose
        }, {
            index : attributeLocations.color,
            componentsPerAttribute : 4,
            normalize : true,
            componentDatatype : ComponentDatatype.UNSIGNED_BYTE,
            usage : buffersUsage[COLOR_INDEX],
            purpose : colorPassPurpose
        }, {
            index : attributeLocations.originAndShow,
            componentsPerAttribute : 3,
            componentDatatype : ComponentDatatype.BYTE,
            usage : buffersUsage[SHOW_INDEX] // buffersUsage[HORIZONTAL_ORIGIN_INDEX] and buffersUsage[VERTICAL_ORIGIN_INDEX] ignored
        }, {
            index : attributeLocations.direction,
            vertexBuffer : directionVertexBuffer,
            componentsPerAttribute : 2,
            normalize : true,
            componentDatatype : ComponentDatatype.UNSIGNED_BYTE
        }, {
            index : attributeLocations.rotationAndAlignedAxis,
            componentsPerAttribute : 4,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[ROTATION_INDEX] // buffersUsage[ALIGNED_AXIS_INDEX] ignored
        }, {
            index : attributeLocations.scaleByDistance,
            componentsPerAttribute : 4,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[SCALE_BY_DISTANCE_INDEX]
        }, {
            index : attributeLocations.translucencyByDistance,
            componentsPerAttribute : 4,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[TRANSLUCENCY_BY_DISTANCE_INDEX]
        }, {
            index : attributeLocations.pixelOffsetScaleByDistance,
            componentsPerAttribute : 4,
            componentDatatype : ComponentDatatype.FLOAT,
            usage : buffersUsage[PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX]
        }], 4 * numberOfBillboards); // 4 vertices per billboard
    }

    ///////////////////////////////////////////////////////////////////////////

    // Four vertices per billboard.  Each has the same position, etc., but a different screen-space direction vector.

    // PERFORMANCE_IDEA:  Save memory if a property is the same for all billboards, use a latched attribute state,
    // instead of storing it in a vertex buffer.

    var writePositionScratch = new EncodedCartesian3();

    function writePosition(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var position = billboard._getActualPosition();

        if (billboardCollection._mode === SceneMode.SCENE3D) {
            BoundingSphere.expand(billboardCollection._baseVolume, position, billboardCollection._baseVolume);
            billboardCollection._boundingVolumeDirty = true;
        }

        EncodedCartesian3.fromCartesian(position, writePositionScratch);

        var allPurposeWriters = vafWriters[allPassPurpose];
        var positionHighWriter = allPurposeWriters[attributeLocations.positionHigh];
        var high = writePositionScratch.high;
        positionHighWriter(i + 0, high.x, high.y, high.z);
        positionHighWriter(i + 1, high.x, high.y, high.z);
        positionHighWriter(i + 2, high.x, high.y, high.z);
        positionHighWriter(i + 3, high.x, high.y, high.z);

        var positionLowWriter = allPurposeWriters[attributeLocations.positionLow];
        var low = writePositionScratch.low;
        positionLowWriter(i + 0, low.x, low.y, low.z);
        positionLowWriter(i + 1, low.x, low.y, low.z);
        positionLowWriter(i + 2, low.x, low.y, low.z);
        positionLowWriter(i + 3, low.x, low.y, low.z);
    }

    function writePixelOffsetAndTranslate(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var pixelOffset = billboard.pixelOffset;
        var translate = billboard._translate;
        billboardCollection._maxPixelOffset = Math.max(billboardCollection._maxPixelOffset, Math.abs(pixelOffset.x + translate.x), Math.abs(-pixelOffset.y + translate.y));
        var allPurposeWriters = vafWriters[allPassPurpose];

        var writer = allPurposeWriters[attributeLocations.pixelOffsetAndTranslate];
        writer(i + 0, pixelOffset.x, -pixelOffset.y, translate.x, translate.y);
        writer(i + 1, pixelOffset.x, -pixelOffset.y, translate.x, translate.y);
        writer(i + 2, pixelOffset.x, -pixelOffset.y, translate.x, translate.y);
        writer(i + 3, pixelOffset.x, -pixelOffset.y, translate.x, translate.y);
    }

    function writeEyeOffsetAndScale(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var eyeOffset = billboard.eyeOffset;
        var scale = billboard.scale;
        billboardCollection._maxEyeOffset = Math.max(billboardCollection._maxEyeOffset, Math.abs(eyeOffset.x), Math.abs(eyeOffset.y), Math.abs(eyeOffset.z));
        billboardCollection._maxScale = Math.max(billboardCollection._maxScale, scale);

        var allPurposeWriters = vafWriters[allPassPurpose];
        var writer = allPurposeWriters[attributeLocations.eyeOffsetAndScale];
        writer(i + 0, eyeOffset.x, eyeOffset.y, eyeOffset.z, scale);
        writer(i + 1, eyeOffset.x, eyeOffset.y, eyeOffset.z, scale);
        writer(i + 2, eyeOffset.x, eyeOffset.y, eyeOffset.z, scale);
        writer(i + 3, eyeOffset.x, eyeOffset.y, eyeOffset.z, scale);
    }

    function writePickColor(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;

        var pickWriters = vafWriters[pickPassPurpose];
        var writer = pickWriters[attributeLocations.pickColor];

        var pickColor = billboard.getPickId(context).color;
        var red = Color.floatToByte(pickColor.red);
        var green = Color.floatToByte(pickColor.green);
        var blue = Color.floatToByte(pickColor.blue);
        var alpha = Color.floatToByte(pickColor.alpha);

        writer(i + 0, red, green, blue, alpha);
        writer(i + 1, red, green, blue, alpha);
        writer(i + 2, red, green, blue, alpha);
        writer(i + 3, red, green, blue, alpha);
    }

    function writeColor(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;

        var colorWriters = vafWriters[colorPassPurpose];
        var writer = colorWriters[attributeLocations.color];

        var color = billboard.color;
        var red = Color.floatToByte(color.red);
        var green = Color.floatToByte(color.green);
        var blue = Color.floatToByte(color.blue);
        var alpha = Color.floatToByte(color.alpha);

        writer(i + 0, red, green, blue, alpha);
        writer(i + 1, red, green, blue, alpha);
        writer(i + 2, red, green, blue, alpha);
        writer(i + 3, red, green, blue, alpha);
    }

    function writeOriginAndShow(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var horizontalOrigin = billboard.horizontalOrigin;
        var verticalOrigin = billboard.verticalOrigin;
        var show = billboard.show;

        // If the color alpha is zero, do not show this billboard.  This lets us avoid providing
        // color during the pick pass and also eliminates a discard in the fragment shader.
        if (billboard.color.alpha === 0.0) {
            show = false;
        }

        billboardCollection._allHorizontalCenter = billboardCollection._allHorizontalCenter && horizontalOrigin === HorizontalOrigin.CENTER;

        var allPurposeWriters = vafWriters[allPassPurpose];
        var writer = allPurposeWriters[attributeLocations.originAndShow];
        writer(i + 0, horizontalOrigin, verticalOrigin, show);
        writer(i + 1, horizontalOrigin, verticalOrigin, show);
        writer(i + 2, horizontalOrigin, verticalOrigin, show);
        writer(i + 3, horizontalOrigin, verticalOrigin, show);
    }

    function writeTextureCoordinatesAndImageSize(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var bottomLeftX = 0;
        var bottomLeftY = 0;
        var width = 0;
        var height = 0;
        var index = billboard.imageIndex;
        if (index !== -1) {
            var imageRectangle = textureAtlasCoordinates[index];

            //>>includeStart('debug', pragmas.debug);
            if (!defined(imageRectangle)) {
                throw new DeveloperError('Invalid billboard image index: ' + index);
            }
            //>>includeEnd('debug');

            bottomLeftX = imageRectangle.x;
            bottomLeftY = imageRectangle.y;
            width = imageRectangle.width;
            height = imageRectangle.height;
        }
        var topRightX = bottomLeftX + width;
        var topRightY = bottomLeftY + height;

        var dimensions = billboardCollection._textureAtlas.texture.dimensions;
        var imageWidth = defaultValue(billboard.width, dimensions.x * width) * 0.5;
        var imageHeight = defaultValue(billboard.height, dimensions.y * height) * 0.5;

        billboardCollection._maxSize = Math.max(billboardCollection._maxSize, imageWidth, imageHeight);

        var allPurposeWriters = vafWriters[allPassPurpose];
        var writer = allPurposeWriters[attributeLocations.textureCoordinatesAndImageSize];
        writer(i + 0, bottomLeftX, bottomLeftY, imageWidth, imageHeight); // Lower Left
        writer(i + 1, topRightX, bottomLeftY, imageWidth, imageHeight); // Lower Right
        writer(i + 2, topRightX, topRightY, imageWidth, imageHeight); // Upper Right
        writer(i + 3, bottomLeftX, topRightY, imageWidth, imageHeight); // Upper Left
    }

    function writeRotationAndAlignedAxis(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var rotation = billboard.rotation;
        var alignedAxis = billboard.alignedAxis;

        if (rotation !== 0.0 || !Cartesian3.equals(alignedAxis, Cartesian3.ZERO)) {
            billboardCollection._shaderRotation = true;
        }

        var x = alignedAxis.x;
        var y = alignedAxis.y;
        var z = alignedAxis.z;

        var allPurposeWriters = vafWriters[allPassPurpose];
        var writer = allPurposeWriters[attributeLocations.rotationAndAlignedAxis];
        writer(i + 0, rotation, x, y, z);
        writer(i + 1, rotation, x, y, z);
        writer(i + 2, rotation, x, y, z);
        writer(i + 3, rotation, x, y, z);
    }

    function writeScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var allPurposeWriters = vafWriters[allPassPurpose];
        var writer = allPurposeWriters[attributeLocations.scaleByDistance];
        var near = 0.0;
        var nearValue = 1.0;
        var far = 1.0;
        var farValue = 1.0;

        var scale = billboard.scaleByDistance;
        if (defined(scale)) {
            near = scale.near;
            nearValue = scale.nearValue;
            far = scale.far;
            farValue = scale.farValue;

            if (nearValue !== 1.0 || farValue !== 1.0) {
                // scale by distance calculation in shader need not be enabled
                // until a billboard with near and far !== 1.0 is found
                billboardCollection._shaderScaleByDistance = true;
            }
        }

        writer(i + 0, near, nearValue, far, farValue);
        writer(i + 1, near, nearValue, far, farValue);
        writer(i + 2, near, nearValue, far, farValue);
        writer(i + 3, near, nearValue, far, farValue);
    }

    function writeTranslucencyByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var allPurposeWriters = vafWriters[allPassPurpose];
        var writer = allPurposeWriters[attributeLocations.translucencyByDistance];
        var near = 0.0;
        var nearValue = 1.0;
        var far = 1.0;
        var farValue = 1.0;

        var translucency = billboard.translucencyByDistance;
        if (defined(translucency)) {
            near = translucency.near;
            nearValue = translucency.nearValue;
            far = translucency.far;
            farValue = translucency.farValue;

            if (nearValue !== 1.0 || farValue !== 1.0) {
                // translucency by distance calculation in shader need not be enabled
                // until a billboard with near and far !== 1.0 is found
                billboardCollection._shaderTranslucencyByDistance = true;
            }
        }

        writer(i + 0, near, nearValue, far, farValue);
        writer(i + 1, near, nearValue, far, farValue);
        writer(i + 2, near, nearValue, far, farValue);
        writer(i + 3, near, nearValue, far, farValue);
    }

    function writePixelOffsetScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        var i = billboard._index * 4;
        var allPurposeWriters = vafWriters[allPassPurpose];
        var writer = allPurposeWriters[attributeLocations.pixelOffsetScaleByDistance];
        var near = 0.0;
        var nearValue = 1.0;
        var far = 1.0;
        var farValue = 1.0;

        var pixelOffsetScale = billboard.pixelOffsetScaleByDistance;
        if (defined(pixelOffsetScale)) {
            near = pixelOffsetScale.near;
            nearValue = pixelOffsetScale.nearValue;
            far = pixelOffsetScale.far;
            farValue = pixelOffsetScale.farValue;

            if (nearValue !== 1.0 || farValue !== 1.0) {
                // pixelOffsetScale by distance calculation in shader need not be enabled
                // until a billboard with near and far !== 1.0 is found
                billboardCollection._shaderPixelOffsetScaleByDistance = true;
            }
        }

        writer(i + 0, near, nearValue, far, farValue);
        writer(i + 1, near, nearValue, far, farValue);
        writer(i + 2, near, nearValue, far, farValue);
        writer(i + 3, near, nearValue, far, farValue);
    }

    function writeBillboard(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard) {
        writePosition(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writePixelOffsetAndTranslate(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writeEyeOffsetAndScale(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writePickColor(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writeColor(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writeOriginAndShow(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writeTextureCoordinatesAndImageSize(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writeRotationAndAlignedAxis(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writeScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writeTranslucencyByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
        writePixelOffsetScaleByDistance(billboardCollection, context, textureAtlasCoordinates, vafWriters, billboard);
    }

    function recomputeActualPositions(billboardCollection, billboards, length, frameState, modelMatrix, recomputeBoundingVolume) {
        var boundingVolume;
        if (frameState.mode === SceneMode.SCENE3D) {
            boundingVolume = billboardCollection._baseVolume;
            billboardCollection._boundingVolumeDirty = true;
        } else {
            boundingVolume = billboardCollection._baseVolume2D;
        }

        var positions = [];
        for ( var i = 0; i < length; ++i) {
            var billboard = billboards[i];
            var position = billboard.position;
            var actualPosition = Billboard._computeActualPosition(position, frameState, modelMatrix);
            if (defined(actualPosition)) {
                billboard._setActualPosition(actualPosition);

                if (recomputeBoundingVolume) {
                    positions.push(actualPosition);
                } else {
                    BoundingSphere.expand(boundingVolume, actualPosition, boundingVolume);
                }
            }
        }

        if (recomputeBoundingVolume) {
            BoundingSphere.fromPoints(positions, boundingVolume);
        }
    }

    function updateMode(billboardCollection, frameState) {
        var mode = frameState.mode;

        var billboards = billboardCollection._billboards;
        var billboardsToUpdate = billboardCollection._billboardsToUpdate;
        var modelMatrix = billboardCollection._modelMatrix;

        if (billboardCollection._createVertexArray ||
            billboardCollection._mode !== mode ||
            mode !== SceneMode.SCENE3D &&
            !Matrix4.equals(modelMatrix, billboardCollection.modelMatrix)) {

            billboardCollection._mode = mode;
            Matrix4.clone(billboardCollection.modelMatrix, modelMatrix);
            billboardCollection._createVertexArray = true;

            if (mode === SceneMode.SCENE3D || mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
                recomputeActualPositions(billboardCollection, billboards, billboards.length, frameState, modelMatrix, true);
            }
        } else if (mode === SceneMode.MORPHING) {
            recomputeActualPositions(billboardCollection, billboards, billboards.length, frameState, modelMatrix, true);
        } else if (mode === SceneMode.SCENE2D || mode === SceneMode.COLUMBUS_VIEW) {
            recomputeActualPositions(billboardCollection, billboardsToUpdate, billboardCollection._billboardsToUpdateIndex, frameState, modelMatrix, false);
        }
    }

    var scratchDrawingBufferDimensions = new Cartesian2();
    var scratchToCenter = new Cartesian3();
    var scratchProj = new Cartesian3();
    function updateBoundingVolume(collection, context, frameState, boundingVolume) {
        var camera = frameState.camera;
        var frustum = camera.frustum;

        var toCenter = Cartesian3.subtract(camera.positionWC, boundingVolume.center, scratchToCenter);
        var proj = Cartesian3.multiplyByScalar(camera.directionWC, Cartesian3.dot(toCenter, camera.directionWC), scratchProj);
        var distance = Math.max(0.0, Cartesian3.magnitude(proj) - boundingVolume.radius);

        scratchDrawingBufferDimensions.x = context.drawingBufferWidth;
        scratchDrawingBufferDimensions.y = context.drawingBufferHeight;
        var pixelSize = frustum.getPixelSize(scratchDrawingBufferDimensions, distance);
        var pixelScale = Math.max(pixelSize.x, pixelSize.y);

        var size = pixelScale * collection._maxScale * collection._maxSize * 2.0;
        if (collection._allHorizontalCenter) {
            size *= 0.5;
        }

        var offset = pixelScale * collection._maxPixelOffset + collection._maxEyeOffset;
        boundingVolume.radius += size + offset;
    }

    /**
     * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
     * get the draw commands needed to render this primitive.
     * <p>
     * Do not call this function directly.  This is documented just to
     * list the exceptions that may be propagated when the scene is rendered:
     * </p>
     *
     * @exception {DeveloperError} Invalid billboard image index.
     */
    BillboardCollection.prototype.update = function(context, frameState, commandList) {
        var textureAtlas = this._textureAtlas;
        if (!defined(textureAtlas)) {
            // Can't write billboard vertices until we have texture coordinates
            // provided by a texture atlas
            return;
        }

        var textureAtlasCoordinates = textureAtlas.textureCoordinates;
        if (textureAtlasCoordinates.length === 0) {
            // Can't write billboard vertices until we have texture coordinates
            // provided by a texture atlas
            return;
        }

        removeBillboards(this);
        updateMode(this, frameState);

        var billboards = this._billboards;
        var billboardsLength = billboards.length;
        var billboardsToUpdate = this._billboardsToUpdate;
        var billboardsToUpdateLength = this._billboardsToUpdateIndex;

        var properties = this._propertiesChanged;

        var textureAtlasGUID = textureAtlas.guid;
        var createVertexArray = this._createVertexArray || this._textureAtlasGUID !== textureAtlasGUID;
        this._textureAtlasGUID = textureAtlasGUID;

        var vafWriters;
        var pass = frameState.passes;
        var picking = pass.pick;

        // PERFORMANCE_IDEA: Round robin multiple buffers.
        if (createVertexArray || (!picking && this.computeNewBuffersUsage())) {
            this._createVertexArray = false;

            for (var k = 0; k < NUMBER_OF_PROPERTIES; ++k) {
                properties[k] = 0;
            }

            this._vaf = this._vaf && this._vaf.destroy();

            if (billboardsLength > 0) {
                // PERFORMANCE_IDEA:  Instead of creating a new one, resize like std::vector.
                this._vaf = createVAF(context, billboardsLength, this._buffersUsage);
                vafWriters = this._vaf.writers;

                // Rewrite entire buffer if billboards were added or removed.
                for (var i = 0; i < billboardsLength; ++i) {
                    var billboard = this._billboards[i];
                    billboard._dirty = false; // In case it needed an update.
                    writeBillboard(this, context, textureAtlasCoordinates, vafWriters, billboard);
                }

                // Different billboard collections share the same index buffer.
                this._vaf.commit(getIndexBuffer(context));
            }

            this._billboardsToUpdateIndex = 0;
        } else {
            // Billboards were modified, but none were added or removed.
            if (billboardsToUpdateLength > 0) {
                var writers = [];

                if (properties[POSITION_INDEX]) {
                    writers.push(writePosition);
                }

                if (properties[PIXEL_OFFSET_INDEX]) {
                    writers.push(writePixelOffsetAndTranslate);
                }

                if (properties[EYE_OFFSET_INDEX] || properties[SCALE_INDEX]) {
                    writers.push(writeEyeOffsetAndScale);
                }

                if (properties[IMAGE_INDEX_INDEX]) {
                    writers.push(writeTextureCoordinatesAndImageSize);
                }

                if (properties[COLOR_INDEX]) {
                    writers.push(writeColor);
                }

                if (properties[HORIZONTAL_ORIGIN_INDEX] || properties[VERTICAL_ORIGIN_INDEX] || properties[SHOW_INDEX]) {
                    writers.push(writeOriginAndShow);
                }

                if (properties[ROTATION_INDEX] || properties[ALIGNED_AXIS_INDEX]) {
                    writers.push(writeRotationAndAlignedAxis);
                }

                if (properties[SCALE_BY_DISTANCE_INDEX]) {
                    writers.push(writeScaleByDistance);
                }

                if (properties[TRANSLUCENCY_BY_DISTANCE_INDEX]) {
                    writers.push(writeTranslucencyByDistance);
                }

                if (properties[PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX]) {
                    writers.push(writePixelOffsetScaleByDistance);
                }

                vafWriters = this._vaf.writers;

                if ((billboardsToUpdateLength / billboardsLength) > 0.1) {
                    // If more than 10% of billboard change, rewrite the entire buffer.

                    // PERFORMANCE_IDEA:  I totally made up 10% :).

                    for (var m = 0; m < billboardsToUpdateLength; ++m) {
                        var b = billboardsToUpdate[m];
                        b._dirty = false;

                        for ( var n = 0; n < writers.length; ++n) {
                            writers[n](this, context, textureAtlasCoordinates, vafWriters, b);
                        }
                    }
                    this._vaf.commit(getIndexBuffer(context));
                } else {
                    for (var h = 0; h < billboardsToUpdateLength; ++h) {
                        var bb = billboardsToUpdate[h];
                        bb._dirty = false;

                        for ( var o = 0; o < writers.length; ++o) {
                            writers[o](this, context, textureAtlasCoordinates, vafWriters, bb);
                        }
                        this._vaf.subCommit(bb._index * 4, 4);
                    }
                    this._vaf.endSubCommits();
                }

                this._billboardsToUpdateIndex = 0;
            }
        }

        // If the number of total billboards ever shrinks considerably
        // Truncate billboardsToUpdate so that we free memory that we're
        // not going to be using.
        if (billboardsToUpdateLength > billboardsLength * 1.5) {
            billboardsToUpdate.length = billboardsLength;
        }

        if (!defined(this._vaf) || !defined(this._vaf.vaByPurpose)) {
            return;
        }

        if (this._boundingVolumeDirty) {
            this._boundingVolumeDirty = false;
            BoundingSphere.transform(this._baseVolume, this.modelMatrix, this._baseVolumeWC);
        }

        var boundingVolume;
        var modelMatrix = Matrix4.IDENTITY;
        if (frameState.mode === SceneMode.SCENE3D) {
            modelMatrix = this.modelMatrix;
            boundingVolume = BoundingSphere.clone(this._baseVolumeWC, this._boundingVolume);
        } else {
            boundingVolume = BoundingSphere.clone(this._baseVolume2D, this._boundingVolume);
        }
        updateBoundingVolume(this, context, frameState, boundingVolume);

        var va;
        var vaLength;
        var command;
        var j;

        if (pass.render) {
            var colorList = this._colorCommands;

            if (!defined(this._rs)) {
                this._rs = context.createRenderState({
                    depthTest : {
                        enabled : true
                    },
                    blending : BlendingState.ALPHA_BLEND
                });
            }

            if (!defined(this._sp) ||
                    (this._shaderRotation && !this._compiledShaderRotation) ||
                    (this._shaderScaleByDistance && !this._compiledShaderScaleByDistance) ||
                    (this._shaderTranslucencyByDistance && !this._compiledShaderTranslucencyByDistance) ||
                    (this._shaderPixelOffsetScaleByDistance && !this._compiledShaderPixelOffsetScaleByDistance)) {
                this._sp = context.replaceShaderProgram(
                    this._sp,
                    createShaderSource({
                        defines : [this._shaderRotation ? 'ROTATION' : '',
                                   this._shaderScaleByDistance ? 'EYE_DISTANCE_SCALING' : '',
                                   this._shaderTranslucencyByDistance ? 'EYE_DISTANCE_TRANSLUCENCY' : '',
                                   this._shaderPixelOffsetScaleByDistance ? 'EYE_DISTANCE_PIXEL_OFFSET' : ''],
                        sources : [BillboardCollectionVS]
                    }),
                    BillboardCollectionFS,
                    attributeLocations);
                this._compiledShaderRotation = this._shaderRotation;
                this._compiledShaderScaleByDistance = this._shaderScaleByDistance;
                this._compiledShaderTranslucencyByDistance = this._shaderTranslucencyByDistance;
                this._compiledShaderPixelOffsetScaleByDistance = this._shaderPixelOffsetScaleByDistance;
            }

            va = this._vaf.vaByPurpose[colorPassPurpose];
            vaLength = va.length;

            colorList.length = vaLength;
            for (j = 0; j < vaLength; ++j) {
                command = colorList[j];
                if (!defined(command)) {
                    command = colorList[j] = new DrawCommand({
                        pass : Pass.OPAQUE,
                        owner : this
                    });
                }

                command.boundingVolume = boundingVolume;
                command.modelMatrix = modelMatrix;
                command.count = va[j].indicesCount;
                command.shaderProgram = this._sp;
                command.uniformMap = this._uniforms;
                command.vertexArray = va[j].va;
                command.renderState = this._rs;
                command.debugShowBoundingVolume = this.debugShowBoundingVolume;

                commandList.push(command);
            }
        }


        if (picking) {
            var pickList = this._pickCommands;

            if (!defined(this._spPick) ||
                    (this._shaderRotation && !this._compiledShaderRotationPick) ||
                    (this._shaderScaleByDistance && !this._compiledShaderScaleByDistancePick) ||
                    (this._shaderTranslucencyByDistance && !this._compiledShaderTranslucencyByDistancePick) ||
                    (this._shaderPixelOffsetScaleByDistance && !this._compiledShaderPixelOffsetScaleByDistancePick)) {
                this._spPick = context.replaceShaderProgram(
                    this._spPick,
                    createShaderSource({
                        defines : ['RENDER_FOR_PICK',
                                   this._shaderRotation ? 'ROTATION' : '',
                                   this._shaderScaleByDistance ? 'EYE_DISTANCE_SCALING' : '',
                                   this._shaderTranslucencyByDistance ? 'EYE_DISTANCE_TRANSLUCENCY' : '',
                                   this._shaderPixelOffsetScaleByDistance ? 'EYE_DISTANCE_PIXEL_OFFSET' : ''],
                        sources : [BillboardCollectionVS]
                    }),
                    createShaderSource({
                        defines : ['RENDER_FOR_PICK'],
                        sources : [BillboardCollectionFS]
                    }),
                    attributeLocations);
                this._compiledShaderRotationPick = this._shaderRotation;
                this._compiledShaderScaleByDistancePick = this._shaderScaleByDistance;
                this._compiledShaderTranslucencyByDistancePick = this._shaderTranslucencyByDistance;
                this._compiledShaderPixelOffsetScaleByDistancePick = this._shaderPixelOffsetScaleByDistance;
            }

            va = this._vaf.vaByPurpose[pickPassPurpose];
            vaLength = va.length;

            pickList.length = vaLength;
            for (j = 0; j < vaLength; ++j) {
                command = pickList[j];
                if (!defined(command)) {
                    command = pickList[j] = new DrawCommand({
                        pass : Pass.OPAQUE,
                        owner : this
                    });
                }

                command.boundingVolume = boundingVolume;
                command.modelMatrix = modelMatrix;
                command.count = va[j].indicesCount;
                command.shaderProgram = this._spPick;
                command.uniformMap = this._uniforms;
                command.vertexArray = va[j].va;
                command.renderState = this._rs;

                commandList.push(command);
            }
        }
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @returns {Boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
     *
     * @see BillboardCollection#destroy
     */
    BillboardCollection.prototype.isDestroyed = function() {
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
     * @returns {undefined}
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see BillboardCollection#isDestroyed
     *
     * @example
     * billboards = billboards && billboards.destroy();
     */
    BillboardCollection.prototype.destroy = function() {
        this._textureAtlas = this._destroyTextureAtlas && this._textureAtlas && this._textureAtlas.destroy();
        this._sp = this._sp && this._sp.destroy();
        this._spPick = this._spPick && this._spPick.destroy();
        this._vaf = this._vaf && this._vaf.destroy();
        this._destroyBillboards();

        return destroyObject(this);
    };

    BillboardCollection.prototype._destroyBillboards = function() {
        var billboards = this._billboards;
        var length = billboards.length;
        for (var i = 0; i < length; ++i) {
            if (billboards[i]) {
                billboards[i]._destroy();
            }
        }
    };

    return BillboardCollection;
});
