/*global define*/
define([
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Scene/PerspectiveOffCenterFrustum'
    ], function(
        defined,
        defineProperties,
        DeveloperError,
        PerspectiveOffCenterFrustum) {
    "use strict";

    /**
     * The viewing frustum is defined by 6 planes.
     * Each plane is represented by a {Cartesian4} object, where the x, y, and z components
     * define the unit vector normal to the plane, and the w component is the distance of the
     * plane from the origin/camera position.
     *
     * @alias PerspectiveFrustum
     * @constructor
     *
     * @see PerspectiveOffCenterFrustum
     *
     * @example
     * var frustum = new PerspectiveFrustum();
     * frustum.fovy = CesiumMath.PI_OVER_THREE;
     * frustum.aspectRatio = canvas.clientWidth / canvas.clientHeight;
     * frustum.near = 1.0;
     * frustum.far = 2.0;
     */
    var PerspectiveFrustum = function() {
        this._offCenterFrustum = new PerspectiveOffCenterFrustum();

        /**
         * The angle of the field of view, in radians.
         * @type {Number}
         * @default undefined
         */
        this.fovy = undefined;
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
        if (!defined(frustum.fovy) || !defined(frustum.aspectRatio) || !defined(frustum.near) || !defined(frustum.far)) {
            throw new DeveloperError('fovy, aspectRatio, near, or far parameters are not set.');
        }
        //>>includeEnd('debug');

        var f = frustum._offCenterFrustum;

        if (frustum.fovy !== frustum._fovy || frustum.aspectRatio !== frustum._aspectRatio ||
                frustum.near !== frustum._near || frustum.far !== frustum._far) {
            //>>includeStart('debug', pragmas.debug);
            if (frustum.fovy < 0 || frustum.fovy >= Math.PI) {
                throw new DeveloperError('fovy must be in the range [0, PI).');
            }

            if (frustum.aspectRatio < 0) {
                throw new DeveloperError('aspectRatio must be positive.');
            }

            if (frustum.near < 0 || frustum.near > frustum.far) {
                throw new DeveloperError('near must be greater than zero and less than far.');
            }
            //>>includeEnd('debug');

            frustum._fovy = frustum.fovy;
            frustum._aspectRatio = frustum.aspectRatio;
            frustum._near = frustum.near;
            frustum._far = frustum.far;

            f.top = frustum.near * Math.tan(0.5 * frustum.fovy);
            f.bottom = -f.top;
            f.right = frustum.aspectRatio * f.top;
            f.left = -f.right;
            f.near = frustum.near;
            f.far = frustum.far;
        }
    }

    defineProperties(PerspectiveFrustum.prototype, {
        /**
         * The perspective projection matrix computed from the view frustum.
         * @memberof PerspectiveFrustum
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
         * @memberof PerspectiveFrustum
         * @type {Matrix4}
         *
         * @see PerspectiveFrustum#projectionMatrix
         */
        infiniteProjectionMatrix : {
            get : function() {
                update(this);
                return this._offCenterFrustum.infiniteProjectionMatrix;
            }
        }
    });

    /**
     * Creates a culling volume for this frustum.
     *
     * @memberof PerspectiveFrustum
     *
     * @param {Cartesian3} position The eye position.
     * @param {Cartesian3} direction The view direction.
     * @param {Cartesian3} up The up direction.
     *
     * @exception {DeveloperError} position is required.
     * @exception {DeveloperError} direction is required.
     * @exception {DeveloperError} up is required.
     *
     * @returns {CullingVolume} A culling volume at the given position and orientation.
     *
     * @example
     * // Check if a bounding volume intersects the frustum.
     * var cullingVolume = frustum.computeCullingVolume(cameraPosition, cameraDirection, cameraUp);
     * var intersect = cullingVolume.getVisibility(boundingVolume);
     */
    PerspectiveFrustum.prototype.computeCullingVolume = function(position, direction, up) {
        update(this);
        return this._offCenterFrustum.computeCullingVolume(position, direction, up);
    };

    /**
     * Returns the pixel's width and height in meters.
     *
     * @memberof PerspectiveFrustum
     *
     * @param {Cartesian2} drawingBufferDimensions A {@link Cartesian2} with width and height in the x and y properties, respectively.
     * @param {Number} [distance=near plane distance] The distance to the near plane in meters.
     * @param {Cartesian2} [result] The object onto which to store the result.
     * @returns {Cartesian2} The modified result parameter or a new instance of {@link Cartesian2} with the pixel's width and height in the x and y properties, respectively.
     *
     * @exception {DeveloperError} drawingBufferDimensions is required.
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
     * // Example 2
     * // Get the width and height of a pixel if the near plane was set to 'distance'.
     * // For example, get the size of a pixel of an image on a billboard.
     * var position = camera.position;
     * var direction = camera.direction;
     * var toCenter = Cartesian3.subtract(primitive.boundingVolume.center, position);      // vector from camera to a primitive
     * var toCenterProj = Cartesian3.multiplyByScalar(direction, Cartesian3.dot(direction, toCenter)); // project vector onto camera direction vector
     * var distance = Cartesian3.magnitude(toCenterProj);
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
     * @memberof PerspectiveFrustum
     *
     * @param {PerspectiveFrustum} [result] The object onto which to store the result.
     * @returns {PerspectiveFrustum} The modified result parameter or a new PerspectiveFrustum instance if one was not provided.
     */
    PerspectiveFrustum.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new PerspectiveFrustum();
        }

        result.fovy = this.fovy;
        result.aspectRatio = this.aspectRatio;
        result.near = this.near;
        result.far = this.far;

        // force update of clone to compute matrices
        result._fovy = undefined;
        result._aspectRatio = undefined;
        result._near = undefined;
        result._far = undefined;

        this._offCenterFrustum.clone(result._offCenterFrustum);

        return result;
    };

    /**
     * Compares the provided PerspectiveFrustum componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @memberof PerspectiveFrustum
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

        return (this.fovy === other.fovy &&
                this.aspectRatio === other.aspectRatio &&
                this.near === other.near &&
                this.far === other.far &&
                this._offCenterFrustum.equals(other._offCenterFrustum));
    };

    return PerspectiveFrustum;
});
