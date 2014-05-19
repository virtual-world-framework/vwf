/*global define*/
define([
        '../Core/defined',
        '../Core/destroyObject',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Cartesian4',
        '../Core/Cartographic',
        '../Core/DeveloperError',
        '../Core/Ellipsoid',
        '../Core/KeyboardEventModifier',
        '../Core/FAR',
        '../Core/IntersectionTests',
        '../Core/Math',
        '../Core/Matrix4',
        '../Core/Ray',
        '../Core/Transforms',
        './AnimationCollection',
        './CameraEventAggregator',
        './CameraEventType',
        './CameraColumbusViewMode',
        './SceneMode'
    ], function(
        defined,
        destroyObject,
        Cartesian2,
        Cartesian3,
        Cartesian4,
        Cartographic,
        DeveloperError,
        Ellipsoid,
        KeyboardEventModifier,
        FAR,
        IntersectionTests,
        CesiumMath,
        Matrix4,
        Ray,
        Transforms,
        AnimationCollection,
        CameraEventAggregator,
        CameraEventType,
        CameraColumbusViewMode,
        SceneMode) {
    "use strict";

    /**
     * Modifies the camera position and orientation based on mouse input to a canvas.
     * @alias ScreenSpaceCameraController
     * @constructor
     *
     * @param {HTMLCanvasElement} canvas The canvas to listen for events.
     * @param {CameraController} cameraController The camera controller used to modify the camera.
     *
     * @exception {DeveloperError} canvas is required.
     * @exception {DeveloperError} cameraController is required.
     */
    var ScreenSpaceCameraController = function(canvas, cameraController) {
        if (!defined(canvas)) {
            throw new DeveloperError('canvas is required.');
        }

        if (!defined(cameraController)) {
            throw new DeveloperError('cameraController is required.');
        }

        /**
         * If true, allows the user to pan around the map.  If false, the camera stays locked at the current position.
         * This flag only applies in 2D and Columbus view modes.
         * @type {Boolean}
         * @default true
         */
        this.enableTranslate = true;
        /**
         * If true, allows the user to zoom in and out.  If false, the camera is locked to the current distance from the ellipsoid.
         * @type {Boolean}
         * @default true
         */
        this.enableZoom = true;
        /**
         * If true, allows the user to rotate the camera.  If false, the camera is locked to the current heading.
         * This flag only applies in 2D and 3D.
         * @type {Boolean}
         * @default true
         */
        this.enableRotate = true;
        /**
         * If true, allows the user to tilt the camera.  If false, the camera is locked to the current heading.
         * This flag only applies in 3D and Columbus view.
         * @type {Boolean}
         * @default true
         */
        this.enableTilt = true;
        /**
         * If true, allows the user to use free-look. If false, the camera view direction can only be changed through translating
         * or rotating. This flag only applies in 3D and Columbus view modes.
         * @type {Boolean}
         * @default true
         */
        this.enableLook = true;
        /**
         * A parameter in the range <code>[0, 1)</code> used to determine how long
         * the camera will continue to spin because of inertia.
         * With value of zero, the camera will have no inertia.
         * @type {Number}
         * @default 0.9
         */
        this.inertiaSpin = 0.9;
        /**
         * A parameter in the range <code>[0, 1)</code> used to determine how long
         * the camera will continue to translate because of inertia.
         * With value of zero, the camera will have no inertia.
         * @type {Number}
         * @default 0.9
         */
        this.inertiaTranslate = 0.9;
        /**
         * A parameter in the range <code>[0, 1)</code> used to determine how long
         * the camera will continue to zoom because of inertia.
         * With value of zero, the camera will have no inertia.
         * @type {Number}
         * @default 0.8
         */
        this.inertiaZoom = 0.8;
        /**
         * A parameter in the range <code>[0, 1)</code> used to limit the range
         * of various user inputs to a percentage of the window width/height per animation frame.
         * This helps keep the camera under control in low-frame-rate situations.
         * @type {Number}
         * @default 0.1
         */
        this.maximumMovementRatio = 0.1;
        /**
         * Sets the behavior in Columbus view.
         * @type {CameraColumbusViewMode}
         * @default {@link CameraColumbusViewMode.FREE}
         */
        this.columbusViewMode = CameraColumbusViewMode.FREE;
        /**
         * Sets the duration, in milliseconds, of the bounce back animations in 2D and Columbus view. The default value is 3000.
         * @type {Number}
         * @default 3000.0
         */
        this.bounceAnimationTime = 3000.0;
        /**
         * The minimum magnitude, in meters, of the camera position when zooming. Defaults to 20.0.
         * @type {Number}
         * @default 20.0
         */
        this.minimumZoomDistance = 20.0;
        /**
         * The maximum magnitude, in meters, of the camera position when zooming. Defaults to positive infinity.
         * @type {Number}
         * @default {@link Number.POSITIVE_INFINITY}
         */
        this.maximumZoomDistance = Number.POSITIVE_INFINITY;
        /**
         * The input that allows the user to pan around the map. This only applies in 2D and Columbus view modes.
         * <p>
         * The type came be a {@link CameraEventType}, <code>undefined</code>, an object with <code>eventType</code>
         * and <code>modifier</code> properties with types <code>CameraEventType</code> and {@link KeyboardEventModifier},
         * or an array of any of the preceding.
         * </p>
         * @type {CameraEventType|Array|undefined}
         * @default {@link CameraEventType.LEFT_DRAG}
         */
        this.translateEventTypes = CameraEventType.LEFT_DRAG;
        /**
         * The input that allows the user to zoom in/out.
         * <p>
         * The type came be a {@link CameraEventType}, <code>undefined</code>, an object with <code>eventType</code>
         * and <code>modifier</code> properties with types <code>CameraEventType</code> and {@link KeyboardEventModifier},
         * or an array of any of the preceding.
         * </p>
         * @type {CameraEventType|Array|undefined}
         * @default [{@link CameraEventType.RIGHT_DRAG}, {@link CameraEventType.WHEEL}, {@link CameraEventType.PINCH}]
         */
        this.zoomEventTypes = [CameraEventType.RIGHT_DRAG, CameraEventType.WHEEL, CameraEventType.PINCH];
        /**
         * The input that allows the user to rotate around the globe or another object. This only applies in 3D and Columbus view modes.
         * <p>
         * The type came be a {@link CameraEventType}, <code>undefined</code>, an object with <code>eventType</code>
         * and <code>modifier</code> properties with types <code>CameraEventType</code> and {@link KeyboardEventModifier},
         * or an array of any of the preceding.
         * </p>
         * @type {CameraEventType|Array|undefined}
         * @default {@link CameraEventType.LEFT_DRAG}
         */
        this.rotateEventTypes = CameraEventType.LEFT_DRAG;
        /**
         * The input that allows the user to tilt in 3D and Columbus view or twist in 2D.
         * <p>
         * The type came be a {@link CameraEventType}, <code>undefined</code>, an object with <code>eventType</code>
         * and <code>modifier</code> properties with types <code>CameraEventType</code> and {@link KeyboardEventModifier},
         * or an array of any of the preceding.
         * </p>
         * @type {CameraEventType|Array|undefined}
         * @default [{@link CameraEventType.MIDDLE_DRAG}, {@link CameraEventType.PINCH}, {
         *     eventType : {@link CameraEventType.LEFT_DRAG},
         *     modifier : {@link KeyboardEventModifier.CTRL}
         * }]
         */
        this.tiltEventTypes = [CameraEventType.MIDDLE_DRAG, CameraEventType.PINCH, {
            eventType : CameraEventType.LEFT_DRAG,
            modifier : KeyboardEventModifier.CTRL
        }];
        /**
         * The input that allows the user to change the direction the camera is viewing. This only applies in 3D and Columbus view modes.
         * <p>
         * The type came be a {@link CameraEventType}, <code>undefined</code>, an object with <code>eventType</code>
         * and <code>modifier</code> properties with types <code>CameraEventType</code> and {@link KeyboardEventModifier},
         * or an array of any of the preceding.
         * </p>
         * @type {CameraEventType|Array|undefined}
         * @default { eventType : {@link CameraEventType.LEFT_DRAG}, modifier : {@link KeyboardEventModifier.SHIFT} }
         */
        this.lookEventTypes = {
            eventType : CameraEventType.LEFT_DRAG,
            modifier : KeyboardEventModifier.SHIFT
        };

        this._canvas = canvas;
        this._cameraController = cameraController;
        this._ellipsoid = Ellipsoid.WGS84;

        this._aggregator = new CameraEventAggregator(canvas);

        this._lastInertiaSpinMovement = undefined;
        this._lastInertiaZoomMovement = undefined;
        this._lastInertiaTranslateMovement = undefined;
        this._lastInertiaWheelZoomMovement = undefined;
        this._lastInertiaTiltMovement = undefined;

        this._animationCollection = new AnimationCollection();
        this._animation = undefined;

        this._horizontalRotationAxis = undefined;

        // Constants, Make any of these public?
        var radius = this._ellipsoid.getMaximumRadius();
        this._zoomFactor = 5.0;
        this._rotateFactor = 1.0 / radius;
        this._rotateRateRangeAdjustment = radius;
        this._maximumRotateRate = 1.77;
        this._minimumRotateRate = 1.0 / 5000.0;
        this._translateFactor = 1.0;
        this._minimumZoomRate = 20.0;
        this._maximumZoomRate = FAR;
    };

    /**
     * Gets the ellipsoid. The ellipsoid is used to determine the size of the map in 2D and Columbus view
     * as well as how fast to rotate the camera based on the distance to its surface.
     * @returns {Ellipsoid} The ellipsoid.
     */
    ScreenSpaceCameraController.prototype.getEllipsoid = function() {
        return this._ellipsoid;
    };

    /**
     * Sets the ellipsoid. The ellipsoid is used to determine the size of the map in 2D and Columbus view
     * as well as how fast to rotate the camera based on the distance to its surface.
     * @param {Ellipsoid} [ellipsoid=WGS84] The ellipsoid.
     */
    ScreenSpaceCameraController.prototype.setEllipsoid = function(ellipsoid) {
        ellipsoid = ellipsoid || Ellipsoid.WGS84;
        var radius = ellipsoid.getMaximumRadius();
        this._ellipsoid = ellipsoid;
        this._rotateFactor = 1.0 / radius;
        this._rotateRateRangeAdjustment = radius;
    };

    function decay(time, coefficient) {
        if (time < 0) {
            return 0.0;
        }

        var tau = (1.0 - coefficient) * 25.0;
        return Math.exp(-tau * time);
    }

    function sameMousePosition(movement) {
        return Cartesian2.equalsEpsilon(movement.startPosition, movement.endPosition, CesiumMath.EPSILON14);
    }

    // If the time between mouse down and mouse up is not between
    // these thresholds, the camera will not move with inertia.
    // This value is probably dependent on the browser and/or the
    // hardware. Should be investigated further.
    var inertiaMaxClickTimeThreshold = 0.4;

    function maintainInertia(aggregator, type, modifier, decayCoef, action, object, lastMovementName) {
        var movementState = object[lastMovementName];
        if (!defined(movementState)) {
            movementState = object[lastMovementName] = {
                startPosition : new Cartesian2(),
                endPosition : new Cartesian2(),
                motion : new Cartesian2(),
                active : false
            };
        }

        var ts = aggregator.getButtonPressTime(type, modifier);
        var tr = aggregator.getButtonReleaseTime(type, modifier);

        var threshold = ts && tr && ((tr.getTime() - ts.getTime()) / 1000.0);
        var now = new Date();
        var fromNow = tr && ((now.getTime() - tr.getTime()) / 1000.0);

        if (ts && tr && threshold < inertiaMaxClickTimeThreshold) {
            var d = decay(fromNow, decayCoef);

            if (!movementState.active) {
                var lastMovement = aggregator.getLastMovement(type, modifier);
                if (!defined(lastMovement) || sameMousePosition(lastMovement)) {
                    return;
                }

                movementState.motion.x = (lastMovement.endPosition.x - lastMovement.startPosition.x) * 0.5;
                movementState.motion.y = (lastMovement.endPosition.y - lastMovement.startPosition.y) * 0.5;

                Cartesian2.clone(lastMovement.startPosition, movementState.startPosition);

                Cartesian2.multiplyByScalar(movementState.motion, d, movementState.endPosition);
                Cartesian2.add(movementState.startPosition, movementState.endPosition, movementState.endPosition);

                movementState.active = true;
            } else {
                Cartesian2.clone(movementState.endPosition, movementState.startPosition);

                Cartesian2.multiplyByScalar(movementState.motion, d, movementState.endPosition);
                Cartesian2.add(movementState.startPosition, movementState.endPosition, movementState.endPosition);

                Cartesian3.clone(Cartesian2.ZERO, movementState.motion);
            }

            // If value from the decreasing exponential function is close to zero,
            // the end coordinates may be NaN.
            if (isNaN(movementState.endPosition.x) || isNaN(movementState.endPosition.y) || sameMousePosition(movementState)) {
                movementState.active = false;
                return;
            }

            if (!aggregator.isButtonDown(type, modifier)) {
                action(object, movementState);
            }
        } else {
            movementState.active = false;
        }
    }

    var scratchEventTypeArray = [];

    function reactToInput(controller, enabled, eventTypes, action, inertiaConstant, inertiaStateName) {
        if (!defined(eventTypes)) {
            return;
        }

        var aggregator = controller._aggregator;

        if (!Array.isArray(eventTypes)) {
            scratchEventTypeArray[0] = eventTypes;
            eventTypes = scratchEventTypeArray;
        }

        var length = eventTypes.length;
        for (var i = 0; i < length; ++i) {
            var eventType = eventTypes[i];
            var type = defined(eventType.eventType) ? eventType.eventType : eventType;
            var modifier = eventType.modifier;

            var moving = aggregator.isMoving(type, modifier) && aggregator.getMovement(type, modifier);

            if (enabled) {
                if (moving) {
                    action(controller, aggregator.getMovement(type, modifier));
                } else if (inertiaConstant < 1.0) {
                    maintainInertia(aggregator, type, modifier, inertiaConstant, action, controller, inertiaStateName);
                }
            }
        }
    }

    function handleZoom(object, movement, zoomFactor, distanceMeasure, unitPositionDotDirection) {
        var percentage = 1.0;
        if (defined(unitPositionDotDirection)) {
            percentage = CesiumMath.clamp(Math.abs(unitPositionDotDirection), 0.25, 1.0);
        }

        // distanceMeasure should be the height above the ellipsoid.
        // The zoomRate slows as it approaches the surface and stops minimumZoomDistance above it.
        var minHeight = object.minimumZoomDistance * percentage;
        var maxHeight = object.maximumZoomDistance;

        var minDistance = distanceMeasure - minHeight;
        var zoomRate = zoomFactor * minDistance;
        zoomRate = CesiumMath.clamp(zoomRate, object._minimumZoomRate, object._maximumZoomRate);

        var diff = movement.endPosition.y - movement.startPosition.y;
        var rangeWindowRatio = diff / object._canvas.clientHeight;
        rangeWindowRatio = Math.min(rangeWindowRatio, object.maximumMovementRatio);
        var distance = zoomRate * rangeWindowRatio;

        if (distance > 0.0 && Math.abs(distanceMeasure - minHeight) < 1.0) {
            return;
        }

        if (distance < 0.0 && Math.abs(distanceMeasure - maxHeight) < 1.0) {
            return;
        }

        if (distanceMeasure - distance < minHeight) {
            distance = distanceMeasure - minHeight - 1.0;
        } else if (distanceMeasure - distance > maxHeight) {
            distance = distanceMeasure - maxHeight;
        }

        object._cameraController.zoomIn(distance);
    }

    var translate2DStart = new Ray();
    var translate2DEnd = new Ray();
    function translate2D(controller, movement) {
        var cameraController = controller._cameraController;
        var start = cameraController.getPickRay(movement.startPosition, translate2DStart).origin;
        var end = cameraController.getPickRay(movement.endPosition, translate2DEnd).origin;

        cameraController.moveRight(start.x - end.x);
        cameraController.moveUp(start.y - end.y);
    }

    function zoom2D(controller, movement) {
        if (defined(movement.distance)) {
            movement = movement.distance;
        }

        handleZoom(controller, movement, controller._zoomFactor, controller._cameraController.getMagnitude());
    }

    var twist2DStart = new Cartesian2();
    var twist2DEnd = new Cartesian2();
    function twist2D(controller, movement) {
        if (defined(movement.angleAndHeight)) {
            singleAxisTwist2D(controller, movement.angleAndHeight);
            return;
        }

        var width = controller._canvas.clientWidth;
        var height = controller._canvas.clientHeight;

        var start = twist2DStart;
        start.x = (2.0 / width) * movement.startPosition.x - 1.0;
        start.y = (2.0 / height) * (height - movement.startPosition.y) - 1.0;
        Cartesian2.normalize(start, start);

        var end = twist2DEnd;
        end.x = (2.0 / width) * movement.endPosition.x - 1.0;
        end.y = (2.0 / height) * (height - movement.endPosition.y) - 1.0;
        Cartesian2.normalize(end, end);

        var startTheta = Math.acos(start.x);
        if (start.y < 0) {
            startTheta = CesiumMath.TWO_PI - startTheta;
        }
        var endTheta = Math.acos(end.x);
        if (end.y < 0) {
            endTheta = CesiumMath.TWO_PI - endTheta;
        }
        var theta = endTheta - startTheta;

        controller._cameraController.twistRight(theta);
    }

    function singleAxisTwist2D(controller, movement) {
        var rotateRate = controller._rotateFactor * controller._rotateRateRangeAdjustment;

        if (rotateRate > controller._maximumRotateRate) {
            rotateRate = controller._maximumRotateRate;
        }

        if (rotateRate < controller._minimumRotateRate) {
            rotateRate = controller._minimumRotateRate;
        }

        var phiWindowRatio = (movement.endPosition.x - movement.startPosition.x) / controller._canvas.clientWidth;
        phiWindowRatio = Math.min(phiWindowRatio, controller.maximumMovementRatio);

        var deltaPhi = rotateRate * phiWindowRatio * Math.PI * 4.0;

        controller._cameraController.twistRight(deltaPhi);
    }

    function update2D(controller) {
        if (controller._aggregator.anyButtonDown()) {
            controller._animationCollection.removeAll();
        }

        reactToInput(controller, controller.enableTranslate, controller.translateEventTypes, translate2D, controller.inertiaTranslate, '_lastInertiaTranslateMovement');
        reactToInput(controller, controller.enableZoom, controller.zoomEventTypes, zoom2D, controller.inertiaZoom, '_lastInertiaZoomMovement');
        reactToInput(controller, controller.enableRotate, controller.tiltEventTypes, twist2D, controller.inertiaSpin, '_lastInertiaTiltMovement');

        if (!controller._aggregator.anyButtonDown() &&
                (!defined(controller._lastInertiaZoomMovement) || !controller._lastInertiaZoomMovement.active) &&
                (!defined(controller._lastInertiaTranslateMovement) || !controller._lastInertiaTranslateMovement.active) &&
                !controller._animationCollection.contains(controller._animation)) {
            var animation = controller._cameraController.createCorrectPositionAnimation(controller.bounceAnimationTime);
            if (defined(animation)) {
                controller._animation = controller._animationCollection.add(animation);
            }
        }

        controller._animationCollection.update();
    }

    var translateCVStartRay = new Ray();
    var translateCVEndRay = new Ray();
    var translateCVStartPos = new Cartesian3();
    var translateCVEndPos = new Cartesian3();
    var translatCVDifference = new Cartesian3();
    function translateCV(controller, movement) {
        var cameraController = controller._cameraController;
        var startRay = cameraController.getPickRay(movement.startPosition, translateCVStartRay);
        var endRay = cameraController.getPickRay(movement.endPosition, translateCVEndRay);
        var normal = Cartesian3.UNIT_X;

        var position = startRay.origin;
        var direction = startRay.direction;
        var scalar = -Cartesian3.dot(normal, position) / Cartesian3.dot(normal, direction);
        var startPlanePos = Cartesian3.multiplyByScalar(direction, scalar, translateCVStartPos);
        Cartesian3.add(position, startPlanePos, startPlanePos);

        position = endRay.origin;
        direction = endRay.direction;
        scalar = -Cartesian3.dot(normal, position) / Cartesian3.dot(normal, direction);
        var endPlanePos = Cartesian3.multiplyByScalar(direction, scalar, translateCVEndPos);
        Cartesian3.add(position, endPlanePos, endPlanePos);

        var diff = Cartesian3.subtract(startPlanePos, endPlanePos, translatCVDifference);
        var temp = diff.x;
        diff.x = diff.y;
        diff.y = diff.z;
        diff.z = temp;
        var mag = Cartesian3.magnitude(diff);
        if (mag > CesiumMath.EPSILON6) {
            Cartesian3.normalize(diff, diff);
            cameraController.move(diff, mag);
        }
    }

    var rotateCVWindowPos = new Cartesian2();
    var rotateCVWindowRay = new Ray();
    var rotateCVCenter = new Cartesian3();
    var rotateTransform = new Matrix4();
    function rotateCV(controller, movement) {
        if (defined(movement.angleAndHeight)) {
            movement = movement.angleAndHeight;
        }

        var windowPosition = rotateCVWindowPos;
        windowPosition.x = controller._canvas.clientWidth / 2;
        windowPosition.y = controller._canvas.clientHeight / 2;
        var ray = controller._cameraController.getPickRay(windowPosition, rotateCVWindowRay);
        var normal = Cartesian3.UNIT_X;

        var position = ray.origin;
        var direction = ray.direction;
        var scalar = -Cartesian3.dot(normal, position) / Cartesian3.dot(normal, direction);
        var center = Cartesian3.multiplyByScalar(direction, scalar, rotateCVCenter);
        Cartesian3.add(position, center, center);
        var transform = Matrix4.fromTranslation(center, rotateTransform);

        var oldEllipsoid = controller._ellipsoid;
        controller.setEllipsoid(Ellipsoid.UNIT_SPHERE);

        rotate3D(controller, movement, transform, Cartesian3.UNIT_Z);

        controller.setEllipsoid(oldEllipsoid);
    }

    var zoomCVWindowPos = new Cartesian2();
    var zoomCVWindowRay = new Ray();
    function zoomCV(controller, movement) {
        if (defined(movement.distance)) {
            movement = movement.distance;
        }

        var windowPosition = zoomCVWindowPos;
        windowPosition.x = controller._canvas.clientWidth / 2;
        windowPosition.y = controller._canvas.clientHeight / 2;
        var ray = controller._cameraController.getPickRay(windowPosition, zoomCVWindowRay);
        var normal = Cartesian3.UNIT_X;

        var position = ray.origin;
        var direction = ray.direction;
        var scalar = -Cartesian3.dot(normal, position) / Cartesian3.dot(normal, direction);

        handleZoom(controller, movement, controller._zoomFactor, scalar);
    }

    function updateCV(controller) {
        if (controller.columbusViewMode === CameraColumbusViewMode.LOCKED) {
                reactToInput(controller, controller.enableRotate, controller.rotateEventTypes, rotate3D, controller.inertiaSpin, '_lastInertiaSpinMovement');
                reactToInput(controller, controller.enableZoom, controller.zoomEventTypes, zoom3D, controller.inertiaZoom, '_lastInertiaZoomMovement');
        } else {
            if (controller._aggregator.anyButtonDown()) {
                controller._animationCollection.removeAll();
            }

            reactToInput(controller, controller.enableTilt, controller.tiltEventTypes, rotateCV, controller.inertiaSpin, '_lastInertiaTiltMovement');
            reactToInput(controller, controller.enableTranslate, controller.translateEventTypes, translateCV, controller.inertiaTranslate, '_lastInertiaTranslateMovement');
            reactToInput(controller, controller.enableZoom, controller.zoomEventTypes, zoomCV, controller.inertiaZoom, '_lastInertiaZoomMovement');
            reactToInput(controller, controller.enableLook, controller.lookEventTypes, look3D);

            if (!controller._aggregator.anyButtonDown() && (!defined(controller._lastInertiaZoomMovement) || !controller._lastInertiaZoomMovement.active) &&
                    (!defined(controller._lastInertiaTranslateMovement) || !controller._lastInertiaTranslateMovement.active) &&
                    !controller._animationCollection.contains(controller._animation)) {
                var animation = controller._cameraController.createCorrectPositionAnimation(controller.bounceAnimationTime);
                if (defined(animation)) {
                    controller._animation = controller._animationCollection.add(animation);
                }
            }

            controller._animationCollection.update();
        }
    }

    var spin3DPick = new Cartesian3();
    function spin3D(controller, movement) {
        if (defined(controller._cameraController.pickEllipsoid(movement.startPosition, controller._ellipsoid, spin3DPick))) {
            pan3D(controller, movement);
        } else {
            rotate3D(controller, movement);
        }
    }

    var rotate3DRestrictedDirection = Cartesian3.clone(Cartesian3.ZERO);
    var rotate3DScratchCartesian3 = new Cartesian3();
    var rotate3DNegateScratch = new Cartesian3();
    var rotate3DInverseMatrixScratch = new Matrix4();

    function rotate3D(controller, movement, transform, constrainedAxis, restrictedAngle) {
        var cameraController = controller._cameraController;
        var oldAxis = cameraController.constrainedAxis;
        if (defined(constrainedAxis)) {
            cameraController.constrainedAxis = constrainedAxis;
        }

        // CAMERA TODO: remove access to camera, fixes a problem in Columbus view
        //var rho = cameraController.getMagnitude();
        var rho = Cartesian3.magnitude(cameraController._camera.position);
        var rotateRate = controller._rotateFactor * (rho - controller._rotateRateRangeAdjustment);

        if (rotateRate > controller._maximumRotateRate) {
            rotateRate = controller._maximumRotateRate;
        }

        if (rotateRate < controller._minimumRotateRate) {
            rotateRate = controller._minimumRotateRate;
        }

        var phiWindowRatio = (movement.startPosition.x - movement.endPosition.x) / controller._canvas.clientWidth;
        var thetaWindowRatio = (movement.startPosition.y - movement.endPosition.y) / controller._canvas.clientHeight;
        phiWindowRatio = Math.min(phiWindowRatio, controller.maximumMovementRatio);
        thetaWindowRatio = Math.min(thetaWindowRatio, controller.maximumMovementRatio);

        var deltaPhi = rotateRate * phiWindowRatio * Math.PI * 2.0;
        var deltaTheta = rotateRate * thetaWindowRatio * Math.PI;

        if (defined(cameraController.constrainedAxis) && !defined(transform)) {
            var camera = cameraController._camera;
            var positionNormal = Cartesian3.normalize(camera.position, rotate3DScratchCartesian3);
            var northParallel = Cartesian3.equalsEpsilon(positionNormal, cameraController.constrainedAxis, CesiumMath.EPSILON2);
            var southParallel = Cartesian3.equalsEpsilon(positionNormal, Cartesian3.negate(cameraController.constrainedAxis, rotate3DNegateScratch), CesiumMath.EPSILON2);

            if (!northParallel && !southParallel) {
                var up;
                if (Cartesian3.dot(camera.position, camera.direction) + 1 < CesiumMath.EPSILON4) {
                    up = camera.up;
                } else {
                    up = camera.direction;
                }

                var east;
                if (Cartesian3.equalsEpsilon(cameraController.constrainedAxis, positionNormal, CesiumMath.EPSILON2)) {
                    east = camera.right;
                } else {
                    east = Cartesian3.cross(cameraController.constrainedAxis, positionNormal, rotate3DScratchCartesian3);
                    Cartesian3.normalize(east, east);
                }

                var rDotE = Cartesian3.dot(camera.right, east);
                var signRDotE = (CesiumMath.sign(rDotE) < 0.0) ? -1.0 : 1.0;
                rDotE = Math.abs(rDotE);
                var uDotA = Cartesian3.dot(up, cameraController.constrainedAxis);
                var uDotE = Cartesian3.dot(up, east);
                var signInnerSum = ((uDotA > 0.0 && uDotE > 0.0) || (uDotA < 0.0 && uDotE < 0.0)) ? -1.0 : 1.0;
                uDotA = Math.abs(uDotA);

                var originalDeltaTheta = deltaTheta;
                deltaTheta = signRDotE * (deltaTheta * uDotA - signInnerSum * deltaPhi * (1.0 - rDotE));
                deltaPhi = signRDotE * (deltaPhi * rDotE + signInnerSum * originalDeltaTheta * (1.0 - uDotA));
            }
        }

        cameraController.rotateRight(deltaPhi, transform);
        cameraController.rotateUp(deltaTheta, transform);

        if (defined(restrictedAngle)) {
            var direction = Cartesian3.clone(cameraController._camera.directionWC, rotate3DRestrictedDirection);
            var invTransform = Matrix4.inverseTransformation(transform, rotate3DInverseMatrixScratch);
            direction = Matrix4.multiplyByPointAsVector(invTransform, direction, direction);

            var dot = -Cartesian3.dot(direction, constrainedAxis);
            var angle = Math.acos(dot);
            if (angle > restrictedAngle) {
                angle -= restrictedAngle;
                cameraController.rotateUp(-angle, transform);
            }
        }

        cameraController.constrainedAxis = oldAxis;
    }

    var pan3DP0 = Cartesian4.clone(Cartesian4.UNIT_W);
    var pan3DP1 = Cartesian4.clone(Cartesian4.UNIT_W);
    var pan3DTemp0 = new Cartesian3();
    var pan3DTemp1 = new Cartesian3();
    var pan3DTemp2 = new Cartesian3();
    var pan3DTemp3 = new Cartesian3();
    function pan3D(controller, movement) {
        var cameraController = controller._cameraController;
        var p0 = cameraController.pickEllipsoid(movement.startPosition, controller._ellipsoid, pan3DP0);
        var p1 = cameraController.pickEllipsoid(movement.endPosition, controller._ellipsoid, pan3DP1);

        if (!defined(p0) || !defined(p1)) {
            return;
        }

        // CAMERA TODO: remove access to camera
        p0 = cameraController._camera.worldToCameraCoordinates(p0, p0);
        p1 = cameraController._camera.worldToCameraCoordinates(p1, p1);

        if (!defined(cameraController.constrainedAxis)) {
            Cartesian3.normalize(p0, p0);
            Cartesian3.normalize(p1, p1);
            var dot = Cartesian3.dot(p0, p1);
            var axis = Cartesian3.cross(p0, p1, pan3DTemp0);

            if (dot < 1.0 && !Cartesian3.equalsEpsilon(axis, Cartesian3.ZERO, CesiumMath.EPSILON14)) { // dot is in [0, 1]
                var angle = Math.acos(dot);
                cameraController.rotate(axis, angle);
            }
        } else {
            var basis0 = cameraController.constrainedAxis;
            var basis1 = Cartesian3.mostOrthogonalAxis(basis0, pan3DTemp0);
            Cartesian3.cross(basis1, basis0, basis1);
            Cartesian3.normalize(basis1, basis1);
            var basis2 = Cartesian3.cross(basis0, basis1, pan3DTemp1);

            var startRho = Cartesian3.magnitude(p0);
            var startDot = Cartesian3.dot(basis0, p0);
            var startTheta = Math.acos(startDot / startRho);
            var startRej = Cartesian3.multiplyByScalar(basis0, startDot, pan3DTemp2);
            Cartesian3.subtract(p0, startRej, startRej);
            Cartesian3.normalize(startRej, startRej);

            var endRho = Cartesian3.magnitude(p1);
            var endDot = Cartesian3.dot(basis0, p1);
            var endTheta = Math.acos(endDot / endRho);
            var endRej = Cartesian3.multiplyByScalar(basis0, endDot, pan3DTemp3);
            Cartesian3.subtract(p1, endRej, endRej);
            Cartesian3.normalize(endRej, endRej);

            var startPhi = Math.acos(Cartesian3.dot(startRej, basis1));
            if (Cartesian3.dot(startRej, basis2) < 0) {
                startPhi = CesiumMath.TWO_PI - startPhi;
            }

            var endPhi = Math.acos(Cartesian3.dot(endRej, basis1));
            if (Cartesian3.dot(endRej, basis2) < 0) {
                endPhi = CesiumMath.TWO_PI - endPhi;
            }

            var deltaPhi = startPhi - endPhi;

            var east;
            if (Cartesian3.equalsEpsilon(basis0, cameraController._camera.position, CesiumMath.EPSILON2)) {
                east = cameraController._camera.right;
            } else {
                east = Cartesian3.cross(basis0, cameraController._camera.position, pan3DTemp0);
            }

            var planeNormal = Cartesian3.cross(basis0, east, pan3DTemp0);
            var side0 = Cartesian3.dot(planeNormal, Cartesian3.subtract(p0, basis0, pan3DTemp1));
            var side1 = Cartesian3.dot(planeNormal, Cartesian3.subtract(p1, basis0, pan3DTemp1));

            var deltaTheta;
            if (side0 > 0 && side1 > 0) {
                deltaTheta = endTheta - startTheta;
            } else if (side0 > 0 && side1 <= 0) {
                if (Cartesian3.dot(cameraController._camera.position, basis0) > 0) {
                    deltaTheta = -startTheta - endTheta;
                } else {
                    deltaTheta = startTheta + endTheta;
                }
            } else {
                deltaTheta = startTheta - endTheta;
            }

            cameraController.rotateRight(deltaPhi);
            cameraController.rotateUp(deltaTheta);
        }
    }

    var zoom3DUnitPosition = new Cartesian3();
    function zoom3D(controller, movement) {
        if (defined(movement.distance)) {
            movement = movement.distance;
        }

        // CAMERA TODO: remove access to camera
        var camera = controller._cameraController._camera;
        var ellipsoid = controller._ellipsoid;

        var height = ellipsoid.cartesianToCartographic(camera.position).height;
        var unitPosition = Cartesian3.normalize(camera.position, zoom3DUnitPosition);

        handleZoom(controller, movement, controller._zoomFactor, height, Cartesian3.dot(unitPosition, camera.direction));
    }

    var tilt3DWindowPos = new Cartesian2();
    var tilt3DRay = new Ray();
    var tilt3DCart = new Cartographic();
    var tilt3DCenter = Cartesian4.clone(Cartesian4.UNIT_W);
    var tilt3DTransform = new Matrix4();

    function tilt3D(controller, movement) {
        if (defined(movement.angleAndHeight)) {
            movement = movement.angleAndHeight;
        }

        var cameraController = controller._cameraController;

        var ellipsoid = controller._ellipsoid;
        var minHeight = controller.minimumZoomDistance * 0.25;
        var height = ellipsoid.cartesianToCartographic(controller._cameraController._camera.position).height;
        if (height - minHeight - 1.0 < CesiumMath.EPSILON3 &&
                movement.endPosition.y - movement.startPosition.y < 0) {
            return;
        }

        var windowPosition = tilt3DWindowPos;
        windowPosition.x = controller._canvas.clientWidth / 2;
        windowPosition.y = controller._canvas.clientHeight / 2;
        var ray = cameraController.getPickRay(windowPosition, tilt3DRay);

        var center;
        var intersection = IntersectionTests.rayEllipsoid(ray, ellipsoid);
        if (defined(intersection)) {
            center = ray.getPoint(intersection.start, tilt3DCenter);
        } else {
            var grazingAltitudeLocation = IntersectionTests.grazingAltitudeLocation(ray, ellipsoid);
            if (!defined(grazingAltitudeLocation)) {
                return;
            }
            var grazingAltitudeCart = ellipsoid.cartesianToCartographic(grazingAltitudeLocation, tilt3DCart);
            grazingAltitudeCart.height = 0.0;
            center = ellipsoid.cartographicToCartesian(grazingAltitudeCart, tilt3DCenter);
        }

        // CAMERA TODO: Remove the need for camera access
        var camera = cameraController._camera;
        center = camera.worldToCameraCoordinates(center, center);
        var transform = Transforms.eastNorthUpToFixedFrame(center, ellipsoid, tilt3DTransform);

        var oldEllipsoid = controller._ellipsoid;
        controller.setEllipsoid(Ellipsoid.UNIT_SPHERE);

        var angle = (minHeight * 0.25) / Cartesian3.distance(center, camera.position);
        rotate3D(controller, movement, transform, Cartesian3.UNIT_Z, CesiumMath.PI_OVER_TWO - angle);

        controller.setEllipsoid(oldEllipsoid);
    }

    var look3DStartPos = new Cartesian2();
    var look3DEndPos = new Cartesian2();
    var look3DStartRay = new Ray();
    var look3DEndRay = new Ray();
    function look3D(controller, movement) {
        var cameraController = controller._cameraController;

        var startPos = look3DStartPos;
        startPos.x = movement.startPosition.x;
        startPos.y = 0.0;
        var endPos = look3DEndPos;
        endPos.x = movement.endPosition.x;
        endPos.y = 0.0;
        var start = cameraController.getPickRay(startPos, look3DStartRay).direction;
        var end = cameraController.getPickRay(endPos, look3DEndRay).direction;

        var angle = 0.0;
        var dot = Cartesian3.dot(start, end);
        if (dot < 1.0) { // dot is in [0, 1]
            angle = Math.acos(dot);
        }
        angle = (movement.startPosition.x > movement.endPosition.x) ? -angle : angle;
        var rotationAxis = controller._horizontalRotationAxis;
        if (defined(rotationAxis)) {
            cameraController.look(rotationAxis, angle);
        } else {
            cameraController.lookLeft(angle);
        }

        startPos.x = 0.0;
        startPos.y = movement.startPosition.y;
        endPos.x = 0.0;
        endPos.y = movement.endPosition.y;
        start = cameraController.getPickRay(startPos, look3DStartRay).direction;
        end = cameraController.getPickRay(endPos, look3DEndRay).direction;

        angle = 0.0;
        dot = Cartesian3.dot(start, end);
        if (dot < 1.0) { // dot is in [0, 1]
            angle = Math.acos(dot);
        }
        angle = (movement.startPosition.y > movement.endPosition.y) ? -angle : angle;
        cameraController.lookUp(angle);
    }

    function update3D(controller) {
        reactToInput(controller, controller.enableRotate, controller.rotateEventTypes, spin3D, controller.inertiaSpin, '_lastInertiaSpinMovement');
        reactToInput(controller, controller.enableZoom, controller.zoomEventTypes, zoom3D, controller.inertiaZoom, '_lastInertiaZoomMovement');
        reactToInput(controller, controller.enableTilt, controller.tiltEventTypes, tilt3D, controller.inertiaSpin, '_lastInertiaTiltMovement');
        reactToInput(controller, controller.enableLook, controller.lookEventTypes, look3D);
    }

    /**
     * @private
     */
    ScreenSpaceCameraController.prototype.update = function(mode) {
        if (mode === SceneMode.SCENE2D) {
            update2D(this);
        } else if (mode === SceneMode.COLUMBUS_VIEW) {
            this._horizontalRotationAxis = Cartesian3.UNIT_Z;
            updateCV(this);
        } else if (mode === SceneMode.SCENE3D) {
            this._horizontalRotationAxis = undefined;
            update3D(this);
        }

        this._aggregator.reset();
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @memberof ScreenSpaceCameraController
     *
     * @returns {Boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
     *
     * @see ScreenSpaceCameraController#destroy
     */
    ScreenSpaceCameraController.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Removes mouse listeners held by this object.
     * <br /><br />
     * Once an object is destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.  Therefore,
     * assign the return value (<code>undefined</code>) to the object as done in the example.
     *
     * @memberof ScreenSpaceCameraController
     *
     * @returns {undefined}
     *
     * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
     *
     * @see ScreenSpaceCameraController#isDestroyed
     *
     * @example
     * controller = controller && controller.destroy();
     */
    ScreenSpaceCameraController.prototype.destroy = function() {
        this._spinHandler = this._spinHandler && this._spinHandler.destroy();
        this._translateHandler = this._translateHandler && this._translateHandler.destroy();
        this._lookHandler = this._lookHandler && this._lookHandler.destroy();
        this._rotateHandler = this._rotateHandler && this._rotateHandler.destroy();
        this._zoomHandler = this._zoomHandler && this._zoomHandler.destroy();
        this._zoomWheelHandler = this._zoomWheelHandler && this._zoomWheelHandler.destroy();
        this._pinchHandler = this._pinchHandler && this._pinchHandler.destroy();
        return destroyObject(this);
    };

    return ScreenSpaceCameraController;
});
