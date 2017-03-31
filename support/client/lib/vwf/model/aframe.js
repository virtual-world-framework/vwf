"use strict";

// VWF & A-Frame model driver
// Copyright 2017 Krestianstvo.org project
//
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

/// vwf/model/scenejs.js is a placeholder for a 3-D scene manager.
/// 
/// @module vwf/model/aframe
/// @requires vwf/model

define(["module", "vwf/model", "vwf/utility"], function (module, model, utility) {

    return model.load(module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function () {

            self = this;

            this.state = {
                nodes: {},
                scenes: {},
                prototypes: {},
                createLocalNode: function (nodeID, childID, childExtendsID, childImplementsIDs,
                    childSource, childType, childIndex, childName, callback) {
                    return {
                        "parentID": nodeID,
                        "ID": childID,
                        "extendsID": childExtendsID,
                        "implementsIDs": childImplementsIDs,
                        "source": childSource,
                        "type": childType,
                        "name": childName,
                        "prototypes": undefined,
                        "aframeObj": undefined,
                        "scene": undefined
                    };
                },
                isAFrameClass: function (prototypes, classID) {
                    if (prototypes) {
                        for (var i = 0; i < prototypes.length; i++) {
                            if (prototypes[i] === classID) {
                                //console.info( "prototypes[ i ]: " + prototypes[ i ] );
                                return true;
                            }
                        }
                    }
                    return false;
                },
                isAFrameComponent: function (prototypes) {
                    var found = false;
                    if (prototypes) {
                        for (var i = 0; i < prototypes.length && !found; i++) {
                            found = (prototypes[i] === "http://vwf.example.com/aframe/node.vwf");
                        }
                    }
                    return found;
                }
            };

            this.state.kernel = this.kernel.kernel.kernel;
    },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function (nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {

            // If the parent nodeID is 0, this node is attached directly to the root and is therefore either 
            // the scene or a prototype.  In either of those cases, save the uri of the new node
            var childURI = (nodeID === 0 ? childIndex : undefined);
            var appID = this.kernel.application();

            // If the node being created is a prototype, construct it and add it to the array of prototypes,
            // and then return
            var prototypeID = utility.ifPrototypeGetId(appID, this.state.prototypes, nodeID, childID);
            if (prototypeID !== undefined) {

                this.state.prototypes[prototypeID] = {
                    parentID: nodeID,
                    ID: childID,
                    extendsID: childExtendsID,
                    implementsID: childImplementsIDs,
                    source: childSource,
                    type: childType,
                    name: childName
                };
                return;
            }

            var protos = getPrototypes(this.kernel, childExtendsID);
            //var kernel = this.kernel.kernel.kernel;
            var node;

            if (this.state.isAFrameComponent(protos)) {

                // Create the local copy of the node properties
                if (this.state.nodes[childID] === undefined) {
                    this.state.nodes[childID] = this.state.createLocalNode(nodeID, childID, childExtendsID, childImplementsIDs,
                        childSource, childType, childIndex, childName, callback);
                }

                node = this.state.nodes[childID];
                node.prototypes = protos;

                node.aframeObj = createAFrameObject(node);
                addNodeToHierarchy(node);
                //notifyDriverOfPrototypeAndBehaviorProps();
            }




        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function (nodeID, propertyName, propertyValue) {

            var value = undefined;
            var node = this.state.nodes[nodeID];
            if (node !== undefined) {
                value = this.settingProperty(nodeID, propertyName, propertyValue);
            }
            return value;
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function (nodeID, propertyName, propertyValue) {

            return this.initializingProperty(nodeID, propertyName, propertyValue);
        },

        // -- deletingNode -------------------------------------------------------------------------

        //deletingNode: function( nodeID ) {
        //},

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function (nodeID, propertyName, propertyValue) {

            var node = this.state.nodes[nodeID];
            var value = undefined;
            if (node && node.aframeObj && utility.validObject(propertyValue)) {

                var aframeObject = node.aframeObj;

                if (isNodeDefinition(node.prototypes)) {

                    // 'id' will be set to the nodeID
                    value = propertyValue;
                     switch (propertyName) {

                         default:
                            value = undefined;
                            break;
                     }
                    
                }

                 if ( value === undefined && isAEntityDefinition( node.prototypes ) ) {

                    value = propertyValue;
                    
                    switch ( propertyName ) { 

                         case "position":
                                    aframeObject.setAttribute('position', { x: propertyValue[0], y: propertyValue[1], z: propertyValue[2] });
                                    break;
                                case "rotation":
                                    aframeObject.setAttribute('rotation', { x: propertyValue[0], y: propertyValue[1], z: propertyValue[2] });
                                    break;
                                case "scale":
                                    aframeObject.setAttribute('scale', { x: propertyValue[0], y: propertyValue[1], z: propertyValue[2] });
                                    break;

                                case "color":
                                    aframeObject.setAttribute('color', propertyValue);
                                    break;

                                case "fog":
                                    aframeObject.setAttribute('material','fog', propertyValue);
                                    break;

                                case "wireframe":
                                    aframeObject.setAttribute('wireframe', propertyValue);
                                    break;
                                case "wireframe-linewidth":
                                    aframeObject.setAttribute('wireframeLinewidth', propertyValue);
                                    break;

                                // case "clickable":
                                  
                                //         value = propertyValue;

                                //     break;

                                // case "clickable":
                                //     if (propertyValue) {
                                //         aframeObject.addEventListener('click', function (evt) {
                                //             vwf_view.kernel.fireEvent(node.ID, "clickEvent");
                                //         });
                                //     }
                                //     break;


                                case "src":
                                    aframeObject.setAttribute('src', propertyValue);
                                    break;
                                case "repeat":
                                    aframeObject.setAttribute('repeat', propertyValue);
                                    break;

                        default:
                            value = undefined;
                            break; 
                    }
                
                }

                if ( value === undefined && aframeObject.nodeName == "A-TEXT" ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                           case "value":
                                        aframeObject.setAttribute('value', propertyValue);
                                        break;

                                    case "color":
                                        aframeObject.setAttribute('color', propertyValue);
                                        break;


                        default:
                            value = undefined;
                            break;
                    }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-SCENE" ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                         case "fog":
                                        aframeObject.setAttribute('fog', propertyValue);
                                        break;
                                    case "assets":
                                        var assetsElement = document.createElement('a-assets');
                                        aframeObject.appendChild(assetsElement);
                                        if (propertyValue) {

                                            httpGetJson(propertyValue).then(function (response) {
                                                console.log(JSON.parse(response));
                                                let assets = JSON.parse(response);
                                                for (var prop in assets) {
                                                    var elm = document.createElement(assets[prop].tag);
                                                    elm.setAttribute('id', prop);
                                                    elm.setAttribute('src', assets[prop].src);
                                                    assetsElement.appendChild(elm);

                                                }

                                            }).catch(function (error) {
                                                console.log(error);
                                            });

                                        }
                                        break;


                        default:
                            value = undefined;
                            break;
                    }
                }
                    
                if ( value === undefined && aframeObject.nodeName == "A-BOX") {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                           case "depth":
                                        aframeObject.setAttribute('depth', propertyValue);
                                        break;
                                    case "height":
                                        aframeObject.setAttribute('height', propertyValue);
                                        break;
                                    case "width":
                                        aframeObject.setAttribute('width', propertyValue);
                                        break;


                        default:
                            value = undefined;
                            break;
                    }
                }
                    
                 if ( value === undefined && aframeObject.nodeName == "A-LIGHT" ) {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                           //"angle", "color", "decay", "distance", "ground-color", "intensity", "penumbra", "type", "target"
                                    case "color":
                                        aframeObject.setAttribute('color', propertyValue);
                                        break;
                                     case "type":
                                        aframeObject.setAttribute('type', propertyValue);
                                        break;
                                    case "intensity":
                                        aframeObject.setAttribute('intensity', propertyValue);
                                        break;
                                    case "distance":
                                        aframeObject.setAttribute('distance', propertyValue);
                                        break;


                        default:
                            value = undefined;
                            break;
                    }
                }

                if ( value === undefined && aframeObject.nodeName == "A-COLLADA-MODEL") {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                          case "src":
                                        aframeObject.setAttribute('src', propertyValue);
                                        break;

                         
                        default:
                            value = undefined;
                            break;
                    }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-PLANE") {
                    value = propertyValue;
                    
                    switch ( propertyName ) {

                          case "height":
                                        aframeObject.setAttribute('height', propertyValue);
                                        break;
                                    case "width":
                                        aframeObject.setAttribute('width', propertyValue);
                                        break;

                         
                        default:
                            value = undefined;
                            break;
                    }
                }

                     if (value === undefined && aframeObject.nodeName == "A-SPHERE") {
                         value = propertyValue;

                         switch (propertyName) {
                             case "radius":
                                 aframeObject.setAttribute('radius', propertyValue);
                                 break;

                             default:
                                 value = undefined;
                                 break;
                         }
                     }

                        if (value === undefined && aframeObject.nodeName == "A-CAMERA") {
                         value = propertyValue;
                          switch (propertyName) {

                                    case "look-controls-enabled":
                                        aframeObject.setAttribute('look-controls', 'enabled', propertyValue);
                                        break;

                                    case "forAvatar":
                                        if (propertyValue) {
                                            aframeObject.addEventListener('componentchanged', function (evt) {

                                                if (evt.detail.name === 'position') {
                                                    self.kernel.fireEvent(node.ID, "setAvatarPosition", evt.detail.newData);

                                                }
                                                if (evt.detail.name === 'rotation') {
                                                    self.kernel.fireEvent(node.ID, "setAvatarRotation", evt.detail.newData);
                                                    //console.log('Entity has moved from', evt.detail.oldData, 'to', evt.detail.newData, '!');
                                                }
                                            });
                                        }
                                        break;
                    

                             default:
                                 value = undefined;
                                 break;
                         }
                     }


                    //if (!aframeObject) return value;

                    //if (propertyValue !== undefined) {
                        //self = this;

            }
            return value;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function (nodeID, propertyName, propertyValue) {


            var node = this.state.nodes[nodeID];
            var value = undefined;

            if (node && node.aframeObj) {

                var aframeObject = node.aframeObj;

                if (isNodeDefinition(node.prototypes)) {
                         switch ( propertyName ) {
                         }
                }

                if ( value === undefined && isAEntityDefinition( node.prototypes ) ) {
                    
                    switch ( propertyName ) { 
                        case "position":
                                var pos = aframeObject.getAttribute('position');
                                if ( pos !== undefined ){ 
                                value = [pos.x, pos.y, pos.z];
                                }
                                break;
                            case "scale":
                                var scale = aframeObject.getAttribute('scale');
                                 if ( scale !== undefined ){ 
                                value = [scale.x, scale.y, scale.z];
                            }
                                break;

                            case "rotation":
                                var rot = aframeObject.getAttribute('rotation');
                                if ( rot !== undefined ){ 
                                value = [rot.x, rot.y, rot.z];
                                }
                                break;

                            case "color":
                                value = aframeObject.getAttribute('color');
                                break;
                            
                            case "fog":
                                if (aframeObject.getAttribute('material')){
                                    value = aframeObject.getAttribute('material').fog;
                                }
                                break;

                            case "wireframe":
                                value = aframeObject.getAttribute('wireframe');
                                break;

                            case "wireframe-linewidth":
                                value = aframeObject.getAttribute('wireframeLinewidth');
                                break;

                            // case "clickable":
                            //   value = propertyValue; 
                            //     break;

                            case "src":
                                value = aframeObject.getAttribute('src');
                                break;
                            case "repeat":
                                value = aframeObject.getAttribute('repeat');

                    }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-SCENE" ) {
                    
                    switch ( propertyName ) {
                            case "fog":
                                    value = aframeObject.getAttribute('fog');
                                    break;
                    }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-BOX" ) {
                    
                    switch ( propertyName ) {
                             case "depth":
                                    value = aframeObject.getAttribute('depth');
                                    break;
                                case "height":
                                    value = aframeObject.getAttribute('height');
                                    break;
                                case "width":
                                    value = aframeObject.getAttribute('width');
                                    break;
                    }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-LIGHT" ) {
                    
                   //"angle", "color", "decay", "distance", "ground-color", "intensity", "penumbra", "type", "target"
                           switch (propertyName) {
                                case "color":
                                    value = aframeObject.getAttribute('color');
                                    break;
                                case "type":
                                    value = aframeObject.getAttribute('type');
                                    break;
                                case "distance":
                                    value = aframeObject.getAttribute('distance');
                                    break;
                                case "intensity":
                                    value = aframeObject.getAttribute('intensity');
                                    break;
                                }
                }

                     if ( value === undefined && aframeObject.nodeName == "A-PLANE" ) {
        
                           switch (propertyName) {
                                 case "height":
                                    value = aframeObject.getAttribute('height');
                                    break;
                                case "width":
                                    value = aframeObject.getAttribute('width');
                                    break;
                                }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-SPHERE" ) {
        
                           switch (propertyName) {
                                  case "radius":
                                    value = aframeObject.getAttribute('radius');
                                    break;
                                }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-TEXT" ) {
        
                           switch (propertyName) {
                                 case "value":
                                    value = aframeObject.getAttribute('value');
                                    break;

                                case "color":
                                    value = aframeObject.getAttribute('color');
                                    break;
                                }
                }

                 if ( value === undefined && aframeObject.nodeName == "A-CAMERA" ) {
        
                           switch (propertyName) {
                                case "look-controls-enabled":
                                    value = aframeObject.getAttribute('look-controls').enabled;
                                    break;
                                }
                }

                  if ( value === undefined && aframeObject.nodeName == "A-COLLADA-MODEL" ) {
        
                           switch (propertyName) {
                                case "src":
                                    value = aframeObject.getAttribute('src');
                                    break;
                                }
                }

            }

           if ( value !== undefined ) {
                propertyValue = value;
            }

            return value;
        }
    });

