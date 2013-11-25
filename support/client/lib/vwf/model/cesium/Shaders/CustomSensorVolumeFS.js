//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "#ifdef GL_OES_standard_derivatives\n\
#extension GL_OES_standard_derivatives : enable\n\
#endif\n\
uniform bool u_showIntersection;\n\
uniform bool u_showThroughEllipsoid;\n\
uniform float u_sensorRadius;\n\
uniform float u_normalDirection;\n\
varying vec3 v_positionWC;\n\
varying vec3 v_positionEC;\n\
varying vec3 v_normalEC;\n\
vec4 getColor(float sensorRadius, vec3 pointEC)\n\
{\n\
czm_materialInput materialInput;\n\
vec3 pointMC = (czm_inverseModelView * vec4(pointEC, 1.0)).xyz;\n\
materialInput.st = sensor2dTextureCoordinates(sensorRadius, pointMC);\n\
materialInput.str = pointMC / sensorRadius;\n\
vec3 positionToEyeEC = -v_positionEC;\n\
materialInput.positionToEyeEC = positionToEyeEC;\n\
vec3 normalEC = normalize(v_normalEC);\n\
materialInput.normalEC = u_normalDirection * normalEC;\n\
czm_material material = czm_getMaterial(materialInput);\n\
return mix(czm_phong(normalize(positionToEyeEC), material), vec4(material.diffuse, material.alpha), 0.4);\n\
}\n\
bool isOnBoundary(float value, float epsilon)\n\
{\n\
float width = getIntersectionWidth();\n\
float tolerance = width * epsilon;\n\
#ifdef GL_OES_standard_derivatives\n\
float delta = max(abs(dFdx(value)), abs(dFdy(value)));\n\
float pixels = width * delta;\n\
float temp = abs(value);\n\
return temp < tolerance && temp < pixels || (delta < 10.0 * tolerance && temp - delta < tolerance && temp < pixels);\n\
#else\n\
return abs(value) < tolerance;\n\
#endif\n\
}\n\
vec4 shade(bool isOnBoundary)\n\
{\n\
if (u_showIntersection && isOnBoundary)\n\
{\n\
return getIntersectionColor();\n\
}\n\
return getColor(u_sensorRadius, v_positionEC);\n\
}\n\
float ellipsoidSurfaceFunction(czm_ellipsoid ellipsoid, vec3 point)\n\
{\n\
vec3 scaled = ellipsoid.inverseRadii * point;\n\
return dot(scaled, scaled) - 1.0;\n\
}\n\
void main()\n\
{\n\
vec3 sensorVertexWC = czm_model[3].xyz;\n\
vec3 sensorVertexEC = czm_modelView[3].xyz;\n\
czm_ellipsoid ellipsoid = czm_getWgs84EllipsoidEC();\n\
float ellipsoidValue = ellipsoidSurfaceFunction(ellipsoid, v_positionWC);\n\
if (!u_showThroughEllipsoid)\n\
{\n\
if (ellipsoidValue < 0.0)\n\
{\n\
discard;\n\
}\n\
if (inSensorShadow(sensorVertexWC, ellipsoid, v_positionWC))\n\
{\n\
discard;\n\
}\n\
}\n\
if (distance(v_positionEC, sensorVertexEC) > u_sensorRadius)\n\
{\n\
discard;\n\
}\n\
bool isOnEllipsoid = isOnBoundary(ellipsoidValue, czm_epsilon3);\n\
gl_FragColor = shade(isOnEllipsoid);\n\
}\n\
";
});