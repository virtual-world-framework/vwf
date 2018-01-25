this.initialize = function() {
    this.future( 0 ).render();
}

// The driver handles the render method
// this.render = function() {}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){
    this.parent && this.parent.handleRender( img, iconSize, symbolCenter, symbolBounds );

    //# sourceURL=unit.handleRender
}