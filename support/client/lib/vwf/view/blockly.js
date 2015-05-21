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

define( [ "module", "vwf/view", "jquery", "vwf/model/blockly/JS-Interpreter/acorn" ], function( module, view, $, acorn ) {

    var self;

    var createBlocklyDivs = true;
    var blocksInWorkspace = {};
    var handleChangeEvents = true;
    var blockIdIterator;

    return view.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            if ( options === undefined ) { options = {}; }

            this.delayedProperties = {
                "blockly_toolbox": undefined,
                "blockly_defaultXml": undefined,
                "blockly_autoClose": undefined
            };

            this.options = ( options !== undefined ? options : {} );

            this.options.blocklyPath = options.blocklyPath ? options.blocklyPath : './blockly/';
            this.options.divParent = options.divParent ? options.divParent : 'blocklyWrapper';
            this.options.divName = options.divName ? options.divName : 'blocklyDiv'; 
            this.options.toolbox = options.toolbox ? options.toolbox : 'toolbox'; 
            this.options.createButton = options.createButton !== undefined ? options.createButton : true;

        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {

            if ( childID == this.kernel.application() ) {
                
                if ( createBlocklyDivs ) {
                    this.state.scenes[ childID ] = {
                        "toolbox": undefined,
                        "defaultXml": undefined
                    }

                    if ( this.options.createButton ) {
                        $( 'body' ).append( 
                            "<div id='"+ self.options.divParent +"'>" +
                                "<div id='" + self.options.divParent + "-top'/>" +
                                "<div id='" + self.options.divName + "'/>" + 
                                "<div id='runButton' onclick='onRun()'>Run</div>" +
                            "</div>" ).children(":last");
                    } else {
                        $( 'body' ).append( 
                            "<div id='"+ self.options.divParent +"'>" +
                                "<div id='" + self.options.divParent + "-top'/>" +
                                "<div id='" + self.options.divName + "'/>" + 
                            "</div>" ).children(":last");
                    }
                    createBlocklyDivs = false;
                }

            } else {
                var node = this.state.nodes[ childID ];
                if ( node === undefined && isBlockly3Node( childID ) ) {
                    this.state.nodes[ childID ] = node = this.state.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback );
                }
            }           
            
        },

        initializedNode: function( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName ) {
            
            self = this;

            if ( childID === this.kernel.application() ) {
                
                self.kernel.setProperty( childID, "toolbox", self.options.toolbox );
                Blockly.inject( document.getElementById( self.options.divName ), { 
                    path: this.options.blocklyPath,
                    toolbox: document.getElementById( self.options.toolbox ),
                    "grid": { spacing: 40, length: 1, colour: '#ccc', snap: true }
                } ); 

                // HACK: Fix Blockly's hijacking of the backspace and delete keys in password fields
                Blockly.isTargetInput_ = function ( event ){
                    return event.target.type === "textarea" || event.target.type === "text" || event.target.type === "password";
                };

                Blockly.addChangeListener( function( event ) {
                    
                    if ( handleChangeEvents ) {
                        if ( self.state.blockly.node !== undefined ) {
                            var i, block;
                            var previousBlockIds = Object.keys( blocksInWorkspace );
                            var previousBlockCount = previousBlockIds.length;
                            var blocks = Blockly.mainWorkspace.getAllBlocks();
                            var blockCount = blocks.length;
                            var topBlockCount = Blockly.mainWorkspace.topBlocks_.length;
                            
                            self.kernel.fireEvent( self.kernel.application(), "blocklyContentChanged", [ true ] );
                            self.kernel.setProperty( self.state.blockly.node.ID, "blockly_blockCount", blockCount );
                            self.kernel.setProperty( self.state.blockly.node.ID, "blockly_topBlockCount", topBlockCount );

                            if ( blockCount > previousBlockCount ) {
                                
                                for ( i = 0; i < blocks.length; i++ ) {
                                    block = blocks[ i ];
                                    if ( blocksInWorkspace[ block.id ] === undefined ) {
                                        blocksInWorkspace[ block.id ] = { "id": block.id, "type": block.type }; 
                                        self.kernel.fireEvent( self.state.blockly.node.ID, "blocklyBlockAdded", [ block.id, block.type ] );   
                                    }
                                } 

                            } else if ( blockCount < previousBlockCount ) {

                                var activeBlocks = {};
                                for ( i = 0; i < blocks.length; i++ ) {
                                    activeBlocks[ blocks[ i ].id ] = blocks[ i ];    
                                }
                                var blockIDsRemoved = [];
                                for ( var id in blocksInWorkspace ) {
                                    if ( activeBlocks[ id ] === undefined ) {
                                        blockIDsRemoved.push( id );    
                                    }
                                }
                                for ( i = 0; i < blockIDsRemoved.length; i++ ) {
                                    block = blocksInWorkspace[ blockIDsRemoved[ i ] ];
                                    self.kernel.fireEvent( self.state.blockly.node.ID, "blocklyBlockRemoved", [ block.id, block.type ] );
                                    delete blocksInWorkspace[ blockIDsRemoved[ i ] ];   
                                }

                            } else {

                                // Set the appropriate model properties based on this change
                                var xmlDom = Blockly.Xml.workspaceToDom( Blockly.getMainWorkspace() );
                                if ( xmlDom ) {
                                    var newXmlText = Blockly.Xml.domToText( xmlDom );
                                    self.kernel.setProperty( self.state.blockly.node.ID, "blockly_xml", 
                                        Blockly.Xml.domToText( xmlDom ) );
                                }
                                self.kernel.setProperty( self.state.blockly.node.ID, "blockly_code", 
                                    Blockly.JavaScript.workspaceToCode() );
                            }
                            
                        }
                    } else {
                        handleChangeEvents = true;
                    }

                });           
            }

        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        deletedNode: function( nodeID ) {
            
            if ( this.state.nodes[ nodeID ] !== undefined ) {
                delete this.state.nodes[ nodeID ];
            }
            
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
            if ( propertyValue === undefined ) {
                return;
            }

            if ( nodeID == this.kernel.application() ) {
                
                var app = this.state.scenes[ nodeID ];
                switch ( propertyName ) {
                    case "blockly_activeNodeID":

                        var newActiveNodeId = propertyValue;
                        var previousActiveNode = this.state.blockly.node;
                        var blocklyNode = this.state.nodes[ newActiveNodeId ];

                        // If the new node is the same as the old - exit early to prevent 
                        // breaking synchronization.

                        if ( previousActiveNode && blocklyNode && previousActiveNode === blocklyNode ) {
                            setBlockXML( blocklyNode );
                            break;
                        }

                        if ( previousActiveNode !== undefined ) {
                            getBlockXML( previousActiveNode );
                            this.state.blockly.node = undefined;
                        }

                        if ( blocklyNode !== undefined ) {
                            // If the new active node is different than the old,
                            // then we need to load its program into the toolbox
                            if ( blocklyNode.toolbox !== undefined ) {
                                loadToolbox( blocklyNode.toolbox );
                            } else if ( app.toolbox !== undefined ) {
                                loadToolbox( app.toolbox );
                            }
                            // if ( blocklyNode.defaultXml !== undefined ) {
                            //     loadDefaultXml( blocklyNode.defaultXml );
                            // } else if ( app.defaultXml !== undefined ) {
                            //     loadDefaultXml( app.defaultXml );
                            // }
                            this.state.blockly.node = blocklyNode;
                            setBlockXML( blocklyNode );
                            this.kernel.fireEvent( blocklyNode.ID, "blocklyVisibleChanged", [ getBlocklyUIVisibility() ] );
                        }
                        break;

                    case "blockly_toolbox":
                        app.toolbox = propertyValue;
                        loadToolbox( propertyValue );
                        break;

                    case "blockly_defaultXml":
                        app.defaultXml = propertyValue;
                        loadDefaultXml( propertyValue )
                        break;

                    case "blockly_autoClose":
                        if ( Blockly && Blockly.Toolbox && Blockly.Toolbox.flyout_ ){
                            Blockly.Toolbox.flyout_.autoClose = Boolean( propertyValue );                       
                        } else {
                            this.delayedProperties.blockly_autoClose = Boolean( propertyValue );
                        }
                        break;

                    case "blockly_interfaceVisible":
                        setBlocklyUIVisibility( this.state.blockly.node, propertyValue );
                        break;
                }

            } else if ( this.state.blockly.node && ( nodeID === this.state.blockly.node.ID ) ) {
                switch ( propertyName ) {
                    case "blockly_xml":
                        var clientThatSetProperty = this.kernel.client();
                        var me = this.kernel.moniker();
                        if ( clientThatSetProperty !== me ) {
                            var xmlText = propertyValue;
                            handleChangeEvents = false;
                            setWorkspaceFromXmlText( xmlText, true );
                        }
                        break;
                    default:
                        break;
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

        //ticked: function( vwfTime ) {
        //},

        // -- render -----------------------------------------------------------------------------------

        //render: function(renderer, scene, camera) {
        //}

    } );

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

    function setBlockXML( node ) {

        handleChangeEvents = false;

        var xmlText = node.blocks;
        var clearBeforeSet = true;
        setWorkspaceFromXmlText( xmlText, clearBeforeSet );

        var blocks = Blockly.mainWorkspace.getAllBlocks();
        var blockCount = blocks.length;
        var topBlockCount = Blockly.mainWorkspace.topBlocks_.length;
        
        blocksInWorkspace = {};
        for ( var i = 0; i < blocks.length; i++ ) {
            blocksInWorkspace[ blocks[ i ].id ] = { "id": blocks[ i ].id, "type": blocks[ i ].type };
        }

        self.kernel.setProperty( node.ID, "blockly_blockCount", blockCount );
        self.kernel.setProperty( node.ID, "blockly_topBlockCount", topBlockCount );     
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
        var div = document.getElementById( self.options.divParent );
        
        div.style.visibility = show ? 'visible' : 'hidden';
        div.style.pointerEvents = show ? 'all' : 'none';

        if ( self.delayedProperties !== undefined ) {
            for ( var prop in self.delayedProperties ) {
                if ( self.delayedProperties[ prop ] !== undefined ) {
                    self.satProperty( self.kernel.application(), prop, self.delayedProperties[ prop ] );
                }
            }
            self.delayedProperties = undefined;
        }

        if ( node && node.ID ) {
            self.kernel.fireEvent( node.ID, "blocklyVisibleChanged", [ show ] );
        }
    }

    function getBlocklyUIVisibility() {
        var div = document.getElementById( self.options.divParent );
        var result = div.style.visibility === "visible" ? true : false;
        return result;
    }

    function loadToolbox( toolboxDef ) {
        // check the 'Changing the Toolbox' section at
        // https://code.google.com/p/blockly/wiki/Toolbox 
        // for more information on this function call        
        if ( Blockly && Blockly.mainWorkspace ) {
            var len = toolboxDef.length;
            if ( toolboxDef.indexOf( '.xml' ) === ( len - 4 ) ) {
                $.ajax( {
                    url: toolboxDef,
                    type: 'GET',
                    dataType: 'text',
                    timeout: 1000,
                    async: false,
                    error: function( jqXHR, textStatus, errorThrown ) {
                        self.logger.errorx( "loadToolbox", 
                            "Error loading XML document (" + textStatus + "): " + toolboxDef );
                    },
                    success: function( xml ) {
                        cleanUpdateToolbox( xml );
                    }
                } );
            } else if ( toolboxDef.indexOf( '<xml' ) !== -1 ){
                cleanUpdateToolbox( toolboxDef );
            } else {
                var element = document.getElementById( toolboxDef );
                if ( element ) {
                    cleanUpdateToolbox( element );    
                } else {
                    self.logger.warnx( "Unable to load Blockly toolbox: " + toolboxDef );
                }
            }
        } else {
            self.delayedProperties.blockly_toolbox = toolboxDef;
            self.logger.warnx( "Blockly not initilized unable to set the toolbox: " + toolboxDef );
        }        
    }

    function loadDefaultXml( xml ) {
        if ( Blockly && Blockly.mainWorkspace ) {
            BlocklyApps.loadBlocks( xml );
        } else {
            self.delayedProperties.defaultXml = toolboxDef;
            self.logger.warnx( "Blockly not initilized unable to load default xml: " + xml );
        }        
    }

    // cleanUpdateToolbox properly updates the blockly toolbox by setting the 
    // flyout and workspace bounds according to the new flyout width.
    function cleanUpdateToolbox( xml ) {
        // negateOverlap is being use to negate some of the effect of the MARGIN variable
        // in Blockly.createDom_ when deleting blocks over the flyout
        // SJF: Overlap not present in Blockly with categories enabled

        // var negateOverlap = 35;
        Blockly.updateToolbox( xml );
        // Blockly.mainWorkspace.scrollX = Blockly.mainWorkspace.flyout_.width_ + negateOverlap;
        // var translation = 'translate( ' + Blockly.mainWorkspace.scrollX + ', 0 )';
        // Blockly.mainWorkspace.getCanvas().setAttribute('transform', translation);
    }

    // domCopyToWorkspace copies the saved blocks to the workspace exactly
    // This preserves the stored block IDs
    function domCopyToWorkspace( workspace, xml ) {
        var width = Blockly.svgSize().width;
        for (var x = 0, xmlChild; xmlChild = xml.childNodes[x]; x++) {
            if (xmlChild.nodeName.toLowerCase() == 'block') {
                var block = Blockly.Xml.domToBlock( workspace, xmlChild );
                var xmlDescendants = xmlChild.getElementsByTagName( "block" );
                blockIdIterator = 0;
                setChildBlockIDs( block, xmlChild, xmlDescendants );
                var blockX = parseInt(xmlChild.getAttribute('x'), 10);
                var blockY = parseInt(xmlChild.getAttribute('y'), 10);
                if (!isNaN(blockX) && !isNaN(blockY)) {
                    block.moveBy(Blockly.RTL ? width - blockX : blockX, blockY);
                }
            }
        }
    }

    function setChildBlockIDs( block, blockXml, xmlDescendants ) {
        var childBlock, childXml;
        block.id = blockXml.id;
        for ( var i = 0; i < block.childBlocks_.length; i++ ) {
            childBlock = block.childBlocks_[ i ];
            childXml = xmlDescendants[ blockIdIterator++ ];
            setChildBlockIDs( childBlock, childXml, xmlDescendants );
        }
    }

    function setWorkspaceFromXmlText( xmlText, clearBeforeSet ) {
        var xmlDom = null;
        try {
            xmlDom = Blockly.Xml.textToDom( xmlText );
        } catch ( e ) {
            var q = window.confirm( "XML is invalid" );
            if ( !q ) {
                return;
            }
        }
        if ( xmlDom ) {
            clearBeforeSet && Blockly.mainWorkspace.clear();
            domCopyToWorkspace( Blockly.mainWorkspace, xmlDom );
        }
    }

} );
