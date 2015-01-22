/*global define*/
define([
        '../Core/Color',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Event',
        './ConstantProperty',
        './createPropertyDescriptor',
        './Property'
    ], function(
        Color,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        ConstantProperty,
        createPropertyDescriptor,
        Property) {
    "use strict";

    /**
     * A {@link MaterialProperty} that maps to solid color {@link Material} uniforms.
     *
     * @param {Property} [color] The {@link Color} property to be used.
     *
     * @alias ColorMaterialProperty
     * @constructor
     */
    var ColorMaterialProperty = function(colorProperty) {
        this._definitionChanged = new Event();
        this._color = undefined;
        this._colorSubscription = undefined;
        this.color = colorProperty;
    };

    /**
     * Creates a new instance that represents a constant color.
     *
     * @param {Color} color The color.
     * @returns {ColorMaterialProperty} A new instance configured to represent the provided color.
     */
    ColorMaterialProperty.fromColor = function(color) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(color)) {
            throw new DeveloperError('color is required');
        }
        //>>includeEnd('debug');
        return new ColorMaterialProperty(new ConstantProperty(color));
    };

    defineProperties(ColorMaterialProperty.prototype, {
        /**
         * Gets a value indicating if this property is constant.  A property is considered
         * constant if getValue always returns the same result for the current definition.
         * @memberof ColorMaterialProperty.prototype
         *
         * @type {Boolean}
         * @readonly
         */
        isConstant : {
            get : function() {
                return Property.isConstant(this._color);
            }
        },
        /**
         * Gets the event that is raised whenever the definition of this property changes.
         * The definition is considered to have changed if a call to getValue would return
         * a different result for the same time.
         * @memberof ColorMaterialProperty.prototype
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
         * A {@link Color} {@link Property} which determines the material's color.
         * @memberof ColorMaterialProperty.prototype
         * @type {Property}
         */
        color : createPropertyDescriptor('color')
    });

    /**
     * Gets the {@link Material} type at the provided time.
     *
     * @param {JulianDate} time The time for which to retrieve the type.
     * @returns {String} The type of material.
     */
    ColorMaterialProperty.prototype.getType = function(time) {
        return 'Color';
    };

    /**
     * Gets the value of the property at the provided time.
     *
     * @param {JulianDate} time The time for which to retrieve the value.
     * @param {Object} [result] The object to store the value into, if omitted, a new instance is created and returned.
     * @returns {Object} The modified result parameter or a new instance if the result parameter was not supplied.
     */
    ColorMaterialProperty.prototype.getValue = function(time, result) {
        if (!defined(result)) {
            result = {};
        }
        result.color = Property.getValueOrClonedDefault(this._color, time, Color.WHITE, result.color);
        return result;
    };

    /**
     * Compares this property to the provided property and returns
     * <code>true</code> if they are equal, <code>false</code> otherwise.
     *
     * @param {Property} [other] The other property.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    ColorMaterialProperty.prototype.equals = function(other) {
        return this === other || //
               (other instanceof ColorMaterialProperty && //
                Property.equals(this._color, other._color));
    };

    /**
     * @private
     */
    ColorMaterialProperty.prototype._raiseDefinitionChanged = function() {
        this._definitionChanged.raiseEvent(this);
    };

    return ColorMaterialProperty;
});
