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

/// @module vwf/view/blockly
/// @requires vwf/view

define( [ "module", "vwf/view", "jquery" ], function( module, view, $ ) {

    var self;

    var createBlocklyDivs = true;

    return view.load( module, {

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
            if ( this.state.blockly === undefined ) {
                this.state.blockly = { 
                    "node": undefined
                };
            }

            this.options = ( options !== undefined ? options : {} );

            this.options.blocklyPath = options.blocklyPath ? options.blocklyPath : './blockly/';
            this.options.divParent = options.divParent ? options.divParent : 'blocklyWrapper';
            this.options.divName = options.divName ? options.divName : 'blocklyDiv'; 
            this.options.toolbox = options.toolbox ? options.toolbox : 'toolbox'; 
            this.options.createButton = options.createButton !== undefined ? options.createButton : true;


        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {

            if ( createBlocklyDivs && childID == this.kernel.application() ) {
                this.logger.infox( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
                
                if ( this.options.createButton ) {
                    $( 'body' ).append( 
                        "<div id='"+ self.options.divParent +"'>" +
                            "<div id='" + self.options.divName + "'/>" + 
                            "<div><button id='runButton' onclick='onRun()'>Run</button></div>" +
                        "</div>" ).children(":last");
                } else {
                    $( 'body' ).append( 
                        "<div id='"+ self.options.divParent +"'>" +
                            "<div id='" + self.options.divName + "'/>" + 
                        "</div>" ).children(":last");
                }
                createBlocklyDivs = false;
            }            
            
        },

        initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName ) {
            
            self = this;

            if ( childID == this.kernel.application() ) {
                
                Blockly.inject( document.getElementById( self.options.divName ), { 
                    path: this.options.blocklyPath,
                    toolbox: document.getElementById( self.options.toolbox ) 
                } ); 

                Blockly.addChangeListener( function( event ) {
                    
                    if ( self.state.blockly.node !== undefined ) {
                        var blockCount = Blockly.mainWorkspace.getAllBlocks().length;
                        var topBlockCount = Blockly.mainWorkspace.topBlocks_.length;
                        
                        self.kernel.setProperty( self.state.blockly.node.ID, "blockCount", blockCount );
                        self.kernel.setProperty( self.state.blockly.node.ID, "topBlockCount", topBlockCount );

                        // the following code could be used to 
                        // replicate the blockly blocks in the current UI
                        //var xml = Blockly.Xml.workspaceToDom( Blockly.getMainWorkspace() );
                        //if ( xml ) { 
                        //    self.kernel.setProperty( self.state.blockly.node.ID, "blockXml", Blockly.Xml.domToText( xml ) );
                        //}
                        //self.kernel.setProperty( self.state.blockly.node.ID, "blockCode", Blockly.JavaScript.workspaceToCode() );
 
                    }

                });           
            }

        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        deletedNode: function( childID ) {
            delete this.nodes[ childID ];
        },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        createdProperty: function (nodeID, propertyName, propertyValue) {
			this.satProperty(nodeID, propertyName, propertyValue);
        },

        // -- initializedProperty ----------------------------------------------------------------------

        initializedProperty: function ( nodeID, propertyName, propertyValue ) { 
            this.satProperty(nodeID, propertyName, propertyValue);
        },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        satProperty: function ( nodeID, propertyName, propertyValue ) {
            
            var node = this.state.nodes[ nodeID ];

            //this.logger.infox( "S === satProperty ", nodeID, propertyName, propertyValue );

            if ( nodeID == this.kernel.application() ) {
                
                if ( propertyName === "blocklyUiNodeID" ) {
                    
                    if ( propertyValue !== undefined && this.state.nodes[ propertyValue ] !== undefined ) {
                        var show = true;
                        node = this.state.nodes[ propertyValue ];
                        if ( this.state.blockly.node !== undefined ) {
                            getBlockXML( this.state.blockly.node );
                            setBlocklyUIVisibility( this.state.blockly.node, false ); 
                            show = ( this.state.blockly.node.ID !== propertyValue );
                            this.state.blockly.node = undefined;                           
                        } 
                        if ( show ) {
                            this.state.blockly.node = node;
                            setBlockXML( node );
                            setBlocklyUIVisibility( node, true );
                        }                        
                    } else {
                        if ( this.state.blockly.node !== undefined ) {
                            getBlockXML( this.state.blockly.node );
                            setBlocklyUIVisibility( this.state.blockly.node, false );
                            this.state.blockly.node = undefined;                            
                        } 
                    }
                }

            } 

        
        },

        // -- gotProperty ------------------------------------------------------------------------------

        // gotProperty: function ( nodeID, propertyName, propertyValue ) { 
        // },

        // -- calledMethod -----------------------------------------------------------------------------

        // calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
        // },

        // -- firedEvent -----------------------------------------------------------------------------

        // firedEvent: function( nodeID, eventName, parameters ) {
        // },

        // -- ticked -----------------------------------------------------------------------------------

        ticked: function( vwfTime ) {
            
            if ( this.state.executingBlocks !== undefined ) {
                var blocklyNode = undefined;
                var executeNextLine;

                for ( var nodeID in this.state.executingBlocks ) {

                    blocklyNode = this.state.executingBlocks[ nodeID ];
                    executeNextLine = false;

                    if ( blocklyNode.codeLine === -1 ) {
                        blocklyNode.codeLine = 0;
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

                        if ( blocklyNode.code && blocklyNode.codeLine < blocklyNode.code.length-1 ) {
                            if ( blocklyNode.codeLine === 0 ) {
                                this.kernel.fireEvent( nodeID, "blocklyStarted", [ blocklyNode.codeLine ] );    
                            }
                            try { 
                                eval( blocklyNode.code[ blocklyNode.codeLine ] ) ;
                            } catch ( e ) {
                                this.logger.warnx( "Object: " + blocklyNode.ID + " had an error executing line#" + blocklyNode.codeLine + " code: " + blocklyNode.code[ blocklyNode.codeLine ] );
                                this.kernel.setProperty( nodeID, "executing", false );
                                this.kernel.fireEvent( nodeID, "blocklyErrored", [ blocklyNode.codeLine ] );

                            }
                            this.kernel.fireEvent( nodeID, "blocklyExecuted", [ blocklyNode.codeLine ] ); 
                            blocklyNode.codeLine++;
                        } else {
                            this.kernel.setProperty( nodeID, "executing", false );
                            this.kernel.fireEvent( nodeID, "blocklyStopped", [ blocklyNode.codeLine ] );
                        }
                    }
                } 
            }

        },

        // -- render -----------------------------------------------------------------------------------

        //render: function(renderer, scene, camera) {
        //}

    } );

    function setBlockXML( node ) {
        var xmlText = node.blocks;
        var xmlDom = null;
        try {
            xmlDom = Blockly.Xml.textToDom( xmlText );
        } catch (e) {
            var q = window.confirm( "XML is invalid" );
            if ( !q ) {
                return;
            }
        }
        if ( xmlDom ) {
            Blockly.mainWorkspace.clear();
            Blockly.Xml.domToWorkspace( Blockly.mainWorkspace, xmlDom );
        } 
        var blockCount = Blockly.mainWorkspace.getAllBlocks().length;
        var topBlockCount = Blockly.mainWorkspace.topBlocks_.length;
        
        self.kernel.setProperty( node.ID, "blockCount", blockCount );
        self.kernel.setProperty( node.ID, "topBlockCount", topBlockCount );      
    }

    function getBlockXML( node ) {
        var xml = Blockly.Xml.workspaceToDom( Blockly.getMainWorkspace() );
        if ( xml ) { 
            node.blocks = Blockly.Xml.domToText( xml );
        }
        node.code = Blockly.JavaScript.workspaceToCode();
        Blockly.mainWorkspace.clear();
    }


    function setBlocklyUIVisibility( node, show ) {
        var div = document.getElementById( self.options.divParent ); {
            div.style.visibility = show ? 'visible' : 'hidden';
        }
        self.kernel.fireEvent( node.ID, "blocklyVisibleChanged", [ show ] );
    }

} );
