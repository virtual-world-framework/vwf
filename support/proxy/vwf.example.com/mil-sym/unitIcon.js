this.initialize = function() {

    if ( this.imageGenerator !== undefined ) {
        this.imageGenerator.imageRendered = this.events.add( function( img, iconSize, symbolCenter, symbolBounds ) {
            
            var mp = this.parent.mapPosition;

            this.image = img;
            this.size = iconSize;
            this.width = iconSize.width;
            this.height = iconSize.height;
            this.symbolCenter = symbolCenter;

            this.parent.mapPosition = mp;
            
        }, this );
    }

}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){

    var mp = this.parent.mapPosition;

    this.image = img;
    this.size = iconSize;
    this.width = iconSize.width;
    this.height = iconSize.height;
    this.symbolCenter = symbolCenter;

    this.parent.mapPosition = mp;

    if ( this.parent !== undefined ) {
        this.parent.handleRender( img, iconSize, symbolCenter, symbolBounds );
        this.parent.simData.handleRender( img, iconSize, symbolCenter, symbolBounds );
    }
}
//# sourceURL=unitIcon.js