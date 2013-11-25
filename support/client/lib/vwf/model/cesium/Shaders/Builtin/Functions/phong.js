//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "float getLambertDiffuse(vec3 lightDirectionEC, vec3 normalEC)\n\
{\n\
return max(dot(lightDirectionEC, normalEC), 0.0);\n\
}\n\
float getLambertDiffuseOfMaterial(vec3 lightDirectionEC, czm_material material)\n\
{\n\
return getLambertDiffuse(lightDirectionEC, material.normal);\n\
}\n\
float getSpecular(vec3 lightDirectionEC, vec3 toEyeEC, vec3 normalEC, float shininess)\n\
{\n\
vec3 toReflectedLight = reflect(-lightDirectionEC, normalEC);\n\
float specular = max(dot(toReflectedLight, toEyeEC), 0.0);\n\
return pow(specular, shininess);\n\
}\n\
float getSpecularOfMaterial(vec3 lightDirectionEC, vec3 toEyeEC, czm_material material)\n\
{\n\
return getSpecular(lightDirectionEC, toEyeEC, material.normal, material.shininess);\n\
}\n\
vec4 czm_phong(vec3 toEye, czm_material material)\n\
{\n\
float diffuse = getLambertDiffuseOfMaterial(vec3(0.0, 0.0, 1.0), material) + getLambertDiffuseOfMaterial(vec3(0.0, 1.0, 0.0), material);\n\
float specular = getSpecularOfMaterial(czm_sunDirectionEC, toEye, material) + getSpecularOfMaterial(czm_moonDirectionEC, toEye, material);\n\
vec3 ambient = vec3(0.0);\n\
vec3 color = ambient + material.emission;\n\
color += material.diffuse * diffuse;\n\
color += material.specular * specular;\n\
return vec4(color, material.alpha);\n\
}\n\
";
});