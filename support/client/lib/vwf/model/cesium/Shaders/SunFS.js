//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "varying vec2 v_textureCoordinates;\n\
void main()\n\
{\n\
vec4 color = vec4(1.0, 1.0, 0.0, 1.0);\n\
float b = smoothstep(0.03, 0.3, length(v_textureCoordinates - vec2(0.5)));\n\
color.ba = mix(vec2(1.0), vec2(0.0), b);\n\
gl_FragColor = color;\n\
}\n\
";
});