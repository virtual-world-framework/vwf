/**
 * @license
 * Description : Array and textureless GLSL 2D/3D/4D simplex 
 *               noise functions.
 *      Author : Ian McEwan, Ashima Arts.
 *  Maintainer : ijm
 *     Lastmod : 20110822 (ijm)
 *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
 *               Distributed under the MIT License. See LICENSE file.
 *               https://github.com/ashima/webgl-noise
 */
/**
 * @license
 * Cellular noise ("Worley noise") in 2D in GLSL.
 * Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
 * This code is released under the conditions of the MIT license.
 * See LICENSE file for details.
 */
//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_infinity\n\
 * @glslConstant \n\
 */\n\
const float czm_infinity = 5906376272000.0; // Distance from the Sun to Pluto in meters.  TODO: What is best given lowp, mediump, and highp?\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_epsilon1\n\
 * @glslConstant \n\
 */\n\
const float czm_epsilon1 = 0.1;\n\
        \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_epsilon2\n\
 * @glslConstant \n\
 */\n\
const float czm_epsilon2 = 0.01;\n\
        \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_epsilon3\n\
 * @glslConstant \n\
 */\n\
const float czm_epsilon3 = 0.001;\n\
        \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_epsilon4\n\
 * @glslConstant \n\
 */\n\
const float czm_epsilon4 = 0.0001;\n\
        \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_epsilon5\n\
 * @glslConstant \n\
 */\n\
const float czm_epsilon5 = 0.00001;\n\
        \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_epsilon6\n\
 * @glslConstant \n\
 */\n\
const float czm_epsilon6 = 0.000001;\n\
        \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_epsilon7\n\
 * @glslConstant \n\
 */\n\
const float czm_epsilon7 = 0.0000001;\n\
\n\
/**\n\
 * Compares <code>left</code> and <code>right</code> componentwise. Returns <code>true</code>\n\
 * if they are within <code>epsilon</code> and <code>false</code> otherwise. The inputs\n\
 * <code>left</code> and <code>right</code> can be <code>float</code>s, <code>vec2</code>s,\n\
 * <code>vec3</code>s, or <code>vec4</code>s.\n\
 *\n\
 * @name czm_equalsEpsilon\n\
 * @glslFunction\n\
 *\n\
 * @param {} left The first vector.\n\
 * @param {} right The second vector.\n\
 * @param {float} epsilon The epsilon to use for equality testing.\n\
 * @returns {bool} <code>true</code> if the components are within <code>epsilon</code> and <code>false</code> otherwise.\n\
 *\n\
 * @example\n\
 * // GLSL declarations\n\
 * bool czm_equalsEpsilon(float left, float right, float epsilon);\n\
 * bool czm_equalsEpsilon(vec2 left, vec2 right, float epsilon);\n\
 * bool czm_equalsEpsilon(vec3 left, vec3 right, float epsilon);\n\
 * bool czm_equalsEpsilon(vec4 left, vec4 right, float epsilon);\n\
 */\n\
