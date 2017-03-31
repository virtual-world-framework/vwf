"use strict";

// VWF & A-Frame view driver
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

/// vwf/view/lesson creates a view interface for instruction text. 
/// 
/// @module vwf/view/aframe
/// @requires vwf/view

define(["module", "vwf/view", "jquery", "jquery-ui"], function (module, view, $) {

    return view.load(module, {

        // == Module Definition ====================================================================

        initialize: function (options) {
            var self = this;
            this.nodes = {};

            if (typeof options == "object") {

                this.rootSelector = options["application-root"];
            }
            else {
                this.rootSelector = options;
            }

         
        },

        createdNode: function (nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */) {

            var node = this.state.nodes[childID];

            // If the "nodes" object does not have this object in it, it must not be one that
            // this driver cares about
            if (!node) {
                return;
            }

            if (this.state.scenes[childID]) {
                document.body.append(this.state.scenes[childID]);
                createAvatar(childID);
            }


        },

        createdProperty: function (nodeId, propertyName, propertyValue) {
            return this.satProperty(nodeId, propertyName, propertyValue);
        },

        initializedProperty: function (nodeId, propertyName, propertyValue) {
            return this.satProperty(nodeId, propertyName, propertyValue);
        },

        satProperty: function (nodeId, propertyName, propertyValue) {
            var self = this;

             var node = this.state.nodes[ nodeId ];

            if ( !( node && node.aframeObj ) ) {
                return;
            }

            var aframeObject = node.aframeObj;
            switch (propertyName) {
                case "clickable":
                    if (propertyValue) {
                        aframeObject.addEventListener('click', function (evt) {
                            vwf_view.kernel.fireEvent(nodeId, "clickEvent")
                        })
                    }
                    break;
            }
        },

        firedEvent: function (nodeID, eventName, eventParameters) {
            //var avatarID = vwf_view.kernel.find("", avatarName)
            var avatarName = 'avatar-' + self.kernel.moniker();
            if (eventName == "setAvatarPosition") {
                vwf_view.kernel.setProperty(avatarName, "position", [eventParameters.x, eventParameters.y, eventParameters.z]);
            }
            if (eventName == "setAvatarRotation") {
                vwf_view.kernel.setProperty(avatarName, "rotation", [eventParameters.x, eventParameters.y, eventParameters.z]);
            }
        },

        // ticked: function (vwfTime) {
        // }

    });

    function createAvatar(nodeID) {
        var nodeName = 'avatar-' + self.kernel.moniker();

        var newNode = {
            "id": nodeName,
            "uri": nodeName,
            "extends": "http://vwf.example.com/aframe/abox.vwf",
            "properties": {
                "color": getRandomColor(),
                "position": [0, 0, 0]
            },
            "methods": {
            },
            "scripts": []
        };
        vwf_view.kernel.createChild(nodeID, nodeName, newNode);

    }

    function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

});
