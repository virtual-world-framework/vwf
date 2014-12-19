    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "attribute vec4 position;\n\
attribute vec3 normal;\n\
\n\
varying vec3 v_positionWC;\n\
varying vec3 v_positionEC;\n\
varying vec3 v_normalEC;\n\
\n\
void main()\n\
{\n\
    gl_Position = czm_modelViewProjection * position;\n\
    v_positionWC = (czm_model * position).xyz;\n\
    v_positionEC = (czm_modelView * position).xyz;\n\
    v_normalEC = czm_normal * normal;\n\
}";
});