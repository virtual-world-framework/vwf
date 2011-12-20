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
          this.updating = false;

       },

       // == Model API ============================================================================

       // -- creatingNode -------------------------------------------------------------------------

       creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
          childSource, childType, childName, callback /* ( ready ) */) {

          //this.logger.enable = true;
          this.logger.info( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs,
                            childSource, childType, childName );
          //this.logger.enable = false;

          switch ( childExtendsID ) {
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
                this.scenes[ childID ].propertyMap = {};
                break;

             case "http-vwf-example-com-types-node3":
             case "http-vwf-example-com-types-mesh":
                this.nodes[ childID ] = {};
/* hardcoded */ this.nodes[ childID ].sceneID = "index-vwf";
                this.nodes[ childID ].name = childName;
                this.nodes[ childID ].ID = childID;
                this.nodes[ childID ].parentID = nodeID;
                this.nodes[ childID ].extendsID = childExtendsID;
                this.nodes[ childID ].implementsIDs = childImplementsIDs;
                this.nodes[ childID ].source = childSource;
                this.nodes[ childID ].type = childType;
                
                break;
          }
          
       },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            this.logger.info( "deletingNode", nodeID );

            if ( this.active[ nodeID ] ) {
                delete this.active[ nodeID ];
            } 
                       
            if ( this.nodes[ nodeID ] ) {
                var node = this.nodes[ nodeID ];
                var scene = this.scenes[ node.sceneID ];
                if ( node.jigLibObj ) {
                    if ( node.jigLibObj ) {
                        if ( scene ) scene.system.removeBody( node.jigLibObj );
                        node.jigLibObj = undefined;
                    }
                }
                if ( node.jigLibMeshes ) {
                    for ( var j = 0; j < node.jigLibMeshes.length; j++ ) {
                        if ( scene ) scene.system.removeBody( node.jigLibMeshes[ j ] );
                    }
                    node.jigLibMeshes = undefined;
                }
                delete this.nodes[ nodeID ];
            }

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {

            this.logger.info( "addingChild", nodeID, childID, childName );

        },

        // -- movingChild --------------------------------------------------------------------------

        movingChild: function( nodeID, childID, childName ) {

            this.logger.info( "movingChild", nodeID, childID, childName );

        },

        // -- removingChild ------------------------------------------------------------------------

        removingChild: function( nodeID, childID, childName ) {

            this.logger.info( "removingChild", nodeID, childID, childName );

        },

        // -- parenting ----------------------------------------------------------------------------

        parenting: function( nodeID ) {

            this.logger.info( "parenting", nodeID );

        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function( nodeID ) {

            this.logger.info( "childrening", nodeID );

        },

        // -- naming -------------------------------------------------------------------------------

        naming: function( nodeID ) {

            this.logger.info( "naming", nodeID );

        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {

            //this.logger.enable = true;
            this.logger.info( "creatingProperty", nodeID, propertyName, propertyValue );
            //this.logger.enable = false;

            if ( !( propertyValue === undefined ) ) {
                var node = this.nodes[ nodeID ];
                if ( node ) {
                    var scene = this.scenes[ node.sceneID ];
                    if ( scene && !scene.initialized ) {
                        var pm;
                        if ( !scene.propertyMap[ nodeID ] ) {
                            scene.propertyMap[ nodeID ] = {};
                            scene.propertyMap[ nodeID ].hasPhysics = false;
                        }
                        pm = scene.propertyMap[ nodeID ];
                        pm[ propertyName ] = propertyValue;
                        if ( !pm.hasPhysics ) {
                            pm.hasPhysics = isPhysicsProp.call( this, propertyName );    
                        }
                    } else {
                        if ( node.jigLibObj ) {
                            this.settingProperty( nodeID, propertyName, propertyValue );
                        } else {
                            if ( propertyName == "physics" ) {
                                this.settingProperty( nodeID, propertyName, propertyValue );
                                if ( this.delayedProperties[ nodeID ] ) {
                                    var propValue;
                                    for ( propName in this.delayedProperties[ nodeID ] ) {
                                        propValue = this.delayedProperties[ nodeID ][ propName ];
                                        this.settingProperty( nodeID, propName, propValue );
                                    }
                                    delete this.delayedProperties[ nodeID ];
                                }
                            } else {
                                if ( !this.delayedProperties[ nodeID ] ) {
                                    this.delayedProperties[ nodeID ] = {};
                                }
                                this.delayedProperties[ nodeID ][ propertyName ] = propertyValue;
                            }                
                        }

                    }
                } else {
                    var scene = this.scenes[ nodeID ];
                    if ( scene ) {
                        this.settingProperty( nodeID, propertyName, propertyValue );
                    }
                }
            }

        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;
            //this.logger.enable = !this.updating;
            //if (!( ( nodeID == "http-vwf-example-com-types-camera" ) || ( nodeID == "http-vwf-example-com-types-camera-maincamera" ) ) )
                this.logger.info( "settingProperty", nodeID, propertyName, propertyValue );
            //this.logger.enable = false;

            if ( this.updating ) {
                switch ( propertyName ) { 
                    case "position":
                    case "rotation":
                    case "posRotMatrix":
                        return;
                        break;
                    }
            }

            var activeNode  = this.active[ nodeID ];
            var node = this.nodes[ nodeID ];
            var scene = this.scenes[ nodeID ]

            if ( node && node.jigLibObj ) {
                //console.info( "jiglib-model.settingProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )" );
             
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
                case "scale": {
//                        var physics = this.gettingProperty( nodeID, "physics", [] );
//                        physicsType = ( physics.constructor == Array ) ? physics[0] : physics;
//                        switch( physicsType ) {
//                            case "box":
//                                createJBox.call( this, nodeID, propertyValue, undefined );
//                                break;
//                            case "sphere":
//                                createJSphere.call( this, nodeID, propertyValue, undefined );
//                                break;
//                            case "mesh":
//                                createJMesh.call( this, nodeID, propertyValue );
//                                break;                            
//                        }

                    }
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
//                    console.info( nodeID + ".velocity = " + propertyValue );
                    node.jigLibObj.setVelocity( propertyValue ); // should be [ x, y, z ]
                    break;                        
                }
            } else if ( node && !scene ) {
                scene = this.scenes[ node.sceneID ];
                if ( propertyName == "physics" ) {
                    if ( scene && scene.system && propertyValue ) {
                        //console.info( "**  jiglib-model.settingProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )" );
                        var type = ( propertyValue.constructor == Array ) ? propertyValue[0] : propertyValue;
                        switch ( type ) {
                            case "mesh": {
                                createJMesh.call( this, nodeID, undefined );
                            }
                            break;
                            case "box": {
                                createJBox.call( this, nodeID, undefined, propertyValue );
                            }
                            break;
                            case "sphere": {
                                createJSphere.call( this, nodeID, undefined, propertyValue );
                            }
                            break;
                            case "plane": {
                                createJPlane.call( this, nodeID, propertyValue );
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
                    //console.info( "     jiglib-model.settingProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )" );
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
                            if ( propertyValue && !scene.initialized ) {
                                initializeScene.call( this, scene ); 
                            }
                            this.enable = propertyValue;
                            //this.enable = false;
                            break;
                    }
                }
            }

            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            //this.logger.enable = true;
            //if (!( ( nodeID == "http-vwf-example-com-types-camera" ) || ( nodeID == "http-vwf-example-com-types-camera-maincamera" ) ) )
                this.logger.info( "gettingProperty", nodeID, propertyName, propertyValue );
            //this.logger.enable = false;
          
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



        // -- creatingMethod ------------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodName, methodBody ) {

            this.logger.info( "creatingMethod", nodeID, methodName, methodName, methodBody );

        },


        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) {

            this.logger.info( "creatingMethod", nodeID, methodName, methodParameters );

        },


        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {

            this.logger.info( "creatingEvent", nodeID, eventName, eventParameters );

        },

        // TODO: deletingEvent

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {

            this.logger.info( "firingEvent", nodeID, eventName, eventParameters );

        },


        // -- executing ----------------------------------------------------------------------------

        executing: function (nodeID, scriptText, scriptType) {

            //this.logger.info( "callingMethod", nodeID, scriptText, scriptType );
            return undefined;

        },


        // == ticking =============================================================================

        ticking: function( vwfTime ) {

            var elaspedTime = vwfTime - this.lastTime;
            this.lastTime = vwfTime;
            
            if ( this.enable ) {
                if ( elaspedTime > 0 ) {
                    if (elaspedTime > 0.05) elaspedTime = 0.05;
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
                                this.kernel.setProperty( nodeID, "posRotMatrix", posRot );
                            }
                        }
                        this.updating = false;
                    }
                }
            }
        },

    } );

    // == Private functions ==================================================================
    
    // == calcRadius =========================================================================

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

