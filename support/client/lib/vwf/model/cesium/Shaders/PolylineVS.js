//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "attribute vec3 position3DHigh;\n\
attribute vec3 position3DLow;\n\
attribute vec3 position2DHigh;\n\
attribute vec3 position2DLow;\n\
attribute vec3 prevPosition3DHigh;\n\
attribute vec3 prevPosition3DLow;\n\
attribute vec3 prevPosition2DHigh;\n\
attribute vec3 prevPosition2DLow;\n\
attribute vec3 nextPosition3DHigh;\n\
attribute vec3 nextPosition3DLow;\n\
attribute vec3 nextPosition2DHigh;\n\
attribute vec3 nextPosition2DLow;\n\
attribute vec4 texCoordExpandWidthAndShow;\n\
attribute vec4 pickColor;\n\
\n\
varying vec2  v_textureCoordinates;\n\
varying float v_width;\n\
varying vec4  czm_pickColor;\n\
\n\
const vec2 czm_highResolutionSnapScale = vec2(1.0, 1.0);    // TODO\n\
\n\
void clipLineSegmentToNearPlane(\n\
    vec3 p0,\n\
    vec3 p1,\n\
    out vec4 positionWC,\n\
    out bool clipped,\n\
    out bool culledByNearPlane)\n\
{\n\
    culledByNearPlane = false;\n\
    clipped = false;\n\
    \n\
    vec3 p1ToP0 = p1 - p0;\n\
    float magnitude = length(p1ToP0);\n\
    vec3 direction = normalize(p1ToP0);\n\
    float endPoint0Distance =  -(czm_currentFrustum.x + p0.z);\n\
    float denominator = -direction.z;\n\
    \n\
    if (endPoint0Distance < 0.0 && abs(denominator) < czm_epsilon7)\n\
    {\n\
        culledByNearPlane = true;\n\
    }\n\
    else if (endPoint0Distance < 0.0 && abs(denominator) > czm_epsilon7)\n\
    {\n\
        // t = (-plane distance - dot(plane normal, ray origin)) / dot(plane normal, ray direction)\n\
        float t = (czm_currentFrustum.x + p0.z) / denominator;\n\
        if (t < 0.0 || t > magnitude)\n\
        {\n\
            culledByNearPlane = true;\n\
        }\n\
        else\n\
        {\n\
            p0 = p0 + t * direction;\n\
            clipped = true;\n\
        }\n\
    }\n\
    \n\
    positionWC = czm_eyeToWindowCoordinates(vec4(p0, 1.0));\n\
}\n\
\n\
void main() \n\
{\n\
    float texCoord = texCoordExpandWidthAndShow.x;\n\
    float expandDir = texCoordExpandWidthAndShow.y;\n\
    float width = abs(texCoordExpandWidthAndShow.z) + 0.5;\n\
    bool usePrev = texCoordExpandWidthAndShow.z < 0.0;\n\
    float show = texCoordExpandWidthAndShow.w;\n\
    \n\
    vec4 p, prev, next;\n\
    if (czm_morphTime == 1.0)\n\
    {\n\
        p = vec4(czm_translateRelativeToEye(position3DHigh.xyz, position3DLow.xyz), 1.0);\n\
        prev = vec4(czm_translateRelativeToEye(prevPosition3DHigh.xyz, prevPosition3DLow.xyz), 1.0);\n\
        next = vec4(czm_translateRelativeToEye(nextPosition3DHigh.xyz, nextPosition3DLow.xyz), 1.0);\n\
    }\n\
    else if (czm_morphTime == 0.0)\n\
    {\n\
        p = vec4(czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy), 1.0);\n\
        prev = vec4(czm_translateRelativeToEye(prevPosition2DHigh.zxy, prevPosition2DLow.zxy), 1.0);\n\
        next = vec4(czm_translateRelativeToEye(nextPosition2DHigh.zxy, nextPosition2DLow.zxy), 1.0);\n\
    }\n\
    else\n\
    {\n\
        p = czm_columbusViewMorph(\n\
                czm_translateRelativeToEye(position2DHigh.zxy, position2DLow.zxy),\n\
                czm_translateRelativeToEye(position3DHigh.xyz, position3DLow.xyz),\n\
                czm_morphTime);\n\
        prev = czm_columbusViewMorph(\n\
                czm_translateRelativeToEye(prevPosition2DHigh.zxy, prevPosition2DLow.zxy),\n\
                czm_translateRelativeToEye(prevPosition3DHigh.xyz, prevPosition3DLow.xyz),\n\
                czm_morphTime);\n\
        next = czm_columbusViewMorph(\n\
                czm_translateRelativeToEye(nextPosition2DHigh.zxy, nextPosition2DLow.zxy),\n\
                czm_translateRelativeToEye(nextPosition3DHigh.xyz, nextPosition3DLow.xyz),\n\
                czm_morphTime);\n\
    }\n\
    \n\
    vec4 endPointWC, p0, p1;\n\
    bool culledByNearPlane, clipped;\n\
    \n\
    vec4 positionEC = czm_modelViewRelativeToEye * p;\n\
    vec4 prevEC = czm_modelViewRelativeToEye * prev;\n\
    vec4 nextEC = czm_modelViewRelativeToEye * next;\n\
    \n\
    clipLineSegmentToNearPlane(prevEC.xyz, positionEC.xyz, p0, clipped, culledByNearPlane);\n\
    clipLineSegmentToNearPlane(nextEC.xyz, positionEC.xyz, p1, clipped, culledByNearPlane);\n\
    clipLineSegmentToNearPlane(positionEC.xyz, usePrev ? prevEC.xyz : nextEC.xyz, endPointWC, clipped, culledByNearPlane);\n\
    \n\
    if (culledByNearPlane)\n\
    {\n\
        gl_Position = czm_projection * vec4(0.0, 0.0, 0.0, 1.0);\n\
        return;\n\
    }\n\
    \n\
    vec2 prevWC = normalize(p0.xy - endPointWC.xy);\n\
    vec2 nextWC = normalize(p1.xy - endPointWC.xy);\n\
    \n\
    float expandWidth = width * 0.5;\n\
    vec2 direction;\n\
