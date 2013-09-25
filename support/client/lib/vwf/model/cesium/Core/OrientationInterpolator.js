/*global define*/
define([
        './defined',
        './DeveloperError'
    ], function(
        defined,
        DeveloperError) {
    "use strict";

    /**
     * Smoothly interpolates orientation, represented by <code>Quaternion</code>s, over time.
     * For example, this can be used to set a camera's axes along a path.
     *
     * @alias OrientationInterpolator
     * @constructor
     *
     * @param {Array} controlPoints An array, of at least length 2, of objects with <code>orientation</code> and
     * <code>time</code> properties.
     *
     * @exception {DeveloperError} controlPoints is required. It must be an array with at least a length of 3.
     *
     * @see Quaternion
     * @see CatmullRomSpline
     * @see HermiteSpline
     */
    var OrientationInterpolator = function(controlPoints) {
        if (!defined(controlPoints) || !(controlPoints instanceof Array) || controlPoints.length < 2) {
            throw new DeveloperError('controlPoints is required. It must be an array with at least a length of 3.');
        }

        this._points = controlPoints;
        this._lastTimeIndex = 0;
    };

    /**
     * Returns the array of control points.
     *
     * @memberof OrientationInterpolator
     * @returns {Array} The array of control points.
     */
    OrientationInterpolator.prototype.getControlPoints = function() {
        return this._points;
    };

    function findIndex(orientationInterpolator, time) {
        // Take advantage of temporal coherence by checking current, next and previous intervals
        // for containment of time.
        var i = orientationInterpolator._lastTimeIndex || 0;
        if (time >= orientationInterpolator._points[i].time) {
            if (i + 1 < orientationInterpolator._points.length && time < orientationInterpolator._points[i + 1].time) {
                return i;
            } else if (i + 2 < orientationInterpolator._points.length && time < orientationInterpolator._points[i + 2].time) {
                orientationInterpolator._lastTimeIndex = i + 1;
                return orientationInterpolator._lastTimeIndex;
            }
        } else if (i - 1 >= 0 && time >= orientationInterpolator._points[i - 1].time) {
            orientationInterpolator._lastTimeIndex = i - 1;
            return orientationInterpolator._lastTimeIndex;
        }

        // The above failed so do a linear search. For the use cases so far, the
        // length of the list is less than 10. In the future, if there is a bottle neck,
        // it might be here.
        for (i = 0; i < orientationInterpolator._points.length - 1; ++i) {
            if (time >= orientationInterpolator._points[i].time && time < orientationInterpolator._points[i + 1].time) {
                break;
            }
        }

        if (i === orientationInterpolator._points.length - 1) {
            i = orientationInterpolator._points.length - 2;
        }

        orientationInterpolator._lastTimeIndex = i;
        return orientationInterpolator._lastTimeIndex;
    }

    /**
     * Evaluates the orientation at a given time.
     *
     * @memberof OrientationInterpolator
     *
     * @param {Number} time The time at which to evaluate the orientation.
     *
     * @exception {DeveloperError} time is required.
     * @exception {DeveloperError} time must be in the range <code>[a<sub>0</sub>, a<sub>n</sub>]</code>,
     * where <code>a<sub>0</sub></code> and <code>a<sub>n</sub></code> are the time properties of first and
     * last elements in the array given during construction, respectively.
     *
     * @returns {Quaternion} The orientation at the given <code>time</code>.
     */
    OrientationInterpolator.prototype.evaluate = function(time) {
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }

        if (time < this._points[0].time || time > this._points[this._points.length - 1].time) {
            throw new DeveloperError('time is out of range.');
        }

        var i = findIndex(this, time);
        var u = (time - this._points[i].time) / (this._points[i + 1].time - this._points[i].time);

        return this._points[i].orientation.slerp(this._points[i + 1].orientation, u);
    };

    return OrientationInterpolator;
});