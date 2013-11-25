//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "vec4 czm_windowToEyeCoordinates(vec4 fragmentCoordinate)\n\
{\n\
float x = 2.0 * (fragmentCoordinate.x - czm_viewport.x) / czm_viewport.z - 1.0;\n\
float y = 2.0 * (fragmentCoordinate.y - czm_viewport.y) / czm_viewport.w - 1.0;\n\
float z = (fragmentCoordinate.z - czm_viewportTransformation[3][2]) / czm_viewportTransformation[2][2];\n\
vec4 q = vec4(x, y, z, 1.0);\n\
q /= fragmentCoordinate.w;\n\
q = czm_inverseProjection * q;\n\
return q;\n\
}\n\
";
});