/*global define*/
define([
        './BoundingSphere',
        './Cartesian2',
        './Cartesian3',
        './Cartographic',
        './ComponentDatatype',
        './defaultValue',
        './defined',
        './DeveloperError',
        './EllipseGeometryLibrary',
        './Ellipsoid',
        './GeographicProjection',
        './Geometry',
        './GeometryAttribute',
        './GeometryAttributes',
        './GeometryInstance',
        './GeometryPipeline',
        './IndexDatatype',
        './Math',
        './Matrix3',
        './PrimitiveType',
        './Quaternion',
        './VertexFormat'
    ], function(
        BoundingSphere,
        Cartesian2,
        Cartesian3,
        Cartographic,
        ComponentDatatype,
        defaultValue,
        defined,
        DeveloperError,
        EllipseGeometryLibrary,
        Ellipsoid,
        GeographicProjection,
        Geometry,
        GeometryAttribute,
        GeometryAttributes,
        GeometryInstance,
        GeometryPipeline,
        IndexDatatype,
        CesiumMath,
        Matrix3,
        PrimitiveType,
        Quaternion,
        VertexFormat) {
    "use strict";

    var scratchCartesian1 = new Cartesian3();
    var scratchCartesian2 = new Cartesian3();
    var scratchCartesian3 = new Cartesian3();
    var scratchCartesian4 = new Cartesian3();
    var texCoordScratch = new Cartesian2();
    var textureMatrixScratch = new Matrix3();
    var quaternionScratch = new Quaternion();

    var scratchNormal = new Cartesian3();
    var scratchTangent = new Cartesian3();
    var scratchBinormal = new Cartesian3();

    var scratchCartographic = new Cartographic();
    var projectedCenterScratch = new Cartesian3();

    function computeTopBottomAttributes(positions, options, extrude) {
        var vertexFormat = options.vertexFormat;
        var center = options.center;
        var semiMajorAxis = options.semiMajorAxis;
        var ellipsoid = options.ellipsoid;
        var stRotation = options.stRotation;
        var size = (extrude) ? positions.length / 3 * 2 : positions.length / 3;

        var textureCoordinates = (vertexFormat.st) ? new Float32Array(size * 2) : undefined;
        var normals = (vertexFormat.normal) ? new Float32Array(size * 3) : undefined;
        var tangents = (vertexFormat.tangent) ? new Float32Array(size * 3) : undefined;
        var binormals = (vertexFormat.binormal) ? new Float32Array(size * 3) : undefined;

        var textureCoordIndex = 0;

        // Raise positions to a height above the ellipsoid and compute the
        // texture coordinates, normals, tangents, and binormals.
        var normal = scratchNormal;
        var tangent = scratchTangent;
        var binormal = scratchBinormal;

        var projection = new GeographicProjection(ellipsoid);
        var projectedCenter = projection.project(ellipsoid.cartesianToCartographic(center, scratchCartographic), projectedCenterScratch);

        var geodeticNormal = ellipsoid.scaleToGeodeticSurface(center, scratchCartesian1);
        ellipsoid.geodeticSurfaceNormal(geodeticNormal, geodeticNormal);
        var rotation = Quaternion.fromAxisAngle(geodeticNormal, stRotation, quaternionScratch);
        var textureMatrix = Matrix3.fromQuaternion(rotation, textureMatrixScratch);

        var length = positions.length;
        var bottomOffset = (extrude) ? length : 0;
        var stOffset = bottomOffset / 3 * 2;
        for ( var i = 0; i < length; i += 3) {
            var i1 = i + 1;
            var i2 = i + 2;
            var position = Cartesian3.fromArray(positions, i, scratchCartesian1);

            if (vertexFormat.st) {
                var rotatedPoint = Matrix3.multiplyByVector(textureMatrix, position, scratchCartesian2);
                var projectedPoint = projection.project(ellipsoid.cartesianToCartographic(rotatedPoint, scratchCartographic), scratchCartesian3);
                Cartesian3.subtract(projectedPoint, projectedCenter, projectedPoint);

                texCoordScratch.x = (projectedPoint.x + semiMajorAxis) / (2.0 * semiMajorAxis);
                texCoordScratch.y = (projectedPoint.y + semiMajorAxis) / (2.0 * semiMajorAxis);

                if (extrude) {
                    textureCoordinates[textureCoordIndex + stOffset] = texCoordScratch.x;
                    textureCoordinates[textureCoordIndex + 1 + stOffset] = texCoordScratch.y;
                }

                textureCoordinates[textureCoordIndex++] = texCoordScratch.x;
                textureCoordinates[textureCoordIndex++] = texCoordScratch.y;
            }

            normal = ellipsoid.geodeticSurfaceNormal(position, normal);

            if (vertexFormat.normal || vertexFormat.tangent || vertexFormat.binormal) {
                if (vertexFormat.tangent || vertexFormat.binormal) {
                    tangent = Cartesian3.cross(Cartesian3.UNIT_Z, normal, tangent);
                    Matrix3.multiplyByVector(textureMatrix, tangent, tangent);
                }
                if (vertexFormat.normal) {
                    normals[i] = normal.x;
                    normals[i1] = normal.y;
                    normals[i2] = normal.z;
                    if (extrude) {
                        normals[i + bottomOffset] = -normal.x;
                        normals[i1 + bottomOffset] = -normal.y;
                        normals[i2 + bottomOffset] = -normal.z;
                    }
                }

                if (vertexFormat.tangent) {
                    tangents[i] = tangent.x;
                    tangents[i1] = tangent.y;
                    tangents[i2] = tangent.z;
                    if (extrude) {
                        tangents[i + bottomOffset] = -tangent.x;
                        tangents[i1 + bottomOffset] = -tangent.y;
                        tangents[i2 + bottomOffset] = -tangent.z;
                    }
                }

                if (vertexFormat.binormal) {
                    binormal = Cartesian3.cross(normal, tangent, binormal);
                    binormals[i] = binormal.x;
                    binormals[i1] = binormal.y;
                    binormals[i2] = binormal.z;
                    if (extrude) {
                        binormals[i + bottomOffset] = binormal.x;
                        binormals[i1 + bottomOffset] = binormal.y;
                        binormals[i2 + bottomOffset] = binormal.z;
                    }
                }
            }
        }

        var attributes = new GeometryAttributes();

        if (vertexFormat.position) {
            var finalPositions = EllipseGeometryLibrary.raisePositionsToHeight(positions, options, extrude);
            attributes.position = new GeometryAttribute({
                componentDatatype : ComponentDatatype.DOUBLE,
                componentsPerAttribute : 3,
                values : finalPositions
            });
        }

        if (vertexFormat.st) {
            attributes.st = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 2,
                values : textureCoordinates
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
        return attributes;
    }


    function topIndices(numPts) {
        // The number of triangles in the ellipse on the positive x half-space and for
        // the column of triangles in the middle is:
        //
        // numTriangles = 4 + 8 + 12 + ... = 4 + (4 + 4) + (4 + 4 + 4) + ... = 4 * (1 + 2 + 3 + ...)
        //              = 4 * ((n * ( n + 1)) / 2)
        // numColumnTriangles = 2 * 2 * n
        // total = 2 * numTrangles + numcolumnTriangles
        //
        // Substitute (numPts - 1.0) for n above
        var indices = new Array(2 * numPts * (numPts + 1));
        var indicesIndex = 0;
        var prevIndex;
        var numInterior;
        var positionIndex;
        var i;
        var j;
        // Indices triangles to the 'left' of the north vector
        for (i = 1; i < numPts; ++i) {
            positionIndex = i * (i + 1);
            prevIndex = (i - 1) * i;

            indices[indicesIndex++] = positionIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;

            numInterior = 2 * i;
            for (j = 0; j < numInterior - 1; ++j) {

                indices[indicesIndex++] = positionIndex;
                indices[indicesIndex++] = prevIndex++;
                indices[indicesIndex++] = prevIndex;

                indices[indicesIndex++] = positionIndex++;
                indices[indicesIndex++] = prevIndex;
                indices[indicesIndex++] = positionIndex;
            }

            indices[indicesIndex++] = positionIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;
        }

        // Indices for central column of triangles
        numInterior = numPts * 2;
        ++positionIndex;
        ++prevIndex;
        for (i = 0; i < numInterior - 1; ++i) {
            indices[indicesIndex++] = positionIndex;
            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = prevIndex;

            indices[indicesIndex++] = positionIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;
        }

        // Reverse the process creating indices to the 'right' of the north vector
        ++prevIndex;
        ++positionIndex;
        for (i = numPts - 1; i > 0; --i) {
            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = prevIndex;
            indices[indicesIndex++] = positionIndex;

            numInterior = 2 * i;
            for (j = 0; j < numInterior - 1; ++j) {
                indices[indicesIndex++] = positionIndex;
                indices[indicesIndex++] = prevIndex++;
                indices[indicesIndex++] = prevIndex;

                indices[indicesIndex++] = positionIndex++;
                indices[indicesIndex++] = prevIndex;
                indices[indicesIndex++] = positionIndex;
            }

            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = prevIndex++;
            indices[indicesIndex++] = positionIndex++;
        }
        return indices;
    }

    var boundingSphereCenter = new Cartesian3();
    function computeEllipse(options) {
        var center = options.center;
        boundingSphereCenter = Cartesian3.multiplyByScalar(options.ellipsoid.geodeticSurfaceNormal(center, boundingSphereCenter), options.height, boundingSphereCenter);
        boundingSphereCenter = Cartesian3.add(center, boundingSphereCenter, boundingSphereCenter);
        var boundingSphere = new BoundingSphere(boundingSphereCenter, options.semiMajorAxis);
        var cep = EllipseGeometryLibrary.computeEllipsePositions(options, true, false);
        var positions = cep.positions;
        var numPts = cep.numPts;
        var attributes = computeTopBottomAttributes(positions, options, false);
        var indices = topIndices(numPts);
        indices = IndexDatatype.createTypedArray(positions.length / 3, indices);
        return {
            boundingSphere : boundingSphere,
            attributes : attributes,
            indices : indices
        };
    }

    function computeWallAttributes(positions, options) {
        var vertexFormat = options.vertexFormat;
        var center = options.center;
        var semiMajorAxis = options.semiMajorAxis;
        var ellipsoid = options.ellipsoid;
        var height = options.height;
        var extrudedHeight = options.extrudedHeight;
        var stRotation = options.stRotation;
        var size = positions.length / 3 * 2;

        var finalPositions = new Float64Array(size * 3);
        var textureCoordinates = (vertexFormat.st) ? new Float32Array(size * 2) : undefined;
        var normals = (vertexFormat.normal) ? new Float32Array(size * 3) : undefined;
        var tangents = (vertexFormat.tangent) ? new Float32Array(size * 3) : undefined;
        var binormals = (vertexFormat.binormal) ? new Float32Array(size * 3) : undefined;

        var textureCoordIndex = 0;

        // Raise positions to a height above the ellipsoid and compute the
        // texture coordinates, normals, tangents, and binormals.
        var normal = scratchNormal;
        var tangent = scratchTangent;
        var binormal = scratchBinormal;

        var projection = new GeographicProjection(ellipsoid);
        var projectedCenter = projection.project(ellipsoid.cartesianToCartographic(center, scratchCartographic), projectedCenterScratch);

        var geodeticNormal = ellipsoid.scaleToGeodeticSurface(center, scratchCartesian1);
        ellipsoid.geodeticSurfaceNormal(geodeticNormal, geodeticNormal);
        var rotation = Quaternion.fromAxisAngle(geodeticNormal, stRotation, quaternionScratch);
        var textureMatrix = Matrix3.fromQuaternion(rotation, textureMatrixScratch);

        var length = positions.length;
        var stOffset = length / 3 * 2;
        for ( var i = 0; i < length; i += 3) {
            var i1 = i + 1;
            var i2 = i + 2;
            var position = Cartesian3.fromArray(positions, i, scratchCartesian1);
            var extrudedPosition;

            if (vertexFormat.st) {
                var rotatedPoint = Matrix3.multiplyByVector(textureMatrix, position, scratchCartesian2);
                var projectedPoint = projection.project(ellipsoid.cartesianToCartographic(rotatedPoint, scratchCartographic), scratchCartesian3);
                Cartesian3.subtract(projectedPoint, projectedCenter, projectedPoint);

                texCoordScratch.x = (projectedPoint.x + semiMajorAxis) / (2.0 * semiMajorAxis);
                texCoordScratch.y = (projectedPoint.y + semiMajorAxis) / (2.0 * semiMajorAxis);

                textureCoordinates[textureCoordIndex + stOffset] = texCoordScratch.x;
                textureCoordinates[textureCoordIndex + 1 + stOffset] = texCoordScratch.y;

                textureCoordinates[textureCoordIndex++] = texCoordScratch.x;
                textureCoordinates[textureCoordIndex++] = texCoordScratch.y;
            }

            position = ellipsoid.scaleToGeodeticSurface(position, position);
            extrudedPosition = Cartesian3.clone(position, scratchCartesian2);
            normal = ellipsoid.geodeticSurfaceNormal(position, normal);
            var scaledNormal = Cartesian3.multiplyByScalar(normal, height, scratchCartesian4);
            position = Cartesian3.add(position, scaledNormal, position);
            scaledNormal = Cartesian3.multiplyByScalar(normal, extrudedHeight, scaledNormal);
            extrudedPosition = Cartesian3.add(extrudedPosition, scaledNormal, extrudedPosition);

            if (vertexFormat.position) {
                finalPositions[i + length] = extrudedPosition.x;
                finalPositions[i1 + length] = extrudedPosition.y;
                finalPositions[i2 + length] = extrudedPosition.z;

                finalPositions[i] = position.x;
                finalPositions[i1] = position.y;
                finalPositions[i2] = position.z;
            }

            if (vertexFormat.normal || vertexFormat.tangent || vertexFormat.binormal) {

                binormal = Cartesian3.clone(normal, binormal);
                var next = Cartesian3.fromArray(positions, (i + 3) % length, scratchCartesian4);
                Cartesian3.subtract(next, position, next);
                var bottom = Cartesian3.subtract(extrudedPosition, position, scratchCartesian3);

                normal = Cartesian3.normalize(Cartesian3.cross(bottom, next, normal), normal);

                if (vertexFormat.normal) {
                    normals[i] = normal.x;
                    normals[i1] = normal.y;
                    normals[i2] = normal.z;

                    normals[i + length] = normal.x;
                    normals[i1 + length] = normal.y;
                    normals[i2 + length] = normal.z;
                }

                if (vertexFormat.tangent) {
                    tangent = Cartesian3.normalize(Cartesian3.cross(binormal, normal, tangent), tangent);
                    tangents[i] = tangent.x;
                    tangents[i1] = tangent.y;
                    tangents[i2] = tangent.z;

                    tangents[i + length] = tangent.x;
                    tangents[i + 1 + length] = tangent.y;
                    tangents[i + 2 + length] = tangent.z;
                }

                if (vertexFormat.binormal) {
                    binormals[i] = binormal.x;
                    binormals[i1] = binormal.y;
                    binormals[i2] = binormal.z;

                    binormals[i + length] = binormal.x;
                    binormals[i1 + length] = binormal.y;
                    binormals[i2 + length] = binormal.z;
                }
            }
        }

        var attributes = new GeometryAttributes();

        if (vertexFormat.position) {
            attributes.position = new GeometryAttribute({
                componentDatatype : ComponentDatatype.DOUBLE,
                componentsPerAttribute : 3,
                values : finalPositions
            });
        }

        if (vertexFormat.st) {
            attributes.st = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 2,
                values : textureCoordinates
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
        return attributes;
    }

    function computeWallIndices(positions) {
        var UL;
        var UR;
        var LL;
        var LR;
        var length = positions.length / 3;
        var indices = IndexDatatype.createTypedArray(length, length * 6);
        var index = 0;
        for ( var i = 0; i < length - 1; i++) {
            UL = i;
            LL = i + length;
            UR = UL + 1;
            LR = UR + length;
            indices[index++] = UL;
            indices[index++] = LL;
            indices[index++] = UR;
            indices[index++] = UR;
            indices[index++] = LL;
            indices[index++] = LR;
        }

        UL = length - 1;
        LL = i + length;
        UR = 0;
        LR = UR + length;
        indices[index++] = UL;
        indices[index++] = LL;
        indices[index++] = UR;
        indices[index++] = UR;
        indices[index++] = LL;
        indices[index++] = LR;

        return indices;
    }

    var topBoundingSphere = new BoundingSphere();
    var bottomBoundingSphere = new BoundingSphere();
    function computeExtrudedEllipse(options) {
        var center = options.center;
        var ellipsoid = options.ellipsoid;
        var semiMajorAxis = options.semiMajorAxis;
        var scaledNormal = Cartesian3.multiplyByScalar(ellipsoid.geodeticSurfaceNormal(center, scratchCartesian1), options.height, scratchCartesian1);
        topBoundingSphere.center = Cartesian3.add(center, scaledNormal, topBoundingSphere.center);
        topBoundingSphere.radius = semiMajorAxis;

        scaledNormal = Cartesian3.multiplyByScalar(ellipsoid.geodeticSurfaceNormal(center, scaledNormal), options.extrudedHeight, scaledNormal);
        bottomBoundingSphere.center = Cartesian3.add(center, scaledNormal, bottomBoundingSphere.center);
        bottomBoundingSphere.radius = semiMajorAxis;

        var cep = EllipseGeometryLibrary.computeEllipsePositions(options, true, true);
        var positions = cep.positions;
        var numPts = cep.numPts;
        var outerPositions = cep.outerPositions;
        var boundingSphere = BoundingSphere.union(topBoundingSphere, bottomBoundingSphere);
        var topBottomAttributes = computeTopBottomAttributes(positions, options, true);
        var indices = topIndices(numPts);
        var length = indices.length;
        indices.length = length * 2;
        var posLength = positions.length / 3;
        for ( var i = 0; i < length; i += 3) {
            indices[i + length] = indices[i + 2] + posLength;
            indices[i + 1 + length] = indices[i + 1] + posLength;
            indices[i + 2 + length] = indices[i] + posLength;
        }

        var topBottomIndices = IndexDatatype.createTypedArray(posLength * 2 / 3, indices);

        var topBottomGeo = new Geometry({
            attributes : topBottomAttributes,
            indices : topBottomIndices,
            primitiveType : PrimitiveType.TRIANGLES
        });

        var wallAttributes = computeWallAttributes(outerPositions, options);
        indices = computeWallIndices(outerPositions);
        var wallIndices = IndexDatatype.createTypedArray(outerPositions.length * 2 / 3, indices);

        var wallGeo = new Geometry({
            attributes : wallAttributes,
            indices : wallIndices,
            primitiveType : PrimitiveType.TRIANGLES
        });

        var geo = GeometryPipeline.combine([
            new GeometryInstance({
                geometry : topBottomGeo
            }),
            new GeometryInstance({
                geometry : wallGeo
            })
        ]);

        return {
            boundingSphere : boundingSphere,
            attributes : geo.attributes,
            indices : geo.indices
        };
    }

    /**
     * A description of an ellipse on an ellipsoid.
     *
     * @alias EllipseGeometry
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Cartesian3} options.center The ellipse's center point in the fixed frame.
     * @param {Number} options.semiMajorAxis The length of the ellipse's semi-major axis in meters.
     * @param {Number} options.semiMinorAxis The length of the ellipse's semi-minor axis in meters.
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid the ellipse will be on.
     * @param {Number} [options.height=0.0] The height above the ellipsoid.
     * @param {Number} [options.extrudedHeight] The height of the extrusion.
     * @param {Number} [options.rotation=0.0] The angle from north (clockwise) in radians. The default is zero.
     * @param {Number} [options.stRotation=0.0] The rotation of the texture coordinates, in radians. A positive rotation is counter-clockwise.
     * @param {Number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] The angular distance between points on the ellipse in radians.
     * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
     *
     * @exception {DeveloperError} semiMajorAxis and semiMinorAxis must be greater than zero.
     * @exception {DeveloperError} semiMajorAxis must be larger than the semiMinorAxis.
     * @exception {DeveloperError} granularity must be greater than zero.
     *
     * @see EllipseGeometry.createGeometry
     *
     * @demo {@link http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Ellipse.html|Cesium Sandcastle Ellipse Demo}
     *
     * @example
     * // Create an ellipse.
     * var ellipse = new Cesium.EllipseGeometry({
     *   center : Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883),
     *   semiMajorAxis : 500000.0,
     *   semiMinorAxis : 300000.0,
     *   rotation : Cesium.Math.toRadians(60.0)
     * });
     * var geometry = Cesium.EllipseGeometry.createGeometry(ellipse);
     */
    var EllipseGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var center = options.center;
        var semiMajorAxis = options.semiMajorAxis;
        var semiMinorAxis = options.semiMinorAxis;
        var granularity = defaultValue(options.granularity, CesiumMath.RADIANS_PER_DEGREE);
        var height = defaultValue(options.height, 0.0);
        var extrudedHeight = options.extrudedHeight;
        var extrude = (defined(extrudedHeight) && !CesiumMath.equalsEpsilon(height, extrudedHeight, 1.0));

        //>>includeStart('debug', pragmas.debug);
        if (!defined(center)) {
            throw new DeveloperError('center is required.');
        }
        if (!defined(semiMajorAxis)) {
            throw new DeveloperError('semiMajorAxis is required.');
        }
        if (!defined(semiMinorAxis)) {
            throw new DeveloperError('semiMinorAxis is required.');
        }
        if (semiMajorAxis <= 0.0 || semiMinorAxis <= 0.0) {
            throw new DeveloperError('Semi-major and semi-minor axes must be greater than zero.');
        }
        if (semiMajorAxis < semiMinorAxis) {
            throw new DeveloperError('semiMajorAxis must be larger than the semiMinorAxis.');
        }
        if (granularity <= 0.0) {
            throw new DeveloperError('granularity must be greater than zero.');
        }
        //>>includeEnd('debug');

        this._center = Cartesian3.clone(center);
        this._semiMajorAxis = semiMajorAxis;
        this._semiMinorAxis = semiMinorAxis;
        this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this._rotation = defaultValue(options.rotation, 0.0);
        this._stRotation = defaultValue(options.stRotation, 0.0);
        this._height = height;
        this._granularity = granularity;
        this._vertexFormat = defaultValue(options.vertexFormat, VertexFormat.DEFAULT);
        this._extrudedHeight = extrudedHeight;
        this._extrude = extrude;
        this._workerName = 'createEllipseGeometry';
    };

    /**
     * Computes the geometric representation of a ellipse on an ellipsoid, including its vertices, indices, and a bounding sphere.
     *
     * @param {EllipseGeometry} ellipseGeometry A description of the ellipse.
     * @returns {Geometry} The computed vertices and indices.
     */
    EllipseGeometry.createGeometry = function(ellipseGeometry) {
        var options = {
            center : ellipseGeometry._center,
            semiMajorAxis : ellipseGeometry._semiMajorAxis,
            semiMinorAxis : ellipseGeometry._semiMinorAxis,
            ellipsoid : ellipseGeometry._ellipsoid,
            rotation : ellipseGeometry._rotation,
            height : ellipseGeometry._height,
            extrudedHeight : ellipseGeometry._extrudedHeight,
            granularity : ellipseGeometry._granularity,
            vertexFormat : ellipseGeometry._vertexFormat,
            stRotation : ellipseGeometry._stRotation
        };
        var geometry;
        if (ellipseGeometry._extrude) {
            options.extrudedHeight = Math.min(ellipseGeometry._extrudedHeight, ellipseGeometry._height);
            options.height = Math.max(ellipseGeometry._extrudedHeight, ellipseGeometry._height);
            geometry = computeExtrudedEllipse(options);
        } else {
            geometry = computeEllipse(options);
        }

        return new Geometry({
            attributes : geometry.attributes,
            indices : geometry.indices,
            primitiveType : PrimitiveType.TRIANGLES,
            boundingSphere : geometry.boundingSphere
        });
    };

    return EllipseGeometry;
});
