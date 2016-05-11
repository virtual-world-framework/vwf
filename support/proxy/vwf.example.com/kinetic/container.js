this.deleteChildNode = function( id ) {
	var child = undefined;
	for ( var i = 0; i < this.children.length && child === undefined; i++ ) {
		if ( id === this.children[ i ].id ) {
			child = this.children[ i ];	
		}
	}
	if ( child ) {
		this.children.delete( child );
	}
} //# sourceURL=kinetic_container.js