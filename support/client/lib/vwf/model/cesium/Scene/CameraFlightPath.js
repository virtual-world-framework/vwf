/*global define*/
define([
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/clone',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/DeveloperError',
        '../Core/HermiteSpline',
        '../Core/Math',
        '../Core/Matrix3',
        '../Core/OrientationInterpolator',
        '../Core/Quaternion',
        '../Scene/PerspectiveFrustum',
        '../Scene/PerspectiveOffCenterFrustum',
        '../Scene/SceneMode',
        '../ThirdParty/Tween'
    ], function(
        Cartesian2,
        Cartesian3,
        clone,
        defaultValue,
        defined,
        DeveloperError,
        HermiteSpline,
        CesiumMath,
        Matrix3,
        OrientationInterpolator,
        Quaternion,
        PerspectiveFrustum,
        PerspectiveOffCenterFrustum,
        SceneMode,
        Tween) {
    "use strict";

    /**
     * Creates animations for camera flights.
     * <br /><br />
     * Mouse interaction is disabled during flights.
     *
     * @exports CameraFlightPath
     */
    var CameraFlightPath = {
    };

    var c3destination = new Cartesian3();
    var rotMatrix = new Matrix3();
    var viewMat = new Matrix3();

    var cqRight = new Cartesian3();
    var cqUp = new Cartesian3();
    function createQuaternion(direction, up, result) {
        direction.cross(up, cqRight);
        cqRight.cross(direction, cqUp);
        viewMat[0] = cqRight.x;
        viewMat[1] = cqUp.x;
        viewMat[2] = -direction.x;
        viewMat[3] = cqRight.y;
        viewMat[4] = cqUp.y;
        viewMat[5] = -direction.y;
        viewMat[6] = cqRight.z;
        viewMat[7] = cqUp.z;
        viewMat[8] = -direction.z;

        return Quaternion.fromRotationMatrix(viewMat, result);
    }

    function getAltitude(frustum, dx, dy) {
        var near;
        var top;
        var right;
        if (frustum instanceof PerspectiveFrustum) {
            var tanTheta = Math.tan(0.5 * frustum.fovy);
            near = frustum.near;
            top = frustum.near * tanTheta;
            right = frustum.aspectRatio * top;
            return Math.max(dx * near / right, dy * near / top);
        } else if (frustum instanceof PerspectiveOffCenterFrustum) {
            near = frustum.near;
            top = frustum.top;
            right = frustum.right;
            return Math.max(dx * near / right, dy * near / top);
        }

        return Math.max(dx, dy);
    }

    function createSpline(points) {
        if (points.length > 2) {
            return new HermiteSpline(points);
        }

        // only two points, use linear interpolation
        var p = points[0];
        var q = points[1];

        return {
            getControlPoints : function() {
                return points;
            },

            evaluate : function(time, result) {
                time = CesiumMath.clamp(time, p.time, q.time);
                var t = (time - p.time) / (q.time - p.time);
                return Cartesian3.lerp(p.point, q.point, t, result);
            }
        };
    }

    function createPath3D(camera, ellipsoid, start, end, duration) {
        // get minimum altitude from which the whole ellipsoid is visible
        var radius = ellipsoid.getMaximumRadius();
        var frustum = camera.frustum;
        var maxStartAlt = getAltitude(frustum, radius, radius);

        var dot = start.normalize().dot(end.normalize());

        var points;
        var altitude;
        var incrementPercentage;
        if (start.magnitude() > maxStartAlt) {
            altitude = radius + 0.6 * (maxStartAlt - radius);
            incrementPercentage = 0.35;
        } else {
            var diff = start.subtract(end);
            altitude = diff.multiplyByScalar(0.5).add(end).magnitude();
            var verticalDistance = camera.up.multiplyByScalar(diff.dot(camera.up)).magnitude();
            var horizontalDistance = camera.right.multiplyByScalar(diff.dot(camera.right)).magnitude();
            altitude += getAltitude(frustum, verticalDistance, horizontalDistance);
            incrementPercentage = CesiumMath.clamp(dot + 1.0, 0.25, 0.5);
        }

        var aboveEnd = end.normalize().multiplyByScalar(altitude);
        var afterStart = start.normalize().multiplyByScalar(altitude);

        var axis, angle, rotation, middle;
        if (end.magnitude() > maxStartAlt && dot > 0.75) {
            middle = start.subtract(end).multiplyByScalar(0.5).add(end);

            points = [{
                point : start
            }, {
                point : middle
            }, {
                point : end
            }];
        } else if (start.magnitude() > maxStartAlt && dot > 0) {
            middle = start.subtract(aboveEnd).multiplyByScalar(0.5).add(aboveEnd);

            points = [{
                point : start
            }, {
                point : middle
            }, {
                point : end
            }];
        } else {
            points = [{
                point : start
            }];

            angle = Math.acos(afterStart.normalize().dot(aboveEnd.normalize()));
            axis = afterStart.cross(aboveEnd);
            if (axis.equalsEpsilon(Cartesian3.ZERO, CesiumMath.EPSILON6)) {
                axis = Cartesian3.UNIT_Z;
            }

            var increment = incrementPercentage * angle;
            var startCondition = angle - increment;
            for ( var i = startCondition; i > 0.0; i = i - increment) {
                rotation = Matrix3.fromQuaternion(Quaternion.fromAxisAngle(axis, i));
                points.push({
                    point : rotation.multiplyByVector(aboveEnd)
                });
            }

            points.push({
                point : end
            });
        }

        var scalar = duration / (points.length - 1);
        for ( var k = 0; k < points.length; ++k) {
            points[k].time = k * scalar;
        }

        return createSpline(points);
    }
    var direction3D = new Cartesian3();
    var right3D = new Cartesian3();
    var up3D = new Cartesian3();
    var quat3D = new Quaternion();
    function createOrientations3D(camera, points, endDirection, endUp) {
        points[0].orientation = createQuaternion(camera.direction, camera.up);
        var point;
        var length = points.length - 1;
        for (var i = 1; i < length; ++i) {
            point = points[i];
            point.point.negate(direction3D).normalize(direction3D);
            direction3D.cross(Cartesian3.UNIT_Z, right3D).normalize(right3D);
            right3D.cross(direction3D, up3D);
            point.orientation = createQuaternion(direction3D, up3D, quat3D);
        }

        point = points[length];
        if (defined(endDirection) && defined(endUp)) {
            point.orientation = createQuaternion(endDirection, endUp);
        } else {
            point.point.negate(direction3D).normalize(direction3D);
            direction3D.cross(Cartesian3.UNIT_Z, right3D).normalize(right3D);
            right3D.cross(direction3D, up3D);
            point.orientation = createQuaternion(direction3D, up3D, quat3D);
        }

        return new OrientationInterpolator(points);
    }

    function createUpdate3D(frameState, destination, duration, direction, up) {
        var camera = frameState.camera;
        var ellipsoid = frameState.scene2D.projection.getEllipsoid();

        var path = createPath3D(camera, ellipsoid, camera.position, destination, duration);
        var orientations = createOrientations3D(camera, path.getControlPoints(), direction, up);

        var update = function(value) {
            var time = value.time;
            var orientation = orientations.evaluate(time);
            Matrix3.fromQuaternion(orientation, rotMatrix);

            camera.position = path.evaluate(time, camera.position);
            camera.right = rotMatrix.getRow(0, camera.right);
            camera.up = rotMatrix.getRow(1, camera.up);
            camera.direction = rotMatrix.getRow(2, camera.direction).negate(camera.direction);
        };

        return update;
    }

    function createPath2D(camera, ellipsoid, start, end, duration) {
        // get minimum altitude from which the whole map is visible
        var radius = ellipsoid.getMaximumRadius();
        var frustum = camera.frustum;
        var maxStartAlt = getAltitude(frustum, Math.PI * radius,  CesiumMath.PI_OVER_TWO * radius);

        var points;
        var altitude;
        var incrementPercentage = 0.5;
        if (start.z > maxStartAlt) {
            altitude = 0.6 * maxStartAlt;
        } else {
            var diff = start.subtract(end);
            altitude = getAltitude(frustum, Math.abs(diff.y), Math.abs(diff.x));
        }

        var aboveEnd = end.clone();
        aboveEnd.z = altitude;
        var afterStart = start.clone();
        afterStart.z = altitude;

        var middle;
        if (end.z > maxStartAlt) {
            middle = start.subtract(end).multiplyByScalar(0.5).add(end);

            points = [{
                point : start
            }, {
                point : middle
            }, {
                point : end
            }];
        } else if (start.z > maxStartAlt) {
            middle = start.subtract(aboveEnd).multiplyByScalar(0.5).add(aboveEnd);

            points = [{
                point : start
            }, {
                point : middle
            }, {
                point : end
            }];
        } else {
            points = [{
                point : start
            }];

            var v = afterStart.subtract(aboveEnd);
            var distance = v.magnitude();
            Cartesian3.normalize(v, v);

            var increment = incrementPercentage * distance;
            var startCondition = distance - increment;
            for ( var i = startCondition; i > 0.0; i = i - increment) {
                points.push({
                    point : v.multiplyByScalar(i).add(aboveEnd)
                });
            }

            points.push({
                point : end
            });
        }

        var scalar = duration / (points.length - 1);
        for ( var k = 0; k < points.length; ++k) {
            points[k].time = k * scalar;
        }

        return createSpline(points);
    }

    var direction2D = Cartesian3.UNIT_Z.negate();
    var right2D = direction2D.cross(Cartesian3.UNIT_Y).normalize();
    var up2D = right2D.cross(direction2D);
    var quat = createQuaternion(direction2D, up2D);
    function createOrientations2D(camera, points, endDirection, endUp) {
        points[0].orientation = createQuaternion(camera.direction, camera.up);
        var point;
        var length = points.length - 1;
        for (var i = 1; i < length; ++i) {
            point = points[i];
            point.orientation = quat;
        }

        point = points[length];
        if (defined(endDirection) && defined(endUp)) {
            point.orientation = createQuaternion(endDirection, endUp);
        } else {
            point.orientation = quat;
        }

        return new OrientationInterpolator(points);
    }

    function createUpdateCV(frameState, destination, duration, direction, up) {
        var camera = frameState.camera;
        var ellipsoid = frameState.scene2D.projection.getEllipsoid();

        var path = createPath2D(camera, ellipsoid, camera.position.clone(), destination, duration);
        var orientations = createOrientations2D(camera, path.getControlPoints(), direction, up);

        var update = function(value) {
            var time = value.time;
            var orientation = orientations.evaluate(time);
            Matrix3.fromQuaternion(orientation, rotMatrix);

            camera.position = path.evaluate(time, camera.position);
            camera.right = rotMatrix.getRow(0, camera.right);
            camera.up = rotMatrix.getRow(1, camera.up);
            camera.direction = rotMatrix.getRow(2, camera.direction).negate(camera.direction);
        };

        return update;
    }

    function createUpdate2D(frameState, destination, duration, direction, up) {
        var camera = frameState.camera;
        var ellipsoid = frameState.scene2D.projection.getEllipsoid();

        var start = camera.position.clone();
        start.z = camera.frustum.right - camera.frustum.left;

        var path = createPath2D(camera, ellipsoid, start, destination, duration);
        var points = path.getControlPoints();
        var orientations = createOrientations2D(camera, points, Cartesian3.UNIT_Z.negate(), up);

        var height = camera.position.z;

        var update = function(value) {
            var time = value.time;
            var orientation = orientations.evaluate(time);
            Matrix3.fromQuaternion(orientation, rotMatrix);

            camera.position = path.evaluate(time, camera.position);
            var zoom = camera.position.z;
            camera.position.z = height;

            camera.right = rotMatrix.getRow(0, camera.right);
            camera.up = rotMatrix.getRow(1, camera.up);
            camera.direction = rotMatrix.getRow(2, camera.direction).negate(camera.direction);

            var frustum = camera.frustum;
            var ratio = frustum.top / frustum.right;

            var incrementAmount = (zoom - (frustum.right - frustum.left)) * 0.5;
            frustum.right += incrementAmount;
            frustum.left -= incrementAmount;
            frustum.top = ratio * frustum.right;
            frustum.bottom = -frustum.top;
        };

        return update;
    }

    function disableInput(controller) {
      var backup = {
          enableTranslate: controller.enableTranslate,
          enableZoom: controller.enableZoom,
          enableRotate: controller.enableRotate,
          enableTilt: controller.enableTilt,
          enableLook: controller.enableLook
      };
      controller.enableTranslate = false;
      controller.enableZoom = false;
      controller.enableRotate = false;
      controller.enableTilt = false;
      controller.enableLook = false;
      return backup;
    }

    function restoreInput(controller, backup) {
      controller.enableTranslate = backup.enableTranslate;
      controller.enableZoom = backup.enableZoom;
      controller.enableRotate = backup.enableRotate;
      controller.enableTilt = backup.enableTilt;
      controller.enableLook = backup.enableLook;
    }

    /**
     * Creates an animation to fly the camera from it's current position to a position given by a Cartesian. All arguments should
     * be in the current camera reference frame.
     *
     * @param {Scene} scene The scene instance to use.
     * @param {Cartesian3} description.destination The final position of the camera.
     * @param {Cartesian3} [description.direction] The final direction of the camera. By default, the direction will point towards the center of the frame in 3D and in the negative z direction in Columbus view or 2D.
     * @param {Cartesian3} [description.up] The final up direction. By default, the up direction will point towards local north in 3D and in the positive y direction in Columbus view or 2D.
     * @param {Number} [description.duration=3000] The duration of the animation in milliseconds.
     * @param {Function} [onComplete] The function to execute when the animation has completed.
     * @param {Function} [onCancel] The function to execute if the animation is cancelled.
     *
     * @returns {Object} An Object that can be added to an {@link AnimationCollection} for animation.
     *
     * @exception {DeveloperError} scene is required.
     * @exception {DeveloperError} description.destination is required.
     * @exception {DeveloperError} frameState.mode cannot be SceneMode.MORPHING
     *
     * @see Scene#getAnimations
     */
    var dirScratch = new Cartesian3();
    var rightScratch = new Cartesian3();
    var upScratch = new Cartesian3();
    CameraFlightPath.createAnimation = function(scene, description) {
        description = defaultValue(description, defaultValue.EMPTY_OBJECT);
        var destination = description.destination;

        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }
        if (!defined(destination)) {
            throw new DeveloperError('destination is required.');
        }
        var frameState = scene.getFrameState();
        if (frameState.mode === SceneMode.MORPHING) {
            throw new DeveloperError('frameState.mode cannot be SceneMode.MORPHING');
        }

        var direction = description.direction;
        var up = description.up;
        var duration = defaultValue(description.duration, 3000.0);

        var controller = scene.getScreenSpaceCameraController();
        var backup = disableInput(controller);
        var wrapCallback = function(cb) {
            var wrapped = function() {
                if (typeof cb === 'function') {
                    cb();
                }
                restoreInput(controller, backup);
            };
            return wrapped;
        };
        var onComplete = wrapCallback(description.onComplete);
        var onCancel = wrapCallback(description.onCancel);

        var frustum = frameState.camera.frustum;

        if (frameState.mode === SceneMode.SCENE2D) {
            if ((Cartesian2.equalsEpsilon(frameState.camera.position, destination, CesiumMath.EPSILON6)) && (CesiumMath.equalsEpsilon(Math.max(frustum.right - frustum.left, frustum.top - frustum.bottom), destination.z, CesiumMath.EPSILON6))) {
                return {
                    duration : 0,
                    onComplete : onComplete,
                    onCancel: onCancel
                };
            }
        } else if (Cartesian3.equalsEpsilon(destination, frameState.camera.position, CesiumMath.EPSILON6)) {
            return {
                duration : 0,
                onComplete : onComplete,
                onCancel: onCancel
            };
        }

        if (duration <= 0) {
            var newOnComplete = function() {
                var position = destination;
                if (frameState.mode === SceneMode.SCENE3D) {
                    if (!defined(description.direction) && !defined(description.up)){
                        dirScratch = position.negate(dirScratch).normalize(dirScratch);
                        rightScratch = dirScratch.cross(Cartesian3.UNIT_Z, rightScratch).normalize(rightScratch);
                    } else {
                        dirScratch = description.direction;
                        rightScratch = dirScratch.cross(description.up, rightScratch).normalize(rightScratch);
                    }
                    upScratch = defaultValue(description.up, rightScratch.cross(dirScratch, upScratch));
                } else {
                    if (!defined(description.direction) && !defined(description.up)){
                        dirScratch = Cartesian3.UNIT_Z.negate(dirScratch);
                        rightScratch = dirScratch.cross(Cartesian3.UNIT_Y, rightScratch).normalize(rightScratch);
                    } else {
                        dirScratch = description.direction;
                        rightScratch = dirScratch.cross(description.up, rightScratch).normalize(rightScratch);
                    }
                    upScratch = defaultValue(description.up,  rightScratch.cross(dirScratch, upScratch));
                }

                Cartesian3.clone(position, frameState.camera.position);
                Cartesian3.clone(dirScratch, frameState.camera.direction);
                Cartesian3.clone(upScratch, frameState.camera.up);
                Cartesian3.clone(rightScratch, frameState.camera.right);

                if (frameState.mode === SceneMode.SCENE2D) {
                    var zoom = frameState.camera.position.z;


                    var ratio = frustum.top / frustum.right;

                    var incrementAmount = (zoom - (frustum.right - frustum.left)) * 0.5;
                    frustum.right += incrementAmount;
                    frustum.left -= incrementAmount;
                    frustum.top = ratio * frustum.right;
                    frustum.bottom = -frustum.top;
                }

                if (typeof onComplete === 'function') {
                    onComplete();
                }
            };
            return {
                duration : 0,
                onComplete : newOnComplete,
                onCancel: onCancel
            };
        }

        var update;
        if (frameState.mode === SceneMode.SCENE3D) {
            update = createUpdate3D(frameState, destination, duration, direction, up);
        } else if (frameState.mode === SceneMode.SCENE2D) {
            update = createUpdate2D(frameState, destination, duration, direction, up);
        } else {
            update = createUpdateCV(frameState, destination, duration, direction, up);
        }

        return {
            duration : duration,
            easingFunction : Tween.Easing.Sinusoidal.InOut,
            startValue : {
                time : 0.0
            },
            stopValue : {
                time : duration
            },
            onUpdate : update,
            onComplete : onComplete,
            onCancel: onCancel
        };
    };

    /**
     * Creates an animation to fly the camera from it's current position to a position given by a Cartographic. Keep in mind that the animation
     * will happen in the camera's current reference frame.
     *
     * @param {Scene} scene The scene instance to use.
     * @param {Cartographic} description.destination The final position of the camera.
     * @param {Cartesian3} [description.direction] The final direction of the camera. By default, the direction will point towards the center of the frame in 3D and in the negative z direction in Columbus view or 2D.
     * @param {Cartesian3} [description.up] The final up direction. By default, the up direction will point towards local north in 3D and in the positive y direction in Columbus view or 2D.
     * @param {Number} [description.duration=3000] The duration of the animation in milliseconds.
     * @param {Function} [onComplete] The function to execute when the animation has completed.
     * @param {Function} [onCancel] The function to execute if the animation is cancelled.
     *
     * @returns {Object} An Object that can be added to an {@link AnimationCollection} for animation.
     *
     * @exception {DeveloperError} scene is required.
     * @exception {DeveloperError} description.destination is required.
     * @exception {DeveloperError} frameState.mode cannot be SceneMode.MORPHING
     *
     * @see Scene#getAnimations
     */
    CameraFlightPath.createAnimationCartographic = function(scene, description) {
        description = defaultValue(description, defaultValue.EMPTY_OBJECT);
        var destination = description.destination;

        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }
        if (!defined(destination)) {
            throw new DeveloperError('description.destination is required.');
        }

        var frameState = scene.getFrameState();
        var projection = frameState.scene2D.projection;
        if (frameState.mode === SceneMode.SCENE3D) {
            var ellipsoid = projection.getEllipsoid();
            ellipsoid.cartographicToCartesian(destination, c3destination);
        } else if (frameState.mode === SceneMode.COLUMBUS_VIEW || frameState.mode === SceneMode.SCENE2D) {
            projection.project(destination, c3destination);
        } else {
            throw new DeveloperError('frameState.mode cannot be SceneMode.MORPHING');
        }

        var createAnimationDescription = clone(description);
        createAnimationDescription.destination = c3destination;
        return this.createAnimation(scene, createAnimationDescription);
    };

    /**
     * Creates an animation to fly the camera from it's current position to a position in which the entire extent will be visible. Keep in mind that the animation
     * will happen in the camera's current reference frame.
     *
     * @param {Scene} scene The scene instance to use.
     * @param {Extent} description.destination The final position of the camera.
     * @param {Number} [description.duration=3000] The duration of the animation in milliseconds.
     * @param {Function} [onComplete] The function to execute when the animation has completed.
     * @param {Function} [onCancel] The function to execute if the animation is cancelled.
     *
     * @returns {Object} An Object that can be added to an {@link AnimationCollection} for animation.
     *
     * @exception {DeveloperError} scene is required.
     * @exception {DeveloperError} description.destination is required.
     * @exception {DeveloperError} frameState.mode cannot be SceneMode.MORPHING
     *
     * @see Scene#getAnimations
     */
    CameraFlightPath.createAnimationExtent = function(scene, description) {
        description = defaultValue(description, defaultValue.EMPTY_OBJECT);
        var extent = description.destination;
        var frameState = scene.getFrameState();
        if (!defined(frameState)) {
            throw new DeveloperError('frameState is required.');
        }
        if (!defined(extent)) {
            throw new DeveloperError('description.destination is required.');
        }
        if (frameState.mode === SceneMode.MORPHING) {
            throw new DeveloperError('frameState.mode cannot be SceneMode.MORPHING');
        }

        var createAnimationDescription = clone(description);
        var camera = frameState.camera;
        camera.controller.getExtentCameraCoordinates(extent, c3destination);

        createAnimationDescription.destination = c3destination;
        return this.createAnimation(scene, createAnimationDescription);
    };

    return CameraFlightPath;
});
