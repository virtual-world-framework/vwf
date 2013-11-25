//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "attribute vec4 position3DAndHeight;\n\
attribute vec2 textureCoordinates;\n\
uniform vec3 u_center3D;\n\
uniform mat4 u_modifiedModelView;\n\
uniform vec4 u_tileExtent;\n\
uniform vec2 u_southAndNorthLatitude;\n\
uniform vec3 u_southMercatorYLowAndHighAndOneOverHeight;\n\
varying vec3 v_positionMC;\n\
varying vec3 v_positionEC;\n\
varying vec2 v_textureCoordinates;\n\
vec4 getPosition(vec3 position3DWC);\n\
float get2DYPositionFraction();\n\
vec4 getPosition3DMode(vec3 position3DWC)\n\
{\n\
return czm_projection * (u_modifiedModelView * vec4(position3DAndHeight.xyz, 1.0));\n\
}\n\
float get2DMercatorYPositionFraction()\n\
{\n\
const float maxTileWidth = 0.003068;\n\
float positionFraction = textureCoordinates.y;\n\
float southLatitude = u_southAndNorthLatitude.x;\n\
float northLatitude = u_southAndNorthLatitude.y;\n\
if (northLatitude - southLatitude > maxTileWidth)\n\
{\n\
float southMercatorYLow = u_southMercatorYLowAndHighAndOneOverHeight.x;\n\
float southMercatorYHigh = u_southMercatorYLowAndHighAndOneOverHeight.y;\n\
float oneOverMercatorHeight = u_southMercatorYLowAndHighAndOneOverHeight.z;\n\
float currentLatitude = mix(southLatitude, northLatitude, textureCoordinates.y);\n\
currentLatitude = clamp(currentLatitude, -czm_webMercatorMaxLatitude, czm_webMercatorMaxLatitude);\n\
positionFraction = czm_latitudeToWebMercatorFraction(currentLatitude, southMercatorYLow, southMercatorYHigh, oneOverMercatorHeight);\n\
}\n\
return positionFraction;\n\
}\n\
float get2DGeographicYPositionFraction()\n\
{\n\
return textureCoordinates.y;\n\
}\n\
vec4 getPositionPlanarEarth(vec3 position3DWC, float height2D)\n\
{\n\
float yPositionFraction = get2DYPositionFraction();\n\
vec4 rtcPosition2D = vec4(height2D, mix(u_tileExtent.st, u_tileExtent.pq, vec2(textureCoordinates.x, yPositionFraction)), 1.0);\n\
return czm_projection * (u_modifiedModelView * rtcPosition2D);\n\
}\n\
vec4 getPosition2DMode(vec3 position3DWC)\n\
{\n\
return getPositionPlanarEarth(position3DWC, 0.0);\n\
}\n\
vec4 getPositionColumbusViewMode(vec3 position3DWC)\n\
{\n\
return getPositionPlanarEarth(position3DWC, position3DAndHeight.w);\n\
}\n\
vec4 getPositionMorphingMode(vec3 position3DWC)\n\
{\n\
float yPositionFraction = get2DYPositionFraction();\n\
vec4 position2DWC = vec4(0.0, mix(u_tileExtent.st, u_tileExtent.pq, vec2(textureCoordinates.x, yPositionFraction)), 1.0);\n\
vec4 morphPosition = czm_columbusViewMorph(position2DWC, vec4(position3DWC, 1.0), czm_morphTime);\n\
return czm_modelViewProjection * morphPosition;\n\
}\n\
void main()\n\
{\n\
vec3 position3DWC = position3DAndHeight.xyz + u_center3D;\n\
gl_Position = getPosition(position3DWC);\n\
#ifdef SHOW_REFLECTIVE_OCEAN\n\
v_positionEC = (czm_modelView3D * vec4(position3DWC, 1.0)).xyz;\n\
v_positionMC = position3DWC;\n\
#endif\n\
v_textureCoordinates = textureCoordinates;\n\
}\n\
";
});