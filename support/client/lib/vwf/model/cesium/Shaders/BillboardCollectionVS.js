    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "attribute vec3 positionHigh;\n\
attribute vec3 positionLow;\n\
attribute vec2 direction;                       // in screen space\n\
attribute vec4 textureCoordinatesAndImageSize;  // size in normalized texture coordinates\n\
attribute vec3 originAndShow;                   // show is 0.0 (false) or 1.0 (true)\n\
attribute vec4 pixelOffsetAndTranslate;         // x,y, translateX, translateY\n\
attribute vec4 eyeOffsetAndScale;               // eye offset in meters\n\
attribute vec4 rotationAndAlignedAxis;\n\
attribute vec4 scaleByDistance;                 // near, nearScale, far, farScale\n\
attribute vec4 translucencyByDistance;          // near, nearTrans, far, farTrans\n\
attribute vec4 pixelOffsetScaleByDistance;      // near, nearScale, far, farScale\n\
\n\
#ifdef RENDER_FOR_PICK\n\
attribute vec4 pickColor;\n\
#else\n\
attribute vec4 color;\n\
#endif\n\
\n\
varying vec2 v_textureCoordinates;\n\
\n\
#ifdef RENDER_FOR_PICK\n\
varying vec4 v_pickColor;\n\
#else\n\
varying vec4 v_color;\n\
#endif\n\
\n\
float getNearFarScalar(vec4 nearFarScalar, float cameraDistSq)\n\
{\n\
    float valueAtMin = nearFarScalar.y;\n\
    float valueAtMax = nearFarScalar.w;\n\
    float nearDistanceSq = nearFarScalar.x * nearFarScalar.x;\n\
    float farDistanceSq = nearFarScalar.z * nearFarScalar.z;\n\
\n\
    float t = (cameraDistSq - nearDistanceSq) / (farDistanceSq - nearDistanceSq);\n\
\n\
    t = pow(clamp(t, 0.0, 1.0), 0.2);\n\
\n\
    return mix(valueAtMin, valueAtMax, t);\n\
}\n\
\n\
void main() \n\
{\n\
    // Modifying this shader may also require modifications to Billboard._computeScreenSpacePosition\n\
    \n\
    // unpack attributes\n\
    vec3 eyeOffset = eyeOffsetAndScale.xyz;\n\
    float scale = eyeOffsetAndScale.w;\n\
    vec2 textureCoordinates = textureCoordinatesAndImageSize.xy;\n\
    vec2 imageSize = textureCoordinatesAndImageSize.zw;\n\
    vec2 origin = originAndShow.xy;\n\
    float show = originAndShow.z;\n\
    vec2 pixelOffset = pixelOffsetAndTranslate.xy;\n\
    vec2 translate = pixelOffsetAndTranslate.zw;\n\
    \n\
    ///////////////////////////////////////////////////////////////////////////\n\
    \n\
    vec4 p = czm_translateRelativeToEye(positionHigh, positionLow);\n\
    vec4 positionEC = czm_modelViewRelativeToEye * p;\n\
    positionEC = czm_eyeOffset(positionEC, eyeOffset);\n\
    positionEC.xyz *= show;\n\
    \n\
    ///////////////////////////////////////////////////////////////////////////     \n\
\n\
#if defined(EYE_DISTANCE_SCALING) || defined(EYE_DISTANCE_TRANSLUCENCY) || defined(EYE_DISTANCE_PIXEL_OFFSET)\n\
    float lengthSq;\n\
    if (czm_sceneMode == czm_sceneMode2D)\n\
    {\n\
        // 2D camera distance is a special case\n\
        // treat all billboards as flattened to the z=0.0 plane\n\
        lengthSq = czm_eyeHeight2D.y;\n\
    }\n\
    else\n\
    {\n\
        lengthSq = dot(positionEC.xyz, positionEC.xyz);\n\
    }\n\
#endif\n\
\n\
#ifdef EYE_DISTANCE_SCALING\n\
    scale *= getNearFarScalar(scaleByDistance, lengthSq);\n\
    // push vertex behind near plane for clipping\n\
    if (scale == 0.0)\n\
    {\n\
        positionEC.xyz = vec3(0.0);\n\
    }\n\
#endif\n\
\n\
    float translucency = 1.0;\n\
#ifdef EYE_DISTANCE_TRANSLUCENCY\n\
    translucency = getNearFarScalar(translucencyByDistance, lengthSq);\n\
    // push vertex behind near plane for clipping\n\
    if (translucency == 0.0)\n\
    {\n\
        positionEC.xyz = vec3(0.0);\n\
    }\n\
#endif\n\
\n\
#ifdef EYE_DISTANCE_PIXEL_OFFSET\n\
    float pixelOffsetScale = getNearFarScalar(pixelOffsetScaleByDistance, lengthSq);\n\
    pixelOffset *= pixelOffsetScale;\n\
#endif\n\
\n\
    vec4 positionWC = czm_eyeToWindowCoordinates(positionEC);\n\
    \n\
    vec2 halfSize = imageSize * scale * czm_resolutionScale;\n\
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
    positionWC.xy += translate;\n\
    positionWC.xy += (pixelOffset * czm_resolutionScale);\n\
\n\
    gl_Position = czm_viewportOrthographic * vec4(positionWC.xy, -positionWC.z, 1.0);\n\
    v_textureCoordinates = textureCoordinates;\n\
\n\
#ifdef RENDER_FOR_PICK\n\
    v_pickColor = pickColor;\n\
#else\n\
    v_color = color;\n\
    v_color.a *= translucency;\n\
#endif\n\
}\n\
";
});