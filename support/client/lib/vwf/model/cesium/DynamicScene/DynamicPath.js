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
     * A time-dynamic path representing the visualization of a moving object.
     * @alias DynamicPath
     * @constructor
     */
    var DynamicPath = function() {
        this._color = undefined;
        this._outlineColor = undefined;
        this._outlineWidth = undefined;
        this._show = undefined;
        this._width = undefined;
        this._resolution = undefined;
        this._leadTime = undefined;
        this._trailTime = undefined;
        this._propertyChanged = new Event();
    };

    defineProperties(DynamicPath.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof DynamicPath.prototype
         * @type {Event}
         */
        propertyChanged : {
            get : function() {
                return this._propertyChanged;
            }
        },

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the the path's color.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        color : createDynamicPropertyDescriptor('color', '_color'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the the path's outline color.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        outlineColor : createDynamicPropertyDescriptor('outlineColor', '_outlineColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the path's outline width.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        outlineWidth : createDynamicPropertyDescriptor('outlineWidth', '_outlineWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the path's visibility.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        show : createDynamicPropertyDescriptor('show', '_show'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the path's width.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        width : createDynamicPropertyDescriptor('width', '_width'),

        /**
         * Gets or sets the numeric {@link Property} specifying the maximum step size, in seconds, to take when sampling the position.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        resolution : createDynamicPropertyDescriptor('resolution', '_resolution'),

        /**
         * Gets or sets the numeric {@link Property} specifying the number of seconds in front of the object to show.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        leadTime : createDynamicPropertyDescriptor('leadTime', '_leadTime'),

        /**
         * Gets or sets the numeric {@link Property} specifying the number of seconds behind the object to show.
         * @memberof DynamicPath.prototype
         * @type {Property}
         */
        trailTime : createDynamicPropertyDescriptor('trailTime', '_trailTime')
    });

    /**
     * Duplicates a DynamicPath instance.
     * @memberof DynamicPath
     *
     * @param {DynamicPath} [result] The object onto which to store the result.
     * @returns {DynamicPath} The modified result parameter or a new instance if one was not provided.
     */
    DynamicPath.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new DynamicPath();
        }
        result.color = this.color;
        result.width = this.width;
        result.resolution = this.resolution;
        result.outlineColor = this.outlineColor;
        result.outlineWidth = this.outlineWidth;
        result.show = this.show;
        result.leadTime = this.leadTime;
        result.trailTime = this.trailTime;
        return result;
    };

    /**
     * Assigns each unassigned property on this object to the value
     * of the same property on the provided source object.
     * @memberof DynamicPath
     *
     * @param {DynamicPath} source The object to be merged into this object.
     * @exception {DeveloperError} source is required.
     */
    DynamicPath.prototype.merge = function(source) {
        if (!defined(source)) {
            throw new DeveloperError('source is required.');
        }
        this.color = defaultValue(this.color, source.color);
        this.width = defaultValue(this.width, source.width);
        this.resolution = defaultValue(this.resolution, source.resolution);
        this.outlineColor = defaultValue(this.outlineColor, source.outlineColor);
        this.outlineWidth = defaultValue(this.outlineWidth, source.outlineWidth);
        this.show = defaultValue(this.show, source.show);
        this.leadTime = defaultValue(this.leadTime, source.leadTime);
        this.trailTime = defaultValue(this.trailTime, source.trailTime);
    };

    return DynamicPath;
});
