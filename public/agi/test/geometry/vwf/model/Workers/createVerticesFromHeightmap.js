/**
 * Cesium - https://github.com/AnalyticalGraphicsInc/cesium
 *
 * Copyright 2011-2013 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md for full licensing details.
 */

/*global define*/
define('Core/freezeObject',[],function() {
    

    /**
     * Freezes an object, using Object.freeze if available, otherwise returns
     * the object unchanged.  This function should be used in setup code to prevent
     * errors from completely halting JavaScript execution in legacy browsers.
     *
     * @private
     *
     * @exports freezeObject
     */
    var freezeObject = Object.freeze;
    if (typeof freezeObject === 'undefined') {
        freezeObject = function(o) {
            return o;
        };
    }

    return freezeObject;
});
/*global define*/
define('Core/defaultValue',[
        './freezeObject'
    ], function(
        freezeObject) {
    

    /**
     * Returns the first parameter if not undefined, otherwise the second parameter.
     * Useful for setting a default value for a parameter.
     *
     * @exports defaultValue
     *
     * @example
     * param = defaultValue(param, 'default');
     */
    var defaultValue = function(a, b) {
        if (typeof a !== 'undefined') {
            return a;
        }
        return b;
    };

    /**
     * A frozen empty object that can be used as the default value for options passed as
     * an object literal.
     */
    defaultValue.EMPTY_OBJECT = freezeObject({});

    return defaultValue;
});
/*global define*/
define('Core/DeveloperError',[],function() {
    

    /**
     * Constructs an exception object that is thrown due to a developer error, e.g., invalid argument,
     * argument out of range, etc.  This exception should only be thrown during development;
     * it usually indicates a bug in the calling code.  This exception should never be
     * caught; instead the calling code should strive not to generate it.
     * <br /><br />
     * On the other hand, a {@link RuntimeError} indicates an exception that may
     * be thrown at runtime, e.g., out of memory, that the calling code should be prepared
     * to catch.
     *
     * @alias DeveloperError
     *
     * @param {String} [message=undefined] The error message for this exception.
     *
     * @see RuntimeError
     * @constructor
     */
    var DeveloperError = function(message) {
        /**
         * 'DeveloperError' indicating that this exception was thrown due to a developer error.
         * @type String
         * @constant
         */
        this.name = 'DeveloperError';

        /**
         * The explanation for why this exception was thrown.
         * @type String
         * @constant
         */
        this.message = message;

        /**
         * The Error object containing the stack trace.
         * @type Error
         * @constant
         *
         * @see <a href='https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error'>Error object on Mozilla Developer Network</a>.
         */
        this.error = new Error();

        /**
         * The stack trace of this exception.
         * @type String
         * @constant
         */
        this.stack = this.error.stack;
    };

    DeveloperError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;

        if (typeof this.stack !== 'undefined') {
            str += '\n' + this.stack.toString();
        } else {
            str += '\n' + this.error.toString();
        }

        return str;
    };

    return DeveloperError;
});

