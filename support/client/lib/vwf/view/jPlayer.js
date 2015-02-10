/// vwf/view/jPlayer.js is a sound/video driver
/// 
/// @module vwf/model/jPlayer
/// @requires vwf/model

define( [   
        "module", 
        "vwf/view", 
        "jquery"
    ], function( module, view, $ ) {
    	return view.load( module, {
    		satProperty: function ( nodeID, propertyName, propertyValue ) {
                switch(propertyName){
                    case "z_index":
                        var node = this.state.nodes[nodeID];
                        var containerSelector = "#" + node.containerDivId;
                        $(containerSelector).css('z-index', z_index);
                        break;
                }
    		}
    	});
    }
);