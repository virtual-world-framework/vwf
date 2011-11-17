define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

       // == Module Definition ====================================================================

       // -- initialize ---------------------------------------------------------------------------

       initialize: function() {

          this.nodes = {}; // maps id => { property: value, ... }
          this.scenes = {};
          this.active = {};
          this.enable = false;
          this.lastTime = 0;
          this.delayedProperties = {};

          var self = this;
          //setInterval( function() { self.update() }, 80 );
          this.updating = false;

       },

       // == Model API ============================================================================

       // -- creatingNode -------------------------------------------------------------------------

       creatingNode: function(nodeID, childID, childExtendsID, childImplementsIDs,
          childSource, childType, childName, callback /* ( ready ) */) {

          switch (childExtendsID) {
             case "appscene-vwf":
             case "http-vwf-example-com-types-glge":
                this.scenes[ childID ] = {};
                this.scenes[ childID ].ID = childID;
                this.scenes[ childID ].extendsID = childExtendsID;
                this.scenes[ childID ].implementsIDs = childImplementsIDs;
                this.scenes[ childID ].source = childSource;
                this.scenes[ childID ].type = childType;
                this.scenes[ childID ].system = jigLib.PhysicsSystem.getInstance();
                this.scenes[ childID ].initialized = false;
                break;

             case "http-vwf-example-com-types-node3":
             case "http-vwf-example-com-types-mesh":
                this.nodes[ childID ] = {};
/* hardcoded */ this.nodes[ childID ].sceneID = "index-vwf";
                this.nodes[ childID ].ID = childID;
                this.nodes[ childID ].extendsID = childExtendsID;
                this.nodes[ childID ].implementsIDs = childImplementsIDs;
                this.nodes[ childID ].source = childSource;
                this.nodes[ childID ].type = childType;
                
                break;
          }

       },

       // TODO: deletingNode

       // -- addingChild --------------------------------------------------------------------------

       addingChild: function (nodeID, childID, childName) {
    
          if ( this.scenes[ nodeID ] ) {
             var sceneNode = this.scenes[ nodeID ];
//             if ( !sceneNode.initialized ) {
//                this.initScene( sceneNode );
//             }
          }

          if ( this.nodes[ childID ] ) {
             var node = this.nodes[ childID ];
             //this.nodes[ childID ].jigLibObj = undefined;
             //this.initPhysics( node );
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

            if ( propertyName == "physics" ) { 
                console.info( "   settingProperty( " + nodeID+", " + propertyName + ", " + propertyValue + " )");
            }

            if ( this.updating ) {
            switch ( propertyName ) { 
                case "position":
                case "rotation":
                case "posRotMatrix":
                    return;
                    break;
                }
            }

            if ( nodeID != "http-vwf-example-com-types-camera-maincamera" ) {
                if ( propertyName == "velocity" ) { 
                    console.info( "   settingProperty( " + nodeID+", " + propertyName + ", " + propertyValue + " )");
                }
            }
           
            var activeNode  = this.active[ nodeID ];
            var node = this.nodes[ nodeID ];
            var scene = this.scenes[ nodeID ]

             if ( node && node.jigLibObj ) { 
                if ( propertyName == "velocity" ) 
                    console.info( "     node is valid and jiblib object created" );
                 scene = this.scenes[ node.sceneID ];  
                 switch ( propertyName ) {
                    case "x":
                        node.jigLibObj.set_x( propertyValue );    
                        break;
                    case "y":
                        node.jigLibObj.set_y( propertyValue );    
                        break;
                    case "z":
                        node.jigLibObj.set_z( propertyValue );    
                        break;
                    case "position":
                        if ( activeNode && activeNode.jlObj ) {
//                          if ( activeNode.offset ) {
//                              var newPos = [ propertyValue[0] - activeNode.offset[0], propertyValue[1] - activeNode.offset[1], propertyValue[2] - activeNode.offset[2] ];
//                              activeNode.jlObj.moveTo( newPos );
//                          } else {                     
                            activeNode.jlObj.moveTo( propertyValue ); 
//                          }   
                        } else {
                            node.jigLibObj.moveTo( propertyValue ); 
                        }   
                        break;                       
                    case "rotation":                       
                        break;                    
                    case "eulers":
                        if ( activeNode ) { }
                        break;
                    case "scale":
                        if ( activeNode ) { }
                        break;
                    case "mass":
                        node.jigLibObj.set_mass( propertyValue );
                        break;
                    case "restitution":
                        node.jigLibObj.set_restitution( propertyValue );
                        break;                       
                    case "friction":
                        node.jigLibObj.set_friction( propertyValue );
                        break;                    
                    case "rotVelocityDamping":
                        node.jigLibObj.set_rotVelocityDamping( propertyValue );
                        break;    
                    case "linVelocityDamping":
                        node.jigLibObj.set_linVelocityDamping( propertyValue );
                        break; 
                    case "velocity":
                        console.info( nodeID + ".velocity = " + propertyValue );
                        node.jigLibObj.setVelocity( propertyValue ); // should be [ x, y, z ]
                        break;                        
                }
            } else if ( node && !scene ) {
                scene = this.scenes[ node.sceneID ];
                if ( propertyName == "physics" ) {
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
                                    var scale = vwf.getProperty( nodeID, "scale", undefined );
                                    var pos = vwf.getProperty( nodeID, "position", undefined );
                                    var vt;
                                    for ( var i = 0; i < childList.length; i++ ) {
    
                                        if ( !node.jigLibMeshes[ childList[i].ID ] ) {
                                            verts = vwf.getProperty( childList[i].ID, "vertices", v1 );
                                            for ( var j = 0; j < verts.length; j++ ) {
                                                vt = verts[j];
                                                vt[0] = vt[0] * scale[0];
                                                vt[1] = vt[1] * scale[1];
                                                vt[2] = vt[2] * scale[2];
                                                verts[j] = vt;
                                            }
                                            vertIndices = vwf.getProperty( childList[i].ID, "vertexIndices", v2 );

                                            node.jigLibMeshes[ childList[i].ID ] = new jigLib.JTriangleMesh();
                                            node.jigLibMeshes[ childList[i].ID ].createMesh(verts, vertIndices);
                                            //console.info( childList[i].ID + " created JTriangleMesh" ); 
                                            scene.system.addBody( node.jigLibMeshes[ childList[i].ID ] );
                                        }
                                    }
                                }
                                console.info( "WARNING: Unable to find any meshes to add to the physics system" );
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
                                    console.info( nodeID + " created JBox ( " + width + ", " + depth + ", " + height + " )" );                                
                                    //console.info( nodeID + " created JBox with offset = " + offset );                                
                                    node.jigLibObj = new jigLib.JBox( null, width, depth, height );
                                    scene.system.addBody( node.jigLibObj );
                                    console.info( "     JBox object created" );
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
                                    console.info( "     JSphere object created" );
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
                            //node.jigLibObj = undefined;
                            break;
                        }
                    }

                    if ( this.delayedProperties[nodeID] ) {
                        var props = this.delayedProperties[nodeID];
                        //console.info( "     START SETTING delayedProperties ----" );
                        for ( var propName in props ) {
                            //console.info( id + " delayed property set: " + propertyName + " = " + props[propertyName] );
                            this.settingProperty( nodeID, propName, props[propName] );
                        } 
                        //console.info( "     DONE SETTING delayedProperties ----" );
                        delete this.delayedProperties[nodeID];                       
                    }

                } else {
                    if ( node ) {
                        //console.info( "STORING settingProperty( " + nodeID+", " + propertyName + ", " + propertyValue + " )" )
                        var propArray;
                        if ( !this.delayedProperties[nodeID] ) {
                            this.delayedProperties[nodeID] = {};
                        }
                        propArray = this.delayedProperties[nodeID];

                        propArray[ propertyName ] = propertyValue; 
                    }                      
                }
            } else {
                if ( scene && scene.system ) {
                    switch ( propertyName ) {
                        case "gravity":
                            scene.system.setGravity( propertyValue );
                            break;
                        case "collisionSystem": {
                            var pv = propertyValue;
                            if ( pv.constructor == Array ) {
                                switch ( pv.length ) {
                                    case 10:
                                        scene.system.setCollisionSystem( pv[0], pv[1], pv[2], pv[3], pv[4], pv[5], pv[6], pv[7], pv[8], pv[9] );
                                        break;
                                    case 1:
                                        scene.system.setCollisionSystem( pv[0] );
                                        break;    
                                    }                             
                                }           
                                break;
                            }
                        case "loadDone":
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
//                    case "velocity":
//                       propertyValue = node.jigLibObj.getVelocity( node.jigLibObj.get_position() );
//                       break;
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

       creatingMethod: function (nodeID, methodName, methodParameters, methodBody) {
       },

       // TODO: deletingMethod

       // -- callingMethod ------------------------------------------------------------------------

       callingMethod: function (nodeID, methodName, methodParameters) {
       },

       // TODO: creatingEvent, deltetingEvent, firingEvent

       // -- executing ----------------------------------------------------------------------------

       executing: function (nodeID, scriptText, scriptType) {
       },

       ticking: function( vwfTime ) {

            var elaspedTime = vwfTime - this.lastTime;
            this.lastTime = vwfTime;
            if ( this.enable ) {
                if ( elaspedTime > 0 ) {
                    var activeObj, posRotProp, pos, rot;
                    var sceneNode = this.scenes["index-vwf"];               

                    if ( sceneNode && sceneNode.system ) {
                        sceneNode.system.integrate( elaspedTime );
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
                }
            }
              
       },

       // == JigLib ===============================================================================


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