/*global define*/
define('Core/Cartesian3',[
        './defaultValue',
        './DeveloperError',
        './freezeObject'
    ], function(
        defaultValue,
        DeveloperError,
        freezeObject) {
    

    /**
     * A 3D Cartesian point.
     * @alias Cartesian3
     * @constructor
     *
     * @param {Number} [x=0.0] The X component.
     * @param {Number} [y=0.0] The Y component.
     * @param {Number} [z=0.0] The Z component.
     *
     * @see Cartesian2
     * @see Cartesian4
     */
    var Cartesian3 = function(x, y, z) {
        /**
         * The X component.
         * @type Number
         */
        this.x = defaultValue(x, 0.0);

        /**
         * The Y component.
         * @type Number
         */
        this.y = defaultValue(y, 0.0);

        /**
         * The Z component.
         * @type Number
         */
        this.z = defaultValue(z, 0.0);
    };

    /**
     * Converts the provided Spherical into Cartesian3 coordinates.
     * @memberof Cartesian3
     *
     * @param {Spherical} spherical The Spherical to be converted to Cartesian3.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} spherical is required.
     */
    Cartesian3.fromSpherical = function(spherical, result) {
        if (typeof spherical === 'undefined') {
            throw new DeveloperError('spherical is required');
        }
        if (typeof result === 'undefined') {
            result = new Cartesian3();
        }
        var clock = spherical.clock;
        var cone = spherical.cone;
        var magnitude = defaultValue(spherical.magnitude, 1.0);
        var radial = magnitude * Math.sin(cone);
        result.x = radial * Math.cos(clock);
        result.y = radial * Math.sin(clock);
        result.z = magnitude * Math.cos(cone);
        return result;
    };

    /**
     * Creates a Cartesian3 from three consecutive elements in an array.
     * @memberof Cartesian3
     *
     * @param {Array} values The array whose three consecutive elements correspond to the x, y, and z components, respectively.
     * @param {Number} [offset=0] The offset into the array of the first element, which corresponds to the x component.
     * @param {Cartesian3} [result] The object onto which to store the result.
     *
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     * @exception {DeveloperError} offset + 3 is greater than the length of the array.
     *
     * @example
     * // Create a Cartesian3 with (1.0, 2.0, 3.0)
     * var v = [1.0, 2.0, 3.0];
     * var p = Cartesian3.fromArray(v);
     *
     * // Create a Cartesian3 with (1.0, 2.0, 3.0) using an offset into an array
     * var v2 = [0.0, 0.0, 1.0, 2.0, 3.0];
     * var p2 = Cartesian3.fromArray(v2, 2);
     */
    Cartesian3.fromArray = function(values, offset, result) {
        if (typeof values === 'undefined') {
            throw new DeveloperError('values is required.');
        }

        if (offset + 3 > values.length) {
            throw new DeveloperError('offset + 3 is greater than the length of the array.');
        }

        offset = defaultValue(offset, 0);

        if (typeof result === 'undefined') {
            result = new Cartesian3();
        }

        result.x = values[offset + 0];
        result.y = values[offset + 1];
        result.z = values[offset + 2];
        return result;
    };

    /**
     * Creates a Cartesian3 instance from x, y and z coordinates.
     * @memberof Cartesian3
     *
     * @param {Number} x The x coordinate.
     * @param {Number} y The y coordinate.
     * @param {Number} z The z coordinate.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.fromElements = function(x, y, z, result) {
        if (typeof result === 'undefined') {
            return new Cartesian3(x, y, z);
        }

        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Duplicates a Cartesian3 instance.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian to duplicate.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided. (Returns undefined if cartesian is undefined)
     */
    Cartesian3.clone = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            return undefined;
        }

        if (typeof result === 'undefined') {
            return new Cartesian3(cartesian.x, cartesian.y, cartesian.z);
        }

        result.x = cartesian.x;
        result.y = cartesian.y;
        result.z = cartesian.z;
        return result;
    };

    /**
     * Creates a Cartesian3 instance from an existing Cartesian4.  This simply takes the
     * x, y, and z properties of the Cartesian4 and drops w.
     * @function
     *
     * @param {Cartesian4} cartesian The Cartesian4 instance to create a Cartesian3 instance from.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.fromCartesian4 = Cartesian3.clone;

    /**
     * Computes the value of the maximum component for the supplied Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} The cartesian to use.
     * @return {Number} The value of the maximum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.getMaximumComponent = function(cartesian) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        return Math.max(cartesian.x, cartesian.y, cartesian.z);
    };

    /**
     * Computes the value of the minimum component for the supplied Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} The cartesian to use.
     * @return {Number} The value of the minimum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.getMinimumComponent = function(cartesian) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        return Math.min(cartesian.x, cartesian.y, cartesian.z);
    };

    /**
     * Computes the provided Cartesian's squared magnitude.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
     * @return {Number} The squared magnitude.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.magnitudeSquared = function(cartesian) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z;
    };

    /**
     * Computes the Cartesian's magnitude (length).
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian instance whose magnitude is to be computed.
     * @return {Number} The magnitude.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian3.magnitudeSquared(cartesian));
    };

    var distanceScratch = new Cartesian3();

    /**
     * Computes the distance between two points
     * @memberof Cartesian3
     *
     * @param {Cartesian3} left The first point to compute the distance from.
     * @param {Cartesian3} right The second point to compute the distance to.
     *
     * @return {Number} The distance between two points.
     *
     * @exception {DeveloperError} left and right are required.
     *
     * @example
     * // Returns 1.0
     * var d = Cartesian3.distance(new Cartesian3(1.0, 0.0, 0.0), new Cartesian3(2.0, 0.0, 0.0));
     */
    Cartesian3.distance = function(left, right) {
        if ((typeof left === 'undefined') || (typeof right === 'undefined')) {
            throw new DeveloperError('left and right are required.');
        }

        Cartesian3.subtract(left, right, distanceScratch);
        return Cartesian3.magnitude(distanceScratch);
    };

    /**
     * Computes the normalized form of the supplied Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian to be normalized.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.normalize = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        var magnitude = Cartesian3.magnitude(cartesian);
        if (typeof result === 'undefined') {
            return new Cartesian3(cartesian.x / magnitude, cartesian.y / magnitude, cartesian.z / magnitude);
        }
        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        result.z = cartesian.z / magnitude;
        return result;
    };

    /**
     * Computes the dot (scalar) product of two Cartesians.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @return {Number} The dot product.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.dot = function(left, right) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        return left.x * right.x + left.y * right.y + left.z * right.z;
    };

    /**
     * Computes the componentwise product of two Cartesians.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.multiplyComponents = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(left.x * right.x, left.y * right.y, left.z * right.z);
        }
        result.x = left.x * right.x;
        result.y = left.y * right.y;
        result.z = left.z * right.z;
        return result;
    };

    /**
     * Computes the componentwise sum of two Cartesians.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.add = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(left.x + right.x, left.y + right.y, left.z + right.z);
        }
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        return result;
    };

    /**
     * Computes the componentwise difference of two Cartesians.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.subtract = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(left.x - right.x, left.y - right.y, left.z - right.z);
        }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        return result;
    };

    /**
     * Multiplies the provided Cartesian componentwise by the provided scalar.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian to be scaled.
     * @param {Number} scalar The scalar to multiply with.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian3.multiplyByScalar = function(cartesian, scalar, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(cartesian.x * scalar,  cartesian.y * scalar,  cartesian.z * scalar);
        }
        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        result.z = cartesian.z * scalar;
        return result;
    };

    /**
     * Divides the provided Cartesian componentwise by the provided scalar.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian to be divided.
     * @param {Number} scalar The scalar to divide by.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian3.divideByScalar = function(cartesian, scalar, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(cartesian.x / scalar, cartesian.y / scalar, cartesian.z / scalar);
        }
        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        result.z = cartesian.z / scalar;
        return result;
    };

    /**
     * Negates the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian to be negated.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.negate = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(-cartesian.x, -cartesian.y, -cartesian.z);
        }
        result.x = -cartesian.x;
        result.y = -cartesian.y;
        result.z = -cartesian.z;
        return result;
    };

    /**
     * Computes the absolute value of the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian whose absolute value is to be computed.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.abs = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(Math.abs(cartesian.x), Math.abs(cartesian.y), Math.abs(cartesian.z));
        }
        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        result.z = Math.abs(cartesian.z);
        return result;
    };

    var lerpScratch = new Cartesian3();
    /**
     * Computes the linear interpolation or extrapolation at t using the provided cartesians.
     * @memberof Cartesian3
     *
     * @param start The value corresponding to t at 0.0.
     * @param end The value corresponding to t at 1.0.
     * @param t The point along t at which to interpolate.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} start is required.
     * @exception {DeveloperError} end is required.
     * @exception {DeveloperError} t is required and must be a number.
     */
    Cartesian3.lerp = function(start, end, t, result) {
        if (typeof start === 'undefined') {
            throw new DeveloperError('start is required.');
        }
        if (typeof end === 'undefined') {
            throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
            throw new DeveloperError('t is required and must be a number.');
        }
        Cartesian3.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian3.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian3.add(lerpScratch, result, result);
    };

    var angleBetweenScratch = new Cartesian3();
    var angleBetweenScratch2 = new Cartesian3();
    /**
     * Returns the angle, in radians, between the provided Cartesians.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @return {Number} The angle between the Cartesians.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.angleBetween = function(left, right) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        Cartesian3.normalize(left, angleBetweenScratch);
        Cartesian3.normalize(right, angleBetweenScratch2);
        var cosine = Cartesian3.dot(angleBetweenScratch, angleBetweenScratch2);
        var sine = Cartesian3.cross(angleBetweenScratch, angleBetweenScratch2, angleBetweenScratch).magnitude();
        return Math.atan2(sine, cosine);
    };

    var mostOrthogonalAxisScratch = new Cartesian3();
    /**
     * Returns the axis that is most orthogonal to the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian on which to find the most orthogonal axis.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The most orthogonal axis.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.mostOrthogonalAxis = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required.');
        }

        var f = Cartesian3.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian3.abs(f, f);

        if (f.x <= f.y) {
            if (f.x <= f.z) {
                result = Cartesian3.clone(Cartesian3.UNIT_X, result);
            } else {
                result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
            }
        } else {
            if (f.y <= f.z) {
                result = Cartesian3.clone(Cartesian3.UNIT_Y, result);
            } else {
                result = Cartesian3.clone(Cartesian3.UNIT_Z, result);
            }
        }

        return result;
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [left] The first Cartesian.
     * @param {Cartesian3} [right] The second Cartesian.
     * @return {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartesian3.equals = function(left, right) {
        return (left === right) ||
               ((typeof left !== 'undefined') &&
                (typeof right !== 'undefined') &&
                (left.x === right.x) &&
                (left.y === right.y) &&
                (left.z === right.z));
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [left] The first Cartesian.
     * @param {Cartesian3} [right] The second Cartesian.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartesian3.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number.');
        }
        return (left === right) ||
               ((typeof left !== 'undefined') &&
                (typeof right !== 'undefined') &&
                (Math.abs(left.x - right.x) <= epsilon) &&
                (Math.abs(left.y - right.y) <= epsilon) &&
                (Math.abs(left.z - right.z) <= epsilon));
    };

    /**
     * Computes the cross (outer) product of two Cartesians.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} left The first Cartesian.
     * @param {Cartesian3} right The second Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The cross product.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.cross = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }

        var leftX = left.x;
        var leftY = left.y;
        var leftZ = left.z;
        var rightX = right.x;
        var rightY = right.y;
        var rightZ = right.z;

        var x = leftY * rightZ - leftZ * rightY;
        var y = leftZ * rightX - leftX * rightZ;
        var z = leftX * rightY - leftY * rightX;

        if (typeof result === 'undefined') {
            return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * An immutable Cartesian3 instance initialized to (0.0, 0.0, 0.0).
     * @memberof Cartesian3
     */
    Cartesian3.ZERO = freezeObject(new Cartesian3(0.0, 0.0, 0.0));

    /**
     * An immutable Cartesian3 instance initialized to (1.0, 0.0, 0.0).
     * @memberof Cartesian3
     */
    Cartesian3.UNIT_X = freezeObject(new Cartesian3(1.0, 0.0, 0.0));

    /**
     * An immutable Cartesian3 instance initialized to (0.0, 1.0, 0.0).
     * @memberof Cartesian3
     */
    Cartesian3.UNIT_Y = freezeObject(new Cartesian3(0.0, 1.0, 0.0));

    /**
     * An immutable Cartesian3 instance initialized to (0.0, 0.0, 1.0).
     * @memberof Cartesian3
     */
    Cartesian3.UNIT_Z = freezeObject(new Cartesian3(0.0, 0.0, 1.0));

    /**
     * Computes the value of the maximum component for this Cartesian.
     * @memberof Cartesian3
     *
     * @return {Number} The value of the maximum component.
     */
    Cartesian3.prototype.getMaximumComponent = function() {
        return Cartesian3.getMaximumComponent(this);
    };

    /**
     * Computes the value of the minimum component for this Cartesian.
     * @memberof Cartesian3
     *
     * @return {Number} The value of the minimum component.
     */
    Cartesian3.prototype.getMinimumComponent = function() {
        return Cartesian3.getMinimumComponent(this);
    };

    /**
     * Duplicates this Cartesian3 instance.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.clone = function(result) {
        return Cartesian3.clone(this, result);
    };

    /**
     * Computes this Cartesian's squared magnitude.
     * @memberof Cartesian3
     *
     * @return {Number} The squared magnitude.
     */
    Cartesian3.prototype.magnitudeSquared = function() {
        return Cartesian3.magnitudeSquared(this);
    };

    /**
     * Computes this Cartesian's magnitude (length).
     * @memberof Cartesian3
     *
     * @return {Number} The magnitude.
     */
    Cartesian3.prototype.magnitude = function() {
        return Cartesian3.magnitude(this);
    };

    /**
     * Computes the normalized form of this Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.normalize = function(result) {
        return Cartesian3.normalize(this, result);
    };

    /**
     * Computes the dot (scalar) product of this Cartesian and a supplied cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} right The right hand side Cartesian.
     * @return {Number} The dot product.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.prototype.dot = function(right) {
        return Cartesian3.dot(this, right);
    };

    /**
     * Computes the componentwise product of this Cartesian and the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} right The right hand side Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.prototype.multiplyComponents = function(right, result) {
        return Cartesian3.multiplyComponents(this, right, result);
    };

    /**
     * Computes the componentwise sum of this Cartesian and the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} right The right hand side Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.prototype.add = function(right, result) {
        return Cartesian3.add(this, right, result);
    };

    /**
     * Computes the componentwise difference of this Cartesian and the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} right The right hand side Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.prototype.subtract = function(right, result) {
        return Cartesian3.subtract(this, right, result);
    };

    /**
     * Multiplies this Cartesian componentwise by the provided scalar.
     * @memberof Cartesian3
     *
     * @param {Number} scalar The scalar to multiply with.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian3.prototype.multiplyByScalar = function(scalar, result) {
        return Cartesian3.multiplyByScalar(this, scalar, result);
    };

    /**
     * Divides this Cartesian componentwise by the provided scalar.
     * @memberof Cartesian3
     *
     * @param {Number} scalar The scalar to divide by.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian3.prototype.divideByScalar = function(scalar, result) {
        return Cartesian3.divideByScalar(this, scalar, result);
    };

    /**
     * Negates this Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.negate = function(result) {
        return Cartesian3.negate(this, result);
    };

    /**
     * Computes the absolute value of this Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.abs = function(result) {
        return Cartesian3.abs(this, result);
    };

    /**
     * Computes the linear interpolation or extrapolation at t using this Cartesian
     * and the provided cartesian.  This cartesian is assumed to be t at 0.0.
     * @memberof Cartesian3
     *
     * @param end The value corresponding to t at 1.0.
     * @param t The point along t at which to interpolate.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} end is required.
     * @exception {DeveloperError} t is required and must be a number.
     */
    Cartesian3.prototype.lerp = function(end, t, result) {
        return Cartesian3.lerp(this, end, t, result);
    };

    /**
     * Returns the angle, in radians, between this Cartesian and the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} right The right hand side Cartesian.
     * @return {Number} The angle between the Cartesians.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.prototype.angleBetween = function(right) {
        return Cartesian3.angleBetween(this, right);
    };

    /**
     * Returns the axis that is most orthogonal to the this Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The most orthogonal axis.
     */
    Cartesian3.prototype.mostOrthogonalAxis = function(result) {
        return Cartesian3.mostOrthogonalAxis(this, result);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [right] The right hand side Cartesian.
     * @return {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Cartesian3.prototype.equals = function(right) {
        return Cartesian3.equals(this, right);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [right] The right hand side Cartesian.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartesian3.prototype.equalsEpsilon = function(right, epsilon) {
        return Cartesian3.equalsEpsilon(this, right, epsilon);
    };

    /**
     * Creates a string representing this Cartesian in the format '(x, y, z)'.
     * @memberof Cartesian3
     *
     * @return {String} A string representing this Cartesian in the format '(x, y, z)'.
     */
    Cartesian3.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ')';
    };

    /**
     * Computes the cross (outer) product of this and the provided Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} right The right hand side Cartesian.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The cross product.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.prototype.cross = function(right, result) {
        return Cartesian3.cross(this, right, result);
    };

    return Cartesian3;
});

/*global define*/
define('Core/Cartesian4',[
        './defaultValue',
        './DeveloperError',
        './freezeObject'
    ], function(
        defaultValue,
        DeveloperError,
        freezeObject) {
    

    /**
     * A 4D Cartesian point.
     * @alias Cartesian4
     * @constructor
     *
     * @param {Number} [x=0.0] The X component.
     * @param {Number} [y=0.0] The Y component.
     * @param {Number} [z=0.0] The Z component.
     * @param {Number} [w=0.0] The W component.
     *
     * @see Cartesian2
     * @see Cartesian3
     */
    var Cartesian4 = function(x, y, z, w) {
        /**
         * The X component.
         * @type Number
         */
        this.x = defaultValue(x, 0.0);

        /**
         * The Y component.
         * @type Number
         */
        this.y = defaultValue(y, 0.0);

        /**
         * The Z component.
         * @type Number
         */
        this.z = defaultValue(z, 0.0);

        /**
         * The W component.
         * @type Number
         */
        this.w = defaultValue(w, 0.0);
    };

    /**
     * Creates a Cartesian4 from four consecutive elements in an array.
     * @memberof Cartesian4
     *
     * @param {Array} values The array whose four consecutive elements correspond to the x, y, z, and w components, respectively.
     * @param {Number} [offset=0] The offset into the array of the first element, which corresponds to the x component.
     * @param {Cartesian4} [result] The object onto which to store the result.
     *
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     * @exception {DeveloperError} offset + 4 is greater than the length of the array.
     *
     * @example
     * // Create a Cartesian4 with (1.0, 2.0, 3.0, 4.0)
     * var v = [1.0, 2.0, 3.0, 4.0];
     * var p = Cartesian4.fromArray(v);
     *
     * // Create a Cartesian4 with (1.0, 2.0, 3.0, 4.0) using an offset into an array
     * var v2 = [0.0, 0.0, 1.0, 2.0, 3.0, 4.0];
     * var p2 = Cartesian4.fromArray(v2, 2);
     */
    Cartesian4.fromArray = function(values, offset, result) {
        if (typeof values === 'undefined') {
            throw new DeveloperError('values is required.');
        }

        if (offset + 4 > values.length) {
            throw new DeveloperError('offset + 4 is greater than the length of the array.');
        }

        offset = defaultValue(offset, 0);

        if (typeof result === 'undefined') {
            result = new Cartesian4();
        }

        result.x = values[offset + 0];
        result.y = values[offset + 1];
        result.z = values[offset + 2];
        result.w = values[offset + 3];
        return result;
    };

    /**
     * Creates a Cartesian4 instance from x, y, z and w coordinates.
     * @memberof Cartesian4
     *
     * @param {Number} x The x coordinate.
     * @param {Number} y The y coordinate.
     * @param {Number} z The z coordinate.
     * @param {Number} w The w coordinate.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.fromElements = function(x, y, z, w, result) {
        if (typeof result === 'undefined') {
            return new Cartesian4(x, y, z, w);
        }

        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
    };

    /**
     * Duplicates a Cartesian4 instance.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian to duplicate.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided. (Returns undefined if cartesian is undefined)
     */
    Cartesian4.clone = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            return undefined;
        }

        if (typeof result === 'undefined') {
            return new Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
        }

        result.x = cartesian.x;
        result.y = cartesian.y;
        result.z = cartesian.z;
        result.w = cartesian.w;
        return result;
    };

    /**
     * Computes the value of the maximum component for the supplied Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} The cartesian to use.
     * @return {Number} The value of the maximum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.getMaximumComponent = function(cartesian) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        return Math.max(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    };

    /**
     * Computes the value of the minimum component for the supplied Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} The cartesian to use.
     * @return {Number} The value of the minimum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.getMinimumComponent = function(cartesian) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        return Math.min(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    };

    /**
     * Computes the provided Cartesian's squared magnitude.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian instance whose squared magnitude is to be computed.
     * @return {Number} The squared magnitude.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.magnitudeSquared = function(cartesian) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z + cartesian.w * cartesian.w;
    };

    /**
     * Computes the Cartesian's magnitude (length).
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian instance whose magnitude is to be computed.
     * @return {Number} The magnitude.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.magnitude = function(cartesian) {
        return Math.sqrt(Cartesian4.magnitudeSquared(cartesian));
    };

    var distanceScratch = new Cartesian4();

    /**
     * Computes the 4-space distance between two points
     * @memberof Cartesian4
     *
     * @param {Cartesian4} left The first point to compute the distance from.
     * @param {Cartesian4} right The second point to compute the distance to.
     *
     * @return {Number} The distance between two points.
     *
     * @exception {DeveloperError} left and right are required.
     *
     * @example
     * // Returns 1.0
     * var d = Cartesian4.distance(new Cartesian4(1.0, 0.0, 0.0, 0.0), new Cartesian4(2.0, 0.0, 0.0, 0.0));
     */
    Cartesian4.distance = function(left, right) {
        if ((typeof left === 'undefined') || (typeof right === 'undefined')) {
            throw new DeveloperError('left and right are required.');
        }

        Cartesian4.subtract(left, right, distanceScratch);
        return Cartesian4.magnitude(distanceScratch);
    };

    /**
     * Computes the normalized form of the supplied Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian to be normalized.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.normalize = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        var magnitude = Cartesian4.magnitude(cartesian);
        if (typeof result === 'undefined') {
            return new Cartesian4(cartesian.x / magnitude, cartesian.y / magnitude, cartesian.z / magnitude, cartesian.w / magnitude);
        }
        result.x = cartesian.x / magnitude;
        result.y = cartesian.y / magnitude;
        result.z = cartesian.z / magnitude;
        result.w = cartesian.w / magnitude;
        return result;
    };

    /**
     * Computes the dot (scalar) product of two Cartesians.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @return {Number} The dot product.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.dot = function(left, right) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        return left.x * right.x + left.y * right.y + left.z * right.z + left.w * right.w;
    };

    /**
     * Computes the componentwise product of two Cartesians.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.multiplyComponents = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian4(left.x * right.x, left.y * right.y, left.z * right.z, left.w * right.w);
        }
        result.x = left.x * right.x;
        result.y = left.y * right.y;
        result.z = left.z * right.z;
        result.w = left.w * right.w;
        return result;
    };

    /**
     * Computes the componentwise sum of two Cartesians.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.add = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian4(left.x + right.x, left.y + right.y, left.z + right.z, left.w + right.w);
        }
        result.x = left.x + right.x;
        result.y = left.y + right.y;
        result.z = left.z + right.z;
        result.w = left.w + right.w;
        return result;
    };

    /**
     * Computes the componentwise difference of two Cartesians.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} left The first Cartesian.
     * @param {Cartesian4} right The second Cartesian.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.subtract = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian4(left.x - right.x, left.y - right.y, left.z - right.z, left.w - right.w);
        }
        result.x = left.x - right.x;
        result.y = left.y - right.y;
        result.z = left.z - right.z;
        result.w = left.w - right.w;
        return result;
    };

    /**
     * Multiplies the provided Cartesian componentwise by the provided scalar.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian to be scaled.
     * @param {Number} scalar The scalar to multiply with.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian4.multiplyByScalar = function(cartesian, scalar, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (typeof result === 'undefined') {
            return new Cartesian4(cartesian.x * scalar, cartesian.y * scalar, cartesian.z * scalar, cartesian.w * scalar);
        }
        result.x = cartesian.x * scalar;
        result.y = cartesian.y * scalar;
        result.z = cartesian.z * scalar;
        result.w = cartesian.w * scalar;
        return result;
    };

    /**
     * Divides the provided Cartesian componentwise by the provided scalar.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian to be divided.
     * @param {Number} scalar The scalar to divide by.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian4.divideByScalar = function(cartesian, scalar, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (typeof result === 'undefined') {
            return new Cartesian4(cartesian.x / scalar, cartesian.y / scalar, cartesian.z / scalar, cartesian.w / scalar);
        }
        result.x = cartesian.x / scalar;
        result.y = cartesian.y / scalar;
        result.z = cartesian.z / scalar;
        result.w = cartesian.w / scalar;
        return result;
    };

    /**
     * Negates the provided Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian to be negated.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.negate = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian4(-cartesian.x, -cartesian.y, -cartesian.z, -cartesian.w);
        }
        result.x = -cartesian.x;
        result.y = -cartesian.y;
        result.z = -cartesian.z;
        result.w = -cartesian.w;
        return result;
    };

    /**
     * Computes the absolute value of the provided Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian whose absolute value is to be computed.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.abs = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian4(Math.abs(cartesian.x), Math.abs(cartesian.y), Math.abs(cartesian.z), Math.abs(cartesian.w));
        }
        result.x = Math.abs(cartesian.x);
        result.y = Math.abs(cartesian.y);
        result.z = Math.abs(cartesian.z);
        result.w = Math.abs(cartesian.w);
        return result;
    };

    var lerpScratch = new Cartesian4();
    /**
     * Computes the linear interpolation or extrapolation at t using the provided cartesians.
     * @memberof Cartesian4
     *
     * @param start The value corresponding to t at 0.0.
     * @param end The value corresponding to t at 1.0.
     * @param t The point along t at which to interpolate.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} start is required.
     * @exception {DeveloperError} end is required.
     * @exception {DeveloperError} t is required and must be a number.
     */
    Cartesian4.lerp = function(start, end, t, result) {
        if (typeof start === 'undefined') {
            throw new DeveloperError('start is required.');
        }
        if (typeof end === 'undefined') {
            throw new DeveloperError('end is required.');
        }
        if (typeof t !== 'number') {
            throw new DeveloperError('t is required and must be a number.');
        }
        Cartesian4.multiplyByScalar(end, t, lerpScratch);
        result = Cartesian4.multiplyByScalar(start, 1.0 - t, result);
        return Cartesian4.add(lerpScratch, result, result);
    };

    var mostOrthogonalAxisScratch = new Cartesian4();
    /**
     * Returns the axis that is most orthogonal to the provided Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian on which to find the most orthogonal axis.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The most orthogonal axis.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.mostOrthogonalAxis = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required.');
        }

        var f = Cartesian4.normalize(cartesian, mostOrthogonalAxisScratch);
        Cartesian4.abs(f, f);

        if (f.x <= f.y) {
            if (f.x <= f.z) {
                if (f.x <= f.w) {
                    result = Cartesian4.clone(Cartesian4.UNIT_X, result);
                } else {
                    result = Cartesian4.clone(Cartesian4.UNIT_W, result);
                }
            } else if (f.z <= f.w) {
                result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
            } else {
                result = Cartesian4.clone(Cartesian4.UNIT_W, result);
            }
        } else if (f.y <= f.z) {
            if (f.y <= f.w) {
                result = Cartesian4.clone(Cartesian4.UNIT_Y, result);
            } else {
                result = Cartesian4.clone(Cartesian4.UNIT_W, result);
            }
        } else if (f.z <= f.w) {
            result = Cartesian4.clone(Cartesian4.UNIT_Z, result);
        } else {
            result = Cartesian4.clone(Cartesian4.UNIT_W, result);
        }

        return result;
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [left] The first Cartesian.
     * @param {Cartesian4} [right] The second Cartesian.
     * @return {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartesian4.equals = function(left, right) {
        return (left === right) ||
               ((typeof left !== 'undefined') &&
                (typeof right !== 'undefined') &&
                (left.x === right.x) &&
                (left.y === right.y) &&
                (left.z === right.z) &&
                (left.w === right.w));
    };

    /**
     * Compares the provided Cartesians componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [left] The first Cartesian.
     * @param {Cartesian4} [right] The second Cartesian.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartesian4.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number.');
        }
        return (left === right) ||
               ((typeof left !== 'undefined') &&
                (typeof right !== 'undefined') &&
                (Math.abs(left.x - right.x) <= epsilon) &&
                (Math.abs(left.y - right.y) <= epsilon) &&
                (Math.abs(left.z - right.z) <= epsilon) &&
                (Math.abs(left.w - right.w) <= epsilon));
    };

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 0.0, 0.0, 0.0).
     * @memberof Cartesian4
     */
    Cartesian4.ZERO = freezeObject(new Cartesian4(0.0, 0.0, 0.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (1.0, 0.0, 0.0, 0.0).
     * @memberof Cartesian4
     */
    Cartesian4.UNIT_X = freezeObject(new Cartesian4(1.0, 0.0, 0.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 1.0, 0.0, 0.0).
     * @memberof Cartesian4
     */
    Cartesian4.UNIT_Y = freezeObject(new Cartesian4(0.0, 1.0, 0.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 0.0, 1.0, 0.0).
     * @memberof Cartesian4
     */
    Cartesian4.UNIT_Z = freezeObject(new Cartesian4(0.0, 0.0, 1.0, 0.0));

    /**
     * An immutable Cartesian4 instance initialized to (0.0, 0.0, 0.0, 1.0).
     * @memberof Cartesian4
     */
    Cartesian4.UNIT_W = freezeObject(new Cartesian4(0.0, 0.0, 0.0, 1.0));

    /**
     * Computes the value of the maximum component for this Cartesian.
     * @memberof Cartesian4
     *
     * @return {Number} The value of the maximum component.
     */
    Cartesian4.prototype.getMaximumComponent = function() {
        return Cartesian4.getMaximumComponent(this);
    };

    /**
     * Computes the value of the minimum component for this Cartesian.
     * @memberof Cartesian4
     *
     * @return {Number} The value of the minimum component.
     */
    Cartesian4.prototype.getMinimumComponent = function() {
        return Cartesian4.getMinimumComponent(this);
    };

    /**
     * Duplicates this Cartesian4 instance.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.clone = function(result) {
        return Cartesian4.clone(this, result);
    };

    /**
     * Computes this Cartesian's squared magnitude.
     * @memberof Cartesian4
     *
     * @return {Number} The squared magnitude.
     */
    Cartesian4.prototype.magnitudeSquared = function() {
        return Cartesian4.magnitudeSquared(this);
    };

    /**
     * Computes this Cartesian's magnitude (length).
     * @memberof Cartesian4
     *
     * @return {Number} The magnitude.
     */
    Cartesian4.prototype.magnitude = function() {
        return Cartesian4.magnitude(this);
    };

    /**
     * Computes the normalized form of this Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.normalize = function(result) {
        return Cartesian4.normalize(this, result);
    };

    /**
     * Computes the dot (scalar) product of this Cartesian and a supplied cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} right The right hand side Cartesian.
     * @return {Number} The dot product.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.prototype.dot = function(right) {
        return Cartesian4.dot(this, right);
    };

    /**
     * Computes the componentwise product of this Cartesian and the provided Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} right The right hand side Cartesian.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.prototype.multiplyComponents = function(right, result) {
        return Cartesian4.multiplyComponents(this, right, result);
    };

    /**
     * Computes the componentwise sum of this Cartesian and the provided Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} right The right hand side Cartesian.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.prototype.add = function(right, result) {
        return Cartesian4.add(this, right, result);
    };

    /**
     * Computes the componentwise difference of this Cartesian and the provided Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} right The right hand side Cartesian.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.prototype.subtract = function(right, result) {
        return Cartesian4.subtract(this, right, result);
    };

    /**
     * Multiplies this Cartesian componentwise by the provided scalar.
     * @memberof Cartesian4
     *
     * @param {Number} scalar The scalar to multiply with.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian4.prototype.multiplyByScalar = function(scalar, result) {
        return Cartesian4.multiplyByScalar(this, scalar, result);
    };

    /**
     * Divides this Cartesian componentwise by the provided scalar.
     * @memberof Cartesian4
     *
     * @param {Number} scalar The scalar to divide by.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian4.prototype.divideByScalar = function(scalar, result) {
        return Cartesian4.divideByScalar(this, scalar, result);
    };

    /**
     * Negates this Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.negate = function(result) {
        return Cartesian4.negate(this, result);
    };

    /**
     * Computes the absolute value of this Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.abs = function(result) {
        return Cartesian4.abs(this, result);
    };

    /**
     * Computes the linear interpolation or extrapolation at t using this Cartesian
     * and the provided cartesian.  This cartesian is assumed to be t at 0.0.
     * @memberof Cartesian4
     *
     * @param end The value corresponding to t at 1.0.
     * @param t The point along t at which to interpolate.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} end is required.
     * @exception {DeveloperError} t is required and must be a number.
     */
    Cartesian4.prototype.lerp = function(end, t, result) {
        return Cartesian4.lerp(this, end, t, result);
    };

    /**
     * Returns the axis that is most orthogonal to the this Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The most orthogonal axis.
     */
    Cartesian4.prototype.mostOrthogonalAxis = function(result) {
        return Cartesian4.mostOrthogonalAxis(this, result);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [right] The right hand side Cartesian.
     * @return {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Cartesian4.prototype.equals = function(right) {
        return Cartesian4.equals(this, right);
    };

    /**
     * Compares this Cartesian against the provided Cartesian componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [right] The right hand side Cartesian.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartesian4.prototype.equalsEpsilon = function(right, epsilon) {
        return Cartesian4.equalsEpsilon(this, right, epsilon);
    };

    /**
     * Creates a string representing this Cartesian in the format '(x, y)'.
     * @memberof Cartesian4
     *
     * @return {String} A string representing the provided Cartesian in the format '(x, y)'.
     */
    Cartesian4.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
    };

    return Cartesian4;
});

/*global define*/
define('Core/Math',[
        './defaultValue',
        './DeveloperError'
       ], function(
         defaultValue,
         DeveloperError) {
    

    /**
     * Math functions.
     * @exports CesiumMath
     */
    var CesiumMath = {};

    /**
     * 0.1
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON1 = 0.1;

    /**
     * 0.01
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON2 = 0.01;

    /**
     * 0.001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON3 = 0.001;

    /**
     * 0.0001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON4 = 0.0001;

    /**
     * 0.00001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON5 = 0.00001;

    /**
     * 0.000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON6 = 0.000001;

    /**
     * 0.0000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON7 = 0.0000001;

    /**
     * 0.00000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON8 = 0.00000001;

    /**
     * 0.000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON9 = 0.000000001;

    /**
     * 0.0000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON10 = 0.0000000001;

    /**
     * 0.00000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON11 = 0.00000000001;

    /**
     * 0.000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON12 = 0.000000000001;

    /**
     * 0.0000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON13 = 0.0000000000001;

    /**
     * 0.00000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON14 = 0.00000000000001;

    /**
     * 0.000000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON15 = 0.000000000000001;

    /**
     * 0.0000000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON16 = 0.0000000000000001;

    /**
     * 0.00000000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON17 = 0.00000000000000001;

    /**
     * 0.000000000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON18 = 0.000000000000000001;

    /**
     * 0.0000000000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON19 = 0.0000000000000000001;

    /**
     * 0.00000000000000000001
     * @constant
     * @type Number
     */
    CesiumMath.EPSILON20 = 0.00000000000000000001;

    /**
     * 3.986004418e14
     * @constant
     * @type Number
     */
    CesiumMath.GRAVITATIONALPARAMETER = 3.986004418e14;

    /**
     * Radius of the sun in meters: 6.995e8
     * @constant
     * @type Number
     */
    CesiumMath.SOLAR_RADIUS = 6.995e8;

    /**
     * Returns the sign of the value; 1 if the value is positive, -1 if the value is
     * negative, or 0 if the value is 0.
     *
     * @param {Number} value The value to return the sign of.
     *
     * @return {Number} The sign of value.
     */
    CesiumMath.sign = function(value) {
        if (value > 0) {
            return 1;
        }
        if (value < 0) {
            return -1;
        }

        return 0;
    };

    /**
     * Returns the hyperbolic sine of a {@code Number}.
     * The hyperbolic sine of <em>value</em> is defined to be
     * (<em>e<sup>x</sup>&nbsp;-&nbsp;e<sup>-x</sup></em>)/2.0
     * where <i>e</i> is Euler's number, approximately 2.71828183.
     *
     * <p>Special cases:
     *   <ul>
     *     <li>If the argument is NaN, then the result is NaN.</li>
     *
     *     <li>If the argument is infinite, then the result is an infinity
     *     with the same sign as the argument.</li>
     *
     *     <li>If the argument is zero, then the result is a zero with the
     *     same sign as the argument.</li>
     *   </ul>
     *</p>
     *
     * @param value The number whose hyperbolic sine is to be returned.
     *
     * @return The hyperbolic sine of {@code value}.
     *
     */
    CesiumMath.sinh = function(value) {
        var part1 = Math.pow(Math.E, value);
        var part2 = Math.pow(Math.E, -1.0 * value);

        return (part1 - part2) * 0.5;
    };

    /**
     * Returns the hyperbolic cosine of a {@code Number}.
     * The hyperbolic cosine of <strong>value</strong> is defined to be
     * (<em>e<sup>x</sup>&nbsp;+&nbsp;e<sup>-x</sup></em>)/2.0
     * where <i>e</i> is Euler's number, approximately 2.71828183.
     *
     * <p>Special cases:
     *   <ul>
     *     <li>If the argument is NaN, then the result is NaN.</li>
     *
     *     <li>If the argument is infinite, then the result is positive infinity.</li>
     *
     *     <li>If the argument is zero, then the result is {@code 1.0}.</li>
     *   </ul>
     *</p>
     *
     * @param value The number whose hyperbolic cosine is to be returned.
     *
     * @return The hyperbolic cosine of {@code value}.
     */
    CesiumMath.cosh = function(value) {
        var part1 = Math.pow(Math.E, value);
        var part2 = Math.pow(Math.E, -1.0 * value);

        return (part1 + part2) * 0.5;
    };

    /**
     * DOC_TBA
     */
    CesiumMath.lerp = function(p, q, time) {
        return ((1.0 - time) * p) + (time * q);
    };

    /**
     * 1/pi
     *
     * @constant
     * @type {Number}
     * @see czm_pi
     */
    CesiumMath.PI = Math.PI;

    /**
     * 1/pi
     *
     * @constant
     * @type {Number}
     * @see czm_oneOverPi
     */
    CesiumMath.ONE_OVER_PI = 1.0 / Math.PI;

    /**
     * pi/2
     *
     * @constant
     * @type {Number}
     * @see czm_piOverTwo
     */
    CesiumMath.PI_OVER_TWO = Math.PI * 0.5;

    /**
     * pi/3
     * <br /><br />
     *
     * @constant
     * @type {Number}
     * @see czm_piOverThree
     */
    CesiumMath.PI_OVER_THREE = Math.PI / 3.0;

    /**
     * pi/4
     *
     * @constant
     * @type {Number}
     * @see czm_piOverFour
     */
    CesiumMath.PI_OVER_FOUR = Math.PI / 4.0;

    /**
     * pi/6
     *
     * @constant
     * @type {Number}
     * @see czm_piOverSix
     */
    CesiumMath.PI_OVER_SIX = Math.PI / 6.0;

    /**
     * 3pi/2
     *
     * @constant
     * @type {Number}
     * @see czm_threePiOver2
     */
    CesiumMath.THREE_PI_OVER_TWO = (3.0 * Math.PI) * 0.5;

    /**
     * 2pi
     *
     * @constant
     * @type {Number}
     * @see czm_twoPi
     */
    CesiumMath.TWO_PI = 2.0 * Math.PI;

    /**
     * 1/2pi
     *
     * @constant
     * @type {Number}
     * @see czm_oneOverTwoPi
     */
    CesiumMath.ONE_OVER_TWO_PI = 1.0 / (2.0 * Math.PI);

    /**
     * The number of radians in a degree.
     *
     * @constant
     * @type {Number}
     * @see czm_radiansPerDegree
     */
    CesiumMath.RADIANS_PER_DEGREE = Math.PI / 180.0;

    /**
     * The number of degrees in a radian.
     *
     * @constant
     * @type {Number}
     * @see czm_degreesPerRadian
     */
    CesiumMath.DEGREES_PER_RADIAN = 180.0 / Math.PI;

    /**
     * The number of radians in an arc second.
     *
     * @constant
     * @type {Number}
     * @see czm_radiansPerArcSecond
     */
    CesiumMath.RADIANS_PER_ARCSECOND = CesiumMath.RADIANS_PER_DEGREE / 3600.0;

    /**
     * Converts degrees to radians.
     * @param {Number} degrees The angle to convert in degrees.
     * @return {Number} The corresponding angle in radians.
     */
    CesiumMath.toRadians = function(degrees) {
        return degrees * CesiumMath.RADIANS_PER_DEGREE;
    };

    /**
     * Converts radians to degrees.
     * @param {Number} radians The angle to convert in radians.
     * @return {Number} The corresponding angle in degrees.
     */
    CesiumMath.toDegrees = function(radians) {
        return radians * CesiumMath.DEGREES_PER_RADIAN;
    };

    /**
     * Converts a longitude value, in radians, to the range [<code>-Math.PI</code>, <code>Math.PI</code>).
     *
     * @param {Number} angle The longitude value, in radians, to convert to the range [<code>-Math.PI</code>, <code>Math.PI</code>).
     *
     * @return {Number} The equivalent longitude value in the range [<code>-Math.PI</code>, <code>Math.PI</code>).
     *
     * @example
     * // Convert 270 degrees to -90 degrees longitude
     * var longitude = CesiumMath.convertLongitudeRange(CesiumMath.toRadians(270.0));
     */
    CesiumMath.convertLongitudeRange = function(angle) {
        var twoPi = CesiumMath.TWO_PI;

        var simplified = angle - Math.floor(angle / twoPi) * twoPi;

        if (simplified < -Math.PI) {
            return simplified + twoPi;
        }
        if (simplified >= Math.PI) {
            return simplified - twoPi;
        }

        return simplified;
    };

    /**
     * Produces an angle in the range 0 <= angle <= 2Pi which is equivalent to the provided angle.
     * @param {Number} angle in radians
     * @return {Number} The angle in the range ()<code>-CesiumMath.PI</code>, <code>CesiumMath.PI</code>).
     */
    CesiumMath.negativePiToPi = function(x) {
        var epsilon10 = CesiumMath.EPSILON10;
        var pi = CesiumMath.PI;
        var two_pi = CesiumMath.TWO_PI;
        while (x < -(pi + epsilon10)) {
            x += two_pi;
        }
        if (x < -pi) {
            return -pi;
        }
        while (x > pi + epsilon10) {
            x -= two_pi;
        }
        return x > pi ? pi : x;
    };

    /**
     * Produces an angle in the range -Pi <= angle <= Pi which is equivalent to the provided angle.
     * @param {Number} angle in radians
     * @return {Number} The angle in the range (0 , <code>CesiumMath.TWO_PI</code>).
     */
    CesiumMath.zeroToTwoPi = function(x) {
        var value = x % CesiumMath.TWO_PI;
        // We do a second modules here if we add 2Pi to ensure that we don't have any numerical issues with very
        // small negative values.
        return (value < 0.0) ? (value + CesiumMath.TWO_PI) % CesiumMath.TWO_PI : value;
    };

    /**
     * DOC_TBA
     */
    CesiumMath.equalsEpsilon = function(left, right, epsilon) {
        epsilon = defaultValue(epsilon, 0.0);
        return Math.abs(left - right) <= epsilon;
    };

    var factorials = [1];

    /**
     * Computes the factorial of the provided number.
     *
     * @memberof CesiumMath
     *
     * @param {Number} n The number whose factorial is to be computed.
     *
     * @return {Number} The factorial of the provided number or undefined if the number is less than 0.
     *
     * @see <a href='http://en.wikipedia.org/wiki/Factorial'>Factorial on Wikipedia</a>.
     *
     * @example
     * //Compute 7!, which is equal to 5040
     * var computedFactorial = CesiumMath.factorial(7);
     *
     * @exception {DeveloperError} A number greater than or equal to 0 is required.
     */
    CesiumMath.factorial = function(n) {
        if (typeof n !== 'number' || n < 0) {
            throw new DeveloperError('A number greater than or equal to 0 is required.');
        }

        var length = factorials.length;
        if (n >= length) {
            var sum = factorials[length - 1];
            for ( var i = length; i <= n; i++) {
                factorials.push(sum * i);
            }
        }
        return factorials[n];
    };

    /**
     * Increments a number with a wrapping to a minimum value if the number exceeds the maximum value.
     *
     * @memberof CesiumMath
     *
     * @param {Number} [n] The number to be incremented.
     * @param {Number} [maximumValue] The maximum incremented value before rolling over to the minimum value.
     * @param {Number} [minimumValue=0.0] The number reset to after the maximum value has been exceeded.
     *
     * @return {Number} The incremented number.
     *
     * @example
     * var n = CesiumMath.incrementWrap(5, 10, 0); // returns 6
     * var n = CesiumMath.incrementWrap(10, 10, 0); // returns 0
     *
     * @exception {DeveloperError} Maximum value must be greater than minimum value.
     */
    CesiumMath.incrementWrap = function(n, maximumValue, minimumValue) {
        minimumValue = defaultValue(minimumValue, 0.0);

        if (maximumValue <= minimumValue) {
            throw new DeveloperError('Maximum value must be greater than minimum value.');
        }

        ++n;
        if (n > maximumValue) {
            n = minimumValue;
        }
        return n;
    };

    /**
     * Determines if a positive integer is a power of two.
     *
     * @memberof CesiumMath
     *
     * @param {Number} n The positive integer to test.
     *
     * @return {Boolean} <code>true</code> if the number if a power of two; otherwise, <code>false</code>.
     *
     * @example
     * var t = CesiumMath.isPowerOfTwo(16); // true
     * var f = CesiumMath.isPowerOfTwo(20); // false
     *
     * @exception {DeveloperError} A number greater than or equal to 0 is required.
     */
    CesiumMath.isPowerOfTwo = function(n) {
        if (typeof n !== 'number' || n < 0) {
            throw new DeveloperError('A number greater than or equal to 0 is required.');
        }

        var m = defaultValue(n, 0);
        return (m !== 0) && ((m & (m - 1)) === 0);
    };

    /**
     * Constraint a value to lie between two values.
     *
     * @memberof CesiumMath
     *
     * @param {Number} value The value to constrain.
     * @param {Number} min The minimum value.
     * @param {Number} max The maximum value.
     * @returns The value clamped so that min <= value <= max.
     */
    CesiumMath.clamp = function(value, min, max) {
        return value < min ? min : value > max ? max : value;
    };

    return CesiumMath;
});

/*global define*/
define('Core/Cartographic',[
        './defaultValue',
        './DeveloperError',
        './freezeObject',
        './Math'
    ], function(
        defaultValue,
        DeveloperError,
        freezeObject,
        CesiumMath) {
    

    /**
     * A position defined by longitude, latitude, and height.
     * @alias Cartographic
     * @constructor
     *
     * @param {Number} [longitude=0.0] The longitude, in radians.
     * @param {Number} [latitude=0.0] The latitude, in radians.
     * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
     *
     * @see Ellipsoid
     */
    var Cartographic = function(longitude, latitude, height) {
        /**
         * The longitude, in radians.
         * @type Number
         */
        this.longitude = defaultValue(longitude, 0.0);

        /**
         * The latitude, in radians.
         * @type Number
         */
        this.latitude = defaultValue(latitude, 0.0);

        /**
         * The height, in meters, above the ellipsoid.
         * @type Number
         */
        this.height = defaultValue(height, 0.0);
    };

    /**
     * Creates a new Cartographic instance from longitude and latitude
     * specified in degrees.  The values in the resulting object will
     * be in radians.
     * @memberof Cartographic
     *
     * @param {Number} [longitude=0.0] The longitude, in degrees.
     * @param {Number} [latitude=0.0] The latitude, in degrees.
     * @param {Number} [height=0.0] The height, in meters, above the ellipsoid.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
     */
    Cartographic.fromDegrees = function(longitude, latitude, height, result) {
        longitude = CesiumMath.toRadians(defaultValue(longitude, 0.0));
        latitude = CesiumMath.toRadians(defaultValue(latitude, 0.0));
        height = defaultValue(height, 0.0);

        if (typeof result === 'undefined') {
            return new Cartographic(longitude, latitude, height);
        }

        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    /**
     * Duplicates a Cartographic instance.
     * @memberof Cartographic
     *
     * @param {Cartographic} cartographic The cartographic to duplicate.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided. (Returns undefined if cartographic is undefined)
     */
    Cartographic.clone = function(cartographic, result) {
        if (typeof cartographic === 'undefined') {
            return undefined;
        }
        if (typeof result === 'undefined') {
            return new Cartographic(cartographic.longitude, cartographic.latitude, cartographic.height);
        }
        result.longitude = cartographic.longitude;
        result.latitude = cartographic.latitude;
        result.height = cartographic.height;
        return result;
    };

    /**
     * Compares the provided cartographics componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Cartographic
     *
     * @param {Cartographic} [left] The first cartographic.
     * @param {Cartographic} [right] The second cartographic.
     * @return {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartographic.equals = function(left, right) {
        return (left === right) ||
                ((typeof left !== 'undefined') &&
                 (typeof right !== 'undefined') &&
                 (left.longitude === right.longitude) &&
                 (left.latitude === right.latitude) &&
                 (left.height === right.height));
    };

    /**
     * Compares the provided cartographics componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Cartographic
     *
     * @param {Cartographic} [left] The first cartographic.
     * @param {Cartographic} [right] The second cartographic.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartographic.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number.');
        }
        return (left === right) ||
               ((typeof left !== 'undefined') &&
                (typeof right !== 'undefined') &&
                (Math.abs(left.longitude - right.longitude) <= epsilon) &&
                (Math.abs(left.latitude - right.latitude) <= epsilon) &&
                (Math.abs(left.height - right.height) <= epsilon));
    };

    /**
     * Creates a string representing the provided cartographic in the format '(longitude, latitude, height)'.
     * @memberof Cartographic
     *
     * @param {Cartographic} cartographic The cartographic to stringify.
     * @return {String} A string representing the provided cartographic in the format '(longitude, latitude, height)'.
     *
     * @exception {DeveloperError} cartographic is required.
     */
    Cartographic.toString = function(cartographic) {
        if (typeof cartographic === 'undefined') {
            throw new DeveloperError('cartographic is required');
        }
        return '(' + cartographic.longitude + ', ' + cartographic.latitude + ', ' + cartographic.height + ')';
    };

    /**
     * An immutable Cartographic instance initialized to (0.0, 0.0, 0.0).
     *
     * @memberof Cartographic
     */
    Cartographic.ZERO = freezeObject(new Cartographic(0.0, 0.0, 0.0));

    /**
     * Duplicates this instance.
     * @memberof Cartographic
     *
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if one was not provided.
     */
    Cartographic.prototype.clone = function(result) {
        return Cartographic.clone(this, result);
    };

    /**
     * Compares the provided against this cartographic componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Cartographic
     *
     * @param {Cartographic} [right] The second cartographic.
     * @return {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartographic.prototype.equals = function(right) {
        return Cartographic.equals(this, right);
    };

    /**
     * Compares the provided against this cartographic componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Cartographic
     *
     * @param {Cartographic} [right] The second cartographic.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartographic.prototype.equalsEpsilon = function(right, epsilon) {
        return Cartographic.equalsEpsilon(this, right, epsilon);
    };

    /**
     * Creates a string representing this cartographic in the format '(longitude, latitude, height)'.
     * @memberof Cartographic
     *
     * @return {String} A string representing the provided cartographic in the format '(longitude, latitude, height)'.
     */
    Cartographic.prototype.toString = function() {
        return Cartographic.toString(this);
    };

    return Cartographic;
});

/*global define*/
define('Core/Ellipsoid',[
        './freezeObject',
        './defaultValue',
        './DeveloperError',
        './Math',
        './Cartesian3',
        './Cartographic'
       ], function(
         freezeObject,
         defaultValue,
         DeveloperError,
         CesiumMath,
         Cartesian3,
         Cartographic) {
    

    /**
     * A quadratic surface defined in Cartesian coordinates by the equation
     * <code>(x / a)^2 + (y / b)^2 + (z / c)^2 = 1</code>.  Primarily used
     * by Cesium to represent the shape of planetary bodies.
     *
     * Rather than constructing this object directly, one of the provided
     * constants is normally used.
     * @alias Ellipsoid
     * @constructor
     * @immutable
     *
     * @param {Number} [x=0] The radius in the x direction.
     * @param {Number} [y=0] The radius in the y direction.
     * @param {Number} [z=0] The radius in the z direction.
     *
     * @exception {DeveloperError} All radii components must be greater than or equal to zero.
     *
     * @see Ellipsoid.fromCartesian3
     * @see Ellipsoid.WGS84
     * @see Ellipsoid.UNIT_SPHERE
     */
    var Ellipsoid = function(x, y, z) {
        x = defaultValue(x, 0.0);
        y = defaultValue(y, 0.0);
        z = defaultValue(z, 0.0);

        if (x < 0.0 || y < 0.0 || z < 0.0) {
            throw new DeveloperError('All radii components must be greater than or equal to zero.');
        }

        this._radii = new Cartesian3(x, y, z);

        this._radiiSquared = new Cartesian3(x * x,
                                            y * y,
                                            z * z);

        this._radiiToTheFourth = new Cartesian3(x * x * x * x,
                                                y * y * y * y,
                                                z * z * z * z);

        this._oneOverRadii = new Cartesian3(x === 0.0 ? 0.0 : 1.0 / x,
                                            y === 0.0 ? 0.0 : 1.0 / y,
                                            z === 0.0 ? 0.0 : 1.0 / z);

        this._oneOverRadiiSquared = new Cartesian3(x === 0.0 ? 0.0 : 1.0 / (x * x),
                                                   y === 0.0 ? 0.0 : 1.0 / (y * y),
                                                   z === 0.0 ? 0.0 : 1.0 / (z * z));

        this._minimumRadius = Math.min(x, y, z);

        this._maximumRadius = Math.max(x, y, z);

        this._centerToleranceSquared = CesiumMath.EPSILON1;
    };

    /**
     * Duplicates an Ellipsoid instance.
     *
     * @memberof Ellipsoid
     *
     * @param {Ellipsoid} ellipsoid The ellipsoid to duplicate.
     * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
     *                    instance should be created.
     * @returns {Ellipsoid} The cloned Ellipsoid. (Returns undefined if ellipsoid is undefined)
     */
    Ellipsoid.clone = function(ellipsoid, result) {
        if (typeof ellipsoid === 'undefined') {
            return undefined;
        }
        var radii = ellipsoid._radii;

        if (typeof result === 'undefined') {
            return new Ellipsoid(radii.x, radii.y, radii.z);
        }

        Cartesian3.clone(radii, result._radii);
        Cartesian3.clone(ellipsoid._radiiSquared, result._radiiSquared);
        Cartesian3.clone(ellipsoid._radiiToTheFourth, result._radiiToTheFourth);
        Cartesian3.clone(ellipsoid._oneOverRadii, result._oneOverRadii);
        Cartesian3.clone(ellipsoid._oneOverRadiiSquared, result._oneOverRadiiSquared);
        result._minimumRadius = ellipsoid._minimumRadius;
        result._maximumRadius = ellipsoid._maximumRadius;
        result._centerToleranceSquared = ellipsoid._centerToleranceSquared;

        return result;
    };

    /**
     * Computes an Ellipsoid from a Cartesian specifying the radii in x, y, and z directions.
     *
     * @param {Cartesian3} [radii=Cartesian3.ZERO] The ellipsoid's radius in the x, y, and z directions.
     * @return {Ellipsoid} A new Ellipsoid instance.
     *
     * @exception {DeveloperError} All radii components must be greater than or equal to zero.
     *
     * @see Ellipsoid.WGS84
     * @see Ellipsoid.UNIT_SPHERE
     */
    Ellipsoid.fromCartesian3 = function(cartesian) {
        if (typeof cartesian === 'undefined') {
            return new Ellipsoid();
        }
        return new Ellipsoid(cartesian.x, cartesian.y, cartesian.z);
    };

    /**
     * An Ellipsoid instance initialized to the WGS84 standard.
     * @memberof Ellipsoid
     *
     * @see czm_getWgs84EllipsoidEC
     */
    Ellipsoid.WGS84 = freezeObject(new Ellipsoid(6378137.0, 6378137.0, 6356752.3142451793));

    /**
     * An Ellipsoid instance initialized to radii of (1.0, 1.0, 1.0).
     * @memberof Ellipsoid
     */
    Ellipsoid.UNIT_SPHERE = freezeObject(new Ellipsoid(1.0, 1.0, 1.0));

    /**
     * @memberof Ellipsoid
     * @return {Cartesian3} The radii of the ellipsoid.
     */
    Ellipsoid.prototype.getRadii = function() {
        return this._radii;
    };

    /**
     * @memberof Ellipsoid
     * @return {Cartesian3} The squared radii of the ellipsoid.
     */
    Ellipsoid.prototype.getRadiiSquared = function() {
        return this._radiiSquared;
    };

    /**
     * @memberof Ellipsoid
     * @return {Cartesian3} The radii of the ellipsoid raised to the fourth power.
     */
    Ellipsoid.prototype.getRadiiToTheFourth = function() {
        return this._radiiToTheFourth;
    };

    /**
     * @memberof Ellipsoid
     * @return {Cartesian3} One over the radii of the ellipsoid.
     */
    Ellipsoid.prototype.getOneOverRadii = function() {
        return this._oneOverRadii;
    };

    /**
     * @memberof Ellipsoid
     * @return {Cartesian3} One over the squared radii of the ellipsoid.
     */
    Ellipsoid.prototype.getOneOverRadiiSquared = function() {
        return this._oneOverRadiiSquared;
    };

    /**
     * @memberof Ellipsoid
     * @return {Cartesian3} The minimum radius of the ellipsoid.
     */
    Ellipsoid.prototype.getMinimumRadius = function() {
        return this._minimumRadius;
    };

    /**
     * @memberof Ellipsoid
     * @return {Cartesian3} The maximum radius of the ellipsoid.
     */
    Ellipsoid.prototype.getMaximumRadius = function() {
        return this._maximumRadius;
    };

    /**
     * Duplicates an Ellipsoid instance.
     *
     * @memberof Ellipsoid
     *
     * @param {Ellipsoid} [result] The object onto which to store the result, or undefined if a new
     *                    instance should be created.
     * @returns {Ellipsoid} The cloned Ellipsoid.
     */
    Ellipsoid.prototype.clone = function(result) {
        return Ellipsoid.clone(this, result);
    };

    /**
     * Computes the unit vector directed from the center of this ellipsoid toward the provided Cartesian position.
     * @memberof Ellipsoid
     *
     * @param {Cartesian3} cartesian The Cartesian for which to to determine the geocentric normal.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Ellipsoid.prototype.geocentricSurfaceNormal = Cartesian3.normalize;

    /**
     * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
     * @memberof Ellipsoid
     *
     * @param {Cartographic} cartographic The cartographic position for which to to determine the geodetic normal.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     *
     * @exception {DeveloperError} cartographic is required.
     */
    Ellipsoid.prototype.geodeticSurfaceNormalCartographic = function(cartographic, result) {
        if (typeof cartographic === 'undefined') {
            throw new DeveloperError('cartographic is required.');
        }

        var longitude = cartographic.longitude;
        var latitude = cartographic.latitude;
        var cosLatitude = Math.cos(latitude);

        var x = cosLatitude * Math.cos(longitude);
        var y = cosLatitude * Math.sin(longitude);
        var z = Math.sin(latitude);

        if (typeof result === 'undefined') {
            result = new Cartesian3();
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return Cartesian3.normalize(result, result);
    };

    /**
     * Computes the normal of the plane tangent to the surface of the ellipsoid at the provided position.
     * @memberof Ellipsoid
     *
     * @param {Cartesian3} cartesian The Cartesian position for which to to determine the surface normal.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Ellipsoid.prototype.geodeticSurfaceNormal = function(cartesian, result) {
        result = Cartesian3.multiplyComponents(cartesian, this._oneOverRadiiSquared, result);
        return Cartesian3.normalize(result, result);
    };

    var cartographicToCartesianNormal = new Cartesian3();
    var cartographicToCartesianK = new Cartesian3();

    /**
     * Converts the provided cartographic to Cartesian representation.
     * @memberof Ellipsoid
     *
     * @param {Cartographic} cartographic The cartographic position.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     *
     * @exception {DeveloperError} cartographic is required.
     *
     * @example
     * //Create a Cartographic and determine it's Cartesian representation on a WGS84 ellipsoid.
     * var position = new Cartographic(Math.toRadians(21), Math.toRadians(78), 5000);
     * var cartesianPosition = Ellipsoid.WGS84.cartographicToCartesian(position);
     */
    Ellipsoid.prototype.cartographicToCartesian = function(cartographic, result) {
        //`cartographic is required` is thrown from geodeticSurfaceNormalCartographic.
        var n = cartographicToCartesianNormal;
        var k = cartographicToCartesianK;
        this.geodeticSurfaceNormalCartographic(cartographic, n);
        Cartesian3.multiplyComponents(this._radiiSquared, n, k);
        var gamma = Math.sqrt(Cartesian3.dot(n, k));
        Cartesian3.divideByScalar(k, gamma, k);
        Cartesian3.multiplyByScalar(n, cartographic.height, n);
        return Cartesian3.add(k, n, result);
    };

    /**
     * Converts the provided array of cartographics to an array of Cartesians.
     * @memberof Ellipsoid
     *
     * @param {Array} cartographics An array of cartographic positions.
     * @param {Array} [result] The object onto which to store the result.
     * @return {Array} The modified result parameter or a new Array instance if none was provided.
     *
     * @exception {DeveloperError} cartographics is required.
     *
     * @example
     * //Convert an array of Cartographics and determine their Cartesian representation on a WGS84 ellipsoid.
     * var positions = [new Cartographic(Math.toRadians(21), Math.toRadians(78), 0),
     *                  new Cartographic(Math.toRadians(21.321), Math.toRadians(78.123), 100),
     *                  new Cartographic(Math.toRadians(21.645), Math.toRadians(78.456), 250)
     * var cartesianPositions = Ellipsoid.WGS84.cartographicArrayToCartesianArray(positions);
     */
    Ellipsoid.prototype.cartographicArrayToCartesianArray = function(cartographics, result) {
        if (typeof cartographics === 'undefined') {
            throw new DeveloperError('cartographics is required.');
        }

        var length = cartographics.length;
        if (typeof result === 'undefined') {
            result = new Array(length);
        } else {
            result.length = length;
        }
        for ( var i = 0; i < length; i++) {
            result[i] = this.cartographicToCartesian(cartographics[i], result[i]);
        }
        return result;
    };

    var cartesianToCartographicN = new Cartesian3();
    var cartesianToCartographicP = new Cartesian3();
    var cartesianToCartographicH = new Cartesian3();

    /**
     * Converts the provided cartesian to cartographic representation.
     * The cartesian is undefined at the center of the ellipsoid.
     * @memberof Ellipsoid
     *
     * @param {Cartesian3} cartesian The Cartesian position to convert to cartographic representation.
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter, new Cartographic instance if none was provided, or undefined if the cartesian is at the center of the ellipsoid.
     *
     * @exception {DeveloperError} cartesian is required.
     *
     * @example
     * //Create a Cartesian and determine it's Cartographic representation on a WGS84 ellipsoid.
     * var position = new Cartesian(17832.12, 83234.52, 952313.73);
     * var cartographicPosition = Ellipsoid.WGS84.cartesianToCartographic(position);
     */
    Ellipsoid.prototype.cartesianToCartographic = function(cartesian, result) {
        //`cartesian is required.` is thrown from scaleToGeodeticSurface
        var p = this.scaleToGeodeticSurface(cartesian, cartesianToCartographicP);

        if (typeof p === 'undefined') {
            return undefined;
        }

        var n = this.geodeticSurfaceNormal(p, cartesianToCartographicN);
        var h = Cartesian3.subtract(cartesian, p, cartesianToCartographicH);

        var longitude = Math.atan2(n.y, n.x);
        var latitude = Math.asin(n.z);
        var height = CesiumMath.sign(Cartesian3.dot(h, cartesian)) * Cartesian3.magnitude(h);

        if (typeof result === 'undefined') {
            return new Cartographic(longitude, latitude, height);
        }
        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    /**
     * Converts the provided array of cartesians to an array of cartographics.
     * @memberof Ellipsoid
     *
     * @param {Array} cartesians An array of Cartesian positions.
     * @param {Array} [result] The object onto which to store the result.
     * @return {Array} The modified result parameter or a new Array instance if none was provided.
     *
     * @exception {DeveloperError} cartesians is required.
     *
     * @example
     * //Create an array of Cartesians and determine their Cartographic representation on a WGS84 ellipsoid.
     * var positions = [new Cartesian(17832.12, 83234.52, 952313.73),
     *                  new Cartesian(17832.13, 83234.53, 952313.73),
     *                  new Cartesian(17832.14, 83234.54, 952313.73)]
     * var cartographicPositions = Ellipsoid.WGS84.cartesianArrayToCartographicArray(positions);
     */
    Ellipsoid.prototype.cartesianArrayToCartographicArray = function(cartesians, result) {
        if (typeof cartesians === 'undefined') {
            throw new DeveloperError('cartesians is required.');
        }

        var length = cartesians.length;
        if (typeof result === 'undefined') {
            result = new Array(length);
        } else {
            result.length = length;
        }
        for ( var i = 0; i < length; ++i) {
            result[i] = this.cartesianToCartographic(cartesians[i], result[i]);
        }
        return result;
    };

    var scaleToGeodeticSurfaceIntersection;
    var scaleToGeodeticSurfaceGradient = new Cartesian3();

    /**
     * Scales the provided Cartesian position along the geodetic surface normal
     * so that it is on the surface of this ellipsoid.  If the position is
     * at the center of the ellipsoid, this function returns undefined.
     * @memberof Ellipsoid
     *
     * @param {Cartesian3} cartesian The Cartesian position to scale.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter, a new Cartesian3 instance if none was provided, or undefined if the position is at the center.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Ellipsoid.prototype.scaleToGeodeticSurface = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required.');
        }

        var positionX = cartesian.x;
        var positionY = cartesian.y;
        var positionZ = cartesian.z;

        var oneOverRadii = this._oneOverRadii;
        var oneOverRadiiX = oneOverRadii.x;
        var oneOverRadiiY = oneOverRadii.y;
        var oneOverRadiiZ = oneOverRadii.z;

        var x2 = positionX * positionX * oneOverRadiiX * oneOverRadiiX;
        var y2 = positionY * positionY * oneOverRadiiY * oneOverRadiiY;
        var z2 = positionZ * positionZ * oneOverRadiiZ * oneOverRadiiZ;

        // Compute the squared ellipsoid norm.
        var squaredNorm = x2 + y2 + z2;
        var ratio = Math.sqrt(1.0 / squaredNorm);

        // As an initial approximation, assume that the radial intersection is the projection point.
        var intersection = Cartesian3.multiplyByScalar(cartesian, ratio, scaleToGeodeticSurfaceIntersection);

        //* If the position is near the center, the iteration will not converge.
        if (squaredNorm < this._centerToleranceSquared) {
            return !isFinite(ratio) ? undefined : Cartesian3.clone(intersection, result);
        }

        var oneOverRadiiSquared = this._oneOverRadiiSquared;
        var oneOverRadiiSquaredX = oneOverRadiiSquared.x;
        var oneOverRadiiSquaredY = oneOverRadiiSquared.y;
        var oneOverRadiiSquaredZ = oneOverRadiiSquared.z;

        // Use the gradient at the intersection point in place of the true unit normal.
        // The difference in magnitude will be absorbed in the multiplier.
        var gradient = scaleToGeodeticSurfaceGradient;
        gradient.x = intersection.x * oneOverRadiiSquaredX * 2.0;
        gradient.y = intersection.y * oneOverRadiiSquaredY * 2.0;
        gradient.z = intersection.z * oneOverRadiiSquaredZ * 2.0;

        // Compute the initial guess at the normal vector multiplier, lambda.
        var lambda = (1.0 - ratio) * Cartesian3.magnitude(cartesian) / (0.5 * Cartesian3.magnitude(gradient));
        var correction = 0.0;

        var func;
        var denominator;
        var xMultiplier;
        var yMultiplier;
        var zMultiplier;
        var xMultiplier2;
        var yMultiplier2;
        var zMultiplier2;
        var xMultiplier3;
        var yMultiplier3;
        var zMultiplier3;

        do {
            lambda -= correction;

            xMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredX);
            yMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredY);
            zMultiplier = 1.0 / (1.0 + lambda * oneOverRadiiSquaredZ);

            xMultiplier2 = xMultiplier * xMultiplier;
            yMultiplier2 = yMultiplier * yMultiplier;
            zMultiplier2 = zMultiplier * zMultiplier;

            xMultiplier3 = xMultiplier2 * xMultiplier;
            yMultiplier3 = yMultiplier2 * yMultiplier;
            zMultiplier3 = zMultiplier2 * zMultiplier;

            func = x2 * xMultiplier2 + y2 * yMultiplier2 + z2 * zMultiplier2 - 1.0;

            // "denominator" here refers to the use of this expression in the velocity and acceleration
            // computations in the sections to follow.
            denominator = x2 * xMultiplier3 * oneOverRadiiSquaredX + y2 * yMultiplier3 * oneOverRadiiSquaredY + z2 * zMultiplier3 * oneOverRadiiSquaredZ;

            var derivative = -2.0 * denominator;

            correction = func / derivative;
        } while (Math.abs(func) > CesiumMath.EPSILON12);

        if (typeof result === 'undefined') {
            return new Cartesian3(positionX * xMultiplier, positionY * yMultiplier, positionZ * zMultiplier);
        }
        result.x = positionX * xMultiplier;
        result.y = positionY * yMultiplier;
        result.z = positionZ * zMultiplier;
        return result;
    };

    /**
     * Scales the provided Cartesian position along the geocentric surface normal
     * so that it is on the surface of this ellipsoid.
     * @memberof Ellipsoid
     *
     * @param {Cartesian3} cartesian The Cartesian position to scale.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if none was provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Ellipsoid.prototype.scaleToGeocentricSurface = function(cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required.');
        }

        var positionX = cartesian.x;
        var positionY = cartesian.y;
        var positionZ = cartesian.z;
        var oneOverRadiiSquared = this._oneOverRadiiSquared;

        var beta = 1.0 / Math.sqrt((positionX * positionX) * oneOverRadiiSquared.x +
                                   (positionY * positionY) * oneOverRadiiSquared.y +
                                   (positionZ * positionZ) * oneOverRadiiSquared.z);

        return Cartesian3.multiplyByScalar(cartesian, beta, result);
    };

    /**
     * Transforms a Cartesian X, Y, Z position to the ellipsoid-scaled space by multiplying
     * its components by the result of {@link Ellipsoid#getOneOverRadii}.
     *
     * @memberof Ellipsoid
     *
     * @param {Cartesian3} position The position to transform.
     * @param {Cartesian3} [result] The position to which to copy the result, or undefined to create and
     *        return a new instance.
     * @returns {Cartesian3} The position expressed in the scaled space.  The returned instance is the
     *          one passed as the result parameter if it is not undefined, or a new instance of it is.
     */
    Ellipsoid.prototype.transformPositionToScaledSpace = function(position, result) {
        return Cartesian3.multiplyComponents(position, this._oneOverRadii, result);
    };

    /**
     * Compares this Ellipsoid against the provided Ellipsoid componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Ellipsoid
     *
     * @param {Ellipsoid} [right] The other Ellipsoid.
     * @return {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Ellipsoid.prototype.equals = function(right) {
        return (this === right) ||
               (typeof right !== 'undefined' &&
                Cartesian3.equals(this._radii, right._radii));
    };

    /**
     * Creates a string representing this Ellipsoid in the format '(radii.x, radii.y, radii.z)'.
     * @memberof Ellipsoid
     *
     * @return {String} A string representing this ellipsoid in the format '(radii.x, radii.y, radii.z)'.
     */
    Ellipsoid.prototype.toString = function() {
        return this._radii.toString();
    };

    return Ellipsoid;
});

/*global define*/
define('Core/GeographicProjection',[
        './defaultValue',
        './Cartesian3',
        './Cartographic',
        './Ellipsoid'
    ], function(
        defaultValue,
        Cartesian3,
        Cartographic,
        Ellipsoid) {
    

    /**
     * A simple map projection where longitude and latitude are linearly mapped to X and Y by multiplying
     * them by the {@link Ellipsoid#getMaximumRadius}.  This projection
     * is commonly known as geographic, equirectangular, equidistant cylindrical, or plate carrée.  It
     * is also known as EPSG:4326.
     *
     * @alias GeographicProjection
     * @constructor
     * @immutable
     *
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid.
     *
     * @see WebMercatorProjection
     */
    var GeographicProjection = function(ellipsoid) {
        this._ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);
        this._semimajorAxis = this._ellipsoid.getMaximumRadius();
        this._oneOverSemimajorAxis = 1.0 / this._semimajorAxis;
    };

    /**
     * Gets the {@link Ellipsoid}.
     *
     * @memberof GeographicProjection
     *
     * @returns {Ellipsoid} The ellipsoid.
     */
    GeographicProjection.prototype.getEllipsoid = function() {
        return this._ellipsoid;
    };

    /**
     * Projects a set of {@link Cartographic} coordinates, in radians, to map coordinates, in meters.
     * X and Y are the longitude and latitude, respectively, multiplied by the maximum radius of the
     * ellipsoid.  Z is the unmodified height.
     *
     * @memberof GeographicProjection
     *
     * @param {Cartographic} cartographic The coordinates to project.
     * @param {Cartesian3} [result] An instance into which to copy the result.  If this parameter is
     *        undefined, a new instance is created and returned.
     * @returns {Cartesian3} The projected coordinates.  If the result parameter is not undefined, the
     *          coordinates are copied there and that instance is returned.  Otherwise, a new instance is
     *          created and returned.
     */
    GeographicProjection.prototype.project = function(cartographic, result) {
        // Actually this is the special case of equidistant cylindrical called the plate carree
        var semimajorAxis = this._semimajorAxis;
        var x = cartographic.longitude * semimajorAxis;
        var y = cartographic.latitude * semimajorAxis;
        var z = cartographic.height;

        if (typeof result === 'undefined') {
            return new Cartesian3(x, y, z);
        }

        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Unprojects a set of projected {@link Cartesian3} coordinates, in meters, to {@link Cartographic}
     * coordinates, in radians.  Longitude and Latitude are the X and Y coordinates, respectively,
     * divided by the maximum radius of the ellipsoid.  Height is the unmodified Z coordinate.
     *
     * @memberof GeographicProjection
     *
     * @param {Cartesian3} cartesian The coordinate to unproject.
     * @param {Cartographic} [result] An instance into which to copy the result.  If this parameter is
     *        undefined, a new instance is created and returned.
     * @returns {Cartographic} The unprojected coordinates.  If the result parameter is not undefined, the
     *          coordinates are copied there and that instance is returned.  Otherwise, a new instance is
     *          created and returned.
     */
    GeographicProjection.prototype.unproject = function(cartesian, result) {
        var oneOverEarthSemimajorAxis = this._oneOverSemimajorAxis;
        var longitude = cartesian.x * oneOverEarthSemimajorAxis;
        var latitude = cartesian.y * oneOverEarthSemimajorAxis;
        var height = cartesian.z;

        if (typeof result === 'undefined') {
            return new Cartographic(longitude, latitude, height);
        }

        result.longitude = longitude;
        result.latitude = latitude;
        result.height = height;
        return result;
    };

    return GeographicProjection;
});

/*global define*/
define('Core/Enumeration',[],function() {
    

    /**
     * Constructs an enumeration that contains both a numeric value and a name.
     * This is used so the name of the enumeration is available in the debugger.
     *
     * @param {Number} [value=undefined] The numeric value of the enumeration.
     * @param {String} [name=undefined] The name of the enumeration for debugging purposes.
     * @param {Object} [properties=undefined] An object containing extra properties to be added to the enumeration.
     *
     * @alias Enumeration
     * @constructor
     * @example
     * // Create an object with two enumerations.
     * var filter = {
     *     NEAREST : new Enumeration(0x2600, 'NEAREST'),
     *     LINEAR : new Enumeration(0x2601, 'LINEAR')
     * };
     */
    var Enumeration = function(value, name, properties) {
        /**
         * The numeric value of the enumeration.
         * @type Number
         */
        this.value = value;

        /**
         * The name of the enumeration for debugging purposes.
         * @type String
         */
        this.name = name;

        if (typeof properties !== 'undefined') {
            for ( var propertyName in properties) {
                if (properties.hasOwnProperty(propertyName)) {
                    this[propertyName] = properties[propertyName];
                }
            }
        }
    };

    /**
     * Returns the numeric value of the enumeration.
     *
     * @memberof Enumeration
     *
     * @return {Number} The numeric value of the enumeration.
     */
    Enumeration.prototype.valueOf = function() {
        return this.value;
    };

    /**
     * Returns the name of the enumeration for debugging purposes.
     *
     * @memberof Enumeration
     *
     * @return {String} The name of the enumeration for debugging purposes.
     */
    Enumeration.prototype.toString = function() {
        return this.name;
    };

    return Enumeration;
});
/*global define*/
define('Core/Intersect',['./Enumeration'], function(Enumeration) {
    

    /**
     * This enumerated type is used in determining where, relative to the frustum, an
     * object is located. The object can either be fully contained within the frustum (INSIDE),
     * partially inside the frustum and partially outside (INTERSECTING), or somwhere entirely
     * outside of the frustum's 6 planes (OUTSIDE).
     *
     * @exports Intersect
     */
    var Intersect = {
        /**
         * Represents that an object is not contained within the frustum.
         *
         * @constant
         * @type {Enumeration}
         */
        OUTSIDE : new Enumeration(-1, 'OUTSIDE'),

        /**
         * Represents that an object intersects one of the frustum's planes.
         *
         * @constant
         * @type {Enumeration}
         */
        INTERSECTING : new Enumeration(0, 'INTERSECTING'),

        /**
         * Represents that an object is fully within the frustum.
         *
         * @constant
         * @type {Enumeration}
         */
        INSIDE : new Enumeration(1, 'INSIDE')
    };

    return Intersect;
});

/*global define*/
define('Core/Interval',['./defaultValue'], function(defaultValue) {
    

    /**
     * Represents the closed interval [start, stop].
     * @alias Interval
     * @constructor
     *
     * @param {Number} [start=0.0] The beginning of the interval.
     * @param {Number} [stop=0.0] The end of the interval.
     */
    var Interval = function(start, stop) {
        /**
         * The beginning of the interval.
         * @type {Number}
         */
        this.start = defaultValue(start, 0.0);
        /**
         * The end of the interval.
         * @type {Number}
         */
        this.stop = defaultValue(stop, 0.0);
    };

    return Interval;
});
/*global define*/
define('Core/Matrix3',[
        './Cartesian3',
        './defaultValue',
        './DeveloperError',
        './freezeObject'
    ], function(
        Cartesian3,
        defaultValue,
        DeveloperError,
        freezeObject) {
    

    /**
     * A 3x3 matrix, indexable as a column-major order array.
     * Constructor parameters are in row-major order for code readability.
     * @alias Matrix3
     * @constructor
     *
     * @param {Number} [column0Row0=0.0] The value for column 0, row 0.
     * @param {Number} [column1Row0=0.0] The value for column 1, row 0.
     * @param {Number} [column2Row0=0.0] The value for column 2, row 0.
     * @param {Number} [column0Row1=0.0] The value for column 0, row 1.
     * @param {Number} [column1Row1=0.0] The value for column 1, row 1.
     * @param {Number} [column2Row1=0.0] The value for column 2, row 1.
     * @param {Number} [column0Row2=0.0] The value for column 0, row 2.
     * @param {Number} [column1Row2=0.0] The value for column 1, row 2.
     * @param {Number} [column2Row2=0.0] The value for column 2, row 2.
     *
     * @see Matrix3.fromColumnMajor
     * @see Matrix3.fromRowMajorArray
     * @see Matrix3.fromQuaternion
     * @see Matrix3.fromScale
     * @see Matrix3.fromUniformScale
     * @see Matrix2
     * @see Matrix4
     */
    var Matrix3 = function(column0Row0, column1Row0, column2Row0,
                           column0Row1, column1Row1, column2Row1,
                           column0Row2, column1Row2, column2Row2) {
        this[0] = defaultValue(column0Row0, 0.0);
        this[1] = defaultValue(column0Row1, 0.0);
        this[2] = defaultValue(column0Row2, 0.0);
        this[3] = defaultValue(column1Row0, 0.0);
        this[4] = defaultValue(column1Row1, 0.0);
        this[5] = defaultValue(column1Row2, 0.0);
        this[6] = defaultValue(column2Row0, 0.0);
        this[7] = defaultValue(column2Row1, 0.0);
        this[8] = defaultValue(column2Row2, 0.0);
    };

    /**
     * Duplicates a Matrix3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to duplicate.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided. (Returns undefined if matrix is undefined)
     */
    Matrix3.clone = function(values, result) {
        if (typeof values === 'undefined') {
            return undefined;
        }
        if (typeof result === 'undefined') {
            return new Matrix3(values[0], values[3], values[6],
                               values[1], values[4], values[7],
                               values[2], values[5], values[8]);
        }
        result[0] = values[0];
        result[1] = values[1];
        result[2] = values[2];
        result[3] = values[3];
        result[4] = values[4];
        result[5] = values[5];
        result[6] = values[6];
        result[7] = values[7];
        result[8] = values[8];
        return result;
    };

    /**
     * Creates a Matrix3 instance from a column-major order array.
     * @memberof Matrix3
     * @function
     *
     * @param {Array} values The column-major order array.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     */
    Matrix3.fromColumnMajorArray = function(values, result) {
        if (typeof values === 'undefined') {
            throw new DeveloperError('values parameter is required');
        }
        return Matrix3.clone(values, result);
    };

    /**
     * Creates a Matrix3 instance from a row-major order array.
     * The resulting matrix will be in column-major order.
     * @memberof Matrix3
     *
     * @param {Array} values The row-major order array.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     */
    Matrix3.fromRowMajorArray = function(values, result) {
        if (typeof values === 'undefined') {
            throw new DeveloperError('values is required.');
        }
        if (typeof result === 'undefined') {
            return new Matrix3(values[0], values[1], values[2],
                               values[3], values[4], values[5],
                               values[6], values[7], values[8]);
        }
        result[0] = values[0];
        result[1] = values[3];
        result[2] = values[6];
        result[3] = values[1];
        result[4] = values[4];
        result[5] = values[7];
        result[6] = values[2];
        result[7] = values[5];
        result[8] = values[8];
        return result;
    };

    /**
     * Computes a 3x3 rotation matrix from the provided quaternion.
     * @memberof Matrix3
     *
     * @param {Quaternion} quaternion the quaternion to use.
     *
     * @return {Matrix3} The 3x3 rotation matrix from this quaternion.
     */
    Matrix3.fromQuaternion = function(quaternion, result) {
        if (typeof quaternion === 'undefined') {
            throw new DeveloperError('quaternion is required');
        }
        var x2 = quaternion.x * quaternion.x;
        var xy = quaternion.x * quaternion.y;
        var xz = quaternion.x * quaternion.z;
        var xw = quaternion.x * quaternion.w;
        var y2 = quaternion.y * quaternion.y;
        var yz = quaternion.y * quaternion.z;
        var yw = quaternion.y * quaternion.w;
        var z2 = quaternion.z * quaternion.z;
        var zw = quaternion.z * quaternion.w;
        var w2 = quaternion.w * quaternion.w;

        var m00 = x2 - y2 - z2 + w2;
        var m01 = 2.0 * (xy + zw);
        var m02 = 2.0 * (xz - yw);

        var m10 = 2.0 * (xy - zw);
        var m11 = -x2 + y2 - z2 + w2;
        var m12 = 2.0 * (yz + xw);

        var m20 = 2.0 * (xz + yw);
        var m21 = 2.0 * (yz - xw);
        var m22 = -x2 - y2 + z2 + w2;

        if (typeof result === 'undefined') {
            return new Matrix3(m00, m01, m02,
                               m10, m11, m12,
                               m20, m21, m22);
        }
        result[0] = m00;
        result[1] = m10;
        result[2] = m20;
        result[3] = m01;
        result[4] = m11;
        result[5] = m21;
        result[6] = m02;
        result[7] = m12;
        result[8] = m22;
        return result;
    };

    /**
     * Computes a Matrix3 instance representing a non-uniform scale.
     * @memberof Matrix3
     *
     * @param {Cartesian3} scale The x, y, and z scale factors.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} scale is required.
     *
     * @example
     * // Creates
     * //   [7.0, 0.0, 0.0]
     * //   [0.0, 8.0, 0.0]
     * //   [0.0, 0.0, 9.0]
     * var m = Matrix3.fromScale(new Cartesian3(7.0, 8.0, 9.0));
     */
    Matrix3.fromScale = function(scale, result) {
        if (typeof scale === 'undefined') {
            throw new DeveloperError('scale is required.');
        }
        if (typeof result === 'undefined') {
            return new Matrix3(
                scale.x, 0.0,     0.0,
                0.0,     scale.y, 0.0,
                0.0,     0.0,     scale.z);
        }

        result[0] = scale.x;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = scale.y;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = scale.z;
        return result;
    };

    /**
     * Computes a Matrix3 instance representing a uniform scale.
     * @memberof Matrix3
     *
     * @param {Number} scale The uniform scale factor.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} scale is required.
     *
     * @example
     * // Creates
     * //   [2.0, 0.0, 0.0]
     * //   [0.0, 2.0, 0.0]
     * //   [0.0, 0.0, 2.0]
     * var m = Matrix3.fromUniformScale(2.0);
     */
    Matrix3.fromUniformScale = function(scale, result) {
        if (typeof scale !== 'number') {
            throw new DeveloperError('scale is required.');
        }
        if (typeof result === 'undefined') {
            return new Matrix3(
                scale, 0.0,   0.0,
                0.0,   scale, 0.0,
                0.0,   0.0,   scale);
        }

        result[0] = scale;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = scale;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = scale;
        return result;
    };

    /**
     * Creates a rotation matrix around the x-axis.
     *
     * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     *
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} angle is required.
     *
     * @example
     * // Rotate a point 45 degrees counterclockwise around the x-axis.
     * var p = new Cartesian3(5, 6, 7);
     * var m = Matrix3.fromRotationX(CesiumMath.toRadians(45.0));
     * var rotated = m.multiplyByVector(p);
     */
    Matrix3.fromRotationX = function(angle, result) {
        if (typeof angle === 'undefined') {
            throw new DeveloperError('angle is required.');
        }

        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);

        if (typeof result === 'undefined') {
            return new Matrix3(
                1.0, 0.0, 0.0,
                0.0, cosAngle, -sinAngle,
                0.0, sinAngle, cosAngle);
        }

        result[0] = 1.0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = cosAngle;
        result[5] = sinAngle;
        result[6] = 0.0;
        result[7] = -sinAngle;
        result[8] = cosAngle;

        return result;
    };

    /**
     * Creates a rotation matrix around the y-axis.
     *
     * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     *
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} angle is required.
     *
     * @example
     * // Rotate a point 45 degrees counterclockwise around the y-axis.
     * var p = new Cartesian3(5, 6, 7);
     * var m = Matrix3.fromRotationY(CesiumMath.toRadians(45.0));
     * var rotated = m.multiplyByVector(p);
     */
    Matrix3.fromRotationY = function(angle, result) {
        if (typeof angle === 'undefined') {
            throw new DeveloperError('angle is required.');
        }

        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);

        if (typeof result === 'undefined') {
            return new Matrix3(
                cosAngle, 0.0, sinAngle,
                0.0, 1.0, 0.0,
                -sinAngle, 0.0, cosAngle);
        }

        result[0] = cosAngle;
        result[1] = 0.0;
        result[2] = -sinAngle;
        result[3] = 0.0;
        result[4] = 1.0;
        result[5] = 0.0;
        result[6] = sinAngle;
        result[7] = 0.0;
        result[8] = cosAngle;

        return result;
    };

    /**
     * Creates a rotation matrix around the z-axis.
     *
     * @param {Number} angle The angle, in radians, of the rotation.  Positive angles are counterclockwise.
     * @param {Matrix3} [result] The object in which the result will be stored, if undefined a new instance will be created.
     *
     * @returns The modified result parameter, or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} angle is required.
     *
     * @example
     * // Rotate a point 45 degrees counterclockwise around the z-axis.
     * var p = new Cartesian3(5, 6, 7);
     * var m = Matrix3.fromRotationZ(CesiumMath.toRadians(45.0));
     * var rotated = m.multiplyByVector(p);
     */
    Matrix3.fromRotationZ = function(angle, result) {
        if (typeof angle === 'undefined') {
            throw new DeveloperError('angle is required.');
        }

        var cosAngle = Math.cos(angle);
        var sinAngle = Math.sin(angle);

        if (typeof result === 'undefined') {
            return new Matrix3(
                cosAngle, -sinAngle, 0.0,
                sinAngle, cosAngle, 0.0,
                0.0, 0.0, 1.0);
        }

        result[0] = cosAngle;
        result[1] = sinAngle;
        result[2] = 0.0;
        result[3] = -sinAngle;
        result[4] = cosAngle;
        result[5] = 0.0;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 1.0;

        return result;
    };

    /**
     * Creates an Array from the provided Matrix3 instance.
     * The array will be in column-major order.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use..
     * @param {Array} [result] The Array onto which to store the result.
     * @return {Array} The modified Array parameter or a new Array instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.toArray = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof result === 'undefined') {
            return [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5], matrix[6], matrix[7], matrix[8]];
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        return result;
    };

    /**
     * Computes the array index of the element at the provided row and column.
     * @memberof Matrix3
     *
     * @param {Number} row The zero-based index of the row.
     * @param {Number} column The zero-based index of the column.
     * @return {Number} The index of the element at the provided row and column.
     *
     * @exception {DeveloperError} row is required and must be 0, 1, or 2.
     * @exception {DeveloperError} column is required and must be 0, 1, or 2.
     *
     * @example
     * var myMatrix = new Matrix3();
     * var column1Row0Index = Matrix3.getElementIndex(1, 0);
     * var column1Row0 = myMatrix[column1Row0Index]
     * myMatrix[column1Row0Index] = 10.0;
     */
    Matrix3.getElementIndex = function(column, row) {
        if (typeof row !== 'number' || row < 0 || row > 2) {
            throw new DeveloperError('row is required and must be 0, 1, or 2.');
        }
        if (typeof column !== 'number' || column < 0 || column > 2) {
            throw new DeveloperError('column is required and must be 0, 1, or 2.');
        }
        return column * 3 + row;
    };

    /**
     * Retrieves a copy of the matrix column at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the column to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.getColumn = function(matrix, index, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required.');
        }

        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }

        var startIndex = index * 3;
        var x = matrix[startIndex];
        var y = matrix[startIndex + 1];
        var z = matrix[startIndex + 2];

        if (typeof result === 'undefined') {
            return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the column to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified column.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.setColumn = function(matrix, index, cartesian, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }
        result = Matrix3.clone(matrix, result);
        var startIndex = index * 3;
        result[startIndex] = cartesian.x;
        result[startIndex + 1] = cartesian.y;
        result[startIndex + 2] = cartesian.z;
        return result;
    };

    /**
     * Retrieves a copy of the matrix row at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the row to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.getRow = function(matrix, index, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required.');
        }

        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }

        var x = matrix[index];
        var y = matrix[index + 3];
        var z = matrix[index + 6];

        if (typeof result === 'undefined') {
            return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to use.
     * @param {Number} index The zero-based index of the row to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified row.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.setRow = function(matrix, index, cartesian, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 2) {
            throw new DeveloperError('index is required and must be 0, 1, or 2.');
        }

        result = Matrix3.clone(matrix, result);
        result[index] = cartesian.x;
        result[index + 3] = cartesian.y;
        result[index + 6] = cartesian.z;
        return result;
    };

    /**
     * Computes the product of two matrices.
     * @memberof Matrix3
     *
     * @param {Matrix3} left The first matrix.
     * @param {Matrix3} right The second matrix.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Matrix3.multiply = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }

        var column0Row0 = left[0] * right[0] + left[3] * right[1] + left[6] * right[2];
        var column0Row1 = left[1] * right[0] + left[4] * right[1] + left[7] * right[2];
        var column0Row2 = left[2] * right[0] + left[5] * right[1] + left[8] * right[2];

        var column1Row0 = left[0] * right[3] + left[3] * right[4] + left[6] * right[5];
        var column1Row1 = left[1] * right[3] + left[4] * right[4] + left[7] * right[5];
        var column1Row2 = left[2] * right[3] + left[5] * right[4] + left[8] * right[5];

        var column2Row0 = left[0] * right[6] + left[3] * right[7] + left[6] * right[8];
        var column2Row1 = left[1] * right[6] + left[4] * right[7] + left[7] * right[8];
        var column2Row2 = left[2] * right[6] + left[5] * right[7] + left[8] * right[8];

        if (typeof result === 'undefined') {
            return new Matrix3(column0Row0, column1Row0, column2Row0,
                               column0Row1, column1Row1, column2Row1,
                               column0Row2, column1Row2, column2Row2);
        }
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column1Row0;
        result[4] = column1Row1;
        result[5] = column1Row2;
        result[6] = column2Row0;
        result[7] = column2Row1;
        result[8] = column2Row2;
        return result;
    };

    /**
     * Computes the product of a matrix and a column vector.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix.
     * @param {Cartesian3} cartesian The column.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     */
    Matrix3.multiplyByVector = function(matrix, cartesian, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }

        var vX = cartesian.x;
        var vY = cartesian.y;
        var vZ = cartesian.z;

        var x = matrix[0] * vX + matrix[3] * vY + matrix[6] * vZ;
        var y = matrix[1] * vX + matrix[4] * vY + matrix[7] * vZ;
        var z = matrix[2] * vX + matrix[5] * vY + matrix[8] * vZ;

        if (typeof result === 'undefined') {
            return new Cartesian3(x, y, z);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        return result;
    };

    /**
     * Computes the product of a matrix and a scalar.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix.
     * @param {Number} scalar The number to multiply by.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Matrix3.multiplyByScalar = function(matrix, scalar, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number');
        }

        if (typeof result === 'undefined') {
            return new Matrix3(matrix[0] * scalar, matrix[3] * scalar, matrix[6] * scalar,
                               matrix[1] * scalar, matrix[4] * scalar, matrix[7] * scalar,
                               matrix[2] * scalar, matrix[5] * scalar, matrix[8] * scalar);
        }
        result[0] = matrix[0] * scalar;
        result[1] = matrix[1] * scalar;
        result[2] = matrix[2] * scalar;
        result[3] = matrix[3] * scalar;
        result[4] = matrix[4] * scalar;
        result[5] = matrix[5] * scalar;
        result[6] = matrix[6] * scalar;
        result[7] = matrix[7] * scalar;
        result[8] = matrix[8] * scalar;
        return result;
    };

    /**
     * Creates a negated copy of the provided matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to negate.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.negate = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }

        if (typeof result === 'undefined') {
            return new Matrix3(-matrix[0], -matrix[3], -matrix[6],
                               -matrix[1], -matrix[4], -matrix[7],
                               -matrix[2], -matrix[5], -matrix[8]);
        }
        result[0] = -matrix[0];
        result[1] = -matrix[1];
        result[2] = -matrix[2];
        result[3] = -matrix[3];
        result[4] = -matrix[4];
        result[5] = -matrix[5];
        result[6] = -matrix[6];
        result[7] = -matrix[7];
        result[8] = -matrix[8];
        return result;
    };

    /**
     * Computes the transpose of the provided matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to transpose.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.transpose = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }

        var column0Row0 = matrix[0];
        var column0Row1 = matrix[3];
        var column0Row2 = matrix[6];
        var column1Row0 = matrix[1];
        var column1Row1 = matrix[4];
        var column1Row2 = matrix[7];
        var column2Row0 = matrix[2];
        var column2Row1 = matrix[5];
        var column2Row2 = matrix[8];

        if (typeof result === 'undefined') {
            return new Matrix3(column0Row0, column1Row0, column2Row0,
                               column0Row1, column1Row1, column2Row1,
                               column0Row2, column1Row2, column2Row2);
        }
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column1Row0;
        result[4] = column1Row1;
        result[5] = column1Row2;
        result[6] = column2Row0;
        result[7] = column2Row1;
        result[8] = column2Row2;
        return result;
    };

    /**
     * Compares the provided matrices componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [left] The first matrix.
     * @param {Matrix3} [right] The second matrix.
     * @return {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Matrix3.equals = function(left, right) {
        return (left === right) ||
               (typeof left !== 'undefined' &&
                typeof right !== 'undefined' &&
                left[0] === right[0] &&
                left[1] === right[1] &&
                left[2] === right[2] &&
                left[3] === right[3] &&
                left[4] === right[4] &&
                left[5] === right[5] &&
                left[6] === right[6] &&
                left[7] === right[7] &&
                left[8] === right[8]);
    };

    /**
     * Compares the provided matrices componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [left] The first matrix.
     * @param {Matrix3} [right] The second matrix.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Matrix3.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number');
        }

        return (left === right) ||
                (typeof left !== 'undefined' &&
                typeof right !== 'undefined' &&
                Math.abs(left[0] - right[0]) <= epsilon &&
                Math.abs(left[1] - right[1]) <= epsilon &&
                Math.abs(left[2] - right[2]) <= epsilon &&
                Math.abs(left[3] - right[3]) <= epsilon &&
                Math.abs(left[4] - right[4]) <= epsilon &&
                Math.abs(left[5] - right[5]) <= epsilon &&
                Math.abs(left[6] - right[6]) <= epsilon &&
                Math.abs(left[7] - right[7]) <= epsilon &&
                Math.abs(left[8] - right[8]) <= epsilon);
    };

    /**
     * An immutable Matrix3 instance initialized to the identity matrix.
     * @memberof Matrix3
     */
    Matrix3.IDENTITY = freezeObject(new Matrix3(1.0, 0.0, 0.0,
                                                0.0, 1.0, 0.0,
                                                0.0, 0.0, 1.0));

    /**
     * The index into Matrix3 for column 0, row 0.
     * @memberof Matrix3
     */
    Matrix3.COLUMN0ROW0 = 0;

    /**
     * The index into Matrix3 for column 0, row 1.
     * @memberof Matrix3
     */
    Matrix3.COLUMN0ROW1 = 1;

    /**
     * The index into Matrix3 for column 0, row 2.
     * @memberof Matrix3
     */
    Matrix3.COLUMN0ROW2 = 2;

    /**
     * The index into Matrix3 for column 1, row 0.
     * @memberof Matrix3
     */
    Matrix3.COLUMN1ROW0 = 3;

    /**
     * The index into Matrix3 for column 1, row 1.
     * @memberof Matrix3
     */
    Matrix3.COLUMN1ROW1 = 4;

    /**
     * The index into Matrix3 for column 1, row 2.
     * @memberof Matrix3
     */
    Matrix3.COLUMN1ROW2 = 5;

    /**
     * The index into Matrix3 for column 2, row 0.
     * @memberof Matrix3
     */
    Matrix3.COLUMN2ROW0 = 6;

    /**
     * The index into Matrix3 for column 2, row 1.
     * @memberof Matrix3
     */
    Matrix3.COLUMN2ROW1 = 7;

    /**
     * The index into Matrix3 for column 2, row 2.
     * @memberof Matrix3
     */
    Matrix3.COLUMN2ROW2 = 8;

    /**
     * Duplicates the provided Matrix3 instance.
     * @memberof Matrix3
     *
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     */
    Matrix3.prototype.clone = function(result) {
        return Matrix3.clone(this, result);
    };

    /**
     * Creates an Array from this Matrix3 instance.
     * @memberof Matrix3
     *
     * @param {Array} [result] The Array onto which to store the result.
     * @return {Array} The modified Array parameter or a new Array instance if one was not provided.
     */
    Matrix3.prototype.toArray = function(result) {
        return Matrix3.toArray(this, result);
    };

    /**
     * Retrieves a copy of the matrix column at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the column to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.getColumn = function(index, result) {
        return Matrix3.getColumn(this, index, result);
    };

    /**
     * Computes a new matrix that replaces the specified column in this matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the column to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified column.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.setColumn = function(index, cartesian, result) {
        return Matrix3.setColumn(this, index, cartesian, result);
    };

    /**
     * Retrieves a copy of the matrix row at the provided index as a Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the row to retrieve.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.getRow = function(index, result) {
        return Matrix3.getRow(this, index, result);
    };

    /**
     * Computes a new matrix that replaces the specified row in this matrix with the provided Cartesian3 instance.
     * @memberof Matrix3
     *
     * @param {Number} index The zero-based index of the row to set.
     * @param {Cartesian3} cartesian The Cartesian whose values will be assigned to the specified row.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, or 2.
     *
     * @see Cartesian3
     */
    Matrix3.prototype.setRow = function(index, cartesian, result) {
        return Matrix3.setRow(this, index, cartesian, result);
    };

    /**
     * Computes the product of this matrix and the provided matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} right The right hand side matrix.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Matrix3.prototype.multiply = function(right, result) {
        return Matrix3.multiply(this, right, result);
    };

    /**
     * Computes the product of this matrix and a column vector.
     * @memberof Matrix3
     *
     * @param {Cartesian3} cartesian The column.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Matrix3.prototype.multiplyByVector = function(cartesian, result) {
        return Matrix3.multiplyByVector(this, cartesian, result);
    };

    /**
     * Computes the product of this matrix and a scalar.
     * @memberof Matrix3
     *
     * @param {Number} scalar The number to multiply by.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Matrix3.prototype.multiplyByScalar = function(scalar, result) {
        return Matrix3.multiplyByScalar(this, scalar, result);
    };
    /**
     * Creates a negated copy of this matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} matrix The matrix to negate.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix3.prototype.negate = function(result) {
        return Matrix3.negate(this, result);
    };

    /**
     * Computes the transpose of this matrix.
     * @memberof Matrix3
     *
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Matrix3 instance if one was not provided.
     */
    Matrix3.prototype.transpose = function(result) {
        return Matrix3.transpose(this, result);
    };

    /**
     * Compares this matrix to the provided matrix componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [right] The right hand side matrix.
     * @return {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Matrix3.prototype.equals = function(right) {
        return Matrix3.equals(this, right);
    };

    /**
     * Compares this matrix to the provided matrix componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Matrix3
     *
     * @param {Matrix3} [right] The right hand side matrix.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Matrix3.prototype.equalsEpsilon = function(right, epsilon) {
        return Matrix3.equalsEpsilon(this, right, epsilon);
    };

    /**
     * Creates a string representing this Matrix with each row being
     * on a separate line and in the format '(column0, column1, column2)'.
     * @memberof Matrix3
     *
     * @return {String} A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1, column2)'.
     */
    Matrix3.prototype.toString = function() {
        return '(' + this[0] + ', ' + this[3] + ', ' + this[6] + ')\n' +
               '(' + this[1] + ', ' + this[4] + ', ' + this[7] + ')\n' +
               '(' + this[2] + ', ' + this[5] + ', ' + this[8] + ')';
    };

    return Matrix3;
});
/*global define*/
define('Core/RuntimeError',[],function() {
    

    /**
     * Constructs an exception object that is thrown due to an error that can occur at runtime, e.g.,
     * out of memory, could not compile shader, etc.  If a function may throw this
     * exception, the calling code should be prepared to catch it.
     * <br /><br />
     * On the other hand, a {@link DeveloperError} indicates an exception due
     * to a developer error, e.g., invalid argument, that usually indicates a bug in the
     * calling code.
     *
     * @alias RuntimeError
     *
     * @param {String} [message=undefined] The error message for this exception.
     *
     * @see DeveloperError
     * @constructor
     */
    var RuntimeError = function(message) {
        /**
         * 'RuntimeError' indicating that this exception was thrown due to a runtime error.
         * @type String
         * @constant
         */
        this.name = 'RuntimeError';

        /**
         * The explanation for why this exception was thrown.
         * @type String
         * @constant
         */
        this.message = message;

        /**
         * The Error object containing the stack trace.
         * @type Error
         * @constant
         *
         * @see <a href='https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Error'>Error object on Mozilla Developer Network</a>.
         */
        this.error = new Error();

        /**
         * The stack trace of this exception.
         * @type String
         * @constant
         */
        this.stack = this.error.stack;
    };

    RuntimeError.prototype.toString = function() {
        var str = this.name + ': ' + this.message;

        if (typeof this.stack !== 'undefined') {
            str += '\n' + this.stack.toString();
        } else {
            str += '\n' + this.error.toString();
        }

        return str;
    };

    return RuntimeError;
});

/*global define*/
define('Core/Matrix4',[
        './Cartesian3',
        './Cartesian4',
        './defaultValue',
        './DeveloperError',
        './freezeObject',
        './Math',
        './Matrix3',
        './RuntimeError'
    ], function(
        Cartesian3,
        Cartesian4,
        defaultValue,
        DeveloperError,
        freezeObject,
        CesiumMath,
        Matrix3,
        RuntimeError) {
    

    /**
     * A 4x4 matrix, indexable as a column-major order array.
     * Constructor parameters are in row-major order for code readability.
     * @alias Matrix4
     * @constructor
     *
     * @param {Number} [column0Row0=0.0] The value for column 0, row 0.
     * @param {Number} [column1Row0=0.0] The value for column 1, row 0.
     * @param {Number} [column2Row0=0.0] The value for column 2, row 0.
     * @param {Number} [column3Row0=0.0] The value for column 3, row 0.
     * @param {Number} [column0Row1=0.0] The value for column 0, row 1.
     * @param {Number} [column1Row1=0.0] The value for column 1, row 1.
     * @param {Number} [column2Row1=0.0] The value for column 2, row 1.
     * @param {Number} [column3Row1=0.0] The value for column 3, row 1.
     * @param {Number} [column0Row2=0.0] The value for column 0, row 2.
     * @param {Number} [column1Row2=0.0] The value for column 1, row 2.
     * @param {Number} [column2Row2=0.0] The value for column 2, row 2.
     * @param {Number} [column3Row2=0.0] The value for column 3, row 2.
     * @param {Number} [column0Row3=0.0] The value for column 0, row 3.
     * @param {Number} [column1Row3=0.0] The value for column 1, row 3.
     * @param {Number} [column2Row3=0.0] The value for column 2, row 3.
     * @param {Number} [column3Row3=0.0] The value for column 3, row 3.
     *
     * @see Matrix4.fromColumnMajorArray
     * @see Matrix4.fromRowMajorArray
     * @see Matrix4.fromRotationTranslation
     * @see Matrix4.fromTranslation
     * @see Matrix4.fromScale
     * @see Matrix4.fromUniformScale
     * @see Matrix4.fromCamera
     * @see Matrix4.computePerspectiveFieldOfView
     * @see Matrix4.computeOrthographicOffCenter
     * @see Matrix4.computePerspectiveOffCenter
     * @see Matrix4.computeInfinitePerspectiveOffCenter
     * @see Matrix4.computeViewportTransformation
     * @see Matrix2
     * @see Matrix3
     */
    var Matrix4 = function(column0Row0, column1Row0, column2Row0, column3Row0,
                           column0Row1, column1Row1, column2Row1, column3Row1,
                           column0Row2, column1Row2, column2Row2, column3Row2,
                           column0Row3, column1Row3, column2Row3, column3Row3) {
        this[0] = defaultValue(column0Row0, 0.0);
        this[1] = defaultValue(column0Row1, 0.0);
        this[2] = defaultValue(column0Row2, 0.0);
        this[3] = defaultValue(column0Row3, 0.0);
        this[4] = defaultValue(column1Row0, 0.0);
        this[5] = defaultValue(column1Row1, 0.0);
        this[6] = defaultValue(column1Row2, 0.0);
        this[7] = defaultValue(column1Row3, 0.0);
        this[8] = defaultValue(column2Row0, 0.0);
        this[9] = defaultValue(column2Row1, 0.0);
        this[10] = defaultValue(column2Row2, 0.0);
        this[11] = defaultValue(column2Row3, 0.0);
        this[12] = defaultValue(column3Row0, 0.0);
        this[13] = defaultValue(column3Row1, 0.0);
        this[14] = defaultValue(column3Row2, 0.0);
        this[15] = defaultValue(column3Row3, 0.0);
    };

    /**
     * Duplicates a Matrix4 instance.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to duplicate.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided. (Returns undefined if matrix is undefined)
     */
    Matrix4.clone = function(values, result) {
        if (typeof values === 'undefined') {
            return undefined;
        }
        if (typeof result === 'undefined') {
            return new Matrix4(values[0], values[4], values[8], values[12],
                               values[1], values[5], values[9], values[13],
                               values[2], values[6], values[10], values[14],
                               values[3], values[7], values[11], values[15]);
        }
        result[0] = values[0];
        result[1] = values[1];
        result[2] = values[2];
        result[3] = values[3];
        result[4] = values[4];
        result[5] = values[5];
        result[6] = values[6];
        result[7] = values[7];
        result[8] = values[8];
        result[9] = values[9];
        result[10] = values[10];
        result[11] = values[11];
        result[12] = values[12];
        result[13] = values[13];
        result[14] = values[14];
        result[15] = values[15];
        return result;
    };

    /**
     * Computes a Matrix4 instance from a column-major order array.
     * @memberof Matrix4
     * @function
     *
     * @param {Array} values The column-major order array.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     */
    Matrix4.fromColumnMajorArray = function(values, result) {
        if (typeof values === 'undefined') {
            throw new DeveloperError('values parameter is required');
        }
        return Matrix4.clone(values, result);
    };

    /**
     * Computes a Matrix4 instance from a row-major order array.
     * The resulting matrix will be in column-major order.
     * @memberof Matrix4
     *
     * @param {Array} values The row-major order array.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} values is required.
     */
    Matrix4.fromRowMajorArray = function(values, result) {
        if (typeof values === 'undefined') {
            throw new DeveloperError('values is required.');
        }
        if (typeof result === 'undefined') {
            return new Matrix4(values[0], values[1], values[2], values[3],
                               values[4], values[5], values[6], values[7],
                               values[8], values[9], values[10], values[11],
                               values[12], values[13], values[14], values[15]);
        }
        result[0] = values[0];
        result[1] = values[4];
        result[2] = values[8];
        result[3] = values[12];
        result[4] = values[1];
        result[5] = values[5];
        result[6] = values[9];
        result[7] = values[13];
        result[8] = values[2];
        result[9] = values[6];
        result[10] = values[10];
        result[11] = values[14];
        result[12] = values[3];
        result[13] = values[7];
        result[14] = values[11];
        result[15] = values[15];
        return result;
    };

    /**
     * Computes a Matrix4 instance from a Matrix3 representing the rotation
     * and a Cartesian3 representing the translation.
     * @memberof Matrix4
     *
     * @param {Matrix3} rotation The upper left portion of the matrix representing the rotation.
     * @param {Cartesian3} translation The upper right portion of the matrix representing the translation.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} rotation is required.
     * @exception {DeveloperError} translation is required.
     */
    Matrix4.fromRotationTranslation = function(rotation, translation, result) {
        if (typeof rotation === 'undefined') {
            throw new DeveloperError('rotation is required.');
        }
        if (typeof translation === 'undefined') {
            throw new DeveloperError('translation is required.');
        }
        if (typeof result === 'undefined') {
            return new Matrix4(rotation[0], rotation[3], rotation[6], translation.x,
                               rotation[1], rotation[4], rotation[7], translation.y,
                               rotation[2], rotation[5], rotation[8], translation.z,
                                       0.0,         0.0,         0.0,           1.0);
        }

        result[0] = rotation[0];
        result[1] = rotation[1];
        result[2] = rotation[2];
        result[3] = 0.0;
        result[4] = rotation[3];
        result[5] = rotation[4];
        result[6] = rotation[5];
        result[7] = 0.0;
        result[8] = rotation[6];
        result[9] = rotation[7];
        result[10] = rotation[8];
        result[11] = 0.0;
        result[12] = translation.x;
        result[13] = translation.y;
        result[14] = translation.z;
        result[15] = 1.0;
        return result;
    };

    /**
     * Creates a Matrix4 instance from a Cartesian3 representing the translation.
     * @memberof Matrix4
     *
     * @param {Cartesian3} translation The upper right portion of the matrix representing the translation.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @see Matrix4.multiplyByTranslation
     *
     * @exception {DeveloperError} translation is required.
     */
    Matrix4.fromTranslation = function(translation, result) {
        return Matrix4.fromRotationTranslation(Matrix3.IDENTITY, translation, result);
    };

    /**
     * Computes a Matrix4 instance representing a non-uniform scale.
     * @memberof Matrix4
     *
     * @param {Cartesian3} scale The x, y, and z scale factors.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} scale is required.
     *
     * @example
     * // Creates
     * //   [7.0, 0.0, 0.0, 0.0]
     * //   [0.0, 8.0, 0.0, 0.0]
     * //   [0.0, 0.0, 9.0, 0.0]
     * //   [0.0, 0.0, 0.0, 1.0]
     * var m = Matrix4.fromScale(new Cartesian3(7.0, 8.0, 9.0));
     */
    Matrix4.fromScale = function(scale, result) {
        if (typeof scale === 'undefined') {
            throw new DeveloperError('scale is required.');
        }
        if (typeof result === 'undefined') {
            return new Matrix4(
                scale.x, 0.0,     0.0,     0.0,
                0.0,     scale.y, 0.0,     0.0,
                0.0,     0.0,     scale.z, 0.0,
                0.0,     0.0,     0.0,     1.0);
        }

        result[0] = scale.x;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = scale.y;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = scale.z;
        result[11] = 0.0;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = 0.0;
        result[15] = 1.0;
        return result;
    };

    /**
     * Computes a Matrix4 instance representing a uniform scale.
     * @memberof Matrix4
     *
     * @param {Number} scale The uniform scale factor.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} scale is required.
     *
     * @example
     * // Creates
     * //   [2.0, 0.0, 0.0, 0.0]
     * //   [0.0, 2.0, 0.0, 0.0]
     * //   [0.0, 0.0, 2.0, 0.0]
     * //   [0.0, 0.0, 0.0, 1.0]
     * var m = Matrix4.fromScale(2.0);
     */
    Matrix4.fromUniformScale = function(scale, result) {
        if (typeof scale !== 'number') {
            throw new DeveloperError('scale is required.');
        }
        if (typeof result === 'undefined') {
            return new Matrix4(scale, 0.0,   0.0,   0.0,
                               0.0,   scale, 0.0,   0.0,
                               0.0,   0.0,   scale, 0.0,
                               0.0,   0.0,   0.0,   1.0);
        }

        result[0] = scale;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = scale;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = scale;
        result[11] = 0.0;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = 0.0;
        result[15] = 1.0;
        return result;
    };

    var fromCameraF = new Cartesian3();
    var fromCameraS = new Cartesian3();
    var fromCameraU = new Cartesian3();

    /**
     * Computes a Matrix4 instance from a Camera.
     * @memberof Matrix4
     *
     * @param {Camera} camera The camera to use.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} camera is required.
     * @exception {DeveloperError} camera.eye is required.
     * @exception {DeveloperError} camera.target is required.
     * @exception {DeveloperError} camera.up is required.
     */
    Matrix4.fromCamera = function(camera, result) {
        if (typeof camera === 'undefined') {
            throw new DeveloperError('camera is required.');
        }

        var eye = camera.eye;
        var target = camera.target;
        var up = camera.up;

        if (typeof eye === 'undefined') {
            throw new DeveloperError('camera.eye is required.');
        }
        if (typeof target === 'undefined') {
            throw new DeveloperError('camera.target is required.');
        }
        if (typeof up === 'undefined') {
            throw new DeveloperError('camera.up is required.');
        }

        Cartesian3.subtract(target, eye, fromCameraF).normalize(fromCameraF);
        Cartesian3.cross(fromCameraF, up, fromCameraS).normalize(fromCameraS);
        Cartesian3.cross(fromCameraS, fromCameraF, fromCameraU).normalize(fromCameraU);

        var sX = fromCameraS.x;
        var sY = fromCameraS.y;
        var sZ = fromCameraS.z;
        var fX = fromCameraF.x;
        var fY = fromCameraF.y;
        var fZ = fromCameraF.z;
        var uX = fromCameraU.x;
        var uY = fromCameraU.y;
        var uZ = fromCameraU.z;
        var eyeX = eye.x;
        var eyeY = eye.y;
        var eyeZ = eye.z;
        var t0 = sX * -eyeX + sY * -eyeY+ sZ * -eyeZ;
        var t1 = uX * -eyeX + uY * -eyeY+ uZ * -eyeZ;
        var t2 = fX * eyeX + fY * eyeY + fZ * eyeZ;

        //The code below this comment is an optimized
        //version of the commented lines.
        //Rather that create two matrices and then multiply,
        //we just bake in the multiplcation as part of creation.
        //var rotation = new Matrix4(
        //                sX,  sY,  sZ, 0.0,
        //                uX,  uY,  uZ, 0.0,
        //               -fX, -fY, -fZ, 0.0,
        //                0.0,  0.0,  0.0, 1.0);
        //var translation = new Matrix4(
        //                1.0, 0.0, 0.0, -eye.x,
        //                0.0, 1.0, 0.0, -eye.y,
        //                0.0, 0.0, 1.0, -eye.z,
        //                0.0, 0.0, 0.0, 1.0);
        //return rotation.multiply(translation);
        if (typeof result === 'undefined') {
            return new Matrix4(
                    sX,   sY,  sZ, t0,
                    uX,   uY,  uZ, t1,
                   -fX,  -fY, -fZ, t2,
                    0.0, 0.0, 0.0, 1.0);
        }
        result[0] = sX;
        result[1] = uX;
        result[2] = -fX;
        result[3] = 0.0;
        result[4] = sY;
        result[5] = uY;
        result[6] = -fY;
        result[7] = 0.0;
        result[8] = sZ;
        result[9] = uZ;
        result[10] = -fZ;
        result[11] = 0.0;
        result[12] = t0;
        result[13] = t1;
        result[14] = t2;
        result[15] = 1.0;
        return result;

    };

     /**
      * Computes a Matrix4 instance representing a perspective transformation matrix.
      * @memberof Matrix4
      *
      * @param {Number} fovY The field of view along the Y axis in radians.
      * @param {Number} aspectRatio The aspect ratio.
      * @param {Number} near The distance to the near plane in meters.
      * @param {Number} far The distance to the far plane in meters.
      * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
      * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
      *
      * @exception {DeveloperError} fovY must be in [0, PI).
      * @exception {DeveloperError} aspectRatio must be greater than zero.
      * @exception {DeveloperError} near must be greater than zero.
      * @exception {DeveloperError} far must be greater than zero.
      */
    Matrix4.computePerspectiveFieldOfView = function(fovY, aspectRatio, near, far, result) {
        if (fovY <= 0.0 || fovY > Math.PI) {
            throw new DeveloperError('fovY must be in [0, PI).');
        }

        if (aspectRatio <= 0.0) {
            throw new DeveloperError('aspectRatio must be greater than zero.');
        }

        if (near <= 0.0) {
            throw new DeveloperError('near must be greater than zero.');
        }

        if (far <= 0.0) {
            throw new DeveloperError('far must be greater than zero.');
        }

        var bottom = Math.tan(fovY * 0.5);

        var column1Row1 = 1.0 / bottom;
        var column0Row0 = column1Row1 / aspectRatio;
        var column2Row2 = (far + near) / (near - far);
        var column3Row2 = (2.0 * far * near) / (near - far);

        if (typeof result === 'undefined') {
            return new Matrix4(column0Row0,         0.0,         0.0,         0.0,
                                       0.0, column1Row1,         0.0,         0.0,
                                       0.0,         0.0, column2Row2, column3Row2,
                                       0.0,         0.0,        -1.0,         0.0);
         }

        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = column2Row2;
        result[11] = -1.0;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = column3Row2;
        result[15] = 0.0;
        return result;
    };

    /**
    * Computes a Matrix4 instance representing an orthographic transformation matrix.
    * @memberof Matrix4
    *
    * @param {Number} left The number of meters to the left of the camera that will be in view.
    * @param {Number} right The number of meters to the right of the camera that will be in view.
    * @param {Number} bottom The number of meters below of the camera that will be in view.
    * @param {Number} top The number of meters above of the camera that will be in view.
    * @param {Number} near The distance to the near plane in meters.
    * @param {Number} far The distance to the far plane in meters.
    * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
    * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
    *
    * @exception {DeveloperError} left is required.
    * @exception {DeveloperError} right is required.
    * @exception {DeveloperError} bottom is required.
    * @exception {DeveloperError} top is required.
    * @exception {DeveloperError} near is required.
    * @exception {DeveloperError} far is required.
    */
    Matrix4.computeOrthographicOffCenter = function(left, right, bottom, top, near, far, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required.');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required.');
        }
        if (typeof bottom === 'undefined') {
            throw new DeveloperError('bottom is required.');
        }
        if (typeof top === 'undefined') {
            throw new DeveloperError('top is required.');
        }
        if (typeof near === 'undefined') {
            throw new DeveloperError('near is required.');
        }
        if (typeof far === 'undefined') {
            throw new DeveloperError('far is required.');
        }

        var a = 1.0 / (right - left);
        var b = 1.0 / (top - bottom);
        var c = 1.0 / (far - near);

        var tx = -(right + left) * a;
        var ty = -(top + bottom) * b;
        var tz = -(far + near) * c;
        a *= 2.0;
        b *= 2.0;
        c *= -2.0;

        if (typeof result === 'undefined') {
            return new Matrix4(  a, 0.0, 0.0, tx,
                               0.0,   b, 0.0, ty,
                               0.0, 0.0,   c, tz,
                               0.0, 0.0, 0.0, 1.0);
        }

        result[0] = a;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = b;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = c;
        result[11] = 0.0;
        result[12] = tx;
        result[13] = ty;
        result[14] = tz;
        result[15] = 1.0;
        return result;
    };

    /**
     * Computes a Matrix4 instance representing an off center perspective transformation.
     * @memberof Matrix4
     *
     * @param {Number} left The number of meters to the left of the camera that will be in view.
     * @param {Number} right The number of meters to the right of the camera that will be in view.
     * @param {Number} bottom The number of meters below of the camera that will be in view.
     * @param {Number} top The number of meters above of the camera that will be in view.
     * @param {Number} near The distance to the near plane in meters.
     * @param {Number} far The distance to the far plane in meters.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     * @exception {DeveloperError} bottom is required.
     * @exception {DeveloperError} top is required.
     * @exception {DeveloperError} near is required.
     * @exception {DeveloperError} far is required.
     */
    Matrix4.computePerspectiveOffCenter = function(left, right, bottom, top, near, far, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required.');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required.');
        }
        if (typeof bottom === 'undefined') {
            throw new DeveloperError('bottom is required.');
        }
        if (typeof top === 'undefined') {
            throw new DeveloperError('top is required.');
        }
        if (typeof near === 'undefined') {
            throw new DeveloperError('near is required.');
        }
        if (typeof far === 'undefined') {
            throw new DeveloperError('far is required.');
        }

        var column0Row0 = 2.0 * near / (right - left);
        var column1Row1 = 2.0 * near / (top - bottom);
        var column2Row0 = (right + left) / (right - left);
        var column2Row1 = (top + bottom) / (top - bottom);
        var column2Row2 = -(far + near) / (far - near);
        var column2Row3 = -1.0;
        var column3Row2 = -2.0 * far * near / (far - near);

        if (typeof result === 'undefined') {
            return new Matrix4(column0Row0, 0.0,         column2Row0, 0.0,
                                       0.0, column1Row1, column2Row1, 0.0,
                                       0.0, 0.0,         column2Row2, column3Row2,
                                       0.0, 0.0,         column2Row3, 0.0);
        }

        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = column2Row3;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = column3Row2;
        result[15] = 0.0;
        return result;
    };

    /**
     * Computes a Matrix4 instance representing an infinite off center perspective transformation.
     * @memberof Matrix4
     *
     * @param {Number} left The number of meters to the left of the camera that will be in view.
     * @param {Number} right The number of meters to the right of the camera that will be in view.
     * @param {Number} bottom The number of meters below of the camera that will be in view.
     * @param {Number} top The number of meters above of the camera that will be in view.
     * @param {Number} near The distance to the near plane in meters.
     * @param {Number} far The distance to the far plane in meters.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     * @exception {DeveloperError} bottom is required.
     * @exception {DeveloperError} top is required.
     * @exception {DeveloperError} near is required.
     */
    Matrix4.computeInfinitePerspectiveOffCenter = function(left, right, bottom, top, near, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required.');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required.');
        }
        if (typeof bottom === 'undefined') {
            throw new DeveloperError('bottom is required.');
        }
        if (typeof top === 'undefined') {
            throw new DeveloperError('top is required.');
        }
        if (typeof near === 'undefined') {
            throw new DeveloperError('near is required.');
        }

        var column0Row0 = 2.0 * near / (right - left);
        var column1Row1 = 2.0 * near / (top - bottom);
        var column2Row0 = (right + left) / (right - left);
        var column2Row1 = (top + bottom) / (top - bottom);
        var column2Row2 = -1.0;
        var column2Row3 = -1.0;
        var column3Row2 = -2.0 * near;

        if (typeof result === 'undefined') {
            return new Matrix4(column0Row0, 0.0,         column2Row0, 0.0,
                                       0.0, column1Row1, column2Row1, 0.0,
                                       0.0, 0.0,         column2Row2, column3Row2,
                                       0.0, 0.0,         column2Row3, 0.0);
        }

        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = column2Row3;
        result[12] = 0.0;
        result[13] = 0.0;
        result[14] = column3Row2;
        result[15] = 0.0;
        return result;
    };

    /**
     * Computes a Matrix4 instance that transforms from normalized device coordinates to window coordinates.
     * @memberof Matrix4
     *
     * @param {Object}[viewport = { x : 0.0, y : 0.0, width : 0.0, height : 0.0 }] The viewport's corners as shown in Example 1.
     * @param {Number}[nearDepthRange = 0.0] The near plane distance in window coordinates.
     * @param {Number}[farDepthRange = 1.0] The far plane distance in window coordinates.
     * @param {Matrix4} [result] The object in which the result will be stored, if undefined a new instance will be created.
     * @returns The modified result parameter, or a new Matrix4 instance if one was not provided.
     *
     * @see czm_viewportTransformation
     * @see Context#getViewport
     *
     * @example
     * // Example 1.  Create viewport transformation using an explicit viewport and depth range.
     * var m = Matrix4.computeViewportTransformation({
     *     x : 0.0,
     *     y : 0.0,
     *     width : 1024.0,
     *     height : 768.0
     * }, 0.0, 1.0);
     *
     * // Example 2.  Create viewport transformation using the context's viewport.
     * var m = Matrix4.computeViewportTransformation(context.getViewport());
     */
    Matrix4.computeViewportTransformation = function(viewport, nearDepthRange, farDepthRange, result) {
        viewport = defaultValue(viewport, defaultValue.EMPTY_OBJECT);
        var x = defaultValue(viewport.x, 0.0);
        var y = defaultValue(viewport.y, 0.0);
        var width = defaultValue(viewport.width, 0.0);
        var height = defaultValue(viewport.height, 0.0);
        nearDepthRange = defaultValue(nearDepthRange, 0.0);
        farDepthRange = defaultValue(farDepthRange, 1.0);

        var halfWidth = width * 0.5;
        var halfHeight = height * 0.5;
        var halfDepth = (farDepthRange - nearDepthRange) * 0.5;

        var column0Row0 = halfWidth;
        var column1Row1 = halfHeight;
        var column2Row2 = halfDepth;
        var column3Row0 = x + halfWidth;
        var column3Row1 = y + halfHeight;
        var column3Row2 = nearDepthRange + halfDepth;
        var column3Row3 = 1.0;

        if (typeof result === 'undefined') {
            return new Matrix4(column0Row0, 0.0,         0.0,         column3Row0,
                               0.0,         column1Row1, 0.0,         column3Row1,
                               0.0,         0.0,         column2Row2, column3Row2,
                               0.0,         0.0,         0.0,         column3Row3);
        }
        result[0] = column0Row0;
        result[1] = 0.0;
        result[2] = 0.0;
        result[3] = 0.0;
        result[4] = 0.0;
        result[5] = column1Row1;
        result[6] = 0.0;
        result[7] = 0.0;
        result[8] = 0.0;
        result[9] = 0.0;
        result[10] = column2Row2;
        result[11] = 0.0;
        result[12] = column3Row0;
        result[13] = column3Row1;
        result[14] = column3Row2;
        result[15] = column3Row3;
        return result;
    };

    /**
     * Computes an Array from the provided Matrix4 instance.
     * The array will be in column-major order.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to use..
     * @param {Array} [result] The Array onto which to store the result.
     * @return {Array} The modified Array parameter or a new Array instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     *
     * @example
     * //create an array from an instance of Matrix4
     * // m = [10.0, 14.0, 18.0, 22.0]
     * //     [11.0, 15.0, 19.0, 23.0]
     * //     [12.0, 16.0, 20.0, 24.0]
     * //     [13.0, 17.0, 21.0, 25.0]
     * var a = Matrix4.toArray(m);
     *
     * // m remains the same
     * //creates a = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.0]
     *
     */
    Matrix4.toArray = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof result === 'undefined') {
            return [matrix[0], matrix[1], matrix[2], matrix[3],
                    matrix[4], matrix[5], matrix[6], matrix[7],
                    matrix[8], matrix[9], matrix[10], matrix[11],
                    matrix[12], matrix[13], matrix[14], matrix[15]];
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = matrix[15];
        return result;
    };

    /**
     * Computes the array index of the element at the provided row and column.
     * @memberof Matrix4
     *
     * @param {Number} row The zero-based index of the row.
     * @param {Number} column The zero-based index of the column.
     * @return {Number} The index of the element at the provided row and column.
     *
     * @exception {DeveloperError} row is required and must be 0, 1, 2, or 3.
     * @exception {DeveloperError} column is required and must be 0, 1, 2, or 3.
     *
     * @example
     * var myMatrix = new Matrix4();
     * var column1Row0Index = Matrix4.getElementIndex(1, 0);
     * var column1Row0 = myMatrix[column1Row0Index]
     * myMatrix[column1Row0Index] = 10.0;
     */
    Matrix4.getElementIndex = function(column, row) {
        if (typeof row !== 'number' || row < 0 || row > 3) {
            throw new DeveloperError('row is required and must be 0, 1, 2, or 3.');
        }
        if (typeof column !== 'number' || column < 0 || column > 3) {
            throw new DeveloperError('column is required and must be 0, 1, 2, or 3.');
        }
        return column * 4 + row;
    };

    /**
     * Retrieves a copy of the matrix column at the provided index as a Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to use.
     * @param {Number} index The zero-based index of the column to retrieve.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     *
     * @example
     * //returns a Cartesian4 instance with values from the specified column
     * // m = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [18.0, 19.0, 20.0, 21.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     * //Example 1: Creates an instance of Cartesian
     * var a = Matrix4.getColumn(m, 2);
     *
     * //Example 2: Sets values for Cartesian instance
     * var a = new Cartesian4();
     * Matrix4.getColumn(m, 2, a);
     *
     * // a.x = 12.0; a.y = 16.0; a.z = 20.0; a.w = 24.0;
     *
     */
    Matrix4.getColumn = function(matrix, index, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required.');
        }

        if (typeof index !== 'number' || index < 0 || index > 3) {
            throw new DeveloperError('index is required and must be 0, 1, 2, or 3.');
        }

        var startIndex = index * 4;
        var x = matrix[startIndex];
        var y = matrix[startIndex + 1];
        var z = matrix[startIndex + 2];
        var w = matrix[startIndex + 3];

        if (typeof result === 'undefined') {
            return new Cartesian4(x, y, z, w);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
    };

    /**
     * Computes a new matrix that replaces the specified column in the provided matrix with the provided Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to use.
     * @param {Number} index The zero-based index of the column to set.
     * @param {Cartesian4} cartesian The Cartesian whose values will be assigned to the specified column.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     *
     * @example
     * //creates a new Matrix4 instance with new column values from the Cartesian4 instance
     * // m = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [18.0, 19.0, 20.0, 21.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     * var a = Matrix4.setColumn(m, 2, new Cartesian4(99.0, 98.0, 97.0, 96.0));
     *
     * // m remains the same
     * // a = [10.0, 11.0, 99.0, 13.0]
     * //     [14.0, 15.0, 98.0, 17.0]
     * //     [18.0, 19.0, 97.0, 21.0]
     * //     [22.0, 23.0, 96.0, 25.0]
     *
     */
    Matrix4.setColumn = function(matrix, index, cartesian, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 3) {
            throw new DeveloperError('index is required and must be 0, 1, 2, or 3.');
        }
        result = Matrix4.clone(matrix, result);
        var startIndex = index * 4;
        result[startIndex] = cartesian.x;
        result[startIndex + 1] = cartesian.y;
        result[startIndex + 2] = cartesian.z;
        result[startIndex + 3] = cartesian.w;
        return result;
    };

    /**
     * Retrieves a copy of the matrix row at the provided index as a Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to use.
     * @param {Number} index The zero-based index of the row to retrieve.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     *
     * @example
     * //returns a Cartesian4 instance with values from the specified column
     * // m = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [18.0, 19.0, 20.0, 21.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     * //Example 1: Returns an instance of Cartesian
     * var a = Matrix4.getRow(m, 2);
     *
     * //Example 1: Sets values for a Cartesian instance
     * var a = new Cartesian4();
     * Matrix4.getRow(m, 2, a);
     *
     * // a.x = 18.0; a.y = 19.0; a.z = 20.0; a.w = 21.0;
     */
    Matrix4.getRow = function(matrix, index, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required.');
        }

        if (typeof index !== 'number' || index < 0 || index > 3) {
            throw new DeveloperError('index is required and must be 0, 1, 2, or 3.');
        }

        var x = matrix[index];
        var y = matrix[index + 4];
        var z = matrix[index + 8];
        var w = matrix[index + 12];

        if (typeof result === 'undefined') {
            return new Cartesian4(x, y, z, w);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
    };

    /**
     * Computes a new matrix that replaces the specified row in the provided matrix with the provided Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to use.
     * @param {Number} index The zero-based index of the row to set.
     * @param {Cartesian4} cartesian The Cartesian whose values will be assigned to the specified row.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     *
     * @example
     * //create a new Matrix4 instance with new row values from the Cartesian4 instance
     * // m = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [18.0, 19.0, 20.0, 21.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     * var a = Matrix4.setRow(m, 2, new Cartesian4(99.0, 98.0, 97.0, 96.0));
     *
     * // m remains the same
     * // a = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [99.0, 98.0, 97.0, 96.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     */
    Matrix4.setRow = function(matrix, index, cartesian, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof index !== 'number' || index < 0 || index > 3) {
            throw new DeveloperError('index is required and must be 0, 1, 2, or 3.');
        }

        result = Matrix4.clone(matrix, result);
        result[index] = cartesian.x;
        result[index + 4] = cartesian.y;
        result[index + 8] = cartesian.z;
        result[index + 12] = cartesian.w;
        return result;
    };

    /**
     * Computes the product of two matrices.
     * @memberof Matrix4
     *
     * @param {Matrix4} left The first matrix.
     * @param {Matrix4} right The second matrix.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Matrix4.multiply = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required');
        }
        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required');
        }

        var left0 = left[0];
        var left1 = left[1];
        var left2 = left[2];
        var left3 = left[3];
        var left4 = left[4];
        var left5 = left[5];
        var left6 = left[6];
        var left7 = left[7];
        var left8 = left[8];
        var left9 = left[9];
        var left10 = left[10];
        var left11 = left[11];
        var left12 = left[12];
        var left13 = left[13];
        var left14 = left[14];
        var left15 = left[15];

        var right0 = right[0];
        var right1 = right[1];
        var right2 = right[2];
        var right3 = right[3];
        var right4 = right[4];
        var right5 = right[5];
        var right6 = right[6];
        var right7 = right[7];
        var right8 = right[8];
        var right9 = right[9];
        var right10 = right[10];
        var right11 = right[11];
        var right12 = right[12];
        var right13 = right[13];
        var right14 = right[14];
        var right15 = right[15];

        var column0Row0 = left0 * right0 + left4 * right1 + left8 * right2 + left12 * right3;
        var column0Row1 = left1 * right0 + left5 * right1 + left9 * right2 + left13 * right3;
        var column0Row2 = left2 * right0 + left6 * right1 + left10 * right2 + left14 * right3;
        var column0Row3 = left3 * right0 + left7 * right1 + left11 * right2 + left15 * right3;

        var column1Row0 = left0 * right4 + left4 * right5 + left8 * right6 + left12 * right7;
        var column1Row1 = left1 * right4 + left5 * right5 + left9 * right6 + left13 * right7;
        var column1Row2 = left2 * right4 + left6 * right5 + left10 * right6 + left14 * right7;
        var column1Row3 = left3 * right4 + left7 * right5 + left11 * right6 + left15 * right7;

        var column2Row0 = left0 * right8 + left4 * right9 + left8 * right10 + left12 * right11;
        var column2Row1 = left1 * right8 + left5 * right9 + left9 * right10 + left13 * right11;
        var column2Row2 = left2 * right8 + left6 * right9 + left10 * right10 + left14 * right11;
        var column2Row3 = left3 * right8 + left7 * right9 + left11 * right10 + left15 * right11;

        var column3Row0 = left0 * right12 + left4 * right13 + left8 * right14 + left12 * right15;
        var column3Row1 = left1 * right12 + left5 * right13 + left9 * right14 + left13 * right15;
        var column3Row2 = left2 * right12 + left6 * right13 + left10 * right14 + left14 * right15;
        var column3Row3 = left3 * right12 + left7 * right13 + left11 * right14 + left15 * right15;

        if (typeof result === 'undefined') {
            return new Matrix4(column0Row0, column1Row0, column2Row0, column3Row0,
                               column0Row1, column1Row1, column2Row1, column3Row1,
                               column0Row2, column1Row2, column2Row2, column3Row2,
                               column0Row3, column1Row3, column2Row3, column3Row3);
        }
        result[0] = column0Row0;
        result[1] = column0Row1;
        result[2] = column0Row2;
        result[3] = column0Row3;
        result[4] = column1Row0;
        result[5] = column1Row1;
        result[6] = column1Row2;
        result[7] = column1Row3;
        result[8] = column2Row0;
        result[9] = column2Row1;
        result[10] = column2Row2;
        result[11] = column2Row3;
        result[12] = column3Row0;
        result[13] = column3Row1;
        result[14] = column3Row2;
        result[15] = column3Row3;
        return result;
    };

    /**
     * Multiplies a transformation matrix (with a bottom row of <code>[0.0, 0.0, 0.0, 1.0]</code>)
     * by an implicit translation matrix defined by a {@link Cartesian3}.  This is an optimization
     * for <code>Matrix4.multiply(m, Matrix4.fromTranslation(position), m);</code> with less allocations and arithmetic operations.
     *
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix on the left-hand side.
     * @param {Cartesian3} translation The translation on the right-hand side.
     * @param {Matrix4} [result] The object onto which to store the result.
     *
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} translation is required.
     *
     * @see Matrix4#fromTranslation
     *
     * @example
     * // Instead of Matrix4.multiply(m, Matrix4.fromTranslation(position), m);
     * Matrix4.multiplyByTranslation(m, position, m);
     */
    Matrix4.multiplyByTranslation = function(matrix, translation, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof translation === 'undefined') {
            throw new DeveloperError('translation is required');
        }

        var x = translation.x;
        var y = translation.y;
        var z = translation.z;

        var tx = (x * matrix[0]) + (y * matrix[4]) + (z * matrix[8]) + matrix[12];
        var ty = (x * matrix[1]) + (y * matrix[5]) + (z * matrix[9]) + matrix[13];
        var tz = (x * matrix[2]) + (y * matrix[6]) + (z * matrix[10]) + matrix[14];

        if (typeof result === 'undefined') {
            return new Matrix4(matrix[0], matrix[4], matrix[8], tx,
                               matrix[1], matrix[5], matrix[9], ty,
                               matrix[2], matrix[6], matrix[10], tz,
                               matrix[3], matrix[7], matrix[11], matrix[15]);
        }

        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[3];
        result[4] = matrix[4];
        result[5] = matrix[5];
        result[6] = matrix[6];
        result[7] = matrix[7];
        result[8] = matrix[8];
        result[9] = matrix[9];
        result[10] = matrix[10];
        result[11] = matrix[11];
        result[12] = tx;
        result[13] = ty;
        result[14] = tz;
        result[15] = matrix[15];
        return result;
    };

    /**
     * Multiplies a transformation matrix (with a bottom row of <code>[0.0, 0.0, 0.0, 1.0]</code>)
     * by an implicit uniform scale matrix.  This is an optimization
     * for <code>Matrix4.multiply(m, Matrix4.fromScale(scale), m);</code> with less allocations and arithmetic operations.
     *
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix on the left-hand side.
     * @param {Number} scale The uniform scale on the right-hand side.
     * @param {Matrix4} [result] The object onto which to store the result.
     *
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} scale is required.
     *
     * @see Matrix4#fromUniformScale
     *
     * @example
     * // Instead of Matrix4.multiply(m, Matrix4.fromUniformScale(scale), m);
     * Matrix4.multiplyByUniformScale(m, scale, m);
     */
    Matrix4.multiplyByUniformScale = function(matrix, scale, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof scale !== 'number') {
            throw new DeveloperError('scale is required');
        }

        if (scale === 1.0) {
            return Matrix4.clone(matrix, result);
        }

        if (typeof result === 'undefined') {
            return new Matrix4(
                scale * matrix[0], scale * matrix[4], scale * matrix[8],  matrix[12],
                scale * matrix[1], scale * matrix[5], scale * matrix[9],  matrix[13],
                scale * matrix[2], scale * matrix[6], scale * matrix[10], matrix[14],
                0.0,               0.0,               0.0,                1.0);
        }

        result[0] = scale * matrix[0];
        result[1] = scale * matrix[1];
        result[2] = scale * matrix[2];
        result[3] = 0.0;
        result[4] = scale * matrix[4];
        result[5] = scale * matrix[5];
        result[6] = scale * matrix[6];
        result[7] = 0.0;
        result[8] = scale * matrix[8];
        result[9] = scale * matrix[9];
        result[10] = scale * matrix[10];
        result[11] = 0.0;
        result[12] = matrix[12];
        result[13] = matrix[13];
        result[14] = matrix[14];
        result[15] = 1.0;
        return result;
    };

    /**
     * Computes the product of a matrix and a column vector.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix.
     * @param {Cartesian4} cartesian The vector.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} cartesian is required.
     */
    Matrix4.multiplyByVector = function(matrix, cartesian, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }

        var vX = cartesian.x;
        var vY = cartesian.y;
        var vZ = cartesian.z;
        var vW = cartesian.w;

        var x = matrix[0] * vX + matrix[4] * vY + matrix[8] * vZ + matrix[12] * vW;
        var y = matrix[1] * vX + matrix[5] * vY + matrix[9] * vZ + matrix[13] * vW;
        var z = matrix[2] * vX + matrix[6] * vY + matrix[10] * vZ + matrix[14] * vW;
        var w = matrix[3] * vX + matrix[7] * vY + matrix[11] * vZ + matrix[15] * vW;

        if (typeof result === 'undefined') {
            return new Cartesian4(x, y, z, w);
        }
        result.x = x;
        result.y = y;
        result.z = z;
        result.w = w;
        return result;
    };

    var scratchPoint = new Cartesian4(0.0, 0.0, 0.0, 1.0);

    /**
     * Computes the product of a matrix and a {@link Cartesian3}.  This is equivalent to calling {@link Matrix4.multiplyByVector}
     * with a {@link Cartesian4} with a <code>w</code> component of one.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix.
     * @param {Cartesian3} cartesian The point.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} matrix is required.
     *
     * @example
     * Cartesian3 p = new Cartesian3(1.0, 2.0, 3.0);
     * Matrix4.multiplyByPoint(matrix, p, result);
     * // A shortcut for
     * //   Cartesian3 p = ...
     * //   Matrix4.multiplyByVector(matrix, new Cartesian4(p.x, p.y, p.z, 1.0), result);
     */
    Matrix4.multiplyByPoint = function(matrix, cartesian, result) {
        if (typeof cartesian === 'undefined') {
            throw new DeveloperError('cartesian is required');
        }

        scratchPoint.x = cartesian.x;
        scratchPoint.y = cartesian.y;
        scratchPoint.z = cartesian.z;
        // scratchPoint.w is one.  See above.

        return Matrix4.multiplyByVector(matrix, scratchPoint, result);
    };

    /**
     * Computes the product of a matrix and a scalar.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix.
     * @param {Number} scalar The number to multiply by.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     *
     * @example
     * //create a Matrix4 instance which is a scaled version of the supplied Matrix4
     * // m = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [18.0, 19.0, 20.0, 21.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     * var a = Matrix4.multiplyByScalar(m, -2);
     *
     * // m remains the same
     * // a = [-20.0, -22.0, -24.0, -26.0]
     * //     [-28.0, -30.0, -32.0, -34.0]
     * //     [-36.0, -38.0, -40.0, -42.0]
     * //     [-44.0, -46.0, -48.0, -50.0]
     *
     */
    Matrix4.multiplyByScalar = function(matrix, scalar, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number');
        }

        if (typeof result === 'undefined') {
            return new Matrix4(matrix[0] * scalar, matrix[4] * scalar, matrix[8] * scalar, matrix[12] * scalar,
                               matrix[1] * scalar, matrix[5] * scalar, matrix[9] * scalar, matrix[13] * scalar,
                               matrix[2] * scalar, matrix[6] * scalar, matrix[10] * scalar, matrix[14] * scalar,
                               matrix[3] * scalar, matrix[7] * scalar, matrix[11] * scalar, matrix[15] * scalar);
        }
        result[0] = matrix[0] * scalar;
        result[1] = matrix[1] * scalar;
        result[2] = matrix[2] * scalar;
        result[3] = matrix[3] * scalar;
        result[4] = matrix[4] * scalar;
        result[5] = matrix[5] * scalar;
        result[6] = matrix[6] * scalar;
        result[7] = matrix[7] * scalar;
        result[8] = matrix[8] * scalar;
        result[9] = matrix[9] * scalar;
        result[10] = matrix[10] * scalar;
        result[11] = matrix[11] * scalar;
        result[12] = matrix[12] * scalar;
        result[13] = matrix[13] * scalar;
        result[14] = matrix[14] * scalar;
        result[15] = matrix[15] * scalar;
        return result;
    };

    /**
     * Computes a negated copy of the provided matrix.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to negate.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     *
     * @example
     * //create a new Matrix4 instance which is a negation of a Matrix4
     * // m = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [18.0, 19.0, 20.0, 21.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     * var a = Matrix4.negate(m);
     *
     * // m remains the same
     * // a = [-10.0, -11.0, -12.0, -13.0]
     * //     [-14.0, -15.0, -16.0, -17.0]
     * //     [-18.0, -19.0, -20.0, -21.0]
     * //     [-22.0, -23.0, -24.0, -25.0]
     *
     */
    Matrix4.negate = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }

        if (typeof result === 'undefined') {
            return new Matrix4(-matrix[0], -matrix[4], -matrix[8], -matrix[12],
                               -matrix[1], -matrix[5], -matrix[9], -matrix[13],
                               -matrix[2], -matrix[6], -matrix[10], -matrix[14],
                               -matrix[3], -matrix[7], -matrix[11], -matrix[15]);
        }
        result[0] = -matrix[0];
        result[1] = -matrix[1];
        result[2] = -matrix[2];
        result[3] = -matrix[3];
        result[4] = -matrix[4];
        result[5] = -matrix[5];
        result[6] = -matrix[6];
        result[7] = -matrix[7];
        result[8] = -matrix[8];
        result[9] = -matrix[9];
        result[10] = -matrix[10];
        result[11] = -matrix[11];
        result[12] = -matrix[12];
        result[13] = -matrix[13];
        result[14] = -matrix[14];
        result[15] = -matrix[15];
        return result;
    };

    /**
     * Computes the transpose of the provided matrix.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to transpose.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     *
     * @example
     * //returns transpose of a Matrix4
     * // m = [10.0, 11.0, 12.0, 13.0]
     * //     [14.0, 15.0, 16.0, 17.0]
     * //     [18.0, 19.0, 20.0, 21.0]
     * //     [22.0, 23.0, 24.0, 25.0]
     *
     * var a = Matrix4.negate(m);
     *
     * // m remains the same
     * // a = [10.0, 14.0, 18.0, 22.0]
     * //     [11.0, 15.0, 19.0, 23.0]
     * //     [12.0, 16.0, 20.0, 24.0]
     * //     [13.0, 17.0, 21.0, 25.0]
     *
     */
    Matrix4.transpose = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof result === 'undefined') {
            return new Matrix4(matrix[0], matrix[1], matrix[2], matrix[3],
                               matrix[4], matrix[5], matrix[6], matrix[7],
                               matrix[8], matrix[9], matrix[10], matrix[11],
                               matrix[12], matrix[13], matrix[14], matrix[15]);
        }

        var matrix1 = matrix[1];
        var matrix2 = matrix[2];
        var matrix3 = matrix[3];
        var matrix6 = matrix[6];
        var matrix7 = matrix[7];
        var matrix11 = matrix[11];

        result[0] = matrix[0];
        result[1] = matrix[4];
        result[2] = matrix[8];
        result[3] = matrix[12];
        result[4] = matrix1;
        result[5] = matrix[5];
        result[6] = matrix[9];
        result[7] = matrix[13];
        result[8] = matrix2;
        result[9] = matrix6;
        result[10] = matrix[10];
        result[11] = matrix[14];
        result[12] = matrix3;
        result[13] = matrix7;
        result[14] = matrix11;
        result[15] = matrix[15];
        return result;
    };

    /**
     * Compares the provided matrices componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Matrix4
     *
     * @param {Matrix4} [left] The first matrix.
     * @param {Matrix4} [right] The second matrix.
     * @return {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     *
     * @example
     * //compares two Matrix4 instances
     *
     * // a = [10.0, 14.0, 18.0, 22.0]
     * //     [11.0, 15.0, 19.0, 23.0]
     * //     [12.0, 16.0, 20.0, 24.0]
     * //     [13.0, 17.0, 21.0, 25.0]
     *
     * // b = [10.0, 14.0, 18.0, 22.0]
     * //     [11.0, 15.0, 19.0, 23.0]
     * //     [12.0, 16.0, 20.0, 24.0]
     * //     [13.0, 17.0, 21.0, 25.0]
     *
     * if(Matrix4.equals(a,b)) {
     *      console.log("Both matrices are equal");
     * } else {
     *      console.log("They are not equal");
     * }
     *
     * //Prints "Both matrices are equal" on the console
     *
     */
    Matrix4.equals = function(left, right) {
        return (left === right) ||
               (typeof left !== 'undefined' &&
                typeof right !== 'undefined' &&
                left[0] === right[0] &&
                left[1] === right[1] &&
                left[2] === right[2] &&
                left[3] === right[3] &&
                left[4] === right[4] &&
                left[5] === right[5] &&
                left[6] === right[6] &&
                left[7] === right[7] &&
                left[8] === right[8] &&
                left[9] === right[9] &&
                left[10] === right[10] &&
                left[11] === right[11] &&
                left[12] === right[12] &&
                left[13] === right[13] &&
                left[14] === right[14] &&
                left[15] === right[15]);
    };

    /**
     * Compares the provided matrices componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Matrix4
     *
     * @param {Matrix4} [left] The first matrix.
     * @param {Matrix4} [right] The second matrix.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     *
     * @example
     * //compares two Matrix4 instances
     *
     * // a = [10.5, 14.5, 18.5, 22.5]
     * //     [11.5, 15.5, 19.5, 23.5]
     * //     [12.5, 16.5, 20.5, 24.5]
     * //     [13.5, 17.5, 21.5, 25.5]
     *
     * // b = [10.0, 14.0, 18.0, 22.0]
     * //     [11.0, 15.0, 19.0, 23.0]
     * //     [12.0, 16.0, 20.0, 24.0]
     * //     [13.0, 17.0, 21.0, 25.0]
     *
     * if(Matrix4.equalsEpsilon(a,b,0.1)){
     *      console.log("Difference between both the matrices is less than 0.1");
     * } else {
     *      console.log("Difference between both the matrices is not less than 0.1");
     * }
     *
     * //Prints "Difference between both the matrices is not less than 0.1" on the console
     *
     */
    Matrix4.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number');
        }

        return (left === right) ||
                (typeof left !== 'undefined' &&
                typeof right !== 'undefined' &&
                Math.abs(left[0] - right[0]) <= epsilon &&
                Math.abs(left[1] - right[1]) <= epsilon &&
                Math.abs(left[2] - right[2]) <= epsilon &&
                Math.abs(left[3] - right[3]) <= epsilon &&
                Math.abs(left[4] - right[4]) <= epsilon &&
                Math.abs(left[5] - right[5]) <= epsilon &&
                Math.abs(left[6] - right[6]) <= epsilon &&
                Math.abs(left[7] - right[7]) <= epsilon &&
                Math.abs(left[8] - right[8]) <= epsilon &&
                Math.abs(left[9] - right[9]) <= epsilon &&
                Math.abs(left[10] - right[10]) <= epsilon &&
                Math.abs(left[11] - right[11]) <= epsilon &&
                Math.abs(left[12] - right[12]) <= epsilon &&
                Math.abs(left[13] - right[13]) <= epsilon &&
                Math.abs(left[14] - right[14]) <= epsilon &&
                Math.abs(left[15] - right[15]) <= epsilon);
    };

    /**
     * Gets the translation portion of the provided matrix, assuming the matrix is a affine transformation matrix.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to use.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     *
     * @see Cartesian3
     */
    Matrix4.getTranslation = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof result === 'undefined') {
            return new Cartesian3(matrix[12], matrix[13], matrix[14]);
        }
        result.x = matrix[12];
        result.y = matrix[13];
        result.z = matrix[14];
        return result;
    };

    /**
     * Gets the upper left 3x3 rotation matrix of the provided matrix, assuming the matrix is a affine transformation matrix.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to use.
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     *
     * @see Matrix3
     *
     * @example
     * // returns a Matrix3 instance from a Matrix4 instance
     *
     * // m = [10.0, 14.0, 18.0, 22.0]
     * //     [11.0, 15.0, 19.0, 23.0]
     * //     [12.0, 16.0, 20.0, 24.0]
     * //     [13.0, 17.0, 21.0, 25.0]
     *
     * var b = new Matrix3();
     * Matrix4.getRotation(m,b);
     *
     * // b = [10.0, 14.0, 18.0]
     * //     [11.0, 15.0, 19.0]
     * //     [12.0, 16.0, 20.0]
     *
     */
    Matrix4.getRotation = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }
        if (typeof result === 'undefined') {
            return new Matrix3(matrix[0], matrix[4], matrix[8],
                               matrix[1], matrix[5], matrix[9],
                               matrix[2], matrix[6], matrix[10]);
        }
        result[0] = matrix[0];
        result[1] = matrix[1];
        result[2] = matrix[2];
        result[3] = matrix[4];
        result[4] = matrix[5];
        result[5] = matrix[6];
        result[6] = matrix[8];
        result[7] = matrix[9];
        result[8] = matrix[10];
        return result;
    };

     /**
      * Computes the inverse of the provided matrix using Cramers Rule.
      * If the determinant is zero, the matrix can not be inverted, and an exception is thrown.
      * If the matrix is an affine transformation matrix, it is more efficient
      * to invert it with {@link #inverseTransformation}.
      * @memberof Matrix4
      *
      * @param {Matrix4} matrix The matrix to invert.
      * @param {Matrix4} [result] The object onto which to store the result.
      * @return {Matrix4} The modified result parameter or a new Cartesian3 instance if one was not provided.
      *
      * @exception {DeveloperError} matrix is required.
      * @exception {RuntimeError} matrix is not invertible because its determinate is zero.
      */
    Matrix4.inverse = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }

        //
        // Ported from:
        //   ftp://download.intel.com/design/PentiumIII/sml/24504301.pdf
        //
        var src0 = matrix[0];
        var src1 = matrix[4];
        var src2 = matrix[8];
        var src3 = matrix[12];
        var src4 = matrix[1];
        var src5 = matrix[5];
        var src6 = matrix[9];
        var src7 = matrix[13];
        var src8 = matrix[2];
        var src9 = matrix[6];
        var src10 = matrix[10];
        var src11 = matrix[14];
        var src12 = matrix[3];
        var src13 = matrix[7];
        var src14 = matrix[11];
        var src15 = matrix[15];

        // calculate pairs for first 8 elements (cofactors)
        var tmp0 = src10 * src15;
        var tmp1 = src11 * src14;
        var tmp2 = src9 * src15;
        var tmp3 = src11 * src13;
        var tmp4 = src9 * src14;
        var tmp5 = src10 * src13;
        var tmp6 = src8 * src15;
        var tmp7 = src11 * src12;
        var tmp8 = src8 * src14;
        var tmp9 = src10 * src12;
        var tmp10 = src8 * src13;
        var tmp11 = src9 * src12;

        // calculate first 8 elements (cofactors)
        var dst0 = (tmp0 * src5 + tmp3 * src6 + tmp4 * src7) - (tmp1 * src5 + tmp2 * src6 + tmp5 * src7);
        var dst1 = (tmp1 * src4 + tmp6 * src6 + tmp9 * src7) - (tmp0 * src4 + tmp7 * src6 + tmp8 * src7);
        var dst2 = (tmp2 * src4 + tmp7 * src5 + tmp10 * src7) - (tmp3 * src4 + tmp6 * src5 + tmp11 * src7);
        var dst3 = (tmp5 * src4 + tmp8 * src5 + tmp11 * src6) - (tmp4 * src4 + tmp9 * src5 + tmp10 * src6);
        var dst4 = (tmp1 * src1 + tmp2 * src2 + tmp5 * src3) - (tmp0 * src1 + tmp3 * src2 + tmp4 * src3);
        var dst5 = (tmp0 * src0 + tmp7 * src2 + tmp8 * src3) - (tmp1 * src0 + tmp6 * src2 + tmp9 * src3);
        var dst6 = (tmp3 * src0 + tmp6 * src1 + tmp11 * src3) - (tmp2 * src0 + tmp7 * src1 + tmp10 * src3);
        var dst7 = (tmp4 * src0 + tmp9 * src1 + tmp10 * src2) - (tmp5 * src0 + tmp8 * src1 + tmp11 * src2);

        // calculate pairs for second 8 elements (cofactors)
        tmp0 = src2 * src7;
        tmp1 = src3 * src6;
        tmp2 = src1 * src7;
        tmp3 = src3 * src5;
        tmp4 = src1 * src6;
        tmp5 = src2 * src5;
        tmp6 = src0 * src7;
        tmp7 = src3 * src4;
        tmp8 = src0 * src6;
        tmp9 = src2 * src4;
        tmp10 = src0 * src5;
        tmp11 = src1 * src4;

        // calculate second 8 elements (cofactors)
        var dst8 = (tmp0 * src13 + tmp3 * src14 + tmp4 * src15) - (tmp1 * src13 + tmp2 * src14 + tmp5 * src15);
        var dst9 = (tmp1 * src12 + tmp6 * src14 + tmp9 * src15) - (tmp0 * src12 + tmp7 * src14 + tmp8 * src15);
        var dst10 = (tmp2 * src12 + tmp7 * src13 + tmp10 * src15) - (tmp3 * src12 + tmp6 * src13 + tmp11 * src15);
        var dst11 = (tmp5 * src12 + tmp8 * src13 + tmp11 * src14) - (tmp4 * src12 + tmp9 * src13 + tmp10 * src14);
        var dst12 = (tmp2 * src10 + tmp5 * src11 + tmp1 * src9) - (tmp4 * src11 + tmp0 * src9 + tmp3 * src10);
        var dst13 = (tmp8 * src11 + tmp0 * src8 + tmp7 * src10) - (tmp6 * src10 + tmp9 * src11 + tmp1 * src8);
        var dst14 = (tmp6 * src9 + tmp11 * src11 + tmp3 * src8) - (tmp10 * src11 + tmp2 * src8 + tmp7 * src9);
        var dst15 = (tmp10 * src10 + tmp4 * src8 + tmp9 * src9) - (tmp8 * src9 + tmp11 * src10 + tmp5 * src8);

        // calculate determinant
        var det = src0 * dst0 + src1 * dst1 + src2 * dst2 + src3 * dst3;

        if (Math.abs(det) < CesiumMath.EPSILON20) {
            throw new RuntimeError('matrix is not invertible because its determinate is zero.');
        }

        // calculate matrix inverse
        det = 1.0 / det;
        if (typeof result === 'undefined') {
            return new Matrix4(dst0 * det, dst4 * det, dst8 * det, dst12 * det,
                               dst1 * det, dst5 * det, dst9 * det, dst13 * det,
                               dst2 * det, dst6 * det, dst10 * det, dst14 * det,
                               dst3 * det, dst7 * det, dst11 * det, dst15 * det);
        }

        result[0] = dst0 * det;
        result[1] = dst1 * det;
        result[2] = dst2 * det;
        result[3] = dst3 * det;
        result[4] = dst4 * det;
        result[5] = dst5 * det;
        result[6] = dst6 * det;
        result[7] = dst7 * det;
        result[8] = dst8 * det;
        result[9] = dst9 * det;
        result[10] = dst10 * det;
        result[11] = dst11 * det;
        result[12] = dst12 * det;
        result[13] = dst13 * det;
        result[14] = dst14 * det;
        result[15] = dst15 * det;
        return result;
    };

    /**
     * Computes the inverse of the provided matrix assuming it is
     * an affine transformation matrix, where the upper left 3x3 elements
     * are a rotation matrix, and the upper three elements in the fourth
     * column are the translation.  The bottom row is assumed to be [0, 0, 0, 1].
     * The matrix is not verified to be in the proper form.
     * This method is faster than computing the inverse for a general 4x4
     * matrix using {@link #inverse}.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to invert.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix4.inverseTransformation = function(matrix, result) {
        if (typeof matrix === 'undefined') {
            throw new DeveloperError('matrix is required');
        }

        //This function is an optimized version of the below 4 lines.
        //var rT = Matrix3.transpose(Matrix4.getRotation(matrix));
        //var rTN = Matrix3.negate(rT);
        //var rTT = Matrix3.multiplyByVector(rTN, Matrix4.getTranslation(matrix));
        //return Matrix4.fromRotationTranslation(rT, rTT, result);

        var matrix0 = matrix[0];
        var matrix1 = matrix[1];
        var matrix2 = matrix[2];
        var matrix4 = matrix[4];
        var matrix5 = matrix[5];
        var matrix6 = matrix[6];
        var matrix8 = matrix[8];
        var matrix9 = matrix[9];
        var matrix10 = matrix[10];

        var vX = matrix[12];
        var vY = matrix[13];
        var vZ = matrix[14];

        var x = -matrix0 * vX - matrix1 * vY - matrix2 * vZ;
        var y = -matrix4 * vX - matrix5 * vY - matrix6 * vZ;
        var z = -matrix8 * vX - matrix9 * vY - matrix10 * vZ;

        if (typeof result === 'undefined') {
            return new Matrix4(matrix0, matrix1, matrix2,  x,
                               matrix4, matrix5, matrix6,  y,
                               matrix8, matrix9, matrix10, z,
                               0.0,         0.0,      0.0, 1.0);
        }
        result[0] = matrix0;
        result[1] = matrix4;
        result[2] = matrix8;
        result[3] = 0.0;
        result[4] = matrix1;
        result[5] = matrix5;
        result[6] = matrix9;
        result[7] = 0.0;
        result[8] = matrix2;
        result[9] = matrix6;
        result[10] = matrix10;
        result[11] = 0.0;
        result[12] = x;
        result[13] = y;
        result[14] = z;
        result[15] = 1.0;
        return result;
    };

    /**
     * An immutable Matrix4 instance initialized to the identity matrix.
     * @memberof Matrix4
     */
    Matrix4.IDENTITY = freezeObject(new Matrix4(1.0, 0.0, 0.0, 0.0,
                                                0.0, 1.0, 0.0, 0.0,
                                                0.0, 0.0, 1.0, 0.0,
                                                0.0, 0.0, 0.0, 1.0));

    /**
     * The index into Matrix4 for column 0, row 0.
     * @memberof Matrix4
     */
    Matrix4.COLUMN0ROW0 = 0;

    /**
     * The index into Matrix4 for column 0, row 1.
     * @memberof Matrix4
     */
    Matrix4.COLUMN0ROW1 = 1;

    /**
     * The index into Matrix4 for column 0, row 2.
     * @memberof Matrix4
     */
    Matrix4.COLUMN0ROW2 = 2;

    /**
     * The index into Matrix4 for column 0, row 3.
     * @memberof Matrix4
     */
    Matrix4.COLUMN0ROW3 = 3;

    /**
     * The index into Matrix4 for column 1, row 0.
     * @memberof Matrix4
     */
    Matrix4.COLUMN1ROW0 = 4;

    /**
     * The index into Matrix4 for column 1, row 1.
     * @memberof Matrix4
     */
    Matrix4.COLUMN1ROW1 = 5;

    /**
     * The index into Matrix4 for column 1, row 2.
     * @memberof Matrix4
     */
    Matrix4.COLUMN1ROW2 = 6;

    /**
     * The index into Matrix4 for column 1, row 3.
     * @memberof Matrix4
     */
    Matrix4.COLUMN1ROW3 = 7;

    /**
     * The index into Matrix4 for column 2, row 0.
     * @memberof Matrix4
     */
    Matrix4.COLUMN2ROW0 = 8;

    /**
     * The index into Matrix4 for column 2, row 1.
     * @memberof Matrix4
     */
    Matrix4.COLUMN2ROW1 = 9;

    /**
     * The index into Matrix4 for column 2, row 2.
     * @memberof Matrix4
     */
    Matrix4.COLUMN2ROW2 = 10;

    /**
     * The index into Matrix4 for column 2, row 3.
     * @memberof Matrix4
     */
    Matrix4.COLUMN2ROW3 = 11;

    /**
     * The index into Matrix4 for column 3, row 0.
     * @memberof Matrix4
     */
    Matrix4.COLUMN3ROW0 = 12;

    /**
     * The index into Matrix4 for column 3, row 1.
     * @memberof Matrix4
     */
    Matrix4.COLUMN3ROW1 = 13;

    /**
     * The index into Matrix4 for column 3, row 2.
     * @memberof Matrix4
     */
    Matrix4.COLUMN3ROW2 = 14;

    /**
     * The index into Matrix4 for column 3, row 3.
     * @memberof Matrix4
     */
    Matrix4.COLUMN3ROW3 = 15;

    /**
     * Duplicates the provided Matrix4 instance.
     * @memberof Matrix4
     *
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     */
    Matrix4.prototype.clone = function(result) {
        return Matrix4.clone(this, result);
    };

    /**
     * Computes an Array from this Matrix4 instance.
     * @memberof Matrix4
     *
     * @param {Array} [result] The Array onto which to store the result.
     * @return {Array} The modified Array parameter or a new Array instance if one was not provided.
     */
    Matrix4.prototype.toArray = function(result) {
        return Matrix4.toArray(this, result);
    };

    /**
     * Retrieves a copy of the matrix column at the provided index as a Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Number} index The zero-based index of the column to retrieve.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     */
    Matrix4.prototype.getColumn = function(index, result) {
        return Matrix4.getColumn(this, index, result);
    };

    /**
     * Computes a new matrix that replaces the specified column in this matrix with the provided Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Number} index The zero-based index of the column to set.
     * @param {Cartesian4} cartesian The Cartesian whose values will be assigned to the specified column.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     */
    Matrix4.prototype.setColumn = function(index, cartesian, result) {
        return Matrix4.setColumn(this, index, cartesian, result);
    };

    /**
     * Retrieves a copy of the matrix row at the provided index as a Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Number} index The zero-based index of the row to retrieve.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     */
    Matrix4.prototype.getRow = function(index, result) {
        return Matrix4.getRow(this, index, result);
    };

    /**
     * Computes a new matrix that replaces the specified row in this matrix with the provided Cartesian4 instance.
     * @memberof Matrix4
     *
     * @param {Number} index The zero-based index of the row to set.
     * @param {Cartesian4} cartesian The Cartesian whose values will be assigned to the specified row.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} index is required and must be 0, 1, 2, or 3.
     *
     * @see Cartesian4
     */
    Matrix4.prototype.setRow = function(index, cartesian, result) {
        return Matrix4.setRow(this, index, cartesian, result);
    };

    /**
     * Computes the product of this matrix and the provided matrix.
     * @memberof Matrix4
     *
     * @param {Matrix4} right The right hand side matrix.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} right is required.
     */
    Matrix4.prototype.multiply = function(right, result) {
        return Matrix4.multiply(this, right, result);
    };

    /**
     * Multiplies this matrix, assuming it is a transformation matrix (with a bottom row of
     * <code>[0.0, 0.0, 0.0, 1.0]</code>), by an implicit translation matrix defined by a {@link Cartesian3}.
     *
     * @memberof Matrix4
     *
     * @param {Cartesian3} translation The translation on the right-hand side of the multiplication.
     * @param {Matrix4} [result] The object onto which to store the result.
     *
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} translation is required.
     */
    Matrix4.prototype.multiplyByTranslation = function(translation, result) {
        return Matrix4.multiplyByTranslation(this, translation, result);
    };

    /**
     * Multiplies this matrix, assuming it is a transformation matrix (with a bottom row of
     * <code>[0.0, 0.0, 0.0, 1.0]</code>), by an implicit uniform scale matrix.
     *
     * @memberof Matrix4
     *
     * @param {Number} scale The scale on the right-hand side of the multiplication.
     * @param {Matrix4} [result] The object onto which to store the result.
     *
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} scale is required.
     */
    Matrix4.prototype.multiplyByUniformScale = function(scale, result) {
        return Matrix4.multiplyByUniformScale(this, scale, result);
    };

    /**
     * Computes the product of this matrix and a column vector.
     * @memberof Matrix4
     *
     * @param {Cartesian4} cartesian The vector.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Matrix4.prototype.multiplyByVector = function(cartesian, result) {
        return Matrix4.multiplyByVector(this, cartesian, result);
    };

    /**
     * Computes the product of a matrix and a {@link Cartesian3}.  This is equivalent to calling {@link Matrix4#multiplyByVector}
     * with a {@link Cartesian4} with a <code>w</code> component of one.
     * @memberof Matrix4
     *
     * @param {Cartesian3} cartesian The point.
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @return {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Matrix4.prototype.multiplyByPoint = function(cartesian, result) {
        return Matrix4.multiplyByPoint(this, cartesian, result);
    };

    /**
     * Computes the product of this matrix and a scalar.
     * @memberof Matrix4
     *
     * @param {Number} scalar The number to multiply by.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Matrix4.prototype.multiplyByScalar = function(scalar, result) {
        return Matrix4.multiplyByScalar(this, scalar, result);
    };
    /**
     * Computes a negated copy of this matrix.
     * @memberof Matrix4
     *
     * @param {Matrix4} matrix The matrix to negate.
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     *
     * @exception {DeveloperError} matrix is required.
     */
    Matrix4.prototype.negate = function(result) {
        return Matrix4.negate(this, result);
    };

    /**
     * Computes the transpose of this matrix.
     * @memberof Matrix4
     *
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Matrix4 instance if one was not provided.
     */
    Matrix4.prototype.transpose = function(result) {
        return Matrix4.transpose(this, result);
    };

    /**
     * Compares this matrix to the provided matrix componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Matrix4
     *
     * @param {Matrix4} [right] The right hand side matrix.
     * @return {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    Matrix4.prototype.equals = function(right) {
        return Matrix4.equals(this, right);
    };

    /**
     * Compares this matrix to the provided matrix componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Matrix4
     *
     * @param {Matrix4} [right] The right hand side matrix.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Matrix4.prototype.equalsEpsilon = function(right, epsilon) {
        return Matrix4.equalsEpsilon(this, right, epsilon);
    };

    /**
     * Computes a string representing this Matrix with each row being
     * on a separate line and in the format '(column0, column1, column2, column3)'.
     * @memberof Matrix4
     *
     * @return {String} A string representing the provided Matrix with each row being on a separate line and in the format '(column0, column1, column2, column3)'.
     */
    Matrix4.prototype.toString = function() {
        return '(' + this[0] + ', ' + this[4] + ', ' + this[8] + ', ' + this[12] +')\n' +
               '(' + this[1] + ', ' + this[5] + ', ' + this[9] + ', ' + this[13] +')\n' +
               '(' + this[2] + ', ' + this[6] + ', ' + this[10] + ', ' + this[14] +')\n' +
               '(' + this[3] + ', ' + this[7] + ', ' + this[11] + ', ' + this[15] +')';
    };

    /**
     * Gets the translation portion of this matrix, assuming the matrix is a affine transformation matrix.
     * @memberof Matrix4
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @return {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @see Cartesian3
     */
    Matrix4.prototype.getTranslation = function(result) {
        return Matrix4.getTranslation(this, result);
    };

    /**
     * Gets the upper left 3x3 rotation matrix of this matrix, assuming the matrix is a affine transformation matrix.
     * @memberof Matrix4
     *
     * @param {Matrix3} [result] The object onto which to store the result.
     * @return {Matrix3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @see Matrix3
     */
    Matrix4.prototype.getRotation = function(result) {
        return Matrix4.getRotation(this, result);
    };

    /**
     * Computes the inverse of this matrix using Cramers Rule.
     * If the determinant is zero, the matrix can not be inverted, and an exception is thrown.
     * If the matrix is an affine transformation matrix, it is more efficient
     * to invert it with {@link #inverseTransformation}.
     * @memberof Matrix4
     *
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {RuntimeError} matrix is not invertible because its determinate is zero.
     */
    Matrix4.prototype.inverse = function(result) {
        return Matrix4.inverse(this, result);
    };

    /**
     * Computes the inverse of this matrix assuming it is
     * an affine transformation matrix, where the upper left 3x3 elements
     * are a rotation matrix, and the upper three elements in the fourth
     * column are the translation.  The bottom row is assumed to be [0, 0, 0, 1].
     * The matrix is not verified to be in the proper form.
     * This method is faster than computing the inverse for a general 4x4
     * matrix using {@link #inverse}.
     * @memberof Matrix4
     *
     * @param {Matrix4} [result] The object onto which to store the result.
     * @return {Matrix4} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Matrix4.prototype.inverseTransformation = function(result) {
        return Matrix4.inverseTransformation(this, result);
    };

    return Matrix4;
});

/*global define*/
define('Core/BoundingSphere',[
        './defaultValue',
        './DeveloperError',
        './Cartesian3',
        './Cartesian4',
        './Cartographic',
        './Ellipsoid',
        './GeographicProjection',
        './Intersect',
        './Interval',
        './Matrix4'
    ], function(
        defaultValue,
        DeveloperError,
        Cartesian3,
        Cartesian4,
        Cartographic,
        Ellipsoid,
        GeographicProjection,
        Intersect,
        Interval,
        Matrix4) {
    

    /**
     * A bounding sphere with a center and a radius.
     * @alias BoundingSphere
     * @constructor
     *
     * @param {Cartesian3} [center=Cartesian3.ZERO] The center of the bounding sphere.
     * @param {Number} [radius=0.0] The radius of the bounding sphere.
     *
     * @see AxisAlignedBoundingBox
     * @see BoundingRectangle
     */
    var BoundingSphere = function(center, radius) {
        /**
         * The center point of the sphere.
         * @type {Cartesian3}
         */
        this.center = Cartesian3.clone(defaultValue(center, Cartesian3.ZERO));

        /**
         * The radius of the sphere.
         * @type {Number}
         */
        this.radius = defaultValue(radius, 0.0);
    };

    var fromPointsXMin = new Cartesian3();
    var fromPointsYMin = new Cartesian3();
    var fromPointsZMin = new Cartesian3();
    var fromPointsXMax = new Cartesian3();
    var fromPointsYMax = new Cartesian3();
    var fromPointsZMax = new Cartesian3();
    var fromPointsCurrentPos = new Cartesian3();
    var fromPointsScratch = new Cartesian3();
    var fromPointsRitterCenter = new Cartesian3();
    var fromPointsMinBoxPt = new Cartesian3();
    var fromPointsMaxBoxPt = new Cartesian3();
    var fromPointsNaiveCenterScratch = new Cartesian3();

    /**
     * Computes a tight-fitting bounding sphere enclosing a list of 3D Cartesian points.
     * The bounding sphere is computed by running two algorithms, a naive algorithm and
     * Ritter's algorithm. The smaller of the two spheres is used to ensure a tight fit.
     * @memberof BoundingSphere
     *
     * @param {Array} positions An array of points that the bounding sphere will enclose.  Each point must have <code>x</code>, <code>y</code>, and <code>z</code> properties.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
     *
     * @see <a href='http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/'>Bounding Sphere computation article</a>
     */
    BoundingSphere.fromPoints = function(positions, result) {
        if (typeof result === 'undefined') {
            result = new BoundingSphere();
        }

        if (typeof positions === 'undefined' || positions.length === 0) {
            result.center = Cartesian3.ZERO.clone(result.center);
            result.radius = 0.0;
            return result;
        }

        var currentPos = Cartesian3.clone(positions[0], fromPointsCurrentPos);

        var xMin = Cartesian3.clone(currentPos, fromPointsXMin);
        var yMin = Cartesian3.clone(currentPos, fromPointsYMin);
        var zMin = Cartesian3.clone(currentPos, fromPointsZMin);

        var xMax = Cartesian3.clone(currentPos, fromPointsXMax);
        var yMax = Cartesian3.clone(currentPos, fromPointsYMax);
        var zMax = Cartesian3.clone(currentPos, fromPointsZMax);

        var numPositions = positions.length;
        for ( var i = 1; i < numPositions; i++) {
            Cartesian3.clone(positions[i], currentPos);

            var x = currentPos.x;
            var y = currentPos.y;
            var z = currentPos.z;

            // Store points containing the the smallest and largest components
            if (x < xMin.x) {
                Cartesian3.clone(currentPos, xMin);
            }

            if (x > xMax.x) {
                Cartesian3.clone(currentPos, xMax);
            }

            if (y < yMin.y) {
                Cartesian3.clone(currentPos, yMin);
            }

            if (y > yMax.y) {
                Cartesian3.clone(currentPos, yMax);
            }

            if (z < zMin.z) {
                Cartesian3.clone(currentPos, zMin);
            }

            if (z > zMax.z) {
                Cartesian3.clone(currentPos, zMax);
            }
        }

        // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
        var xSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(xMax, xMin, fromPointsScratch));
        var ySpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(yMax, yMin, fromPointsScratch));
        var zSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(zMax, zMin, fromPointsScratch));

        // Set the diameter endpoints to the largest span.
        var diameter1 = xMin;
        var diameter2 = xMax;
        var maxSpan = xSpan;
        if (ySpan > maxSpan) {
            maxSpan = ySpan;
            diameter1 = yMin;
            diameter2 = yMax;
        }
        if (zSpan > maxSpan) {
            maxSpan = zSpan;
            diameter1 = zMin;
            diameter2 = zMax;
        }

        // Calculate the center of the initial sphere found by Ritter's algorithm
        var ritterCenter = fromPointsRitterCenter;
        ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
        ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
        ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

        // Calculate the radius of the initial sphere found by Ritter's algorithm
        var radiusSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch));
        var ritterRadius = Math.sqrt(radiusSquared);

        // Find the center of the sphere found using the Naive method.
        var minBoxPt = fromPointsMinBoxPt;
        minBoxPt.x = xMin.x;
        minBoxPt.y = yMin.y;
        minBoxPt.z = zMin.z;

        var maxBoxPt = fromPointsMaxBoxPt;
        maxBoxPt.x = xMax.x;
        maxBoxPt.y = yMax.y;
        maxBoxPt.z = zMax.z;

        var naiveCenter = Cartesian3.multiplyByScalar(Cartesian3.add(minBoxPt, maxBoxPt, fromPointsScratch), 0.5, fromPointsNaiveCenterScratch);

        // Begin 2nd pass to find naive radius and modify the ritter sphere.
        var naiveRadius = 0;
        for (i = 0; i < numPositions; i++) {
            Cartesian3.clone(positions[i], currentPos);

            // Find the furthest point from the naive center to calculate the naive radius.
            var r = Cartesian3.magnitude(Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch));
            if (r > naiveRadius) {
                naiveRadius = r;
            }

            // Make adjustments to the Ritter Sphere to include all points.
            var oldCenterToPointSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch));
            if (oldCenterToPointSquared > radiusSquared) {
                var oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
                // Calculate new radius to include the point that lies outside
                ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
                radiusSquared = ritterRadius * ritterRadius;
                // Calculate center of new Ritter sphere
                var oldToNew = oldCenterToPoint - ritterRadius;
                ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
                ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
                ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
            }
        }

        if (ritterRadius < naiveRadius) {
            Cartesian3.clone(ritterCenter, result.center);
            result.radius = ritterRadius;
        } else {
            Cartesian3.clone(naiveCenter, result.center);
            result.radius = naiveRadius;
        }

        return result;
    };

    var defaultProjection = new GeographicProjection();
    var fromExtent2DLowerLeft = new Cartesian3();
    var fromExtent2DUpperRight = new Cartesian3();
    var fromExtent2DSouthwest = new Cartographic();
    var fromExtent2DNortheast = new Cartographic();

    /**
     * Computes a bounding sphere from an extent projected in 2D.
     *
     * @memberof BoundingSphere
     *
     * @param {Extent} extent The extent around which to create a bounding sphere.
     * @param {Object} [projection=GeographicProjection] The projection used to project the extent into 2D.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     */
    BoundingSphere.fromExtent2D = function(extent, projection, result) {
        return BoundingSphere.fromExtentWithHeights2D(extent, projection, 0.0, 0.0, result);
    };

    /**
     * Computes a bounding sphere from an extent projected in 2D.  The bounding sphere accounts for the
     * object's minimum and maximum heights over the extent.
     *
     * @memberof BoundingSphere
     *
     * @param {Extent} extent The extent around which to create a bounding sphere.
     * @param {Object} [projection=GeographicProjection] The projection used to project the extent into 2D.
     * @param {Number} [minimumHeight=0.0] The minimum height over the extent.
     * @param {Number} [maximumHeight=0.0] The maximum height over the extent.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     */
    BoundingSphere.fromExtentWithHeights2D = function(extent, projection, minimumHeight, maximumHeight, result) {
        if (typeof result === 'undefined') {
            result = new BoundingSphere();
        }

        if (typeof extent === 'undefined') {
            result.center = Cartesian3.ZERO.clone(result.center);
            result.radius = 0.0;
            return result;
        }

        projection = defaultValue(projection, defaultProjection);

        extent.getSouthwest(fromExtent2DSouthwest);
        fromExtent2DSouthwest.height = minimumHeight;
        extent.getNortheast(fromExtent2DNortheast);
        fromExtent2DNortheast.height = maximumHeight;

        var lowerLeft = projection.project(fromExtent2DSouthwest, fromExtent2DLowerLeft);
        var upperRight = projection.project(fromExtent2DNortheast, fromExtent2DUpperRight);

        var width = upperRight.x - lowerLeft.x;
        var height = upperRight.y - lowerLeft.y;
        var elevation = upperRight.z - lowerLeft.z;

        result.radius = Math.sqrt(width * width + height * height + elevation * elevation) * 0.5;
        var center = result.center;
        center.x = lowerLeft.x + width * 0.5;
        center.y = lowerLeft.y + height * 0.5;
        center.z = lowerLeft.z + elevation * 0.5;
        return result;
    };

    var fromExtent3DScratch = [];

    /**
     * Computes a bounding sphere from an extent in 3D. The bounding sphere is created using a subsample of points
     * on the ellipsoid and contained in the extent. It may not be accurate for all extents on all types of ellipsoids.
     * @memberof BoundingSphere
     *
     * @param {Extent} extent The valid extent used to create a bounding sphere.
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid used to determine positions of the extent.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     */
    BoundingSphere.fromExtent3D = function(extent, ellipsoid, result) {
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

        var positions;
        if (typeof extent !== 'undefined') {
            positions = extent.subsample(ellipsoid, fromExtent3DScratch);
        }

        return BoundingSphere.fromPoints(positions, result);
    };

    /**
     * Computes a tight-fitting bounding sphere enclosing a list of 3D points, where the points are
     * stored in a flat array in X, Y, Z, order.  The bounding sphere is computed by running two
     * algorithms, a naive algorithm and Ritter's algorithm. The smaller of the two spheres is used to
     * ensure a tight fit.
     *
     * @memberof BoundingSphere
     *
     * @param {Array} positions An array of points that the bounding sphere will enclose.  Each point
     *        is formed from three elements in the array in the order X, Y, Z.
     * @param {Cartesian3} [center=Cartesian3.ZERO] The position to which the positions are relative, which need not be the
     *        origin of the coordinate system.  This is useful when the positions are to be used for
     *        relative-to-center (RTC) rendering.
     * @param {Number} [stride=3] The number of array elements per vertex.  It must be at least 3, but it may
     *        be higher.  Regardless of the value of this parameter, the X coordinate of the first position
     *        is at array index 0, the Y coordinate is at array index 1, and the Z coordinate is at array index
     *        2.  When stride is 3, the X coordinate of the next position then begins at array index 3.  If
     *        the stride is 5, however, two array elements are skipped and the next position begins at array
     *        index 5.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
     *
     * @see <a href='http://blogs.agi.com/insight3d/index.php/2008/02/04/a-bounding/'>Bounding Sphere computation article</a>
     *
     * @example
     * // Compute the bounding sphere from 3 positions, each specified relative to a center.
     * // In addition to the X, Y, and Z coordinates, the points array contains two additional
     * // elements per point which are ignored for the purpose of computing the bounding sphere.
     * var center = new Cartesian3(1.0, 2.0, 3.0);
     * var points = [1.0, 2.0, 3.0, 0.1, 0.2,
     *               4.0, 5.0, 6.0, 0.1, 0.2,
     *               7.0, 8.0, 9.0, 0.1, 0.2];
     * var sphere = BoundingSphere.fromVertices(points, center, 5);
     */
    BoundingSphere.fromVertices = function(positions, center, stride, result) {
        if (typeof result === 'undefined') {
            result = new BoundingSphere();
        }

        if (typeof positions === 'undefined' || positions.length === 0) {
            result.center = Cartesian3.ZERO.clone(result.center);
            result.radius = 0.0;
            return result;
        }

        if (typeof center === 'undefined') {
            center = Cartesian3.ZERO;
        }

        if (typeof stride === 'undefined') {
            stride = 3;
        }

        if (stride < 3) {
            throw new DeveloperError('stride must be 3 or greater.');
        }

        var currentPos = fromPointsCurrentPos;
        currentPos.x = positions[0] + center.x;
        currentPos.y = positions[1] + center.y;
        currentPos.z = positions[2] + center.z;

        var xMin = Cartesian3.clone(currentPos, fromPointsXMin);
        var yMin = Cartesian3.clone(currentPos, fromPointsYMin);
        var zMin = Cartesian3.clone(currentPos, fromPointsZMin);

        var xMax = Cartesian3.clone(currentPos, fromPointsXMax);
        var yMax = Cartesian3.clone(currentPos, fromPointsYMax);
        var zMax = Cartesian3.clone(currentPos, fromPointsZMax);

        var numElements = positions.length;
        for (var i = 0; i < numElements; i += stride) {
            var x = positions[i] + center.x;
            var y = positions[i + 1] + center.y;
            var z = positions[i + 2] + center.z;

            currentPos.x = x;
            currentPos.y = y;
            currentPos.z = z;

            // Store points containing the the smallest and largest components
            if (x < xMin.x) {
                Cartesian3.clone(currentPos, xMin);
            }

            if (x > xMax.x) {
                Cartesian3.clone(currentPos, xMax);
            }

            if (y < yMin.y) {
                Cartesian3.clone(currentPos, yMin);
            }

            if (y > yMax.y) {
                Cartesian3.clone(currentPos, yMax);
            }

            if (z < zMin.z) {
                Cartesian3.clone(currentPos, zMin);
            }

            if (z > zMax.z) {
                Cartesian3.clone(currentPos, zMax);
            }
        }

        // Compute x-, y-, and z-spans (Squared distances b/n each component's min. and max.).
        var xSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(xMax, xMin, fromPointsScratch));
        var ySpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(yMax, yMin, fromPointsScratch));
        var zSpan = Cartesian3.magnitudeSquared(Cartesian3.subtract(zMax, zMin, fromPointsScratch));

        // Set the diameter endpoints to the largest span.
        var diameter1 = xMin;
        var diameter2 = xMax;
        var maxSpan = xSpan;
        if (ySpan > maxSpan) {
            maxSpan = ySpan;
            diameter1 = yMin;
            diameter2 = yMax;
        }
        if (zSpan > maxSpan) {
            maxSpan = zSpan;
            diameter1 = zMin;
            diameter2 = zMax;
        }

        // Calculate the center of the initial sphere found by Ritter's algorithm
        var ritterCenter = fromPointsRitterCenter;
        ritterCenter.x = (diameter1.x + diameter2.x) * 0.5;
        ritterCenter.y = (diameter1.y + diameter2.y) * 0.5;
        ritterCenter.z = (diameter1.z + diameter2.z) * 0.5;

        // Calculate the radius of the initial sphere found by Ritter's algorithm
        var radiusSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(diameter2, ritterCenter, fromPointsScratch));
        var ritterRadius = Math.sqrt(radiusSquared);

        // Find the center of the sphere found using the Naive method.
        var minBoxPt = fromPointsMinBoxPt;
        minBoxPt.x = xMin.x;
        minBoxPt.y = yMin.y;
        minBoxPt.z = zMin.z;

        var maxBoxPt = fromPointsMaxBoxPt;
        maxBoxPt.x = xMax.x;
        maxBoxPt.y = yMax.y;
        maxBoxPt.z = zMax.z;

        var naiveCenter = Cartesian3.multiplyByScalar(Cartesian3.add(minBoxPt, maxBoxPt, fromPointsScratch), 0.5, fromPointsNaiveCenterScratch);

        // Begin 2nd pass to find naive radius and modify the ritter sphere.
        var naiveRadius = 0;
        for (i = 0; i < numElements; i += stride) {
            currentPos.x = positions[i] + center.x;
            currentPos.y = positions[i + 1] + center.y;
            currentPos.z = positions[i + 2] + center.z;

            // Find the furthest point from the naive center to calculate the naive radius.
            var r = Cartesian3.magnitude(Cartesian3.subtract(currentPos, naiveCenter, fromPointsScratch));
            if (r > naiveRadius) {
                naiveRadius = r;
            }

            // Make adjustments to the Ritter Sphere to include all points.
            var oldCenterToPointSquared = Cartesian3.magnitudeSquared(Cartesian3.subtract(currentPos, ritterCenter, fromPointsScratch));
            if (oldCenterToPointSquared > radiusSquared) {
                var oldCenterToPoint = Math.sqrt(oldCenterToPointSquared);
                // Calculate new radius to include the point that lies outside
                ritterRadius = (ritterRadius + oldCenterToPoint) * 0.5;
                radiusSquared = ritterRadius * ritterRadius;
                // Calculate center of new Ritter sphere
                var oldToNew = oldCenterToPoint - ritterRadius;
                ritterCenter.x = (ritterRadius * ritterCenter.x + oldToNew * currentPos.x) / oldCenterToPoint;
                ritterCenter.y = (ritterRadius * ritterCenter.y + oldToNew * currentPos.y) / oldCenterToPoint;
                ritterCenter.z = (ritterRadius * ritterCenter.z + oldToNew * currentPos.z) / oldCenterToPoint;
            }
        }

        if (ritterRadius < naiveRadius) {
            Cartesian3.clone(ritterCenter, result.center);
            result.radius = ritterRadius;
        } else {
            Cartesian3.clone(naiveCenter, result.center);
            result.radius = naiveRadius;
        }

        return result;
    };

    /**
     * Computes a bounding sphere from the corner points of an axis-aligned bounding box.  The sphere
     * tighly and fully encompases the box.
     *
     * @memberof BoundingSphere
     *
     * @param {Number} [corner] The minimum height over the extent.
     * @param {Number} [oppositeCorner] The maximum height over the extent.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     *
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     *
     * @exception {DeveloperError} corner and oppositeCorner are required.
     *
     * @example
     * // Create a bounding sphere around the unit cube
     * var sphere = BoundingSphere.fromCornerPoints(new Cartesian3(-0.5, -0.5, -0.5), new Cartesian3(0.5, 0.5, 0.5));
     */
    BoundingSphere.fromCornerPoints = function(corner, oppositeCorner, result) {
        if ((typeof corner === 'undefined') || (typeof oppositeCorner === 'undefined')) {
            throw new DeveloperError('corner and oppositeCorner are required.');
        }

        if (typeof result === 'undefined') {
            result = new BoundingSphere();
        }

        var center = result.center;
        Cartesian3.add(corner, oppositeCorner, center);
        Cartesian3.multiplyByScalar(center, 0.5, center);
        result.radius = Cartesian3.distance(center, oppositeCorner);
        return result;
    };

    /**
     * Duplicates a BoundingSphere instance.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} sphere The bounding sphere to duplicate.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided. (Returns undefined if sphere is undefined)
     */
    BoundingSphere.clone = function(sphere, result) {
        if (typeof sphere === 'undefined') {
            return undefined;
        }

        if (typeof result === 'undefined') {
            return new BoundingSphere(sphere.center, sphere.radius);
        }

        result.center = Cartesian3.clone(sphere.center, result.center);
        result.radius = sphere.radius;
        return result;
    };

    var unionScratch = new Cartesian3();
    var unionScratchCenter = new Cartesian3();
    /**
     * Computes a bounding sphere that contains both the left and right bounding spheres.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} left A sphere to enclose in a bounding sphere.
     * @param {BoundingSphere} right A sphere to enclose in a bounding sphere.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    BoundingSphere.union = function(left, right, result) {
        if (typeof left === 'undefined') {
            throw new DeveloperError('left is required.');
        }

        if (typeof right === 'undefined') {
            throw new DeveloperError('right is required.');
        }

        if (typeof result === 'undefined') {
            result = new BoundingSphere();
        }

        var leftCenter = left.center;
        var rightCenter = right.center;

        Cartesian3.add(leftCenter, rightCenter, unionScratchCenter);
        var center = Cartesian3.multiplyByScalar(unionScratchCenter, 0.5, unionScratchCenter);

        var radius1 = Cartesian3.subtract(leftCenter, center, unionScratch).magnitude() + left.radius;
        var radius2 = Cartesian3.subtract(rightCenter, center, unionScratch).magnitude() + right.radius;

        result.radius = Math.max(radius1, radius2);
        Cartesian3.clone(center, result.center);

        return result;
    };

    var expandScratch = new Cartesian3();
    /**
     * Computes a bounding sphere by enlarging the provided sphere to contain the provided point.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} sphere A sphere to expand.
     * @param {Cartesian3} point A point to enclose in a bounding sphere.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     *
     * @exception {DeveloperError} sphere is required.
     * @exception {DeveloperError} point is required.
     */
    BoundingSphere.expand = function(sphere, point, result) {
        if (typeof sphere === 'undefined') {
            throw new DeveloperError('sphere is required.');
        }

        if (typeof point === 'undefined') {
            throw new DeveloperError('point is required.');
        }

        result = BoundingSphere.clone(sphere, result);

        var radius = Cartesian3.subtract(point, result.center, expandScratch).magnitude();
        if (radius > result.radius) {
            result.radius = radius;
        }

        return result;
    };

    /**
     * Determines which side of a plane a sphere is located.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} sphere The bounding sphere to test.
     * @param {Cartesian4} plane The coefficients of the plane in the for ax + by + cz + d = 0
     *                           where the coefficients a, b, c, and d are the components x, y, z,
     *                           and w of the {Cartesian4}, respectively.
     * @return {Intersect} {Intersect.INSIDE} if the entire sphere is on the side of the plane the normal
     *                     is pointing, {Intersect.OUTSIDE} if the entire sphere is on the opposite side,
     *                     and {Intersect.INTERSETING} if the sphere intersects the plane.
     *
     * @exception {DeveloperError} sphere is required.
     * @exception {DeveloperError} plane is required.
     */
    BoundingSphere.intersect = function(sphere, plane) {
        if (typeof sphere === 'undefined') {
            throw new DeveloperError('sphere is required.');
        }

        if (typeof plane === 'undefined') {
            throw new DeveloperError('plane is required.');
        }

        var center = sphere.center;
        var radius = sphere.radius;
        var distanceToPlane = Cartesian3.dot(plane, center) + plane.w;

        if (distanceToPlane < -radius) {
            // The center point is negative side of the plane normal
            return Intersect.OUTSIDE;
        } else if (distanceToPlane < radius) {
            // The center point is positive side of the plane, but radius extends beyond it; partial overlap
            return Intersect.INTERSECTING;
        }
        return Intersect.INSIDE;
    };

    var transformCart4 = Cartesian4.UNIT_W.clone();
    /**
     * Applies a 4x4 affine transformation matrix to a bounding sphere.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} sphere The bounding sphere to apply the transformation to.
     * @param {Matrix4} transform The transformation matrix to apply to the bounding sphere.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     *
     * @exception {DeveloperError} sphere is required.
     * @exception {DeveloperError} transform is required.
     */
    BoundingSphere.transform = function(sphere, transform, result) {
        if (typeof sphere === 'undefined') {
            throw new DeveloperError('sphere is required.');
        }

        if (typeof transform === 'undefined') {
            throw new DeveloperError('transform is required.');
        }

        if (typeof result === 'undefined') {
            result = new BoundingSphere();
        }

        Matrix4.multiplyByPoint(transform, sphere.center, transformCart4);

        Cartesian3.clone(transformCart4, result.center);
        result.radius = sphere.radius;
        return result;
    };

    var scratchCartesian3 = new Cartesian3();
    /**
     * The distances calculated by the vector from the center of the bounding sphere to position projected onto direction
     * plus/minus the radius of the bounding sphere.
     * <br>
     * If you imagine the infinite number of planes with normal direction, this computes the smallest distance to the
     * closest and farthest planes from position that intersect the bounding sphere.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} sphere The bounding sphere to calculate the distance to.
     * @param {Cartesian3} position The position to calculate the distance from.
     * @param {Cartesian3} direction The direction from position.
     * @param {Cartesian2} [result] A Cartesian2 to store the nearest and farthest distances.
     * @return {Interval} The nearest and farthest distances on the bounding sphere from position in direction.
     *
     * @exception {DeveloperError} sphere is required.
     * @exception {DeveloperError} position is required.
     * @exception {DeveloperError} direction is required.
     */
    BoundingSphere.getPlaneDistances = function(sphere, position, direction, result) {
        if (typeof sphere === 'undefined') {
            throw new DeveloperError('sphere is required.');
        }

        if (typeof position === 'undefined') {
            throw new DeveloperError('position is required.');
        }

        if (typeof direction === 'undefined') {
            throw new DeveloperError('direction is required.');
        }

        if (typeof result === 'undefined') {
            result = new Interval();
        }

        var toCenter = Cartesian3.subtract(sphere.center, position, scratchCartesian3);
        var proj = Cartesian3.multiplyByScalar(direction, direction.dot(toCenter), scratchCartesian3);
        var mag = proj.magnitude();

        result.start = mag - sphere.radius;
        result.stop = mag + sphere.radius;
        return result;
    };

    /**
     * Compares the provided BoundingSphere componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} [left] The first BoundingSphere.
     * @param {BoundingSphere} [right] The second BoundingSphere.
     * @return {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    BoundingSphere.equals = function(left, right) {
        return (left === right) ||
               ((typeof left !== 'undefined') &&
                (typeof right !== 'undefined') &&
                Cartesian3.equals(left.center, right.center) &&
                left.radius === right.radius);
    };

    /**
     * Duplicates this BoundingSphere instance.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     */
    BoundingSphere.prototype.clone = function(result) {
        return BoundingSphere.clone(this, result);
    };

    /**
     * Computes a bounding sphere that contains both this bounding sphere and the argument sphere.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} right The sphere to enclose in this bounding sphere.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     *
     * @exception {DeveloperError} sphere is required.
     */
    BoundingSphere.prototype.union = function(right, result) {
        return BoundingSphere.union(this, right, result);
    };

    /**
     * Computes a bounding sphere that is sphere expanded to contain point.
     * @memberof BoundingSphere
     *
     * @param {Cartesian3} point A point to enclose in a bounding sphere.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if one was not provided.
     *
     * @exception {DeveloperError} point is required.
     */
    BoundingSphere.prototype.expand = function(point, result) {
        return BoundingSphere.expand(this, point, result);
    };

    /**
     * Determines which side of a plane the sphere is located.
     * @memberof BoundingSphere
     *
     * @param {Cartesian4} plane The coefficients of the plane in the for ax + by + cz + d = 0
     *                           where the coefficients a, b, c, and d are the components x, y, z,
     *                           and w of the {Cartesian4}, respectively.
     * @return {Intersect} {Intersect.INSIDE} if the entire sphere is on the side of the plane the normal
     *                     is pointing, {Intersect.OUTSIDE} if the entire sphere is on the opposite side,
     *                     and {Intersect.INTERSETING} if the sphere intersects the plane.
     *
     * @exception {DeveloperError} plane is required.
     */
    BoundingSphere.prototype.intersect = function(plane) {
        return BoundingSphere.intersect(this, plane);
    };

    /**
     * Applies a 4x4 affine transformation matrix to this bounding sphere.
     * @memberof BoundingSphere
     *
     * @param {Matrix4} transform The transformation matrix to apply to the bounding sphere.
     * @param {BoundingSphere} [result] The object onto which to store the result.
     * @return {BoundingSphere} The modified result parameter or a new BoundingSphere instance if none was provided.
     *
     * @exception {DeveloperError} transform is required.
     */
    BoundingSphere.prototype.transform = function(transform, result) {
        return BoundingSphere.transform(this, transform, result);
    };

    /**
     * The distances calculated by the vector from the center of the bounding sphere to position projected onto direction
     * plus/minus the radius of the bounding sphere.
     * <br>
     * If you imagine the infinite number of planes with normal direction, this computes the smallest distance to the
     * closest and farthest planes from position that intersect the bounding sphere.
     * @memberof BoundingSphere
     *
     * @param {Cartesian3} position The position to calculate the distance from.
     * @param {Cartesian3} direction The direction from position.
     * @param {Cartesian2} [result] A Cartesian2 to store the nearest and farthest distances.
     * @return {Interval} The nearest and farthest distances on the bounding sphere from position in direction.
     *
     * @exception {DeveloperError} position is required.
     * @exception {DeveloperError} direction is required.
     */
    BoundingSphere.prototype.getPlaneDistances = function(position, direction, result) {
        return BoundingSphere.getPlaneDistances(this, position, direction, result);
    };

    /**
     * Compares this BoundingSphere against the provided BoundingSphere componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof BoundingSphere
     *
     * @param {BoundingSphere} [right] The right hand side BoundingSphere.
     * @return {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
     */
    BoundingSphere.prototype.equals = function(right) {
        return BoundingSphere.equals(this, right);
    };

    return BoundingSphere;
});

