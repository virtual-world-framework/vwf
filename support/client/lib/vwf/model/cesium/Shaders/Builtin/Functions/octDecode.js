    //This file is automatically rebuilt by the Cesium build process.
    /*global define*/
    define(function() {
    "use strict";
    return "/**\n\
 * Decodes a unit-length vector in 'oct' encoding to a normalized 3-component Cartesian vector.\n\
 * The 'oct' encoding is described in \"A Survey of Efficient Representations of Independent Unit Vectors\",\n\
 * Cigolle et al 2014: http://jcgt.org/published/0003/02/01/\n\
 * \n\
 * @name czm_octDecode\n\
 * @param {vec2} encoded The oct-encoded, unit-length vector\n\
 * @returns {vec3} The decoded and normalized vector\n\
 */\n\
 vec3 czm_octDecode(vec2 encoded)\n\
 {\n\
    vec3 v = vec3(encoded.x, encoded.y, 1.0 - abs(encoded.x) - abs(encoded.y));\n\
    if (v.z < 0.0)\n\
    {\n\
        v.xy = (1.0 - abs(v.yx)) * czm_signNotZero(v.xy);\n\
    }\n\
    \n\
    return normalize(v);\n\
 }\n\
";
});