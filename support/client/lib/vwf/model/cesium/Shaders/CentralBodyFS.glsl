//#define SHOW_TILE_BOUNDARIES

#if TEXTURE_UNITS > 0
uniform sampler2D u_dayTextures[TEXTURE_UNITS];
uniform vec4 u_dayTextureTranslationAndScale[TEXTURE_UNITS];

#ifdef APPLY_ALPHA
uniform float u_dayTextureAlpha[TEXTURE_UNITS];
#endif

#ifdef APPLY_BRIGHTNESS
uniform float u_dayTextureBrightness[TEXTURE_UNITS];
#endif

#ifdef APPLY_CONTRAST
uniform float u_dayTextureContrast[TEXTURE_UNITS];
#endif

#ifdef APPLY_HUE
uniform float u_dayTextureHue[TEXTURE_UNITS];
#endif

#ifdef APPLY_SATURATION
uniform float u_dayTextureSaturation[TEXTURE_UNITS];
#endif

#ifdef APPLY_GAMMA
uniform float u_dayTextureOneOverGamma[TEXTURE_UNITS];
#endif

uniform vec4 u_dayTextureTexCoordsExtent[TEXTURE_UNITS];
#endif

#ifdef SHOW_REFLECTIVE_OCEAN
uniform sampler2D u_waterMask;
uniform vec4 u_waterMaskTranslationAndScale;
uniform float u_zoomedOutOceanSpecularIntensity;
#endif

#ifdef SHOW_OCEAN_WAVES
uniform sampler2D u_oceanNormalMap;
#endif

#ifdef ENABLE_LIGHTING
uniform vec2 u_lightingFadeDistance;
#endif

varying vec3 v_positionMC;
varying vec3 v_positionEC;
varying vec2 v_textureCoordinates;

vec3 sampleAndBlend(
    vec3 previousColor,
    sampler2D texture,
    vec2 tileTextureCoordinates,
    vec4 textureCoordinateExtent,
    vec4 textureCoordinateTranslationAndScale,
    float textureAlpha,
    float textureBrightness,
    float textureContrast,
    float textureHue,
    float textureSaturation,
    float textureOneOverGamma)
{
    // This crazy step stuff sets the alpha to 0.0 if this following condition is true:
    //    tileTextureCoordinates.s < textureCoordinateExtent.s ||
    //    tileTextureCoordinates.s > textureCoordinateExtent.p ||
    //    tileTextureCoordinates.t < textureCoordinateExtent.t ||
    //    tileTextureCoordinates.t > textureCoordinateExtent.q
    // In other words, the alpha is zero if the fragment is outside the extent
    // covered by this texture.  Would an actual 'if' yield better performance?
    vec2 alphaMultiplier = step(textureCoordinateExtent.st, tileTextureCoordinates); 
    textureAlpha = textureAlpha * alphaMultiplier.x * alphaMultiplier.y;
    
    alphaMultiplier = step(vec2(0.0), textureCoordinateExtent.pq - tileTextureCoordinates);
    textureAlpha = textureAlpha * alphaMultiplier.x * alphaMultiplier.y;
    
    vec2 translation = textureCoordinateTranslationAndScale.xy;
    vec2 scale = textureCoordinateTranslationAndScale.zw;
    vec2 textureCoordinates = tileTextureCoordinates * scale + translation;
    vec4 sample = texture2D(texture, textureCoordinates);
    vec3 color = sample.rgb;
    float alpha = sample.a;
    
#ifdef APPLY_BRIGHTNESS
    color = mix(vec3(0.0), color, textureBrightness);
#endif

#ifdef APPLY_CONTRAST
    color = mix(vec3(0.5), color, textureContrast);
#endif

#ifdef APPLY_HUE
    color = czm_hue(color, textureHue);
#endif

#ifdef APPLY_SATURATION
    color = czm_saturation(color, textureSaturation);
#endif

#ifdef APPLY_GAMMA
    color = pow(color, vec3(textureOneOverGamma));
#endif

    return mix(previousColor, color, alpha * textureAlpha);
}

vec3 computeDayColor(vec3 initialColor, vec2 textureCoordinates);
vec4 computeWaterColor(vec3 positionEyeCoordinates, vec2 textureCoordinates, mat3 enuToEye, vec3 imageryColor, float specularMapValue);

