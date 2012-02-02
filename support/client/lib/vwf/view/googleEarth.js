define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/document extends a view interface up to the browser document. When vwf/view/document
    // is active, scripts on the main page may make (reflected) kernel calls:

    //     window.vwf_view.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
    //         childSource, childType, childName, function( childID ) {
    //         ...
    //     } );

    // And receive view calls:

    //     window.vwf_view.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
    //         childSource, childType, childName, callback /* ( ready ) */ ) {
    //         ...
    //     }

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {

            if ( !this.state ) {   
                this.state = {};
            }
            if ( !this.state.scenes ) {   
                this.state.scenes = {};
            }
            if ( !this.state.nodes ) {   
                this.state.nodes = {};
            }
 
            this.height = 600;
            this.width = 800;

            if ( window && window.innerHeight ) this.height = window.innerHeight - 20;
            if ( window && window.innerWidth ) this.width = window.innerWidth - 20; 
            
            this.logger.enable = true;
            this.win = window;

        },
  
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childName, callback /* ( ready ) */ ) {

            if ( childExtendsID === undefined )
                return;

            this.logger.info( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            var node = {
                parentID: nodeID,
                ID: childID,
                extendsID: childExtendsID,
                implementsIDs: childImplementsIDs,
                source: childSource,
                type: childType,
                name: childName,
                loadComplete: callback,
            };
            var win;
    
            switch ( childExtendsID.toLowerCase() ) {
                case "http-vwf-example-com-types-googleearth":
                    this.state.scenes[ childID ] = node;
                    var outerDiv = jQuery('body').append(
                        "<div id='map3d' style='border: 1px solid silver; width: " + this.width + "px; height: " + this.height + "px;'></div>"
                       //"<div id='ui' style='position: relative;'>" +
                       //  "<div id='map3d' style='border: 1px solid silver; width: " + this.width + "px; height: " + this.height + "px;'></div>" +
                       //"</div>"
                    );
//                    ).children(":last");
                    break;

                case "http-vwf-example-com-types-node3":
                    
                    this.state.nodes[ childID ] = node;

                    if ( childID == "http-vwf-example-com-types-node3-earth" ) {
//                        google.setOnLoadCallback( init );
//                        google.load( "earth", "1" );
//                        win = this.win;

//                        function init() {
//                            google.earth.createInstance( "map3d", initCB, failureCB );
//                        }

//                        function initCB( instance ) {
//                            ge = instance;
//                            ge.getWindow().setVisibility(true);
//    
//                            // add a navigation control
//                            ge.getNavigationControl().setVisibility(ge.VISIBILITY_AUTO);
//    
//                            // add some layers
//                            ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true);
//                            ge.getLayerRoot().enableLayerById(ge.LAYER_ROADS, true);

//                            var la = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
//                            la.setRange(100000);
//                            ge.getView().setAbstractView(la);
//    
//                            document.getElementById('installed-plugin-version').innerHTML =
//                            ge.getPluginVersion().toString();
//                        }
//  
//                        function failureCB( errorCode ) {
//                            console.info( "google earth load error: " + errorCode );
//                        }

                        
                        var interval;
                        var view = this;
                        win = this.win;
                        var gg = google;
                        interval = win.setInterval( function() {
                            if ( gg.earth ) {
                                gg.earth.createInstance( "map3d", function(instance) {
                                    ge = instance;
                                    ge.getWindow().setVisibility(true);
    
                                    // add a navigation control
                                    ge.getNavigationControl().setVisibility(ge.VISIBILITY_AUTO);
    
                                    // add some layers
                                    ge.getLayerRoot().enableLayerById(ge.LAYER_BORDERS, true);
                                    ge.getLayerRoot().enableLayerById(ge.LAYER_ROADS, true);

                                    var la = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
                                    la.setRange(100000);
                                    ge.getView().setAbstractView(la);
    
                                    document.getElementById('installed-plugin-version').innerHTML =
                                    ge.getPluginVersion().toString();
                                }, function(errorCode) {
                                    console.info( "google earth load error: " + errorCode );
                                } );
                                win.clearInterval( interval );
                            }
                        }, 1000 );
                    }
                    break;

            }


        }, 

        deletedNode: function (nodeID) {
        },
  
        createdProperty: function (nodeID, propertyName, propertyValue) {
        },        

        satProperty: function (nodeID, propertyName, propertyValue) {
        },

        gotProperty: function (nodeID, propertyName, propertyValue) {
        },
        
        

     } );



} );