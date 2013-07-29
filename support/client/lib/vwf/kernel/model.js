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

/// @module vwf/kernel/model
/// @requires vwf/model

define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            this.state.enabled = true; // kernel reentry allowed?
            this.state.blocked = false; // kernel reentry attempted?
        },

        /// Allow kernel reentry from the drivers.

        enable: function() {
            this.state.enabled = true;
            this.state.blocked = false;
        },
        
        /// Prevent kernel reentry from the drivers.

        disable: function() {
            this.state.enabled = false;
            this.state.blocked = false;
        },

        /// Indicate if a driver attempted to call back into the kernel while reentry was disabled,
        /// and clear the *blocked* flag.
        
        blocked: function() {
            var blocked = this.state.blocked;
            this.state.blocked = false;
            return blocked;
        },

        /// Invoke a task and record any async actions that it initiates. After the actions have
        /// completed, execute their callbacks, then call a completion callback.
        /// 
        /// @param {Function} task
        ///   The task to execute and monitor for async actions. `task` is invoked with no
        ///   arguments.
        /// @param {Function} callback
        ///   Invoked after the async actions have completed.
        /// @param {Object} [that]
        ///   The `this` value for the `task` and `callback` functions.

        capturingAsyncs: function( task, callback, that ) {

            // Create an array to capture the callbacks and results from async actions. When
            // `this.state.asyncs` exists, async actions hand off their callbacks to `asyncs.defer`.

            var asyncs = this.state.asyncs = [];

            asyncs.defer = defer;
            asyncs.completed = 0;

            asyncs.callback = callback;
            asyncs.that = that;

            // Invoke the task.

            task.call( that );

            // Detach the array from `this.state.asyncs` to stop capturing async actions.

            this.state.asyncs = undefined;

            // If there were no async actions, call the completion callback immediately.

            if ( asyncs.completed == asyncs.length ) {
                asyncs.callback.call( asyncs.that );
            }

            /// The `this.state.asyncs` array `defer` method.
            /// 
            /// Wrap a callback function with a new function that will defer the original callback
            /// until a collection of actions have completed, then call the deferred callbacks
            /// followed by a completion callback.

            function defer( callback /* result */ ) {

                var self = this;

                // Save the original callback. The wrapping callback will save the result here when
                // received.

                var deferred = {
                    callback: callback /* result */,
                    result: undefined
                };

                this.push( deferred );

                // Return a new callback in place of the original. Record the result, then if all
                // actions have completed, call the original callbacks, then call the completion
                // function.

                return function( result ) {

                    deferred.result = result;

                    if ( ++self.completed == self.length ) {

                        // Call the original callbacks.

                        self.forEach( function( deferred ) {
                            deferred.callback && deferred.callback( deferred.result );
                        } );

                        // Call the completion callback.

                        if ( self.callback ) {
                            self.callback.call( self.that );
                        }

                    }

                }

            };

        },

    }, function( modelFunctionName ) {

        // == Model API ============================================================================

        // The kernel bypasses vwf/kernel/model and calls directly into the first driver stage.

        return undefined;

    }, function( kernelFunctionName ) {

        // == Kernel API ===========================================================================

        switch ( kernelFunctionName ) {

            // -- Read-write functions -------------------------------------------------------------

            // TODO: setState
            // TODO: getState
            // TODO: hashState

            case "createNode":

                return function( nodeComponent, nodeAnnotation, when, callback /* nodeID */ ) {

                    // Interpret `createNode( nodeComponent, when, callback )` as
                    // `createNode( nodeComponent, undefined, when, callback )`. (`nodeAnnotation`
                    // was added in 0.6.12.)

                    if ( typeof when == "function" || when instanceof Function ) {
                        callback = when;
                        when = nodeAnnotation;
                        nodeAnnotation = undefined;
                    }

                    // Make the call.

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {

                            if ( this.state.asyncs ) {
                                callback = this.state.asyncs.defer( callback /* nodeID */ );
                            }

                            return this.kernel[kernelFunctionName]( nodeComponent, nodeAnnotation, function( nodeID ) {
                                callback && callback( nodeID );
                            } );

                        } else {
                            this.kernel.plan( undefined, kernelFunctionName, undefined,
                                [ nodeComponent, nodeAnnotation ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "deleteNode":

                return function( nodeID, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                undefined, when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            // TODO: setNode
            // TODO: getNode

            case "createChild":

                return function( nodeID, childName, childComponent, childURI, when, callback /* childID */ ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {

                            if ( this.state.asyncs ) {
                                callback = this.state.asyncs.defer( callback /* childID */ );
                            }

                            return this.kernel[kernelFunctionName]( nodeID, childName, childComponent, childURI, function( childID ) {
                                callback && callback( childID );
                            } );

                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, childName,
                                [ childComponent, childURI ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "deleteChild":

                return function( nodeID, childName, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, childName );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, childName,
                                undefined, when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "addChild":

                return function( nodeID, childID, childName, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, childID, childName );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                [ childID, childName ], when, callback /* result */ );  // TODO: swap childID & childName?
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "removeChild":

                return function( nodeID, childID, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, childID );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                [ childID ], when, callback /* result */ );  // TODO: swap childID & childName?
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "setProperties":

                return function( nodeID, properties, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, properties );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                [ properties ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }
    
                };

            case "getProperties":

                return function( nodeID, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                undefined, when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };
    
            case "createProperty":

                return function( nodeID, propertyName, propertyValue, propertyGet, propertySet, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, propertyName, propertyValue, propertyGet, propertySet );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, propertyName,
                                [ propertyValue, propertyGet, propertySet ], when, callback /* result */ );  // TODO: { value: propertyValue, get: propertyGet, set: propertySet } ? -- vwf.receive() needs to parse
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            // TODO: deleteProperty

            case "setProperty":

                return function( nodeID, propertyName, propertyValue, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, propertyName, propertyValue );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, propertyName,
                                [ propertyValue ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "getProperty":

                return function( nodeID, propertyName, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, propertyName );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, propertyName,
                                undefined, when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };
    
            case "createMethod":

                return function( nodeID, methodName, methodParameters, methodBody, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, methodName, methodParameters, methodBody );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, methodName,
                                [ methodParameters, methodBody ], when, callback /* result */ );  // TODO: { parameters: methodParameters, body: methodBody } ? -- vwf.receive() needs to parse
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            // TODO: deleteMethod

            case "callMethod":

                return function( nodeID, methodName, methodParameters, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, methodName, methodParameters );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, methodName,
                                [ methodParameters ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };
    
            case "createEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, eventName, eventParameters );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, eventName,
                                [ eventParameters ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            // TODO: deleteEvent

            case "fireEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, eventName, eventParameters );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, eventName,
                                [ eventParameters ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };
    
            case "dispatchEvent":

                return function( nodeID, eventName, eventParameters, eventNodeParameters, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, eventName, eventParameters, eventNodeParameters );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, eventName,
                                [ eventParameters, eventNodeParameters ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };
    
            case "execute":

                return function( nodeID, scriptText, scriptType, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, scriptText, scriptType );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                [ scriptText, scriptType ], when, callback /* result */ );  // TODO: { text: scriptText, type: scriptType } ? -- vwf.receive() needs to parse
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "random":

                return function( nodeID, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                undefined, when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            case "seed":

                return function( nodeID, seed, when, callback ) {

                    if ( this.state.enabled ) {

                        if ( when === undefined ) {
                            return this.kernel[kernelFunctionName]( nodeID, seed );
                        } else {
                            this.kernel.plan( nodeID, kernelFunctionName, undefined,
                                [ seed ], when, callback /* result */ );
                        }

                    } else {
                        this.state.blocked = true;
                    }

                };

            // -- Read-only functions --------------------------------------------------------------

            case "time":
            case "client":
            case "moniker":

            case "application":

            case "intrinsics":
            case "uri":
            case "name":

            case "prototype":
            case "prototypes":
            case "behaviors":

            case "ancestors":
            case "parent":
            case "children":
            case "descendants":

            case "find":
            case "test":
            case "findClients":

                return function() {
                    return this.kernel[kernelFunctionName].apply( this.kernel, arguments );
                };

        }

    } );

} );
