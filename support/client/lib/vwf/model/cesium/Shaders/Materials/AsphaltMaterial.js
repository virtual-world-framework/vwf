//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "uniform vec4 asphaltColor;\n\
uniform float bumpSize;\n\
uniform float roughness;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec4 color = asphaltColor;\n\
vec2 st = materialInput.st;\n\
vec2 F = czm_cellular(st / bumpSize);\n\
color.rgb -= (F.x / F.y) * 0.1;\n\
float noise = czm_snoise(st / bumpSize);\n\
noise = pow(noise, 5.0) * roughness;\n\
color.rgb += noise;\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});