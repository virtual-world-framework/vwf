//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "uniform vec4 lightWoodColor;\n\
uniform vec4 darkWoodColor;\n\
uniform float ringFrequency;\n\
uniform vec2 noiseScale;\n\
uniform float grainFrequency;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec2 st = materialInput.st;\n\
vec2 noisevec;\n\
noisevec.x = czm_snoise(st * noiseScale.x);\n\
noisevec.y = czm_snoise(st * noiseScale.y);\n\
vec2 location = st + noisevec;\n\
float dist = sqrt(location.x * location.x + location.y * location.y);\n\
dist *= ringFrequency;\n\
float r = fract(dist + noisevec[0] + noisevec[1]) * 2.0;\n\
if(r > 1.0)\n\
r = 2.0 - r;\n\
vec4 color = mix(lightWoodColor, darkWoodColor, r);\n\
r = abs(czm_snoise(vec2(st.x * grainFrequency, st.y * grainFrequency * 0.02))) * 0.2;\n\
color.rgb += lightWoodColor.rgb * r;\n\
material.diffuse = color.rgb;\n\
material.alpha = color.a;\n\
return material;\n\
}\n\
";
});