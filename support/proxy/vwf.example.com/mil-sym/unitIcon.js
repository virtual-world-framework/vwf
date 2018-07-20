this.initialize = function() {

    if ( this.imageGenerator !== undefined ) {
        this.imageGenerator.imageRendered = this.events.add( function( img, iconSize, symbolCenter, symbolBounds ) {
            this.updateIcon( img, iconSize, symbolCenter );
        }, this );
    }

}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){

    this.updateIcon( img, iconSize, symbolCenter );

    if ( this.parent !== undefined ) {
        this.parent.handleRender( img, iconSize, symbolCenter, symbolBounds );
    }

    //# sourceURL=unitIcon.handleRender
}

this.updateIcon = function( img, iconSize, symbolCenter ) {

    // Update the image to the one that has just been rendered
    this.image = img;
    this.size = iconSize;
    this.width = iconSize.width;
    this.height = iconSize.height;
    this.symbolCenter = symbolCenter;

    // Since the size of the icon might have changed,
    // reset the unit group's "position" (upper left point)
    // to keep its center on "mapPosition" 
    this.parent.setPositionFromMapPosition();

    //# sourceURL=unitIcon.updateIcon
}
