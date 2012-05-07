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

( function( window ) {

    window.console && console.info && console.info( "loading vwf" );

    // vwf.js is the main Virtual World Framework manager. It is constructed as a JavaScript module
    // (http://www.yuiblog.com/blog/2007/06/12/module-pattern) to isolate it from the rest of the
    // page's JavaScript environment. The vwf module self-creates its own instance when loaded and
    // attaches to the global window object as window.vwf. Nothing else should affect the global
    // environment.

    window.vwf = new function() {

        window.console && console.info && console.info( "creating vwf" );

        // == Public variables =====================================================================

        // Each model and view module loaded by the main page registers itself here.

        this.modules = [];

        // vwf.initialize() creates an instance of each model and view module configured on the main
        // page and attaches them here.

        this.models = [];
        this.views = [];

        // this.models and this.views are lists of references to the head of each driver pipeline.
        // Define an "actual" property on each that evaluates to a list of references to the
        // pipeline tails. This is a list of the actual drivers after any intermediate stages and is
        // useful for debugging.

        Object.defineProperty( this.models, "actual", {  // TODO: for this.views too once that's converted to use the RequireJS loader

            get: function() {

                // Map the array to the result.

                var actual = this.map( function( model ) {
                    return last( model );
                } );

                // Map the non-integer properties too.

                for ( var propertyName in this ) {
                    if ( isNaN( Number( propertyName ) ) ) {
                        actual[propertyName] = last( this[propertyName] );
                    }
                }

                // Follow a pipeline to the last stage.

                function last( model ) {
                    while ( model.model ) model = model.model;
                    return model;
                }

                return actual;
            }

        } );

        // This is the simulation clock, which contains the current time in milliseconds. Time is
        // controlled by the reflector and updates here as we receive control messages.

        this.now = 0;

        // The moniker of the client responsible for an action. Will be falsy for actions
        // originating in the server, such as time ticks.

        this.client_ = undefined;

        // The identifer assigned to the client by the server.

        this.moniker_ = undefined;

        // Nodes that are receiving ticks.

        this.tickable = {
            // models: [],
            // views: [],
            nodeIDs: [],
        };

        // == Private variables ====================================================================

        this.private = {}; // for debugging

        // Components describe the objects that make up the simulation. They may also serve as
        // prototype objects for further derived components. External components are identified by
        // URIs. Once loaded, we save a mapping here from its URI to the node ID of its prototype so
        // that we can find it if it is reused. Components specified internally as object literals
        // are anonymous and are not indexed here.

        var types = this.private.types = {}; // maps component node ID => component specification
        var uris = this.private.uris = {}; // maps component nodeID => component URI

        // The proto-prototype of all nodes is "node", identified by this URI. This type is
        // intrinsic to the system and nothing is loaded from the URI.

        var nodeTypeURI = "http://vwf.example.com/node.vwf";

        // Control messages from the reflector are stored here in a priority queue, ordered by
        // execution time.

        var queue = this.private.queue = [];

        queue.time = 0; // current server time
        queue.ready = true;

        queue.sequence = 0; // message counter to ensure a stable sort

        // This is the connection to the reflector. In this sample implementation, "socket" is a
        // socket.io client that communicates over a channel provided by the server hosting the
        // client documents.

        var socket = this.private.socket = undefined;

        // Cached version of window.location.search query parameters generated by getQueryString().

        var queryStringParams = this.private.queryStringParams = undefined;

        // Each node is assigned an ID as it is created. This is the most recent ID assigned.

        // Communication between the manager and the models and views uses these IDs to refer to the
        // nodes. The manager doesn't maintain any particular state for the nodes and knows them
        // only as their IDs. The models work in federation to provide the meaning to each node.

        // var lastID = 0;

        // Callback functions defined in this scope use this local "vwf" to locate the manager.

        var vwf = this;

        // == Public functions =====================================================================

        // -- initialize ---------------------------------------------------------------------------

        // The main page only needs to call vwf.initialize() to launch the application. Use
        // require.ready() or jQuery(document).ready() to call initialize() once the page has
        // loaded. initialize() accepts three parameters.
        
        // A component specification identifies the application to be loaded. If a URI is provided,
        // the specification is loaded from there [1]. Alternately, a JavaScript object literal
        // containing the specfication may be provided [2]. Since a component can extend and
        // specialize a prototype, using a simple object literal allows existing component to be
        // configured for special uses [3].
        // 
        //     [1] vwf.initialize( "http://vwf.example.com/applications/sample12345", ... )
        //
        //     [2] vwf.initialize( { source: "model.dae", type: "model/vnd.collada+xml",
        //             properties: { "p1": ... }, ... }, ... )
        //
        //     [3] vwf.initialize( { extends: "http://vwf.example.com/applications/sample12345",
        //             source: "alternate-model.dae", type: "model/vnd.collada+xml" }, ... )
        // 
        // modelInitializers and viewInitializers identify the model and view modules that should be
        // attached to the simulation. Each is specified as an array of objects that map the name of
        // a model or view to construct to the set of arguments to pass to its constructor. Modules
        // without parameters may be specified as a string [4]. Arguments may be specified as an
        // array [5], or as a single value if there is only one [6].
        // 
        //     [4] vwf.initialize( ..., [ "vwf/model/javascript" ], [ ... ] )
        //     [5] vwf.initialize( ..., [ { "vwf/model/glge": [ "#scene, "second param" ] } ], [ ... ] )
        //     [6] vwf.initialize( ..., [ { "vwf/model/glge": "#scene" } ], [ ... ] )

        this.initialize = function( /* [ componentURI|componentObject ] [ modelInitializers ]
            [ viewInitializers ] */ ) {

            var args = Array.prototype.slice.call( arguments );

            // Get the application specification if one is provided in the query string. Parse it
            // into an application specification object if it's valid JSON, otherwise keep the query
            // string and assume it's a URI.

            var application = getQueryString( "application" );  // TODO: move to index.html; don't reach out to the window from the kernel

            // Parse the function parameters. If the first parameter is not an array, then treat it
            // as the application specification. Otherwise, fall back to the "application" parameter
            // in the query string.

            if ( typeof args[0] != "object" || ! ( args[0] instanceof Array ) ) {
                application = args.shift();
            }

            // Shift off the parameter containing the model list and initializer arguments.

            var modelInitializers = args.shift() || [];

            // Shift off the parameter containing the view list and initializer arguments.

            var viewInitializers = args.shift() || [];

            // Create the model interface to the kernel. Models can make direct calls that execute
            // immediately or future calls that are placed on the queue and executed when removed.

            var kernel_for_models = require( "vwf/kernel/model" ).create( vwf );

            // Create and attach each configured model.

            modelInitializers.forEach( function( modelInitializer ) {

                // Accept either { "vwf/model/name": [ arguments] } or "vwf/model/name".

                if ( typeof modelInitializer == "object" || modelInitializer instanceof Object ) {
                    var modelName = Object.keys( modelInitializer )[0];
                    var modelArguments = modelInitializer[modelName];
                } else {
                    var modelName = modelInitializer;
                    var modelArguments = undefined;
                }

                var model = require( modelName ).create(
                    kernel_for_models,                          // model's kernel access
                    [ require( "vwf/model/stage/log" ) ],       // stages between the kernel and model
                    {},                                         // state shared with a paired view
                    [].concat( modelArguments || [] )           // arguments for initialize()
                );

                if ( model ) {
                    this.models.push( model );
                    this.models[modelName] = model; // also index by id  // TODO: this won't work if multiple model instances are allowed

if ( modelName == "vwf/model/javascript" ) {  // TODO: need a formal way to follow prototype chain from vwf.js; this is peeking inside of vwf-model-javascript
    this.models.javascript = model;
    while ( this.models.javascript.model ) this.models.javascript = this.models.javascript.model;
}

if ( modelName == "vwf/model/object" ) {  // TODO: this is peeking inside of vwf-model-object
    this.models.object = model;
    while ( this.models.object.model ) this.models.object = this.models.object.model;
}
                }

            }, this );

            // Create the view interface to the kernel. Views can only make replicated calls which
            // bounce off the reflection server, are placed on the queue when received, and executed
            // when removed.

            var kernel_for_views = require( "vwf/kernel/view" ).create( vwf );

            // Create and attach each configured view.

            viewInitializers.forEach( function( viewInitializer ) {

                // Accept either { "vwf/view/name": [ arguments] } or "vwf/view/name".

                if ( typeof viewInitializer == "object" || viewInitializer instanceof Object ) {
                    var viewName = Object.keys( viewInitializer )[0];
                    var viewArguments = viewInitializer[viewName];
                } else {
                    var viewName = viewInitializer;
                    var viewArguments = undefined;
                }

                if ( ! viewName.match( "^vwf/view/" ) ) { // old way

                    var view = this.modules[viewName];

                    if ( view ) {
                        var instance = new view();
                        instance.state = this.models.actual["vwf/model/"+viewName] && this.models.actual["vwf/model/"+viewName].state || {}; // state shared with a paired model
                        view.apply( instance, [ vwf ].concat( viewArguments || [] ) );
                        this.views.push( instance );
                        this.views[viewName] = instance; // also index by id  // TODO: this won't work if multiple view instances are allowed
                    }

                } else { // new way

                    var modelPeer = this.models.actual[ viewName.replace( "vwf/view/", "vwf/model/" ) ];  // TODO: this.model.actual() is kind of heavy, but it's probably OK to use just a few times here at start-up

                    var view = require( viewName ).create(
                        kernel_for_views,                           // view's kernel access
                        [],                                         // stages between the kernel and view
                        modelPeer && modelPeer.state || {},         // state shared with a paired model
                        [].concat( viewArguments || [] )            // arguments for initialize()
                    );

                    if ( view ) {
                        this.views.push( view );
                        this.views[viewName] = view; // also index by id  // TODO: this won't work if multiple view instances are allowed
                    }

                }

            }, this );

            // Load the application.

            this.ready( application );

        };

        // -- ready --------------------------------------------------------------------------------

        this.ready = function( component_uri_or_json_or_object ) {

            // Connect to the reflector. This implementation uses the socket.io library, which
            // communicates using a channel back to the server that provided the client documents.

            try {

                socket = new io.Socket( undefined, {

                    // The socket is relative to the application path.

                    resource: window.location.pathname.slice( 1,
                        window.location.pathname.lastIndexOf("/") ),

                    // The ruby socket.io server only supports WebSockets. Don't try the others.

                    transports: [
                        'websocket',
                        // 'flashsocket',
                        // 'htmlfile',
                        // 'xhr-multipart',
                        // 'xhr-polling',
                        // 'jsonp-polling',
                    ],

                    // Increase the timeout due to starvation while loading the scene. The server
                    // timeout must also be increased.
                    // TODO: reinstate if needed, but this needs to be handled by communicating during the load.

                    // transportOptions: {
                    //     "websocket": { timeout: 90000 },
                        // "flashsocket": { timeout: 90000 },
                        // "htmlfile": { timeout: 90000 },
                        // "xhr-multipart": { timeout: 90000 },
                        // "xhr-polling": { timeout: 90000 },
                        // "jsonp-polling": { timeout: 90000 },
                    // }

                } );

            } catch ( e ) {

                // If a connection to the reflector is not available, then run in single-user mode.
                // Messages intended for the reflector will loop directly back to us in this case.
                // Start a timer to monitor the incoming queue and dispatch the messages as though
                // they were received from the server.

                this.dispatch( 0 );

                setInterval( function() {
                    vwf.dispatch( vwf.now + 0.010 ); // TODO: there will be a slight skew here since the callback intervals won't be exactly 10 ms; increment using the actual delta time; also, support play/pause/stop and different playback rates as with connected mode.
                }, 10 );

            }

            if ( socket ) {

                socket.on( "connect", function() {

                    vwf.logger.info( "vwf.socket connected" );

                    vwf.moniker_ = this.transport.sessionid;

                } );

                // Configure a handler to receive messages from the server.
                
                // Note that this example code doesn't implement a robust parser capable of handling
                // arbitrary text and that the messages should be placed in a dedicated priority
                // queue for best performance rather than resorting the queue as each message
                // arrives. Additionally, overlapping messages may cause actions to be performed out
                // of order in some cases if messages are not processed on a single thread.

                socket.on( "message", function( message ) {

                    // this.logger.info( "vwf.socket message " + message );

                    try {

                        // Unpack the arguments.

                        var fields = JSON.parse( message );

                        fields.time = Number( fields.time );
                        // TODO: other message validation (check node id, others?)

                        // Add the message to the queue.

                        vwf.queue( fields );

                        // Each message from the server allows us to move time forward. Parse the
                        // timestamp from the message and call dispatch() to execute all queued
                        // actions through that time, including the message just received.
                    
                        // The simulation may perform immediate actions at the current time or it
                        // may post actions to the queue to be performed in the future. But we only
                        // move time forward for items arriving in the queue from the reflector.

                        vwf.dispatch( fields.time );

                    } catch ( e ) {

                        vwf.logger.warn( fields.action, fields.node, fields.member, fields.parameters,
                            "exception performing action:", e.stack );

                    }

                } );

                socket.on( "disconnect", function() { vwf.logger.info( "vwf.socket disconnected" ) } );

                socket.on( "error", function() { 

                    jQuery('body').html("<div class='vwf-err'>WebSockets connections are currently being blocked. Please check your proxy server settings.</div>"); 

                } );

                // Start communication with the reflector. 

                socket.connect();  // TODO: errors can occur here too, particularly if a local client contains the socket.io files but there is no server; do the loopback here instead of earlier in response to new io.Socket.

            } else if ( component_uri_or_json_or_object ) {

                // Load the application. The application is rooted in a single node constructed here
                // as an instance of the component passed to initialize(). That component, its
                // prototype(s), and its children, and their prototypes and children, flesh out the
                // entire application.

                // TODO: add note that this is only for a self-determined application; with socket, wait for reflection server to tell us.
                // TODO: maybe depends on component_uri_or_json_or_object too; when to override and not connect to reflection server?

                this.createNode( 0, component_uri_or_json_or_object, undefined );

            } else {  // TODO: also do this if component_uri_or_json_or_object was invalid and createNode() failed

                // TODO: show a selection dialog

            }

        };

        // -- queue --------------------------------------------------------------------------------

        this.queue = function( fields ) {

            fields.sequence = ++queue.sequence; // to stabilize the sort

            queue.push( fields );

            // Sort by time then by sequence.  // TODO: use a better-performing priority queue

            queue.sort( function( a, b ) {
                return a.time != b.time ?
                    a.time - b.time :
                    a.sequence - b.sequence;
            } );

        };

        // -- plan ---------------------------------------------------------------------------------

        this.plan = function( nodeID, actionName, memberName, parameters, when, callback /* ( result ) */ ) {

            var time = when > 0 ? // absolute (+) or relative (-)
                Math.max( this.now, when ) :
                this.now + ( -when );

            var fields = {
                time: time,
                node: nodeID,
                action: actionName,
                member: memberName,
                parameters: parameters,
                // callback: callback,  // TODO
            };

            if ( this.client_ ) {
                fields.client = this.client_; // propagate the current originating client
            }

            this.queue( fields );

        };

        // -- send ---------------------------------------------------------------------------------

        // Send a message to the reflector. The message will be reflected back to all participants
        // in the instance.

        this.send = function( nodeID, actionName, memberName, parameters, when, callback /* ( result ) */ ) {

            var time = when > 0 ? // absolute (+) or relative (-)
                Math.max( this.now, when ) :
                this.now + ( -when );

            // Attach the current simulation time and pack the message as an array of the arguments.

            var fields = {
                time: time,
                node: nodeID,
                action: actionName,
                member: memberName,
                parameters: parameters,
                // callback: callback,  // TODO: provisionally add fields to queue (or a holding queue) then execute callback when received back from reflector
            };

            if ( ! socket ) { // single-user mode
    
                // Loop the message back to the incoming queue.

                fields.client = this.moniker_; // stamp with the originating client like the reflector does
                this.queue( fields );
    
            } else {
                
                // Send the message.

                var message = JSON.stringify( fields );
                socket.send( message );

            }

        };

        // -- respond ------------------------------------------------------------------------------

        // Return a result for a function invoked by the server.

        this.respond = function( nodeID, actionName, memberName, parameters, result ) {

            // Nothing to do in single-user mode.

            if ( ! socket ) {
                return;
            }

            // Attach the current simulation time and pack the message as an array of the arguments.

            var fields = {
                // sequence: undefined,  // TODO: use to identify on return from reflector?
                node: nodeID,
                action: actionName,
                member: memberName,
                parameters: parameters,
                result: result,
            };

            // Send the message.

            var message = JSON.stringify( fields );
            socket.send( message );

        };

        // -- receive ------------------------------------------------------------------------------

        // Handle receipt of a message. Unpack the arguments and call the appropriate handler.

        this.receive = function( nodeID, actionName, memberName, parameters, callback /* ( ready ) */ ) {

// TODO: delegate parsing and validation to each action.

            // Look up the action handler and invoke it with the remaining parameters.

            // Note that the message should be validated before looking up and invoking an arbitrary
            // handler.

            var args = [];

            if ( nodeID || nodeID === 0 ) args.push( nodeID );  // TODO: don't bother testing anymore? createNode() before parentID didn't have a nodeID but now I think all functions do ... except time()?
            if ( memberName ) args.push( memberName );
            if ( parameters ) args = args.concat( parameters ); // flatten

            // Insert the ready callback for potentially-asynchronous actions.

            switch ( actionName ) {

                case "createNode": // nodeID, childComponent, childName, callback /* ( childID ) */

                    callback( false ); // suspend the queue

                    args[3] = function( childID ) {
                        callback( true ); // resume the queue when the action completes
                    };

                    break;

            }

            // Invoke the action.

            var result = this[actionName] && this[actionName].apply( this, args );

if ( socket && actionName == "getNode" ) {  // TODO: merge with send()
    this.respond( nodeID, actionName, memberName, parameters, result );
}
            
        };

        // -- dispatch -----------------------------------------------------------------------------

        // Dispatch incoming messages waiting in the queue. "currentTime" specifies the current
        // simulation time that we should advance to and was taken from the time stamp of the last
        // message received from the reflector.

        this.dispatch = function( currentTime ) {

            // Handle messages until we empty the queue or reach the new current time. For each,
            // remove the message and perform the action. The simulation time is advanced to the
            // message time as each one is processed.

            queue.time = Math.max( queue.time, currentTime ); // save current server time for pause/resume

            // Actions may use receive's ready function to suspend the queue for asynchronous
            // operations, and to resume it when the operation is complete.

            while ( queue.ready && queue.length > 0 && queue[0].time <= queue.time ) {

                var fields = queue.shift();

                // Advance the time.

                this.now = fields.time;

                // Record the originating client.

                this.client_ = fields.client;

                // Perform the action.

                this.receive( fields.node, fields.action, fields.member, fields.parameters, function( ready ) {
                    if ( Boolean( ready ) != Boolean( queue.ready ) ) {
                        vwf.logger.info( "vwf.dispatch:", ready ? "resuming" : "pausing", "queue at time", queue.time, "for", fields.action );
                        queue.ready = ready;
                        queue.ready && vwf.dispatch( queue.time );
                    }
                } );

                // Tick after the last message, or after the last message before the time advances.

                if ( queue.ready && ( queue.length == 0 || queue[0].time != this.now ) ) {
                    this.tick();
                }

            }

            // Set the simulation time to the new current time. Tick if the time advances.

            if ( queue.ready && queue.time != this.now ) {
                this.now = queue.time;
                this.tick();
            }
            
        };

        // -- tick ---------------------------------------------------------------------------------

        // Tick each tickable model, view, and node. Ticks are sent on each time change.

        this.tick = function() {

            // Call ticking() on each model.

            this.models.forEach( function( model ) {
                model.ticking && model.ticking( this.now ); // TODO: maintain a list of tickable models and only call those
            }, this );

            // Call ticked() on each view.

            this.views.forEach( function( view ) {
                view.ticked && view.ticked( this.now ); // TODO: maintain a list of tickable views and only call those
            }, this );

            // Call tick() on each tickable node.

            this.tickable.nodeIDs.forEach( function( nodeID ) {
                this.callMethod( nodeID, "tick", [ this.now ] );
            }, this );

        };

        // -- createNode ---------------------------------------------------------------------------

        // Create a node from a component specification. Construction may require loading data from
        // multiple remote documents. This function returns before construction is complete. A
        // callback is invoked once the node has fully loaded.
        // 
        // A simple node consists of a set of properties, methods and events, but a node may
        // specialize a prototype component and may also contain multiple child nodes, any of which
        // may specialize a prototype component and contain child nodes, etc. So components cover a
        // vast range of complexity. The application definition for the overall simulation is a
        // single component instance.
        // 
        // A node is a component instance--a single, anonymous specialization of its component.
        // Nodes specialize components in the same way that any component may specialize a prototype
        // component. The prototype component is made available as a base, then new or modified
        // properties, methods, events, child nodes and scripts are attached to modify the base
        // implemenation.
        // 
        // To create a node, we first make the prototoype available by loading it (if it has not
        // already been loaded). This is a recursive call to createNode() with the prototype
        // specification. Then we add new, and modify existing, properties, methods, and events
        // according to the component specification. Then we load an add any children, again
        // recursively calling createNode() for each. Finally, we attach any new scripts and invoke
        // an initialization function.

        this.createNode = function( nodeID, childComponent, childName, callback /* ( childID ) */ ) {  // TODO: swap childComponent & childName for consistency with createProperty( nodeID, memberName, memberDescription ), etc.  // TODO: consider renaming to createChild(), or switch node/child => parent/node

            this.logger.group( "vwf.createNode " + (
                typeof childComponent == "string" || childComponent instanceof String ?
                    childComponent : JSON.stringify( loggableComponent( childComponent ) )
            ) );

            // Any component specification may be provided as either a URI identifying a network
            // resource containing the specification or as an object literal that provides the data
            // directly.

            var component = normalizedComponent( childComponent );

            // Allocate an ID for the node. We just use an incrementing counter.  // TODO: must be unique and consistent regardless of load order; this is a gross hack.

            var childNodeID = ( component["extends"] || nodeTypeURI ) + "." + childName;
childNodeID = childNodeID.replace( /[^0-9A-Za-z_]+/g, "-" ); // stick to HTML id-safe characters

            this.logger.info( "vwf.createNode: creating node of type " + ( component["extends"] || nodeTypeURI ) + " with id " + childNodeID );

            // Call getType() to locate or load the prototype node, then pass the prototype and the
            // component specification to construct().
    
            this.getType( component["extends"] || nodeTypeURI, function( childPrototypeID ) { // TODO: could be a JSON-encoded type literal as with application param?

                async.map( component["implements"] || [], function( uri, callback /* ( err, result ) */ ) {

                    vwf.getType( uri, function( childBehaviorID ) {
                        callback( undefined, childBehaviorID );
                    } );

                }, function( err, childBehaviorIDs ) {

                    construct.call( vwf, nodeID, childNodeID, childPrototypeID, childBehaviorIDs, component, childName, function( childNodeID ) {
if ( nodeID != 0 ) // TODO: do this for 0 too (global root)? removes this.creatingNode( 0 ) in vwf/model/javascript and vwf/model/object? what about in getType()?
vwf.addChild( nodeID, childNodeID, childName );
                        if ( nodeID == 0 && component["extends"] && component["extends"] != nodeTypeURI && component["extends"][0] != "@" ) {  // TODO: const for root id  // TODO: normalizedComponent() on component["extends"] and use component.extends || component.source?
                            jQuery("body").append( "<div />" ).children( ":last" ).load( remappedURI( component["extends"] ) + ".html", function() { // load the UI chrome if available
                                callback && callback.call( vwf, childNodeID );
                            } );
                            // Removes 'loading' overlay
                            $('#loadstatus').remove();
                        } else {
                            callback && callback.call( vwf, childNodeID );
                        }
                    } );

                } );

            } );

            this.logger.groupEnd();
        };

        // -- deleteNode ---------------------------------------------------------------------------

        this.deleteNode = function( nodeID ) {

            this.logger.group( "vwf.deleteNode " + nodeID );

            // Call deletingNode() on each model. The node is considered deleted after each model
            // has run.

            this.models.forEach( function( model ) {
                model.deletingNode && model.deletingNode( nodeID );
            } );

            // Call deletedNode() on each view. The view is being notified that a node has been
            // deleted.

            this.views.forEach( function( view ) {
                view.deletedNode && view.deletedNode( nodeID );
            } );

            this.logger.groupEnd();
        };

        // -- getType ------------------------------------------------------------------------------

        // Find or load a node that will serve as the prototype for a component specification. If
        // the component is identified using a URI, save a mapping from the URI to the prototype ID
        // in the "types" database for reuse. If the component is not identified by a URI, don't
        // save a reference in the database (since no other component can refer to it), and just
        // create it as an anonymous type.

        this.getType = function( uri, callback /* nodeID */ ) {

            var nodeID = uri; // TODO: hash uri => nodeID to shorten for faster lookups? // TODO: canonicalize uri
nodeID = nodeID.replace( /[^0-9A-Za-z_]+/g, "-" ); // stick to HTML id-safe characters

if ( uri[0] == "@" ) {  // TODO: this is allowing an already-loaded nodeID to be used in place of an extends uri; this is primarily to support the tests, but should be eventually be fully supported.
    nodeID = JSON.parse( uri.slice( 1 ) );
    types[nodeID] = "dummy";
}

            // If the type is being loaded, add the callback to the list to be invoked when the load
            // completes.

            if ( types[nodeID] instanceof Array ) {

                types[nodeID].push( callback );

            // If the URI is in the database, invoke the callback with the ID of the previously-
            // loaded prototype node.
            
            } else if ( types[nodeID] ) {

                callback && callback.call( this, nodeID );

            // If the type has not been loaded, call createNode() to make the node that we will use
            // as the prototype. When it loads, save the ID in the types database and invoke the
            // callback with the new prototype node's ID.

            // nodeTypeURI is a special URI identifying the base "node" component that is the
            // ultimate prototype of all other components. Its specification is known
            // intrinsicly and does not exist as a network resource. If the component URI
            // identifies "node", call construct() directly and pass a null prototype and an
            // empty specification.

            } else if ( uri == nodeTypeURI ) {

                types[nodeID] = [ callback ]; // array of callbacks while loading

                var component = {};
                var prototypeID = undefined;

                this.logger.info( "vwf.getType: creating type " + uri );

                construct.call( this, 0, nodeID, prototypeID, [], component, undefined, function( nodeID ) {

                    var callbacks = types[nodeID];
                    types[nodeID] = component; // component specification once loaded
                    uris[nodeID] = uri;

                    callbacks.forEach( function( callback ) {
                        callback && callback.call( vwf, nodeID );
                    } );

                } );

            // For any other URI, load the document. Once it loads, call getType() to locate or
            // load the prototype node, then pass the prototype and the component specification
            // to construct().

            } else {

                this.logger.info( "vwf.getType: creating type " + uri );

                types[nodeID] = [ callback ]; // array of callbacks while loading

                jQuery.ajax( {

                    url: remappedURI( uri ),
                    dataType: "jsonp",

                    success: function( component ) {

                        this.getType( component["extends"] || nodeTypeURI, function( prototypeID ) { // TODO: if object literal?

                            async.map( component["implements"] || [], function( uri, callback /* ( err, result ) */ ) {

                                vwf.getType( uri, function( behaviorID ) {
                                    callback( undefined, behaviorID );
                                } );

                            }, function( err, behaviorIDs ) {

                                construct.call( vwf, 0, nodeID, prototypeID, behaviorIDs, component, undefined, function( nodeID ) {

                                    var callbacks = types[nodeID];
                                    types[nodeID] = component; // component specification once loaded
                                    uris[nodeID] = uri;

                                    callbacks.forEach( function( callback ) {
                                        callback && callback.call( vwf, nodeID );
                                    } );

                                } );

                            } );

                        } );

                    },

                    context: this

                } );

            }

        };

        // -- setNode ------------------------------------------------------------------------------

        this.setNode = function( nodeID, component ) {

Object.keys( component ).forEach( function( nodeID ) {
    this.setProperties( nodeID, component[nodeID] );
}, this );

return;

            // var prototypeID = this.prototype( nodeID );
            // var childrenIDs = this.children( nodeID );

            // if ( prototypeID && component.extends ) {
            //     this.setNode( prototypeID, component.extends );
            // }

            // // implements: [ ? ]  // TODO

            // component.properties && this.setProperties( nodeID, component.properties );
            // // component.methods  // TODO
            // // component.events  // TODO

            // component.children && childrenIDs.forEach( function( childID, childIndex ) {
            //     component.children[childIndex] && vwf.setNode( childID, component.children[childIndex] );
            // } );

            // return component;
        };

        // -- getNode ------------------------------------------------------------------------------

        this.getNode = function( nodeID ) {

            var component = {};

Object.keys( this.models.object.objects ).forEach( function( nodeID ) {
    component[nodeID] = this.getProperties( nodeID );
    Object.keys( component[nodeID] ).length || delete component[nodeID];
}, this );

return component;

            // var prototypeID = this.prototype( nodeID );
            // var childrenIDs = this.children( nodeID );

            // if ( prototypeID !== undefined ) {
            //     component.extends = this.getNode( prototypeID );
            //     Object.keys( component.extends ).length || delete component.extends;
            // }

            // // implements: [ ? ]  // TODO

            // component.properties = this.getProperties( nodeID );

            // for ( var propertyName in component.properties ) {
            //     component.properties[propertyName] === undefined &&
            //         delete component.properties[propertyName];
            // }

            // Object.keys( component.properties ).length ||
            //     delete component.properties;

            // component.methods = {};  // TODO

            // for ( var methodName in component.methods ) {
            //     component.methods[methodName] === undefined &&
            //         delete component.methods[methodName];
            // }

            // Object.keys( component.methods ).length ||
            //     delete component.methods;

            // component.events = {};  // TODO

            // for ( var eventName in component.events ) {
            //     component.events[eventName] === undefined &&
            //         delete component.events[eventName];
            // }

            // Object.keys( component.events ).length ||
            //     delete component.events;
            
            // if ( childrenIDs.length ) {
            //     component.children = childrenIDs.map( function( childID ) {
            //         return vwf.getNode( childID );
            //     } );
            // }

            // return component;
        };


        // -- prototype ----------------------------------------------------------------------------

        this.prototype = function( nodeID ) {  // TODO: no need to pass through all models; maintain a single truth in vwf/model/object and delegate there directly

            // Call prototyping() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var prototypeID = undefined;

            this.models.some( function( model ) {
                prototypeID = model.prototyping && model.prototyping( nodeID );
                return prototypeID !== undefined;
            } );

            return prototypeID;
        };

        // -- prototypes ---------------------------------------------------------------------------

        this.prototypes = function( nodeID ) {  // TODO: no need to pass through all models; maintain a single truth in vwf/model/object and delegate there directly

            var prototypeIDs = [];
            var prototypeID = undefined;
            
            while ( nodeID !== undefined ) {
                if ( ( prototypeID = prototypeIDs.prototype( nodeID ) ) !== undefined ) { // assignment is intentional
                    prototypeIDs.push( prototypeID );
                }
                nodeID = prototypeID;
            }
            
            return prototypeIDs;
        };

        // -- behaviors ----------------------------------------------------------------------------

        this.behaviors = function( nodeID ) {  // TODO: no need to pass through all models; maintain a single truth in vwf/model/object and delegate there directly

            // Call behavioring() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var behaviorIDs = undefined;

            this.models.some( function( model ) {
                behaviorIDs = model.behavioring && model.behavioring( nodeID );
                return behaviorIDs !== undefined && behaviorIDs.length > 0;
            } );

            return behaviorIDs || [];
        };

        // -- addChild -----------------------------------------------------------------------------

        this.addChild = function( nodeID, childID, childName ) {

            this.logger.group( "vwf.addChild " + nodeID + " " + childID + " " + childName );

            // Call addingChild() on each model. The child is considered added after each model has
            // run.

            this.models.forEach( function( model ) {
                model.addingChild && model.addingChild( nodeID, childID, childName );
            } );

            // Call addedChild() on each view. The view is being notified that a child has been
            // added.

            this.views.forEach( function( view ) {
                view.addedChild && view.addedChild( nodeID, childID, childName );
            } );

            this.logger.groupEnd();
        };

        // -- removeChild --------------------------------------------------------------------------

        this.removeChild = function( nodeID, childID ) {

            this.logger.group( "vwf.removeChild " + nodeID + " " + childID );

            // Call removingChild() on each model. The child is considered removed after each model
            // has run.

            this.models.forEach( function( model ) {
                model.removingChild && model.removingChild( nodeID, childID );
            } );

            // Call removedChild() on each view. The view is being notified that a child has been
            // removed.

            this.views.forEach( function( view ) {
                view.removedChild && view.removedChild( nodeID, childID );
            } );

            this.logger.groupEnd();
        };

        // -- ancestors ----------------------------------------------------------------------------

        this.ancestors = function( nodeID ) {  // TODO: no need to pass through all models; maintain a single truth in vwf/model/object and delegate there directly

            var ancestors = [];

            nodeID = this.parent( nodeID );

            while ( nodeID && nodeID !== 0 ) {
                ancestors.push( nodeID );
                nodeID = this.parent( nodeID );
            }

            return ancestors;
        };

        // -- parent -------------------------------------------------------------------------------

        this.parent = function( nodeID ) {  // TODO: no need to pass through all models; maintain a single truth in vwf/model/object and delegate there directly

            // Call parenting() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var parent = undefined;

            this.models.forEach( function( model ) {
                var modelParent = model.parenting && model.parenting( nodeID );
                parent = modelParent !== undefined ? modelParent  : parent;
            } );

            return parent;
        };

        // -- children -----------------------------------------------------------------------------

        this.children = function( nodeID ) {  // TODO: no need to pass through all models; maintain a single truth in vwf/model/object and delegate there directly

            this.logger.group( "vwf.children " + nodeID );

            // Call childrening() on each model. The return value is the union of the non-undefined
            // results.

            var children = [];

            this.models.forEach( function( model ) {
                var modelChildren = model.childrening && model.childrening( nodeID ) || [];
                Array.prototype.push.apply( children, modelChildren );
            } );

            this.logger.groupEnd();

            return children; // TODO: remove duplicates, hopefully without re-ordering.
        };

        // -- name ---------------------------------------------------------------------------------

        this.name = function( nodeID ) {  // TODO: no need to pass through all models; maintain a single truth in vwf/model/object and delegate there directly

            // Call naming() on each model. The first model to return a non-undefined value dictates
            // the return value.

            var name = undefined;

            this.models.forEach( function( model ) {
                var modelName = model.naming && model.naming( nodeID );
                name = modelName !== undefined ? modelName : name;
            } );

            return name;
        };

        // -- setProperties ------------------------------------------------------------------------

        // Set all of the properties for a node.

        this.setProperties = function( nodeID, properties ) {

            this.logger.group( "vwf.setProperties " + nodeID + " " + properties );

            // Call settingProperties() on each model.

            properties = this.models.reduceRight( function( intermediate_properties, model ) {  // TODO: note that we can't go left to right and stop after the first that accepts the set since we are setting all of the properties as a batch; verify that this creates the same result as calling setProperty individually on each property and that there are no side effects from setting through a driver after the one that handles the set.

                var model_properties = {};

                if ( model.settingProperties ) {
                    model_properties = model.settingProperties( nodeID, properties );
                } else if ( model.settingProperty ) {
                    for ( var propertyName in properties ) {
                        model_properties[propertyName] =
                            model.settingProperty( nodeID, propertyName, properties[propertyName] );
                    }
                }

                for ( var propertyName in model_properties ) {
                    if ( model_properties[propertyName] !== undefined ) {
                        intermediate_properties[propertyName] = model_properties[propertyName];
                    }
                }

                return intermediate_properties;

            }, {} );

            // Call satProperties() on each view.

            this.views.forEach( function( view ) {

                if ( view.satProperties ) {
                    view.satProperties( nodeID, properties );
                } else if ( view.satProperty ) {
                    for ( var propertyName in properties ) {
                        view.satProperty( nodeID, propertyName, properties[propertyName] );  // TODO: be sure this is the value actually set, not the incoming value
                    }
                }

            } );

            this.logger.groupEnd();

            return properties;
        };

        // -- getProperties ------------------------------------------------------------------------

        // Get all of the properties for a node.

        this.getProperties = function( nodeID ) {

            this.logger.group( "vwf.getProperties " + nodeID );

            // Call gettingProperties() on each model.

            var properties = this.models.reduceRight( function( intermediate_properties, model ) {  // TODO: note that we can't go left to right and take the first result since we are getting all of the properties as a batch; verify that this creates the same result as calling getProperty individually on each property and that there are no side effects from getting through a driver after the one that handles the get.

                var model_properties = {};

                if ( model.gettingProperties ) {
                    model_properties = model.gettingProperties( nodeID, properties );
                } else if ( model.gettingProperty ) {
                    for ( var propertyName in intermediate_properties ) {
                        model_properties[propertyName] =
                            model.gettingProperty( nodeID, propertyName, intermediate_properties[propertyName] );
                    }
                }

                for ( var propertyName in model_properties ) {
                    if ( model_properties[propertyName] !== undefined ) {
                        if ( objectIsTypedArray( model_properties[propertyName] ) ) {
                            intermediate_properties[propertyName] = Array.prototype.slice.call( model_properties[propertyName] ); // convert typed arrays to regular arrays for proper JSON serialization
                        } else {
                            intermediate_properties[propertyName] = model_properties[propertyName];
                        }
                    }
                }

                return intermediate_properties;

            }, {} );

            // Call gotProperties() on each view.

            this.views.forEach( function( view ) {

                if ( view.gotProperties ) {
                    view.gotProperties( nodeID, properties );
                } else if ( view.gotProperty ) {
                    for ( var propertyName in properties ) {
                        view.gotProperty( nodeID, propertyName, properties[propertyName] );  // TODO: be sure this is the value actually gotten and not an intermediate value from above
                    }
                }

            } );

            this.logger.groupEnd();

            return properties;
        };

        // -- createProperty -----------------------------------------------------------------------

        // Create a property on a node and assign an initial value.

        this.createProperty = function( nodeID, propertyName, propertyValue, propertyGet, propertySet ) {

            this.logger.group( "vwf.createProperty " + nodeID + " " + propertyName + " " + propertyValue );  // TODO: add truncated propertyGet, propertySet to log

            // Call creatingProperty() on each model. The property is considered created after each
            // model has run.

            this.models.forEach( function( model ) {
                model.creatingProperty && model.creatingProperty( nodeID, propertyName, propertyValue, propertyGet, propertySet );
            } );

            // Call createdProperty() on each view. The view is being notified that a property has
            // been created.

            this.views.forEach( function( view ) {
                view.createdProperty && view.createdProperty( nodeID, propertyName, propertyValue, propertyGet, propertySet );
            } );

            this.logger.groupEnd();

            return propertyValue;
        };

        // -- setProperty --------------------------------------------------------------------------

        // Set a property value on a node.

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

            this.logger.group( "vwf.setProperty " + nodeID + " " + propertyName + " " + propertyValue );

            var initializing = ! nodeHasOwnProperty.call( this, nodeID, propertyName );

            // Record calls into this function by nodeID and propertyName so that models may call
            // back here (directly or indirectly) to delegate responses further down the chain
            // without causing infinite recursion.

            var entrants = this.setProperty.entrants;

            var entry = entrants[nodeID+'-'+propertyName] || {}; // the most recent call, if any  // TODO: need unique nodeID+propertyName hash
            var reentry = entrants[nodeID+'-'+propertyName] = {}; // this call

            // Call settingProperty() on each model. The first model to return a non-undefined value
            // has performed the set and dictates the return value. The property is considered set
            // after each model has run.

            this.models.some( function( model, index ) {

                // Skip models up through the one making the most recent call here (if any).

                if ( entry.index === undefined || index > entry.index ) {

                    // Record the active model number.
 
                    reentry.index = index;

                    // Make the call.

                    if ( initializing ) {
                        var value = model.initializingProperty &&
                            model.initializingProperty( nodeID, propertyName, propertyValue );
                    } else {
                        var value = model.settingProperty &&
                            model.settingProperty( nodeID, propertyName, propertyValue );
                    }

                    // Look for a return value potentially stored here by a reentrant call if the
                    // model didn't return one explicitly (such as with a JavaScript accessor
                    // method).

                    if ( value === undefined ) {
                        value = reentry.value;
                    }

                    // Record the value actually assigned. This may differ from the incoming value
                    // if it was range limited, quantized, etc. by the model. This is the value
                    // passed to the views.

                    if ( value !== undefined ) {
                        propertyValue = value;
                    }

                    // If we are setting, exit from the this.models.some() iterator once the value
                    // has been set. Don't exit early if we are initializing since every model needs
                    // the opportunity to register the property.

                    return ! initializing && value !== undefined;  // TODO: this stops after p: { set: "this.p = value" } or p: { set: "return value" }, but should it also stop on p: { set: "this.q = value" }?
                }

            } );

            if ( entry.index !== undefined ) {

                // For a reentrant call, restore the previous state, move the index forward to cover
                // the models we called, and record the current result.

                entrants[nodeID+'-'+propertyName] = entry;
                entry.value = propertyValue;

            } else {

                // Delete the call record if this is the first, non-reentrant call here (the normal
                // case).

                delete entrants[nodeID+'-'+propertyName];

                // Call satProperty() on each view. The view is being notified that a property has
                // been set.  TODO: only want to call when actually set and with final value

                this.views.forEach( function( view ) {
                    if ( initializing ) {
                        view.initializedProperty && view.initializedProperty( nodeID, propertyName, propertyValue );  // TODO: be sure this is the value actually set, not the incoming value
                    } else {
                        view.satProperty && view.satProperty( nodeID, propertyName, propertyValue );  // TODO: be sure this is the value actually set, not the incoming value
                    }
                } );

            }

            this.logger.groupEnd();

            return propertyValue;
        };

        this.setProperty.entrants = {}; // maps ( nodeID + '-' + propertyName ) => { index: i, value: v }

        // -- getProperty --------------------------------------------------------------------------

        // Get a property value for a node.

        this.getProperty = function( nodeID, propertyName ) {

            this.logger.group( "vwf.getProperty " + nodeID + " " + propertyName );

            // Call gettingProperty() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var propertyValue = undefined;

            // Record calls into this function by nodeID and propertyName so that models may call
            // back here (directly or indirectly) to delegate responses further down the chain
            // without causing infinite recursion.

            var entrants = this.getProperty.entrants;

            var entry = entrants[nodeID+'-'+propertyName] || {}; // the most recent call, if any  // TODO: need unique nodeID+propertyName hash
            var reentry = entrants[nodeID+'-'+propertyName] = {}; // this call

            // Call gettingProperty() on each model. The first model to return a non-undefined value
            // dictates the return value.

            this.models.some( function( model, index ) {

                // Skip models up through the one making the most recent call here (if any).

                if ( entry.index === undefined || index > entry.index ) {

                    // Record the active model number.
 
                    reentry.index = index;

                    // Make the call.

                    var value = model.gettingProperty &&
                        model.gettingProperty( nodeID, propertyName, propertyValue );  // TODO: probably don't need propertyValue here

                    // Look for a return value potentially stored here by a reentrant call if the
                    // model didn't return one explicitly (such as with a JavaScript accessor
                    // method).

                    if ( value === undefined ) {
                        value = reentry.value;
                    }

                    // Record the value retrieved.

                    if ( value !== undefined ) {
                        propertyValue = value;
                    }

                    // Exit from the this.models.some() iterator once we have a return value.

                    return value !== undefined;
                }

            } );

            if ( entry.index !== undefined ) {

                // For a reentrant call, restore the previous state, move the index forward to cover
                // the models we called, and record the current result.

                entrants[nodeID+'-'+propertyName] = entry;
                entry.value = propertyValue;

            } else {

                // Delete the call record if this is the first, non-reentrant call here (the normal
                // case).

                delete entrants[nodeID+'-'+propertyName];

                // Delegate to the prototype if we didn't get a result from the current node.

                if ( propertyValue === undefined ) {
                    var prototypeID = nodePrototypeID.call( this, nodeID );
                    if ( prototypeID != nodeTypeURI.replace( /[^0-9A-Za-z_]+/g, "-" ) ) {
                        propertyValue = this.getProperty( prototypeID, propertyName );
                    }
                }

                // Call gotProperty() on each view.

                this.views.forEach( function( view ) {
                    view.gotProperty && view.gotProperty( nodeID, propertyName, propertyValue );  // TODO: be sure this is the value actually gotten and not an intermediate value from above
                } );

            }

            this.logger.groupEnd();

            return propertyValue;
        };

        this.getProperty.entrants = {}; // maps ( nodeID + '-' + propertyName ) => { index: i, value: v }

        // -- createMethod -------------------------------------------------------------------------

        this.createMethod = function( nodeID, methodName, methodParameters, methodBody ) {

            this.logger.group( "vwf.createMethod " + nodeID + " " + methodName + " " + methodParameters );

            // Call creatingMethod() on each model. The method is considered created after each
            // model has run.

            this.models.forEach( function( model ) {
                model.creatingMethod && model.creatingMethod( nodeID, methodName, methodParameters, methodBody );
            } );

            // Call createdMethod() on each view. The view is being notified that a method has been
            // created.

            this.views.forEach( function( view ) {
                view.createdMethod && view.createdMethod( nodeID, methodName, methodParameters, methodBody );
            } );

            this.logger.groupEnd();
        };

        // -- callMethod ---------------------------------------------------------------------------

        this.callMethod = function( nodeID, methodName, methodParameters ) {

            this.logger.group( "vwf.callMethod " + nodeID + " " + methodName + " " + methodParameters );

            // Call callingMethod() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var methodValue = undefined;

            this.models.forEach( function( model ) {
                var value = model.callingMethod && model.callingMethod( nodeID, methodName, methodParameters );
                methodValue = value !== undefined ? value : methodValue;
            } );

            // Call calledMethod() on each view.

            this.views.forEach( function( view ) {
                view.calledMethod && view.calledMethod( nodeID, methodName, methodParameters );  // TODO: should also have result
            } );

            this.logger.groupEnd();

            return methodValue;
        };

        // -- createEvent --------------------------------------------------------------------------

        this.createEvent = function( nodeID, eventName, eventParameters ) {  // TODO: parameters (used? or just for annotation?)  // TODO: allow a handler body here and treat as this.*event* = function() {} (a self-targeted handler); will help with ui event handlers

            this.logger.group( "vwf.createEvent " + nodeID + " " + eventName + " " + eventParameters );

            // Call creatingEvent() on each model. The event is considered created after each model
            // has run.

            this.models.forEach( function( model ) {
                model.creatingEvent && model.creatingEvent( nodeID, eventName, eventParameters );
            } );

            // Call createdEvent() on each view. The view is being notified that a event has been
            // created.

            this.views.forEach( function( view ) {
                view.createdEvent && view.createdEvent( nodeID, eventName, eventParameters );
            } );

            this.logger.groupEnd();
        };

        // -- fireEvent ----------------------------------------------------------------------------

        this.fireEvent = function( nodeID, eventName, eventParameters ) {

            this.logger.group( "vwf.fireEvent " + nodeID + " " + eventName + " " + eventParameters );

            // Call firingEvent() on each model.

            var handled = this.models.reduce( function( handled, model ) {
                return model.firingEvent && model.firingEvent( nodeID, eventName, eventParameters ) || handled;
            }, false );

            // Call firedEvent() on each view.

            this.views.forEach( function( view ) {
                view.firedEvent && view.firedEvent( nodeID, eventName, eventParameters );
            } );

            this.logger.groupEnd();

            return handled;
        };

        // -- dispatchEvent ------------------------------------------------------------------------

        // Dispatch an event toward a node. Using fireEvent(), capture (down) and bubble (up) along
        // the path from the global root to the node. Cancel when one of the handlers returns a
        // truthy value to indicate that it has handled the event.

        this.dispatchEvent = function( nodeID, eventName, eventParameters, eventNodeParameters ) {

            this.logger.group( "vwf.dispatchEvent " + nodeID + " " + eventName + " " + eventParameters + " " + eventNodeParameters );

            // Defaults for the parameter parameters.

            eventParameters = eventParameters || [];
            eventNodeParameters = eventNodeParameters || {};

            // Find the inheritance path from the node to the root.

            var ancestorIDs = this.ancestors( nodeID );
            var lastAncestorID = "";

            // Make space to record the parameters sent to each node. Parameters provided for upper
            // nodes cascade down until another definition is found for a lower node. We'll remember
            // these on the way down and replay them on the way back up.

            var cascadedEventNodeParameters = {
                "": eventNodeParameters[""] || [] // defaults come from the "" key in eventNodeParameters
            };

            // Parameters passed to the handlers are the concatention of the eventParameters array,
            // the eventNodeParameters for the node (cascaded), and the phase.

            var targetEventParameters = undefined;

            var phase = undefined;
            var handled = false;

            // Capturing phase.

            phase = "capture"; // only handlers tagged "capture" will be invoked

            handled = handled || ancestorIDs.reverse().some( function( ancestorID ) {  // TODO: reverse updates the array in place every time and we'd rather not

                cascadedEventNodeParameters[ancestorID] = eventNodeParameters[ancestorID] ||
                    cascadedEventNodeParameters[lastAncestorID];

                lastAncestorID = ancestorID;

                targetEventParameters =
                    eventParameters.concat( cascadedEventNodeParameters[ancestorID], phase );
                
                targetEventParameters.phase = phase; // smuggle the phase across on the parameters array  // TODO: add "phase" as a fireEvent() parameter? it isn't currently needed in the kernel public API (not queueable, not called by the drivers), so avoid if possible

                return this.fireEvent( ancestorID, eventName, targetEventParameters );

            }, this );

            // At target.

            phase = undefined; // invoke all handlers

            cascadedEventNodeParameters[nodeID] = eventNodeParameters[nodeID] ||
                cascadedEventNodeParameters[lastAncestorID];

            targetEventParameters =
                eventParameters.concat( cascadedEventNodeParameters[nodeID], phase );

            handled = handled || this.fireEvent( nodeID, eventName, targetEventParameters );

            // Bubbling phase.

            phase = undefined; // invoke all handlers

            handled = handled || ancestorIDs.reverse().some( function( ancestorID ) {  // TODO: reverse updates the array in place every time and we'd rather not

                targetEventParameters =
                    eventParameters.concat( cascadedEventNodeParameters[ancestorID], phase );

                return this.fireEvent( ancestorID, eventName, targetEventParameters );

            }, this );

            this.logger.groupEnd();
        };

        // -- execute ------------------------------------------------------------------------------

        this.execute = function( nodeID, scriptText, scriptType ) {

            this.logger.group( "vwf.execute " + nodeID + " " + ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ) + " " + scriptType );

            // Assume JavaScript if the type is not specified and the text is a string.

            if ( ! scriptType && ( typeof scriptText == "string" || scriptText instanceof String ) ) {
                scriptType = "application/javascript";
            }

            // Call executing() on each model. The script is considered executed after each model
            // has run.

            var scriptValue = undefined;

            this.models.some( function( model ) {
                scriptValue = model.executing && model.executing( nodeID, scriptText, scriptType );
                return scriptValue !== undefined;
            } );

            // Call executed() on each view. The view is being notified that a script has been
            // executed.

            this.views.forEach( function( view ) {
                view.executed && view.executed( nodeID, scriptText, scriptType );
            } );

            this.logger.groupEnd();

            return scriptValue;
        };

        // -- time ---------------------------------------------------------------------------------

        // The current simulation time.

        this.time = function() {
            return this.now;
        };

        // -- client -------------------------------------------------------------------------------

        // The moniker of the client responsible for the current action. Will be falsy for actions
        // originating in the server, such as time ticks.

        this.client = function() {
            return this.client_;
        };

        // -- moniker ------------------------------------------------------------------------------

        // The identifer the server assigned to this client.

        this.moniker = function() {
            return this.moniker_;
        };

        // -- logger -------------------------------------------------------------------------------

        this.logger = {

            enabled: false,
            log: function() { this.enabled && window.console && console.log && console.log.apply( console, arguments ) },
            debug: function() { this.enabled && window.console && console.debug && console.debug.apply( console, arguments ) },
            info: function() { this.enabled && window.console && console.info && console.info.apply( console, arguments ) },
            warn: function() { window.console && console.warn && console.warn.apply( console, arguments ) },
            error: function() { window.console && console.error && console.error.apply( console, arguments ) },
            group: function() { this.enabled && window.console && console.group && console.group.apply( console, arguments ) },
            groupCollapsed: function() { this.enabled && window.console && console.groupCollapsed && console.groupCollapsed.apply( console, arguments ) },
            groupEnd: function() { this.enabled && window.console && console.groupEnd && console.groupEnd.apply( console, arguments ) },
        };

        // == Private functions ====================================================================

        // -- construct ----------------------------------------------------------------------------

        // When we arrive here, we have a prototype node in hand (by way of its ID) and an object
        // containing a component specification. We now need to create and assemble the new node.
        // 
        // The VWF manager doesn't directly manipulate any node. The various models act in
        // federation to create the greater model. The manager simply routes messages within the
        // system to allow the models to maintain the necessary data. Additionally, the views
        // receive similar messages that allow them to keep their interfaces current.
        //
        // To create a node, we simply assign a new ID, then invoke a notification on each model and
        // a notification on each view.

        var construct = function( parentID, nodeID, prototypeID, behaviorIDs, nodeComponent, nodeName, callback /* ( nodeID ) */ ) {

            this.logger.group( "vwf.construct " + nodeID + " " + nodeComponent.source + " " + nodeComponent.type );

            var deferredInitializations = {};

            async.series( [

                function( callback /* ( err, results ) */ ) {

                    // Call creatingNode() on each model. The node is considered to be constructed after
                    // each model has run.

                    async.forEachSeries( vwf.models, function( model, callback /* ( err ) */ ) {

                        var driver_ready = true;

                        model.creatingNode && model.creatingNode( parentID, nodeID, prototypeID, behaviorIDs,
                                nodeComponent.source, nodeComponent.type, nodeName, function( ready ) {

                            if ( Boolean( ready ) != Boolean( driver_ready ) ) {
                                vwf.logger.debug( "vwf.construct: creatingNode", ready ? "resuming" : "pausing", "at", nodeID, "for", nodeComponent.source );
                                driver_ready = ready;
                                driver_ready && callback( undefined );
                            }

                        } );

                        driver_ready && callback( undefined );

                    }, function( err ) {
                        callback( err, undefined );
                    } );

                },

                function( callback /* ( err, results ) */ ) {

                    // Call createdNode() on each view. The view is being notified of a node that has
                    // been constructed.

                    async.forEach( vwf.views, function( view, callback /* ( err ) */ ) {

                        var driver_ready = true;

                        view.createdNode && view.createdNode( parentID, nodeID, prototypeID, behaviorIDs,
                                nodeComponent.source, nodeComponent.type, nodeName, function( ready ) {

                            if ( Boolean( ready ) != Boolean( driver_ready ) ) {
                                vwf.logger.debug( "vwf.construct: createdNode", ready ? "resuming" : "pausing", "at", nodeID, "for", nodeComponent.source );
                                driver_ready = ready;
                                driver_ready && callback( undefined );
                            }

                        } );

                        driver_ready && callback( undefined );

                    }, function( err ) {
                        callback( err, undefined );
                    } );

                },

                function( callback /* ( err, results ) */ ) {

                    // Create the properties, methods, and events. For each item in each set, invoke
                    // createProperty(), createMethod(), or createEvent() to create the field. Each
                    // delegates to the models and views as above.

                    nodeComponent.properties && jQuery.each( nodeComponent.properties, function( propertyName, propertyValue ) {

                        var value = propertyValue, get, set, create;

                        if ( valueHasAccessors( propertyValue ) ) {
                            value = propertyValue.value;
                            get = propertyValue.get;
                            set = propertyValue.set;
                            create = propertyValue.create;
                        }

                        // Is the property specification directing us to create a new property, or
                        // initialize a property already defined on a prototype?

                        // Create a new property if an explicit getter or setter are provided or if
                        // the property is not defined on a prototype. Initialize the property when
                        // the property is already defined on a prototype and no explicit getter or
                        // setter are provided.

                        var creating = create || // explicit create directive, or
                            get !== undefined || set !== undefined || // explicit accessor, or
                            ! nodeHasProperty.call( vwf, nodeID, propertyName ); // not defined on prototype

                        // Are we assigning the value here, or deferring assignment until the node
                        // is constructed because setters will run?

                        var assigning = value === undefined || // no value, or
                            set === undefined && ( creating || ! nodePropertyHasSetter.call( vwf, nodeID, propertyName ) ); // no setter

                        if ( ! assigning ) {
                            deferredInitializations[propertyName] = value;
                            value = undefined;
                        }

                        // Create or initialize the property.

                        if ( creating ) {
                            vwf.createProperty( nodeID, propertyName, value, get, set );
                        } else {
                            vwf.setProperty( nodeID, propertyName, value );
                        }

                    } );

                    nodeComponent.methods && jQuery.each( nodeComponent.methods, function( methodName, methodValue ) {

                        if ( valueHasBody( methodValue ) ) {
                            vwf.createMethod( nodeID, methodName, methodValue.parameters, methodValue.body );
                        } else {
                            vwf.createMethod( nodeID, methodName, undefined, methodValue );
                        }

                    } );

                    nodeComponent.events && jQuery.each( nodeComponent.events, function( eventName, eventValue ) {

                        if ( valueHasBody( eventValue ) ) {
                            vwf.createEvent( nodeID, eventName, eventValue.parameters );
                        } else {
                            vwf.createEvent( nodeID, eventName, undefined );
                        }

                    } );

                    callback( undefined, undefined );
                },

                function( callback /* ( err, results ) */ ) {

                    // Create and attach the children. For each child, call createNode() with the
                    // child's component specification, then once loaded, call addChild() to attach the
                    // new node as a child. addChild() delegates to the models and views as before.

                    async.forEach( Object.keys( nodeComponent.children || {} ), function( childName, callback /* ( err ) */ ) {
                        vwf.createNode( nodeID, nodeComponent.children[childName], childName, function( childID ) {  // TODO: add in original order from nodeComponent.children
                            callback( undefined );
                        } );
                    }, function( err ) {
                        callback( err, undefined );
                    } );

                },

                function( callback /* ( err, results ) */ ) {

                    // Attach the scripts. For each script, load the network resource if the script is
                    // specified as a URI, then once loaded, call execute() to direct any model that
                    // manages scripts of this script's type to evaluate the script where it will
                    // perform any immediate actions and retain any callbacks as appropriate for the
                    // script type.

                    nodeComponent.scripts && nodeComponent.scripts.forEach( function( script ) {
                        //console.info(script);
                        if ( valueHasType( script ) ) {
                            script.text && vwf.execute( nodeID, script.text, script.type ); // TODO: external scripts too // TODO: callback
                        } else {
                            script && vwf.execute( nodeID, script, undefined ); // TODO: external scripts too // TODO: callback
                        }
                    } );

                    callback( undefined, undefined );
                },

                function( callback /* ( err, results ) */ ) {

                    // Perform initializations for properties with setter functions. These are
                    // assigned here so that the setters run on a fully-constructed node.

                    Object.keys( deferredInitializations ).forEach( function( propertyName ) {
                        vwf.setProperty( nodeID, propertyName, deferredInitializations[propertyName] );
                    }, this );

// TODO: Adding the node to the tickable list here if it contains a tick() function in JavaScript at initialization time. Replace with better control of ticks on/off and the interval by the node.

if ( vwf.execute( nodeID, "Boolean( this.tick )" ) ) {
    vwf.tickable.nodeIDs.push( nodeID );
}

                    // Call initializingNode() on each model and initializedNode() on each view to
                    // indicate that the node is fully constructed.

                    vwf.models.forEach( function( model ) {
                        model.initializingNode && model.initializingNode( parentID, nodeID );
                    } );

                    vwf.views.forEach( function( view ) {
                        view.initializedNode && view.initializedNode( parentID, nodeID );
                    } );

                    callback( undefined, undefined );
                },

            ], function( err, results ) {

                // The node is complete. Invoke the callback method and pass the new node ID and the
                // ID of its prototype. If this was the root node for the application, the
                // application is now fully initialized.

                callback && callback.call( vwf, nodeID );
            } );

            this.logger.groupEnd();
        };

        var nodeHasProperty = function( nodeID, propertyName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript
            var node = this.models.javascript.nodes[nodeID];
            return propertyName in node.properties;
        };

        var nodeHasOwnProperty = function( nodeID, propertyName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript
            var node = this.models.javascript.nodes[nodeID];
            return node.properties.hasOwnProperty( propertyName );  // TODO: this is peeking inside of vwf-model-javascript
        };

        var nodePropertyHasSetter = function( nodeID, propertyName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript; need to delegate to all script drivers
            var node = this.models.javascript.nodes[nodeID];
            var setter = node.private.setters && node.private.setters[propertyName];
            return typeof setter == "function" || setter instanceof Function;
        };

        var nodePropertyHasOwnSetter = function( nodeID, propertyName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript; need to delegate to all script drivers
            var node = this.models.javascript.nodes[nodeID];
            var setter = node.private.setters && node.private.setters.hasOwnProperty( propertyName ) && node.private.setters[propertyName];
            return typeof setter == "function" || setter instanceof Function;
        };

        var nodePrototypeID = function( nodeID ) { // invoke with the kernel as "this"
            var node = this.models.javascript.nodes[nodeID];
            return Object.getPrototypeOf( node ).id;  // TODO: need a formal way to follow prototype chain from vwf.js; this is peeking inside of vwf-model-javascript
        };

        // -- objectIsComponent --------------------------------------------------------------------

        // Determine if a JavaScript object is a component specification by searching for component
        // specification attributes in the candidate object.

        var objectIsComponent = function( candidate ) {

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

        // -- objectIsTypedArray  ------------------------------------------------------------------

        // Determine if a JavaScript object is a component specification by searching for component
        // specification attributes in the candidate object.

        var objectIsTypedArray = function( candidate ) {

            var typedArrayTypes = [
                Int8Array,
                Uint8Array,
                // Uint8ClampedArray,
                Int16Array,
                Uint16Array,
                Int32Array,
                Uint32Array,
                Float32Array,
                Float64Array,
            ];

            var isTypedArray = false;

            if ( ( typeof candidate == "object" || candidate instanceof Object ) && candidate != null ) {

                typedArrayTypes.forEach( function( typedArrayType ) {
                    isTypedArray = isTypedArray || candidate instanceof typedArrayType;
                } );

            }
            
            return isTypedArray; 
        };

        // -- valueHasAccessors --------------------------------------------------------------------

        // Determine if a property initializer is a detailed initializer containing explicit
        // accessor and value parameters (rather than being a simple value specification) by
        // searching for accessor attributes in the candidate object.

        var valueHasAccessors = function( candidate ) {

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
        };

        // -- valueHasBody -------------------------------------------------------------------------

        // Determine if a method or event initializer is a detailed initializer containing a
        // parameter list along with the body text (method initializers only) by searching for the
        // parameter and body attributes in the candidate object.

        var valueHasBody = function( candidate ) {  // TODO: refactor and share with valueHasAccessors and possibly objectIsComponent  // TODO: unlike a property initializer, we really only care if it's an object vs. text; text == use as body; object == presume o.parameters and o.body  // TODO: except that a script in the unnamed-list format would appear as an object but should be used as the body

            var bodyAttributes = [
                "parameters",
                "body",
            ];

            var hasBody = false;  // TODO: "body" term is confusing, but that's the current terminology used in vwf/model/javascript

            if ( ( typeof candidate == "object" || candidate instanceof Object ) && candidate != null ) {

                bodyAttributes.forEach( function( attributeName ) {
                    hasBody = hasBody || Boolean( candidate[attributeName] );
                } );

            }
            
            return hasBody; 
        };

        // -- valueHasType -------------------------------------------------------------------------

        // Determine if a script initializer is a detailed initializer containing explicit text and
        // type parameters (rather than being a simple text specification) by searching for the
        // attributes in the candidate object.

        var valueHasType = function( candidate ) {  // TODO: refactor and share with valueHasBody, valueHasAccessors and possibly objectIsComponent

            var typeAttributes = [
                "text",
                "type",
            ];

            var hasType = false;

            if ( ( typeof candidate == "object" || candidate instanceof Object ) && candidate != null ) {

                typeAttributes.forEach( function( attributeName ) {
                    hasType = hasType || Boolean( candidate[attributeName] );
                } );

            }
            
            return hasType; 
        };

        // -- normalizedComponent ------------------------------------------------------------------

        var normalizedComponent = function( /* component */ ) {

            var component = arguments[0]; // component is sometimes not writable when it is an argument?

            // Decode if JSON.

            if ( typeof component == "string" || component instanceof String ) {
                try { component = JSON.parse( component ) } catch ( e ) { }
            }

            // Convert a component URI to an instance of that type. Convert an asset reference to
            // an untyped reference to that asset.

            if ( typeof component == "string" || component instanceof String ) { // TODO: validate URI
                component = component.match( /(^@)|(\.vwf$)/ ) ?
                    { "extends": component } : { source: component };  // TODO: detect component from mime-type instead of extension?
            }

            // Fill in the mime type from the source specification if not provided.

            if ( component.source && ! component.type ) { // TODO: validate component

                var match = component.source.match( /\.([^.]*)$/ ); // TODO: get type from mime-type (from server if remote, from os if local, or (?) from this internal table otherwise)

                if ( match ) {

                    switch ( match[1] ) {
                        case "unity3d":
                            component.type = "application/vnd.unity";
                            break;
                        case "dae":
                            component.type = "model/vnd.collada+xml";
                            break;
                    }

                }

            }

            // Fill in the component type from the mime type if not provided.

            if ( component.type && ! component.extends ) { // TODO: load from a server configuration file

                switch ( component.type ) {
                    case "application/vnd.unity":
                        component.extends = "http://vwf.example.com/scene.vwf";
                        break;
                    case "model/vnd.collada+xml":
                        component.extends = "http://vwf.example.com/navscene.vwf";
                        break;
                }

            }

            return component;
        };

        // -- loggableComponent --------------------------------------------------------------------

        // Return a copy of a component with the verbose bits truncated so that it may be written to
        // a log.

        var loggableComponent = function( component ) {

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
        };

        // -- remappedURI --------------------------------------------------------------------------

        // Remap a component URI to its location in a local cache.

        // http://vwf.example.com/component.vwf => http://localhost/proxy/vwf.example.com/component.vwf

        var remappedURI = function( uri ) {

            var match = uri.match( RegExp( "http://(vwf.example.com)/(.*)" ) );

            if ( match ) {
                uri = window.location.protocol + "//" + window.location.host +
                    "/proxy/" + match[1] + "/" + match[2];
            }

            return uri;

        };

        // -- getQueryString -----------------------------------------------------------------------

        // Retrieve parameters from the page's query string.

        // From http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/2880929#2880929
        // and http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/3867610#3867610.

        var getQueryString = function( name ) {

            function parseParams() {
                var params = {},
                    e,
                    a = /\+/g, // regex for replacing addition symbol with a space
                    r = /([^&;=]+)=?([^&;]*)/g,
                    d = function( s ) { return decodeURIComponent( s.replace(a, " ") ); },
                    q = window.location.search.substring(1);

                while ( e = r.exec(q) )
                    params[ d(e[1]) ] = d(e[2]);

                return params;
            }

            if ( ! queryStringParams )
                queryStringParams = parseParams();

            return queryStringParams[name];
        };

    };

} ) ( window );
