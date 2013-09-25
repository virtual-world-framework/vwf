/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../ThirdParty/knockout'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        knockout) {
    "use strict";

    /**
     * A view model which exposes the properties of a toggle button.
     * @alias ToggleButtonViewModel
     * @constructor
     *
     * @param {Command} command The command which will be executed when the button is toggled.
     * @param {Object} [options] Options defining the button's properties.
     * @param {Boolean|Observable} [options.toggled=false] A boolean, or observable, indicating whether the button should be initially toggled.
     * @param {String|Observable} [options.tooltip=''] A string, or observable, containing the button's tooltip.
     */
    var ToggleButtonViewModel = function(command, options) {
        if (!defined(command)) {
            throw new DeveloperError('command is required.');
        }

        this._command = command;

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        /**
         * Gets or sets whether the button is currently toggled.  This property is observable.
         * @type {Boolean}
         * @default false
         */
        this.toggled = defaultValue(options.toggled, false);

        /**
         * Gets or sets the button's tooltip.  This property is observable.
         * @type {String}
         * @default ''
         */
        this.tooltip = defaultValue(options.tooltip, '');

        knockout.track(this, ['toggled', 'tooltip']);
    };

    defineProperties(ToggleButtonViewModel.prototype, {
        /**
         * Gets the command which will be executed when the button is toggled.
         * @memberof ToggleButtonViewModel.prototype
         * @type {Command}
         */
        command : {
            get : function() {
                return this._command;
            }
        }
    });

    return ToggleButtonViewModel;
});
