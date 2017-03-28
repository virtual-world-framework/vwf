// Deprecated: This component exists only for backward compatibility
//             It was deprecated in v2.6.5

this.clientJoin = function() {
    console.warn( "drawing.clientJoin:",
        "This function is deprecated. Please resave scenario to remove the event handler." );

    // Remove all event handlers from this object
    var clients = this.find( "doc('http://vwf.example.com/clients.vwf')" )[ 0 ];
    clients.children.added = clients.events.flush( this );

    //# sourceURL=drawing.clientJoin
};

this.clientLeave = function() {
    console.warn( "drawing.clientLeave:",
        "This function is deprecated. Please resave scenario to remove the event handler." );

    // Remove all event handlers from this object
    var clients = this.find( "doc('http://vwf.example.com/clients.vwf')" )[ 0 ];
    clients.children.removed = clients.events.flush( this );
};
