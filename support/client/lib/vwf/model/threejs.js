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

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {


    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
			
            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.kernel = this.kernel.kernel.kernel;

            this.state.sceneRootID = "index-vwf";

            this.delayedProperties = {};
			
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childURI, childName, callback ) {
			
			//console.log([nodeID,childID,childExtendsID,childType]);
			//console.log("Create " + childID);
			var parentNode;
			var threeChild;
			
			if(nodeID)
			{
				var parentNode = this.state.nodes[nodeID];
				if(!parentNode)
					parentNode = this.state.scenes[nodeID];
				if(parentNode)
				{
					var threeParent = parentNode.threeObject ? parentNode.threeObject : parentNode.threeScene;
					if(threeParent && childName)
					{
						threeChild = FindChildByName.call(this,threeParent,childName,childExtendsID);
					}
				}				
			}
			var kernel = this.kernel.kernel.kernel;
			
			
			var protos = getPrototypes.call( this, kernel, childExtendsID );
			if(isSceneDefinition.call(this, protos) && childID == this.state.sceneRootID)
			{
				var sceneNode = CreateThreeJSSceneNode(nodeID, childID, childExtendsID);
				this.state.scenes[childID] = sceneNode;
				
				var cam = CreateThreeCamera();
				sceneNode.camera.threeJScameras[sceneNode.camera.defaultCamID] = cam;
				sceneNode.camera.ID= sceneNode.camera.defaultCamID;
				
				sceneNode.threeScene.add(cam);
				
				///////////////////////////////////////////////
				//temp mesh for all geometry to test
				var cubeX = new THREE.Mesh(
					new THREE.CubeGeometry( 10.00, .30, .30 ),
					new THREE.MeshLambertMaterial( { color: 0xFF0000, emissive:0xFF0000 } )
				);
				cubeX.position.set(5.00,.15,.15);
				var cubeY = new THREE.Mesh(
					new THREE.CubeGeometry( .30, 10.00, .30 ),
					new THREE.MeshLambertMaterial( { color: 0x00FF00, emissive:0x00FF00 } )
				);
				cubeY.position.set(.15,5.00,.15);
				var cubeZ = new THREE.Mesh(
					new THREE.CubeGeometry( .30, .30, 10.00 ),
					new THREE.MeshLambertMaterial( { color: 0x0000FF, emissive:0x0000FF} )
				);
				cubeZ.position.set(.15,.15,5.00);
				
				var group = new THREE.Object3D();
				group.add(cubeX);
				group.add(cubeY);
				group.add(cubeZ);
				group.vwfID = "TEST DUMMY AXIS GIZMO";
				sceneNode.threeScene.add(group);
				//cam.position.set(0, 0, 0);
				//cam.lookAt( sceneNode.threeScene.position );
				cam.name = 'camera';
				this.state.cameraInUse = cam;
				var camType = "http://vwf.example.com/camera.vwf";
				
                vwf.createChild( childID, "camera", { "extends": camType } );
			}
			
			
			
			if ( protos && isCameraDefinition.call( this, protos ) ) {
				
                var camName = childID.substring( childID.lastIndexOf( '-' ) + 1 );
                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                var node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: threeChild,
                    ID: childID,
                    parentID: nodeID,
                    sceneID: this.state.sceneRootID,
                    threeScene: sceneNode ? sceneNode.threeScene : undefined,
                    type: childExtendsID,
                    sourceType: childType,
                };
				// if there was not a preexisting object, then you have to make a new camera
                if ( !node.threeObject ) {
                    createCamera.call( this, nodeID, childID, childName );
                }
				//if the scene node is using this as the default camera, but it does not exist, you must create it
                if ( sceneNode && sceneNode.camera ) {
                    if ( childID == sceneNode.camera.defaultCamID ) {
                        if ( !sceneNode.camera.threeJScameras[ childID ] ) {
                            var cam = CreateThreeCamera();
                            sceneNode.camera.threeJScameras[ childID ] = cam;
							
							 //cam.position.set(0, 0, 0);
							 //cam.lookAt( sceneNode.threeScene.position );
                            
                        }
                        node.name = camName;
                        node.threeObject = sceneNode.camera.threeJScameras[ childID ];
                  
                    } else if ( node.threeObject ) {
                        sceneNode.camera.threeJScameras[ childID ] = node.threeObject;
						sceneNode.threeScene.add(cam); 
                    }
                }               
            }
			else if(protos && isLightDefinition.call(this,protos))
			{
				node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: threeChild,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
				if(!node.threeObject)
				{
					createLight.call(this,nodeID,childID,childName);
				}
			
			}else if ( protos && isNodeDefinition.call( this, protos ) ) {
				
                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                if ( childType == "model/vnd.collada+xml") {
                        
						
						//Do we need this when we have an async load? currently seems to break things
						callback( false );
                        node = this.state.nodes[childID] = {
                            name: childName,  
                            threeObject: threeChild,
                            source: utility.resolveURI( childSource, childURI ),
                            ID: childID,
                            parentID: nodeID,
                            sourceType: childType,
                            type: childExtendsID,
                            //no load callback, maybe don't need this?
							loadingCollada: callback,
                            sceneID: this.state.sceneRootID
                        };
                        loadCollada.call( this, parentNode, node );     
				}else
				{	
						
						node = this.state.nodes[childID] = {
                            name: childName,  
                            threeObject: threeChild,
                            source: utility.resolveURI( childSource, childURI ),
                            ID: childID,
                            parentID: nodeID,
                            sourceType: childType,
                            type: childExtendsID,
                            //no load callback, maybe don't need this?
							//loadingCollada: callback,
                            sceneID: this.state.sceneRootID
                        };
						if(!node.threeObject)
							node.threeObject = findThreeObjectInParent.call(this,childName,nodeID);
						//The parent three object did not have any childrent with the name matching the nodeID, so make a new group
						if(!node.threeObject)
							node.threeObject = new THREE.Object3D(); 
				}
			}
			if(node && node.threeObject)
			{
				node.threeObject.vwfID = childID;
				node.threeObject.name = childName;
			}
        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

        },

        // -- addingChild ------------------------------------------------------------------------
        
        addingChild: function( nodeID, childID, childName ) {
			
        },

        // -- movingChild ------------------------------------------------------------------------
        
        movingChild: function( nodeID, childID, childName ) {
        },

        // -- removingChild ------------------------------------------------------------------------
        
        removingChild: function( nodeID, childID, childName ) {
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
			return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

		  var value = undefined;

            if ( !( propertyValue === undefined ) ) {
                var node = this.state.nodes[ nodeID ];
                if ( !node ) node = this.state.scenes[ nodeID ];
                if ( node ) {
                    value = this.settingProperty( nodeID, propertyName, propertyValue );                  
                    }
                }
            

            return value;
            
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
		
		  //console.log([nodeID,propertyName,propertyValue]);
		  var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
		  if(!node) node = this.state.scenes[ nodeID ]; // { name: childName, glgeObject: undefined }
		  var value = undefined;
		  
		  //this driver has no representation of this node, so there is nothing to do.
		  if(!node) return;
		  
          var threeObject = node.threeObject;
		  if(!threeObject)
			threeObject = node.threeScene;
		  
		  //There is not three object for this node, so there is nothing this driver can do. return
		  if(!threeObject) return value;	
		  
			  if ( node && threeObject && propertyValue !== undefined ) 
			  {
				if(threeObject instanceof THREE.Object3D)
				{
					if(propertyName == 'transform')
					{
						
						//set is columns, not rows
						var matrix = new THREE.Matrix4(propertyValue[0],propertyValue[4],propertyValue[8],propertyValue[12],
													  propertyValue[1],propertyValue[5],propertyValue[9],propertyValue[13],
													  propertyValue[2],propertyValue[6],propertyValue[10],propertyValue[14],
													  propertyValue[3],propertyValue[7],propertyValue[11],propertyValue[15]);
						
						
							matrix.elements[13] *= -1;
							var translation = new THREE.Vector3();
							var quat = new THREE.Quaternion();
							var scale = new THREE.Vector3();
							
							
						
							matrix.decompose(translation,quat,scale);
							var googquat = goog.vec.Quaternion.createFromValues(quat.x,quat.y,quat.z,quat.w);
							var angle = 0;
							var axis = [0,0,0];
							angle = goog.vec.Quaternion.toAngleAxis(googquat,axis);
							if(isNaN(angle))
								angle = 0;
							axis[0] *= -1;
							axis[2] *= -1;
							
							var vx = new THREE.Vector3();
							vx.set(axis[0],axis[1],axis[2]);
							quat.setFromAxisAngle(vx,angle);
							if(!isNaN(quat.w))
							matrix.setRotationFromQuaternion(quat);
							
							threeObject.matrixAutoUpdate = false;
							threeObject.up = new THREE.Vector3(0,0,1);
							matrix = matrix.scale(scale);
							if(threeObject.parent instanceof THREE.Scene)
							{							
							var flipmat = new THREE.Matrix4(1, 0,0,0,
															0, 0,1,0,
															0,1,0,0,
															0, 0,0,1);
							
											
							matrix = matrix.multiply(flipmat,matrix);
							}
							
							var elements = matrix.elements;
							
							threeObject.matrix.set(elements[0],elements[8],elements[4],elements[12],
													elements[2],elements[10],elements[6],elements[14],
													elements[1],elements[9],elements[5],elements[13],
													elements[3],elements[11],elements[7],elements[15]);
																
						
							threeObject.updateMatrixWorld(true);						
													
					
					}
					if(propertyName == 'material')
					{
						
					}
					if(propertyName == 'lookAt')
					{
						//Threejs does not currently support auto tracking the lookat,
						//instead, we'll take the position of the node and look at that.
						if(typeof propertyValue == 'string')
						{
							
							var lookatNode = this.state.nodes[propertyValue];
							
							var lookatObject = null;
							if(lookatNode && lookatNode.threeObject) lookatObject = lookatNode.threeObject;
							else if(lookatNode &&  lookatNode.threeScene) lookatObject = lookatNode.threeScene;
							
							if(lookatObject)
							{
								var lookatPosition = new THREE.Vector3();
								var thisPosition = new THREE.Vector3();
								var up = new THREE.Vector3();
								up.set(0,0,1);
								lookatPosition.copy(lookatObject.matrix.getPosition());
								thisPosition.copy(threeObject.matrix.getPosition());
								threeObject.matrix.lookAt(thisPosition,lookatPosition,up);
								
								var flipmat = new THREE.Matrix4(-1, 0,0,0,
															0, 1,0,0,
															0,0,1,0,
															0, 0,0,1);
								var matrix = new THREE.Matrix4();
								matrix.copy(threeObject.matrix);						
								matrix = matrix.multiply(flipmat,matrix);
								threeObject.matrix.copy(matrix);
								threeObject.updateMatrixWorld(true);	
							}
						
						}else if (propertyValue instanceof Array)
						{
							    var lookatPosition = new THREE.Vector3();
								var thisPosition = new THREE.Vector3();
								var up = new THREE.Vector();
								up.set(0,0,1);
								lookatPosition.set(propertyValue[0],propertyValue[1],propertyValue[2]);
								thisPosition.copy(threeObject.matrix.getPosition());
								threeObject.matrix.lookAt(thisPosition,lookatPosition,up);
								var flipmat = new THREE.Matrix4(-1, 0,0,0,
															0, 1,0,0,
															0,0,1,0,
															0, 0,0,1);
								var matrix = new THREE.Matrix4();
								matrix.copy(threeObject.matrix);						
								matrix = matrix.multiply(flipmat,matrix);
								threeObject.matrix.copy(matrix);
								threeObject.updateMatrixWorld(true);	
						}
					
					}
					if(propertyName == 'visible')
					{
						SetVisible(threeObject,propertyValue);
					}
				}
				if(threeObject instanceof THREE.Camera)
				{
					if(propertyName == "fovy")
					{
						if(propertyValue)
							threeObject.fov = parseFloat(propertyValue);
					}
					if(propertyName == "near")
					{
						if(propertyValue)
							threeObject.near = parseFloat(propertyValue);
					}
					if(propertyName == "aspect")
					{
						if(propertyValue)
							threeObject.aspect = parseFloat(propertyValue);					
					}
					if(propertyName == "far")
					{
						if(propertyValue)
							threeObject.far = parseFloat(propertyValue);					
					}
					if(propertyName == "cameraType")
					{	
						if(propertyValue == 'perspective')
						{
					
						}
						if(propertyValue == 'orthographic')
						{
						
						}
					}
				}
				if(threeObject instanceof THREE.Scene)
				{
					if(propertyName == 'activeCamera')
					{
						if(this.state.scenes[this.state.sceneRootID].camera.threeJScameras[propertyValue])
						{
							this.state.cameraInUse = this.state.scenes[this.state.sceneRootID].camera.threeJScameras[propertyValue];
							this.state.scenes[this.state.sceneRootID].camera.ID = propertyValue;
						}
					}
					if(propertyName == 'ambientColor')
					{
					          //handled in view
					}
					if(propertyName == 'backgroundColor')
					{
							  //handled in view	
					}
					if(propertyName == 'aspect')
					{
					
					}
				}	
				if(threeObject instanceof THREE.PointLight || threeObject instanceof THREE.DirectionalLight)
				{
					if(propertyName == 'lightType')
					{
						if(propertyValue == 'point' && !(threeObject instanceof THREE.PointLight))
						{

							var newlight = new THREE.PointLight('FFFFFF',1,0);
							newlight.distance = 100;
							newlight.color.setRGB(1,1,1);
							newlight.matrixAutoUpdate = false;
							CopyProperties(threeObject,newlight);
							var parent = threeObject.parent;
							parent.remove(threeObject);
							parent.add(newlight);
							node.threeObject = newlight;
							rebuildAllMaterials.call(this);
						}
						if(propertyValue == 'directional' && !(threeObject instanceof THREE.DirectionalLight))
						{
							
							var newlight = new THREE.DirectionalLight('FFFFFF',1,0);
							newlight.distance = 100;
							newlight.color.setRGB(1,1,1);
							newlight.matrixAutoUpdate = false;
							CopyProperties(threeObject,newlight);
							var parent = threeObject.parent;
							parent.remove(threeObject);
							parent.add(newlight);
							node.threeObject = newlight;
							rebuildAllMaterials.call(this);
						}
						if(propertyValue == 'spot' && !(threeObject instanceof THREE.SpotLight))
						{
							
							var newlight = new THREE.SpotLight('FFFFFF',1,0);
							CopyProperties(threeObject,newlight);
							newlight.color.setRGB(1,1,1);
							newlight.matrixAutoUpdate = false;
							var parent = threeObject.parent;
							parent.remove(threeObject);
							parent.add(newlight);
							node.threeObject = newlight;
							rebuildAllMaterials.call(this);
						}
						
					}
					if(propertyName == 'constantAttenuation')
					{
					
					}
					if(propertyName == 'linearAttenuation')
					{
					
					}
					if(propertyName == 'quadraticAttenuation')
					{
					
					}
					if(propertyName == 'spotCosCutOff')
					{
					
					}
					if(propertyName == 'spotExponent')
					{
					
					}
					if(propertyName == 'diffuse')
					{
						
						threeObject.color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
					}
					if(propertyName == 'specular')
					{
					
					}
					if(propertyName == 'samples')
					{
					
					}
					if(propertyName == 'softness')
					{
					
					}
					if(propertyName == 'bufferHeight')
					{
					
					}
					if(propertyName == 'bufferWidth')
					{
					
					}
					if(propertyName == 'shadowBias')
					{
					
					}
					if(propertyName == 'castShadows')
					{
					
					}
				}
			}
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

        
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
            return undefined;
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
            return undefined;
        },

        // == ticking =============================================================================

        ticking: function( vwfTime ) {
        }

    } );
	// == PRIVATE  ========================================================================================
	function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }
	function isSceneDefinition( prototypes ) {
        var foundScene = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundScene; i++ ) {
                foundScene = ( prototypes[i] == "http-vwf-example-com-navscene-vwf" || prototypes[i] == "http-vwf-example-com-scene-vwf" );    
            }
        }

        return foundScene;
    }
	function isCameraDefinition( prototypes ) {
        var foundCamera = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundCamera; i++ ) {
                foundCamera = ( prototypes[i] == "http-vwf-example-com-camera-vwf" );    
            }
        }

        return foundCamera;
    }
	function isNodeDefinition( prototypes ) {
        var foundNode = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundNode; i++ ) {
                foundNode = ( prototypes[i] == "http-vwf-example-com-node3-vwf" );    
            }
        }

        return foundNode;
    }
	function CreateThreeJSSceneNode(parentID,thisID,extendsID)
	{
		var node = {};
		node.camera = {};
		node.camera.ID = undefined;
		node.camera.defaultCamID = "http-vwf-example-com-camera-vwf-camera";
		node.camera.threeJScameras = {};
		node.ID = thisID;
		node.parentID = parentID;
		node.type = extendsID;
		node.viewInited = false;
		node.modelInited = false;
		node.threeScene = new THREE.Scene();
		node.pendingLoads = 0;
		node.srcColladaObjects = [];
		node.delayedProperties = {};
		
		return node;
	}
	//changing this function significantly from the GLGE code. Will search heirarchy down until encountering a matching chile
	//will look into nodes that don't match.... this might not be desirable
	 function FindChildByName( obj, childName, childType ) {
        
		
        if(obj.name == childName || obj.id == childName || obj.vwfID == childName || obj.name == 'node-'+childName)
		{
			return obj;
		}
		else if(obj.children && obj.children.length > 0)
		{
			var ret = null;
			for(var i =0; i < obj.children.length;i++)
			{
				ret = FindChildByName(obj.children[i],childName,childType);
				if(ret)
					return ret;
			}
		}
		return null;

    }
	function findObject( objName, type ) {

        //there is no global registry of threejs objects. return undefined;

        return undefined;

    }	
	function CreateThreeCamera()
	{
		
		var cam = new THREE.PerspectiveCamera(35,$(document).width()/$(document).height() ,.01,10000);
		cam.matrixAutoUpdate = false;
		cam.up = new THREE.Vector3(0,0,1);
		cam.matrix.elements = [ 1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
		cam.updateMatrixWorld(true);	
		return cam;
	}
	function createCamera( nodeID, childID, childName ) {

        var sceneNode = this.state.scenes[nodeID];
        var parent = sceneNode ? sceneNode : this.state.nodes[nodeID];
        if ( !sceneNode ) sceneNode = this.state.scenes[parent.sceneID];
        if ( sceneNode && parent ) {
            var child = this.state.nodes[childID];
            if ( child ) {
                var cam;
                if ( sceneNode.camera && sceneNode.camera.threeJScameras ) {
                    if ( !sceneNode.camera.threeJScameras[childID] ) {
                        cam = CreateThreeCamera.call(this);
						//camera.position.set(0, 0, 0);
						//camera.lookAt( sceneNode.threeScene.position );
				
						
                        sceneNode.camera.threeJScameras[childID] = cam;
                    } else {
                        cam = sceneNode.camera.threeJScameras[childID];
                    }

                    var threeParent = parent.threeObject;
					if(!threeParent) threeParent = parent.threeScene;
                    if ( threeParent && ( threeParent instanceof THREE.Scene || threeParent instanceof THREE.Object3D )) {
                        threeParent.add( cam );
                    }

                    child.name = childName;
                    child.threeObject = cam;
                    child.uid = child.threeObject.uid;
                    cam.name = childName;
                }
            }
        }

    }
	
	function loadCollada( parentNode, node ) {

        var nodeCopy = node; 
        var nodeID = node.ID;
        var childName = node.name;
        var threeModel = this;
        var sceneNode = this.state.scenes[ this.state.sceneRootID ];

        function colladaLoaded( collada ) { 
            sceneNode.pendingLoads--;
            
			//possibly deal with setting intial scale and rotation here, if threejs does something strange by default
			//collada.setRot( 0, 0, 0 ); // undo the default GLGE rotation applied in GLGE.Collada.initVisualScene that is adjusting for +Y up
			
            var removed = false;
		   
			SetMaterialAmbients.call(threeModel,collada.scene);
			nodeCopy.threeObject.add(collada.scene);
			nodeCopy.threeObject.matrixAutoUpdate = false;
			nodeCopy.threeObject.matrix.elements = [ 1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
			//no idea what this is doing here
            if ( nodeCopy && nodeCopy.colladaLoaded ) {
                nodeCopy.colladaLoaded( true );
            }
            for ( var j = 0; j < sceneNode.srcColladaObjects.length; j++ ) {
                if ( sceneNode.srcColladaObjects[j] == nodeCopy.threeObject ){
                    sceneNode.srcColladaObjects.splice( j, 1 );
                    removed = true;
                }
            } 
            if ( removed ) {
                if ( sceneNode.srcColladaObjects.length == 0 ) {
                    //vwf.setProperty( glgeModel.state.sceneRootID, "loadDone", true );
                    loadComplete.call( threeModel );
                }

                var id = collada.vwfID;
                if ( !id ) id = getObjectID.call( threeModel, collada.scene, true, false );
                if ( id && id != "" ){
                    //glgeModel.kernel.callMethod( id, "loadComplete" );
                    if ( threeModel.state.nodes[id] ) {
                        var colladaNode = threeModel.state.nodes[id];
                        //finally, here is the async callback
						if ( colladaNode.loadingCollada ) {
							
                            colladaNode.loadingCollada( true );                    
                        }
                    }
                }
            }
        }
        node.name = childName;
        if(!node.threeObject)
			node.threeObject = new THREE.Object3D();
        sceneNode.srcColladaObjects.push( node.threeObject );
        node.threeObject.vwfID = nodeID;

        //todo, set when dealing with actual collada load. Three js should have some sort of loader with a callback. 
        //node.glgeObject.loadedCallback = colladaLoaded;
        sceneNode.pendingLoads++;
        
        if ( parentNode && parentNode.threeObject ) {
            parentNode.threeObject.add(node.threeObject);
         } else if ( sceneNode ) {
//          if ( !sceneNode.glgeScene ) {
//              this.initScene.call( this, sceneNode );
//          }
            if ( sceneNode.threeScene ) {
                sceneNode.threeScene.add( node.threeObject );
            }
             
        }
		////////////////////////////////////
		//manually call callback, since there is no async load currently
		//colladaLoaded(node.threeObject);
		
		node.loader = new THREE.ColladaLoader();
		node.loader.load(node.source,colladaLoaded.bind(this));
    }
	function loadComplete() {
        var itemsToDelete = [];
        for ( var id in this.delayedProperties ) {
            if ( this.state.nodes[id] ) {
                var props = this.delayedProperties[id];
                for ( var propertyName in props ) {
                    Object.getPrototypeOf( this ).settingProperty.call( this, id, propertyName, props[propertyName] );
                }
                itemsToDelete.push( id );
            }
        }
        
        for ( var i = 0; i < itemsToDelete.length; i++ ) {
            delete this.delayedProperties[itemsToDelete[i]];
        }
    }
	function getObjectID( objectToLookFor, bubbleUp, debug ) {

        var objectIDFound = -1;
            
        while (objectIDFound == -1 && objectToLookFor) {
            if ( debug ) {
                this.logger.info("====>>>  vwf.model-glge.mousePick: searching for: " + path(objectToLookFor) );
            }
            jQuery.each( this.state.nodes, function (nodeID, node) {
                if ( node.threeObject == objectToLookFor && !node.glgeMaterial ) {
                    if ( debug ) { this.logger.info("pick object name: " + name(objectToLookFor) + " with id = " + nodeID ); }
                    objectIDFound = nodeID;
                }
            });
            if ( bubbleUp ) {
                objectToLookFor = objectToLookFor.parent;
            } else {
                objectToLookFor = undefined;
            }
        }
        if (objectIDFound != -1)
            return objectIDFound;

        return undefined;
    }
	
    function isLightDefinition( prototypes ) {
        var foundLight = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundLight; i++ ) {
                foundLight = ( prototypes[i] == "http-vwf-example-com-light-vwf" );    
            }
        }

        return foundLight;
    }
	function createLight( nodeID, childID, childName ) {

        var child = this.state.nodes[childID];
        if ( child ) {
            child.threeObject = new THREE.DirectionalLight('FFFFFF',1,0);
			child.threeObject.distance = 100;
			child.threeObject.color.setRGB(1,1,1);
			child.threeObject.matrixAutoUpdate = false;
		
            child.threeObject.name = childName;
            child.name = childName;
            addThreeChild.call( this, nodeID, childID );
        } 
               
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
	function rebuildAllMaterials(start)
	{
		
		if(!start)
		{
			for(var i in this.state.scenes)
			{
				rebuildAllMaterials(this.state.scenes[i].threeScene);
			}
		}else
		{
			if(start && start.material)
			{
				start.material.needsUpdate = true;
			}
			if(start && start.children)
			{
			   for(var i in start.children)
				rebuildAllMaterials(start.children[i]);
			}
		}
	}
	function CopyProperties(from,to)
	{
		for(var i in from)
		{
			if(i != 'parent' && typeof from[i] != 'function')
			{
				to[i] = from[i];
			}
		}
	}
	//search the threeObject of the parent sim node for the threeChild with the name of the sim child node
	function findThreeObjectInParent(childID,parentID)
	{
		var parentThreeObject;
		if(this.state.nodes[parentID])
			parentThreeObject = this.state.nodes[parentID].threeObject;
		if(!parentThreeObject && this.state.scenes[parentID])
			parentThreeObject = this.state.scenes[parentID].threeScene;
		
		//If there is no parent object render node, then there does not need to be a child node
		if(!parentThreeObject) return null;	
		
		var threeChild = findChildThreeObject(parentThreeObject,childID);
		return threeChild;
	}
	function findChildThreeObject(threeParent,childID)
	{
		var ret = null;
		if(threeParent.name == childID)
			ret = threeParent;
		else if(threeParent.children)
		{
			for(var i = 0; i< threeParent.children.length; i++)
				var child = findChildThreeObject(threeParent.children[i],childID);
			if(child)
				ret = child;
		}		
		return ret;
	}
	//necessary when settign the amibent color to match GLGE behavior
	//Three js mults scene ambient by material ambient
	function SetMaterialAmbients(start)
	{
		
		if(!start)
		{
			for(var i in this.state.scenes)
			{
				SetMaterialAmbients(this.state.scenes[i].threeScene);
			}
		}else
		{
			if(start && start.material)
			{
				
				//this will override any ambient colors set in materials.
				if(start.material.ambient)
					start.material.ambient.setRGB(1,1,1);
			}
			if(start && start.children)
			{
			   for(var i in start.children)
				SetMaterialAmbients(start.children[i]);
			}
		}
	}
	function SetVisible(node,state)	
	{
			if(node)
				node.visible = state;
			if(node && node.children)
			{
			   for(var i in node.children)
				SetVisible(node.children[i],state);
			}
	}
});