bool czm_equalsEpsilon(vec4 left, vec4 right, float epsilon) {\n\
    return all(lessThanEqual(abs(left - right), vec4(epsilon)));\n\
}\n\
\n\
bool czm_equalsEpsilon(vec3 left, vec3 right, float epsilon) {\n\
    return all(lessThanEqual(abs(left - right), vec3(epsilon)));\n\
}\n\
\n\
bool czm_equalsEpsilon(vec2 left, vec2 right, float epsilon) {\n\
    return all(lessThanEqual(abs(left - right), vec2(epsilon)));\n\
}\n\
\n\
bool czm_equalsEpsilon(float left, float right, float epsilon) {\n\
    return (abs(left - right) <= epsilon);\n\
}\n\
\n\
bool czm_equalsEpsilon(float left, float right) {\n\
    // Workaround bug in Opera Next 12.  Do not delegate to the other czm_equalsEpsilon.\n\
    return (abs(left - right) <= czm_epsilon7);\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * Returns the transpose of the matrix.  The input <code>matrix</code> can be \n\
 * a <code>mat2</code>, <code>mat3</code>, or <code>mat4</code>.\n\
 *\n\
 * @name czm_transpose\n\
 * @glslFunction\n\
 *\n\
 * @param {} matrix The matrix to transpose.\n\
 *\n\
 * @returns {} The transposed matrix.\n\
 *\n\
 * @example\n\
 * // GLSL declarations\n\
 * mat2 czm_transpose(mat2 matrix);\n\
 * mat3 czm_transpose(mat3 matrix);\n\
 * mat4 czm_transpose(mat4 matrix);\n\
 *\n\
 * // Tranpose a 3x3 rotation matrix to find its inverse.\n\
 * mat3 eastNorthUpToEye = czm_eastNorthUpToEyeCoordinates(\n\
 *     positionMC, normalEC);\n\
 * mat3 eyeToEastNorthUp = czm_transpose(eastNorthUpToEye);\n\
 */\n\
mat2 czm_transpose(mat2 matrix)\n\
{\n\
    return mat2(\n\
        matrix[0][0], matrix[1][0],\n\
        matrix[0][1], matrix[1][1]);\n\
}\n\
\n\
mat3 czm_transpose(mat3 matrix)\n\
{\n\
    return mat3(\n\
        matrix[0][0], matrix[1][0], matrix[2][0],\n\
        matrix[0][1], matrix[1][1], matrix[2][1],\n\
        matrix[0][2], matrix[1][2], matrix[2][2]);\n\
}\n\
\n\
mat4 czm_transpose(mat4 matrix)\n\
{\n\
    return mat4(\n\
        matrix[0][0], matrix[1][0], matrix[2][0], matrix[3][0],\n\
        matrix[0][1], matrix[1][1], matrix[2][1], matrix[3][1],\n\
        matrix[0][2], matrix[1][2], matrix[2][2], matrix[3][2],\n\
        matrix[0][3], matrix[1][3], matrix[2][3], matrix[3][3]);\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * Transforms a position from model to window coordinates.  The transformation\n\
 * from model to clip coordinates is done using {@link czm_modelViewProjection}.\n\
 * The transform from normalized device coordinates to window coordinates is\n\
 * done using {@link czm_viewportTransformation}, which assumes a depth range\n\
 * of <code>near = 0</code> and <code>far = 1</code>.\n\
 * <br /><br />\n\
 * This transform is useful when there is a need to manipulate window coordinates\n\
 * in a vertex shader as done by {@link BillboardCollection}.\n\
 * <br /><br />\n\
 * This function should not be confused with {@link czm_viewportOrthographic},\n\
 * which is an orthographic projection matrix that transforms from window \n\
 * coordinates to clip coordinates.\n\
 *\n\
 * @name czm_modelToWindowCoordinates\n\
 * @glslFunction\n\
 *\n\
 * @param {vec4} position The position in model coordinates to transform.\n\
 *\n\
 * @returns {vec4} The transformed position in window coordinates.\n\
 *\n\
 * @see czm_eyeToWindowCoordinates\n\
 * @see czm_modelViewProjection\n\
 * @see czm_viewportTransformation\n\
 * @see czm_viewportOrthographic\n\
 * @see BillboardCollection\n\
 *\n\
 * @example\n\
 * vec4 positionWC = czm_modelToWindowCoordinates(positionMC);\n\
 */\n\
vec4 czm_modelToWindowCoordinates(vec4 position)\n\
{\n\
    vec4 q = czm_modelViewProjection * position;                // clip coordinates\n\
    q.xyz /= q.w;                                                // normalized device coordinates\n\
    q.xyz = (czm_viewportTransformation * vec4(q.xyz, 1.0)).xyz; // window coordinates\n\
    return q;\n\
}\n\
\n\
/**\n\
 * Transforms a position from eye to window coordinates.  The transformation\n\
 * from eye to clip coordinates is done using {@link czm_projection}.\n\
 * The transform from normalized device coordinates to window coordinates is\n\
 * done using {@link czm_viewportTransformation}, which assumes a depth range\n\
 * of <code>near = 0</code> and <code>far = 1</code>.\n\
 * <br /><br />\n\
 * This transform is useful when there is a need to manipulate window coordinates\n\
 * in a vertex shader as done by {@link BillboardCollection}.\n\
 *\n\
 * @name czm_eyeToWindowCoordinates\n\
 * @glslFunction\n\
 *\n\
 * @param {vec4} position The position in eye coordinates to transform.\n\
 *\n\
 * @returns {vec4} The transformed position in window coordinates.\n\
 *\n\
 * @see czm_modelToWindowCoordinates\n\
 * @see czm_projection\n\
 * @see czm_viewportTransformation\n\
 * @see BillboardCollection\n\
 *\n\
 * @example\n\
 * vec4 positionWC = czm_eyeToWindowCoordinates(positionEC);\n\
 */\n\
vec4 czm_eyeToWindowCoordinates(vec4 positionEC)\n\
{\n\
    vec4 q = czm_projection * positionEC;                       // clip coordinates\n\
    q.xyz /= q.w;                                                // normalized device coordinates\n\
    q.xyz = (czm_viewportTransformation * vec4(q.xyz, 1.0)).xyz; // window coordinates\n\
    return q;\n\
}\n\
\n\
/**\n\
 * Transforms a position from window to eye coordinates.\n\
 * The transform from window to normalized device coordinates is done using components\n\
 * of (@link czm_viewport} and {@link czm_viewportTransformation} instead of calculating\n\
 * the inverse of <code>czm_viewportTransformation</code>. The transformation from \n\
 * normalized device coordinates to clip coordinates is done using <code>positionWC.w</code>,\n\
 * which is expected to be the scalar used in the perspective divide. The transformation\n\
 * from clip to eye coordinates is done using {@link czm_inverseProjection}.\n\
 *\n\
 * @name czm_windowToEyeCoordinates\n\
 * @glslFunction\n\
 *\n\
 * @param {vec4} fragmentCoordinate The position in window coordinates to transform.\n\
 *\n\
 * @returns {vec4} The transformed position in eye coordinates.\n\
 *\n\
 * @see czm_modelToWindowCoordinates\n\
 * @see czm_eyeToWindowCoordinates\n\
 * @see czm_inverseProjection\n\
 * @see czm_viewport\n\
 * @see czm_viewportTransformation\n\
 *\n\
 * @example\n\
 * vec4 positionEC = czm_windowToEyeCoordinates(gl_FragCoord);\n\
 */\n\
vec4 czm_windowToEyeCoordinates(vec4 fragmentCoordinate)\n\
{\n\
    float x = 2.0 * (fragmentCoordinate.x - czm_viewport.x) / czm_viewport.z - 1.0;\n\
    float y = 2.0 * (fragmentCoordinate.y - czm_viewport.y) / czm_viewport.w - 1.0;\n\
    float z = (fragmentCoordinate.z - czm_viewportTransformation[3][2]) / czm_viewportTransformation[2][2];\n\
    vec4 q = vec4(x, y, z, 1.0);\n\
    q /= fragmentCoordinate.w;\n\
    q = czm_inverseProjection * q;\n\
    return q;\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_eyeOffset\n\
 * @glslFunction\n\
 *\n\
 * @param {vec4} positionEC DOC_TBA.\n\
 * @param {vec3} eyeOffset DOC_TBA.\n\
 *\n\
 * @returns {vec4} DOC_TBA.\n\
 */\n\
vec4 czm_eyeOffset(vec4 positionEC, vec3 eyeOffset)\n\
{\n\
    // This equation is approximate in x and y.\n\
    vec4 p = positionEC;\n\
    vec4 zEyeOffset = normalize(p) * eyeOffset.z;\n\
    p.xy += eyeOffset.xy + zEyeOffset.xy;\n\
    p.z += zEyeOffset.z;\n\
    return p;\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_geodeticSurfaceNormal\n\
 * @glslFunction\n\
 *\n\
 * @param {vec3} positionOnEllipsoid DOC_TBA\n\
 * @param {vec3} ellipsoidCenter DOC_TBA\n\
 * @param {vec3} oneOverEllipsoidRadiiSquared DOC_TBA\n\
 * \n\
 * @returns {vec3} DOC_TBA.\n\
 */\n\
vec3 czm_geodeticSurfaceNormal(vec3 positionOnEllipsoid, vec3 ellipsoidCenter, vec3 oneOverEllipsoidRadiiSquared)\n\
{\n\
    return normalize((positionOnEllipsoid - ellipsoidCenter) * oneOverEllipsoidRadiiSquared);\n\
}\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_ellipsoidWgs84TextureCoordinates\n\
 * @glslFunction\n\
 */\n\
vec2 czm_ellipsoidWgs84TextureCoordinates(vec3 normal)\n\
{\n\
    return vec2(atan(normal.y, normal.x) * czm_oneOverTwoPi + 0.5, asin(normal.z) * czm_oneOverPi + 0.5);\n\
}\n\
\n\
/**\n\
 * Computes a 3x3 rotation matrix that transforms vectors from an ellipsoid's east-north-up coordinate system \n\
 * to eye coordinates.  In east-north-up coordinates, x points east, y points north, and z points along the \n\
 * surface normal.  East-north-up can be used as an ellipsoid's tangent space for operations such as bump mapping.\n\
 * <br /><br />\n\
 * The ellipsoid is assumed to be centered at the model coordinate's origin.\n\
 *\n\
 * @name czm_eastNorthUpToEyeCoordinates\n\
 * @glslFunction\n\
 *\n\
 * @param {vec3} positionMC The position on the ellipsoid in model coordinates.\n\
 * @param {vec3} normalEC The normalized ellipsoid surface normal, at <code>positionMC</code>, in eye coordinates.\n\
 *\n\
 * @returns {mat3} A 3x3 rotation matrix that transforms vectors from the east-north-up coordinate system to eye coordinates.\n\
 *\n\
 * @example\n\
 * // Transform a vector defined in the east-north-up coordinate \n\
 * // system, (0, 0, 1) which is the surface normal, to eye \n\
 * // coordinates.\n\
 * mat3 m = czm_eastNorthUpToEyeCoordinates(positionMC, normalEC);\n\
 * vec3 normalEC = m * vec3(0.0, 0.0, 1.0);\n\
 */\n\
mat3 czm_eastNorthUpToEyeCoordinates(vec3 positionMC, vec3 normalEC)\n\
{\n\
    vec3 tangentMC = normalize(vec3(-positionMC.y, positionMC.x, 0.0));  // normalized surface tangent in model coordinates\n\
    vec3 tangentEC = normalize(czm_normal3D * tangentMC);                // normalized surface tangent in eye coordiantes\n\
    vec3 bitangentEC = normalize(cross(normalEC, tangentEC));            // normalized surface bitangent in eye coordinates\n\
\n\
    return mat3(\n\
        tangentEC.x,   tangentEC.y,   tangentEC.z,\n\
        bitangentEC.x, bitangentEC.y, bitangentEC.z,\n\
        normalEC.x,    normalEC.y,    normalEC.z);\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * Used as input to every material's czm_getMaterial function. \n\
 *\n\
 * @name czm_materialInput\n\
 * @glslStruct\n\
 *\n\
 * @property {float} s 1D texture coordinates.\n\
 * @property {vec2} st 2D texture coordinates.\n\
 * @property {vec3} str 3D texture coordinates.\n\
 * @property {vec3} normalEC Unperturbed surface normal in eye coordinates.\n\
 * @property {mat3} tangentToEyeMatrix Matrix for converting a tangent space normal to eye space.\n\
 * @property {vec3} positionToEyeEC Vector from the fragment to the eye in eye coordinates.  The magnitude is the distance in meters from the fragment to the eye.\n\
 */\n\
struct czm_materialInput\n\
{\n\
    float s;\n\
    vec2 st;\n\
    vec3 str;\n\
    vec3 normalEC;\n\
    mat3 tangentToEyeMatrix;\n\
    vec3 positionToEyeEC;\n\
};\n\
\n\
/**\n\
 * Holds material information that can be used for lighting. Returned by all czm_getMaterial functions.\n\
 *\n\
 * @name czm_material\n\
 * @glslStruct\n\
 *\n\
 * @property {vec3} diffuse Incoming light that scatters evenly in all directions.\n\
 * @property {float} specular Intensity of incoming light reflecting in a single direction.\n\
 * @property {float} shininess The sharpness of the specular reflection.  Higher values create a smaller, more focused specular highlight.\n\
 * @property {vec3} normal Surface's normal in eye coordinates. It is used for effects such as normal mapping. The default is the surface's unmodified normal.\n\
 * @property {vec3} emission Light emitted by the material equally in all directions. The default is vec3(0.0), which emits no light.\n\
 * @property {float} alpha Opacity of this material. 0.0 is completely transparent; 1.0 is completely opaque.\n\
 */\n\
struct czm_material\n\
{\n\
    vec3 diffuse;\n\
    float specular;\n\
    float shininess;\n\
    vec3 normal;\n\
    vec3 emission;\n\
    float alpha;\n\
};\n\
\n\
/**\n\
 * An czm_material with default values. Every material's czm_getMaterial\n\
 * should use this default material as a base for the material it returns.\n\
 * The default normal value is given by materialInput.normalEC.\n\
 *\n\
 * @name czm_getDefaultMaterial\n\
 * @glslFunction \n\
 *\n\
 * @param {czm_materialInput} input The input used to construct the default material.\n\
 * \n\
 * @returns {czm_material} The default material.\n\
 *\n\
 * @see czm_materialInput\n\
 * @see czm_material\n\
 * @see czm_getMaterial\n\
 */\n\
czm_material czm_getDefaultMaterial(czm_materialInput materialInput)\n\
{\n\
    czm_material material;\n\
    material.diffuse = vec3(0.0);\n\
    material.specular = 0.0;\n\
    material.shininess = 1.0;\n\
    material.normal = materialInput.normalEC;\n\
    material.emission = vec3(0.0);\n\
    material.alpha = 1.0;\n\
    return material;\n\
}\n\
\n\
float getLambertDiffuse(vec3 lightDirectionEC, vec3 normalEC)\n\
{\n\
    return max(dot(lightDirectionEC, normalEC), 0.0);\n\
}\n\
\n\
float getLambertDiffuseOfMaterial(vec3 lightDirectionEC, czm_material material)\n\
{\n\
    return getLambertDiffuse(lightDirectionEC, material.normal);\n\
}\n\
\n\
float getSpecular(vec3 lightDirectionEC, vec3 toEyeEC, vec3 normalEC, float shininess)\n\
{\n\
    vec3 toReflectedLight = reflect(-lightDirectionEC, normalEC);\n\
    float specular = max(dot(toReflectedLight, toEyeEC), 0.0);\n\
    return pow(specular, shininess);\n\
}\n\
\n\
float getSpecularOfMaterial(vec3 lightDirectionEC, vec3 toEyeEC, czm_material material)\n\
{\n\
    return getSpecular(lightDirectionEC, toEyeEC, material.normal, material.shininess);\n\
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
    float diffuse = getLambertDiffuseOfMaterial(vec3(0.0, 0.0, 1.0), material) + getLambertDiffuseOfMaterial(vec3(0.0, 1.0, 0.0), material);\n\
\n\
    // Specular from sun and pseudo-moon\n\
    float specular = getSpecularOfMaterial(czm_sunDirectionEC, toEye, material) + getSpecularOfMaterial(czm_moonDirectionEC, toEye, material);\n\
\n\
    vec3 ambient = vec3(0.0);\n\
    vec3 color = ambient + material.emission;\n\
    color += material.diffuse * diffuse;\n\
    color += material.specular * specular;\n\
\n\
    return vec4(color, material.alpha);\n\
}\n\
\n\
/**\n\
 * Computes the luminance of a color. \n\
 *\n\
 * @name czm_luminance\n\
 * @glslFunction\n\
 *\n\
 * @param {vec3} rgb The color.\n\
 * \n\
 * @returns {float} The luminance.\n\
 *\n\
 * @example\n\
 * float light = czm_luminance(vec3(0.0)); // 0.0\n\
 * float dark = czm_luminance(vec3(1.0));  // ~1.0 \n\
 */\n\
float czm_luminance(vec3 rgb)\n\
{\n\
    // Algorithm from Chapter 10 of Graphics Shaders.\n\
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);\n\
    return dot(rgb, W);\n\
}\n\
\n\
/**\n\
 * Adjusts the hue of a color.\n\
 * \n\
 * @name czm_hue\n\
 * @glslFunction\n\
 * \n\
 * @param {vec3} rgb The color.\n\
 * @param {float} adjustment The amount to adjust the hue of the color in radians.\n\
 *\n\
 * @returns {float} The color with the hue adjusted.\n\
 *\n\
 * @example\n\
 * vec3 adjustHue = czm_hue(color, czm_pi); // The same as czm_hue(color, -czm_pi)\n\
 */\n\
vec3 czm_hue(vec3 rgb, float adjustment)\n\
{\n\
    const mat3 toYIQ = mat3(0.299,     0.587,     0.114,\n\
                            0.595716, -0.274453, -0.321263,\n\
                            0.211456, -0.522591,  0.311135);\n\
    const mat3 toRGB = mat3(1.0,  0.9563,  0.6210,\n\
                            1.0, -0.2721, -0.6474,\n\
                            1.0, -1.107,   1.7046);\n\
    \n\
    vec3 yiq = toYIQ * rgb;\n\
    float hue = atan(yiq.z, yiq.y) + adjustment;\n\
    float chroma = sqrt(yiq.z * yiq.z + yiq.y * yiq.y);\n\
    \n\
    vec3 color = vec3(yiq.x, chroma * cos(hue), chroma * sin(hue));\n\
    return toRGB * color;\n\
}\n\
\n\
/**\n\
 * Adjusts the saturation of a color.\n\
 * \n\
 * @name czm_saturation\n\
 * @glslFunction\n\
 * \n\
 * @param {vec3} rgb The color.\n\
 * @param {float} adjustment The amount to adjust the saturation of the color.\n\
 *\n\
 * @returns {float} The color with the saturation adjusted.\n\
 *\n\
 * @example\n\
 * vec3 greyScale = czm_saturation(color, 0.0);\n\
 * vec3 doubleSaturation = czm_saturation(color, 2.0);\n\
 */\n\
vec3 czm_saturation(vec3 rgb, float adjustment)\n\
{\n\
    // Algorithm from Chapter 16 of OpenGL Shading Language\n\
    vec3 intensity = vec3(czm_luminance(rgb));\n\
    return mix(intensity, rgb, adjustment);\n\
}\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_multiplyWithColorBalance\n\
 * @glslFunction\n\
 */\n\
vec3 czm_multiplyWithColorBalance(vec3 left, vec3 right)\n\
{\n\
    // Algorithm from Chapter 10 of Graphics Shaders.\n\
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);\n\
    \n\
    vec3 target = left * right;\n\
    float leftLuminance = dot(left, W);\n\
    float rightLuminance = dot(right, W);\n\
    float targetLuminance = dot(target, W);\n\
    \n\
    return ((leftLuminance + rightLuminance) / (2.0 * targetLuminance)) * target;\n\
}\n\
\n\
/**\n\
 * Procedural anti-aliasing by blurring two colors that meet at a sharp edge.\n\
 *\n\
 * @name czm_antialias\n\
 * @glslFunction\n\
 *\n\
 * @param {vec4} color1 The color on one side of the edge.\n\
 * @param {vec4} color2 The color on the other side of the edge.\n\
 * @param {vec4} currentcolor The current color, either <code>color1</code> or <code>color2</code>.\n\
 * @param {float} dist The distance to the edge in texture coordinates.\n\
 * @param {float} [fuzzFactor=0.1] Controls the blurriness between the two colors.\n\
 * @returns {vec4} The anti-aliased color.\n\
 *\n\
 * @example\n\
 * // GLSL declarations\n\
 * vec4 czm_antialias(vec4 color1, vec4 color2, vec4 currentColor, float dist, float fuzzFactor);\n\
 * vec4 czm_antialias(vec4 color1, vec4 color2, vec4 currentColor, float dist);\n\
 *\n\
 * // get the color for a material that has a sharp edge at the line y = 0.5 in texture space\n\
 * float dist = abs(textureCoordinates.t - 0.5);\n\
 * vec4 currentColor = mix(bottomColor, topColor, step(0.5, textureCoordinates.t));\n\
 * vec4 color = czm_antialias(bottomColor, topColor, currentColor, dist, 0.1);\n\
 */\n\
vec4 czm_antialias(vec4 color1, vec4 color2, vec4 currentColor, float dist, float fuzzFactor)\n\
{\n\
    float val1 = clamp(dist / fuzzFactor, 0.0, 1.0);\n\
    float val2 = clamp((dist - 0.5) / fuzzFactor, 0.0, 1.0);\n\
    val1 = val1 * (1.0 - val2);\n\
    val1 = val1 * val1 * (3.0 - (2.0 * val1));\n\
    val1 = pow(val1, 0.5); //makes the transition nicer\n\
    \n\
    vec4 midColor = (color1 + color2) * 0.5;\n\
    return mix(midColor, currentColor, val1);\n\
}\n\
\n\
vec4 czm_antialias(vec4 color1, vec4 color2, vec4 currentColor, float dist)\n\
{\n\
    return czm_antialias(color1, color2, currentColor, dist, 0.1);\n\
}\n\
\n\
/**\n\
 * Converts an RGB color to CIE Yxy.\n\
 * <p>The conversion is described in\n\
 * <a href=\"http://content.gpwiki.org/index.php/D3DBook:High-Dynamic_Range_Rendering#Luminance_Transform\">Luminance Transform</a>\n\
 * </p>\n\
 * \n\
 * @name czm_RGBToXYZ\n\
 * @glslFunction\n\
 * \n\
 * @param {vec3} rgb The color in RGB.\n\
 *\n\
 * @returns {vec3} The color in CIE Yxy.\n\
 *\n\
 * @example\n\
 * vec3 xyz = czm_RGBToXYZ(rgb);\n\
 * xyz.x = max(xyz.x - luminanceThreshold, 0.0);\n\
 * rgb = czm_XYZToRGB(xyz);\n\
 */\n\
vec3 czm_RGBToXYZ(vec3 rgb)\n\
{\n\
	const mat3 RGB2XYZ = mat3(0.4124, 0.2126, 0.0193,\n\
	                          0.3576, 0.7152, 0.1192,\n\
	                          0.1805, 0.0722, 0.9505);\n\
    vec3 xyz = RGB2XYZ * rgb;\n\
    vec3 Yxy;\n\
    Yxy.r = xyz.g;\n\
    float temp = dot(vec3(1.0), xyz);\n\
    Yxy.gb = xyz.rg / temp;\n\
    return Yxy;\n\
}\n\
\n\
/**\n\
 * Converts a CIE Yxy color to RGB.\n\
 * <p>The conversion is described in\n\
 * <a href=\"http://content.gpwiki.org/index.php/D3DBook:High-Dynamic_Range_Rendering#Luminance_Transform\">Luminance Transform</a>\n\
 * </p>\n\
 * \n\
 * @name czm_XYZToRGB\n\
 * @glslFunction\n\
 * \n\
 * @param {vec3} Yxy The color in CIE Yxy.\n\
 *\n\
 * @returns {vec3} The color in RGB.\n\
 *\n\
 * @example\n\
 * vec3 xyz = czm_RGBToXYZ(rgb);\n\
 * xyz.x = max(xyz.x - luminanceThreshold, 0.0);\n\
 * rgb = czm_XYZToRGB(xyz);\n\
 */\n\
vec3 czm_XYZToRGB(vec3 Yxy)\n\
{\n\
	const mat3 XYZ2RGB = mat3( 3.2405, -0.9693,  0.0556,\n\
	                          -1.5371,  1.8760, -0.2040,\n\
	                          -0.4985,  0.0416,  1.0572);\n\
    vec3 xyz;\n\
    xyz.r = Yxy.r * Yxy.g / Yxy.b;\n\
    xyz.g = Yxy.r;\n\
    xyz.b = Yxy.r * (1.0 - Yxy.g - Yxy.b) / Yxy.b;\n\
    \n\
    return XYZ2RGB * xyz;\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * The maximum latitude, in radians, both North and South, supported by a Web Mercator\n\
 * (EPSG:3857) projection.  Technically, the Mercator projection is defined\n\
 * for any latitude up to (but not including) 90 degrees, but it makes sense\n\
 * to cut it off sooner because it grows exponentially with increasing latitude.\n\
 * The logic behind this particular cutoff value, which is the one used by\n\
 * Google Maps, Bing Maps, and Esri, is that it makes the projection\n\
 * square.  That is, the extent is equal in the X and Y directions.\n\
 *\n\
 * The constant value is computed as follows:\n\
 *   czm_pi * 0.5 - (2.0 * atan(exp(-czm_pi)))\n\
 *\n\
 * @name czm_webMercatorMaxLatitude\n\
 * @glslConstant\n\
 */\n\
const float czm_webMercatorMaxLatitude = 1.4844222297453323669610967939;\n\
\n\
/**\n\
 * Specifies a flat, 2D map.\n\
 *\n\
 * @name czm_scene2D\n\
 * @glslConstant \n\
 */\n\
const int czm_scene2D = 0;\n\
\n\
/**\n\
 * Specifies 2.D Columbus View.\n\
 *\n\
 * @name czm_columbusView\n\
 * @glslConstant \n\
 */\n\
const int czm_columbusView = 1;\n\
\n\
/**\n\
 * Specifies a 3D globe.\n\
 *\n\
 * @name czm_scene3D\n\
 * @glslConstant \n\
 */\n\
const int czm_scene3D = 2;\n\
\n\
/**\n\
 * Specifies that the scene is morphing between modes.\n\
 * \n\
 * @name czm_morphing\n\
 * @glslConstant\n\
 */\n\
const int czm_morphing = 3;\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_columbusViewMorph\n\
 * @glslFunction\n\
 */\n\
vec4 czm_columbusViewMorph(vec3 position2D, vec3 position3D, float time)\n\
{\n\
    // Just linear for now.\n\
    vec3 p = mix(position2D, position3D, time);\n\
    return vec4(p, 1.0);\n\
} \n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_ray\n\
 * @glslStruct\n\
 */\n\
struct czm_ray\n\
{\n\
    vec3 origin;\n\
    vec3 direction;\n\
};\n\
\n\
/**\n\
 * Computes the point along a ray at the given time.  <code>time</code> can be positive, negative, or zero.\n\
 *\n\
 * @name czm_pointAlongRay\n\
 * @glslFunction\n\
 *\n\
 * @param {czm_ray} ray The ray to compute the point along.\n\
 * @param {float} time The time along the ray.\n\
 * \n\
 * @returns {vec3} The point along the ray at the given time.\n\
 * \n\
 * @example\n\
 * czm_ray ray = czm_ray(vec3(0.0), vec3(1.0, 0.0, 0.0)); // origin, direction\n\
 * vec3 v = czm_pointAlongRay(ray, 2.0); // (2.0, 0.0, 0.0)\n\
 */\n\
vec3 czm_pointAlongRay(czm_ray ray, float time)\n\
{\n\
    return ray.origin + (time * ray.direction);\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_raySegment\n\
 * @glslStruct\n\
 */\n\
struct czm_raySegment\n\
{\n\
    float start;\n\
    float stop;\n\
};\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_emptyRaySegment\n\
 * @glslConstant \n\
 */\n\
const czm_raySegment czm_emptyRaySegment = czm_raySegment(-czm_infinity, -czm_infinity);\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_fullRaySegment\n\
 * @glslConstant \n\
 */\n\
const czm_raySegment czm_fullRaySegment = czm_raySegment(0.0, czm_infinity);\n\
\n\
/**\n\
 * Determines if a time interval is empty.\n\
 *\n\
 * @name czm_isEmpty\n\
 * @glslFunction \n\
 * \n\
 * @param {czm_raySegment} interval The interval to test.\n\
 * \n\
 * @returns {bool} <code>true</code> if the time interval is empty; otherwise, <code>false</code>.\n\
 *\n\
 * @example\n\
 * bool b0 = czm_isEmpty(czm_emptyRaySegment);      // true\n\
 * bool b1 = czm_isEmpty(czm_raySegment(0.0, 1.0)); // false\n\
 * bool b2 = czm_isEmpty(czm_raySegment(1.0, 1.0)); // false, contains 1.0.\n\
 */\n\
bool czm_isEmpty(czm_raySegment interval)\n\
{\n\
    return (interval.stop < 0.0);\n\
}\n\
\n\
/**\n\
 * Determines if a time interval is empty.\n\
 *\n\
 * @name czm_isFull\n\
 * @glslFunction \n\
 * \n\
 * @param {czm_raySegment} interval The interval to test.\n\
 * \n\
 * @returns {bool} <code>true</code> if the time interval is empty; otherwise, <code>false</code>.\n\
 *\n\
 * @example\n\
 * bool b0 = czm_isEmpty(czm_emptyRaySegment);      // true\n\
 * bool b1 = czm_isEmpty(czm_raySegment(0.0, 1.0)); // false\n\
 * bool b2 = czm_isEmpty(czm_raySegment(1.0, 1.0)); // false, contains 1.0.\n\
 */\n\
bool czm_isFull(czm_raySegment interval)\n\
{\n\
    return (interval.start == 0.0 && interval.stop == czm_infinity);\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_ellipsoid\n\
 * @glslStruct\n\
 */\n\
struct czm_ellipsoid\n\
{\n\
    vec3 center;\n\
    vec3 radii;\n\
    vec3 inverseRadii;\n\
    vec3 inverseRadiiSquared;\n\
};\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_ellipsoidNew\n\
 * @glslFunction\n\
 *\n\
 */\n\
czm_ellipsoid czm_ellipsoidNew(vec3 center, vec3 radii)\n\
{\n\
    vec3 inverseRadii = vec3(1.0 / radii.x, 1.0 / radii.y, 1.0 / radii.z);\n\
    vec3 inverseRadiiSquared = inverseRadii * inverseRadii;\n\
    czm_ellipsoid temp = czm_ellipsoid(center, radii, inverseRadii, inverseRadiiSquared);\n\
    return temp;\n\
}\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * @name czm_ellipsoidContainsPoint\n\
 * @glslFunction\n\
 *\n\
 */\n\
bool czm_ellipsoidContainsPoint(czm_ellipsoid ellipsoid, vec3 point)\n\
{\n\
    vec3 scaled = ellipsoid.inverseRadii * (czm_inverseModelView * vec4(point, 1.0)).xyz;\n\
    return (dot(scaled, scaled) <= 1.0);\n\
}\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 *\n\
 * @name czm_rayEllipsoidIntersectionInterval\n\
 * @glslFunction\n\
 */\n\
czm_raySegment czm_rayEllipsoidIntersectionInterval(czm_ray ray, czm_ellipsoid ellipsoid)\n\
{\n\
   // ray and ellipsoid center in eye coordinates.  radii in model coordinates.\n\
    vec3 q = ellipsoid.inverseRadii * (czm_inverseModelView * vec4(ray.origin, 1.0)).xyz;\n\
    vec3 w = ellipsoid.inverseRadii * (czm_inverseModelView * vec4(ray.direction, 0.0)).xyz;\n\
   \n\
    q = q - ellipsoid.inverseRadii * (czm_inverseModelView * vec4(ellipsoid.center, 1.0)).xyz;\n\
    \n\
    float q2 = dot(q, q);\n\
    float qw = dot(q, w);\n\
    \n\
    if (q2 > 1.0) // Outside ellipsoid.\n\
    {\n\
        if (qw >= 0.0) // Looking outward or tangent (0 intersections).\n\
        {\n\
            return czm_emptyRaySegment;\n\
        }\n\
        else // qw < 0.0.\n\
        {\n\
            float qw2 = qw * qw;\n\
            float difference = q2 - 1.0; // Positively valued.\n\
            float w2 = dot(w, w);\n\
            float product = w2 * difference;\n\
            \n\
            if (qw2 < product) // Imaginary roots (0 intersections).\n\
            {\n\
                return czm_emptyRaySegment;     \n\
            }   \n\
            else if (qw2 > product) // Distinct roots (2 intersections).\n\
            {\n\
                float discriminant = qw * qw - product;\n\
                float temp = -qw + sqrt(discriminant); // Avoid cancellation.\n\
                float root0 = temp / w2;\n\
                float root1 = difference / temp;\n\
                if (root0 < root1)\n\
                {\n\
                    czm_raySegment i = czm_raySegment(root0, root1);\n\
                    return i;\n\
                }\n\
                else\n\
                {\n\
                    czm_raySegment i = czm_raySegment(root1, root0);\n\
                    return i;\n\
                }\n\
            }\n\
            else // qw2 == product.  Repeated roots (2 intersections).\n\
            {\n\
                float root = sqrt(difference / w2);\n\
                czm_raySegment i = czm_raySegment(root, root);\n\
                return i;\n\
            }\n\
        }\n\
    }\n\
    else if (q2 < 1.0) // Inside ellipsoid (2 intersections).\n\
    {\n\
        float difference = q2 - 1.0; // Negatively valued.\n\
        float w2 = dot(w, w);\n\
        float product = w2 * difference; // Negatively valued.\n\
        float discriminant = qw * qw - product;\n\
        float temp = -qw + sqrt(discriminant); // Positively valued.\n\
        czm_raySegment i = czm_raySegment(0.0, temp / w2);\n\
        return i;\n\
    }\n\
    else // q2 == 1.0. On ellipsoid.\n\
    {\n\
        if (qw < 0.0) // Looking inward.\n\
        {\n\
            float w2 = dot(w, w);\n\
            czm_raySegment i = czm_raySegment(0.0, -qw / w2);\n\
            return i;\n\
        }\n\
        else // qw >= 0.0.  Looking outward or tangent.\n\
        {\n\
            return czm_emptyRaySegment;\n\
        }\n\
    }\n\
}\n\
\n\
/**\n\
 * Returns the WGS84 ellipsoid, with its center at the origin of world coordinates, in eye coordinates.\n\
 *\n\
 * @name czm_getWgs84EllipsoidEC\n\
 * @glslFunction\n\
 *\n\
 * @returns {czm_ellipsoid} The WGS84 ellipsoid, with its center at the origin of world coordinates, in eye coordinates.\n\
 *\n\
 * @see Ellipsoid.getWgs84\n\
 *\n\
 * @example\n\
 * czm_ellipsoid ellipsoid = czm_getWgs84EllipsoidEC();\n\
 */\n\
czm_ellipsoid czm_getWgs84EllipsoidEC()\n\
{\n\
    return czm_ellipsoidNew(\n\
        czm_view[3].xyz,                               // center\n\
        vec3(6378137.0, 6378137.0, 6356752.314245));   // radii\n\
}\n\
\n\
/**\n\
 * Computes the fraction of a Web Wercator extent at which a given geodetic latitude is located.\n\
 *\n\
 * @name czm_latitudeToWebMercatorFraction\n\
 * @glslFunction\n\
 *\n\
 * @param {float} The geodetic latitude, in radians.\n\
 * @param {float} The low portion of the Web Mercator coordinate of the southern boundary of the extent.\n\
 * @param {float} The high portion of the Web Mercator coordinate of the southern boundary of the extent.\n\
 * @param {float} The total height of the extent in Web Mercator coordinates.\n\
 *\n\
 * @returns {float} The fraction of the extent at which the latitude occurs.  If the latitude is the southern\n\
 *          boundary of the extent, the return value will be zero.  If it is the northern boundary, the return\n\
 *          value will be 1.0.  Latitudes in between are mapped according to the Web Mercator projection.\n\
 */ \n\
float czm_latitudeToWebMercatorFraction(float latitude, float southMercatorYLow, float southMercatorYHigh, float oneOverMercatorHeight)\n\
{\n\
    float sinLatitude = sin(latitude);\n\
    float mercatorY = 0.5 * log((1.0 + sinLatitude) / (1.0 - sinLatitude));\n\
    \n\
    // mercatorY - southMercatorY in simulated double precision.\n\
    float t1 = 0.0 - southMercatorYLow;\n\
    float e = t1 - 0.0;\n\
    float t2 = ((-southMercatorYLow - e) + (0.0 - (t1 - e))) + mercatorY - southMercatorYHigh;\n\
    float highDifference = t1 + t2;\n\
    float lowDifference = t2 - (highDifference - t1);\n\
    \n\
    return highDifference * oneOverMercatorHeight + lowDifference * oneOverMercatorHeight;\n\
}\n\
\n\
/**\n\
 * Translates a position (or any <code>vec3</code>) that was encoded with {@link EncodedCartesian3},\n\
 * and then provided to the shader as separate <code>high</code> and <code>low</code> bits to\n\
 * be relative to the eye.  As shown in the example, the position can then be transformed in eye\n\
 * or clip coordinates using {@link czm_modelViewRelativeToEye} or {@link czm_modelViewProjectionRelativeToEye},\n\
 * respectively.\n\
 * <p>\n\
 * This technique, called GPU RTE, eliminates jittering artifacts when using large coordinates as\n\
 * described in <a href=\"http://blogs.agi.com/insight3d/index.php/2008/09/03/precisions-precisions/\">Precisions, Precisions</a>.\n\
 * </p>\n\
 *\n\
 * @name czm_translateRelativeToEye\n\
 * @glslFunction\n\
 *\n\
 * @param {vec3} high The position's high bits.\n\
 * @param {vec3} low The position's low bits.\n\
 * @returns {vec3} The position translated to be relative to the camera's position.\n\
 *\n\
 * @example\n\
 * attribute vec3 positionHigh;\n\
 * attribute vec3 positionLow;\n\
 * \n\
 * void main() \n\
 * {\n\
 *   vec3 p = czm_translateRelativeToEye(positionHigh, positionLow);\n\
 *   gl_Position = czm_modelViewProjectionRelativeToEye * vec4(p, 1.0);\n\
 * }\n\
 *\n\
 * @see czm_modelViewRelativeToEye\n\
 * @see czm_modelViewProjectionRelativeToEye\n\
 * @see EncodedCartesian3\n\
 */\n\
vec3 czm_translateRelativeToEye(vec3 high, vec3 low)\n\
{\n\
    vec3 highDifference = high - czm_encodedCameraPositionMCHigh;\n\
    vec3 lowDifference = low - czm_encodedCameraPositionMCLow;\n\
\n\
    return highDifference + lowDifference;\n\
}\n\
\n\
/**\n\
 * @private\n\
 */\n\
vec4 czm_getWaterNoise(sampler2D normalMap, vec2 uv, float time, float angleInRadians)\n\
{\n\
    float cosAngle = cos(angleInRadians);\n\
    float sinAngle = sin(angleInRadians);\n\
\n\
    // time dependent sampling directions\n\
    vec2 s0 = vec2(1.0/17.0, 0.0);\n\
    vec2 s1 = vec2(-1.0/29.0, 0.0);\n\
    vec2 s2 = vec2(1.0/101.0, 1.0/59.0);\n\
    vec2 s3 = vec2(-1.0/109.0, -1.0/57.0);\n\
\n\
    // rotate sampling direction by specified angle\n\
    s0 = vec2((cosAngle * s0.x) - (sinAngle * s0.y), (sinAngle * s0.x) + (cosAngle * s0.y));\n\
    s1 = vec2((cosAngle * s1.x) - (sinAngle * s1.y), (sinAngle * s1.x) + (cosAngle * s1.y));\n\
    s2 = vec2((cosAngle * s2.x) - (sinAngle * s2.y), (sinAngle * s2.x) + (cosAngle * s2.y));\n\
    s3 = vec2((cosAngle * s3.x) - (sinAngle * s3.y), (sinAngle * s3.x) + (cosAngle * s3.y));\n\
\n\
    vec2 uv0 = (uv/103.0) + (time * s0);\n\
    vec2 uv1 = uv/107.0 + (time * s1) + vec2(0.23);\n\
    vec2 uv2 = uv/vec2(897.0, 983.0) + (time * s2) + vec2(0.51);\n\
    vec2 uv3 = uv/vec2(991.0, 877.0) + (time * s3) + vec2(0.71);\n\
\n\
    uv0 = fract(uv0);\n\
    uv1 = fract(uv1);\n\
    uv2 = fract(uv2);\n\
    uv3 = fract(uv3);\n\
    vec4 noise = (texture2D(normalMap, uv0)) +\n\
                 (texture2D(normalMap, uv1)) +\n\
                 (texture2D(normalMap, uv2)) +\n\
                 (texture2D(normalMap, uv3));\n\
\n\
    // average and scale to between -1 and 1\n\
    return ((noise / 4.0) - 0.5) * 2.0;\n\
}\n\
\n\
/**\n\
 * @license\n\
 * Description : Array and textureless GLSL 2D/3D/4D simplex \n\
 *               noise functions.\n\
 *      Author : Ian McEwan, Ashima Arts.\n\
 *  Maintainer : ijm\n\
 *     Lastmod : 20110822 (ijm)\n\
 *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n\
 *               Distributed under the MIT License. See LICENSE file.\n\
 *               https://github.com/ashima/webgl-noise\n\
 */ \n\
\n\
vec4 _czm_mod289(vec4 x)\n\
{\n\
  return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
\n\
vec3 _czm_mod289(vec3 x)\n\
{\n\
    return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
\n\
vec2 _czm_mod289(vec2 x) \n\
{\n\
    return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
\n\
float _czm_mod289(float x)\n\
{\n\
    return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
  \n\
vec4 _czm_permute(vec4 x)\n\
{\n\
    return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
\n\
vec3 _czm_permute(vec3 x)\n\
{\n\
    return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
\n\
float _czm_permute(float x) \n\
{\n\
    return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
\n\
vec4 _czm_taylorInvSqrt(vec4 r)\n\
{\n\
    return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
\n\
float _czm_taylorInvSqrt(float r)\n\
{\n\
    return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
\n\
vec4 _czm_grad4(float j, vec4 ip)\n\
{\n\
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);\n\
    vec4 p,s;\n\
\n\
    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;\n\
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);\n\
    s = vec4(lessThan(p, vec4(0.0)));\n\
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; \n\
\n\
    return p;\n\
}\n\
  \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * Implemented by Ian McEwan, Ashima Arts, and distributed under the MIT License.  {@link https://github.com/ashima/webgl-noise}\n\
 *\n\
 * @name czm_snoise\n\
 * @glslFunction\n\
 *\n\
 * @see <a href=\"https://github.com/ashima/webgl-noise\">https://github.com/ashima/webgl-noise</a>\n\
 * @see Stefan Gustavson's paper <a href=\"http://www.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf\">Simplex noise demystified</a>\n\
 */  \n\
float czm_snoise(vec2 v)\n\
{\n\
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0\n\
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)\n\
                       -0.577350269189626,  // -1.0 + 2.0 * C.x\n\
                        0.024390243902439); // 1.0 / 41.0\n\
    // First corner\n\
    vec2 i  = floor(v + dot(v, C.yy) );\n\
    vec2 x0 = v -   i + dot(i, C.xx);\n\
\n\
    // Other corners\n\
    vec2 i1;\n\
    //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0\n\
    //i1.y = 1.0 - i1.x;\n\
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n\
    // x0 = x0 - 0.0 + 0.0 * C.xx ;\n\
    // x1 = x0 - i1 + 1.0 * C.xx ;\n\
    // x2 = x0 - 1.0 + 2.0 * C.xx ;\n\
    vec4 x12 = x0.xyxy + C.xxzz;\n\
    x12.xy -= i1;\n\
\n\
    // Permutations\n\
    i = _czm_mod289(i); // Avoid truncation effects in permutation\n\
    vec3 p = _czm_permute( _czm_permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));\n\
\n\
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\n\
    m = m*m ;\n\
    m = m*m ;\n\
\n\
    // Gradients: 41 points uniformly over a line, mapped onto a diamond.\n\
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)\n\
    vec3 x = 2.0 * fract(p * C.www) - 1.0;\n\
    vec3 h = abs(x) - 0.5;\n\
    vec3 ox = floor(x + 0.5);\n\
    vec3 a0 = x - ox;\n\
\n\
    // Normalise gradients implicitly by scaling m\n\
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );\n\
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n\
\n\
    // Compute final noise value at P\n\
    vec3 g;\n\
    g.x  = a0.x  * x0.x  + h.x  * x0.y;\n\
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n\
    return 130.0 * dot(m, g);\n\
}\n\
\n\
float czm_snoise(vec3 v)\n\
{ \n\
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n\
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\
\n\
    // First corner\n\
    vec3 i  = floor(v + dot(v, C.yyy) );\n\
    vec3 x0 =   v - i + dot(i, C.xxx) ;\n\
\n\
    // Other corners\n\
    vec3 g = step(x0.yzx, x0.xyz);\n\
    vec3 l = 1.0 - g;\n\
    vec3 i1 = min( g.xyz, l.zxy );\n\
    vec3 i2 = max( g.xyz, l.zxy );\n\
\n\
    //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n\
    //   x1 = x0 - i1  + 1.0 * C.xxx;\n\
    //   x2 = x0 - i2  + 2.0 * C.xxx;\n\
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n\
    vec3 x1 = x0 - i1 + C.xxx;\n\
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n\
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\
\n\
    // Permutations\n\
    i = _czm_mod289(i); \n\
    vec4 p = _czm_permute( _czm_permute( _czm_permute( \n\
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n\
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \n\
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\
\n\
    // Gradients: 7x7 points over a square, mapped onto an octahedron.\n\
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n\
    float n_ = 0.142857142857; // 1.0/7.0\n\
    vec3  ns = n_ * D.wyz - D.xzx;\n\
\n\
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\
\n\
    vec4 x_ = floor(j * ns.z);\n\
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\
\n\
    vec4 x = x_ *ns.x + ns.yyyy;\n\
    vec4 y = y_ *ns.x + ns.yyyy;\n\
    vec4 h = 1.0 - abs(x) - abs(y);\n\
\n\
    vec4 b0 = vec4( x.xy, y.xy );\n\
    vec4 b1 = vec4( x.zw, y.zw );\n\
\n\
    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n\
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n\
    vec4 s0 = floor(b0)*2.0 + 1.0;\n\
    vec4 s1 = floor(b1)*2.0 + 1.0;\n\
    vec4 sh = -step(h, vec4(0.0));\n\
\n\
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n\
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\
\n\
    vec3 p0 = vec3(a0.xy,h.x);\n\
    vec3 p1 = vec3(a0.zw,h.y);\n\
    vec3 p2 = vec3(a1.xy,h.z);\n\
    vec3 p3 = vec3(a1.zw,h.w);\n\
\n\
    //Normalise gradients\n\
    vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
    p0 *= norm.x;\n\
    p1 *= norm.y;\n\
    p2 *= norm.z;\n\
    p3 *= norm.w;\n\
\n\
    // Mix final noise value\n\
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n\
    m = m * m;\n\
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), \n\
                                dot(p2,x2), dot(p3,x3) ) );\n\
}\n\
\n\
float czm_snoise(vec4 v)\n\
{\n\
    const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4\n\
                          0.276393202250021,  // 2 * G4\n\
                          0.414589803375032,  // 3 * G4\n\
                         -0.447213595499958); // -1 + 4 * G4\n\
\n\
    // (sqrt(5) - 1)/4 = F4, used once below\n\
    #define F4 0.309016994374947451\n\
\n\
    // First corner\n\
    vec4 i  = floor(v + dot(v, vec4(F4)) );\n\
    vec4 x0 = v -   i + dot(i, C.xxxx);\n\
\n\
    // Other corners\n\
\n\
    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)\n\
    vec4 i0;\n\
    vec3 isX = step( x0.yzw, x0.xxx );\n\
    vec3 isYZ = step( x0.zww, x0.yyz );\n\
    //  i0.x = dot( isX, vec3( 1.0 ) );\n\
    i0.x = isX.x + isX.y + isX.z;\n\
    i0.yzw = 1.0 - isX;\n\
    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );\n\
    i0.y += isYZ.x + isYZ.y;\n\
    i0.zw += 1.0 - isYZ.xy;\n\
    i0.z += isYZ.z;\n\
    i0.w += 1.0 - isYZ.z;\n\
\n\
    // i0 now contains the unique values 0,1,2,3 in each channel\n\
    vec4 i3 = clamp( i0, 0.0, 1.0 );\n\
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );\n\
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );\n\
\n\
    //  x0 = x0 - 0.0 + 0.0 * C.xxxx\n\
    //  x1 = x0 - i1  + 1.0 * C.xxxx\n\
    //  x2 = x0 - i2  + 2.0 * C.xxxx\n\
    //  x3 = x0 - i3  + 3.0 * C.xxxx\n\
    //  x4 = x0 - 1.0 + 4.0 * C.xxxx\n\
    vec4 x1 = x0 - i1 + C.xxxx;\n\
    vec4 x2 = x0 - i2 + C.yyyy;\n\
    vec4 x3 = x0 - i3 + C.zzzz;\n\
    vec4 x4 = x0 + C.wwww;\n\
\n\
    // Permutations\n\
    i = _czm_mod289(i); \n\
    float j0 = _czm_permute( _czm_permute( _czm_permute( _czm_permute(i.w) + i.z) + i.y) + i.x);\n\
    vec4 j1 = _czm_permute( _czm_permute( _czm_permute( _czm_permute (\n\
               i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))\n\
             + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))\n\
             + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))\n\
             + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));\n\
\n\
    // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope\n\
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.\n\
    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;\n\
\n\
    vec4 p0 = _czm_grad4(j0,   ip);\n\
    vec4 p1 = _czm_grad4(j1.x, ip);\n\
    vec4 p2 = _czm_grad4(j1.y, ip);\n\
    vec4 p3 = _czm_grad4(j1.z, ip);\n\
    vec4 p4 = _czm_grad4(j1.w, ip);\n\
\n\
    // Normalise gradients\n\
    vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
    p0 *= norm.x;\n\
    p1 *= norm.y;\n\
    p2 *= norm.z;\n\
    p3 *= norm.w;\n\
    p4 *= _czm_taylorInvSqrt(dot(p4,p4));\n\
\n\
    // Mix contributions from the five corners\n\
    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n\
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);\n\
    m0 = m0 * m0;\n\
    m1 = m1 * m1;\n\
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))\n\
                  + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;\n\
}\n\
\n\
///////////////////////////////////////////////////////////////////////////////\n\
\n\
/**\n\
 * @license\n\
 * Cellular noise (\"Worley noise\") in 2D in GLSL.\n\
 * Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.\n\
 * This code is released under the conditions of the MIT license.\n\
 * See LICENSE file for details.\n\
 */\n\
 \n\
