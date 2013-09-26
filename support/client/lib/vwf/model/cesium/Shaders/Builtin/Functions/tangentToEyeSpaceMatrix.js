//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "mat3 czm_tangentToEyeSpaceMatrix(vec3 normalEC, vec3 tangentEC, vec3 binormalEC)\n\
{\n\
vec3 normal = normalize(normalEC);\n\
vec3 tangent = normalize(tangentEC);\n\
vec3 binormal = normalize(binormalEC);\n\
return mat3(tangent.x,  tangent.y,  tangent.z,\n\
binormal.x, binormal.y, binormal.z,\n\
normal.x,   normal.y,   normal.z);\n\
}\n\
";
});