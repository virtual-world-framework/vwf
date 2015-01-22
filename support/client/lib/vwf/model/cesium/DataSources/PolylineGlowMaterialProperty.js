/*global define*/
define([
        '../Core/Color',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/Event',
        './createPropertyDescriptor',
        './Property'
    ], function(
        Color,
        defined,
        defineProperties,
        Event,
        createPropertyDescriptor,
        Property) {
    "use strict";

    var defaultColor = Color.WHITE;
    var defaultGlowPower = 0.25;

    /**
     * A {@link MaterialProperty} that maps to polyline glow {@link Material} uniforms.
     * @alias PolylineGlowProperty
     * @constructor
     */
    var PolylineGlowProperty = function() {
        this._definitionChanged = new Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this._glowPower = undefined;
        this._glowPowerSubscription = undefined;
    };

    defineProperties(PolylineGlowProperty.prototype, {
        /**
         * Gets a value indicating if this property is constant.  A property is considered
         * constant if getValue always returns the same result for the current definition.
         * @memberof PolylineGlowProperty.prototype
         * @type {Boolean}
         * @readonly
         */
        isConstant : {
            get : function() {
                return Property.isConstant(this._color) && Property.isConstant(this._glow);
            }
        },
        /**
         * Gets the event that is raised whenever the definition of this property changes.
         * The definition is considered to have changed if a call to getValue would return
         * a different result for the same time.
         * @memberof PolylineGlowProperty.prototype
         * @type {Event}
         * @readonly
         */
        definitionChanged : {
            get : function() {
                return this._definitionChanged;
            }
        },
        /**
         * A {@link Color} {@link Property} which determines the line's color.
         * @memberof PolylineGlowProperty.prototype
         * @type {Property}
         */
        color : createPropertyDescriptor('color'),
        /**
         * A numeric {@link Property} which determines the strength of the glow, as a percentage of the total line width (less than 1.0).
         * @memberof PolylineGlowProperty.prototype
         * @type {Property}
         */
        glowPower : createPropertyDescriptor('glowPower')
    });

    /**
     * Gets the {@link Material} type at the provided time.
     *
     * @param {JulianDate} time The time for which to retrieve the type.
     * @returns {String} The type of material.
     */
    PolylineGlowProperty.prototype.getType = function(time) {
        return 'PolylineGlow';
    };

    /**
     * Gets the value of the property at the provided time.
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied.
     */
    PolylineGlowProperty.prototype.getValue = function(time, result) {
        if (!defined(result)) {
            result = {};
        }
        result.color = Property.getValueOrClonedDefault(this._color, time, defaultColor, result.color);
        result.glowPower = Property.getValueOrDefault(this._glowPower, time, defaultGlowPower, result.glowPower);
        return result;
    };

    /**
     * Compares this property to the provided property and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Property} [other] The other property.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    PolylineGlowProperty.prototype.equals = function(other) {
        return this === other || //
               (other instanceof PolylineGlowProperty && //
                Property.equals(this._color, other._color) &&
                Property.equals(this._glowPower, other._glowPower));
    };

    /**
     * @private
     */
    PolylineGlowProperty.prototype._raiseDefinitionChanged = function() {
        this._definitionChanged.raiseEvent(this);
    };

    return PolylineGlowProperty;
});
