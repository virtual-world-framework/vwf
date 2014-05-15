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

define( [ "module", "vwf/model", 
          "vwf/model/blockly/JS-Interpreter/acorn", 
          "vwf/model/blockly/blockly_compressed", "vwf/model/blockly/blocks_compressed", 
          "vwf/model/blockly/javascript_compressed", "vwf/model/blockly/msg/js/en"
        ], 
        function( module, model, acorn, Blockly ) {

    var self;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {

            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { 
                options = {}; 
            }
            if ( this.state === undefined ) {   
                this.state = {};
            }
            if ( this.state.nodes === undefined ) {   
                this.state.nodes = {};
            }
            if ( this.state.prototypes === undefined ) {   
                this.state.prototypes = {};
            }

            if ( this.state.blockly === undefined ) {
                this.state.blockly = { "node": undefined };
            }  

            this.state.executingBlocks = undefined;

            this.state.haltExecution = false;

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

            // interpreter documentation
            // https://neil.fraser.name/software/JS-Interpreter/docs.html

        },

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {

            // If the parent nodeID is 0, this node is attached directly to the root and is therefore either 
            // the scene or a prototype.  In either of those cases, save the uri of the new node
            var childURI = ( nodeID === 0 ? childIndex : undefined );

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

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


        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {

            if ( this.debug.initializing ) {
                this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 

            var node;
            var createNode = function() {
                return {
                    "parentID": nodeID,
                    "ID": childID,
                    "extendsID": childExtendsID,
                    "implementsIDs": childImplementsIDs,
                    "source": childSource,
                    "type": childType,
                    "name": childName,
                    
                    "blocks": "<xml></xml>",
                    "code": undefined,
                    "codeLine": -1,
                    "lastLineExeTime": undefined,
                    "timeBetweenLines": 1,
                    "interpreter": undefined,
                    "interpreterStatus": ""
                };
            }; 
            if ( isBlockly3Node( childID ) ) {
                this.state.nodes[ childID ] = node = createNode();
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

            var getJavaScript = function( node ) {
                var xml = Blockly.Xml.workspaceToDom( Blockly.getMainWorkspace() );
                
                Blockly.JavaScript.vwfID = node.ID;

                if ( xml ) { 
                    node.blocks = Blockly.Xml.domToText( xml );
                }
                //node.code = Blockly.JavaScript.workspaceToCode().split( '\n' );
            node.code = Blockly.JavaScript.workspaceToCode();
            };

            if ( nodeID == this.kernel.application() ) {
                if ( propertyName === "executingAll" ) {
                    var exe = Boolean( propertyValue );
                    if ( exe ) {
                        if ( this.state.executingBlocks === undefined ) {
                            this.state.executingBlocks = {};
                            for ( var id in this.state.nodes ) {
                                if ( this.state.blockly.node && id == this.state.blockly.node.ID ) {
                                    getJavaScript( node );
                                }
                                this.state.executingBlocks[ id ] = node; 
                                node.codeLine = -1;   
                            }    
                        }
                    } else {
                        this.state.executingBlocks = undefined;    
                    }
                }
            } else if ( ( node !== undefined ) && ( validPropertyValue( propertyValue ) ) ) {

                switch ( propertyName ) {
                    
                    case  "blockly_code":
                        value = node.code = propertyValue;
                        break;
                    
                    case "blockly_xml":
                        value = node.blocks = propertyValue;
                        break;

                    case "blockly_executing":
                        var exe = Boolean( propertyValue );
                        if ( exe ) {
                            if ( this.state.executingBlocks === undefined ) {
                                this.state.executingBlocks = {};
                            }
                            if ( this.state.blockly.node && nodeID == this.state.blockly.node.ID ) {
                                getJavaScript( node );
                            }
                            if ( this.state.executingBlocks[ nodeID ] === undefined ) {
                                this.state.executingBlocks[ nodeID ] = node;
                                node.codeLine = -1;
                            }
                        } else {
                            delete this.state.executingBlocks[ nodeID ];
                            var count = Object.keys( this.state.executingBlocks ).length;
                            if ( count === 0 ) {
                                this.state.executingBlocks = undefined;    
                            }
                        }
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

            var node = this.state.nodes[ nodeID ];
            var value = undefined;

            if ( nodeID == this.kernel.application() ) {
                
                // this is not quite right, need to check to see if 
                // all of the blocks are blockly_executing here
                if ( propertyName === "executingAll" ) {
                    value = ( this.state.executingBlocks !== undefined ); 
                }

            } else if ( node !== undefined ){
                switch ( propertyName ) {
                    
                    case "blockly_executing":
                        value = ( this.state.executingBlocks && this.state.executingBlocks[ nodeID ] !== undefined );
                        break;
                    
                    case "blockly_code":
                        value = node.code;
                        break;
                    
                    case "blockly_xml":
                        value = node.blocks;
                        break;

                }
            }               

            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
            var node = this.state.nodes[ nodeID ];

            if ( nodeID == this.kernel.application() ) {
                switch ( methodName ) {
                    case "stopAllExecution":
                        for ( var id in this.state.executingBlocks ) {
                            this.settingProperty( id, 'blockly_executing', false );
                        }
                        break;
                }
            } 
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        //executing: function( nodeID, scriptText, scriptType ) {
        //    return undefined;
        //},

        // == ticking =============================================================================

        ticking: function( vwfTime ) {
            
            if ( this.state.executingBlocks !== undefined ) {
                var blocklyNode = undefined;

                for ( var nodeID in this.state.executingBlocks ) {

                    blocklyNode = this.state.executingBlocks[ nodeID ];
                    executeNextLine = false;

                    if ( blocklyNode.interpreter === undefined ) {
                        blocklyNode.interpreter = createInterpreter( acorn, blocklyNode.code );
                        blocklyNode.interpreterStatus == "created";
                        blocklyNode.lastLineExeTime = vwfTime;
                        executeNextLine = true;
                    } else {
                        var elaspedTime = vwfTime - blocklyNode.lastLineExeTime;
                        if ( elaspedTime >= blocklyNode.timeBetweenLines ) {
                            executeNextLine = true;
                            blocklyNode.lastLineExeTime = vwfTime;
                        } 
                    }

                    if ( executeNextLine ) {

                        self.state.haltExecution = false;
                        
                        nextStep( blocklyNode );

                        this.kernel.fireEvent( nodeID, "blocklyExecuted", [ blocklyNode.interpreter.value ] ); 
                    }
                } 
            }

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

    function isBlockly3Node( nodeID ) {
        return self.kernel.test( nodeID,
            "self::element(*,'http://vwf.example.com/blockly/controller.vwf')",
            nodeID );
    }

    function validPropertyValue( obj ) {
        var objType = ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
        return ( objType != 'null' && objType != 'undefined' );
    }

    function nextStep( node ) {
        //var finishedProgram
        if ( node.interpreter !== undefined ) {
            var stepType = node.interpreter.step();
            
            switch ( stepType ) {
                
                case "stepProgram":
                    if ( node.interpreterStatus === "created" ) {
                        this.kernel.fireEvent( node.ID, "blocklyStarted", [ true ] );
                        blocklyNode.interpreterStatus = "started";                        
                    } else if ( node.interpreterStatus === "started" ) {
                        this.kernel.setProperty( node.ID, "blockly_executing", false );
                        this.kernel.fireEvent( node.ID, "blocklyStopped", [ blocklyNode.codeLine ] );
                        blocklyNode.interpreterStatus = "finished";
                    }
                    break;
            }

            if ( stepType && !self.state.haltExecution ) {
                // I'm not sure I understand the use setTimeout here??
                // anyone have an idea of why this would be better?
                window.setTimeout( nextStep( node ), 0 );
            }
        }
    }

    function createInterpreter( acorn, code ) {
        
        var initFunc = function( interpreter, scope ) {
            
            var myVwf = interpreter.createObject( interpreter.OBJECT );
            interpreter.setProperty( scope, 'vwf', myVwf );

            var numFunctions = [ 'callMethod', 'setProperty', 'getProperty', 'fireEvent' ];
            for ( var i = 0; i < numFunctions.length; i++ ) {
                var wrapper = ( function( nativeFunc ) {
                    return function() {
                        for ( var j = 0; j < arguments.length; j++) {
                            arguments[ j ] = arguments[ j ].toString();
                        }
                        self.state.haltExecution = true;
                        return interpreter.createPrimitive( nativeFunc.apply( vwf, arguments ));
                    };
                })( vwf[ numFunctions[ i ] ]);
                interpreter.setProperty( myVwf, numFunctions[ i ], interpreter.createNativeFunction( wrapper ) );
            }

        };
        return new Interpreter( acorn, code, initFunc );
    }


} );
