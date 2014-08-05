this.initialize = function() {
	// need to add a listener for the unit's affiliation to change
	// update the color of the threatShape
}

this.updateThreatShape$ = function() {

	var sendChangedEvent = true;

	switch ( this.threatShape ) {
		
		case "rect":
			break;

		case "circle":
			break;

		case "wedge":
			break;
	
		default:
			sendChangedEvent = false;
			// what's the correct way to log a warning here
			console.info( "Unknown threat shape: " + this.threatShape );
			break;

	}

	if ( sendChangedEvent ) {
		this.threatShapeChanged( this.threatShape );
	}

}

//@ sourceURL=unitGroup.js