(function() {
    "use strict";
    /*global document, Geoscope*/

    var canvas = document.getElementById("glCanvas");
    var ellipsoid = Geoscope.Ellipsoid.getWgs84();  // Used in many Sandbox examples
    var scene = new Geoscope.Scene(canvas);
    var primitives = scene.getPrimitives();

    // Bing Maps
    var bing = new Geoscope.BingMapsTileProvider({
        server : "dev.virtualearth.net",
        mapStyle : Geoscope.BingMapsStyle.AERIAL
    });

    var cb = new Geoscope.CentralBody(scene.getCamera(), ellipsoid);
    cb.dayTileProvider = bing;
    cb.nightImageSource = "Images/land_ocean_ice_lights_2048.jpg";
    cb.specularMapSource = "Images/earthspec1k.jpg";
    if (scene.getContext().getMaximumTextureSize() > 2048) {
        cb.cloudsMapSource = "Images/earthcloudmaptrans.jpg";
        cb.bumpMapSource = "Images/earthbump1k.jpg";
    }
    cb.showSkyAtmosphere = true;
    cb.showGroundAtmosphere = true;
    primitives.setCentralBody(cb);

    scene.getCamera().frustum.near = 1.0;

    scene.getCamera().getControllers().addSpindle();
    scene.getCamera().getControllers().addFreeLook();

    ///////////////////////////////////////////////////////////////////////////
    // Add examples from the Sandbox here:

    ///////////////////////////////////////////////////////////////////////////

    scene.setAnimation(function() {
        //scene.setSunPosition(scene.getCamera().position);
        scene.setSunPosition(Geoscope.SunPosition.compute().position);

        // Add code here to update primitives based on changes to animation time, camera parameters, etc.
        
        //  In case of canvas resize
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        scene.getContext().setViewport({
            x : 0,
            y : 0,
            width : canvas.width,
            height : canvas.height
        });

        scene.getCamera().frustum.aspectRatio = canvas.clientWidth / canvas.clientHeight;
    });

    (function tick() {
        scene.render();
        Geoscope.requestAnimationFrame(tick);
    }());

    ///////////////////////////////////////////////////////////////////////////
    // Example keyboard and Mouse handlers

    var handler = new Geoscope.EventHandler(canvas);
    handler.setKeyAction(function () { /* ... */ }, "1"); // Handler for key press
    handler.setMouseAction(function (movement) { /* ... */ }, Geoscope.MouseEventType.MOVE); // Use movement.startX, movement.startY, movement.endX, movement.endY

    document.oncontextmenu = function() { return false; };
}());