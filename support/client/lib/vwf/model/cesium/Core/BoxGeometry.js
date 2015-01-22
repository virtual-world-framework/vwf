/*global define*/
define([
        './BoundingSphere',
        './Cartesian3',
        './ComponentDatatype',
        './defaultValue',
        './defined',
        './DeveloperError',
        './Geometry',
        './GeometryAttribute',
        './GeometryAttributes',
        './PrimitiveType',
        './VertexFormat'
    ], function(
        BoundingSphere,
        Cartesian3,
        ComponentDatatype,
        defaultValue,
        defined,
        DeveloperError,
        Geometry,
        GeometryAttribute,
        GeometryAttributes,
        PrimitiveType,
        VertexFormat) {
    "use strict";

    var diffScratch = new Cartesian3();

    /**
     * Describes a cube centered at the origin.
     *
     * @alias BoxGeometry
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Cartesian3} options.minimumCorner The minimum x, y, and z coordinates of the box.
     * @param {Cartesian3} options.maximumCorner The maximum x, y, and z coordinates of the box.
     * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
     *
     * @see BoxGeometry.fromDimensions
     * @see BoxGeometry.createGeometry
     *
     * @demo {@link http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Box.html|Cesium Sandcastle Box Demo}
     *
     * @example
     * var box = new Cesium.BoxGeometry({
     *   vertexFormat : Cesium.VertexFormat.POSITION_ONLY,
     *   maximumCorner : new Cesium.Cartesian3(250000.0, 250000.0, 250000.0),
     *   minimumCorner : new Cesium.Cartesian3(-250000.0, -250000.0, -250000.0)
     * });
     * var geometry = Cesium.BoxGeometry.createGeometry(box);
     */
    var BoxGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var min = options.minimumCorner;
        var max = options.maximumCorner;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(min)) {
            throw new DeveloperError('options.minimumCorner is required.');
        }
        if (!defined(max)) {
            throw new DeveloperError('options.maximumCorner is required');
        }
        //>>includeEnd('debug');

        var vertexFormat = defaultValue(options.vertexFormat, VertexFormat.DEFAULT);

        this._minimumCorner = Cartesian3.clone(min);
        this._maximumCorner = Cartesian3.clone(max);
        this._vertexFormat = vertexFormat;
        this._workerName = 'createBoxGeometry';
    };

    /**
     * Creates a cube centered at the origin given its dimensions.
     *
     * @param {Cartesian3} options.dimensions The width, depth, and height of the box stored in the x, y, and z coordinates of the <code>Cartesian3</code>, respectively.
     * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
     *
     * @exception {DeveloperError} All dimensions components must be greater than or equal to zero.
     *
     * @see BoxGeometry.createGeometry
     *
     * @example
     * var box = Cesium.BoxGeometry.fromDimensions({
     *   vertexFormat : Cesium.VertexFormat.POSITION_ONLY,
     *   dimensions : new Cesium.Cartesian3(500000.0, 500000.0, 500000.0)
     * });
     * var geometry = Cesium.BoxGeometry.createGeometry(box);
     */
    BoxGeometry.fromDimensions = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var dimensions = options.dimensions;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(dimensions)) {
            throw new DeveloperError('options.dimensions is required.');
        }
        if (dimensions.x < 0 || dimensions.y < 0 || dimensions.z < 0) {
            throw new DeveloperError('All dimensions components must be greater than or equal to zero.');
        }
        //>>includeEnd('debug');

        var corner = Cartesian3.multiplyByScalar(dimensions, 0.5, new Cartesian3());
        var min = Cartesian3.negate(corner, new Cartesian3());
        var max = corner;

        var newOptions = {
            minimumCorner : min,
            maximumCorner : max,
            vertexFormat : options.vertexFormat
        };
        return new BoxGeometry(newOptions);
    };

    /**
     * Computes the geometric representation of a box, including its vertices, indices, and a bounding sphere.
     *
     * @param {BoxGeometry} boxGeometry A description of the box.
     * @returns {Geometry} The computed vertices and indices.
     */
    BoxGeometry.createGeometry = function(boxGeometry) {
        var min = boxGeometry._minimumCorner;
        var max = boxGeometry._maximumCorner;
        var vertexFormat = boxGeometry._vertexFormat;

        var attributes = new GeometryAttributes();
        var indices;
        var positions;

        if (vertexFormat.position &&
                (vertexFormat.st || vertexFormat.normal || vertexFormat.binormal || vertexFormat.tangent)) {
            if (vertexFormat.position) {
                // 8 corner points.  Duplicated 3 times each for each incident edge/face.
                positions = new Float64Array(6 * 4 * 3);

                // +z face
                positions[0]  = min.x;
                positions[1]  = min.y;
                positions[2]  = max.z;
                positions[3]  = max.x;
                positions[4]  = min.y;
                positions[5]  = max.z;
                positions[6]  = max.x;
                positions[7]  = max.y;
                positions[8]  = max.z;
                positions[9]  = min.x;
                positions[10] = max.y;
                positions[11] = max.z;

                // -z face
                positions[12] = min.x;
                positions[13] = min.y;
                positions[14] = min.z;
                positions[15] = max.x;
                positions[16] = min.y;
                positions[17] = min.z;
                positions[18] = max.x;
                positions[19] = max.y;
                positions[20] = min.z;
                positions[21] = min.x;
                positions[22] = max.y;
                positions[23] = min.z;

                // +x face
                positions[24] = max.x;
                positions[25] = min.y;
                positions[26] = min.z;
                positions[27] = max.x;
                positions[28] = max.y;
                positions[29] = min.z;
                positions[30] = max.x;
                positions[31] = max.y;
                positions[32] = max.z;
                positions[33] = max.x;
                positions[34] = min.y;
                positions[35] = max.z;

                // -x face
                positions[36] = min.x;
                positions[37] = min.y;
                positions[38] = min.z;
                positions[39] = min.x;
                positions[40] = max.y;
                positions[41] = min.z;
                positions[42] = min.x;
                positions[43] = max.y;
                positions[44] = max.z;
                positions[45] = min.x;
                positions[46] = min.y;
                positions[47] = max.z;

                // +y face
                positions[48] = min.x;
                positions[49] = max.y;
                positions[50] = min.z;
                positions[51] = max.x;
                positions[52] = max.y;
                positions[53] = min.z;
                positions[54] = max.x;
                positions[55] = max.y;
                positions[56] = max.z;
                positions[57] = min.x;
                positions[58] = max.y;
                positions[59] = max.z;

                // -y face
                positions[60] = min.x;
                positions[61] = min.y;
                positions[62] = min.z;
                positions[63] = max.x;
                positions[64] = min.y;
                positions[65] = min.z;
                positions[66] = max.x;
                positions[67] = min.y;
                positions[68] = max.z;
                positions[69] = min.x;
                positions[70] = min.y;
                positions[71] = max.z;

                attributes.position = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.DOUBLE,
                    componentsPerAttribute : 3,
                    values : positions
                });
            }

            if (vertexFormat.normal) {
                var normals = new Float32Array(6 * 4 * 3);

                // +z face
                normals[0]  = 0.0;
                normals[1]  = 0.0;
                normals[2]  = 1.0;
                normals[3]  = 0.0;
                normals[4]  = 0.0;
                normals[5]  = 1.0;
                normals[6]  = 0.0;
                normals[7]  = 0.0;
                normals[8]  = 1.0;
                normals[9]  = 0.0;
                normals[10] = 0.0;
                normals[11] = 1.0;

                // -z face
                normals[12] = 0.0;
                normals[13] = 0.0;
                normals[14] = -1.0;
                normals[15] = 0.0;
                normals[16] = 0.0;
                normals[17] = -1.0;
                normals[18] = 0.0;
                normals[19] = 0.0;
                normals[20] = -1.0;
                normals[21] = 0.0;
                normals[22] = 0.0;
                normals[23] = -1.0;

                // +x face
                normals[24] = 1.0;
                normals[25] = 0.0;
                normals[26] = 0.0;
                normals[27] = 1.0;
                normals[28] = 0.0;
                normals[29] = 0.0;
                normals[30] = 1.0;
                normals[31] = 0.0;
                normals[32] = 0.0;
                normals[33] = 1.0;
                normals[34] = 0.0;
                normals[35] = 0.0;

                // -x face
                normals[36] = -1.0;
                normals[37] = 0.0;
                normals[38] = 0.0;
                normals[39] = -1.0;
                normals[40] = 0.0;
                normals[41] = 0.0;
                normals[42] = -1.0;
                normals[43] = 0.0;
                normals[44] = 0.0;
                normals[45] = -1.0;
                normals[46] = 0.0;
                normals[47] = 0.0;

                // +y face
                normals[48] = 0.0;
                normals[49] = 1.0;
                normals[50] = 0.0;
                normals[51] = 0.0;
                normals[52] = 1.0;
                normals[53] = 0.0;
                normals[54] = 0.0;
                normals[55] = 1.0;
                normals[56] = 0.0;
                normals[57] = 0.0;
                normals[58] = 1.0;
                normals[59] = 0.0;

                // -y face
                normals[60] = 0.0;
                normals[61] = -1.0;
                normals[62] = 0.0;
                normals[63] = 0.0;
                normals[64] = -1.0;
                normals[65] = 0.0;
                normals[66] = 0.0;
                normals[67] = -1.0;
                normals[68] = 0.0;
                normals[69] = 0.0;
                normals[70] = -1.0;
                normals[71] = 0.0;

                attributes.normal = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 3,
                    values : normals
                });
            }

            if (vertexFormat.st) {
                var texCoords = new Float32Array(6 * 4 * 2);

                // +z face
                texCoords[0]  = 0.0;
                texCoords[1]  = 0.0;
                texCoords[2]  = 1.0;
                texCoords[3]  = 0.0;
                texCoords[4]  = 1.0;
                texCoords[5]  = 1.0;
                texCoords[6]  = 0.0;
                texCoords[7]  = 1.0;

                // -z face
                texCoords[8]  = 1.0;
                texCoords[9]  = 0.0;
                texCoords[10] = 0.0;
                texCoords[11] = 0.0;
                texCoords[12] = 0.0;
                texCoords[13] = 1.0;
                texCoords[14] = 1.0;
                texCoords[15] = 1.0;

                //+x face
                texCoords[16] = 0.0;
                texCoords[17] = 0.0;
                texCoords[18] = 1.0;
                texCoords[19] = 0.0;
                texCoords[20] = 1.0;
                texCoords[21] = 1.0;
                texCoords[22] = 0.0;
                texCoords[23] = 1.0;

                // -x face
                texCoords[24] = 1.0;
                texCoords[25] = 0.0;
                texCoords[26] = 0.0;
                texCoords[27] = 0.0;
                texCoords[28] = 0.0;
                texCoords[29] = 1.0;
                texCoords[30] = 1.0;
                texCoords[31] = 1.0;

                // +y face
                texCoords[32] = 1.0;
                texCoords[33] = 0.0;
                texCoords[34] = 0.0;
                texCoords[35] = 0.0;
                texCoords[36] = 0.0;
                texCoords[37] = 1.0;
                texCoords[38] = 1.0;
                texCoords[39] = 1.0;

                // -y face
                texCoords[40] = 0.0;
                texCoords[41] = 0.0;
                texCoords[42] = 1.0;
                texCoords[43] = 0.0;
                texCoords[44] = 1.0;
                texCoords[45] = 1.0;
                texCoords[46] = 0.0;
                texCoords[47] = 1.0;

                attributes.st = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 2,
                    values : texCoords
                });
            }

            if (vertexFormat.tangent) {
                var tangents = new Float32Array(6 * 4 * 3);

                // +z face
                tangents[0]  = 1.0;
                tangents[1]  = 0.0;
                tangents[2]  = 0.0;
                tangents[3]  = 1.0;
                tangents[4]  = 0.0;
                tangents[5]  = 0.0;
                tangents[6]  = 1.0;
                tangents[7]  = 0.0;
                tangents[8]  = 0.0;
                tangents[9]  = 1.0;
                tangents[10] = 0.0;
                tangents[11] = 0.0;

                // -z face
                tangents[12] = -1.0;
                tangents[13] = 0.0;
                tangents[14] = 0.0;
                tangents[15] = -1.0;
                tangents[16] = 0.0;
                tangents[17] = 0.0;
                tangents[18] = -1.0;
                tangents[19] = 0.0;
                tangents[20] = 0.0;
                tangents[21] = -1.0;
                tangents[22] = 0.0;
                tangents[23] = 0.0;

                // +x face
                tangents[24] = 0.0;
                tangents[25] = 1.0;
                tangents[26] = 0.0;
                tangents[27] = 0.0;
                tangents[28] = 1.0;
                tangents[29] = 0.0;
                tangents[30] = 0.0;
                tangents[31] = 1.0;
                tangents[32] = 0.0;
                tangents[33] = 0.0;
                tangents[34] = 1.0;
                tangents[35] = 0.0;

                // -x face
                tangents[36] = 0.0;
                tangents[37] = -1.0;
                tangents[38] = 0.0;
                tangents[39] = 0.0;
                tangents[40] = -1.0;
                tangents[41] = 0.0;
                tangents[42] = 0.0;
                tangents[43] = -1.0;
                tangents[44] = 0.0;
                tangents[45] = 0.0;
                tangents[46] = -1.0;
                tangents[47] = 0.0;

                // +y face
                tangents[48] = -1.0;
                tangents[49] = 0.0;
                tangents[50] = 0.0;
                tangents[51] = -1.0;
                tangents[52] = 0.0;
                tangents[53] = 0.0;
                tangents[54] = -1.0;
                tangents[55] = 0.0;
                tangents[56] = 0.0;
                tangents[57] = -1.0;
                tangents[58] = 0.0;
                tangents[59] = 0.0;

                // -y face
                tangents[60] = 1.0;
                tangents[61] = 0.0;
                tangents[62] = 0.0;
                tangents[63] = 1.0;
                tangents[64] = 0.0;
                tangents[65] = 0.0;
                tangents[66] = 1.0;
                tangents[67] = 0.0;
                tangents[68] = 0.0;
                tangents[69] = 1.0;
                tangents[70] = 0.0;
                tangents[71] = 0.0;

                attributes.tangent = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 3,
                    values : tangents
                });
            }

            if (vertexFormat.binormal) {
                var binormals = new Float32Array(6 * 4 * 3);

                // +z face
                binormals[0] = 0.0;
                binormals[1] = 1.0;
                binormals[2] = 0.0;
                binormals[3] = 0.0;
                binormals[4] = 1.0;
                binormals[5] = 0.0;
                binormals[6] = 0.0;
                binormals[7] = 1.0;
                binormals[8] = 0.0;
                binormals[9] = 0.0;
                binormals[10] = 1.0;
                binormals[11] = 0.0;

                // -z face
                binormals[12] = 0.0;
                binormals[13] = 1.0;
                binormals[14] = 0.0;
                binormals[15] = 0.0;
                binormals[16] = 1.0;
                binormals[17] = 0.0;
                binormals[18] = 0.0;
                binormals[19] = 1.0;
                binormals[20] = 0.0;
                binormals[21] = 0.0;
                binormals[22] = 1.0;
                binormals[23] = 0.0;

                // +x face
                binormals[24] = 0.0;
                binormals[25] = 0.0;
                binormals[26] = 1.0;
                binormals[27] = 0.0;
                binormals[28] = 0.0;
                binormals[29] = 1.0;
                binormals[30] = 0.0;
                binormals[31] = 0.0;
                binormals[32] = 1.0;
                binormals[33] = 0.0;
                binormals[34] = 0.0;
                binormals[35] = 1.0;

                // -x face
                binormals[36] = 0.0;
                binormals[37] = 0.0;
                binormals[38] = 1.0;
                binormals[39] = 0.0;
                binormals[40] = 0.0;
                binormals[41] = 1.0;
                binormals[42] = 0.0;
                binormals[43] = 0.0;
                binormals[44] = 1.0;
                binormals[45] = 0.0;
                binormals[46] = 0.0;
                binormals[47] = 1.0;

                // +y face
                binormals[48] = 0.0;
                binormals[49] = 0.0;
                binormals[50] = 1.0;
                binormals[51] = 0.0;
                binormals[52] = 0.0;
                binormals[53] = 1.0;
                binormals[54] = 0.0;
                binormals[55] = 0.0;
                binormals[56] = 1.0;
                binormals[57] = 0.0;
                binormals[58] = 0.0;
                binormals[59] = 1.0;

                // -y face
                binormals[60] = 0.0;
                binormals[61] = 0.0;
                binormals[62] = 1.0;
                binormals[63] = 0.0;
                binormals[64] = 0.0;
                binormals[65] = 1.0;
                binormals[66] = 0.0;
                binormals[67] = 0.0;
                binormals[68] = 1.0;
                binormals[69] = 0.0;
                binormals[70] = 0.0;
                binormals[71] = 1.0;

                attributes.binormal = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 3,
                    values : binormals
                });
            }

            // 12 triangles:  6 faces, 2 triangles each.
            indices = new Uint16Array(6 * 2 * 3);

            // +z face
            indices[0] = 0;
            indices[1] = 1;
            indices[2] = 2;
            indices[3] = 0;
            indices[4] = 2;
            indices[5] = 3;

            // -z face
            indices[6] = 4 + 2;
            indices[7] = 4 + 1;
            indices[8] = 4 + 0;
            indices[9] = 4 + 3;
            indices[10] = 4 + 2;
            indices[11] = 4 + 0;

            // +x face
            indices[12] = 8 + 0;
            indices[13] = 8 + 1;
            indices[14] = 8 + 2;
            indices[15] = 8 + 0;
            indices[16] = 8 + 2;
            indices[17] = 8 + 3;

            // -x face
            indices[18] = 12 + 2;
            indices[19] = 12 + 1;
            indices[20] = 12 + 0;
            indices[21] = 12 + 3;
            indices[22] = 12 + 2;
            indices[23] = 12 + 0;

            // +y face
            indices[24] = 16 + 2;
            indices[25] = 16 + 1;
            indices[26] = 16 + 0;
            indices[27] = 16 + 3;
            indices[28] = 16 + 2;
            indices[29] = 16 + 0;

            // -y face
            indices[30] = 20 + 0;
            indices[31] = 20 + 1;
            indices[32] = 20 + 2;
            indices[33] = 20 + 0;
            indices[34] = 20 + 2;
            indices[35] = 20 + 3;
        } else {
            // Positions only - no need to duplicate corner points
            positions = new Float64Array(8 * 3);

            positions[0] = min.x;
            positions[1] = min.y;
            positions[2] = min.z;
            positions[3] = max.x;
            positions[4] = min.y;
            positions[5] = min.z;
            positions[6] = max.x;
            positions[7] = max.y;
            positions[8] = min.z;
            positions[9] = min.x;
            positions[10] = max.y;
            positions[11] = min.z;
            positions[12] = min.x;
            positions[13] = min.y;
            positions[14] = max.z;
            positions[15] = max.x;
            positions[16] = min.y;
            positions[17] = max.z;
            positions[18] = max.x;
            positions[19] = max.y;
            positions[20] = max.z;
            positions[21] = min.x;
            positions[22] = max.y;
            positions[23] = max.z;

            attributes.position = new GeometryAttribute({
                componentDatatype : ComponentDatatype.DOUBLE,
                componentsPerAttribute : 3,
                values : positions
            });

            // 12 triangles:  6 faces, 2 triangles each.
            indices = new Uint16Array(6 * 2 * 3);

            // plane z = corner.Z
            indices[0] = 4;
            indices[1] = 5;
            indices[2] = 6;
            indices[3] = 4;
            indices[4] = 6;
            indices[5] = 7;

            // plane z = -corner.Z
            indices[6] = 1;
            indices[7] = 0;
            indices[8] = 3;
            indices[9] = 1;
            indices[10] = 3;
            indices[11] = 2;

            // plane x = corner.X
            indices[12] = 1;
            indices[13] = 6;
            indices[14] = 5;
            indices[15] = 1;
            indices[16] = 2;
            indices[17] = 6;

            // plane y = corner.Y
            indices[18] = 2;
            indices[19] = 3;
            indices[20] = 7;
            indices[21] = 2;
            indices[22] = 7;
            indices[23] = 6;

            // plane x = -corner.X
            indices[24] = 3;
            indices[25] = 0;
            indices[26] = 4;
            indices[27] = 3;
            indices[28] = 4;
            indices[29] = 7;

            // plane y = -corner.Y
            indices[30] = 0;
            indices[31] = 1;
            indices[32] = 5;
            indices[33] = 0;
            indices[34] = 5;
            indices[35] = 4;
        }

        var diff = Cartesian3.subtract(max, min, diffScratch);
        var radius = Cartesian3.magnitude(diff) * 0.5;

        return new Geometry({
            attributes : attributes,
            indices : indices,
            primitiveType : PrimitiveType.TRIANGLES,
            boundingSphere : new BoundingSphere(Cartesian3.ZERO, radius)
        });
    };

    return BoxGeometry;
});
