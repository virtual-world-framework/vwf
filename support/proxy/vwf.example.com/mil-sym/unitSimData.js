this.initialize = function() {

    if ( !!this.trackGraph ) {

        this.trackGraph.draggable = false;
    }

}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){
    
    //this.zIndex = 19;

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

    // NOTE: We can assumpe this will be sorted by time (unix ms)

    var lastCoordinate = undefined;

    for ( var key in this.trackingHistory ) {
        if ( entities.hasOwnProperty( key ) ) {
            var time = key;
            var trackingDataForTime = this.trackingHistory[ key ];
            for ( var i = 0; i < trackingDataForTime.length; i++ ) {
                if ( trackingDataForTime[ i ][ 'type' ] == 'location' ) {
                    var stageCoordinate = trackingDataForTime[ i ][ 'stageCoordinate' ];
                    newShape = {                
                        "extends": "http://vwf.example.com/kinetic/circle.vwf",
                        "properties": {
                            "x": stageCoordinate[0],
                            "y": stageCoordinate[1],
                            "visible": visible,
                            "listening": false,
                            "radius": 10,
                            "opacity": 0.3,
                            "fill": color,
                            "fillEnabled": true, 
                            "draggable": false,
                            "zIndex": 2
                        }
                    };
                    this.children.create( "trackGraph", newShape );
                    this.trackGraphChanged( this.trackGraph );
                    if ( lastCoordinate != undefined ) {
                        //TODO: Render lines
                    }
                    lastCoordinate = stageCoordinate;
                }
                
            }
        }
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