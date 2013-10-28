//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "#if TEXTURE_UNITS > 0\n\
uniform sampler2D u_dayTextures[TEXTURE_UNITS];\n\
uniform vec4 u_dayTextureTranslationAndScale[TEXTURE_UNITS];\n\
uniform float u_dayTextureAlpha[TEXTURE_UNITS];\n\
uniform float u_dayTextureBrightness[TEXTURE_UNITS];\n\
uniform float u_dayTextureContrast[TEXTURE_UNITS];\n\
uniform float u_dayTextureHue[TEXTURE_UNITS];\n\
uniform float u_dayTextureSaturation[TEXTURE_UNITS];\n\
uniform float u_dayTextureOneOverGamma[TEXTURE_UNITS];\n\
uniform vec4 u_dayTextureTexCoordsExtent[TEXTURE_UNITS];\n\
#endif\n\
#ifdef SHOW_REFLECTIVE_OCEAN\n\
uniform sampler2D u_waterMask;\n\
uniform vec4 u_waterMaskTranslationAndScale;\n\
uniform float u_zoomedOutOceanSpecularIntensity;\n\
#endif\n\
#ifdef SHOW_OCEAN_WAVES\n\
uniform sampler2D u_oceanNormalMap;\n\
#endif\n\
varying vec3 v_positionMC;\n\
varying vec3 v_positionEC;\n\
varying vec2 v_textureCoordinates;\n\
float getLambertDiffuse(vec3 lightDirectionEC, vec3 normalEC)\n\
{\n\
return max(dot(lightDirectionEC, normalEC), 0.0);\n\
}\n\
float getSpecular(vec3 lightDirectionEC, vec3 toEyeEC, vec3 normalEC, float shininess)\n\
{\n\
vec3 toReflectedLight = reflect(-lightDirectionEC, normalEC);\n\
float specular = max(dot(toReflectedLight, toEyeEC), 0.0);\n\
return pow(specular, shininess);\n\
}\n\
vec3 sampleAndBlend(\n\
vec3 previousColor,\n\
sampler2D texture,\n\
vec2 tileTextureCoordinates,\n\
vec4 textureCoordinateExtent,\n\
vec4 textureCoordinateTranslationAndScale,\n\
float textureAlpha,\n\
float textureBrightness,\n\
float textureContrast,\n\
float textureHue,\n\
float textureSaturation,\n\
float textureOneOverGamma)\n\
{\n\
vec2 alphaMultiplier = step(textureCoordinateExtent.st, tileTextureCoordinates);\n\
textureAlpha = textureAlpha * alphaMultiplier.x * alphaMultiplier.y;\n\
alphaMultiplier = step(vec2(0.0), textureCoordinateExtent.pq - tileTextureCoordinates);\n\
textureAlpha = textureAlpha * alphaMultiplier.x * alphaMultiplier.y;\n\
vec2 translation = textureCoordinateTranslationAndScale.xy;\n\
vec2 scale = textureCoordinateTranslationAndScale.zw;\n\
vec2 textureCoordinates = tileTextureCoordinates * scale + translation;\n\
vec4 sample = texture2D(texture, textureCoordinates);\n\
vec3 color = sample.rgb;\n\
float alpha = sample.a;\n\
#ifdef APPLY_BRIGHTNESS\n\
color = mix(vec3(0.0), color, textureBrightness);\n\
#endif\n\
#ifdef APPLY_CONTRAST\n\
color = mix(vec3(0.5), color, textureContrast);\n\
#endif\n\
#ifdef APPLY_HUE\n\
color = czm_hue(color, textureHue);\n\
#endif\n\
#ifdef APPLY_SATURATION\n\
color = czm_saturation(color, textureSaturation);\n\
#endif\n\
#ifdef APPLY_GAMMA\n\
color = pow(color, vec3(textureOneOverGamma));\n\
#endif\n\
return mix(previousColor, color, alpha * textureAlpha);\n\
}\n\
vec3 computeDayColor(vec3 initialColor, vec2 textureCoordinates);\n\
vec4 computeWaterColor(vec3 positionEyeCoordinates, vec2 textureCoordinates, mat3 enuToEye, vec3 imageryColor, float specularMapValue);\n\
void main()\n\
{\n\
vec3 initialColor = vec3(0.0, 0.0, 0.5);\n\
vec3 startDayColor = computeDayColor(initialColor, clamp(v_textureCoordinates, 0.0, 1.0));\n\
#ifdef SHOW_TILE_BOUNDARIES\n\
if (v_textureCoordinates.x < (1.0/256.0) || v_textureCoordinates.x > (255.0/256.0) ||\n\
v_textureCoordinates.y < (1.0/256.0) || v_textureCoordinates.y > (255.0/256.0))\n\
{\n\
startDayColor = vec3(1.0, 0.0, 0.0);\n\
}\n\
#endif\n\
vec4 color = vec4(startDayColor, 1.0);\n\
#ifdef SHOW_REFLECTIVE_OCEAN\n\
vec2 waterMaskTranslation = u_waterMaskTranslationAndScale.xy;\n\
vec2 waterMaskScale = u_waterMaskTranslationAndScale.zw;\n\
vec2 waterMaskTextureCoordinates = v_textureCoordinates * waterMaskScale + waterMaskTranslation;\n\
float mask = texture2D(u_waterMask, waterMaskTextureCoordinates).r;\n\
if (mask > 0.0)\n\
{\n\
vec3 normalMC = normalize(czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));\n\
vec3 normalEC = normalize(czm_normal3D * normalMC);\n\
mat3 enuToEye = czm_eastNorthUpToEyeCoordinates(v_positionMC, normalEC);\n\
vec2 ellipsoidTextureCoordinates = czm_ellipsoidWgs84TextureCoordinates(normalMC);\n\
vec2 ellipsoidFlippedTextureCoordinates = czm_ellipsoidWgs84TextureCoordinates(normalMC.zyx);\n\
vec2 textureCoordinates = mix(ellipsoidTextureCoordinates, ellipsoidFlippedTextureCoordinates, czm_morphTime * smoothstep(0.9, 0.95, normalMC.z));\n\
color = computeWaterColor(v_positionEC, textureCoordinates, enuToEye, startDayColor, mask);\n\
}\n\
#endif\n\
gl_FragColor = color;\n\
}\n\
#ifdef SHOW_REFLECTIVE_OCEAN\n\
float waveFade(float edge0, float edge1, float x)\n\
{\n\
float y = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);\n\
return pow(1.0 - y, 5.0);\n\
}\n\
const float oceanFrequency = 125000.0;\n\
const float oceanAnimationSpeed = 0.006;\n\
const float oceanAmplitude = 2.0;\n\
const float oceanSpecularIntensity = 0.5;\n\
vec4 computeWaterColor(vec3 positionEyeCoordinates, vec2 textureCoordinates, mat3 enuToEye, vec3 imageryColor, float specularMapValue)\n\
{\n\
float time = czm_frameNumber * oceanAnimationSpeed;\n\
vec3 positionToEyeEC = -positionEyeCoordinates;\n\
float positionToEyeECLength = length(positionToEyeEC);\n\
vec3 normalizedpositionToEyeEC = normalize(normalize(positionToEyeEC));\n\
float waveIntensity = waveFade(70000.0, 1000000.0, positionToEyeECLength);\n\
#ifdef SHOW_OCEAN_WAVES\n\
vec4 noise = czm_getWaterNoise(u_oceanNormalMap, textureCoordinates * oceanFrequency, time, 0.0);\n\
vec3 normalTangentSpace = noise.xyz * vec3(1.0, 1.0, (1.0 / oceanAmplitude));\n\
normalTangentSpace.xy *= waveIntensity;\n\
normalTangentSpace = normalize(normalTangentSpace);\n\
#else\n\
vec3 normalTangentSpace = vec3(0.0, 0.0, 1.0);\n\
#endif\n\
vec3 normalEC = enuToEye * normalTangentSpace;\n\
const vec3 waveHighlightColor = vec3(0.3, 0.45, 0.6);\n\
float diffuseIntensity = getLambertDiffuse(czm_sunDirectionEC, normalEC);\n\
vec3 diffuseHighlight = waveHighlightColor * diffuseIntensity;\n\
#ifdef SHOW_OCEAN_WAVES\n\
float tsPerturbationRatio = normalTangentSpace.z;\n\
vec3 nonDiffuseHighlight = mix(waveHighlightColor * 5.0 * (1.0 - tsPerturbationRatio), vec3(0.0), diffuseIntensity);\n\
#else\n\
vec3 nonDiffuseHighlight = vec3(0.0);\n\
#endif\n\
float specularIntensity = getSpecular(czm_sunDirectionEC, normalizedpositionToEyeEC, normalEC, 10.0) + 0.25 * getSpecular(czm_moonDirectionEC, normalizedpositionToEyeEC, normalEC, 10.0);\n\
float surfaceReflectance = mix(0.0, mix(u_zoomedOutOceanSpecularIntensity, oceanSpecularIntensity, waveIntensity), specularMapValue);\n\
float specular = specularIntensity * surfaceReflectance;\n\
return vec4(imageryColor + diffuseHighlight + nonDiffuseHighlight + specular, 1.0);\n\
}\n\
#endif\n\
";
});