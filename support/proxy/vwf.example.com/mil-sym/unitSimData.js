this.initialize = function() {

    if ( !!this.trackGraph ) {

        this.trackGraph.draggable = false;
    }

}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){
    
    this.zIndex = 19;

    // if ( this.trackGraph ) {
    //     this.trackGraph.position = this.icon.symbolCenter;    
    // }

}

this.updateTrackGraph = function( currentTime ) {

    // TODO: If time is specified, only render the track up to a certain time

    var visible = false;
    if ( this.threatArea ) {
        visible = this.trackGraph.visible;
        // TODO: Maybe save time by not deleting the whole graph each time we need to change it?
        this.children.delete( this.trackGraph );
    }

    var newShape = undefined;
    var color = 'yellow';

    // TODO: Loop through the trackingHistory property and render each element according to its type and value
    // Keep track of the last gps location so you can draw a line between a new coordinate and the last coordinate.
    
    newShape = {                
        "extends": "http://vwf.example.com/kinetic/circle.vwf",
        "properties": {
            "x": 16,
            "y": 16,
            "visible": visible,
            "listening": false,
            "radius": 32,
            "opacity": 0.3,
            "fill": color,
            "fillEnabled": true, 
            "draggable": false,
            "zIndex": 2
        }
    };

    if ( newShape ) {
        this.children.create( "trackGraph", newShape );
        this.trackGraphChanged( this.trackGraph );
    }

}

this.setAbsoluteMapPosition = function( mapPosition ) {
  if ( mapPosition !== undefined ) {
    this.mapPosition = mapPosition;
    this.position = {
      "x": this.mapPosition.x,
      "y": this.mapPosition.y
    };
  }
}

//# sourceURL=unitGroup.js