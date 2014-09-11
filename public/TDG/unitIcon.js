this.initialize = function() {
    this.future(0).setupListeners();
}

this.setupListeners = function() {

    var self = this;
    if ( this.imageGenerator ) {
        this.imageGenerator.imageChanged = function( img, width, height ) {
            //console.info( self.id + " fillPatternImage( "+width+", "+height+" ) = " + img );
            self.fillPatternImage = img;
            self.width = width;
            self.height = height;
        }       
    }

}
//@ sourceURL=unitIcon.js