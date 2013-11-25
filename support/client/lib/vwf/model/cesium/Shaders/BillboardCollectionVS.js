//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "attribute vec3 positionHigh;\n\
attribute vec3 positionLow;\n\
attribute vec2 direction;\n\
attribute vec4 textureCoordinatesAndImageSize;\n\
attribute vec3 originAndShow;\n\
attribute vec2 pixelOffset;\n\
attribute vec4 eyeOffsetAndScale;\n\
attribute vec4 rotationAndAlignedAxis;\n\
attribute vec4 scaleByDistance;\n\
#ifdef RENDER_FOR_PICK\n\
attribute vec4 pickColor;\n\
#else\n\
attribute vec4 color;\n\
#endif\n\
const vec2 czm_highResolutionSnapScale = vec2(1.0, 1.0);\n\
varying vec2 v_textureCoordinates;\n\
#ifdef RENDER_FOR_PICK\n\
varying vec4 v_pickColor;\n\
#else\n\
varying vec4 v_color;\n\
#endif\n\
void main()\n\
{\n\
vec3 eyeOffset = eyeOffsetAndScale.xyz;\n\
float scale = eyeOffsetAndScale.w;\n\
vec2 textureCoordinates = textureCoordinatesAndImageSize.xy;\n\
vec2 imageSize = textureCoordinatesAndImageSize.zw;\n\
vec2 origin = originAndShow.xy;\n\
float show = originAndShow.z;\n\
vec4 p = czm_translateRelativeToEye(positionHigh, positionLow);\n\
vec4 positionEC = czm_modelViewRelativeToEye * p;\n\
positionEC = czm_eyeOffset(positionEC, eyeOffset);\n\
positionEC.xyz *= show;\n\
#ifdef EYE_DISTANCE_SCALING\n\
float lengthSq;\n\
if (czm_sceneMode == czm_sceneMode2D)\n\
{\n\
lengthSq = czm_eyeHeight2D.y;\n\
}\n\
else\n\
{\n\
lengthSq = dot(positionEC.xyz, positionEC.xyz);\n\
}\n\
float scaleAtMin = scaleByDistance.y;\n\
float scaleAtMax = scaleByDistance.w;\n\
float nearDistanceSq = scaleByDistance.x * scaleByDistance.x;\n\
float farDistanceSq = scaleByDistance.z * scaleByDistance.z;\n\
lengthSq = clamp(lengthSq, nearDistanceSq, farDistanceSq);\n\
float t = (lengthSq - nearDistanceSq) / (farDistanceSq - nearDistanceSq);\n\
t = pow(t, 0.15);\n\
scale *= mix(scaleAtMin, scaleAtMax, t);\n\
#endif\n\
vec4 positionWC = czm_eyeToWindowCoordinates(positionEC);\n\
vec2 halfSize = imageSize * scale * czm_highResolutionSnapScale;\n\
halfSize *= ((direction * 2.0) - 1.0);\n\
positionWC.xy += (origin * abs(halfSize));\n\
#ifdef ROTATION\n\
float rotation = rotationAndAlignedAxis.x;\n\
vec3 alignedAxis = rotationAndAlignedAxis.yzw;\n\
if (!all(equal(rotationAndAlignedAxis, vec4(0.0))))\n\
{\n\
float angle = rotation;\n\
if (!all(equal(alignedAxis, vec3(0.0))))\n\
{\n\
vec3 pos = positionEC.xyz + czm_encodedCameraPositionMCHigh + czm_encodedCameraPositionMCLow;\n\
vec3 normal = normalize(cross(alignedAxis, pos));\n\
vec4 tangent = vec4(normalize(cross(pos, normal)), 0.0);\n\
tangent = czm_modelViewProjection * tangent;\n\
angle += sign(-tangent.x) * acos(tangent.y / length(tangent.xy));\n\
}\n\
float cosTheta = cos(angle);\n\
float sinTheta = sin(angle);\n\
mat2 rotationMatrix = mat2(cosTheta, sinTheta, -sinTheta, cosTheta);\n\
halfSize = rotationMatrix * halfSize;\n\
}\n\
#endif\n\
positionWC.xy += halfSize;\n\
positionWC.xy += (pixelOffset * czm_highResolutionSnapScale);\n\
gl_Position = czm_viewportOrthographic * vec4(positionWC.xy, -positionWC.z, 1.0);\n\
v_textureCoordinates = textureCoordinates;\n\
#ifdef RENDER_FOR_PICK\n\
v_pickColor = pickColor;\n\
#else\n\
v_color = color;\n\
#endif\n\
}\n\
";
});