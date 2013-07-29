//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "attribute vec3 positionHigh;\n\
attribute vec3 positionLow;\n\
attribute vec2 direction;                       // in screen space\n\
attribute vec4 textureCoordinatesAndImageSize;  // size in normalized texture coordinates\n\
attribute vec3 originAndShow;                   // show is 0.0 (false) or 1.0 (true)\n\
attribute vec2 pixelOffset;\n\
attribute vec4 eyeOffsetAndScale;               // eye offset in meters\n\
attribute vec4 rotationAndAlignedAxis;\n\
\n\
#ifdef RENDER_FOR_PICK\n\
attribute vec4 pickColor;\n\
#else\n\
attribute vec4 color;\n\
#endif\n\
\n\
const vec2 czm_highResolutionSnapScale = vec2(1.0, 1.0);    // TODO\n\
\n\
varying vec2 v_textureCoordinates;\n\
\n\
#ifdef RENDER_FOR_PICK\n\
varying vec4 v_pickColor;\n\
#else\n\
varying vec4 v_color;\n\
#endif\n\
\n\
void main() \n\
{\n\
    // Modifying this shader may also require modifications to Billboard.computeScreenSpacePosition\n\
    \n\
    // unpack attributes\n\
    vec3 eyeOffset = eyeOffsetAndScale.xyz;\n\
    float scale = eyeOffsetAndScale.w;\n\
    vec2 textureCoordinates = textureCoordinatesAndImageSize.xy;\n\
    vec2 imageSize = textureCoordinatesAndImageSize.zw;\n\
    vec2 origin = originAndShow.xy;\n\
    float show = originAndShow.z;\n\
    \n\
    ///////////////////////////////////////////////////////////////////////////\n\
    \n\
    vec4 p = vec4(czm_translateRelativeToEye(positionHigh, positionLow), 1.0);\n\
    vec4 positionEC = czm_modelViewRelativeToEye * p;\n\
    positionEC = czm_eyeOffset(positionEC, eyeOffset);\n\
    positionEC.xyz *= show;\n\
    \n\
    ///////////////////////////////////////////////////////////////////////////     \n\
    \n\
    vec4 positionWC = czm_eyeToWindowCoordinates(positionEC);\n\
    \n\
    vec2 halfSize = imageSize * scale * czm_highResolutionSnapScale;\n\
    halfSize *= ((direction * 2.0) - 1.0);\n\
    \n\
    positionWC.xy += (origin * abs(halfSize));\n\
    \n\
#ifdef ROTATION\n\
    float rotation = rotationAndAlignedAxis.x;\n\
    vec3 alignedAxis = rotationAndAlignedAxis.yzw;\n\
    \n\
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
        \n\
        float cosTheta = cos(angle);\n\
        float sinTheta = sin(angle);\n\
        mat2 rotationMatrix = mat2(cosTheta, sinTheta, -sinTheta, cosTheta);\n\
        halfSize = rotationMatrix * halfSize;\n\
    }\n\
#endif\n\
    \n\
    positionWC.xy += halfSize;\n\
    positionWC.xy += (pixelOffset * czm_highResolutionSnapScale);\n\
\n\
    gl_Position = czm_viewportOrthographic * vec4(positionWC.xy, -positionWC.z, 1.0);\n\
    v_textureCoordinates = textureCoordinates;\n\
\n\
#ifdef RENDER_FOR_PICK\n\
    v_pickColor = pickColor;\n\
#else\n\
    v_color = color;\n\
#endif\n\
}\n\
";
});