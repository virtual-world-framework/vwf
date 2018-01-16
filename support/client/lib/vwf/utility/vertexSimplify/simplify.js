/*
 (c) 2013, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/
define ( function() { 
    'use strict';
    // Modified from original Simplify.js npm module to correct script errors thrown on define

    var Simplify = {
        // to suit your point format, run search/replace for '.x' and '.y';
        // for 3D version, see 3d branch (configurability would draw significant performance overhead)

        // square distance between 2 points
        getSqDist: function(p1, p2) {

            var dx = p1.x - p2.x,
                dy = p1.y - p2.y;

            return dx * dx + dy * dy;
        },

        // square distance from a point to a segment
        getSqSegDist: function(p, p1, p2) {

            var x = p1.x,
                y = p1.y,
                dx = p2.x - x,
                dy = p2.y - y;

            if (dx !== 0 || dy !== 0) {

                var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

                if (t > 1) {
                    x = p2.x;
                    y = p2.y;

                } else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }

            dx = p.x - x;
            dy = p.y - y;

            return dx * dx + dy * dy;
        },
        // rest of the code doesn't care about point format

        // basic distance-based simplification
        simplifyRadialDist: function(points, sqTolerance) {

            var prevPoint = points[0],
                newPoints = [prevPoint],
                point;

            for (var i = 1, len = points.length; i < len; i++) {
                point = points[i];

                if (this.getSqDist(point, prevPoint) > sqTolerance) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }

            if (prevPoint !== point) newPoints.push(point);

            return newPoints;
        },

        // simplification using optimized Douglas-Peucker algorithm with recursion elimination
        simplifyDouglasPeucker: function(points, sqTolerance) {

            var len = points.length,
                MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array,
                markers = new MarkerArray(len),
                first = 0,
                last = len - 1,
                stack = [],
                newPoints = [],
                i, maxSqDist, sqDist, index;

            markers[first] = markers[last] = 1;

            while (last) {

                maxSqDist = 0;

                for (i = first + 1; i < last; i++) {
                    sqDist = this.getSqSegDist(points[i], points[first], points[last]);

                    if (sqDist > maxSqDist) {
                        index = i;
                        maxSqDist = sqDist;
                    }
                }

                if (maxSqDist > sqTolerance) {
                    markers[index] = 1;
                    stack.push(first, index, index, last);
                }

                last = stack.pop();
                first = stack.pop();
            }

            for (i = 0; i < len; i++) {
                if (markers[i]) newPoints.push(points[i]);
            }

            return newPoints;
        },

        // both algorithms combined for awesome performance
        simplify: function(points, tolerance, highestQuality) {

            var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

            points = highestQuality ? points : this.simplifyRadialDist(points, sqTolerance);
            points = this.simplifyDouglasPeucker(points, sqTolerance);

            return points;
        },

        // Simplify konva points
        // Konva points are in an array like [x1,y1,x2,y2,...xn,yn]
        simplifyKonvaPts: function( points ) {
            var ptarray = [];
            // Convert to array of  x, y points
            for ( var i = 0; i < points.length; i = i+2 ) {
                var point = { x: points[i], y: points[i+1] };
                ptarray.push( point );
            }

            // Optimize and reduce line segments
            console.info( "Points before simplify: " + ptarray.length );
            if ( ptarray.length > 2 ) {
                ptarray = this.simplify( ptarray );
            }
            console.info( "Points after simplify:  " + ptarray.length );

            // Convert back to x, y list
            var simplifiedPts = [];
            for ( var j = 0; j < ptarray.length; j++ ) {
                simplifiedPts.push( ptarray[j].x );
                simplifiedPts.push( ptarray[j].y );
            }

            return simplifiedPts;
        },


        // Simplify mil-sym-style point string
        simpilfyMilSymPts: function( pointString ) {
            // Convert point string to Konva-style array
            var xyPairs = pointString.split( " " );
            var konvaPts = [];
            for ( var i = 0; i < xyPairs.length; i++ ) {
                var xyPair = xyPairs[i].split(",");
                if ( xyPair.length === 2 ) {
                    konvaPts.push( Number(xyPair[0]) );
                    konvaPts.push( Number(xyPair[1]) );
                }
            }

            // Simplify the Konva-style array of points
            var simplifiedKonvaPts = this.simplifyKonvaPts(konvaPts);

            // Reconvert to mil-sym point string
            var simplifiedPts = "";
            for ( var i = 0; i < simplifiedKonvaPts.length; i=i+2 ) {
                simplifiedPts = simplifiedPts + simplifiedKonvaPts[i] + "," + simplifiedKonvaPts[i+1];
                if ( i < simplifiedKonvaPts.length-2 ) {
                    simplifiedPts = simplifiedPts + " ";
                }
            }

            return simplifiedPts;
        }

    };

    return Simplify;
});

//module.exports = simplify;
