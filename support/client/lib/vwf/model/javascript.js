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

/// vwf/model/javascript.js is a placeholder for the JavaScript object interface to the
/// simulation.
/// 
/// @module vwf/model/javascript
/// @requires vwf/model
/// @requires vwf/utility

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    return model.load( module, /** @lends module:vwf/model/javascript */ {

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

            // visible to sandbox (*, x: shouldn't be), allocated in sandbox (*)

            //  - - nodes:
            //  - *   id: # node:proto
            //  * *     vwf$id: *id*
            //  * *     uri/name/parent/source/type/...: etc.
            //  * *     properties/methods/events/children:
            //  * *       vwf$node: *node*
            //  * *       name: *property*/*method*/*event*/*node*
            //  * *       ...
            //          future: *future*
            //  x -     vwf$private:
            //  x -       setters/getters/bodies:
            //  x *         name: function() { ... }
            //  x *         ...
            //  x -       listeners:
            //  x ?         name:
            //              - handler: function() { ... }
            //                context: *node*
            //                phases: [ ... ]
            //              - ...
            //  x ?         ...
            //  x *       future: *node*  # future proxy
            //              properties/methods/events/children:
            //                vwf$node: *node*  # future proxy
            //                name: *property*/*method*/*event*/*node*
            //                ...
            //              vwf$private:
            //                when: 
            //                callback: 
            //                change: 
            //  x -       change: *sequence*


            //  - - nodeishes:

            //  - -   id:  # nodeish  # nodeish : protoish

            //  - *     node:  # node : proto
            //  * *       vwf$id: *id*
            //  * *       uri/name/parent/source/type/...: etc.
            //  * *       properties/methods/events/children:  # node collection : proto collection
            //  * *         vwf$node: *node*
            //  * *         name: *property*/*method*/*event*/*node*
            //  * *         ...
            //            future: *future*
            //  - -     setters/getters/bodies:  # node collection : proto collection
            //  - *       name: function() { ... }
            //  - *       ...
            //  - -     listeners:  # node collection ?:? proto collection (non-__proto__)
            //  - ?       name:
            //              - handler: function() { ... }
            //                context: *node*
            //                phases: [ ... ]
            //              - ...
            //  - ?       ...
            //  - -     change: *sequence*

            //  - -     future:  # node futureish : proto futureish
            //  - *       node: *proxy*  # node proxy : proto proxy
            //              properties/methods/events/children:  # node proxy collection : proto proxy collection
            //                vwf$node: *node*  # future proxy
            //                name: *property*/*method*/*event*/*node*
            //                ...
            //            when: 
            //            callback: 
            //            change: 


            this.nodes = {}; // maps id => node data



            var body = document.getElementsByTagName("body")[0];
            var sandbox = document.createElement( "iframe" );
            body.appendChild( sandbox );
            this.sandbox = SB = sandbox.contentWindow;

            SB.document.write( "<script type='text/javascript' src='closure/base.js'></script>" );
            SB.document.write( "<script type='text/javascript'>goog.require('goog.vec.Mat4')</script>" );
            SB.document.write( "<script type='text/javascript'>goog.require('goog.vec.Quaternion')</script>" );

SB.document.write( "<script type='text/javascript' src='jquery-1.7.1.js'></script>" );


window.$sandbox = "kernel-window";
// Object.prototype.$sandbox = "kernel-prototype";

SB.$sandbox = "sandbox-window";
// SB.Object.prototype.$sandbox = "sandbox-prototype";

  this.proto = ( new Object ).__proto__;
this.sbproto = ( new SB.Object ).__proto__;

this.issb = function( obj ) {
    while ( obj.__proto__ ) obj = obj.__proto__;
    return obj === this.sbproto;
}






            this.creatingNode( undefined, 0 ); // global root  // TODO: to allow vwf.children( 0 ), vwf.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?

        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            var self = this;

            // Get the prototype node. These may be undefined if there is no prototype.

            var prototypeData = this.nodes[childExtendsID];
            var prototype = prototypeData && prototypeData.node;

            // Get the behavior nodes.

            var behaviorDatas = ( childImplementsIDs || [] ).map( function( childImplementsID ) {
                return self.nodes[childImplementsID];
            } );

            // For each behavior, create a proxy for this node to the behavior and attach it above
            // the prototype, or above the most recently-attached behavior.

            behaviorDatas.forEach( function( behaviorData ) {
                prototypeData = proxiedBehavior.call( self, behaviorData, prototypeData );
                prototype = prototypeData && prototypeData.node;
            } );

            // Create the node. Its prototype is the most recently-attached behavior, or the
            // specific prototype if no behaviors are attached.

            //  {

            //    node: undefined,
            //    setters: undefined, // {}, delegated to prototype
            //    getters: undefined, // {}, delegated to prototype
            //    bodies: undefined, // {}, delegated to prototype
            //    listeners: undefined, // {}, not delegated to prototype
            //    change: undefined,

            //    future: undefined, // node / when/callback/change

            //  }

            var nodeData = this.nodes[childID] = Object.create( prototypeData || Object.prototype );
            var node = nodeData.node = SB.Object.create( prototype || SB.Object.prototype );

node.id = childID; // TODO: move to vwf/model/object
node.uri = childURI; // TODO: move to vwf/model/object  // TODO: delegate to kernel

            node.name = childName;  // TODO: delegate to kernel

            node.parent = undefined;  // TODO: delegate to kernel

            node.source = childSource;  // TODO: delegate to kernel
            node.type = childType;  // TODO: delegate to kernel

            SB.Object.defineProperty( node, "logger", {
                value: this.logger.for( "#" + ( childName || childURI || childID ), node ),
                enumerable: true,
            } );

            node.properties = SB.Object.create( prototype ? prototype.properties : SB.Object.prototype, {
                node: { value: node } // for node.properties accessors (non-enumerable)  // TODO: hide this better
            } );

            SB.Object.defineProperty( node.properties, "create", {
                value: function( name, value, get, set ) { // "this" is node.properties
                    return self.kernel.createProperty( this.node.id, name, value, get, set );
                }
            } );

            nodeData.getters = Object.create( prototypeData ?
                prototypeData.getters : Object.prototype
            );

            nodeData.setters = Object.create( prototypeData ?
                prototypeData.setters : Object.prototype
            );

            node.methods = SB.Object.create( prototype ? prototype.methods : SB.Object.prototype, {
                node: { value: node } // for node.methods accessors (non-enumerable)  // TODO: hide this better
            } );

            SB.Object.defineProperty( node.methods, "create", {
                value: function( name, parameters, body ) { // "this" is node.methods  // TODO: also accept create( name, body )
                    return self.kernel.createMethod( this.node.id, name, parameters, body );
                }
            } );

            nodeData.bodies = Object.create( prototypeData ?
                prototypeData.bodies : Object.prototype
            );

            node.events = SB.Object.create( prototype ? prototype.events : SB.Object.prototype, {
                node: { value: node }, // for node.events accessors (non-enumerable)  // TODO: hide this better
            } );

            // TODO: these only need to be on the base node's events object

            SB.Object.defineProperty( node.events, "create", {
                value: function( name, parameters ) { // "this" is node.events
                    return self.kernel.createEvent( this.node.id, name, parameters );
                }
            } );

            // Provide helper functions to create the directives for adding, removing and flushing
            // event handlers.

            // Add: node.events.*eventName* = node.events.add( *handler* [, *phases* ] [, *context* ] )

            SB.Object.defineProperty( node.events, "add", {
                value: function( handler, phases, context ) {
                    if ( arguments.length != 2 || typeof phases == "string" || phases instanceof SB.String || phases instanceof SB.Array ) {
                        return { add: true, handler: handler, phases: phases, context: context };
                    } else { // interpret add( handler, context ) as add( handler, undefined, context )
                        return { add: true, handler: handler, context: phases };
                    }
                }
            } );

            // Remove: node.events.*eventName* = node.events.remove( *handler* )

            SB.Object.defineProperty( node.events, "remove", {
                value: function( handler ) {
                    return { remove: true, handler: handler };
                }
            } );

            // Flush: node.events.*eventName* = node.events.flush( *context* )

            SB.Object.defineProperty( node.events, "flush", {
                value: function( context ) {
                    return { flush: true, context: context };
                }
            } );

            nodeData.listeners = Object(); // not delegated to the prototype as with getters, setters, and bodies; findListeners() filters recursion

            node.children = SB.Array();  // TODO: connect children's prototype like properties, methods and events do? how, since it's an array? drop the ordered list support and just use an object?

            SB.Object.defineProperty( node.children, "node", {
                value: node // for node.children accessors (non-enumerable)  // TODO: hide this better
            } );

            SB.Object.defineProperty( node.children, "create", {
                value: function( name, component, callback /* ( child ) */ ) { // "this" is node.children
                    if ( callback ) {
                        self.kernel.createChild( this.node.id, name, component, undefined, undefined, function( childID ) {
                            callback.call( node, self.nodes[childID].node );
                        } );
                    } else { 
                        return self.kernel.createChild( this.node.id, name, component );
                    }
                }
            } );

            SB.Object.defineProperty( node.children, "delete", {
                value: function( child ) {
                    return self.kernel.deleteNode( child.id );
                }
            } );

            // Define the "random" and "seed" functions.

            SB.Object.defineProperty( node, "random", { // "this" is node
                value: function() {
                    return self.kernel.random( this.id );
                }
            } );

            SB.Object.defineProperty( node, "seed", { // "this" is node
                value: function( seed ) {
                    return self.kernel.seed( this.id, seed );
                }
            } );

            // Define the "time", "client", and "moniker" properties.

            SB.Object.defineProperty( node, "time", {  // TODO: only define on shared "node" prototype?
                get: function() {
                    return self.kernel.time();
                },
                enumerable: true,
            } );

            SB.Object.defineProperty( node, "client", {  // TODO: only define on shared "node" prototype?
                get: function() {
                    return self.kernel.client();
                },
                enumerable: true,
            } );

            SB.Object.defineProperty( node, "moniker", {  // TODO: only define on shared "node" prototype?
                get: function() {
                    return self.kernel.moniker();
                },
                enumerable: true,
            } );

            SB.Object.defineProperty( node, "find", {
                value: function( matchPattern, callback /* ( match ) */ ) { // "this" is node
                    if ( callback ) {
                        self.kernel.find( this.id, matchPattern, function( matchID ) {
                            callback.call( node, self.nodes[matchID].node );
                        } );
                    } else {  // TODO: future iterator proxy
                        return self.kernel.find( this.id, matchPattern ).map( function( matchID ) {
                            return self.nodes[matchID].node;
                        } );
                    }
                }
            } );

            SB.Object.defineProperty( node, "test", {
                value: function( matchPattern, testNode ) { // "this" is node
                    return self.kernel.test( this.id, matchPattern, testNode.id );
                }
            } );

            // Define a "future" proxy so that for any this.property, this.method, or this.event, we
            // can reference this.future( when, callback ).property/method/event and have the
            // expression evaluated at the future time.

            SB.Object.defineProperty( node, "in", {  // TODO: only define on shared "node" prototype?
                value: function( when, callback ) { // "this" is node
                    return futureProxy.call( self, self.nodes[this.id], -( when || 0 ), callback ).node; // relative time
                },
                enumerable: true,
            } );

            SB.Object.defineProperty( node, "at", {  // TODO: only define on shared "node" prototype?
                value: function( when, callback ) { // "this" is node
                    return futureProxy.call( self, self.nodes[this.id], when || 0, callback ).node; // absolute time
                },
                enumerable: true,
            } );

            SB.Object.defineProperty( node, "future", { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function() {
                    return this.in;
                },
                enumerable: true,
            } );

            // Define a counter to be incremented whenever "future"-related changes occur. Creating
            // the node is the first change.

            nodeData.change = 1;

        },

        // -- initializingNode ---------------------------------------------------------------------

        // Invoke an initialize() function if one exists.

        initializingNode: function( nodeID, childID ) {

            var child = this.nodes[childID].node;
            var scriptText = "this.initialize && this.initialize()";

            try {
                return ( SB.Function( "scriptText", "return eval( scriptText )" ) ).
                    call( child, scriptText );
            } catch ( e ) {
                this.logger.warnx( "initializingNode", childID,
                    "exception in initialize:", utility.exceptionMessage( e ) );
            }

            return undefined;
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            var child = this.nodes[nodeID].node;
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

            var node = this.nodes[nodeID].node;
            var child = this.nodes[childID].node;

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

            var nodeData = this.nodes[nodeID];

            if ( propertyGet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    nodeData.getters[propertyName] = SB.Function( propertyGet );
                } catch ( e ) {
                    this.logger.warnx( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating getter:", utility.exceptionMessage( e ) );
                }
            } else {
                nodeData.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }
        
            if ( propertySet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    nodeData.setters[propertyName] = SB.Function( "value", propertySet );
                } catch ( e ) {
                    this.logger.warnx( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating setter:", utility.exceptionMessage( e ) );
                }
            } else {
                nodeData.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
            }

            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {

            var nodeData = this.nodes[nodeID];
            var node = nodeData.node;

            var self = this;

            SB.Object.defineProperty( node.properties, propertyName, { // "this" is node.properties in get/set
                get: function() { return self.kernel.getProperty( this.node.id, propertyName ) },
                set: function( value ) { self.kernel.setProperty( this.node.id, propertyName, value ) },
                enumerable: true
            } );

node.hasOwnProperty( propertyName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            SB.Object.defineProperty( node, propertyName, { // "this" is node in get/set
                get: function() { return self.kernel.getProperty( this.id, propertyName ) },
                set: function( value ) { self.kernel.setProperty( this.id, propertyName, value ) },
                enumerable: true
            } );

            nodeData.change++; // invalidate the "future" cache

            return propertyValue !== undefined ?
                this.settingProperty( nodeID, propertyName, propertyValue ) : undefined;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var nodeData = this.nodes[nodeID];
            var node = nodeData.node;

if ( ! node ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            var setter = nodeData.setters[propertyName];

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

            var nodeData = this.nodes[nodeID];
            var node = nodeData.node;

            var getter = nodeData.getters[propertyName];

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

            var nodeData = this.nodes[nodeID];
            var node = nodeData.node;

            var self = this;

            SB.Object.defineProperty( node.methods, methodName, { // "this" is node.methods in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.methods
                        return self.kernel.callMethod( this.node.id, methodName, arguments );
                    };
                },
                set: function( value ) {
                    this.node.methods.hasOwnProperty( methodName ) ||
                        self.kernel.createMethod( this.node.id, methodName );
                    self.nodes[this.node.id].bodies[methodName] = value;  // TODO: invalidates behavior proxy but not future proxy
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
                    self.nodes[this.id].bodies[methodName] = value;  // TODO: invalidates behavior proxy but not future proxy
                },
                enumerable: true,
            } );

            try {
                nodeData.bodies[methodName] = SB.Function.apply( undefined,
                    ( methodParameters || [] ).concat( methodBody || "" ) );
            } catch ( e ) {
                this.logger.warnx( "creatingMethod", nodeID, methodName, methodParameters,
                    "exception evaluating body:", utility.exceptionMessage( e ) );
            }
        
            nodeData.change++; // invalidate the "future" cache

        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {

            var nodeData = this.nodes[nodeID];
            var node = nodeData.node;

            var body = nodeData.bodies[methodName];

            if ( body ) {
                try {
                    return body.apply( node, methodParameters );
                } catch ( e ) {
                    this.logger.warnx( "callingMethod", nodeID, methodName, methodParameters, methodValue, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage( e ) );
                }
            }

            return undefined;
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {

            var nodeData = this.nodes[nodeID];
            var node = nodeData.node;

            var self = this;

            SB.Object.defineProperty( node.events, eventName, { // "this" is node.events in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.events
                        return self.kernel.fireEvent( this.node.id, eventName, arguments );
                    };
                },
                set: function( value ) {
                    var nodeData = self.nodes[this.node.id];
                    var listeners = nodeData.listeners[eventName] ||  // TODO: invalidates behavior proxy but not future proxy
                        ( nodeData.listeners[eventName] = [] );  // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if ( typeof value == "function" || value instanceof SB.Function ) {
                        listeners.push( { handler: value, context: this.node } );  // for node.events.*event* = function() { ... }, context is the target node
                    } else if ( value.add ) {
                        if ( ! value.phases || value.phases instanceof SB.Array ) {
                            listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                        } else {
                            listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                        }
                    } else if ( value.remove ) {
                        nodeData.listeners[eventName] = listeners.filter( function( listener ) {
                            return listener.handler !== value.handler;
                        } );
                    } else if ( value.flush ) {
                        nodeData.listeners[eventName] = listeners.filter( function( listener ) {
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
                    var nodeData = self.nodes[this.id];
                    var listeners = nodeData.listeners[eventName] ||  // TODO: invalidates behavior proxy but not future proxy
                        ( nodeData.listeners[eventName] = [] );  // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if ( typeof value == "function" || value instanceof Function ) {
                        listeners.push( { handler: value, context: this } );  // for node.*event* = function() { ... }, context is the target node
                    } else if ( value.add ) {
                        if ( ! value.phases || value.phases instanceof Array ) {
                            listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                        } else {
                            listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                        }
                    } else if ( value.remove ) {
                        nodeData.listeners[eventName] = listeners.filter( function( listener ) {
                            return listener.handler !== value.handler;
                        } );
                    } else if ( value.flush ) {
                        nodeData.listeners[eventName] = listeners.filter( function( listener ) {
                            return listener.context !== value.context;
                        } );
                    }
                },
                enumerable: true,
            } );

            nodeData.listeners[eventName] = [];

            nodeData.change++; // invalidate the "future" cache

        },

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {

            var phase = eventParameters && eventParameters.phase; // the phase is smuggled across on the parameters array  // TODO: add "phase" as a fireEvent() parameter? it isn't currently needed in the kernel public API (not queueable, not called by the drivers), so avoid if possible

            var nodeData = this.nodes[nodeID];
            var listeners = findListeners( nodeData, eventName );

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
                        var result = listener.handler.apply( listener.context || self.nodes[0].node, eventParameters ); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above
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

            var nodeData = this.nodes[nodeID];
            var node = nodeData.node;

            if ( scriptType == "application/javascript" ) {
                try {
                    return ( SB.Function( "scriptText", "return eval( scriptText )" ) ).
                        call( node, scriptText );
                } catch ( e ) {
                    this.logger.warnx( "executing", nodeID,
                        ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType,
                        "exception:", utility.exceptionMessage( e ) );
                }
            }

            return undefined;
        },

    } );

    /// Create a proxy node for a behavior to be placed in another node's prototype chain. Since
    /// behaviors are inserted between a node and its prototype, and since they may be used for
    /// multiple nodes, they can't be placed directly in the prototype chain.
    ///
    /// @param {Object} behaviorData
    ///   The behavior node to create the proxy for.
    /// @param {Object} [prototypeData]
    ///   The prototype node to attach below the proxy.
    /// 
    /// @returns {Object}
    ///   A proxy node that delegates to `behaviorData` and has `prototypeData` as its prototype.

    function proxiedBehavior( behaviorData, prototypeData ) { // invoke with the model as "this"  // TODO: this is a lot like createProperty()/createMethod()/createEvent(), and futureProxy(). Find a way to merge.  // TODO: nodes need to keep a list of proxies on them and callback here to refresh after changes

        var self = this;

        var prototype = prototypeData && prototypeData.node;

        var proxyData = Object.create( prototypeData || Object.prototype );
        var proxy = proxyData.node = SB.Object.create( prototype || SB.Object.prototype );

        var behavior = behaviorData && behaviorData.node;

proxy.id = behavior.id; // TODO: move to vwf/model/object
proxy.uri = behavior.uri; // TODO: move to vwf/model/object  // TODO: delegate to kernel

        proxy.name = behavior.name;  // TODO: delegate to kernel

        proxy.parent = behavior.parent;  // TODO: delegate to kernel  // TODO: wrong?

        proxy.source = behavior.source;  // TODO: delegate to kernel
        proxy.type = behavior.type;  // TODO: delegate to kernel

        proxy.properties = SB.Object.create( prototype ? prototype.properties : SB.Object.prototype, {
            node: { value: proxy } // for proxy.properties accessors (non-enumerable)  // TODO: hide this better
        } );

        proxyData.getters = Object.create( prototypeData ?
            prototypeData.getters : Object.prototype
        );

        proxyData.setters = Object.create( prototypeData ?
            prototypeData.setters : Object.prototype
        );

        for ( var propertyName in behavior.properties ) {

            if ( behavior.properties.hasOwnProperty( propertyName ) ) {

                ( function( propertyName ) {

                    SB.Object.defineProperty( proxy.properties, propertyName, { // "this" is proxy.properties in get/set
                        get: function() { return self.kernel.getProperty( this.node.id, propertyName ) },
                        set: function( value ) { self.kernel.setProperty( this.node.id, propertyName, value ) },
                        enumerable: true
                    } );

proxy.hasOwnProperty( propertyName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    SB.Object.defineProperty( proxy, propertyName, { // "this" is proxy in get/set
                        get: function() { return self.kernel.getProperty( this.id, propertyName ) },
                        set: function( value ) { self.kernel.setProperty( this.id, propertyName, value ) },
                        enumerable: true
                    } );

                } )( propertyName );
            
                if ( behaviorData.getters.hasOwnProperty( propertyName ) ) {
                    proxyData.getters[propertyName] = behaviorData.getters[propertyName];
                }

                if ( behaviorData.setters.hasOwnProperty( propertyName ) ) {
                    proxyData.setters[propertyName] = behaviorData.setters[propertyName];
                }

            }

        }

        proxy.methods = SB.Object.create( prototype ? prototype.methods : SB.Object.prototype, {
            node: { value: proxy } // for proxy.methods accessors (non-enumerable)  // TODO: hide this better
        } );

        proxyData.bodies = Object.create( prototypeData ?
            prototypeData.bodies : Object.prototype
        );

        for ( var methodName in behavior.methods ) {

            if ( behavior.methods.hasOwnProperty( methodName ) ) {

                ( function( methodName ) {

                    SB.Object.defineProperty( proxy.methods, methodName, { // "this" is proxy.methods in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.methods
                                return self.kernel.callMethod( this.node.id, methodName, arguments );
                            };
                        },
                        set: function( value ) {
                            this.node.methods.hasOwnProperty( methodName ) ||
                                self.kernel.createMethod( this.node.id, methodName );
                            self.nodes[this.node.id].bodies[methodName] = value;  // TODO: invalidates behavior proxy but not future proxy
                        },
                        enumerable: true,
                    } );

proxy.hasOwnProperty( methodName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    SB.Object.defineProperty( proxy, methodName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return self.kernel.callMethod( this.id, methodName, arguments );
                            };
                        },
                        set: function( value ) {
                            this.methods.hasOwnProperty( methodName ) ||
                                self.kernel.createMethod( this.id, methodName );
                            self.nodes[this.id].bodies[methodName] = value;  // TODO: invalidates behavior proxy but not future proxy
                        },
                        enumerable: true,
                    } );

                } )( methodName );
            
                if ( behaviorData.bodies.hasOwnProperty( methodName ) ) {
                    proxyData.bodies[methodName] = behaviorData.bodies[methodName];
                }

            }

        }

        proxy.events = SB.Object.create( prototype ? prototype.events : SB.Object.prototype, {
            node: { value: proxy } // for proxy.events accessors (non-enumerable)  // TODO: hide this better
        } );

        proxyData.listeners = {}; // not delegated to the prototype as with getters, setters, and bodies; findListeners() filters recursion

        for ( var eventName in behavior.events ) {

            if ( behavior.events.hasOwnProperty( eventName ) ) {

                ( function( eventName ) {

                    SB.Object.defineProperty( proxy.events, eventName, { // "this" is proxy.events in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.events
                                return self.kernel.fireEvent( this.node.id, eventName, arguments );
                            };
                        },
                        set: function( value ) {
                            var nodeData = self.nodes[this.node.id];
                            var listeners = nodeData.listeners[eventName] ||  // TODO: invalidates behavior proxy but not future proxy
                                ( nodeData.listeners[eventName] = [] ); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if ( typeof value == "function" || value instanceof SB.Function ) {
                                listeners.push( { handler: value, context: this.node } ); // for node.events.*event* = function() { ... }, context is the target node
                            } else if ( value.add ) {
                                if ( ! value.phases || value.phases instanceof SB.Array ) {
                                    listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                                } else {
                                    listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                                }
                            } else if ( value.remove ) {
                                nodeData.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.handler !== value.handler;
                                } );
                            } else if ( value.flush ) {
                                nodeData.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.context !== value.context;
                                } );
                            }
                        },
                        enumerable: true,
                    } );

