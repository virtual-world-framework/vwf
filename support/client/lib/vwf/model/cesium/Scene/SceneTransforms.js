/*global define*/
define([
        '../Core/defined',
        '../Core/DeveloperError',
        '../Core/Cartographic',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Cartesian4',
        '../Core/Matrix4',
        '../Core/BoundingRectangle',
        '../Core/Math',
        './SceneMode'
    ], function(
        defined,
        DeveloperError,
        Cartographic,
        Cartesian2,
        Cartesian3,
        Cartesian4,
        Matrix4,
        BoundingRectangle,
        CesiumMath,
        SceneMode) {
    "use strict";

    /**
     * Functions that do scene-dependent transforms between rendering-related coordinate systems.
     *
     * @exports SceneTransforms
     */
    var SceneTransforms = {};

    var actualPosition = new Cartesian4(0, 0, 0, 1);
    var positionCC = new Cartesian4();

    /**
     * Transforms a position in WGS84 coordinates to window coordinates.  This is commonly used to place an
     * HTML element at the same screen position as an object in the scene.
     *
     * @memberof SceneTransforms
     *
     * @param {Scene} scene The scene.
     * @param {Cartesian3} position The position in WGS84 (world) coordinates.
     * @param {Cartesian2} [result=undefined] An optional object to return the input position transformed to window coordinates.
     *
     * @returns {Cartesian2} The modified result parameter or a new Cartesian3 instance if one was not provided.  This may be <code>undefined</code> if the input position is near the center of the ellipsoid.
     *
     * @exception {DeveloperError} scene is required.
     * @exception {DeveloperError} position is required.
     *
     * @example
     * // Output the window position of longitude/latitude (0, 0) every time the mouse moves.
     * var scene = widget.scene;
     * var ellipsoid = widget.centralBody.getEllipsoid();
     * var position = ellipsoid.cartographicToCartesian(new Cartographic(0.0, 0.0));
     * var handler = new Cesium.ScreenSpaceEventHandler(scene.getCanvas());
     * handler.setInputAction(function(movement) {
     *     console.log(Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, position));
     * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
     */
    SceneTransforms.wgs84ToWindowCoordinates = function(scene, position, result) {
        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }

        if (!defined(position)) {
            throw new DeveloperError('position is required.');
        }

        // Transform for 3D, 2D, or Columbus view
        SceneTransforms.computeActualWgs84Position(scene.getFrameState(), position, actualPosition);

        if (!defined(actualPosition)) {
            result = undefined;
            return undefined;
        }

        // View-projection matrix to transform from world coordinates to clip coordinates
        var viewProjection = scene.getUniformState().getViewProjection();
        Matrix4.multiplyByVector(viewProjection, actualPosition, positionCC);

        return SceneTransforms.clipToWindowCoordinates(scene.getContext(), positionCC, result);
    };

    /**
     * Transforms a position in WGS84 coordinates to drawing buffer coordinates.  This may produce different
     * results from SceneTransforms.wgs84ToWindowCoordinates when the browser zoom is not 100%, or on high-DPI displays.
     *
     * @memberof SceneTransforms
     *
     * @param {Scene} scene The scene.
     * @param {Cartesian3} position The position in WGS84 (world) coordinates.
     * @param {Cartesian2} [result=undefined] An optional object to return the input position transformed to window coordinates.
     *
     * @returns {Cartesian2} The modified result parameter or a new Cartesian3 instance if one was not provided.  This may be <code>undefined</code> if the input position is near the center of the ellipsoid.
     *
     * @exception {DeveloperError} scene is required.
     * @exception {DeveloperError} position is required.
     *
     * @example
     * // Output the window position of longitude/latitude (0, 0) every time the mouse moves.
     * var scene = widget.scene;
     * var ellipsoid = widget.centralBody.getEllipsoid();
     * var position = ellipsoid.cartographicToCartesian(new Cartographic(0.0, 0.0));
     * var handler = new Cesium.ScreenSpaceEventHandler(scene.getCanvas());
     * handler.setInputAction(function(movement) {
     *     console.log(Cesium.SceneTransforms.wgs84ToWindowCoordinates(scene, position));
     * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
     */
    SceneTransforms.wgs84ToDrawingBufferCoordinates = function(scene, position, result) {
        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }

        if (!defined(position)) {
            throw new DeveloperError('position is required.');
        }

        // Transform for 3D, 2D, or Columbus view
        SceneTransforms.computeActualWgs84Position(scene.getFrameState(), position, actualPosition);

        if (!defined(actualPosition)) {
            return undefined;
        }

        // View-projection matrix to transform from world coordinates to clip coordinates
        var viewProjection = scene.getUniformState().getViewProjection();
        Matrix4.multiplyByVector(viewProjection, Cartesian4.fromElements(actualPosition.x, actualPosition.y, actualPosition.z, 1, positionCC), positionCC);

        return SceneTransforms.clipToDrawingBufferCoordinates(scene.getContext(), positionCC, result);
    };

    var projectedPosition = new Cartesian3();
    var positionInCartographic = new Cartographic();

    /**
     * @private
     */
    SceneTransforms.computeActualWgs84Position = function(frameState, position, result) {
        var mode = frameState.mode;

        if (mode === SceneMode.SCENE3D) {
            return Cartesian3.clone(position, result);
        }

        var projection = frameState.scene2D.projection;
        projection.getEllipsoid().cartesianToCartographic(position, positionInCartographic);
        if (!defined(positionInCartographic)) {
            result = undefined;
            return result;
        }

        projection.project(positionInCartographic, projectedPosition);

        if (mode === SceneMode.COLUMBUS_VIEW) {
            return Cartesian3.fromElements(projectedPosition.z, projectedPosition.x, projectedPosition.y, result);
        }

        if (mode === SceneMode.SCENE2D) {
            return Cartesian3.fromElements(0.0, projectedPosition.x, projectedPosition.y, result);
        }

        // mode === SceneMode.MORPHING
        var morphTime = frameState.morphTime;
        return Cartesian3.fromElements(
            CesiumMath.lerp(projectedPosition.z, position.x, morphTime),
            CesiumMath.lerp(projectedPosition.x, position.y, morphTime),
            CesiumMath.lerp(projectedPosition.y, position.z, morphTime),
            result);
    };

    var positionNDC = new Cartesian3();
    var positionWC = new Cartesian3();
    var viewport = new BoundingRectangle();
    var viewportTransform = new Matrix4();

    /**
     * @private
     */
    SceneTransforms.clipToWindowCoordinates = function(context, position, result) {
        var canvas = context.getCanvas();

        // Perspective divide to transform from clip coordinates to normalized device coordinates
        Cartesian3.divideByScalar(position, position.w, positionNDC);

        // Assuming viewport takes up the entire canvas...
        viewport.width = canvas.clientWidth;
        viewport.height = canvas.clientHeight;
        Matrix4.computeViewportTransformation(viewport, 0.0, 1.0, viewportTransform);

        // Viewport transform to transform from clip coordinates to window coordinates
        Matrix4.multiplyByPoint(viewportTransform, positionNDC, positionWC);

        return Cartesian2.fromCartesian3(positionWC, result);
    };

    /**
     * @private
     */
    SceneTransforms.clipToDrawingBufferCoordinates = function(context, position, result) {
        // Perspective divide to transform from clip coordinates to normalized device coordinates
        Cartesian3.divideByScalar(position, position.w, positionNDC);

        // Assuming viewport takes up the entire canvas...
        viewport.width = context.getDrawingBufferWidth();
        viewport.height = context.getDrawingBufferHeight();
        Matrix4.computeViewportTransformation(viewport, 0.0, 1.0, viewportTransform);

        // Viewport transform to transform from clip coordinates to drawing buffer coordinates
        Matrix4.multiplyByPoint(viewportTransform, positionNDC, positionWC);

        return Cartesian2.fromCartesian3(positionWC, result);
    };

    /**
     * @private
     */
    SceneTransforms.transformWindowToDrawingBuffer = function(context, windowPosition, result) {
        var canvas = context.getCanvas();
        var xScale = context.getDrawingBufferWidth() / canvas.clientWidth;
        var yScale = context.getDrawingBufferHeight() / canvas.clientHeight;
        return Cartesian2.fromElements(windowPosition.x * xScale, windowPosition.y * yScale, result);
    };

    return SceneTransforms;
});
