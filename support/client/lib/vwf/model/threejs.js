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

    function rebuildAllMaterials( obj )
    {
        
        if( obj === undefined )
        {
            for(var i in this.state.scenes)
            {
                rebuildAllMaterials.call( this, this.state.scenes[i].threeScene );
            }
        } else {
            if(obj && obj.material)
            {
                obj.material.needsUpdate = true;
            }
            if(obj && obj.children)
            {
               for(var i in obj.children)
                rebuildAllMaterials.call( this, obj.children[i] );
            }
        }
    }

    function matCpy(mat)
    {
        var ret = [];
        for(var i =0; i < 16; i++)
            ret.push(mat[i]);
        return ret.slice(0);    
    }
    
    
define( [ "module", "vwf/model", "vwf/utility", "vwf/utility/color" ], function( module, model, utility, Color ) {


    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            
            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.prototypes = {}; 
            this.state.kernel = this.kernel.kernel.kernel;
            this.state.sceneRootID = this.kernel.find("", "/")[0];;


            // shouldn't this just be vwf time? 			
			//Setup the timer
			window.performance = window.performance || {};
			performance.now = (function() {
			  return performance.now       ||
					 performance.mozNow    ||
					 performance.msNow     ||
					 performance.oNow      ||
					 performance.webkitNow ||
					function() { return new Date().getTime(); };
			})();
            
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childURI, childName, callback ) {

            var prototypeID = isPrototype.call( this, nodeID, childID );
            if ( prototypeID !== undefined ) {
                this.state.prototypes[ prototypeID ] = {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsID: childImplementsIDs,
                    source: childSource, 
                    type: childType,
                    uri: childURI,
                    name: childName
                };
                return;                
            }
            
            //console.log(["creatingNode:",nodeID,childID,childName,childExtendsID,childType]);
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
                        threeChild = FindChildByName.call(this,threeParent,childName,childExtendsID,false);
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
                
                createAmbientLight.call( this, sceneNode.threeScene, [ 0.5, 0.5, 0.5 ] );

                sceneNode.threeScene.add(cam);
                
                sceneNode.axes = createAxis.call( this, sceneNode.threeScene );
                
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
            
            }else if ( protos && isMaterialDefinition.call( this, protos ) ) {
            
                
                node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: parentNode.threeObject,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                node.threeMaterial = GetMaterial(node.threeObject);
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
            else if ( protos && isNodeDefinition.call( this, protos ) && childName !== undefined ) {
                
                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                if ( childType == "model/vnd.collada+xml" || childType == "model/vnd.osgjs+json+compressed") {
                    
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
                        loadingCallback: callback,
                        sceneID: this.state.sceneRootID
                    };
                    loadAsset.call( this, parentNode, node, childType );     
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
                    node.threeObject.name = childName; 
                    if ( threeParent !== undefined ) {
                        threeParent.add( node.threeObject ); 
                    } 
                } else {     
                        
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
                        if( !node.threeObject )
                            node.threeObject = findThreeObjectInParent.call(this,childName,nodeID);
                        //The parent three object did not have any childrent with the name matching the nodeID, so make a new group
                        if( !node.threeObject ) {
                            // doesn't this object need to be added to the parent node
                            node.threeObject = new THREE.Object3D(); 
                            node.threeObject.name = childName;
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
            
            }
            
        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

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
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var value = undefined;
            //console.log(["initializingProperty: ",nodeID,propertyName,propertyValue]);

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( !node ) node = this.state.scenes[ nodeID ];
                if ( node ) {
                    switch ( propertyName ) {
                        case "meshDefinition":
                            createMesh.call( this, node, propertyValue );
                            break;
                        case "texture":
                            // delay the setting of the texture until the actual
                            // settingProperty call
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
            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            if(!node) node = this.state.scenes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if(!node) return;

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
          

            if ( propertyValue !== undefined ) 
            {
                if(threeObject instanceof THREE.Object3D)
                {
                    if(propertyName == 'transform' || propertyName == 'localMatrix')
                    {
                        //console.info( "setting transform of: " + nodeID + " to " + Array.prototype.slice.call( propertyValue ) );
                        var transform = goog.vec.Mat4.createFromArray( propertyValue || [] );

                        // Rotate 90 degress around X to convert from VWF Z-up to GLGE Y-up.
                        if ( threeObject instanceof THREE.Camera ) {
                            
							var columny = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( transform, 1, columny );
                            var columnz = goog.vec.Vec4.create();
                            goog.vec.Mat4.getColumn( transform, 2, columnz );
                            goog.vec.Mat4.setColumn( transform, 1, columnz );
                            goog.vec.Mat4.setColumn( transform, 2, goog.vec.Vec4.negate( columny, columny ) );
                        }
						
						if(threeObject instanceof THREE.ParticleSystem)
						{	
							threeObject.updateTransform(transform);
						}
						
                        threeObject.matrixAutoUpdate = false;
                        threeObject.matrix.elements = matCpy(transform);
                        threeObject.updateMatrixWorld(true);
                        value = propertyValue;  

						//because threejs does not do auto tracking of lookat, we must do it manually.
						//after updating the matrix for an ojbect, if it's looking at something, update to lookat from
						//the new position
						if(threeObject.lookatval)
						{
							this.settingProperty(nodeID,'lookAt',threeObject.lookatval);
						}
                    }
                    if(propertyName == 'lookAt')
                    {     
					    
						threeObject.lookatval = propertyValue;
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
                                
                                var flipmat = new THREE.Matrix4(-1, 0,0,0,
                                                            0, 1,0,0,
                                                            0,0,1,0,
                                                            0, 0,0,1);
                               
                                var up = new THREE.Vector3();
                                up.set(0,0,1);
                                lookatPosition.copy(lookatObject.matrix.getPosition());
                                thisPosition.copy(thisMatrix.getPosition());
                                
                                if(thisPosition.distanceTo(lookatPosition) > 0)
								{
									threeObject.matrix.lookAt(thisPosition,lookatPosition,up);
									threeObject.updateMatrixWorld(true); 
								}
                                value = propertyValue;                             
                            }
                        
                        } else if (propertyValue instanceof Array)  {
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
                            value = propertyValue;   
                        } else
						{
							if(!propertyValue)
							{
								delete threeObject.lookatval;
                                value = "";
							}
						
						}
                    
                    }
                    if(propertyName == 'visible')
                    {
                        //need to walk the tree and hide all sub nodes as well
                        value = Boolean( propertyValue );
                        SetVisible( threeObject, value );
                    }
                    if(propertyName == 'castShadows')
                    {
                        //debugger;
                        value = Boolean( propertyValue );
                        threeObject.castShadow = value;
                    }
                    if(propertyName == 'receiveShadows')
                    {
                        value = Boolean( propertyValue );
                        threeObject.receiveShadow = value;
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

                        value = propertyValue;
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
                        propertyName == 'emitterType'
                    )
                    {
                        if(ps.material == ps.shaderMaterial_analytic)
                        {
                            ps.rebuildParticles();
                        }
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    
                    if(propertyName == 'size')
                    {
                        //ps.material.size = propertyValue;
                        
                        for(var i = 0; i < ps.material.attributes.size.value.length; i++)
                        {
                            ps.material.attributes.size.value[i] = propertyValue;
                        }
                        ps.material.attributes.size.needsUpdate = true;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'particleCount')
                    {
                        ps.setParticleCount(propertyValue);
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'startSize')
                    {
                        ps.shaderMaterial_analytic.uniforms.startSize.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'endSize')
                    {
                        ps.shaderMaterial_analytic.uniforms.endSize.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
					if(propertyName == 'sizeRange')
                    {
                        ps.shaderMaterial_analytic.uniforms.sizeRange.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'maxSpin')
                    {
                        ps.shaderMaterial_analytic.uniforms.maxSpin.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
					if(propertyName == 'textureTiles')
                    {
                        ps.shaderMaterial_analytic.uniforms.textureTiles.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'minSpin')
                    {
                        ps.shaderMaterial_analytic.uniforms.minSpin.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
					if(propertyName == 'maxOrientation')
                    {
                        ps.shaderMaterial_analytic.uniforms.maxOrientation.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'minOrientation')
                    {
                        ps.shaderMaterial_analytic.uniforms.minOrientation.value = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
					if(propertyName == 'colorRange')
                    {
                        ps.shaderMaterial_analytic.uniforms.colorRange.value.x = propertyValue[0];
                        ps.shaderMaterial_analytic.uniforms.colorRange.value.y = propertyValue[1];
                        ps.shaderMaterial_analytic.uniforms.colorRange.value.z = propertyValue[2];
                        ps.shaderMaterial_analytic.uniforms.colorRange.value.w = propertyValue[3];
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
					
					
                    if(propertyName == 'startColor')
                    {
                        ps.shaderMaterial_analytic.uniforms.startColor.value.x = propertyValue[0];
                        ps.shaderMaterial_analytic.uniforms.startColor.value.y = propertyValue[1];
                        ps.shaderMaterial_analytic.uniforms.startColor.value.z = propertyValue[2];
                        ps.shaderMaterial_analytic.uniforms.startColor.value.w = propertyValue[3];
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'endColor')
                    {
                        ps.shaderMaterial_analytic.uniforms.endColor.value.x = propertyValue[0];
                        ps.shaderMaterial_analytic.uniforms.endColor.value.y = propertyValue[1];
                        ps.shaderMaterial_analytic.uniforms.endColor.value.z = propertyValue[2];
                        ps.shaderMaterial_analytic.uniforms.endColor.value.w = propertyValue[3];
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    
            
                    if(propertyName == 'solver')
                    {
                        ps.setSolverType(propertyValue);
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == 'image')
                    {
                        ps.shaderMaterial_default.uniforms.texture.value = THREE.ImageUtils.loadTexture(propertyValue);
                        ps.shaderMaterial_default.uniforms.useTexture.value = 1.0;
                        ps.shaderMaterial_analytic.uniforms.texture.value = THREE.ImageUtils.loadTexture(propertyValue);
                        ps.shaderMaterial_analytic.uniforms.useTexture.value = 1.0;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
					
                    }
                    if(propertyName == 'additive')
                    {
                        //value = Boolean( propertyValue );
                        //if( value )
                        if ( Boolean( propertyValue ) )
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
                            ps.shaderMaterial_default.transparent = false;
                            ps.shaderMaterial_analytic.blending = THREE.NormalBlending; 
                            ps.shaderMaterial_analytic.transparent = false;
						    ps.shaderMaterial_interpolate.blending = THREE.NormalBlending; 
                            ps.shaderMaterial_interpolate.transparent = false;
                        }

                        ps.shaderMaterial_default.needsUpdate = true;   
                        ps.shaderMaterial_analytic.needsUpdate = true;   
						ps.shaderMaterial_interpolate.needsUpdate = true;  						
                    }
                    if(propertyName == 'depthTest')
                    {
                        ps.shaderMaterial_default.depthTest = propertyValue;    
                        ps.shaderMaterial_default.depthWrite = propertyValue;
                        ps.shaderMaterial_analytic.depthTest = propertyValue;   
                        ps.shaderMaterial_analytic.depthWrite = propertyValue;
						ps.shaderMaterial_interpolate.depthTest = propertyValue;   
                        ps.shaderMaterial_interpolate.depthWrite = propertyValue;
                        //value = propertyValue;  // no gettingProperty support so let the object model record
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
                        //value = propertyValue;  // no gettingProperty support so let the object model record
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
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                    if(propertyName == "minLifeTime" || propertyName == "maxLifeTime")
                    {
                        if(ps.minLifeTime === undefined) ps.minLifeTime = 0;
                        if(ps.maxLifeTime === undefined) ps.maxLifeTime = 1;
                        
                        for(var i = 0; i < particles.vertices.length; i++)
                        {   
                            particles.vertices[i].lifespan = ps.minLifeTime + (ps.maxLifeTime - ps.minLifeTime) * Math.random();
                        }
                        //value = propertyValue;  // no gettingProperty support so let the object model record
                    }
                }
                if(threeObject instanceof THREE.Camera)
                {
                    if(propertyName == "fovy")
                    {
                        if(propertyValue)
                        {
                            value = parseFloat(propertyValue);
                            threeObject.fov = value;
                            threeObject.updateProjectionMatrix();
                        }
                    }
                    if(propertyName == "near")
                    {
                        if(propertyValue)
                        {
                            value = parseFloat(propertyValue);
                            threeObject.near = value;
                            threeObject.updateProjectionMatrix();
                        }
                    }
                    if(propertyName == "aspect")
                    {
                        if(propertyValue)
                        {
                            value = parseFloat(propertyValue);
                            threeObject.aspect = value; 
                            threeObject.updateProjectionMatrix();                           
                        }
                    }
                    if(propertyName == "far")
                    {
                        if(propertyValue)
                        {
                            value = parseFloat(propertyValue);
                            threeObject.far = value;                    
                            threeObject.updateProjectionMatrix();
                        }
                    }
                    if(propertyName == "cameraType")
                    {   
                        if(propertyValue == 'perspective')
                        {
                            value = propertyValue;
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
                                cam.matrix.elements = matCpy(threeObject.matrix.elements);
                                cam.matrixAutoUpdate = false;
                                if(threeObject.fov)
                                    cam.fov = threeObject.fov;
                                if(threeObject.aspect)
                                    cam.aspect = threeObject.aspect;    
                                if(this.state.cameraInUse == threeObject)
                                    this.state.cameraInUse = cam;
                                threeObject.updateProjectionMatrix();   
                                node.threeObject = cam;
                                sceneNode.camera.threeJScameras[ nodeID ] = cam;
                                parent.add(node.threeObject);
                            }
                        }
                        if(propertyValue == 'orthographic')
                        {
                            value = propertyValue;
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
                    //console.log(["setting material property: ",nodeID,propertyName,propertyValue]);
                    if(propertyName == "texture")
                    {
                        if(propertyValue !== "")
                        {
                            THREE.ImageUtils.loadTexture( propertyValue, undefined, function( texture ) { 
                                threeObject.map = texture;
                                threeObject.needsUpdate = true;                                 
                            }, function( event ) { 
                                this.logger.warnx( "settingProperty", nodeID, propertyName, propertyValue );
                            } );
                        } else {
                            threeObject.map = null;
                            threeObject.needsUpdate = true;
                        }
                        value = propertyValue;
                        
                    }
                    if(propertyName == "color" || propertyName == "diffuse")
                    {
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                            threeObject.color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                        }
                        threeObject.needsUpdate = true;
                        if ( threeObject.ambient !== undefined ) {
                            threeObject.ambient.setRGB( threeObject.color.r, threeObject.color.g, threeObject.color.b ); 
                        }
                        value = colorToString.call( this, vwfColor );
                    }
                }
                if( threeObject instanceof THREE.Scene )
                {
                    if(propertyName == 'activeCamera')
                    {
                        if( this.state.scenes[this.state.sceneRootID].camera.threeJScameras[propertyValue] )
                        {
                            this.state.cameraInUse = this.state.scenes[this.state.sceneRootID].camera.threeJScameras[propertyValue];
                            this.state.scenes[this.state.sceneRootID].camera.ID = propertyValue;
                            value = propertyValue;
                        }
                    }
                    if(propertyName == 'ambientColor')
                    {
                        var lightsFound = 0;
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                            for( var i = 0; i < threeObject.__lights.length; i++ )
                            {
                                if(threeObject.__lights[i] instanceof THREE.AmbientLight)
                                {
                                    threeObject.__lights[i].color.setRGB(vwfColor.red()/255,vwfColor.green()/255,vwfColor.blue()/255);
                                    SetMaterialAmbients.call(this);
                                    lightsFound++;
                                }
                            
                            }
                            if ( lightsFound == 0 ) {
                                var ambientlight = new THREE.AmbientLight( '#000000' );
                                ambientlight.color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                                node.threeScene.add( ambientlight );
                                SetMaterialAmbients.call(this);                            
                            }
                            value = colorToString.call( this, vwfColor );
                        }
                    }
                    if ( propertyName == 'backgroundColor' )
                    {
                        if ( node && node.renderer ) {
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {
                                node.renderer.setClearColor( { r:vwfColor.red()/255, g:vwfColor.green()/255, b:vwfColor.blue()/255 }, vwfColor.alpha() );
                                value = colorToString.call( this, vwfColor );
                            }
                        }
                    }
                    if(propertyName == 'enableShadows')
                    {
                        if ( node && node.renderer ) {
                            value = Boolean( propertyValue );
                            node.renderer.shadowMapEnabled = value;
                        }
                    }
                }   
                if(threeObject instanceof THREE.PointLight || threeObject instanceof THREE.DirectionalLight || threeObject instanceof THREE.SpotLight )
                {
                    if(propertyName == 'lightType')
                    {
                        var newlight;
                        var parent = threeObject.parent;
                        var currProps = {
                            "name": threeObject.name,
                            "distance": threeObject.distance,
                            "color":  threeObject.color,
                            "intensity": threeObject.intensity,
                            "castShadows": threeObject.castShadow,
                            "clone": function( newObj ) {
                                newObj.name = this.name;
                                newObj.distance = this.distance;
                                //console.info( "light.clone.color = " + JSON.stringify( this.color ) )
                                newObj.color.setRGB( this.color.r, this.color.g, this.color.b );
                                newObj.intensity = this.intensity;
                                newObj.castShadows = this.castShadows;
                            }
                        };

                        if(propertyValue == 'point' && !(threeObject instanceof THREE.PointLight))
                        {
                            newlight = new THREE.PointLight('FFFFFF',1,0);
                            currProps.clone( newlight );                            
                            newlight.matrixAutoUpdate = false;
                            parent.remove( node.threeObject );
                            parent.add( newlight );
                            node.threeObject = newlight;
                            rebuildAllMaterials.call(this);
                        }
                        if(propertyValue == 'directional' && !(threeObject instanceof THREE.DirectionalLight))
                        {
                            newlight = new THREE.DirectionalLight('FFFFFF',1,0);
                            currProps.clone( newlight );                            
                            newlight.matrixAutoUpdate = false;
                            parent.remove( node.threeObject );
                            parent.add( newlight );
                            node.threeObject = newlight;
                            rebuildAllMaterials.call(this);
                        }
                        if(propertyValue == 'spot' && !(threeObject instanceof THREE.SpotLight))
                        {
                            newlight = new THREE.SpotLight('FFFFFF',1,0);
                            currProps.clone( newlight );
                            newlight.matrixAutoUpdate = false;
                            parent.remove( node.threeObject );
                            parent.add( newlight );
                            node.threeObject = newlight;
                            rebuildAllMaterials.call(this);
                        }

                        if ( propertyValue == 'point' || propertyValue == 'directional' || propertyValue == 'spot' ) {
                            value = propertyValue;                        
                        }
                    }
                    //if(propertyName == 'diffuse')
                    //{
                    //    threeObject.color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
                    //}
                    if ( propertyName == 'distance' ) {
                        value = Number( propertyValue );
                        threeObject.distance = value;
                    }
                    if ( propertyName == 'color' ) {
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                            threeObject.color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                        }
                        value = colorToString.call( this, vwfColor );
                    }
                    if ( propertyName == 'intensity' ) {
                        value = parseFloat( propertyValue );
                        threeObject.intensity = value;
                        threeObject.updateMatrix();
                    }                    
                    if ( propertyName == 'castShadows' ) {
                        value = Boolean( propertyValue );
                        threeObject.castShadow = value;
                    }

                }
            }
            //console.log(["                settingProperty: returns ",propertyName,value]);
            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName ) {

            //console.log([nodeID,propertyName,propertyValue]);
            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            if(!node) node = this.state.scenes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if(!node) return;

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
          
            if(threeObject instanceof THREE.Object3D)
            {
                if(propertyName == 'transform')
                {
                    value = matCpy(threeObject.matrix.elements); 
                    
                    if ( threeObject instanceof THREE.Camera ) {
                        var columny = goog.vec.Vec4.create();
                        goog.vec.Mat4.getColumn( value, 1, columny );
                        var columnz = goog.vec.Vec4.create();
                        goog.vec.Mat4.getColumn( value, 2, columnz );
                        goog.vec.Mat4.setColumn( value, 2, columny );
                        goog.vec.Mat4.setColumn( value, 1, goog.vec.Vec4.negate( columnz, columnz ) );
						
                    }
                    return value;
                }
                if(propertyName =='localMatrix')
                {
                    value = matCpy(threeObject.matrix.elements); 
                    return value;
                }
                if(propertyName == 'worldMatrix')
                {
                    threeObject.updateMatrixWorld(true);
                    value = matCpy(threeObject.matrixWorld.elements); 
                    return value;
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
            if(threeObject instanceof THREE.Material)
            {
                if(propertyName == "texture")
                {
                    if( threeObject.map && threeObject.map.image )
                        return threeObject.map.image.src;
                        
                }
                if(propertyName == "color") {
                    
                        
                }
                if(propertyName == "diffuse") {
                    
                        
                }
            }
            if( threeObject instanceof THREE.Camera ) {
                switch ( propertyName ) {
                    case "fovy":
                        value = threeObject.fovy; 
                        break;
                    case "near":
                        value = threeObject.near;
                        break; 
                    case "aspect":
                        value = threeObject.aspect;
                        break; 
                    case "far":
                        value = threeObject.far;
                        break;                    
                    case "cameraType":
                        if ( threeObject instanceof THREE.OrthographicCamera ) {
                            value = 'orthographic';
                        } else {
                            value = 'perspective';
                        }
                        break;
                }
            }
            if( threeObject instanceof THREE.Scene ) {
                var found = false;
                var vwfColor, color;
                switch ( propertyName ) {
                    case "ambientColor":
                        for( var i = 0; i < threeObject.__lights.length && !found; i++ ) {
                            if( threeObject.__lights[i] instanceof THREE.AmbientLight ) {
                                color = threeObject.__lights[i].color;
                                vwfColor = new utility.color( [ color.r*255, color.g*255, color.b*255 ] );
                                value = colorToString.call( this, vwfColor );
                                found = true;
                            }
                        }
                        break;
                    case "backgroundColor":
                        if ( node.renderer ) {
                            var color = node.renderer.getClearColor();
                            var alpha = node.renderer.getClearAlpha();
                            if ( alpha != 1 ){
                                vwfColor = new utility.color( [ color.r*255, color.g*255, color.b*255, alpha ] );
                            } else {
                                vwfColor = new utility.color( [ color.r*255, color.g*255, color.b*255 ] );
                            }
                            value = colorToString.call( this, vwfColor );
                        }
                        break;
                    case 'enableShadows':
                        {
                            if ( node.renderer ) {
                                value = node.renderer.shadowMapEnabled = value;
                            }
                        }
                        break;
                    case "activeCamera":
                        value = node.camera.ID;
                        break;
                }
            }
            if( threeObject instanceof THREE.Light ) {
                switch ( propertyName ) {
                    case "lightType":
                        if ( threeObject instanceof THREE.DirectionalLight ){
                            value = 'directional';
                        } else if ( threeObject instanceof THREE.SpotLight ) {
                            value = 'spot'; 
                        } else {
                            value = 'point';                            
                        }
                        break;
                    case "distance":
                        value = threeObject.distance;
                        break;
                    case "color":
                        value = colorToString.call( this, new utility.color( [ threeObject.color.r, threeObject.color.g, threeObject.color.b ] ) );
                        break;
                    case "intensity":
                        value = threeObject.intensity;
                        break;
                    case "castShadows":
                        value = threeObject.castShadows;
                        break;
                }
            }
            return value;
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

    function isPrototype( nodeID, childID ) {
        var ptID;
        if ( ( nodeID == 0 && childID != this.state.sceneRootID ) || this.state.prototypes[ nodeID ] !== undefined ) {
            if ( nodeID != 0 || childID != this.state.sceneRootID ) {
                ptID = nodeID ? nodeID : childID;
                if ( this.state.prototypes[ ptID ] !== undefined ) {
                    ptID = childID;
                }
                return ptID;
            } 
        }
        return undefined;
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
        node.name = "scene";
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
        node.threeScene.name = "scene";
        node.pendingLoads = 0;
        node.srcAssetObjects = [];
        
        return node;
    }
    
    function nameTest( obj, name ) {
        if ( obj.name == "" ) {
            return ( obj.parent.name+"Child" == name );
        } else {
            return ( obj.name == name || obj.id == name || obj.vwfID == name );
        }
    }

    //changing this function significantly from the GLGE code. Will search heirarchy down until encountering a matching chile
    //will look into nodes that don't match.... this might not be desirable
     function FindChildByName( obj, childName, childType, recursive ) {
        
        var child = undefined;
        if ( recursive ) {
            if( nameTest.call( this, obj, childName ) ) {
                child = obj;
            } else if ( obj.children && obj.children.length > 0) {
                for( var i = 0; i < obj.children.length && child === undefined; i++ ) {
                    child = FindChildByName( obj.children[i], childName, childType );
                }
            }
        } else {
            for( var i = 0; i < obj.children.length && child === undefined; i++ ) {
                if ( nameTest.call( this, obj.children[i], childName ) ) {
                    child = obj.children[i];
                }
            }
        }
        return child;

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
        cam.matrix.elements = [1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1];
        cam.updateMatrixWorld(true);    
        return cam;
    }
    function createAmbientLight( threeScene, clr ){
        var ambient = new THREE.AmbientLight();
        if ( clr !== undefined && clr instanceof Array ) {
            ambient.color.r = clr[0];
            ambient.color.g = clr[1];
            ambient.color.b = clr[2];
        } else {
            ambient.color.r = 0.5;
            ambient.color.g = 0.5;
            ambient.color.b = 0.5;
        }
        threeScene.add( ambient );
    }
    function createAxis( threeScene ){
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
        group.name = "axis";
        cubeX.name = "x";
        cubeY.name = "y";
        cubeZ.name = "z";

        group.add(cubeX);
        group.add(cubeY);
        group.add(cubeZ);
        group.vwfID = "TEST DUMMY AXIS GIZMO";
        
        threeScene.add(group);
        return group;
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
            vert = matrix.multiplyVector3(vert);
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
                    mesh.geometry.faceVertexUvs[0].push([new THREE.UV(0,1),new THREE.UV(0,1),new THREE.UV(0,1),new THREE.UV(0,1)]);
                if(face instanceof THREE.Face3)
                    mesh.geometry.faceVertexUvs[0].push([new THREE.UV(0,1),new THREE.UV(0,1),new THREE.UV(0,1)]);
            }
        }
         
        mesh.geometry.computeCentroids();
        mesh.geometry.computeFaceNormals();
        mesh.geometry.computeVertexNormals();
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
            var mat = new THREE.MeshBasicMaterial( { color: meshDef.color ? meshDef.color : 0xffffff } )

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
                geo.faceVertexUvs.push( new THREE.UV( meshDef.uv1[i*2], meshDef.uv1[i*2+1] ) );   
            }             
            node.threeObject.add( new THREE.Mesh( geo, mat ) ); 
            
            geo.computeCentroids();
        }         
    }
    function loadAsset( parentNode, node, childType ) {

        var nodeCopy = node; 
        var nodeID = node.ID;
        var childName = node.name;
        var threeModel = this;
        var sceneNode = this.state.scenes[ this.state.sceneRootID ];
        var parentObject3 = parentNode.threeObject ? parentNode.threeObject : parentNode.threeScene;
        //console.info( "---- loadAsset( "+parentNode.name+", "+node.name+", "+childType+" )" );

        node.assetLoaded = function( asset ) { 
            //console.info( "++++ assetLoaded( "+parentNode.name+", "+node.name+", "+childType+" )" );
            sceneNode.pendingLoads--;
            var removed = false;
            
            //possibly deal with setting intial scale and rotation here, if threejs does something strange by default
            //collada.setRot( 0, 0, 0 ); // undo the default GLGE rotation applied in GLGE.Collada.initVisualScene that is adjusting for +Y up
            if(asset.scene)
                asset = asset.scene;

            nodeCopy.threeObject = asset;

            asset.name = childName;
            asset.vwfID = nodeID;
            asset.matrixAutoUpdate = false;
           
            SetMaterialAmbients.call(threeModel,asset);
            
            // remember that this was a loaded collada file
            asset.loadedColladaNode = true;
            
            var meshes =[];
            GetAllLeafMeshes(asset,meshes);
        
            for(var i =0; i < meshes.length; i++)
            {
                fixMissingUVs(meshes[i]);   
                meshes[i].geometry.uvsNeedUpdate = true;
            }
            
            parentObject3.add( asset );
            if ( asset.updateMatrixWorld ) asset.updateMatrixWorld(true);
            
            nodeCopy.threeObject.matrixAutoUpdate = false;

            for ( var j = 0; j < sceneNode.srcAssetObjects.length; j++ ) {
                if ( sceneNode.srcAssetObjects[j] == nodeCopy ){
                    sceneNode.srcAssetObjects.splice( j, 1 );
                    removed = true;
                }
            } 

            // let vwf know the asset is loaded 
            if ( nodeCopy.loadingCallback ) {
                //console.info( "========= LOADED ========== "+node.name+" ========= LOADED ==========" );
                nodeCopy.loadingCallback( true );                    
            }
        }
        node.name = childName;
        sceneNode.srcAssetObjects.push( node );
        sceneNode.pendingLoads++;
        
        if ( parentNode && parentNode.threeObject ) {
            parentNode.threeObject.add(node.threeObject);
         } else if ( sceneNode ) {
            if ( sceneNode.threeScene ) {
                sceneNode.threeScene.add( node.threeObject );
            }
             
        }
        ////////////////////////////////////
        //manually call callback, since there is no async load currently
        //assetLoaded(node.threeObject);
        if(childType == "model/vnd.collada+xml")
        {
            node.loader = new THREE.ColladaLoader();
            node.loader.options.convertUpAxis = true;
            node.loader.options.upAxis = "Z";
            node.loader.load(node.source, node.assetLoaded.bind( this ) );
        }
        if(childType == "model/vnd.osgjs+json+compressed")
        {
            node.loader = new UTF8JsonLoader(node, node.assetLoaded.bind( this ) );
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

        //debugger;
        var child = this.state.nodes[childID];
        if ( child ) {
            child.threeObject = new THREE.DirectionalLight('FFFFFF',1,0);
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
        } 
               
    }
    function vwfColor( color ) {
        var vwfColor = {};
        vwfColor['r'] = color['r']*255;
        vwfColor['g'] = color['g']*255;
        vwfColor['b'] = color['b']*255;                                
        if ( color['a'] !== undefined && color['a'] != 1 ) {
            vwfColor['a'] = color['a'];
            vwfColor = new utility.color( "rgba("+vwfColor['r']+","+vwfColor['g']+","+vwfColor['b']+","+vwfColor['a']+")" );
        } else {
            vwfColor = new utility.color( "rgb("+vwfColor['r']+","+vwfColor['g']+","+vwfColor['b']+")" );
        }
        return vwfColor;        
    }

    function colorToString( color ) {
        var retColor = "";
        if ( color.alpha() != 1 ) {
            retColor = "rgba("+color.red()+","+color.green()+","+color.blue()+","+color.alpha()+")";
        } else {
            retColor = "rgb("+color.red()+","+color.green()+","+color.blue()+")";
        }
        //console.info( "retColor returns: " + retColor );
        return retColor;
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
				startColor:{type: "v4", value:new THREE.Vector4()},
                endColor:{type: "v4", value:new THREE.Vector4()},
                startSize:{type:"f", value:1},
                endSize:{type:"f", value:1},
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
				lifespan: { type: 'f', value: [] }
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
            
            "   gl_FragColor = outColor;\n"+
            "}\n";
            var attributes_analytic = {
                acceleration:   {   type: 'v3', value: [] },
                velocity:   {   type: 'v3', value: [] },
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
            
			//setup all the default values
            particleSystem.minVelocity = [0,0,0];
            particleSystem.maxVelocity = [0,0,0];
            particleSystem.maxAcceleration = [0,0,0];
            particleSystem.minAcceleration = [0,0,0];
            particleSystem.minLifeTime = 0;
            particleSystem.maxLifeTime = 1;
            particleSystem.emitterType = 'point';
            particleSystem.emitterSize = [0,0,0];
            particleSystem.startColor = [1,1,1,1];
            particleSystem.endColor = [0,0,0,0];
            particleSystem.regenParticles = [];
            particleSystem.maxRate = 1000;
            particleSystem.particleCount = 1000;
            particleSystem.damping = 0;
            particleSystem.startSize = 3;
            particleSystem.endSize = 3;
			particleSystem.gravity = 0;
			particleSystem.gravityCenter = [0,0,0];
            particleSystem.velocityMode = 'cartesian';
			particleSystem.temp = new THREE.Vector3();
           
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
                }
            }
			//set the particles initial values. Used when creating and resuing particles
            particleSystem.setupParticle = function(particle,mat,inv)
            {
                
                particle.x = 0;
                particle.y = 0;
                particle.z = 0;
                
				//generate a point in objects space, the move to world space
                particle.world = mat.multiplyVector3(this.generatePoint());
                
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
                particle.velocity = mat.multiplyVector3(particle.velocity.clone());
                
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
					inv.multiplyVector3(this.temp);
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
					inv.multiplyVector3(this.temp);
					particle.x = this.temp.x;
					particle.y = this.temp.y;
					particle.z = this.temp.z;
					//careful to have prev and current pos in same space!!!!
					inv.multiplyVector3(particle.prevworld);
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
						inv.multiplyVector3(this.geometry.vertices[i]);
						inv.multiplyVector3(this.shaderMaterial_interpolate.attributes.previousPosition.value[i]);
						newt.multiplyVector3(this.geometry.vertices[i]);
						newt.multiplyVector3(this.shaderMaterial_interpolate.attributes.previousPosition.value[i]);
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

   

    ////////////////////////////////////////////////////////////////////////////////////////////////////////
    //UTF8 loader
    

    function DecodeARRAY_BUFFER(str,range,inmin,stride,bits)
    {
     str = blobarray[str];
      var attribs_out = [];//new Float32Array(str.length);
      //min = min + 0.0;
      var prev = [0,0,0];
      var divisor = Math.pow(2,bits);
      for (var i = 5; i < str.length-5; i+=stride) {

          for(var j = 0; j< stride; j++)
            {     
                  var code = str.charCodeAt(i+j);
                  var dezigzag = (Number(code) >> 1) ^ (-(Number(code) & 1));
                  prev[j] += dezigzag;
                  var prev_attrib = ((prev[j]/divisor)*(range))  + Number(inmin) ;//(code >> 1) ^ (-(code & 1));
                  attribs_out.push(prev_attrib);
            }     
      }
     
      return attribs_out;
    }
    var debugarraytype = "";
    function DecodeELEMENT_ARRAY_BUFFER(str,range)
    {
     
      str = blobarray[str];
      var attribs_out = [];//new Uint16Array(str.length);
      var prev = 0;
      for (var i = 5; i < str.length-5; i++) {
     
          var code = str.charCodeAt(i);
          var dezigzag = (code >> 1) ^ (-(code & 1));;
          prev += dezigzag;
         // alert("char code " +code + " dezigzag " + dezigzag + " new value " + prev);
          attribs_out.push(prev);
          
      }
     
      return attribs_out;
    }

    function DecodeArray(array,key)
    {
        var type = array.type;
        var array2 =[];
        var itemsize = array.itemSize;
        
        if(type == "ELEMENT_ARRAY_BUFFER")
            array2 = DecodeELEMENT_ARRAY_BUFFER(array.elements.values,array.elements.range);
        if(type == "ARRAY_BUFFER")
            array2 = DecodeARRAY_BUFFER(array.elements.values,array.elements.range,array.elements.min,itemsize,array.elements.bits);    
        
        return array2;
    }

    function UTF8JsonLoader(node,callback)
    {
        
        var self = this;
        this.url = node.source;
        this.callback = callback;
        this.children=[];
        
        this.jsonLoaded = function(e)
        {
            var test = 1+1;
            var jsonData = JSON.parse(decompress(e));
            var texture_load_callback = function(texturename)
            {
                
                var src = "";
                if(this.url.toLowerCase().indexOf('3dr_federation') != -1)
                    src = this.url.substr(0,this.url.indexOf("Model/")) + "textures/NoRedirect/" + encodeURIComponent(texturename) +"?ID=00-00-00";
                else
                    src = this.url.substr(0,this.url.indexOf("Model/")) + "textures/" + encodeURIComponent(texturename) +"?ID=00-00-00";
                console.log(src);
                src = src.replace("AnonymousUser:@","");
                
                var tex = THREE.ImageUtils.loadTexture(src);
                
                return tex;
            }
            this.scene = ParseSceneGraph(jsonData,texture_load_callback.bind(this));
            if(this.callback)
                this.callback(this);
        }.bind(this);
        
        this.error = function(e)
        {
            alert(e.responseText);
        }.bind(this);
        
        $.ajax({
            url: this.url,
            data: {},
            success: this.jsonLoaded,
            error: this.error,
            dataType:'text'
        });
        ;
    }

    

    function BuildUTF8JsonNode(node,callback)
    {
        return new UTF8JsonLoader(node,callback);
    }
    function toColor(arr)
        {
            var color = new THREE.Color();
            color.setRGB(arr[0],arr[1],arr[2],arr[3]);
            return color;
        }
    function ApplyMaterial(newnode,newmaterial)
    {
        if(newnode instanceof THREE.Mesh)
            newnode.material = newmaterial;
        else if( newnode.children)
        {
            for(var i =0; i < newnode.children.length;i++)
                ApplyMaterial(newnode.children[0],newmaterial);
        }   
    }   
    function ParseSceneGraph(node, texture_load_callback) {
        
        var newnode;
        //its geometry
        if (node.primitives) {
            
            //newnode = new THREE.Object3D();
            var geo = new THREE.Geometry();
            var mesh = newnode = new THREE.Mesh(geo);
            mesh.geometry.normals = [];
            mesh.geometry.UVS = [];
            
            
            
            //vertex data
            if (node.attributes) {
                jQuery.each(node.attributes, function(key, element) {
                    debugarraytype = key;
                    var attributeArray = node.attributes[key];
                    node.attributes[key] = DecodeArray(attributeArray,key);
                    if(key == "Vertex")
                    {
                        for(var i = 0; i < node.attributes[key].length-2; i+= 3)
                        {
                            var vert = new THREE.Vector3(node.attributes[key][i],node.attributes[key][i+1],node.attributes[key][i+2]);
                            mesh.geometry.vertices.push(vert);
                        }
                    }
                    if(key == "Normal")
                    {
                        for(var i = 0; i < node.attributes[key].length-2; i+= 3)
                        {
                            var norm = new THREE.Vector3(node.attributes[key][i],node.attributes[key][i+1],node.attributes[key][i+2]);
                            mesh.geometry.normals.push(norm);
                        }
                    }
                    if(key == "TexCoord0")
                    {
                        for(var i = 0; i < node.attributes[key].length-1; i+= 2)
                        {
                            var uv = new THREE.UV(node.attributes[key][i],node.attributes[key][i+1]);
                            mesh.geometry.UVS.push(uv);
                        }
                    }
                    
                    if(key == "VertexColor")
                    {
                        for(var i = 0; i < node.attributes[key].length-3; i+= 4)
                        {
                            var vert = new THREE.Vector3(node.attributes[key][i],node.attributes[key][i+1],node.attributes[key][i+2]);
                            mesh.geometry.colors.push(vert);
                            
                        }
                    }               
                });
            }
            
            var i;
            for (i in node.primitives) {
                
                if (node.primitives[i].indices) {
                    var array = node.primitives[i].indices;
                    array = DecodeArray(array);
                    
                    for(var j = 0; j < array.length-2; j+= 3)
                    {
                        var face = new THREE.Face3(array[j],array[j+1],array[j+2],new THREE.Vector3(0,1,0),new THREE.Color('#000000'),0);
                        face.vertexNormals.push(mesh.geometry.normals[face.a]);
                        face.vertexNormals.push(mesh.geometry.normals[face.b]);
                        face.vertexNormals.push(mesh.geometry.normals[face.c]);
                        mesh.geometry.faces.push(face);
                        mesh.geometry.faceVertexUvs[0].push([mesh.geometry.UVS[face.a],mesh.geometry.UVS[face.b],mesh.geometry.UVS[face.c]]);

                    }
                } else {
                    mode = gl[mode];
                    var first = node.primitives[i].first;
                    var count = node.primitives[i].count;
                    if (count > 65535)
                        count = 32740;
                    //node.primitives[i] = new osg.DrawArrays(mode, first, count);
                }
            }
            
            
            mesh.geometry.verticesNeedUpdate  = true;
            mesh.geometry.facesNeedUpdate  = true;
            }
            var newmaterial = null;
            if (node.stateset) {
                newmaterial = new THREE.MeshPhongMaterial();
                if (node.stateset.textures) {
                    var textures = node.stateset.textures;
                    for ( var t = 0, tl = textures.length; t < tl; t++) {
                        if (textures[t] === undefined) {
                            continue;
                        }
                        if (!textures[t].file) {
                            if (console !== undefined) {
                            console.log("no 'file' field for texture "
                                + textures[t]);
                            }
                        }

                        var tex;
                        if (texture_load_callback)
                            tex = texture_load_callback(textures[t].file);
                        else
                        {
                            tex = THREE.ImageUtils.loadTexture(textures[t].file);
                        }
                        if (tex) {
                            tex.wrapS = THREE.RepeatWrapping;
                            tex.wrapT = THREE.RepeatWrapping;
                            newmaterial.map = tex;
                            newmaterial.needsUpdate = true;
                        }
                    }
                }
                if (node.stateset.material) {
                    newmaterial.ambient = (toColor(node.stateset.material.ambient));
                    newmaterial.color = (toColor(node.stateset.material.diffuse));
                    
                    newmaterial.shininess = (node.stateset.material.shininess);
                    newmaterial.specular = (toColor(node.stateset.material.specular));
                    newmaterial.needsUpdate = true;
                }
                
            }
            
            
            
        if (node.matrix) {
        
            if(newnode == null)
                newnode = new THREE.Object3D();
            var matrix = [];
            for(var i =0; i < node.matrix.length; i++)
                matrix.push(node.matrix[i]);
            var glmat = new THREE.Matrix4();
            glmat.elements = matrix;
            
            var flipmat = new THREE.Matrix4(1, 0,0,0,
                                            0, 0,1,0,
                                            0,-1,0,0,
                                            0, 0,0,1);
                            
                                            
            glmat = glmat.multiply(flipmat,glmat);
            
            //glmat = glmat.transpose();
            newnode.matrix.copy(glmat)  
            newnode.matrixAutoUpdate = false;
        }
        
        if (node.children) {
            if(newnode == null)
                newnode = new THREE.Object3D();
            for ( var child = 0; child < node.children.length; child++) {
                var childnode = ParseSceneGraph(node.children[child],texture_load_callback);
                if(childnode)
                    newnode.add(childnode);
            }
        }
        
        if(newnode && newmaterial)
            ApplyMaterial(newnode,newmaterial);
        
        if(node.name && newnode)
            newnode.name = node.name;
            
		if(newnode && newnode.children && newnode.children.length == 1 && isIdentityMatrix(newnode.matrix.elements))
		return newnode.children[0];
		
        return newnode;
    }
    var blobsfound = 0;
    var blobarray = [];

    function DecompressStrings(data, replace, find)
    {
        var reg = new RegExp(find,'g');
        return data.replace(reg, replace);
    }

    function decompressJsonStrings(data)
    {
    data = DecompressStrings(data,"\"min\":","min:");
    data = DecompressStrings(data,"\"max\":","max:");
    data = DecompressStrings(data,"\"stateset\":","ss:");
    data = DecompressStrings(data,"\"LINE_LOOP\"","\"LL\"");
    data = DecompressStrings(data,"\"LINEAR\"","\"L\"");
    data = DecompressStrings(data,"\"LINEAR_MIPMAP_LINEAR\"","\"LML\"");
    data = DecompressStrings(data,"\"LINEAR_MIPMAP_NEAREST\"","\"LMN\"");
    data = DecompressStrings(data,"\"NEAREST\"","\"NE\"");
    data = DecompressStrings(data,"\"NEAREST_MIPMAP_LINEAR\"","\"NML\"");
    data = DecompressStrings(data,"\"NEAREST_MIPMAP_NEAREST\"","\"NMN\"");
    data = DecompressStrings(data,"\"mag_filter\":","maf:");
    data = DecompressStrings(data,"\"min_filter\":","mif:");
    data = DecompressStrings(data,"\"file\":","f:");
    data = DecompressStrings(data,"\"name\":","n:");
    data = DecompressStrings(data,"\"ambient\":","a:");
    data = DecompressStrings(data,"\"diffuse\":","d:");
    data = DecompressStrings(data,"\"specular\":","s:");
    data = DecompressStrings(data,"\"emission\":","e:");
    data = DecompressStrings(data,"\"shininess\":","sh:");
    data = DecompressStrings(data,"\"textures\":","t:");
    data = DecompressStrings(data,"\"material\":","m:");
    data = DecompressStrings(data,"\"POINTS\"","\"P\"");
    data = DecompressStrings(data,"\"LINES\"","\"LI\"");

    data = DecompressStrings(data,"\"LINE_STRIP\"","\"LS\"");
    data = DecompressStrings(data,"\"TRIANGLES\"","\"T\"");
    data = DecompressStrings(data,"\"TRIANGLE_FAN\"","\"TF\"");
    data = DecompressStrings(data,"\"TRIANGLE_STRIP\"","\"TS\"");
    data = DecompressStrings(data,"\"first\":","fi:");
    data = DecompressStrings(data,"\"count\":","co:");
    data = DecompressStrings(data,"\"mode\":","mo:");
    data = DecompressStrings(data,"\"undefined\":","u:");
    data = DecompressStrings(data,"\"children\":","c:");
    data = DecompressStrings(data,"\"range\":","r:");
    data = DecompressStrings(data,"\"bits\":","b:");
    data = DecompressStrings(data,"\"values\":","v:");
    data = DecompressStrings(data,"\"elements\":","el:");
    data = DecompressStrings(data,"\"itemSize\":","iS:");
    data = DecompressStrings(data,"\"type\":","ty:");
    data = DecompressStrings(data,"\"ARRAY_BUFFER\"","\"AB\"");
    data = DecompressStrings(data,"\"ELEMENT_ARRAY_BUFFER\"","\"EAB\"");
    data = DecompressStrings(data,"\"indices\":","i:");
    data = DecompressStrings(data,"\"Vertex\":","V:");
    data = DecompressStrings(data,"\"Normal\":","N:");
    data = DecompressStrings(data,"\"TexCoord0\":","T0:");
    data = DecompressStrings(data,"\"TexCoord1\":","T1:");
    data = DecompressStrings(data,"\"TexCoord2\":","T2:");
    data = DecompressStrings(data,"\"TexCoord3\":","T3:");
    data = DecompressStrings(data,"\"TexCoord4\":","T4:");
    data = DecompressStrings(data,"\"attributes\":","A:");
    data = DecompressStrings(data,"\"primitives\":","p:");
    data = DecompressStrings(data,"\"projection\":","pr:");
    data = DecompressStrings(data,"\"matrix\":","M:");

    return data;
    }

    function decompress(dataencoded)
    {
        blobsfound = 0;
        blobarray = [];

        var regex = new RegExp('\u7FFF\u7FFE\u7FFF\u7FFE\u7FFF[\\S\\s]*?\u7FFE\u7FFF\u7FFE\u7FFF\u7FFE','igm');
        blobarray = dataencoded.match(regex);
        var data = dataencoded.replace(regex,function(match) { return "\""+(blobsfound++)+"\"";});
        data = decompressJsonStrings(data);
        return data;
    }



});
