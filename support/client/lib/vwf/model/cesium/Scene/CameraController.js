/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Cartesian4',
        '../Core/Cartographic',
        '../Core/DeveloperError',
        '../Core/Ellipsoid',
        '../Core/GeographicProjection',
        '../Core/IntersectionTests',
        '../Core/Math',
        '../Core/Matrix3',
        '../Core/Matrix4',
        '../Core/Quaternion',
        '../Core/Ray',
        '../Core/Transforms',
        './SceneMode',
        '../ThirdParty/Tween'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        Cartesian2,
        Cartesian3,
        Cartesian4,
        Cartographic,
        DeveloperError,
        Ellipsoid,
        GeographicProjection,
        IntersectionTests,
        CesiumMath,
        Matrix3,
        Matrix4,
        Quaternion,
        Ray,
        Transforms,
        SceneMode,
        Tween) {
    "use strict";

    /**
     * Provides methods for common camera manipulations.
     *
     * @alias CameraController
     * @constructor
     *
     * @exception {DeveloperError} camera is required.
     */
    var CameraController = function(camera) {
        if (!defined(camera)) {
            throw new DeveloperError('camera is required.');
        }

        this._camera = camera;
        this._mode = SceneMode.SCENE3D;
        this._projection = new GeographicProjection();

        /**
         * The default amount to move the camera when an argument is not
         * provided to the move methods.
         * @type {Number}
         * @default 100000.0;
         */
        this.defaultMoveAmount = 100000.0;
        /**
         * The default amount to rotate the camera when an argument is not
         * provided to the look methods.
         * @type {Number}
         * @default Math.PI / 60.0
         */
        this.defaultLookAmount = Math.PI / 60.0;
        /**
         * The default amount to rotate the camera when an argument is not
         * provided to the rotate methods.
         * @type {Number}
         * @default Math.PI / 3600.0
         */
        this.defaultRotateAmount = Math.PI / 3600.0;
        /**
         * The default amount to move the camera when an argument is not
         * provided to the zoom methods.
         * @type {Number}
         * @default 100000.0;
         */
        this.defaultZoomAmount = 100000.0;
        /**
         * If set, the camera will not be able to rotate past this axis in either direction.
         * @type {Cartesian3}
         * @default undefined
         */
        this.constrainedAxis = undefined;
        /**
         * The factor multiplied by the the map size used to determine where to clamp the camera position
         * when translating across the surface. The default is 1.5. Only valid for 2D and Columbus view.
         * @type {Number}
         * @default 1.5
         */
        this.maximumTranslateFactor = 1.5;
        /**
         * The factor multiplied by the the map size used to determine where to clamp the camera position
         * when zooming out from the surface. The default is 2.5. Only valid for 2D.
         * @type {Number}
         * @default 2.5
         */
        this.maximumZoomFactor = 2.5;

        this._maxCoord = new Cartesian3();
        this._frustum = undefined;
    };

    var scratchUpdateCartographic = new Cartographic(Math.PI, CesiumMath.PI_OVER_TWO);
    /**
     * @private
     */
    CameraController.prototype.update = function(mode, scene2D) {
        var updateFrustum = false;
        if (mode !== this._mode) {
            this._mode = mode;
            updateFrustum = this._mode === SceneMode.SCENE2D;
        }

        var projection = scene2D.projection;
        if (defined(projection) && projection !== this._projection) {
            this._projection = projection;
            this._maxCoord = projection.project(scratchUpdateCartographic, this._maxCoord);
        }

        if (updateFrustum) {
            var frustum = this._frustum = this._camera.frustum.clone();
            if (!defined(frustum.left) || !defined(frustum.right) ||
               !defined(frustum.top) || !defined(frustum.bottom)) {
                throw new DeveloperError('The camera frustum is expected to be orthographic for 2D camera control.');
            }

            var maxZoomOut = 2.0;
            var ratio = frustum.top / frustum.right;
            frustum.right = this._maxCoord.x * maxZoomOut;
            frustum.left = -frustum.right;
            frustum.top = ratio * frustum.right;
            frustum.bottom = -frustum.top;
        }
    };

    function clampMove2D(controller, position) {
        var maxX = controller._maxCoord.x * controller.maximumTranslateFactor;
        if (position.x > maxX) {
            position.x = maxX;
        }
        if (position.x < -maxX) {
            position.x = -maxX;
        }

        var maxY = controller._maxCoord.y * controller.maximumTranslateFactor;
        if (position.y > maxY) {
            position.y = maxY;
        }
        if (position.y < -maxY) {
            position.y = -maxY;
        }
    }

    var moveScratch = new Cartesian3();
    /**
     * Translates the camera's position by <code>amount</code> along <code>direction</code>.
     *
     * @memberof CameraController
     *
     * @param {Cartesian3} direction The direction to move.
     * @param {Number} [amount] The amount, in meters, to move. Defaults to <code>defaultMoveAmount</code>.
     *
     * @exception {DeveloperError} direction is required.
     *
     * @see CameraController#moveBackward
     * @see CameraController#moveForward
     * @see CameraController#moveLeft
     * @see CameraController#moveRight
     * @see CameraController#moveUp
     * @see CameraController#moveDown
     */
    CameraController.prototype.move = function(direction, amount) {
        if (!defined(direction)) {
            throw new DeveloperError('direction is required.');
        }

        var cameraPosition = this._camera.position;
        Cartesian3.multiplyByScalar(direction, amount, moveScratch);
        Cartesian3.add(cameraPosition, moveScratch, cameraPosition);

        if (this._mode === SceneMode.SCENE2D) {
            clampMove2D(this, cameraPosition);
        }
    };

    /**
     * Translates the camera's position by <code>amount</code> along the camera's view vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in meters, to move. Defaults to <code>defaultMoveAmount</code>.
     *
     * @see CameraController#moveBackward
     */
    CameraController.prototype.moveForward = function(amount) {
        amount = defaultValue(amount, this.defaultMoveAmount);
        this.move(this._camera.direction, amount);
    };

    /**
     * Translates the camera's position by <code>amount</code> along the opposite direction
     * of the camera's view vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in meters, to move. Defaults to <code>defaultMoveAmount</code>.
     *
     * @see CameraController#moveForward
     */
    CameraController.prototype.moveBackward = function(amount) {
        amount = defaultValue(amount, this.defaultMoveAmount);
        this.move(this._camera.direction, -amount);
    };

    /**
     * Translates the camera's position by <code>amount</code> along the camera's up vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in meters, to move. Defaults to <code>defaultMoveAmount</code>.
     *
     * @see CameraController#moveDown
     */
    CameraController.prototype.moveUp = function(amount) {
        amount = defaultValue(amount, this.defaultMoveAmount);
        this.move(this._camera.up, amount);
    };

    /**
     * Translates the camera's position by <code>amount</code> along the opposite direction
     * of the camera's up vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in meters, to move. Defaults to <code>defaultMoveAmount</code>.
     *
     * @see CameraController#moveUp
     */
    CameraController.prototype.moveDown = function(amount) {
        amount = defaultValue(amount, this.defaultMoveAmount);
        this.move(this._camera.up, -amount);
    };

    /**
     * Translates the camera's position by <code>amount</code> along the camera's right vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in meters, to move. Defaults to <code>defaultMoveAmount</code>.
     *
     * @see CameraController#moveLeft
     */
    CameraController.prototype.moveRight = function(amount) {
        amount = defaultValue(amount, this.defaultMoveAmount);
        this.move(this._camera.right, amount);
    };

    /**
     * Translates the camera's position by <code>amount</code> along the opposite direction
     * of the camera's right vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in meters, to move. Defaults to <code>defaultMoveAmount</code>.
     *
     * @see CameraController#moveRight
     */
    CameraController.prototype.moveLeft = function(amount) {
        amount = defaultValue(amount, this.defaultMoveAmount);
        this.move(this._camera.right, -amount);
    };

    /**
     * Rotates the camera around its up vector by amount, in radians, in the opposite direction
     * of its right vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in radians, to rotate by. Defaults to <code>defaultLookAmount</code>.
     *
     * @see CameraController#lookRight
     */
    CameraController.prototype.lookLeft = function(amount) {
        amount = defaultValue(amount, this.defaultLookAmount);
        this.look(this._camera.up, -amount);
    };

    /**
     * Rotates the camera around its up vector by amount, in radians, in the direction
     * of its right vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in radians, to rotate by. Defaults to <code>defaultLookAmount</code>.
     *
     * @see CameraController#lookLeft
     */
    CameraController.prototype.lookRight = function(amount) {
        amount = defaultValue(amount, this.defaultLookAmount);
        this.look(this._camera.up, amount);
    };

    /**
     * Rotates the camera around its right vector by amount, in radians, in the direction
     * of its up vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in radians, to rotate by. Defaults to <code>defaultLookAmount</code>.
     *
     * @see CameraController#lookDown
     */
    CameraController.prototype.lookUp = function(amount) {
        amount = defaultValue(amount, this.defaultLookAmount);
        this.look(this._camera.right, -amount);
    };

    /**
     * Rotates the camera around its right vector by amount, in radians, in the opposite direction
     * of its up vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in radians, to rotate by. Defaults to <code>defaultLookAmount</code>.
     *
     * @see CameraController#lookUp
     */
    CameraController.prototype.lookDown = function(amount) {
        amount = defaultValue(amount, this.defaultLookAmount);
        this.look(this._camera.right, amount);
    };

    var lookScratchQuaternion = new Quaternion();
    var lookScratchMatrix = new Matrix3();
    /**
     * Rotate each of the camera's orientation vectors around <code>axis</code> by <code>angle</code>
     *
     * @memberof CameraController
     *
     * @param {Cartesian3} axis The axis to rotate around.
     * @param {Number} [angle] The angle, in radians, to rotate by. Defaults to <code>defaultLookAmount</code>.
     *
     * @exception {DeveloperError} axis is required.
     *
     * @see CameraController#lookUp
     * @see CameraController#lookDown
     * @see CameraController#lookLeft
     * @see CameraController#lookRight
     */
    CameraController.prototype.look = function(axis, angle) {
        if (!defined(axis)) {
            throw new DeveloperError('axis is required.');
        }

        var turnAngle = defaultValue(angle, this.defaultLookAmount);
        var quaternion = Quaternion.fromAxisAngle(axis, -turnAngle, lookScratchQuaternion);
        var rotation = Matrix3.fromQuaternion(quaternion, lookScratchMatrix);

        var direction = this._camera.direction;
        var up = this._camera.up;
        var right = this._camera.right;

        Matrix3.multiplyByVector(rotation, direction, direction);
        Matrix3.multiplyByVector(rotation, up, up);
        Matrix3.multiplyByVector(rotation, right, right);
    };

    /**
     * Rotate the camera counter-clockwise around its direction vector by amount, in radians.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in radians, to rotate by. Defaults to <code>defaultLookAmount</code>.
     *
     * @see CameraController#twistRight
     */
    CameraController.prototype.twistLeft = function(amount) {
        amount = defaultValue(amount, this.defaultLookAmount);
        this.look(this._camera.direction, amount);
    };

    /**
     * Rotate the camera clockwise around its direction vector by amount, in radians.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount, in radians, to rotate by. Defaults to <code>defaultLookAmount</code>.
     *
     * @see CameraController#twistLeft
     */
    CameraController.prototype.twistRight = function(amount) {
        amount = defaultValue(amount, this.defaultLookAmount);
        this.look(this._camera.direction, -amount);
    };

    var appendTransformPosition = new Cartesian3();
    var appendTransformUp = new Cartesian3();
    var appendTransformRight = new Cartesian3();
    var appendTransformDirection = new Cartesian3();
    var appendTransformMatrix = new Matrix4();

    function appendTransform(controller, transform) {
        var camera = controller._camera;
        var oldTransform;
        if (defined(transform)) {
            var position = Cartesian3.clone(camera.positionWC, appendTransformPosition);
            var up = Cartesian3.clone(camera.upWC, appendTransformUp);
            var right = Cartesian3.clone(camera.rightWC, appendTransformRight);
            var direction = Cartesian3.clone(camera.directionWC, appendTransformDirection);

            oldTransform = camera.transform;
            camera.transform = Matrix4.multiplyTransformation(transform, oldTransform, appendTransformMatrix);

            var invTransform = camera.inverseTransform;
            Matrix4.multiplyByPoint(invTransform, position, camera.position);
            Matrix4.multiplyByPointAsVector(invTransform, up, camera.up);
            Matrix4.multiplyByPointAsVector(invTransform, right, camera.right);
            Matrix4.multiplyByPointAsVector(invTransform, direction, camera.direction);
        }
        return oldTransform;
    }

    var revertTransformPosition = new Cartesian3();
    var revertTransformUp = new Cartesian3();
    var revertTransformRight = new Cartesian3();
    var revertTransformDirection = new Cartesian3();

    function revertTransform(controller, transform) {
        if (defined(transform)) {
            var camera = controller._camera;
            var position = Cartesian3.clone(camera.positionWC, revertTransformPosition);
            var up = Cartesian3.clone(camera.upWC, revertTransformUp);
            var right = Cartesian3.clone(camera.rightWC, revertTransformRight);
            var direction = Cartesian3.clone(camera.directionWC, revertTransformDirection);

            camera.transform = transform;
            transform = camera.inverseTransform;

            Matrix4.multiplyByPoint(transform, position, camera.position);
            Matrix4.multiplyByPointAsVector(transform, up, camera.up);
            Matrix4.multiplyByPointAsVector(transform, right, camera.right);
            Matrix4.multiplyByPointAsVector(transform, direction, camera.direction);
        }
    }

    var rotateScratchQuaternion = new Quaternion();
    var rotateScratchMatrix = new Matrix3();
    /**
     * Rotates the camera around <code>axis</code> by <code>angle</code>. The distance
     * of the camera's position to the center of the camera's reference frame remains the same.
     *
     * @memberof CameraController
     *
     * @param {Cartesian3} axis The axis to rotate around given in world coordinates.
     * @param {Number} [angle] The angle, in radians, to rotate by. Defaults to <code>defaultRotateAmount</code>.
     * @param {Matrix4} [transform] A transform to append to the camera transform before the rotation. Does not alter the camera's transform.
     *
     * @exception {DeveloperError} axis is required.
     *
     * @see CameraController#rotateUp
     * @see CameraController#rotateDown
     * @see CameraController#rotateLeft
     * @see CameraController#rotateRight
     *
     * @example
     * // Rotate about a point on the earth.
     * var center = ellipsoid.cartographicToCartesian(cartographic);
     * var transform = Matrix4.fromTranslation(center);
     * controller.rotate(axis, angle, transform);
    */
    CameraController.prototype.rotate = function(axis, angle, transform) {
        if (!defined(axis)) {
            throw new DeveloperError('axis is required.');
        }

        var camera = this._camera;

        var turnAngle = defaultValue(angle, this.defaultRotateAmount);
        var quaternion = Quaternion.fromAxisAngle(axis, -turnAngle, rotateScratchQuaternion);
        var rotation = Matrix3.fromQuaternion(quaternion, rotateScratchMatrix);

        var oldTransform = appendTransform(this, transform);
        Matrix3.multiplyByVector(rotation, camera.position, camera.position);
        Matrix3.multiplyByVector(rotation, camera.direction, camera.direction);
        Matrix3.multiplyByVector(rotation, camera.up, camera.up);
        Cartesian3.cross(camera.direction, camera.up, camera.right);
        Cartesian3.cross(camera.right, camera.direction, camera.up);
        revertTransform(this, oldTransform);
    };

    /**
     * Rotates the camera around the center of the camera's reference frame by angle downwards.
     *
     * @memberof CameraController
     *
     * @param {Number} [angle] The angle, in radians, to rotate by. Defaults to <code>defaultRotateAmount</code>.
     * @param {Matrix4} [transform] A transform to append to the camera transform before the rotation. Does not alter the camera's transform.
     *
     * @see CameraController#rotateUp
     * @see CameraController#rotate
     */
    CameraController.prototype.rotateDown = function(angle, transform) {
        angle = defaultValue(angle, this.defaultRotateAmount);
        rotateVertical(this, angle, transform);
    };

    /**
     * Rotates the camera around the center of the camera's reference frame by angle upwards.
     *
     * @memberof CameraController
     *
     * @param {Number} [angle] The angle, in radians, to rotate by. Defaults to <code>defaultRotateAmount</code>.
     * @param {Matrix4} [transform] A transform to append to the camera transform before the rotation. Does not alter the camera's transform.
     *
     * @see CameraController#rotateDown
     * @see CameraController#rotate
     */
    CameraController.prototype.rotateUp = function(angle, transform) {
        angle = defaultValue(angle, this.defaultRotateAmount);
        rotateVertical(this, -angle, transform);
    };

    var rotateVertScratchP = new Cartesian3();
    var rotateVertScratchA = new Cartesian3();
    var rotateVertScratchTan = new Cartesian3();
    var rotateVertScratchNegate = new Cartesian3();
    function rotateVertical(controller, angle, transform) {
        var camera = controller._camera;
        var oldTransform = appendTransform(controller, transform);

        var position = camera.position;
        var p = Cartesian3.normalize(position, rotateVertScratchP);
        if (defined(controller.constrainedAxis)) {
            var northParallel = Cartesian3.equalsEpsilon(p, controller.constrainedAxis, CesiumMath.EPSILON2);
            var southParallel = Cartesian3.equalsEpsilon(p, Cartesian3.negate(controller.constrainedAxis, rotateVertScratchNegate), CesiumMath.EPSILON2);
            if ((!northParallel && !southParallel)) {
                var constrainedAxis = Cartesian3.normalize(controller.constrainedAxis, rotateVertScratchA);

                var dot = Cartesian3.dot(p, constrainedAxis);
                var angleToAxis = Math.acos(dot);
                if (angle > 0 && angle > angleToAxis) {
                    angle = angleToAxis;
                }

                dot = Cartesian3.dot(p, Cartesian3.negate(constrainedAxis, rotateVertScratchNegate));
                angleToAxis = Math.acos(dot);
                if (angle < 0 && -angle > angleToAxis) {
                    angle = -angleToAxis;
                }

                var tangent = Cartesian3.cross(constrainedAxis, p, rotateVertScratchTan);
                controller.rotate(tangent, angle);
            } else if ((northParallel && angle < 0) || (southParallel && angle > 0)) {
                controller.rotate(camera.right, angle);
            }
        } else {
            controller.rotate(camera.right, angle);
        }

        revertTransform(controller, oldTransform);
    }

    /**
     * Rotates the camera around the center of the camera's reference frame by angle to the right.
     *
     * @memberof CameraController
     *
     * @param {Number} [angle] The angle, in radians, to rotate by. Defaults to <code>defaultRotateAmount</code>.
     * @param {Matrix4} [transform] A transform to append to the camera transform before the rotation. Does not alter the camera's transform.
     *
     * @see CameraController#rotateLeft
     * @see CameraController#rotate
     */
    CameraController.prototype.rotateRight = function(angle, transform) {
        angle = defaultValue(angle, this.defaultRotateAmount);
        rotateHorizontal(this, -angle, transform);
    };

    /**
     * Rotates the camera around the center of the camera's reference frame by angle to the left.
     *
     * @memberof CameraController
     *
     * @param {Number} [angle] The angle, in radians, to rotate by. Defaults to <code>defaultRotateAmount</code>.
     * @param {Matrix4} [transform] A transform to append to the camera transform before the rotation. Does not alter the camera's transform.
     *
     * @see CameraController#rotateRight
     * @see CameraController#rotate
     */
    CameraController.prototype.rotateLeft = function(angle, transform) {
        angle = defaultValue(angle, this.defaultRotateAmount);
        rotateHorizontal(this, angle, transform);
    };

    function rotateHorizontal(controller, angle, transform) {
        if (defined(controller.constrainedAxis)) {
            controller.rotate(controller.constrainedAxis, angle, transform);
        } else {
            controller.rotate(controller._camera.up, angle, transform);
        }
    }

    function zoom2D(controller, amount) {
        var frustum = controller._camera.frustum;

        if (!defined(frustum.left) || !defined(frustum.right) || !defined(frustum.top) || !defined(frustum.bottom)) {
            throw new DeveloperError('The camera frustum is expected to be orthographic for 2D camera control.');
        }

        amount = amount * 0.5;
        var newRight = frustum.right - amount;
        var newLeft = frustum.left + amount;

        var maxRight = controller._maxCoord.x * controller.maximumZoomFactor;
        if (newRight > maxRight) {
            newRight = maxRight;
            newLeft = -maxRight;
        }

        var ratio = frustum.top / frustum.right;
        frustum.right = newRight;
        frustum.left = newLeft;
        frustum.top = frustum.right * ratio;
        frustum.bottom = -frustum.top;
    }

    function zoom3D(controller, amount) {
        var camera = controller._camera;
        controller.move(camera.direction, amount);
    }

    /**
     * Zooms <code>amount</code> along the camera's view vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount to move. Defaults to <code>defaultZoomAmount</code>.
     *
     * @see CameraController#zoomOut
     */
    CameraController.prototype.zoomIn = function(amount) {
        amount = defaultValue(amount, this.defaultZoomAmount);
        if (this._mode === SceneMode.SCENE2D) {
            zoom2D(this, amount);
        } else {
            zoom3D(this, amount);
        }
    };

    /**
     * Zooms <code>amount</code> along the opposite direction of
     * the camera's view vector.
     *
     * @memberof CameraController
     *
     * @param {Number} [amount] The amount to move. Defaults to <code>defaultZoomAmount</code>.
     *
     * @see CameraController#zoomIn
     */
    CameraController.prototype.zoomOut = function(amount) {
        amount = defaultValue(amount, this.defaultZoomAmount);
        if (this._mode === SceneMode.SCENE2D) {
            zoom2D(this, -amount);
        } else {
            zoom3D(this, -amount);
        }
    };

    /**
     * Gets the magnitude of the camera position. In 3D, this is the vector magnitude. In 2D and
     * Columbus view, this is the distance to the map.
     * @memberof CameraController
     * @returns {Number} The magnitude of the position.
     */
    CameraController.prototype.getMagnitude = function() {
        var camera = this._camera;
        if (this._mode === SceneMode.SCENE3D) {
            return Cartesian3.magnitude(camera.position);
        } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
            return Math.abs(camera.position.z);
        } else if (this._mode === SceneMode.SCENE2D) {
            return  Math.max(camera.frustum.right - camera.frustum.left, camera.frustum.top - camera.frustum.bottom);
        }
    };

    function setPositionCartographic2D(controller, cartographic) {
        var camera = controller._camera;
        var newLeft = -cartographic.height * 0.5;
        var newRight = -newLeft;

        var frustum = camera.frustum;
        if (newRight > newLeft) {
            var ratio = frustum.top / frustum.right;
            frustum.right = newRight;
            frustum.left = newLeft;
            frustum.top = frustum.right * ratio;
            frustum.bottom = -frustum.top;
        }

        //We use Cartesian2 instead of 3 here because Z must be constant in 2D mode.
        Cartesian2.clone(controller._projection.project(cartographic), camera.position);
        Cartesian3.negate(Cartesian3.UNIT_Z, camera.direction);
        Cartesian3.clone(Cartesian3.UNIT_Y, camera.up);
        Cartesian3.clone(Cartesian3.UNIT_X, camera.right);
    }

    function setPositionCartographicCV(controller, cartographic) {
        var camera = controller._camera;
        var projection = controller._projection;
        camera.position = projection.project(cartographic);
        Cartesian3.negate(Cartesian3.UNIT_Z, camera.direction);
        Cartesian3.clone(Cartesian3.UNIT_Y, camera.up);
        Cartesian3.clone(Cartesian3.UNIT_X, camera.right);
    }

    function setPositionCartographic3D(controller, cartographic) {
        var camera = controller._camera;
        var ellipsoid = controller._projection.getEllipsoid();

        ellipsoid.cartographicToCartesian(cartographic, camera.position);
        Cartesian3.negate(camera.position, camera.direction);
        Cartesian3.normalize(camera.direction, camera.direction);
        Cartesian3.cross(camera.direction, Cartesian3.UNIT_Z, camera.right);
        Cartesian3.cross(camera.right, camera.direction, camera.up);
        Cartesian3.cross(camera.direction, camera.up, camera.right);
    }

    /**
     * Moves the camera to the provided cartographic position.
     * @memberof CameraController
     *
     * @param {Cartographic} cartographic The new camera position.
     *
     * @exception {DeveloperError} cartographic is required.
     */
    CameraController.prototype.setPositionCartographic = function(cartographic) {
        if (!defined(cartographic)) {
            throw new DeveloperError('cartographic is required.');
        }

        if (this._mode === SceneMode.SCENE2D) {
            setPositionCartographic2D(this, cartographic);
        } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
            setPositionCartographicCV(this, cartographic);
        } else if (this._mode === SceneMode.SCENE3D) {
            setPositionCartographic3D(this, cartographic);
        }
    };

    function getHeading2D(controller) {
        var camera = controller._camera;
        return Math.atan2(camera.right.y, camera.right.x);
    }

    var scratchHeadingMatrix4 = new Matrix4();
    var scratchHeadingMatrix3 = new Matrix3();
    var scratchHeadingCartesian3 = new Cartesian3();

    function getHeading3D(controller) {
        var camera = controller._camera;

        var ellipsoid = controller._projection.getEllipsoid();
        var toFixedFrame = Transforms.eastNorthUpToFixedFrame(camera.position, ellipsoid, scratchHeadingMatrix4);
        var transform = Matrix4.getRotation(toFixedFrame, scratchHeadingMatrix3);
        Matrix3.transpose(transform, transform);

        var right = Matrix3.multiplyByVector(transform, camera.right, scratchHeadingCartesian3);
        return Math.atan2(right.y, right.x);
    }

    function setHeading2D(controller, angle) {
        var rightAngle = getHeading2D(controller);
        angle = rightAngle - angle;
        controller.look(Cartesian3.UNIT_Z, angle);
    }

    var scratchHeadingAxis = new Cartesian3();

    function setHeading3D(controller, angle) {
        var camera = controller._camera;

        var axis = Cartesian3.normalize(camera.position, scratchHeadingAxis);
        var upAngle = getHeading3D(controller);
        angle = upAngle - angle;
        controller.look(axis, angle);
    }

    function getTiltCV(controller) {
        var camera = controller._camera;

        // Math.acos(dot(camera.direction, Cartesian3.negate(Cartesian3.UNIT_Z))
        return CesiumMath.PI_OVER_TWO - Math.acos(-camera.direction.z);
    }

    var scratchTiltCartesian3 = new Cartesian3();

    function getTilt3D(controller) {
        var camera = controller._camera;

        var direction = Cartesian3.normalize(camera.position, scratchTiltCartesian3);
        Cartesian3.negate(direction, direction);

        return CesiumMath.PI_OVER_TWO - Math.acos(Cartesian3.dot(camera.direction, direction));
    }

    defineProperties(CameraController.prototype, {
        /**
         * The camera heading in radians.
         * @memberof CameraController
         *
         * @type {Number}
         */
        heading : {
            get : function () {
                if (this._mode === SceneMode.SCENE2D || this._mode === SceneMode.COLUMBUS_VIEW) {
                    return getHeading2D(this);
                } else if (this._mode === SceneMode.SCENE3D) {
                    return getHeading3D(this);
                }

                return undefined;
            },
            //TODO See https://github.com/AnalyticalGraphicsInc/cesium/issues/832
            //* @exception {DeveloperError} angle is required.
            set : function (angle) {
                if (!defined(angle)) {
                    throw new DeveloperError('angle is required.');
                }

                if (this._mode === SceneMode.SCENE2D || this._mode === SceneMode.COLUMBUS_VIEW) {
                    setHeading2D(this, angle);
                } else if (this._mode === SceneMode.SCENE3D) {
                    setHeading3D(this, angle);
                }
            }
        },

        /**
         * The the camera tilt in radians
         * @memberof CameraController
         *
         * @type {Number}
         */
        tilt : {
            get : function() {
                if (this._mode === SceneMode.COLUMBUS_VIEW) {
                    return getTiltCV(this);
                } else if (this._mode === SceneMode.SCENE3D) {
                    return getTilt3D(this);
                }

                return undefined;
            },
            //TODO See https://github.com/AnalyticalGraphicsInc/cesium/issues/832
            //* @exception {DeveloperError} angle is required.
            set : function(angle) {
                if (!defined(angle)) {
                    throw new DeveloperError('angle is required.');
                }

                if (this._mode === SceneMode.COLUMBUS_VIEW || this._mode === SceneMode.SCENE3D) {
                    var camera = this._camera;

                    angle = CesiumMath.clamp(angle, 0.0, CesiumMath.PI_OVER_TWO);
                    angle = angle - this.tilt;

                    this.look(camera.right, angle);
                }
            }
        }
    });

    /**
     * Sets the camera position and orientation with an eye position, target, and up vector.
     * This method is not supported in 2D mode because there is only one direction to look.
     *
     * @memberof CameraController
     *
     * @param {Cartesian3} eye The position of the camera.
     * @param {Cartesian3} target The position to look at.
     * @param {Cartesian3} up The up vector.
     *
     * @exception {DeveloperError} eye is required.
     * @exception {DeveloperError} target is required.
     * @exception {DeveloperError} up is required.
     * @exception {DeveloperError} lookAt is not supported in 2D mode because there is only one direction to look.
     * @exception {DeveloperError} lookAt is not supported while morphing.
     */
    CameraController.prototype.lookAt = function(eye, target, up) {
        if (!defined(eye)) {
            throw new DeveloperError('eye is required');
        }
        if (!defined(target)) {
            throw new DeveloperError('target is required');
        }
        if (!defined(up)) {
            throw new DeveloperError('up is required');
        }
        if (this._mode === SceneMode.SCENE2D) {
            throw new DeveloperError('lookAt is not supported in 2D mode because there is only one direction to look.');
        }
        if (this._mode === SceneMode.MORPHING) {
            throw new DeveloperError('lookAt is not supported while morphing.');
        }

        var camera = this._camera;
        camera.position = Cartesian3.clone(eye, camera.position);
        camera.direction = Cartesian3.normalize(Cartesian3.subtract(target, eye, camera.direction), camera.direction);
        camera.right = Cartesian3.normalize(Cartesian3.cross(camera.direction, up, camera.right), camera.right);
        camera.up = Cartesian3.cross(camera.right, camera.direction, camera.up);
    };

    var viewExtent3DCartographic = new Cartographic();
    var viewExtent3DNorthEast = new Cartesian3();
    var viewExtent3DSouthWest = new Cartesian3();
    var viewExtent3DNorthWest = new Cartesian3();
    var viewExtent3DSouthEast = new Cartesian3();
    var viewExtent3DCenter = new Cartesian3();
    var defaultRF = {direction: new Cartesian3(), right: new Cartesian3(), up: new Cartesian3()};
    function extentCameraPosition3D (camera, extent, ellipsoid, result, positionOnly) {
        var cameraRF = camera;
        if (positionOnly) {
            cameraRF = defaultRF;
        }
        var north = extent.north;
        var south = extent.south;
        var east = extent.east;
        var west = extent.west;

        // If we go across the International Date Line
        if (west > east) {
            east += CesiumMath.TWO_PI;
        }

        var cart = viewExtent3DCartographic;
        cart.longitude = east;
        cart.latitude = north;
        var northEast = ellipsoid.cartographicToCartesian(cart, viewExtent3DNorthEast);
        cart.latitude = south;
        var southEast = ellipsoid.cartographicToCartesian(cart, viewExtent3DSouthEast);
        cart.longitude = west;
        var southWest = ellipsoid.cartographicToCartesian(cart, viewExtent3DSouthWest);
        cart.latitude = north;
        var northWest = ellipsoid.cartographicToCartesian(cart, viewExtent3DNorthWest);

        var center = Cartesian3.subtract(northEast, southWest, viewExtent3DCenter);
        Cartesian3.multiplyByScalar(center, 0.5, center);
        Cartesian3.add(southWest, center, center);

        Cartesian3.subtract(northWest, center, northWest);
        Cartesian3.subtract(southEast, center, southEast);
        Cartesian3.subtract(northEast, center, northEast);
        Cartesian3.subtract(southWest, center, southWest);

        var direction = ellipsoid.geodeticSurfaceNormal(center, cameraRF.direction);
        Cartesian3.negate(direction, direction);
        Cartesian3.normalize(direction, direction);
        var right = Cartesian3.cross(direction, Cartesian3.UNIT_Z, cameraRF.right);
        Cartesian3.normalize(right, right);
        var up = Cartesian3.cross(right, direction, cameraRF.up);

        var height = Math.max(
          Math.abs(Cartesian3.dot(up, northWest)),
          Math.abs(Cartesian3.dot(up, southEast)),
          Math.abs(Cartesian3.dot(up, northEast)),
          Math.abs(Cartesian3.dot(up, southWest))
        );
        var width = Math.max(
          Math.abs(Cartesian3.dot(right, northWest)),
          Math.abs(Cartesian3.dot(right, southEast)),
          Math.abs(Cartesian3.dot(right, northEast)),
          Math.abs(Cartesian3.dot(right, southWest))
        );

        var tanPhi = Math.tan(camera.frustum.fovy * 0.5);
        var tanTheta = camera.frustum.aspectRatio * tanPhi;
        var d = Math.max(width / tanTheta, height / tanPhi);

        var scalar = Cartesian3.magnitude(center) + d;
        Cartesian3.normalize(center, center);
        return Cartesian3.multiplyByScalar(center, scalar, result);
    }

    var viewExtentCVCartographic = new Cartographic();
    var viewExtentCVNorthEast = new Cartesian3();
    var viewExtentCVSouthWest = new Cartesian3();
    function extentCameraPositionColumbusView(camera, extent, projection, result, positionOnly) {
        var north = extent.north;
        var south = extent.south;
        var east = extent.east;
        var west = extent.west;
        var invTransform = camera.inverseTransform;

        var cart = viewExtentCVCartographic;
        cart.longitude = east;
        cart.latitude = north;
        var northEast = projection.project(cart, viewExtentCVNorthEast);
        Matrix4.multiplyByPoint(camera.transform, northEast, northEast);
        Matrix4.multiplyByPoint(invTransform, northEast, northEast);

        cart.longitude = west;
        cart.latitude = south;
        var southWest = projection.project(cart, viewExtentCVSouthWest);
        Matrix4.multiplyByPoint(camera.transform, southWest, southWest);
        Matrix4.multiplyByPoint(invTransform, southWest, southWest);

        var tanPhi = Math.tan(camera.frustum.fovy * 0.5);
        var tanTheta = camera.frustum.aspectRatio * tanPhi;
        if (!defined(result)) {
            result = new Cartesian3();
        }

        result.x = (northEast.x - southWest.x) * 0.5 + southWest.x;
        result.y = (northEast.y - southWest.y) * 0.5 + southWest.y;
        result.z = Math.max((northEast.x - southWest.x) / tanTheta, (northEast.y - southWest.y) / tanPhi) * 0.5;

        if (!positionOnly) {
            var direction = Cartesian3.clone(Cartesian3.UNIT_Z, camera.direction);
            Cartesian3.negate(direction, direction);
            Cartesian3.clone(Cartesian3.UNIT_X, camera.right);
            Cartesian3.clone(Cartesian3.UNIT_Y, camera.up);
        }

        return result;
    }

    var viewExtent2DCartographic = new Cartographic();
    var viewExtent2DNorthEast = new Cartesian3();
    var viewExtent2DSouthWest = new Cartesian3();
    function extentCameraPosition2D (camera, extent, projection, result, positionOnly) {
        var north = extent.north;
        var south = extent.south;
        var east = extent.east;
        var west = extent.west;

        var cart = viewExtent2DCartographic;
        cart.longitude = east;
        cart.latitude = north;
        var northEast = projection.project(cart, viewExtent2DNorthEast);
        cart.longitude = west;
        cart.latitude = south;
        var southWest = projection.project(cart, viewExtent2DSouthWest);

        var width = Math.abs(northEast.x - southWest.x) * 0.5;
        var height = Math.abs(northEast.y - southWest.y) * 0.5;

        var right, top;
        var ratio = camera.frustum.right / camera.frustum.top;
        var heightRatio = height * ratio;
        if (width > heightRatio) {
            right = width;
            top = right / ratio;
        } else {
            top = height;
            right = heightRatio;
        }

        height = Math.max(2.0 * right, 2.0 * top);

        if (!defined(result)) {
            result = new Cartesian3();
        }
        result.x = (northEast.x - southWest.x) * 0.5 + southWest.x;
        result.y = (northEast.y - southWest.y) * 0.5 + southWest.y;

        if (positionOnly) {
            cart = projection.unproject(result, cart);
            cart.height = height;
            result = projection.project(cart, result);
        } else {
            var frustum = camera.frustum;
            frustum.right = right;
            frustum.left = -right;
            frustum.top = top;
            frustum.bottom = -top;

            var direction = Cartesian3.clone(Cartesian3.UNIT_Z, camera.direction);
            Cartesian3.negate(direction, direction);
            Cartesian3.clone(Cartesian3.UNIT_X, camera.right);
            Cartesian3.clone(Cartesian3.UNIT_Y, camera.up);
        }

        return result;
    }
    /**
     * Get the camera position needed to view an extent on an ellipsoid or map
     * @memberof CameraController
     *
     * @param {Extent} extent The extent to view.
     * @param {Cartesian3} [result] The camera position needed to view the extent
     *
     * @returns {Cartesian3} The camera position needed to view the extent
     *
     * @exception {DeveloperError} extent is required.
     */
    CameraController.prototype.getExtentCameraCoordinates = function(extent, result) {
        if (!defined(extent)) {
            throw new DeveloperError('extent is required');
        }

        if (this._mode === SceneMode.SCENE3D) {
            return extentCameraPosition3D(this._camera, extent, this._projection.getEllipsoid(), result, true);
        } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
            return extentCameraPositionColumbusView(this._camera, extent, this._projection, result, true);
        } else if (this._mode === SceneMode.SCENE2D) {
            return extentCameraPosition2D(this._camera, extent, this._projection, result, true);
        }

        return undefined;
    };

    /**
     * View an extent on an ellipsoid or map.
     * @memberof CameraController
     *
     * @param {Extent} extent The extent to view.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to view.
     *
     * @exception {DeveloperError} extent is required.
     */
    CameraController.prototype.viewExtent = function(extent, ellipsoid) {
        if (!defined(extent)) {
            throw new DeveloperError('extent is required.');
        }
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

        if (this._mode === SceneMode.SCENE3D) {
            extentCameraPosition3D(this._camera, extent, ellipsoid, this._camera.position);
        } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
            extentCameraPositionColumbusView(this._camera, extent, this._projection, this._camera.position);
        } else if (this._mode === SceneMode.SCENE2D) {
            extentCameraPosition2D(this._camera, extent, this._projection, this._camera.position);
        }
    };

    var pickEllipsoid3DRay = new Ray();
    function pickEllipsoid3D(controller, windowPosition, ellipsoid, result) {
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        var ray = controller.getPickRay(windowPosition, pickEllipsoid3DRay);
        var intersection = IntersectionTests.rayEllipsoid(ray, ellipsoid);
        if (!intersection) {
            return undefined;
        }

        return ray.getPoint(intersection.start, result);
    }

    var pickEllipsoid2DRay = new Ray();
    function pickMap2D(controller, windowPosition, projection, result) {
        var ray = controller.getPickRay(windowPosition, pickEllipsoid2DRay);
        var position = ray.origin;
        position.z = 0.0;
        var cart = projection.unproject(position);

        if (cart.latitude < -CesiumMath.PI_OVER_TWO || cart.latitude > CesiumMath.PI_OVER_TWO ||
                cart.longitude < - Math.PI || cart.longitude > Math.PI) {
            return undefined;
        }

        return projection.getEllipsoid().cartographicToCartesian(cart, result);
    }

    var pickEllipsoidCVRay = new Ray();
    function pickMapColumbusView(controller, windowPosition, projection, result) {
        var ray = controller.getPickRay(windowPosition, pickEllipsoidCVRay);
        var scalar = -ray.origin.x / ray.direction.x;
        ray.getPoint(scalar, result);

        var cart = projection.unproject(new Cartesian3(result.y, result.z, 0.0));

        if (cart.latitude < -CesiumMath.PI_OVER_TWO || cart.latitude > CesiumMath.PI_OVER_TWO ||
                cart.longitude < - Math.PI || cart.longitude > Math.PI) {
            return undefined;
        }

        return projection.getEllipsoid().cartographicToCartesian(cart, result);
    }

    /**
     * Pick an ellipsoid or map.
     * @memberof CameraController
     *
     * @param {Cartesian2} windowPosition The x and y coordinates of a pixel.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to pick.
     * @param {Cartesian3} [result] The object onto which to store the result.
     *
     * @exception {DeveloperError} windowPosition is required.
     *
     * @returns {Cartesian3} If the ellipsoid or map was picked, returns the point on the surface of the ellipsoid or map
     * in world coordinates. If the ellipsoid or map was not picked, returns undefined.
     */
    CameraController.prototype.pickEllipsoid = function(windowPosition, ellipsoid, result) {
        if (!defined(windowPosition)) {
            throw new DeveloperError('windowPosition is required.');
        }

        if (!defined(result)) {
            result = new Cartesian3();
        }

        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

        if (this._mode === SceneMode.SCENE3D) {
            result = pickEllipsoid3D(this, windowPosition, ellipsoid, result);
        } else if (this._mode === SceneMode.SCENE2D) {
            result = pickMap2D(this, windowPosition, this._projection, result);
        } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
            result = pickMapColumbusView(this, windowPosition, this._projection, result);
        }

        return result;
    };

    var pickPerspCenter = new Cartesian3();
    var pickPerspXDir = new Cartesian3();
    var pickPerspYDir = new Cartesian3();
    function getPickRayPerspective(camera, windowPosition, result) {
        var width = camera._context._canvas.clientWidth;
        var height = camera._context._canvas.clientHeight;

        var tanPhi = Math.tan(camera.frustum.fovy * 0.5);
        var tanTheta = camera.frustum.aspectRatio * tanPhi;
        var near = camera.frustum.near;

        var x = (2.0 / width) * windowPosition.x - 1.0;
        var y = (2.0 / height) * (height - windowPosition.y) - 1.0;

        var position = camera.positionWC;
        Cartesian3.clone(position, result.origin);

        var nearCenter = Cartesian3.multiplyByScalar(camera.directionWC, near, pickPerspCenter);
        Cartesian3.add(position, nearCenter, nearCenter);
        var xDir = Cartesian3.multiplyByScalar(camera.rightWC, x * near * tanTheta, pickPerspXDir);
        var yDir = Cartesian3.multiplyByScalar(camera.upWC, y * near * tanPhi, pickPerspYDir);
        var direction = Cartesian3.add(nearCenter, xDir, result.direction);
        Cartesian3.add(direction, yDir, direction);
        Cartesian3.subtract(direction, position, direction);
        Cartesian3.normalize(direction, direction);

        return result;
    }

    function getPickRayOrthographic(camera, windowPosition, result) {
        var width = camera._context._canvas.clientWidth;
        var height = camera._context._canvas.clientHeight;

        var x = (2.0 / width) * windowPosition.x - 1.0;
        x *= (camera.frustum.right - camera.frustum.left) * 0.5;
        var y = (2.0 / height) * (height - windowPosition.y) - 1.0;
        y *= (camera.frustum.top - camera.frustum.bottom) * 0.5;

        var origin = result.origin;
        Cartesian3.clone(camera.position, origin);
        origin.x += x;
        origin.y += y;

        Cartesian3.clone(camera.directionWC, result.direction);

        return result;
    }

    /**
     * Create a ray from the camera position through the pixel at <code>windowPosition</code>
     * in world coordinates.
     *
     * @memberof CameraController
     *
     * @param {Cartesian2} windowPosition The x and y coordinates of a pixel.
     * @param {Ray} [result] The object onto which to store the result.
     *
     * @exception {DeveloperError} windowPosition is required.
     *
     * @returns {Object} Returns the {@link Cartesian3} position and direction of the ray.
     */
    CameraController.prototype.getPickRay = function(windowPosition, result) {
        if (!defined(windowPosition)) {
            throw new DeveloperError('windowPosition is required.');
        }

        if (!defined(result)) {
            result = new Ray();
        }

        var camera = this._camera;
        var frustum = camera.frustum;
        if (defined(frustum.aspectRatio) && defined(frustum.fovy) && defined(frustum.near)) {
            return getPickRayPerspective(camera, windowPosition, result);
        }

        return getPickRayOrthographic(camera, windowPosition, result);
    };

    function createAnimation2D(controller, duration) {
        var camera = controller._camera;

        var position = camera.position;
        var translateX = position.x < -controller._maxCoord.x || position.x > controller._maxCoord.x;
        var translateY = position.y < -controller._maxCoord.y || position.y > controller._maxCoord.y;
        var animatePosition = translateX || translateY;

        var frustum = camera.frustum;
        var top = frustum.top;
        var bottom = frustum.bottom;
        var right = frustum.right;
        var left = frustum.left;
        var startFrustum = controller._frustum;
        var animateFrustum = right > controller._frustum.right;

        if (animatePosition || animateFrustum) {
            var translatedPosition = Cartesian3.clone(position);

            if (translatedPosition.x > controller._maxCoord.x) {
                translatedPosition.x = controller._maxCoord.x;
            } else if (translatedPosition.x < -controller._maxCoord.x) {
                translatedPosition.x = -controller._maxCoord.x;
            }

            if (translatedPosition.y > controller._maxCoord.y) {
                translatedPosition.y = controller._maxCoord.y;
            } else if (translatedPosition.y < -controller._maxCoord.y) {
                translatedPosition.y = -controller._maxCoord.y;
            }

            var update2D = function(value) {
                if (animatePosition) {
                    camera.position = Cartesian3.lerp(position, translatedPosition, value.time);
                }
                if (animateFrustum) {
                    camera.frustum.top = CesiumMath.lerp(top, startFrustum.top, value.time);
                    camera.frustum.bottom = CesiumMath.lerp(bottom, startFrustum.bottom, value.time);
                    camera.frustum.right = CesiumMath.lerp(right, startFrustum.right, value.time);
                    camera.frustum.left = CesiumMath.lerp(left, startFrustum.left, value.time);
                }
            };

            return {
                easingFunction : Tween.Easing.Exponential.Out,
                startValue : {
                    time : 0.0
                },
                stopValue : {
                    time : 1.0
                },
                duration : duration,
                onUpdate : update2D
            };
        }

        return undefined;
    }

    function createAnimationTemplateCV(controller, position, center, maxX, maxY, duration) {
        var newPosition = Cartesian3.clone(position);

        if (center.y > maxX) {
            newPosition.y -= center.y - maxX;
        } else if (center.y < -maxX) {
            newPosition.y += -maxX - center.y;
        }

        if (center.z > maxY) {
            newPosition.z -= center.z - maxY;
        } else if (center.z < -maxY) {
            newPosition.z += -maxY - center.z;
        }

        var camera = controller._camera;
        var updateCV = function(value) {
            var interp = Cartesian3.lerp(position, newPosition, value.time);
            camera.position = Matrix4.multiplyByPoint(camera.inverseTransform, interp, camera.position);
        };

        return {
            easingFunction : Tween.Easing.Exponential.Out,
            startValue : {
                time : 0.0
            },
            stopValue : {
                time : 1.0
            },
            duration : duration,
            onUpdate : updateCV
        };
    }

    var normalScratch = new Cartesian3();
    var centerScratch = new Cartesian3();
    var posScratch = new Cartesian3();
    var scratchCartesian3 = new Cartesian3();
    function createAnimationCV(controller, duration) {
        var camera = controller._camera;
        var position = camera.position;
        var direction = camera.direction;

        var normal = Matrix4.multiplyByPointAsVector(camera.inverseTransform, Cartesian3.UNIT_X, normalScratch);
        var scalar = -Cartesian3.dot(normal, position) / Cartesian3.dot(normal, direction);
        var center = Cartesian3.add(position, Cartesian3.multiplyByScalar(direction, scalar, centerScratch), centerScratch);
        center = Matrix4.multiplyByPoint(camera.transform, center, center);

        position = Matrix4.multiplyByPoint(camera.transform, camera.position, posScratch);

        var tanPhi = Math.tan(controller._camera.frustum.fovy * 0.5);
        var tanTheta = controller._camera.frustum.aspectRatio * tanPhi;
        var distToC = Cartesian3.magnitude(Cartesian3.subtract(position, center, scratchCartesian3));
        var dWidth = tanTheta * distToC;
        var dHeight = tanPhi * distToC;

        var mapWidth = controller._maxCoord.x;
        var mapHeight = controller._maxCoord.y;

        var maxX = Math.max(dWidth - mapWidth, mapWidth);
        var maxY = Math.max(dHeight - mapHeight, mapHeight);

        if (position.z < -maxX || position.z > maxX || position.y < -maxY || position.y > maxY) {
            var translateX = center.y < -maxX || center.y > maxX;
            var translateY = center.z < -maxY || center.z > maxY;
            if (translateX || translateY) {
                return createAnimationTemplateCV(controller, position, center, maxX, maxY, duration);
            }
        }

        return undefined;
    }

    /**
     * Create an animation to move the map into view. This method is only valid for 2D and Columbus modes.
     * @memberof CameraController
     * @param {Number} duration The duration, in milliseconds, of the animation.
     * @exception {DeveloperException} duration is required.
     * @returns {Object} The animation or undefined if the scene mode is 3D or the map is already ion view.
     */
    CameraController.prototype.createCorrectPositionAnimation = function(duration) {
        if (!defined(duration)) {
            throw new DeveloperError('duration is required.');
        }

        if (this._mode === SceneMode.SCENE2D) {
            return createAnimation2D(this, duration);
        } else if (this._mode === SceneMode.COLUMBUS_VIEW) {
            return createAnimationCV(this, duration);
        }

        return undefined;
    };

    return CameraController;
});
