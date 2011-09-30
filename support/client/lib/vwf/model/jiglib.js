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

        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function (nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType) {

            switch (nodeExtendsID) {
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
 /* hardcoded */	this.nodes[ nodeID ].sceneID = "index-vwf";
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
                            if ( node.jigLibObj ) {
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
                            if ( scene && scene.system ) {
                                var v1, v2;
                                switch ( propertyValue ) {
                                    case "mesh": {
											var childList = [];
											var verts, vertIndices;
											this.findMeshChildren( nodeID, childList );
											if ( childList.length > 0 ) {
												node.jigLibMeshes = {};

												for ( var i = 0; i < childList.length; i++ ) {
												
													if ( !node.jigLibMeshes[ childList[i] ] ) {
														verts = vwf.getProperty( childList[i], "vertices", v1 );
														vertIndices = vwf.getProperty( childList[i], "vertexIndices", v2 );

														node.jigLibMeshes[ childList[i] ] = new jigLib.JTriangleMesh();
														node.jigLibMeshes[ childList[i] ].createMesh(verts, vertIndices);
														scene.system.addBody( node.jigLibMeshes[ childList[i] ] );
													}
												}
											}
                                        }
                                        break;
                                    case "box": {
                                            var width = 1;
                                            var depth = 1;
                                            var height = 1;
                                            var pos = vwf.getProperty( nodeID, "position", v1 );
                                            var bBox = vwf.getProperty( nodeID, "boundingbox", v1 );
                                            var offset = vwf.getProperty( nodeID, "centerOffset", v2 );
                                            if ( bBox && bBox.length && bBox.length == 6 ) {
                                                if ( bBox[1] - bBox[0] != 0 ) width = bBox[1] - bBox[0];
                                                if ( bBox[3] - bBox[2] != 0 ) width = bBox[3] - bBox[2];
                                                if ( bBox[5] - bBox[4] != 0 ) width = bBox[5] - bBox[4];										
                                            }										
                                            node.jigLibObj = new jigLib.JBox( null, width, depth, height );
                                            scene.system.addBody( node.jigLibObj );
                                            node.jigLibObj.moveTo( [ pos[0] + offset[0], pos[1] + offset[1], pos[2] + offset[1] ] );
                                            this.active[ nodeID ] = {};
                                            this.active[ nodeID ].jlObj = node.jigLibObj;
                                            this.active[ nodeID ].offset = offset;
                                        }
                                        break;
                                    case "sphere": {
                                            var verts = vwf.getProperty( nodeID, "vertices", v1 );
                                            var offset = vwf.getProperty( nodeID, "centerOffset", v2 );
                                            var raduis = 10;
                                            var cRadius = calcRadius( offset, verts );
                                            if ( cRadius > 0 ) raduis = cRadius; 
                                            node.jigLibObj = new jigLib.JSphere(null, raduis);
                                            scene.system.addBody( node.jigLibObj );
                                            this.active[ nodeID ] = {};
                                            this.active[ nodeID ].jlObj = node.jigLibObj;
                                            this.active[ nodeID ].offset = vwf.getProperty( nodeID, "centerOffset", v2 );;
                                        }
                                        break;
                                    case "plane": {
                                            node.jigLibObj = new jigLib.JPlane(null, [0, 0, 1, 0]);
                                            scene.system.addBody( node.jigLibObj );
                                            //this.active[ nodeID ] = node.jigLibObj;
                                        }
                                        break;
                                    default:
                                        node.jigLibObj = undefined;
                                        break;
                                }
                            }
                            break;
                        case "physicsDef":
                            if ( node.jigLibObj && propertyValue ) {
                                var typeProp;
                                var type = vwf.getProperty( nodeID, "physics", typeProp );
                                switch ( type ) {
                                    case "mesh":
                                        break;
                                    case "box":
                                        node.jigLibObj.set_width( propertyValue[0] );
                                        node.jigLibObj.set_depth( propertyValue[1] );
                                        node.jigLibObj.set_height( propertyValue[2] );
                                        break;
                                    case "sphere":
                                        node.jigLibObj.set_radius( propertyValue );
                                        break;
                                    case "plane":
                                        node.jigLibObj.set_normal( propertyValue );
                                        break;
                                    default:
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
                        case "collisionSystem":
                            var pv = propertyValue;
                            if ( pv.constructor == Array && pv.length >= 10 ) {
                                sceneNode.system.setCollisionSystem( pv[0], pv[1], pv[2], pv[3], pv[4], pv[5], pv[6], pv[7], pv[8], pv[9] );
                            }
                            break;
						case "loadComplete":
							this.enable = propertyValue;
							break;
                    }
                }
            }
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function (nodeID, propertyName, propertyValue) {
            
            if ( this.nodes[ nodeID ] ) {
                var node = this.nodes[ nodeID ];
                
                if ( node && node.jigLibObj ) {
                    switch ( propertyName ) {
                        case "physics":
                            if ( node.jigLibObj.constructor == jigLib.JBox ) {
                                propertyValue = "box";
                            } else if ( node.jigLibObj.constructor == jigLib.JSphere ) {
                                propertyValue = "sphere";
                            } else if ( node.jigLibObj.constructor == jigLib.JPlane ) {
                                propertyValue = "plane";
                            } else {
                                propertyValue = "mesh";
                            }
                            break;
                            
                        case "physicsDef":
                            if ( node.jigLibObj ) {
                                var typeProp;
                                var type = vwf.getProperty( nodeID, "physics", typeProp );
                                switch ( type ) {
                                    case "mesh":
                                        break;
                                    case "box":
                                        propertyValue = [];
                                        propertyValue.push(node.jigLibObj._sideLengths[0]);
                                        propertyValue.push(node.jigLibObj._sideLengths[1]);
                                        propertyValue.push(node.jigLibObj._sideLengths[2]);
                                        break;
                                    case "sphere":
                                        propertyValue = node.jigLibObj.get_radius();
                                        break;
                                    case "plane":
                                        propertyValue = node.jigLibObj.get_normal();
                                        break;
                                    default:
                                        break;
                                }
                            }
                            break;
                        case "mass":
                            propertyValue =	node.jigLibObj.get_mass();
                            break;
                        case "restitution":
                            propertyValue =	node.jigLibObj.get_restitution();
                            break;							
                        case "friction":
                            propertyValue =	node.jigLibObj.get_friction();
                            break;						
                        case "rotVelocityDamping":
                            propertyValue =	node.jigLibObj.get_rotVelocityDamping();
                            break;	
                        case "linVelocityDamping":
                            propertyValue =	node.jigLibObj.get_linVelocityDamping();
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
                            propertyValue = "";
                            break;
                    }
                }
                    
            }

        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function (nodeID, methodName) {
        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function (nodeID, methodName) { // TODO: parameters
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

                for ( var nodeID in this.active ) {
                    activeObj = this.active[nodeID];
                    if ( activeObj && activeObj.jlObj ) {
                        pos = activeObj.jlObj.get_currentState().position;
                        rot = GLGE.Mat4( activeObj.jlObj.get_currentState().get_orientation().glmatrix );
                        posRot = [ pos[0], pos[1], pos[2], rot ];
                        vwf.setProperty( nodeID, "posRotMatrix", posRot );
                
                    }
                }
            }
            this.lastTime = this.now;
        },

        initScene: function( sceneNode ) {
            var propValue;
            if ( !sceneNode.initialized ) {
                if ( sceneNode.system ) {
                    var cs = vwf.getProperty( sceneNode.ID, "collisionSystem", propValue );
                    if ( cs && cs.constructor == Array && cs.length >= 10 ) {
                        this.settingProperty( sceneNode.ID, "collisionSystem", cs );
                    } else { 
                        sceneNode.system.setCollisionSystem( false ); 
                    }
                }					
                this.settingProperty( sceneNode.ID, "gravity", vwf.getProperty( sceneNode.ID, "gravity", propValue ) );
                sceneNode.initialized = true;
            }
        },

        initPhysics: function( node ) {
            var propValue;
            this.settingProperty( node.ID, "physics", vwf.getProperty( node.ID, "physics", propValue ) );
            propValue = vwf.getProperty( node.ID, "physicsDef", propValue );
            if ( propValue != "" ) this.settingProperty( node.ID, "mass", propValue );
            this.settingProperty( node.ID, "mass", vwf.getProperty( node.ID, "mass", propValue ) );
            this.settingProperty( node.ID, "restitution", vwf.getProperty( node.ID, "restitution", propValue ) );
            this.settingProperty( node.ID, "friction", vwf.getProperty( node.ID, "friction", propValue ) );
            this.settingProperty( node.ID, "rotVelocityDamping", vwf.getProperty( node.ID, "rotVelocityDamping", propValue ) );
            this.settingProperty( node.ID, "linVelocityDamping", vwf.getProperty( node.ID, "linVelocityDamping", propValue ) );
            this.settingProperty( node.ID, "position", vwf.getProperty( node.ID, "position", propValue ) );

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
