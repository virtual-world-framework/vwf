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
return "attribute vec4 position;\n\
uniform float fCameraHeight;\n\
uniform float fCameraHeight2;\n\
uniform float fOuterRadius;\n\
uniform float fOuterRadius2;\n\
uniform float fInnerRadius;\n\
uniform float fScale;\n\
uniform float fScaleDepth;\n\
uniform float fScaleOverScaleDepth;\n\
const float Kr = 0.0025;\n\
const float fKr4PI = Kr * 4.0 * czm_pi;\n\
const float Km = 0.0015;\n\
const float fKm4PI = Km * 4.0 * czm_pi;\n\
const float ESun = 15.0;\n\
const float fKmESun = Km * ESun;\n\
const float fKrESun = Kr * ESun;\n\
const vec3 v3InvWavelength = vec3(\n\
5.60204474633241,\n\
9.473284437923038,\n\
19.643802610477206);\n\
const float rayleighScaleDepth = 0.25;\n\
const int nSamples = 2;\n\
const float fSamples = 2.0;\n\
varying vec3 v_rayleighColor;\n\
varying vec3 v_mieColor;\n\
varying vec3 v_toCamera;\n\
varying vec3 v_positionEC;\n\
float scale(float fCos)\n\
{\n\
float x = 1.0 - fCos;\n\
return fScaleDepth * exp(-0.00287 + x*(0.459 + x*(3.83 + x*(-6.80 + x*5.25))));\n\
}\n\
void main(void)\n\
{\n\
vec3 v3Pos = position.xyz;\n\
vec3 v3Ray = v3Pos - czm_viewerPositionWC;\n\
float fFar = length(v3Ray);\n\
v3Ray /= fFar;\n\
#ifdef SKY_FROM_SPACE\n\
float B = 2.0 * dot(czm_viewerPositionWC, v3Ray);\n\
float C = fCameraHeight2 - fOuterRadius2;\n\
float fDet = max(0.0, B*B - 4.0 * C);\n\
float fNear = 0.5 * (-B - sqrt(fDet));\n\
vec3 v3Start = czm_viewerPositionWC + v3Ray * fNear;\n\
fFar -= fNear;\n\
float fStartAngle = dot(v3Ray, v3Start) / fOuterRadius;\n\
float fStartDepth = exp(-1.0 / fScaleDepth);\n\
float fStartOffset = fStartDepth*scale(fStartAngle);\n\
#else\n\
vec3 v3Start = czm_viewerPositionWC;\n\
float fHeight = length(v3Start);\n\
float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fCameraHeight));\n\
float fStartAngle = dot(v3Ray, v3Start) / fHeight;\n\
float fStartOffset = fDepth*scale(fStartAngle);\n\
#endif\n\
float fSampleLength = fFar / fSamples;\n\
float fScaledLength = fSampleLength * fScale;\n\
vec3 v3SampleRay = v3Ray * fSampleLength;\n\
vec3 v3SamplePoint = v3Start + v3SampleRay * 0.5;\n\
vec3 v3FrontColor = vec3(0.0, 0.0, 0.0);\n\
for(int i=0; i<nSamples; i++)\n\
{\n\
float fHeight = length(v3SamplePoint);\n\
float fDepth = exp(fScaleOverScaleDepth * (fInnerRadius - fHeight));\n\
vec3 lightPosition = normalize(czm_viewerPositionWC);\n\
float fLightAngle = dot(lightPosition, v3SamplePoint) / fHeight;\n\
float fCameraAngle = dot(v3Ray, v3SamplePoint) / fHeight;\n\
float fScatter = (fStartOffset + fDepth*(scale(fLightAngle) - scale(fCameraAngle)));\n\
vec3 v3Attenuate = exp(-fScatter * (v3InvWavelength * fKr4PI + fKm4PI));\n\
v3FrontColor += v3Attenuate * (fDepth * fScaledLength);\n\
v3SamplePoint += v3SampleRay;\n\
}\n\
v_mieColor = v3FrontColor * fKmESun;\n\
v_rayleighColor = v3FrontColor * (v3InvWavelength * fKrESun);\n\
v_toCamera = czm_viewerPositionWC - v3Pos;\n\
v_positionEC = (czm_modelView * position).xyz;\n\
gl_Position = czm_modelViewProjection * position;\n\
}\n\
";
});