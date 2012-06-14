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

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        // == Module Definition ====================================================================
        
    }, function( kernelFunctionName ) {

        // == Kernel API ===========================================================================

        switch ( kernelFunctionName ) {

            case "createNode":

                return function( nodeComponent, when, callback /* ( nodeID ) */ ) {
                    this.kernel.send( undefined, kernelFunctionName, undefined,
                        [ childComponent ], when || 0, callback /* ( result ) */ );
                };

            case "deleteNode":

                return function( nodeID, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, undefined,
                        undefined, when || 0, callback /* ( result ) */ );
                };

            case "createChild":

                return function( nodeID, childName, childComponent, when, callback /* ( childID ) */ ) {
                    this.kernel.send( nodeID, kernelFunctionName, childName,
                        [ childComponent ], when || 0, callback /* ( result ) */ );
                };

            case "addChild":
            
                return function( nodeID, childID, childName, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, undefined,
                        [ childID, childName ], when || 0, callback /* ( result ) */ );  // TODO: swap childID & childName?
                };

            case "removeChild":

                return function( nodeID, childID, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, undefined,
                        [ childID ], when || 0, callback /* ( result ) */ );  // TODO: swap childID & childName?
                };

            case "setProperties":

                return function( nodeID, properties, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, undefined,
                        [ properties ], when || 0, callback /* ( result ) */ );
                };

            case "getProperties":

                return function( nodeID, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, undefined,
                        undefined, when || 0, callback /* ( result ) */ );
                };

            case "createProperty":

                return function( nodeID, propertyName, propertyValue, propertyGet, propertySet, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, propertyName,
                        [ propertyValue, propertyGet, propertySet ], when || 0, callback /* ( result ) */ );  // TODO: { value: propertyValue, get: propertyGet, set: propertySet } ? -- vwf.receive() needs to parse
                };

            // TODO: deleteProperty

            case "setProperty":

                return function( nodeID, propertyName, propertyValue, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, propertyName,
                        [ propertyValue ], when || 0, callback /* ( result ) */ );
                };

            case "getProperty":

                return function( nodeID, propertyName, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, propertyName,
                        undefined, when || 0, callback /* ( result ) */ );
                };
    
            case "createMethod":

                return function( nodeID, methodName, methodParameters, methodBody, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, methodName,
                        [ methodParameters, methodBody ], when || 0, callback /* ( result ) */ );  // TODO: { parameters: methodParameters, body: methodBody } ? -- vwf.receive() needs to parse
                };

            // TODO: deleteMethod

            case "callMethod":

                return function( nodeID, methodName, methodParameters, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, methodName,
                        [ methodParameters ], when || 0, callback /* ( result ) */ );
                };
    
            case "createEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, eventName,
                        [ eventParameters ], when || 0, callback /* ( result ) */ );
                };

            // TODO: deleteEvent

            case "fireEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, eventName,
                        [ eventParameters ], when || 0, callback /* ( result ) */ );
                };
    
            case "dispatchEvent":

                return function( nodeID, eventName, eventParameters, eventNodeParameters, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, eventName,
                        [ eventParameters, eventNodeParameters ], when || 0, callback /* ( result ) */ );
                };
    
            case "execute":

                return function( nodeID, scriptText, scriptType, when, callback ) {
                    this.kernel.send( nodeID, kernelFunctionName, undefined,
                        [ scriptText, scriptType ], when || 0, callback /* ( result ) */ );  // TODO: { text: scriptText, type: scriptType } ? -- vwf.receive() needs to parse
                };

            case "time":
            case "client":
            case "moniker":

                return function() {
                    return this.kernel[kernelFunctionName]();
                };

        }

    }, function( viewFunctionName ) {

        // == View API =============================================================================

        return undefined;

    } );

} );
