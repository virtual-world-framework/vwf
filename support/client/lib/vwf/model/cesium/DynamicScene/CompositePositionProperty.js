/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Event',
        '../Core/ReferenceFrame',
        './CompositeProperty',
        './Property'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        ReferenceFrame,
        CompositeProperty,
        Property) {
    "use strict";

    /**
     * A {@link CompositeProperty} which is also a {@link PositionProperty}.
     *
     * @alias CompositePositionProperty
     * @constructor
     */
    var CompositePositionProperty = function(referenceFrame) {
        this._referenceFrame = defaultValue(referenceFrame, ReferenceFrame.FIXED);
        this._definitionChanged = new Event();
        this._composite = new CompositeProperty();
        this._composite.definitionChanged.addEventListener(CompositePositionProperty.prototype._raiseDefinitionChanged, this);
    };

    defineProperties(CompositePositionProperty.prototype, {
        /**
         * Gets a value indicating if this property is constant.  A property is considered
         * constant if getValue always returns the same result for the current definition.
         * @memberof CompositePositionProperty.prototype
         *
         * @type {Boolean}
         * @readonly
         */
        isConstant : {
            get : function() {
                return this._composite.isConstant;
            }
        },
        /**
         * Gets the event that is raised whenever the definition of this property changes.
         * The definition is changed whenever setValue is called with data different
         * than the current value.
         * @memberof CompositePositionProperty.prototype
         *
         * @type {Event}
         * @readonly
         */
        definitionChanged : {
            get : function() {
                return this._definitionChanged;
            }
        },
        /**
         * Gets the interval collection.
         * @memberof CompositePositionProperty.prototype
         *
         * @type {TimeIntervalCollection}
         */
        intervals : {
            get : function() {
                return this._composite.intervals;
            }
        },
        /**
         * Gets or sets the reference frame which this position presents itself as.
         * Each PositionProperty making up this object has it's own reference frame,
         * so this property merely exposes a "preferred" reference frame for clients
         * to use.
         * @memberof CompositePositionProperty.prototype
         *
         * @type {ReferenceFrame}
         */
        referenceFrame : {
            get : function() {
                return this._referenceFrame;
            },
            set : function(value) {
                this._referenceFrame = value;
            }
        }
    });

    /**
     * Gets the value of the property at the provided time in the fixed frame.
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied.
     */
    CompositePositionProperty.prototype.getValue = function(time, result) {
        return this.getValueInReferenceFrame(time, ReferenceFrame.FIXED, result);
    };

    /**
     * Gets the value of the property at the provided time and in the provided reference frame.
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {ReferenceFrame} referenceFrame The desired referenceFrame of the result.
     * @param {Cartesian3} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Cartesian3} The modified result parameter or a new instance if the result parameter was not supplied.
     */
    CompositePositionProperty.prototype.getValueInReferenceFrame = function(time, referenceFrame, result) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }
        if (!defined(referenceFrame)) {
            throw new DeveloperError('referenceFrame is required.');
        }
        //>>includeEnd('debug');

        var innerProperty = this._composite._intervals.findDataForIntervalContainingDate(time);
        if (defined(innerProperty)) {
            return innerProperty.getValueInReferenceFrame(time, referenceFrame, result);
        }
        return undefined;
    };

    /**
     * Compares this property to the provided property and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Property} [other] The other property.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    CompositePositionProperty.prototype.equals = function(other) {
        return this === other || //
               (other instanceof CompositePositionProperty && //
                this._referenceFrame === other._referenceFrame && //
                this._composite.equals(other._composite, Property.equals));
    };

    /**
     * @private
     */
    CompositePositionProperty.prototype._raiseDefinitionChanged = function() {
        this._definitionChanged.raiseEvent(this);
    };

    return CompositePositionProperty;
});