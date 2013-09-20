//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "attribute vec3 position;\n\
uniform vec3 u_radii;\n\
varying vec3 v_positionEC;\n\
void main()\n\
{\n\
vec4 p = vec4(u_radii * position, 1.0);\n\
v_positionEC = (czm_modelView * p).xyz;\n\
gl_Position = czm_modelViewProjection * p;\n\
gl_Position.z = clamp(gl_Position.z, gl_DepthRange.near, gl_DepthRange.far);\n\
}\n\
";
});