this.initialize = function() {
	this.future( 0.3 ).render();
}

// the driver will be handling this function
//this.render = function() {}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){
    if ( this.parent !== undefined ) {
        this.parent.handleRender( img, iconSize, symbolCenter, symbolBounds );
    }
}
//# sourceURL=unit.js