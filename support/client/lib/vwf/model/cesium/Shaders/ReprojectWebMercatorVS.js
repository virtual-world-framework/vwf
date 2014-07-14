    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "attribute vec4 position;\n\
\n\
uniform vec2 u_textureDimensions;\n\
\n\
uniform float u_northLatitude;\n\
uniform float u_southLatitude;\n\
uniform float u_southMercatorYHigh;\n\
uniform float u_southMercatorYLow;\n\
uniform float u_oneOverMercatorHeight;\n\
\n\
varying vec2 v_textureCoordinates;\n\
\n\
void main()\n\
{\n\
    float currentLatitude = mix(u_southLatitude, u_northLatitude, position.y);\n\
    float fraction = czm_latitudeToWebMercatorFraction(currentLatitude, u_southMercatorYLow, u_southMercatorYHigh, u_oneOverMercatorHeight);\n\
    v_textureCoordinates = vec2(position.x, fraction);\n\
    gl_Position = czm_viewportOrthographic * (position * vec4(u_textureDimensions, 1.0, 1.0));\n\
}\n\
";
});