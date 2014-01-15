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
    return "/**\n\
 * @license\n\
 * Description : Array and textureless GLSL 2D/3D/4D simplex \n\
 *               noise functions.\n\
 *      Author : Ian McEwan, Ashima Arts.\n\
 *  Maintainer : ijm\n\
 *     Lastmod : 20110822 (ijm)\n\
 *     License : Copyright (C) 2011 Ashima Arts. All rights reserved.\n\
 *               Distributed under the MIT License. See LICENSE file.\n\
 *               https://github.com/ashima/webgl-noise\n\
 */ \n\
\n\
vec4 _czm_mod289(vec4 x)\n\
{\n\
  return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
\n\
vec3 _czm_mod289(vec3 x)\n\
{\n\
    return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
\n\
vec2 _czm_mod289(vec2 x) \n\
{\n\
    return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
\n\
float _czm_mod289(float x)\n\
{\n\
    return x - floor(x * (1.0 / 289.0)) * 289.0;\n\
}\n\
  \n\
vec4 _czm_permute(vec4 x)\n\
{\n\
    return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
\n\
vec3 _czm_permute(vec3 x)\n\
{\n\
    return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
\n\
float _czm_permute(float x) \n\
{\n\
    return _czm_mod289(((x*34.0)+1.0)*x);\n\
}\n\
\n\
vec4 _czm_taylorInvSqrt(vec4 r)\n\
{\n\
    return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
\n\
float _czm_taylorInvSqrt(float r)\n\
{\n\
    return 1.79284291400159 - 0.85373472095314 * r;\n\
}\n\
\n\
vec4 _czm_grad4(float j, vec4 ip)\n\
{\n\
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);\n\
    vec4 p,s;\n\
\n\
    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;\n\
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);\n\
    s = vec4(lessThan(p, vec4(0.0)));\n\
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www; \n\
\n\
    return p;\n\
}\n\
  \n\
/**\n\
 * DOC_TBA\n\
 *\n\
 * Implemented by Ian McEwan, Ashima Arts, and distributed under the MIT License.  {@link https://github.com/ashima/webgl-noise}\n\
 *\n\
 * @name czm_snoise\n\
 * @glslFunction\n\
 *\n\
 * @see <a href=\"https://github.com/ashima/webgl-noise\">https://github.com/ashima/webgl-noise</a>\n\
 * @see Stefan Gustavson's paper <a href=\"http://www.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf\">Simplex noise demystified</a>\n\
 */  \n\
float czm_snoise(vec2 v)\n\
{\n\
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0\n\
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)\n\
                       -0.577350269189626,  // -1.0 + 2.0 * C.x\n\
                        0.024390243902439); // 1.0 / 41.0\n\
    // First corner\n\
    vec2 i  = floor(v + dot(v, C.yy) );\n\
    vec2 x0 = v -   i + dot(i, C.xx);\n\
\n\
    // Other corners\n\
    vec2 i1;\n\
    //i1.x = step( x0.y, x0.x ); // x0.x > x0.y ? 1.0 : 0.0\n\
    //i1.y = 1.0 - i1.x;\n\
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);\n\
    // x0 = x0 - 0.0 + 0.0 * C.xx ;\n\
    // x1 = x0 - i1 + 1.0 * C.xx ;\n\
    // x2 = x0 - 1.0 + 2.0 * C.xx ;\n\
    vec4 x12 = x0.xyxy + C.xxzz;\n\
    x12.xy -= i1;\n\
\n\
    // Permutations\n\
    i = _czm_mod289(i); // Avoid truncation effects in permutation\n\
    vec3 p = _czm_permute( _czm_permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));\n\
\n\
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);\n\
    m = m*m ;\n\
    m = m*m ;\n\
\n\
    // Gradients: 41 points uniformly over a line, mapped onto a diamond.\n\
    // The ring size 17*17 = 289 is close to a multiple of 41 (41*7 = 287)\n\
    vec3 x = 2.0 * fract(p * C.www) - 1.0;\n\
    vec3 h = abs(x) - 0.5;\n\
    vec3 ox = floor(x + 0.5);\n\
    vec3 a0 = x - ox;\n\