function createAFrameObject(node, config) {
    var protos = node.prototypes;
    var aframeObj = undefined;

    if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/ascene.vwf")) {
        aframeObj = document.createElement('a-scene');

        self.state.scenes[node.ID] = aframeObj;

    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/acamera.vwf")) {
        aframeObj = document.createElement('a-camera');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/alight.vwf")) {
        aframeObj = document.createElement('a-light');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/acursor.vwf")) {
        aframeObj = document.createElement('a-cursor');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/asky.vwf")) {
        aframeObj = document.createElement('a-sky');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/abox.vwf")) {
        aframeObj = document.createElement('a-box');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/aplane.vwf")) {
        aframeObj = document.createElement('a-plane');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/atext.vwf")) {
        aframeObj = document.createElement('a-text');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/acolladamodel.vwf")) {
        aframeObj = document.createElement('a-collada-model');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/asphere.vwf")) {
        aframeObj = document.createElement('a-sphere');
    } else if (self.state.isAFrameClass(protos, "http://vwf.example.com/aframe/aentity.vwf")) {
        aframeObj = document.createElement('a-entity');
    }

    return aframeObj;
}

function addNodeToHierarchy(node) {

    if (node.aframeObj) {
        if (self.state.nodes[node.parentID] !== undefined) {
            var parent = self.state.nodes[node.parentID];
            if (parent.aframeObj) {

                if (parent.children === undefined) {
                    parent.children = [];
                }
                parent.children.push(node.ID);
                //console.info( "Adding child: " + childID + " to " + nodeID );
                parent.aframeObj.appendChild(node.aframeObj);
            }
        }
        if (node.aframeObj.nodeName !== "A-SCENE") {
            node.scene = self.state.scenes[self.kernel.application()];
        }

    }

}


