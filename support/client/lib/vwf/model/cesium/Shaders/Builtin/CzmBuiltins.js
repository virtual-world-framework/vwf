//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define([
        './Constants/degreesPerRadian',
        './Constants/epsilon1',
        './Constants/epsilon2',
        './Constants/epsilon3',
        './Constants/epsilon4',
        './Constants/epsilon5',
        './Constants/epsilon6',
        './Constants/epsilon7',
        './Constants/infinity',
        './Constants/oneOverPi',
        './Constants/oneOverTwoPi',
        './Constants/pi',
        './Constants/piOverFour',
        './Constants/piOverSix',
        './Constants/piOverThree',
        './Constants/piOverTwo',
        './Constants/radiansPerDegree',
        './Constants/sceneMode2D',
        './Constants/sceneMode3D',
        './Constants/sceneModeColumbusView',
        './Constants/sceneModeMorphing',
        './Constants/solarRadius',
        './Constants/threePiOver2',
        './Constants/twoPi',
        './Constants/webMercatorMaxLatitude',
        './Structs/ellipsoid',
        './Structs/material',
        './Structs/materialInput',
        './Structs/ray',
        './Structs/raySegment',
        './Functions/RGBToXYZ',
        './Functions/XYZToRGB',
        './Functions/antialias',
        './Functions/cellular',
        './Functions/columbusViewMorph',
        './Functions/computePosition',
        './Functions/eastNorthUpToEyeCoordinates',
        './Functions/ellipsoidContainsPoint',
        './Functions/ellipsoidNew',
        './Functions/ellipsoidWgs84TextureCoordinates',
        './Functions/equalsEpsilon',
        './Functions/eyeOffset',
        './Functions/eyeToWindowCoordinates',
        './Functions/geodeticSurfaceNormal',
        './Functions/getDefaultMaterial',
        './Functions/getLambertDiffuse',
        './Functions/getSpecular',
        './Functions/getWaterNoise',
        './Functions/getWgs84EllipsoidEC',
        './Functions/hue',
        './Functions/isEmpty',
        './Functions/isFull',
        './Functions/latitudeToWebMercatorFraction',
        './Functions/luminance',
        './Functions/modelToWindowCoordinates',
        './Functions/multiplyWithColorBalance',
        './Functions/phong',
        './Functions/pointAlongRay',
        './Functions/rayEllipsoidIntersectionInterval',
        './Functions/saturation',
        './Functions/snoise',
        './Functions/tangentToEyeSpaceMatrix',
        './Functions/translateRelativeToEye',
        './Functions/transpose',
        './Functions/windowToEyeCoordinates'
    ], function(
        czm_degreesPerRadian,
        czm_epsilon1,
        czm_epsilon2,
        czm_epsilon3,
        czm_epsilon4,
        czm_epsilon5,
        czm_epsilon6,
        czm_epsilon7,
        czm_infinity,
        czm_oneOverPi,
        czm_oneOverTwoPi,
        czm_pi,
        czm_piOverFour,
        czm_piOverSix,
        czm_piOverThree,
        czm_piOverTwo,
        czm_radiansPerDegree,
        czm_sceneMode2D,
        czm_sceneMode3D,
        czm_sceneModeColumbusView,
        czm_sceneModeMorphing,
        czm_solarRadius,
        czm_threePiOver2,
        czm_twoPi,
        czm_webMercatorMaxLatitude,
        czm_ellipsoid,
        czm_material,
        czm_materialInput,
        czm_ray,
        czm_raySegment,
        czm_RGBToXYZ,
        czm_XYZToRGB,
        czm_antialias,
        czm_cellular,
        czm_columbusViewMorph,
        czm_computePosition,
        czm_eastNorthUpToEyeCoordinates,
        czm_ellipsoidContainsPoint,
        czm_ellipsoidNew,
        czm_ellipsoidWgs84TextureCoordinates,
        czm_equalsEpsilon,
        czm_eyeOffset,
        czm_eyeToWindowCoordinates,
        czm_geodeticSurfaceNormal,
        czm_getDefaultMaterial,
        czm_getLambertDiffuse,
        czm_getSpecular,
        czm_getWaterNoise,
        czm_getWgs84EllipsoidEC,
        czm_hue,
        czm_isEmpty,
        czm_isFull,
        czm_latitudeToWebMercatorFraction,
        czm_luminance,
        czm_modelToWindowCoordinates,
        czm_multiplyWithColorBalance,
        czm_phong,
        czm_pointAlongRay,
        czm_rayEllipsoidIntersectionInterval,
        czm_saturation,
        czm_snoise,
        czm_tangentToEyeSpaceMatrix,
        czm_translateRelativeToEye,
        czm_transpose,
        czm_windowToEyeCoordinates) {
    "use strict";
    return {
        czm_degreesPerRadian : czm_degreesPerRadian,
        czm_epsilon1 : czm_epsilon1,
        czm_epsilon2 : czm_epsilon2,
        czm_epsilon3 : czm_epsilon3,
        czm_epsilon4 : czm_epsilon4,
        czm_epsilon5 : czm_epsilon5,
        czm_epsilon6 : czm_epsilon6,
        czm_epsilon7 : czm_epsilon7,
        czm_infinity : czm_infinity,
        czm_oneOverPi : czm_oneOverPi,
        czm_oneOverTwoPi : czm_oneOverTwoPi,
        czm_pi : czm_pi,
        czm_piOverFour : czm_piOverFour,
        czm_piOverSix : czm_piOverSix,
        czm_piOverThree : czm_piOverThree,
        czm_piOverTwo : czm_piOverTwo,
        czm_radiansPerDegree : czm_radiansPerDegree,
        czm_sceneMode2D : czm_sceneMode2D,
        czm_sceneMode3D : czm_sceneMode3D,
        czm_sceneModeColumbusView : czm_sceneModeColumbusView,
        czm_sceneModeMorphing : czm_sceneModeMorphing,
        czm_solarRadius : czm_solarRadius,
        czm_threePiOver2 : czm_threePiOver2,
        czm_twoPi : czm_twoPi,
        czm_webMercatorMaxLatitude : czm_webMercatorMaxLatitude,
        czm_ellipsoid : czm_ellipsoid,
        czm_material : czm_material,
        czm_materialInput : czm_materialInput,
        czm_ray : czm_ray,
        czm_raySegment : czm_raySegment,
        czm_RGBToXYZ : czm_RGBToXYZ,
        czm_XYZToRGB : czm_XYZToRGB,
        czm_antialias : czm_antialias,
        czm_cellular : czm_cellular,
        czm_columbusViewMorph : czm_columbusViewMorph,
        czm_computePosition : czm_computePosition,
        czm_eastNorthUpToEyeCoordinates : czm_eastNorthUpToEyeCoordinates,
        czm_ellipsoidContainsPoint : czm_ellipsoidContainsPoint,
        czm_ellipsoidNew : czm_ellipsoidNew,
        czm_ellipsoidWgs84TextureCoordinates : czm_ellipsoidWgs84TextureCoordinates,
        czm_equalsEpsilon : czm_equalsEpsilon,
        czm_eyeOffset : czm_eyeOffset,
        czm_eyeToWindowCoordinates : czm_eyeToWindowCoordinates,
        czm_geodeticSurfaceNormal : czm_geodeticSurfaceNormal,
        czm_getDefaultMaterial : czm_getDefaultMaterial,
        czm_getLambertDiffuse : czm_getLambertDiffuse,
        czm_getSpecular : czm_getSpecular,
        czm_getWaterNoise : czm_getWaterNoise,
        czm_getWgs84EllipsoidEC : czm_getWgs84EllipsoidEC,
        czm_hue : czm_hue,
        czm_isEmpty : czm_isEmpty,
        czm_isFull : czm_isFull,
        czm_latitudeToWebMercatorFraction : czm_latitudeToWebMercatorFraction,
        czm_luminance : czm_luminance,
        czm_modelToWindowCoordinates : czm_modelToWindowCoordinates,
        czm_multiplyWithColorBalance : czm_multiplyWithColorBalance,
        czm_phong : czm_phong,
        czm_pointAlongRay : czm_pointAlongRay,
        czm_rayEllipsoidIntersectionInterval : czm_rayEllipsoidIntersectionInterval,
        czm_saturation : czm_saturation,
        czm_snoise : czm_snoise,
        czm_tangentToEyeSpaceMatrix : czm_tangentToEyeSpaceMatrix,
        czm_translateRelativeToEye : czm_translateRelativeToEye,
        czm_transpose : czm_transpose,
        czm_windowToEyeCoordinates : czm_windowToEyeCoordinates};
});