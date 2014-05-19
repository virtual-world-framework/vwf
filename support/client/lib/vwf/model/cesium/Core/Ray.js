/*global define*/
define([
        './DeveloperError',
        './defaultValue',
        './Cartesian3'
       ], function(
         DeveloperError,
         defaultValue,
         Cartesian3) {
    "use strict";

    /**
     * Represents a ray that extends infinitely from the provided origin in the provided direction.
     * @alias Ray
     * @constructor
     *
     * @param {Cartesian3} [origin=Cartesian3.ZERO] The origin of the ray.
     * @param {Cartesian3} [direction=Cartesian3.ZERO] The direction of the ray.
     */
    var Ray = function(origin, direction) {
        direction = Cartesian3.clone(defaultValue(direction, Cartesian3.ZERO));
        if (!Cartesian3.equals(direction, Cartesian3.ZERO)) {
            Cartesian3.normalize(direction, direction);
        }

        /**
         * The origin of the ray.
         * @type {Cartesian3}
         * @default {@link Cartesian3.ZERO}
         */
        this.origin = Cartesian3.clone(defaultValue(origin, Cartesian3.ZERO));

        /**
         * The direction of the ray.
         * @type {Cartesian3}
         */
        this.direction = direction;
    };

    /**
     * Computes the point along the ray given by r(t) = o + t*d,
     * where o is the origin of the ray and d is the direction.
     * @memberof Ray
     *
     * @param {Number} t A scalar value.
     * @param {Cartesian3} [result] The object in which the result will be stored.
     * @returns The modified result parameter, or a new instance if none was provided.
     *
     * @exception {DeveloperError} t is a required number
     *
     * @example
     * //Get the first intersection point of a ray and an ellipsoid.
     * var intersection = IntersectionTests.rayEllipsoid(ray, ellipsoid);
     * var point = ray.getPoint(intersection.start);
     */
    Ray.prototype.getPoint = function(t, result) {
        if (typeof t !== 'number') {
            throw new DeveloperError('t is a required number');
        }

        result = Cartesian3.multiplyByScalar(this.direction, t, result);
        return Cartesian3.add(this.origin, result, result);
    };

    return Ray;
});