function getPrototypes(kernel, extendsID) {
    var prototypes = [];
    var id = extendsID;

    while (id !== undefined) {
        prototypes.push(id);
        id = kernel.prototype(id);
    }
    return prototypes;
}

function isNodeDefinition(prototypes) {
    var found = false;
    if (prototypes) {
        for (var i = 0; i < prototypes.length && !found; i++) {
            found = (prototypes[i] == "http://vwf.example.com/aframe/node.vwf");
        }
    }
    return found;
}

function isAEntityDefinition( prototypes ) {
        var found = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !found; i++ ) {
                found = ( prototypes[i] == "http://vwf.example.com/aframe/aentity.vwf" );
            }
        }
        return found;
    }



// Changing this function significantly from the GLGE code
// Will search hierarchy down until encountering a matching child
// Will look into nodes that don't match.... this might not be desirable
function FindChildByName(obj, childName, childType, recursive) {

    var child = undefined;
    if (recursive) {

        // TODO: If the obj itself has the child name, the object will be returned by this function
        //       I don't think this this desirable.

        if (nameTest.call(this, obj, childName)) {
            child = obj;
        } else if (obj.children && obj.children.length > 0) {
            for (var i = 0; i < obj.children.length && child === undefined; i++) {
                child = FindChildByName(obj.children[i], childName, childType, true);
            }
        }
    } else {
        if (obj.children) {
            for (var i = 0; i < obj.children.length && child === undefined; i++) {
                if (nameTest.call(this, obj.children[i], childName)) {
                    child = obj.children[i];
                }
            }
        }
    }
    return child;

}

function nameTest(obj, name) {
    if (obj.name == "") {
        return (obj.parent.name + "Child" == name);
    } else {
        return (obj.name == name || obj.id == name || obj.vwfID == name);
    }
}

function httpGet(url) {
    return new Promise(function (resolve, reject) {
        // do the usual Http request
        let request = new XMLHttpRequest();
        request.open('GET', url);

        request.onload = function () {
            if (request.status == 200) {
                resolve(request.response);
            } else {
                reject(Error(request.statusText));
            }
        };

        request.onerror = function () {
            reject(Error('Network Error'));
        };

        request.send();
    });
}
async function httpGetJson(url) {
    // check if the URL looks like a JSON file and call httpGet.
    let regex = /\.(json)$/i;

    if (regex.test(url)) {
        // call the async function, wait for the result
        return await httpGet(url);
    } else {
        throw Error('Bad Url Format');
    }
}


});

