// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

/// vwf/model/blockly.js is the driver for the Google blockly visual programming language.
/// 
/// @module vwf/model/blockly
/// @requires vwf/model ... and others

define( [ "module", "vwf/model", "vwf/utility", "vwf/utility/color", "jquery", "vwf/model/blockly/blockly_compressed", "vwf/model/blockly/blocks_compressed" ], function( module, model, utility, Color, $, Blockly ) {

    var self;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
        	self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { options = {}; }

            if ( this.state === undefined ) {   
                this.state = {};
            }
            if ( this.state.nodes === undefined ) {   
                this.state.nodes = {};
            }
            if ( this.state.prototypes === undefined ) {   
                this.state.prototypes = {};
            }

            this.state.executingBlocks = false;

            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "prototypes": false
            };

        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            // If the parent nodeID is 0, this node is attached directly to the root and is therefore either 
            // the scene or a prototype.  In either of those cases, save the uri of the new node
            var childURI = ( nodeID === 0 ? childIndex : undefined );

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            //if ( childName == "robot" ) {
            //    debugger;
            //}
            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = ifPrototypeGetId( nodeID, childID );
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
                    uri: childURI,
                    name: childName
                };
                return;                
            }

            var protos = getPrototypes( childExtendsID );
            var createNode = function() {
                return {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsIDs: childImplementsIDs,
                    source: childSource,
                    type: childType,
                    name: childName,
                    loadComplete: callback,
                    prototypes: protos
                };
            }; 

            if ( isBlockly3Node( protos ) ) {
                
                this.state.nodes[ childID ] = node = createNode();
                
                // hack for the demo, 
                if ( Blockly.Blocks.vwfNodes === undefined ) {
                    Blockly.Blocks.vwfNodes = {};
                }
                Blockly.Blocks.vwfNodes[ childName ] = childID;
            }

        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {

            if ( this.debug.initializing ) {
                this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 

        },

        deletingNode: function( nodeID ) {
            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }
        },

        addingChild: function( nodeID, childID, childName ) {
            if ( this.debug.parenting ) {
                this.logger.infox( "addingChild", nodeID, childID, childName );
            }
        },

        movingChild: function( nodeID, childID, childName ) {
            if ( this.debug.parenting ) {
                this.logger.infox( "movingChild", nodeID, childID, childName );
            }
        },

        removingChild: function( nodeID, childID, childName ) {
            if ( this.debug.parenting ) {
                this.logger.infox( "removingChild", nodeID, childID, childName );
            }
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ];
            if ( node !== undefined ) {
                value = this.settingProperty( nodeID, propertyName, propertyValue );                  
            }

            return value;
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ];
            if ( node !== undefined ) {
                value = this.settingProperty( nodeID, propertyName, propertyValue );                  
            }

            return value;
            
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if ( node === undefined ) { 
                if ( nodeID == this.kernel.application() ) {
                    if ( propertyName == "executing" ) {
                        if ( this.state.executingBlocks != Boolean( propertyValue ) ) {
                            value = this.state.executingBlocks = Boolean( propertyValue ); 
                        }
                    }
                }
                return value; 
            }

            if ( validPropertyValue( propertyValue ) ) {
                switch ( propertyName ) {
                    case "":
                        break;

                    default:
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
            if ( node === undefined ) { 
                if ( nodeID == this.kernel.application() ) {
                    if ( propertyName == "executing" ) {
                        value = this.state.executingBlocks; 
                    }
                }                

                return value; 
            }


            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
            return undefined;
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
            return undefined;
        },

        // == ticking =============================================================================

        ticking: function( vwfTime ) {
        }



    } );

    function getPrototypes( extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = self.kernel.prototype( id );
        }
                
        return prototypes;
    }

    function ifPrototypeGetId( nodeID, childID ) {
        var ptID = undefined;
        if ( ( nodeID === 0 && childID != self.kernel.application() ) || self.state.prototypes[ nodeID ] !== undefined ) {
            if ( nodeID !== 0 || childID != self.kernel.application() ) {
                ptID = nodeID ? nodeID : childID;
                if ( self.state.prototypes[ ptID ] !== undefined ) {
                    ptID = childID;
                }
                return ptID;
            } 
        }
        return undefined;
    }

    function isBlockly3Node( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http-vwf-example-com-blockly-blockly3-vwf" ); 
            }
        }

        return found;
    }

    function validPropertyValue( obj ) {
        var objType = ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        return ( objType != 'null' && objType != 'undefined' );
    }

} );
