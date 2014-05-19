    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "uniform vec4 cementColor;\n\
uniform float grainScale;\n\
uniform float roughness;\n\
\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
\n\
    float noise = czm_snoise(materialInput.st / grainScale);\n\
    noise = pow(noise, 5.0) * roughness;\n\
   \n\
    vec4 color = cementColor;\n\
    color.rgb += noise;\n\
    \n\
    material.diffuse = color.rgb;\n\
    material.alpha = color.a;\n\
    \n\
    return material;\n\
}";
});