/*global define*/
define([
        './defaultValue',
        './defined',
        './BoundingSphere',
        './Cartesian3',
        './ComponentDatatype',
        './DeveloperError',
        './Ellipsoid',
        './EllipsoidTangentPlane',
        './Geometry',
        './GeometryAttribute',
        './GeometryAttributes',
        './GeometryInstance',
        './GeometryPipeline',
        './IndexDatatype',
        './Math',
        './PolygonGeometryLibrary',
        './PolygonPipeline',
        './PrimitiveType',
        './Queue',
        './WindingOrder'
    ], function(
        defaultValue,
        defined,
        BoundingSphere,
        Cartesian3,
        ComponentDatatype,
        DeveloperError,
        Ellipsoid,
        EllipsoidTangentPlane,
        Geometry,
        GeometryAttribute,
        GeometryAttributes,
        GeometryInstance,
        GeometryPipeline,
        IndexDatatype,
        CesiumMath,
        PolygonGeometryLibrary,
        PolygonPipeline,
        PrimitiveType,
        Queue,
        WindingOrder) {
    "use strict";
    var createGeometryFromPositionsPositions = [];

    function createGeometryFromPositions(ellipsoid, positions, granularity, perPositionHeight) {
        var cleanedPositions = PolygonPipeline.removeDuplicates(positions);
        if (cleanedPositions.length < 3) {
            throw new DeveloperError('Duplicate positions result in not enough positions to form a polygon.');
        }

        var tangentPlane = EllipsoidTangentPlane.fromPoints(cleanedPositions, ellipsoid);
        var positions2D = tangentPlane.projectPointsOntoPlane(cleanedPositions, createGeometryFromPositionsPositions);

        var originalWindingOrder = PolygonPipeline.computeWindingOrder2D(positions2D);
        if (originalWindingOrder === WindingOrder.CLOCKWISE) {
            positions2D.reverse();
            cleanedPositions.reverse();
        }

        var subdividedPositions = [];
        var length = cleanedPositions.length;
        var i;
        if (!perPositionHeight) {
            for (i = 0; i < length; i++) {
                subdividedPositions = subdividedPositions.concat(PolygonGeometryLibrary.subdivideLine(cleanedPositions[i], cleanedPositions[(i + 1) % length], granularity));
            }
        } else {
            for (i = 0; i < length; i++) {
                var p0 = cleanedPositions[i];
                var p1 = cleanedPositions[(i + 1) % length];
                subdividedPositions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
            }
        }

        length = subdividedPositions.length / 3;
        var indicesSize = length * 2;
        var indices = IndexDatatype.createTypedArray(subdividedPositions.length / 3, indicesSize);
        var index = 0;
        for (i = 0; i < length - 1; i++) {
            indices[index++] = i;
            indices[index++] = i + 1;
        }
        indices[index++] = length - 1;
        indices[index++] = 0;

        return new GeometryInstance({
            geometry : new Geometry({
                attributes : new GeometryAttributes({
                    position : new GeometryAttribute({
                        componentDatatype : ComponentDatatype.DOUBLE,
                        componentsPerAttribute : 3,
                        values : new Float64Array(subdividedPositions)
                    })
                }),
                indices : indices,
                primitiveType : PrimitiveType.LINES
            })
        });
    }

    var scratchPosition = new Cartesian3();
    var scratchNormal = new Cartesian3();
    var scratchBoundingSphere = new BoundingSphere();

    function createGeometryFromPositionsExtruded(ellipsoid, positions, granularity, perPositionHeight) {
        var cleanedPositions = PolygonPipeline.removeDuplicates(positions);
        if (cleanedPositions.length < 3) {
            throw new DeveloperError('Duplicate positions result in not enough positions to form a polygon.');
        }

        var tangentPlane = EllipsoidTangentPlane.fromPoints(cleanedPositions, ellipsoid);
        var positions2D = tangentPlane.projectPointsOntoPlane(cleanedPositions, createGeometryFromPositionsPositions);

        var originalWindingOrder = PolygonPipeline.computeWindingOrder2D(positions2D);
        if (originalWindingOrder === WindingOrder.CLOCKWISE) {
            positions2D.reverse();
            cleanedPositions.reverse();
        }
        var subdividedPositions = [];
        var length = cleanedPositions.length;
        var i;
        var corners = new Array(length);
        corners[0] = 0;
        if (!perPositionHeight) {
            for (i = 0; i < length - 1; i++) {
                subdividedPositions = subdividedPositions.concat(PolygonGeometryLibrary.subdivideLine(cleanedPositions[i], cleanedPositions[i + 1], granularity));
                corners[i + 1] = subdividedPositions.length / 3;
            }
            subdividedPositions = subdividedPositions.concat(PolygonGeometryLibrary.subdivideLine(cleanedPositions[length - 1], cleanedPositions[0], granularity));
        } else {
            var p0;
            var p1;
            for (i = 0; i < length - 1; i++) {
                p0 = cleanedPositions[i];
                p1 = cleanedPositions[(i + 1) % length];
                subdividedPositions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
                corners[i + 1] = subdividedPositions.length / 3;
            }
            p0 = cleanedPositions[length - 1];
            p1 = cleanedPositions[0];
            subdividedPositions.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
        }

        length = subdividedPositions.length / 3;
        var indicesSize = ((length * 2) + corners.length) * 2;
        var indices = IndexDatatype.createTypedArray(subdividedPositions.length / 3, indicesSize);
        var index = 0;
        for (i = 0; i < length - 1; i++) {
            indices[index++] = i;
            indices[index++] = i + 1;
            indices[index++] = i + length;
            indices[index++] = i + 1 + length;
        }
        indices[index++] = length - 1;
        indices[index++] = 0;
        indices[index++] = length + length - 1;
        indices[index++] = length;

        for (i = 0; i < corners.length; i++) {
            var corner = corners[i];
            indices[index++] = corner;
            indices[index++] = corner + length;
        }

        subdividedPositions = subdividedPositions.concat(subdividedPositions);

        return new GeometryInstance({
            geometry : new Geometry({
                attributes : new GeometryAttributes({
                    position : new GeometryAttribute({
                        componentDatatype : ComponentDatatype.DOUBLE,
                        componentsPerAttribute : 3,
                        values : new Float64Array(subdividedPositions)
                    })
                }),
                indices : indices,
                primitiveType : PrimitiveType.LINES
            })
        });
    }

    /**
     * A description of the outline of a polygon on the ellipsoid. The polygon is defined by a polygon hierarchy.
     *
     * @alias PolygonOutlineGeometry
     * @constructor
     *
     * @param {Object} options.polygonHierarchy A polygon hierarchy that can include holes.
     * @param {Number} [options.height=0.0] The height of the polygon.
     * @param {Number} [options.extrudedHeight] The height of the polygon.
     * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid to be used as a reference.
     * @param {Number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] The distance, in radians, between each latitude and longitude. Determines the number of positions in the buffer.
     * @param {Boolean} [options.perPositionHeight=false] Use the height of options.positions for each position instead of using options.height to determine the height.
     *
     * @exception {DeveloperError} polygonHierarchy is required.
     *
     * @see PolygonOutlineGeometry#createGeometry
     * @see PolygonOutlineGeometry#fromPositions
     *
     * @example
     * // 1. create a polygon outline from points
     * var polygon = new PolygonOutlineGeometry({
     *     polygonHierarchy : {
     *         positions : ellipsoid.cartographicArrayToCartesianArray([
     *             Cartographic.fromDegrees(-72.0, 40.0),
     *             Cartographic.fromDegrees(-70.0, 35.0),
     *             Cartographic.fromDegrees(-75.0, 30.0),
     *             Cartographic.fromDegrees(-70.0, 30.0),
     *             Cartographic.fromDegrees(-68.0, 40.0)
     *         ])
     *     }
     * });
     * var geometry = PolygonOutlineGeometry.createGeometry(polygon);
     *
     * // 2. create a nested polygon with holes outline
     * var polygonWithHole = new PolygonOutlineGeometry({
     *     polygonHierarchy : {
     *         positions : ellipsoid.cartographicArrayToCartesianArray([
     *             Cartographic.fromDegrees(-109.0, 30.0),
     *             Cartographic.fromDegrees(-95.0, 30.0),
     *             Cartographic.fromDegrees(-95.0, 40.0),
     *             Cartographic.fromDegrees(-109.0, 40.0)
     *         ]),
     *         holes : [{
     *             positions : ellipsoid.cartographicArrayToCartesianArray([
     *                 Cartographic.fromDegrees(-107.0, 31.0),
     *                 Cartographic.fromDegrees(-107.0, 39.0),
     *                 Cartographic.fromDegrees(-97.0, 39.0),
     *                 Cartographic.fromDegrees(-97.0, 31.0)
     *             ]),
     *             holes : [{
     *                 positions : ellipsoid.cartographicArrayToCartesianArray([
     *                     Cartographic.fromDegrees(-105.0, 33.0),
     *                     Cartographic.fromDegrees(-99.0, 33.0),
     *                     Cartographic.fromDegrees(-99.0, 37.0),
     *                     Cartographic.fromDegrees(-105.0, 37.0)
     *                     ]),
     *                 holes : [{
     *                     positions : ellipsoid.cartographicArrayToCartesianArray([
     *                         Cartographic.fromDegrees(-103.0, 34.0),
     *                         Cartographic.fromDegrees(-101.0, 34.0),
     *                         Cartographic.fromDegrees(-101.0, 36.0),
     *                         Cartographic.fromDegrees(-103.0, 36.0)
     *                     ])
     *                 }]
     *              }]
     *         }]
     *     }
     * });
     * var geometry = PolygonOutlineGeometry.createGeometry(polygonWithHole);
     *
     * // 3. create extruded polygon outline
     * var extrudedPolygon = new PolygonOutlineGeometry({
     *     positions : ellipsoid.cartographicArrayToCartesianArray([
     *         Cesium.Cartographic.fromDegrees(-72.0, 40.0),
     *         Cesium.Cartographic.fromDegrees(-70.0, 35.0),
     *         Cesium.Cartographic.fromDegrees(-75.0, 30.0),
     *         Cesium.Cartographic.fromDegrees(-70.0, 30.0),
     *         Cesium.Cartographic.fromDegrees(-68.0, 40.0)
     *     ]),
     *     extrudedHeight: 300000
     * });
     * var geometry = PolygonOutlineGeometry.createGeometry(extrudedPolygon);
     *
     */
    var PolygonOutlineGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        var granularity = defaultValue(options.granularity, CesiumMath.RADIANS_PER_DEGREE);
        var height = defaultValue(options.height, 0.0);
        var perPositionHeight = defaultValue(options.perPositionHeight, false);

        var extrudedHeight = options.extrudedHeight;
        var extrude = (defined(extrudedHeight) && (!CesiumMath.equalsEpsilon(height, extrudedHeight, CesiumMath.EPSILON6) || perPositionHeight));
        if (extrude) {
            var h = extrudedHeight;
            extrudedHeight = Math.min(h, height);
            height = Math.max(h, height);
        }

        var polygonHierarchy = options.polygonHierarchy;
        if (!defined(polygonHierarchy)) {
            throw new DeveloperError('options.polygonHierarchy is required.');
        }

        this._ellipsoid = ellipsoid;
        this._granularity = granularity;
        this._height = height;
        this._extrudedHeight = extrudedHeight;
        this._extrude = extrude;
        this._polygonHierarchy = polygonHierarchy;
        this._perPositionHeight = perPositionHeight;
        this._workerName = 'createPolygonOutlineGeometry';
    };

    /**
     * A description of a polygon outline from an array of positions.
     *
     * @memberof PolygonOutlineGeometry
     *
     * @param {Array} options.positions An array of positions that defined the corner points of the polygon.
     * @param {Number} [options.height=0.0] The height of the polygon.
     * @param {Number} [options.extrudedHeight] The height of the polygon extrusion.
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid to be used as a reference.
     * @param {Number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] The distance, in radians, between each latitude and longitude. Determines the number of positions in the buffer.
     * @param {Boolean} [options.perPositionHeight=false] Use the height of options.positions for each position instead of using options.height to determine the height.
     *
     * @exception {DeveloperError} options.positions is required.
     *
     * @see PolygonGeometry#createGeometry
     *
     * @example
     * // create a polygon from points
     * var polygon = PolygonOutlineGeometry.fromPositions({
     *     positions : ellipsoid.cartographicArrayToCartesianArray([
     *         Cartographic.fromDegrees(-72.0, 40.0),
     *         Cartographic.fromDegrees(-70.0, 35.0),
     *         Cartographic.fromDegrees(-75.0, 30.0),
     *         Cartographic.fromDegrees(-70.0, 30.0),
     *         Cartographic.fromDegrees(-68.0, 40.0)
     *     ])
     * });
     * var geometry = PolygonOutlineGeometry.createGeometry(polygon);
     */
    PolygonOutlineGeometry.fromPositions = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        if (!defined(options.positions)) {
            throw new DeveloperError('options.positions is required.');
        }

        var newOptions = {
            polygonHierarchy : {
                positions : options.positions
            },
            height : options.height,
            extrudedHeight : options.extrudedHeight,
            ellipsoid : options.ellipsoid,
            granularity : options.granularity,
            perPositionHeight : options.perPositionHeight
        };
        return new PolygonOutlineGeometry(newOptions);
    };

    /**
     * Computes the geometric representation of a polygon outline, including its vertices, indices, and a bounding sphere.
     * @memberof PolygonOutlineGeometry
     *
     * @param {PolygonOutlineGeometry} polygonGeometry A description of the polygon outline.
     * @returns {Geometry} The computed vertices and indices.
     *
     * @exception {DeveloperError} At least three positions are required.
     * @exception {DeveloperError} Duplicate positions result in not enough positions to form a polygon.
     */
    PolygonOutlineGeometry.createGeometry = function(polygonGeometry) {
        var ellipsoid = polygonGeometry._ellipsoid;
        var granularity = polygonGeometry._granularity;
        var height = polygonGeometry._height;
        var extrudedHeight = polygonGeometry._extrudedHeight;
        var extrude = polygonGeometry._extrude;
        var polygonHierarchy = polygonGeometry._polygonHierarchy;
        var perPositionHeight = polygonGeometry._perPositionHeight;

        var boundingSphere;
        var outerPositions;

        // create from a polygon hierarchy
        // Algorithm adapted from http://www.geometrictools.com/Documentation/TriangulationByEarClipping.pdf
        var polygons = [];
        var queue = new Queue();
        queue.enqueue(polygonHierarchy);
        var i;
        while (queue.length !== 0) {
            var outerNode = queue.dequeue();
            var outerRing = outerNode.positions;

            if (outerRing.length < 3) {
                throw new DeveloperError('At least three positions are required.');
            }

            var numChildren = outerNode.holes ? outerNode.holes.length : 0;
            // The outer polygon contains inner polygons
            for (i = 0; i < numChildren; i++) {
                var hole = outerNode.holes[i];
                polygons.push(hole.positions);

                var numGrandchildren = 0;
                if (defined(hole.holes)) {
                    numGrandchildren = hole.holes.length;
                }

                for ( var j = 0; j < numGrandchildren; j++) {
                    queue.enqueue(hole.holes[j]);
                }
            }

            polygons.push(outerRing);
        }

        outerPositions = polygons[0];
        // The bounding volume is just around the boundary points, so there could be cases for
        // contrived polygons on contrived ellipsoids - very oblate ones - where the bounding
        // volume doesn't cover the polygon.
        boundingSphere = BoundingSphere.fromPoints(outerPositions);

        var geometry;
        var geometries = [];

        if (extrude) {
            for (i = 0; i < polygons.length; i++) {
                geometry = createGeometryFromPositionsExtruded(ellipsoid, polygons[i], granularity, perPositionHeight);
                if (defined(geometry)) {
                    geometry.geometry = PolygonGeometryLibrary.scaleToGeodeticHeightExtruded(geometry.geometry, height, extrudedHeight, ellipsoid, perPositionHeight);
                    geometries.push(geometry);
                }
            }
        } else {
            for (i = 0; i < polygons.length; i++) {
                geometry = createGeometryFromPositions(ellipsoid, polygons[i], granularity, perPositionHeight);
                if (defined(geometry)) {
                    geometry.geometry = PolygonPipeline.scaleToGeodeticHeight(geometry.geometry, height, ellipsoid, !perPositionHeight);
                    geometries.push(geometry);
                }
            }
        }

        geometry = GeometryPipeline.combine(geometries);

        var center = boundingSphere.center;
        scratchNormal = ellipsoid.geodeticSurfaceNormal(center, scratchNormal);
        scratchPosition = Cartesian3.multiplyByScalar(scratchNormal, height, scratchPosition);
        center = Cartesian3.add(center, scratchPosition, center);

        if (extrude) {
            scratchBoundingSphere = BoundingSphere.clone(boundingSphere, scratchBoundingSphere);
            center = scratchBoundingSphere.center;
            scratchPosition = Cartesian3.multiplyByScalar(scratchNormal, extrudedHeight, scratchPosition);
            center = Cartesian3.add(center, scratchPosition, center);
            boundingSphere = BoundingSphere.union(boundingSphere, scratchBoundingSphere, boundingSphere);
        }

        return new Geometry({
            attributes : geometry.attributes,
            indices : geometry.indices,
            primitiveType : geometry.primitiveType,
            boundingSphere : boundingSphere
        });
    };

    return PolygonOutlineGeometry;
});
