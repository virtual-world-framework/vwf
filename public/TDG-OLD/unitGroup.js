this.initialize = function() {
    // need to add a listener for the unit's affiliation to change
    // update the color of the threatShape

    this.future(0).setupListeners();
}

this.setupListeners = function() {
    var self = this;
    if ( this.icon && this.icon.imageGenerator ) {
        this.icon.imageGenerator.affiliationChanged = function( affiliation ) {
            if ( self.threatArea ) {

                switch ( affiliation ) {
                    case "hostile":
                        self.threatArea.fill = 'red';
                        break;        
                    case "neutral": 
                        self.threatArea.fill = 'lime';
                        break;
                    case "friendly":
                        self.threatArea.fill = 'lightblue';
                        break; 
                    default: 
                        self.threatArea.fill = 'yellow';
                        break;
                };
            }
        }
    }
}

this.updateThreatShape$ = function() {

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
                color = 'lightblue';
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
            console.info( "Unknown threat shape: " + this.threatShape );
            break;

    }

    if ( newShape ) {
        this.children.create( "threatArea", newShape );
        this.threatShapeChanged( this.threatShape );
    }

}

//@ sourceURL=unitGroup.js