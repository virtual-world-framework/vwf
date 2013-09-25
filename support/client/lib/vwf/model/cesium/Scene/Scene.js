/*global define*/
define([
        '../Core/Math',
        '../Core/Color',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/destroyObject',
        '../Core/GeographicProjection',
        '../Core/Ellipsoid',
        '../Core/Occluder',
        '../Core/BoundingRectangle',
        '../Core/BoundingSphere',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Intersect',
        '../Core/Interval',
        '../Core/Matrix4',
        '../Core/JulianDate',
        '../Core/EllipsoidGeometry',
        '../Core/GeometryInstance',
        '../Core/GeometryPipeline',
        '../Core/ColorGeometryInstanceAttribute',
        '../Renderer/Context',
        '../Renderer/ClearCommand',
        '../Renderer/PassState',
        './Camera',
        './ScreenSpaceCameraController',
        './CompositePrimitive',
        './CullingVolume',
        './AnimationCollection',
        './SceneMode',
        './FrameState',
        './OrthographicFrustum',
        './PerspectiveOffCenterFrustum',
        './FrustumCommands',
        './Primitive',
        './PerInstanceColorAppearance',
        './SunPostProcess',
        './CreditDisplay'
    ], function(
        CesiumMath,
        Color,
        defaultValue,
        defined,
        destroyObject,
        GeographicProjection,
        Ellipsoid,
        Occluder,
        BoundingRectangle,
        BoundingSphere,
        Cartesian2,
        Cartesian3,
        Intersect,
        Interval,
        Matrix4,
        JulianDate,
        EllipsoidGeometry,
        GeometryInstance,
        GeometryPipeline,
        ColorGeometryInstanceAttribute,
        Context,
        ClearCommand,
        PassState,
        Camera,
        ScreenSpaceCameraController,
        CompositePrimitive,
        CullingVolume,
        AnimationCollection,
        SceneMode,
        FrameState,
        OrthographicFrustum,
        PerspectiveOffCenterFrustum,
        FrustumCommands,
        Primitive,
        PerInstanceColorAppearance,
        SunPostProcess,
        CreditDisplay) {
    "use strict";

    /**
     * The container for all 3D graphical objects and state in a Cesium virtual scene.  Generally,
     * a scene is not created directly; instead, it is implicitly created by {@link CesiumWidget}.
     *
     * @alias Scene
     * @constructor
     *
     * @param {HTMLCanvasElement} canvas The HTML canvas element to create the scene for.
     * @param {Object} [contextOptions=undefined] Properties corresponding to <a href='http://www.khronos.org/registry/webgl/specs/latest/#5.2'>WebGLContextAttributes</a> used to create the WebGL context.  Default values are shown in the code example below.
     * @param {HTMLElement} [creditContainer=undefined] The HTML element in which the credits will be displayed.
     *
     * @see CesiumWidget
     * @see <a href='http://www.khronos.org/registry/webgl/specs/latest/#5.2'>WebGLContextAttributes</a>
     *
     * @example
     * // Create scene with default context options.
     * var scene = new Scene(canvas, {
     *     alpha : false,
     *     depth : true,
     *     stencil : false,
     *     antialias : true,
     *     premultipliedAlpha : true,
     *     preserveDrawingBuffer : false
     * });
     */
    var Scene = function(canvas, contextOptions, creditContainer) {
        var context = new Context(canvas, contextOptions);
        if (!defined(creditContainer)) {
            creditContainer = document.createElement('div');
            creditContainer.style.position = 'absolute';
            creditContainer.style.bottom = '0';
            creditContainer.style['text-shadow'] = '0px 0px 2px #000000';
            creditContainer.style.color = '#ffffff';
            creditContainer.style['font-size'] = '10pt';
            creditContainer.style['padding-right'] = '5px';
            canvas.parentNode.appendChild(creditContainer);
        }
        this._frameState = new FrameState(new CreditDisplay(creditContainer));
        this._passState = new PassState(context);
        this._canvas = canvas;
        this._context = context;
        this._primitives = new CompositePrimitive();
        this._pickFramebuffer = undefined;
        this._camera = new Camera(canvas);
        this._screenSpaceCameraController = new ScreenSpaceCameraController(canvas, this._camera.controller);

        this._animations = new AnimationCollection();

        this._shaderFrameCount = 0;

        this._sunPostProcess = new SunPostProcess();

        this._commandList = [];
        this._frustumCommandsList = [];

        this._clearColorCommand = new ClearCommand();
        this._clearColorCommand.color = new Color();
        this._clearColorCommand.owner = true;

        var clearDepthStencilCommand = new ClearCommand();
        clearDepthStencilCommand.depth = 1.0;
        clearDepthStencilCommand.stencil = 1.0;
        clearDepthStencilCommand.owner = this;
        this._clearDepthStencilCommand = clearDepthStencilCommand;

        /**
         * The {@link SkyBox} used to draw the stars.
         *
         * @type {SkyBox}
         * @default undefined
         *
         * @see Scene#backgroundColor
         */
        this.skyBox = undefined;

        /**
         * The sky atmosphere drawn around the globe.
         *
         * @type {SkyAtmosphere}
         * @default undefined
         */
        this.skyAtmosphere = undefined;

        /**
         * The {@link Sun}.
         *
         * @type {Sun}
         * @default undefined
         */
        this.sun = undefined;

        /**
         * The background color, which is only visible if there is no sky box, i.e., {@link Scene#skyBox} is undefined.
         *
         * @type {Color}
         * @default {@link Color.BLACK}
         *
         * @see Scene#skyBox
         */
        this.backgroundColor = Color.BLACK.clone();

        /**
         * The current mode of the scene.
         *
         * @type {SceneMode}
         * @default {@link SceneMode.SCENE3D}
         */
        this.mode = SceneMode.SCENE3D;
        /**
         * DOC_TBA
         */
        this.scene2D = {
            /**
             * The projection to use in 2D mode.
             */
            projection : new GeographicProjection(Ellipsoid.WGS84)
        };
        /**
         * The current morph transition time between 2D/Columbus View and 3D,
         * with 0.0 being 2D or Columbus View and 1.0 being 3D.
         *
         * @type {Number}
         * @default 1.0
         */
        this.morphTime = 1.0;
        /**
         * The far-to-near ratio of the multi-frustum. The default is 1,000.0.
         *
         * @type {Number}
         * @default 1000.0
         */
        this.farToNearRatio = 1000.0;

        /**
         * This property is for debugging only; it is not for production use.
         * <p>
         * A function that determines what commands are executed.  As shown in the examples below,
         * the function receives the command's <code>owner</code> as an argument, and returns a boolean indicating if the
         * command should be executed.
         * </p>
         * <p>
         * The default is <code>undefined</code>, indicating that all commands are executed.
         * </p>
         *
         * @type Function
         *
         * @default undefined
         *
         * @example
         * // Do not execute any commands.
         * scene.debugCommandFilter = function(command) {
         *     return false;
         * };
         *
         * // Execute only the billboard's commands.  That is, only draw the billboard.
         * var billboards = new BillboardCollection();
         * scene.debugCommandFilter = function(command) {
         *     return command.owner === billboards;
         * };
         *
         * @see DrawCommand
         * @see ClearCommand
         */
        this.debugCommandFilter = undefined;

        /**
         * This property is for debugging only; it is not for production use.
         * <p>
         * When <code>true</code>, commands are shaded based on the frustums they
         * overlap.  Commands in the closest frustum are tinted red, commands in
         * the next closest are green, and commands in the farthest frustum are
         * blue.  If a command overlaps more than one frustum, the color components
         * are combined, e.g., a command overlapping the first two frustums is tinted
         * yellow.
         * </p>
         *
         * @type Boolean
         *
         * @default false
         */
        this.debugShowFrustums = false;

        /**
         * This property is for debugging only; it is not for production use.
         * <p>
         * When {@see Scene.debugShowFrustums} is <code>true</code>, this contains
         * properties with statistics about the number of command execute per frustum.
         * <code>totalCommands</code> is the total number of commands executed, ignoring
         * overlap. <code>commandsInFrustums</code> is an array with the number of times
         * commands are executed redundantly, e.g., how many commands overlap two or
         * three frustums.
         * </p>
         *
         * @type Object
         *
         * @default undefined
         *
         * @readonly
         */
        this.debugFrustumStatistics = undefined;

        this._debugSphere = undefined;

        // initial guess at frustums.
        var near = this._camera.frustum.near;
        var far = this._camera.frustum.far;
        var numFrustums = Math.ceil(Math.log(far / near) / Math.log(this.farToNearRatio));
        updateFrustums(near, far, this.farToNearRatio, numFrustums, this._frustumCommandsList);

        // give frameState, camera, and screen space camera controller initial state before rendering
        updateFrameState(this, 0.0, new JulianDate());
        this.initializeFrame();
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.getCanvas = function() {
        return this._canvas;
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.getContext = function() {
        return this._context;
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.getPrimitives = function() {
        return this._primitives;
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.getCamera = function() {
        return this._camera;
    };
    // TODO: setCamera

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.getScreenSpaceCameraController = function() {
        return this._screenSpaceCameraController;
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.getUniformState = function() {
        return this._context.getUniformState();
    };

    /**
     * Gets state information about the current scene. If called outside of a primitive's <code>update</code>
     * function, the previous frame's state is returned.
     *
     * @memberof Scene
     */
    Scene.prototype.getFrameState = function() {
        return this._frameState;
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.getAnimations = function() {
        return this._animations;
    };

    function clearPasses(passes) {
        passes.color = false;
        passes.pick = false;
        passes.overlay = false;
    }

    function updateFrameState(scene, frameNumber, time) {
        var camera = scene._camera;

        var frameState = scene._frameState;
        frameState.mode = scene.mode;
        frameState.morphTime = scene.morphTime;
        frameState.scene2D = scene.scene2D;
        frameState.frameNumber = frameNumber;
        frameState.time = time;
        frameState.camera = camera;
        frameState.cullingVolume = camera.frustum.computeCullingVolume(camera.getPositionWC(), camera.getDirectionWC(), camera.getUpWC());
        frameState.occluder = undefined;
        frameState.canvasDimensions.x = scene._canvas.clientWidth;
        frameState.canvasDimensions.y = scene._canvas.clientHeight;

        // TODO: The occluder is the top-level central body. When we add
        //       support for multiple central bodies, this should be the closest one.
        var cb = scene._primitives.getCentralBody();
        if (scene.mode === SceneMode.SCENE3D && defined(cb)) {
            var ellipsoid = cb.getEllipsoid();
            var occluder = new Occluder(new BoundingSphere(Cartesian3.ZERO, ellipsoid.getMinimumRadius()), camera.getPositionWC());
            frameState.occluder = occluder;
        }

        clearPasses(frameState.passes);
    }

    function updateFrustums(near, far, farToNearRatio, numFrustums, frustumCommandsList) {
        frustumCommandsList.length = numFrustums;
        for (var m = 0; m < numFrustums; ++m) {
            var curNear = Math.max(near, Math.pow(farToNearRatio, m) * near);
            var curFar = Math.min(far, farToNearRatio * curNear);

            if (m !== 0) {
                // Avoid tearing artifacts between adjacent frustums
                curNear *= 0.99;
            }

            var frustumCommands = frustumCommandsList[m];
            if (!defined(frustumCommands)) {
                frustumCommands = frustumCommandsList[m] = new FrustumCommands(curNear, curFar);
            } else {
                frustumCommands.near = curNear;
                frustumCommands.far = curFar;
            }
        }
    }

    function insertIntoBin(scene, command, distance) {
        if (scene.debugShowFrustums) {
            command.debugOverlappingFrustums = 0;
        }

        var frustumCommandsList = scene._frustumCommandsList;
        var length = frustumCommandsList.length;

        for (var i = 0; i < length; ++i) {
            var frustumCommands = frustumCommandsList[i];
            var curNear = frustumCommands.near;
            var curFar = frustumCommands.far;

            if (distance.start > curFar) {
                continue;
            }

            if (distance.stop < curNear) {
                break;
            }

            // PERFORMANCE_IDEA: sort bins
            frustumCommands.commands[frustumCommands.index++] = command;

            if (scene.debugShowFrustums) {
                command.debugOverlappingFrustums |= (1 << i);
            }

            if (command.executeInClosestFrustum) {
                break;
            }
        }

        if (scene.debugShowFrustums) {
            var cf = scene.debugFrustumStatistics.commandsInFrustums;
            cf[command.debugOverlappingFrustums] = defined(cf[command.debugOverlappingFrustums]) ? cf[command.debugOverlappingFrustums] + 1 : 1;
            ++scene.debugFrustumStatistics.totalCommands;
        }
    }

    var scratchCullingVolume = new CullingVolume();
    var distances = new Interval();

    function createPotentiallyVisibleSet(scene, listName) {
        var commandLists = scene._commandList;
        var cullingVolume = scene._frameState.cullingVolume;
        var camera = scene._camera;

        var direction = camera.getDirectionWC();
        var position = camera.getPositionWC();

        if (scene.debugShowFrustums) {
            scene.debugFrustumStatistics = {
                totalCommands : 0,
                commandsInFrustums : {}
            };
        }

        var frustumCommandsList = scene._frustumCommandsList;
        var numberOfFrustums = frustumCommandsList.length;
        for (var n = 0; n < numberOfFrustums; ++n) {
            frustumCommandsList[n].index = 0;
        }

        var near = Number.MAX_VALUE;
        var far = Number.MIN_VALUE;
        var undefBV = false;

        var occluder;
        if (scene._frameState.mode === SceneMode.SCENE3D) {
            occluder = scene._frameState.occluder;
        }

        // get user culling volume minus the far plane.
        var planes = scratchCullingVolume.planes;
        for (var k = 0; k < 5; ++k) {
            planes[k] = cullingVolume.planes[k];
        }
        cullingVolume = scratchCullingVolume;

        var length = commandLists.length;
        for (var i = 0; i < length; ++i) {
            var commandList = commandLists[i][listName];
            var commandListLength = commandList.length;
            for (var j = 0; j < commandListLength; ++j) {
                var command = commandList[j];
                var boundingVolume = command.boundingVolume;
                if (defined(boundingVolume)) {
                    var modelMatrix = defaultValue(command.modelMatrix, Matrix4.IDENTITY);
                    var transformedBV = boundingVolume.transform(modelMatrix);               //TODO: Remove this allocation.
                    if (command.cull &&
                            ((cullingVolume.getVisibility(transformedBV) === Intersect.OUTSIDE) ||
                             (defined(occluder) && !occluder.isBoundingSphereVisible(transformedBV)))) {
                        continue;
                    }

                    distances = transformedBV.getPlaneDistances(position, direction, distances);
                    near = Math.min(near, distances.start);
                    far = Math.max(far, distances.stop);
                } else {
                    // Clear commands don't need a bounding volume - just add the clear to all frustums.
                    // If another command has no bounding volume, though, we need to use the camera's
                    // worst-case near and far planes to avoid clipping something important.
                    distances.start = camera.frustum.near;
                    distances.stop = camera.frustum.far;
                    undefBV = !(command instanceof ClearCommand);
                }

                insertIntoBin(scene, command, distances);
            }
        }

        if (undefBV) {
            near = camera.frustum.near;
            far = camera.frustum.far;
        } else {
            // The computed near plane must be between the user defined near and far planes.
            // The computed far plane must between the user defined far and computed near.
            // This will handle the case where the computed near plane is further than the user defined far plane.
            near = Math.min(Math.max(near, camera.frustum.near), camera.frustum.far);
            far = Math.max(Math.min(far, camera.frustum.far), near);
        }

        // Exploit temporal coherence. If the frustums haven't changed much, use the frustums computed
        // last frame, else compute the new frustums and sort them by frustum again.
        var farToNearRatio = scene.farToNearRatio;
        var numFrustums = Math.ceil(Math.log(far / near) / Math.log(farToNearRatio));
        if (near !== Number.MAX_VALUE && (numFrustums !== numberOfFrustums || (frustumCommandsList.length !== 0 &&
                (near < frustumCommandsList[0].near || far > frustumCommandsList[numberOfFrustums - 1].far)))) {
            updateFrustums(near, far, farToNearRatio, numFrustums, frustumCommandsList);
            createPotentiallyVisibleSet(scene, listName);
        }
    }

    function createFrustumDebugFragmentShaderSource(command) {
        var fragmentShaderSource = command.shaderProgram.fragmentShaderSource;
        var renamedFS = fragmentShaderSource.replace(/void\s+main\s*\(\s*(?:void)?\s*\)/g, 'void czm_frustumDebug_main()');

        // Support up to three frustums.  If a command overlaps all
        // three, it's code is not changed.
        var r = (command.debugOverlappingFrustums & (1 << 0)) ? '1.0' : '0.0';
        var g = (command.debugOverlappingFrustums & (1 << 1)) ? '1.0' : '0.0';
        var b = (command.debugOverlappingFrustums & (1 << 2)) ? '1.0' : '0.0';

        var pickMain =
            'void main() \n' +
            '{ \n' +
            '    czm_frustumDebug_main(); \n' +
            '    gl_FragColor.rgb *= vec3(' + r + ', ' + g + ', ' + b + '); \n' +
            '}';

        return renamedFS + '\n' + pickMain;
    }

    function executeFrustumDebugCommand(command, context, passState) {
        if (defined(command.shaderProgram)) {
            // Replace shader for frustum visualization
            var sp = command.shaderProgram;
            var attributeLocations = {};
            var attributes = sp.getVertexAttributes();
            for (var a in attributes) {
                if (attributes.hasOwnProperty(a)) {
                    attributeLocations[a] = attributes[a].index;
                }
            }

            command.shaderProgram = context.getShaderCache().getShaderProgram(
                sp.vertexShaderSource, createFrustumDebugFragmentShaderSource(command), attributeLocations);

            command.execute(context, passState);

            command.shaderProgram.release();
            command.shaderProgram = sp;
        }
    }

    function executeCommand(command, scene, context, passState) {
        if ((defined(scene.debugCommandFilter)) && !scene.debugCommandFilter(command)) {
            return;
        }

        if (!scene.debugShowFrustums) {
            command.execute(context, passState);
        } else {
            executeFrustumDebugCommand(command, context, passState);
        }

        if (command.debugShowBoundingVolume && (defined(command.boundingVolume))) {
            // Debug code to draw bounding volume for command.  Not optimized!
            // Assumes bounding volume is a bounding sphere.

            if (!defined(scene._debugSphere)) {
                var geometry = EllipsoidGeometry.createGeometry(new EllipsoidGeometry({
                    ellipsoid : Ellipsoid.UNIT_SPHERE,
                    vertexFormat : PerInstanceColorAppearance.FLAT_VERTEX_FORMAT
                }));
                scene._debugSphere = new Primitive({
                    geometryInstances : new GeometryInstance({
                        geometry : GeometryPipeline.toWireframe(geometry),
                        attributes : {
                            color : new ColorGeometryInstanceAttribute(1.0, 0.0, 0.0, 1.0)
                        }
                    }),
                    appearance : new PerInstanceColorAppearance({
                        flat : true,
                        translucent : false
                    }),
                    asynchronous : false
                });
            }

            var m = Matrix4.multiplyByTranslation(defaultValue(command.modelMatrix, Matrix4.IDENTITY), command.boundingVolume.center);
            scene._debugSphere.modelMatrix = Matrix4.multiplyByUniformScale(Matrix4.fromTranslation(Cartesian3.fromArray(m, 12)), command.boundingVolume.radius);

            var commandList = [];
            scene._debugSphere.update(context, scene._frameState, commandList);
            commandList[0].colorList[0].execute(context, passState);
        }
    }

    function isSunVisible(command, frameState) {
        var occluder = (frameState.mode === SceneMode.SCENE3D) ? frameState.occluder: undefined;
        var cullingVolume = frameState.cullingVolume;

        // get user culling volume minus the far plane.
        var planes = scratchCullingVolume.planes;
        for (var k = 0; k < 5; ++k) {
            planes[k] = cullingVolume.planes[k];
        }
        cullingVolume = scratchCullingVolume;

        return ((defined(command)) &&
                 ((!defined(command.boundingVolume)) ||
                  !command.cull ||
                  ((cullingVolume.getVisibility(command.boundingVolume) !== Intersect.OUTSIDE) &&
                   (!defined(occluder) || occluder.isBoundingSphereVisible(command.boundingVolume)))));
    }

    function executeCommands(scene, passState, clearColor) {
        var frameState = scene._frameState;
        var camera = scene._camera;
        var frustum = camera.frustum.clone();
        var context = scene._context;
        var us = context.getUniformState();

        var skyBoxCommand = (frameState.passes.color && defined(scene.skyBox)) ? scene.skyBox.update(context, frameState) : undefined;
        var skyAtmosphereCommand = (frameState.passes.color && defined(scene.skyAtmosphere)) ? scene.skyAtmosphere.update(context, frameState) : undefined;
        var sunCommand = (frameState.passes.color && defined(scene.sun)) ? scene.sun.update(context, frameState) : undefined;
        var sunVisible = isSunVisible(sunCommand, frameState);

        if (sunVisible) {
            passState.framebuffer = scene._sunPostProcess.update(context);
        }

        var clear = scene._clearColorCommand;
        Color.clone(clearColor, clear.color);
        clear.execute(context, passState);

        if (sunVisible) {
            scene._sunPostProcess.clear(context, scene.backgroundColor);
        }

        // Ideally, we would render the sky box and atmosphere last for
        // early-z, but we would have to draw it in each frustum
        frustum.near = camera.frustum.near;
        frustum.far = camera.frustum.far;
        us.updateFrustum(frustum);

        if (defined(skyBoxCommand)) {
            executeCommand(skyBoxCommand, scene, context, passState);
        }

        if (defined(skyAtmosphereCommand)) {
            executeCommand(skyAtmosphereCommand, scene, context, passState);
        }

        if (defined(sunCommand) && sunVisible) {
            sunCommand.execute(context, passState);
            scene._sunPostProcess.execute(context);
            passState.framebuffer = undefined;
        }

        var clearDepthStencil = scene._clearDepthStencilCommand;

        var frustumCommandsList = scene._frustumCommandsList;
        var numFrustums = frustumCommandsList.length;
        for (var i = 0; i < numFrustums; ++i) {
            clearDepthStencil.execute(context, passState);

            var index = numFrustums - i - 1;
            var frustumCommands = frustumCommandsList[index];
            frustum.near = frustumCommands.near;
            frustum.far = frustumCommands.far;

            us.updateFrustum(frustum);

            var commands = frustumCommands.commands;
            var length = frustumCommands.index;
            for (var j = 0; j < length; ++j) {
                executeCommand(commands[j], scene, context, passState);
            }
        }
    }

    function executeOverlayCommands(scene, passState) {
        var context = scene._context;
        var commandLists = scene._commandList;
        var length = commandLists.length;
        for (var i = 0; i < length; ++i) {
            var commandList = commandLists[i].overlayList;
            var commandListLength = commandList.length;
            for (var j = 0; j < commandListLength; ++j) {
                commandList[j].execute(context, passState);
            }
        }
    }

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.initializeFrame = function() {
        // Destroy released shaders once every 120 frames to avoid thrashing the cache
        if (this._shaderFrameCount++ === 120) {
            this._shaderFrameCount = 0;
            this._context.getShaderCache().destroyReleasedShaderPrograms();
        }

        this._animations.update();
        this._camera.controller.update(this.mode, this.scene2D);
        this._screenSpaceCameraController.update(this.mode);
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.render = function(time) {
        if (!defined(time)) {
            time = new JulianDate();
        }

        var us = this.getUniformState();
        var frameState = this._frameState;

        var frameNumber = CesiumMath.incrementWrap(frameState.frameNumber, 15000000.0, 1.0);
        updateFrameState(this, frameNumber, time);
        frameState.passes.color = true;
        frameState.passes.overlay = true;
        frameState.creditDisplay.beginFrame();

        us.update(frameState);

        var context = this._context;

        this._commandList.length = 0;
        this._primitives.update(context, frameState, this._commandList);

        createPotentiallyVisibleSet(this, 'colorList');

        var passState = this._passState;

        executeCommands(this, passState, defaultValue(this.backgroundColor, Color.BLACK));
        executeOverlayCommands(this, passState);
        frameState.creditDisplay.endFrame();
    };

    var orthoPickingFrustum = new OrthographicFrustum();
    function getPickOrthographicCullingVolume(scene, windowPosition, width, height) {
        var canvas = scene._canvas;
        var camera = scene._camera;
        var frustum = camera.frustum;

        var canvasWidth = canvas.clientWidth;
        var canvasHeight = canvas.clientHeight;

        var x = (2.0 / canvasWidth) * windowPosition.x - 1.0;
        x *= (frustum.right - frustum.left) * 0.5;
        var y = (2.0 / canvasHeight) * (canvasHeight - windowPosition.y) - 1.0;
        y *= (frustum.top - frustum.bottom) * 0.5;

        var position = camera.position;
        position = new Cartesian3(position.z, position.x, position.y);
        position.y += x;
        position.z += y;

        var pixelSize = frustum.getPixelSize(new Cartesian2(canvasWidth, canvasHeight));

        var ortho = orthoPickingFrustum;
        ortho.right = pixelSize.x * 0.5;
        ortho.left = -ortho.right;
        ortho.top = pixelSize.y * 0.5;
        ortho.bottom = -ortho.top;
        ortho.near = frustum.near;
        ortho.far = frustum.far;

        return ortho.computeCullingVolume(position, camera.getDirectionWC(), camera.getUpWC());
    }

    var perspPickingFrustum = new PerspectiveOffCenterFrustum();
    function getPickPerspectiveCullingVolume(scene, windowPosition, width, height) {
        var canvas = scene._canvas;
        var camera = scene._camera;
        var frustum = camera.frustum;
        var near = frustum.near;

        var canvasWidth = canvas.clientWidth;
        var canvasHeight = canvas.clientHeight;

        var tanPhi = Math.tan(frustum.fovy * 0.5);
        var tanTheta = frustum.aspectRatio * tanPhi;

        var x = (2.0 / canvasWidth) * windowPosition.x - 1.0;
        var y = (2.0 / canvasHeight) * (canvasHeight - windowPosition.y) - 1.0;

        var xDir = x * near * tanTheta;
        var yDir = y * near * tanPhi;

        var pixelSize = frustum.getPixelSize(new Cartesian2(canvasWidth, canvasHeight));
        var pickWidth = pixelSize.x * width * 0.5;
        var pickHeight = pixelSize.y * height * 0.5;

        var offCenter = perspPickingFrustum;
        offCenter.top = yDir + pickHeight;
        offCenter.bottom = yDir - pickHeight;
        offCenter.right = xDir + pickWidth;
        offCenter.left = xDir - pickWidth;
        offCenter.near = near;
        offCenter.far = frustum.far;

        return offCenter.computeCullingVolume(camera.getPositionWC(), camera.getDirectionWC(), camera.getUpWC());
    }

    function getPickCullingVolume(scene, windowPosition, width, height) {
        if (scene.mode === SceneMode.SCENE2D) {
            return getPickOrthographicCullingVolume(scene, windowPosition, width, height);
        }

        return getPickPerspectiveCullingVolume(scene, windowPosition, width, height);
    }

    // pick rectangle width and height, assumed odd
    var rectangleWidth = 3.0;
    var rectangleHeight = 3.0;
    var scratchRectangle = new BoundingRectangle(0.0, 0.0, rectangleWidth, rectangleHeight);
    var scratchColorZero = new Color(0.0, 0.0, 0.0, 0.0);

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.pick = function(windowPosition) {
        var context = this._context;
        var primitives = this._primitives;
        var frameState = this._frameState;

        if (!defined(this._pickFramebuffer)) {
            this._pickFramebuffer = context.createPickFramebuffer();
        }

        // Update with previous frame's number and time, assuming that render is called before picking.
        updateFrameState(this, frameState.frameNumber, frameState.time);
        frameState.cullingVolume = getPickCullingVolume(this, windowPosition, rectangleWidth, rectangleHeight);
        frameState.passes.pick = true;

        var commandLists = this._commandList;
        commandLists.length = 0;
        primitives.update(context, frameState, commandLists);
        createPotentiallyVisibleSet(this, 'pickList');

        scratchRectangle.x = windowPosition.x - ((rectangleWidth - 1.0) * 0.5);
        scratchRectangle.y = (this._canvas.clientHeight - windowPosition.y) - ((rectangleHeight - 1.0) * 0.5);

        executeCommands(this, this._pickFramebuffer.begin(scratchRectangle), scratchColorZero);
        return this._pickFramebuffer.end(scratchRectangle);
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * DOC_TBA
     * @memberof Scene
     */
    Scene.prototype.destroy = function() {
        this._screenSpaceCameraController = this._screenSpaceCameraController && this._screenSpaceCameraController.destroy();
        this._pickFramebuffer = this._pickFramebuffer && this._pickFramebuffer.destroy();
        this._primitives = this._primitives && this._primitives.destroy();
        this.skyBox = this.skyBox && this.skyBox.destroy();
        this.skyAtmosphere = this.skyAtmosphere && this.skyAtmosphere.destroy();
        this._debugSphere = this._debugSphere && this._debugSphere.destroy();
        this.sun = this.sun && this.sun.destroy();
        this._sunPostProcess = this._sunPostProcess && this._sunPostProcess.destroy();
        this._context = this._context && this._context.destroy();
        this._frameState.creditDisplay.destroy();
        return destroyObject(this);
    };

    return Scene;
});