//#ifdef GL_OES_standard_derivatives\n\
//    #extension GL_OES_standard_derivatives : enable\n\
//#endif  \n\
//\n\
//float aastep (float threshold , float value)\n\
//{\n\
//    float afwidth = 0.7 * length ( vec2 ( dFdx ( value ), dFdy ( value )));\n\
//    return smoothstep ( threshold - afwidth , threshold + afwidth , value );\n\
//}\n\
\n\
// Permutation polynomial: (34x^2 + x) mod 289\n\
vec3 _czm_permute289(vec3 x)\n\
{\n\
    return mod((34.0 * x + 1.0) * x, 289.0);\n\
}\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * Implemented by Stefan Gustavson, and distributed under the MIT License.  {@link http://openglinsights.git.sourceforge.net/git/gitweb.cgi?p=openglinsights/openglinsights;a=tree;f=proceduraltextures}\n\
 *\n\
 * @name czm_cellular\n\
 * @glslFunction\n\
 *\n\
 * @see Stefan Gustavson's chapter, <i>Procedural Textures in GLSL</i>, in <a href=\"http://www.openglinsights.com/\">OpenGL Insights</a>.\n\
 */  \n\
vec2 czm_cellular(vec2 P)\n\
// Cellular noise, returning F1 and F2 in a vec2.\n\
// Standard 3x3 search window for good F1 and F2 values\n\
{\n\
#define K 0.142857142857 // 1/7\n\
#define Ko 0.428571428571 // 3/7\n\
#define jitter 1.0 // Less gives more regular pattern\n\
    vec2 Pi = mod(floor(P), 289.0);\n\
    vec2 Pf = fract(P);\n\
    vec3 oi = vec3(-1.0, 0.0, 1.0);\n\
    vec3 of = vec3(-0.5, 0.5, 1.5);\n\
    vec3 px = _czm_permute289(Pi.x + oi);\n\
    vec3 p = _czm_permute289(px.x + Pi.y + oi); // p11, p12, p13\n\
    vec3 ox = fract(p*K) - Ko;\n\
    vec3 oy = mod(floor(p*K),7.0)*K - Ko;\n\
    vec3 dx = Pf.x + 0.5 + jitter*ox;\n\
    vec3 dy = Pf.y - of + jitter*oy;\n\
    vec3 d1 = dx * dx + dy * dy; // d11, d12 and d13, squared\n\
    p = _czm_permute289(px.y + Pi.y + oi); // p21, p22, p23\n\
    ox = fract(p*K) - Ko;\n\
    oy = mod(floor(p*K),7.0)*K - Ko;\n\
    dx = Pf.x - 0.5 + jitter*ox;\n\
    dy = Pf.y - of + jitter*oy;\n\
    vec3 d2 = dx * dx + dy * dy; // d21, d22 and d23, squared\n\
    p = _czm_permute289(px.z + Pi.y + oi); // p31, p32, p33\n\
    ox = fract(p*K) - Ko;\n\
    oy = mod(floor(p*K),7.0)*K - Ko;\n\
    dx = Pf.x - 1.5 + jitter*ox;\n\
    dy = Pf.y - of + jitter*oy;\n\
    vec3 d3 = dx * dx + dy * dy; // d31, d32 and d33, squared\n\
    // Sort out the two smallest distances (F1, F2)\n\
    vec3 d1a = min(d1, d2);\n\
    d2 = max(d1, d2); // Swap to keep candidates for F2\n\
    d2 = min(d2, d3); // neither F1 nor F2 are now in d3\n\
    d1 = min(d1a, d2); // F1 is now in d1\n\
    d2 = max(d1a, d2); // Swap to keep candidates for F2\n\
    d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx; // Swap if smaller\n\
    d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx; // F1 is in d1.x\n\
    d1.yz = min(d1.yz, d2.yz); // F2 is now not in d2.yz\n\
    d1.y = min(d1.y, d1.z); // nor in  d1.z\n\
    d1.y = min(d1.y, d2.x); // F2 is in d1.y, we're done.\n\
    return sqrt(d1.xy);\n\
}\n\
\n\
/*\n\
\n\
// Cellular noise, returning F1 and F2 in a vec2 and the\n\
// 2D vectors to each of the two closest points in a vec4.\n\
// Standard 3x3 search window for good F1 and F2 values.\n\
void czm_cellular(in vec2 P, out vec2 F, out vec4 d1d2)\n\
{\n\
#define K 0.142857142857 // 1/7\n\
#define Ko 0.428571428571 // 3/7\n\
#define jitter 1.0 // Less gives more regular pattern\n\
    vec2 Pi = mod(floor(P), 289.0);\n\
    vec2 Pf = fract(P);\n\
    vec3 oi = vec3(-1.0, 0.0, 1.0);\n\
    vec3 of = vec3(-0.5, 0.5, 1.5);\n\
    vec3 px = _czm_permute289(Pi.x + oi);\n\
    vec3 p = _czm_permute289(px.x + Pi.y + oi); // p11, p12, p13\n\
    vec3 ox = fract(p*K) - Ko;\n\
    vec3 oy = mod(floor(p*K),7.0)*K - Ko;\n\
    vec3 d1x = Pf.x + 0.5 + jitter*ox;\n\
    vec3 d1y = Pf.y - of + jitter*oy;\n\
    vec3 d1 = d1x * d1x + d1y * d1y; // d11, d12 and d13, squared\n\
    p = _czm_permute289(px.y + Pi.y + oi); // p21, p22, p23\n\
    ox = fract(p*K) - Ko;\n\
    oy = mod(floor(p*K),7.0)*K - Ko;\n\
    vec3 d2x = Pf.x - 0.5 + jitter*ox;\n\
    vec3 d2y = Pf.y - of + jitter*oy;\n\
    vec3 d2 = d2x * d2x + d2y * d2y; // d21, d22 and d23, squared\n\
    p = _czm_permute289(px.z + Pi.y + oi); // p31, p32, p33\n\
    ox = fract(p*K) - Ko;\n\
    oy = mod(floor(p*K),7.0)*K - Ko;\n\
    vec3 d3x = Pf.x - 1.5 + jitter*ox;\n\
    vec3 d3y = Pf.y - of + jitter*oy;\n\
    vec3 d3 = d3x * d3x + d3y * d3y; // d31, d32 and d33, squared\n\
    // Sort out the two smallest distances (F1, F2)\n\
    // While also swapping dx and dy accordingly\n\
    vec3 comp3 = step(d2, d1);\n\
    vec3 d1a = mix(d1, d2, comp3);\n\
    vec3 d1xa = mix(d1x, d2x, comp3);\n\
    vec3 d1ya = mix(d1y, d2y, comp3);\n\
    d2 = mix(d2, d1, comp3); // Swap to keep candidates for F2\n\
    d2x = mix(d2x, d1x, comp3);\n\
    d2y = mix(d2y, d1y, comp3);\n\
  \n\
    comp3 = step(d3, d2);\n\
    d2 = mix(d2, d3, comp3); // neither F1 nor F2 are now in d3\n\
    d2x = mix(d2x, d3x, comp3);\n\
    d2y = mix(d2y, d3y, comp3);\n\
  \n\
    comp3 = step(d2, d1a);\n\
    d1 = mix(d1a, d2, comp3); // F1 is now in d1\n\
    d1x = mix(d1xa, d2x, comp3);\n\
    d1y = mix(d1ya, d2y, comp3);\n\
    d2 = mix(d2, d1a, comp3); // Swap to keep candidates for F2\n\
    d2x = mix(d2x, d1xa, comp3);\n\
    d2y = mix(d2y, d1ya, comp3);\n\
  \n\
    float comp1 = step(d1.y, d1.x);\n\
    d1.xy = mix(d1.xy, d1.yx, comp1); // Swap if smaller\n\
    d1x.xy = mix(d1x.xy, d1x.yx, comp1);\n\
    d1y.xy = mix(d1y.xy, d1y.yx, comp1);\n\
  \n\
    comp1 = step(d1.z, d1.x);\n\
    d1.xz = mix(d1.xz, d1.zx, comp1); // F1 is in d1.x\n\
    d1x.xz = mix(d1x.xz, d1x.zx, comp1);\n\
    d1y.xz = mix(d1y.xz, d1y.zx, comp1);\n\
 \n\
    vec2 comp2 = step(d2.yz, d1.yz);\n\
    d1.yz = mix(d1.yz, d2.yz, comp2); // F2 is now not in d2.yz\n\
    d1x.yz = mix(d1x.yz, d2x.yz, comp2);\n\
    d1y.yz = mix(d1y.yz, d2y.yz, comp2);\n\
  \n\
    comp1 = step(d1.z, d1.y);\n\
    d1.y = mix(d1.y, d1.z, comp1); // nor in  d1.z\n\
    d1x.y = mix(d1x.y, d1x.z, comp1);\n\
    d1y.y = mix(d1y.y, d1y.z, comp1);\n\
 \n\
    comp1 = step(d2.x, d1.y);\n\
    d1.y = mix(d1.y, d2.x, comp1); // F2 is in d1.y, we're done.\n\
    d1x.y = mix(d1x.y, d2x.x, comp1);\n\
    d1y.y = mix(d1y.y, d2y.x, comp1);\n\
    F = sqrt(d1.xy);\n\
    d1d2 = vec4(d1x.x, d1y.x, d1x.y, d1y.y);\n\
}\n\
\n\
*/";
});