/*global define*/
define('Core/EllipsoidalOccluder',[
        './defaultValue',
        './DeveloperError',
        './Cartesian3',
        './BoundingSphere'
    ], function(
        defaultValue,
        DeveloperError,
        Cartesian3,
        BoundingSphere) {
    

    /**
     * Determine whether or not other objects are visible or hidden behind the visible horizon defined by
     * an {@link Ellipsoid} and a camera position.  The ellipsoid is assumed to be located at the
     * origin of the coordinate system.  This class uses the algorithm described in the
     * <a href="http://cesium.agi.com/2013/04/25/Horizon-culling/">Horizon Culling</a> blog post.
     *
     * @alias EllipsoidalOccluder
     *
     * @param {Ellipsoid} ellipsoid The ellipsoid to use as an occluder.
     * @param {Cartesian3} [cameraPosition] The coordinate of the viewer/camera.  If this parameter is not
     *        specified, {@link EllipsoidalOccluder#setCameraPosition} must be called before
     *        testing visibility.
     *
     * @exception {DeveloperError} <code>ellipsoid</code> is required.
     *
     * @constructor
     *
     * @example
     * // Construct an ellipsoidal occluder with radii 1.0, 1.1, and 0.9.
     * var cameraPosition = new Cartesian3(5.0, 6.0, 7.0);
     * var occluderEllipsoid = new Ellipsoid(1.0, 1.1, 0.9);
     * var occluder = new EllipsoidalOccluder(occluderEllipsoid, cameraPosition);
     */
    var EllipsoidalOccluder = function(ellipsoid, cameraPosition) {
        if (typeof ellipsoid === 'undefined') {
            throw new DeveloperError('ellipsoid is required.');
        }

        this._ellipsoid = ellipsoid;
        this._cameraPosition = new Cartesian3();
        this._cameraPositionInScaledSpace = new Cartesian3();
        this._distanceToLimbInScaledSpaceSquared = 0.0;

        // setCameraPosition fills in the above values
        if (typeof cameraPosition !== 'undefined') {
            this.setCameraPosition(cameraPosition);
        }
    };

    /**
     * Returns the occluding ellipsoid.
     *
     * @memberof EllipsoidalOccluder
     *
     * @return {Ellipsoid} The ellipsoid.
     */
    EllipsoidalOccluder.prototype.getEllipsoid = function() {
        return this._ellipsoid;
    };

    /**
     * Sets the position of the camera.
     *
     * @memberof EllipsoidalOccluder
     *
     * @param {Cartesian3} cameraPosition The new position of the camera.
     */
    EllipsoidalOccluder.prototype.setCameraPosition = function(cameraPosition) {
        // See http://cesium.agi.com/2013/04/25/Horizon-culling/
        var ellipsoid = this._ellipsoid;
        var cv = ellipsoid.transformPositionToScaledSpace(cameraPosition, this._cameraPositionInScaledSpace);
        var vhMagnitudeSquared = Cartesian3.magnitudeSquared(cv) - 1.0;

        Cartesian3.clone(cameraPosition, this._cameraPosition);
        this._cameraPositionInScaledSpace = cv;
        this._distanceToLimbInScaledSpaceSquared = vhMagnitudeSquared;
    };

    /**
     * Gets the position of the camera.
     *
     * @memberof EllipsoidalOccluder
     *
     * @returns {Cartesian3} The position of the camera.
     */
    EllipsoidalOccluder.prototype.getCameraPosition = function() {
        return this._cameraPosition;
    };

    var scratchCartesian = new Cartesian3();

    /**
     * Determines whether or not a point, the <code>occludee</code>, is hidden from view by the occluder.
     *
     * @memberof EllipsoidalOccluder
     *
     * @param {Cartesian3} occludee The point to test for visibility.
     *
     * @return {boolean} <code>true</code> if the occludee is visible; otherwise <code>false</code>.
     *
     * @example
     * var cameraPosition = new Cartesian3(0, 0, 2.5);
     * var ellipsoid = new Ellipsoid(1.0, 1.1, 0.9);
     * var occluder = new EllipsoidalOccluder(ellipsoid, cameraPosition);
     * var point = new Cartesian3(0, -3, -3);
     * occluder.isPointVisible(point); //returns true
     */
    EllipsoidalOccluder.prototype.isPointVisible = function(occludee) {
        var ellipsoid = this._ellipsoid;
        var occludeeScaledSpacePosition = ellipsoid.transformPositionToScaledSpace(occludee, scratchCartesian);
        return this.isScaledSpacePointVisible(occludeeScaledSpacePosition);
    };

    /**
     * Determines whether or not a point expressed in the ellipsoid scaled space, is hidden from view by the
     * occluder.  To transform a Cartesian X, Y, Z position in the coordinate system aligned with the ellipsoid
     * into the scaled space, call {@link Ellipsoid#transformPositionToScaledSpace}.
     *
     * @memberof EllipsoidalOccluder
     *
     * @param {Cartesian3} occludeeScaledSpacePosition The point to test for visibility, represented in the scaled space.
     *
     * @return {boolean} <code>true</code> if the occludee is visible; otherwise <code>false</code>.
     *
     * @example
     * var cameraPosition = new Cartesian3(0, 0, 2.5);
     * var ellipsoid = new Ellipsoid(1.0, 1.1, 0.9);
     * var occluder = new EllipsoidalOccluder(ellipsoid, cameraPosition);
     * var point = new Cartesian3(0, -3, -3);
     * var scaledSpacePoint = ellipsoid.transformPositionToScaledSpace(point);
     * occluder.isScaledSpacePointVisible(scaledSpacePoint); //returns true
     */
    EllipsoidalOccluder.prototype.isScaledSpacePointVisible = function(occludeeScaledSpacePosition) {
        // See http://cesium.agi.com/2013/04/25/Horizon-culling/
        var cv = this._cameraPositionInScaledSpace;
        var vhMagnitudeSquared = this._distanceToLimbInScaledSpaceSquared;
        var vt = Cartesian3.subtract(occludeeScaledSpacePosition, cv, scratchCartesian);
        var vtDotVc = -vt.dot(cv);
        var isOccluded = vtDotVc > vhMagnitudeSquared &&
                         vtDotVc * vtDotVc / vt.magnitudeSquared() > vhMagnitudeSquared;
        return !isOccluded;
    };

    /**
     * Computes a point that can be used for horizon culling from a list of positions.  If the point is below
     * the horizon, all of the positions are guaranteed to be below the horizon as well.  The returned point
     * is expressed in the ellipsoid-scaled space and is suitable for use with
     * {@link EllipsoidalOccluder#isScaledSpacePointVisible}.
     *
     * @param {Cartesian3} directionToPoint The direction that the computed point will lie along.
     *                     A reasonable direction to use is the direction from the center of the ellipsoid to
     *                     the center of the bounding sphere computed from the positions.  The direction need not
     *                     be normalized.
     * @param {Cartesian3[]} positions The positions from which to compute the horizon culling point.  The positions
     *                       must be expressed in a reference frame centered at the ellipsoid and aligned with the
     *                       ellipsoid's axes.
     * @param {Cartesian3} [result] The instance on which to store the result instead of allocating a new instance.
     * @returns {Cartesian3} The computed horizon culling point, expressed in the ellipsoid-scaled space.
     */
    EllipsoidalOccluder.prototype.computeHorizonCullingPoint = function(directionToPoint, positions, result) {
        if (typeof directionToPoint === 'undefined') {
            throw new DeveloperError('directionToPoint is required');
        }
        if (typeof positions === 'undefined') {
            throw new DeveloperError('positions is required');
        }

        var ellipsoid = this._ellipsoid;

        var scaledSpaceDirectionToPoint = computeScaledSpaceDirectionToPoint(ellipsoid, directionToPoint);

        var resultMagnitude = 0.0;

        for (var i = 0, len = positions.length; i < len; ++i) {
            var position = positions[i];
            var candidateMagnitude = computeMagnitude(ellipsoid, position, scaledSpaceDirectionToPoint);
            resultMagnitude = Math.max(resultMagnitude, candidateMagnitude);
        }

        return magnitudeToPoint(scaledSpaceDirectionToPoint, resultMagnitude, result);
    };

    var positionScratch = new Cartesian3();

    /**
     * Computes a point that can be used for horizon culling from a list of positions.  If the point is below
     * the horizon, all of the positions are guaranteed to be below the horizon as well.  The returned point
     * is expressed in the ellipsoid-scaled space and is suitable for use with
     * {@link EllipsoidalOccluder#isScaledSpacePointVisible}.
     *
     * @param {Cartesian3} directionToPoint The direction that the computed point will lie along.
     *                     A reasonable direction to use is the direction from the center of the ellipsoid to
     *                     the center of the bounding sphere computed from the positions.  The direction need not
     *                     be normalized.
     * @param {Number[]} vertices  The vertices from which to compute the horizon culling point.  The positions
     *                   must be expressed in a reference frame centered at the ellipsoid and aligned with the
     *                   ellipsoid's axes.
     * @param {Number} [stride=3]
     * @param {Cartesian3} [center=Cartesian3.ZERO]
     * @param {Cartesian3} [result] The instance on which to store the result instead of allocating a new instance.
     * @returns {Cartesian3} The computed horizon culling point, expressed in the ellipsoid-scaled space.
     */
    EllipsoidalOccluder.prototype.computeHorizonCullingPointFromVertices = function(directionToPoint, vertices, stride, center, result) {
        if (typeof directionToPoint === 'undefined') {
            throw new DeveloperError('directionToPoint is required');
        }
        if (typeof vertices === 'undefined') {
            throw new DeveloperError('vertices is required');
        }
        if (typeof stride === 'undefined') {
            throw new DeveloperError('stride is required');
        }

        center = defaultValue(center, Cartesian3.ZERO);

        var ellipsoid = this._ellipsoid;

        var scaledSpaceDirectionToPoint = computeScaledSpaceDirectionToPoint(ellipsoid, directionToPoint);

        var resultMagnitude = 0.0;

        for (var i = 0, len = vertices.length; i < len; i += stride) {
            positionScratch.x = vertices[i] + center.x;
            positionScratch.y = vertices[i + 1] + center.y;
            positionScratch.z = vertices[i + 2] + center.z;

            var candidateMagnitude = computeMagnitude(ellipsoid, positionScratch, scaledSpaceDirectionToPoint);
            resultMagnitude = Math.max(resultMagnitude, candidateMagnitude);
        }

        return magnitudeToPoint(scaledSpaceDirectionToPoint, resultMagnitude, result);
    };

    var subsampleScratch = [];

    /**
     * Computes a point that can be used for horizon culling of an extent.  If the point is below
     * the horizon, the ellipsoid-conforming extent is guaranteed to be below the horizon as well.
     * The returned point is expressed in the ellipsoid-scaled space and is suitable for use with
     * {@link EllipsoidalOccluder#isScaledSpacePointVisible}.
     *
     * @param {Extent} extent The extent for which to compute the horizon culling point.
     * @param {Ellipsoid} ellipsoid The ellipsoid on which the extent is defined.  This may be different from
     *                    the ellipsoid used by this instance for occlusion testing.
     * @param {Cartesian3} [result] The instance on which to store the result instead of allocating a new instance.
     * @returns {Cartesian3} The computed horizon culling point, expressed in the ellipsoid-scaled space.
     */
    EllipsoidalOccluder.prototype.computeHorizonCullingPointFromExtent = function(extent, ellipsoid, result) {
        if (typeof extent === 'undefined') {
            throw new DeveloperError('extent is required.');
        }

        var positions = extent.subsample(ellipsoid, subsampleScratch);
        var bs = BoundingSphere.fromPoints(positions);

        // If the bounding sphere center is too close to the center of the occluder, it doesn't make
        // sense to try to horizon cull it.
        if (bs.center.magnitude() < 0.1 * ellipsoid.getMinimumRadius()) {
            return undefined;
        }

        return this.computeHorizonCullingPoint(bs.center, positions, result);
    };

    var scaledSpaceScratch = new Cartesian3();
    var directionScratch = new Cartesian3();

    function computeMagnitude(ellipsoid, position, scaledSpaceDirectionToPoint) {
        var scaledSpacePosition = ellipsoid.transformPositionToScaledSpace(position, scaledSpaceScratch);
        var magnitudeSquared = scaledSpacePosition.magnitudeSquared();
        var magnitude = Math.sqrt(magnitudeSquared);
        var direction = scaledSpacePosition.divideByScalar(magnitude, directionScratch);

        // For the purpose of this computation, points below the ellipsoid are consider to be on it instead.
        magnitudeSquared = Math.max(1.0, magnitudeSquared);
        magnitude = Math.max(1.0, magnitude);

        var cosAlpha = direction.dot(scaledSpaceDirectionToPoint);
        var sinAlpha = direction.cross(scaledSpaceDirectionToPoint).magnitude();
        var cosBeta = 1.0 / magnitude;
        var sinBeta = Math.sqrt(magnitudeSquared - 1.0) * cosBeta;

        return 1.0 / (cosAlpha * cosBeta - sinAlpha * sinBeta);
    }

    function magnitudeToPoint(scaledSpaceDirectionToPoint, resultMagnitude, result) {
        // The horizon culling point is undefined if there were no positions from which to compute it,
        // the directionToPoint is pointing opposite all of the positions,  or if we computed NaN or infinity.
        if (resultMagnitude <= 0.0 || resultMagnitude === 1.0 / 0.0 || resultMagnitude !== resultMagnitude) {
            return undefined;
        }

        return scaledSpaceDirectionToPoint.multiplyByScalar(resultMagnitude, result);
    }

    var directionToPointScratch = new Cartesian3();

    function computeScaledSpaceDirectionToPoint(ellipsoid, directionToPoint) {
        ellipsoid.transformPositionToScaledSpace(directionToPoint, directionToPointScratch);
        return directionToPointScratch.normalize(directionToPointScratch);
    }

    return EllipsoidalOccluder;
});
/*global define*/
define('Core/Extent',[
        './freezeObject',
        './defaultValue',
        './Ellipsoid',
        './Cartographic',
        './DeveloperError',
        './Math'
    ], function(
        freezeObject,
        defaultValue,
        Ellipsoid,
        Cartographic,
        DeveloperError,
        CesiumMath) {
    

    /**
     * A two dimensional region specified as longitude and latitude coordinates.
     * @alias Extent
     * @constructor
     *
     * @param {Number} [west=0.0] The westernmost longitude in the range [-Pi, Pi].
     * @param {Number} [south=0.0] The southernmost latitude in the range [-Pi/2, Pi/2].
     * @param {Number} [east=0.0] The easternmost longitude in the range [-Pi, Pi].
     * @param {Number} [north=0.0] The northernmost latitude in the range [-Pi/2, Pi/2].
     */
    var Extent = function(west, south, east, north) {
        /**
         * The westernmost longitude in the range [-Pi, Pi].
         * @type Number
         */
        this.west = defaultValue(west, 0.0);

        /**
         * The southernmost latitude in the range [-Pi/2, Pi/2].
         * @type Number
         */
        this.south = defaultValue(south, 0.0);

        /**
         * The easternmost longitude in the range [-Pi, Pi].
         * @type Number
         */
        this.east = defaultValue(east, 0.0);

        /**
         * The northernmost latitude in the range [-Pi/2, Pi/2].
         * @type Number
         */
        this.north = defaultValue(north, 0.0);
    };

    /**
     * Creates the smallest possible Extent that encloses all positions in the provided array.
     * @memberof Extent
     *
     * @param {Array} cartographics The list of Cartographic instances.
     * @param {Extent} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @return {Extent} The modified result parameter or a new Extent instance if none was provided.
     */
    Extent.fromCartographicArray = function(cartographics, result) {
        if (typeof cartographics === 'undefined') {
            throw new DeveloperError('cartographics is required.');
        }

        var minLon = Number.MAX_VALUE;
        var maxLon = -Number.MAX_VALUE;
        var minLat = Number.MAX_VALUE;
        var maxLat = -Number.MAX_VALUE;

        for ( var i = 0, len = cartographics.length; i < len; i++) {
            var position = cartographics[i];
            minLon = Math.min(minLon, position.longitude);
            maxLon = Math.max(maxLon, position.longitude);
            minLat = Math.min(minLat, position.latitude);
            maxLat = Math.max(maxLat, position.latitude);
        }

        if (typeof result === 'undefined') {
            return new Extent(minLon, minLat, maxLon, maxLat);
        }

        result.west = minLon;
        result.south = minLat;
        result.east = maxLon;
        result.north = maxLat;
        return result;
    };

    /**
     * Duplicates an Extent.
     *
     * @memberof Extent
     *
     * @param {Extent} extent The extent to clone.
     * @param {Extent} [result] The object onto which to store the result, or undefined if a new instance should be created.
     * @return {Extent} The modified result parameter or a new Extent instance if none was provided. (Returns undefined if extent is undefined)
     */
    Extent.clone = function(extent, result) {
        if (typeof extent === 'undefined') {
            return undefined;
        }
        if (typeof result === 'undefined') {
            return new Extent(extent.west, extent.south, extent.east, extent.north);
        }
        result.west = extent.west;
        result.south = extent.south;
        result.east = extent.east;
        result.north = extent.north;
        return result;
    };

    /**
     * Duplicates this Extent.
     *
     * @memberof Extent
     *
     * @param {Extent} [result] The object onto which to store the result.
     * @return {Extent} The modified result parameter or a new Extent instance if none was provided.
     */
    Extent.prototype.clone = function(result) {
        return Extent.clone(this, result);
    };

    /**
     * Compares the provided Extent with this Extent componentwise and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof Extent
     *
     * @param {Extent} [other] The Extent to compare.
     * @return {Boolean} <code>true</code> if the Extents are equal, <code>false</code> otherwise.
     */
    Extent.prototype.equals = function(other) {
        return typeof other !== 'undefined' &&
               this.west === other.west &&
               this.south === other.south &&
               this.east === other.east &&
               this.north === other.north;
    };

    /**
     * Compares the provided Extent with this Extent componentwise and returns
     * <code>true</code> if they are within the provided epsilon,
     * <code>false</code> otherwise.
     * @memberof Extent
     *
     * @param {Extent} [other] The Extent to compare.
     * @param {Number} epsilon The epsilon to use for equality testing.
     * @return {Boolean} <code>true</code> if the Extents are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Extent.prototype.equalsEpsilon = function(other, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number.');
        }

        return typeof other !== 'undefined' &&
               (Math.abs(this.west - other.west) <= epsilon) &&
               (Math.abs(this.south - other.south) <= epsilon) &&
               (Math.abs(this.east - other.east) <= epsilon) &&
               (Math.abs(this.north - other.north) <= epsilon);
    };

    /**
     * Checks this Extent's properties and throws if they are not in valid ranges.
     *
     * @exception {DeveloperError} <code>north</code> is required to be a number.
     * @exception {DeveloperError} <code>south</code> is required to be a number.
     * @exception {DeveloperError} <code>east</code> is required to be a number.
     * @exception {DeveloperError} <code>west</code> is required to be a number.
     * @exception {DeveloperError} <code>north</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
     * @exception {DeveloperError} <code>south</code> must be in the interval [<code>-Pi/2</code>, <code>Pi/2</code>].
     * @exception {DeveloperError} <code>east</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
     * @exception {DeveloperError} <code>west</code> must be in the interval [<code>-Pi</code>, <code>Pi</code>].
     */
    Extent.prototype.validate = function() {
        var north = this.north;
        if (typeof north !== 'number') {
            throw new DeveloperError('north is required to be a number.');
        }

        if (north < -CesiumMath.PI_OVER_TWO || north > CesiumMath.PI_OVER_TWO) {
            throw new DeveloperError('north must be in the interval [-Pi/2, Pi/2].');
        }

        var south = this.south;
        if (typeof south !== 'number') {
            throw new DeveloperError('south is required to be a number.');
        }

        if (south < -CesiumMath.PI_OVER_TWO || south > CesiumMath.PI_OVER_TWO) {
            throw new DeveloperError('south must be in the interval [-Pi/2, Pi/2].');
        }

        var west = this.west;
        if (typeof west !== 'number') {
            throw new DeveloperError('west is required to be a number.');
        }

        if (west < -Math.PI || west > Math.PI) {
            throw new DeveloperError('west must be in the interval [-Pi, Pi].');
        }

        var east = this.east;
        if (typeof east !== 'number') {
            throw new DeveloperError('east is required to be a number.');
        }

        if (east < -Math.PI || east > Math.PI) {
            throw new DeveloperError('east must be in the interval [-Pi, Pi].');
        }
    };

    /**
     * Computes the southwest corner of this extent.
     * @memberof Extent
     *
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Extent.prototype.getSouthwest = function(result) {
        if (typeof result === 'undefined') {
            return new Cartographic(this.west, this.south);
        }
        result.longitude = this.west;
        result.latitude = this.south;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the northwest corner of this extent.
     * @memberof Extent
     *
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Extent.prototype.getNorthwest = function(result) {
        if (typeof result === 'undefined') {
            return new Cartographic(this.west, this.north);
        }
        result.longitude = this.west;
        result.latitude = this.north;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the northeast corner of this extent.
     * @memberof Extent
     *
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Extent.prototype.getNortheast = function(result) {
        if (typeof result === 'undefined') {
            return new Cartographic(this.east, this.north);
        }
        result.longitude = this.east;
        result.latitude = this.north;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the southeast corner of this extent.
     * @memberof Extent
     *
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Extent.prototype.getSoutheast = function(result) {
        if (typeof result === 'undefined') {
            return new Cartographic(this.east, this.south);
        }
        result.longitude = this.east;
        result.latitude = this.south;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the center of this extent.
     * @memberof Extent
     *
     * @param {Cartographic} [result] The object onto which to store the result.
     * @return {Cartographic} The modified result parameter or a new Cartographic instance if none was provided.
     */
    Extent.prototype.getCenter = function(result) {
        if (typeof result === 'undefined') {
            return new Cartographic((this.west + this.east) * 0.5, (this.south + this.north) * 0.5);
        }
        result.longitude = (this.west + this.east) * 0.5;
        result.latitude = (this.south + this.north) * 0.5;
        result.height = 0.0;
        return result;
    };

    /**
     * Computes the intersection of this extent with the provided extent.
     * @memberof Extent
     *
     * @param otherExtent The extent to intersect with this extent.
     * @param {Extent} [result] The object onto which to store the result.
     * @return {Extent} The modified result parameter or a new Extent instance if none was provided.
     *
     * @exception {DeveloperError} otherExtent is required.
     */
    Extent.prototype.intersectWith = function(otherExtent, result) {
        if (typeof otherExtent === 'undefined') {
            throw new DeveloperError('otherExtent is required.');
        }
        var west = Math.max(this.west, otherExtent.west);
        var south = Math.max(this.south, otherExtent.south);
        var east = Math.min(this.east, otherExtent.east);
        var north = Math.min(this.north, otherExtent.north);
        if (typeof result === 'undefined') {
            return new Extent(west, south, east, north);
        }
        result.west = west;
        result.south = south;
        result.east = east;
        result.north = north;
        return result;
    };

    /**
     * Returns true if the provided cartographic is on or inside the extent, false otherwise.
     * @memberof Extent
     *
     * @param {Cartographic} cartographic The cartographic to test.
     * @returns {Boolean} true if the provided cartographic is inside the extent, false otherwise.
     *
     * @exception {DeveloperError} cartographic is required.
     */
    Extent.prototype.contains = function(cartographic) {
        if (typeof cartographic === 'undefined') {
            throw new DeveloperError('cartographic is required.');
        }
        return cartographic.longitude >= this.west &&
               cartographic.longitude <= this.east &&
               cartographic.latitude >= this.south &&
               cartographic.latitude <= this.north;
    };

    /**
     * Determines if the extent is empty, i.e., if <code>west >= east</code>
     * or <code>south >= north</code>.
     *
     * @memberof Extent
     *
     * @return {Boolean} True if the extent is empty; otherwise, false.
     */
    Extent.prototype.isEmpty = function() {
        return this.west >= this.east || this.south >= this.north;
    };

    var subsampleLlaScratch = new Cartographic();
    /**
     * Samples this Extent so that it includes a list of Cartesian points suitable for passing to
     * {@link BoundingSphere#fromPoints}.  Sampling is necessary to account
     * for extents that cover the poles or cross the equator.
     *
     * @param {Ellipsoid} [ellipsoid=Ellipsoid.WGS84] The ellipsoid to use.
     * @param {Array} [result] The array of Cartesians onto which to store the result.
     * @return {Array} The modified result parameter or a new Array of Cartesians instances if none was provided.
     */
    Extent.prototype.subsample = function(ellipsoid, result) {
        ellipsoid = defaultValue(ellipsoid, Ellipsoid.WGS84);

        if (typeof result === 'undefined') {
            result = [];
        }
        var length = 0;

        var north = this.north;
        var south = this.south;
        var east = this.east;
        var west = this.west;

        var lla = subsampleLlaScratch;
        lla.longitude = west;
        lla.latitude = north;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.longitude = east;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.latitude = south;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        lla.longitude = west;
        result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
        length++;

        if (north < 0.0) {
            lla.latitude = north;
        } else if (south > 0.0) {
            lla.latitude = south;
        } else {
            lla.latitude = 0.0;
        }

        for ( var i = 1; i < 8; ++i) {
            var temp = -Math.PI + i * CesiumMath.PI_OVER_TWO;
            if (west < temp && temp < east) {
                lla.longitude = temp;
                result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
                length++;
            }
        }

        if (lla.latitude === 0.0) {
            lla.longitude = west;
            result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
            length++;
            lla.longitude = east;
            result[length] = ellipsoid.cartographicToCartesian(lla, result[length]);
            length++;
        }
        result.length = length;
        return result;
    };

    /**
     * The largest possible extent.
     * @memberof Extent
     * @type Extent
    */
    Extent.MAX_VALUE = freezeObject(new Extent(-Math.PI, -CesiumMath.PI_OVER_TWO, Math.PI, CesiumMath.PI_OVER_TWO));

    return Extent;
});
/*global define*/
define('Core/HeightmapTessellator',[
        './defaultValue',
        './freezeObject',
        './DeveloperError',
        './Cartesian3',
        './Ellipsoid',
        './Math'
    ], function(
        defaultValue,
        freezeObject,
        DeveloperError,
        Cartesian3,
        Ellipsoid,
        CesiumMath) {
    

    /**
     * Contains functions to create a mesh from a heightmap image.
     *
     * @exports HeightmapTessellator
     *
     * @see ExtentTessellator
     * @see CubeMapEllipsoidTessellator
     * @see BoxTessellator
     * @see PlaneTessellator
     */
    var HeightmapTessellator = {};

    /**
     * The default structure of a heightmap, as given to {@link HeightmapTessellator.computeVertices}.
     *
     * @memberof HeightmapTessellator
     */
    HeightmapTessellator.DEFAULT_STRUCTURE = freezeObject({
            heightScale : 1.0,
            heightOffset : 0.0,
            elementsPerHeight : 1,
            stride : 1,
            elementMultiplier : 256.0,
            isBigEndian : false
        });

    /**
     * Fills an array of vertices from a heightmap image.  On return, the vertex data is in the order
     * [X, Y, Z, H, U, V], where X, Y, and Z represent the Cartesian position of the vertex, H is the
     * height above the ellipsoid, and U and V are the texture coordinates.
     *
     * @memberof HeightmapTessellator
     *
     * @param {Array|Float32Array} description.vertices The array to use to store computed vertices.
     *                             If description.skirtHeight is 0.0, the array should have
     *                             description.width * description.height * 6 elements.  If
     *                             description.skirtHeight is greater than 0.0, the array should
     *                             have (description.width + 2) * (description.height * 2) * 6
     *                             elements.
     * @param {TypedArray} description.heightmap The heightmap to tessellate.
     * @param {Number} description.width The width of the heightmap, in height samples.
     * @param {Number} description.height The height of the heightmap, in height samples.
     * @param {Number} description.skirtHeight The height of skirts to drape at the edges of the heightmap.
     * @param {Extent} description.nativeExtent An extent in the native coordinates of the heightmap's projection.  For
     *                 a heightmap with a geographic projection, this is degrees.  For the web mercator
     *                 projection, this is meters.
     * @param {Extent} [description.extent] The extent covered by the heightmap, in geodetic coordinates with north, south, east and
     *                 west properties in radians.  Either extent or nativeExtent must be provided.  If both
     *                 are provided, they're assumed to be consistent.
     * @param {Boolean} [description.isGeographic=true] True if the heightmap uses a {@link GeographicProjection}, or false if it uses
     *                  a {@link WebMercatorProjection}.
     * @param {Cartesian3} [description.relativetoCenter=Cartesian3.ZERO] The positions will be computed as <code>worldPosition.subtract(relativeToCenter)</code>.
     * @param {Ellipsoid} [description.ellipsoid=Ellipsoid.WGS84] The ellipsoid to which the heightmap applies.
     * @param {Object} [description.structure] An object describing the structure of the height data.
     * @param {Number} [description.structure.heightScale=1.0] The factor by which to multiply height samples in order to obtain
     *                 the height above the heightOffset, in meters.  The heightOffset is added to the resulting
     *                 height after multiplying by the scale.
     * @param {Number} [description.structure.heightOffset=0.0] The offset to add to the scaled height to obtain the final
     *                 height in meters.  The offset is added after the height sample is multiplied by the
     *                 heightScale.
     * @param {Number} [description.structure.elementsPerHeight=1] The number of elements in the buffer that make up a single height
     *                 sample.  This is usually 1, indicating that each element is a separate height sample.  If
     *                 it is greater than 1, that number of elements together form the height sample, which is
     *                 computed according to the structure.elementMultiplier and structure.isBigEndian properties.
     * @param {Number} [description.structure.stride=1] The number of elements to skip to get from the first element of
     *                 one height to the first element of the next height.
     * @param {Number} [description.structure.elementMultiplier=256.0] The multiplier used to compute the height value when the
     *                 stride property is greater than 1.  For example, if the stride is 4 and the strideMultiplier
     *                 is 256, the height is computed as follows:
     *                 `height = buffer[index] + buffer[index + 1] * 256 + buffer[index + 2] * 256 * 256 + buffer[index + 3] * 256 * 256 * 256`
     *                 This is assuming that the isBigEndian property is false.  If it is true, the order of the
     *                 elements is reversed.
     * @param {Boolean} [description.structure.isBigEndian=false] Indicates endianness of the elements in the buffer when the
     *                  stride property is greater than 1.  If this property is false, the first element is the
     *                  low-order element.  If it is true, the first element is the high-order element.
     *
     * @example
     * var width = 5;
     * var height = 5;
     * var vertices = new Float32Array(width * height * 6);
     * var description = ;
     * HeightmapTessellator.computeVertices({
     *     vertices : vertices,
     *     heightmap : [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0],
     *     width : width,
     *     height : height,
     *     skirtHeight : 0.0,
     *     nativeExtent : {
     *         west : 10.0,
     *         east : 20.0,
     *         south : 30.0,
     *         north : 40.0
     *     }
     * });
     */
    HeightmapTessellator.computeVertices = function(description) {
        if (typeof description === 'undefined' || typeof description.heightmap === 'undefined') {
            throw new DeveloperError('description.heightmap is required.');
        }

        if (typeof description.width === 'undefined' || typeof description.height === 'undefined') {
            throw new DeveloperError('description.width and description.height are required.');
        }

        if (typeof description.vertices === 'undefined') {
            throw new DeveloperError('description.vertices is required.');
        }

        if (typeof description.nativeExtent === 'undefined') {
            throw new DeveloperError('description.nativeExtent is required.');
        }

        if (typeof description.skirtHeight === 'undefined') {
            throw new DeveloperError('description.skirtHeight is required.');
        }

        // This function tends to be a performance hotspot for terrain rendering,
        // so it employs a lot of inlining and unrolling as an optimization.
        // In particular, the functionality of Ellipsoid.cartographicToCartesian
        // is inlined.

        var cos = Math.cos;
        var sin = Math.sin;
        var sqrt = Math.sqrt;
        var atan = Math.atan;
        var exp = Math.exp;
        var piOverTwo = CesiumMath.PI_OVER_TWO;
        var toRadians = CesiumMath.toRadians;

        var vertices = description.vertices;
        var heightmap = description.heightmap;
        var width = description.width;
        var height = description.height;
        var skirtHeight = description.skirtHeight;

        var isGeographic = defaultValue(description.isGeographic, true);
        var ellipsoid = defaultValue(description.ellipsoid, Ellipsoid.WGS84);

        var oneOverCentralBodySemimajorAxis = 1.0 / ellipsoid.getMaximumRadius();

        var nativeExtent = description.nativeExtent;

        var geographicWest;
        var geographicSouth;
        var geographicEast;
        var geographicNorth;

        var extent = description.extent;
        if (typeof extent === 'undefined') {
            if (isGeographic) {
                geographicWest = toRadians(nativeExtent.west);
                geographicSouth = toRadians(nativeExtent.south);
                geographicEast = toRadians(nativeExtent.east);
                geographicNorth = toRadians(nativeExtent.north);
            } else {
                geographicWest = nativeExtent.west * oneOverCentralBodySemimajorAxis;
                geographicSouth = piOverTwo - (2.0 * atan(exp(-nativeExtent.south * oneOverCentralBodySemimajorAxis)));
                geographicEast = nativeExtent.east * oneOverCentralBodySemimajorAxis;
                geographicNorth = piOverTwo - (2.0 * atan(exp(-nativeExtent.north * oneOverCentralBodySemimajorAxis)));
            }
        } else {
            geographicWest = extent.west;
            geographicSouth = extent.south;
            geographicEast = extent.east;
            geographicNorth = extent.north;
        }

        var relativeToCenter = defaultValue(description.relativeToCenter, Cartesian3.ZERO);

        var structure = defaultValue(description.structure, HeightmapTessellator.DEFAULT_STRUCTURE);
        var heightScale = defaultValue(structure.heightScale, HeightmapTessellator.DEFAULT_STRUCTURE.heightScale);
        var heightOffset = defaultValue(structure.heightOffset, HeightmapTessellator.DEFAULT_STRUCTURE.heightOffset);
        var elementsPerHeight = defaultValue(structure.elementsPerHeight, HeightmapTessellator.DEFAULT_STRUCTURE.elementsPerHeight);
        var stride = defaultValue(structure.stride, HeightmapTessellator.DEFAULT_STRUCTURE.stride);
        var elementMultiplier = defaultValue(structure.elementMultiplier, HeightmapTessellator.DEFAULT_STRUCTURE.elementMultiplier);
        var isBigEndian = defaultValue(structure.isBigEndian, HeightmapTessellator.DEFAULT_STRUCTURE.isBigEndian);

        var granularityX = (nativeExtent.east - nativeExtent.west) / (width - 1);
        var granularityY = (nativeExtent.north - nativeExtent.south) / (height - 1);

        var radiiSquared = ellipsoid.getRadiiSquared();
        var radiiSquaredX = radiiSquared.x;
        var radiiSquaredY = radiiSquared.y;
        var radiiSquaredZ = radiiSquared.z;

        var vertexArrayIndex = 0;

        var minimumHeight = 65536.0;
        var maximumHeight = -65536.0;

        var startRow = 0;
        var endRow = height;
        var startCol = 0;
        var endCol = width;

        if (skirtHeight > 0) {
            --startRow;
            ++endRow;
            --startCol;
            ++endCol;
        }

        for ( var rowIndex = startRow; rowIndex < endRow; ++rowIndex) {
            var row = rowIndex;
            if (row < 0) {
                row = 0;
            }
            if (row >= height) {
                row = height - 1;
            }

            var latitude = nativeExtent.north - granularityY * row;

            if (!isGeographic) {
                latitude = piOverTwo - (2.0 * atan(exp(-latitude * oneOverCentralBodySemimajorAxis)));
            } else {
                latitude = toRadians(latitude);
            }

            var cosLatitude = cos(latitude);
            var nZ = sin(latitude);
            var kZ = radiiSquaredZ * nZ;

            var v = (latitude - geographicSouth) / (geographicNorth - geographicSouth);

            for ( var colIndex = startCol; colIndex < endCol; ++colIndex) {
                var col = colIndex;
                if (col < 0) {
                    col = 0;
                }
                if (col >= width) {
                    col = width - 1;
                }

                var longitude = nativeExtent.west + granularityX * col;

                if (!isGeographic) {
                    longitude = longitude * oneOverCentralBodySemimajorAxis;
                } else {
                    longitude = toRadians(longitude);
                }

                var terrainOffset = row * (width * stride) + col * stride;

                var heightSample;
                if (elementsPerHeight === 1) {
                    heightSample = heightmap[terrainOffset];
                } else {
                    heightSample = 0;

                    var elementOffset;
                    if (isBigEndian) {
                        for (elementOffset = 0; elementOffset < elementsPerHeight; ++elementOffset) {
                            heightSample = (heightSample * elementMultiplier) + heightmap[terrainOffset + elementOffset];
                        }
                    } else {
                        for (elementOffset = elementsPerHeight - 1; elementOffset >= 0; --elementOffset) {
                            heightSample = (heightSample * elementMultiplier) + heightmap[terrainOffset + elementOffset];
                        }
                    }
                }

                heightSample = heightSample * heightScale + heightOffset;

                maximumHeight = Math.max(maximumHeight, heightSample);
                minimumHeight = Math.min(minimumHeight, heightSample);

                if (colIndex !== col || rowIndex !== row) {
                    heightSample -= skirtHeight;
                }

                var nX = cosLatitude * cos(longitude);
                var nY = cosLatitude * sin(longitude);

                var kX = radiiSquaredX * nX;
                var kY = radiiSquaredY * nY;

                var gamma = sqrt((kX * nX) + (kY * nY) + (kZ * nZ));
                var oneOverGamma = 1.0 / gamma;

                var rSurfaceX = kX * oneOverGamma;
                var rSurfaceY = kY * oneOverGamma;
                var rSurfaceZ = kZ * oneOverGamma;

                vertices[vertexArrayIndex++] = rSurfaceX + nX * heightSample - relativeToCenter.x;
                vertices[vertexArrayIndex++] = rSurfaceY + nY * heightSample - relativeToCenter.y;
                vertices[vertexArrayIndex++] = rSurfaceZ + nZ * heightSample - relativeToCenter.z;

                vertices[vertexArrayIndex++] = heightSample;

                var u = (longitude - geographicWest) / (geographicEast - geographicWest);

                vertices[vertexArrayIndex++] = u;
                vertices[vertexArrayIndex++] = v;
            }
        }

        return {
            maximumHeight : maximumHeight,
            minimumHeight : minimumHeight
        };
    };

    return HeightmapTessellator;
});

