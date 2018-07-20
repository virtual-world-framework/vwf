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

    // Now that unitGroup is complete, show it
    this.visible = "inherit";
}

this.handleRender = function( img, iconSize, symbolCenter, symbolBounds ){
    
    this.zIndex = 20;

    if ( this.threatArea ) {
        this.threatArea.position = this.icon.symbolCenter;    
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

this.setPositionFromMapPosition = function() {
    var symbolCenter = ( this.icon || {} ).symbolCenter || {
        x: 0,
        y: 0
    }
    this.position = {
        x: this.mapPosition.x - this.scaleX * symbolCenter.x,
        y: this.mapPosition.y - this.scaleY * symbolCenter.y
    };

    //# sourceURL=unitGroup.setPositionFromMapPosition
}

this.setMapPositionFromPosition = function( konvaObjectPosition, scale ) {
    var symbolCenter = ( this.icon || {} ).symbolCenter || {
        x: 0,
        y: 0
    };
    this.mapPosition = {
        x: konvaObjectPosition.x + scale * symbolCenter.x,
        y: konvaObjectPosition.y + scale * symbolCenter.y,
    }

    //# sourceURL=unitGroup.setMapPositionFromPosition
}

//# sourceURL=unitGroup.js
