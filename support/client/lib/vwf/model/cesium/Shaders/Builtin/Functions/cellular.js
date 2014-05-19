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
    return "/**\n\
 * @license\n\
 * Cellular noise (\"Worley noise\") in 2D in GLSL.\n\
 * Copyright (c) Stefan Gustavson 2011-04-19. All rights reserved.\n\
 * This code is released under the conditions of the MIT license.\n\
 * See LICENSE file for details.\n\
 */\n\
 \n\
//#ifdef GL_OES_standard_derivatives\n\
//    #extension GL_OES_standard_derivatives : enable\n\
//#endif  \n\
//\n\
//float aastep (float threshold , float value)\n\
//{\n\
//    float afwidth = 0.7 * length ( vec2 ( dFdx ( value ), dFdy ( value )));\n\
//    return smoothstep ( threshold - afwidth , threshold + afwidth , value );\n\
//}\n\
\n\
// Permutation polynomial: (34x^2 + x) mod 289\n\
vec3 _czm_permute289(vec3 x)\n\
{\n\
    return mod((34.0 * x + 1.0) * x, 289.0);\n\
}\n\
\n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * Implemented by Stefan Gustavson, and distributed under the MIT License.  {@link http://openglinsights.git.sourceforge.net/git/gitweb.cgi?p=openglinsights/openglinsights;a=tree;f=proceduraltextures}\n\
 *\n\
 * @name czm_cellular\n\
 * @glslFunction\n\
 *\n\
 * @see Stefan Gustavson's chapter, <i>Procedural Textures in GLSL</i>, in <a href=\"http://www.openglinsights.com/\">OpenGL Insights</a>.\n\
 */  \n\
vec2 czm_cellular(vec2 P)\n\
// Cellular noise, returning F1 and F2 in a vec2.\n\
// Standard 3x3 search window for good F1 and F2 values\n\
{\n\
#define K 0.142857142857 // 1/7\n\
#define Ko 0.428571428571 // 3/7\n\
#define jitter 1.0 // Less gives more regular pattern\n\
    vec2 Pi = mod(floor(P), 289.0);\n\
    vec2 Pf = fract(P);\n\
    vec3 oi = vec3(-1.0, 0.0, 1.0);\n\
    vec3 of = vec3(-0.5, 0.5, 1.5);\n\
    vec3 px = _czm_permute289(Pi.x + oi);\n\
    vec3 p = _czm_permute289(px.x + Pi.y + oi); // p11, p12, p13\n\
    vec3 ox = fract(p*K) - Ko;\n\
    vec3 oy = mod(floor(p*K),7.0)*K - Ko;\n\
    vec3 dx = Pf.x + 0.5 + jitter*ox;\n\
    vec3 dy = Pf.y - of + jitter*oy;\n\
    vec3 d1 = dx * dx + dy * dy; // d11, d12 and d13, squared\n\
    p = _czm_permute289(px.y + Pi.y + oi); // p21, p22, p23\n\
    ox = fract(p*K) - Ko;\n\
    oy = mod(floor(p*K),7.0)*K - Ko;\n\
    dx = Pf.x - 0.5 + jitter*ox;\n\
    dy = Pf.y - of + jitter*oy;\n\
    vec3 d2 = dx * dx + dy * dy; // d21, d22 and d23, squared\n\
    p = _czm_permute289(px.z + Pi.y + oi); // p31, p32, p33\n\
    ox = fract(p*K) - Ko;\n\
    oy = mod(floor(p*K),7.0)*K - Ko;\n\
    dx = Pf.x - 1.5 + jitter*ox;\n\
    dy = Pf.y - of + jitter*oy;\n\
    vec3 d3 = dx * dx + dy * dy; // d31, d32 and d33, squared\n\
    // Sort out the two smallest distances (F1, F2)\n\
    vec3 d1a = min(d1, d2);\n\
    d2 = max(d1, d2); // Swap to keep candidates for F2\n\
    d2 = min(d2, d3); // neither F1 nor F2 are now in d3\n\
    d1 = min(d1a, d2); // F1 is now in d1\n\
    d2 = max(d1a, d2); // Swap to keep candidates for F2\n\
    d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx; // Swap if smaller\n\
    d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx; // F1 is in d1.x\n\
    d1.yz = min(d1.yz, d2.yz); // F2 is now not in d2.yz\n\
    d1.y = min(d1.y, d1.z); // nor in  d1.z\n\
    d1.y = min(d1.y, d2.x); // F2 is in d1.y, we're done.\n\
    return sqrt(d1.xy);\n\
}\n\
";
});