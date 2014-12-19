this.initialize = function() {
    this.previousVisible = undefined;
}

this.toggleVisibility = function() {

    // isVisible will take care of 'inherit', and 
    // trace up through the scene graph to determine
    // if the current state is visible or not
    if ( this.isVisible ) {
        this.visible = this.previousVisible ? this.previousVisible : false;
    } else {
        this.visible = this.previousVisible ? this.previousVisible : true;  
    }

    var viz = this.visible;

    if ( viz === 'inherit' ) {
        this.previousVisible = 'inherit';
    } else {
        this.previousVisible = undefined;
    } 

}

//@ sourceURL=kinetic_node.js