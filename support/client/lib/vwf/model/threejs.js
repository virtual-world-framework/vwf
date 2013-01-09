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
                //sceneNode.threeScene.add(group);
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
                    SetMaterial(node.threeObject,node.threeMaterial)
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
                        threeObject: threeChild,
                        source: utility.resolveURI( childSource, childURI ),
                        ID: childID,
                        parentID: nodeID,
                        sourceType: childType,
                        type: childExtendsID,
                        sceneID: this.state.sceneRootID,
                        threeObject: new THREE.Object3D()
                    };
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
                        if(!node.threeObject)
                            node.threeObject = findThreeObjectInParent.call(this,childName,nodeID);
                        //The parent three object did not have any childrent with the name matching the nodeID, so make a new group
                        if(!node.threeObject)
                            node.threeObject = new THREE.Object3D(); 
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
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

          var value = undefined;

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
        
          //console.log([nodeID,propertyName,propertyValue]);
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
                }
                if(threeObject instanceof THREE.Camera)
                {
                    if(propertyName == "fovy")
                    {
                        if(propertyValue)
                        {
                            threeObject.fov = parseFloat(propertyValue);
                            threeObject.updateProjectionMatrix();
                        }
                    }
                    if(propertyName == "near")
                    {
                        if(propertyValue)
                        {
                            threeObject.near = parseFloat(propertyValue);
                            threeObject.updateProjectionMatrix();
                        }
                    }
                    if(propertyName == "aspect")
                    {
                        if(propertyValue)
                        {
                            threeObject.aspect = parseFloat(propertyValue); 
                            threeObject.updateProjectionMatrix();                           
                        }
                    }
                    if(propertyName == "far")
                    {
                        if(propertyValue)
                        {
                            threeObject.far = parseFloat(propertyValue);                    
                            threeObject.updateProjectionMatrix();
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
                                threeObject.updateProjectionMatrix();   
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
                    if(propertyName == "color")
                    {
                        
                        threeObject.color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
                        threeObject.needsUpdate = true;
                        threeObject.ambient.setRGB( threeObject.color.r,threeObject.color.g,threeObject.color.b);
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
                    if(propertyName == 'diffuse')
                    {
                        threeObject.color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
                    }
                    if(propertyName == 'castShadows')
                    {
                        //debugger;
                        threeObject.castShadow = true;
                    }

                }
            }
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
          if(!threeObject)
            threeObject = node.threeScene;
          
          //if it's a material node, we'll work with the threeMaterial
          //might be more elegant to simply make the node.threeObject the material, but keeping it seperate
          //in case we later need access to the object the material is on.
          if(node.threeMaterial)
            threeObject = node.threeMaterial;
            
          //There is not three object for this node, so there is nothing this driver can do. return
          if(!threeObject) return value;    
          
              if ( node && threeObject ) 
              {
                if(threeObject instanceof THREE.Object3D)
                {
                    if(propertyName == 'transform')
                    {
                        
                        var propertyValue = new THREE.Matrix4();
                        var elements = threeObject.matrix.elements; 
                        propertyValue.set(elements[0],elements[8],elements[4],elements[12],
                                                    elements[2],elements[10],elements[6],elements[14],
                                                    elements[1],elements[9],elements[5],elements[13],
                                                    elements[3],elements[11],elements[7],elements[15]);
                        //propertyValue.set(elements[0],elements[8],elements[4],elements[12],
                        //                          elements[2],elements[10],elements[6],elements[14],
                        //                          elements[1],elements[9],elements[5],elements[13],
                        //                          elements[3],elements[11],elements[7],elements[15]);
                            if(threeObject.parent instanceof THREE.Scene)
                            {                           
                            var flipmat = new THREE.Matrix4(1, 0,0,0,
                                                            0, 0,1,0,
                                                            0,1,0,0,
                                                            0, 0,0,1);
                            
                                            
                            propertyValue = propertyValue.multiply(flipmat,propertyValue);
                            }
                            
                            
                            var translation = new THREE.Vector3();
                            var quat = new THREE.Quaternion();
                            var scale = new THREE.Vector3();
                            
                            
                        
                            propertyValue.decompose(translation,quat,scale);
                            var googquat = goog.vec.Quaternion.createFromValues(quat.x+quat.y+quat.z == 0 ? 1 : quat.x,quat.y,quat.z,quat.w);
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
                            propertyValue.setRotationFromQuaternion(quat);
                            
                            
                            propertyValue = propertyValue.scale(scale);
                            propertyValue.elements[13] *= -1;
                            
                            
                            
                                                                
                        
                        
                            return propertyValue.elements;                  
                                                    
                    
                    }
                    if(propertyName ==  "boundingbox")
                    {
                        var bbox = getLocalBoundingBox.call( this, glgeObject );
                        value = { min: [ bbox.xMin, bbox.yMin, bbox.zMin], max: [ bbox.xMax, bbox.yMax, bbox.zMax] };
                    }
/*
                    if(propertyName ==  "centerOffset")
                    {
                        var centerOff = getCenterOffset.call( this, glgeObject );
                        var scale = this.kernel.getProperty( nodeID, "scale", undefined );
                        value = new Array;
                        value.push( centerOff[0] * scale[0], centerOff[1] * scale[1], centerOff[2] * scale[2] ); 
                    }

                    if(propertyName ==  "vertices")
                    {
                        value = getMeshVertices.call( this, glgeObject );
                    }

                    if(propertyName ==  "vertexIndices")
                    {
                        value = getMeshVertexIndices.call( this, glgeObject );
                    }
*/
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
                if(threeObject instanceof THREE.Material)
                {
                    if(propertyName == "texture")
                    {
                        if(threeObject.map && threeObject.map.image)
                            return threeObject.map.image.src;
                            
                    }
                    if(propertyName == "color")
                    {
                        
                            
                    }
                }
            }       
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
        
            for(var i in this.state.nodes)
            {
                var node = this.state.nodes[i];
                var threeObject = node.threeObject;
                if(threeObject instanceof THREE.ParticleSystem)
                {   
                    
                      var pCount = 1800;
                      var particles = threeObject.geometry;
                      while(pCount--) {

                        // get the particle
                        var particle =
                          particles.vertices[pCount];

                        // check if we need to reset
                        if(particle.z < -200) {
                          particle.z = 200;
                          particle.velocity.z = 0;
                        }

                        // update the velocity with
                        // a splat of randomniz
                        particle.velocity.z -=
                          Math.random() * .1;

                        // and the position
                        particle.addSelf(
                          particle.velocity);
                        //particle.z -= 10;
                      }

                      // flag to the particle system
                      // that we've changed its vertices.
                      threeObject.geometry.verticesNeedUpdate  = true;
                
                }
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
    //set the material on all the sub meshes of an object.
    //This could cause some strangeness in cases where an asset has multiple sub materials
    //best to only specify the material sub-node where an asset is a mesh leaf
    function SetMaterial(threeObject,material)
    {
        //something must be pretty seriously wrong if no threeobject
        if(!threeObject)
            return null;
        
        if(threeObject && threeObject instanceof THREE.Mesh)
            threeObject.material = material; 
        if(threeObject.children)
        {
            var ret = null;
            for(var i=0; i < threeObject.children.length; i++)
            {
                SetMaterial(threeObject.children[i],material)
            }               
        }       
        return null;
    }
    function createMesh( node, meshDef ) {
        if ( node.threeObject && node.threeObject instanceof THREE.Object3D ) {
            var i;
            var geo = new THREE.Geometry();
            var mat = new THREE.MeshBasicMaterial( { color: meshDef.color ? meshDef.color : 0xffffff } )

            for ( i = 0; meshDef.positions && i < meshDef.positions.length; i++ ) {
                geo.vertices.push( new THREE.Vector3( meshDef.positions[i*3], meshDef.positions[i*3+1],meshDef.positions[i*3+2] ) );   
            }
            for ( i = 0; meshDef.faces && i < meshDef.faces.length; i++ ) {
                geo.faces.push( new THREE.Face3( meshDef.faces[i*3], meshDef.faces[i*3+1],meshDef.faces[i*3+2] ) );   
            }            
            for ( i = 0; meshDef.normals && i < meshDef.normals.length; i++ ) {
                geo.vertexNormals.push( new THREE.Vector3( meshDef.normals[i*3], meshDef.normals[i*3+1],meshDef.normals[i*3+2] ) );   
            } 
            for ( i = 0; meshDef.uv1 && i < meshDef.uv1.length; i++ ) {
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

        function assetLoaded( asset ) { 
            sceneNode.pendingLoads--;
            
            //possibly deal with setting intial scale and rotation here, if threejs does something strange by default
            //collada.setRot( 0, 0, 0 ); // undo the default GLGE rotation applied in GLGE.Collada.initVisualScene that is adjusting for +Y up
            if(asset.scene)
                asset = asset.scene;
            var removed = false;
           
            SetMaterialAmbients.call(threeModel,asset);
            nodeCopy.threeObject.add(asset);
            nodeCopy.threeObject.matrixAutoUpdate = false;
            nodeCopy.threeObject.matrix.elements = [ 1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
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
                    //vwf.setProperty( glgeModel.state.sceneRootID, "loadDone", true );
                    loadComplete.call( threeModel );
                }

                var id = nodeCopy.vwfID;
                if ( !id ) id = getObjectID.call( threeModel, asset, true, false );
                if ( id && id != "" ){
                    //glgeModel.kernel.callMethod( id, "loadComplete" );
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
        if(!node.threeObject)
            node.threeObject = new THREE.Object3D();
        sceneNode.srcAssetObjects.push( node.threeObject );
        node.threeObject.vwfID = nodeID;

        //todo, set when dealing with actual collada load. Three js should have some sort of loader with a callback. 
        //node.glgeObject.loadedCallback = assetLoaded;
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
        //assetLoaded(node.threeObject);
        if(childType == "model/vnd.collada+xml")
        {
            node.loader = new THREE.ColladaLoader();
            node.loader.load(node.source,assetLoaded.bind(this));
        }
        if(childType == "model/vnd.osgjs+json+compressed")
        {
            node.loader = new UTF8JsonLoader(node,assetLoaded.bind(this));
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
            child.threeObject.shadowCameraRight     =  500;
            child.threeObject.shadowCameraLeft      = -500;
            child.threeObject.shadowCameraTop       =  500;
            child.threeObject.shadowCameraBottom    = -500;
            child.threeObject.distance = 100;
            child.threeObject.color.setRGB(1,1,1);
            child.threeObject.matrixAutoUpdate = false;
        
            child.threeObject.name = childName;
            child.name = childName;
            addThreeChild.call( this, nodeID, childID );
        } 
               
    }
    function CreateParticleSystem(nodeID, childID, childName )
    {
        
        
        var child = this.state.nodes[childID];
        if ( child ) 
        {
        
            // create the particle variables
            var particleCount = 1800;
            var particles = new THREE.Geometry();
            var pMaterial =
                  new THREE.ParticleBasicMaterial({
                    color: 0xFFFFFF,
                    size: 20
                  });

            // now create the individual particles
            for(var p = 0; p < particleCount; p++) {

              // create a particle with random
              // position values, -250 -> 250
              var pX = Math.random() * 500 - 250,
                  pY = Math.random() * 500 - 250,
                  pZ = Math.random() * 500 - 250,
                  particle = new THREE.Vertex(
                    new THREE.Vector3(pX, pY, pZ)
                  );
                particle.velocity = new THREE.Vector3(
                  0,              // x
                  0, // y: random vel
                  -Math.random()*10);
              // add it to the geometry
              particles.vertices.push(particle);
            }

            // create the particle system
            var particleSystem = new THREE.ParticleSystem(particles,pMaterial);
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
