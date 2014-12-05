this.addListener = function( eventName, callbackMethodName ) {
    this.eventMap[ eventName ] = callbackMethodName;
}

this.removeListener = function( eventName ) {
    delete this[ eventName ];
}

//@ sourceURL=http://vwf.example.com/eventManager.js