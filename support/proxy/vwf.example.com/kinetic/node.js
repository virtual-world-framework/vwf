this.initialize = function() {
    this.previousVisible = undefined;
    this.previousListening = undefined;

    // If the value of supportMouseAndTouchEvents is true, this code ensures that the view receives
    // an initializedProperty or satProperty call for it.
    // This is needed for the view to set up mouse and touch event handlers.
    // We do this here to avoid making the view issue a getProperty to the reflector for every
    // node in order to know its property value.
    if ( this.supportMouseAndTouchEvents ) {
        this.supportMouseAndTouchEvents = true;
    }
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

//# sourceURL=kinetic_node.js