//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "#define SAMPLES 8\n\
uniform float delta;\n\
uniform float sigma;\n\
uniform float direction;\n\
uniform sampler2D u_texture;\n\
uniform vec2 u_step;\n\
varying vec2 v_textureCoordinates;\n\
void main()\n\
{\n\
vec2 st = v_textureCoordinates;\n\
vec2 dir = vec2(1.0 - direction, direction);\n\
vec3 g;\n\
g.x = 1.0 / (sqrt(czm_twoPi) * sigma);\n\
g.y = exp((-0.5 * delta * delta) / (sigma * sigma));\n\
g.z = g.y * g.y;\n\
vec4 result = texture2D(u_texture, st) * g.x;\n\
for (int i = 1; i < SAMPLES; ++i)\n\
{\n\
g.xy *= g.yz;\n\
vec2 offset = float(i) * dir * u_step;\n\
result += texture2D(u_texture, st - offset) * g.x;\n\
result += texture2D(u_texture, st + offset) * g.x;\n\
}\n\
gl_FragColor = result;\n\
}\n\
";
});