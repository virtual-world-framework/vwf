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

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

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
            this.nodes = {}; // maps id => new type()
            this.creatingNode( undefined, 0 ); // global root  // TODO: to allow vwf.children( 0 ), vwf.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            var self = this;

            // Get the prototype node.

            var prototype = this.nodes[childExtendsID] || Object.prototype;

            // Get the behavior nodes.

            var behaviors = ( childImplementsIDs || [] ).map( function( childImplementsID ) {
                return self.nodes[childImplementsID];
            } );

            // For each behavior, create a proxy for this node to the behavior and attach it above
            // the prototype, or above the most recently-attached behavior.

            behaviors.forEach( function( behavior ) {
                prototype = proxiedBehavior.call( self, prototype, behavior );
            } );

            // Create the node. It's prototype is the most recently-attached behavior, or the
            // specific prototype if no behaviors are attached.

            var node = this.nodes[childID] = Object.create( prototype );

            Object.defineProperty( node, "private", {
                value: {} // for bookkeeping, not visible to scripts on the node  // TODO: well, ideally not visible; hide this better ("_private", "vwf_private", ?)
            } );

node.id = childID; // TODO: move to vwf/model/object
node.uri = childURI; // TODO: move to vwf/model/object

            node.name = childName;

            node.parent = undefined;

            node.source = childSource;
            node.type = childType;

            Object.defineProperty( node, "logger", {
                value: this.logger.for( "#" + ( childName || childURI || childID ), node ),
                enumerable: true,
            } );

            node.properties = Object.create( prototype.properties || Object.prototype, {
                node: { value: node } // for node.properties accessors (non-enumerable)  // TODO: hide this better
            } );

            Object.defineProperty( node.properties, "create", {
                value: function( name, value, get, set ) { // "this" is node.properties
                    return self.kernel.createProperty( this.node.id, name, value, get, set );
                }
            } );

            node.private.getters = Object.create( prototype.private ?
                prototype.private.getters : Object.prototype
            );

            node.private.setters = Object.create( prototype.private ?
                prototype.private.setters : Object.prototype
            );

            node.methods = Object.create( prototype.methods || Object.prototype, {
                node: { value: node } // for node.methods accessors (non-enumerable)  // TODO: hide this better
            } );

            Object.defineProperty( node.methods, "create", {
                value: function( name, parameters, body ) { // "this" is node.methods  // TODO: also accept create( name, body )
                    return self.kernel.createMethod( this.node.id, name, parameters, body );
                }
            } );

            node.private.bodies = Object.create( prototype.private ?
                prototype.private.bodies : Object.prototype
            );

            node.events = Object.create( prototype.events || Object.prototype, {
                node: { value: node }, // for node.events accessors (non-enumerable)  // TODO: hide this better
            } );

            // TODO: these only need to be on the base node's events object

            Object.defineProperty( node.events, "create", {
                value: function( name, parameters ) { // "this" is node.events
                    return self.kernel.createEvent( this.node.id, name, parameters );
                }
            } );

            // Provide helper functions to create the directives for adding, removing and flushing
            // event handlers.

            // Add: node.events.*eventName* = node.events.add( *handler* [, *phases* ] [, *context* ] )

            Object.defineProperty( node.events, "add", {
                value: function( handler, phases, context ) {
                    if ( arguments.length != 2 || typeof phases == "string" || phases instanceof String || phases instanceof Array ) {
                        return { add: true, handler: handler, phases: phases, context: context };
                    } else { // interpret add( handler, context ) as add( handler, undefined, context )
                        return { add: true, handler: handler, context: phases };
                    }
                }
            } );

            // Remove: node.events.*eventName* = node.events.remove( *handler* )

            Object.defineProperty( node.events, "remove", {
                value: function( handler ) {
                    return { remove: true, handler: handler };
                }
            } );

            // Flush: node.events.*eventName* = node.events.flush( *context* )

            Object.defineProperty( node.events, "flush", {
                value: function( context ) {
                    return { flush: true, context: context };
                }
            } );

            node.private.listeners = {}; // not delegated to the prototype as with getters, setters, and bodies; findListeners() filters recursion

            node.children = [];  // TODO: connect children's prototype like properties, methods and events do? how, since it's an array? drop the ordered list support and just use an object?

            Object.defineProperty( node.children, "node", {
                value: node // for node.children accessors (non-enumerable)  // TODO: hide this better
            } );

            Object.defineProperty( node.children, "create", {
                value: function( name, component, callback /* ( child ) */ ) { // "this" is node.children
                    if ( callback ) {
                        self.kernel.createChild( this.node.id, name, component, undefined, undefined, function( childID ) {
                            callback.call( node, self.nodes[childID] );
                        } );
                    } else { 
                        return self.kernel.createChild( this.node.id, name, component );
                    }
                }
            } );

            Object.defineProperty( node.children, "delete", {
                value: function( child ) {
                    return self.kernel.deleteNode( child.id );
                }
            } );

            // Define the "random" and "seed" functions.

            Object.defineProperty( node, "random", { // "this" is node
                value: function() {
                    return self.kernel.random( this.id );
                }
            } );

            Object.defineProperty( node, "seed", { // "this" is node
                value: function( seed ) {
                    return self.kernel.seed( this.id, seed );
                }
            } );

            // Define the "time", "client", and "moniker" properties.

            Object.defineProperty( node, "time", {  // TODO: only define on shared "node" prototype?
                get: function() {
                    return self.kernel.time();
                },
                enumerable: true,
            } );

            Object.defineProperty( node, "client", {  // TODO: only define on shared "node" prototype?
                get: function() {
                    return self.kernel.client();
                },
                enumerable: true,
            } );

            Object.defineProperty( node, "moniker", {  // TODO: only define on shared "node" prototype?
                get: function() {
                    return self.kernel.moniker();
                },
                enumerable: true,
            } );

            Object.defineProperty( node, "find", {
                value: function( matchPattern, callback /* ( match ) */ ) { // "this" is node
                    if ( callback ) {
                        self.kernel.find( this.id, matchPattern, function( matchID ) {
                            callback.call( node, self.nodes[matchID] );
                        } );
                    } else {  // TODO: future iterator proxy
                        return self.kernel.find( this.id, matchPattern ).map( function( matchID ) {
                            return self.nodes[matchID];
                        } );
                    }
                }
            } );

            Object.defineProperty( node, "test", {
                value: function( matchPattern, testNode ) { // "this" is node
                    return self.kernel.test( this.id, matchPattern, testNode.id );
                }
            } );

            // Define a "future" proxy so that for any this.property, this.method, or this.event, we
            // can reference this.future( when, callback ).property/method/event and have the
            // expression evaluated at the future time.

            Object.defineProperty( node, "in", {  // TODO: only define on shared "node" prototype?
                value: function( when, callback ) { // "this" is node
                    return refreshedFuture.call( self, this, -when, callback ); // relative time
                },
                enumerable: true,
            } );

            Object.defineProperty( node, "at", {  // TODO: only define on shared "node" prototype?
                value: function( when, callback ) { // "this" is node
                    return refreshedFuture.call( self, this, when, callback ); // absolute time
                },
                enumerable: true,
            } );

            Object.defineProperty( node, "future", { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function() {
                    return this.in;
                },
                enumerable: true,
            } );

            node.private.future = Object.create( prototype.private ?
                prototype.private.future : Object.prototype
            );

            Object.defineProperty( node.private.future, "private", {
                value: {
                    when: 0,
                    callback: undefined,
                    change: 0,
                }
            } );

            node.private.change = 1; // incremented whenever "future"-related changes occur

        },

        // -- initializingNode ---------------------------------------------------------------------

        // Invoke an initialize() function if one exists.

        initializingNode: function( nodeID, childID ) {

            var child = this.nodes[childID];
            var scriptText = "this.initialize && this.initialize()";

            try {
                return ( function( scriptText ) { return eval( scriptText ) } ).call( child, scriptText );
            } catch ( e ) {
                this.logger.warnx( "initializingNode", childID,
                    "exception in initialize:", utility.exceptionMessage( e ) );
            }

            return undefined;
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

            child.parent = node;

            if ( node ) {

                node.children.push( child );
                node.children[childName] = child;  // TODO: conflict if childName is parseable as a number

node.hasOwnProperty( childName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                ( node[childName] = child );

            }

        },

        // TODO: removingChild

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue, propertyGet, propertySet ) {

            var node = this.nodes[nodeID];

            if ( propertyGet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.private.getters[propertyName] = eval( getterScript( propertyGet ) );
                } catch ( e ) {
                    this.logger.warnx( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating getter:", utility.exceptionMessage( e ) );
                }
            } else {
                node.private.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }
        
            if ( propertySet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.private.setters[propertyName] = eval( setterScript( propertySet ) );
                } catch ( e ) {
                    this.logger.warnx( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating setter:", utility.exceptionMessage( e ) );
                }
            } else {
                node.private.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
            }

            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.nodes[nodeID];
            var self = this;

            Object.defineProperty( node.properties, propertyName, { // "this" is node.properties in get/set
                get: function() { return self.kernel.getProperty( this.node.id, propertyName ) },
                set: function( value ) { self.kernel.setProperty( this.node.id, propertyName, value ) },
                enumerable: true
            } );

node.hasOwnProperty( propertyName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            Object.defineProperty( node, propertyName, { // "this" is node in get/set
                get: function() { return self.kernel.getProperty( this.id, propertyName ) },
                set: function( value ) { self.kernel.setProperty( this.id, propertyName, value ) },
                enumerable: true
            } );

            node.private.change++; // invalidate the "future" cache

            return propertyValue !== undefined ?
                this.settingProperty( nodeID, propertyName, propertyValue ) : undefined;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.nodes[nodeID];

if ( ! node ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            var setter = node.private.setters && node.private.setters[propertyName];

            if ( setter && setter !== true ) { // is there is a setter (and not just a guard value)
                try {
                    return setter.call( node, propertyValue );
                } catch ( e ) {
                    this.logger.warnx( "settingProperty", nodeID, propertyName, propertyValue,
                        "exception in setter:", utility.exceptionMessage( e ) );
                }
            }

            return undefined;
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.nodes[nodeID];
            var getter = node.private.getters && node.private.getters[propertyName];

            if ( getter && getter !== true ) { // is there is a getter (and not just a guard value)
                try {
                    return getter.call( node );
                } catch ( e ) {
                    this.logger.warnx( "gettingProperty", nodeID, propertyName, propertyValue,
                        "exception in getter:", utility.exceptionMessage( e ) );
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
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.methods
                        return self.kernel.callMethod( this.node.id, methodName, arguments );
                    };
                },
                set: function( value ) {
                    this.node.methods.hasOwnProperty( methodName ) ||
                        self.kernel.createMethod( this.node.id, methodName );
                    this.node.private.bodies[methodName] = value;
                },
                enumerable: true,
            } );

node.hasOwnProperty( methodName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            Object.defineProperty( node, methodName, { // "this" is node in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node
                        return self.kernel.callMethod( this.id, methodName, arguments );
                    };
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
                this.logger.warnx( "creatingMethod", nodeID, methodName, methodParameters,
                    "exception evaluating body:", utility.exceptionMessage( e ) );
            }
        
            node.private.change++; // invalidate the "future" cache

        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters ) {

            var node = this.nodes[nodeID];
            var body = node.private.bodies && node.private.bodies[methodName];

            if ( body ) {
                try {
                    return body.apply( node, methodParameters );
                } catch ( e ) {
                    this.logger.warnx( "callingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage( e ) );
                }
            }

            return undefined;
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {

            var node = this.nodes[nodeID];
            var self = this;

            Object.defineProperty( node.events, eventName, { // "this" is node.events in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.events
                        return self.kernel.fireEvent( this.node.id, eventName, arguments );
                    };
                },
                set: function( value ) {
                    var listeners = this.node.private.listeners[eventName] ||
                        ( this.node.private.listeners[eventName] = [] ); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if ( typeof value == "function" || value instanceof Function ) {
                        listeners.push( { handler: value, context: this.node } ); // for node.events.*event* = function() { ... }, context is the target node
                    } else if ( value.add ) {
                        if ( ! value.phases || value.phases instanceof Array ) {
                            listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                        } else {
                            listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                        }
                    } else if ( value.remove ) {
                        this.node.private.listeners[eventName] = listeners.filter( function( listener ) {
                            return listener.handler !== value.handler;
                        } );
                    } else if ( value.flush ) {
                        this.node.private.listeners[eventName] = listeners.filter( function( listener ) {
                            return listener.context !== value.context;
                        } );
                    }
                },
                enumerable: true,
            } );

node.hasOwnProperty( eventName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            Object.defineProperty( node, eventName, { // "this" is node in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node
                        return self.kernel.fireEvent( this.id, eventName, arguments );
                    };
                },
                set: function( value ) {
                    var listeners = this.private.listeners[eventName] ||
                        ( this.private.listeners[eventName] = [] ); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if ( typeof value == "function" || value instanceof Function ) {
                        listeners.push( { handler: value, context: this } ); // for node.*event* = function() { ... }, context is the target node
                    } else if ( value.add ) {
                        if ( ! value.phases || value.phases instanceof Array ) {
                            listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                        } else {
                            listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                        }
                    } else if ( value.remove ) {
                        this.private.listeners[eventName] = listeners.filter( function( listener ) {
                            return listener.handler !== value.handler;
                        } );
                    } else if ( value.flush ) {
                        this.private.listeners[eventName] = listeners.filter( function( listener ) {
                            return listener.context !== value.context;
                        } );
                    }
                },
                enumerable: true,
            } );

            node.private.listeners[eventName] = [];

            node.private.change++; // invalidate the "future" cache

        },

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {

            var phase = eventParameters && eventParameters.phase; // the phase is smuggled across on the parameters array  // TODO: add "phase" as a fireEvent() parameter? it isn't currently needed in the kernel public API (not queueable, not called by the drivers), so avoid if possible

            var node = this.nodes[nodeID];
            var listeners = findListeners( node, eventName );

            var self = this;

            // Call the handlers registered for the event, and calculate the logical OR of each
            // result. Normally, callers to fireEvent() ignore the handler result, but dispatched
            // events use the return value to determine when an event has been handled as it bubbles
            // up from its target.

            var handled = listeners && listeners.reduce( function( handled, listener ) {

                // Call the handler. If a phase is provided, only call handlers tagged for that
                // phase.

                try {
                    if ( ! phase || listener.phases && listener.phases.indexOf( phase ) >= 0 ) {
                        var result = listener.handler.apply( listener.context || self.nodes[0], eventParameters ); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above
                        return handled || result || result === undefined; // interpret no return as "return true"
                    }
                } catch ( e ) {
                    self.logger.warnx( "firingEvent", nodeID, eventName, eventParameters,  // TODO: limit eventParameters for log
                        "exception:", utility.exceptionMessage( e ) );
                }

                return handled;

            }, false );

            return handled;
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {

            var node = this.nodes[nodeID];

            if ( scriptType == "application/javascript" ) {
                try {
                    return ( function( scriptText ) { return eval( scriptText ) } ).call( node, scriptText );
                } catch ( e ) {
                    this.logger.warnx( "executing", nodeID,
                        ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType, "exception:", utility.exceptionMessage( e ) );
                }
            }

            return undefined;
        },

    } );

    // == Private functions ========================================================================

    // -- proxiedBehavior --------------------------------------------------------------------------

    function proxiedBehavior( prototype, behavior ) { // invoke with the model as "this"  // TODO: this is a lot like createProperty()/createMethod()/createEvent(), and refreshedFuture(). Find a way to merge.  // TODO: nodes need to keep a list of proxies on them and callback here to refresh after changes

        var self = this;

        var proxy = Object.create( prototype );

        Object.defineProperty( proxy, "private", {
            value: {}
        } );

        proxy.private.origin = behavior; // the node we're the proxy for

proxy.id = behavior.id; // TODO: move to vwf/model/object

        proxy.name = behavior.name;

        proxy.parent = behavior.parent;

        proxy.source = behavior.source;
        proxy.type = behavior.type;

        proxy.properties = Object.create( prototype.properties || Object.prototype, {
            node: { value: proxy } // for proxy.properties accessors (non-enumerable)  // TODO: hide this better
        } );

        proxy.private.getters = Object.create( prototype.private ?
            prototype.private.getters : Object.prototype
        );

        proxy.private.setters = Object.create( prototype.private ?
            prototype.private.setters : Object.prototype
        );

        for ( var propertyName in behavior.properties ) {

            if ( behavior.properties.hasOwnProperty( propertyName ) ) {

                ( function( propertyName ) {

                    Object.defineProperty( proxy.properties, propertyName, { // "this" is proxy.properties in get/set
                        get: function() { return self.kernel.getProperty( this.node.id, propertyName ) },
                        set: function( value ) { self.kernel.setProperty( this.node.id, propertyName, value ) },
                        enumerable: true
                    } );

proxy.hasOwnProperty( propertyName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty( proxy, propertyName, { // "this" is proxy in get/set
                        get: function() { return self.kernel.getProperty( this.id, propertyName ) },
                        set: function( value ) { self.kernel.setProperty( this.id, propertyName, value ) },
                        enumerable: true
                    } );

                } )( propertyName );
            
                if ( behavior.private.getters.hasOwnProperty( propertyName ) ) {
                    proxy.private.getters[propertyName] = behavior.private.getters[propertyName];
                }

                if ( behavior.private.setters.hasOwnProperty( propertyName ) ) {
                    proxy.private.setters[propertyName] = behavior.private.setters[propertyName];
                }

            }

        }

        proxy.methods = Object.create( prototype.methods || Object.prototype, {
            node: { value: proxy } // for proxy.methods accessors (non-enumerable)  // TODO: hide this better
        } );

        proxy.private.bodies = Object.create( prototype.private ?
            prototype.private.bodies : Object.prototype
        );

        for ( var methodName in behavior.methods ) {

            if ( behavior.methods.hasOwnProperty( methodName ) ) {

                ( function( methodName ) {

                    Object.defineProperty( proxy.methods, methodName, { // "this" is proxy.methods in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.methods
                                return self.kernel.callMethod( this.node.id, methodName, arguments );
                            };
                        },
                        set: function( value ) {
                            this.node.methods.hasOwnProperty( methodName ) ||
                                self.kernel.createMethod( this.node.id, methodName );
                            this.node.private.bodies[methodName] = value;
                        },
                        enumerable: true,
                    } );

proxy.hasOwnProperty( methodName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty( proxy, methodName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return self.kernel.callMethod( this.id, methodName, arguments );
                            };
                        },
                        set: function( value ) {
                            this.methods.hasOwnProperty( methodName ) ||
                                self.kernel.createMethod( this.id, methodName );
                            this.private.bodies[methodName] = value;
                        },
                        enumerable: true,
                    } );

                } )( methodName );
            
                if ( behavior.private.bodies.hasOwnProperty( methodName ) ) {
                    proxy.private.bodies[methodName] = behavior.private.bodies[methodName];
                }

            }

        }

        proxy.events = Object.create( prototype.events || Object.prototype, {
            node: { value: proxy } // for proxy.events accessors (non-enumerable)  // TODO: hide this better
        } );

        proxy.private.listeners = {}; // not delegated to the prototype as with getters, setters, and bodies; findListeners() filters recursion

        for ( var eventName in behavior.events ) {

            if ( behavior.events.hasOwnProperty( eventName ) ) {

                ( function( eventName ) {

                    Object.defineProperty( proxy.events, eventName, { // "this" is proxy.events in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.events
                                return self.kernel.fireEvent( this.node.id, eventName, arguments );
                            };
                        },
                        set: function( value ) {
                            var listeners = this.node.private.listeners[eventName] ||
                                ( this.node.private.listeners[eventName] = [] ); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if ( typeof value == "function" || value instanceof Function ) {
                                listeners.push( { handler: value, context: this.node } ); // for node.events.*event* = function() { ... }, context is the target node
                            } else if ( value.add ) {
                                if ( ! value.phases || value.phases instanceof Array ) {
                                    listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                                } else {
                                    listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                                }
                            } else if ( value.remove ) {
                                this.node.private.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.handler !== value.handler;
                                } );
                            } else if ( value.flush ) {
                                this.node.private.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.context !== value.context;
                                } );
                            }
                        },
                        enumerable: true,
                    } );

