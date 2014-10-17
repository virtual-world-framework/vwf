/*global define*/
define([
        '../Core/BoundingSphere',
        '../Core/Cartesian3',
        '../Core/Cartographic',
        '../Core/defined',
        '../Core/Ellipsoid',
        '../Core/EllipsoidalOccluder',
        '../Core/Intersections2D',
        '../Core/Math',
        './createTaskProcessorWorker'
    ], function(
        BoundingSphere,
        Cartesian3,
        Cartographic,
        defined,
        Ellipsoid,
        EllipsoidalOccluder,
        Intersections2D,
        CesiumMath,
        createTaskProcessorWorker) {
    "use strict";

    var maxShort = 32767;

    var clipScratch = [];
    var clipScratch2 = [];
    var verticesScratch = [];
    var cartographicScratch = new Cartographic();
    var cartesian3Scratch = new Cartesian3();
    var uScratch = [];
    var vScratch = [];
    var heightScratch = [];
    var indicesScratch = [];
    var horizonOcclusionPointScratch = new Cartesian3();
    var boundingSphereScratch = new BoundingSphere();

    function upsampleQuantizedTerrainMesh(parameters, transferableObjects) {
        var isEastChild = parameters.isEastChild;
        var isNorthChild = parameters.isNorthChild;

        var minU = isEastChild ? 0.5 : 0.0;
        var maxU = isEastChild ? 1.0 : 0.5;
        var minV = isNorthChild ? 0.5 : 0.0;
        var maxV = isNorthChild ? 1.0 : 0.5;

        var uBuffer = uScratch;
        var vBuffer = vScratch;
        var heightBuffer = heightScratch;

        uBuffer.length = 0;
        vBuffer.length = 0;
        heightBuffer.length = 0;

        var indices = indicesScratch;
        indices.length = 0;

        var vertexMap = {};

        var parentVertices = parameters.vertices;
        var parentIndices = parameters.indices;

        var quantizedVertexCount = parentVertices.length / 3;
        var parentUBuffer = parentVertices.subarray(0, quantizedVertexCount);
        var parentVBuffer = parentVertices.subarray(quantizedVertexCount, 2 * quantizedVertexCount);
        var parentHeightBuffer = parentVertices.subarray(quantizedVertexCount * 2, 3 * quantizedVertexCount);

        var vertexCount = 0;

        var i, u, v;
        for (i = 0; i < quantizedVertexCount; ++i) {
            u = parentUBuffer[i] / maxShort;
            v = parentVBuffer[i] / maxShort;
            if ((isEastChild && u >= 0.5 || !isEastChild && u <= 0.5) &&
                (isNorthChild && v >= 0.5 || !isNorthChild && v <= 0.5)) {

                vertexMap[i] = vertexCount;
                uBuffer.push(u);
                vBuffer.push(v);
                heightBuffer.push(parentHeightBuffer[i]);
                ++vertexCount;
            }
        }

        var triangleVertices = [];
        triangleVertices.push(new Vertex());
        triangleVertices.push(new Vertex());
        triangleVertices.push(new Vertex());

        var clippedTriangleVertices = [];
        clippedTriangleVertices.push(new Vertex());
        clippedTriangleVertices.push(new Vertex());
        clippedTriangleVertices.push(new Vertex());

        var clippedIndex;
        var clipped2;

        for (i = 0; i < parentIndices.length; i += 3) {
            var i0 = parentIndices[i];
            var i1 = parentIndices[i + 1];
            var i2 = parentIndices[i + 2];

            var u0 = parentUBuffer[i0] / maxShort;
            var u1 = parentUBuffer[i1] / maxShort;
            var u2 = parentUBuffer[i2] / maxShort;

            triangleVertices[0].initializeIndexed(parentUBuffer, parentVBuffer, parentHeightBuffer, i0);
            triangleVertices[1].initializeIndexed(parentUBuffer, parentVBuffer, parentHeightBuffer, i1);
            triangleVertices[2].initializeIndexed(parentUBuffer, parentVBuffer, parentHeightBuffer, i2);

            // Clip triangle on the east-west boundary.
            var clipped = Intersections2D.clipTriangleAtAxisAlignedThreshold(0.5, isEastChild, u0, u1, u2, clipScratch);

            // Get the first clipped triangle, if any.
            clippedIndex = 0;

            if (clippedIndex >= clipped.length) {
                continue;
            }
            clippedIndex = clippedTriangleVertices[0].initializeFromClipResult(clipped, clippedIndex, triangleVertices);

            if (clippedIndex >= clipped.length) {
                continue;
            }
            clippedIndex = clippedTriangleVertices[1].initializeFromClipResult(clipped, clippedIndex, triangleVertices);

            if (clippedIndex >= clipped.length) {
                continue;
            }
            clippedIndex = clippedTriangleVertices[2].initializeFromClipResult(clipped, clippedIndex, triangleVertices);

            // Clip the triangle against the North-south boundary.
            clipped2 = Intersections2D.clipTriangleAtAxisAlignedThreshold(0.5, isNorthChild, clippedTriangleVertices[0].getV(), clippedTriangleVertices[1].getV(), clippedTriangleVertices[2].getV(), clipScratch2);
            addClippedPolygon(uBuffer, vBuffer, heightBuffer, indices, vertexMap, clipped2, clippedTriangleVertices);

            // If there's another vertex in the original clipped result,
            // it forms a second triangle.  Clip it as well.
            if (clippedIndex < clipped.length) {
                clippedTriangleVertices[2].clone(clippedTriangleVertices[1]);
                clippedTriangleVertices[2].initializeFromClipResult(clipped, clippedIndex, triangleVertices);

                clipped2 = Intersections2D.clipTriangleAtAxisAlignedThreshold(0.5, isNorthChild, clippedTriangleVertices[0].getV(), clippedTriangleVertices[1].getV(), clippedTriangleVertices[2].getV(), clipScratch2);
                addClippedPolygon(uBuffer, vBuffer, heightBuffer, indices, vertexMap, clipped2, clippedTriangleVertices);
            }
        }

        var uOffset = isEastChild ? -1.0 : 0.0;
        var vOffset = isNorthChild ? -1.0 : 0.0;

        var parentMinimumHeight = parameters.minimumHeight;
        var parentMaximumHeight = parameters.maximumHeight;

        var westIndices = [];
        var southIndices = [];
        var eastIndices = [];
        var northIndices = [];

        var minimumHeight = Number.MAX_VALUE;
        var maximumHeight = -minimumHeight;

        var cartesianVertices = verticesScratch;
        cartesianVertices.length = 0;

        var ellipsoid = Ellipsoid.clone(parameters.ellipsoid);
        var rectangle = parameters.childRectangle;

        for (i = 0; i < uBuffer.length; ++i) {
            u = uBuffer[i];
            if (u <= minU) {
                westIndices.push(i);
                u = 0.0;
            } else if (u >= maxU) {
                eastIndices.push(i);
                u = 1.0;
            } else {
                u = u * 2.0 + uOffset;
            }

            uBuffer[i] = u;

            v = vBuffer[i];
            if (v <= minV) {
                southIndices.push(i);
                v = 0.0;
            } else if (v >= maxV) {
                northIndices.push(i);
                v = 1.0;
            } else {
                v = v * 2.0 + vOffset;
            }

            vBuffer[i] = v;

            var height = CesiumMath.lerp(parentMinimumHeight, parentMaximumHeight, heightBuffer[i] / maxShort);
            if (height < minimumHeight) {
                minimumHeight = height;
            }
            if (height > maximumHeight) {
                maximumHeight = height;
            }

            heightBuffer[i] = height;

            cartographicScratch.longitude = CesiumMath.lerp(rectangle.west, rectangle.east, u);
            cartographicScratch.latitude = CesiumMath.lerp(rectangle.south, rectangle.north, v);
            cartographicScratch.height = height;

            ellipsoid.cartographicToCartesian(cartographicScratch, cartesian3Scratch);

            cartesianVertices.push(cartesian3Scratch.x);
            cartesianVertices.push(cartesian3Scratch.y);
            cartesianVertices.push(cartesian3Scratch.z);
        }

        var boundingSphere = BoundingSphere.fromVertices(cartesianVertices, Cartesian3.ZERO, 3, boundingSphereScratch);

        var occluder = new EllipsoidalOccluder(ellipsoid);
        var horizonOcclusionPoint = occluder.computeHorizonCullingPointFromVertices(boundingSphere.center, cartesianVertices, 3, boundingSphere.center, horizonOcclusionPointScratch);

        var heightRange = maximumHeight - minimumHeight;

        var vertices = new Uint16Array(uBuffer.length + vBuffer.length + heightBuffer.length);

        for (i = 0; i < uBuffer.length; ++i) {
            vertices[i] = uBuffer[i] * maxShort;
        }

        var start = uBuffer.length;

        for (i = 0; i < vBuffer.length; ++i) {
            vertices[start + i] = vBuffer[i] * maxShort;
        }

        start += vBuffer.length;

        for (i = 0; i < heightBuffer.length; ++i) {
            vertices[start + i] = maxShort * (heightBuffer[i] - minimumHeight) / heightRange;
        }

        var indicesTypedArray = new Uint16Array(indices);
        transferableObjects.push(vertices.buffer, indicesTypedArray.buffer);

        return {
            vertices : vertices.buffer,
            indices : indicesTypedArray.buffer,
            minimumHeight : minimumHeight,
            maximumHeight : maximumHeight,
            westIndices : westIndices,
            southIndices : southIndices,
            eastIndices : eastIndices,
            northIndices : northIndices,
            boundingSphere : boundingSphere,
            horizonOcclusionPoint : horizonOcclusionPoint
        };
    }

    function Vertex() {
        this.vertexBuffer = undefined;
        this.index = undefined;
        this.first = undefined;
        this.second = undefined;
        this.ratio = undefined;
    }

    Vertex.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new Vertex();
        }

        result.uBuffer = this.uBuffer;
        result.vBuffer = this.vBuffer;
        result.heightBuffer = this.heightBuffer;
        result.index = this.index;
        result.first = this.first;
        result.second = this.second;
        result.ratio = this.ratio;

        return result;
    };

    Vertex.prototype.initializeIndexed = function(uBuffer, vBuffer, heightBuffer, index) {
        this.uBuffer = uBuffer;
        this.vBuffer = vBuffer;
        this.heightBuffer = heightBuffer;
        this.index = index;
        this.first = undefined;
        this.second = undefined;
        this.ratio = undefined;
    };

    Vertex.prototype.initializeInterpolated = function(first, second, ratio) {
        this.vertexBuffer = undefined;
        this.index = undefined;
        this.newIndex = undefined;
        this.first = first;
        this.second = second;
        this.ratio = ratio;
    };

    Vertex.prototype.initializeFromClipResult = function(clipResult, index, vertices) {
        var nextIndex = index + 1;

        if (clipResult[index] !== -1) {
            vertices[clipResult[index]].clone(this);
        } else {
            this.vertexBuffer = undefined;
            this.index = undefined;
            this.first = vertices[clipResult[nextIndex]];
            ++nextIndex;
            this.second = vertices[clipResult[nextIndex]];
            ++nextIndex;
            this.ratio = clipResult[nextIndex];
            ++nextIndex;
        }

        return nextIndex;
    };

    Vertex.prototype.getKey = function() {
        if (this.isIndexed()) {
            return this.index;
        }
        return JSON.stringify({
            first : this.first.getKey(),
            second : this.second.getKey(),
            ratio : this.ratio
        });
    };

    Vertex.prototype.isIndexed = function() {
        return defined(this.index);
    };

    Vertex.prototype.getH = function() {
        if (defined(this.index)) {
            return this.heightBuffer[this.index];
        }
        return CesiumMath.lerp(this.first.getH(), this.second.getH(), this.ratio);
    };

    Vertex.prototype.getU = function() {
        if (defined(this.index)) {
            return this.uBuffer[this.index] / maxShort;
        }
        return CesiumMath.lerp(this.first.getU(), this.second.getU(), this.ratio);
    };

    Vertex.prototype.getV = function() {
        if (defined(this.index)) {
            return this.vBuffer[this.index] / maxShort;
        }
        return CesiumMath.lerp(this.first.getV(), this.second.getV(), this.ratio);
    };

    var polygonVertices = [];
    polygonVertices.push(new Vertex());
    polygonVertices.push(new Vertex());
    polygonVertices.push(new Vertex());
    polygonVertices.push(new Vertex());

    function addClippedPolygon(uBuffer, vBuffer, heightBuffer, indices, vertexMap, clipped, triangleVertices) {
        if (clipped.length === 0) {
            return;
        }

        var numVertices = 0;
        var clippedIndex = 0;
        while (clippedIndex < clipped.length) {
            clippedIndex = polygonVertices[numVertices++].initializeFromClipResult(clipped, clippedIndex, triangleVertices);
        }

        for (var i = 0; i < numVertices; ++i) {
            var polygonVertex = polygonVertices[i];
            if (!polygonVertex.isIndexed()) {
                var key = polygonVertex.getKey();
                if (defined(vertexMap[key])) {
                    polygonVertex.newIndex = vertexMap[key];
                } else {
                    var newIndex = uBuffer.length;
                    uBuffer.push(polygonVertex.getU());
                    vBuffer.push(polygonVertex.getV());
                    heightBuffer.push(polygonVertex.getH());
                    polygonVertex.newIndex = newIndex;
                    vertexMap[key] = newIndex;
                }
            } else {
                polygonVertex.newIndex = vertexMap[polygonVertex.index];
                polygonVertex.uBuffer = uBuffer;
                polygonVertex.vBuffer = vBuffer;
                polygonVertex.heightBuffer = heightBuffer;
            }
        }

        if (numVertices === 3) {
            // A triangle.
            indices.push(polygonVertices[0].newIndex);
            indices.push(polygonVertices[1].newIndex);
            indices.push(polygonVertices[2].newIndex);
        } else if (numVertices === 4) {
            // A quad - two triangles.
            indices.push(polygonVertices[0].newIndex);
            indices.push(polygonVertices[1].newIndex);
            indices.push(polygonVertices[2].newIndex);

            indices.push(polygonVertices[0].newIndex);
            indices.push(polygonVertices[2].newIndex);
            indices.push(polygonVertices[3].newIndex);
        }
    }

    return createTaskProcessorWorker(upsampleQuantizedTerrainMesh);
});
