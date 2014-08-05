this.initialize = function() {
	this.initialDownPoint = undefined;
	this.drawingObject = undefined;
	this.nameIndex = 1;
};

this.pointerDown = function( eventData, nodeData ) {
	
	var compExtends = undefined;

	switch ( this.drawing_mode ) {
		
		case "arc":
		case "circle":
		case "ellipse":
		case "image":
		case "line":
		case "regularPolygon":
		case "rect":
		case "ring":
		case "sprite":
		case "star":
		case "text":
		case "wedge":
			compExtends	= "http://vwf.example.com/kinetic/"+this.drawing_mode+".vwf"; 
			break;

		case 'none':
		default:
			break;

	}

	if ( compExtends !== undefined ) {
		this.initialDownPoint = eventData.location;
		var parents = this.find( this.drawing_parentPath );
		var parent = parents.length > 0 ? parents[ 0 ] : this;
		var shapeDef = {
			"extends": compExtends,
			"properties": {
				"visible": false,
				"position": eventData.location,
				"fill": this.drawing_color,
				"opacity": this.drawing_opacity
			}
		};
		var self = this;
		var name = this.drawing_mode + this.nameIndex;
		this.nameIndex++;
		parent.children.create( name, shapeDef, function( child ) {
			self.drawingObject = child;
		} ); 
	}

};

this.pointerMove = function( eventData, nodeData ) {
	this.update( eventData, nodeData );
};

this.pointerUp = function( eventData, nodeData ) {
	if ( this.drawingObject !== undefined  ) {
		this.update( eventData, nodeData );
		this.shapeCreated( this.drawingObject.id );
	}
	this.drawingObject = undefined;
}; 

this.update = function( eventData, nodeData ) {
	if ( this.drawingObject !== undefined ) {
		if ( this.drawingObject.visible !== this.drawing_visible ) {
			this.drawingObject.visible = this.drawing_visible;
		}
		var diffX = eventData.location[ 0 ] - this.initialDownPoint[ 0 ];
		var diffY = eventData.location[ 1 ] - this.initialDownPoint[ 1 ];

		switch ( this.drawing_mode ) {
			
			case "arc":
				break;

			case "circle":
				this.drawingObject.radius = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );
				break;

			case "ellipse":
				break;

			case "image":
				break;

			case "line":
				this.drawingObject.points = [ this.initialDownPoint[ 0 ], this.initialDownPoint[ 1 ], eventData.location[ 0 ], eventData.location[ 1 ] ];
				break;

			case "regularPolygon":
				break;

			case "rect":
				break;

			case "ring":
				var radius = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );
				this.drawingObject.outerRadius = radius - this.drawing_width;
				this.drawingObject.outerRadius = radius;
				break;

			case "sprite":
				break;

			case "star":
				break;

			case "text":
				break;

			case "wedge":
				break;

			default:
				break;

		}		
	}	
}; //@ sourceURL=kinetic_drawing.js
