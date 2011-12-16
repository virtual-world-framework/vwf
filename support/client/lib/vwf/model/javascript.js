define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/javascript.js is a placeholder for the JavaScript object interface to the
    // simulation.

    return model.load( module, {

        // This is a placeholder for providing a natural integration between simulation and the
        // browser's JavaScript environment.
        // 
        // Within the JavaScript environment, component instances appear as JavaScript objects.
        // 
        //   - Properties appear in the "properties" field. Each property contains a getter and
        //     setter callback to notify the object of property manipulation.
        //   - Methods appear in "methods".
        //   - Events appear in "events".
        //   - "parent" refers to the parent node and "children" is an array of the child nodes.
        // 
        //   - Node prototypes use the JavaScript prototype chain.
        //   - Properties, methods, events, and children may be referenced directly on the node or
        //     within their respective collections by name when there is no conflict with another
        //     attribute.
        //   - Properties support getters and setters that invoke a handler that may influence the
        //     property access.

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.types = {}; // maps id => function() { }
            this.root = undefined;
            this.nodes = {}; // maps id => new type()
            this.creatingNode( undefined, 0 ); // global root  // TODO: to allow vwf.children( 0 ), vwf.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childName, callback /* ( ready ) */ ) {

            var self = this;

            var type = childExtendsID ? this.types[childExtendsID] : Object;

            if ( ! type ) {

                var prototype = this.nodes[childExtendsID];

                type = this.types[childExtendsID] = function() { };

                type.prototype = prototype;
                type.prototype.constructor = type; // resetting constructor breaks enumerables?

            }

            var node = this.nodes[childID] = new type( childSource, childType );

node.id = childID; // TODO: move to a backstop model

            node.private = {}; // bookkeeping, not visible to scripts on the node  // TODO: ideally not visible; hide this better ("_private", "vwf_private", ?)

            node.parent = undefined;

            node.source = childSource;
            node.type = childType;

            node.properties = Object.create( Object.getPrototypeOf( node ).properties || Object.prototype, {
                node: { value: node } // for node.properties accessors (non-enumerable)  // TODO: hide this better
            } );

            node.private.getters = {};
            node.private.setters = {};

            node.methods = Object.create( Object.getPrototypeOf( node ).methods || Object.prototype, {
                node: { value: node } // for node.methods accessors (non-enumerable)  // TODO: hide this better
            } );

            node.private.bodies = {};

            node.events = Object.create( Object.getPrototypeOf( node ).events || Object.prototype, {
                node: { value: node } // for node.events accessors (non-enumerable)  // TODO: hide this better
            } );

            node.private.listeners = {};

            node.children = [];  // TODO: connect children's prototype like properties, methods and events do? how, since it's an array? drop the ordered list support and just use an object?

            // Define a "future" proxy so that for any this.property, this.method, or this.event, we
            // can reference this.future( when, callback ).property/method/event and have the
            // expression evaluated at the future time.

            Object.defineProperty( node, "future", {
                value: function( when, callback ) { // "this" is node
                    return refreshedFuture.call( self, this, when, callback );
                },
                enumerable: true,
            } );

            node.private.future = Object.create( Object.getPrototypeOf( node ).private ?
                Object.getPrototypeOf( node ).private.future : Object.prototype
            );

            node.private.future.private = {
                when: 0,
                callback: undefined,
                change: 0,
            };

            node.change = 0; // incremented whenever "future"-related changes occur

        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            var child = this.nodes[nodeID];
            var node = child.parent;

            if ( node ) {

                var index = node.children.indexOf( child );

                if ( index >= 0 ) {
                    node.children.splice( index, 1 );
                }

                delete node.children[child.name];  // TODO: conflict if childName is parseable as a number

                if ( node[child.name] === child ) {
                    delete node[child.name];  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                }

                child.parent = undefined;

            }

            delete this.nodes[nodeID];

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {

            var node = this.nodes[nodeID];
            var child = this.nodes[childID];

            child.name = childName;
            child.parent = node;

            if ( node ) {
                node.children.push( child );
                node.children[childName] = child;  // TODO: conflict if childName is parseable as a number
                node[childName] = child;  // TODO: if no conflict with other names on node
            }

        },

        // TODO: removingChild

        // -- parenting ----------------------------------------------------------------------------

        parenting: function( nodeID ) {  // TODO: move to a backstop model

            var node = this.nodes[nodeID];

            return node.parent && node.parent.id || 0;
        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function( nodeID ) {  // TODO: move to a backstop model

            var node = this.nodes[nodeID];

            return jQuery.map( node.children, function( child ) {
                return child.id;
            } );
        },

        // -- naming -------------------------------------------------------------------------------

        naming: function( nodeID ) {  // TODO: move to a backstop model

            var node = this.nodes[nodeID];

            return node.name || "";
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue, propertyGet, propertySet ) {

            var node = this.nodes[nodeID];
            var self = this;

            Object.defineProperty( node.properties, propertyName, { // "this" is node.properties in get/set
                get: function() { return self.kernel.getProperty( this.node.id, propertyName ) },
                set: function( value ) { self.kernel.setProperty( this.node.id, propertyName, value ) },
                enumerable: true
            } );

            // TODO: only if no conflict with other names on node  TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example

            Object.defineProperty( node, propertyName, { // "this" is node in get/set
                get: function() { return self.kernel.getProperty( this.id, propertyName ) },
                set: function( value ) { self.kernel.setProperty( this.id, propertyName, value ) },
                enumerable: true
            } );

            if ( propertyGet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.private.getters[propertyName] = eval( getterScript( propertyGet ) );
                } catch ( e ) {
                    this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating getter:", exceptionMessage( e ) );
                }
            } else if ( propertyValue !== undefined ) {
                node.private.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }
        
            if ( propertySet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.private.setters[propertyName] = eval( setterScript( propertySet ) );
                } catch ( e ) {
                    this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating setter:", exceptionMessage( e ) );
                }
            } else if ( propertyValue !== undefined ) {
                node.private.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
            }

            node.change++; // invalidate the "future" cache

        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.nodes[nodeID];

if ( ! node ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            if ( ! node.properties.hasOwnProperty( propertyName ) ) {
                this.kernel.createProperty( nodeID, propertyName, undefined );
            }

            var setter = findSetter( node, propertyName );

            if ( setter && setter !== true ) { // is there is a setter (and not just a guard value)
                try {
                    return setter.call( node, propertyValue );
                } catch ( e ) {
                    this.logger.warn( "settingProperty", nodeID, propertyName, propertyValue,
                        "exception in setter:", exceptionMessage( e ) );
                }
            }

            return undefined;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.nodes[nodeID];
            var getter = findGetter( node, propertyName );

            if ( getter && getter !== true ) { // is there is a getter (and not just a guard value)
                try {
                    return getter.call( node );
                } catch ( e ) {
                    this.logger.warn( "gettingProperty", nodeID, propertyName, propertyValue,
                        "exception in getter:", exceptionMessage( e ) );
                }
            }

            return undefined;
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {

            var node = this.nodes[nodeID];
            var self = this;

            Object.defineProperty( node.methods, methodName, { // "this" is node.methods in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) {
                        return self.kernel.callMethod( this.node.id, methodName, arguments );
                    }
                },
                set: function( value ) {
                    this.node.methods.hasOwnProperty( methodName ) ||
                        self.kernel.createMethod( this.node.id, methodName );
                    this.node.private.bodies[methodName] = value;
                },
                enumerable: true,
            } );

            // TODO: only if no conflict with other names on node  TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example

            Object.defineProperty( node, methodName, { // "this" is node in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) {
                        return self.kernel.callMethod( this.id, methodName, arguments );
                    }
                },
                set: function( value ) {
                    this.methods.hasOwnProperty( methodName ) ||
                        self.kernel.createMethod( this.id, methodName );
                    this.private.bodies[methodName] = value;
                },
                enumerable: true,
            } );

            try {
                node.private.bodies[methodName] = eval( bodyScript( methodParameters || [], methodBody || "" ) );
            } catch ( e ) {
                this.logger.warn( "creatingMethod", nodeID, methodName, methodParameters,
                    "exception evaluating body:", exceptionMessage( e ) );
            }
        
            node.change++; // invalidate the "future" cache

        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) {

            var node = this.nodes[nodeID];
            var body = findBody( node, methodName );

            if ( body ) {
                try {
                    return body.apply( node, methodParameters );
                } catch ( e ) {
                    this.logger.warn( "callingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                        "exception:", exceptionMessage( e ) );
                }
            }

            return undefined;
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {

            var node = this.nodes[nodeID];
            var self = this;

            var proxyEvents = function( /* parameter1, parameter2, ... */ ) { // "this" is node.events
                return self.kernel.fireEvent( this.node.id, eventName, arguments );  // TODO: nodeID or this.node.id?
            };

            var proxyNode = function( /* parameter1, parameter2, ... */ ) { // "this" is node
                return self.kernel.fireEvent( this.id, eventName, arguments );  // TODO: nodeID or this.node.id?
            };

            proxyEvents.node = proxyNode.node = node; // for proxyEvents/proxyNode.add/remove/flush

            proxyEvents.add = proxyNode.add = function( handler, context ) { // "this" is node.events[eventName]/node[eventName] == proxyEvents/proxyNode
                var listeners = this.node.private.listeners[eventName] || ( this.node.private.listeners[eventName] = [] );  // TODO: verify created on first access if on base but not derived
                listeners.push( { handler: handler, context: context } );
            };

            proxyEvents.remove = proxyNode.remove = function( handler ) { // "this" is node.events[eventName]/node[eventName] == proxyEvents/proxyNode
                this.node.private.listeners[eventName] = ( this.node.private.listeners[eventName] || [] ).filter( function( listener ) {
                    return listener.handler !== handler;
                } );
            };

            proxyEvents.flush = proxyNode.flush = function( context ) { // "this" is node.events[eventName]/node[eventName] == proxyEvents/proxyNode
                this.node.private.listeners[eventName] = ( this.node.private.listeners[eventName] || [] ).filter( function( listener ) {
                    return listener.context !== context;
                } );
            };

            Object.defineProperty( node.events, eventName, {
                value: proxyEvents,  // TODO: invoked with this as derived when only defined on base?
                enumerable: true,
            } );

            // TODO: only if no conflict with other names on node  TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example

            Object.defineProperty( node, eventName, { // "this" is node in get/set
                value: proxyNode,  // TODO: invoked with this as derived when only defined on base?
                enumerable: true,
            } );

            node.private.listeners[eventName] = [];

            node.change++; // invalidate the "future" cache

        },

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {

            var node = this.nodes[nodeID];
            var listeners = node.private.listeners[eventName];

            listeners && listeners.forEach( function( listener ) {
                try {
                    return listener.handler.apply( listener.context, eventParameters );
                } catch ( e ) {
                    this.logger.warn( "firingEvent", nodeID, eventName, eventParameters,  // TODO: limit eventParameters for log
                        "exception:", exceptionMessage( e ) );
                }
            }, this );

            return undefined;
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {

            var node = this.nodes[nodeID];

            if ( scriptType == "application/javascript" ) {
                try {
                    return ( function( scriptText ) { return eval( scriptText ) } ).call( node, scriptText );
                } catch ( e ) {
                    this.logger.warn( "executing", nodeID,
                        ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType, "exception:", exceptionMessage( e ) );
                }
            }

            return undefined;
        },

    } );

    // == Private functions ========================================================================

    // -- refreshedFuture --------------------------------------------------------------------------

    function refreshedFuture( node, when, callback ) { // invoke with the model as "this"

        var self = this;

        if ( Object.getPrototypeOf( node ).private ) {
            refreshedFuture.call( this, Object.getPrototypeOf( node ) );
        }

        var future = node.private.future;

        future.private.when = when;
        future.private.callback = callback;  // TODO: would like to be able to remove this reference after the future call has completed

        if ( future.private.change < node.change ) { // only if out of date

            future.id = node.id;

            future.properties = Object.create( Object.getPrototypeOf( future ).properties || Object.prototype, {
                future: { value: future } // for future.properties accessors (non-enumerable)  // TODO: hide this better
            } );

            for ( var propertyName in node.properties ) {

                if ( node.properties.hasOwnProperty( propertyName ) ) {

                    ( function( propertyName ) {

                        Object.defineProperty( future.properties, propertyName, { // "this" is future.properties in get/set
                            get: function() { return self.kernel.getProperty( this.future.id,
                                propertyName, -this.future.private.when, this.future.private.callback
                            ) },
                            set: function( value ) { self.kernel.setProperty( this.future.id,
                                propertyName, value, -this.future.private.when, this.future.private.callback
                            ) },
                            enumerable: true
                        } );

                        Object.defineProperty( future, propertyName, { // "this" is future in get/set
                            get: function() { return self.kernel.getProperty( this.id,
                                propertyName, -this.private.when, this.private.callback
                            ) },
                            set: function( value ) { self.kernel.setProperty( this.id,
                                propertyName, value, -this.private.when, this.private.callback
                            ) },
                            enumerable: true
                        } );

                    } )( propertyName );
                
                }
    
            }

            future.methods = Object.create( Object.getPrototypeOf( future ).methods || Object.prototype, {
                future: { value: future } // for future.methods accessors (non-enumerable)  // TODO: hide this better
            } );

            for ( var methodName in node.methods ) {

                if ( node.methods.hasOwnProperty( methodName ) ) {

                    ( function( methodName ) {

                        Object.defineProperty( future.methods, methodName, { // "this" is future.methods in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) {
                                    return self.kernel.callMethod( this.future.id,
                                        methodName, arguments, -this.future.private.when, this.future.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        } );

                        Object.defineProperty( future, methodName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) {
                                    return self.kernel.callMethod( this.id,
                                        methodName, arguments, -this.private.when, this.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        } );

                    } )( methodName );

                }

            }

            future.events = Object.create( Object.getPrototypeOf( future ).events || Object.prototype, {
                future: { value: future } // for future.events accessors (non-enumerable)  // TODO: hide this better
            } );

            for ( var eventName in node.events ) {

                if ( node.events.hasOwnProperty( eventName ) ) {

                    ( function( eventName ) {

                        Object.defineProperty( future.events, eventName, {
                            value: function( /* parameter1, parameter2, ... */ ) { // "this" is future.events
                                return self.kernel.fireEvent( this.future.id,
                                    eventName, arguments, -this.future.private.when, this.future.private.callback
                                );
                            },
                            enumerable: true,
                        } );

                        Object.defineProperty( future, eventName, {
                            value: function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                return self.kernel.fireEvent( this.id,
                                    eventName, arguments, -this.private.when, this.private.callback
                                );
                            },
                            enumerable: true,
                        } );

                    } )( eventName );

                }

            }

            future.private.change = node.change;

        }

        return future;
    }

    // -- getterScript -----------------------------------------------------------------------------

    function getterScript( body ) {
        return accessorScript( "( function() {", body, "} )" );
    }

    // -- setterScript -----------------------------------------------------------------------------

    function setterScript( body ) {
        return accessorScript( "( function( value ) {", body, "} )" );
    }

    // -- bodyScript -------------------------------------------------------------------------------

    function bodyScript( parameters, body ) {
        var parameterString = ( parameters.length ? " " + parameters.join( ", " ) + " " : ""  );
        return accessorScript( "( function(" + parameterString + ") {", body, "} )" );
        // return accessorScript( "( function(" + ( parameters.length ? " " + parameters.join( ", " ) + " " : ""  ) + ") {", body, "} )" );
    }

    // -- accessorScript ---------------------------------------------------------------------------

    function accessorScript( prefix, body, suffix ) {  // TODO: sanitize script, limit access
        if ( body.length && body.charAt( body.length-1 ) == "\n" ) {
            var bodyString = body.replace( /^./gm, "  $&" );
            return prefix + "\n" + bodyString + suffix + "\n";
        } else {
            var bodyString = body.length ? " " + body + " " : "";
            return prefix + bodyString + suffix;
        }
    }

    // -- findGetter -------------------------------------------------------------------------------

    function findGetter( node, propertyName ) {
        return node.private.getters && node.private.getters[propertyName] ||
            Object.getPrototypeOf( node ).private && findGetter( Object.getPrototypeOf( node ), propertyName );
    }

    // -- findSetter -------------------------------------------------------------------------------

    function findSetter( node, propertyName ) {
        return node.private.setters && node.private.setters[propertyName] ||
            Object.getPrototypeOf( node ).private && findSetter( Object.getPrototypeOf( node ), propertyName );
    }

    // -- findBody ---------------------------------------------------------------------------------

    function findBody( node, methodName ) {
        return node.private.bodies && node.private.bodies[methodName] ||
            Object.getPrototypeOf( node ).private && findBody( Object.getPrototypeOf( node ), methodName );
    }

    // -- exceptionMessage -------------------------------------------------------------------------

    // Format the stack trace for readability.

    function exceptionMessage( exception ) {

        // https://github.com/eriwen/javascript-stacktrace sniffs the browser type from the
        // exception this way.

        if ( exception.arguments && exception.stack ) { // Chrome

            return "\n  " + exception.stack;

        } else if ( window && window.opera ) { // Opera

            return exception.toString();

        } else if ( exception.stack ) { // Firefox

            return "\n  " + exception.toString() + "\n" + // somewhat like Chrome's
                exception.stack.replace( /^/mg, "    " );

        } else { // default

            return exception.toString();

        }

    }

    // == Node =====================================================================================

    // var node = function( nodeSource, nodeType ) {
    // 
    //     this.parent = undefined;
    // 
    //     // this.name = nodeName;
    // 
    //     this.source = nodeSource;
    //     this.type = nodeType;
    // 
    //     this.properties = {};
    //     this.methods = {};
    //     this.events = {};
    //     this.children = [];
    // 
    // };

    // == Property =================================================================================

    // var property = function( node, value ) {
    // 
    //     this.node = node; // TODO: make private
    //     this.value = value;
    //     this.get = undefined;
    //     this.set = undefined;
    // 
    // };

} );
