/*global define*/
define([
        './Cartesian3',
        './defined',
        './DeveloperError'
    ], function(
        Cartesian3,
        defined,
        DeveloperError) {
    "use strict";

    /**
     * A plane in Hessian Normal Form defined by
     * <pre>
     * ax + by + cz + d = 0
     * </pre>
     * where (a, b, c) is the plane's <code>normal</code>, d is the signed
     * <code>distance</code> to the plane, and (x, y, z) is any point on
     * the plane.
     *
     * @alias Plane
     * @constructor
     *
     * @param {Cartesian3} normal The plane's normal (normalized).
     * @param {Number} distance The shortest distance from the origin to the plane.  The sign of
     * <code>distance</code> determines which side of the plane the origin
     * is on.  If <code>distance</code> is positive, the origin is in the half-space
     * in the direction of the normal; if negative, the origin is in the half-space
     * opposite to the normal; if zero, the plane passes through the origin.
     *
     * @exception {DeveloperError} normal is required.
     * @exception {DeveloperError} distance is required.
     *
     * @example
     * // The plane x=0
     * var plane = new Plane(Cartesian3.UNIT_X, 0.0);
     */
    var Plane = function(normal, distance) {
        if (!defined(normal))  {
            throw new DeveloperError('normal is required.');
        }

        if (!defined(distance)) {
            throw new DeveloperError('distance is required.');
        }

        /**
         * The plane's normal.
         *
         * @type {Cartesian3}
         */
        this.normal = Cartesian3.clone(normal);

        /**
         * The shortest distance from the origin to the plane.  The sign of
         * <code>distance</code> determines which side of the plane the origin
         * is on.  If <code>distance</code> is positive, the origin is in the half-space
         * in the direction of the normal; if negative, the origin is in the half-space
         * opposite to the normal; if zero, the plane passes through the origin.
         *
         * @type {Number}
         */
        this.distance = distance;
    };

    /**
     * Creates a plane from a normal and a point on the plane.
     * @memberof Plane
     *
     * @param {Cartesian3} point The point on the plane.
     * @param {Cartesian3} normal The plane's normal (normalized).
     * @param {Plane} [result] The object onto which to store the result.
     * @returns {Plane} A new plane instance or the modified result parameter.
     *
     * @exception {DeveloperError} point is required.
     * @exception {DeveloperError} normal is required.
     *
     * @example
     * var point = ellipsoid.cartographicToCartesian(Cartographic.fromDegrees(-72.0, 40.0));
     * var normal = ellipsoid.geodeticSurfaceNormal(point);
     * var tangentPlane = Plane.fromPointNormal(point, normal);
     */
    Plane.fromPointNormal = function(point, normal, result) {
        if (!defined(point)) {
            throw new DeveloperError('point is required.');
        }

        if (!defined(normal)) {
            throw new DeveloperError('normal is required.');
        }

        var distance = -Cartesian3.dot(normal, point);

        if (!defined(result)) {
            return new Plane(normal, distance);
        }

        Cartesian3.clone(normal, result.normal);
        result.distance = distance;
        return result;
    };

    /**
     * Computes the signed shortest distance of a point to a plane.
     * The sign of the distance determines which side of the plane the point
     * is on.  If the distance is positive, the point is in the half-space
     * in the direction of the normal; if negative, the point is in the half-space
     * opposite to the normal; if zero, the plane passes through the point.
     * @memberof Plane
     *
     * @param {Plane} plane The plane.
     * @param {Cartesian3} point The point.
     * @returns {Number} The signed shortest distance of the point to the plane.
     *
     * @exception {DeveloperError} plane is required.
     * @exception {DeveloperError} point is required.
     */
    Plane.getPointDistance = function(plane, point) {
        if (!defined(plane)) {
            throw new DeveloperError('plane is required.');
        }

        if (!defined(point)) {
            throw new DeveloperError('point is required.');
        }

        return Cartesian3.dot(plane.normal, point) + plane.distance;
    };


    /**
     * Computes the signed shortest distance of a point to this plane.
     * The sign of the distance determines which side of this plane the point
     * is on.  If the distance is positive, the point is in the half-space
     * in the direction of the normal; if negative, the point is in the half-space
     * opposite to the normal; if zero, this plane passes through the point.
     * @memberof Plane
     *
     * @param {Cartesian3} point The point.
     * @returns {Number} The signed shortest distance of the point to this plane.
     *
     * @exception {DeveloperError} point is required.
     */
    Plane.prototype.getPointDistance = function(point) {
        return Plane.getPointDistance(this, point);
    };

    return Plane;
});
