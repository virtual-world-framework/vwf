/*global define*/
define([
        '../../Core/defaultValue',
        '../../Core/defined',
        '../../Core/DeveloperError',
        '../../Core/defineProperties',
        '../../Core/EventHelper',
        '../../Core/ScreenSpaceEventType',
        '../../Core/wrapFunction',
        '../../Scene/SceneMode',
        '../../DynamicScene/DynamicObjectView'
    ], function(
        defaultValue,
        defined,
        DeveloperError,
        defineProperties,
        EventHelper,
        ScreenSpaceEventType,
        wrapFunction,
        SceneMode,
        DynamicObjectView) {
    "use strict";

    /**
     * A mixin which adds behavior to the Viewer widget for dealing with DynamicObject instances.
     * This allows for DynamicObjects to be tracked with the camera, either by the viewer clicking
     * on them, or by setting the trackedObject property.
     * Rather than being called directly, this function is normally passed as
     * a parameter to {@link Viewer#extend}, as shown in the example below.
     * @exports viewerDynamicObjectMixin
     *
     * @param {Viewer} viewer The viewer instance.
     *
     * @exception {DeveloperError} viewer is required.
     * @exception {DeveloperError} trackedObject is already defined by another mixin.
     *
     * @example
     * // Add support for working with DynamicObject instances to the Viewer.
     * var dynamicObject = ... //A Cesium.DynamicObject instance
     * var viewer = new Cesium.Viewer('cesiumContainer');
     * viewer.extend(Cesium.viewerDynamicObjectMixin);
     * viewer.trackedObject = dynamicObject; //Camera will now track dynamicObject
     */
    var viewerDynamicObjectMixin = function(viewer) {
        if (!defined(viewer)) {
            throw new DeveloperError('viewer is required.');
        }
        if (viewer.hasOwnProperty('trackedObject')) {
            throw new DeveloperError('trackedObject is already defined by another mixin.');
        }

        var eventHelper = new EventHelper();
        var trackedObject;
        var dynamicObjectView;

        //Subscribe to onTick so that we can update the view each update.
        function updateView(clock) {
            if (defined(dynamicObjectView)) {
                dynamicObjectView.update(clock.currentTime);
            }
        }
        eventHelper.add(viewer.clock.onTick, updateView);

        function pickAndTrackObject(e) {
            var pickedPrimitive = viewer.scene.pick(e.position);
            if (defined(pickedPrimitive) &&
                defined(pickedPrimitive.dynamicObject) &&
                defined(pickedPrimitive.dynamicObject.position)) {
                viewer.trackedObject = pickedPrimitive.dynamicObject;
            }
        }

        function clearTrackedObject() {
            viewer.trackedObject = undefined;
        }

        //Subscribe to the home button click if it exists, so that we can
        //clear the trackedObject when it is clicked.
        if (defined(viewer.homeButton)) {
            eventHelper.add(viewer.homeButton.viewModel.command.beforeExecute, clearTrackedObject);
        }

        //Subscribe to left clicks and zoom to the picked object.
        viewer.screenSpaceEventHandler.setInputAction(pickAndTrackObject, ScreenSpaceEventType.LEFT_CLICK);

        defineProperties(viewer, {
            /**
             * Gets or sets the DynamicObject instance currently being tracked by the camera.
             * @memberof viewerDynamicObjectMixin.prototype
             * @type {DynamicObject}
             */
            trackedObject : {
                get : function() {
                    return trackedObject;
                },
                set : function(value) {
                    if (trackedObject !== value) {
                        trackedObject = value;
                        dynamicObjectView = defined(value) ? new DynamicObjectView(value, viewer.scene, viewer.centralBody.getEllipsoid()) : undefined;
                    }
                    var sceneMode = viewer.scene.getFrameState().mode;

                    if (sceneMode === SceneMode.COLUMBUS_VIEW || sceneMode === SceneMode.SCENE2D) {
                        viewer.scene.getScreenSpaceCameraController().enableTranslate = !defined(value);
                    }

                    if (sceneMode === SceneMode.COLUMBUS_VIEW || sceneMode === SceneMode.SCENE3D) {
                        viewer.scene.getScreenSpaceCameraController().enableTilt = !defined(value);
                    }
                }
            }
        });

        //Wrap destroy to clean up event subscriptions.
        viewer.destroy = wrapFunction(viewer, viewer.destroy, function() {
            eventHelper.removeAll();

            viewer.screenSpaceEventHandler.removeInputAction(ScreenSpaceEventType.LEFT_CLICK);
        });
    };

    return viewerDynamicObjectMixin;
});