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

require( [

    "domReady",

    "vwf",

    // This is the common model implementation and an example model that connects the
    // simulation to a WebGL scene manager.

    "vwf/model/javascript",
    "vwf/model/jiglib",
    "vwf/model/glge",
    "vwf/model/object",
    "vwf/view/document",
    "vwf/view/editor",
    "vwf/view/glge",
    connected && "vwf/view/googleEarth",
    cesium && "vwf/view/cesium"
    
], function( ready, vwf ) {

    ready( function() {

        // With the scripts loaded, we must initialize the framework. vwf.initialize()
        // accepts three parameters: a world specification, model configuration parameters,
        // and view configuration parameters.

        vwf.initialize(

            // This is the world specification. The world may be specified using a component
            // literal as shown here, or the specification may be placed in a network-
            // visible location and specified here as a URI or as a query parameter to this
            // index page.

            // As a literal:
            //     { extends: "http://vwf.example.com/example-type.vwf", properties: { ... }, ... }

            // As a string:
            //     "http://vwf.example.com/example-type.vwf",

            // These are the model configurations. Each key within the configuration object
            // is a model name, and each value is an argument or an array of arguments to be
            // passed to the model's constructor.

            // With an array of arguments for the "example" model:
            //     { example: [ p1, p2, ... ], // ==> new vwf.modules.example( vwf, p1, p2, ... ) }

            // As a single argument to the "html" view:
            //     { html: "#vwf-root" // ==> new vwf.modules.html( vwf, "#vwf-root" ) }

            [
                "vwf/model/javascript",
                "vwf/model/jiglib",
                "vwf/model/glge",
                "vwf/model/object",
            ],

            // These are the view configurations. They use the same format as the model
            // configurations.

            [
                { "vwf/view/glge": "#vwf-root" },
                "vwf/view/document",
                "vwf/view/editor",
                connected && "vwf/view/googleEarth",
                cesium && "vwf/view/cesium"
            ]

        );

    } );

} );