//    // == findMeshChildren =================================================================

//    function findMeshChildren( nodeID, childList ) {
//        var children = this.kernel.children( nodeID );

//        if ( this.nodes[nodeID] &&  this.nodes[nodeID].extendsID == "http-vwf-example-com-types-mesh" ) {
//            childList.push( this.nodes[nodeID] ); 
//        }

//        if ( children && children.length ) {
//            for ( var i = 0; i < children.length; i++ ) {
//                findMeshChildren.call( this, children[i], childList );
//            }
//        }
//    }

    // == createJBox =====================================================================

    function createJBox( nodeID, scale, def ) {

        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {
                var v1, v2;
                var width = 1;
                var depth = 1;
                var height = 1;
                var pos = this.kernel.getProperty( nodeID, "position" );
                var useBoundingBox = scale || !def;

                if ( useBoundingBox ) { 
                    var bBox = this.kernel.getProperty( nodeID, "boundingbox" );
                    var offset = this.kernel.getProperty( nodeID, "centerOffset" );
                    if ( bBox.max[0] - bBox.min[0] != 0 ) width = ( bBox.max[0] - bBox.min[0] );
                    if ( bBox.max[1] - bBox.min[1] != 0 ) depth = ( bBox.max[1] - bBox.min[1] );
                    if ( bBox.max[2] - bBox.min[2] != 0 ) height = ( bBox.max[2] - bBox.min[2] );                                
                } else if ( def.constructor == Array && def.length == 4 ) {
                    width = def[ 1 ];
                    depth = def[ 2 ]
                    height = def[ 3 ];
                }

                //console.info( nodeID + " created JBox ( " + width + ", " + depth + ", " + height + " )" );                                
                
                if ( node.jigLibObj ) {
                    scene.system.removeBody( node.jigLibObj );
                    node.jigLibObj = null;
                }                
                node.jigLibObj = new jigLib.JBox( null, width, depth, height );

                if ( node.jigLibObj ) {
                    scene.system.addBody( node.jigLibObj );
                    if ( pos ) node.jigLibObj.moveTo( pos )
                    this.active[ nodeID ] = {};
                    this.active[ nodeID ].jlObj = node.jigLibObj;
                    this.active[ nodeID ].offset = offset;
                }
            }
        }    
    
    }

    // == createJSphere =====================================================================

    function createJSphere( nodeID, scale, def ) {

        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {
                var v1, v2;
                var verts = this.kernel.getProperty( nodeID, "vertices" );
                var offset = this.kernel.getProperty( nodeID, "centerOffset" );
                var pos = this.kernel.getProperty( nodeID, "position" );

                var raduis = 10;
                var useBoundingBox = scale || !def;

                if ( useBoundingBox ) {
                    var cRadius = 0; 
                    if ( !scale ) scale = this.kernel.getProperty( nodeID, "scale" );
                    for ( var j = 0; j < verts.length; j++ ) {
                        vt = verts[j];
                        vt[0] = vt[0] * scale[0];
                        vt[1] = vt[1] * scale[1];
                        vt[2] = vt[2] * scale[2];
                        verts[j] = vt;
                    }
                    cRadius = calcRadius.call( this, offset, verts );
                    if ( cRadius > 0 ) raduis = cRadius; 
                } else if ( def.constructor == Array && def.length == 2 ) {
                    raduis = def[1];
                } 
            
                if ( node.jigLibObj ) {
                    scene.system.removeBody( node.jigLibObj );
                    node.jigLibObj = null;
                }        
                node.jigLibObj = new jigLib.JSphere( null, raduis );
                if ( node.jigLibObj ) {
                    scene.system.addBody( node.jigLibObj );
                    //console.info( "     JSphere object created" );
                    this.active[ nodeID ] = {};
                    this.active[ nodeID ].jlObj = node.jigLibObj;
                    this.active[ nodeID ].offset = this.kernel.getProperty( nodeID, "centerOffset" );
                }
            }
        }

    }


    // == createJMesh =====================================================================

    function createJMesh( nodeID, scale ) {

        //console.info( "createJMesh( "+nodeID+","+scale+" )" )
        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {
                if ( node.jigLibMeshes ) {
                    for ( var j = 0; j < node.jigLibMeshes.length; j++ ) {
                        scene.system.removeBody( node.jigLibMeshes[ j ] );
                    }
                }
                node.jigLibMeshes = [];
                var pos = this.kernel.getProperty( nodeID, "position" );
                var meshDataList = this.kernel.getProperty( nodeID, "meshData" );
                if ( meshDataList ) {
                    var verts, vertIndices, scale, vt, jMesh;
                    for ( var i = 0; i < meshDataList.length; i++ ) {
                        verts = meshDataList[i].vertices;
                        vertIndices = meshDataList[i].vertexIndices;
                        scale = meshDataList[i].scale;
                        for ( var j = 0; j < verts.length; j++ ) {
                            vt = verts[j];
                            vt[0] = vt[0] * scale[0];
                            vt[1] = vt[1] * scale[1];
                            vt[2] = vt[2] * scale[2];
                            verts[j] = vt;
                        }

//                        console.info("=========== "+nodeID+ "===========");
//			            console.info("=====================================================================================");
//			            for (var k = 0; k < verts.length; k++) {
//				            console.info(k + ".	x: " + verts[k][0] + "	y: " + verts[k][1] + "	z: " + verts[k][2]);
//			            }
//			            console.info("=====================================================================================");
//			            console.info("=========== "+nodeID+" ===========");

//                        console.info( nodeID + " created JTriangleMesh()" );
                        jMesh = new jigLib.JTriangleMesh();
                        node.jigLibMeshes.push( jMesh );
                        jMesh.createMesh( verts, vertIndices );

                        scene.system.addBody( jMesh );
                        //if ( pos ) jMesh.moveTo( pos );
                    }
                }
            }
        }
    }

    // == createJPlane =====================================================================

    function createJPlane( nodeID, physicsDef ) {

        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {
                var normal = [0, 0, 1, 0];
                if ( physicsDef.constructor == Array ) {
                    switch ( physicsDef.length ) {
                        case "2":
                            if ( physicsDef[1].constructor == Array ) {
                                if ( physicsDef[1].length == 4 ) {
                                    normal = physicsDef[1];
                                }
                            }
                            break;
                        case "5":
                            for ( var i = 0; i < 4; i++ ) {
                                normal[i] = physicsDef[i+1];
                            }
                            break;
                    }    
                }

                if ( node.jigLibObj ) {
                    scene.system.removeBody( node.jigLibObj );
                    node.jigLibObj = null;
                }
                //console.info( nodeID + " created JPlane ( null, " + normal + " )" );                                
                node.jigLibObj = new jigLib.JPlane( null, normal );

                scene.system.addBody( node.jigLibObj );
            }
        }
    }


    // == isPhysicsProp =====================================================================

    function isPhysicsProp( pn ) {
        var physicsProp = false;
        switch ( pn ) {
            case "physics":
            case "mass":     
            case "velocity":
            case "restitution":
            case "friction":
            case "rotVelocityDamping":     
            case "linVelocityDamping":
                physicsProp = true;
                break;
            default:
                physicsProp = false;
                break;                
        }
        return physicsProp;
    }

    // == initializeScene ===================================================================

    function initializeScene( scene ) {
        var pm;
        for ( nodeID in scene.propertyMap ) {
            pm = scene.propertyMap[ nodeID ];
            if ( pm.hasPhysics ) {
                initializeObject.call( this, nodeID, pm );
            }
        }
        scene.propertyMap = {};
        scene.initialized = true;
    }

    // == initializeObject ===================================================================

    function initializeObject( nodeID, props ) {
        var physicsDef, physicsType, scale;
        if ( props.physics ) {
            physicsDef = props.physics;
            physicsType = ( physicsDef.constructor == Array ) ? physicsDef[0] : physicsDef;
            scale = props.scale

            // set up the physics object for each 
            switch( physicsType ) {
                case "box":
                    if ( scale ) {
                        createJBox.call( this, nodeID, scale, undefined );
                    } else {
                        createJBox.call( this, nodeID, undefined, physicsDef );
                    }
                    break;
                case "sphere":
                    if ( scale ) {
                        createJSphere.call( this, nodeID, scale, undefined );
                    } else {
                        createJSphere.call( this, nodeID, undefined, physicsDef );
                    }
                    break;
                case "mesh":
                    createJMesh.call( this, nodeID, scale );
                    break;
                case "plane":
                    createJPlane.call( this, nodeID, physicsDef );
                    break;                            
            }  
            
            // set the rest of the non physics props
            for ( propertyName in props ) {
                switch( propertyName ) {
                    case "physics":
                    case "scale":
                        break;
                    default:
                        if ( !isPhysicsProp.call( this, propertyName ) ) {
                            this.settingProperty( nodeID, propertyName, props[ propertyName ] );
                        }
                        break;    
                }
            } 
            
            // set the physics props
            for ( propertyName in props ) {
                switch( propertyName ) {
                    case "physics":
                    case "scale":
                        break;
                    default:
                        if ( isPhysicsProp.call( this, propertyName ) ) {
                            this.settingProperty( nodeID, propertyName, props[ propertyName ] );
                        }
                        break;    
                }
            }                      
        }
    }

} );
