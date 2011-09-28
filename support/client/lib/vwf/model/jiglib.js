define(["vwf/model", "module"], function (model, module) {

	var self;
	var jigLibModel = this; 

	setInterval( function() { self.private.update() }, 1 );
	// vwf/model/object.js is a backstop property store.

	return model.register(module, self = {

		// -- creatingNode -------------------------------------------------------------------------

		creatingNode: function (nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType) {
//			this.logger.info("creatingNode", nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType);
//			console.info("creatingNode", nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType);

			switch (nodeExtendsID) {
				case "http-vwf-example-com-types-glge":
					this.private.scenes[ nodeID ] = {};
					this.private.scenes[ nodeID ].ID = nodeID;
					this.private.scenes[ nodeID ].extendsID = nodeExtendsID;
					this.private.scenes[ nodeID ].implementsIDs = nodeImplementsIDs;
					this.private.scenes[ nodeID ].source = nodeSource;
					this.private.scenes[ nodeID ].type = nodeType;
					this.private.scenes[ nodeID ].system = jigLib.PhysicsSystem.getInstance();
					this.private.scenes[ nodeID ].initialized = false;
					break;

				case "http-vwf-example-com-types-node3":
				case "http-vwf-example-com-types-mesh":
					this.private.nodes[ nodeID ] = {};
 /* hardcoded */	this.private.nodes[ nodeID ].sceneID = "index-vwf";
					this.private.nodes[ nodeID ].ID = nodeID;
					this.private.nodes[ nodeID ].extendsID = nodeExtendsID;
					this.private.nodes[ nodeID ].implementsIDs = nodeImplementsIDs;
					this.private.nodes[ nodeID ].source = nodeSource;
					this.private.nodes[ nodeID ].type = nodeType;
					
					break;
			}

		},

		// TODO: deletingNode

		// -- addingChild --------------------------------------------------------------------------

		addingChild: function (nodeID, childID, childName) {
			//this.logger.info("addingChild", nodeID, childID, childName);
//			console.info("addingChild", nodeID, childID, childName);
	
			if ( this.private.scenes[ nodeID ] ) {
				var sceneNode = this.private.scenes[ nodeID ];
				if ( !sceneNode.initialized ) {
					this.private.initScene( sceneNode );
				}
			}

			if ( this.private.nodes[ childID ] ) {
				var node = this.private.nodes[ childID ];
				this.private.nodes[ childID ].jigLibObj = undefined;
				this.private.initPhysics( node );
			}
		},

		// -- removingChild ------------------------------------------------------------------------

		removingChild: function (nodeID, childID) {
			this.logger.info("removingChild", nodeID, childID);
		},

		// -- parenting ----------------------------------------------------------------------------

		parenting: function (nodeID) {
			this.logger.info("parenting", nodeID);
		},

		// -- childrening --------------------------------------------------------------------------

		childrening: function (nodeID) {
			this.logger.info("childrening", nodeID);
		},

		// -- naming -------------------------------------------------------------------------------

		naming: function (nodeID) {
			this.logger.info("naming", nodeID);
		},

		// -- creatingProperty ---------------------------------------------------------------------

		creatingProperty: function (nodeID, propertyName, propertyValue) {
			this.logger.info("creatingProperty", nodeID, propertyName, propertyValue);
		},

		// TODO: deletingProperty

		// -- settingProperty ----------------------------------------------------------------------

		settingProperty: function (nodeID, propertyName, propertyValue) {
//			this.logger.info("settingProperty", nodeID, propertyName, propertyValue);
//			console.info( "model.jiglib.settingProperty( " + nodeID + ", " + propertyName + ", " + propertyValue + " )");
			var activeNode;
			if ( this.private.active[ nodeID ] ) 
				activeNode = this.private.active[ nodeID ];

			if ( this.private.nodes[ nodeID ] ) {
				var node = this.private.nodes[ nodeID ];
				
				if ( node ) {
					var scene = this.private.scenes[ node.sceneID ]; 	
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
											findMeshChildren( nodeID, childList );

											var verts = vwf.getProperty( nodeID, "vertices", v1 );
											var vertIndices = vwf.getProperty( nodeID, "vertexIndices", v1 );
											node.jigLibObj = new jigLib.JTriangleMesh();
											node.jigLibObj.createMesh(verts, vertIndices);
											scene.system.addBody( node.jigLibObj );
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
											this.private.active[ nodeID ] = {};
											this.private.active[ nodeID ].jlObj = node.jigLibObj;
											this.private.active[ nodeID ].offset = offset;
										}
										break;
									case "sphere": {
											var verts = vwf.getProperty( nodeID, "vertices", v1 );
											var offset = vwf.getProperty( nodeID, "centerOffset", v2 );
											var raduis = 10;
											var cRadius = this.private.calcRadius( offset, verts );
											if ( cRadius > 0 ) raduis = cRadius; 
											node.jigLibObj = new jigLib.JSphere(null, raduis);
											scene.system.addBody( node.jigLibObj );
											this.private.active[ nodeID ] = {};
											this.private.active[ nodeID ].jlObj = node.jigLibObj;
											this.private.active[ nodeID ].offset = vwf.getProperty( nodeID, "centerOffset", v2 );;
										}
										break;
									case "plane": {
											node.jigLibObj = new jigLib.JPlane(null, [0, 0, 1, 0]);
											scene.system.addBody( node.jigLibObj );
											//this.private.active[ nodeID ] = node.jigLibObj;
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
			} else if ( this.private.scenes[ nodeID ] ) {
				var sceneNode = this.private.scenes[ nodeID ];
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
					}
				}
			}
		},

		// -- gettingProperty ----------------------------------------------------------------------

		gettingProperty: function (nodeID, propertyName, propertyValue) {
			this.logger.info("gettingProperty", nodeID, propertyName, propertyValue);
			
			if ( this.private.nodes[ nodeID ] ) {
				var node = this.private.nodes[ nodeID ];
				
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
			} else if ( this.private.scenes[ nodeID ] ) {
				var sceneNode = this.private.scenes[ nodeID ];
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
			this.logger.info("creatingMethod", nodeID, methodName);
		},

		// TODO: deletingMethod

		// -- callingMethod ------------------------------------------------------------------------

		callingMethod: function (nodeID, methodName) { // TODO: parameters
			this.logger.info("callingMethod", nodeID, methodName); // TODO: parameters
		},

		// TODO: creatingEvent, deltetingEvent, firingEvent

		// -- executing ----------------------------------------------------------------------------

		executing: function (nodeID, scriptText, scriptType) {
			this.logger.info("executing " + nodeID,
            (scriptText || "").replace(/\s+/g, " ").substring(0, 100), scriptType);
		},

		private: {
			nodes: {}, // maps id => { property: value, ... }
			scenes: {},
			active: {},
			now: undefined,
			lastTime: (new Date()).getTime(),

			update: function() {
				var activeObj;
				var posRotProp;
				var pos, rot;
				var sceneNode = this.scenes["index-vwf"];

				this.now = (new Date()).getTime();
				if ( sceneNode && sceneNode.system ) {

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
			calcRadius: function( offset, verts ) {
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
			},

			initScene: function( sceneNode ) {
				var propValue;
				if ( !sceneNode.initialized ) {
					if ( sceneNode.system ) {
						var cs = vwf.getProperty( sceneNode.ID, "collisionSystem", propValue );
						if ( cs && cs.constructor == Array && cs.length >= 10 ) {
							self.settingProperty( sceneNode.ID, "collisionSystem", cs );
						} else { 
							sceneNode.system.setCollisionSystem( false ); 
						}
					}					
					self.settingProperty( sceneNode.ID, "gravity", vwf.getProperty( sceneNode.ID, "gravity", propValue ) );
					sceneNode.initialized = true;
				}
			},

			initPhysics: function( node ) {
				var propValue;
				self.settingProperty( node.ID, "physics", vwf.getProperty( node.ID, "physics", propValue ) );
				propValue = vwf.getProperty( node.ID, "physicsDef", propValue );
				if ( propValue != "" ) self.settingProperty( node.ID, "mass", propValue );
				self.settingProperty( node.ID, "mass", vwf.getProperty( node.ID, "mass", propValue ) );
				self.settingProperty( node.ID, "restitution", vwf.getProperty( node.ID, "restitution", propValue ) );
				self.settingProperty( node.ID, "friction", vwf.getProperty( node.ID, "friction", propValue ) );
				self.settingProperty( node.ID, "rotVelocityDamping", vwf.getProperty( node.ID, "rotVelocityDamping", propValue ) );
				self.settingProperty( node.ID, "linVelocityDamping", vwf.getProperty( node.ID, "linVelocityDamping", propValue ) );
				self.settingProperty( node.ID, "position", vwf.getProperty( node.ID, "position", propValue ) );

			},

			findMeshChildren: function( nodeID, childList ) {
				var children = vwf.children( nodeID );

				if ( this.nodes[nodeID].extendsID == "http-vwf-example-com-types-mesh" ) {
					childList.push( this.nodes[nodeID] ); 
				}

				if ( children && children.length ) {
					for ( var i = 0; i < children.length; i++ ) {
						findMeshChildren( children[i], childList );
					}
				}
			},


		}

	});

});
