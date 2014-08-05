this.addLocationOffset = function( offset ) {
    this.location[ 0 ] += offset[ 0 ];
    this.location[ 1 ] += offset[ 1 ];
    this.location = this.location;
}

//@ sourceURL=unit.js