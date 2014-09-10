this.getHeight = function( x, y ) {
    // Finding the nearest point in the heightmap works for our current applications,
    // so that is what we do currently.  Below is a commented-out version that does tri-linear
    // interpolation between the nearest four points to find the height

    // Convert world (x,y) into fractional array indices
    var minWorldX = this.minWorldX;
    var fractX = ( x - minWorldX ) / ( this.maxWorldX - minWorldX ) * 
        this.heightmapWidth;
    var minWorldY = this.minWorldY;
    var fractY = ( 1 - ( y - minWorldY ) / ( this.maxWorldY - minWorldY ) ) * 
        this.heightmapHeight;

    // Find the (x,y)
    var x1 = Math.round( fractX );
    var y1 = Math.round( fractY );

    // Find the heightmap value
    var heightValue = this.getHeightmapValue( x1, y1 );

    // Convert that value into a height
    // Height range is from 0 to ( 256^3 - 1 ) ... or 16777215
    var heightPercent = heightValue / 16777215;
    var minWorldZ = this.minWorldZ;
    var zRange = this.maxWorldZ - minWorldZ;
    return minWorldZ + heightPercent * zRange;

    // Here starts the commented-out more accurate (though slower) trilinear interpolation version

    // // The following diagram show the values being calculated in this function:
    // //
    // // a --e-------- b
    // // |             |
    // // |   g         |  In the world y increases up.
    // // |             |  In the heightmap y increases down.
    // // |             |
    // // c --f-------- d
    // //
    // // g is the point for which the height value has been requested
    // // a, b, c, d represent the four closest values in the heightmap
    // // We interpolate betweena and b to find e and between c and d to find f
    // // Then, we interpolate between e and f to find g
    // // (the value at the requested location)

    // // Convert world (x,y) into fractional array indices
    // var gX = ( x - this.minWorldX ) / ( this.maxWorldX - this.minWorldX ) * 
    //     this.heightmapWidth;
    // var gY = ( 1 - ( y - this.minWorldY ) / ( this.maxWorldY - this.minWorldY ) ) * 
    //     this.heightmapHeight;

    // // Find the (x,y) for a,b,c,d
    // var x1 = Math.floor( gX );
    // var x2 = Math.ceil( gX );
    // var y1 = Math.floor( gY );
    // var y2 = Math.ceil( gY );

    // // Find the heightmap values at a,b,c,d
    // var a = this.getHeightmapValue( x1, y1 );
    // var b = this.getHeightmapValue( x2, y1 );
    // var c = this.getHeightmapValue( x1, y2 );
    // var d = this.getHeightmapValue( x2, y2 ); 

    // // Interpolate to find e and f
    // var e = a * ( gX - x1 ) + b * ( x2 - gX );
    // var f = c * ( gX - x1 ) + d * ( x2 - gX );

    // // Interpolate between e and f to find g
    // var g = e * ( gY - y1 ) + f * ( y2 - gY );

    // // Convert that value into a height
    // // Height range is from 0 to ( 255 * 256 * 256 ) ... or 16711680
    // var gHeightPercent = g / 16711680;
    // var zRange = this.maxWorldZ - this.minWorldZ;
    // return this.minWorldZ + gHeightPercent * zRange;
}

this.getHeightmapValue = function( x, y ) {
    // The heightamp is a flat array that contains four values for each pixel (r,g,b,a)
    // Since the image is grayscale, the (r,g,b) values should all be equal.
    // Therefore, we pull out the red channel from a pixel and use it as the heightmap 
    // value
    var rIndex = 4 * ( this.heightmapWidth * y + x );
    var gIndex = rIndex + 1;
    var bIndex = gIndex + 1;
    var heightmapData = this.heightmap;
    var rValue = heightmapData[ rIndex ];
    var gValue = heightmapData[ gIndex ];
    var bValue = heightmapData[ bIndex ];
    return rValue + gValue * 256 + bValue * 65280;
}

//@ sourceURL=http://vwf.example.com/heightmap.js