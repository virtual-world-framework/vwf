/*global define*/
define([
        './DeveloperError'
    ], function(
        DeveloperError) {
    "use strict";

    /**
     * Static interface for types which can store their values as packed
     * elements in an array.  These methods and properties are expected to be
     * defined on a constructor function.
     *
     * @namespace
     * @alias Packable
     *
     * @see PackableForInterpolation
     */
    var Packable = {
        /**
         * The number of elements used to pack the object into an array.
         * @type {Number}
         */
        packedLength : undefined,

        /**
         * Stores the provided instance into the provided array.
         * @function
         *
         * @param {Object} value The value to pack.
         * @param {Number[]} array The array to pack into.
         * @param {Number} [startingIndex=0] The index into the array at which to start packing the elements.
         */
        pack : DeveloperError.throwInstantiationError,

        /**
         * Retrieves an instance from a packed array.
         * @function
         *
         * @param {Number[]} array The packed array.
         * @param {Number} [startingIndex=0] The starting index of the element to be unpacked.
         * @param {Object} [result] The object into which to store the result.
         */
        unpack : DeveloperError.throwInstantiationError
    };

    return Packable;
});