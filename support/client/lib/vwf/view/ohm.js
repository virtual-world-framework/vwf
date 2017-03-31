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

define(["module", "vwf/view"], function (module, view) {

    return view.load(module, {

        // == Module Definition ====================================================================

        initialize: function (options) {
            var self = this;
            this.nodes = {};

         
        },

        // initializedNode: function( nodeID, childID ) {
        // },

        createdProperty: function (nodeId, propertyName, propertyValue) {
            return this.satProperty(nodeId, propertyName, propertyValue);
        },

        initializedProperty: function (nodeId, propertyName, propertyValue) {
            return this.satProperty(nodeId, propertyName, propertyValue);
        },

        satMethod: function (nodeId, methodName) {

            var self = this;

             var node = this.state.nodes[ nodeId ];

            if ( !( node && node.lang) ) {
                return;
            }
                 if (methodName.indexOf("Operation") > -1) {


                  //self.kernel.callMethod (nodeId, methodName);
                   self.kernel.setProperty(nodeId, 'ohmLang', node.lang.source);
                    console.log("set new lang properties");
                 }

        },

        // createdMethod: function( nodeId, methodName, methodParameters, methodBody) {

        //     var self = this;
        //      var node = this.state.nodes[ nodeId ];
        //     if ( !( node && node.lang) ) {
        //         return;
        //     }

        //     if (methodName.indexOf("Operation") > -1) {

        //         console.log("add semantic operations");
        //           self.kernel.callMethod (nodeId, methodName);

        //          }

        // },

        satProperty: function (nodeId, propertyName, propertyValue) {
           
            var self = this;
             var node = this.state.nodes[ nodeId ];
            if ( !( node && node.lang) ) {
                return;
            }
            var lang = node.lang;
            switch (propertyName) {
                case "ohmLang":
                    if (propertyValue) {
                        self.kernel.callMethod (nodeId, 'initLang');
                    }
                    break;
            }

        },

        // firedEvent: function (nodeID, eventName, eventParameters) {
        // },


        // ticked: function (vwfTime) {
        // }

    });

   

});
