    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "uniform vec4 grassColor;\n\
uniform vec4 dirtColor;\n\
uniform float patchiness;\n\
\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
    \n\
    vec2 st = materialInput.st;\n\
    float noise1 = (czm_snoise(st * patchiness * 1.0)) * 1.0;\n\
    float noise2 = (czm_snoise(st * patchiness * 2.0)) * 0.5;\n\
    float noise3 = (czm_snoise(st * patchiness * 4.0)) * 0.25;\n\
    float noise = sin(noise1 + noise2 + noise3) * 0.1;\n\
    \n\
    vec4 color = mix(grassColor, dirtColor, noise);\n\
    \n\
    //Make thatch patterns\n\
    float verticalNoise = czm_snoise(vec2(st.x * 100.0, st.y * 20.0)) * 0.02;\n\
    float horizontalNoise = czm_snoise(vec2(st.x * 20.0, st.y * 100.0)) * 0.02;\n\
    float stripeNoise = min(verticalNoise, horizontalNoise);\n\
 \n\
    color.rgb += stripeNoise;\n\
    \n\
    material.diffuse = color.rgb;\n\
    material.alpha = color.a;\n\
    \n\
    return material;\n\
}";
});