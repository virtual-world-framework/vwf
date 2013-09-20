/*global define*/
define([
        '../../Core/defineProperties',
        '../../Core/defined',
        '../../Core/destroyObject',
        '../../Core/DeveloperError',
        '../getElement',
        './SceneModePickerViewModel',
        '../../ThirdParty/knockout'
    ], function(
        defineProperties,
        defined,
        destroyObject,
        DeveloperError,
        getElement,
        SceneModePickerViewModel,
        knockout) {
    "use strict";

    /**
     * <img src="images/sceneModePicker.png" style="float: left; margin: 3px; border: none; border-radius: 5px;" />
     * <p>The SceneModePicker is a single button widget for switching between scene modes;
     * shown to the left in its expanded state. Programatic switching of scene modes will
     * be automatically reflected in the widget as long as the specified SceneTransitioner
     * is used to perform the change.</p><p style="clear: both;"></p><br/>
     *
     * @alias SceneModePicker
     * @constructor
     *
     * @param {Element|String} container The DOM element or ID that will contain the widget.
     * @param {SceneTransitioner} transitioner The SceneTransitioner instance to use.
     *
     * @exception {DeveloperError} container is required.
     * @exception {DeveloperError} Element with id "container" does not exist in the document.
     * @exception {DeveloperError} transitioner is required.
     *
     * @see SceneTransitioner
     *
     * @example
     * // In HTML head, include a link to the SceneModePicker.css stylesheet,
     * // and in the body, include: &lt;div id="sceneModePickerContainer"&gt;&lt;/div&gt;
     * // Note: This code assumed you already have a Scene instance.
     *
     * var transitioner = new Cesium.SceneTransitioner(scene);
     * var sceneModePicker = new Cesium.SceneModePicker('sceneModePickerContainer', transitioner);
     */
    var SceneModePicker = function(container, transitioner) {
        if (!defined(container)) {
            throw new DeveloperError('container is required.');
        }

        if (!defined(transitioner)) {
            throw new DeveloperError('transitioner is required.');
        }

        container = getElement(container);

        var viewModel = new SceneModePickerViewModel(transitioner);

        this._viewModel = viewModel;
        this._container = container;
        this._element = document.createElement('span');

        var widgetNode = this._element;
        widgetNode.className = 'cesium-sceneModePicker-button';
        widgetNode.setAttribute('data-bind', '\
                                 css: { "cesium-sceneModePicker-button2D": sceneMode === _sceneMode.SCENE2D,\
                                        "cesium-sceneModePicker-button3D": sceneMode === _sceneMode.SCENE3D,\
                                        "cesium-sceneModePicker-buttonColumbusView": sceneMode === _sceneMode.COLUMBUS_VIEW,\
                                        "cesium-sceneModePicker-selected": dropDownVisible},\
                                 attr: { title: selectedTooltip }, click: toggleDropDown');
        container.appendChild(widgetNode);

        var node3D = document.createElement('span');
        node3D.className = 'cesium-sceneModePicker-button cesium-sceneModePicker-button3D';
        node3D.setAttribute('data-bind', '\
                             css: { "cesium-sceneModePicker-visible" : (dropDownVisible && (sceneMode !== _sceneMode.SCENE3D)) || (!dropDownVisible && (sceneMode === _sceneMode.SCENE3D)),\
                                    "cesium-sceneModePicker-none" : sceneMode === _sceneMode.SCENE3D,\
                                    "cesium-sceneModePicker-hidden" : !dropDownVisible},\
                             attr: { title: tooltip3D },\
                             click: morphTo3D');
        container.appendChild(node3D);
        this._node3D = node3D;

        var node2D = document.createElement('span');
        node2D.className = 'cesium-sceneModePicker-button cesium-sceneModePicker-button2D';
        node2D.setAttribute('data-bind', '\
                             css: { "cesium-sceneModePicker-visible" : (dropDownVisible && (sceneMode !== _sceneMode.SCENE2D)),\
                                    "cesium-sceneModePicker-none" : sceneMode === _sceneMode.SCENE2D,\
                                    "cesium-sceneModePicker-hidden" : !dropDownVisible},\
                             attr: { title: tooltip2D },\
                             click: morphTo2D');
        container.appendChild(node2D);
        this._node2D = node2D;

        var nodeColumbus = document.createElement('span');
        nodeColumbus.className = 'cesium-sceneModePicker-button cesium-sceneModePicker-buttonColumbusView';
        nodeColumbus.setAttribute('data-bind', '\
                                   css: { "cesium-sceneModePicker-visible" : (dropDownVisible && (sceneMode !== _sceneMode.COLUMBUS_VIEW)) || (!dropDownVisible && (sceneMode === _sceneMode.COLUMBUS_VIEW)),\
                                          "cesium-sceneModePicker-none" : sceneMode === _sceneMode.COLUMBUS_VIEW,\
                                          "cesium-sceneModePicker-hidden" : !dropDownVisible},\
                                   attr: { title: tooltipColumbusView },\
                                   click: morphToColumbusView');

        container.appendChild(nodeColumbus);
        this._nodeColumbus = nodeColumbus;

        knockout.applyBindings(viewModel, container);

        this._closeDropDown = function(e) {
            if (!container.contains(e.target)) {
                viewModel.dropDownVisible = false;
            }
        };

        document.addEventListener('mousedown', this._closeDropDown, true);
        document.addEventListener('touchstart', this._closeDropDown, true);
    };

    defineProperties(SceneModePicker.prototype, {
        /**
         * Gets the parent container.
         * @memberof SceneModePicker.prototype
         *
         * @type {Element}
         */
        container : {
            get : function() {
                return this._container;
            }
        },

        /**
         * Gets the view model.
         * @memberof SceneModePicker.prototype
         *
         * @type {SceneModePickerViewModel}
         */
        viewModel : {
            get : function() {
                return this._viewModel;
            }
        }
    });

    /**
     * @memberof SceneModePicker
     * @returns {Boolean} true if the object has been destroyed, false otherwise.
     */
    SceneModePicker.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Destroys the widget.  Should be called if permanently
     * removing the widget from layout.
     * @memberof SceneModePicker
     */
    SceneModePicker.prototype.destroy = function() {
        this._viewModel.destroy();
        document.removeEventListener('mousedown', this._closeDropDown, true);
        document.removeEventListener('touchstart', this._closeDropDown, true);
        var container = this._container;
        knockout.cleanNode(container);
        container.removeChild(this._element);
        container.removeChild(this._node3D);
        container.removeChild(this._node2D);
        container.removeChild(this._nodeColumbus);
        return destroyObject(this);
    };

    return SceneModePicker;
});