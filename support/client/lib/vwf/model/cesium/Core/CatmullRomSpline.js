/*global define*/
define([
        './defaultValue',
        './defined',
        './DeveloperError',
        './Matrix4',
        './Cartesian3',
        './Cartesian4',
        './Spline',
        './HermiteSpline'
    ], function(
        defaultValue,
        defined,
        DeveloperError,
        Matrix4,
        Cartesian3,
        Cartesian4,
        Spline,
        HermiteSpline) {
    "use strict";

    var scratchTimeVec = new Cartesian4();
    var scratchTemp0 = new Cartesian3();
    var scratchTemp1 = new Cartesian3();

    function createEvaluateFunction(spline) {
        var points = spline.points;
        var times = spline.times;

        if (points.length < 3) {
            var t0 = times[0];
            var invSpan = 1.0 / (times[1] - t0);

            var p0 = points[0];
            var p1 = points[1];

            return function(time, result) {
                var u = (time - t0) * invSpan;
                return Cartesian3.lerp(p0, p1, u, result);
            };
        }

        return function(time, result) {
            var i = spline._lastTimeIndex = spline.findTimeInterval(time, spline._lastTimeIndex);
            var u = (time - times[i]) / (times[i + 1] - times[i]);

            var timeVec = scratchTimeVec;
            timeVec.z = u;
            timeVec.y = u * u;
            timeVec.x = timeVec.y * u;
            timeVec.w = 1.0;

            var p0, p1, p2, p3, coefs;
            if (i === 0) {
                p0 = points[0];
                p1 = points[1];
                p2 = spline.firstTangent;

                p3 = Cartesian3.subtract(points[2], p0, scratchTemp0);
                Cartesian3.multiplyByScalar(p3, 0.5, p3);

                coefs = Matrix4.multiplyByVector(HermiteSpline.hermiteCoefficientMatrix, timeVec, timeVec);
            } else if (i === points.length - 2) {
                p0 = points[i];
                p1 = points[i + 1];
                p3 = spline.lastTangent;

                p2 = Cartesian3.subtract(p1, points[i - 1], scratchTemp0);
                Cartesian3.multiplyByScalar(p2, 0.5, p2);

                coefs = Matrix4.multiplyByVector(HermiteSpline.hermiteCoefficientMatrix, timeVec, timeVec);
            } else {
                p0 = points[i - 1];
                p1 = points[i];
                p2 = points[i + 1];
                p3 = points[i + 2];
                coefs = Matrix4.multiplyByVector(CatmullRomSpline.catmullRomCoefficientMatrix, timeVec, timeVec);
            }
            result = Cartesian3.multiplyByScalar(p0, coefs.x, result);
            Cartesian3.multiplyByScalar(p1, coefs.y, scratchTemp1);
            Cartesian3.add(result, scratchTemp1, result);
            Cartesian3.multiplyByScalar(p2, coefs.z, scratchTemp1);
            Cartesian3.add(result, scratchTemp1, result);
            Cartesian3.multiplyByScalar(p3, coefs.w, scratchTemp1);
            return Cartesian3.add(result, scratchTemp1, result);
        };
    }
    var firstTangentScratch = new Cartesian3();
    var lastTangentScratch = new Cartesian3();

    /**
     * A Catmull-Rom spline is a cubic spline where the tangent at control points,
     * except the first and last, are computed using the previous and next control points.
     * Catmull-Rom splines are in the class C<sup>1</sup>.
     *
     * @alias CatmullRomSpline
     * @constructor
     *
     * @param {Array} options.times The array of control point times.
     * @param {Array} options.points The array of control points.
     * @param {Cartesian3} [options.firstTangent] The tangent of the curve at the first control point.
     *                     If the tangent is not given, it will be estimated.
     * @param {Cartesian3} [options.lastTangent] The tangent of the curve at the last control point.
     *                     If the tangent is not given, it will be estimated.
     *
     * @exception {DeveloperError} points is required.
     * @exception {DeveloperError} points.length must be greater than or equal to 2.
     * @exception {DeveloperError} times is required.
     * @exception {DeveloperError} times.length must be equal to points.length.
     *
     * @see HermiteSpline
     *
     * @example
     * // spline above the earth from Philadelphia to Los Angeles
     * var spline = new CatmullRomSpline({
     *     times : [ 0.0, 1.5, 3.0, 4.5, 6.0 ],
     *     points : [
     *         new Cartesian3(1235398.0, -4810983.0, 4146266.0),
     *         new Cartesian3(1372574.0, -5345182.0, 4606657.0),
     *         new Cartesian3(-757983.0, -5542796.0, 4514323.0),
     *         new Cartesian3(-2821260.0, -5248423.0, 4021290.0),
     *         new Cartesian3(-2539788.0, -4724797.0, 3620093.0)
     *     ]
     * });
     */
    var CatmullRomSpline = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var points = options.points;
        var times = options.times;
        var firstTangent = options.firstTangent;
        var lastTangent = options.lastTangent;

        if (!defined(points)) {
            throw new DeveloperError('points is required.');
        }

        if (points.length < 2) {
            throw new DeveloperError('points.length must be greater than or equal to 2.');
        }

        if (!defined(times)) {
            throw new DeveloperError('times is required.');
        }

        if (times.length !== points.length) {
            throw new DeveloperError('times.length must be equal to points.length.');
        }

        if (points.length > 2) {
            if (!defined(firstTangent)) {
                firstTangent = firstTangentScratch;
                Cartesian3.multiplyByScalar(points[1], 2.0, firstTangent);
                Cartesian3.subtract(firstTangent, points[2], firstTangent);
                Cartesian3.subtract(firstTangent, points[0], firstTangent);
                Cartesian3.multiplyByScalar(firstTangent, 0.5, firstTangent);
            }

            if (!defined(lastTangent)) {
                var n = points.length - 1;
                lastTangent = lastTangentScratch;
                Cartesian3.multiplyByScalar(points[n - 1], 2.0, lastTangent);
                Cartesian3.subtract(points[n], lastTangent, lastTangent);
                Cartesian3.add(lastTangent, points[n - 2], lastTangent);
                Cartesian3.multiplyByScalar(lastTangent, 0.5, lastTangent);
            }
        }

        /**
         * An array of times for the control points.
         * @type {Array}
         * @readonly
         */
        this.times = times;

        /**
         * An array of {@link Cartesian3} control points.
         * @type {Array}
         * @readonly
         */
        this.points = points;

        /**
         * The tangent at the first control point.
         * @type {Cartesian3}
         * @readonly
         */
        this.firstTangent = Cartesian3.clone(firstTangent);

        /**
         * The tangent at the last control point.
         * @type {Cartesian3}
         * @readonly
         */
        this.lastTangent = Cartesian3.clone(lastTangent);

        this._evaluateFunction = createEvaluateFunction(this);
        this._lastTimeIndex = 0;
    };

    CatmullRomSpline.catmullRomCoefficientMatrix = new Matrix4(
            -0.5,  1.0, -0.5,  0.0,
             1.5, -2.5,  0.0,  1.0,
            -1.5,  2.0,  0.5,  0.0,
             0.5, -0.5,  0.0,  0.0);

    /**
     * Finds an index <code>i</code> in <code>times</code> such that the parameter
     * <code>time</code> is in the interval <code>[times[i], times[i + 1]]</code>.
     * @memberof CatmullRomSpline
     *
     * @param {Number} time The time.
     * @returns {Number} The index for the element at the start of the interval.
     *
     * @exception {DeveloperError} time is required.
     * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
     *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
     *                             in the array <code>times</code>.
     */
    CatmullRomSpline.prototype.findTimeInterval = Spline.prototype.findTimeInterval;

    /**
     * Evaluates the curve at a given time.
     * @memberof CatmullRomSpline
     *
     * @param {Number} time The time at which to evaluate the curve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new instance of the point on the curve at the given time.
     *
     * @exception {DeveloperError} time is required.
     * @exception {DeveloperError} time must be in the range <code>[t<sub>0</sub>, t<sub>n</sub>]</code>, where <code>t<sub>0</sub></code>
     *                             is the first element in the array <code>times</code> and <code>t<sub>n</sub></code> is the last element
     *                             in the array <code>times</code>.
     *
     * @example
     * // spline above the earth from Philadelphia to Los Angeles
     * var spline = new CatmullRomSpline({
     *     times : [ 0.0, 1.5, 3.0, 4.5, 6.0 ],
     *     points : [
     *         new Cartesian3(1235398.0, -4810983.0, 4146266.0),
     *         new Cartesian3(1372574.0, -5345182.0, 4606657.0),
     *         new Cartesian3(-757983.0, -5542796.0, 4514323.0),
     *         new Cartesian3(-2821260.0, -5248423.0, 4021290.0),
     *         new Cartesian3(-2539788.0, -4724797.0, 3620093.0)
     *     ]
     * });
     *
     * // some position above Los Angeles
     * var position = spline.evaluate(5.0);
     */
    CatmullRomSpline.prototype.evaluate = function(time, result) {
        return this._evaluateFunction(time, result);
    };

    return CatmullRomSpline;
});
