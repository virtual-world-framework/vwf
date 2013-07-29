//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "uniform vec3 u_radii;\n\
uniform vec3 u_oneOverEllipsoidRadiiSquared;\n\
\n\
varying vec3 v_positionEC;\n\
\n\
vec4 computeEllipsoidColor(czm_ray ray, float intersection, float side)\n\
{\n\
    vec3 positionEC = czm_pointAlongRay(ray, intersection);\n\
    vec3 positionMC = (czm_inverseModelView * vec4(positionEC, 1.0)).xyz;\n\
    vec3 geodeticNormal = normalize(czm_geodeticSurfaceNormal(positionMC, vec3(0.0), u_oneOverEllipsoidRadiiSquared));\n\
    vec3 sphericalNormal = normalize(positionMC / u_radii);\n\
    vec3 normalMC = geodeticNormal * side;              // normalized surface normal (always facing the viewer) in model coordinates\n\
    vec3 normalEC = normalize(czm_normal * normalMC);   // normalized surface normal in eye coordiantes\n\
\n\
    vec2 st = czm_ellipsoidWgs84TextureCoordinates(sphericalNormal);\n\
    vec3 positionToEyeEC = -positionEC;\n\
\n\
    czm_materialInput materialInput;\n\
    materialInput.s = st.s;\n\
    materialInput.st = st;\n\
    materialInput.str = (positionMC + u_radii) / u_radii;\n\
    materialInput.normalEC = normalEC;\n\
    materialInput.tangentToEyeMatrix = czm_eastNorthUpToEyeCoordinates(positionMC, normalEC);\n\
    materialInput.positionToEyeEC = positionToEyeEC;\n\
    czm_material material = czm_getMaterial(materialInput);\n\
\n\
    return czm_phong(normalize(positionToEyeEC), material);\n\
}\n\
\n\
void main()\n\
{\n\
    czm_ellipsoid ellipsoid = czm_ellipsoidNew(czm_modelView[3].xyz, u_radii);\n\
    vec3 direction = normalize(v_positionEC);\n\
    czm_ray ray = czm_ray(vec3(0.0), direction);\n\
    czm_raySegment intersection = czm_rayEllipsoidIntersectionInterval(ray, ellipsoid);\n\
\n\
    if (czm_isEmpty(intersection))\n\
    {\n\
        discard;\n\
    }\n\
\n\
    // If the viewer is outside, compute outsideFaceColor, with normals facing outward.\n\
    vec4 outsideFaceColor = (intersection.start != 0.0) ? computeEllipsoidColor(ray, intersection.start, 1.0) : vec4(0.0);\n\
\n\
    // If the viewer either is inside or can see inside, compute insideFaceColor, with normals facing inward.\n\
    vec4 insideFaceColor = (outsideFaceColor.a < 1.0) ? computeEllipsoidColor(ray, intersection.stop, -1.0) : vec4(0.0);\n\
\n\
    gl_FragColor = mix(insideFaceColor, outsideFaceColor, outsideFaceColor.a);\n\
    gl_FragColor.a = 1.0 - (1.0 - insideFaceColor.a) * (1.0 - outsideFaceColor.a);\n\
}\n\
";
});