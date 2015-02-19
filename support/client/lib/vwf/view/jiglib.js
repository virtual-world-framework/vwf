"use strict";

/// @module vwf/view/
/// @requires vwf/view

define( [ 
    "module", 
    "vwf/view", 
    "vwf/utility" ], 

    function( module, view, utility ) {

    var self;

    return view.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function( options ) {
            
            self = this;

            this.arguments = Array.prototype.slice.call( arguments );

            this.options = options || {};
        },

        // createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
        //     childSource, childType, childIndex, childName, callback ) {
            
        // },

        // initializedNode: function( nodeID, childID ) {

        // },
 
 
        // -- deletedNode --------------------------------------------------------------------------

        // deletedNode: function( childID ) {
            
        //     if ( this.state.nodes[ childID ] !== undefined ) {
        //         delete this.state.nodes[ childID ];                
        //     }

        // },

        // -- addedChild ---------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty ----------------------------------------------------------------------

   //      createdProperty: function( nodeID, propertyName, propertyValue ) {
            // this.satProperty( nodeID, propertyName, propertyValue );
   //      },

   //      // -- initializedProperty ------------------------------------------------------------------

   //      initializedProperty: function( nodeID, propertyName, propertyValue ) { 
   //          this.satProperty( nodeID, propertyName, propertyValue );
   //      },

   //      // TODO: deletedProperty

   //      // -- satProperty --------------------------------------------------------------------------

   //      satProperty: function( nodeID, propertyName, propertyValue ) {         
   //          var node = this.state.nodes[ nodeID ]; 

   //          //this driver has no representation of this node, so there is nothing to do.
   //          if( node === undefined ) return;
   //      },

   //      // -- gotProperty --------------------------------------------------------------------------

   //      gotProperty: function( nodeID, propertyName, propertyValue ) { 
   //          var node = this.state.nodes[ nodeID ]; 

   //          //this driver has no representation of this node, so there is nothing to do.
   //          if( node === undefined ) return;
   //      },

   //      // -- calledMethod -------------------------------------------------------------------------

   //      calledMethod: function( nodeID, methodName, methodParameters, methodValue ) {
   //      },

   //      // -- firedEvent ---------------------------------------------------------------------------

   //      firedEvent: function( nodeID, eventName, eventParameters ) {
   //      },

        // -- ticked -------------------------------------------------------------------------------

        ticked: function( vwfTime ) {
            var elaspedTime = vwfTime - this.state.lastTime;
            this.state.lastTime = vwfTime;

            if ( this.state.enabled ) {
                if ( elaspedTime > 0 ) {
                    if ( elaspedTime > 0.05 ) {
                        elaspedTime = 0.05;
                    }
                    var activeObj, trans;
                    var sceneNode = this.state.scenes[ this.kernel.application() ];

                    if ( sceneNode && sceneNode.system ) {
                        sceneNode.system.integrate( elaspedTime );

                        var activeKeys = Object.keys( this.state.active );
                        if ( activeKeys !== undefined ) {
                            this.state.updating = true;
                            for ( var i = 0; i < activeKeys.length; i++ ) {
                                activeObj = this.state.active[ activeKeys[ i ] ];
                                if ( activeObj && activeObj.jlObj ) {
                                    trans = activeObj.jlObj.get_Transform();
                                    this.state.setProperty( activeKeys[ i ], "transform", trans );
                                    //this.kernel.setProperty( activeKeys[ i ], "transform", trans );
                                }                            
                            }
                            this.state.updating = false;
                        }

                    }
                }
                return true;
            }
        }

        // -- render -------------------------------------------------------------------------------

        // render: function(renderer, scene, camera) {
        // },

    } );

} );
