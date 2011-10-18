define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

       // == Module Definition ====================================================================

       // -- initialize ---------------------------------------------------------------------------

       initialize: function() {

          this.nodes = {}; // maps id => { property: value, ... }
          this.scenes = {};
          this.active = {};
          this.enable = false;
          this.now = undefined;
          this.lastTime = (new Date()).getTime();

          var self = this;
          setInterval( function() { self.update() }, 80 );
          this.updating = false;

       },

       // == Model API ============================================================================

       // -- creatingNode -------------------------------------------------------------------------

       creatingNode: function (nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType) {

          switch (nodeExtendsID) {
             case "arabtown-vwf":
             case "http-vwf-example-com-types-glge":
                this.scenes[ nodeID ] = {};
                this.scenes[ nodeID ].ID = nodeID;
                this.scenes[ nodeID ].extendsID = nodeExtendsID;
                this.scenes[ nodeID ].implementsIDs = nodeImplementsIDs;
                this.scenes[ nodeID ].source = nodeSource;
                this.scenes[ nodeID ].type = nodeType;
                this.scenes[ nodeID ].system = jigLib.PhysicsSystem.getInstance();
                this.scenes[ nodeID ].initialized = false;
                break;

             case "http-vwf-example-com-types-node3":
             case "http-vwf-example-com-types-mesh":
                this.nodes[ nodeID ] = {};
 /* hardcoded */this.nodes[ nodeID ].sceneID = "index-vwf";
                this.nodes[ nodeID ].ID = nodeID;
                this.nodes[ nodeID ].extendsID = nodeExtendsID;
                this.nodes[ nodeID ].implementsIDs = nodeImplementsIDs;
                this.nodes[ nodeID ].source = nodeSource;
                this.nodes[ nodeID ].type = nodeType;
                
                break;
          }

       },

       // TODO: deletingNode

       // -- addingChild --------------------------------------------------------------------------

       addingChild: function (nodeID, childID, childName) {
    
          if ( this.scenes[ nodeID ] ) {
             var sceneNode = this.scenes[ nodeID ];
             if ( !sceneNode.initialized ) {
                this.initScene( sceneNode );
             }
          }

          if ( this.nodes[ childID ] ) {
             var node = this.nodes[ childID ];
             this.nodes[ childID ].jigLibObj = undefined;
             this.initPhysics( node );
          }
       },

       // -- removingChild ------------------------------------------------------------------------

       removingChild: function (nodeID, childID) {
       },

       // -- parenting ----------------------------------------------------------------------------

       parenting: function (nodeID) {
       },

       // -- childrening --------------------------------------------------------------------------

       childrening: function (nodeID) {
       },

       // -- naming -------------------------------------------------------------------------------

       naming: function (nodeID) {
       },

       // -- creatingProperty ---------------------------------------------------------------------

       creatingProperty: function (nodeID, propertyName, propertyValue) {
       },

       // TODO: deletingProperty

       // -- settingProperty ----------------------------------------------------------------------

       settingProperty: function (nodeID, propertyName, propertyValue) {

          var activeNode;
          if ( this.active[ nodeID ] ) 
             activeNode = this.active[ nodeID ];

          if ( this.nodes[ nodeID ] ) {
             var node = this.nodes[ nodeID ];
             
             if ( node ) {
                var scene = this.scenes[ node.sceneID ];    
                switch ( propertyName ) {
                    case "x":
                       if ( node.jigLibObj ) {
                          node.jigLibObj.set_x( propertyValue );    
                       }    
                       break;
                    case "y":
                       if ( node.jigLibObj ) {
                          node.jigLibObj.set_y( propertyValue );    
                       }    
                       break;
                    case "z":
                       if ( node.jigLibObj ) {
                          node.jigLibObj.set_z( propertyValue );    
                       }    
                       break;
                    case "position":
                       if ( !this.updating && activeNode && activeNode.jlObj ) {
//                          if ( activeNode.offset ) {
//                              var newPos = [ propertyValue[0] - activeNode.offset[0], propertyValue[1] - activeNode.offset[1], propertyValue[2] - activeNode.offset[2] ];
//                              activeNode.jlObj.moveTo( newPos );
//                          } else {                     
                            activeNode.jlObj.moveTo( propertyValue ); 
//                          }   
                       } else if ( node.jigLibObj ) {
                           node.jigLibObj.moveTo( propertyValue ); 
                       }   
                       break;                       
                    case "rotation":                       
                       if ( node.jigLibObj ) {

                       }
                       break;                    
                    case "eulers":
                       if ( activeNode ) {

                       }
                       break;
                    case "scale":
                       if ( activeNode ) {

                       }
                       break;

                    case "physics":
                       if ( scene && scene.system && propertyValue ) {
                          var v1, v2;
                          var type = ( propertyValue.constructor == Array ) ? propertyValue[0] : propertyValue;
                          switch ( type ) {
                             case "mesh": {
                                    var childList = [];
                                    var verts, vertIndices;
                                    this.findMeshChildren( nodeID, childList );
                                    if ( childList.length > 0 ) {
                                        node.jigLibMeshes = {};

                                        for ( var i = 0; i < childList.length; i++ ) {
    
                                            if ( !node.jigLibMeshes[ childList[i].ID ] ) {
                                                verts = vwf.getProperty( childList[i].ID, "vertices", v1 );
                                                vertIndices = vwf.getProperty( childList[i].ID, "vertexIndices", v2 );

                                                node.jigLibMeshes[ childList[i].ID ] = new jigLib.JTriangleMesh();
                                                node.jigLibMeshes[ childList[i].ID ].createMesh(verts, vertIndices);
                                                //console.info( childList[i].ID + " created JTriangleMesh" ); 
                                                scene.system.addBody( node.jigLibMeshes[ childList[i] ] );
                                           }
                                        }
                                    }
                                }
                                break;
                             case "box": {
                                    if ( !node.jigLibObj ) {
                                       var width = 1;
                                       var depth = 1;
                                       var height = 1;
                                       //var pos = vwf.getProperty( nodeID, "position", v1 );
                                       if ( propertyValue.constructor == Array && propertyValue.length == 4 ) {
                                          width = propertyValue[1];
                                          depth = propertyValue[2];
                                          height = propertyValue[3];
                                       } else { 
                                          var bBox = vwf.getProperty( nodeID, "boundingbox", v1 );
                                          var offset = vwf.getProperty( nodeID, "centerOffset", v2 );
                                          if ( bBox[1] - bBox[0] != 0 ) width = ( bBox[1] - bBox[0] );
                                          if ( bBox[3] - bBox[2] != 0 ) depth = ( bBox[3] - bBox[2] );
                                          if ( bBox[5] - bBox[4] != 0 ) height = ( bBox[5] - bBox[4] );                                
                                       }
                                       //console.info( nodeID + " created JBox ( " + width + ", " + depth + ", " + height + " )" );                                
                                       //console.info( nodeID + " created JBox with offset = " + offset );                                
                                       node.jigLibObj = new jigLib.JBox( null, width, depth, height );
                                       scene.system.addBody( node.jigLibObj );
                                       //node.jigLibObj.moveTo( [ -offset[0], -offset[1], -offset[2] ] );
                                       this.active[ nodeID ] = {};
                                       this.active[ nodeID ].jlObj = node.jigLibObj;
                                       this.active[ nodeID ].offset = offset;
                                    }
                                }
                                break;
                             case "sphere": {
                                    if ( !node.jigLibObj ) {
                                       var verts = vwf.getProperty( nodeID, "vertices", v1 );
                                       var offset = vwf.getProperty( nodeID, "centerOffset", v2 );
                                       var raduis = 10;
                                        if ( propertyValue.constructor == Array && propertyValue.length == 2 ) {
                                            raduis = propertyValue[1];
                                        } else {
                                            var cRadius = calcRadius( offset, verts );
                                            if ( cRadius > 0 ) raduis = cRadius; 
                                        }
                                       node.jigLibObj = new jigLib.JSphere(null, raduis);
                                       scene.system.addBody( node.jigLibObj );
                                       this.active[ nodeID ] = {};
                                       this.active[ nodeID ].jlObj = node.jigLibObj;
                                       this.active[ nodeID ].offset = vwf.getProperty( nodeID, "centerOffset", v2 );;
                                    }
                                }
                                break;
                             case "plane": {
                                    if ( !node.jigLibObj ) {
                                        var normal = [0, 0, 1, 0];
                                        if ( propertyValue.constructor == Array ) {
                                            switch ( propertyValue.length ) {
                                                case "2":
                                                    if ( propertyValue[1].constructor == Array ) {
                                                        if ( propertyValue[1].length == 4 ) {
                                                            normal = propertyValue[1];
                                                        }
                                                    }
                                                    break;
                                                case "5":
                                                    for ( var i = 0; i < 4; i++ ) {
                                                        normal[i] = propertyValue[i+1];
                                                    }
                                                    break;
                                            }    
                                        }

                                       node.jigLibObj = new jigLib.JPlane( null, normal );
                                       scene.system.addBody( node.jigLibObj );
                                       //this.active[ nodeID ] = node.jigLibObj;
                                    }
                                }
                                break;
                             default:
                                node.jigLibObj = undefined;
                                break;
                          }
                       }
                       break;
                    case "mass":
                       if ( node.jigLibObj ) {
                          node.jigLibObj.set_mass( propertyValue );
                       }
                       break;
                    case "restitution":
                       if ( node.jigLibObj ) {
                          node.jigLibObj.set_restitution( propertyValue );
                       }
                       break;                       
                    case "friction":
                       if ( node.jigLibObj ) {
                          node.jigLibObj.set_friction( propertyValue );
                       }
                       break;                    
                    case "rotVelocityDamping":
                       if ( node.rotVelocityDamping ) {
                          node.jigLibObj.set_rotVelocityDamping( propertyValue );
                       }
                       break;    
                    case "linVelocityDamping":
                       if ( node.jigLibObj ) {
                          node.jigLibObj.set_linVelocityDamping( propertyValue );
                       }
                       break;                       
                       
                                
                }
             }
          } else if ( this.scenes[ nodeID ] ) {
             var sceneNode = this.scenes[ nodeID ];
             if ( sceneNode && sceneNode.system ) {
                switch ( propertyName ) {
                    case "gravity":
                       sceneNode.system.setGravity( propertyValue );
                       break;
                    case "collisionSystem": {
                       var pv = propertyValue;
                       if ( pv.constructor == Array ) {
                          switch ( pv.length ) {
                             case 10:
                                sceneNode.system.setCollisionSystem( pv[0], pv[1], pv[2], pv[3], pv[4], pv[5], pv[6], pv[7], pv[8], pv[9] );
                                break;
                             case 1:
                                sceneNode.system.setCollisionSystem( pv[0] );
                                break;    
                             }                             
                       }           
                       break;
                    }
                    case "loadComplete":
                       this.enable = propertyValue;
                       break;
                }
             }
          }
       },

       // -- gettingProperty ----------------------------------------------------------------------

       gettingProperty: function (nodeID, propertyName, propertyValue) {
          
            propertyValue = undefined;

          if ( this.nodes[ nodeID ] ) {
             var node = this.nodes[ nodeID ];
             if ( node && node.jigLibObj ) {
                switch ( propertyName ) {
                   case "physics":
                       if ( node.jigLibObj.constructor == jigLib.JBox ) {
                          propertyValue = [];
                          propertyValue.push( "box" );
                          propertyValue.push( node.jigLibObj._sideLengths[0] );
                          propertyValue.push( node.jigLibObj._sideLengths[1] );
                          propertyValue.push( node.jigLibObj._sideLengths[2] );
                       } else if ( node.jigLibObj.constructor == jigLib.JSphere ) {
                          propertyValue = [];
                          propertyValue.push( "sphere" );
                          propertyValue.push( node.jigLibObj.get_radius() );
                       } else if ( node.jigLibObj.constructor == jigLib.JPlane ) {
                          propertyValue = [];
                          propertyValue.push( "plane" );
                          propertyValue.push( node.jigLibObj.get_normal() );
                      } else {
                          propertyValue = [];
                          propertyValue.push( "mesh" );
                       }
                       break;
                    case "mass":
                       propertyValue = node.jigLibObj.get_mass();
                       break;
                    case "restitution":
                       propertyValue = node.jigLibObj.get_restitution();
                       break;                       
                    case "friction":
                       propertyValue = node.jigLibObj.get_friction();
                       break;                    
                    case "rotVelocityDamping":
                       propertyValue = node.jigLibObj.get_rotVelocityDamping();
                       break;    
                    case "linVelocityDamping":
                       propertyValue = node.jigLibObj.get_linVelocityDamping();
                       break;    

                }
             }
          } else if ( this.scenes[ nodeID ] ) {
             var sceneNode = this.scenes[ nodeID ];
             if ( sceneNode && sceneNode.system ) {
                switch ( propertyName ) {
                    case "gravity":
                       propertyValue = sceneNode.system.get_gravity();
                       break;
                    case "collisionSystem":
                       propertyValue = undefined;
                       break;
                }
             }
                
          }
          return propertyValue;
       },

       // -- creatingMethod -----------------------------------------------------------------------

       creatingMethod: function (nodeID, methodName) {
       },

       // TODO: deletingMethod

       // -- callingMethod ------------------------------------------------------------------------

       callingMethod: function ( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
       },

       // TODO: creatingEvent, deltetingEvent, firingEvent

       // -- executing ----------------------------------------------------------------------------

       executing: function (nodeID, scriptText, scriptType) {
       },

       // == JigLib ===============================================================================

       update: function() {
          var activeObj;
          var posRotProp;
          var pos, rot;
          var sceneNode = this.scenes["index-vwf"];

          this.now = (new Date()).getTime();
          if ( this.enable && sceneNode && sceneNode.system ) {

             var inttime = (this.now - this.lastTime) / 1000;
             if (inttime > 0.05) inttime = 0.05;
             sceneNode.system.integrate(inttime);

             this.updating = true;
             for ( var nodeID in this.active ) {
                activeObj = this.active[nodeID];
                if ( activeObj && activeObj.jlObj ) {
                    pos = activeObj.jlObj.get_currentState().position;
                    rot = GLGE.Mat4( activeObj.jlObj.get_currentState().get_orientation().glmatrix );
                    posRot = [ pos[0], pos[1], pos[2], rot ];
                    vwf.setProperty( nodeID, "posRotMatrix", posRot );
                }
             }
             this.updating = false;
          }
          this.lastTime = this.now;
       },

       initScene: function( sceneNode ) {
          var propValue;
          if ( !sceneNode.initialized ) {
//             if ( sceneNode.system ) {
//                var cs = vwf.getProperty( sceneNode.ID, "collisionSystem", propValue );
//                if ( cs && cs.constructor == Array && cs.length >= 10 ) {
//                    this.settingProperty( sceneNode.ID, "collisionSystem", cs );
//                } else { 
//                    sceneNode.system.setCollisionSystem( false ); 
//                }
//             }                
//             this.settingProperty( sceneNode.ID, "gravity", vwf.getProperty( sceneNode.ID, "gravity", propValue ) );
             sceneNode.initialized = true;
          }
       },

       initPhysics: function( node ) {
//          var propValue;
//          this.settingProperty( node.ID, "physics", vwf.getProperty( node.ID, "physics", propValue ) );
//          //propValue = vwf.getProperty( node.ID, "physicsDef", propValue );
//          if ( propValue != "" ) this.settingProperty( node.ID, "mass", propValue );
//          this.settingProperty( node.ID, "mass", vwf.getProperty( node.ID, "mass", propValue ) );
//          this.settingProperty( node.ID, "restitution", vwf.getProperty( node.ID, "restitution", propValue ) );
//          this.settingProperty( node.ID, "friction", vwf.getProperty( node.ID, "friction", propValue ) );
//          this.settingProperty( node.ID, "rotVelocityDamping", vwf.getProperty( node.ID, "rotVelocityDamping", propValue ) );
//          this.settingProperty( node.ID, "linVelocityDamping", vwf.getProperty( node.ID, "linVelocityDamping", propValue ) );
//          
//          propValue = vwf.getProperty( node.ID, "position", propValue );
//          if ( propValue && propValue != "" ) this.settingProperty( node.ID, "position", propValue );
//          propValue = vwf.getProperty( node.ID, "x", propValue );
//          if ( propValue && propValue != "" ) this.settingProperty( node.ID, "x", propValue );
//          propValue = vwf.getProperty( node.ID, "y", propValue );
//          if ( propValue && propValue != "" ) this.settingProperty( node.ID, "y", propValue );
//          propValue = vwf.getProperty( node.ID, "z", propValue );
//          if ( propValue && propValue != "" ) this.settingProperty( node.ID, "z", propValue );
       },

       findMeshChildren: function( nodeID, childList ) {
          var children = vwf.children( nodeID );

          if ( this.nodes[nodeID] &&  this.nodes[nodeID].extendsID == "http-vwf-example-com-types-mesh" ) {
             childList.push( this.nodes[nodeID] ); 
          }

          if ( children && children.length ) {
             for ( var i = 0; i < children.length; i++ ) {
                this.findMeshChildren( children[i], childList );
             }
          }
       },

    } );

    // == Private functions ========================================================================

    function calcRadius( offset, verts ) {
       var radius = 0;
       var temp = 0;
       var iIndex = -1;
       for ( var i = 0; i < verts.length; i++ ) {
          temp = ( verts[i][0] - offset[0] ) ^ 2 + ( verts[i][1] - offset[1] ) ^ 2 + + ( verts[i][2] - offset[2] ) ^ 2;
          if ( temp > radius ) {
             radius = temp; 
             iIndex = i;
          }
       }

       raduis = Math.sqrt( radius );
       return radius;
    }

} );
