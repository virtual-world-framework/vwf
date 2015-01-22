/*global define*/
define([
        '../Core/Cartesian3',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Ellipsoid',
        '../Core/JulianDate',
        '../Core/Math',
        '../Core/Matrix3',
        '../Core/Transforms',
        '../Scene/SceneMode'
    ], function(
        Cartesian3,
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Ellipsoid,
        JulianDate,
        CesiumMath,
        Matrix3,
        Transforms,
        SceneMode) {
    "use strict";

    var updateTransformMatrix3Scratch1 = new Matrix3();
    var updateTransformMatrix3Scratch2 = new Matrix3();
    var updateTransformMatrix3Scratch3 = new Matrix3();
    var updateTransformCartesian3Scratch1 = new Cartesian3();
    var updateTransformCartesian3Scratch2 = new Cartesian3();
    var updateTransformCartesian3Scratch3 = new Cartesian3();
    var updateTransformCartesian3Scratch4 = new Cartesian3();
    var updateTransformCartesian3Scratch5 = new Cartesian3();
    var updateTransformCartesian3Scratch6 = new Cartesian3();
    var deltaTime = new JulianDate();
    var northUpAxisFactor = 1.25;  // times ellipsoid's maximum radius

    function updateTransform(that, camera, updateLookAt, positionProperty, time, ellipsoid) {
        var cartesian = positionProperty.getValue(time, that._lastCartesian);
        if (defined(cartesian)) {
            var hasBasis = false;
            var xBasis;
            var yBasis;
            var zBasis;

            // The time delta was determined based on how fast satellites move compared to vehicles near the surface.
            // Slower moving vehicles will most likely default to east-north-up, while faster ones will be VVLH.
            deltaTime = JulianDate.addSeconds(time, 0.001, deltaTime);
            var deltaCartesian = positionProperty.getValue(deltaTime, updateTransformCartesian3Scratch1);
            if (defined(deltaCartesian)) {
                var toInertial = Transforms.computeFixedToIcrfMatrix(time, updateTransformMatrix3Scratch1);
                var toInertialDelta = Transforms.computeFixedToIcrfMatrix(deltaTime, updateTransformMatrix3Scratch2);
                var toFixed;

                if (!defined(toInertial) || !defined(toInertialDelta)) {
                    toFixed = Transforms.computeTemeToPseudoFixedMatrix(time, updateTransformMatrix3Scratch3);
                    toInertial = Matrix3.transpose(toFixed, updateTransformMatrix3Scratch1);
                    toInertialDelta = Transforms.computeTemeToPseudoFixedMatrix(deltaTime, updateTransformMatrix3Scratch2);
                    Matrix3.transpose(toInertialDelta, toInertialDelta);
                } else {
                    toFixed = Matrix3.transpose(toInertial, updateTransformMatrix3Scratch3);
                }

                var inertialCartesian = Matrix3.multiplyByVector(toInertial, cartesian, updateTransformCartesian3Scratch5);
                var inertialDeltaCartesian = Matrix3.multiplyByVector(toInertialDelta, deltaCartesian, updateTransformCartesian3Scratch6);

                Cartesian3.subtract(inertialCartesian, inertialDeltaCartesian, updateTransformCartesian3Scratch4);
                var inertialVelocity = Cartesian3.magnitude(updateTransformCartesian3Scratch4) * 1000.0;  // meters/sec

                // http://en.wikipedia.org/wiki/Standard_gravitational_parameter
                // Consider adding this to Cesium.Ellipsoid?
                var mu = 3.986004418e14;  // m^3 / sec^2

                var semiMajorAxis = -mu / (inertialVelocity * inertialVelocity - (2 * mu / Cartesian3.magnitude(inertialCartesian)));

                if (semiMajorAxis < 0 || semiMajorAxis > northUpAxisFactor * ellipsoid.maximumRadius) {
                    // North-up viewing from deep space.

                    // X along the nadir
                    xBasis = updateTransformCartesian3Scratch2;
                    Cartesian3.normalize(cartesian, xBasis);
                    Cartesian3.negate(xBasis, xBasis);

                    // Z is North
                    zBasis = Cartesian3.clone(Cartesian3.UNIT_Z, updateTransformCartesian3Scratch3);

                    // Y is along the cross of z and x (right handed basis / in the direction of motion)
                    yBasis = Cartesian3.cross(zBasis, xBasis, updateTransformCartesian3Scratch1);
                    if (Cartesian3.magnitude(yBasis) > CesiumMath.EPSILON7) {
                        Cartesian3.normalize(xBasis, xBasis);
                        Cartesian3.normalize(yBasis, yBasis);

                        zBasis = Cartesian3.cross(xBasis, yBasis, updateTransformCartesian3Scratch3);
                        Cartesian3.normalize(zBasis, zBasis);

                        hasBasis = true;
                    }
                } else if (!Cartesian3.equalsEpsilon(cartesian, deltaCartesian, CesiumMath.EPSILON7)) {
                    // Approximation of VVLH (Vehicle Velocity Local Horizontal) with the Z-axis flipped.

                    // Z along the position
                    zBasis = updateTransformCartesian3Scratch2;
                    Cartesian3.normalize(inertialCartesian, zBasis);
                    Cartesian3.normalize(inertialDeltaCartesian, inertialDeltaCartesian);

                    // Y is along the angular momentum vector (e.g. "orbit normal")
                    yBasis = Cartesian3.cross(zBasis, inertialDeltaCartesian, updateTransformCartesian3Scratch3);
                    if (!Cartesian3.equalsEpsilon(yBasis, Cartesian3.ZERO, CesiumMath.EPSILON7)) {
                        // X is along the cross of y and z (right handed basis / in the direction of motion)
                        xBasis = Cartesian3.cross(yBasis, zBasis, updateTransformCartesian3Scratch1);

                        Matrix3.multiplyByVector(toFixed, xBasis, xBasis);
                        Matrix3.multiplyByVector(toFixed, yBasis, yBasis);
                        Matrix3.multiplyByVector(toFixed, zBasis, zBasis);

                        Cartesian3.normalize(xBasis, xBasis);
                        Cartesian3.normalize(yBasis, yBasis);
                        Cartesian3.normalize(zBasis, zBasis);

                        hasBasis = true;
                    }
                }
            }

            if (hasBasis) {
                var transform = camera.transform;
                transform[0]  = xBasis.x;
                transform[1]  = xBasis.y;
                transform[2]  = xBasis.z;
                transform[3]  = 0.0;
                transform[4]  = yBasis.x;
                transform[5]  = yBasis.y;
                transform[6]  = yBasis.z;
                transform[7]  = 0.0;
                transform[8]  = zBasis.x;
                transform[9]  = zBasis.y;
                transform[10] = zBasis.z;
                transform[11] = 0.0;
                transform[12]  = cartesian.x;
                transform[13]  = cartesian.y;
                transform[14] = cartesian.z;
                transform[15] = 0.0;
            } else {
                // Stationary or slow-moving, low-altitude objects use East-North-Up.
                Transforms.eastNorthUpToFixedFrame(cartesian, ellipsoid, camera.transform);
            }
        }

        if (updateLookAt) {
            if (that.scene.mode === SceneMode.SCENE2D) {
                camera.lookAt(that._offset2D, Cartesian3.ZERO, that._up2D);
            } else {
                camera.lookAt(that._offset3D, Cartesian3.ZERO, that._up3D);
            }
        }
    }

    var offset3DCrossScratch = new Cartesian3();
    /**
     * A utility object for tracking an entity with the camera.
     * @alias EntityView
     * @constructor
     *
     * @param {Entity} entity The entity to track with the camera.
     * @param {Scene} scene The scene to use.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use for orienting the camera.
     */
    var EntityView = function(entity, scene, ellipsoid) {
        /**
         * The entity to track with the camera.
         * @type {Entity}
         */
        this.entity = entity;

        /**
         * The scene in which to track the object.
         * @type {Scene}
         */
        this.scene = scene;

        /**
         * The ellipsoid to use for orienting the camera.
         * @type {Ellipsoid}
         */
        this.ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

        //Shadow copies of the objects so we can detect changes.
        this._lastEntity = undefined;
        this._mode = undefined;

        //Re-usable objects to be used for retrieving position.
        this._lastCartesian = new Cartesian3();

        this._offset3D = new Cartesian3();
        this._up3D = new Cartesian3();
        this._offset2D = new Cartesian3();
        this._up2D = new Cartesian3();
    };

    // STATIC properties defined here, not per-instance.
    defineProperties(EntityView, {
        /**
         * Gets or sets a camera offset that will be used to
         * initialize subsequent EntityViews.
         * @memberof EntityView
         * @type {Cartesian3}
         */
        defaultOffset3D : {
            get : function() {
                return this._defaultOffset3D;
            },
            set : function(vector) {
                this._defaultOffset3D = Cartesian3.clone(vector, new Cartesian3());
                this._defaultUp3D = Cartesian3.cross(this._defaultOffset3D, Cartesian3.cross(Cartesian3.UNIT_Z,
                        this._defaultOffset3D, offset3DCrossScratch), new Cartesian3());
                Cartesian3.normalize(this._defaultUp3D, this._defaultUp3D);

                this._defaultOffset2D = new Cartesian3(0.0, 0.0, Cartesian3.magnitude(this._defaultOffset3D));
                this._defaultUp2D = Cartesian3.clone(Cartesian3.UNIT_Y);
            }
        }
    });

    // Initialize the static property.
    EntityView.defaultOffset3D = new Cartesian3(-14000, 3500, 3500);

    /**
    * Should be called each animation frame to update the camera
    * to the latest settings.
    * @param {JulianDate} time The current animation time.
    *
    */
    EntityView.prototype.update = function(time) {
        var scene = this.scene;
        var entity = this.entity;
        var ellipsoid = this.ellipsoid;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }
        if (!defined(scene)) {
            throw new DeveloperError('EntityView.scene is required.');
        }
        if (!defined(entity)) {
            throw new DeveloperError('EntityView.entity is required.');
        }
        if (!defined(ellipsoid)) {
            throw new DeveloperError('EntityView.ellipsoid is required.');
        }
        if (!defined(entity.position)) {
            throw new DeveloperError('entity.position is required.');
        }
        //>>includeEnd('debug');

        var positionProperty = entity.position;
        var objectChanged = entity !== this._lastEntity;
        var sceneModeChanged = scene.mode !== this._mode && scene.mode !== SceneMode.MORPHING;

        var offset3D = this._offset3D;
        var up3D = this._up3D;
        var offset2D = this._offset2D;
        var up2D = this._up2D;
        var camera = scene.camera;

        if (objectChanged) {
            var viewFromProperty = entity.viewFrom;
            if (!defined(viewFromProperty) || !defined(viewFromProperty.getValue(time, offset3D))) {
                Cartesian3.clone(EntityView._defaultOffset2D, offset2D);
                Cartesian3.clone(EntityView._defaultUp2D, up2D);
                Cartesian3.clone(EntityView._defaultOffset3D, offset3D);
                Cartesian3.clone(EntityView._defaultUp3D, up3D);
            } else {
                Cartesian3.cross(Cartesian3.UNIT_Z, offset3D, up3D);
                Cartesian3.cross(offset3D, up3D, up3D);
                Cartesian3.normalize(up3D, up3D);

                var mag = Cartesian3.magnitude(offset3D);
                Cartesian3.fromElements(0.0, 0.0, mag, offset2D);
                Cartesian3.clone(this._defaultUp2D, up2D);
            }
        } else if (!sceneModeChanged && scene.mode !== SceneMode.MORPHING) {
            if (this._mode === SceneMode.SCENE2D) {
                var distance = Math.max(camera.frustum.right - camera.frustum.left, camera.frustum.top - camera.frustum.bottom);
                Cartesian3.fromElements(0.0, 0.0, distance, offset2D);
                Cartesian3.clone(camera.up, up2D);
            } else if (this._mode === SceneMode.SCENE3D || this._mode === SceneMode.COLUMBUS_VIEW) {
                Cartesian3.clone(camera.position, offset3D);
                Cartesian3.clone(camera.up, up3D);
            }
        }

        var updateLookAt = objectChanged || sceneModeChanged;
        this._lastEntity = entity;
        this._mode = scene.mode !== SceneMode.MORPHING ? scene.mode : this._mode;

        if (scene.mode !== SceneMode.MORPHING) {
            updateTransform(this, scene.camera, updateLookAt, positionProperty, time, ellipsoid);
        }
    };

    return EntityView;
});
