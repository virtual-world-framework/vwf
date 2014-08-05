this.initialize = function() {
	this.pointerIsDown = false;
	this.lastPointerLocation = null;
}

this.pointerDown = function( eventData, nodeData ) {

	this.pointerIsDown = true;
	this.lastPointerLocation = eventData.location;

}

this.pointerMove = function( eventData, nodeData ) {

	if ( this.draggable && this.pointerIsDown ) {
		// if ( this.client !== this.moniker ) {
		// 	var loc = [ this.x, this.y ];

		// 	console.info( "dx: " + ( eventData.location[ 0 ] - this.lastPointerLocation[ 0 ] ) ); 
		// 	console.info( "dy: " + ( eventData.location[ 1 ] - this.lastPointerLocation[ 1 ] ) );

		// 	loc[ 0 ] += eventData.location[ 0 ] - this.lastPointerLocation[ 0 ];
		// 	loc[ 1 ] += eventData.location[ 1 ] - this.lastPointerLocation[ 1 ];
		// 	this.x = loc[ 0 ];
		// 	this.y = loc[ 1 ];
		// 	this.lastPointerLocation = eventData.location;
		// }
		if ( this.client === this.moniker ) {
			vwf_view.kernel.setProperty( this.id, "x", this.x );
			vwf_view.kernel.setProperty( this.id, "y", this.y );
		}

	}
}

this.pointerUp = function( eventData, nodeData ) {

	if ( this.draggable ) {
		// if ( this.client !== this.moniker ) {
		// 	var loc = [ this.x, this.y ];
		// 	loc[ 0 ] += eventData.location[ 0 ] - this.lastPointerLocation[ 0 ];
		// 	loc[ 1 ] += eventData.location[ 1 ] - this.lastPointerLocation[ 1 ];
		// 	this.x = loc[ 0 ];
		// 	this.y = loc[ 1 ];
		// }
		if ( this.client === this.moniker ) {
			vwf_view.kernel.setProperty( this.id, "x", this.x );
			vwf_view.kernel.setProperty( this.id, "y", this.y );
		}
	}
	
	this.pointerIsDown = false;
	this.lastPointerLocation = null;
}  //@ sourceURL=kinetic_node.js