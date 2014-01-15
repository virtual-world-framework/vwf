    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "czm_material czm_getMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material = czm_getDefaultMaterial(materialInput);\n\
    \n\
    vec3 normalWC = normalize(czm_inverseViewRotation * material.normal);\n\
    vec3 positionWC = normalize(czm_inverseViewRotation * materialInput.positionToEyeEC);\n\
    float cosAngIncidence = max(dot(normalWC, positionWC), 0.0);\n\
    \n\
    material.diffuse = mix(reflection.diffuse, refraction.diffuse, cosAngIncidence);\n\
    \n\
    return material;\n\
}\n\
";
});