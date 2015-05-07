this.initialize = function() {
    this.previousVisible = undefined;
    this.previousListening = undefined;
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

this.toggleListening = function() {

    // isListening will take care of 'inherit', and 
    // trace up through the scene graph to determine
    // if the current state is listening or not
    if ( this.isListening ) {
        this.listening = this.previousListening ? this.previousListening : false;
    } else {
        this.listening = this.previousListening ? this.previousListening : true;  
    }

    var listen = this.listening;

    if ( listen === 'inherit' ) {
        this.previousListening = 'inherit';
    } else {
        this.previousListening = undefined;
    } 

}

//@ sourceURL=kinetic_node.js