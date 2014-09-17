this.initialize = function() {
    this.pointerIsDown = false;
    this.touching = false;

    this.downPoint = undefined;
    this.lastPoint = undefined;
    this.nodePoint = undefined;

    this.previousVisible = undefined;
}

this.toggleVisibilty = function() {

    var viz = this.visible;

    // isVisible will take care of 'inherit', and 
    // trace up through the scene graph to determine
    // if the current state is visible or not
    if ( this.isVisible ) {
        this.visible = this.previousVisible ? this.previousVisible : false;
    } else {
        this.visible = this.previousVisible ? this.previousVisible : true;  
    }

    if ( viz === 'inherit' ) {
        this.previousVisible = 'inherit';
    } else {
        this.previousVisible = undefined;
    } 

}

this.update = function( eventData, nodeData ) {
    if ( this.draggable && ( this.pointerIsDown || this.touching ) ) {
        var point = this.nodePoint || this[ this.dragProperty ];
        var diff = [
            eventData.stageRelative[ 0 ] - this.lastPoint[ 0 ],
            eventData.stageRelative[ 1 ] - this.lastPoint[ 1 ]
        ];
        console.info( "point = [ " + point[0]+ "," +point[1]+ " ]" )
        console.info( "diff = [ " + diff[0]+ "," +diff[1]+ " ]" );

        if ( point instanceof Array ) {
            point[ 0 ] += diff[ 0 ];
            point[ 1 ] += diff[ 1 ];
        } else {
            point.x += diff[ 0 ];
            point.y += diff[ 1 ];
        }

        this[ this.dragProperty ] = point;
        
        this.lastPoint = eventData.stageRelative;
    }
}

this.pointerDown = function( eventData, nodeData ) {
    this.pointerIsDown = true;

    this.downPoint = eventData.stageRelative;
    this.lastPoint = eventData.stageRelative;

    if ( this.client === this.moniker ) {
        this.nodePoint = this[ this.dragProperty ];
    }
}

this.pointerMove = function( eventData, nodeData ) {

    this.update( eventData, nodeData );

}

this.pointerUp = function( eventData, nodeData ) {

    this.update( eventData, nodeData );
    
    this.pointerIsDown = false;
    this.downPoint = undefined;
    this.lastPoint = undefined;
    this.nodePoint = undefined;
}  

this.touchStart = function( eventData, nodeData ) {
    this.touching = true;

    this.downPoint = eventData.stageRelative;
    this.lastPoint = eventData.stageRelative;
}

this.touchMove = function( eventData, nodeData ) {

    this.update( eventData, nodeData );

}

this.touchEnd = function( eventData, nodeData ) {

    this.update( eventData, nodeData );
    
    this.touching = false;

    this.downPoint = undefined;
    this.lastPoint = undefined;
}  //@ sourceURL=kinetic_node.js