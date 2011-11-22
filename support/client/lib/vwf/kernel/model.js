define( [ "module", "vwf/model" ], function( module, model ) {

    return model.load( module, {

        // == Module Definition ====================================================================
        
    }, function( kernelFunctionName ) {

        // == Kernel API ===========================================================================

        switch ( kernelFunctionName ) {

            case "createNode":

                return function( nodeID, childComponent, childName, when, callback /* ( childID ) */ ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, childComponent, childName, function( childID ) {
                            callback && callback( childID );
                        } );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, undefined,
                            [ childComponent, childName ], callback /* ( result ) */ );  // TODO: swap childComponent & childName
                    }

                };

            // TODO: deleteNode

            case "addChild":

                return function( nodeID, childID, childName, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, childID, childName );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, undefined,
                            [ childID, childName ], callback /* ( result ) */ );  // TODO: swap childID & childName?
                    }

                };

            case "removeChild":

                return function( nodeID, childID, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, childID );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, undefined,
                            [ childID ], callback /* ( result ) */ );  // TODO: swap childID & childName?
                    }

                };

            case "createProperty":

                return function( nodeID, propertyName, propertyValue, propertyGet, propertySet, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, propertyName, propertyValue, propertyGet, propertySet );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, propertyName,
                            [ propertyValue, propertyGet, propertySet ], callback /* ( result ) */ );  // TODO: { value: propertyValue, get: propertyGet, set: propertySet } ? -- vwf.receive() needs to parse
                    }

                };

            // TODO: deleteProperty

            case "setProperty":

                return function( nodeID, propertyName, propertyValue, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, propertyName, propertyValue );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, propertyName,
                            [ propertyValue ], callback /* ( result ) */ );
                    }

                };

            case "getProperty":

                return function( nodeID, propertyName, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, propertyName );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, propertyName,
                            undefined, callback /* ( result ) */ );
                    }

                };
    
            case "createMethod":

                return function( nodeID, methodName, methodParameters, methodBody, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, methodName, methodParameters, methodBody );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, methodName,
                            [ methodParameters, methodBody ], callback /* ( result ) */ );  // TODO: { parameters: methodParameters, body: methodBody } ? -- vwf.receive() needs to parse
                    }

                };

            // TODO: deleteMethod

            case "callMethod":

                return function( nodeID, methodName, methodParameters, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, methodName, methodParameters );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, methodName,
                            [ methodParameters ], callback /* ( result ) */ );
                    }

                };
    
            case "createEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, eventName, eventParameters );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, eventName,
                            [ eventParameters ], callback /* ( result ) */ );
                    }

                };

            // TODO: deleteEvent

            case "fireEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, eventName, eventParameters );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, eventName,
                            [ eventParameters ], callback /* ( result ) */ );
                    }

                };
    
            case "execute":

                return function( nodeID, scriptText, scriptType, when, callback ) {

                    if ( when === undefined ) {
                        return this.kernel[kernelFunctionName]( nodeID, scriptText, scriptType );
                    } else {
                        this.kernel.queue( when, nodeID, kernelFunctionName, undefined,
                            [ scriptText, scriptType ], callback /* ( result ) */ );  // TODO: { text: scriptText, type: scriptType } ? -- vwf.receive() needs to parse
                    }

                };

            // TODO: time

            default:

                return function() {
                    return this.kernel[kernelFunctionName].apply( this.kernel, arguments );
                }

        }

    }, function( modelFunctionName ) {

        // == Model API ============================================================================

        return undefined;

    } );

} );