/*global define*/
define('Workers/createTaskProcessorWorker',[],function() {
    

    /**
     * Creates an adapter function to allow a calculation function to operate as a Web Worker,
     * paired with TaskProcessor, to receive tasks and return results.
     *
     * @exports createTaskProcessorWorker
     *
     * @param {Function} workerFunction A function that takes as input two arguments:
     * a parameters object, and an array into which transferable result objects can be pushed,
     * and returns as output a result object.
     * @returns {Function} An adapter function that handles the interaction with TaskProcessor,
     * specifically, task ID management and posting a response message containing the result.
     *
     * @example
     * function doCalculation(parameters, transferableObjects) {
     *   // calculate some result using the inputs in parameters
     *   return result;
     * }
     *
     * return createTaskProcessorWorker(doCalculation);
     * // the resulting function is compatible with TaskProcessor
     *
     * @see TaskProcessor
     * @see <a href='http://www.w3.org/TR/workers/'>Web Workers</a>
     * @see <a href='http://www.w3.org/TR/html5/common-dom-interfaces.html#transferable-objects'>Transferable objects</a>
     */
    var createTaskProcessorWorker = function(workerFunction) {
        var postMessage;
        var transferableObjects = [];
        var responseMessage = {
            id : undefined,
            result : undefined
        };

        return function(event) {
            /*global self*/
            var data = event.data;

            responseMessage.id = data.id;
            transferableObjects.length = 0;
            responseMessage.result = workerFunction(data.parameters, transferableObjects);

            if (typeof postMessage === 'undefined') {
                postMessage = typeof self.webkitPostMessage !== 'undefined' ? self.webkitPostMessage : self.postMessage;
            }

            postMessage(responseMessage, transferableObjects);
        };
    };

    return createTaskProcessorWorker;
});
/*global define*/
define('Workers/createVerticesFromHeightmap',[
        '../Core/BoundingSphere',
        '../Core/Ellipsoid',
        '../Core/EllipsoidalOccluder',
        '../Core/Extent',
        '../Core/HeightmapTessellator',
        './createTaskProcessorWorker'
    ], function(
        BoundingSphere,
        Ellipsoid,
        EllipsoidalOccluder,
        Extent,
        HeightmapTessellator,
        createTaskProcessorWorker) {
    

    function createVerticesFromHeightmap(parameters, transferableObjects) {
        var numberOfAttributes = 6;

        var arrayWidth = parameters.width;
        var arrayHeight = parameters.height;

        if (parameters.skirtHeight > 0.0) {
            arrayWidth += 2;
            arrayHeight += 2;
        }

        var vertices = new Float32Array(arrayWidth * arrayHeight * numberOfAttributes);
        transferableObjects.push(vertices.buffer);

        parameters.ellipsoid = Ellipsoid.clone(parameters.ellipsoid);
        parameters.extent = Extent.clone(parameters.extent);

        parameters.vertices = vertices;

        var statistics = HeightmapTessellator.computeVertices(parameters);
        var boundingSphere3D = BoundingSphere.fromVertices(vertices, parameters.relativeToCenter, numberOfAttributes);

        var ellipsoid = parameters.ellipsoid;
        var occluder = new EllipsoidalOccluder(ellipsoid);
        var occludeePointInScaledSpace = occluder.computeHorizonCullingPointFromVertices(parameters.relativeToCenter, vertices, numberOfAttributes, parameters.relativeToCenter);

        return {
            vertices : vertices.buffer,
            numberOfAttributes : numberOfAttributes,
            minimumHeight : statistics.minimumHeight,
            maximumHeight : statistics.maximumHeight,
            gridWidth : arrayWidth,
            gridHeight : arrayHeight,
            boundingSphere3D : boundingSphere3D,
            occludeePointInScaledSpace : occludeePointInScaledSpace
        };
    }

    return createTaskProcessorWorker(createVerticesFromHeightmap);
});
