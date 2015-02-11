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
            createdProperty: function (nodeID, propertyName, propertyValue) {
                this.satProperty(nodeID, propertyName, propertyValue);
             },

        // -- initializedProperty ----------------------------------------------------------------------

            // initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
            //     this.satProperty(nodeID, propertyName, propertyValue);
            // },

    		satProperty: function ( nodeID, propertyName, propertyValue ) {
                var node = this.state.nodes[nodeID];
                if( node && propertyValue ){
                    switch(propertyName){
                        case "z_index":
                            var containerSelector = "#" + node.containerDivId;
                            $(containerSelector).css('z-index', propertyValue);
                            // $("#jp_container_1").css('z-index', 103); 
                            break;
                    }
                }
    		}
    	});
    }
);