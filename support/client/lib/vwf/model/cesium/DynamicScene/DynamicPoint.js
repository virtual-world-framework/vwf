/*global define*/
define(['../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Event',
        './createDynamicPropertyDescriptor'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        createDynamicPropertyDescriptor) {
    "use strict";

    /**
     * An optionally time-dynamic billboard.
     * @alias DynamicPoint
     * @constructor
     */
    var DynamicPoint = function() {
        this._color = undefined;
        this._pixelSize = undefined;
        this._outlineColor = undefined;
        this._outlineWidth = undefined;
        this._show = undefined;
        this._scaleByDistance = undefined;
        this._propertyChanged = new Event();
    };

    defineProperties(DynamicPoint.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof DynamicPoint.prototype
         * @type {Event}
         */
        propertyChanged : {
            get : function() {
                return this._propertyChanged;
            }
        },

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the the point's color.
         * @memberof DynamicPoint.prototype
         * @type {Property}
         */
        color : createDynamicPropertyDescriptor('color', '_color'),

        /**
         * Gets or sets the numeric {@link Property} specifying the point's size in pixels.
         * @memberof DynamicPoint.prototype
         * @type {Property}
         */
        pixelSize : createDynamicPropertyDescriptor('pixelSize', '_pixelSize'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the the point's outline color.
         * @memberof DynamicPoint.prototype
         * @type {Property}
         */
        outlineColor : createDynamicPropertyDescriptor('outlineColor', '_outlineColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the point's outline width.
         * @memberof DynamicPoint.prototype
         * @type {Property}
         */
        outlineWidth : createDynamicPropertyDescriptor('outlineWidth', '_outlineWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the point's visibility.
         * @memberof DynamicPoint.prototype
         * @type {Property}
         */
        show : createDynamicPropertyDescriptor('show', '_show'),

        /**
         * Gets or sets the {@link NearFarScalar} {@link Property} used to scale billboards based on distance.
         * If undefined, a constant size is used.
         * @memberof DynamicBillboard.prototype
         * @type {Property}
         */
        scaleByDistance : createDynamicPropertyDescriptor('scaleByDistance', '_scaleByDistance')
    });

    /**
     * Duplicates a DynamicPoint instance.
     * @memberof DynamicPoint
     *
     * @param {DynamicPoint} [result] The object onto which to store the result.
     * @returns {DynamicPoint} The modified result parameter or a new instance if one was not provided.
     */
    DynamicPoint.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new DynamicPoint();
        }
        result.color = this.color;
        result.pixelSize = this.pixelSize;
        result.outlineColor = this.outlineColor;
        result.outlineWidth = this.outlineWidth;
        result.show = this.show;
        result.scaleByDistance = this.scaleByDistance;
        return result;
    };

    /**
     * Assigns each unassigned property on this object to the value
     * of the same property on the provided source object.
     * @memberof DynamicPoint
     *
     * @param {DynamicPoint} source The object to be merged into this object.
     * @exception {DeveloperError} source is required.
     */
    DynamicPoint.prototype.merge = function(source) {
        if (!defined(source)) {
            throw new DeveloperError('source is required.');
        }
        this.color = defaultValue(this.color, source.color);
        this.pixelSize = defaultValue(this.pixelSize, source.pixelSize);
        this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
        this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
        this.show = defaultValue(this.show, source.show);
        this.scaleByDistance = defaultValue(this.scaleByDistance, source.scaleByDistance);
    };

    return DynamicPoint;
});
