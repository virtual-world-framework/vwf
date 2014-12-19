    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "#ifdef GL_OES_standard_derivatives\n\
    #extension GL_OES_standard_derivatives : enable\n\
#endif  \n\
\n\
uniform bool u_showIntersection;\n\
uniform bool u_showThroughEllipsoid;\n\
\n\
uniform float u_sensorRadius;\n\
uniform float u_normalDirection;\n\
\n\
varying vec3 v_positionWC;\n\
varying vec3 v_positionEC;\n\
varying vec3 v_normalEC;\n\
\n\
vec4 getColor(float sensorRadius, vec3 pointEC)\n\
{\n\
    czm_materialInput materialInput;\n\
    \n\
    vec3 pointMC = (czm_inverseModelView * vec4(pointEC, 1.0)).xyz;                                \n\
    materialInput.st = sensor2dTextureCoordinates(sensorRadius, pointMC);   \n\
    materialInput.str = pointMC / sensorRadius;\n\
    \n\
    vec3 positionToEyeEC = -v_positionEC;\n\
    materialInput.positionToEyeEC = positionToEyeEC;\n\
    \n\
    vec3 normalEC = normalize(v_normalEC);\n\
    materialInput.normalEC = u_normalDirection * normalEC;\n\
    \n\
    czm_material material = czm_getMaterial(materialInput);\n\
    return mix(czm_phong(normalize(positionToEyeEC), material), vec4(material.diffuse, material.alpha), 0.4);\n\
}\n\
\n\
bool isOnBoundary(float value, float epsilon)\n\
{\n\
    float width = getIntersectionWidth();\n\
    float tolerance = width * epsilon;\n\
\n\
#ifdef GL_OES_standard_derivatives\n\
    float delta = max(abs(dFdx(value)), abs(dFdy(value)));\n\
    float pixels = width * delta;\n\
    float temp = abs(value);\n\
    // There are a couple things going on here.\n\
    // First we test the value at the current fragment to see if it is within the tolerance.\n\
    // We also want to check if the value of an adjacent pixel is within the tolerance,\n\
    // but we don't want to admit points that are obviously not on the surface.\n\
    // For example, if we are looking for \"value\" to be close to 0, but value is 1 and the adjacent value is 2,\n\
    // then the delta would be 1 and \"temp - delta\" would be \"1 - 1\" which is zero even though neither of\n\
    // the points is close to zero.\n\
    return temp < tolerance && temp < pixels || (delta < 10.0 * tolerance && temp - delta < tolerance && temp < pixels);\n\
#else\n\
    return abs(value) < tolerance;\n\
#endif\n\
}\n\
\n\
vec4 shade(bool isOnBoundary)\n\
{\n\
    if (u_showIntersection && isOnBoundary)\n\
    {\n\
        return getIntersectionColor();\n\
    }\n\
    return getColor(u_sensorRadius, v_positionEC);\n\
}\n\
\n\
float ellipsoidSurfaceFunction(czm_ellipsoid ellipsoid, vec3 point)\n\
{\n\
    vec3 scaled = ellipsoid.inverseRadii * point;\n\
    return dot(scaled, scaled) - 1.0;\n\
}\n\
\n\
void main()\n\
{\n\
    vec3 sensorVertexWC = czm_model[3].xyz;      // (0.0, 0.0, 0.0) in model coordinates\n\
    vec3 sensorVertexEC = czm_modelView[3].xyz;  // (0.0, 0.0, 0.0) in model coordinates\n\
\n\
    czm_ellipsoid ellipsoid = czm_getWgs84EllipsoidEC();\n\
    float ellipsoidValue = ellipsoidSurfaceFunction(ellipsoid, v_positionWC);\n\
\n\
    // Occluded by the ellipsoid?\n\
	if (!u_showThroughEllipsoid)\n\
	{\n\
	    // Discard if in the ellipsoid    \n\
	    // PERFORMANCE_IDEA: A coarse check for ellipsoid intersection could be done on the CPU first.\n\
	    if (ellipsoidValue < 0.0)\n\
	    {\n\
            discard;\n\
	    }\n\
\n\
	    // Discard if in the sensor's shadow\n\
	    if (inSensorShadow(sensorVertexWC, ellipsoid, v_positionWC))\n\
	    {\n\
	        discard;\n\
	    }\n\
    }\n\
\n\
    // Discard if not in the sensor's sphere\n\
    // PERFORMANCE_IDEA: We can omit this check if the radius is Number.POSITIVE_INFINITY.\n\
    if (distance(v_positionEC, sensorVertexEC) > u_sensorRadius)\n\
    {\n\
        discard;\n\
    }\n\
    \n\
    // Notes: Each surface functions should have an associated tolerance based on the floating point error.\n\
    bool isOnEllipsoid = isOnBoundary(ellipsoidValue, czm_epsilon3);\n\
    gl_FragColor = shade(isOnEllipsoid);\n\
}\n\
";
});