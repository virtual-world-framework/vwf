/*global define*/
define([
        './BoundingSphere',
        './Cartesian2',
        './Cartesian3',
        './ComponentDatatype',
        './defaultValue',
        './DeveloperError',
        './Ellipsoid',
        './Geometry',
        './GeometryAttribute',
        './GeometryAttributes',
        './IndexDatatype',
        './Math',
        './PrimitiveType',
        './VertexFormat'
    ], function(
        BoundingSphere,
        Cartesian2,
        Cartesian3,
        ComponentDatatype,
        defaultValue,
        DeveloperError,
        Ellipsoid,
        Geometry,
        GeometryAttribute,
        GeometryAttributes,
        IndexDatatype,
        CesiumMath,
        PrimitiveType,
        VertexFormat) {
    "use strict";

    var scratchPosition = new Cartesian3();
    var scratchNormal = new Cartesian3();
    var scratchTangent = new Cartesian3();
    var scratchBinormal = new Cartesian3();
    var scratchNormalST = new Cartesian3();
    var defaultRadii = new Cartesian3(1.0, 1.0, 1.0);

    var cos = Math.cos;
    var sin = Math.sin;

    /**
     * A description of an ellipsoid centered at the origin.
     *
     * @alias EllipsoidGeometry
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {Cartesian3} [options.radii=Cartesian3(1.0, 1.0, 1.0)] The radii of the ellipsoid in the x, y, and z directions.
     * @param {Number} [options.stackPartitions=64] The number of times to partition the ellipsoid into stacks.
     * @param {Number} [options.slicePartitions=64] The number of times to partition the ellipsoid into radial slices.
     * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
     *
     * @exception {DeveloperError} options.slicePartitions cannot be less than three.
     * @exception {DeveloperError} options.stackPartitions cannot be less than three.
     *
     * @see EllipsoidGeometry#createGeometry
     *
     * @demo {@link http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Ellipsoid.html|Cesium Sandcastle Ellipsoid Demo}
     *
     * @example
     * var ellipsoid = new Cesium.EllipsoidGeometry({
     *   vertexFormat : Cesium.VertexFormat.POSITION_ONLY,
     *   radii : new Cesium.Cartesian3(1000000.0, 500000.0, 500000.0)
     * });
     * var geometry = Cesium.EllipsoidGeometry.createGeometry(ellipsoid);
     */
    var EllipsoidGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var radii = defaultValue(options.radii, defaultRadii);
        var stackPartitions = defaultValue(options.stackPartitions, 64);
        var slicePartitions = defaultValue(options.slicePartitions, 64);
        var vertexFormat = defaultValue(options.vertexFormat, VertexFormat.DEFAULT);

        //>>includeStart('debug', pragmas.debug);
        if (slicePartitions < 3) {
            throw new DeveloperError ('options.slicePartitions cannot be less than three.');
        }
        if (stackPartitions < 3) {
            throw new DeveloperError('options.stackPartitions cannot be less than three.');
        }
        //>>includeEnd('debug');

        this._radii = Cartesian3.clone(radii);
        this._stackPartitions = stackPartitions;
        this._slicePartitions = slicePartitions;
        this._vertexFormat = vertexFormat;
        this._workerName = 'createEllipsoidGeometry';
    };

    /**
     * Computes the geometric representation of an ellipsoid, including its vertices, indices, and a bounding sphere.
     *
     * @param {EllipsoidGeometry} ellipsoidGeometry A description of the ellipsoid.
     * @returns {Geometry} The computed vertices and indices.
     */
    EllipsoidGeometry.createGeometry = function(ellipsoidGeometry) {
        var radii = ellipsoidGeometry._radii;
        var ellipsoid = Ellipsoid.fromCartesian3(radii);
        var vertexFormat = ellipsoidGeometry._vertexFormat;

        // The extra slice and stack are for duplicating points at the x axis and poles.
        // We need the texture coordinates to interpolate from (2 * pi - delta) to 2 * pi instead of
        // (2 * pi - delta) to 0.
        var slicePartitions = ellipsoidGeometry._slicePartitions + 1;
        var stackPartitions = ellipsoidGeometry._stackPartitions + 1;

        var vertexCount = stackPartitions * slicePartitions;
        var positions = new Float64Array(vertexCount * 3);

        var numIndices = 6 * (slicePartitions - 1) * (stackPartitions - 1);
        var indices = IndexDatatype.createTypedArray(vertexCount, numIndices);

        var normals = (vertexFormat.normal) ? new Float32Array(vertexCount * 3) : undefined;
        var tangents = (vertexFormat.tangent) ? new Float32Array(vertexCount * 3) : undefined;
        var binormals = (vertexFormat.binormal) ? new Float32Array(vertexCount * 3) : undefined;
        var st = (vertexFormat.st) ? new Float32Array(vertexCount * 2) : undefined;

        var cosTheta = new Array(slicePartitions);
        var sinTheta = new Array(slicePartitions);

        var i;
        var j;
        var index = 0;

        for (i = 0; i < slicePartitions; i++) {
            var theta = CesiumMath.TWO_PI * i / (slicePartitions - 1);
            cosTheta[i] = cos(theta);
            sinTheta[i] = sin(theta);

            // duplicate first point for correct
            // texture coordinates at the north pole.
            positions[index++] = 0.0;
            positions[index++] = 0.0;
            positions[index++] = radii.z;
        }

        for (i = 1; i < stackPartitions - 1; i++) {
            var phi = Math.PI * i / (stackPartitions - 1);
            var sinPhi = sin(phi);

            var xSinPhi = radii.x * sinPhi;
            var ySinPhi = radii.y * sinPhi;
            var zCosPhi = radii.z * cos(phi);

            for (j = 0; j < slicePartitions; j++) {
                positions[index++] = cosTheta[j] * xSinPhi;
                positions[index++] = sinTheta[j] * ySinPhi;
                positions[index++] = zCosPhi;
            }
        }

        for (i = 0; i < slicePartitions; i++) {
            // duplicate first point for correct
            // texture coordinates at the north pole.
            positions[index++] = 0.0;
            positions[index++] = 0.0;
            positions[index++] = -radii.z;
        }

        var attributes = new GeometryAttributes();

        if (vertexFormat.position) {
            attributes.position = new GeometryAttribute({
                componentDatatype : ComponentDatatype.DOUBLE,
                componentsPerAttribute : 3,
                values : positions
            });
        }

        var stIndex = 0;
        var normalIndex = 0;
        var tangentIndex = 0;
        var binormalIndex = 0;

        if (vertexFormat.st || vertexFormat.normal || vertexFormat.tangent || vertexFormat.binormal) {
            for( i = 0; i < vertexCount; i++) {
                var position = Cartesian3.fromArray(positions, i * 3, scratchPosition);
                var normal = ellipsoid.geodeticSurfaceNormal(position, scratchNormal);

                if (vertexFormat.st) {
                    var normalST = Cartesian2.negate(normal, scratchNormalST);

                    // if the point is at or close to the pole, find a point along the same longitude
                    // close to the xy-plane for the s coordinate.
                    if (Cartesian2.magnitude(normalST) < CesiumMath.EPSILON6) {
                        index = (i + slicePartitions * Math.floor(stackPartitions * 0.5)) * 3;
                        if (index > positions.length) {
                            index = (i - slicePartitions * Math.floor(stackPartitions * 0.5)) * 3;
                        }
                        Cartesian3.fromArray(positions, index, normalST);
                        ellipsoid.geodeticSurfaceNormal(normalST, normalST);
                        Cartesian2.negate(normalST, normalST);
                    }

                    st[stIndex++] = (Math.atan2(normalST.y, normalST.x) / CesiumMath.TWO_PI) + 0.5;
                    st[stIndex++] = (Math.asin(normal.z) / Math.PI) + 0.5;
                }

                if (vertexFormat.normal) {
                    normals[normalIndex++] = normal.x;
                    normals[normalIndex++] = normal.y;
                    normals[normalIndex++] = normal.z;
                }

                if (vertexFormat.tangent || vertexFormat.binormal) {
                    var tangent = scratchTangent;
                    if (i < slicePartitions || i > vertexCount - slicePartitions - 1) {
                        Cartesian3.cross(Cartesian3.UNIT_X, normal, tangent);
                        Cartesian3.normalize(tangent, tangent);
                    } else {
                        Cartesian3.cross(Cartesian3.UNIT_Z, normal, tangent);
                        Cartesian3.normalize(tangent, tangent);
                    }

                    if (vertexFormat.tangent) {
                        tangents[tangentIndex++] = tangent.x;
                        tangents[tangentIndex++] = tangent.y;
                        tangents[tangentIndex++] = tangent.z;
                    }

                    if (vertexFormat.binormal) {
                        var binormal = Cartesian3.cross(normal, tangent, scratchBinormal);
                        Cartesian3.normalize(binormal, binormal);

                        binormals[binormalIndex++] = binormal.x;
                        binormals[binormalIndex++] = binormal.y;
                        binormals[binormalIndex++] = binormal.z;
                    }
                }
            }

            if (vertexFormat.st) {
                attributes.st = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 2,
                    values : st
                });
            }

            if (vertexFormat.normal) {
                attributes.normal = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 3,
                    values : normals
                });
            }

            if (vertexFormat.tangent) {
                attributes.tangent = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 3,
                    values : tangents
                });
            }

            if (vertexFormat.binormal) {
                attributes.binormal = new GeometryAttribute({
                    componentDatatype : ComponentDatatype.FLOAT,
                    componentsPerAttribute : 3,
                    values : binormals
                });
            }
        }

        index = 0;
        for (i = 0; i < stackPartitions; i++) {
            var topOffset = i * slicePartitions;
            var bottomOffset = (i + 1) * slicePartitions;

            for (j = 0; j < slicePartitions - 1; j++) {
                indices[index++] = bottomOffset + j;
                indices[index++] = bottomOffset + j + 1;
                indices[index++] = topOffset + j + 1;

                indices[index++] = bottomOffset + j;
                indices[index++] = topOffset + j + 1;
                indices[index++] = topOffset + j;
            }
        }

        return new Geometry({
            attributes : attributes,
            indices : indices,
            primitiveType : PrimitiveType.TRIANGLES,
            boundingSphere : BoundingSphere.fromEllipsoid(ellipsoid)
        });
    };

    return EllipsoidGeometry;
});