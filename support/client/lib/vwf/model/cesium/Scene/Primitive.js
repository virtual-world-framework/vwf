/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
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
        '../Core/Queue',
        '../Core/clone',
        '../Renderer/BufferUsage',
        '../Renderer/VertexLayout',
        '../Renderer/CommandLists',
        '../Renderer/DrawCommand',
        '../Renderer/createShaderSource',
        '../Renderer/CullFace',
        './PrimitivePipeline',
        './PrimitiveState',
        './SceneMode',
        '../ThirdParty/when'
    ], function(
        defaultValue,
        defined,
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
        Queue,
        clone,
        BufferUsage,
        VertexLayout,
        CommandLists,
        DrawCommand,
        createShaderSource,
        CullFace,
        PrimitivePipeline,
        PrimitiveState,
        SceneMode,
        when) {
    "use strict";

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
     * Instances can be individually picked; {@link Context#pick} returns their {@link GeometryInstance#id}.  Using
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
     * @param {Array|GeometryInstance} [options.geometryInstances=undefined] The geometry instances - or a single geometry instance - to render.
     * @param {Appearance} [options.appearance=undefined] The appearance used to render the primitive.
     * @param {Boolean} [options.vertexCacheOptimize=true] When <code>true</code>, geometry vertices are optimized for the pre and post-vertex-shader caches.
     * @param {Boolean} [options.releaseGeometryInstances=true] When <code>true</code>, the primitive does not keep a reference to the input <code>geometryInstances</code> to save memory.
     * @param {Boolean} [options.allow3DOnly=false] When <code>true</code>, each geometry instance will only be rendered in 3D.
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
     *       bearing : CesiumMath.PI_OVER_FOUR
     *   }),
     *   id : 'object returned when this instance is picked and to get/set per-instance attributes'
     * });
     * var primitive = new Primitive({
     *   geometryInstances : instance,
     *   appearance : new EllipsoidSurfaceAppearance({
     *     material : Material.fromType(scene.getContext(), 'Checkerboard')
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
        this.modelMatrix = Matrix4.IDENTITY.clone();

        /**
         * Determines if the primitive will be shown.  This affects all geometry
         * instances in the primitive.
         *
         * @type Boolean
         *
         * @default true
         */
        this.show = true;

        this.state = PrimitiveState.READY;
        this._createdGeometries = [];
        this._geometries = [];
        this._vaAttributes = undefined;
        this._error = undefined;

        this._vertexCacheOptimize = defaultValue(options.vertexCacheOptimize, true);
        this._releaseGeometryInstances = defaultValue(options.releaseGeometryInstances, true);
        // When true, geometry is transformed to world coordinates even if there is a single
        // geometry or all geometries are in the same reference frame.
        this._allow3DOnly = defaultValue(options.allow3DOnly, false);
        this._boundingSphere = undefined;
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

        this._pickSP = undefined;
        this._pickIds = [];

        this._commandLists = new CommandLists();
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

    function createColumbusViewShader(primitive, vertexShaderSource) {
        var attributes;
        if (!primitive._allow3DOnly) {
            attributes =
                'attribute vec3 position2DHigh;\n' +
                'attribute vec3 position2DLow;\n';
        } else {
            attributes = '';
        }

        var computePosition =
            '\nvec4 czm_computePosition()\n' +
            '{\n';
        if (!primitive._allow3DOnly) {
            computePosition +=
                '    vec4 p;\n' +
                '    if (czm_morphTime == 1.0)\n' +
                '    {\n' +
                '        p = czm_translateRelativeToEye(position3DHigh, position3DLow);\n' +
                '    }\n' +
                '    else if (czm_morphTime == 0.0)\n' +
                '    {\n' +
                '        p = czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy);\n' +
                '    }\n' +
                '    else\n' +
                '    {\n' +
                '        p = czm_columbusViewMorph(\n' +
                '                czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy),\n' +
                '                czm_translateRelativeToEye(position3DHigh, position3DLow),\n' +
                '                czm_morphTime);\n' +
                '    }\n' +
                '    return p;\n';
        } else {
            computePosition += '    return czm_translateRelativeToEye(position3DHigh, position3DLow);\n';
        }
        computePosition += '}\n\n';

        return attributes + vertexShaderSource + computePosition;
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

    var taskProcessor = new TaskProcessor('taskDispatcher', Number.POSITIVE_INFINITY);

    /**
     * @private
     */
    Primitive.prototype.update = function(context, frameState, commandList) {
        if (!this.show ||
            ((!defined(this.geometryInstances)) && (this._va.length === 0)) ||
            (!defined(this.appearance)) ||
            (frameState.mode !== SceneMode.SCENE3D && this._allow3DOnly) ||
            (!frameState.passes.color && !frameState.passes.pick)) {
            return;
        }

        var projection = frameState.scene2D.projection;
        var colorCommands = this._commandLists.colorList;
        var pickCommands = this._commandLists.pickList;
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
        var pickColors;
        var pickId;

        var that = this;

        if (this.state !== PrimitiveState.COMPLETE && this.state !== PrimitiveState.COMBINED) {

            if (this.asynchronous) {
                if (this.state === PrimitiveState.FAILED) {
                    throw this._error;
                } else if (this.state === PrimitiveState.READY) {
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

                    this.state = PrimitiveState.CREATING;

                    when.all(promises, function(results) {
                        that._geometries = results;
                        that.state = PrimitiveState.CREATED;
                    }, function(error) {
                        that._error = error;
                        that.state = PrimitiveState.FAILED;
                    });
                } else if (this.state === PrimitiveState.CREATED) {
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

                    pickColors = [];
                    for (i = 0; i < length; ++i) {
                        pickId = context.createPickId(defaultValue(instances[i].id, this));
                        this._pickIds.push(pickId);
                        pickColors.push(pickId.color);
                    }

                    promise = taskProcessor.scheduleTask({
                        task : 'combineGeometry',
                        instances : clonedInstances,
                        pickIds : pickColors,
                        ellipsoid : projection.getEllipsoid(),
                        isGeographic : projection instanceof GeographicProjection,
                        elementIndexUintSupported : context.getElementIndexUint(),
                        allow3DOnly : this._allow3DOnly,
                        vertexCacheOptimize : this._vertexCacheOptimize,
                        modelMatrix : this.modelMatrix
                    }, transferableObjects);

                    this.state = PrimitiveState.COMBINING;

                    when(promise, function(result) {
                        PrimitivePipeline.receiveGeometries(result.geometries);
                        PrimitivePipeline.receivePerInstanceAttributes(result.vaAttributes);

                        that._geometries = result.geometries;
                        that._attributeIndices = result.attributeIndices;
                        that._vaAttributes = result.vaAttributes;
                        that._perInstanceAttributeIndices = result.vaAttributeIndices;
                        Matrix4.clone(result.modelMatrix, that.modelMatrix);
                        that.state = PrimitiveState.COMBINED;
                    }, function(error) {
                        that._error = error;
                        that.state = PrimitiveState.FAILED;
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

                pickColors = [];
                for (i = 0; i < length; ++i) {
                    pickId = context.createPickId(defaultValue(instances[i].id, this));
                    this._pickIds.push(pickId);
                    pickColors.push(pickId.color);
                }

                var result = PrimitivePipeline.combineGeometry({
                    instances : clonedInstances,
                    pickIds : pickColors,
                    ellipsoid : projection.getEllipsoid(),
                    isGeographic : projection,
                    elementIndexUintSupported : context.getElementIndexUint(),
                    allow3DOnly : this._allow3DOnly,
                    vertexCacheOptimize : this._vertexCacheOptimize,
                    modelMatrix : this.modelMatrix
                });

                this._geometries = result.geometries;
                this._attributeIndices = result.attributeIndices;
                this._vaAttributes = result.vaAttributes;
                this._perInstanceAttributeIndices = result.vaAttributeIndices;
                Matrix4.clone(result.modelMatrix, this.modelMatrix);

                this.state = PrimitiveState.COMBINED;
            }
        }

        if (this.state === PrimitiveState.COMBINED) {
            geometries = this._geometries;
            var attributeIndices = this._attributeIndices;
            var vaAttributes = this._vaAttributes;

            this._boundingSphere = BoundingSphere.clone(geometries[0].boundingSphere);
            if (!this._allow3DOnly && defined(this._boundingSphere)) {
                this._boundingSphere2D = BoundingSphere.projectTo2D(this._boundingSphere, projection);
            }

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

            if (this._releaseGeometryInstances) {
                this.geometryInstances = undefined;
            }

            this._geomtries = undefined;
            this._createdGeometries = undefined;
            this.state = PrimitiveState.COMPLETE;
        }

        if (this.state !== PrimitiveState.COMPLETE) {
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

        if (createRS) {
            if (appearance.closed && appearance.translucent) {
                var rs = clone(appearance.renderState, false);
                rs.cull = {
                    enabled : true,
                    face : CullFace.BACK
                };
                this._frontFaceRS = context.createRenderState(rs);

                rs.cull.face = CullFace.FRONT;
                this._backFaceRS = context.createRenderState(rs);
            } else {
                this._frontFaceRS = context.createRenderState(appearance.renderState);
            }
        }

        if (createSP) {
            var shaderCache = context.getShaderCache();
            var vs = createColumbusViewShader(this, appearance.vertexShaderSource);
            vs = appendShow(this, vs);
            var fs = appearance.getFragmentShaderSource();
            var pickFS = createShaderSource({ sources : [fs], pickColorQualifier : 'varying' });

            this._sp = shaderCache.replaceShaderProgram(this._sp, vs, fs, this._attributeIndices);
            this._pickSP = shaderCache.replaceShaderProgram(this._pickSP, createPickVertexShaderSource(vs), pickFS, this._attributeIndices);

            validateShaderMatching(this._sp, this._attributeIndices);
            validateShaderMatching(this._pickSP, this._attributeIndices);
        }

        if (createRS || createSP) {
            var uniforms = (defined(material)) ? material._uniforms : undefined;

            if (defined(this._backFaceRS)) {
                colorCommands.length = this._va.length * 2;
                pickCommands.length = this._va.length * 2;
            } else {
                colorCommands.length = this._va.length;
                pickCommands.length = this._va.length;
            }

            length = colorCommands.length;
            var vaIndex = 0;
            for (i = 0; i < length; ++i) {
                if (defined(this._backFaceRS)) {
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

                    pickCommand = pickCommands[i];
                    if (!defined(pickCommand)) {
                        pickCommand = pickCommands[i] = new DrawCommand();
                    }
                    pickCommand.owner = this;
                    pickCommand.primitiveType = this._primitiveType;
                    pickCommand.vertexArray = this._va[vaIndex];
                    pickCommand.renderState = this._backFaceRS;
                    pickCommand.shaderProgram = this._pickSP;
                    pickCommand.uniformMap = uniforms;

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

                pickCommand = pickCommands[i];
                if (!defined(pickCommand)) {
                    pickCommand = pickCommands[i] = new DrawCommand();
                }
                pickCommand.owner = this;
                pickCommand.primitiveType = this._primitiveType;
                pickCommand.vertexArray = this._va[vaIndex];
                pickCommand.renderState = this._frontFaceRS;
                pickCommand.shaderProgram = this._pickSP;
                pickCommand.uniformMap = uniforms;

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

        var boundingSphere;
        if (frameState.mode === SceneMode.SCENE3D) {
            boundingSphere = this._boundingSphere;
        } else if (frameState.mode === SceneMode.COLUMBUS_VIEW) {
            boundingSphere = this._boundingSphere2D;
        } else if (frameState.mode === SceneMode.SCENE2D && defined(this._boundingSphere2D)) {
            boundingSphere = BoundingSphere.clone(this._boundingSphere2D);
            boundingSphere.center.x = 0.0;
        } else if (defined(this._boundingSphere) && defined(this._boundingSphere2D)) {
            boundingSphere = BoundingSphere.union(this._boundingSphere, this._boundingSphere2D);
        }

        // modelMatrix can change from frame to frame
        length = colorCommands.length;
        for (i = 0; i < length; ++i) {
            colorCommands[i].modelMatrix = this.modelMatrix;
            pickCommands[i].modelMatrix = this.modelMatrix;

            colorCommands[i].boundingVolume = boundingSphere;
            pickCommands[i].boundingVolume = boundingSphere;
        }

        commandList.push(this._commandLists);
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

        for (var name in perInstanceAttributes) {
            if (perInstanceAttributes.hasOwnProperty(name)) {
                Object.defineProperty(attributes, name, {
                    get : createGetFunction(name, perInstanceAttributes),
                    set : createSetFunction(name, perInstanceAttributes, this._dirtyAttributes)
                });
            }
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
