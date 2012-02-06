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
                    );
                    break;

                case "http-vwf-example-com-types-node3":
                    
                    this.state.nodes[ childID ] = node;
                    var view = this;
                    if ( childID == "http-vwf-example-com-types-node3-earth" ) {
                       
                        var interval;
                        var view = this;
                        win = this.win;
                        var gg = google;
                        interval = win.setInterval( function() {
                            if ( gg.earth ) {
                                node.earth = gg.earth;
                                gg.earth.createInstance( "map3d", function(instance) {
                                    
                                    node.earthInst = instance;
                                    node.earthInst.getWindow().setVisibility(true);
    
                                    // add a navigation control
                                    node.earthInst.getNavigationControl().setVisibility(node.earthInst.VISIBILITY_AUTO);
    
                                    // add some layers
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_BORDERS, true);
                                    node.earthInst.getLayerRoot().enableLayerById(node.earthInst.LAYER_ROADS, true);

                                    var la = node.earthInst.getView().copyAsLookAt(node.earthInst.ALTITUDE_RELATIVE_TO_GROUND);
                                    la.setRange(100000);
                                    node.earthInst.getView().setAbstractView(la);
    
//                                    document.getElementById('installed-plugin-version').innerHTML =
//                                    node.earthInst.getPluginVersion().toString();


                                    view.sendCameraInfo = false;
                                    // view changed event listener
                                    gg.earth.addEventListener( node.earthInst.getView(), 'viewchange', function() {
                                        view.sendCameraInfo = true;    
                                    });

                                    // view changed END event listener
                                    gg.earth.addEventListener( node.earthInst.getView(), 'viewchangeend', function() {
                                        sendCameraInfo = false;
                                    });

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

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
            var value = undefined;
            var lookAt, earth, ge;
            var earth = this.state.nodes[ "http-vwf-example-com-types-node3-earth" ];
            if ( propertyValue && this.kernel.client() != this.kernel.moniker() ) {
                 this.logger.info( "satProperty", nodeID, propertyName, propertyValue );
                switch ( nodeID ) {
                    case "http-vwf-example-com-types-node3-lookAt":
                        if ( earth && earth.earthInst ) {
                            ge = earth.earthInst;
                            lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
                            switch ( propertyName ) {
                                case "longitude":
                                    lookAt.setLongitude( propertyValue );
                                    ge.getView().setAbstractView(lookAt);
                                    value = propertyValue; 
                                    break;
                                case "latitude":
                                    lookAt.setLatitude( propertyValue );
                                    ge.getView().setAbstractView(lookAt);
                                    value = propertyValue;  
                                    break;
                                case "longLat":
                                    lookAt.setLongitude( propertyValue[0] );
                                    lookAt.setLatitude( propertyValue[0] );
                                    ge.getView().setAbstractView(lookAt);
                                    value = propertyValue;  
                            }
                    } 
                }
            }
            return value;

        },

        gotProperty: function (nodeID, propertyName, propertyValue) {

            var value = undefined;
            var lookAt, earth, ge;
            var earth = this.state.nodes[ "http-vwf-example-com-types-node3-earth" ];
            switch ( nodeID ) {
                case "http-vwf-example-com-types-node3-lookAt":
                    if ( earth && earth.earthInst ) {
                        ge = earth.earthInst;
                        lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
                        switch ( propertyName ) {
                            case "longitude":
                                value = lookAt.getLongitude();
                                break;
                            case "latitude":
                                value = lookAt.getLatitude();
                                break;
                            case "longLat":
                                value = [ lookAt.getLongitude(), lookAt.getLatitude() ];
                                break;
                        }
                } 
            }
            propertyValue = value;
            return value;

        },

        ticked: function( time ) {
            var node, ge;
            if ( this.sendCameraInfo ) {
                if ( this.state.nodes[ "http-vwf-example-com-types-node3-earth" ] ) {
                    node = this.state.nodes[ "http-vwf-example-com-types-node3-earth" ];
                    ge = node.earthInst;
                    if ( ge ) {
                        var lookAt = ge.getView().copyAsLookAt( ge.ALTITUDE_RELATIVE_TO_GROUND );
                        var longLat = [ lookAt.getLongitude(), lookAt.getLatitude() ];                          

                        this.kernel.setProperty( "http-vwf-example-com-types-node3-lookAt", "longLat", longLat );

//                        vwf.setProperty( "http-vwf-example-com-types-node3-lookAt", "longitude", lookAt.getLongitude() );
//                        vwf.setProperty( "http-vwf-example-com-types-node3-lookAt", "latitude", lookAt.getLatitude() );
                    }
                }  
            }
        },
        
        

     } );



} );