proxy.hasOwnProperty( eventName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty( proxy, eventName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return self.kernel.fireEvent( this.id, eventName, arguments );
                            };
                        },
                        set: function( value ) {
                            var listeners = this.private.listeners[eventName] ||
                                ( this.private.listeners[eventName] = [] ); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if ( typeof value == "function" || value instanceof Function ) {
                                listeners.push( { handler: value, context: this } ); // for node.*event* = function() { ... }, context is the target node
                            } else if ( value.add ) {
                                if ( ! value.phases || value.phases instanceof Array ) {
                                    listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                                } else {
                                    listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                                }
                            } else if ( value.remove ) {
                                this.private.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.handler !== value.handler;
                                } );
                            } else if ( value.flush ) {
                                this.private.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.context !== value.context;
                                } );
                            }
                        },
                        enumerable: true,
                    } );

                } )( eventName );

            }

        }

        for ( var eventName in behavior.private.listeners ) { // outside of the behavior.events loop as with getters, setters, and bodies; listeners may appear above the event definition
            if ( behavior.private.listeners.hasOwnProperty( eventName ) ) {
                proxy.private.listeners[eventName] = behavior.private.listeners[eventName];
            }
        }

        proxy.private.future = Object.create( prototype.private ?
            prototype.private.future : Object.prototype
        );

        Object.defineProperty( proxy.private.future, "private", {
            value: {
                when: 0,
                callback: undefined,
                change: 0,
            }
        } );

        proxy.private.change = behavior.private.change;

        return proxy;
    }

    // -- refreshedFuture --------------------------------------------------------------------------

    function refreshedFuture( node, when, callback ) { // invoke with the model as "this"

        var self = this;

        if ( Object.getPrototypeOf( node ).private ) {
            refreshedFuture.call( this, Object.getPrototypeOf( node ) );
        }

        var future = node.private.future;

        future.private.when = when;
        future.private.callback = callback;  // TODO: would like to be able to remove this reference after the future call has completed

        if ( future.private.change < node.private.change ) { // only if out of date

            future.id = node.id;

            future.properties = Object.create( Object.getPrototypeOf( future ).properties || Object.prototype, {
                future: { value: future } // for future.properties accessors (non-enumerable)  // TODO: hide this better
            } );

            for ( var propertyName in node.properties ) {

                if ( node.properties.hasOwnProperty( propertyName ) ) {

                    ( function( propertyName ) {

                        Object.defineProperty( future.properties, propertyName, { // "this" is future.properties in get/set
                            get: function() { return self.kernel.getProperty( this.future.id,
                                propertyName, this.future.private.when, this.future.private.callback
                            ) },
                            set: function( value ) { self.kernel.setProperty( this.future.id,
                                propertyName, value, this.future.private.when, this.future.private.callback
                            ) },
                            enumerable: true
                        } );

future.hasOwnProperty( propertyName ) ||  // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty( future, propertyName, { // "this" is future in get/set
                            get: function() { return self.kernel.getProperty( this.id,
                                propertyName, this.private.when, this.private.callback
                            ) },
                            set: function( value ) { self.kernel.setProperty( this.id,
                                propertyName, value, this.private.when, this.private.callback
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
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.methods
                                    return self.kernel.callMethod( this.future.id,
                                        methodName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        } );

future.hasOwnProperty( methodName ) ||  // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty( future, methodName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    return self.kernel.callMethod( this.id,
                                        methodName, arguments, this.private.when, this.private.callback
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

                        Object.defineProperty( future.events, eventName, { // "this" is future.events in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.events
                                    return self.kernel.fireEvent( this.future.id,
                                        eventName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                };
                            },
                            enumerable: true,
                        } );

future.hasOwnProperty( eventName ) ||  // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty( future, eventName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    return self.kernel.fireEvent( this.id,
                                        eventName, arguments, this.private.when, this.private.callback
                                    );
                                };
                            },
                            enumerable: true,
                        } );

                    } )( eventName );

                }

            }

            future.private.change = node.private.change;

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

    // -- findListeners ----------------------------------------------------------------------------

// TODO: this walks the full prototype chain and is probably horribly inefficient.

    function findListeners( node, eventName, targetOnly ) {

        var prototypeListeners = Object.getPrototypeOf( node ).private ? // get any self-targeted listeners from the prototypes
            findListeners( Object.getPrototypeOf( node ), eventName, true ) : [];

        var nodeListeners = node.private.listeners && node.private.listeners[eventName] || [];

        if ( targetOnly ) {
            return prototypeListeners.concat( nodeListeners.filter( function( listener ) {
                return listener.context == node || listener.context == node.private.origin; // in the prototypes, select self-targeted listeners only
            } ) );
        } else {
            return prototypeListeners.map( function( listener ) { // remap the prototype listeners to target the node
                return { handler: listener.handler, context: node, phases: listener.phases };
            } ).concat( nodeListeners );
        }

    }

} );
