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

    var blockCode = undefined;
    var codeLine = -1;
    var lastLineExeTime = undefined;
    var timeBetweenLines = 1;
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

            this.options.wrapperName = options.wrapperName ? options.wrapperName : 'blocklyWrapper';
            this.options.divName = options.divName ? options.divName : 'blocklyDiv'; 
            this.options.createButton = options.createButton !== undefined ? options.createButton : true;


        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {

            if ( createBlocklyDivs && childID == this.kernel.application() ) {
                this.logger.infox( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
                
                if ( this.options.createButton ) {
                    $( 'body' ).append( 
                        "<div id='"+ self.options.wrapperName +"'>" +
                            "<div id='" + self.options.divName + "'/>" + 
                            "<div><button id='runButton' onclick='onRun()'>Run</button></div>" +
                        "</div>" ).children(":last");
                } else {
                    $( 'body' ).append( 
                        "<div id='"+ self.options.wrapperName +"'>" +
                            "<div id='" + self.options.divName + "'/>" + 
                        "</div>" ).children(":last");
                }
                createBlocklyDivs = false;
            }            
            
        },

        initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName ) {
            
            if ( childID == this.kernel.application() ) {
                //this.logger.infox( "initializedNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
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
            if ( node ) {

            }         
        },

        // -- gotProperty ------------------------------------------------------------------------------

        gotProperty: function ( nodeID, propertyName, propertyValue ) { 
        },

        // -- calledMethod -----------------------------------------------------------------------------

        calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
        },

        // -- firedEvent -----------------------------------------------------------------------------

        firedEvent: function( nodeID, eventName, parameters ) {
            
            //console.info( "firedEvent( "+nodeID+", "+eventName+", "+parameters+" )" );

            var node = this.state.nodes[ nodeID ];
            var show = true;

            if ( node !== undefined ) {
                switch ( eventName ) {
                    case "toggleBlocklyUI":
                        if ( this.state.blockly.node !== undefined ) {
                            show = ( this.state.blockly.node !== node );
                            getBlockXML( node );
                            hideBlocklyUI( this.state.blockly.node );
                            this.state.blockly.node = undefined;
                        } 
                        if ( show ) {
                            this.state.blockly.node = node;
                            if ( node.blocks && node.blocks != "" ) {
                                setBlockXML( node.blocks );
                            } 
                            showBlocklyUI( node );
                        }
                        break;
                }  
            }
        },

        // -- ticked -----------------------------------------------------------------------------------

        ticked: function( vwfTime ) {
            if ( this.state.executingBlocks ) {
                var executeNextLine = false;

                if ( codeLine == -1 ) {
                    blockCode = Blockly.JavaScript.workspaceToCode().split( '\n' );
                    codeLine = 0;
                    lastLineExeTime = vwfTime;
                    executeNextLine = true;
                } else {
                    var elaspedTime = vwfTime - lastLineExeTime;
                    if ( elaspedTime >= timeBetweenLines ) {
                        executeNextLine = true;
                        lastLineExeTime = vwfTime;
                    } 
                }

                if ( executeNextLine ) {
                    if ( blockCode && codeLine < blockCode.length ) {
                        try { 
                            eval( blockCode[ codeLine ] ) ;
                        } catch ( e ) {
                            this.state.executingBlocks = false;
                        }
                        codeLine++;
                    } else {
                        this.state.executingBlocks = false;
                    }
                }
            } else {
                blockCode = undefined;
                codeLine = -1;
                lastLineExeTime = undefined;
            }

        },

        // -- render -----------------------------------------------------------------------------------

        render: function(renderer, scene, camera) {
        }

    } );

    function setBlockXML( xmlText ) {
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
    }

    function getBlockXML( node ) {
        var xml = Blockly.Xml.workspaceToDom( Blockly.getMainWorkspace() );
        if ( xml ) { 
            node.blocks = Blockly.Xml.domToText( xml );
        }
        Blockly.mainWorkspace.clear();
    }

    function hideBlocklyUI( node ) {
        var div = document.getElementById( self.options.divName );
        if ( div ) {
            div.style.visibility = 'hidden';
        }
        var button = document.getElementById( 'runButton' );
        if ( button ) {
            button.style.visibility = 'hidden';
        }        
    }

    function showBlocklyUI( node ) {
        var div = document.getElementById( self.options.divName ); {
            div.style.visibility = 'visible';
        }
        var button = document.getElementById( 'runButton' );
        if ( button ) {
            button.style.visibility = 'visible';
        } 
    }

} );
