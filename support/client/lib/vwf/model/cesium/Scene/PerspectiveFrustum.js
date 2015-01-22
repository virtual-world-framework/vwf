/*global define*/
define([
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        './PerspectiveOffCenterFrustum'
    ], function(
        defined,
        defineProperties,
        DeveloperError,
        PerspectiveOffCenterFrustum) {
    "use strict";

    /**
     * The viewing frustum is defined by 6 planes.
     * Each plane is represented by a {@link Cartesian4} object, where the x, y, and z components
     * define the unit vector normal to the plane, and the w component is the distance of the
     * plane from the origin/camera position.
     *
     * @alias PerspectiveFrustum
     * @constructor
     *
     * @see PerspectiveOffCenterFrustum
     *
     * @example
     * var frustum = new Cesium.PerspectiveFrustum();
     * frustum.aspectRatio = canvas.clientWidth / canvas.clientHeight;
     * frustum.fov = Cesium.Math.PI_OVER_THREE;
     * frustum.near = 1.0;
     * frustum.far = 2.0;
     */
    var PerspectiveFrustum = function() {
        this._offCenterFrustum = new PerspectiveOffCenterFrustum();

        /**
         * The angle of the field of view (FOV), in radians.  This angle will be used
         * as the horizontal FOV if the width is greater than the height, otherwise
         * it will be the vertical FOV.
         * @type {Number}
         * @default undefined
         */
        this.fov = undefined;
        this._fov = undefined;
        this._fovy = undefined;

        /**
         * The aspect ratio of the frustum's width to it's height.
         * @type {Number}
         * @default undefined
         */
        this.aspectRatio = undefined;
        this._aspectRatio = undefined;

        /**
         * The distance of the near plane.
         * @type {Number}
         * @default 1.0
         */
        this.near = 1.0;
        this._near = this.near;

        /**
         * The distance of the far plane.
         * @type {Number}
         * @default 500000000.0
         */
        this.far = 500000000.0;
        this._far = this.far;
    };

    function update(frustum) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(frustum.fov) || !defined(frustum.aspectRatio) || !defined(frustum.near) || !defined(frustum.far)) {
            throw new DeveloperError('fov, aspectRatio, near, or far parameters are not set.');
        }
        //>>includeEnd('debug');

        var f = frustum._offCenterFrustum;

        if (frustum.fov !== frustum._fov || frustum.aspectRatio !== frustum._aspectRatio ||
                frustum.near !== frustum._near || frustum.far !== frustum._far) {
            //>>includeStart('debug', pragmas.debug);
            if (frustum.fov < 0 || frustum.fov >= Math.PI) {
                throw new DeveloperError('fov must be in the range [0, PI).');
            }

            if (frustum.aspectRatio < 0) {
                throw new DeveloperError('aspectRatio must be positive.');
            }

            if (frustum.near < 0 || frustum.near > frustum.far) {
                throw new DeveloperError('near must be greater than zero and less than far.');
            }
            //>>includeEnd('debug');

            frustum._aspectRatio = frustum.aspectRatio;
            frustum._fov = frustum.fov;
            frustum._fovy = (frustum.aspectRatio <= 1) ? frustum.fov : Math.atan(Math.tan(frustum.fov * 0.5) / frustum.aspectRatio) * 2.0;
            frustum._near = frustum.near;
            frustum._far = frustum.far;

            f.top = frustum.near * Math.tan(0.5 * frustum._fovy);
            f.bottom = -f.top;
            f.right = frustum.aspectRatio * f.top;
            f.left = -f.right;
            f.near = frustum.near;
            f.far = frustum.far;
        }
    }

    defineProperties(PerspectiveFrustum.prototype, {
        /**
         * Gets the perspective projection matrix computed from the view frustum.
         * @memberof PerspectiveFrustum.prototype
         * @type {Matrix4}
         *
         * @see PerspectiveFrustum#infiniteProjectionMatrix
         */
        projectionMatrix : {
            get : function() {
                update(this);
                return this._offCenterFrustum.projectionMatrix;
            }
        },

        /**
         * The perspective projection matrix computed from the view frustum with an infinite far plane.
         * @memberof PerspectiveFrustum.prototype
         * @type {Matrix4}
         *
         * @see PerspectiveFrustum#projectionMatrix
         */
        infiniteProjectionMatrix : {
            get : function() {
                update(this);
                return this._offCenterFrustum.infiniteProjectionMatrix;
            }
        },

        /**
         * Gets the angle of the vertical field of view, in radians.
         * @memberof PerspectiveFrustum.prototype
         * @type {Number}
         * @default undefined
         */
        fovy : {
            get : function() {
                update(this);
                return this._fovy;
            }
        }
    });

    /**
     * Creates a culling volume for this frustum.
     *
     * @param {Cartesian3} position The eye position.
     * @param {Cartesian3} direction The view direction.
     * @param {Cartesian3} up The up direction.
     * @returns {CullingVolume} A culling volume at the given position and orientation.
     *
     * @example
     * // Check if a bounding volume intersects the frustum.
     * var cullingVolume = frustum.computeCullingVolume(cameraPosition, cameraDirection, cameraUp);
     * var intersect = cullingVolume.computeVisibility(boundingVolume);
     */
    PerspectiveFrustum.prototype.computeCullingVolume = function(position, direction, up) {
        update(this);
        return this._offCenterFrustum.computeCullingVolume(position, direction, up);
    };

    /**
     * Returns the pixel's width and height in meters.
     *
     * @param {Cartesian2} drawingBufferDimensions A {@link Cartesian2} with width and height in the x and y properties, respectively.
     * @param {Number} [distance=near plane distance] The distance to the near plane in meters.
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new instance of {@link Cartesian2} with the pixel's width and height in the x and y properties, respectively.
     *
     * @exception {DeveloperError} drawingBufferDimensions.x must be greater than zero.
     * @exception {DeveloperError} drawingBufferDimensions.y must be greater than zero.
     *
     * @example
     * // Example 1
     * // Get the width and height of a pixel.
     * var pixelSize = camera.frustum.getPixelSize({
     *     width : canvas.clientWidth,
     *     height : canvas.clientHeight
     * });
     *
     * @example
     * // Example 2
     * // Get the width and height of a pixel if the near plane was set to 'distance'.
     * // For example, get the size of a pixel of an image on a billboard.
     * var position = camera.position;
     * var direction = camera.direction;
     * var toCenter = Cesium.Cartesian3.subtract(primitive.boundingVolume.center, position, new Cesium.Cartesian3());      // vector from camera to a primitive
     * var toCenterProj = Cesium.Cartesian3.multiplyByScalar(direction, Cesium.Cartesian3.dot(direction, toCenter)); // project vector onto camera direction vector
     * var distance = Cesium.Cartesian3.magnitude(toCenterProj);
     * var pixelSize = camera.frustum.getPixelSize({
     *     width : canvas.clientWidth,
     *     height : canvas.clientHeight
     * }, distance);
     */
    PerspectiveFrustum.prototype.getPixelSize = function(drawingBufferDimensions, distance, result) {
        update(this);
        return this._offCenterFrustum.getPixelSize(drawingBufferDimensions, distance, result);
    };

    /**
     * Returns a duplicate of a PerspectiveFrustum instance.
     *
     * @param {PerspectiveFrustum} [result] The object onto which to store the result.
     * @returns {PerspectiveFrustum} The modified result parameter or a new PerspectiveFrustum instance if one was not provided.
     */
    PerspectiveFrustum.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new PerspectiveFrustum();
        }

        result.aspectRatio = this.aspectRatio;
        result.fov = this.fov;
        result.near = this.near;
        result.far = this.far;

        // force update of clone to compute matrices
        result._aspectRatio = undefined;
        result._fov = undefined;
        result._near = undefined;
        result._far = undefined;

        this._offCenterFrustum.clone(result._offCenterFrustum);

        return result;
    };

    /**
     * Compares the provided PerspectiveFrustum componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {PerspectiveFrustum} [other] The right hand side PerspectiveFrustum.
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    PerspectiveFrustum.prototype.equals = function(other) {
        if (!defined(other)) {
            return false;
        }

        update(this);
        update(other);

        return (this.fov === other.fov &&
                this.aspectRatio === other.aspectRatio &&
                this.near === other.near &&
                this.far === other.far &&
                this._offCenterFrustum.equals(other._offCenterFrustum));
    };

    return PerspectiveFrustum;
});
