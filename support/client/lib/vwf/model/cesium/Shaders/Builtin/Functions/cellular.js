/**
 * @license
 * Cellular noise ("Worley noise") in 2D in GLSL.
 * Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.
 * This code is released under the conditions of the MIT license.
 * See LICENSE file for details.
 */
//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "vec3 _czm_permute289(vec3 x)\n\
{\n\
return mod((34.0 * x + 1.0) * x, 289.0);\n\
}\n\
vec2 czm_cellular(vec2 P)\n\
{\n\
#define K 0.142857142857\n\
#define Ko 0.428571428571\n\
#define jitter 1.0\n\
vec2 Pi = mod(floor(P), 289.0);\n\
vec2 Pf = fract(P);\n\
vec3 oi = vec3(-1.0, 0.0, 1.0);\n\
vec3 of = vec3(-0.5, 0.5, 1.5);\n\
vec3 px = _czm_permute289(Pi.x + oi);\n\
vec3 p = _czm_permute289(px.x + Pi.y + oi);\n\
vec3 ox = fract(p*K) - Ko;\n\
vec3 oy = mod(floor(p*K),7.0)*K - Ko;\n\
vec3 dx = Pf.x + 0.5 + jitter*ox;\n\
vec3 dy = Pf.y - of + jitter*oy;\n\
vec3 d1 = dx * dx + dy * dy;\n\
p = _czm_permute289(px.y + Pi.y + oi);\n\
ox = fract(p*K) - Ko;\n\
oy = mod(floor(p*K),7.0)*K - Ko;\n\
dx = Pf.x - 0.5 + jitter*ox;\n\
dy = Pf.y - of + jitter*oy;\n\
vec3 d2 = dx * dx + dy * dy;\n\
p = _czm_permute289(px.z + Pi.y + oi);\n\
ox = fract(p*K) - Ko;\n\
oy = mod(floor(p*K),7.0)*K - Ko;\n\
dx = Pf.x - 1.5 + jitter*ox;\n\
dy = Pf.y - of + jitter*oy;\n\
vec3 d3 = dx * dx + dy * dy;\n\
vec3 d1a = min(d1, d2);\n\
d2 = max(d1, d2);\n\
d2 = min(d2, d3);\n\
d1 = min(d1a, d2);\n\
d2 = max(d1a, d2);\n\
d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx;\n\
d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx;\n\
d1.yz = min(d1.yz, d2.yz);\n\
d1.y = min(d1.y, d1.z);\n\
d1.y = min(d1.y, d2.x);\n\
return sqrt(d1.xy);\n\
}\n\
";
});