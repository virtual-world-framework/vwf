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
            this.pointerDown = false;
            this.viewChanged = false;
            this.receivedChange = true;
            this.elapsedTime = 0;

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
                case "http-vwf-example-com-googleearth-vwf":
                    this.state.scenes[ childID ] = node;
                    var outerDiv = jQuery('body').append(
                        "<div id='map3d' style='border: 1px solid silver; width: " + this.width + "px; height: " + this.height + "px;'></div>"
                    );
                    break;

                case "http-vwf-example-com-node3-vwf":
                    
                    this.state.nodes[ childID ] = node;
                    var view = this;
                    if ( childID == "http-vwf-example-com-node3-vwf-earth" ) {
                       
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
                                    node.earthInst.getOptions().setFlyToSpeed( node.earthInst.SPEED_TELEPORT );


                                    var la = node.earthInst.getView().copyAsLookAt(node.earthInst.ALTITUDE_RELATIVE_TO_GROUND);
                                    la.setRange(100000);
                                    node.earthInst.getView().setAbstractView(la);
    
//                                    document.getElementById('installed-plugin-version').innerHTML =
//                                    node.earthInst.getPluginVersion().toString();


                                    view.viewChanged = false;
                                    view.pointerDown = false;

                                    gg.earth.addEventListener( node.earthInst.getWindow(), 'mousedown', function() {
                                        view.pointerDown = true; 
                                        view.receivedChange = false;   
                                    });
                                    gg.earth.addEventListener( node.earthInst.getWindow(), 'mouseup', function() {
                                        view.pointerDown = false;    
                                    });

                                    // view changed event listener
                                    gg.earth.addEventListener( node.earthInst.getView(), 'viewchange', function() {
                                        view.viewChanged = true;    
                                    });

                                    // view changed END event listener
                                    gg.earth.addEventListener( node.earthInst.getView(), 'viewchangeend', function() {
                                        view.viewChanged = false;
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
            var earth = this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ];
            if ( propertyValue && this.kernel.client() != this.kernel.moniker() ) {
                this.receivedChange = true;
                //this.logger.info( "satProperty", nodeID, propertyName, propertyValue );
                switch ( nodeID ) {
                    case "http-vwf-example-com-node3-vwf-lookAt":
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
                                case "cameraData":
                                    lookAt.setLongitude( propertyValue[0] );
                                    lookAt.setLatitude( propertyValue[1] );
                                    lookAt.setAltitude( propertyValue[2] );
                                    lookAt.setAltitudeMode( propertyValue[3] );
                                    lookAt.setHeading( propertyValue[4] );
                                    lookAt.setTilt( propertyValue[5] );
                                    lookAt.setRange( propertyValue[6] );
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
            var la, earth, ge;
            var earth = this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ];
            switch ( nodeID ) {
                case "http-vwf-example-com-node3-vwf-lookAt":
                    if ( earth && earth.earthInst ) {
                        ge = earth.earthInst;
                        la = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
                        switch ( propertyName ) {
                            case "longitude":
                                value = la.getLongitude();
                                break;
                            case "latitude":
                                value = la.getLatitude();
                                break;
                            case "cameraData":
                                value = [ la.getLongitude(), la.getLatitude(), la.getAltitude(),
                                               la.getAltitudeMode(), la.getHeading(), la.getTilt(), la.getRange()  ];
                                break;
                        }
                } 
            }
            propertyValue = value;
            return value;

        },

        ticked: function( time ) {
            var node, ge;
            if ( this.pointerDown || ( this.viewChanged && !this.receivedChange ) ) {
                if ( this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ] ) {
                    node = this.state.nodes[ "http-vwf-example-com-node3-vwf-earth" ];
                    ge = node.earthInst;
                    if ( ge ) {
                        this.elapsedTime += time * 0.001;
                        if ( this.elapsedTime >= 0.0333 ) {
                            var la = ge.getView().copyAsLookAt( ge.ALTITUDE_RELATIVE_TO_GROUND );
                            var cameraData = [ la.getLongitude(), la.getLatitude(), la.getAltitude(),
                                               la.getAltitudeMode(), la.getHeading(), la.getTilt(), la.getRange()  ];                          

                            this.kernel.setProperty( "http-vwf-example-com-node3-vwf-lookAt", "cameraData", cameraData );
                            this.elapsedTime = 0;
                        }

//                        this.kernel.setProperty( "http-vwf-example-com-node3-vwf-lookAt", "longitude", lookAt.getLongitude() );
//                        this.kernel.setProperty( "http-vwf-example-com-node3-vwf-lookAt", "latitude", lookAt.getLatitude() );
                    }
                }  
            }
        },
        
        

     } );



} );