proxy.hasOwnProperty( eventName ) ||  // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    SB.Object.defineProperty( proxy, eventName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return self.kernel.fireEvent( this.id, eventName, arguments );
                            };
                        },
                        set: function( value ) {
                            var nodeData = self.nodes[this.id];
                            var listeners = nodeData.listeners[eventName] ||  // TODO: invalidates behavior proxy but not future proxy
                                ( nodeData.listeners[eventName] = [] ); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if ( typeof value == "function" || value instanceof SB.Function ) {
                                listeners.push( { handler: value, context: this } ); // for node.*event* = function() { ... }, context is the target node
                            } else if ( value.add ) {
                                if ( ! value.phases || value.phases instanceof SB.Array ) {
                                    listeners.push( { handler: value.handler, context: value.context, phases: value.phases } );
                                } else {
                                    listeners.push( { handler: value.handler, context: value.context, phases: [ value.phases ] } );
                                }
                            } else if ( value.remove ) {
                                nodeData.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.handler !== value.handler;
                                } );
                            } else if ( value.flush ) {
                                nodeData.listeners[eventName] = listeners.filter( function( listener ) {
                                    return listener.context !== value.context;
                                } );
                            }
                        },
                        enumerable: true,
                    } );

                } )( eventName );

            }

        }

        // Copy listeners to the proxy. Remap self-targeted listeners to switch the context to the
        // proxy from the behavior.
        // 
        // Unlike with getters, setters, and bodies, this occurs outside the behavior.events loop
        // since listeners may be attached to a more derived node that the one that defines the
        // event.

        for ( var eventName in behaviorData.listeners ) {

            if ( behaviorData.listeners.hasOwnProperty( eventName ) ) {

                proxyData.listeners[eventName] =
                        behaviorData.listeners[eventName].map( function( listener ) {
                    return {
                        handler: listener.handler,
                        context: listener.context == behavior ?
                            proxy : listener.context,
                        phases: listener.phases,
                    };
                } );

            }

        }

        // Copy the behavior's change counter.

        proxyData.change = behaviorData.change;

        return proxyData;
    }

    /// Create a proxy node that interprets all references as actions to be placed on the message
    /// queue to be performed at some point in the future. The proxy node is cached and will only be
    /// generated if it doesn't exist or if the node has changed.
    /// 
    /// @param {Object} nodeData
    ///   The node to create the proxy for.
    /// @param {Object} [when]
    ///   The time to execute actions scheduled by the proxy. Positive values indicate absolute
    ///   times. A negative value represents the negative of a relative time. Actions scheduled for
    ///   the past are still placed on the queue but they will be executed immediately. Times are
    ///   specified in seconds. `when` defaults to 0.
    /// @param {Object} [callback]
    ///   A function to be called with the result when the action executes. (Not yet implemented.)
    /// 
    /// @returns {Object}
    ///   A future proxy for `nodeData`.

    function futureProxy( nodeData, when, callback ) { // invoke with the model as "this"

        var self = this;

        var prototypeData = Object.getPrototypeOf( nodeData ) !== Object.prototype ?
            futureProxy.call( this, Object.getPrototypeOf( nodeData ) ) : undefined;

        var prototype = prototypeData && prototypeData.node;

        var futureData = nodeData.hasOwnProperty( "futureData" ) && nodeData.futureData;

        if ( ! futureData || futureData.change < nodeData.change ) { // only if missing or out of date

            //  {
            //    node: undefined,
            //    when: undefined,
            //    callback: undefined,
            //    change: undefined,
            //  }

            futureData = nodeData.futureData = Object.create( prototypeData || Object.prototype ); // TODO: breaks deriving reference if exists
            var future = futureData.node = SB.Object.create( prototype || SB.Object.prototype );

            var node = nodeData.node;

            future.id = node.id;

            future.properties = SB.Object.create( prototype ? prototype.properties : SB.Object.prototype, {
                node: { value: future } // for future.properties accessors (non-enumerable)  // TODO: hide this better
            } );

            for ( var propertyName in node.properties ) {

                if ( node.properties.hasOwnProperty( propertyName ) ) {

                    ( function( propertyName ) {

                        SB.Object.defineProperty( future.properties, propertyName, { // "this" is future.properties in get/set
                            get: function() {
                                var nodeData = self.nodes[this.node.id];
                                return self.kernel.getProperty( this.node.id, propertyName,
                                    nodeData.futureData.when, nodeData.futureData.callback
                                );
                            },
                            set: function( value ) {
                                var nodeData = self.nodes[this.node.id];
                                self.kernel.setProperty( this.node.id, propertyName, value,
                                    nodeData.futureData.when, nodeData.futureData.callback
                                );
                            },
                            enumerable: true
                        } );

future.hasOwnProperty( propertyName ) ||  // TODO: calculate so that properties take precedence over methods over events, for example
                        SB.Object.defineProperty( future, propertyName, { // "this" is future in get/set
                            get: function() {
                                var nodeData = self.nodes[this.id];
                                return self.kernel.getProperty( this.id, propertyName,
                                    nodeData.futureData.when, nodeData.futureData.callback );
                            },
                            set: function( value ) {
                                var nodeData = self.nodes[this.id];
                                self.kernel.setProperty( this.id, propertyName, value,
                                    nodeData.futureData.when, nodeData.futureData.callback );
                            },
                            enumerable: true
                        } );

                    } )( propertyName );
                
                }
    
            }

            future.methods = SB.Object.create( prototype ? prototype.methods : SB.Object.prototype, {
                node: { value: future } // for future.methods accessors (non-enumerable)  // TODO: hide this better
            } );

            for ( var methodName in node.methods ) {

                if ( node.methods.hasOwnProperty( methodName ) ) {

                    ( function( methodName ) {

                        SB.Object.defineProperty( future.methods, methodName, { // "this" is future.methods in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.methods
                                    var nodeData = self.nodes[this.node.id];
                                    return self.kernel.callMethod( this.node.id, methodName, arguments,
                                        nodeData.futureData.when, nodeData.futureData.callback
                                    );
                                }
                            },
                            enumerable: true
                        } );

future.hasOwnProperty( methodName ) ||  // TODO: calculate so that properties take precedence over methods over events, for example
                        SB.Object.defineProperty( future, methodName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    var nodeData = self.nodes[this.id];
                                    return self.kernel.callMethod( this.id, methodName, arguments,
                                        nodeData.futureData.when, nodeData.futureData.callback
                                    );
                                }
                            },
                            enumerable: true
                        } );

                    } )( methodName );

                }

            }

            future.events = SB.Object.create( prototype ? prototype.events : SB.Object.prototype, {
                node: { value: future } // for future.events accessors (non-enumerable)  // TODO: hide this better
            } );

            for ( var eventName in node.events ) {

                if ( node.events.hasOwnProperty( eventName ) ) {

                    ( function( eventName ) {

                        SB.Object.defineProperty( future.events, eventName, { // "this" is future.events in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.events
                                    var nodeData = self.nodes[this.node.id];
                                    return self.kernel.fireEvent( this.node.id, eventName, arguments,
                                        nodeData.futureData.when, nodeData.futureData.callback
                                    );
                                };
                            },
                            enumerable: true,
                        } );

future.hasOwnProperty( eventName ) ||  // TODO: calculate so that properties take precedence over methods over events, for example
                        SB.Object.defineProperty( future, eventName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    var nodeData = self.nodes[this.id];
                                    return self.kernel.fireEvent( this.id, eventName, arguments,
                                        nodeData.futureData.when, nodeData.futureData.callback
                                    );
                                };
                            },
                            enumerable: true,
                        } );

                    } )( eventName );

                }

            }

            // Record the node's change counter. We can reuse this proxy until the node changes
            // again.

            futureData.change = nodeData.change;

        }

        // Record the time and callback parameters. Actions scheduled by this proxy will pass these
        // values to the kernel's scheduler.

        futureData.when = when || 0;
        futureData.callback = callback;  // TODO: would like to be able to remove this reference after the future call has completed

        // Return the updated proxy.

        return futureData;
    }

    /// findListeners.
    /// 
    /// @param {Object} nodeData
    /// @param {Object} eventName
    /// @param {Boolean} targetOnly
    /// 
    /// @returns {Array}

// TODO: this walks the full prototype chain and is probably horribly inefficient.

    function findListeners( nodeData, eventName, targetOnly ) {

        var prototypeListeners = Object.getPrototypeOf( nodeData ) != Object.prototype ? // get any self-targeted listeners from the prototypes
            findListeners( Object.getPrototypeOf( nodeData ), eventName, true ) : [];

        var nodeListeners = nodeData.listeners && nodeData.listeners[eventName] || [];

        if ( targetOnly ) {
            return prototypeListeners.concat( nodeListeners.filter( function( listener ) {
                return listener.context == nodeData.node; // in the prototypes, select self-targeted listeners only
            } ) );
        } else {
            return prototypeListeners.map( function( listener ) { // remap the prototype listeners to target the node
                return { handler: listener.handler, context: nodeData.node, phases: listener.phases };
            } ).concat( nodeListeners );
        }

    }

    /// Sandbox iframe.

    var SB = undefined;

} );
