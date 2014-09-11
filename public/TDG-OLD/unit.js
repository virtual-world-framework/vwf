this.initialize = function() {
	this.future( 0.3 ).render();
}

// the driver will be handling this function
//this.render = function() {}

this.addLocationOffset = function( offset ) {
    this.location[ 0 ] += offset[ 0 ];
    this.location[ 1 ] += offset[ 1 ];
    this.location = this.location;
}

//@ sourceURL=unit.js