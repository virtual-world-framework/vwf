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

    function matCpy( mat )
    {
        var ret = [];
        for ( var i =0; i < mat.length; i++ )
            ret.push( mat[i] );

        // I don't think there is any reason we need to copy the return array
        return ret;
        // return ret.slice(0);    
    }
    
    
define( [ "module", 
          "vwf/model", 
          "vwf/utility", 
          "vwf/utility/color", 
          "jquery" 
    ], function( module, model, utility, Color, $ ) {

    var self;

    var checkLights = true;
    var sceneCreated = false;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            
            self = this;

            checkCompatibility.call(this);

            this.state.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
            this.state.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }
            this.state.prototypes = {}; 
            this.state.kernel = this.kernel.kernel.kernel; 
            this.state.lights = {};           
 
            this.state.setMeshPropertyRecursively = function( threeObject, propertyName, value ) {
                if ( !threeObject ) {
                    return;
                }
                threeObject[ propertyName ] = value;
                var meshes = findAllMeshes( threeObject );
                for ( var i = 0; i < meshes.length; i++ ) {
                    meshes[ i ][ propertyName ] = value;
                }
            }

            // turns on logger debugger console messages 
            this.debug = {
                "creation": false,
                "initializing": false,
                "parenting": false,
                "deleting": false,
                "properties": false,
                "setting": false,
                "getting": false,
                "prototypes": false
            };
        },


        // == Model API ============================================================================

        // -- creatingNode ------------------------------------------------------------------------
        
        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
                                childSource, childType, childIndex, childName, callback ) {
            self = this;

            // If the parent nodeID is 0, this node is attached directly to the root and is therefore either 
            // the scene or a prototype.  In either of those cases, save the uri of the new node
            var childURI = ( nodeID === 0 ? childIndex : undefined );
            var appID = this.kernel.application();

            if ( this.debug.creation ) {
                this.logger.infox( "creatingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            }

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = utility.ifPrototypeGetId( appID, this.state.prototypes, nodeID, childID );
            if ( prototypeID !== undefined ) {
                
                if ( this.debug.prototypes ) {
                    this.logger.infox( "prototype: ", prototypeID );
                }

                this.state.prototypes[ prototypeID ] = {
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
            
            var node = undefined;
            var parentNode;
            var threeChild;
            var threeParent;
            var waiting = false;
           
            if ( nodeID )
            {
                parentNode = this.state.nodes[ nodeID ];

                // If parent is not a node, see if it is a scene
                if ( !parentNode )
                    parentNode = this.state.scenes[ nodeID ];

                if ( parentNode )
                {
                    threeParent = parentNode.threeObject ? parentNode.threeObject : parentNode.threeScene;
                    if ( threeParent && childName )
                    {
                        threeChild = FindChildByName.call( this,threeParent,childName,childExtendsID,false );
                    }
                }               
            }
            var kernel = this.kernel.kernel.kernel;
            
            var protos = getPrototypes.call( this, kernel, childExtendsID );
            if ( isSceneDefinition.call(this, protos) && childID == this.kernel.application() )
            {
                this.state.sceneRootID = childID;

                var sceneNode = CreateThreeJSSceneNode(nodeID, childID, childExtendsID);
                this.state.scenes[childID] = sceneNode
                sceneCreated = true;
            }
            
            if ( protos && isCameraDefinition.call( this, protos ) ) {

                var camName = childID.substring( childID.lastIndexOf( '-' ) + 1 );
                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: threeChild,
                    ID: childID,
                    parentID: nodeID,
                    sceneID: this.state.sceneRootID,
                    threeScene: sceneNode ? sceneNode.threeScene : undefined,
                    type: childExtendsID,
                    sourceType: childType,
                    prototypes: protos,
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
                        }
                        sceneNode.camera.ID = childID;
                        node.name = camName;
                        node.threeObject = sceneNode.camera.threeJScameras[ childID ];
                  
                    } else if ( node.threeObject ) {
                        sceneNode.camera.threeJScameras[ childID ] = node.threeObject;
                        sceneNode.threeScene.add( node.threeObject ); 
                    }
                }               
            } else if(protos && isLightDefinition.call(this,protos)) {
                node = this.state.nodes[ childID ] = this.state.lights[ childID ] = {
                    name: childName,
                    threeObject: threeChild,
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                if( !node.threeObject )
                {
                    createLight.call(this,nodeID,childID,childName);
                }
            
            } else if ( protos && isMaterialDefinition.call( this, protos ) ) {

                node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: GetMaterial(parentNode.threeObject, childName),
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                if ( !node.threeObject )
                {   
                    node.threeObject = new THREE.MeshPhongMaterial();
                    SetMaterial( parentNode.threeObject, node.threeObject, childName );
                }
            } else if ( protos && isShaderMaterialDefinition.call( this, protos ) ) {

                node = this.state.nodes[childID] = {
                    name: childName,
                    threeObject: GetMaterial(parentNode.threeObject, childName),
                    ID: childID,
                    parentID: nodeID,
                    type: childExtendsID,
                    sourceType: childType,
                };
                if ( true )
                {
                    node.threeObject = new THREE.ShaderMaterial();
                    SetMaterial( parentNode.threeObject, node.threeObject, childName );
                }
            } else if ( protos && isParticleDefinition.call( this, protos ) ) {
                
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
            } else if ( protos && isNodeDefinition.call( this, protos ) && childName !== undefined ) {
                
                var sceneNode = this.state.scenes[ this.state.sceneRootID ];
                if ( childType == "model/vnd.collada+xml" || 
                    childType == "model/vnd.osgjs+json+compressed" ||
                    childType == "model/x-threejs-morphanim+json" ||
                    childType == "model/vnd.gltf+json" ||
                    childType == "model/x-threejs-skinned+json" ) {
                    
                    // Most often this callback is used to suspend the queue until the load is complete
                    callback( false );

                    node = this.state.nodes[ childID ] = {
                        name: childName,  
                        threeObject: threeChild,
                        source: utility.resolveURI( childSource, childURI ),
                        ID: childID,
                        parentID: nodeID,
                        sourceType: childType,
                        type: childExtendsID,
                        // Hang on to the callback and call it again in assetLoaded with ready=true
                        loadingCallback: callback,
                        sceneID: this.state.sceneRootID
                    };
                    loadAsset.call( this, parentNode, node, childType, notifyDriverOfPrototypeAndBehaviorProps );     
                }
                else if ( childType == "mesh/definition" ) {
                    
                    //callback( false );
                    node = this.state.nodes[ childID ] = {
                        name: childName,  
                        source: utility.resolveURI( childSource, childURI ),
                        ID: childID,
                        parentID: nodeID,
                        sourceType: childType,
                        type: childExtendsID,
                        sceneID: this.state.sceneRootID,
                        prototypes: protos,
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
                        sceneID: this.state.sceneRootID,
                        prototypes: protos,
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
            
                if ( node && node.threeObject )
                {
                    if ( !node.threeObject.vwfID )
                        node.threeObject.vwfID = childID;
                    if ( !node.threeObject.name )
                        node.threeObject.name = childName;
                }
            
            }

            if ( node && ( node.threeObject instanceof THREE.Object3D ) ) {
                // Add a local model-side transform that can stay pure even if the view changes the
                // transform on the threeObject - objects that don't yet have a threeObject because
                // a file needs to load create this transform in assetLoaded
                node.transform = new THREE.Matrix4();
                node.transform.elements = matCpy( node.threeObject.matrix.elements );

                // If this threeObject is a camera, it has a 90-degree rotation on it to account for the 
                // different coordinate systems of VWF and three.js.  We need to undo that rotation before 
                // setting the VWF property.
                if ( node.threeObject instanceof THREE.Camera ) {
                                        
                    var transformArray = node.transform.elements;

                    // Get column y and z out of the matrix
                    var columny = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn( transformArray, 1, columny );
                    var columnz = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn( transformArray, 2, columnz );

                    // Swap the two columns, negating columny
                    goog.vec.Mat4.setColumn( transformArray, 1, goog.vec.Vec4.negate( columnz, columnz ) );
                    goog.vec.Mat4.setColumn( transformArray, 2, columny );
                }
            }

            // If we do not have a load a model for this node, then we are almost done, so we can update all
            // the driver properties w/ the stop-gap function below.
            // Else, it will be called at the end of the assetLoaded callback
            if ( ! ( childType == "model/vnd.collada+xml" || 
                     childType == "model/vnd.osgjs+json+compressed" ||
                     childType == "model/x-threejs-morphanim+json" ||
                     childType == "model/x-threejs-skinned+json" ) )
                notifyDriverOfPrototypeAndBehaviorProps();

            // Since prototypes are created before the object, it does not get "setProperty" updates for
            // its prototype (and behavior) properties.  Therefore, we cycle through those properties to
            // notify the drivers of the property values so they can react accordingly
            // TODO: Have the kernel send the "setProperty" updates itself so the driver need not
            // NOTE: Identical code exists in GLGE driver, so if an change is necessary, it should be made
            //       there, too
            function notifyDriverOfPrototypeAndBehaviorProps() {
                var ptPropValue;
                var protos = getPrototypes.call( this, kernel, childExtendsID );
                protos.forEach( function( prototypeID ) {
                    for ( var propertyName in kernel.getProperties( prototypeID ) ) {
                        ptPropValue = kernel.getProperty( childExtendsID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
                childImplementsIDs.forEach( function( behaviorID ) {
                    for ( var propertyName in kernel.getProperties( behaviorID ) ) {
                        ptPropValue = kernel.getProperty( behaviorID, propertyName );
                        if ( ptPropValue !== undefined && ptPropValue !== null && childID !== undefined && childID !== null) {
                            self.settingProperty( childID, propertyName, ptPropValue );
                        }
                    }
                } );
            };

        },

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {
            var myNode = this.state.nodes[childID];
            
            if ( this.debug.initializing ) {
                this.logger.infox( "initializingNode", nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName );
            } 

            if ( myNode && !( myNode.threeObject instanceof THREE.Material ) ) {
                generateNodeMaterial.call( this, childID, myNode );//Potential node, need to do node things!
            }
        },
         
        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if ( this.debug.deleting ) {
                this.logger.infox( "deletingNode", nodeID );
            }

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

            var threeObjParent = getThreeObject.call( this, nodeID );
            var threeObjChild = getThreeObject.call( this, childID ); 
            
            if ( threeObjParent && threeObjChild ) { 
                if ( threeObjParent instanceof THREE.Object3D ) {

                    if ( !( threeObjChild instanceof THREE.Material ) ) {
                        var childParent = threeObjChild.parent;
                        if ( childParent !== threeObjParent ) {
                            // what does vwf do here?  add only if parent is currently undefined
                            if ( childParent ) {
                                childParent.remove( threeObjChild )   
                            } 
                            threeObjParent.add( threeObjChild );
                        }
                    } else {
                        // TODO
                        // this is adding of a material
                    }
                }
            }

        },

        // -- movingChild ------------------------------------------------------------------------
        
        movingChild: function( nodeID, childID, childName ) {

            var threeObjParent = getThreeObject.call( this, nodeID );
            var threeObjChild = getThreeObject.call( this, childID ); 
            
            if ( threeObjParent && threeObjChild && ( threeObjParent instanceof THREE.Object3D ) ){
                var childParent = threeObjChild.parent;
                // do we only move if there is currently a parent
                if ( childParent && ( childParent !== threeObjParent ) ) {
                    childParent.remove( threeObjChild );
                    threeObjParent.add( threeObjChild );   
                } 
            } 

        },

        // -- removingChild ------------------------------------------------------------------------
        
        removingChild: function( nodeID, childID, childName ) {
            
            var threeObjParent = getThreeObject.call( this, nodeID );
            var threeObjChild = getThreeObject.call( this, childID );
            if ( threeObjParent && threeObjChild && ( threeObjParent instanceof THREE.Object3D ) ){    

                var childParent = threeObjChild.parent;
                if ( childParent === threeObjParent ) {
                    childParent.remove( threeObjChild )   
                } 
            } 
            
        },

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

            if ( propertyValue !== undefined ) {
                var node = this.state.nodes[ nodeID ];
                if ( node === undefined ) node = this.state.scenes[ nodeID ];
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        case "meshDefinition":
                            createMesh.call( this, node, propertyValue, true );
                            value = propertyValue; 
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

            if ( this.debug.properties || this.debug.setting ) {
                this.logger.infox( "    S === settingProperty ", nodeID, propertyName, propertyValue );
            }

            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            if( node === undefined ) node = this.state.scenes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if(!node) return;

            var threeObject = node.threeObject;
            if ( !threeObject )
                threeObject = node.threeScene;

            //There is not three object for this node, so there is nothing this driver can do. return
            if(!threeObject) return value;    
          
            if ( propertyValue !== undefined ) 
            {
                self = this;
                if ( threeObject instanceof THREE.Object3D )
                {
                    // Function to make the object continuously look at a position or node
                    // (for use when setting 'transform' or 'lookAt')
                    // An almost identical function is copied in view/threejs.js, so if any modifications are made here, they 
                    // should be made there, also
                    var lookAt = function( lookAtValue ) {

                        // Function to make the object look at a particular position
                        // (For use in the following conditional)
                        var lookAtWorldPosition = function( targetWorldPos ) {
                            
                            // Get the eye position
                            var eye = new THREE.Vector3();
                            var worldTransform = getWorldTransform( node );
                            eye.setFromMatrixPosition( worldTransform );

                            var look = new THREE.Vector3();
                            look.subVectors( targetWorldPos, eye );
                                
                            if ( look.length() > 0 ) {
                                look.normalize();

                                // Set the up vector to be z
                                var roughlyUp = new THREE.Vector3();
                                roughlyUp.set( 0, 0, 1 );

                                var right = new THREE.Vector3();
                                right.crossVectors( look, roughlyUp );
                                if ( right.length() == 0 ) {
                                    look.x += 0.0001;
                                    right.crossVectors( look, roughlyUp );
                                }
                                right.normalize();

                                var up = new THREE.Vector3();
                                up.crossVectors( right, look );

                                var worldTransformArray = worldTransform.elements;
                                worldTransformArray[ 0 ] = right.x;  
                                worldTransformArray[ 1 ] = right.y; 
                                worldTransformArray[ 2 ] = right.z; 
                                worldTransformArray[ 4 ] = look.x;
                                worldTransformArray[ 5 ] = look.y; 
                                worldTransformArray[ 6 ] = look.z; 
                                worldTransformArray[ 8 ] = up.x;
                                worldTransformArray[ 9 ] = up.y;
                                worldTransformArray[ 10 ] = up.z;

                                setWorldTransform( node, worldTransform );
                            }
                        }

                        // The position for the object to look at - to be set in the following conditional
                        var targetWorldPos = new THREE.Vector3();

                        //Threejs does not currently support auto tracking the lookat,
                        //instead, we'll take the position of the node and look at that.
                        if ( typeof lookAtValue == 'string' ) {
                            
                            // We use '' to denote that there is no object to look at.
                            // Therefore, we only care if it is something other than that.
                            if ( lookAtValue != '' ) {
                                var lookatNode = self.state.nodes[ lookAtValue ];
                                
                                if ( lookatNode )
                                {
                                    node.lookatval = lookAtValue;
                                    var targetWorldTransform = getWorldTransform( lookatNode );
                                    targetWorldPos.setFromMatrixPosition( targetWorldTransform );
                                    lookAtWorldPosition( targetWorldPos );                         
                                } else {
                                    self.logger.errorx( "Lookat node does not exist: '" + lookAtValue + "'" );
                                }
                            }
                        
                        } else if ( lookAtValue instanceof Array ) {
                            node.lookatval = lookAtValue;
                            targetWorldPos.set( lookAtValue[0], lookAtValue[1], lookAtValue[2] );
                            lookAtWorldPosition( targetWorldPos );   
                        } else if ( !lookAtValue ) {
                            node.lookatval = null;
                        } else {
                            self.logger.errorx( "Invalid lookat property value: '" + lookAtValue + "'" );
                        }
                        return node.lookatval;
                    }

                    // Begin handling properties

                    if ( propertyName == 'transform' && node.transform ) {

                        //console.info( "setting transform of: " + nodeID + " to " + Array.prototype.slice.call( propertyValue ) );
                        var transformMatrix = goog.vec.Mat4.createFromArray( propertyValue || [] );
                        if( threeObject instanceof THREE.PointCloud )
                        {   
                            threeObject.updateTransform(propertyValue);
                        }
                        // Store the value locally
                        // It must be stored separately from the threeObject so the view can change the
                        // threeObject's transform to get ahead of the model state without polluting it
                        node.transform.elements = matCpy( transformMatrix );

                        value = propertyValue;

                        //because threejs does not do auto tracking of lookat, we must do it manually.
                        //after updating the matrix for an ojbect, if it's looking at something, update to lookat from
                        //the new position
                        if ( node.lookatval ) {
                            lookAt( node.lookatval );
                        }
                    }
                    else if ( propertyName == 'lookAt' ) {
                        value = lookAt( propertyValue );
                    }
                    else if ( propertyName == 'visible' )
                    {
                        value = Boolean( propertyValue );
                        self.state.setMeshPropertyRecursively( threeObject, "visible", value );
                    }
                    else if ( propertyName == 'castShadows' )
                    {
                        value = Boolean( propertyValue );

                        // TODO: We should call setMeshPropertyRecursively here instead of repeating code
                        threeObject.castShadow = value;
                        var meshes = findAllMeshes.call( this, threeObject );
                        for(var i = 0, il = meshes.length; i < il; i++) {
                            meshes[i].castShadow = value;
                        }
                    }
                    else if ( propertyName == 'receiveShadows' )
                    {
                        value = Boolean( propertyValue );

                        // TODO: We should call setMeshPropertyRecursively here instead of repeating code
                        threeObject.receiveShadow = value;
                        var meshes = findAllMeshes.call( this, threeObject );
                        for(var i = 0, il = meshes.length; i < il; i++) {
                            meshes[i].receiveShadow = value;
                        }
                    }

                    //This can be a bit confusing, as the node has a material property, and a material child node. 
                    //setting the property does this, but the code in the component is ambigious
                    else if ( propertyName == 'material' )
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

                    else if ( propertyName == "animationTimeUpdated" ) {

                        // Keyframe Animations
                        if ( node.threeObject.kfAnimations && node.threeObject.kfAnimations.length && propertyValue !== undefined ) {
                            for ( var i = 0; i < node.threeObject.kfAnimations.length; i++ ) {
                                node.threeObject.kfAnimations[i].stop()
                                node.threeObject.kfAnimations[i].play( false, 0 );
                                node.threeObject.kfAnimations[i].update( propertyValue );
                            } 
                        }
                        
                        // Both JSON and Collada models can be skinned mesh animations, but the Collada loader does not support bones
                        // therefore Collada models will fall in the Morph Target conditional if applicable.

                        // Skeletal Animations (takes precedence over Morph Target)
                        if ( node.threeObject.bones && node.threeObject.bones.length > 0 ) {
                            var animRate = this.state.kernel.getProperty( nodeID, "animationRate" ) || 1;
                            THREE.AnimationHandler.update(animRate);
                        } 
                        // Morph Target Animations
                        else if ( node.threeObject.animatedMesh && node.threeObject.animatedMesh.length && propertyValue !== undefined ) {
                            var fps = this.state.kernel.getProperty( nodeID, "animationFPS" ) || 30;
                            for( var i = 0; i < node.threeObject.animatedMesh.length; i++ ) {
                                if ( node.threeObject.animatedMesh[i].morphTargetInfluences ) {
                                    for( var j = 0; j < node.threeObject.animatedMesh[i].morphTargetInfluences.length; j++ ) {
                                        node.threeObject.animatedMesh[i].morphTargetInfluences[j] = 0;
                                    }
                                    node.threeObject.animatedMesh[i].morphTargetInfluences[ Math.floor(propertyValue * fps) ] = 1;
                                }
                            }
                        }
                    }

                    else if ( propertyName == "animationDuration" ) {
                        if( node.threeObject.animatedMesh && node.threeObject.animatedMesh.length || node.threeObject.kfAnimations ) {
                            value = this.gettingProperty( nodeID, "animationDuration" );
                        }
                    }

                    else if ( propertyName == "animationFPS" ) {
                        if( node.threeObject.animatedMesh && node.threeObject.animatedMesh.length || node.threeObject.kfAnimations ) {
                            value = this.gettingProperty( nodeID, "animationFPS" );
                        }
                    }
                }
                if( threeObject instanceof THREE.PointCloud )
                {
                    var ps = threeObject;
                    var particles = ps.geometry;

                    switch( propertyName ) {
                        case 'emitterSize':
                        case 'emitterType':
                        case 'gravity':
                        case 'gravityCenter':
                        case 'velocityMode':
                        case 'damping':
                        case 'maxRate':
                            ps[propertyName] = propertyValue;
                            if( ps.material == ps.shaderMaterial_analytic ) {
                                ps.rebuildParticles();
                            }
                            break;
                        case 'size':
                            ps[propertyName] = propertyValue;
                            for( var i = 0; i < ps.material.attributes.size.value.length; i++ ) {
                                ps.material.attributes.size.value[i] = propertyValue;
                            }
                            ps.material.attributes.size.needsUpdate = true;
                            break;
                        case 'particleCount':
                            ps.setParticleCount(propertyValue);
                            break;
                        case 'startSize':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.startSize.value = propertyValue;
                            // ps.material.uniforms.startSize.value = propertyValue;
                            break;
                        case 'endSize':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.endSize.value = propertyValue;
                            // ps.material.uniforms.endSize.value = propertyValue;
                            break;
                        case 'sizeRange':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.sizeRange.value = propertyValue;
                            // ps.material.uniforms.sizeRange.value = propertyValue;
                            break;
                        case 'maxSpin':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.maxSpin.value = propertyValue;
                            // ps.material.uniforms.maxSpin.value = propertyValue;
                            break;
                        case 'minSpin':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.minSpin.value = propertyValue;
                            // ps.material.uniforms.minSpin.value = propertyValue;
                            break;
                        case 'textureTiles':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.textureTiles.value = propertyValue;
                            // ps.material.uniforms.textureTiles.value = propertyValue;
                            break;
                        case 'maxOrientation':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.maxOrientation.value = propertyValue;
                            // ps.material.uniforms.maxOrientation.value = propertyValue;
                            break;
                        case 'minOrientation':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.minOrientation.value = propertyValue;
                            // ps.material.uniforms.minOrientation.value = propertyValue;
                            break;
                        case 'colorRange':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.colorRange.value.x = propertyValue[0];
                            ps.shaderMaterial_analytic.uniforms.colorRange.value.y = propertyValue[1];
                            ps.shaderMaterial_analytic.uniforms.colorRange.value.z = propertyValue[2];
                            ps.shaderMaterial_analytic.uniforms.colorRange.value.w = propertyValue[3];
                            break;
                        case 'startColor':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.startColor.value.x = propertyValue[0];
                            ps.shaderMaterial_analytic.uniforms.startColor.value.y = propertyValue[1];
                            ps.shaderMaterial_analytic.uniforms.startColor.value.z = propertyValue[2];
                            ps.shaderMaterial_analytic.uniforms.startColor.value.w = propertyValue[3];
                            break;
                        case 'endColor':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_analytic.uniforms.endColor.value.x = propertyValue[0];
                            ps.shaderMaterial_analytic.uniforms.endColor.value.y = propertyValue[1];
                            ps.shaderMaterial_analytic.uniforms.endColor.value.z = propertyValue[2];
                            ps.shaderMaterial_analytic.uniforms.endColor.value.w = propertyValue[3];
                            break;
                        case 'solver':
                            ps[propertyName] = propertyValue;
                            ps.setSolverType(propertyValue);
                            break;
                        case 'image':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_default.uniforms.texture.value = THREE.ImageUtils.loadTexture(propertyValue);
                            ps.shaderMaterial_default.uniforms.useTexture.value = 1.0;
                            ps.shaderMaterial_analytic.uniforms.texture.value = THREE.ImageUtils.loadTexture(propertyValue);
                            ps.shaderMaterial_analytic.uniforms.useTexture.value = 1.0;
                            break;
                        case 'additive':
                            ps[propertyName] = propertyValue;
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
                                ps.shaderMaterial_default.transparent = true;
                                ps.shaderMaterial_analytic.blending = THREE.NormalBlending; 
                                ps.shaderMaterial_analytic.transparent = true;
                                ps.shaderMaterial_interpolate.blending = THREE.NormalBlending; 
                                ps.shaderMaterial_interpolate.transparent = true;
                            }

                            ps.shaderMaterial_default.needsUpdate = true;   
                            ps.shaderMaterial_analytic.needsUpdate = true;   
                            ps.shaderMaterial_interpolate.needsUpdate = true; 
                            break;
                        case 'depthTest':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_default.depthTest = propertyValue;
                            ps.shaderMaterial_analytic.depthTest = propertyValue;   
                            ps.shaderMaterial_interpolate.depthTest = propertyValue;
                            break;
                        case 'depthWrite':
                            ps[propertyName] = propertyValue;
                            ps.shaderMaterial_default.depthWrite = propertyValue;
                            ps.shaderMaterial_analytic.depthWrite = propertyValue;
                            ps.shaderMaterial_interpolate.depthWrite = propertyValue;
                            break;
                        case 'minAcceleration':
                        case 'maxAcceleration':
                            ps[propertyName] = propertyValue;
                            if(!ps.minAcceleration) ps.minAcceleration = [0,0,0];
                            if(!ps.maxAcceleration) ps.maxAcceleration = [0,0,0];
                            
                            for(var i = 0; i < particles.vertices.length; i++)
                            {
                                particles.vertices[i].acceleration.x = ps.minAcceleration[0] + (ps.maxAcceleration[0] - ps.minAcceleration[0]) * Math.random();
                                particles.vertices[i].acceleration.y = ps.minAcceleration[1] + (ps.maxAcceleration[1] - ps.minAcceleration[1]) * Math.random();
                                particles.vertices[i].acceleration.z = ps.minAcceleration[2] + (ps.maxAcceleration[2] - ps.minAcceleration[2]) * Math.random();
                            }
                            if( ps.material == ps.shaderMaterial_analytic ) {
                                ps.rebuildParticles();
                            }
                            break;
                        case 'minVelocity':
                        case 'maxVelocity':
                            ps[propertyName] = propertyValue;
                            if(!ps.minVelocity) ps.minVelocity = [0,0,0];
                            if(!ps.maxVelocity) ps.maxVelocity = [0,0,0];
                            
                            for(var i = 0; i < particles.vertices.length; i++)
                            {
                                particles.vertices[i].velocity.x = ps.minVelocity[0] + (ps.maxVelocity[0] - ps.minVelocity[0]) * Math.random();
                                particles.vertices[i].velocity.y = ps.minVelocity[1] + (ps.maxVelocity[1] - ps.minVelocity[1]) * Math.random();
                                particles.vertices[i].velocity.z = ps.minVelocity[2] + (ps.maxVelocity[2] - ps.minVelocity[2]) * Math.random();
                            }
                            if( ps.material == ps.shaderMaterial_analytic ) {
                                ps.rebuildParticles();
                            }
                            break;
                        case 'minLifeTime':
                        case 'maxLifeTime':
                            ps[propertyName] = propertyValue;
                            if(ps.minLifeTime === undefined) ps.minLifeTime = 0;
                            if(ps.maxLifeTime === undefined) ps.maxLifeTime = 1;
                            
                            for(var i = 0; i < particles.vertices.length; i++)
                            {   
                                particles.vertices[i].lifespan = ps.minLifeTime + (ps.maxLifeTime - ps.minLifeTime) * Math.random();
                            }
                            break;
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
                                cam.far = threeObject.far;
                                cam.near = threeObject.near;
                                cam.matrix.elements = matCpy(threeObject.matrix.elements);
                                cam.matrixAutoUpdate = false;
                                if ( threeObject.fov )
                                    cam.fov = threeObject.fov;
                                if ( threeObject.aspect )
                                    cam.aspect = threeObject.aspect;  

                                // If the camera we are replacing, is the active camera,
                                // set the active camera  
                                if ( this.state.cameraInUse == threeObject )
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
                                if ( threeObject.fov )
                                    cam.fov = threeObject.fov;
                                if ( threeObject.aspect )
                                    cam.aspect = threeObject.aspect;

                                // If the camera we are replacing, is the active camera, 
                                // set the active camera     
                                if ( this.state.cameraInUse == threeObject )
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
                        if ( propertyValue !== "" && utility.validObject( propertyValue ) )
                        {
                            THREE.ImageUtils.loadTexture( propertyValue, undefined, function( texture ) { 
                                    threeObject.map = texture;
                                    threeObject.needsUpdate = true;                                 
                                }, function( event ) { 
                                    self.logger.warnx( "settingProperty", nodeID, propertyName, propertyValue );
                            } );
                        } else {
                            threeObject.map = null;
                            threeObject.needsUpdate = true;
                        }
                        value = propertyValue;
                        
                    }
                    if(propertyName == "color" || propertyName == "diffuse")
                    {
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                            threeObject.color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                        }
                        threeObject.needsUpdate = true;
                        if ( threeObject.ambient !== undefined ) {
                            threeObject.ambient.setRGB( threeObject.color.r, threeObject.color.g, threeObject.color.b ); 
                        }
                        value = vwfColor.toString();
                    }
                    if ( propertyName == "specColor" ) {
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                          threeObject.specular.setRGB( vwfColor.red( ) / 255, vwfColor.green( ) / 255, vwfColor.blue( ) / 255 );
                          threeObject.needsUpdate = true;
                          value = vwfColor.toString();
                        }
                    }
                    if ( propertyName == "reflect" ) {
                        value = Number( propertyValue );
                        threeObject.reflectivity = value;
                        threeObject.needsUpdate = true;
                    }
                    
                    if ( propertyName == "shininess" ) {
                        value = Number( propertyValue );
                        threeObject.shininess = value;
                        threeObject.needsUpdate = true;
                    }
                    if (propertyName == "bumpScale" ) {
                        value = Number( propertyValue );
                        threeObject.bumpScale = value;
                        threeObject.needsUpdate = true;
                    }
                    if (propertyName == "alphaTest" ) {
                        value = Number( propertyValue );
                        threeObject.alphaTest = value;
                        threeObject.needsUpdate = true;
                    }
                    if ( propertyName == "ambient" ) {
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                          threeObject.ambient.setRGB( vwfColor.red( ) / 255, vwfColor.green( ) / 255, vwfColor.blue( ) / 255 );
                          threeObject.needsUpdate = true;
                          value = vwfColor.toString();
                        }
                    }
                    if ( propertyName == "emit" ) {
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                          threeObject.emissive.setRGB( vwfColor.red( ) / 255, vwfColor.green( ) / 255, vwfColor.blue( ) / 255 );
                          threeObject.needsUpdate = true;
                          value = vwfColor.toString();
                        }
                    }
                    // these properties should possibly be three js specific
                    if(propertyName == "transparent") {
                        value = Boolean( propertyValue );
                        threeObject.transparent = value;
                    }
                    if(propertyName == "opacity") {
                        value = Number( propertyValue );
                        threeObject.opacity = value;
                    }

                }
                if ( threeObject instanceof THREE.ShaderMaterial ) {
                    if ( propertyName === "uniforms" ) {
                        value = propertyValue;
                        threeObject.uniforms = value;
                    }
                    if ( propertyName === "vertexShader" ) {
                        value = propertyValue;
                        threeObject.vertexShader = value;
                    }
                    if ( propertyName === "fragmentShader" ) {
                        value = propertyValue;
                        threeObject.fragmentShader = value;
                    }
                    if ( propertyName === "updateFunction" ) {
                        value = propertyValue;
                        threeObject.updateFunction = value;
                        threeObject.update = function() {
                            eval( this.updateFunction );
                        }
                    }
                }
                if( threeObject instanceof THREE.Scene )
                {
                    if(propertyName == 'activeCamera')
                    {
                        // Update the model's activeCamera
                        this.state.scenes[ this.state.sceneRootID ].camera.ID = propertyValue;
                        value = propertyValue;
                    }
                    if( propertyName == 'ambientColor' )
                    {
                        var lightsFound = 0;
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        
                        if ( vwfColor ) {

                            for( var i = 0; i < threeObject.children.length; i++ )
                            {
                                if( threeObject.children[i] instanceof THREE.AmbientLight )
                                {
                                    threeObject.children[i].color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                                    lightsFound++;
                                }
                            
                            }

                            if ( lightsFound == 0 ) {
                                node.ambientlight = new THREE.AmbientLight( '#000000' );
                                node.ambientlight.color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                                node.threeScene.add( node.ambientlight );
                                this.state.lights[ node.nodeID ] = node.ambientlight;
                            }
                            value = vwfColor.toString();
                        }
                    }

                    // backgroundColor, enableShadows, shadowMapCullFace and shadowMapType are dependent 
                    // on the renderer object, but if they are set in a prototype,
                    // the renderer is not available yet, so store them until it is ready.
                    if ( propertyName == 'backgroundColor' )
                    {
                        if ( node && node.renderer ) {
                            if ( propertyValue instanceof String ) {
                                propertyValue = propertyValue.replace( /\s/g, '' );
                            }
                            var vwfColor = new utility.color( propertyValue );
                            if ( vwfColor ) {
                                node.renderer.setClearColor( vwfColor.getHex(), vwfColor.alpha() );
                                value = vwfColor.toString();
                            }
                        }
                        else if(node) {
                            node.rendererProperties["backgroundColor"] = propertyValue;
                        }
                    }
                    if(propertyName == 'enableShadows')
                    {
                        if ( node && node.renderer ) {
                            value = Boolean( propertyValue );
                            node.renderer.shadowMapEnabled = value;
                        }
                        else if(node) {
                            node.rendererProperties["enableShadows"] = propertyValue;
                        }

                        // Need to reset the viewport or you just get a blank screen
                        this.state.kernel.dispatchEvent( nodeID, "resetViewport" );
                    }
                    if ( propertyName == 'shadowMapCullFace') {
                        var shadowMapCullFace;
                        switch(propertyValue) {
                            case "none":
                                shadowMapCullFace = 0;
                                value = propertyValue;
                                break;
                            case "back":
                                shadowMapCullFace = 1;
                                value = propertyValue;
                                break;
                            case "front":
                                shadowMapCullFace = 2;
                                value = propertyValue;
                                break;
                            case "both":
                                shadowMapCullFace = 3;
                                value = propertyValue;
                                break;
                        }
                        if ( node && node.renderer ) {
                            node.renderer.shadowMapCullFace = shadowMapCullFace;
                        }
                        else if ( node ) {
                            node.rendererProperties["shadowMapCullFace"] = shadowMapCullFace;
                        }
                    }
                    if ( propertyName == 'shadowMapType') {
                        var shadowMapType;
                        switch(propertyValue) {
                            case "basic":
                                shadowMapType = 0;
                                value = propertyValue;
                                break;
                            case "PCF":
                                shadowMapType = 1;
                                value = propertyValue;
                                break;
                            case "PCFSoft":
                                shadowMapType = 2;
                                value = propertyValue;
                                break;
                        }                        
                        if ( node && node.renderer ) {
                            node.renderer.shadowMapType = shadowMapType;
                        }
                        else if ( node ) {
                            node.rendererProperties["shadowMapType"] = shadowMapType;
                        }
                    }
                }   
                if(threeObject instanceof THREE.PointLight || threeObject instanceof THREE.DirectionalLight 
                    || threeObject instanceof THREE.SpotLight || threeObject instanceof THREE.HemisphereLight )
                {
                    if(propertyName == 'lightType')
                    {
                        var newlight;
                        var parent = threeObject.parent;
                        var currProps = {
                            "name": threeObject.name,
                            "distance": threeObject.distance,
                            "color":  threeObject.color,
                            "groundColor": threeObject.groundColor,
                            "intensity": threeObject.intensity,
                            "castShadow": threeObject.castShadow,
                            "shadowCameraLeft": threeObject.shadowCameraLeft,
                            "shadowCameraRight": threeObject.shadowCameraRight,
                            "shadowCameraTop": threeObject.shadowCameraTop,
                            "shadowCameraBottom": threeObject.shadowCameraBottom,
                            "shadowCameraNear": threeObject.shadowCameraNear,
                            "shadowCameraFar": threeObject.shadowCameraFar,
                            "shadowDarkness": threeObject.shadowDarkness,
                            "shadowMapHeight": threeObject.shadowMapHeight,
                            "shadowMapWidth": threeObject.shadowMapWidth,
                            "shadowBias": threeObject.shadowBias,
                            "target": threeObject.target,
                            "clone": function( newObj ) {
                                newObj.name = this.name;
                                newObj.distance = this.distance;
                                //console.info( "light.clone.color = " + JSON.stringify( this.color ) )
                                newObj.color.setRGB( this.color.r, this.color.g, this.color.b );
                                if (this.groundColor !== undefined) {
                                    newObj.groundColor = new THREE.Color().setRGB( this.groundColor.r, this.groundColor.g, this.groundColor.b );
                                }
                                newObj.intensity = this.intensity;
                                newObj.castShadow = this.castShadow;
                                newObj.shadowCameraLeft = this.shadowCameraLeft;
                                newObj.shadowCameraRight = this.shadowCameraRight;
                                newObj.shadowCameraTop = this.shadowCameraTop;
                                newObj.shadowCameraBottom = this.shadowCameraBottom;
                                newObj.shadowCameraNear = this.shadowCameraNear;
                                newObj.shadowCameraFar = this.shadowCameraFar;
                                newObj.shadowDarkness = this.shadowDarkness;
                                newObj.shadowMapHeight = this.shadowMapHeight;
                                newObj.shadowMapWidth = this.shadowMapWidth;
                                newObj.shadowBias = this.shadowBias;
                                newObj.target = this.target;
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
                        if(propertyValue == 'hemisphere' && !(threeObject instanceof THREE.HemisphereLight))
                        {
                            newlight = new THREE.HemisphereLight('FFFFFF','FFFFFF',1);
                            currProps.clone( newlight );                            
                            newlight.matrixAutoUpdate = false;
                            parent.remove( node.threeObject );
                            parent.add( newlight );
                            node.threeObject = newlight;
                            rebuildAllMaterials.call(this);
                        }

                        if ( propertyValue == 'point' || propertyValue == 'directional' || propertyValue == 'spot' || propertyValue == 'hemisphere' ) {
                            value = propertyValue;                        
                        }
                    }
                    //if(propertyName == 'diffuse')
                    //{
                    //    threeObject.color.setRGB(propertyValue[0]/255,propertyValue[1]/255,propertyValue[2]/255);
                    //}
                    else if ( propertyName == 'position' ) {
                        if ( threeObject.position !== null ) {
                            threeObject.position.set( propertyValue[0], propertyValue[1], propertyValue[2] );  
                        }
                    }
                    else if ( propertyName == 'distance' ) {
                        value = Number( propertyValue );
                        threeObject.distance = value;
                    }
                    else if ( propertyName == 'color' ) {
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                            threeObject.color.setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                        }
                        value = vwfColor.toString();
                    }
                    else if ( propertyName == 'groundColor' ) {
                        if ( propertyValue instanceof String ) {
                            propertyValue = propertyValue.replace( /\s/g, '' );
                        }
                        var vwfColor = new utility.color( propertyValue );
                        if ( vwfColor ) {
                            threeObject.groundColor = new THREE.Color().setRGB( vwfColor.red()/255, vwfColor.green()/255, vwfColor.blue()/255 );
                        }
                        value = vwfColor.toString();
                    }
                    else if ( propertyName == 'intensity' ) {
                        value = parseFloat( propertyValue );
                        threeObject.intensity = value;
                    }                    
                    else if ( propertyName == 'castShadows' ) {
                        value = Boolean( propertyValue );
                        threeObject.castShadow = value;
                    }
                    else if ( propertyName == 'shadowCameraBottom' ) {
                        value = Number( propertyValue );
                        threeObject.shadowCameraBottom = value;
                    }
                    else if ( propertyName == 'shadowCameraLeft' ) {
                        value = Number( propertyValue );
                        threeObject.shadowCameraLeft = value;
                    }
                    else if ( propertyName == 'shadowCameraRight' ) {
                        value = Number( propertyValue );
                        threeObject.shadowCameraRight = value;
                    }
                    else if ( propertyName == 'shadowCameraTop' ) {
                        value = Number( propertyValue );
                        threeObject.shadowCameraTop = value;
                    }
                    else if ( propertyName == 'shadowCameraNear' ) {
                        value = Number( propertyValue );
                        threeObject.shadowCameraNear = value;
                    }
                    else if ( propertyName == 'shadowCameraFar' ) {
                        value = Number( propertyValue );
                        threeObject.shadowCameraFar = value;
                    }
                    else if ( propertyName == 'shadowDarkness' ) {
                        value = Number( propertyValue );
                        threeObject.shadowDarkness = value;
                    }
                    else if ( propertyName == 'shadowMapHeight' ) {
                        value = Number ( propertyValue );
                        threeObject.shadowMapHeight = value;
                        if(threeObject.shadowMapSize) {
                            threeObject.shadowMapSize.y = value;
                        }
                        if(threeObject.shadowMap) {
                            threeObject.shadowMap.height = value;
                        }
                    }
                    else if ( propertyName == 'shadowMapWidth' ) {
                        value = Number ( propertyValue );
                        threeObject.shadowMapWidth = value;
                        if(threeObject.shadowMapSize) {
                            threeObject.shadowMapSize.x = value;
                        }
                        if(threeObject.shadowMap) {
                            threeObject.shadowMap.width = value;
                        }
                    }
                    else if ( propertyName == 'shadowBias' ) {
                        value = Number ( propertyValue );
                        threeObject.shadowBias = value;
                    }
                    else if ( propertyName == "target" ) {
                        if ( propertyValue instanceof Array ) {
                            value = propertyValue;
                            threeObject.target.position.set( value[ 0 ], value[ 1 ], value[ 2 ] );
                        } else if ( this.state.nodes[ propertyValue ] ) {
                            value = propertyValue;
                            threeObject.target = this.state.nodes[ value ].threeObject;
                        } else {
                            this.logger.warnx( "settingProperty", "Invalid target: " + propertyValue );
                        }
                    }

                }
            }
            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName ) {

            if ( this.debug.properties || this.debug.getting ) {
                this.logger.infox( "   G === gettingProperty ", nodeID, propertyName );
            }

            var node = this.state.nodes[ nodeID ]; // { name: childName, glgeObject: undefined }
            if(!node) node = this.state.scenes[ nodeID ]; // { name: childName, glgeObject: undefined }
            var value = undefined;

            //this driver has no representation of this node, so there is nothing to do.
            if(!node) return;

            var threeObject = node.threeObject;
            if( !threeObject )
            threeObject = node.threeScene;

            //There is not three object for this node, so there is nothing this driver can do. return
            if(!threeObject) return value;    
          
            if(threeObject instanceof THREE.Object3D)
            {
                if(propertyName == 'transform' && node.transform)
                {
                    value = matCpy( node.transform.elements );
                    return value;
                }
                if(propertyName =='lookAt')
                {
                    value = node.lookatval;
                    return value;
                }                 
                if(propertyName ==  "boundingbox")
                {
                    value = getBoundingBox.call( this, threeObject );
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

                if(propertyName == "animationDuration") {
                    var animationDuration = 0;
                    if(node.threeObject.animations) {
                        for(var i=0, il = node.threeObject.animations.length; i < il; i++) {
                            if(node.threeObject.animations[i].length > animationDuration) {
                                animationDuration = node.threeObject.animations[i].length;
                            }
                        }
                        value = animationDuration;
                    }
                    else if ( node.threeObject.animatedMesh && node.threeObject.animatedMesh.length ) {
                        var fps = this.state.kernel.getProperty( nodeID, "animationFPS") || 30;
                        for(var i=0, il = node.threeObject.animatedMesh.length; i < il; i++) {
                            if (node.threeObject.animatedMesh[i].bones) {
                                
                                // Skeletal animations take precedence over Morph Targets
                                animationDuration = node.threeObject.animatedMesh[i].bones.length;
                            }
                            else if(  node.threeObject.animatedMesh[i].morphTargetInfluences.length > animationDuration ) {
                                
                                animationDuration = node.threeObject.animatedMesh[i].morphTargetInfluences.length;
                            }
                        }
                        value = animationDuration / fps;
                    }

                    return value;
                }

                if(propertyName == "animationFPS") {
                    if(node.threeObject.animations) {
                        var animationDuration = 0;
                        var animationFrameCount = 0;
                        for(var i=0, il = node.threeObject.animations.length; i < il; i++) {
                            for(var i=0, il = node.threeObject.animations.length; i < il; i++) {
                                if(node.threeObject.animations[i].length > animationDuration) {
                                    animationDuration = node.threeObject.animations[i].length;
                                }
                                if(node.threeObject.animations[i].hierarchy[0].keys.length > animationFrameCount) {
                                    animationFrameCount = node.threeObject.animations[i].hierarchy[0].keys.length;
                                }
                            }
                        }
                        value = Math.floor(animationFrameCount / animationDuration);
                    }
                    return value;
                }

                if( propertyName == "visible" ) {
                    value = node.threeObject.visible;
                    return value;
                }
                
                if ( propertyName == "castShadows" ) {
                    value = node.threeObject.castShadow;
                    return value;
                }

                if ( propertyName == "receiveShadows" ) {
                    value = node.threeObject.receiveShadow;
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
                    var vwfColor = new utility.color( [ threeObject.color.r*255, threeObject.color.g*255, threeObject.color.b*255 ] );
                    value = vwfColor.toString();
                    return value;    
                }
                if ( propertyName == "specColor" ) {
                    var vwfColor = new utility.color( [ threeObject.specular.r*255, threeObject.specular.g*255, threeObject.specular.b*255 ] );
                    value = vwfColor.toString();
                    return value;
                }
                if ( propertyName == "reflect" ) {
                    value = threeObject.reflectivity;
                    return value;
                }
                if ( propertyName == "shininess" ) {
                    value = threeObject.shininess;
                    return value;
                }
                if ( propertyName == "emit" ) {
                    var vwfColor = new utility.color( [ threeObject.emissive.r*255, threeObject.emissive.g*255, threeObject.emissive.b*255 ] );
                    value = vwfColor.toString();
                    return value;
                }
                if ( propertyName == "ambient" ) {
                    var vwfColor = new utility.color( [ threeObject.ambient.r*255, threeObject.ambient.g*255, threeObject.ambient.b*255 ] );
                    value = vwfColor.toString();
                    return value;
                }
                if ( ( propertyName == "bumpScale" ) && ( threeObject.bumpMap ) ) {
                    value = threeObject.bumpScale;
                    return value;
                }
                if ( propertyName == "alphaTest" ) {
                    value = threeObject.alphaTest;
                    return value;
                }
                if ( propertyName == "transparent" ) {
                    value = threeObject.transparent;
                    return value;
                }
                if ( propertyName == "opacity" ) {
                    value = threeObject.opacity;
                    return value;
                }
            }
            if ( threeObject instanceof THREE.ShaderMaterial ) {
                if ( propertyName === "uniforms" ) {
                    value = threeObject.uniforms;
                    return value;
                }
                if ( propertyName === "vertexShader" ) {
                    value = threeObject.vertexShader;
                    return value;
                }
                if ( propertyName === "fragmentShader" ) {
                    value = threeObject.fragmentShader;
                    return value;
                }
                if ( propertyName === "updateFunction" ) {
                    value = threeObject.updateFunction;
                    return value;
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
                        for( var i = 0; i < threeObject.children.length && !found; i++ ) {
                            if( threeObject.children[i] instanceof THREE.AmbientLight ) {
                                color = threeObject.children[i].color;
                                vwfColor = new utility.color( [ color.r*255, color.g*255, color.b*255 ] );
                                value = vwfColor.toString();
                                found = true;
                            }
                        }
                        break;
                    case "backgroundColor":
                        if ( node.renderer ) {
                            var color = node.renderer.getClearColor();
                            var alpha = node.renderer.getClearAlpha();
                            if ( alpha !== undefined && alpha != 1 ){
                                vwfColor = new utility.color( [ color.r*255, color.g*255, color.b*255, alpha ] );
                            } else {
                                vwfColor = new utility.color( [ color.r*255, color.g*255, color.b*255 ] );
                            }
                            value = vwfColor.toString();
                        }
                        break;
                    case 'enableShadows':
                        if ( node.renderer ) {
                            value = node.renderer.shadowMapEnabled;
                        }
                        break;
                    case "activeCamera":
                        value = node.camera.ID;
                        break;
                    case "shadowMapCullFace":
                        if ( node.renderer ) {
                            value = node.renderer.shadowMapCullFace;
                        }
                        break;
                    case "shadowMapType":
                        if ( node.renderer ) {
                            value = node.renderer.shadowMapType;
                        }
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
                        } else if ( threeObject instanceof THREE.HemisphereLight ) {
                            value = 'hemisphere';
                        } else {
                            value = 'point';
                        }
                        break;
                    case "position":
                        if ( threeObject.position !== null ) {
                            value = [ threeObject.position.x, threeObject.position.y, threeObject.position.z ];  
                        }
                        break;

                    case "distance":
                        value = threeObject.distance;
                        break;
                    case "color":
                        var clr = new utility.color( [ threeObject.color.r * 255, threeObject.color.g * 255, 
                                                       threeObject.color.b * 255 ] ) 
                        value = clr.toString();
                        break;
                    case "groundColor":
                        var clr = new utility.color( [ threeObject.groundColor.r * 255, threeObject.groundColor.g * 255, 
                                                       threeObject.groundColor.b * 255 ] ) 
                        value = clr.toString();
                        break;
                    case "intensity":
                        value = threeObject.intensity;
                        break;
                    case "castShadows":
                        value = threeObject.castShadow;
                        break;
                    case "shadowCameraBottom":
                        value = threeObject.shadowCameraBottom;
                        break;
                    case "shadowCameraLeft": 
                        value = threeObject.shadowCameraLeft;
                        break;
                    case "shadowCameraRight": 
                        value = threeObject.shadowCameraRight;
                        break;
                    case "shadowCameraTop": 
                        value = threeObject.shadowCameraTop;
                        break;
                    case "shadowCameraNear":
                        value = threeObject.shadowCameraNear;
                        break;
                    case "shadowCameraFar":
                        value = threeObject.shadowCameraFar;
                        break;
                    case "shadowDarkness":
                        value = threeObject.shadowDarkness;
                        break;
                    case "shadowMapHeight":
                        value = threeObject.shadowMapHeight;
                        break;
                    case "shadowMapWidth":
                        value = threeObject.shadowMapWidth;
                        break;
                    case "shadowBias":
                        value = threeObject.shadowBias;
                        break;
                    case "target":
                        // TODO: Return target node information if target is a node.
                        //   The threeObjects of some nodes do not have a vwfID. This
                        //   will incorrectly return a position in those cases. This
                        //   needs to be fixed.
                        if ( threeObject.target.vwfID !== undefined ) {
                            value = threeObject.target.vwfID;
                        } else {
                            var targetPos = [ threeObject.target.position.x,
                                              threeObject.target.position.y,
                                              threeObject.target.position.z ];
                            value = targetPos;
                        }
                        break;
                }
            }
            return value;
        },


        // TODO: deletingMethod

        // -- callingMethod --------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, parameters /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters

            if ( methodName === "raycast" ) {

                var origin, direction, near, far, recursive, objectIDs;

                if ( parameters ) {

                    if ( parameters[0] instanceof THREE.Vector3 ) {

                        origin = parameters[0];

                    } else if ( parameters[0] instanceof Array && parameters[0].length === 3 ) {

                        var x, y, z;
                        x = isNaN( parameters[0][0] ) ? 0 : parameters[0][0];
                        y = isNaN( parameters[0][1] ) ? 0 : parameters[0][1];
                        z = isNaN( parameters[0][2] ) ? 0 : parameters[0][2];
                        origin = new THREE.Vector3( x, y, z );

                    } else {

                        origin = new THREE.Vector3();

                    }

                    if ( parameters[1] instanceof THREE.Vector3 ) {

                        direction = parameters[1];

                    } else if ( parameters[1] instanceof Array && parameters[1].length === 3 ) {

                        var x, y, z;
                        x = isNaN( parameters[1][0] ) ? 0 : parameters[1][0];
                        y = isNaN( parameters[1][1] ) ? 0 : parameters[1][1];
                        z = isNaN( parameters[1][2] ) ? 0 : parameters[1][2];
                        direction = new THREE.Vector3( x, y, z );

                    } else {

                        direction = new THREE.Vector3();
                        
                    }

                    near = isNaN( parameters[2] ) ? 0 : parameters[2];
                    far = isNaN( parameters[3] ) ? Infinity : parameters[3];
                    recursive = typeof parameters[4] === "boolean" ? parameters[4] : false;

                    if ( parameters[5] instanceof Array ) {

                        objectIDs = parameters[5];

                    } else if ( typeof parameters[5] === "string" ) {

                        objectIDs = new Array();
                        objectIDs.push( parameters[5] );

                    } else {

                        objectIDs = null;
                    }

                } else {

                    origin = new THREE.Vector3();
                    direction = new THREE.Vector3();
                    near = 0;
                    far = Infinity;
                    recursive = false;
                    objectIDs = null;

                }

                var objects = new Array();

                if ( objectIDs !== null ) {

                    for ( var i = 0; i < objectIDs.length; i++ ) {

                        var object = this.state.nodes[ objectIDs[i] ];

                        if ( object !== undefined && object.threeObject !== undefined ) {

                            objects.push( object.threeObject );

                        }

                    }

                } else {

                    for ( nodeID in this.state.nodes ) {

                        var object = this.state.nodes[ nodeID ];

                        if ( object.threeObject !== undefined ) {

                            objects.push( object.threeObject );

                        }

                    }

                }

                var raycaster = new THREE.Raycaster( origin, direction, near, far );
                var intersects = raycaster.intersectObjects( objects, recursive );
                return intersects;

            }

            return undefined;
        },


        // TODO: creatingEvent, deltetingEvent, firingEvent

        // -- executing ------------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
            return undefined;
        },

        // == ticking =============================================================================

        ticking: function( vwfTime ) {
            
            if ( checkLights && this.state.appInitialized && sceneCreated ) {
                
                var lightsInScene = sceneLights.call( this );

                createDefaultLighting.call( this, lightsInScene );
                checkLights = false;    
            }
        }

    } );

    // == PRIVATE  ========================================================================================

    function checkCompatibility() {
        this.compatibilityStatus = { compatible:true, errors:{} }
        var contextNames = ["webgl","experimental-webgl","moz-webgl","webkit-3d"];
        for(var i = 0; i < contextNames.length; i++){
            try{
                var canvas = document.createElement('canvas');
                var gl = canvas.getContext(contextNames[i]);
                if(gl){
                    return true;
                }
            }
            catch(e){}
        }
        this.compatibilityStatus.compatible = false;
        this.compatibilityStatus.errors["WGL"] = "This browser is not compatible. The vwf/view/threejs driver requires WebGL.";
        return false;
    }

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function getThreeScene( id ) {
        if ( id === undefined ) {
            id = this.kernel.application();
        }
        if ( this.state.scenes[ id ] ) {
            return this.state.scenes[ id ].threeScene;
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
    function isShaderMaterialDefinition( prototypes ) {
        var foundMaterial = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundMaterial; i++ ) {
                foundMaterial = ( prototypes[i] == "http-vwf-example-com-shaderMaterial-vwf" );    
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

    function isCubeDefinition( prototypes ) {
        var foundNode = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundNode; i++ ) {
                foundNode = ( prototypes[i] == "http-vwf-example-com-threejs-cube-vwf" );    
            }
        }
        return foundNode;
    }
    function isCircleDefinition( prototypes ) {
        var foundNode = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundNode; i++ ) {
                foundNode = ( prototypes[i] == "http-vwf-example-com-threejs-circle-vwf" );    
            }
        }
        return foundNode;
    }
    function isPlaneDefinition( prototypes ) {
        var foundNode = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundNode; i++ ) {
                foundNode = ( prototypes[i] == "http-vwf-example-com-threejs-plane-vwf" );    
            }
        }
        return foundNode;
    }
    function isSphereDefinition( prototypes ) {
        var foundNode = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundNode; i++ ) {
                foundNode = ( prototypes[i] == "http-vwf-example-com-threejs-sphere-vwf" );    
            }
        }
        return foundNode;
    }
    function isCylinderDefinition( prototypes ) {
        var foundNode = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundNode; i++ ) {
                foundNode = ( prototypes[i] == "http-vwf-example-com-threejs-cylinder-vwf" );    
            }
        }
        return foundNode;
    }
    function isTextDefinition( prototypes ) {
        var foundNode = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundNode; i++ ) {
                foundNode = ( prototypes[i] == "http-vwf-example-com-threejs-text-vwf" );    
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
        node.rendererProperties = {};
        
        return node;
    }
    
    function nameTest( obj, name ) {
        if ( obj.name == "" ) {
            return ( obj.parent.name+"Child" == name );
        } else {
            return ( obj.name == name || obj.id == name || obj.vwfID == name );
        }
    }

    // Changing this function significantly from the GLGE code
    // Will search hierarchy down until encountering a matching child
    // Will look into nodes that don't match.... this might not be desirable
    function FindChildByName( obj, childName, childType, recursive ) {
        
        var child = undefined;
        if ( recursive ) {

            // TODO: If the obj itself has the child name, the object will be returned by this function
            //       I don't think this this desirable.

            if( nameTest.call( this, obj, childName ) ) {
                child = obj;
            } else if ( obj.children && obj.children.length > 0) {
                for( var i = 0; i < obj.children.length && child === undefined; i++ ) {
                    child = FindChildByName( obj.children[i], childName, childType, true );
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

    function getThreeObject( ID ) {
        var threeObject = undefined;
        var node = this.state.nodes[ ID ]; // { name: childName, glgeObject: undefined }
        if( node === undefined ) node = this.state.scenes[ ID ]; // { name: childName, glgeObject: undefined }

        if( node ) {
            threeObject = node.threeObject;
            if( !threeObject )
                threeObject = node.threeScene;
        }

        return threeObject;
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

    function createLightContainer() {
        return { 
                    "ambientLights": [], 
                    "directionalLights": [],
                    "spotLights": [],
                    "pointLights": []
                }; 
    }

    function findAllLights( threeObject, lights ) {
        
        if( !threeObject ) 
            return;

        if ( threeObject instanceof THREE.DirectionalLight )
            lights.directionalLights.push( threeObject );
        else if ( threeObject instanceof THREE.SpotLight )
            lights.spotLights.push( threeObject );
        else if ( threeObject instanceof THREE.PointLight ) 
            lights.pointLights.push( threeObject );
        else if ( threeObject instanceof THREE.AmbientLight ) 
            lights.ambientLights.push( threeObject );

        if( threeObject.children ) {
            for ( var i = 0; i < threeObject.children.length; i++) {
                findAllLights( threeObject.children[ i ], lights );
            }
        }
        return lights;    
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
            matrix = matrix.multiplyMatrices(mat,matrix);
            parent = parent.parent;
        }
        var mat = new THREE.Matrix4();
            mat.copy(threeObject.matrix);
        matrix = matrix.multiplyMatrices(mat,matrix);
        var ret = [];
        for(var i = 0; i < mesh.geometry.vertices.length; i++)
        {
            var vert = new THREE.Vector3();
            vert.copy(mesh.geometry.vertices[i]);
            vert.applyMatrix4( matrix );
            ret.push([vert.x,-vert.y,vert.z]);

        }
        return ret;
    }
    
    function GetAllMaterials( threeObject ) {
        var result = [];
        var resultUUID = [];
        if ( !threeObject ) {
          return result;
        }
        if ( threeObject && threeObject.material ) {
            if ( ( threeObject.material instanceof THREE.Material ) && ( resultUUID.indexOf( threeObject.material.uuid ) < 0 ) ) {
                result.push( threeObject.material );
                resultUUID.push( threeObject.material.uuid );
            }
            else if ( threeObject.material instanceof THREE.MeshFaceMaterial ) {
                if ( threeObject.material.materials ) {
                    for ( var index = 0; index < threeObject.material.materials.length; index++ ) {
                        if ( ( threeObject.material.materials[ index ] instanceof THREE.Material ) && ( resultUUID.indexOf( threeObject.material.materials[ index ].uuid ) < 0 ) ) {
                            result.push( threeObject.material.materials[ index ] );
                            resultUUID.push( threeObject.material.materials[ index ].uuid );
                        }
                    }
                }
            }
        }
        
        if ( threeObject && threeObject.children ) {
            for ( var index = 0; index < threeObject.children.length; index++ ) {
                var childrenMaterials = GetAllMaterials( threeObject.children[ index ] );
                for ( var subindex = 0; subindex < childrenMaterials.length; subindex++ ) {
                    if ( resultUUID.indexOf( childrenMaterials[ subindex ].uuid ) < 0 ) {
                        result.push( childrenMaterials[ subindex ] );
                        resultUUID.push( childrenMaterials[ subindex ].uuid );
                    }
                }
            }
        }
        return result;
    }
    //do a depth first search of the children, return the first material
    function GetMaterial(threeObject, optionalName)
    {        
        //something must be pretty seriously wrong if no threeobject
        if(!threeObject)
        {
            return null;
        }
        var allMaterialChildren = GetAllMaterials( threeObject );
                
        if ( optionalName ) {
            var regExResult = optionalName.match(/^material_\d+_/);
            if ( regExResult ) {
                var updatedName = optionalName.slice( regExResult[ 0 ].length );
                var firstMatch = undefined;
                var nameIndex = parseInt( optionalName.slice( 9, regExResult[ 0 ].length - 1 ) );
                var foundIndex = 0;
                for ( var index = 0; index < allMaterialChildren.length; index++ ) {
                    if ( allMaterialChildren[ index ].name == updatedName ) {
                        if ( ! firstMatch ) {
                            firstMatch = allMaterialChildren[ index ];
                        }
                        foundIndex++;
                        if ( foundIndex == nameIndex ) {
                            return allMaterialChildren[ index ];
                        }
                    }
                }
                if ( firstMatch ) {
                    return firstMatch;
                }
            }
            for ( var index = 0; index < allMaterialChildren.length; index++ ) {
                if ( allMaterialChildren[ index ].name == optionalName ) {
                    return allMaterialChildren[ index ];
                }
            }
        }
        if ( allMaterialChildren.length > 0 ) {
            return allMaterialChildren[ 0 ];
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
       
        if ( mesh.geometry instanceof THREE.BufferGeometry ) {
            return;
        }
        var geometry = mesh.geometry;
        if ( !geometry.faceVertexUvs[ 0 ] ) {
            geometry.faceVertexUvs[ 0 ] = [];
        }
        if ( geometry.faceVertexUvs[ 0 ].length === 0 ) {
            for ( var i = 0; i < geometry.faces.length; i++ ) {
                var face = geometry.faces[ i ];
                if ( face instanceof THREE.Face4 ) {
                    geometry.faceVertexUvs[0].push( [ new THREE.Vector2( 0, 1 ),
                                                      new THREE.Vector2( 0, 1 ),
                                                      new THREE.Vector2( 0, 1 ), 
                                                      new THREE.Vector2( 0, 1 ) 
                                                    ] );
                } else if ( face instanceof THREE.Face3 ) {
                    geometry.faceVertexUvs[0].push( [ new THREE.Vector2( 0, 1 ), 
                                                      new THREE.Vector2( 0, 1 ),
                                                      new THREE.Vector2( 0, 1 ) 
                                                    ] );
                }
            }
        }
         
        geometry.computeCentroids && geometry.computeCentroids();
        geometry.computeFaceNormals && geometry.computeFaceNormals();
        geometry.computeVertexNormals && geometry.computeVertexNormals();
        geometry.uvsNeedUpdate = true;

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
    function createMesh( node, meshDef, doubleSided ) {
        if ( node.threeObject && node.threeObject instanceof THREE.Object3D ) {
            var i, face, geo, sides;
            var materials = undefined;
            var vwfColor, colorValue = 0xFFFFFF;    
            if ( meshDef.color !== undefined ) {
                vwfColor = new utility.color( meshDef.color );
                if ( vwfColor ) {
                    colorValue = vwfColor._decimal;
                }
            }
            var mat = new THREE.MeshLambertMaterial( { "color": colorValue, "ambient": colorValue } );
           
            if ( isCubeDefinition.call( this, node.prototypes ) ) {
                // materials = ??
                sides = meshDef.sides || { px: true, nx: true, py: true, ny: true, pz: true, nz: true };
                geo = new THREE.CubeGeometry( meshDef.width || 10, meshDef.height || 10, meshDef.depth || 10, 
                    meshDef.segmentsWidth || 1, meshDef.segmentsHeight || 1, meshDef.segmentsDepth || 1,
                    materials, sides );
            } else if ( isPlaneDefinition.call( this, node.prototypes ) ) {
                geo = new THREE.PlaneGeometry( meshDef.width || 1, meshDef.height || 1,
                    meshDef.segmentsWidth || 1, meshDef.segmentsHeight || 1 );
            } else if ( isCircleDefinition.call( this, node.prototypes ) ) {
                geo = new THREE.CircleGeometry( meshDef.radius || 10, 
                    meshDef.segments || 8, meshDef.thetaStart || 0, 
                    meshDef.thetaLength || Math.PI * 2 );
            } else if ( isSphereDefinition.call( this, node.prototypes ) ) {
                geo = new THREE.SphereGeometry( meshDef.radius || 10, meshDef.segmentsWidth || 8,
                    meshDef.segmentsHeight || 6, meshDef.phiStart || 0,
                    meshDef.phiLength || Math.PI * 2, meshDef.thetaStart || 0, 
                    meshDef.thetaLength || Math.PI );
            } else if ( isCylinderDefinition.call( this, node.prototypes ) ) {
                geo = new THREE.CylinderGeometry( meshDef.radiusTop || 10, meshDef.radiusBottom || 10,
                     meshDef.height || 10, meshDef.segmentsRadius || 8, 
                     meshDef.segmentsHeight || 1, meshDef.openEnded );
            } else if ( isTextDefinition.call( this, node.prototypes ) ) {
                if ( meshDef.text != "" ) {
                    var parms = meshDef.parameters || {};
                    geo = new THREE.TextGeometry( meshDef.text, { "size": parms.size || 100,
                        "curveSegments": parms.curveSegments || 4, "font": parms.font || "helvetiker",
                        "weight": parms.weight || "normal", "style": parms.style || "normal",
                        "amount": parms.amount || 50, "height": parms.height || 50, 
                        "bevelThickness": parms.bevelThickness || 10, "bevelSize": parms.bevelSize || 8,
                        "bevelEnabled": Boolean( parms.bevelEnabled ),
                    } );
                    // geo = new THREE.TextGeometry( meshDef.text, {
                    //     size: 80,
                    //     height: 20,
                    //     curveSegments: 2,
                    //     font: "helvetiker"
                    // } );
                }
            } else {
                geo = new THREE.Geometry();

                for ( i = 0; geo.vertices && meshDef.positions && ((i*3) < meshDef.positions.length); i++ ) {
                    //console.info( "     adding vertices: [" + (meshDef.positions[i*3]) + ", " + (meshDef.positions[i*3+1]) + ", "+ (meshDef.positions[i*3+2]) + " ]" )
                    geo.vertices.push( new THREE.Vector3( meshDef.positions[i*3], meshDef.positions[i*3+1],meshDef.positions[i*3+2] ) );   
                }
                for ( i = 0; geo.faces && meshDef.faces && ( (i*3) < meshDef.faces.length ); i++ ) {
                    //console.info( "     adding face: [" + (meshDef.faces[i*3]) + ", " + (meshDef.faces[i*3+1]) + ", "+ (meshDef.faces[i*3+2]) + " ]" );
                    face = new THREE.Face3( meshDef.faces[i*3], meshDef.faces[i*3+1],meshDef.faces[i*3+2] );
                    geo.faces.push( face );
                    if ( doubleSided ) {
                        //console.info( "     adding face: [" + (meshDef.faces[i*3+2]) + ", " + (meshDef.faces[i*3+1]) + ", "+ (meshDef.faces[i*3]) + " ]" );
                        face = new THREE.Face3( meshDef.faces[i*3+2], meshDef.faces[i*3+1],meshDef.faces[i*3] );
                        geo.faces.push( face );
                    }
                } 
                // TODO: needed doubleSided support for normals
                for ( i = 0 ; geo.faces && meshDef.normals && i < geo.faces.length; i++ ) {
                    face = geo.faces[ i ];
                    //console.info( "     adding face normal: [" + (meshDef.normals[i*3]) + ", " + (meshDef.normals[i*3+1]) + ", "+ (meshDef.normals[i*3+2]) + " ]" );
                    face.vertexNormals.push( new THREE.Vector3( meshDef.normals[i*3], meshDef.normals[i*3+1],meshDef.normals[i*3+2] ) );   
                }
                for ( i = 0; geo.faceVertexUvs && meshDef.uv1 && i < meshDef.uv1.length; i++ ) {
                    //console.info( "     adding face vertex uv: [" + (meshDef.uv1[i*2]) + ", " + (meshDef.uv1[i*2+1]) + " ]" );
                    geo.faceVertexUvs.push( new THREE.Vector2( meshDef.uv1[i*2], meshDef.uv1[i*2+1] ) );   
                }   
            }
            if ( geo !== undefined ) {
                var mesh = new THREE.Mesh( geo, mat );

                // The child mesh is created after the properties have been initialized, so copy
                // the values of cast and receive shadow so they match
                mesh.castShadow = node.threeObject.castShadow;
                mesh.receiveShadow = node.threeObject.receiveShadow;

                node.threeObject.add( mesh ); 
                
                //geo.computeCentroids();
                geo.computeFaceNormals && geo.computeFaceNormals();                
            }

        }         
    }

    //walk the graph of an object, and set all materials to new material clones
    function cloneMaterials( nodein ) {
	
		    //sort the materials in the model, and when cloneing, make the new model share the same material setup as the old.
	    	var materialMap = {};
	
        walkGraph( nodein, function( node ) {
            if(node.material) {
                if ( node.material instanceof THREE.Material ) {
                    if(!materialMap[node.material.uuid]) {
                				materialMap[node.material.uuid] = [];
                    }
			       			  materialMap[node.material.uuid].push( [ node, -1 ] );
                }
                else if ( node.material instanceof THREE.MeshFaceMaterial ) {
                    if ( node.material.materials ) {
                        for ( var index = 0; index < node.material.materials.length; index++ ) {
                            if ( node.material.materials[ index ] instanceof THREE.Material ) {
                                if(!materialMap[node.material.materials[ index ].uuid]) {
                				            materialMap[node.material.materials[ index ].uuid] = [];
                                }
			       	            		  materialMap[node.material.materials[ index ].uuid].push( [ node, index ] );
                            }
                        }
                    }
                }              
            }
        });
		
		    for(var i in materialMap)
    		{
		    	  var newmat;
            if ( materialMap[ i ][ 0 ][ 1 ] < 0 ) {
                newmat = materialMap[ i ][ 0 ][ 0 ].material.clone( );
            }
            else {
                newmat = materialMap[ i ][ 0 ][ 0 ].material.materials[ materialMap[ i ][ 0 ][ 1 ] ].clone( );
            }
			      for ( var j =0; j < materialMap[i].length; j++ ) {
                if ( materialMap[ i ][ j ][ 1 ] < 0 ) {
    			     	    materialMap[ i ][ j ][ 0 ].material = newmat;
                }
                else {
                    materialMap[ i ][ j ][ 0 ].material.materials[ materialMap[ i ][ j ][ 1 ] ] = newmat;
                }
            }
		    }
    }

    function loadAsset( parentNode, node, childType, propertyNotifyCallback ) {

        var nodeCopy = node; 
        var nodeID = node.ID;
        var childName = node.name;
        var threeModel = this;
        var sceneNode = this.state.scenes[ this.state.sceneRootID ];
        var parentObject3 = parentNode.threeObject ? parentNode.threeObject : parentNode.threeScene;
        //console.info( "---- loadAsset( "+parentNode.name+", "+node.name+", "+childType+" )" );

        node.assetLoaded = function( geometry , materials) { 
            //console.info( "++++ assetLoaded( "+parentNode.name+", "+node.name+", "+childType+" )" );
            sceneNode.pendingLoads--;
            var removed = false;
            
            // THREE JSON model
            if ( childType == "model/x-threejs-morphanim+json" || childType == "model/x-threejs-skinned+json" ) {

                for ( var i = 0; i < materials.length; i++ ) {
                    
                    var m = materials[ i ];
                    
                    // Do we have Morph Target animations?
                    if ( geometry.morphTargets.length > 0 ) {
                        m.morphTargets = true;
                    }

                    // Do we have skeletal animations?
                    if ( geometry.animation ) {
                        m.skinning = true;
                    }
                }
                
                var meshMaterial;
                if ( materials.length > 1 ) {

                    // THREE.MeshFaceMaterial for meshes that have multiple materials
                    meshMaterial = new THREE.MeshFaceMaterial( materials );

                } else {

                    // This mesh has only one material
                    meshMaterial = materials[ 0 ];
                }

                if ( childType == "model/x-threejs-morphanim+json" ) {
                    var asset = new THREE.MorphAnimMesh( geometry, meshMaterial );
                
                } else {  // childType == "model/x-threejs-skinned+json"

                    // THREE.AnimationHandler had a couple of methods
                    // depricated, check THREE.UCSCharacter

                    //  THREE.AnimationHandler.add( geometry.animation );   
                    var asset = new THREE.SkinnedMesh( geometry, meshMaterial );
                    var skinnedAnimation = new THREE.Animation( asset, geometry.animation ); 
                    skinnedAnimation.play();
                }

                asset.updateMatrix();

            } else {  // Collada model
                var asset = geometry;
            }
         
            var keyframeAnimations, animatedMesh;
            if ( asset.animations && asset.animations.length > 0 ) {
                keyframeAnimations = asset.animations;
            }

            if ( asset.scene ) {
                asset = asset.scene;
            }

            var meshes = [];
            GetAllLeafMeshes( asset, meshes );

            for ( var i = 0; i < meshes.length; i++ ) {
                if ( meshes[ i ].material.map != null ) {
                    fixMissingUVs( meshes[ i ] );
                }
            }
            
            asset.updateMatrixWorld();
            
            asset.matrix = new THREE.Matrix4();
            asset.matrixAutoUpdate = false;
            
            // Don't make a copy of the three object if there are keyframe or skeletal animations associated with it
            // until we figure out a way to copy them successfully.
            if ( keyframeAnimations || skinnedAnimation ) {
                nodeCopy.threeObject = asset;
            }
            else {
                nodeCopy.threeObject = asset.clone();
            }
            
            //make sure that the new object has a unique material
            cloneMaterials( nodeCopy.threeObject );

            //find and bind the animations
            //NOTE: this would probably be better handled by walking and finding the animations and skins only on the 
            //property setter when needed.
		
            animatedMesh = [];
            walkGraph(nodeCopy.threeObject,function( node ){
                if( node instanceof THREE.SkinnedMesh  || node instanceof THREE.MorphAnimMesh ) {
                    animatedMesh.push( node );
                }
            });
            nodeCopy.threeObject.animatedMesh = animatedMesh;
            nodeCopy.threeObject.updateMatrixWorld();
            
            removeAmbientLights.call( this, nodeCopy.threeObject );

            parentObject3.add( nodeCopy.threeObject );
            nodeCopy.threeObject.name = childName;
            nodeCopy.threeObject.vwfID = nodeID;
            nodeCopy.threeObject.matrixAutoUpdate = false;

            if( keyframeAnimations ) {
                //var animHandler = THREE.AnimationHandler;
                nodeCopy.threeObject.kfAnimations = [];
                nodeCopy.threeObject.animations = keyframeAnimations;

                // Initialize the key frame animations
                for ( var i = 0; i < keyframeAnimations.length; i++ ) {
                    var animation = keyframeAnimations[ i ];

                    if ( !animation.node ) {
                        continue;
                    }

                    // Save references to the animations on the node that is animated, so that it can play separately
                    if( animation.node.animations == undefined ) {
                        animation.node.animations = [];
                    }
                    if( animation.node.kfAnimations == undefined ) {
                        animation.node.kfAnimations = [];
                    }
                    animation.node.animations.push( animation );
                    
                    // add has been depricated
                    //animHandler.add( animation );
                    //var kfAnimation = new THREE.KeyFrameAnimation( animation.node, animation.name );

                    var kfAnimation = new THREE.KeyFrameAnimation( animation );

                    kfAnimation.timeScale = 1;
                    nodeCopy.threeObject.kfAnimations.push( kfAnimation );
                    animation.node.kfAnimations.push( kfAnimation );
                    for ( var h = 0; h < kfAnimation.hierarchy.length; h++ ) {
                        var keys = kfAnimation.data.hierarchy[ h ].keys;
                        var sids = kfAnimation.data.hierarchy[ h ].sids;
                        var obj = kfAnimation.hierarchy[ h ];

                        if ( keys.length && sids ) {
                            for(var s = 0; s < sids.length; s++) {
                                var sid = sids[s];
                                var next = kfAnimation.getNextKeyWith(sid, h, 0);
                                if(next) next.apply(sid);
                            }
                            obj.matrixAutoUpdate = false;
                            kfAnimation.data.hierarchy[h].node.updateMatrix();
                            obj.matrixWorldNeedsUpdate = true;
                        }
                    }
                    kfAnimation.play(false, 0);
                }
            }
            if(animatedMesh) {
                nodeCopy.threeObject.animatedMesh = animatedMesh;
            }
            
            // remember that this was a loaded collada file
            nodeCopy.threeObject.loadedColladaNode = true;

            for ( var j = 0; j < sceneNode.srcAssetObjects.length; j++ ) {
                if ( sceneNode.srcAssetObjects[j] == nodeCopy ){
                    sceneNode.srcAssetObjects.splice( j, 1 );
                    removed = true;
                }
            } 

            if ( node.threeObject )
            {

                // Add a local model-side transform that can stay pure even if the view changes the
                // transform on the threeObject - this already happened in creatingNode for those nodes that
                // didn't need to load a model
                node.transform = new THREE.Matrix4();
                node.transform.elements = matCpy( node.threeObject.matrix.elements );

                // If this threeObject is a camera, it has a 90-degree rotation on it to account for the 
                // different coordinate systems of VWF and three.js.  We need to undo that rotation before 
                // setting the VWF property.
                if ( node.threeObject instanceof THREE.Camera ) {
                    
                    var transformArray = node.transform.elements;

                    // Get column y and z out of the matrix
                    var columny = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn( transformArray, 1, columny );
                    var columnz = goog.vec.Vec4.create();
                    goog.vec.Mat4.getColumn( transformArray, 2, columnz );

                    // Swap the two columns, negating columny
                    goog.vec.Mat4.setColumn( transformArray, 1, goog.vec.Vec4.negate( columnz, columnz ) );
                    goog.vec.Mat4.setColumn( transformArray, 2, columny );
                }
            }

            // Since prototypes are created before the object, it does not get "setProperty" updates for
            // its prototype (and behavior) properties.  Therefore, we cycle through those properties to
            // notify the drivers of the property values so they can react accordingly
            // TODO: Have the kernel send the "setProperty" updates itself so the driver need not
            propertyNotifyCallback();

            // let vwf know the asset is loaded 
            if ( nodeCopy.loadingCallback ) {

                //console.info( "========= LOADED ========== "+node.name+" ========= LOADED ==========" );
                nodeCopy.loadingCallback( true );                    
            }

            //get the entry from the asset registry
            reg = threeModel.assetRegistry[nodeCopy.source];
            
            // If there are animations, set loaded to false and don't store the asset
            // in the registry, since the animations don't work with the copy process
            if(keyframeAnimations) {
                reg.pending = false;
                reg.loaded = false;
            }
            else {
                //it's not pending, and it is loaded
                reg.pending = false;
                reg.loaded = true;
                
                //store this asset in the registry
                reg.node = asset;
            }
            
            //if any callbacks were waiting on the asset, call those callbacks
            for( var i = 0; i < reg.callbacks.length; i++ ) {
                reg.callbacks[i]( asset );
            }
            
            //nothing should be waiting on callbacks now.  
            reg.callbacks = [];  
            
        }
        node.name = childName;
      
        //create an asset registry if one does not exist for this driver
        if( !this.assetRegistry ) {
            this.assetRegistry = {};
        }
        
        // if there is no entry in the registry, create one
        if( !this.assetRegistry[node.source] ) {
            
            //it's new, so not waiting, and not loaded
            this.assetRegistry[node.source] = {};
            this.assetRegistry[node.source].loaded = false;
            this.assetRegistry[node.source].pending = false;
            this.assetRegistry[node.source].callbacks = [];
        }
        
        //grab the registry entry for this asset
        var reg = this.assetRegistry[node.source];
        
        //if the asset entry is not loaded and not pending, you'll have to actually go download and parse it
        if( reg.loaded == false && reg.pending == false ) {
            
            //thus, it becomes pending
            reg.pending = true;
            
            sceneNode.srcAssetObjects.push( node.threeObject );
            
            //node.threeObject.vwfID = nodeID;
            sceneNode.pendingLoads++;
          
            //call up the correct loader/parser
            if( childType == "model/vnd.collada+xml" ) {
                node.parse = true;
                node.loader = new THREE.ColladaLoader();
                node.loader.options.convertUpAxis = true;
                node.loader.options.upAxis = "Z";
                node.loader.load(node.source,node.assetLoaded.bind( this ));
            }
          
            if( childType == "model/vnd.osgjs+json+compressed" ) {
                node.loader = new UTF8JsonLoader( node,node.assetLoaded.bind( this ) );
            }

            if( childType == "model/x-threejs-morphanim+json" || childType == "model/x-threejs-skinned+json" ) {
                node.loader = new THREE.JSONLoader()
                node.loader.load( node.source, node.assetLoaded.bind( this ) );
            }
                                    
            if( childType == "model/vnd.gltf+json" )
            {
             
                //create a queue to hold requests to the loader, since the loader cannot be re-entered for parallel loads
                if ( !THREE.glTFLoader.queue )
                {
                    //task is an object that holds the info about what to load
                    //nextTask is supplied by async to trigger the next in the queue
                    THREE.glTFLoader.queue = new async.queue( function( task, nextTask ) {
                        var node = task.node;
                        var cb = task.cb;
                        //call the actual load function
                        //signature of callback dictated by loader
                        node.loader.load( node.source, function( geometry , materials ) {
                            //ok, this model loaded, we can start the next load
                            nextTask();
                            //do whatever it was (asset loaded) that this load was going to do when complete
                            cb( geometry , materials );
                        } );

                    }, 1 );
                }
                node.loader = new THREE.glTFLoader();
                node.loader.useBufferGeometry = true;
                //we need to queue up our entry to this module, since it cannot handle re-entry. This means that while it 
                //is an async function, it cannot be entered again before it completes
                THREE.glTFLoader.queue.push( { 
                    node: node,
                    cb: node.assetLoaded.bind( this ) 
                } );
            }
        }

        //if the asset registry entry is not pending and it is loaded, then just grab a copy, 
        //no download or parse necessary
        else if( reg.loaded == true && reg.pending == false ) {
            var asset = (reg.node.clone());
		
            // make sure the materails are unique
            cloneMaterials( asset );
            
            var n = asset;
            var skins = [];
            walkGraph( n, function( node ) {
                if( node instanceof THREE.SkinnedMesh || node instanceof THREE.MorphAnimMesh ) {
                    skins.push( node );
                }
            });

            n.animatedMesh = skins;
            nodeCopy.threeObject = asset;
            
            nodeCopy.threeObject.matrix = new THREE.Matrix4();
            nodeCopy.threeObject.matrixAutoUpdate = false;
            parentObject3.add( nodeCopy.threeObject );
            nodeCopy.threeObject.name = childName;
            nodeCopy.threeObject.vwfID = nodeID;
            nodeCopy.threeObject.matrixAutoUpdate = false;
            nodeCopy.threeObject.updateMatrixWorld( true );
            propertyNotifyCallback();
            window.setTimeout( function() {
                nodeCopy.loadingCallback( true ); 
            }, 10);
          
        }
        
        //if it's pending but not done, register a callback so that when it is done, it can be attached.
        else if( reg.loaded == false && reg.pending == true ) {  
            sceneNode.srcAssetObjects.push( node.threeObject );
          
            //so, not necessary to do all the other VWF node goo stuff, as that will be handled by the node that requested
            //the asset in teh first place
            
            reg.callbacks.push( function( node ) {
            
                //just clone the node and attach it.
                //this should not clone the geometry, so much lower memory.
                //seems to take near nothing to duplicated animated avatar            
                var n = node.clone();
                cloneMaterials( n );
                var skins = [];
                walkGraph( n, function( node ) {
                    if( node instanceof THREE.SkinnedMesh || node instanceof THREE.MorphAnimMesh ) {
                        skins.push( node );
                    }            
                });
                n.animatedMesh = skins;
                nodeCopy.threeObject = n;            
    
                nodeCopy.threeObject.matrix = new THREE.Matrix4();
                nodeCopy.threeObject.matrixAutoUpdate = false;
                
                removeAmbientLights.call(this, nodeCopy.threeObject);
    
                parentObject3.add( nodeCopy.threeObject );
                nodeCopy.threeObject.name = childName;
                nodeCopy.threeObject.vwfID = nodeID;
                nodeCopy.threeObject.matrixAutoUpdate = false;
                nodeCopy.threeObject.updateMatrixWorld( true );
                propertyNotifyCallback();
                nodeCopy.loadingCallback( true ); 
            
            });
        }
            
    }

    //walk the scenegraph from the given root, calling the given function on each node
    function walkGraph( root, func ) {
        if( root ) {
            func( root );
        }
        for( var i =0; i < root.children.length; i++ ) {
            walkGraph( root.children[i], func );
        }
    }


    // Strips the imported scene's ambient lights
    function removeAmbientLights( threeObject ) {
        for( var i = threeObject.children.length -1; i >= 0; i-- )
            {
                if( threeObject.children[i] instanceof THREE.AmbientLight )
                {
                    threeObject.remove( threeObject.children[i] );
                }
            }
    }
    

    function getObjectID( objectToLookFor, bubbleUp, debug ) {

        var objectIDFound = -1;
            
        while (objectIDFound == -1 && objectToLookFor) {
            if ( debug ) {
                this.logger.info("====>>>  vwf.model-glge.mousePick: searching for: " + path(objectToLookFor) );
            }
            $.each( this.state.nodes, function (nodeID, node) {
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
                texture:   { type: "t", value: new THREE.Texture( new Image() ) },
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
            "   float lifetime = mod( random.x * lifespan + time, lifespan );"+
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
            var particleSystem = new THREE.PointCloud( particles, shaderMaterial_default );
            
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
                particle.world = this.generatePoint().applyMatrix4( mat );
                
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
                particle.velocity.applyMatrix4( mat );
                
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
                particleSystem.material.uniforms.time.value += time/1000;
            
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
					this.temp.applyMatrix4( inv );
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
					this.temp.applyMatrix4( inv );
					particle.x = this.temp.x;
					particle.y = this.temp.y;
					particle.z = this.temp.z;
					//careful to have prev and current pos in same space!!!!
					particle.prevworld.applyMatrix4( inv );
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
						this.geometry.vertices[ i ].applyMatrix4( inv );
						this.shaderMaterial_interpolate.attributes.previousPosition.value[ i ].applyMatrix4( inv );
						this.geometry.vertices[ i ].applyMatrix4( newt );
						this.shaderMaterial_interpolate.attributes.previousPosition.value[ i ].applyMatrix4( newt );
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

    function sceneLights() {
        var scene = getThreeScene.call( this );
        var lightList = createLightContainer.call( this );
        if ( scene ) {
            lightList = findAllLights( scene, lightList );
        } 
        return lightList;        
    }

    function createDefaultLighting( lights ) {
        var sceneID = this.kernel.application();
        var ambientCount = lights.ambientLights.length;
        var lightCount = lights.spotLights.length + lights.directionalLights.length + lights.pointLights.length;
        
        //console.info( "ambientCount = " + ambientCount + "      lightCount = " + lightCount );
          
        var scene = getThreeScene.call( this );

        if ( lightCount == 0 ) {
            
            var light1 = new THREE.DirectionalLight( '808080', 2 );
            var light2 = new THREE.DirectionalLight( '808080', 2 );

            light1.distance = light2.distance = 2000;

            scene.add( light1 );
            scene.add( light2 );

            light1.rotation.setFromQuaternion( new THREE.Quaternion( 0, 1, 0, 225 ) );
            light2.rotation.setFromQuaternion( new THREE.Quaternion( 0, 1, 0, 45 ) );
        }

        if ( ambientCount == 0 ) {
            createAmbientLight.call( this, scene, [ 0.20, 0.20, 0.20 ] );
        }            
    }

    function getWorldTransform( node ) {
        var parent = self.state.nodes[ node.parentID ];
        if ( parent ) {
            var worldTransform = new THREE.Matrix4();
            if ( node.transform === undefined ) {
                node.transform = new THREE.Matrix4();    
            }
            return worldTransform.multiplyMatrices( getWorldTransform( parent ), node.transform );
        } else {
            return node.transform;
        }
    }

    function setWorldTransform( node, worldTransform ) {
        if ( node.parent ) {
            var parentInverse = goog.vec.Mat4.create();
            if ( goog.vec.Mat4.invert( getWorldTransform( node.parent ), parentInverse ) ) {
                node.transform = goog.vec.Mat4.multMat( parentInverse, worldTransform, 
                                                        goog.vec.Mat4.create() );
            } else {
                self.logger.errorx( "Parent world transform is not invertible - did not set world transform " +
                                    "on node '" + node.id + "'" );
            }
        } else {
            node.transform = worldTransform;
        }
    }

   // -- getBoundingBox ------------------------------------------------------------------------------

    function getBoundingBox( object3 ) {

        var bBox = { 
            min: { x: Number.MAX_VALUE, y: Number.MAX_VALUE, z: Number.MAX_VALUE },
            max: { x: -Number.MAX_VALUE, y: -Number.MAX_VALUE, z: -Number.MAX_VALUE }
        };

        if (object3 instanceof THREE.Object3D)
        {
            object3.traverse (function (mesh)
            {
                if (mesh instanceof THREE.Mesh)
                {
                    mesh.geometry.computeBoundingBox ();
                    var meshBoundingBox = mesh.geometry.boundingBox;

                    // compute overall bbox
                    bBox.min.x = Math.min (bBox.min.x, meshBoundingBox.min.x);
                    bBox.min.y = Math.min (bBox.min.y, meshBoundingBox.min.y);
                    bBox.min.z = Math.min (bBox.min.z, meshBoundingBox.min.z);
                    bBox.max.x = Math.max (bBox.max.x, meshBoundingBox.max.x);
                    bBox.max.y = Math.max (bBox.max.y, meshBoundingBox.max.y);
                    bBox.max.z = Math.max (bBox.max.z, meshBoundingBox.max.z);
                }
            });
        }
        else if ( object3 && object3.geometry && object3.geometry.computeBoundingBox ) {
            object3.geometry.computeBoundingBox();
            var bx = object3.geometry.boundingBox;
            bBox = { 
                min: { x: bx.min.x, y: bx.min.y, z: bx.min.z },
                max: { x: bx.max.x, y: bx.max.y, z: bx.max.z }
            };
        }

        return bBox;
    }

    function getCenterOffset( object3 ) {
        var offset = [ 0, 0, 0 ];
        if ( object3 ) {
            var bBox = getBoundingBox.call( this, object3 );
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
    function isIdentityMatrix( elements ) {
        if ( ( elements.length == 16 ) || ( elements.length == 9 ) ) {
          var modNumber = Math.sqrt( elements.length ) + 1;
          for ( var index = 0; index < elements.length; index++ ) {
              if ( ( index % modNumber ) == 0 ) {
                  if ( elements[ index ] != 1 ) {
                      return false;
                  }
              }
              else {
                  if ( elements[ index ] != 0 ) {
                      return false;
                  }
              }
          }
          return true;
        }
        return false;
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
                $.each(node.attributes, function(key, element) {
                    debugarraytype = key;
                    var attributeArray = node.attributes[key];
                    node.attributes[key] = DecodeArray(attributeArray,key);
                    if(key == "Vertex")
                    {
                        for(var i = 0; i < node.attributes[key].length-2; i+= 3)
                        {
                            var vert = new THREE.Vector3( node.attributes[ key ][ i ],
                                                          node.attributes[ key ][ i + 1 ],
                                                          node.attributes[ key ][ i + 2 ] );
                            mesh.geometry.vertices.push(vert);
                        }
                    }
                    if(key == "Normal")
                    {
                        for(var i = 0; i < node.attributes[key].length-2; i+= 3)
                        {
                            var norm = new THREE.Vector3( node.attributes[ key ][ i ],
                                                          node.attributes[ key ][ i + 1 ],
                                                          node.attributes[ key ][ i + 2 ] );
                            mesh.geometry.normals.push(norm);
                        }
                    }
                    if(key == "TexCoord0")
                    {
                        for(var i = 0; i < node.attributes[key].length-1; i+= 2)
                        {
                            var uv = new THREE.Vector2( node.attributes[ key ][ i ], 
                                                        node.attributes[ key ][ i + 1 ] );
                            mesh.geometry.UVS.push(uv);
                        }
                    }
                    
                    if(key == "VertexColor")
                    {
                        for(var i = 0; i < node.attributes[key].length-3; i+= 4)
                        {
                            var vert = new THREE.Vector3( node.attributes[ key ][ i ],
                                                          node.attributes[ key ][ i + 1 ],
                                                          node.attributes[ key ][ i + 2 ] );
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
                            
                                            
            glmat = glmat.multiplyMatrices(flipmat,glmat);
            
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
    
    function isUUIDinArray( value, arrayToCheck ) {
        for ( var index = 0; index < arrayToCheck.length; index++ ) {
            if ( value.uuid == arrayToCheck[ index ].uuid ) {
                return true;
            }
        }
        return false;
    }
    function threeMaterialsFromIDs( nodeIDs ) {
        var result = [];
        for ( var index = 0; index < nodeIDs.length; index++ ) {
            var node = this.state.nodes[ nodeIDs[ index ] ];
            if ( node && ( node.threeObject instanceof THREE.Material ) ) {
                result.push( node.threeObject );
            }
        }
        return result;
    }
    function createInheritedMaterial( parentID, threeObject, name ) {
        var nodeName = "material";
        if ( name ) {
            nodeName = name;
        }
        else if ( threeObject.name.length > 0 ) {
            nodeName = threeObject.name;
        }
        var newNode = { 
            "id": nodeName,
            "uri": nodeName,
            "extends": "http://vwf.example.com/material.vwf",
            "properties": { 
                "private": null,
            },
            "methods": {
            },
            "scripts": []
        };
        vwf.createChild( parentID, nodeName, newNode);
        
    }
    function generateNodeMaterial( nodeID, node ) {
        if ( false ) {
            if ( node.threeObject instanceof THREE.Object3D ) {
                var representedMaterialsVWF = vwf.find( nodeID, "./element(*,'http://vwf.example.com/material.vwf')" );
                var representedMaterialsThreeJS = threeMaterialsFromIDs.call( this, representedMaterialsVWF );
                var allChildrenMaterials = GetAllMaterials( node.threeObject );

                var nameTallys = {};

                for ( var index = 0; index < allChildrenMaterials.length; index ++ ) {
                    if ( nameTallys[ allChildrenMaterials[ index ].name ] ) {
                        nameTallys[ allChildrenMaterials[ index ].name ] = nameTallys[ allChildrenMaterials[ index ].name ] + 1;
                    }
                    else {
                        nameTallys[ allChildrenMaterials[ index ].name ] = 1;
                    }
                    if ( ! isUUIDinArray( allChildrenMaterials[ index ], representedMaterialsThreeJS ) ) {
                        var newName = "material_" + nameTallys[ allChildrenMaterials[ index ].name ] + "_" + allChildrenMaterials[ index ].name;
                        createInheritedMaterial.call( this, nodeID, allChildrenMaterials[ index ], newName );
                    }
                }                
            }
        }

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
