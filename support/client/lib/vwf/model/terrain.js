"use strict";

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

define( [ "module", "vwf/model", "jquery" ], function( module, model, $ ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            var threejs = getThreeJSModel();
            this.state.scenes = threejs.state.scenes;
            this.state.nodes = threejs.state.nodes;
            this.state.kernel = this.kernel.kernel.kernel;
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            var node = undefined;
            var kernel = this.kernel.kernel.kernel;
            var protos = getPrototypes.call( this, kernel, childExtendsID );

            if ( protos && isTerrainDefinition.call( this, protos ) ) {

                node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: null,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };

                if(!node.threeObject)
                {   
                    CreateTerrain.call(this,nodeID,childID,childName);
                }
            }
        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {
            var node = this.state.nodes[childID];

            if ( node && node.terrain ) {
                node.terrain.initializingNode();
            }
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            var node = this.state.nodes[childID];

            if ( node && node.terrain) {
                node.terrain.deletingNode();
            }

            if(nodeID)
            {
                var childNode = this.state.nodes[nodeID];
                if(childNode)
                {
                    var threeObject = childNode.threeObject;
                    if(threeObject && threeObject.parent)
                    {
                        threeObject.parent.remove(threeObject);
                    }
                    delete this.state.nodes[childNode];
                }               
            }
        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {
        },

        // -- removingChild ------------------------------------------------------------------------

        removingChild: function( nodeID, childID ) {
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            var value = undefined;

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        case "meshDefinition":
                            createMesh.call( this, node, propertyValue, true );
                            value = propertyValue; 
                            break;
                        default:
                            value = this.settingProperty( nodeID, propertyName, propertyValue );                  
                            break;
                    }
                }
            }

            return value;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            var node = this.state.nodes[nodeID];

            if ( node && node.terrain ) {
                node.terrain.settingProperty( propertyName, propertyValue );
            }
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            var node = this.state.nodes[nodeID];

            if ( node && node.terrain ) {
                return node.terrain.gettingProperty( propertyName );
            }
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {
        },

        // TODO: deletingEvent

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
        },

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

    function isTerrainDefinition( prototypes ) {
        var foundTerrain = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundTerrain; i++ ) {
                foundTerrain = ( prototypes[i] == "http-vwf-example-com-terrain-vwf" );    
            }
        }

        return foundTerrain;
    }

    function loadScript (url)
    {
        
        var xhr = $.ajax(url,{async:false});
        return eval(xhr.responseText);

    }

    function CreateTerrain( nodeID, childID, childName )
    {
        var child = this.state.nodes[childID];
        if ( child ) 
        { 
            var factory = loadScript(   "vwf/model/threejs/terrain/terrain.js");
            var terrain = new factory(childID, null, childName);
            child.terrain = terrain;
            child.threeObject = terrain.getRoot();
            child.threeObject.vwfID = childID;
        }

         child.threeObject.name = childName;
         child.name = childName;
         addThreeChild.call( this, nodeID, childID );
    }

    function addThreeChild( parentID, childID ) {
        
        var threeParent;
        var parent = this.state.nodes[ parentID ];
        if ( !parent && this.state.scenes[ parentID ] ) {
            parent = this.state.scenes[ parentID ];
            threeParent = parent.threeScene;
        } else {
            threeParent = parent.threeObject;
        }
            
        if ( threeParent && this.state.nodes[ childID ]) {
            var child = this.state.nodes[ childID ];

            if ( child.threeObject ) {
                threeParent.add( child.threeObject );
            }
        }
    }

    function getThreeJSModel() {
        
        var threejs;

        threejs = vwf.models["vwf/model/threejs"];

        while ( threejs.model ) {
            threejs = threejs.model;
        }

        return threejs;

    }

} );
