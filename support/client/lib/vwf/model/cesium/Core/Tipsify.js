/*global define*/
define([
        './defaultValue',
        './defined',
        './DeveloperError'
    ], function(
        defaultValue,
        defined,
        DeveloperError) {
    "use strict";

    /**
     * Encapsulates an algorithm to optimize triangles for the post
     * vertex-shader cache.  This is based on the 2007 SIGGRAPH paper
     * 'Fast Triangle Reordering for Vertex Locality and Reduced Overdraw.'
     * The runtime is linear but several passes are made.
     *
     * @exports Tipsify
     *
     * @see <a href='http://gfx.cs.princeton.edu/pubs/Sander_2007_%3ETR/tipsy.pdf'>
     * Fast Triangle Reordering for Vertex Locality and Reduced Overdraw</a>
     * by Sander, Nehab, and Barczak
     */
    var Tipsify = {};

    /**
     * Calculates the average cache miss ratio (ACMR) for a given set of indices.
     *
     * @param {Array} description.indices Lists triads of numbers corresponding to the indices of the vertices
     *                        in the vertex buffer that define the geometry's triangles.
     * @param {Number} [description.maximumIndex] The maximum value of the elements in <code>args.indices</code>.
     *                                     If not supplied, this value will be computed.
     * @param {Number} [description.cacheSize=24] The number of vertices that can be stored in the cache at any one time.
     *
     * @exception {DeveloperError} indices is required.
     * @exception {DeveloperError} indices length must be a multiple of three.
     * @exception {DeveloperError} cacheSize must be greater than two.
     *
     * @returns {Number} The average cache miss ratio (ACMR).
     *
     * @example
     * var indices = [0, 1, 2, 3, 4, 5];
     * var maxIndex = 5;
     * var cacheSize = 3;
     * var acmr = Tipsify.calculateACMR({indices : indices, maxIndex : maxIndex, cacheSize : cacheSize});
     */
    Tipsify.calculateACMR = function(description) {
        description = defaultValue(description, defaultValue.EMPTY_OBJECT);
        var indices = description.indices;
        var maximumIndex = description.maximumIndex;
        var cacheSize = defaultValue(description.cacheSize, 24);

        if (!defined(indices)) {
            throw new DeveloperError('indices is required.');
        }

        var numIndices = indices.length;

        if (numIndices < 3 || numIndices % 3 !== 0) {
            throw new DeveloperError('indices length must be a multiple of three.');
        }
        if (maximumIndex <= 0) {
            throw new DeveloperError('maximumIndex must be greater than zero.');
        }
        if (cacheSize < 3) {
            throw new DeveloperError('cacheSize must be greater than two.');
        }

        // Compute the maximumIndex if not given
        if (!defined(maximumIndex)) {
            maximumIndex = 0;
            var currentIndex = 0;
            var intoIndices = indices[currentIndex];
            while (currentIndex < numIndices) {
                if (intoIndices > maximumIndex) {
                    maximumIndex = intoIndices;
                }
                ++currentIndex;
                intoIndices = indices[currentIndex];
            }
        }

        // Vertex time stamps
        var vertexTimeStamps = [];
        for ( var i = 0; i < maximumIndex + 1; i++) {
            vertexTimeStamps[i] = 0;
        }

        // Cache processing
        var s = cacheSize + 1;
        for ( var j = 0; j < numIndices; ++j) {
            if ((s - vertexTimeStamps[indices[j]]) > cacheSize) {
                vertexTimeStamps[indices[j]] = s;
                ++s;
            }
        }

        return (s - cacheSize + 1) / (numIndices / 3);
    };

    /**
     * Optimizes triangles for the post-vertex shader cache.
     *
     * @param {Array} description.indices Lists triads of numbers corresponding to the indices of the vertices
     *                        in the vertex buffer that define the geometry's triangles.
     * @param {Number} [description.maximumIndex] The maximum value of the elements in <code>args.indices</code>.
     *                                     If not supplied, this value will be computed.
     * @param {Number} [description.cacheSize=24] The number of vertices that can be stored in the cache at any one time.
     *
     * @exception {DeveloperError} indices is required.
     * @exception {DeveloperError} indices length must be a multiple of three.
     * @exception {DeveloperError} cacheSize must be greater than two.
     *
     * @returns {Array} A list of the input indices in an optimized order.
     *
     * @example
     * var indices = [0, 1, 2, 3, 4, 5];
     * var maxIndex = 5;
     * var cacheSize = 3;
     * var reorderedIndices = Tipsify.tipsify({indices : indices, maxIndex : maxIndex, cacheSize : cacheSize});
     */
    Tipsify.tipsify = function(description) {
        description = defaultValue(description, defaultValue.EMPTY_OBJECT);
        var indices = description.indices;
        var maximumIndex = description.maximumIndex;
        var cacheSize = defaultValue(description.cacheSize, 24);

        var cursor;

        function skipDeadEnd(vertices, deadEnd, indices, maximumIndexPlusOne) {
            while (deadEnd.length >= 1) {
                // while the stack is not empty
                var d = deadEnd[deadEnd.length - 1]; // top of the stack
                deadEnd.splice(deadEnd.length - 1, 1); // pop the stack

                if (vertices[d].numLiveTriangles > 0) {
                    return d;
                }
            }

            while (cursor < maximumIndexPlusOne) {
                if (vertices[cursor].numLiveTriangles > 0) {
                    ++cursor;
                    return cursor - 1;
                }
                ++cursor;
            }
            return -1;
        }

        function getNextVertex(indices, cacheSize, oneRing, vertices, s, deadEnd, maximumIndexPlusOne) {
            var n = -1;
            var p;
            var m = -1;
            var itOneRing = 0;
            while (itOneRing < oneRing.length) {
                var index = oneRing[itOneRing];
                if (vertices[index].numLiveTriangles) {
                    p = 0;
                    if ((s - vertices[index].timeStamp + (2 * vertices[index].numLiveTriangles)) <= cacheSize) {
                        p = s - vertices[index].timeStamp;
                    }
                    if ((p > m) || (m === -1)) {
                        m = p;
                        n = index;
                    }
                }
                ++itOneRing;
            }
            if (n === -1) {
                return skipDeadEnd(vertices, deadEnd, indices, maximumIndexPlusOne);
            }
            return n;
        }

        if (!defined(indices)) {
            throw new DeveloperError('indices is required.');
        }
        var numIndices = indices.length;

        if (numIndices < 3 || numIndices % 3 !== 0) {
            throw new DeveloperError('indices length must be a multiple of three.');
        }
        if (maximumIndex <= 0) {
            throw new DeveloperError('maximumIndex must be greater than zero.');
        }
        if (cacheSize < 3) {
            throw new DeveloperError('cacheSize must be greater than two.');
        }

        // Determine maximum index
        var maximumIndexPlusOne = 0;
        var currentIndex = 0;
        var intoIndices = indices[currentIndex];
        var endIndex = numIndices;
        if (defined(maximumIndex)) {
            maximumIndexPlusOne = maximumIndex + 1;
        } else {
            while (currentIndex < endIndex) {
                if (intoIndices > maximumIndexPlusOne) {
                    maximumIndexPlusOne = intoIndices;
                }
                ++currentIndex;
                intoIndices = indices[currentIndex];
            }
            if (maximumIndexPlusOne === -1) {
                return 0;
            }
            ++maximumIndexPlusOne;
        }

        // Vertices
        var vertices = [];
        for ( var i = 0; i < maximumIndexPlusOne; i++) {
            vertices[i] = {
                numLiveTriangles : 0,
                timeStamp : 0,
                vertexTriangles : []
            };
        }
        currentIndex = 0;
        var triangle = 0;
        while (currentIndex < endIndex) {
            vertices[indices[currentIndex]].vertexTriangles.push(triangle);
            ++(vertices[indices[currentIndex]]).numLiveTriangles;
            vertices[indices[currentIndex + 1]].vertexTriangles.push(triangle);
            ++(vertices[indices[currentIndex + 1]]).numLiveTriangles;
            vertices[indices[currentIndex + 2]].vertexTriangles.push(triangle);
            ++(vertices[indices[currentIndex + 2]]).numLiveTriangles;
            ++triangle;
            currentIndex += 3;
        }

        // Starting index
        var f = 0;

        // Time Stamp
        var s = cacheSize + 1;
        cursor = 1;

        // Process
        var oneRing = [];
        var deadEnd = []; //Stack
        var vertex;
        var intoVertices;
        var currentOutputIndex = 0;
        var outputIndices = [];
        var numTriangles = numIndices / 3;
        var triangleEmitted = [];
        for (i = 0; i < numTriangles; i++) {
            triangleEmitted[i] = false;
        }
        var index;
        var limit;
        while (f !== -1) {
            oneRing = [];
            intoVertices = vertices[f];
            limit = intoVertices.vertexTriangles.length;
            for ( var k = 0; k < limit; ++k) {
                triangle = intoVertices.vertexTriangles[k];
                if (!triangleEmitted[triangle]) {
                    triangleEmitted[triangle] = true;
                    currentIndex = triangle + triangle + triangle;
                    for ( var j = 0; j < 3; ++j) {
                        // Set this index as a possible next index
                        index = indices[currentIndex];
                        oneRing.push(index);
                        deadEnd.push(index);

                        // Output index
                        outputIndices[currentOutputIndex] = index;
                        ++currentOutputIndex;

                        // Cache processing
                        vertex = vertices[index];
                        --vertex.numLiveTriangles;
                        if ((s - vertex.timeStamp) > cacheSize) {
                            vertex.timeStamp = s;
                            ++s;
                        }
                        ++currentIndex;
                    }
                }
            }
            f = getNextVertex(indices, cacheSize, oneRing, vertices, s, deadEnd, maximumIndexPlusOne);
        }

        return outputIndices;
    };

    return Tipsify;
});
