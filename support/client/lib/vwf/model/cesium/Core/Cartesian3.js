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
     * @see Packable
     */
    var Cartesian3 = function(x, y, z) {
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
    };

    /**
     * Converts the provided Spherical into Cartesian3 coordinates.
     * @memberof Cartesian3
     *
     * @param {Spherical} spherical The Spherical to be converted to Cartesian3.
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} spherical is required.
     */
    Cartesian3.fromSpherical = function(spherical, result) {
        if (!defined(spherical)) {
            throw new DeveloperError('spherical is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
        if (!defined(values)) {
            throw new DeveloperError('values is required.');
        }

        if (offset + 3 > values.length) {
            throw new DeveloperError('offset + 3 is greater than the length of the array.');
        }

        offset = defaultValue(offset, 0);

        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.fromElements = function(x, y, z, result) {
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided. (Returns undefined if cartesian is undefined)
     */
    Cartesian3.clone = function(cartesian, result) {
        if (!defined(cartesian)) {
            return undefined;
        }

        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.fromCartesian4 = Cartesian3.clone;

    /**
     * The number of elements used to pack the object into an array.
     * @Type {Number}
     */
    Cartesian3.packedLength = 3;

    /**
     * Stores the provided instance into the provided array.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} value The value to pack.
     * @param {Array} array The array to pack into.
     * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
     *
     * @exception {DeveloperError} value is required.
     * @exception {DeveloperError} array is required.
     */
    Cartesian3.pack = function(value, array, startingIndex) {
        if (!defined(value)) {
            throw new DeveloperError('value is required');
        }

        if (!defined(array)) {
            throw new DeveloperError('array is required');
        }

        startingIndex = defaultValue(startingIndex, 0);

        array[startingIndex++] = value.x;
        array[startingIndex++] = value.y;
        array[startingIndex] = value.z;
    };

    /**
     * Retrieves an instance from a packed array.
     * @memberof Cartesian3
     *
     * @param {Array} array The packed array.
     * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
     * @param {Cartesian3} [result] The object into which to store the result.
     *
     * @exception {DeveloperError} array is required.
     */
    Cartesian3.unpack = function(array, startingIndex, result) {
        if (!defined(array)) {
            throw new DeveloperError('array is required');
        }

        startingIndex = defaultValue(startingIndex, 0);

        if (!defined(result)) {
            result = new Cartesian3();
        }
        result.x = array[startingIndex++];
        result.y = array[startingIndex++];
        result.z = array[startingIndex];
        return result;
    };

    /**
     * Computes the value of the maximum component for the supplied Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} The cartesian to use.
     * @returns {Number} The value of the maximum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.getMaximumComponent = function(cartesian) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        return Math.max(cartesian.x, cartesian.y, cartesian.z);
    };

    /**
     * Computes the value of the minimum component for the supplied Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} The cartesian to use.
     * @returns {Number} The value of the minimum component.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.getMinimumComponent = function(cartesian) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        return Math.min(cartesian.x, cartesian.y, cartesian.z);
    };

    /**
     * Computes the provided Cartesian's squared magnitude.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian instance whose squared magnitude is to be computed.
     * @returns {Number} The squared magnitude.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.magnitudeSquared = function(cartesian) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        return cartesian.x * cartesian.x + cartesian.y * cartesian.y + cartesian.z * cartesian.z;
    };

    /**
     * Computes the Cartesian's magnitude (length).
     * @memberof Cartesian3
     *
     * @param {Cartesian3} cartesian The Cartesian instance whose magnitude is to be computed.
     * @returns {Number} The magnitude.
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
     * @returns {Number} The distance between two points.
     *
     * @exception {DeveloperError} left and right are required.
     *
     * @example
     * // Returns 1.0
     * var d = Cartesian3.distance(new Cartesian3(1.0, 0.0, 0.0), new Cartesian3(2.0, 0.0, 0.0));
     */
    Cartesian3.distance = function(left, right) {
        if (!defined(left) || !defined(right)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.normalize = function(cartesian, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        var magnitude = Cartesian3.magnitude(cartesian);
        if (!defined(result)) {
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
     * @returns {Number} The dot product.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.dot = function(left, right) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.multiplyComponents = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.add = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.subtract = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
            throw new DeveloperError('right is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian3.multiplyByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     * @exception {DeveloperError} scalar is required and must be a number.
     */
    Cartesian3.divideByScalar = function(cartesian, scalar, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (typeof scalar !== 'number') {
            throw new DeveloperError('scalar is required and must be a number.');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.negate = function(cartesian, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.abs = function(cartesian, result) {
        if (!defined(cartesian)) {
            throw new DeveloperError('cartesian is required');
        }
        if (!defined(result)) {
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     *
     * @exception {DeveloperError} start is required.
     * @exception {DeveloperError} end is required.
     * @exception {DeveloperError} t is required and must be a number.
     */
    Cartesian3.lerp = function(start, end, t, result) {
        if (!defined(start)) {
            throw new DeveloperError('start is required.');
        }
        if (!defined(end)) {
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
     * @returns {Number} The angle between the Cartesians.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.angleBetween = function(left, right) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
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
     * @returns {Cartesian3} The most orthogonal axis.
     *
     * @exception {DeveloperError} cartesian is required.
     */
    Cartesian3.mostOrthogonalAxis = function(cartesian, result) {
        if (!defined(cartesian)) {
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
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Cartesian3.equals = function(left, right) {
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
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
     * @returns {Boolean} <code>true</code> if left and right are within the provided epsilon, <code>false</code> otherwise.
     *
     * @exception {DeveloperError} epsilon is required and must be a number.
     */
    Cartesian3.equalsEpsilon = function(left, right, epsilon) {
        if (typeof epsilon !== 'number') {
            throw new DeveloperError('epsilon is required and must be a number.');
        }
        return (left === right) ||
               ((defined(left)) &&
                (defined(right)) &&
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
     * @returns {Cartesian3} The cross product.
     *
     * @exception {DeveloperError} left is required.
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.cross = function(left, right, result) {
        if (!defined(left)) {
            throw new DeveloperError('left is required');
        }
        if (!defined(right)) {
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

        if (!defined(result)) {
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
     * @returns {Number} The value of the maximum component.
     */
    Cartesian3.prototype.getMaximumComponent = function() {
        return Cartesian3.getMaximumComponent(this);
    };

    /**
     * Computes the value of the minimum component for this Cartesian.
     * @memberof Cartesian3
     *
     * @returns {Number} The value of the minimum component.
     */
    Cartesian3.prototype.getMinimumComponent = function() {
        return Cartesian3.getMinimumComponent(this);
    };

    /**
     * Duplicates this Cartesian3 instance.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.clone = function(result) {
        return Cartesian3.clone(this, result);
    };

    /**
     * Computes this Cartesian's squared magnitude.
     * @memberof Cartesian3
     *
     * @returns {Number} The squared magnitude.
     */
    Cartesian3.prototype.magnitudeSquared = function() {
        return Cartesian3.magnitudeSquared(this);
    };

    /**
     * Computes this Cartesian's magnitude (length).
     * @memberof Cartesian3
     *
     * @returns {Number} The magnitude.
     */
    Cartesian3.prototype.magnitude = function() {
        return Cartesian3.magnitude(this);
    };

    /**
     * Computes the normalized form of this Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.normalize = function(result) {
        return Cartesian3.normalize(this, result);
    };

    /**
     * Computes the dot (scalar) product of this Cartesian and a supplied cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} right The right hand side Cartesian.
     * @returns {Number} The dot product.
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
     */
    Cartesian3.prototype.negate = function(result) {
        return Cartesian3.negate(this, result);
    };

    /**
     * Computes the absolute value of this Cartesian.
     * @memberof Cartesian3
     *
     * @param {Cartesian3} [result] The object onto which to store the result.
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
     * @returns {Cartesian3} The modified result parameter or a new Cartesian3 instance if one was not provided.
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
     * @returns {Number} The angle between the Cartesians.
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
     * @returns {Cartesian3} The most orthogonal axis.
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
     * @returns {Boolean} <code>true</code> if they are equal, <code>false</code> otherwise.
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
     * @returns {Boolean} <code>true</code> if they are within the provided epsilon, <code>false</code> otherwise.
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
     * @returns {String} A string representing this Cartesian in the format '(x, y, z)'.
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
     * @returns {Cartesian3} The cross product.
     *
     * @exception {DeveloperError} right is required.
     */
    Cartesian3.prototype.cross = function(right, result) {
        return Cartesian3.cross(this, right, result);
    };

    return Cartesian3;
});