void main()
{
    // The clamp below works around an apparent bug in Chrome Canary v23.0.1241.0
    // where the fragment shader sees textures coordinates < 0.0 and > 1.0 for the
    // fragments on the edges of tiles even though the vertex shader is outputting
    // coordinates strictly in the 0-1 range.
    vec3 initialColor = vec3(0.0, 0.0, 0.5);
    vec3 startDayColor = computeDayColor(initialColor, clamp(v_textureCoordinates, 0.0, 1.0));

#ifdef SHOW_TILE_BOUNDARIES
    if (v_textureCoordinates.x < (1.0/256.0) || v_textureCoordinates.x > (255.0/256.0) ||
        v_textureCoordinates.y < (1.0/256.0) || v_textureCoordinates.y > (255.0/256.0))
    {
        startDayColor = vec3(1.0, 0.0, 0.0);
    }
#endif

    vec4 color = vec4(startDayColor, 1.0);
    
#if defined(SHOW_REFLECTIVE_OCEAN) || defined(ENABLE_LIGHTING)
    vec3 normalMC = normalize(czm_geodeticSurfaceNormal(v_positionMC, vec3(0.0), vec3(1.0)));   // normalized surface normal in model coordinates
    vec3 normalEC = normalize(czm_normal3D * normalMC);                                         // normalized surface normal in eye coordiantes
#endif

#ifdef SHOW_REFLECTIVE_OCEAN
    vec2 waterMaskTranslation = u_waterMaskTranslationAndScale.xy;
    vec2 waterMaskScale = u_waterMaskTranslationAndScale.zw;
    vec2 waterMaskTextureCoordinates = v_textureCoordinates * waterMaskScale + waterMaskTranslation;

    float mask = texture2D(u_waterMask, waterMaskTextureCoordinates).r;

    if (mask > 0.0)
    {
        mat3 enuToEye = czm_eastNorthUpToEyeCoordinates(v_positionMC, normalEC);
        
        vec2 ellipsoidTextureCoordinates = czm_ellipsoidWgs84TextureCoordinates(normalMC);
        vec2 ellipsoidFlippedTextureCoordinates = czm_ellipsoidWgs84TextureCoordinates(normalMC.zyx);

        vec2 textureCoordinates = mix(ellipsoidTextureCoordinates, ellipsoidFlippedTextureCoordinates, czm_morphTime * smoothstep(0.9, 0.95, normalMC.z));

        color = computeWaterColor(v_positionEC, textureCoordinates, enuToEye, startDayColor, mask);
    }
#endif

#ifdef ENABLE_LIGHTING
    float diffuseIntensity = clamp(czm_getLambertDiffuse(czm_sunDirectionEC, normalEC) * 5.0 + 0.3, 0.0, 1.0);
    float cameraDist = length(czm_view[3]);
    float fadeOutDist = u_lightingFadeDistance.x;
    float fadeInDist = u_lightingFadeDistance.y;
    float t = clamp((cameraDist - fadeOutDist) / (fadeInDist - fadeOutDist), 0.0, 1.0);
    diffuseIntensity = mix(1.0, diffuseIntensity, t);
    gl_FragColor = vec4(color.rgb * diffuseIntensity, color.a);
#else
    gl_FragColor = color;
#endif
}

#ifdef SHOW_REFLECTIVE_OCEAN

float waveFade(float edge0, float edge1, float x)
{
    float y = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return pow(1.0 - y, 5.0);
}

// Based on water rendering by Jonas Wagner:
// http://29a.ch/2012/7/19/webgl-terrain-rendering-water-fog

const float oceanFrequency = 125000.0;
const float oceanAnimationSpeed = 0.006;
const float oceanAmplitude = 2.0;
const float oceanSpecularIntensity = 0.5;

vec4 computeWaterColor(vec3 positionEyeCoordinates, vec2 textureCoordinates, mat3 enuToEye, vec3 imageryColor, float specularMapValue)
{
    float time = czm_frameNumber * oceanAnimationSpeed;
    
    vec3 positionToEyeEC = -positionEyeCoordinates;
    float positionToEyeECLength = length(positionToEyeEC);

    // The double normalize below works around a bug in Firefox on Android devices.
    vec3 normalizedpositionToEyeEC = normalize(normalize(positionToEyeEC));
    
    // Fade out the waves as the camera moves far from the surface.
    float waveIntensity = waveFade(70000.0, 1000000.0, positionToEyeECLength);

#ifdef SHOW_OCEAN_WAVES
    vec4 noise = czm_getWaterNoise(u_oceanNormalMap, textureCoordinates * oceanFrequency, time, 0.0);
    vec3 normalTangentSpace = noise.xyz * vec3(1.0, 1.0, (1.0 / oceanAmplitude));
    
    // fade out the normal perturbation as we move farther from the water surface
    normalTangentSpace.xy *= waveIntensity;
    normalTangentSpace = normalize(normalTangentSpace);
#else
    vec3 normalTangentSpace = vec3(0.0, 0.0, 1.0);
#endif

    vec3 normalEC = enuToEye * normalTangentSpace;
    
    const vec3 waveHighlightColor = vec3(0.3, 0.45, 0.6);
    
    // Use diffuse light to highlight the waves
    float diffuseIntensity = czm_getLambertDiffuse(czm_sunDirectionEC, normalEC);
    vec3 diffuseHighlight = waveHighlightColor * diffuseIntensity;
    
#ifdef SHOW_OCEAN_WAVES
    // Where diffuse light is low or non-existent, use wave highlights based solely on
    // the wave bumpiness and no particular light direction.
    float tsPerturbationRatio = normalTangentSpace.z;
    vec3 nonDiffuseHighlight = mix(waveHighlightColor * 5.0 * (1.0 - tsPerturbationRatio), vec3(0.0), diffuseIntensity);
#else
    vec3 nonDiffuseHighlight = vec3(0.0);
#endif

    // Add specular highlights in 3D, and in all modes when zoomed in.
    float specularIntensity = czm_getSpecular(czm_sunDirectionEC, normalizedpositionToEyeEC, normalEC, 10.0) + 0.25 * czm_getSpecular(czm_moonDirectionEC, normalizedpositionToEyeEC, normalEC, 10.0);
    float surfaceReflectance = mix(0.0, mix(u_zoomedOutOceanSpecularIntensity, oceanSpecularIntensity, waveIntensity), specularMapValue);
    float specular = specularIntensity * surfaceReflectance;
    
    return vec4(imageryColor + diffuseHighlight + nonDiffuseHighlight + specular, 1.0); 
}

#endif // #ifdef SHOW_REFLECTIVE_OCEAN
