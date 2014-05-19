/*global define*/
define([
        './defined',
        './DeveloperError',
        './Cartesian3',
        './CornerType',
        './ComponentDatatype',
        './Ellipsoid',
        './Geometry',
        './GeometryPipeline',
        './IndexDatatype',
        './Math',
        './PolygonPipeline',
        './PolylineVolumeGeometryLibrary',
        './PrimitiveType',
        './defaultValue',
        './BoundingSphere',
        './BoundingRectangle',
        './GeometryAttribute',
        './GeometryAttributes',
        './WindingOrder'
    ], function(
        defined,
        DeveloperError,
        Cartesian3,
        CornerType,
        ComponentDatatype,
        Ellipsoid,
        Geometry,
        GeometryPipeline,
        IndexDatatype,
        CesiumMath,
        PolygonPipeline,
        PolylineVolumeGeometryLibrary,
        PrimitiveType,
        defaultValue,
        BoundingSphere,
        BoundingRectangle,
        GeometryAttribute,
        GeometryAttributes,
        WindingOrder) {
    "use strict";

    function computeAttributes(positions, shape, boundingRectangle, ellipsoid) {
        var attributes = new GeometryAttributes();
        attributes.position = new GeometryAttribute({
            componentDatatype : ComponentDatatype.DOUBLE,
            componentsPerAttribute : 3,
            values : positions
        });

        var shapeLength = shape.length;
        var vertexCount = attributes.position.values.length / 3;
        var positionLength = positions.length / 3;
        var shapeCount = positionLength / shapeLength;
        var indices = IndexDatatype.createTypedArray(vertexCount, 2 * shapeLength * (shapeCount + 1));
        var i, j;
        var index = 0;
        i = 0;
        var offset = i * shapeLength;
        for (j = 0; j < shapeLength - 1; j++) {
            indices[index++] = j + offset;
            indices[index++] = j + offset + 1;
        }
        indices[index++] = shapeLength - 1 + offset;
        indices[index++] = offset;

        i = shapeCount - 1;
        offset = i * shapeLength;
        for (j = 0; j < shapeLength - 1; j++) {
            indices[index++] = j + offset;
            indices[index++] = j + offset + 1;
        }
        indices[index++] = shapeLength - 1 + offset;
        indices[index++] = offset;

        for (i = 0; i < shapeCount - 1; i++) {
            var firstOffset = shapeLength * i;
            var secondOffset = firstOffset + shapeLength;
            for (j = 0; j < shapeLength; j++) {
                indices[index++] = j + firstOffset;
                indices[index++] = j + secondOffset;
            }
        }

        var geometry = new Geometry({
            attributes : attributes,
            indices : IndexDatatype.createTypedArray(vertexCount, indices),
            boundingSphere : BoundingSphere.fromVertices(positions),
            primitiveType : PrimitiveType.LINES
        });

        return geometry;
    }

    /**
     * A description of a polyline with a volume (a 2D shape extruded along a polyline).
     *
     * @alias PolylineVolumeOutlineGeometry
     * @constructor
     *
     * @param {Array} options.polylinePositions An array of {Cartesain3} positions that define the center of the polyline volume.
     * @param {Number} options.shapePositions An array of {Cartesian2} positions that define the shape to be extruded along the polyline
     * @param {Ellipsoid} [options.ellipsoid=Ellipsoid.WGS84] The ellipsoid to be used as a reference.
     * @param {Number} [options.granularity=CesiumMath.RADIANS_PER_DEGREE] The distance, in radians, between each latitude and longitude. Determines the number of positions in the buffer.
     * @param {Boolean} [options.cornerType = CornerType.ROUNDED] Determines the style of the corners.
     *
     * @exception {DeveloperError} options.polylinePositions is required.
     * @exception {DeveloperError} options.shapePositions is required.
     *
     * @see PolylineVolumeOutlineGeometry#createGeometry
     *
     * @example
     * var volumeOutline = new PolylineVolumeOutlineGeometry({
     *     polylinePositions : ellipsoid.cartographicArrayToCartesianArray([
     *         Cartographic.fromDegrees(-72.0, 40.0),
     *         Cartographic.fromDegrees(-70.0, 35.0)
     *     ]),
     *     shapePositions : Shapes.compute2DCircle(100000.0)
     * });
     */
    var PolylineVolumeOutlineGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);
        var positions = options.polylinePositions;
        if (!defined(positions)) {
            throw new DeveloperError('options.polylinePositions is required.');
        }
        var shape = options.shapePositions;
        if (!defined(shape)) {
            throw new DeveloperError('options.shapePositions is required.');
        }

        this._positions = positions;
        this._shape = shape;
        this._ellipsoid = defaultValue(options.ellipsoid, Ellipsoid.WGS84);
        this._cornerType = defaultValue(options.cornerType, CornerType.ROUNDED);
        this._granularity = defaultValue(options.granularity, CesiumMath.RADIANS_PER_DEGREE);
        this._workerName = 'createPolylineVolumeOutlineGeometry';
    };

    /**
     * Computes the geometric representation of the outline of a polyline with a volume, including its vertices, indices, and a bounding sphere.
     * @memberof PolylineVolumeOutlineGeometry
     *
     * @param {PolylineVolumeOutlineGeometry} polylineVolumeOutlineGeometry A description of the polyline volume outline.
     *
     * @returns {Geometry} The computed vertices and indices.
     *
     * @exception {DeveloperError} Count of unique polyline positions must be greater than 1.
     * @exception {DeveloperError} Count of unique shape positions must be at least 3.
     */
    var brScratch = new BoundingRectangle();
    PolylineVolumeOutlineGeometry.createGeometry = function(polylineVolumeOutlineGeometry) {
        var positions = polylineVolumeOutlineGeometry._positions;
        var cleanPositions = PolylineVolumeGeometryLibrary.removeDuplicatesFromPositions(positions, polylineVolumeOutlineGeometry._ellipsoid);
        if (cleanPositions.length < 2) {
            throw new DeveloperError('Count of unique polyline positions must be greater than 1.');
        }
        var shape2D = polylineVolumeOutlineGeometry._shape;
        shape2D = PolylineVolumeGeometryLibrary.removeDuplicatesFromShape(shape2D);
        if (shape2D.length < 3) {
            throw new DeveloperError('Count of unique shape positions must be at least 3.');
        }
        if (PolygonPipeline.computeWindingOrder2D(shape2D).value === WindingOrder.CLOCKWISE.value) {
            shape2D.reverse();
        }
        var boundingRectangle = BoundingRectangle.fromPoints(shape2D, brScratch);

        var computedPositions = PolylineVolumeGeometryLibrary.computePositions(cleanPositions, shape2D, boundingRectangle, polylineVolumeOutlineGeometry, false);
        return computeAttributes(computedPositions, shape2D, boundingRectangle, polylineVolumeOutlineGeometry._ellipsoid);
    };

    return PolylineVolumeOutlineGeometry;
});