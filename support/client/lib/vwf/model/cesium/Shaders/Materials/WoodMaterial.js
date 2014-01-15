    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "uniform vec4 lightWoodColor;\n\
uniform vec4 darkWoodColor;\n\
uniform float ringFrequency;\n\
uniform vec2 noiseScale;\n\
uniform float grainFrequency;\n\
\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
    \n\
    //Based on wood shader from OpenGL Shading Language (3rd edition) pg. 455\n\
    vec2 st = materialInput.st;\n\
    \n\
    vec2 noisevec;\n\
    noisevec.x = czm_snoise(st * noiseScale.x);\n\
    noisevec.y = czm_snoise(st * noiseScale.y);\n\
    \n\
    vec2 location = st + noisevec;\n\
    float dist = sqrt(location.x * location.x + location.y * location.y);\n\
    dist *= ringFrequency;\n\
    \n\
    float r = fract(dist + noisevec[0] + noisevec[1]) * 2.0;\n\
    if(r > 1.0)\n\
        r = 2.0 - r;\n\
        \n\
    vec4 color = mix(lightWoodColor, darkWoodColor, r);\n\
    \n\
    //streaks\n\
    r = abs(czm_snoise(vec2(st.x * grainFrequency, st.y * grainFrequency * 0.02))) * 0.2;\n\
    color.rgb += lightWoodColor.rgb * r;\n\
    \n\
    material.diffuse = color.rgb;\n\
    material.alpha = color.a;\n\
    \n\
    return material;\n\
}";
});