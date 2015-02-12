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

define( [ "module", "vwf/model", "vwf/utility",
          "vwf/model/blockly/JS-Interpreter/acorn", 
          "vwf/model/blockly/blockly_compressed", "vwf/model/blockly/blocks_compressed", 
          "vwf/model/blockly/javascript_compressed", "vwf/model/blockly/msg/js/en"
        ], 
        function( module, model, utility, acorn, Blockly ) {

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

            this.state = {
                "nodes": {},
                "scenes": {},
                "prototypes": {},
                "blockly": { "node": undefined },
                "executingBlocks": {},
                "executionHalted": false,
                "createNode": function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {
                    return {
                        "parentID": nodeID,
                        "ID": childID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType,
                        "name": childName,
                        "blocks": "<xml></xml>",
                        "toolbox": undefined,
                        "defaultXml": undefined,
                        "code": undefined,
                        "lastLineExeTime": undefined,
                        "timeBetweenLines": 1,
                        "interpreter": undefined,
                        "interpreterStatus": ""
                    };
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
                "methods": false,
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
            var appID = this.kernel.application();

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = utility.ifPrototypeGetId( appID, this.state.prototypes, nodeID, childID );
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

            var node = this.state.nodes[ childID ];
            if ( node === undefined && isBlockly3Node( childID ) ) {
                this.state.nodes[ childID ] = node = this.state.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );
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

            if ( this.state.nodes[ nodeID ] !== undefined ) {
                delete this.state.nodes[ nodeID ];
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

            if ( ( node !== undefined ) && ( utility.validObject( propertyValue ) ) ) {

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
                            if ( this.state.executingBlocks[ nodeID ] === undefined ) {
                                getJavaScript( node );
                                this.state.executingBlocks[ nodeID ] = node;
                            }
                            setToolboxBlockEnable( false );
                        } else {
                            if ( this.state.executingBlocks && this.state.executingBlocks[ nodeID ] !== undefined ) {
                                delete this.state.executingBlocks[ nodeID ];
                                var count = Object.keys( this.state.executingBlocks ).length;
                                if ( count === 0 ) {
                                    this.state.executingBlocks = {};
                                    setToolboxBlockEnable( true );    
                                }
                            }
                        }
                        break;

                    case "blockly_toolbox":
                        node.toolbox = propertyValue;
                        break;

                    case "blockly_defaultXml":
                        node.defaultXml = propertyValue;
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

            if ( node !== undefined ) {
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

            if ( this.debug.methods ) {
                this.logger.infox( "   M === callingMethod ", nodeID, methodName );
            }

            if ( nodeID == this.kernel.application() ) {
                
                switch ( methodName ) {
                    
                    case "stopAllExecution":
                        for ( var id in this.state.executingBlocks ) {
                            this.state.executingBlocks[ id ].interpreterStatus = "completed";
                            this.kernel.setProperty( id, 'blockly_executing', false );
                            this.kernel.fireEvent( id, "blocklyStopped", [ true ] );
                        }
                        break;

                    case "startAllExecution":
                        for ( var id in this.state.nodes ) {
                            this.kernel.setProperty( id, 'blockly_executing', true );
                            this.kernel.fireEvent( id, "blocklyStarted", [ true ] );
                        }  
                        break;


                }
            } else if ( node !== undefined ) {
                switch ( methodName ) {
                    case "blocklyClear":
                        if ( Blockly.mainWorkspace ) {
                            
                            Blockly.mainWorkspace.clear();
                            this.kernel.setProperty( nodeID, "blockly_xml", '<xml></xml>' );
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
                    var executeNextLine = false;

                    if ( blocklyNode.interpreter === undefined ||
                         blocklyNode.interpreterStatus === "completed" ) {
                        blocklyNode.interpreter = createInterpreter( acorn, blocklyNode.code );
                        blocklyNode.interpreterStatus = "created";
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

                        self.state.executionHalted = false;
                        
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

    function isBlockly3Node( nodeID ) {
        return self.kernel.test( nodeID,
            "self::element(*,'http://vwf.example.com/blockly/controller.vwf')",
            nodeID );
    }

    function isBlocklyNode( implementsIDs ) {
        var found = false;
        if ( implementsIDs ) {
            for ( var i = 0; i < implementsIDs.length && !found; i++ ) {
                found = ( implementsIDs[i] == "http://vwf.example.com/blockly/controller.vwf" );
            }
        }
       return found;
    }

    function getJavaScript( node ) {
        var xml = Blockly.Xml.workspaceToDom( Blockly.getMainWorkspace() );
        
        Blockly.JavaScript.vwfID = node.ID;

        if ( xml ) { 
            node.blocks = Blockly.Xml.domToText( xml );
        }
        node.code = Blockly.JavaScript.workspaceToCode();
    }

    function setToolboxBlockEnable( enable ) {
        if ( Blockly.Toolbox.flyout_ !== undefined && Blockly.Toolbox.flyout_.workspace_ !== undefined ) { 
            var blocks = Blockly.Toolbox.flyout_.workspace_.getTopBlocks( false );
            if ( blocks ) {
                for ( var i = 0; i < blocks.length; i++ ) {
                    blocks[ i ].setDisabled( !enable );
                }    
            }
        } else if ( Blockly.mainWorkspace && Blockly.mainWorkspace.flyout_ && Blockly.mainWorkspace.flyout_.workspace_ ){
            var blocks = Blockly.mainWorkspace.flyout_.workspace_.getTopBlocks( false );
            if ( blocks ) {
                for ( var i = 0; i < blocks.length; i++ ) {
                    blocks[ i ].setDisabled( !enable );
                }    
            }
        }
    }

    function nextStep( node ) {

        if ( node.interpreter !== undefined ) {
            var stepType = node.interpreter.step();
            while ( stepType && !self.state.executionHalted ) {
                if ( stepType === "stepProgram" ) {
                    if ( node.interpreterStatus === "created" ) {
                        self.kernel.fireEvent( node.ID, "blocklyStarted", [ true ] );
                        node.interpreterStatus = "started";                        
                    }
                }
                stepType = node.interpreter.step();
            }
            if ( stepType === false ) {
                if ( node.interpreterStatus === "started" ) {
                    self.kernel.setProperty( node.ID, "blockly_executing", false );
                    self.kernel.fireEvent( node.ID, "blocklyStopped", [ true ] );
                    node.interpreterStatus = "completed"; 
                }
            }
        }
    }

    function createInterpreter( acorn, code ) {
        
        var initFunc = function( interpreter, scope ) {
            
            var vwfKernelFunctions, i;
            var myVwf = interpreter.createObject( interpreter.OBJECT );
            interpreter.setProperty( scope, 'vwf', myVwf );


            vwfKernelFunctions = [ 'setProperty', 'getProperty' ];
            for ( i = 0; i < vwfKernelFunctions.length; i++ ) {
                var wrapper = ( function( nativeFunc ) {
                    return function() {
                        var parms = [];
                        for ( var j = 0; j < arguments.length; j++) {
                            parms.push( arguments[ j ].toString() );
                        }
                        self.state.executionHalted = true;
                        return interpreter.createPrimitive( nativeFunc.apply( vwf, parms ) );
                    };
                } )( vwf[ vwfKernelFunctions[ i ] ] );
                interpreter.setProperty( myVwf, vwfKernelFunctions[ i ], interpreter.createNativeFunction( wrapper ) );
            }

            vwfKernelFunctions = [ 'callMethod', 'fireEvent' ];
            for ( i = 0; i < vwfKernelFunctions.length; i++ ) {
                var wrapper = ( function( nativeFunc ) {
                    return function() {
                        var parms = [];
                        for ( var j = 0; j < arguments.length; j++) {
                            if ( j >= 2 ) {
                                if ( arguments[ j ].type === "object" ) {
                                    parms.push( setArgsFromObj( arguments[ j ] ) );
                                }
                            } else {
                                parms.push( arguments[ j ].toString() );
                            }
                        }
                        self.state.executionHalted = true;
                        return interpreter.createPrimitive( nativeFunc.apply( vwf, parms ) );
                    };
                } )( vwf[ vwfKernelFunctions[ i ] ] );
                interpreter.setProperty( myVwf, vwfKernelFunctions[ i ], interpreter.createNativeFunction( wrapper ) );
            }

        };
        return new Interpreter( acorn, code, initFunc );
    }

    function setArgsFromObj( object ) {
        var args = [];
        for ( var i in object.properties ) {
            if ( object.properties[ i ].type === "object" ) {
                args.push( setArgsFromObj( object.properties[ i ] ) );
            } else {
                args.push( object.properties[ i ].data );
            }
        }
        return args;
    }


} );
