//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "attribute vec4 position;\n\
varying vec4 positionEC;\n\
void main()\n\
{\n\
positionEC = czm_modelView * position;\n\
gl_Position = czm_projection * positionEC;\n\
}\n\
";
});