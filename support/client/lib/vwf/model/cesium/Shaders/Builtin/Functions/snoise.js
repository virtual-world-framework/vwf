/**
 * @license
 * Description : Array and textureless GLSL 2D/3D/4D simplex 
 *               noise functions.
 *      Author : Ian McEwan, Ashima Arts.
 *  Maintainer : ijm
 *     Lastmod : 20110822 (ijm)
 *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
 *               Distributed under the MIT License. See LICENSE file.
 *               https://github.com/ashima/webgl-noise
 */
//This file is automatically rebuilt by the Cesium build process.
/*global define*/
define(function() {
"use strict";
return "vec4 _czm_mod289(vec4 x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
vec3 _czm_mod289(vec3 x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
vec2 _czm_mod289(vec2 x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
float _czm_mod289(float x)\n\
{\n\
return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
vec4 _czm_permute(vec4 x)\n\
{\n\
return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
vec3 _czm_permute(vec3 x)\n\
{\n\
return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
float _czm_permute(float x)\n\
{\n\
return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
vec4 _czm_taylorInvSqrt(vec4 r)\n\
{\n\
return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
float _czm_taylorInvSqrt(float r)\n\
{\n\
return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
vec4 _czm_grad4(float j, vec4 ip)\n\
{\n\
const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);\n\
vec4 p,s;\n\
p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;\n\
p.w = 1.5 - dot(abs(p.xyz), ones.xyz);\n\
s = vec4(lessThan(p, vec4(0.0)));\n\
p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;\n\
return p;\n\
}\n\
float czm_snoise(vec2 v)\n\
{\n\
const vec4 C = vec4(0.211324865405187,\n\
0.366025403784439,\n\
-0.577350269189626,\n\
0.024390243902439);\n\
vec2 i  = floor(v + dot(v, C.yy) );\n\
vec2 x0 = v -   i + dot(i, C.xx);\n\
vec2 i1;\n\
i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n\
vec4 x12 = x0.xyxy + C.xxzz;\n\
x12.xy -= i1;\n\
i = _czm_mod289(i);\n\
vec3 p = _czm_permute( _czm_permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));\n\
vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\n\
m = m*m ;\n\
m = m*m ;\n\
vec3 x = 2.0 * fract(p * C.www) - 1.0;\n\
vec3 h = abs(x) - 0.5;\n\
vec3 ox = floor(x + 0.5);\n\
vec3 a0 = x - ox;\n\
m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n\
vec3 g;\n\
g.x  = a0.x  * x0.x  + h.x  * x0.y;\n\
g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n\
return 130.0 * dot(m, g);\n\
}\n\
float czm_snoise(vec3 v)\n\
{\n\
const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n\
const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\
vec3 i  = floor(v + dot(v, C.yyy) );\n\
vec3 x0 =   v - i + dot(i, C.xxx) ;\n\
vec3 g = step(x0.yzx, x0.xyz);\n\
vec3 l = 1.0 - g;\n\
vec3 i1 = min( g.xyz, l.zxy );\n\
vec3 i2 = max( g.xyz, l.zxy );\n\
vec3 x1 = x0 - i1 + C.xxx;\n\
vec3 x2 = x0 - i2 + C.yyy;\n\
vec3 x3 = x0 - D.yyy;\n\
i = _czm_mod289(i);\n\
vec4 p = _czm_permute( _czm_permute( _czm_permute(\n\
i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n\
+ i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n\
+ i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\
float n_ = 0.142857142857;\n\
vec3  ns = n_ * D.wyz - D.xzx;\n\
vec4 j = p - 49.0 * floor(p * ns.z * ns.z);\n\
vec4 x_ = floor(j * ns.z);\n\
vec4 y_ = floor(j - 7.0 * x_ );\n\
vec4 x = x_ *ns.x + ns.yyyy;\n\
vec4 y = y_ *ns.x + ns.yyyy;\n\
vec4 h = 1.0 - abs(x) - abs(y);\n\
vec4 b0 = vec4( x.xy, y.xy );\n\
vec4 b1 = vec4( x.zw, y.zw );\n\
vec4 s0 = floor(b0)*2.0 + 1.0;\n\
vec4 s1 = floor(b1)*2.0 + 1.0;\n\
vec4 sh = -step(h, vec4(0.0));\n\
vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n\
vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\
vec3 p0 = vec3(a0.xy,h.x);\n\
vec3 p1 = vec3(a0.zw,h.y);\n\
vec3 p2 = vec3(a1.xy,h.z);\n\
vec3 p3 = vec3(a1.zw,h.w);\n\
vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
p0 *= norm.x;\n\
p1 *= norm.y;\n\
p2 *= norm.z;\n\
p3 *= norm.w;\n\
vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n\
m = m * m;\n\
return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),\n\
dot(p2,x2), dot(p3,x3) ) );\n\
}\n\
float czm_snoise(vec4 v)\n\
{\n\
const vec4  C = vec4( 0.138196601125011,\n\
0.276393202250021,\n\
0.414589803375032,\n\
-0.447213595499958);\n\
#define F4 0.309016994374947451\n\
vec4 i  = floor(v + dot(v, vec4(F4)) );\n\
vec4 x0 = v -   i + dot(i, C.xxxx);\n\
vec4 i0;\n\
vec3 isX = step( x0.yzw, x0.xxx );\n\
vec3 isYZ = step( x0.zww, x0.yyz );\n\
i0.x = isX.x + isX.y + isX.z;\n\
i0.yzw = 1.0 - isX;\n\
i0.y += isYZ.x + isYZ.y;\n\
i0.zw += 1.0 - isYZ.xy;\n\
i0.z += isYZ.z;\n\
i0.w += 1.0 - isYZ.z;\n\
vec4 i3 = clamp( i0, 0.0, 1.0 );\n\
vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );\n\
vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );\n\
vec4 x1 = x0 - i1 + C.xxxx;\n\
vec4 x2 = x0 - i2 + C.yyyy;\n\
vec4 x3 = x0 - i3 + C.zzzz;\n\
vec4 x4 = x0 + C.wwww;\n\
i = _czm_mod289(i);\n\
float j0 = _czm_permute( _czm_permute( _czm_permute( _czm_permute(i.w) + i.z) + i.y) + i.x);\n\
vec4 j1 = _czm_permute( _czm_permute( _czm_permute( _czm_permute (\n\
i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))\n\
+ i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))\n\
+ i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))\n\
+ i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));\n\
vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;\n\
vec4 p0 = _czm_grad4(j0,   ip);\n\
vec4 p1 = _czm_grad4(j1.x, ip);\n\
vec4 p2 = _czm_grad4(j1.y, ip);\n\
vec4 p3 = _czm_grad4(j1.z, ip);\n\
vec4 p4 = _czm_grad4(j1.w, ip);\n\
vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
p0 *= norm.x;\n\
p1 *= norm.y;\n\
p2 *= norm.z;\n\
p3 *= norm.w;\n\
p4 *= _czm_taylorInvSqrt(dot(p4,p4));\n\
vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n\
vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);\n\
m0 = m0 * m0;\n\
m1 = m1 * m1;\n\
return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))\n\
+ dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;\n\
}\n\
";
});