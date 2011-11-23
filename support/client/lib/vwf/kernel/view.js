define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        // == Module Definition ====================================================================
        
    }, function( kernelFunctionName ) {

        // == Kernel API ===========================================================================

        switch ( kernelFunctionName ) {

            case "createNode":

                return function( nodeID, childComponent, childName, when, callback /* ( childID ) */ ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, undefined,
                        [ childComponent, childName ], callback /* ( result ) */ );  // TODO: swap childComponent & childName
                };

            case "deleteNode":

                return function( nodeID, childName, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, childName,
                        undefined, callback /* ( result ) */ );
                };

            case "addChild":
            
                return function( nodeID, childID, childName, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, undefined,
                        [ childID, childName ], callback /* ( result ) */ );  // TODO: swap childID & childName?
                };

            case "removeChild":

                return function( nodeID, childID, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, undefined,
                        [ childID ], callback /* ( result ) */ );  // TODO: swap childID & childName?
                };

            case "createProperty":

                return function( nodeID, propertyName, propertyValue, propertyGet, propertySet, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, propertyName,
                        [ propertyValue, propertyGet, propertySet ], callback /* ( result ) */ );  // TODO: { value: propertyValue, get: propertyGet, set: propertySet } ? -- vwf.receive() needs to parse
                };

            // TODO: deleteProperty

            case "setProperty":

                return function( nodeID, propertyName, propertyValue, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, propertyName,
                        [ propertyValue ], callback /* ( result ) */ );
                };

            case "getProperty":

                return function( nodeID, propertyName, when, callback ) {
                        this.kernel.send( when || 0, nodeID, kernelFunctionName, propertyName,
                            undefined, callback /* ( result ) */ );
                };
    
            case "createMethod":

                return function( nodeID, methodName, methodParameters, methodBody, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, methodName,
                        [ methodParameters, methodBody ], callback /* ( result ) */ );  // TODO: { parameters: methodParameters, body: methodBody } ? -- vwf.receive() needs to parse
                };

            // TODO: deleteMethod

            case "callMethod":

                return function( nodeID, methodName, methodParameters, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, methodName,
                        [ methodParameters ], callback /* ( result ) */ );
                };
    
            case "createEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, eventName,
                        [ eventParameters ], callback /* ( result ) */ );
                };

            // TODO: deleteEvent

            case "fireEvent":

                return function( nodeID, eventName, eventParameters, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, eventName,
                        [ eventParameters ], callback /* ( result ) */ );
                };
    
            case "execute":

                return function( nodeID, scriptText, scriptType, when, callback ) {
                    this.kernel.send( when || 0, nodeID, kernelFunctionName, undefined,
                        [ scriptText, scriptType ], callback /* ( result ) */ );  // TODO: { text: scriptText, type: scriptType } ? -- vwf.receive() needs to parse
                };

            // TODO: time

        }

    }, function( viewFunctionName ) {

        // == View API =============================================================================

        return undefined;

    } );

} );
