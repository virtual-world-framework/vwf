    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "uniform vec4 lightColor;\n\
uniform vec4 darkColor;\n\
uniform float frequency;\n\
\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
    \n\
    vec3 scaled = materialInput.str * frequency;\n\
    float t = abs(czm_snoise(scaled));\n\
    \n\
    vec4 color = mix(lightColor, darkColor, t);\n\
    material.diffuse = color.rgb;\n\
    material.alpha = color.a;\n\
    \n\
    return material;\n\
}\n\
";
});