/*global define*/
define([
        '../../Core/defaultValue',
        '../../Core/defined',
        '../../Core/DeveloperError',
        '../../Core/defineProperties',
        '../../Core/Event',
        '../../Core/wrapFunction',
        '../../DynamicScene/CzmlDataSource',
        '../../DynamicScene/GeoJsonDataSource',
        '../../ThirdParty/when',
        '../getElement'
    ], function(
        defaultValue,
        defined,
        DeveloperError,
        defineProperties,
        Event,
        wrapFunction,
        CzmlDataSource,
        GeoJsonDataSource,
        when,
        getElement) {
    "use strict";

    /**
     * A mixin which adds default drag and drop support for CZML files to the Viewer widget.
     * Rather than being called directly, this function is normally passed as
     * a parameter to {@link Viewer#extend}, as shown in the example below.
     * @exports viewerDragDropMixin
     *
     * @param {Viewer} viewer The viewer instance.
     * @param {Object} [options] Configuration options for the mixin.
     * @param {Element|String} [options.dropTarget=viewer.container] The DOM element which will serve as the drop target.
     * @param {Boolean} [options.clearOnDrop=true] When true, dropping files will clear all existing data sources first, when false, new data sources will be loaded after the existing ones.
     *
     * @exception {DeveloperError} viewer is required.
     * @exception {DeveloperError} Element with id <options.dropTarget> does not exist in the document.
     * @exception {DeveloperError} dropTarget is already defined by another mixin.
     * @exception {DeveloperError} dropEnabled is already defined by another mixin.
     * @exception {DeveloperError} dropError is already defined by another mixin.
     * @exception {DeveloperError} clearOnDrop is already defined by another mixin.
     *
     * @example
     * // Add basic drag and drop support and pop up an alert window on error.
     * var viewer = new Cesium.Viewer('cesiumContainer');
     * viewer.extend(Cesium.viewerDragDropMixin);
     * viewer.dropError.addEventListener(function(viewerArg, source, error) {
     *     window.alert('Error processing ' + source + ':' + error);
     * });
     */
    var viewerDragDropMixin = function(viewer, options) {
        if (!defined(viewer)) {
            throw new DeveloperError('viewer is required.');
        }
        if (viewer.hasOwnProperty('dropTarget')) {
            throw new DeveloperError('dropTarget is already defined by another mixin.');
        }
        if (viewer.hasOwnProperty('dropEnabled')) {
            throw new DeveloperError('dropEnabled is already defined by another mixin.');
        }
        if (viewer.hasOwnProperty('dropError')) {
            throw new DeveloperError('dropError is already defined by another mixin.');
        }
        if (viewer.hasOwnProperty('clearOnDrop')) {
            throw new DeveloperError('clearOnDrop is already defined by another mixin.');
        }

        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        //Local variables to be closed over by defineProperties.
        var dropEnabled = true;
        var dropError = new Event();
        var clearOnDrop = defaultValue(options.clearOnDrop, true);
        var dropTarget = defaultValue(options.dropTarget, viewer.container);

        dropTarget = getElement(dropTarget);

        defineProperties(viewer, {
            /**
             * Gets or sets the element to serve as the drop target.
             * @memberof viewerDragDropMixin.prototype
             * @type {Element}
             */
            dropTarget : {
                //TODO See https://github.com/AnalyticalGraphicsInc/cesium/issues/832
                //* @exception {DeveloperError} value is required.
                get : function() {
                    return dropTarget;
                },
                set : function(value) {
                    if (!defined(value)) {
                        throw new DeveloperError('value is required.');
                    }
                    unsubscribe(dropTarget, handleDrop);
                    dropTarget = value;
                    subscribe(dropTarget, handleDrop);
                }
            },

            /**
             * Gets or sets a value indicating if drag and drop support is enabled.
             * @memberof viewerDragDropMixin.prototype
             * @type {Element}
             */
            dropEnabled : {
                get : function() {
                    return dropEnabled;
                },
                set : function(value) {
                    if (value !== dropEnabled) {
                        if (value) {
                            subscribe(dropTarget, handleDrop);
                        } else {
                            unsubscribe(dropTarget, handleDrop);
                        }
                        dropEnabled = value;
                    }
                }
            },

            /**
             * Gets the event that will be raised when an error is encountered during drop processing.
             * @memberof viewerDragDropMixin.prototype
             * @type {Event}
             */
            dropError : {
                get : function() {
                    return dropError;
                }
            },

            /**
             * Gets or sets a value indicating if existing data sources should be cleared before adding the newly dropped sources.
             * @memberof viewerDragDropMixin.prototype
             * @type {Boolean}
             */
            clearOnDrop : {
                get : function() {
                    return clearOnDrop;
                },
                set : function(value) {
                    clearOnDrop = value;
                }
            }
        });

        function handleDrop(event) {
            stop(event);

            if (clearOnDrop) {
                viewer.dataSources.removeAll();
            }

            var files = event.dataTransfer.files;
            var length = files.length;
            for ( var i = 0; i < length; i++) {
                var f = files[i];
                var reader = new FileReader();
                reader.onload = createOnLoadCallback(viewer, f.name);
                reader.onerror = createDropErrorCallback(viewer, f.name);
                reader.readAsText(f);
            }
        }

        //Enable drop by default;
        subscribe(dropTarget, handleDrop);

        //Wrap the destroy function to make sure all events are unsubscribed from
        viewer.destroy = wrapFunction(viewer, viewer.destroy, function() {
            viewer.dropEnabled = false;
        });

        //Specs need access to handleDrop
        viewer._handleDrop = handleDrop;
    };

    function stop(event) {
        event.stopPropagation();
        event.preventDefault();
    }

    function unsubscribe(dropTarget, handleDrop) {
        var currentTarget = dropTarget;
        if (defined(currentTarget)) {
            currentTarget.removeEventListener('drop', handleDrop, false);
            currentTarget.removeEventListener('dragenter', stop, false);
            currentTarget.removeEventListener('dragover', stop, false);
            currentTarget.removeEventListener('dragexit', stop, false);
        }
    }

    function subscribe(dropTarget, handleDrop) {
        dropTarget.addEventListener('drop', handleDrop, false);
        dropTarget.addEventListener('dragenter', stop, false);
        dropTarget.addEventListener('dragover', stop, false);
        dropTarget.addEventListener('dragexit', stop, false);
    }

    function endsWith(str, suffix) {
        var strLength = str.length;
        var suffixLength = suffix.length;
        return (suffixLength < strLength) && (str.indexOf(suffix, strLength - suffixLength) !== -1);
    }

    function createOnLoadCallback(viewer, source) {
        var DataSource;
        var sourceUpperCase = source.toUpperCase();
        if (endsWith(sourceUpperCase, ".CZML")) {
            DataSource = CzmlDataSource;
        } else if (endsWith(sourceUpperCase, ".GEOJSON") || //
        endsWith(sourceUpperCase, ".JSON") || //
        endsWith(sourceUpperCase, ".TOPOJSON")) {
            DataSource = GeoJsonDataSource;
        } else {
            viewer.dropError.raiseEvent(viewer, source, 'Unrecognized file extension: ' + source);
            return undefined;
        }

        return function(evt) {
            var dataSource = new DataSource();
            try {
                when(dataSource.load(JSON.parse(evt.target.result), source), function() {
                    viewer.dataSources.add(dataSource);
                }, function(error) {
                    viewer.dropError.raiseEvent(viewer, source, error);
                });
            } catch (error) {
                viewer.dropError.raiseEvent(viewer, source, error);
            }
        };
    }

    function createDropErrorCallback(viewer, name) {
        return function(evt) {
            viewer.dropError.raiseEvent(viewer, name, evt.target.error);
        };
    }

    return viewerDragDropMixin;
});
