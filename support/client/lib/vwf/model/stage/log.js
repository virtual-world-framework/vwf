define( [ "module", "vwf/model/stage" ], function( module, stage ) {

    return stage.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            this.logger = this.model.logger; // steal the model's logger since we're logging for it
        },
        
    }, function( kernelFunctionName ) {

        // == Kernel API ===========================================================================

        return function() {

            var logees = Array.prototype.slice.call( arguments );

            switch ( kernelFunctionName ) {

                case "createNode":
                    objectIsComponent( logees[0] ) && ( logees[0] = JSON.stringify( loggableComponent( logees[0] ) ) ); // component_uri_or_json_or_object
                    break;

                case "createProperty":
                    logees[3] && ( logees[3] = loggableScript( logees[3] ) ); // propertyGet
                    logees[4] && ( logees[4] = loggableScript( logees[4] ) ); // propertySet
                    break;

                case "execute":
                    logees[1] && ( logees[1] = loggableScript( logees[1] ) ); // scriptText
                    break;

                case "time":
                    logees = undefined; // no logging for kernel.time()
                    break;

            }

            if ( logees ) {
                this.logger.debug.apply( this.logger, [ kernelFunctionName ].concat( logees ) );
            } 

            return this.kernel[kernelFunctionName].apply( this.kernel, arguments );
        };
        
    }, function( modelFunctionName ) {

        // == Model API ============================================================================

        return function() {

            if ( this.model[modelFunctionName] ) {

                var logees = Array.prototype.slice.call( arguments );

                switch ( modelFunctionName ) {

                    case "creatingProperty":
                        logees[3] && ( logees[3] = loggableScript( logees[3] ) ); // propertyGet
                        logees[4] && ( logees[4] = loggableScript( logees[4] ) ); // propertySet
                        break;

                    case "executing":
                        logees[1] && ( logees[1] = loggableScript( logees[1] ) ); // scriptText
                        break;

                    case "ticking":
                        logees = undefined; // no logging for model.ticking()
                        break;

                }

                if ( logees ) {
                    this.logger.debug.apply( this.logger, [ modelFunctionName ].concat( logees ) );
                }

                return this.model[modelFunctionName].apply( this.model, arguments );
            }

        };

    } );

    // == Private functions ========================================================================

    function objectIsComponent( candidate ) {  // TODO: this was copied from vwf.js; find a way to share (use the log stage for incoming logging too?)

        var componentAttributes = [
            "extends",
            "implements",
            "source",
            "type",
            "properties",
            "methods",
            "events",
            "children",
            "scripts",
        ];

        var isComponent = false;

        if ( ( typeof candidate == "object" || candidate instanceof Object ) && candidate != null ) {

            componentAttributes.forEach( function( attributeName ) {
                isComponent = isComponent || Boolean( candidate[attributeName] );
            } );

        }
            
        return isComponent; 
    };

    function loggableComponent( component ) {  // TODO: this was copied from vwf.js; find a way to share (use the log stage for incoming logging too?)

        var loggable = {};

        for ( var elementName in component ) {

            switch ( elementName ) {

                case "properties":

                    loggable.properties = {};

                    for ( var propertyName in component.properties ) {

                        var componentPropertyValue = component.properties[propertyName];
                        var loggablePropertyValue = loggable.properties[propertyName] = {};

                        if ( valueHasAccessors( componentPropertyValue ) ) {
                            for ( var propertyElementName in componentPropertyValue ) {
                                if ( propertyElementName == "set" || propertyElementName == "get" ) {
                                    loggablePropertyValue[propertyElementName] = "...";
                                } else {
                                    loggablePropertyValue[propertyElementName] = componentPropertyValue[propertyElementName];
                                }
                            }
                        } else {
                            loggable.properties[propertyName] = componentPropertyValue;
                        }

                    }

                    break;

                case "children":

                    loggable.children = {};

                    for ( var childName in component.children ) {
                        loggable.children[childName] = {};
                    }

                    break;

                case "scripts":

                    loggable.scripts = [];

                    component.scripts.forEach( function( script ) {

                        var loggableScript = {};

                        for ( var scriptElementName in script ) {
                            loggableScript[scriptElementName] = scriptElementName == "text" ? "..." : script[scriptElementName];
                        }

                        loggable.scripts.push( loggableScript );

                    } );

                    break;

                default:

                    loggable[elementName] = component[elementName];

                    break;
            }

        }

        return loggable;
    }

    function valueHasAccessors( candidate ) {  // TODO: this was copied from vwf.js; find a way to share (use the log stage for incoming logging too?)

        var accessorAttributes = [
            "get",
            "set",
            "value",
        ];

        var hasAccessors = false;

        if ( ( typeof candidate == "object" || candidate instanceof Object ) && candidate != null ) {

            accessorAttributes.forEach( function( attributeName ) {
                hasAccessors = hasAccessors || Boolean( candidate[attributeName] );
            } );

        }
            
        return hasAccessors; 
    }

    function loggableScript( scriptText ) {
        return ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 );
    }

} );
