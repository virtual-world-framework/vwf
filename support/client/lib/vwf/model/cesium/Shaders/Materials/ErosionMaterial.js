    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "uniform vec4 color;\n\
uniform float time;\n\
\n\
czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
\n\
    float alpha = 1.0;\n\
    if (time != 1.0)\n\
    {\n\
        float t = 0.5 + (0.5 * czm_snoise(materialInput.str / (1.0 / 10.0)));   // Scale [-1, 1] to [0, 1]\n\
    \n\
        if (t > time)\n\
        {\n\
            alpha = 0.0;\n\
        }\n\
    }\n\
    \n\
    material.diffuse = color.rgb;\n\
    material.alpha = color.a * alpha;\n\
\n\
    return material;\n\
}\n\
";
});