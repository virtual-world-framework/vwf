this.initialize = function() {
    //this.future(0).initBaseLayer();
}

this.login = function( clientID, userName, isInstructor ) {

    this.instructor = isInstructor;
    this.visibleName = userName;

    this.participantAdded( userName, isInstructor );
    this.initBaseLayer( clientID );
}

this.initBaseLayer = function( clientID ) {

    var app = this.parent;
    while ( app.parent.parent !== undefined ) {
        app = app.parent;
    }

    app.createLayer( clientID, "baseLayer" );

}