//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "uniform samplerCube cubeMap;\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
czm_material material = czm_getDefaultMaterial(materialInput);\n\
vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\n\
vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\n\
vec3 reflectedWC = reflect(positionWC, normalWC);\n\
material.diffuse = textureCube(cubeMap, reflectedWC).channels;\n\
return material;\n\
}\n\
";
});