/// vwf/model/buzz.js is a sound driver
/// 
/// @module vwf/model/buzz
/// @requires vwf/model

define( [   
        "module", 
        "vwf/model", 
        "vwf/utility" 
    ], function( module, model, utility ) {

    var self;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
        	self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            this.options = options || {};

            this.state = {
                "nodes": {},
                "stages": {},
                "prototypes": {},
                "createLocalNode": function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {
                    return {
                        "parentID": nodeID,
                        "ID": childID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType,
                        "name": childName,
                        "prototypes": undefined,
                        "delayedProperties": undefined,
                        "soundObj": undefined,
                        "isPlaying": false
                    };
                },
                "is3DSoundComponent": function( prototypes ) {
                    var found = false;
                    if ( prototypes ) {
                        for ( var i = 0; i < prototypes.length && !found; i++ ) {
                            found = ( prototypes[ i ].indexOf( "http-vwf-example-com-sound3-vwf" ) != -1 );    
                        }
                    }
                    return found;
                },
                "isSoundComponent": function( prototypes ) {
                    var found = false;
                    if ( prototypes ) {
                        for ( var i = 0; i < prototypes.length && !found; i++ ) {
                            found = ( prototypes[ i ].indexOf( "http-vwf-example-com-sound-vwf" ) != -1 );    
                        }
                    }
                    return found;
                }
            };

            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "method": false,
                "prototypes": false
            };

        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = ifPrototypeGetId.call( this, nodeID, childID );
            if ( prototypeID !== undefined ) {
                
                if ( this.debug.prototypes ) {
                    this.logger.infox( "prototype: ", prototypeID );
                }

                this.state.prototypes[ prototypeID ] = {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsID: childImplementsIDs,
                    source: childSource, 
                    type: childType,
                    name: childName
                };
                return;                
            }

            var protos = getPrototypes( this.kernel, childExtendsID );

            if ( this.state.isSoundComponent( protos ) ) {

                // Create the local copy of the node properties
                if ( this.state.nodes[ childID ] === undefined ){
                    this.state.nodes[ childID ] = this.state.createLocalNode( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );
                }

                node = this.state.nodes[ childID ];
                
                node.prototypes = protos;
                node.is3DSound = this.state.is3DSoundComponent( protos );

            } 


        },

        // initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
        //     childSource, childType, childIndex, childName ) {

        //     if ( this.debug.initializing ) {
        //         this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
        //     } 

        //     var node = this.state.nodes[ nodeID ]; 
        // },

        deletingNode: function( nodeID ) {
            
            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

            if ( this.state.node.nodes[ childID ] ) {
                delete this.state.nodes[ childID ];
            }

        },

        // addingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "addingChild", nodeID, childID, childName );
        //     }
        // },

        // movingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "movingChild", nodeID, childID, childName );
        //     }
        // },

        // removingChild: function( nodeID, childID, childName ) {
        //     if ( this.debug.parenting ) {
        //         this.logger.infox( "removingChild", nodeID, childID, childName );
        //     }
        // },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

            return this.settingProperty( nodeID, propertyName, propertyValue );
            
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if( node === undefined ) return;


            if ( propertyName !== "url" && node.soundObj === undefined ) {

                if ( node.delayedProperties === undefined ) {
                    node.delayedProperties = {};    
                }
                node.delayedProperties[ propertyName ] = Boolean( propertyValue ); 

            } else {
                
                switch ( propertyName ) {
                    
                    case "url": 
                        if ( node.soundObj !== undefined ) {
                            node.soundObj.set( "src", propertyValue );
                        } else {
                             
                            var soundProps;

                            if ( propertyValue.indexOf( 'data:audio' ) === 0 ) {
                                soundProps = { 
                                    "preload": "metadata"
                                };
                            } else if ( require( "vwf/utility" ).hasFileType( propertyValue ) ) {
                                var fType = require( "vwf/utility" ).fileType( propertyValue );
                                soundProps= { 
                                    "preload": "metadata",
                                    "formats": [ fType ]
                                };                                 
                            } else {
                                soundProps= { 
                                    "preload": "metadata",
                                    "formats": [ "ogg", "mp3", "aac", "wav" ]
                                };                                 
                            }

                            for ( var prop in node.delayedProperties ) {
                                switch ( prop ) {

                                    case "play":
                                        soundProps[ 'autoplay' ] = Boolean( node.delayedProperties[ prop ] );
                                        break;

                                    default:
                                        soundProps[ prop ] = node.delayedProperties[ prop ];
                                        break;
                                }
                                
                            }
                            node.isPlaying = soundProps[ 'autoplay' ] ? true : false;
                            node.delayedProperties = undefined;
                            var buzz = require( "vwf/model/buzz/buzz.min" );
                            node.soundObj = new buzz.sound( propertyValue, soundProps ); 

                            self = this;

                            // http://buzz.jaysalvat.com/documentation/events/
                            node.soundObj.bind( "ended", function( e ) {
                                node.isPlaying = false;
                                self.kernel.fireEvent( node.ID, "soundEnded", [ true ] );
                            } );      

                            node.soundObj.bind( "playing", function( e ) {
                                node.isPlaying = true;
                                self.kernel.fireEvent( node.ID, "soundPlaying", [ true ] );
                            } );  

                            node.soundObj.bind( "canplay", function( e ) {
                                self.kernel.fireEvent( node.ID, "soundReady", [ true ] );
                            } );  

                        }                    
                        break;

                    case "play":
                        if ( node.soundObj !== undefined ) {
                            if ( Boolean( propertyValue ) ) {
                                node.soundObj.play();
                                node.isPlaying = true;
                            } else {
                                node.soundObj.stop();
                                node.isPlaying = false;
                            }  
                        }                      
                        break;

                    case "time":
                        if ( node.soundObj !== undefined ) {
                            node.soundObj.setTime( parseFloat( propertyValue ) );
                        }                      
                        break;

                    case "percent":
                        if ( node.soundObj !== undefined ) {
                            node.soundObj.setPercent( parseFloat( propertyValue ) );
                        }                      
                        break;

                    case "speed":
                        if ( node.soundObj !== undefined ) {
                            node.soundObj.setSpeed( parseFloat( propertyValue ) );
                        }                      
                        break;

                    case "muted":
                        if ( node.soundObj !== undefined ) {
                            if ( Boolean( propertyValue ) ) {
                                node.soundObj.mute();
                            } else {
                                node.soundObj.unmute();
                            }
                        }
                        break;

                    case "volume":
                        if ( node.soundObj !== undefined ) {
                            var newVolume = Number( propertyValue );
                            if ( newVolume >= 0 && newVolume <= 100 ) {
                                node.soundObj.setVolume( newVolume );    
                            }
                        }
                        break;

                    case "loop":
                        if ( node.soundObj !== undefined ) {
                            if ( Boolean( propertyValue ) ) {
                                node.soundObj.loop();
                            } else {
                                node.soundObj.unloop();
                            }
                        }
                        break;


                }                
            }



            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName ) {

            if ( this.debug.properties || this.debug.getting ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName );
            }

            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if( node === undefined || node.soundObj === undefined ) return;

            switch ( propertyName ) {
                
                case "url": 
                    value = node.soundObj.get( "src" );
                    break;

                case "play":
                    value = node.isPlaying;
                    break;

                case "time":
                    value = node.soundObj.getTime();
                    break;

                case "percent":
                    value = node.soundObj.getPercent();                    
                    break;

                case "speed":
                    value = node.soundObj.getSpeed();
                    break;

                case "muted":
                    value = node.soundObj.isMuted();
                    break;

                case "volume":
                    value = node.soundObj.getVolume();
                    break;

                case "loop":
                    value = node.soundObj.get( "loop" );
                    break;


            } 


            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) { 
            return undefined;

            if ( this.debug.method ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName );
            }

            var node = this.state.nodes[ nodeID ]; 
            var value = undefined;  

            if ( node !== undefined && node.soundObj !== undefined ) {
                switch( methodName ) {
                    case "pause":
                        node.isPlaying = false;
                        node.soundObj.pause();
                        break;
                }                 
            }

        
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        // executing: function( nodeID, scriptText, scriptType ) {
        //     return undefined;
        // },

        // == ticking =============================================================================

        // ticking: function( vwfTime ) {
            
        // }



    } );

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function ifPrototypeGetId( nodeID, childID ) {
        var ptID;
        if ( ( nodeID == 0 && childID != this.kernel.application() ) || this.state.prototypes[ nodeID ] !== undefined ) {
            if ( nodeID != 0 || childID != this.kernel.application() ) {
                ptID = nodeID ? nodeID : childID;
                if ( this.state.prototypes[ ptID ] !== undefined ) {
                    ptID = childID;
                }
                return ptID;
            } 
        }
        return undefined;
    }

} );
