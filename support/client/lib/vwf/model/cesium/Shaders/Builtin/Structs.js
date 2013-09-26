//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "struct czm_materialInput\n\
{\n\
float s;\n\
vec2 st;\n\
vec3 str;\n\
vec3 normalEC;\n\
mat3 tangentToEyeMatrix;\n\
vec3 positionToEyeEC;\n\
};\n\
struct czm_material\n\
{\n\
vec3 diffuse;\n\
float specular;\n\
float shininess;\n\
vec3 normal;\n\
vec3 emission;\n\
float alpha;\n\
};\n\
struct czm_ray\n\
{\n\
vec3 origin;\n\
vec3 direction;\n\
};\n\
struct czm_raySegment\n\
{\n\
float start;\n\
float stop;\n\
};\n\
const czm_raySegment czm_emptyRaySegment = czm_raySegment(-czm_infinity, -czm_infinity);\n\
const czm_raySegment czm_fullRaySegment = czm_raySegment(0.0, czm_infinity);\n\
struct czm_ellipsoid\n\
{\n\
vec3 center;\n\
vec3 radii;\n\
vec3 inverseRadii;\n\
vec3 inverseRadiiSquared;\n\
};\n\
";
});