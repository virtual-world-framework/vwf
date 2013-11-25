//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "float czm_latitudeToWebMercatorFraction(float latitude, float southMercatorYLow, float southMercatorYHigh, float oneOverMercatorHeight)\n\
{\n\
float sinLatitude = sin(latitude);\n\
float mercatorY = 0.5 * log((1.0 + sinLatitude) / (1.0 - sinLatitude));\n\
float t1 = 0.0 - southMercatorYLow;\n\
float e = t1 - 0.0;\n\
float t2 = ((-southMercatorYLow - e) + (0.0 - (t1 - e))) + mercatorY - southMercatorYHigh;\n\
float highDifference = t1 + t2;\n\
float lowDifference = t2 - (highDifference - t1);\n\
return highDifference * oneOverMercatorHeight + lowDifference * oneOverMercatorHeight;\n\
}\n\
";
});