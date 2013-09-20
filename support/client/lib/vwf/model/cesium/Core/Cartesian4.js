/*global define*/
define([
        './defaultValue',
        './defined',
        './DeveloperError',
        './freezeObject'
    ], function(
        defaultValue,
        defined,
        DeveloperError,
        freezeObject) {
    "use strict";

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
     * @see Packable
     */
    var Cartesian4 = function(x, y, z, w) {
        /**
         * The X component.
         * @type {Number}
         * @default 0.0
         */
        this.x = defaultValue(x, 0.0);

        /**
         * The Y component.
         * @type {Number}
         * @default 0.0
         */
        this.y = defaultValue(y, 0.0);

        /**
         * The Z component.
         * @type {Number}
         * @default 0.0
         */
        this.z = defaultValue(z, 0.0);

        /**
         * The W component.
         * @type {Number}
         * @default 0.0
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
        if (!defined(values)) {
            throw new DeveloperError('values is required.');
        }

        if (offset + 4 > values.length) {
            throw new DeveloperError('offset + 4 is greater than the length of the array.');
        }

        offset = defaultValue(offset, 0);

        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.fromElements = function(x, y, z, w, result) {
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided. (Returns undefined if cartesian is undefined)
     */
    Cartesian4.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
            return undefined;
        }

        if (!defined(result)) {
            return new Cartesian4(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
        }

        result.x = cartesian.x;
        result.y = cartesian.y;
        result.z = cartesian.z;
        result.w = cartesian.w;
        return result;
    };


    /**
     * The number of elements used to pack the object into an array.
     * @Type {Number}
     */
    Cartesian4.packedLength = 4;

    /**
     * Stores the provided instance into the provided array.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} value The value to pack.
     * @param {Array} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @exception {DeveloperError} value is required.
     * @exception {DeveloperError} array is required.
     */
    Cartesian4.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
            throw new DeveloperError('value is required');
        }

        if (!defined(array)) {
            throw new DeveloperError('array is required');
        }

        startingIndex = defaultValue(startingIndex, 0);

        array[startingIndex++] = value.x;
        array[startingIndex++] = value.y;
        array[startingIndex++] = value.z;
        array[startingIndex] = value.w;
    };

    /**
     * Retrieves an instance from a packed array.
     * @memberof Cartesian4
     *
     * @param {Array} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Cartesian4} [result] The object into which to store the result.
     *
     * @exception {DeveloperError} array is required.
     */
    Cartesian4.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
            throw new DeveloperError('array is required');
        }

        startingIndex = defaultValue(startingIndex, 0);

        if (!defined(result)) {
            result = new Cartesian4();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex++];
        result.z = array[startingIndex++];
        result.w = array[startingIndex];
        return result;
    };

    /**
     * Computes the value of the maximum component for the supplied Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} The cartesian to use.
     * @returns {Number} The value of the maximum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.getMaximumComponent = function(cartesian) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        return Math.max(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    };

    /**
     * Computes the value of the minimum component for the supplied Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} The cartesian to use.
     * @returns {Number} The value of the minimum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.getMinimumComponent = function(cartesian) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        return Math.min(cartesian.x, cartesian.y, cartesian.z, cartesian.w);
    };

    /**
     * Computes the provided Cartesian's squared magnitude.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian instance whose squared magnitude is to be computed.
     * @returns {Number} The squared magnitude.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.magnitudeSquared = function(cartesian) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z + cartesian.w * cartesian.w;
    };

    /**
     * Computes the Cartesian's magnitude (length).
     * @memberof Cartesian4
     *
     * @param {Cartesian4} cartesian The Cartesian instance whose magnitude is to be computed.
     * @returns {Number} The magnitude.
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
     * @returns {Number} The distance between two points.
     *
     * @exception {DeveloperError} left and right are required.
     *
     * @example
     * // Returns 1.0
     * var d = Cartesian4.distance(new Cartesian4(1.0, 0.0, 0.0, 0.0), new Cartesian4(2.0, 0.0, 0.0, 0.0));
     */
    Cartesian4.distance = function(left, right) {
        if (!defined(left) || !defined(right)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.normalize = function(cartesian, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        var magnitude = Cartesian4.magnitude(cartesian);
        if (!defined(result)) {
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
     * @returns {Number} The dot product.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.dot = function(left, right) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.multiplyComponents = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.add = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian4.subtract = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian4.multiplyByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian4.divideByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.negate = function(cartesian, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.abs = function(cartesian, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     *
     * @exception {DeveloperError} start is required.
     * @exception {DeveloperError} end is required.
     * @exception {DeveloperError} t is required and must be a number.
     */
    Cartesian4.lerp = function(start, end, t, result) {
        if (!defined(start)) {
            throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
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
     * @returns {Cartesian4} The most orthogonal axis.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian4.mostOrthogonalAxis = function(cartesian, result) {
        if (!defined(cartesian)) {
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
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartesian4.equals = function(left, right) {
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
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
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartesian4.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number.');
        }
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
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
     * @returns {Number} The value of the maximum component.
     */
    Cartesian4.prototype.getMaximumComponent = function() {
        return Cartesian4.getMaximumComponent(this);
    };

    /**
     * Computes the value of the minimum component for this Cartesian.
     * @memberof Cartesian4
     *
     * @returns {Number} The value of the minimum component.
     */
    Cartesian4.prototype.getMinimumComponent = function() {
        return Cartesian4.getMinimumComponent(this);
    };

    /**
     * Duplicates this Cartesian4 instance.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.clone = function(result) {
        return Cartesian4.clone(this, result);
    };

    /**
     * Computes this Cartesian's squared magnitude.
     * @memberof Cartesian4
     *
     * @returns {Number} The squared magnitude.
     */
    Cartesian4.prototype.magnitudeSquared = function() {
        return Cartesian4.magnitudeSquared(this);
    };

    /**
     * Computes this Cartesian's magnitude (length).
     * @memberof Cartesian4
     *
     * @returns {Number} The magnitude.
     */
    Cartesian4.prototype.magnitude = function() {
        return Cartesian4.magnitude(this);
    };

    /**
     * Computes the normalized form of this Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.normalize = function(result) {
        return Cartesian4.normalize(this, result);
    };

    /**
     * Computes the dot (scalar) product of this Cartesian and a supplied cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} right The right hand side Cartesian.
     * @returns {Number} The dot product.
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
     */
    Cartesian4.prototype.negate = function(result) {
        return Cartesian4.negate(this, result);
    };

    /**
     * Computes the absolute value of this Cartesian.
     * @memberof Cartesian4
     *
     * @param {Cartesian4} [result] The object onto which to store the result.
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
     * @returns {Cartesian4} The modified result parameter or a new Cartesian4 instance if one was not provided.
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
     * @returns {Cartesian4} The most orthogonal axis.
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
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
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
     * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
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
     * @returns {String} A string representing the provided Cartesian in the format '(x, y)'.
     */
    Cartesian4.prototype.toString = function() {
        return '(' + this.x + ', ' + this.y + ', ' + this.z + ', ' + this.w + ')';
    };

    return Cartesian4;
});
