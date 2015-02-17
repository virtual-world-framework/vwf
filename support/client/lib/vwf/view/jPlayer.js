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

            initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
                this.satProperty(nodeID, propertyName, propertyValue);
            },

            calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
                var node = this.state.nodes[nodeID]; 

                if( node ){
                    var containerSelector = "#" + node.containerDivId;
                    var playerSelector = "#" + node.playerDivId;

                    switch ( methodName ){
                        //We cannot safely call .show() or .hide() on the jPlayer div
                        //See http://jplayer.org/latest/developer-guide/#jPlayer-disable-by-css
                        case "show":
                            var contX = node.containerSize[0];
                            var contY = node.containerSize[1];
                            var playerX = node.playerSize[0];
                            var playerY = node.playerSize[1];
                            
                            $( containerSelector ).css('width', contX);
                            $( containerSelector ).css('height', contY);
                            $( playerSelector ).css('width', playerX);
                            $( playerSelector ).css('height', playerY);
                            break;
                            
                        case "hide":
                            $( containerSelector ).css('width', 0);
                            $( containerSelector ).css('height', 0);
                            $( playerSelector ).css('width', 0);
                            $( playerSelector ).css('height', 0);
                            break;
                    }
                }
            },

    		satProperty: function ( nodeID, propertyName, propertyValue ) {
                var node = this.state.nodes[nodeID];
                if( node && propertyValue ){
                    switch( propertyName ){
                        case "containerDivSize":
                            node.containerDivSize = propertyValue;
                            break;
                        case "playerDivSize":
                            node.playerDivSize = propertyValue;
                            break;
                    }
                }
    		}
    	});
    }
);