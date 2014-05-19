/*global define*/
define([
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/TimeIntervalCollection',
        './Property'
    ], function(
        defined,
        defineProperties,
        DeveloperError,
        TimeIntervalCollection,
        Property) {
    "use strict";

    /**
     * A {@link Property} which is defined by a {@link TimeIntervalCollection}, where the
     * data property of each {@link TimeInterval} is another Property instance which is
     * evaluated at the provided time.
     *
     * @alias CompositeProperty
     * @constructor
     *
     * @see CompositeMaterialProperty
     * @see CompositePositionProperty
     *
     * @example
     * var constantProperty = ...;
     * var sampledProperty = ...;
     *
     * //Create a composite property from two previously defined properties
     * //where the property is valid on August 1st, 2012 and uses a constant
     * //property for the first half of the day and a sampled property for the
     * //remaining half.
     * var composite = new CompositeProperty();
     * composite.intervals.addInterval(TimeInterval.fromIso8601('2012-08-01T00:00:00.00Z/2012-08-01T12:00:00.00Z', true, true, constantProperty));
     * composite.intervals.addInterval(TimeInterval.fromIso8601('2012-08-01T12:00:00.00Z/2012-08-02T00:00:00.00Z', false, false, sampledProperty));
     */
    var CompositeProperty = function() {
        this._intervals = new TimeIntervalCollection();
    };

    defineProperties(CompositeProperty.prototype, {
        /**
         * Gets the interval collection.
         * @memberof CompositeProperty.prototype
         *
         * @type {TimeIntervalCollection}
         */
        intervals : {
            get : function() {
                return this._intervals;
            }
        }
    });

    /**
     * Gets the value of the property at the provided time.
     * @memberof CompositeProperty
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied.
     *
     * @exception {DeveloperError} time is required.
     */
    CompositeProperty.prototype.getValue = function(time, result) {
        if (!defined(time)) {
            throw new DeveloperError('time is required');
        }

        var innerProperty = this._intervals.findDataForIntervalContainingDate(time);
        if (defined(innerProperty)) {
            return innerProperty.getValue(time, result);
        }
        return undefined;
    };

    /**
     * Compares this property to the provided property and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     * @memberof CompositeProperty
     *
     * @param {Property} [other] The other property.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    CompositeProperty.prototype.equals = function(other) {
        return this === other || //
               (other instanceof CompositeProperty && //
                this._intervals.equals(other._intervals, Property.equals));
    };

    return CompositeProperty;
});