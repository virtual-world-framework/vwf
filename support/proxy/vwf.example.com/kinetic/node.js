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

//@ sourceURL=kinetic_node.js