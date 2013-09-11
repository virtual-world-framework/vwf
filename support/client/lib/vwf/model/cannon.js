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

/// @module vwf/model/cannon
/// @requires vwf/model

define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {

            this.nodes = {}; // maps id => { property: value, ... }
            this.scenes = {};
            this.prototypes = {};

            this.active = {};

            this.enabled = false;
            this.lastTime = 0;

            this.updating = false;

            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "prototypes": false,
                "ticking": 1
            };

            this.propWithInit = {
                "angularVelocity": true,
                "initVelocity": true,
                "quaternion": true,
                "position": true
            };

        },

       // == Model API ============================================================================

       // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {

            var self = this;
            var kernel = this.kernel;
            var createdCannonObj = false;
            var childURI = ( nodeID === 0 ? childIndex : undefined );
          
            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = ifPrototypeGetId.call( this, nodeID, childID );
            if ( prototypeID !== undefined ) {
                
                if ( this.debug.prototypes ) {
                    this.logger.infox( "prototype: ", prototypeID );
                }

                this.prototypes[ prototypeID ] = {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsID: childImplementsIDs,
                    source: childSource, 
                    type: childType,
                    uri: childURI,
                    name: childName,
                };
                return;                
            }   


            if ( childExtendsID && this.kernel.test( childExtendsID,
                "self::element(*,'http://vwf.example.com/scene.vwf')", childExtendsID ) ) {

                if ( this.scenes[ childID ] === undefined ) {
                    this.scenes[ childID ] = {
                        "ID": childID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType,
                        "initialized": false,
                        "propertyMap": {}
                    };

                    console.info( "+++++ CREATING WORLD +++++ :" + childID )

                    var world = this.scenes[ childID ].world = new CANNON.World();
                    world.broadphase = new CANNON.NaiveBroadphase();
                    world.solver.iterations = 10;

                    createdCannonObj = true;
                }



            } else {

              switch ( childExtendsID && this.kernel.uri( childExtendsID ) ) {
                 case "http-vwf-example-com-cannon-physics3-vwf":
                 case "http://vwf.example.com/cannon/physics3.vwf":
                 //case "http://vwf.example.com/node3.vwf":
                    this.nodes[ childID ] = {
                        "sceneID": this.kernel.application(),
                        "name": childName,
                        "ID": childID,
                        "parentID": nodeID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType
                    };
                    createdCannonObj = true;
                    break;
                 case "http-vwf-example-com-cannon-contactmaterial-vwf":
                 case "http://vwf.example.com/cannon/contactmaterial.vwf":
                    if ( this.nodes[ nodeID ] ) {
                        var parentNode = this.nodes[ nodeID ];
                    }
                    break;

                }
            }

            if ( createdCannonObj ) {
                var ptPropValue;
                var protos = getPrototypes.call( this, kernel, childExtendsID );
                protos.forEach( function( prototypeID ) {
                    for ( var propertyName in kernel.getProperties( prototypeID ) ) {
                        //console.info( " 1    getting "+propertyName+" of: " + childExtendsID  );
                        ptPropValue = kernel.getProperty( childExtendsID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            //console.info( " 1    setting "+propertyName+" of: " + nodeID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
                childImplementsIDs.forEach( function( behaviorID ) {
                    for ( var propertyName in kernel.getProperties( behaviorID ) ) {
                        //console.info( "     2    getting "+propertyName+" of: " + behaviorID  );
                        ptPropValue = kernel.getProperty( behaviorID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            //console.info( "     2    setting "+propertyName+" of: " + nodeID + " to " + ptPropValue );
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
            }
          
        },

        // -- initializingNode ---------------------------------------------------------------------

        // Invoke an initialize() function if one exists.

        initializingNode: function( nodeID, childID ) {

            var scene = this.scenes[ childID ];
            var node = this.nodes[ childID ];

            if ( this.debug.initializing ) {
                this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 

            if ( scene && scene.world ) {
                if ( !scene.initialized ) {
                    initializeScene.call( this, scene );
                }
                this.enabled = true;

            }     
            return undefined;
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

            if ( this.active[ nodeID ] ) {
                delete this.active[ nodeID ];
            } 
                       
            if ( this.nodes[ nodeID ] ) {
                var node = this.nodes[ nodeID ];
                var scene = this.scenes[ node.sceneID ];
                if ( scene && node && node.rigidBody ) {
                    
                    scene.world.remove( node.rigidBody );
                    
                    node.shape = undefined;
                    node.rigidBody = undefined;
                }
                delete this.nodes[ nodeID ];
            }

        },

        // -- addingChild --------------------------------------------------------------------------

        //addingChild: function( nodeID, childID, childName ) {
        //},

        // -- movingChild --------------------------------------------------------------------------

        //movingChild: function( nodeID, childID, childName ) {
        //},

        // -- removingChild ------------------------------------------------------------------------

        //removingChild: function( nodeID, childID, childName ) {
        //},

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            
            if ( this.debug.properties ) {
                this.logger.infox( "C === creatingProperty ", nodeID, propertyName, propertyValue );
            }

            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( this.debug.properties ) {
                this.logger.infox( "  I === initializingProperty ", nodeID, propertyName, propertyValue );
            }

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
                        //if ( node.rigidBody ) {
                        this.settingProperty( nodeID, propertyName, propertyValue );
                        //}
                    }
                } else {
                    var scene = this.scenes[ nodeID ];
                    if ( scene ) {
                        this.settingProperty( nodeID, propertyName, propertyValue );
                    }
                }
            }

            return value;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;

            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }

            if ( propertyValue === undefined || propertyValue == null )
                return value;

            if ( propertyValue == "gravity" ) {
                debugger;
            }

            if ( this.updating && propertyName == "transform" ) {
                return;
            }

            var node = this.nodes[ nodeID ];
            var scene = this.scenes[ nodeID ];
            var pv = propertyValue;

            if ( node && node.rigidBody ) {

                // maybe these initial values should be properties
                // going to try not exposing the properties 
                // and just manage the setting the values in the driver
                if ( this.propWithInit[ propertyName ] ) {
                    switch ( propertyName ) {
                        
                        case "angularVelocity":
                            // initAngularVelocity vector value
                            if ( propertyValue instanceof Array ) {
                                if ( propertyValue.length > 2 ) {
                                    node.rigidBody.initAngularVelocity.set( propertyValue[0], propertyValue[1], propertyValue[2] ); 
                                }                       
                            }
                            break; 

                        case "velocity":
                            // initVelocity vector value
                            if ( propertyValue instanceof Array ) {
                                if ( propertyValue.length > 2 ) {
                                    node.rigidBody.initVelocity.set( propertyValue[0], propertyValue[1], propertyValue[2] ); 
                                }                       
                            }
                            break;   

                        case "transform":
                            //debugger;
                            var transform = goog.vec.Mat4.createFromArray( propertyValue || [] );
                            var quat = goog.vec.Quaternion.fromRotationMatrix4(
                                unscaledTransform.call( this,
                                    transform || goog.vec.Mat4.createIdentity(),
                                    goog.vec.Vec3.create(),
                                    goog.vec.Mat4.create()
                            ),
                            goog.vec.Quaternion.create()
                            );
                            node.rigidBody.initQuaternion.set( quat[0], quat[1], quat[2], quat[3] );

                            var translation = goog.vec.Vec3.create();
                            goog.vec.Mat4.getColumn( transform || goog.vec.Mat4.createIdentity(), 3, translation );
                            node.rigidBody.initPosition.set( translation[0], translation[1], translation[2] );

                            break;                    
                    }

                    delete this.propWithInit[ propertyName ];
                }


                scene = this.scenes[ node.sceneID ];  
                switch ( propertyName ) {
                    case "transform":
                    if ( node.rigidBody ) {
                        var transform = goog.vec.Mat4.createFromArray( propertyValue || [] );
                        var quat = goog.vec.Quaternion.fromRotationMatrix4(
                            unscaledTransform.call( this,
                                transform || goog.vec.Mat4.createIdentity(),
                                goog.vec.Vec3.create(),
                                goog.vec.Mat4.create()
                            ),
                            goog.vec.Quaternion.create()
                        );

                        if ( node.rigidBody.quaternion === undefined ) {
                            node.rigidBody.quaternion = new CANNON.Quaternion( quat[0], quat[1], quat[2], quat[3] );
                        } else {
                            node.rigidBody.quaternion.set( quat[0], quat[1], quat[2], quat[3] );
                        }

                        var translation = goog.vec.Vec3.create();
                        goog.vec.Mat4.getColumn( transform || goog.vec.Mat4.createIdentity(), 3, translation );
                        node.rigidBody.position.set( translation[0], translation[1], translation[2] );

                    }   
                    break;                       
                     
                case "mass":
                    pv = parseFloat( propertyValue );
                    if ( !isNaN( pv ) ) {
                        node.rigidBody.mass = value = pv;
                    }
                    break;

                case "force":
                    // vector value
                    if ( propertyValue instanceof Array ) {
                        if ( propertyValue.length > 2 ) {
                            node.rigidBody.force.set( propertyValue[0], propertyValue[1], propertyValue[2] ); 
                            value = propertyValue;
                        }                       
                    }
                    break;

                case "linearDamping":
                    pv = parseFloat( propertyValue );
                    if ( !isNaN( pv ) ) {
                        node.rigidBody.linearDamping = value = pv;
                    }
                    break;

                case "velocity":
                    // vector value
                    if ( propertyValue instanceof Array ) {
                        if ( propertyValue.length > 2 ) {
                            node.rigidBody.velocity.set( propertyValue[0], propertyValue[1], propertyValue[2] ); 
                            value = propertyValue;
                        }                       
                    }
                    break;

                case "angularVelocity":
                    // vector value
                    if ( propertyValue instanceof Array ) {
                        if ( propertyValue.length > 2 ) {
                            node.rigidBody.angularVelocity.set( propertyValue[0], propertyValue[1], propertyValue[2] );
                            value = propertyValue; 
                        }                       
                    }
                    break;

                case "angularDamping":
                    pv = parseFloat( propertyValue );
                    if ( !isNaN( pv ) ) {
                        node.rigidBody.angularDamping = value = pv;
                    }
                    break;


                }
            } else if ( node && !scene ) {
                scene = this.scenes[ node.sceneID ];
                if ( propertyName == "physics" ) {
                    if ( scene && scene.world && propertyValue ) {
                        var type = ( propertyValue.constructor == Array ) ? propertyValue[0] : propertyValue;
                        switch ( type ) {
                            case "mesh":
                                createMesh.call( this, nodeID, undefined );
                                break;
                            case "box":
                                createBox.call( this, nodeID, undefined, propertyValue );
                                break;
                            case "sphere":
                                createSphere.call( this, nodeID, undefined, propertyValue );
                                break;
                            case "plane":
                                createPlane.call( this, nodeID, propertyValue );
                                break;
                            default:
                                break;
                        }
                    }

                } 
            } else {
                if ( scene && scene.world ) {
                    switch ( propertyName ) {
                        case "gravity":
                            console.info( "setting gravity: " + propertyValue );
                            scene.world.gravity.set( propertyValue[0], propertyValue[1], propertyValue[2] );
                            break;
                        case "collisionSystem":
                            break;
                    }
                }
            }

            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
          
            var value = propertyValue;

            if ( this.debug.properties || this.debug.getting ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName, propertyValue );
            }

            if ( this.nodes[ nodeID ] ) {
                var node = this.nodes[ nodeID ];
                var canVec3 = undefined;
                if ( node && node.rigidBody ) {
                switch ( propertyName ) {

                    case "transform":
                        value = undefined; 
                        break;

                    case "mass":
                        value = propertyValue = node.rigidBody.mass;
                        break;

                    case "force":
                        // vector value
                        canVec3 = node.rigidBody.force; 
                        value = propertyValue = [ canVec3.x, canVec3.y, canVec3.z ];
                        break;

                    case "linearDamping":
                        value = propertyValue = node.rigidBody.linearDamping;
                        break;

                    case "velocity":
                        // vector value
                        canVec3 = node.rigidBody.velocity; 
                        value = propertyValue = [ canVec3.x, canVec3.y, canVec3.z ];
                        break;

                    case "angularVelocity":
                        // vector value
                        canVec3 = node.rigidBody.angularVelocity; 
                        value = propertyValue = [ canVec3.x, canVec3.y, canVec3.z ];
                        break;

                    case "angularDamping":
                        value = propertyValue = node.rigidBody.angularDamping;
                        break;

                    // case "private":
                    //     propertyValue = {
                    //         _currState: node.cannonObj._currState,
                    //         _oldState: node.cannonObj._oldState,
                    //         _velChanged: node.cannonObj._velChanged,
                    //         _storedPositionForActivation: node.cannonObj._storedPositionForActivation,
                    //         _lastPositionForDeactivation: node.cannonObj._lastPositionForDeactivation,
                    //     }
                    //     break;
                    }
                }
            } else if ( this.scenes[ nodeID ] ) {
                var sceneNode = this.scenes[ nodeID ];
                if ( sceneNode && sceneNode.world ) {
                    switch ( propertyName ) {
                        case "gravity":
                            propertyValue = [ sceneNode.world.gravity.x, sceneNode.world.gravity.y, sceneNode.world.gravity.z ];
                            console.info( "getting gravity: " + propertyValue );
                            break;
                        case "collisionSystem":
                            propertyValue = undefined;
                            break;
                    }
                }
                
            }
            return value;
        },



        // -- creatingMethod ------------------------------------------------------------------------

        //creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
        //},

        // -- callingMethod ------------------------------------------------------------------------

        //callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
        //},

        // -- creatingEvent ------------------------------------------------------------------------

        //creatingEvent: function( nodeID, eventName, eventParameters ) {
        //},

        // TODO: deletingEvent
        // -- firingEvent --------------------------------------------------------------------------

        // firingEvent: function( nodeID, eventName, eventParameters ) {
        //},

        // -- executing ----------------------------------------------------------------------------

        // executing: function (nodeID, scriptText, scriptType) {
        //    return undefined;
        //},

        // == ticking =============================================================================

        ticking: function( vwfTime ) {

            var elaspedTime = vwfTime - this.lastTime;
            this.lastTime = vwfTime;
            
            if ( this.enabled ) {
                if ( elaspedTime > 0 ) {
                    if ( elaspedTime > 0.05 ) elaspedTime = 0.05;

                    var activeObj, posRotProp, pos, rot, posRot;
                    var sceneNode = this.scenes[ this.kernel.application() ];

                    if ( sceneNode && sceneNode.world ) {
                        
                        sceneNode.world.step( elaspedTime );
                        
                        this.updating = true;
                        for ( var nodeID in this.active ) {
                            activeObj = this.active[ nodeID ];
                            if ( activeObj && activeObj.rigidBody ) {
                                
                                var pos = activeObj.rigidBody.position;
                                var quat = activeObj.rigidBody.quaternion;
                                
                                if ( this.debug.ticking !== 0 ) {
                                    this.debug.ticking++;
                                    if ( this.debug.ticking == 200 ) {
                                        this.logger.infox( activeObj.name + ".position = " + pos );
                                        this.logger.infox( activeObj.name + ".quat = " + quat );
                                        this.debug.ticking = 1;
                                    }
                                }

                                var transform = goog.vec.Mat4.createIdentity();
                                var translation = goog.vec.Vec4.createFromValues( pos.x, pos.y, pos.z, 1 );
                                
                                var scale = transformScale.call( this, transform, goog.vec.Vec3.create() );
                                var quaternion = quat ? goog.vec.Quaternion.createFromValues( quat.x, quat.y, quat.z, quat.w ) : goog.vec.Quaternion.createFromValues( 0, 0, 0, 1 );

                                goog.vec.Quaternion.toRotationMatrix4( quaternion, transform );
                                scaledTransform.call( this, transform, scale, transform );

                                goog.vec.Mat4.setColumn( transform, 3, translation );
                                
                                this.kernel.setProperty( nodeID, "transform", transform );
                            }
                        }
                        this.updating = false;
                    }
                }
            }
        },

    } );

    // == Private functions ==================================================================

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function ifPrototypeGetId( nodeID, childID ) {
        var ptID;
        if ( ( nodeID == 0 && childID != this.kernel.application() ) || this.prototypes[ nodeID ] !== undefined ) {
            if ( nodeID != 0 || childID != this.kernel.application() ) {
                ptID = nodeID ? nodeID : childID;
                if ( this.prototypes[ ptID ] !== undefined ) {
                    ptID = childID;
                }
                return ptID;
            } 
        }
        return undefined;
    }

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

    // == createBox =====================================================================

    function createBox( nodeID, scale, def ) {

        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {
                var v1, v2;
                var width = 1;
                var depth = 1;
                var height = 1;
                var pos = this.kernel.getProperty( nodeID, "translation" ) || [ 0, 0, 0 ];
                var useBoundingBox = scale || !def;

                if ( useBoundingBox ) { 
                    var bBox = this.kernel.getProperty( nodeID, "boundingbox" );
                    var offset = this.kernel.getProperty( nodeID, "centerOffset" ) || [ 0, 0, 0 ] ;
                    if ( bBox.max[0] - bBox.min[0] != 0 ) width = ( bBox.max[0] - bBox.min[0] );
                    if ( bBox.max[1] - bBox.min[1] != 0 ) depth = ( bBox.max[1] - bBox.min[1] );
                    if ( bBox.max[2] - bBox.min[2] != 0 ) height = ( bBox.max[2] - bBox.min[2] );                                
                } else if ( def.constructor == Array && def.length == 4 ) {
                    width = def[ 1 ];
                    depth = def[ 2 ]
                    height = def[ 3 ];
                }                              
                
                if ( node.rigidBody ) {
                    scene.world.remove( node.rigidBody );
                    node.rigidBody = undefined;
                }                

                //node.material = new CANNON.Material();
                node.material = undefined;
                node.shape = new CANNON.Box( new CANNON.Vec3( width, depth, height ) );
                node.rigidBody = new CANNON.RigidBody( 1, node.shape, node.material );

                if ( node.rigidBody ) {
                    
                    scene.world.add( node.rigidBody );

                    pos && node.rigidBody.position.set( pos[0], pos[1], pos[2] );
                    this.active[ nodeID ] = {
                        "rigidBody": node.rigidBody,
                        "offset": offset
                    }
                }
            }
        }    
    
    }

    // == createSphere =====================================================================

    function createSphere( nodeID, scale, def ) {

        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {
                var v1, v2;
                var verts = this.kernel.getProperty( nodeID, "vertices" );
                var offset = this.kernel.getProperty( nodeID, "centerOffset" ) || [ 0, 0, 0 ];
                var pos = this.kernel.getProperty( nodeID, "translation" )|| [ 0, 0, 0 ];

                var raduis = 10;
                var useBoundingBox = scale || !def;

                if ( useBoundingBox ) {
                    var cRadius = 0; 
                    if ( !scale ) scale = this.kernel.getProperty( nodeID, "scale" ) || [ 1, 1, 1 ];
                    for ( var j = 0; j < verts.length; j++ ) {
                        vt = verts[j];
                        if ( scale ) {
                            vt[0] = vt[0] * scale[0];
                            vt[1] = vt[1] * scale[1];
                            vt[2] = vt[2] * scale[2];
                        }
                        verts[j] = vt;
                    }
                    cRadius = calcRadius.call( this, offset, verts );
                    if ( cRadius > 0 ) raduis = cRadius; 
                } else if ( def.constructor == Array && def.length == 2 ) {
                    raduis = def[1];
                } 

                if ( node.rigidBody ) {
                    scene.world.remove( node.rigidBody );
                    node.rigidBody = undefined;
                }                

                //node.material = new CANNON.Material();
                node.material = undefined;
                node.shape = new CANNON.Sphere( raduis );
                node.rigidBody = new CANNON.RigidBody( 1, node.shape, node.material );

                if ( node.rigidBody ) {

                    scene.world.add( node.rigidBody );

                    pos && node.rigidBody.position.set( [ pos[0], pos[1], pos[2] ] );
                    
                    this.active[ nodeID ] = {
                        "rigidBody": node.rigidBody,
                        "offset": offset
                    }
                }
            
            }
        }

    }


    // == createMesh =====================================================================

    function createMesh( nodeID, scale ) {

        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {

                var pos = this.kernel.getProperty( nodeID, "translation" ) || [ 0, 0, 0 ];
                var meshDataList = this.kernel.getProperty( nodeID, "meshData" );
                
                if ( meshDataList ) {

                    if ( node.rigidBody ) {
                        scene.world.remove( node.rigidBody );
                        node.rigidBody = undefined;
                    }

                    node.shape = new CANNON.Compound();

                    var rawVerts, rawFaces;
                    var scale, offset, pos, poly, j;
                    var verts=[], faces=[];

                    for ( var i = 0; i < meshDataList.length; i++ ) {

                        rawVerts = meshDataList[i].vertices;
                        rawFaces = meshDataList[i].vertexIndices;
                        pos = meshDataList[i].position;
                        scale = meshDataList[i].scale || [ 1, 1, 1 ];

                        // Get vertices
                        for( j = 0; j < rawVerts.length; j += 1 ){
                            verts.push( new CANNON.Vec3( rawVerts[ j ][ 0 ],
                                                         rawVerts[ j ][ 1 ],
                                                         rawVerts[ j ][ 2 ] ) );
                        }

                        // Get faces
                        for( j = 0; j < rawFaces.length; j += 1 ){
                            faces.push( [ rawFaces[ j ][ 0 ], rawFaces[ j ][ 1 ], rawFaces[ j ][ 2 ] ] );
                        }

                        // Get offset
                        offset = new CANNON.Vec3( pos[ 0 ], pos[ 1 ], pos[ 2 ] );

                        // Construct polyhedron
                        poly = new CANNON.ConvexPolyhedron( verts, faces );

                        // Add to compound
                        node.shape.addChild( poly, offset );

                    }
                    //node.material = new CANNON.Material();
                    node.material = undefined;
                    node.rigidBody = new CANNON.RigidBody( 1, node.shape, node.material );
                    scene.world.add( node.rigidBody );

                }
            }
        }
    }

    // == createPlane =====================================================================

    function createPlane( nodeID, physicsDef ) {

        var node = this.nodes[ nodeID ];
        if ( node ) {
            var scene = this.scenes[ node.sceneID ];
            if ( scene ) {
                var normal = [ 0, 0, 1, 0 ];
				
				var pos = this.kernel.getProperty( nodeID, "translation" ) || [ 0, 0, 0 ];
                if ( physicsDef.constructor == Array ) {
                    switch ( physicsDef.length ) {
                        case 2:
                            if ( physicsDef[1].constructor == Array ) {
                                if ( physicsDef[1].length == 4 ) {
                                    normal = physicsDef[1];
                                }
                            }
                            break;
                        case 5:
                            for ( var i = 0; i < 4; i++ ) {
                                normal[i] = physicsDef[i+1];
                            }
                            break;
                    }    
                }

                if ( node.rigidBody ) {
                    scene.world.remove( node.rigidBody );
                    node.rigidBody = undefined;
                }

                var axis = new CANNON.Vec3();
                var angle = 0;
                var defaultNormal = new CANNON.Vec3( 0, 0, 1 );
                var desiredNormal = new CANNON.Vec3( normal[0], normal[1], normal[2] ); 

                axis = defaultNormal.cross( desiredNormal, axis );
                angle = Math.acos( defaultNormal.dot( desiredNormal ) );

                //node.material = new CANNON.Material();
                node.material = undefined;                
                node.shape = new CANNON.Plane();
                node.rigidBody = new CANNON.RigidBody( 0, node.shape, node.material );

                if ( node.rigidBody ) {
                    
                    node.rigidBody.quaternion.setFromAxisAngle( axis, angle );
                    pos && node.rigidBody.position.set( pos[0], pos[1], pos[2] );

                    scene.world.add( node.rigidBody );

                }

            }
        }
    }

    // == isPhysicsProp =====================================================================

    function isPhysicsProp( pn ) {
        var physicsProp = false;
        switch ( pn ) {
            case "physics":
            case "physicsDef":
            case "mass":     
            case "force":
            case "linearDamping":
            case "velocity":
            case "angularVelocity":     
            case "angularDamping":
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
        for ( var nodeID in scene.propertyMap ) {
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
            scale = props.scale;

            // set up the physics object for each 
            switch( physicsType ) {
                case "box":
                    if ( scale ) {
                        createBox.call( this, nodeID, scale, undefined );
                    } else {
                        createBox.call( this, nodeID, undefined, physicsDef );
                    }
                    break;
                case "sphere":
                    if ( scale ) {
                        createSphere.call( this, nodeID, scale, undefined );
                    } else {
                        createSphere.call( this, nodeID, undefined, physicsDef );
                    }
                    break;
                case "mesh":
                    createMesh.call( this, nodeID, scale );
                    break;
                case "plane":
                    createPlane.call( this, nodeID, physicsDef );
                    break;                            
            }  
            
            // set the rest of the non physics props
            for ( var propertyName in props ) {
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

    function unscaledTransform( transform, scale, resultTransform ) {
        var column = goog.vec.Vec4.create();
        goog.vec.Mat4.getColumn( transform, 0, column );
        goog.vec.Mat4.setColumn( resultTransform, 0, goog.vec.Vec4.scale( column, 1 / ( scale[0] = goog.vec.Vec4.magnitude( column ) ), column ) );
        goog.vec.Mat4.getColumn( transform, 1, column );
        goog.vec.Mat4.setColumn( resultTransform, 1, goog.vec.Vec4.scale( column, 1 / ( scale[1] = goog.vec.Vec4.magnitude( column ) ), column ) );
        goog.vec.Mat4.getColumn( transform, 2, column );
        goog.vec.Mat4.setColumn( resultTransform, 2, goog.vec.Vec4.scale( column, 1 / ( scale[2] = goog.vec.Vec4.magnitude( column ) ), column ) );
        return resultTransform;
    };

    // Set the scale vector for a transform with unity scale.
    function scaledTransform( transform, scale, resultTransform ) {
        var column = goog.vec.Vec4.create();
        goog.vec.Mat4.getColumn( transform, 0, column );
        goog.vec.Mat4.setColumn( resultTransform, 0, goog.vec.Vec4.scale( column, scale[0], column ) );
        goog.vec.Mat4.getColumn( transform, 1, column );
        goog.vec.Mat4.setColumn( resultTransform, 1, goog.vec.Vec4.scale( column, scale[1], column ) );
        goog.vec.Mat4.getColumn( transform, 2, column );
        goog.vec.Mat4.setColumn( resultTransform, 2, goog.vec.Vec4.scale( column, scale[2], column ) );
        return resultTransform;
    };

    // Get the scale vector for a transform.
    function transformScale( transform, scale ) {
        var column = goog.vec.Vec4.create();
        goog.vec.Mat4.getColumn( transform, 0, column );
        scale[0] = goog.vec.Vec4.magnitude( column );
        goog.vec.Mat4.getColumn( transform, 1, column );
        scale[1] = goog.vec.Vec4.magnitude( column );
        goog.vec.Mat4.getColumn( transform, 2, column );
        scale[2] = goog.vec.Vec4.magnitude( column );
        return scale;
    };


} );
