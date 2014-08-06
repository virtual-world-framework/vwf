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

		case "freeDraw":
			break;

		case 'none':
		default:
			break;

	}

	if ( compExtends !== undefined ) {
		this.initialDownPoint = eventData.layer;
		var parents = this.find( this.drawing_parentPath + "//shapes" );
		var parent = parents.length > 0 ? parents[ 0 ] : this;
		var shapeDef = {
			"extends": compExtends,
			"properties": {
				"visible": false,
				"position": eventData.layer,
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
		var diffX = eventData.layer[ 0 ] - this.initialDownPoint[ 0 ];
		var diffY = eventData.layer[ 1 ] - this.initialDownPoint[ 1 ];
		var pos = [ eventData.layer[ 0 ], eventData.layer[ 1 ] ];
		var width = diffX;	
		var height = diffY;


		console.info( "diffX = " + diffX + "     diffY = " + diffY );

		switch ( this.drawing_mode ) {
			
			case "arc":
				var radius = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );
				this.drawingObject.angle = 30;
				this.drawingObject.innerRadius = radius - this.drawing_width;
				this.drawingObject.outerRadius = radius;
				break;

			case "ellipse":
			case "circle":
				this.drawingObject.radius = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );
				break;

			case "line":
				this.drawingObject.points = [ this.initialDownPoint[ 0 ], this.initialDownPoint[ 1 ], eventData.layer[ 0 ], eventData.layer[ 1 ] ];
				break;

			case "regularPolygon":
				break;

			case "text":
			case "sprite":
			case "image":
			case "rect":
				if ( diffX < 0 ) {
					pos[ 0 ] += diffX;	
					width = Math.abs( diffX );
				} 
				if ( diffY < 0 ) {
					pos[ 1 ] += diffY;	
					height = Math.abs( diffY );
				} 
				this.drawingObject.position = pos;
				this.drawingObject.width = width;
				this.drawingObject.height = height;
				break;

			case "ring":
				var radius = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );
				this.drawingObject.innerRadius = radius - this.drawing_width;
				this.drawingObject.outerRadius = radius;
				break;

			case "star":
				var radius = Math.sqrt( ( diffX * diffX ) + ( diffY * diffY ) );
				this.drawingObject.points = 5;
				this.drawingObject.innerRadius = radius * 60;
				this.drawingObject.outerRadius = radius;
				break;

			case "wedge":
				break;

			default:
				break;

		}		
	}	
}; //@ sourceURL=kinetic_drawing.js
