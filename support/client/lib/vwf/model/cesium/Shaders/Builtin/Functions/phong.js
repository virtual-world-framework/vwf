    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "float czm_private_getLambertDiffuseOfMaterial(vec3 lightDirectionEC, czm_material material)\n\
{\n\
    return czm_getLambertDiffuse(lightDirectionEC, material.normal);\n\
}\n\
\n\
float czm_private_getSpecularOfMaterial(vec3 lightDirectionEC, vec3 toEyeEC, czm_material material)\n\
{\n\
    return czm_getSpecular(lightDirectionEC, toEyeEC, material.normal, material.shininess);\n\
}\n\
\n\
/**\n\
 * Computes a color using the Phong lighting model.\n\
 *\n\
 * @name czm_phong\n\
 * @glslFunction\n\
 *\n\
 * @param {vec3} toEye A normalized vector from the fragment to the eye in eye coordinates.\n\
 * @param {czm_material} material The fragment's material.\n\
 * \n\
 * @returns {vec4} The computed color.\n\
 * \n\
 * @example\n\
 * vec3 positionToEyeEC = // ...\n\
 * czm_material material = // ...\n\
 * gl_FragColor = czm_phong(normalize(positionToEyeEC), material);\n\
 *\n\
 * @see czm_getMaterial\n\
 */\n\
vec4 czm_phong(vec3 toEye, czm_material material)\n\
{\n\
    // Diffuse from directional light sources at eye (for top-down and horizon views)\n\
    float diffuse = czm_private_getLambertDiffuseOfMaterial(vec3(0.0, 0.0, 1.0), material) + czm_private_getLambertDiffuseOfMaterial(vec3(0.0, 1.0, 0.0), material);\n\
\n\
    // Specular from sun and pseudo-moon\n\
    float specular = czm_private_getSpecularOfMaterial(czm_sunDirectionEC, toEye, material) + czm_private_getSpecularOfMaterial(czm_moonDirectionEC, toEye, material);\n\
\n\
    // Temporary workaround for adding ambient.\n\
    vec3 materialDiffuse = material.diffuse * 0.5;\n\
    \n\
    vec3 ambient = materialDiffuse;\n\
    vec3 color = ambient + material.emission;\n\
    color += materialDiffuse * diffuse;\n\
    color += material.specular * specular;\n\
\n\
    return vec4(color, material.alpha);\n\
}\n\
\n\
vec4 czm_private_phong(vec3 toEye, czm_material material)\n\
{\n\
    float diffuse = czm_private_getLambertDiffuseOfMaterial(czm_sunDirectionEC, material);\n\
    float specular = czm_private_getSpecularOfMaterial(czm_sunDirectionEC, toEye, material);\n\
\n\
    vec3 ambient = vec3(0.0);\n\
    vec3 color = ambient + material.emission;\n\
    color += material.diffuse * diffuse;\n\
    color += material.specular * specular;\n\
\n\
    return vec4(color, material.alpha);\n\
}";
});