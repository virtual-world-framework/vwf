this.getHeight = function( x, y ) {
    // The following diagram show the values being calculated in this function:
    //
    // a --e-------- b
    // |             |
    // |   g         |  In the world y increases up.
    // |             |  In the heightmap y increases down.
    // |             |
    // c --f-------- d
    //
    // g is the point for which the height value has been requested
    // a, b, c, d represent the four closest values in the heightmap
    // We interpolate betweena and b to find e and between c and d to find f
    // Then, we interpolate between e and f to find g
    // (the value at the requested location)

    // Convert world (x,y) into fractional array indices
    var gX = ( x - this.minWorldX ) / ( this.maxWorldX - this.minWorldX ) * 
        this.heightmapWidth;
    var gY = ( 1 - ( y - this.minWorldY ) / ( this.maxWorldY - this.minWorldY ) ) * 
        this.heightmapHeight;

    // Find the (x,y) for a,b,c,d
    var x1 = Math.round( gX );
    // var x2 = Math.ceil( gX );
    var y1 = Math.round( gY );
    // var y2 = Math.ceil( gY );

    // Find the heightmap values at a,b,c,d
    var a = this.getHeightmapValue( x1, y1 );
    // var b = this.getHeightmapValue( x2, y1 );
    // var c = this.getHeightmapValue( x1, y2 );
    // var d = this.getHeightmapValue( x2, y2 ); 

    // Debug
    // var min = 99999;
    // var max = -3;
    // for ( var i = 0; i < this.heightmap.data.length; i += 4 ) {
    //     if ( this.heightmap.data[ i ] < min ) {
    //         min = this.heightmap.data[ i ];
    //     }
    //     if ( this.heightmap.data[ i ] > max ) {
    //         max = this.heightmap.data[ i ];
    //     }
    // }
    // this.logger.warn( "min = ", min, "; max = ", max );

    // Interpolate to find e and f
    // var e = a * ( gX - x1 ) + b * ( x2 - gX );
    // var f = c * ( gX - x1 ) + d * ( x2 - gX );

    // // Interpolate between e and f to find g
    // var g = e * ( gY - y1 ) + f * ( y2 - gY );

    // Convert that value into a height
    // Height range is from 0 to ( 255 * 256 * 256 ) ... or 16711680
    var gFrom0to1 = a / 16711680;
    var zRange = this.maxWorldZ - this.minWorldZ;
    return this.minWorldZ + gFrom0to1 * zRange;
}

this.getHeightmapValue = function( x, y ) {
    // The heightamp is a flat array that contains four values for each pixel (r,g,b,a)
    // Since the image is grayscale, the (r,g,b) values should all be equal.
    // Therefore, we pull out the red channel from a pixel and use it as the heightmap 
    // value
    var rIndex = 4 * ( this.heightmapWidth * y + x );
    var gIndex = rIndex + 1;
    var bIndex = gIndex + 1;
    var rValue = this.heightmap.data[ rIndex ];
    var gValue = this.heightmap.data[ gIndex ];
    var bValue = this.heightmap.data[ bIndex ];
    return rValue + gValue * 256 + bValue * 65280;
}

//@ sourceURL=http://vwf.example.com/heightmap.js