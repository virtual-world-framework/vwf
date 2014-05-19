    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "uniform vec4 brickColor;\n\
uniform vec4 mortarColor;\n\
uniform vec2 brickSize;\n\
uniform vec2 brickPct;\n\
uniform float brickRoughness;\n\
uniform float mortarRoughness;\n\
\n\
#define Integral(x, p) ((floor(x) * p) + max(fract(x) - (1.0 - p), 0.0))\n\
\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
\n\
    // From OpenGL Shading Language (3rd edition) pg. 194, 501\n\
    vec2 st = materialInput.st;\n\
    vec2 position = st / brickSize;\n\
    if(fract(position.y * 0.5) > 0.5) {\n\
        position.x += 0.5;    \n\
    }\n\
        \n\
    //calculate whether to use brick or mortar (does AA)\n\
    vec2 filterWidth = vec2(0.02);\n\
    vec2 useBrick = (Integral(position + filterWidth, brickPct) - \n\
                       Integral(position, brickPct)) / filterWidth;\n\
    float useBrickFinal = useBrick.x * useBrick.y;\n\
    vec4 color = mix(mortarColor, brickColor, useBrickFinal);\n\
    \n\
    //Apply noise to brick\n\
    vec2 brickScaled = vec2(st.x / 0.1, st.y / 0.006);\n\
    float brickNoise = abs(czm_snoise(brickScaled) * brickRoughness / 5.0);\n\
    color.rg += brickNoise * useBrickFinal;\n\
    \n\
    //Apply noise to mortar\n\
    vec2 mortarScaled = st / 0.005;\n\
    float mortarNoise = max(czm_snoise(mortarScaled) * mortarRoughness, 0.0);\n\
    color.rgb += mortarNoise * (1.0 - useBrickFinal); \n\
\n\
    material.diffuse = color.rgb;\n\
    material.alpha = color.a;\n\
    \n\
    return material;\n\
}";
});