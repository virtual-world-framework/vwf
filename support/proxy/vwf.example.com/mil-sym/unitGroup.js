this.initialize = function() {

    if ( !!this.threatArea ) {
        if ( !this.threatArea.fill && !!this.threatArea.attributes && !!this.threatArea.attributes.fill ) {
            this.threatArea.fill = this.threatArea.attributes.fill;
        }

        this.threatArea.draggable = false;
    }

    if ( this.icon !== undefined && this.icon.imageGenerator !== undefined ) {

        this.icon.imageGenerator.affiliationChanged = this.events.add( function( affiliation ) {
            
            if ( this.threatArea ) {
                switch ( affiliation ) {
                    case "hostile":
                        this.threatArea.fill = 'red';
                        break;        
                    case "neutral": 
                        this.threatArea.fill = 'lime';
                        break;
                    case "friendly":
                        this.threatArea.fill = 'cyan';
                        break; 
                    default: 
                        this.threatArea.fill = 'yellow';
                        break;
                 }
            }

        }, this );

        this.icon.imageGenerator.imageRendered = this.events.add( function( img, iconSize, symbolCenter, symbolBounds ) {
            
            if ( this.threatArea ) {
                this.threatArea.position = this.icon.symbolCenter;    
            }

        }, this );

    }

}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){
    
    this.zIndex = 20;

    if ( this.threatArea ) {
        this.threatArea.position = this.icon.symbolCenter;    
    }
    if ( this.simData ) {
        this.simData.position = this.icon.symbolCenter; 
    }

}

this.updateThreatShape = function() {

    var visible = false;
    if ( this.threatArea ) {
        visible = this.threatArea.visible;
        this.children.delete( this.threatArea );
    }

    var newShape = undefined;
    var color = 'yellow';

    if ( this.icon && this.icon.imageGenerator ) {
        switch ( this.icon.imageGenerator.affiliation ) {
            case "hostile":
                color = 'red';
                break;        
            case "neutral": 
                color = 'lime';
                break;
            case "friendly":
                color = 'cyan';
                break; 
        };        
    }

    switch ( this.threatShape ) {
        
        case "rect":
            newShape = {                
                "extends": "http://vwf.example.com/kinetic/rect.vwf",
                "properties": {
                    "x": 20,
                    "y": 20,
                    "visible": visible,
                    "listening": false,
                    "width": 40,
                    "height": 40,
                    "opacity": 0.3,
                    "fill": color,
                    "fillEnabled": true, 
                    "draggable": false,
                    "zIndex": 2
                }
            };
            break;

        case "circle":
            newShape = {                
                "extends": "http://vwf.example.com/kinetic/circle.vwf",
                "properties": {
                    "x": 16,
                    "y": 16,
                    "visible": visible,
                    "listening": false,
                    "radius": 32,
                    "opacity": 0.3,
                    "fill": color,
                    "fillEnabled": true, 
                    "draggable": false,
                    "zIndex": 2
                }
            };
            break;

        case "wedge":
            newShape = {                
                "extends": "http://vwf.example.com/kinetic/wedge.vwf",
                "properties": {
                    "x": 16,
                    "y": 16,
                    "visible": visible,
                    "listening": false,
                    "width": 40,
                    "height": 40,
                    "angle": 40,
                    "radius": 32,
                    "opacity": 0.3,
                    "fill": color,
                    "fillEnabled": true, 
                    "draggable": false,
                    "zIndex": 2
                }
            };
            break;
    
        default:
            this.logger.info( "Unknown threat shape: " + this.threatShape );
            break;

    }

    if ( newShape ) {
        this.children.create( "threatArea", newShape );
        this.threatShapeChanged( this.threatShape );
    }

}

this.setAbsoluteMapPosition = function( mapPosition ) {
  if ( mapPosition !== undefined ) {
    this.mapPosition = mapPosition;
    this.position = {
      "x": this.mapPosition.x,
      "y": this.mapPosition.y
    };
  }
}

//# sourceURL=unitGroup.js