\n\
	if (czm_equalsEpsilon(normalize(prev.xyz - p.xyz), vec3(0.0), czm_epsilon1) || czm_equalsEpsilon(prevWC, -nextWC, czm_epsilon1))\n\
	{\n\
	    direction = vec2(-nextWC.y, nextWC.x);\n\
    }\n\
	else if (czm_equalsEpsilon(normalize(next.xyz - p.xyz), vec3(0.0), czm_epsilon1) || clipped)\n\
	{\n\
        direction = vec2(prevWC.y, -prevWC.x);\n\
    }\n\
    else\n\
    {\n\
	    vec2 normal = vec2(-nextWC.y, nextWC.x);\n\
	    direction = normalize((nextWC + prevWC) * 0.5);\n\
	    if (dot(direction, normal) < 0.0)\n\
	    {\n\
	        direction = -direction;\n\
	    }\n\
	    \n\
	    // The sine of the angle between the two vectors is given by the formula\n\
	    //         |a x b| = |a||b|sin(theta)\n\
	    // which is\n\
	    //     float sinAngle = length(cross(vec3(direction, 0.0), vec3(nextWC, 0.0)));\n\
	    // Because the z components of both vectors are zero, the x and y coordinate will be zero.\n\
	    // Therefore, the sine of the angle is just the z component of the cross product.\n\
	    float sinAngle = abs(direction.x * nextWC.y - direction.y * nextWC.x);\n\
	    expandWidth = clamp(expandWidth / sinAngle, 0.0, width * 2.0);\n\
    }\n\
\n\
    vec2 offset = direction * expandDir * expandWidth * czm_highResolutionSnapScale;\n\
    vec4 positionWC = vec4(endPointWC.xy + offset, -endPointWC.z, 1.0);\n\
    gl_Position = czm_viewportOrthographic * positionWC * show;\n\
    \n\
    v_textureCoordinates = vec2(texCoord, clamp(expandDir, 0.0, 1.0));\n\
    v_width = width;\n\
    czm_pickColor = pickColor;\n\
}\n\
";
});