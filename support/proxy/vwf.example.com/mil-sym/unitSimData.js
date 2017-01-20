this.initialize = function() {
    if ( !!this.trackGraph ) {
        this.trackGraph.draggable = false;
    }
}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){
    
    this.zIndex = 20;
    
    // this.updateTrackGraph();
}

this.updateTrackGraph = function() {

    // TODO: If time is specified, only render the track up to a certain time
    // var visible = true;
    // if ( this.threatArea ) {
    //     visible = this.trackGraph.visible;
    //     this.children.delete( this.trackGraph );
    // }

    // var color = 'yellow';

    // var history = this.trackingHistory
    // var lastCoordinate = undefined;

    // var currentTime = undefined;
    // var currentCoordinate = undefined;
    // for ( var key in history ) {
    //     if ( history.hasOwnProperty( key ) ) {
    //         currentTime = key;
    //         var time = key;
    //         var trackingDataForTime = history[ key ];
    //         for ( var z = 0; z < trackingDataForTime.length; z++ ) {
    //             if ( trackingDataForTime[ z ][ 'type' ] == 'location' ) {
    //                 currentCoordinate = trackingDataForTime[ z ][ 'stageCoordinate' ];
    //             }
    //         }
    //     }
    // }
    // for ( var key in history ) {
    //     color = 'yellow';
    //     if ( history.hasOwnProperty( key ) ) {
    //         var time = key;
    //         var trackingDataForTime = this.trackingHistory[ key ];
    //         for ( var i = 0; i < trackingDataForTime.length; i++ ) {
    //             if ( trackingDataForTime[ i ][ 'type' ] == 'location' ) {
    //                 if ( currentTime == key ) {
    //                     color = 'green';
    //                 }
    //                 var stageCoordinate = trackingDataForTime[ i ][ 'stageCoordinate' ];
    //                 var dot = {                
    //                     "extends": "http://vwf.example.com/kinetic/circle.vwf",
    //                     "properties": {
    //                         "x": stageCoordinate[0] - currentCoordinate[0],
    //                         "y": stageCoordinate[1] - currentCoordinate[1],
    //                         "visible": visible,
    //                         "listening": false,
    //                         "radius": 3,
    //                         "opacity": 0.7,
    //                         "fill": color,
    //                         "fillEnabled": true, 
    //                         "draggable": false,
    //                         "zIndex": 20
    //                     }
    //                 };
    //                 this.children.create( "trackGraph"+i, dot );
    //                 this.trackGraphChanged( this.trackGraph );
    //                 if ( lastCoordinate != undefined ) {
    //                     //TODO: Render lines
    //                     var line = {
    //                         "extends": "http://vwf.example.com/kinetic/line.vwf",
    //                         "properties": {
    //                             "x": -currentCoordinate[0],
    //                             "y": -currentCoordinate[1],
    //                             "points": [ lastCoordinate[0], lastCoordinate[1], stageCoordinate[0], stageCoordinate[1] ],
    //                             "visible": visible,
    //                             "listening": false,
    //                             "opacity": 0.5,
    //                             "stroke": color,
    //                             "strokeWidth": 2,
    //                             "draggable": false,
    //                             "shadowEnabled": false,
    //                             "zIndex": 20
    //                         } 
    //                     }
    //                     this.children.create( "trackGraphLine"+i, line );
    //                 }
    //                 lastCoordinate = stageCoordinate;
    //             }
                
    //         }
    //     }
    // }


}

//# sourceURL=unitSimData.js