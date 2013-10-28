/**
 * @license
 * Copyright (c) 2000-2005, Sean O'Neil (s_p_oneil@hotmail.com)
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 * * Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * * Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * * Neither the name of the project nor the names of its contributors may be
 *   used to endorse or promote products derived from this software without
 *   specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * Modifications made by Analytical Graphics, Inc.
 */
//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "const float g = -0.95;\n\
const float g2 = g * g;\n\
varying vec3 v_rayleighColor;\n\
varying vec3 v_mieColor;\n\
varying vec3 v_toCamera;\n\
varying vec3 v_positionEC;\n\
void main (void)\n\
{\n\
czm_ellipsoid ellipsoid = czm_getWgs84EllipsoidEC();\n\
vec3 direction = normalize(v_positionEC);\n\
czm_ray ray = czm_ray(vec3(0.0), direction);\n\
czm_raySegment intersection = czm_rayEllipsoidIntersectionInterval(ray, ellipsoid);\n\
if (!czm_isEmpty(intersection)) {\n\
discard;\n\
}\n\
float fCos = dot(czm_sunDirectionWC, normalize(v_toCamera)) / length(v_toCamera);\n\
float fRayleighPhase = 0.75 * (1.0 + fCos*fCos);\n\
float fMiePhase = 1.5 * ((1.0 - g2) / (2.0 + g2)) * (1.0 + fCos*fCos) / pow(1.0 + g2 - 2.0*g*fCos, 1.5);\n\
const float fExposure = 2.0;\n\
vec3 rgb = fRayleighPhase * v_rayleighColor + fMiePhase * v_mieColor;\n\
rgb = vec3(1.0) - exp(-fExposure * rgb);\n\
float l = czm_luminance(rgb);\n\
gl_FragColor = vec4(rgb, min(smoothstep(0.0, 0.1, l), 1.0) * smoothstep(0.0, 1.0, czm_morphTime));\n\
}\n\
";
});