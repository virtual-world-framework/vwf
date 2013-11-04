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



        THREE.Matrix4.prototype.lookAt = function ( eye, target, up , axis) {

			var te = this.elements;
			if(axis === undefined)
				axis = 2;
			var x = new THREE.Vector3();
			var y = new THREE.Vector3();
			var z = new THREE.Vector3();
			z.subVectors( eye, target ).normalize();

			if ( z.length() === 0 ) {

				z.z = 1;

			}

			x.crossVectors( up, z ).normalize();

			if ( x.length() === 0 ) {

				z.x += 0.0001;
				x.crossVectors( up, z ).normalize();

			}

			y.crossVectors( z, x );

			
			if(axis == 2)
			{
				
			te[0] = x.x; te[4] = y.x; te[8] = z.x;
			te[1] = x.y; te[5] = y.y; te[9] = z.y;
			te[2] = x.z; te[6] = y.z; te[10] = z.z;
			}
			if(axis == 1)
			{
			te[0] = x.x; te[4] = z.x; te[8] = y.x;
			te[1] = x.y; te[5] = z.y; te[9] = y.y;
			te[2] = x.z; te[6] = z.z; te[10] = y.z;
			}
			if(axis == 0)
			{
			te[0] = z.x; te[4] = x.x; te[8] = y.x;
			te[1] = z.y; te[5] = x.y; te[9] = y.y;
			te[2] = z.z; te[6] = x.z; te[10] = y.z;
			}

			return this;

		}

    

	function matCpy(mat)
	{
		var ret = [];
		for(var i =0; i < 16; i++)
			ret.push(mat[i]);
		return ret.slice(0);	
	}
	
	function matComp(m1,m2)
	{
	
		for(var i =0; i < 16; i++)
		{
			if(m1[i] != m2[i])
				return false;
		}
		return true;	
	}
	
	function matComploose(m1,m2)
	{
	
		for(var i =0; i < 16; i++)
		{
			if(Math.abs(m1[i] - m2[i]) > .000001)
				return false;
		}
		return true;	
	}
	