\n\
    // Normalise gradients implicitly by scaling m\n\
    // Approximation of: m *= inversesqrt( a0*a0 + h*h );\n\
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );\n\
\n\
    // Compute final noise value at P\n\
    vec3 g;\n\
    g.x  = a0.x  * x0.x  + h.x  * x0.y;\n\
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;\n\
    return 130.0 * dot(m, g);\n\
}\n\
\n\
float czm_snoise(vec3 v)\n\
{ \n\
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n\
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\
\n\
    // First corner\n\
    vec3 i  = floor(v + dot(v, C.yyy) );\n\
    vec3 x0 =   v - i + dot(i, C.xxx) ;\n\
\n\
    // Other corners\n\
    vec3 g = step(x0.yzx, x0.xyz);\n\
    vec3 l = 1.0 - g;\n\
    vec3 i1 = min( g.xyz, l.zxy );\n\
    vec3 i2 = max( g.xyz, l.zxy );\n\
\n\
    //   x0 = x0 - 0.0 + 0.0 * C.xxx;\n\
    //   x1 = x0 - i1  + 1.0 * C.xxx;\n\
    //   x2 = x0 - i2  + 2.0 * C.xxx;\n\
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;\n\
    vec3 x1 = x0 - i1 + C.xxx;\n\
    vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n\
    vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\
\n\
    // Permutations\n\
    i = _czm_mod289(i); \n\
    vec4 p = _czm_permute( _czm_permute( _czm_permute( \n\
                i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n\
              + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) \n\
              + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\
\n\
    // Gradients: 7x7 points over a square, mapped onto an octahedron.\n\
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)\n\
    float n_ = 0.142857142857; // 1.0/7.0\n\
    vec3  ns = n_ * D.wyz - D.xzx;\n\
\n\
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\
\n\
    vec4 x_ = floor(j * ns.z);\n\
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\
\n\
    vec4 x = x_ *ns.x + ns.yyyy;\n\
    vec4 y = y_ *ns.x + ns.yyyy;\n\
    vec4 h = 1.0 - abs(x) - abs(y);\n\
\n\
    vec4 b0 = vec4( x.xy, y.xy );\n\
    vec4 b1 = vec4( x.zw, y.zw );\n\
\n\
    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;\n\
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;\n\
    vec4 s0 = floor(b0)*2.0 + 1.0;\n\
    vec4 s1 = floor(b1)*2.0 + 1.0;\n\
    vec4 sh = -step(h, vec4(0.0));\n\
\n\
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n\
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\
\n\
    vec3 p0 = vec3(a0.xy,h.x);\n\
    vec3 p1 = vec3(a0.zw,h.y);\n\
    vec3 p2 = vec3(a1.xy,h.z);\n\
    vec3 p3 = vec3(a1.zw,h.w);\n\
\n\
    //Normalise gradients\n\
    vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
    p0 *= norm.x;\n\
    p1 *= norm.y;\n\
    p2 *= norm.z;\n\
    p3 *= norm.w;\n\
\n\
    // Mix final noise value\n\
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n\
    m = m * m;\n\
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), \n\
                                dot(p2,x2), dot(p3,x3) ) );\n\
}\n\
\n\
float czm_snoise(vec4 v)\n\
{\n\
    const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4\n\
                          0.276393202250021,  // 2 * G4\n\
                          0.414589803375032,  // 3 * G4\n\
                         -0.447213595499958); // -1 + 4 * G4\n\
\n\
    // (sqrt(5) - 1)/4 = F4, used once below\n\
    #define F4 0.309016994374947451\n\
\n\
    // First corner\n\
    vec4 i  = floor(v + dot(v, vec4(F4)) );\n\
    vec4 x0 = v -   i + dot(i, C.xxxx);\n\
\n\
    // Other corners\n\
\n\
    // Rank sorting originally contributed by Bill Licea-Kane, AMD (formerly ATI)\n\
    vec4 i0;\n\
    vec3 isX = step( x0.yzw, x0.xxx );\n\
    vec3 isYZ = step( x0.zww, x0.yyz );\n\
    //  i0.x = dot( isX, vec3( 1.0 ) );\n\
    i0.x = isX.x + isX.y + isX.z;\n\
    i0.yzw = 1.0 - isX;\n\
    //  i0.y += dot( isYZ.xy, vec2( 1.0 ) );\n\
    i0.y += isYZ.x + isYZ.y;\n\
    i0.zw += 1.0 - isYZ.xy;\n\
    i0.z += isYZ.z;\n\
    i0.w += 1.0 - isYZ.z;\n\
\n\
    // i0 now contains the unique values 0,1,2,3 in each channel\n\
    vec4 i3 = clamp( i0, 0.0, 1.0 );\n\
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );\n\
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );\n\
\n\
    //  x0 = x0 - 0.0 + 0.0 * C.xxxx\n\
    //  x1 = x0 - i1  + 1.0 * C.xxxx\n\
    //  x2 = x0 - i2  + 2.0 * C.xxxx\n\
    //  x3 = x0 - i3  + 3.0 * C.xxxx\n\
    //  x4 = x0 - 1.0 + 4.0 * C.xxxx\n\
    vec4 x1 = x0 - i1 + C.xxxx;\n\
    vec4 x2 = x0 - i2 + C.yyyy;\n\
    vec4 x3 = x0 - i3 + C.zzzz;\n\
    vec4 x4 = x0 + C.wwww;\n\
\n\
    // Permutations\n\
    i = _czm_mod289(i); \n\
    float j0 = _czm_permute( _czm_permute( _czm_permute( _czm_permute(i.w) + i.z) + i.y) + i.x);\n\
    vec4 j1 = _czm_permute( _czm_permute( _czm_permute( _czm_permute (\n\
               i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))\n\
             + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))\n\
             + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))\n\
             + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));\n\
\n\
    // Gradients: 7x7x6 points over a cube, mapped onto a 4-cross polytope\n\
    // 7*7*6 = 294, which is close to the ring size 17*17 = 289.\n\
    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;\n\
\n\
    vec4 p0 = _czm_grad4(j0,   ip);\n\
    vec4 p1 = _czm_grad4(j1.x, ip);\n\
    vec4 p2 = _czm_grad4(j1.y, ip);\n\
    vec4 p3 = _czm_grad4(j1.z, ip);\n\
    vec4 p4 = _czm_grad4(j1.w, ip);\n\
\n\
    // Normalise gradients\n\
    vec4 norm = _czm_taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n\
    p0 *= norm.x;\n\
    p1 *= norm.y;\n\
    p2 *= norm.z;\n\
    p3 *= norm.w;\n\
    p4 *= _czm_taylorInvSqrt(dot(p4,p4));\n\
\n\
    // Mix contributions from the five corners\n\
    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);\n\
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)            ), 0.0);\n\
    m0 = m0 * m0;\n\
    m1 = m1 * m1;\n\
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 )))\n\
                  + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;\n\
}\n\
";
});