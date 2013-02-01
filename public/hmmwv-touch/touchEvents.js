// Copyright 2013 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

var $sw = $('body');
var scale;

var canvas = $('canvas')[0];
canvas.onmousewheel = undefined;

$sw.on('transformstart', function (event) {
    event.stopPropagation();
});

$sw.on('transform', function (event) {
    event.stopPropagation();

    if(camera == externalCam)
    {
        if(event.scale < 1) scale = -1;
        else scale = 1;

        vwf_view.kernel.fireEvent( "index-vwf", "touchZoom", [ scale, true ]);
    }
    else
    {
        if(event.scale < 1) scale = -0.1;
        else scale = 0.1;

        vwf_view.kernel.fireEvent( "index-vwf", "touchZoom", [ scale, false ]);
    }
});

var camPosArray;
var cameraStartingX, cameraStartingY, cameraStartingZ;
var priorMouseX, priorMouseY;

$sw.on('dragstart', function (event) {
    event.stopPropagation();

    camPosArray = vwf.getProperty(camera, "translation");
    priorMouseX = event.position.x;
    priorMouseY = event.position.y;
});

$sw.on('drag', function (event) {
    event.stopPropagation();

    if(camera == externalCam)
    {
        // Assemble the variables we need
        var yValueOfFocalPlane = 0;
        var dist = Math.abs(yValueOfFocalPlane - camPosArray[1]);
        var fovy = vwf.getProperty(camera, "fovy");
        var deg2rad = Math.PI / 180;
        var fovyRad = fovy * deg2rad;

        // In screen space the y axis points down, so negate the result to make y up
        var mouseYMovementInPixels = -(event.position.y - priorMouseY);

        // Draw a triangle of this to see why this is true
        var totalZSpanOfFovIn3Space = 2 * dist * Math.tan(0.5 * fovyRad);
        var totalYScreenPixels = $(window).height();
        var objectZMovementIn3D = 0;
        if (totalYScreenPixels > 0)
            objectZMovementIn3D = mouseYMovementInPixels * totalZSpanOfFovIn3Space / totalYScreenPixels;

        // Move on to x:
        var mouseXMovementInPixels = event.position.x - priorMouseX;
        var aspectRatio = vwf.getProperty(camera, "aspect");
        var totalXSpanOfFovIn3Space = totalZSpanOfFovIn3Space * aspectRatio;
        var totalXScreenPixels = $(window).width();
        var objectXMovementIn3D = 0;
        if (totalXScreenPixels > 0)
            objectXMovementIn3D = mouseXMovementInPixels * totalXSpanOfFovIn3Space / totalXScreenPixels;

        // Move camera in the opposite direction to simulate moving the entire scene
        camPosArray[0] += -objectXMovementIn3D;
        camPosArray[1] += 0;
        camPosArray[2] += -objectZMovementIn3D;

        vwf_view.kernel.setProperty( camera, "translation", camPosArray );

        priorMouseX = event.position.x;
        priorMouseY = event.position.y;
    }
    else
    {
        if(event.direction == "left")
        {
            vwf_view.kernel.callMethod( camera, "rotateBy", [ [ 0, 0, 1, -1 ] ] );
        }
        else if(event.direction == "right")
        {
            vwf_view.kernel.callMethod( camera, "rotateBy", [ [ 0, 0, 1, 1 ] ] );
        }
        else if(event.direction == "up")
        {
            vwf_view.kernel.callMethod( camera, "translateBy", [ [ 0, 0, -0.2 ] ] );
        }
        else if(event.direction == "down")
        {
            vwf_view.kernel.callMethod( camera, "translateBy", [ [ 0, 0, 0.2 ] ] );
        }
    }
});