define( [ "module", "vwf/model", "vwf/utility", "vwf/utility/color","vwf/model/threejs/backgroundLoader" ], function( module, model, utility, Color, backgroundLoader ) {


    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            
            this.state.scenes = {}; // id => { MATHDocument: new MATH.Document(), MATHRenderer: new MATH.Renderer(), MATHScene: new MATH.Scene() }
            this.state.nodes = {}; // id => { name: string, MATHObject: MATH.Object, MATH.Collada, MATH.Light, or other...? }
            this.state.kernel = this.kernel.kernel.kernel;
            this.state.sceneRootID = "index-vwf";
			
			window.backgroundLoader = backgroundLoader;
			
            this.delayedProperties = {};
			this.subDriverFactory = new SubDriverFactory();
			$(document.head).append('<script type="text/javascript" src="vwf/view/editorview/_THREERayTracer.js"></script>');
			$(document.head).append('<script type="text/javascript" src="vwf/model/threejs/scenemanager.js"></script>');
			
			window.rebuildAllMaterials=function (start)
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
			}.bind(this);
            
        },

		initializingNode: function(nodeID,childID)
		{
	      
          var node = this.state.nodes[ childID ]; // { name: childName, MATHObject: undefined }
          if(!node) node = this.state.scenes[ childID ]; // { name: childName, MATHObject: undefined }
          var value = undefined;
          
          //this driver has no representation of this node, so there is nothing to do.
          if(!node) return;
          
		  if(node.initializingNode)
				node.initializingNode();
		},
        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childURI, childName, callback ) {
            
            //console.log(["creatingNode:",nodeID,childID,childExtendsID,childType]);
            //console.log("Create " + childID);
			
			
            var parentNode, threeChild, threeParent;
            
            if ( nodeID )
            {
                var parentNode = this.state.nodes[nodeID];
                if ( !parentNode )
                    parentNode = this.state.scenes[nodeID];
                if ( parentNode )
                {
                    threeParent = parentNode.threeObject ? parentNode.threeObject : parentNode.threeScene;
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
				_SceneManager.initialize(sceneNode.threeScene);
                this.state.scenes[childID] = sceneNode;
                
                var cam = CreateThreeCamera();
                sceneNode.camera.threeJScameras[sceneNode.camera.defaultCamID] = cam;
                sceneNode.camera.ID= sceneNode.camera.defaultCamID;
                
				var ambient = new THREE.AmbientLight();
				ambient.color.r = .5;
				ambient.color.g = .5;
				ambient.color.b = .5;
				sceneNode.threeScene.add(ambient);
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
             ////   group.add(cubeX);
             //   group.add(cubeY);
             //   group.add(cubeZ);
                group.vwfID = "TEST DUMMY AXIS GIZMO";
                
				sceneNode.axes = group;
			//	sceneNode.threeScene.add(group);
                //cam.position.set(0, 0, 0);
                //cam.lookAt( sceneNode.threeScene.position );
                
				cam.name = 'camera';
                this.state.cameraInUse = cam;
                var camType = "http://vwf.example.com/camera.vwf";
                
                vwf.createChild( childID, "camera", { "extends": camType } );
            }
            
            if ( !nodeID )
            {
				return;
			
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
            
            }else if ( protos && isMaterialDefinition.call( this, protos ) ) {
            
                
                node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: parentNode.threeObject,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                //node.threeMaterial = GetMaterial(node.threeObject);
                if(!node.threeMaterial)
                {   
                    node.threeMaterial = new THREE.MeshPhongMaterial();
                    SetMaterial(node.threeObject,node.threeMaterial,childName)
                }
            }
            else if ( protos && isParticleDefinition.call( this, protos ) ) {
            
                
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
                    CreateParticleSystem.call(this,nodeID,childID,childName);
                }
            }
            else if ( protos && isNodeDefinition.call( this, protos ) ) {
                
                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                if ( childType == "model/vnd.collada+xml" || childType == "model/vnd.osgjs+json+compressed") {
                    
                    
                    node = this.state.nodes[childID] = {
                        name: childName,  
                        threeObject: threeChild,
                        source: utility.resolveURI( childSource, childURI ),
                        ID: childID,
                        parentID: nodeID,
                        sourceType: childType,
                        type: childExtendsID,
                        //no load callback, maybe don't need this?
                        loadingCallback: callback,
                        sceneID: this.state.sceneRootID
                    };
					//pass the callback. We'll only call it if we cant load sync from memory
                    loadAsset.call( this, parentNode, node, childType,callback );     
                } else if ( childType == "mesh/definition" ) {
                    
                    callback( false );
                    node = this.state.nodes[childID] = {
                        name: childName,  
                        //threeObject: threeChild,
                        source: utility.resolveURI( childSource, childURI ),
                        ID: childID,
                        parentID: nodeID,
                        sourceType: childType,
                        type: childExtendsID,
                        sceneID: this.state.sceneRootID,
                    };
                    node.threeObject = new THREE.Object3D(); 
                    if ( threeParent !== undefined ) {
                        threeParent.add( node.threeObject ); 
                    } 
                } else if(childType ==  "link_existing/threejs")
				{
					//debugger;
					node = this.state.nodes[childID] = this.subDriverFactory.createNode(childID, 'vwf/model/threejs/asset.js', childName, childType, null, callback);
					
					node.name= childName;
					node.threeObject= null;
					node.ID= childID;
					node.parentID= nodeID;
					node.type= childExtendsID;
					node.sourceType= childType;
					
					var scenenode = FindChildByName(parentNode.threeObject,childSource);
					
					node.setAsset(scenenode);
					node.threeObject = scenenode;
					//we need to mark this node - because the VWF node is layered onto a GLGE node loaded from the art asset, deleteing the VWF node should not
					//delete the GLGE node. This should probably undo any changes made to the GLGE node by the VWF. This is tricky. I'm going to backup the matrix, and reset it
					//when deleting the VWF node.
					if(node.threeObject)
					{
						node.threeObject.initializedFromAsset = true;
						node.threeObject.backupMatrix = [];
						node.threeObject.vwfID = node.ID;
						for(var u=0; u < 16; u++)
							node.threeObject.backupMatrix.push(node.threeObject.matrix.elements[u]);
					}
					else
					{
						console.log("failed to find view node for " + childSource);
						node.threeObject = new THREE.Object3D();
						node.threeObject.vwfID = node.ID;
					}
					callback(true);
				} 
				//use a pluggable model for createing nodes. This should make it easier to develop a driver that is not one long
				//set of gets and sets
				else if(childType ==  "subDriver/threejs")
				{
					
					node = this.state.nodes[childID] = this.subDriverFactory.createNode(childID, childSource, childName, childType, null, callback);

					node.name= childName,    
					node.ID=childID;
					node.parentID= nodeID;
					node.sourceType= childType;
					node.type= childExtendsID;
					node.sceneID= this.state.sceneRootID;

					node.threeObject = new THREE.Object3D();
					node.threeObject.add(node.getRoot());
					threeParent.add(node.threeObject);
				}
				else if(childType ==  "subDriver/threejs/asset/vnd.collada+xml" || childType ==  "subDriver/threejs/asset/vnd.osgjs+json+compressed")
				{
					
					node = this.state.nodes[childID] = this.subDriverFactory.createNode(childID, 'vwf/model/threejs/asset.js', childName, childType, childSource, callback);

					node.name= childName,    
					node.ID=childID;
					node.parentID= nodeID;
					node.sourceType= childType;
					node.type= childExtendsID;
					node.sceneID= this.state.sceneRootID;

					node.threeObject = new THREE.Object3D();
					node.threeObject.add(node.getRoot());
					threeParent.add(node.threeObject);
				}				
				else
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
                            //loadingCallback: callback,
                            sceneID: this.state.sceneRootID
                        };
                        if( !node.threeObject && childName)
                            node.threeObject = findThreeObjectInParent.call(this,childName,nodeID);
                        //The parent three object did not have any childrent with the name matching the nodeID, so make a new group
                        if( !node.threeObject ) {
                            // doesn't this object need to be added to the parent node
                            node.threeObject = new THREE.Object3D(); 
                            if ( threeParent !== undefined ) {
                                threeParent.add( node.threeObject ); 
                            } 
                        }
                }
            
                if(node && node.threeObject)
                {
                    if(!node.threeObject.vwfID) node.threeObject.vwfID = childID;
                    if(!node.threeObject.name) node.threeObject.name = childName;
                }
				if(node && parentNode)
				{
					if(!parentNode.children)
						parentNode.children = [];
					parentNode.children.push(node)
					node.parentNode = parentNode;
				}
            
            }
            
        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            
            if(nodeID)
            {
                var childNode = this.state.nodes[nodeID];
				if(!childNode) return;
				
				if(childNode.children)
				{
					
					for(var i = 0; i < childNode.children.length; i++)
					{
						this.deletingNode(childNode.children[i].ID);
					}
				}
				
                if(childNode)
                {
					if(childNode.deletingNode)
						childNode.deletingNode();
						
					if(!childNode.threeObject.initializedFromAsset)
					{
						var threeObject = childNode.threeObject;
						if(threeObject && threeObject.parent)
						{
							
							threeObject.parent.remove(threeObject);
							
						}
					}
					
					
					var parentNode = childNode.parentNode;
					parentNode.children.splice(parentNode.children.indexOf(childNode),1);
					
                    delete this.state.nodes[nodeID];
                }               
            }
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
            //console.log(["initializingProperty: ",nodeID,propertyName,propertyValue]);

            if ( !( propertyValue === undefined ) ) {
                var node = this.state.nodes[ nodeID ];
                if ( !node ) node = this.state.scenes[ nodeID ];
                if ( node ) {
                    switch ( propertyName ) {
                        case "meshDefinition":
                            createMesh.call( this, node, propertyValue );
                            break;
                        default:
                            value = this.settingProperty( nodeID, propertyName, propertyValue );                  
                            break;
                    }
                }
            }

            return value;
            
        },

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
        
          //console.log(["settingProperty: ",nodeID,propertyName,propertyValue]);
          var node = this.state.nodes[ nodeID ]; // { name: childName, MATHObject: undefined }
          if(!node) node = this.state.scenes[ nodeID ]; // { name: childName, MATHObject: undefined }
          var value = undefined;
          
          //this driver has no representation of this node, so there is nothing to do.
          if(!node) return;
          
		  if(node.settingProperty)
				value = node.settingProperty(propertyName,propertyValue);
		  if(value !== undefined)
			    return value;
				
          var threeObject = node.threeObject;
          if(!threeObject)
            threeObject = node.threeScene;
          
          //if it's a material node, we'll work with the threeMaterial
          //might be more elegant to simply make the node.threeObject the material, but keeping it seperate
          //in case we later need access to the object the material is on.
          if(node.threeMaterial)
            threeObject = node.threeMaterial;
            
          //There is not three object for this node, so there is nothing this driver can do. return
          if(!threeObject) return value;    
          

              if ( node && threeObject && propertyValue !== undefined ) 
              {
                if(threeObject instanceof THREE.Object3D)
                {
                    if(propertyName == 'transform' || propertyName == 'localMatrix')
                    {
                       
						
						 //console.info( "setting transform of: " + nodeID + " to " + Array.prototype.slice.call( propertyValue ) );
                        var transform = goog.vec.Mat4.createFromArray( propertyValue || [] );

                        // Rotate 90 degress around X to convert from VWF Z-up to MATH Y-up.
                        if ( threeObject instanceof THREE.Camera ) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( transform, 1, columny );
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( transform, 2, columnz );
                            goog.vec.Mat4.setColumn( transform, 1, columnz );
                            goog.vec.Mat4.setColumn( transform, 2, goog.vec.Vec4.negate( columny, columny ) );
                        }
						
						if(!matComploose(transform,threeObject.matrix.elements))
						{
							if(threeObject instanceof THREE.ParticleSystem)
							{	
								threeObject.updateTransform(transform);
							}
							
                            threeObject.matrixAutoUpdate = false;
                            threeObject.matrix.elements = matCpy(transform);
                            threeObject.updateMatrixWorld(true);   
													
							threeObject.sceneManagerUpdate();							
                        }                            
                    
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
									var thisMatrix = new THREE.Matrix4();
									thisMatrix.elements = matCpy(threeObject.matrix.elements);
									
									
									lookatPosition.getPositionFromMatrix(lookatObject.matrix);
									thisPosition.getPositionFromMatrix(thisMatrix);
									
									
									var up = this.kernel.getProperty(nodeID,'upAxis') || 2;
									var upaxis = [0,0,0];
									upaxis[up] = 1;
									upaxis = new THREE.Vector3(upaxis[0],upaxis[1],upaxis[2]);
									var axis = this.kernel.getProperty(nodeID,'lookAxis') || 2;
									
									threeObject.matrix.lookAt(thisPosition,lookatPosition,upaxis,axis);
									
									threeObject.updateMatrixWorld(true); 
															
                            }
                        
                        }else if (propertyValue instanceof Array || propertyValue instanceof Float32Array)
                        {
								
                                var lookatPosition = new THREE.Vector3();
									var thisPosition = new THREE.Vector3();
									var thisMatrix = new THREE.Matrix4();
									thisMatrix.elements = matCpy(threeObject.matrix.elements);
									
									debugger;
									lookatPosition.set(propertyValue[0],propertyValue[1],propertyValue[2]);
									thisPosition.getPositionFromMatrix(thisMatrix);
									
									var up = this.kernel.getProperty(nodeID,'upAxis') || 2;
									var upaxis = [0,0,0];
									upaxis[up] = 1;
									upaxis = new THREE.Vector3(upaxis[0],upaxis[1],upaxis[2]);
									var axis = this.kernel.getProperty(nodeID,'lookAxis') || 2;
									
									threeObject.matrix.lookAt(thisPosition,lookatPosition,upaxis,axis);
									
									threeObject.updateMatrixWorld(true); 
                        }
                    
                    }
                    if(propertyName == 'visible')
                    {
                        //need to walk the tree and hide all sub nodes as well
                        SetVisible(threeObject,propertyValue);
                    }
                    if(propertyName == 'castShadows')
                    {
                        //debugger;
                        threeObject.castShadow = true;
                    }
                    if(propertyName == 'receiveShadows')
                    {
                        //debugger;
                        threeObject.receiveShadow = true;
                    }
					if(propertyName == 'isStatic')
                    {
                        //debugger;
                        threeObject.setStatic(propertyValue);
                    }
					if(propertyName == 'isDynamic')
                    {
                        //debugger;
						vwf.setProperty(nodeID,'isStatic',false);
                        threeObject.setDynamic(propertyValue);
                    }
                    //This can be a bit confusing, as the node has a material property, and a material child node. 
                    //setting the property does this, but the code in the component is ambigious
                    if(propertyName == 'material')
                    {
                        var material = GetMaterial(node.threeObject);
                        if(!material)
                        {   
                            material = new THREE.MeshPhongMaterial();
                            SetMaterial(node.threeObject,material);
                        }
                        if(propertyValue == 'red')
                            material.color.setRGB(1,0,0);
                        if(propertyValue == 'green')
                            material.color.setRGB(0,1,0);
                        if(propertyValue == 'blue')
                            material.color.setRGB(0,0,1);
                        if(propertyValue == 'purple')
                            material.color.setRGB(1,0,1);
                        if(propertyValue == 'orange')
                            material.color.setRGB(1,.5,0);
                        if(propertyValue == 'yellow')
                            material.color.setRGB(1,1,0);   
                        if(propertyValue == 'gray')
                            material.color.setRGB(.5,.5,.5);
                        if(propertyValue == 'white')
                            material.color.setRGB(1,1,1);
                        if(propertyValue == 'black')
                            material.color.setRGB(0,0,0);                           
                        material.ambient.setRGB( material.color.r,material.color.g,material.color.b);
                    }
					if(propertyName == 'transparent')
					{
						var list = [];
						GetAllLeafMeshes(threeObject,list);
						for(var i = 0; i < list.length; i++)
						{
							if(list[i].material)
								list[i].material.transparent = propertyValue;
						}
					}
                }
				if(threeObject instanceof THREE.ParticleSystem)
                {
                    var ps = threeObject;
                    var particles = ps.geometry;
                    ps[propertyName] = propertyValue;
                    
                    
                    if(propertyName == 'maxVelocity'||
                        propertyName == 'minVelocity'||
                        propertyName == 'maxAcceleration'||
                        propertyName == 'minAcceleration'||
                        propertyName == 'emitterType' ||
						propertyName == 'emitterSize' ||
						propertyName == 'maxLifeTime' ||
						propertyName == 'minLifeTime' ||
						propertyName == 'velocityMode'						
						
                    )
                    {
                        if(ps.material == ps.shaderMaterial_analytic)
                        {
                            ps.rebuildParticles();
                        }
                    }
                    
                    if(propertyName == 'size')
                    {
                        //ps.material.size = propertyValue;
                        
                        for(var i = 0; i < ps.material.attributes.size.value.length; i++)
                        {
                            ps.material.attributes.size.value[i] = propertyValue;
                        }
                        ps.material.attributes.size.needsUpdate = true;
                    }
                    if(propertyName == 'particleCount')
                    {
                        ps.setParticleCount(propertyValue);
                    }
                    if(propertyName == 'startSize')
                    {
                        ps.shaderMaterial_analytic.uniforms.startSize.value = propertyValue;
                    }
                    if(propertyName == 'endSize')
                    {
                        ps.shaderMaterial_analytic.uniforms.endSize.value = propertyValue;
                    }
					if(propertyName == 'sizeRange')
                    {
                        ps.shaderMaterial_analytic.uniforms.sizeRange.value = propertyValue;
                    }
                    if(propertyName == 'maxSpin')
                    {
                        ps.shaderMaterial_analytic.uniforms.maxSpin.value = propertyValue;
                    }
					if(propertyName == 'textureTiles')
                    {
                        ps.shaderMaterial_analytic.uniforms.textureTiles.value = propertyValue;
                    }
                    if(propertyName == 'minSpin')
                    {
                        ps.shaderMaterial_analytic.uniforms.minSpin.value = propertyValue;
                    }
					if(propertyName == 'maxOrientation')
                    {
                        ps.shaderMaterial_analytic.uniforms.maxOrientation.value = propertyValue;
                    }
                    if(propertyName == 'minOrientation')
                    {
                        ps.shaderMaterial_analytic.uniforms.minOrientation.value = propertyValue;
                    }
					if(propertyName == 'alphaTest')
                    {
                        ps.shaderMaterial_analytic.uniforms.alphaTest.value = propertyValue;
                    }
					
					
					if(propertyName == 'colorRange')
                    {
                         ps.shaderMaterial_analytic.uniforms.colorRange.value.x = propertyValue[0];
                        ps.shaderMaterial_analytic.uniforms.colorRange.value.y = propertyValue[1];
                        ps.shaderMaterial_analytic.uniforms.colorRange.value.z = propertyValue[2];
                        ps.shaderMaterial_analytic.uniforms.colorRange.value.w = propertyValue[3];
                    }
					
					
                    if(propertyName == 'startColor')
                    {
                        ps.shaderMaterial_analytic.uniforms.startColor.value.x = propertyValue[0];
                        ps.shaderMaterial_analytic.uniforms.startColor.value.y = propertyValue[1];
                        ps.shaderMaterial_analytic.uniforms.startColor.value.z = propertyValue[2];
                        ps.shaderMaterial_analytic.uniforms.startColor.value.w = propertyValue[3];
                    }
                    if(propertyName == 'endColor')
                    {
                        ps.shaderMaterial_analytic.uniforms.endColor.value.x = propertyValue[0];
                        ps.shaderMaterial_analytic.uniforms.endColor.value.y = propertyValue[1];
                        ps.shaderMaterial_analytic.uniforms.endColor.value.z = propertyValue[2];
                        ps.shaderMaterial_analytic.uniforms.endColor.value.w = propertyValue[3];
                    }
                    
            
                    if(propertyName == 'solver')
                    {
						
                        ps.setSolverType(propertyValue)
                    }
                    if(propertyName == 'image')
                    {
                        ps.shaderMaterial_default.uniforms.texture.value = THREE.ImageUtils.loadTexture(propertyValue);
                        ps.shaderMaterial_default.uniforms.useTexture.value = 1.0;
                        ps.shaderMaterial_analytic.uniforms.texture.value = THREE.ImageUtils.loadTexture(propertyValue);
                        ps.shaderMaterial_analytic.uniforms.useTexture.value = 1.0;
					
                    }
                    if(propertyName == 'additive')
                    {
                        if(propertyValue)
                        {
                            ps.shaderMaterial_default.blending = THREE.AdditiveBlending;
                            ps.shaderMaterial_default.transparent = true;
                            ps.shaderMaterial_analytic.blending = THREE.AdditiveBlending;
                            ps.shaderMaterial_analytic.transparent = true;
							ps.shaderMaterial_interpolate.blending = THREE.AdditiveBlending;
                            ps.shaderMaterial_interpolate.transparent = true;
                        }
                        else
                        {
                            ps.shaderMaterial_default.blending = THREE.NormalBlending;  
                            ps.shaderMaterial_default.transparent = true;
                            ps.shaderMaterial_analytic.blending = THREE.NormalBlending; 
                            ps.shaderMaterial_analytic.transparent = true;
						    ps.shaderMaterial_interpolate.blending = THREE.NormalBlending; 
                            ps.shaderMaterial_interpolate.transparent = true;
                        }

                        ps.shaderMaterial_default.needsUpdate = true;   
                        ps.shaderMaterial_analytic.needsUpdate = true;   
						ps.shaderMaterial_interpolate.needsUpdate = true;  						
                    }
                    if(propertyName == 'depthTest')
                    {
                        ps.shaderMaterial_default.depthTest = true;    
                        ps.shaderMaterial_default.depthWrite = propertyValue;
                        ps.shaderMaterial_analytic.depthTest = true;   
                        ps.shaderMaterial_analytic.depthWrite = propertyValue;
						ps.shaderMaterial_interpolate.depthTest = true;   
                        ps.shaderMaterial_interpolate.depthWrite = propertyValue;
						
						ps.shaderMaterial_default.needsUpdate = true;   
                        ps.shaderMaterial_analytic.needsUpdate = true;   
						ps.shaderMaterial_interpolate.needsUpdate = true;  	
                    }
                    if(propertyName == "minAcceleration" || propertyName == "maxAcceleration")
                    {
                        if(!ps.minAcceleration) ps.minAcceleration = [0,0,0];
                        if(!ps.maxAcceleration) ps.maxAcceleration = [0,0,0];
                        
                        for(var i = 0; i < particles.vertices.length; i++)
                        {
                            particles.vertices[i].acceleration.x = ps.minAcceleration[0] + (ps.maxAcceleration[0] - ps.minAcceleration[0]) * Math.random();
                            particles.vertices[i].acceleration.y = ps.minAcceleration[1] + (ps.maxAcceleration[1] - ps.minAcceleration[1]) * Math.random();
                            particles.vertices[i].acceleration.z = ps.minAcceleration[2] + (ps.maxAcceleration[2] - ps.minAcceleration[2]) * Math.random();
                        }
                    }
                    if(propertyName == "minVelocity" || propertyName == "maxVelocity")
                    {
                        if(!ps.minVelocity) ps.minVelocity = [0,0,0];
                        if(!ps.maxVelocity) ps.maxVelocity = [0,0,0];
                        
                        for(var i = 0; i < particles.vertices.length; i++)
                        {
                            
                            particles.vertices[i].velocity.x = ps.minVelocity[0] + (ps.maxVelocity[0] - ps.minVelocity[0]) * Math.random();
                            particles.vertices[i].velocity.y = ps.minVelocity[1] + (ps.maxVelocity[1] - ps.minVelocity[1]) * Math.random();
                            particles.vertices[i].velocity.z = ps.minVelocity[2] + (ps.maxVelocity[2] - ps.minVelocity[2]) * Math.random();
                        }
                    }
                    if(propertyName == "minLifeTime" || propertyName == "maxLifeTime")
                    {
                        if(ps.minLifeTime === undefined) ps.minLifeTime = 0;
                        if(ps.maxLifeTime === undefined) ps.maxLifeTime = 1;
                        
                        for(var i = 0; i < particles.vertices.length; i++)
                        {   
                            particles.vertices[i].lifespan = ps.minLifeTime + (ps.maxLifeTime - ps.minLifeTime) * Math.random();
                        }
                    }
                }
                if(threeObject instanceof THREE.Camera)
                {
					
                    if(propertyName == "fovy")
                    {
                        if(propertyValue)
                        {
                            threeObject.fov = parseFloat(propertyValue);
                            threeObject.updateProjectionMatrix(true);
                        }
                    }
                    if(propertyName == "near")
                    {
						
                        if(propertyValue)
                        {
							
                            threeObject.near = parseFloat(propertyValue);
                            threeObject.updateProjectionMatrix(true);
                        }
                    }
                    if(propertyName == "aspect")
                    {
                        if(propertyValue)
                        {
                            threeObject.aspect = parseFloat(propertyValue); 
                            threeObject.updateProjectionMatrix(true);                           
                        }
                    }
                    if(propertyName == "far")
                    {
                        if(propertyValue)
                        {
                            threeObject.far = parseFloat(propertyValue);                    
                            threeObject.updateProjectionMatrix(true);
                        }
                    }
                    if(propertyName == "cameraType")
                    {   
                        if(propertyValue == 'perspective')
                        {
                            
                            var parent = threeObject.parent;
                            if(parent && threeObject && !(threeObject instanceof THREE.PerspectiveCamera))
                            {
                                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                                parent.remove(threeObject);
                                var cam = new THREE.PerspectiveCamera(35,$(document).width()/$(document).height() ,.01,10000);
								//cam.matrix.elements = [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
                                //CopyProperties(threeObject,cam);
                                cam.far = threeObject.far;
                                cam.near = threeObject.near;
                                cam.matrix = threeObject.matrix;
                                cam.matrixAutoUpdate = false;
                                if(threeObject.fov)
                                    cam.fov = threeObject.fov;
                                if(threeObject.aspect)
                                    cam.aspect = threeObject.aspect;    
                                if(this.state.cameraInUse == threeObject)
                                    this.state.cameraInUse = cam;
                                threeObject.updateProjectionMatrix(true);   
                                node.threeObject = cam;
                                sceneNode.camera.threeJScameras[ nodeID ] = cam;
                                parent.add(node.threeObject);
                            }
                        }
                        if(propertyValue == 'orthographic')
                        {
                            
                            var parent = threeObject.parent;
                            if(parent && threeObject && !(threeObject instanceof THREE.OrthographicCamera))
                            {
                                
                                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                                parent.remove(threeObject);
                                var offset  = threeObject.far * Math.cos(threeObject.fov/2 * 0.0174532925);
                                offset = offset/2;
                                var aspect = threeObject.aspect;
                                var cam = new THREE.OrthographicCamera(-offset,offset,offset/aspect,-offset/aspect,threeObject.near,threeObject.far);
                                cam.far = threeObject.far;
                                cam.near = threeObject.near;
                                cam.matrix = threeObject.matrix;
                                cam.matrixAutoUpdate = false;
                                if(threeObject.fov)
                                    cam.fov = threeObject.fov;
                                if(threeObject.aspect)
                                    cam.aspect = threeObject.aspect;    
                                if(this.state.cameraInUse == threeObject)
                                    this.state.cameraInUse = cam;
                                node.threeObject = cam;
                                sceneNode.camera.threeJScameras[ nodeID ] = cam;
                                parent.add(node.threeObject);
                            }
                        }
                    }
                }
                if(threeObject instanceof THREE.Material)
                {
                    if(propertyName == "texture")
                    {
                        
                        if(propertyValue !== "")
                        {
                            var img = new Image();
                            img.src = propertyValue;
                            var newmap = THREE.ImageUtils.loadTexture(propertyValue);
                            threeObject.map = newmap;
                            threeObject.needsUpdate = true;
                        }else
                        {
                            threeObject.map = null;
                            threeObject.needsUpdate = true;
                        }
                        
                    }
                    if(propertyName == "color" || propertyName == "diffuse")
                    {
						
                        // use utility to allow for colors, web colors....
						//this breaks on array values for colors
                        var vwfColor = new utility.color( propertyValue );
                        if ( !propertyValue.length ) {
                            threeObject.color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                        } else {
                            threeObject.color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
                        }

                        threeObject.needsUpdate = true;
                        if ( threeObject.ambient !== undefined ) {
                            threeObject.ambient.setRGB( threeObject.color.r, threeObject.color.g, threeObject.color.b );                    }
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
                    if ( propertyName == 'backgroundColor' )
                    {
                        if ( node && node.renderer ) {
                            if ( propertyValue instanceof Array ) {
                                switch ( propertyValue.length ) {
                                     case 3:
                                         node.renderer.setClearColor( { r:propertyValue[0], g:propertyValue[1], b:propertyValue[2] } );    
                                         break;
                                     case 4:
                                         node.renderer.setClearColor( { r:propertyValue[0], g:propertyValue[1], b:propertyValue[2] }, propertyValue[3] );    
                                         break;          
                                 }
                             }
                        }
                    }
                }   
                if(threeObject instanceof THREE.PointLight || threeObject instanceof THREE.DirectionalLight || threeObject instanceof THREE.SpotLight )
                {
                    
					if(propertyName == 'transform')
					{
						if(threeObject.target)
						{
							var offset = new THREE.Vector3(0,0,-1);
							offset.applyMatrix4(threeObject.matrixWorld);
							threeObject.target.position.x = offset.x;
							threeObject.target.position.y = offset.y;
							threeObject.target.position.z = offset.z;
							threeObject.target.updateMatrixWorld(true);
						}
					
					}
					
					
					
					if(propertyName == 'lightType')
                    {
                        var newlight;
                        var parent = threeObject.parent;
                        
                        var currProps = {
                            "distance": threeObject.distance,
                            "color":  threeObject.color,
                            "intensity": threeObject.intensity,
                            "castShadows": threeObject.castShadow,
							"matrix": threeObject.matrix,
							"targetpos": threeObject.target ? threeObject.target.position.clone() : new THREE.Vector3(),
                            "clone": function( newObj ) {
                                newObj.distance = this.distance;
                                
                                newObj.color.setRGB( this.color.r, this.color.g, this.color.b );
                                newObj.intensity = this.intensity;
                                newObj.castShadows = this.castShadows;
								newObj.matrix.elements = matCpy(this.matrix.elements);
								if(newObj.target)
									newObj.target.position.copy(this.targetpos);
                            }
                        };

                        if(propertyValue == 'point' && !(threeObject instanceof THREE.PointLight))
                        {
                            newlight = new THREE.PointLight(0xFFFFFF,1,0);
                            currProps.clone( newlight );                            
                            newlight.matrixAutoUpdate = false;
                            parent.remove( node.threeObject );
                            parent.add( newlight );
                            node.threeObject = newlight;
                            rebuildAllMaterials.call(this);
                        }
                        if(propertyValue == 'directional' && !(threeObject instanceof THREE.DirectionalLight))
                        {
                            newlight = new THREE.DirectionalLight(0xFFFFFF,1,0);
                            currProps.clone( newlight );                            
                            newlight.matrixAutoUpdate = false;
                            parent.remove( node.threeObject );
                            parent.add( newlight );
                            node.threeObject = newlight;
                            rebuildAllMaterials.call(this);
                        }
                        if(propertyValue == 'spot' && !(threeObject instanceof THREE.SpotLight))
                        {
                            newlight = new THREE.SpotLight(0xFFFFFF,1,0);
                            currProps.clone( newlight );
                            newlight.matrixAutoUpdate = false;
                            parent.remove( node.threeObject );
                            parent.add( newlight );
                            node.threeObject = newlight;
                            rebuildAllMaterials.call(this);
                        }
			node.threeObject.updateMatrixWorld(true);
			if(node.threeObject.target)
				node.threeObject.target.updateMatrixWorld(true);
                    }
                    //if(propertyName == 'diffuse')
                    //{
                    //    threeObject.color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
                    //}
			       
                    if ( propertyName == 'distance' ) {
                        threeObject.distance = propertyValue;
                    }
                    if ( propertyName == 'color' ) {
                      
                        threeObject.color.setRGB( propertyValue[0], propertyValue[1], propertyValue[2]);
                    }
                    if ( propertyName == 'intensity' ) {
                        threeObject.intensity = propertyValue;
						//threeObject.updateMatrix();
                    }   
					if ( propertyName == 'distance' ) {
                        threeObject.distance = propertyValue;
						//threeObject.updateMatrix();
                    } 					
                    if ( propertyName == 'castShadows' ) {
                        threeObject.castShadow = propertyValue;
                    }

                }
            }
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName ) {

          //console.log([nodeID,propertyName,propertyValue]);
          var node = this.state.nodes[ nodeID ]; // { name: childName, MATHObject: undefined }
          if(!node) node = this.state.scenes[ nodeID ]; // { name: childName, MATHObject: undefined }
          var value = undefined;
          
          //this driver has no representation of this node, so there is nothing to do.
          if(!node) return;
          
		  if(node.gettingProperty)
				value = node.gettingProperty(propertyName);
		  		
		  if(value !== undefined) return value;		
          var threeObject = node.threeObject;
          if( !threeObject )
            threeObject = node.threeScene;
          
          //if it's a material node, we'll work with the threeMaterial
          //might be more elegant to simply make the node.threeObject the material, but keeping it seperate
          //in case we later need access to the object the material is on.
          if( node.threeMaterial )
            threeObject = node.threeMaterial;
            
          //There is not three object for this node, so there is nothing this driver can do. return
          if(!threeObject) return value;    
          
	      if(node && node.threeScene)
              {
		if(propertyName == 'cameraPosition')
		{	
			
			var mat = node.camera.threeJScameras[node.camera.defaultCamID].matrixWorld;
			var x = mat.elements[12];
			var y = mat.elements[13];
			var z = mat.elements[14];
			return [x,y,z];
		}
	      }	      
              if ( node && threeObject ) 
              {
                if(threeObject instanceof THREE.Object3D)
                {
		    if(propertyName == 'worldPosition')
                    {
			var x = threeObject.matrixWorld.elements[12];
			var y = threeObject.matrixWorld.elements[13];
			var z = threeObject.matrixWorld.elements[14];
			return [x,y,z];
		    }
                    if(propertyName == 'transform')
                    {
                        
                        var value = matCpy(threeObject.matrix.elements); 
						
			if ( threeObject instanceof THREE.Camera ) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( value, 1, columny );
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( value, 2, columnz );
                            goog.vec.Mat4.setColumn( value, 2, columny );
                            goog.vec.Mat4.setColumn( value, 1, goog.vec.Vec4.negate( columnz, columnz ) );
                        }
						
			var ret =  value;
			return ret;
                        
                    
                    }
		    if(propertyName == 'worldtransform')
                    {
                        threeObject.updateMatrixWorld(true);
                        var value = matCpy(threeObject.matrixWorld.elements); 
						
			if ( threeObject instanceof THREE.Camera ) {
                            var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( value, 1, columny );
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( value, 2, columnz );
                            goog.vec.Mat4.setColumn( value, 2, columny );
                            goog.vec.Mat4.setColumn( value, 1, goog.vec.Vec4.negate( columnz, columnz ) );
                        }
						
			var ret =  value;
			return ret;
                        
                    
                    }
		    
	            
		   
								
                    if(propertyName ==  "boundingbox")
                    {
                        value = getBoundingBox.call( this, threeObject, true );
                        return value;
                    }
                    if ( propertyName == "centerOffset" )
                    {
                        value = getCenterOffset.call( this, threeObject );
                        return value;
                    }

                    if(propertyName ==  "meshData")
                    {
                        
                        var threeObject = node.threeObject;
                        value = [];
                        var scale = this.gettingProperty( nodeID, "scale", [] ); 
                        scale = [1,1,1];
                        var meshList = findAllMeshes.call( this, threeObject );
                        for ( var i = 0; i < meshList.length; i++ ) {
                            value.push( {  "vertices": getMeshVertices.call( this, meshList[i],threeObject ),
                                           "vertexIndices": getMeshVertexIndices.call( this, meshList[i] ),
                                           "scale": scale 
                                        } );
                        }
                        return value;
                    }
                    
                }
				if(threeObject instanceof THREE.ParticleSystem)
                {
                    var ps = threeObject;
					
					if(ps.hasOwnProperty(propertyName))
						return ps[propertyName];
                   
					
				}
                if(threeObject instanceof THREE.Material)
                {
                    if(propertyName == "texture")
                    {
                        //debugger;
                        if( threeObject.map && threeObject.map.image )
                            return threeObject.map.image.src;
                            
                    }
                    if(propertyName == "color")
                    {
                        
                            
                    }
                }
				
				if(threeObject instanceof THREE.Light)
                {
                    if(propertyName == "intensity")
                    {
						return threeObject.intensity;     
                    }
					if(propertyName == "distance")
                    {
						return threeObject.distance;     
                    }
                    if(propertyName == "color")
                    {
                        return [threeObject.color.r,threeObject.color.g,threeObject.color.b];
                            
                    }
					if(propertyName == "lightType")
                    {
                        if(threeObject instanceof THREE.DirectionalLight)
							return 'directional';
						if(threeObject instanceof THREE.SpotLight)
							return 'spot';
						if(threeObject instanceof THREE.PointLight)
							return 'point';	
                            
                    }
                }
            }       
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, args /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters
              var value = undefined;
			  
			//console.log([nodeID,propertyName,propertyValue]);
			  var node = this.state.nodes[ nodeID ]; // { name: childName, MATHObject: undefined }
			  if(!node) node = this.state.scenes[ nodeID ]; // { name: childName, MATHObject: undefined }
			  
			  //this driver has no representation of this node, so there is nothing to do.
			  if(!node) return value;
			  
			  if(node.callingMethod)
					value = node.callingMethod(methodName,args);
			
              return value;			
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
            return undefined;
        },

        // == ticking =============================================================================

        ticking: function( vwfTime ) {
        
            for(var i in this.state.nodes)
            {
                var node = this.state.nodes[i];
                var threeObject = node.threeObject;
                if(node.ticking)
					node.ticking();
            }
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
    function isMaterialDefinition( prototypes ) {
        var foundMaterial = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundMaterial; i++ ) {
                foundMaterial = ( prototypes[i] == "http-vwf-example-com-material-vwf" );    
            }
        }

        return foundMaterial;
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
    function isParticleDefinition( prototypes ) {
        var foundSystem = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundSystem; i++ ) {
                foundSystem = ( prototypes[i] == "http-vwf-example-com-particlesystem-vwf" );    
            }
        }

        return foundSystem;
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
        node.srcAssetObjects = [];
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
		//cam.matrix.elements = [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1];
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

	
    function findAllMeshes(threeObject,list)
    {
        
        if(!threeObject) return;
        if(!list) list = [];
        if(threeObject instanceof THREE.Mesh)
            list.push(threeObject);
        if(threeObject.children)
        {
            for(var i = 0; i < threeObject.children.length; i++)
            {
                findAllMeshes(threeObject.children[i],list);
            }
        }
        return list;    
    }
    
    function getMeshVertexIndices(mesh)
    {
        
        var ret = [];
        for(var i = 0; i < mesh.geometry.faces.length; i++)
        {
            var face = mesh.geometry.faces[i];
            ret.push([face.a,face.b,face.c]);

        }
        return ret;
    }
    //Get all mesh verts. Transform via matrix stack up to threeObject. Thus, get all sub mesh verts relative to this object's transform
    function getMeshVertices(mesh,threeObject )
    {
        
        var matrix = new THREE.Matrix4();
        matrix.copy(mesh.matrix);
        var parent = mesh.parent;
        while(parent && parent != threeObject)
        {
            var mat = new THREE.Matrix4();
            mat.copy(parent.matrix);
            matrix = matrix.multiply(mat,matrix);
            parent = parent.parent;
        }
        var mat = new THREE.Matrix4();
            mat.copy(threeObject.matrix);
        matrix = matrix.multiply(mat,matrix);
        var ret = [];
        for(var i = 0; i < mesh.geometry.vertices.length; i++)
        {
            var vert = new THREE.Vector3();
            vert.copy(mesh.geometry.vertices[i]);
            vert.applyMatrix4(matrix);
            ret.push([vert.x,-vert.y,vert.z]);

        }
        return ret;
    }
    //do a depth first search of the children, return the first material
    function GetMaterial(threeObject)
    {
        //something must be pretty seriously wrong if no threeobject
        if(!threeObject)
            return null;
        
        if(threeObject && threeObject.material)
            return threeObject.material;
        if(threeObject.children)
        {
            var ret = null;
            for(var i=0; i < threeObject.children.length; i++)
            {
                ret = GetMaterial(threeObject.children[i])
                if(ret) return ret;
            }               
        }       
        return null;
    }
	
	function GetAllLeafMeshes(threeObject,list)
	{
		if(threeObject instanceof THREE.Mesh)
		{
			list.push(threeObject);
		}
		if(threeObject.children)
        {
            for(var i=0; i < threeObject.children.length; i++)
            {
                GetAllLeafMeshes(threeObject.children[i],list);
            }               
        }     
	}
	function fixMissingUVs(mesh)
	{
		
		if(!mesh.geometry.faceVertexUvs[0] )
			mesh.geometry.faceVertexUvs[0] = [];
		if(mesh.geometry.faceVertexUvs[0].length == 0)
		{
			
			for(var i =0; i < mesh.geometry.faces.length; i++)
			{
				var face = mesh.geometry.faces[i];
				if(face instanceof THREE.Face4)
					mesh.geometry.faceVertexUvs[0].push([new THREE.Vector2(0,1),new THREE.Vector2(0,1),new THREE.Vector2(0,1),new THREE.Vector2(0,1)]);
				if(face instanceof THREE.Face3)
					mesh.geometry.faceVertexUvs[0].push([new THREE.Vector2(0,1),new THREE.Vector2(0,1),new THREE.Vector2(0,1)]);
			}
		}
		
		 
		mesh.geometry.computeCentroids();
		
		
		
		
		mesh.geometry.uvsNeedUpdate = true;

		
	}
    //set the material on all the sub meshes of an object.
    //This could cause some strangeness in cases where an asset has multiple sub materials
    //best to only specify the material sub-node where an asset is a mesh leaf
    function SetMaterial(threeObject,material,materialname)
    {
		
        //something must be pretty seriously wrong if no threeobject
        if(!threeObject)
            return null;
        
		
		var meshes =[];
		GetAllLeafMeshes(threeObject,meshes);
		//apply to all sub meshes
		if(!materialname || materialname == 'material')
		{
			for(var i=0; i < meshes.length; i++)
			{
				
				meshes[i].material = material;
				meshes.needsUpdate = true;
			}
		}else
		{
			var index = parseInt(materialname.substr(8));
			if(meshes[index])
			{
				
				meshes[index].material = material;
				meshes.needsUpdate = true;
				window._dMesh =meshes[index];
			}
		}
    }
    function createMesh( node, meshDef ) {
        if ( node.threeObject && node.threeObject instanceof THREE.Object3D ) {
            var i, face;
            var geo = new THREE.Geometry();
            var mat = new THREE.MeshPhongMaterial( { color: meshDef.color ? meshDef.color : 0xffffff } )

            for ( i = 0; geo.vertices && meshDef.positions && i < meshDef.positions.length; i++ ) {
                geo.vertices.push( new THREE.Vector3( meshDef.positions[i*3], meshDef.positions[i*3+1],meshDef.positions[i*3+2] ) );   
            }
            for ( i = 0; geo.faces && meshDef.faces && ( (i*3) < meshDef.faces.length ); i++ ) {
                face = new THREE.Face3( meshDef.faces[i*3], meshDef.faces[i*3+1],meshDef.faces[i*3+2] );
                geo.faces.push( face );   
            } 
            for ( i = 0 ; geo.faces && meshDef.normals && i < geo.faces.length; i++ ) {
                face = geo.faces[ i ];
                face.vertexNormals.push( new THREE.Vector3( meshDef.normals[i*3], meshDef.normals[i*3+1],meshDef.normals[i*3+2] ) );   
            }
            for ( i = 0; geo.faceVertexUvs && meshDef.uv1 && i < meshDef.uv1.length; i++ ) {
                geo.faceVertexUvs.push( new THREE.Vector2( meshDef.uv1[i*2], meshDef.uv1[i*2+1] ) );   
            }             
            node.threeObject.add( new THREE.Mesh( geo, mat ) ); 
            
            geo.computeCentroids();
        }         
    }
	//This function actuall fetches the mesh, does the decode, and loads it
    function loadAsset( parentNode, node, childType,callback ) {

        var nodeCopy = node; 
        var nodeID = node.ID;
        var childName = node.name;
        var threeModel = this;
        var sceneNode = this.state.scenes[ this.state.sceneRootID ];
		
		//callback for failure of asset parse
		function assetFailed(data)
		{
			$(document).trigger('EndParse');
            //the collada loader uses the failed callback as progress. data means this is not really an error;
			if(!data && window._Notifier)
				_Notifier.alert('error loading asset ' + data);
			
			var id = nodeCopy.ID;
                if ( !id ) id = getObjectID.call( threeModel, asset, true, false );
                if ( id && id != "" ){
                   
                    if ( threeModel.state.nodes[id] ) {
                        var assetNode = threeModel.state.nodes[id];
                        //finally, here is the async callback
                        if ( assetNode.loadingCallback ) {
                            
                            assetNode.loadingCallback( true );                    
                        }
                    }
                }			
		}
		
		//callback for sucess of asset parse
        function assetLoaded( asset ) { 
			if(node.parse)
				$(document).trigger('EndParse');
            sceneNode.pendingLoads--;
            
            //possibly deal with setting intial scale and rotation here, if threejs does something strange by default
            //collada.setRot( 0, 0, 0 ); // undo the default MATH rotation applied in MATH.Collada.initVisualScene that is adjusting for +Y up
            if(asset.scene)
                asset = asset.scene;
            var removed = false;
         
			nodeCopy.threeObject.add(asset);
			
            nodeCopy.threeObject.matrixAutoUpdate = false;
			
			
			//get the entry from the asset registry
			reg = threeModel.assetRegistry[nodeCopy.source];
			//it's not pending, and it is loaded
			reg.pending = false;
			reg.loaded = true;
			//store this asset in the registry
			reg.node = asset;
			
			//if any callbacks were waiting on the asset, call those callbacks
			for(var i = 0; i < reg.callbacks.length; i++)
				reg.callbacks[i](asset);
			//nothing should be waiting on callbacks now.	
			reg.callbacks = [];	
			
			
			
            //no idea what this is doing here
            if ( nodeCopy && nodeCopy.assetLoaded ) {
                nodeCopy.assetLoaded( true );
            }
            for ( var j = 0; j < sceneNode.srcAssetObjects.length; j++ ) {
                if ( sceneNode.srcAssetObjects[j] == nodeCopy.threeObject ){
                    sceneNode.srcAssetObjects.splice( j, 1 );
                    removed = true;
                }
            } 
            if ( removed ) {
                if ( sceneNode.srcAssetObjects.length == 0 ) {
                    
                    loadComplete.call( threeModel );
                }

                var id = nodeCopy.vwfID;
                if ( !id ) id = getObjectID.call( threeModel, asset, true, false );
                if ( id && id != "" ){
                   
                    if ( threeModel.state.nodes[id] ) {
                        var assetNode = threeModel.state.nodes[id];
                        //finally, here is the async callback
                        if ( assetNode.loadingCallback ) {
                            
                            assetNode.loadingCallback( true );                    
                        }
                    }
                }
            }
			
			
        }
        node.name = childName;
		//create an Object3D to hold the asset
        if(!node.threeObject)
		{
            node.threeObject = new THREE.Object3D();
			node.threeObject.matrixAutoUpdate = false;
			node.threeObject.updateMatrixWorld(true);
			
		}
       
        //link up the Object3D into the scene graph
        if ( parentNode && parentNode.threeObject ) {
            parentNode.threeObject.add(node.threeObject);
         } else if ( sceneNode ) {
            if ( sceneNode.threeScene ) {
                sceneNode.threeScene.add( node.threeObject );
            }
             
        }
		
		//create an asset registry if one does not exist for this driver
		if(!this.assetRegistry)
		{
			this.assetRegistry = {};
		}
		// if there is no entry in the registry, create one
		if(!this.assetRegistry[node.source])
		{
			//its new, so not waiting, and not loaded
			this.assetRegistry[node.source] = {};
			this.assetRegistry[node.source].loaded = false;
			this.assetRegistry[node.source].pending = false;
			this.assetRegistry[node.source].callbacks = [];
		}
		//grab the registry entry for this asset
		var reg = this.assetRegistry[node.source];
		
		this.currentCallback = callback;
		//if the asset entry is not loaded and not pending, you'll have to actaully go download and parse it
		if(reg.loaded == false && reg.pending == false)
		{
			callback( false );
			//thus, it becomes pending
			reg.pending = true;
			
			sceneNode.srcAssetObjects.push( node.threeObject );
			node.threeObject.vwfID = nodeID;
			sceneNode.pendingLoads++;
		
		     //Do we need this when we have an async load? currently seems to break things
			 //NOTE: yes, need to prevent the queue from advancing - I think
             //this pauses the queue. Resume by calling with true
			
		
			//call up the correct loader/parser
			if(childType == "model/vnd.collada+xml")
			{
				$(document).trigger('BeginParse',['Loading...',node.source]);
				node.parse = true;
				node.loader = new THREE.ColladaLoader();
               
				node.loader.load(node.source,assetLoaded.bind(this),assetFailed.bind(this));
			}
			if(childType == "model/vnd.osgjs+json+compressed")
			{
				alertify.log('Downloading ' + node.source);
				node.loader = new UTF8JsonLoader(node,assetLoaded.bind(this),assetFailed.bind(this));
			}
			
			
		}
		//if the asset registry entry is not pending and it is loaded, then just grab a copy, no download or parse necessary
		else if(reg.loaded == true && reg.pending == false)
		{
			
			node.threeObject.add(reg.node.clone());
			node.threeObject.updateMatrixWorld(true);
			$(document).trigger('EndParse');
			
		}
		//if it's pending but not done, register a callback so that when it is done, it can be attached.
		else if(reg.loaded == false && reg.pending == true)
		{	
			callback( false );
			
			sceneNode.srcAssetObjects.push( node.threeObject );
			node.threeObject.vwfID = nodeID;
			sceneNode.pendingLoads++;   
			
			//so, not necessary to do all the other VWF node goo stuff, as that will be handled by the node that requseted
			//the asset in teh first place
			//
			
			reg.callbacks.push(function(node)
			{
				
				//just clone the node and attach it.
				//this should not clone the geometry, so much lower memory.
				//seems to take near nothing to duplicated animated avatar
				$(document).trigger('EndParse');
				nodeCopy.threeObject.add(node.clone());
				nodeCopy.threeObject.updateMatrixWorld(true);
				nodeCopy.threeObject.sceneManagerUpdate();
				this.tcal( true );
			}.bind({tcal:callback}));
		}
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
                this.logger.info("====>>>  vwf.model-MATH.mousePick: searching for: " + path(objectToLookFor) );
            }
            jQuery.each( this.state.nodes, function (nodeID, node) {
                if ( node.threeObject == objectToLookFor && !node.MATHMaterial ) {
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

        //debugger;
        var child = this.state.nodes[childID];
        if ( child ) {
            child.threeObject = new THREE.PointLight(0xFFFFFF,1,0);
            //child.threeObject.shadowCameraRight     =  500;
            //child.threeObject.shadowCameraLeft      = -500;
            //child.threeObject.shadowCameraTop       =  500;
            //child.threeObject.shadowCameraBottom    = -500;
            
            // these properties are now exposed as properties
            //child.threeObject.distance = 100;
            //child.threeObject.color.setRGB(1,1,1);

            child.threeObject.matrixAutoUpdate = false;
        
            child.threeObject.name = childName;
            child.name = childName;
		
            addThreeChild.call( this, nodeID, childID );
			rebuildAllMaterials.call(this);
        } 
               
    }
    function CreateParticleSystem(nodeID, childID, childName )
    {
        
        
        var child = this.state.nodes[childID];
        if ( child ) 
        {
        
            
            
            // create the particle variables
           
            var particles = new THREE.Geometry();
            
                  
                

            //default material expects all computation done cpu side, just renders
			// note that since the color, size, spin and orientation are just linear
		    // interpolations, they can be done in the shader
            var vertShader_default = 
            "attribute float size; \n"+
            "attribute vec4 vertexColor;\n"+
            "varying vec4 vColor;\n"+
			"attribute vec4 random;\n"+
			"varying vec4 vRandom;\n"+
			"uniform float sizeRange;\n"+
			"uniform vec4 colorRange;\n"+
            "void main() {\n"+
            "   vColor = vertexColor + (random -0.5) * colorRange;\n"+
            "   vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );\n"+
			"   float psize = size + (random.y -0.5) * sizeRange;\n"+
            "   gl_PointSize = psize * ( 1000.0/ length( mvPosition.xyz ) );\n"+
            "   gl_Position = projectionMatrix * mvPosition;\n"+
			 "   vRandom = random;"+
            "}    \n";
            var fragShader_default = 
            "uniform float useTexture;\n"+
            "uniform sampler2D texture;\n"+
            "varying vec4 vColor;\n"+
			"varying vec4 vRandom;\n"+
			"uniform float time;\n"+
            "uniform float maxSpin;\n"+
            "uniform float minSpin;\n"+
			"uniform float maxOrientation;\n"+
            "uniform float minOrientation;\n"+
			"uniform float textureTiles;\n"+
			"uniform float alphaTest;\n"+
            "void main() {\n"+
			            " vec2 coord = vec2(0.0,0.0);"+
			" vec2 orig_coord = vec2(gl_PointCoord.s,1.0-gl_PointCoord.t);"+
            " float spin = mix(maxSpin,minSpin,vRandom.x);"+
            " float orientation = mix(maxOrientation,minOrientation,vRandom.y);"+
            " coord.s = (orig_coord.s-.5)*cos(time*spin+orientation)-(orig_coord.t-.5)*sin(time*spin+orientation);"+
            " coord.t = (orig_coord.t-.5)*cos(time*spin+orientation)+(orig_coord.s-.5)*sin(time*spin+orientation);"+
			" coord = coord + vec2(.5,.5);\n"+
			" coord = coord/textureTiles;\n"+
			" coord.x = clamp(coord.x,0.0,1.0/textureTiles);\n"+
			" coord.y = clamp(coord.y,0.0,1.0/textureTiles);\n"+
			" coord += vec2(floor(vRandom.x*textureTiles)/textureTiles,floor(vRandom.y*textureTiles)/textureTiles);\n"+
            "   vec4 outColor = (vColor * texture2D( texture, coord  )) *useTexture + vColor * (1.0-useTexture);\n"+
            
            "   gl_FragColor = outColor;\n"+
            "}\n";
			
			//the default shader - the one used by the analytic solver, just has some simple stuff
			//note that this could be changed to do just life and lifespan, and calculate the 
			//size and color from to uniforms. Im not going to bother
            var attributes_default = {
                size: { type: 'f', value: [] },
                vertexColor:   {    type: 'v4', value: [] },
				random:   { type: 'v4', value: [] },
				
            };
            var uniforms_default = {
                amplitude: { type: "f", value: 1.0 },
                texture:   { type: "t", value: THREE.ImageUtils.loadTexture( "textures/sprites/ball.png" ) },
                useTexture: { type: "f", value: 0.0 },
                maxSpin: { type: "f", value: 0.0 },
                minSpin: { type: "f", value: 0.0 },
				maxOrientation: { type: "f", value: 0.0 },
                minOrientation: { type: "f", value: 0.0 },
				time: { type: "f", value: 0.0 },
				fractime: { type: "f", value: 0.0 },
				sizeRange: { type: "f", value: 0.0 },
				textureTiles: { type: "f", value: 1.0 },
				colorRange:   { type: 'v4', value: new THREE.Vector4(0,0,0,0) },
				startColor:{type: "v4", value:new THREE.Vector4(1,1,1,1)},
                endColor:{type: "v4", value:new THREE.Vector4(0,0,0,1)},
                startSize:{type:"f", value:1},
                endSize:{type:"f", value:1},
				alphaTest:{type:"f", value:.5}
            };
            uniforms_default.texture.value.wrapS = uniforms_default.texture.value.wrapT = THREE.RepeatWrapping;
            var shaderMaterial_default = new THREE.ShaderMaterial( {
                uniforms:       uniforms_default,
                attributes:     attributes_default,
                vertexShader:   vertShader_default,
                fragmentShader: fragShader_default

                  });

			//the interpolate shader blends from one simulation step to the next on the shader
			//this	allows for a complex sim to run at a low framerate, but still have smooth motion
            //this is very efficient, as it only requires sending data up to the gpu on each sim tick		
			//reuse the frag shader from the normal material	
            var vertShader_interpolate = 
           
			"attribute float age; \n"+
			"attribute float lifespan; \n"+
			"attribute vec3 previousPosition;\n"+
            "varying vec4 vColor;\n"+
			"attribute vec4 random;\n"+
			"varying vec4 vRandom;\n"+
			"uniform float sizeRange;\n"+
			"uniform vec4 colorRange;\n"+
			"uniform float fractime;\n"+
			"uniform float startSize;\n"+
            "uniform float endSize;\n"+
            "uniform vec4 startColor;\n"+
            "uniform vec4 endColor;\n"+
            "void main() {\n"+
            "   vColor = mix(startColor,endColor,(age+fractime*3.33)/lifespan) + (random -0.5) * colorRange;\n"+
            "   vec4 mvPosition = modelViewMatrix * vec4(mix(previousPosition,position,fractime), 1.0 );\n"+
			"   float psize = mix(startSize,endSize,(age+fractime*3.33)/lifespan) + (random.y -0.5) * sizeRange;\n"+
            "   gl_PointSize = psize * ( 1000.0/ length( mvPosition.xyz ) );\n"+
            "   gl_Position = projectionMatrix * mvPosition;\n"+
			 "   vRandom = random;"+
            "}    \n";
            
			//the interpolation does need to remember the previous position
			var attributes_interpolate = {
				random:   attributes_default.random,
				previousPosition: { type: 'v3', value: [] },
				age: { type: 'f', value: [] },
				lifespan: { type: 'f', value: [] },
            };
            var shaderMaterial_interpolate = new THREE.ShaderMaterial( {
                uniforms:       uniforms_default,
                attributes:     attributes_interpolate,
                vertexShader:   vertShader_interpolate,
                fragmentShader: fragShader_default

            });
            
            
            //analytic shader does entire simulation on GPU
			//it cannot account for drag, gravity. nor can it generate new randomness. Each particle has it's randomness assigned and it 
			//just repeats the same motion over and over. Also, the other solvers can hold a particle until 
			//it can be reused based on the emitRate. This cannot, as the entire life of the particle must be 
			//computed from an equation given just time t. It does offset them in time to avoid all the particles 
			//being generated at once. Also, it does not account for emitter motion. 
			//upside : very very efficient. No CPU intervention required
            var vertShader_analytic = 
            "attribute float size; \n"+
            "attribute vec4 vertexColor;\n"+
            "attribute vec3 acceleration;\n"+
            "attribute vec3 velocity;\n"+
            "attribute float lifespan;\n"+
            "attribute vec4 random;\n"+
            "uniform float time;\n"+
            "uniform float startSize;\n"+
            "uniform float endSize;\n"+
            "uniform vec4 startColor;\n"+
            "uniform vec4 endColor;\n"+
            "varying vec4 vColor;\n"+
            "varying vec4 vRandom;\n"+
			"uniform float sizeRange;\n"+
			"uniform vec4 colorRange;\n"+
            "void main() {\n"+
			//randomly offset in time
            "   float lifetime = fract(random.x+(time))*lifespan*1.33;"+
			//solve for position
            "   vec3 pos2 = position.xyz + velocity*lifetime + (acceleration*lifetime*lifetime)/2.0;"+ // ;
            "   vec4 mvPosition = modelViewMatrix * vec4( pos2.xyz, 1.0 );\n"+
			//find random size based on randomness, start and end size, and size range
			"   float psize = mix(startSize,endSize,lifetime/lifespan) + (random.y -0.5) * sizeRange;\n"+
            "   gl_PointSize = psize * ( 1000.0/ length( mvPosition.xyz ) );\n"+
            "   gl_Position = projectionMatrix * mvPosition;\n"+
			" vec4 nR = (random -0.5);\n"+
			//find random color based on start and endcolor, time and colorRange
            "   vColor = mix(startColor,endColor,lifetime/lifespan)  +  nR * colorRange;\n"+
            "   vRandom = random;"+
            "}    \n";
            var fragShader_analytic = 
            "uniform float useTexture;\n"+
            "uniform sampler2D texture;\n"+
            "uniform float time;\n"+
            "uniform float maxSpin;\n"+
            "uniform float minSpin;\n"+
            "varying vec4 vColor;\n"+
            "varying vec4 vRandom;\n"+
			"uniform float maxOrientation;\n"+
            "uniform float minOrientation;\n"+
			"uniform float textureTiles;\n"+
			"uniform float alphaTest;\n"+
            "void main() {\n"+
           
			//bit of drama for dividing into 4 or 9 'virtual' textures
			//nice to be able to have different images on particles
 		    " vec2 coord = vec2(0.0,0.0);"+
			" vec2 orig_coord = vec2(gl_PointCoord.s,1.0-gl_PointCoord.t);"+
            " float spin = mix(maxSpin,minSpin,vRandom.x);"+
            " float orientation = mix(maxOrientation,minOrientation,vRandom.y);"+
            " coord.s = (orig_coord.s-.5)*cos(time*spin+orientation)-(orig_coord.t-.5)*sin(time*spin+orientation);"+
            " coord.t = (orig_coord.t-.5)*cos(time*spin+orientation)+(orig_coord.s-.5)*sin(time*spin+orientation);"+
			" coord = coord + vec2(.5,.5);\n"+
			" coord = coord/textureTiles;\n"+
			" coord.x = clamp(coord.x,0.0,1.0/textureTiles);\n"+
			" coord.y = clamp(coord.y,0.0,1.0/textureTiles);\n"+
			" coord += vec2(floor(vRandom.x*textureTiles)/textureTiles,floor(vRandom.y*textureTiles)/textureTiles);\n"+
            
			//get the color from the texture and blend with the vertexColor.
			" vec4 outColor = (vColor * texture2D( texture, coord )) *useTexture + vColor * (1.0-useTexture);\n"+
            " if(outColor.a < alphaTest) discard;\n" + 
            "   gl_FragColor = outColor;\n"+
            "}\n";
            var attributes_analytic = {
                acceleration:   {   type: 'v3', value: [] },
                velocity:   {   type: 'v3', value: [] },
				previousPosition: attributes_interpolate.previousPosition,
				age: attributes_interpolate.age,
                lifespan:  attributes_interpolate.lifespan,
                random:   attributes_default.random,
                vertexColor : attributes_default.vertexColor,
                size: attributes_default.size
            };
            var shaderMaterial_analytic = new THREE.ShaderMaterial( {
                uniforms:       uniforms_default,
                attributes:     attributes_analytic,
                vertexShader:   vertShader_analytic,
                fragmentShader: fragShader_analytic
            });


            // create the particle system
            var particleSystem = new THREE.ParticleSystem(particles,shaderMaterial_default);
            
			//keep track of the shaders
            particleSystem.shaderMaterial_analytic = shaderMaterial_analytic;
            particleSystem.shaderMaterial_default = shaderMaterial_default;
			particleSystem.shaderMaterial_interpolate = shaderMaterial_interpolate;
            
			particleSystem.shaderMaterial_analytic.transparent = true;
            particleSystem.shaderMaterial_default.transparent = true;
			particleSystem.shaderMaterial_interpolate.transparent = true;
			
			//setup all the default values
            particleSystem.minVelocity = [0,0,0];
            particleSystem.maxVelocity = [0,0,0];
            particleSystem.maxAcceleration = [0,0,0];
            particleSystem.minAcceleration = [0,0,0];
            particleSystem.minLifeTime = 30;
            particleSystem.maxLifeTime = 30;
            particleSystem.emitterType = 'point';
            particleSystem.emitterSize = [0,0,0];
            particleSystem.startColor = [1,1,1,1];
            particleSystem.endColor = [0,0,0,1];
            particleSystem.regenParticles = [];
            particleSystem.maxRate = 1;
            particleSystem.particleCount = 1000;
            particleSystem.damping = 0;
            particleSystem.startSize = 1;
            particleSystem.endSize = 1;
			particleSystem.gravity = 0;
			particleSystem.gravityCenter = [0,0,0];
            particleSystem.velocityMode = 'cartesian';
			particleSystem.temp = new THREE.Vector3();
			particleSystem.maxSpin = 0;
            particleSystem.minSpin = 0;
			particleSystem.minOrientation = 0;
			particleSystem.maxOrientation = 0;
			particleSystem.sizeRange = 0;
			particleSystem.colorRange = [0,0,0,0];
			particleSystem.gravity = 0;
			particleSystem.gravityCenter = [0,0,0];
			particleSystem.textureTiles = 1;
			particleSystem.solver = 'AnalyticShader';
			particleSystem.depthTest = true;
			particleSystem.opacity = 1;
			particleSystem.additive = false;
			particleSystem.image = null;
			
			
           
			//create a new particle. create and store all the values for vertex attributes in each shader
		   particleSystem.createParticle = function(i)
            {
                var particle = new THREE.Vector3(0,0,0);
                this.geometry.vertices.push(particle);
            
                particle.i = i;
                
				//the world space position
                particle.world = new THREE.Vector3();
				//the previous !tick! (not frame) position
                particle.prevworld = new THREE.Vector3();
				this.shaderMaterial_interpolate.attributes.previousPosition.value.push(particle.prevworld);
                //the color
				var color = new THREE.Vector4(1,1,1,1);
                this.shaderMaterial_default.attributes.vertexColor.value.push(color);
				//age
				this.shaderMaterial_interpolate.attributes.age.value.push(1);
                particle.color = color;
				
				//the sise
                this.shaderMaterial_default.attributes.size.value.push(1);
                var self = this;
				//set the size - stored per vertex
                particle.setSize = function(s)
                {
                    self.material.attributes.size.value[this.i] = s;
                }
				//set the age - stored per vertex
				particle.setAge = function(a)
				{
					this.age = a;
					self.shaderMaterial_interpolate.attributes.age.value[this.i] = this.age;
				}
				//the lifespan - stored per vertex
				particle.setLifespan = function(a)
				{
					this.lifespan = a;
					self.shaderMaterial_interpolate.attributes.lifespan.value[this.i] = this.a;
				}
                
				//This looks like it could be computed from the start and end plus random on the shader
				//doing this saves computetime on the shader at expense of gpu mem
                shaderMaterial_analytic.attributes.acceleration.value.push(new THREE.Vector3());
                shaderMaterial_analytic.attributes.velocity.value.push(new THREE.Vector3());
                shaderMaterial_analytic.attributes.lifespan.value.push(1);
                shaderMaterial_analytic.attributes.random.value.push(new THREE.Vector4(Math.random(),Math.random(),Math.random(),Math.random()));
                return particle;
            }
            
			//Generate a new point in space based on the emitter type and size
            particleSystem.generatePoint = function()
            {
				//generate from a point
				//TODO: specify point?
                if(this.emitterType.toLowerCase() == 'point')
                {
                    return new THREE.Vector3(0,0,0);
                }
				//Generate in a box
				//assumes centered at 0,0,0
                if(this.emitterType.toLowerCase() == 'box')
                {
                    var x = this.emitterSize[0] * Math.random() - this.emitterSize[0]/2;
                    var y = this.emitterSize[1] * Math.random() - this.emitterSize[1]/2;
                    var z = this.emitterSize[2] * Math.random() - this.emitterSize[2]/2;
                    
                    return new THREE.Vector3(x,y,z);
                }
				//Generate in a sphere
				//assumes centered at 0,0,0
                if(this.emitterType.toLowerCase() == 'sphere')
                {
                    var u2 = Math.random();
                    u2 = Math.pow(u2,1/3);
                    var o = this.emitterSize[0] * Math.random() * Math.PI*2;
                    var u = this.emitterSize[1] * Math.random() * 2 - 1;
                    var r = this.emitterSize[2]  * u2;
                    var x = Math.cos(o)*Math.sqrt(1-(u*u));
                    var y = Math.sin(o)*Math.sqrt(1-(u*u));
                    var z = u;
                    
                    
                    return new THREE.Vector3(x,y,z).setLength(r);
                }
            
            }
			//setup the particles with new values
            particleSystem.rebuildParticles = function()
            {
                for(var i = 0; i < this.geometry.vertices.length; i++)
                {
                    this.setupParticle(this.geometry.vertices[i],this.matrix);
					this.geometry.vertices[i].waitForRegen = false;
                }
				this.regenParticles.length = 0;
            }
			//set the particles initial values. Used when creating and resuing particles
            particleSystem.setupParticle = function(particle,mat,inv)
            {
                
                particle.x = 0;
                particle.y = 0;
                particle.z = 0;
                
				//generate a point in objects space, the move to world space
				//dont do if in analytic shader mode
				particle.world = this.generatePoint();
				if(this.solver != "AnalyticShader")
				{
				particle.world.applyMatrix4(mat);
				}
                
				
                
				//back up initial (needed by the analyticShader)
                particle.initialx = particle.world.x;
                particle.initialy = particle.world.y;
                particle.initialz = particle.world.z;
                
				//start at initial pos
                particle.x = particle.initialx;
                particle.y = particle.initialy;
                particle.z = particle.initialz;
                
              
                //start stoped, age 0
                particle.age = 0;
                particle.velocity = new THREE.Vector3(0,0,0);
                particle.acceleration = new THREE.Vector3( 0,0,0);  
                particle.lifespan = 1;  
                
				//Generate the initial velocity
				//In this mode, you specify a min and max x,y,z
                if(this.velocityMode == 'cartesian')
                {
                    particle.velocity.x = this.minVelocity[0] + (this.maxVelocity[0] - this.minVelocity[0]) * Math.random();
                    particle.velocity.y = this.minVelocity[1] + (this.maxVelocity[1] - this.minVelocity[1]) * Math.random();
                    particle.velocity.z = this.minVelocity[2] + (this.maxVelocity[2] - this.minVelocity[2]) * Math.random();
                }
				//In this mode, you give a pitch and yaw from 0,1, and a min and max length.
				//This is easier to emit into a circle, or a cone section
                if(this.velocityMode == 'spherical')
                {
                
                    //random sphercial points concentrate at poles
                    /* var r = this.minVelocity[2] + (this.maxVelocity[2] - this.minVelocity[2]) * Math.random();
                    var t = this.minVelocity[1] + (this.maxVelocity[1] - this.minVelocity[1]) * Math.random() * Math.PI*2;
                    var w = this.minVelocity[0] + (this.maxVelocity[0] - this.minVelocity[0]) * Math.random() * Math.PI - Math.PI/2;
                    particle.velocity.x = r * Math.sin(t)*Math.cos(w);
                    particle.velocity.y = r * Math.sin(t)*Math.sin(w);
                    particle.velocity.z = r * Math.cos(t); */
                    
					//better distribution
                    var o = this.minVelocity[0] + (this.maxVelocity[0] - this.minVelocity[0]) * Math.random() * Math.PI*2;
                    var u = this.minVelocity[1] + (this.maxVelocity[1] - this.minVelocity[1]) * Math.random() * 2 - 1;
                    var u2 = Math.random();
                    u2 = Math.pow(u2,1/3);
                    var r = this.minVelocity[2] + (this.maxVelocity[2] - this.minVelocity[2]) * u2;
                    particle.velocity.x = Math.cos(o)*Math.sqrt(1-(u*u));
                    particle.velocity.y = Math.sin(o)*Math.sqrt(1-(u*u));
                    particle.velocity.z = u;
                    particle.velocity.setLength(r);
                }
                
				//The velocity should be in world space, but is generated in local space for 
				//ease of use
                mat = mat.clone();
                mat.elements[12] = 0;
                mat.elements[13] = 0;
                mat.elements[14] = 0;
                particle.velocity.applyMatrix4(mat);
                
                //accelerations are always world space, just min and max on each axis
                particle.acceleration.x = this.minAcceleration[0] + (this.maxAcceleration[0] - this.minAcceleration[0]) * Math.random();
                particle.acceleration.y = this.minAcceleration[1] + (this.maxAcceleration[1] - this.minAcceleration[1]) * Math.random();
                particle.acceleration.z = this.minAcceleration[2] + (this.maxAcceleration[2] - this.minAcceleration[2]) * Math.random();
                particle.setLifespan(this.minLifeTime + (this.maxLifeTime - this.minLifeTime) * Math.random());
                
				//color is start color
				particle.color.x = this.startColor[0];
                particle.color.y = this.startColor[1];
                particle.color.z = this.startColor[2];
                particle.color.w = this.startColor[3];
                
				//save the values into the attributes
                shaderMaterial_analytic.attributes.acceleration.value[particle.i] = (particle.acceleration);
                shaderMaterial_analytic.attributes.velocity.value[particle.i] = (particle.velocity);
                shaderMaterial_analytic.attributes.lifespan.value[particle.i] = (particle.lifespan);
                
                
                shaderMaterial_analytic.attributes.acceleration.needsUpdate = true;
                shaderMaterial_analytic.attributes.velocity.needsUpdate = true;
                shaderMaterial_analytic.attributes.lifespan.needsUpdate = true;
                this.geometry.verticesNeedUpdate = true;
                //randomly move the particle up to one step in time
                particle.prevworld.x = particle.x;
                particle.prevworld.y = particle.y;
                particle.prevworld.z = particle.z;

            }
            
			//when updating in AnalyticShader mode, is very simple, just inform the shader of new time.
            particleSystem.updateAnalyticShader = function(time)
            {   
                particleSystem.material.uniforms.time.value += time/3333.0;
            
            }
            
			//In Analytic mode, run the equation for the position
            particleSystem.updateAnalytic =function(time)
            {
				particleSystem.material.uniforms.time.value += time/3333.0;
				
                var time_in_ticks = time/33.333;

                var inv = this.matrix.clone();
                inv = inv.getInverse(inv);
                    
                var particles = this.geometry;
				
				//update each particle
                var pCount = this.geometry.vertices.length;
                while(pCount--) 
                {
                    var particle =particles.vertices[pCount];                   
                    this.updateParticleAnalytic(particle,this.matrix,inv,time_in_ticks);
                }
                    
                //examples developed with faster tick - maxrate *33 is scale to make work 
                //with new timing
				//Reuse up to maxRate particles, sliced for delta_time
				//Once a particle reaches it's end of life, its available to be regenerated.
				//We hold extras in limbo with alpha 0 until they can be regenerated
				//Note the maxRate never creates or destroys particles, just manages when they will restart
				//after dying
                var len = Math.min(this.regenParticles.length,this.maxRate*15*time_in_ticks);
                for(var i =0; i < len; i++)
                {
                        
					//setup with new random values, and move randomly forward in time one step	
                    var particle = this.regenParticles.shift();
                    this.setupParticle(particle,this.matrix,inv);
                    this.updateParticleAnalytic(particle,this.matrix,inv,Math.random()*3.33);
                    particle.waitForRegen = false;
                }
                    
					
				//only these things change, other properties are in the shader as they are linear WRT time	
                this.geometry.verticesNeedUpdate  = true;
                this.geometry.colorsNeedUpdate  = true;
                this.material.attributes.vertexColor.needsUpdate = true;
                this.material.attributes.size.needsUpdate = true;
            }
            
            particleSystem.counter = 0;
            particleSystem.testtime = 0;
            particleSystem.totaltime = 0;
            //timesliced Euler integrator
            //todo: switch to RK4 
			//This can do more complex sim, maybe even a cloth sim or such. It ticks 10 times a second, and blends tick with previous via a shader
            particleSystem.updateEuler = function(time)
            {
				particleSystem.material.uniforms.time.value += time/3333.0;
                //var timer = performance.now();
                var time_in_ticks = time/100.0;
                
                if(this.lastTime === undefined) this.lastTime = 0;

                this.lastTime += time_in_ticks;//ticks - Math.floor(ticks);

				var inv = this.matrix.clone();
				inv = inv.getInverse(inv);
					
				var particles = this.geometry;
				
				//timesliced tick give up after 5 steps - just cant go fast enough		
				if(Math.floor(this.lastTime) > 5)
					this.lastTime = 1;
				for(var i=0; i < Math.floor(this.lastTime) ; i++)
				{
					this.lastTime--;
					
					var pCount = this.geometry.vertices.length;
					while(pCount--) 
					{
						var particle =particles.vertices[pCount];					
						this.updateParticleEuler(particle,this.matrix,inv,3.333);
					}
					
					//examples developed with faster tick - maxrate *33 is scale to make work 
					//with new timing
					
					//Reuse up to maxRate particles, sliced for delta_time
					//Once a particle reaches it's end of life, its available to be regenerated.
					//We hold extras in limbo with alpha 0 until they can be regenerated
					//Note the maxRate never creates or destroys particles, just manages when they will restart
					//after dying
					var len = Math.min(this.regenParticles.length,this.maxRate*333);
					for(var i =0; i < len; i++)
					{
						
						particle.waitForRegen = false;
						var particle = this.regenParticles.shift();
						this.setupParticle(particle,this.matrix,inv);
						this.updateParticleEuler(particle,this.matrix,inv,Math.random()*3.33);
						this.material.attributes.lifespan.needsUpdate = true;
					}
					
					//only need to send up the age, position, and previous position. other props handled in the shader
					this.geometry.verticesNeedUpdate  = true;	
					this.material.attributes.previousPosition.needsUpdate = true;
					
					this.material.attributes.age.needsUpdate = true;
					
				}
				
				//even if this is not a sim tick, we need to send the fractional time up to the shader for the interpolation
				this.material.uniforms.fractime.value = this.lastTime;	
				
			}
			
			//Update a particle from the Analytic solver
			particleSystem.updateParticleAnalytic = function(particle,mat,inv,delta_time)
			{
				particle.age += delta_time;
				
				//Make the particle dead. Hide it until it can be reused
				if(particle.age >= particle.lifespan && !particle.waitForRegen)
				{
					this.regenParticles.push(particle);
					particle.waitForRegen = true;
					particle.x = 0;
					particle.y = 0;
					particle.z = 0;
					particle.color.w = 0.0;
				}else
				{
					//Run the formula to get position.
					var percent = particle.age/particle.lifespan;
					particle.world.x = particle.initialx + (particle.velocity.x * particle.age) + 0.5*(particle.acceleration.x * particle.age * particle.age)
					particle.world.y = particle.initialy + (particle.velocity.y * particle.age)  + 0.5*(particle.acceleration.y * particle.age * particle.age)
					particle.world.z = particle.initialz + (particle.velocity.z * particle.age)  + 0.5*(particle.acceleration.z * particle.age * particle.age)
					
					this.temp.x = particle.world.x;
					this.temp.y = particle.world.y;
					this.temp.z = particle.world.z;
					
					//need to specify in object space, event though comptued in local
					this.temp.applyMatrix4(inv);
					particle.x = this.temp.x;
					particle.y = this.temp.y;
					particle.z = this.temp.z;
					
					//Should probably move this to the shader. Linear with time, no point in doing on CPU
					particle.color.x = this.startColor[0] + (this.endColor[0] - this.startColor[0]) * percent;
					particle.color.y = this.startColor[1] + (this.endColor[1] - this.startColor[1]) * percent;
					particle.color.z = this.startColor[2] + (this.endColor[2] - this.startColor[2]) * percent;
					particle.color.w = this.startColor[3] + (this.endColor[3] - this.startColor[3]) * percent;
					
					particle.setSize(this.startSize + (this.endSize - this.startSize) * percent);
				}
			}
			
			//updtae a partilce with the Euler solver
			particleSystem.updateParticleEuler = function(particle,mat,inv,step_dist)
			{
					particle.prevage = particle.age;
					particle.age += step_dist;
					particle.setAge(particle.age + step_dist);
					
					//If the particle is dead ,hide it unitl it can be reused
					if(particle.age >= particle.lifespan && !particle.waitForRegen)
					{
						
						this.regenParticles.push(particle);
						particle.waitForRegen = true;
						particle.x = 0;
						particle.y = 0;
						particle.z = 0;
					    particle.world.x = 0;
						particle.world.y = 0;
						particle.world.z = 0;
						particle.prevworld.x = 0;
						particle.prevworld.y = 0;
						particle.prevworld.z = 0;
						particle.color.w = 1.0;
						particle.size = 100;
					}else
					{
					
					
						// and the position
						particle.prevworld.x = particle.world.x;
						particle.prevworld.y = particle.world.y;
						particle.prevworld.z = particle.world.z;
						
						//find direction to center for gravity
						var gravityAccel = new THREE.Vector3(particle.world.x,particle.world.y,particle.world.z);
						gravityAccel.x -= this.gravityCenter[0];
						gravityAccel.y -= this.gravityCenter[1];
						gravityAccel.z -= this.gravityCenter[2];
						var len = gravityAccel.length()+.1;
						gravityAccel.normalize();
						gravityAccel.multiplyScalar(-Math.min(1/(len*len),100));
						gravityAccel.multiplyScalar(this.gravity);
						
						//update position
						particle.world.x += particle.velocity.x * step_dist + (particle.acceleration.x + gravityAccel.x)* step_dist * step_dist;
						particle.world.y += particle.velocity.y * step_dist + (particle.acceleration.y + gravityAccel.y )* step_dist * step_dist;;
						particle.world.z += particle.velocity.z * step_dist + (particle.acceleration.z + gravityAccel.z )* step_dist * step_dist;;

                      //update velocity
                    particle.velocity.x += (particle.acceleration.x + gravityAccel.x) * step_dist * step_dist;
                    particle.velocity.y += (particle.acceleration.y + gravityAccel.y) * step_dist * step_dist;
                    particle.velocity.z += (particle.acceleration.z + gravityAccel.z) * step_dist * step_dist
                    
                    var damping = 1-(this.damping * step_dist);
					
					//drag
                    particle.velocity.x *= damping;
                    particle.velocity.y *= damping;
                    particle.velocity.z *= damping;
                    
					
					//move from world to local space
					this.temp.x = particle.world.x ;
					this.temp.y = particle.world.y ;
					this.temp.z = particle.world.z;
					this.temp.applyMatrix4(inv);
					particle.x = this.temp.x;
					particle.y = this.temp.y;
					particle.z = this.temp.z;
					//careful to have prev and current pos in same space!!!!
					particle.prevworld.applyMatrix4(inv);
                }
            }
           
            //Change the solver type for the system
            particleSystem.setSolverType =function(type)
            {
				this.solver = type;
                if(type == 'Euler')
                {
                    particleSystem.update = particleSystem.updateEuler;
                    particleSystem.material = particleSystem.shaderMaterial_interpolate;
                    particleSystem.rebuildParticles();
                }
                if(type == 'Analytic')
                {
                    particleSystem.update = particleSystem.updateAnalytic;
                    particleSystem.material = particleSystem.shaderMaterial_default;
                    particleSystem.rebuildParticles();
                }
                if(type == 'AnalyticShader')
                {
                    particleSystem.update = particleSystem.updateAnalyticShader ;       
                    particleSystem.material = particleSystem.shaderMaterial_analytic;
                    particleSystem.rebuildParticles();
                }
                
            }
            
			//If you move a system, all the particles need to be recomputed to look like they stick in world space
			//not that we pointedly dont do this for the AnalyticShader. We could, but that solver is ment to  be very high performance, do we dont
            particleSystem.updateTransform = function(newtransform)
            {
				
				//Get he current transform, and invert new one
				var inv = new THREE.Matrix4();
				var newt = new THREE.Matrix4();
				inv.elements = matCpy(newtransform);
				newt = newt.copy(this.matrix);
				inv = inv.getInverse(inv);
				
				
				//don't adjust for the high performance shader
				if(particleSystem.solver == 'AnalyticShader')
				{
					return;
				}
				
				//Move all particles out of old space to world, then back into new space.
				//this will make it seem like they stay at the correct position in the world, though
				//acutally they change position
				//note that it would actually be more efficient to leave the matrix as identity, and change the position of the 
				//emitters for this...... Could probably handle it in the model setter actually... would be much more efficient, but linking 
				//a system to a moving object would break.
				for(var i =0; i < this.geometry.vertices.length; i++)
				{
						this.geometry.vertices[i].applyMatrix4(inv);
						this.shaderMaterial_interpolate.attributes.previousPosition.value[i].applyMatrix4(inv);
						this.geometry.vertices[i].applyMatrix4(newt);
						this.shaderMaterial_interpolate.attributes.previousPosition.value[i].applyMatrix4(newt);
				}
				this.geometry.verticesNeedUpdate  = true;	
				this.shaderMaterial_interpolate.attributes.previousPosition.needsUpdate = true;
						
            }
			//Change the system count. Note that this must be set before the first frame renders, cant be changed at runtime.
            particleSystem.setParticleCount = function(newcount)
            {
                var inv = this.matrix.clone();
                inv = inv.getInverse(inv);
                
                var particles = this.geometry;
                while(this.geometry.vertices.length > newcount) 
                {
                    this.geometry.vertices.pop();
                }
                while(this.geometry.vertices.length < newcount) 
                {
                    var particle = particleSystem.createParticle(this.geometry.vertices.length);
                    particleSystem.setupParticle(particle,particleSystem.matrix,inv);
                    particle.age = Infinity;
                    this.regenParticles.push(particle);
                    particle.waitForRegen = true;
                }
                this.geometry.verticesNeedUpdate  = true;
                this.geometry.colorsNeedUpdate  = true;
                this.shaderMaterial_default.attributes.vertexColor.needsUpdate = true;
                this.particleCount = newcount;
            }
            
            //Setup some defaults
            particleSystem.setParticleCount(1000);
            particleSystem.setSolverType('AnalyticShader');
            particleSystem.update(1);

           
            child.threeObject = particleSystem;
            
        
            child.threeObject.name = childName;
            child.name = childName;
            addThreeChild.call( this, nodeID, childID );
        } 
    
    }	
	function copyArray(arrNew, arrOld)
    {
        if(!arrNew)
            arrNew = [];
        arrNew.length = 0;
        for(var i =0; i< arrOld.length; i++)
            arrNew.push(arrOld[i].clone());
        return arrNew;
    }
	function restoreObject(node)
	{
		if(!node)
			return;
			
        if(node.originalPositions)
             copyArray(node.vertices,node.originalPositions);
        if(node.originalNormals)    
             copyArray(node.normals,node.originalNormals);
        if(node.originalFaces)
             copyArray(node.faces,node.originalFaces);
        if(node.originalMaterial)
			node.material = node.originalMaterial;
		if(node.backupMatrix)
             node.matrix.elements = node.backupMatrix;
			 
        geometry.verticesNeedUpdate = true;
        geometry.normalsNeedUpdate = true;
        geometry.facesNeedUpdate = true;
    
		
		delete node.initializedFromAsset;
		delete node.vwfID;
		delete node.originalPositions;
		delete node.originalNormals;
		delete node.originalFaces;
		delete node.originalUV1;
		delete node.originalUV2;
		delete node.originalMaterial;
		delete node.backupMatrix;
		
		if(node.geometry)
			restoreObject(geometry);
		if(node.children)
		{
			for(var i=0; i < node.children.length; i++)
				restoreObject(node.children[i]);
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
    //necessary when settign the amibent color to match MATH behavior
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
                if(!start.material.ambient) 
                    start.material.ambient = new THREE.Color('#FFFFFF');
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

   // -- getBoundingBox ------------------------------------------------------------------------------

    function getBoundingBox( object3, local ) {

        //var objWorldTrans = getTransform.call( this, object3, false );
        var bBox = { 
            min: { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: Number.MAX_VALUE },
            max: { x: -Number.MAX_VALUE, y: -Number.MAX_VALUE, z: -Number.MAX_VALUE }
        };
        var bObjBox;

        var objectList = [], obj, wldTrans, bx, foundBBox = 0 ;
        if ( object3.getDescendants ) {
            objectList = object3.getDescendants();
        }
        objectList.push( object3 );

        for ( var j = 0; j < objectList.length; j++ ) {

            bObjBox = { 
                        min: { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: Number.MAX_VALUE },
                        max: { x: -Number.MAX_VALUE, y: -Number.MAX_VALUE, z: -Number.MAX_VALUE }
                    };

            obj = objectList[ j ];
            if ( obj ) {

                //wldTrans = getTransform.call( this, obj, false );

                if ( obj.geometry ) {
                    
                    if ( obj.geometry.computeBoundingBox ) {
                        
                        obj.geometry.computeBoundingBox();
                        bx = obj.geometry.boundingBox;
                        foundBBox++;

                        if ( foundBBox > 1 ) {
                            // TODO
                            // in this case we need to deal with the offsets of the origins
                            // each object is in it's on local space which may not have the same origin
                        } else {
                            bBox = { 
                                min: { x: bx.min.x, y: bx.min.y, z: bx.min.z },
                                max: { x: bx.max.x, y: bx.max.y, z: bx.max.z }
                            };
                        }

                    }

                } 
            }
        }

        return bBox; 
           
    }

    function getCenterOffset( object3 ) {
        var offset = [ 0, 0, 0 ];
        if ( object3 ) {
            var bBox = getBoundingBox.call( this, object3, true );
            offset[0] = ( bBox.max.x + bBox.min.x ) * 0.50;
            offset[1] = ( bBox.max.y + bBox.min.y ) * 0.50;
            offset[2] = ( bBox.max.z + bBox.min.z ) * 0.50;
        }
        return offset;
    }

   

	function SubDriverFactory()
	{
		this.factories = {};
		this.loadSubDriver = function(source)
		{
			
			var script = $.ajax({url:source,async:false}).responseText;
			if(!script) return null;
			var factory = eval(script);
			if(!factory) return null;
			if(factory.constructor != Function) return null;
			return factory;
		
		}
		this.createNode = function(childID, childSource, childName, sourceType, assetSource, asyncCallback)
		{			
			
			var APINames = ['callingMethod','settingProperty','gettingProperty','initializingNode','addingChild','deletingNode','ticking'];
			var node = null;
			if(this.factories[childSource])
				node = this.factories[childSource](childID, childSource, childName,sourceType,assetSource,asyncCallback);
			else
			{
				this.factories[childSource] = this.loadSubDriver(childSource);
				node = this.factories[childSource](childID, childSource, childName,sourceType,assetSource,asyncCallback);
			}
			
			if(node.inherits)
			if(node.inherits.constructor == Array)
			{
				for(var i =0; i < node.inherits.length; i++)
				{	
					var proto = this.createNode('',node.inherits[i],'');
					
					for(var j = 0; j < APINames.length; j++)
					{	
						var api = APINames[j];
						if(!node[api+'Internal'])
						{
						
							var capi = api+"";
							node[capi+'Internal'] = [];
							if(node[capi])
								node[capi+'Internal'].push(node[capi]);
							node[capi] = eval("var f = function(arg0,arg1,arg2,arg3,arg4,arg5)\n"+
								"{\n"+
									"var ret = undefined;\n"+
									"for(var i =0; i < this['"+capi+'Internal'+"'].length; i++)\n"+
									"	ret = ret !== undefined ? ret : (this['"+capi+'Internal'+"'][i] && this['"+capi+'Internal'+"'][i].call(this,arg0,arg1,arg2,arg3,arg4,arg5));\n"+
									"return ret;\n"+
								"}; f;"
								);	
							if(!proto[api+'Internal'])
							{
								if(proto[capi])
									node[capi+'Internal'].push(proto[capi]);
							}
							else
							{
								for(var n = 0; n < proto[api+'Internal'].length; n++)
								{
									node[api+'Internal'].push(proto[api+'Internal'][n]);
								}
							}
						}else
						{
							node[api+'Internal'].push(proto[api]);
							//node[capi] = node[capi].bind(node);
						}
						
					}
					var keys = Object.keys(proto);
					for(var k = 0; k < keys.length; k++ )
					{
						var key = keys[k];
						if(APINames.indexOf(key) == -1)
							if(!node.hasOwnProperty(key))
							{
								if(proto[key].constructor == Function)
									node[key] = proto[key].bind(node);
								else
									node[key] = proto[key];
							}
					}		
				}
			}
			return node;
			
		}
		//preload common drivers
		
		this.factories['vwf/model/threejs/cylinder.js'] = this.loadSubDriver('vwf/model/threejs/cylinder.js');
		this.factories['vwf/model/threejs/box.js'] = this.loadSubDriver('vwf/model/threejs/box.js');
		this.factories['vwf/model/threejs/sphere.js'] = this.loadSubDriver('vwf/model/threejs/sphere.js');
		this.factories['vwf/model/threejs/cone.js'] = this.loadSubDriver('vwf/model/threejs/cone.js');
		this.factories['vwf/model/threejs/plane.js'] = this.loadSubDriver('vwf/model/threejs/plane.js');
		
		this.factories['vwf/model/threejs/prim.js'] = this.loadSubDriver('vwf/model/threejs/prim.js');
		this.factories['vwf/model/threejs/modifier.js'] = this.loadSubDriver('vwf/model/threejs/modifier.js');
		this.factories['vwf/model/threejs/materialDef.js'] = this.loadSubDriver('vwf/model/threejs/materialDef.js');
	}
});
