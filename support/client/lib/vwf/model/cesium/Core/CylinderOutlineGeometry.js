/*global define*/
define([
        './BoundingSphere',
        './Cartesian2',
        './Cartesian3',
        './ComponentDatatype',
        './CylinderGeometryLibrary',
        './defaultValue',
        './defined',
        './DeveloperError',
        './Geometry',
        './GeometryAttribute',
        './GeometryAttributes',
        './IndexDatatype',
        './PrimitiveType'
    ], function(
        BoundingSphere,
        Cartesian2,
        Cartesian3,
        ComponentDatatype,
        CylinderGeometryLibrary,
        defaultValue,
        defined,
        DeveloperError,
        Geometry,
        GeometryAttribute,
        GeometryAttributes,
        IndexDatatype,
        PrimitiveType) {
    "use strict";

    var radiusScratch = new Cartesian2();

    /**
     * A description of the outline of a cylinder.
     *
     * @alias CylinderOutlineGeometry
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Number} options.length The length of the cylinder.
     * @param {Number} options.topRadius The radius of the top of the cylinder.
     * @param {Number} options.bottomRadius The radius of the bottom of the cylinder.
     * @param {Number} [options.slices=128] The number of edges around perimeter of the cylinder.
     * @param {Number} [options.numberOfVerticalLines=16] Number of lines to draw between the top and bottom surfaces of the cylinder.
     *
     * @exception {DeveloperError} options.length must be greater than 0.
     * @exception {DeveloperError} options.topRadius must be greater than 0.
     * @exception {DeveloperError} options.bottomRadius must be greater than 0.
     * @exception {DeveloperError} bottomRadius and topRadius cannot both equal 0.
     * @exception {DeveloperError} options.slices must be greater that 3.
     *
     * @see CylinderOutlineGeometry.createGeometry
     *
     * @demo {@link http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Cylinder%20Outline.html|Cesium Sandcastle Cylinder Outline Demo}
     *
     * @example
     * // create cylinder geometry
     * var cylinder = new Cesium.CylinderOutlineGeometry({
     *     length: 200000,
     *     topRadius: 80000,
     *     bottomRadius: 200000,
     * });
     * var geometry = Cesium.CylinderOutlineGeometry.createGeometry(cylinder);
     */
    var CylinderOutlineGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var length = options.length;
        var topRadius = options.topRadius;
        var bottomRadius = options.bottomRadius;
        var slices = defaultValue(options.slices, 128);
        var numberOfVerticalLines = Math.max(defaultValue(options.numberOfVerticalLines, 16), 0);

        //>>includeStart('debug', pragmas.debug);
        if (!defined(length) || length <= 0) {
            throw new DeveloperError('options.length must be greater than 0.');
        }
        if (!defined(topRadius) || topRadius < 0) {
            throw new DeveloperError('options.topRadius must be greater than 0.');
        }
        if (!defined(bottomRadius) || bottomRadius < 0) {
            throw new DeveloperError('options.bottomRadius must be greater than 0.');
        }
        if (bottomRadius === 0 && topRadius === 0) {
            throw new DeveloperError('bottomRadius and topRadius cannot both equal 0.');
        }
        if (slices < 3) {
            throw new DeveloperError('options.slices must be greater that 3.');
        }
        //>>includeEnd('debug');

        this._length = length;
        this._topRadius = topRadius;
        this._bottomRadius = bottomRadius;
        this._slices = slices;
        this._numberOfVerticalLines = numberOfVerticalLines;
        this._workerName = 'createCylinderOutlineGeometry';
    };

    /**
     * Computes the geometric representation of an outline of a cylinder, including its vertices, indices, and a bounding sphere.
     *
     * @param {CylinderOutlineGeometry} cylinderGeometry A description of the cylinder outline.
     * @returns {Geometry} The computed vertices and indices.
     */
    CylinderOutlineGeometry.createGeometry = function(cylinderGeometry) {
        var length = cylinderGeometry._length;
        var topRadius = cylinderGeometry._topRadius;
        var bottomRadius = cylinderGeometry._bottomRadius;
        var slices = cylinderGeometry._slices;
        var numberOfVerticalLines = cylinderGeometry._numberOfVerticalLines;

        var numVertices = slices * 2;

        var positions = CylinderGeometryLibrary.computePositions(length, topRadius, bottomRadius, slices, false);
        var numIndices = slices * 2;
        var numSide;
        if (numberOfVerticalLines > 0) {
            var numSideLines = Math.min(numberOfVerticalLines, slices);
            numSide = Math.round(slices / numSideLines);
            numIndices += numSideLines;
        }

        var indices = IndexDatatype.createTypedArray(numVertices, numIndices * 2);
        var index = 0;
        for (var i = 0; i < slices - 1; i++) {
            indices[index++] = i;
            indices[index++] = i + 1;
            indices[index++] = i + slices;
            indices[index++] = i + 1 + slices;
        }

        indices[index++] = slices - 1;
        indices[index++] = 0;
        indices[index++] = slices + slices - 1;
        indices[index++] = slices;

        if (numberOfVerticalLines > 0) {
            for (i = 0; i < slices; i += numSide) {
                indices[index++] = i;
                indices[index++] = i + slices;
            }
        }

        var attributes = new GeometryAttributes();
        attributes.position = new GeometryAttribute({
            componentDatatype : ComponentDatatype.DOUBLE,
            componentsPerAttribute : 3,
            values : positions
        });

        radiusScratch.x = length * 0.5;
        radiusScratch.y = Math.max(bottomRadius, topRadius);

        var boundingSphere = new BoundingSphere(Cartesian3.ZERO, Cartesian2.magnitude(radiusScratch));

        return new Geometry({
            attributes : attributes,
            indices : indices,
            primitiveType : PrimitiveType.LINES,
            boundingSphere : boundingSphere
        });
    };

    return CylinderOutlineGeometry;
});
