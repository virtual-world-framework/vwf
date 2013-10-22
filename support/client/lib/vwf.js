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
		this.lastTick = 0;
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

        var components = this.private.components = {}; // maps component node ID => component specification

        // The proto-prototype of all nodes is "node", identified by this URI. This type is
        // intrinsic to the system and nothing is loaded from the URI.

        var nodeTypeURI = "http://vwf.example.com/node.vwf";

        // The "node" component descriptor.

        var nodeTypeDescriptor = { extends: null };  // TODO: detect nodeTypeDescriptor in createChild() a different way and remove this explicit null prototype

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

        // When saving and loading the application, we need to read and write node state without
        // coloring from any scripts. When isolateProperties is non-zero, property readers and
        // writers suppress kernel reentry to prevent drivers from modifying state while the
        // properties are accessed.

        var isolateProperties = 0;

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

            try { application = JSON.parse( application ) } catch ( e ) { }  // TODO: conflict between (some relative) uris and json?  // TODO: move to index.html; don't reach out to the window from the kernel

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

            this.models.kernel = require( "vwf/kernel/model" ).create( vwf );

            // Create and attach each configured model.

            modelInitializers.forEach( function( modelInitializer ) {

                // Accept either { "vwf/model/name": [ arguments] } or "vwf/model/name".

                if ( typeof modelInitializer == "object" && modelInitializer != null ) {
                    var modelName = Object.keys( modelInitializer )[0];
                    var modelArguments = modelInitializer[modelName];
                } else {
                    var modelName = modelInitializer;
                    var modelArguments = undefined;
                }

                var model = require( modelName ).create(
                    this.models.kernel,                         // model's kernel access
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

            this.views.kernel = require( "vwf/kernel/view" ).create( vwf );

            // Create and attach each configured view.

            viewInitializers.forEach( function( viewInitializer ) {
			
                // Accept either { "vwf/view/name": [ arguments] } or "vwf/view/name".

                if ( typeof viewInitializer == "object" && viewInitializer != null ) {
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
                        this.views.kernel,                          // view's kernel access
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
		this.generateTick = function()
		{
			
			 var fields = {
                time: queue.time + .05,
                action: "tick"
                // callback: callback,  // TODO: provisionally add fields to queue (or a holding queue) then execute callback when received back from reflector
            };
			this.queue( fields );
			this.dispatch( fields.time );
		}
		this.goOffline = function()
		{
			socket.removeListener( "disconnect", vwf.disconnected);
			socket.disconnect();
			socket = null;
			window.setInterval(this.generateTick.bind(this),50);
		};		
        this.ready = function( component_uri_or_json_or_object ) {

            // Connect to the reflector. This implementation uses the socket.io library, which
            // communicates using a channel back to the server that provided the client documents.

            try {

				var space = window.location.pathname.slice( 1,
                        window.location.pathname.lastIndexOf("/") );
				socket = io.connect("ws://"+window.location.host);
				
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
					console.log("vwf.socket connected");
                    vwf.moniker_ = this.json.namespace.socket.sessionid;

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
					
						message = messageCompress.unpack(message);
						
						var fields = message;
						if(typeof message == "string")
							fields = JSON.parse( message );

                        fields.time = Number( fields.time );
                        // TODO: other message validation (check node id, others?)

                        // Add the message to the queue.

                        // if ( fields.action ) {  // TODO: don't put ticks on the queue but just use them to fast-forward to the current time (requires removing support for passing ticks to the drivers and nodes)
                            vwf.queue( fields );
                        // }

                        // Each message from the server allows us to move time forward. Parse the
                        // timestamp from the message and call dispatch() to execute all queued
                        // actions through that time, including the message just received.
                    
                        // The simulation may perform immediate actions at the current time or it
                        // may post actions to the queue to be performed in the future. But we only
                        // move time forward for items arriving in the queue from the reflector.
						
                        vwf.dispatch( fields.time );

                    } catch ( e ) {

                        vwf.logger.warn( fields.action, fields.node, fields.member, fields.parameters,
                            "exception performing action:", require( "vwf/utility" ).exceptionMessage( e ) );

                    }

                } );

                socket.on( "disconnect", vwf.disconnected);

                socket.on( "error", function(e) { 
					
					console.log("Socket IO error");
                    //Overcome by compatibility.js websockets check
                    //jQuery('body').html("<div class='vwf-err'>WebSockets connections are currently being blocked. Please check your proxy server settings.</div>"); 

                } );

                // Start communication with the reflector. 

                //socket.connect();  // TODO: errors can occur here too, particularly if a local client contains the socket.io files but there is no server; do the loopback here instead of earlier in response to new io.Socket.

            } else if ( component_uri_or_json_or_object ) {

                // Load the application. The application is rooted in a single node constructed here
                // as an instance of the component passed to initialize(). That component, its
                // prototype(s), and its children, and their prototypes and children, flesh out the
                // entire application.

                // TODO: add note that this is only for a self-determined application; with socket, wait for reflection server to tell us.
                // TODO: maybe depends on component_uri_or_json_or_object too; when to override and not connect to reflection server?

                this.createNode( component_uri_or_json_or_object );

            } else {  // TODO: also do this if component_uri_or_json_or_object was invalid and createNode() failed

                // TODO: show a selection dialog

            }

        };

        this.disconnected = function()
        {   
            
            vwf.logger.info( "vwf.socket disconnected" );
            vwf.dispatchEvent('index-vwf','disconnected',[]);
        }
        // -- queue --------------------------------------------------------------------------------

        this.queue = function( fields ) {

            if ( ! ( fields instanceof Array ) ) {

                // Add a single message.

                fields.sequence = ++queue.sequence; // to stabilize the sort
                queue.push( fields );
		

            } else {

                // Add an array of messages.

                var messages = fields;

                messages.forEach( function( fields ) {
                    fields.sequence = ++queue.sequence; // to stabilize the sort
                    queue.push( fields );
                } );

            }

            // Sort by time, then by sequence.  // TODO: use a better-performing priority queue

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
				vwf.dispatch( fields.time );
    
            } else {
                
                // Send the message.

                var message = JSON.stringify( fields );
				message = messageCompress.pack(message);
                socket.send( message );

            }

        };

        // -- respond ------------------------------------------------------------------------------

        // Return a result for a function invoked by the server.

        this.respond = function( nodeID, actionName, memberName, parameters, result ) {

            // Attach the current simulation time and pack the message as an array of the arguments.

            var fields = {
                // sequence: undefined,  // TODO: use to identify on return from reflector?
                time: this.now,
                node: nodeID,
                action: actionName,
                member: memberName,
                parameters: parameters,
                result: result,
            };

            if ( ! socket ) {

                // Nothing to do in single-user mode.

            } else {

                // Send the message.

                var message = JSON.stringify( fields );
                socket.send( message );

            }

        };

        // -- receive ------------------------------------------------------------------------------

        // Handle receipt of a message. Unpack the arguments and call the appropriate handler.

        this.receive = function( nodeID, actionName, memberName, parameters, respond, callback /* ( ready ) */ ) {
		
// TODO: delegate parsing and validation to each action.

            // Look up the action handler and invoke it with the remaining parameters.

            // Note that the message should be validated before looking up and invoking an arbitrary
            // handler.

            var args = [];

            if ( nodeID || nodeID === 0 ) args.push( nodeID );
            if ( memberName ) args.push( memberName );
            if ( parameters ) args = args.concat( parameters ); // flatten

            // Insert the ready callback for potentially-asynchronous actions.

            switch ( actionName ) {

                case "createNode": // nodeComponent, create_callback /* ( nodeID ) */

                    callback( false ); // suspend the queue

                    args[1] = function( nodeID ) {
                        callback( true ); // resume the queue when the action completes
                    };

                    break;

                case "setState": // applicationState, set_callback /* () */

                    callback( false ); // suspend the queue

                    args[1] = function() {
                        callback( true ); // resume the queue when the action completes
                    };

                    break;

            }
			//return;
            // Invoke the action.

            var result = this[actionName] && this[actionName].apply( this, args );

            // Return the result.

            respond && this.respond( nodeID, actionName, memberName, parameters,
                require( "vwf/utility" ).transform( result, transitTransformation ) );

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

            while ( queue.ready && queue.length > 0 && queue[0].time <= queue.time  ) {

                var fields = queue.shift();
				this.message = fields;
				 if(fields.action == 'getState' && this.creatingNodeCount!=0)
				 {
					 fields.time += .05;
					 queue.push(fields);
					 continue;
				 }
                // Advance the time.

                if ( this.now != fields.time ) {
                    this.now = fields.time;
					
                    var time = (this.now - this.lastTick);
					if(time < 1)
					{
						
						while(time > .045)
						{	
							
							var now = performance.now();
							var realTickDif = now - this.lastRealTick;
							this.lastRealTick = now;
							
							this.tick();
						
							time -= .05;
							
						}
						//save the leftovers
						this.lastTick = this.now  - time;
						
					}else
					{
						//giving up, cant go fast enough
						this.lastTick = fields.time;
					}
					
                }

                // Record the originating client.
				
                this.client_ = fields.client;

                // Perform the action.
				if(fields.action != 'tick')
                this.receive( fields.node, fields.action, fields.member, fields.parameters, fields.respond, function( ready ) {
                    if ( Boolean( ready ) != Boolean( queue.ready ) ) {
                        vwf.logger.info( "vwf.dispatch:", ready ? "resuming" : "pausing", "queue at time", queue.time, "for", fields.action );
                        queue.ready = ready;
                        queue.ready && vwf.dispatch( queue.time );
                    }
                } );
				this.client_ = null;;

            }

            // Set the simulation time to the new current time. Tick if the time advances.

            if ( queue.ready && this.now != queue.time ) {
                //this.now = queue.time;
                //this.tick();
            }
            
        };

        // -- log ----------------------------------------------------------------------------------

        // Send a log message to the reflector.

        this.log = function() {

            this.respond( undefined, "log", undefined, undefined,
                require( "vwf/utility" ).transform( arguments, transitTransformation ) );

        }

        // -- tick ---------------------------------------------------------------------------------

        // Tick each tickable model, view, and node. Ticks are sent on each time change.

        // TODO: remove, in favor of drivers and nodes exclusively using future scheduling;
        // TODO: otherwise, all clients must receive exactly the same ticks at the same times.

        this.tick = function() {
			
		// Call ticking() on each model.

		
		for(var i =0; i < this.models.length; i ++)
		{	
		  this.models[i].ticking && this.models[i].ticking( this.now );
		}	
		   

		 // Call tick() on each tickable node.
		
		for(var i =0; i < this.tickable.nodeIDs.length; i ++)
		{	
		  this.callMethod( this.tickable.nodeIDs[i], "tick", [ this.now ] );
		}
		
		for(var i =0; i < this.views.length; i ++)
		{	
		  this.views[i].ticked && this.views[i].ticked( this.now );
		}

        };

        // -- setState -----------------------------------------------------------------------------

        this.setState = function( applicationState, set_callback /* () */ ) {

			
            this.logger.group( "vwf.setState" );  // TODO: loggableState

            // Direct property accessors to suppress kernel reentry so that we can write the state
            // without coloring from scripts.

            isolateProperties++;

            async.series( [

                function( series_callback /* ( err, results ) */ ) {

                    async.forEach( applicationState.nodes || [], function( nodeComponent, each_callback /* ( err ) */ ) {

                        vwf.createNode( nodeComponent, function( nodeID ) {
                            each_callback( undefined );
                        } );

                    }, function( err ) {
                        series_callback( err, undefined );
                    } );

                },

                function( series_callback /* ( err, results ) */ ) {

                    // Clear the queue, but leave any private direct messages in place. Update the queue
                    // array in place so that existing references remain valid.

                    var private_queue = [], fields;
					
                    while ( queue.length > 0 ) {

                        fields = queue.shift();
			
                        vwf.logger.info( "setState:", "removing", require( "vwf/utility" ).transform( fields, function( object, index, depth ) {
                            return depth == 2 && object ? Array.prototype.slice.call( object ) : object
                        } ), "from queue" );
						
			//so, we now backdate the setstate so that create messges are not discarded, and now we need to
			//actually process messages  that are currently on the queue, but happen in the future after the setstate;
                       fields.respond &&  private_queue.push( fields );
					   if(fields.time >= vwf.message.time)
						   private_queue.push( fields );
                    }

                    while ( private_queue.length > 0 ) {

                        fields = private_queue.shift();

                        vwf.logger.info( "setState:", "returning", require( "vwf/utility" ).transform( fields, function( object, index, depth ) {
                            return depth == 2 && object ? Array.prototype.slice.call( object ) : object
                        } ), "to queue" );

                        queue.push( fields );

                    }

                    // Add the incoming items to the queue.

                    if ( applicationState.queue ) {
                        vwf.queue( applicationState.queue );
                    }

                    series_callback( undefined, undefined );
                },

            ], function( err, results ) {

                // Restore kernel reentry from property accessors.

                isolateProperties--;
				
                set_callback && set_callback();
				
				
            } );

            this.logger.groupEnd();
			
        };

        // -- getState -----------------------------------------------------------------------------
	this.creatingNodeCount = 0;
	this.creatingNodeDefs = {};
        this.getState = function( full, normalize ) {
			
			
				
			if(full === undefined)
				full = true;
            this.logger.group( "vwf.getState", full, normalize );

            // Direct property accessors to suppress kernel reentry so that we can read the state
            // without coloring from scripts.

            isolateProperties++;

            // Get the application nodes and queue.

            var applicationState = {

                nodes: [  // TODO: all global objects
                    require( "vwf/utility" ).transform( this.getNode( "index-vwf", full ), transitTransformation ),
                ],

                queue: 
                    require( "vwf/utility" ).transform( queue, queueTransitTransformation ),

            };

            // Normalize for consistency.

            if ( normalize ) {

                applicationState.nodes.forEach( function( node, index ) {
                    applicationState.nodes[index] =
                        require( "vwf/utility" ).transform( applicationState.nodes[index], hashTransformation );
                } );

                applicationState.queue =
                    require( "vwf/utility" ).transform( applicationState.queue, hashTransformation );

            }
    
            // Restore kernel reentry from property accessors.

            isolateProperties--;

            this.logger.groupEnd();

	    if(this.creatingNodeCount)
	    {
		
		for(var i in this.creatingNodeDefs)
		{
			var index = applicationState.nodes[0];
			var parent = this.findNodeInState(index,this.creatingNodeDefs[i].parent);
			var found = this.findNodeInState(parent,this.creatingNodeDefs[i].id);
			if(!found)
				parent.children[this.creatingNodeDefs[i].name] = this.creatingNodeDefs[i];
		}
		
	    }
            return applicationState;
        };
	this.findNodeInState=function(parent,target)
	{
		if(parent.id == target) return parent;
		if(parent.children)
		for(var i in parent.children)
		{
			var found = null;
			found = this.findNodeInState(parent.children[i],target);
			if(found) return found;
		}
		return null;
	}
        // -- hashState ----------------------------------------------------------------------------

        this.hashState = function() {

            this.logger.group( "vwf.hashState" );

            var applicationState = this.getState( true, true );

            // Hash the nodes.

            var hashn = this.hashNode( applicationState.nodes[0] );  // TODO: all global objects

            // Hash the queue.

            var hashq = applicationState.queue.length ?
                "q" + Crypto.MD5( JSON.stringify( applicationState.queue ) ).toString().substring( 0, 16 ) : undefined;

            this.logger.groupEnd();

            // Generate the combined hash.

            return hashn + ( hashq ? ":" + hashq : "" );
        }

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

        this.createNode = function( nodeComponent, create_callback /* ( nodeID ) */ ) {
			
	   
	    if(nodeComponent.id == "index-vwf")
		{
			$(document).trigger('setstatebegin');
		}
	    
	    
            this.logger.group( "vwf.createNode " + (
                typeof nodeComponent == "string" || nodeComponent instanceof String ?
                    nodeComponent : JSON.stringify( loggableComponent( nodeComponent ) )
            ) );

            var nodePatch;

            if ( componentIsDescriptor( nodeComponent ) && nodeComponent.patches ) {
                nodePatch = nodeComponent;
                nodeComponent = nodeComponent.patches;
            }

            // nodeComponent may be a URI, a descriptor, or an ID, and while being created will
            // transform from a URI to a descriptor to an ID (depending on its starting state).
            // nodeURI, nodeDescriptor, and nodeID capture the applicable intermediate states.

            var nodeURI, nodeDescriptor, nodeID;

            async.series( [

                // If nodeComponent is a URI, load the descriptor.

                function( series_callback /* ( err, results ) */ ) { // nodeComponent is a URI, a descriptor, or an ID

                    if ( componentIsURI( nodeComponent ) ) { // URI  // TODO: allow non-vwf URIs (models, images, etc.) to pass through to stage 2 and pass directly to createChild()

                        nodeURI = nodeComponent;

                        // Load the document if we haven't seen this URI yet. Mark the components
                        // list to indicate that this component is loading.

                        if ( ! components[nodeURI] ) { // uri is not loading (Array) or loaded (id)

                            components[nodeURI] = []; // [] => array of callbacks while loading => true

                            loadComponent( nodeURI, function( nodeDescriptor ) {
                                nodeComponent = nodeDescriptor;
                                series_callback( undefined, undefined );
                            } );

                        // If we've seen this URI, but it is still loading, just add our callback to
                        // the list. The original load's completion will call our callback too.

                        } else if ( components[nodeURI] instanceof Array ) { // loading
                            create_callback && components[nodeURI].push( create_callback );

                        // If this URI has already loaded, skip to the end and call the callback
                        // with the ID.

                        } else { // loaded
                            create_callback && create_callback( components[nodeURI] );
                        }

                    } else { // descriptor, ID or error
                        series_callback( undefined, undefined );
                    }

                },

                // If nodeComponent is a descriptor, construct and get the ID.

                function( series_callback /* ( err, results ) */ ) { // nodeComponent is a descriptor or an ID

                    if ( componentIsDescriptor( nodeComponent ) ) { // descriptor  // TODO: allow non-vwf URIs (models, images, etc.) to pass through to stage 2 and pass directly to createChild()

                        nodeDescriptor = nodeComponent;

                        if ( nodeURI ) {
                            nodeDescriptor.uri = nodeURI;  // TODO: pass this as an (optional) parameter to createChild() so that we don't have to modify the descriptor?
                        }

                        // Create the node as an unnamed child global object.

                        vwf.createChild( 0, undefined, nodeDescriptor, function( nodeID ) {
                            nodeComponent = nodeID;
                            series_callback( undefined, undefined );
                        } );
                        
                    } else { // ID or error
                        series_callback( undefined, undefined );
                    }

                },

                // nodeComponent is the ID.

                function( series_callback /* ( err, results ) */ ) { // nodeComponent is an ID

                    if ( componentIsID( nodeComponent ) ) {  // ID
                        nodeID = nodeComponent;
                        series_callback( undefined, undefined );
                    } else {  // error
                        series_callback( undefined, undefined );  // TODO: error
                    }

                },

                function( series_callback /* ( err, results ) */ ) {

                    if ( nodePatch ) {
                        vwf.setNode( nodeID, nodePatch, function( nodeID ) {
                            series_callback( undefined, undefined );
                        } );
                    } else {
                        series_callback( undefined, undefined );
                    }

                },

            ], function( err, results ) {

                // If this node derived from a URI, save the list of callbacks waiting for
                // completion and update the component list with the ID.

                if ( nodeURI ) {
                    var create_callbacks = components[nodeURI];
                    components[nodeURI] = nodeID;
                }

                // Pass the ID to our callback.

                create_callback && create_callback( nodeID );  // TODO: handle error if invalid id

                // Call the other callbacks.

                if ( nodeURI ) {
                    create_callbacks.forEach( function( create_callback ) {
                        create_callback && create_callback( nodeID );
                    } );
                }

                // Load the UI chrome if available.
				
                if ( nodeURI ) {  // TODO: normalizedComponent() on component["extends"] and use component.extends || component.source?
if ( ! nodeURI.match( RegExp( "^http://vwf.example.com/|appscene.vwf$" ) ) ) {  // TODO: any better way to only attempt to load chrome for the main application and not the prototypes?
                    jQuery("body").append( "<div />" ).children( ":last" ).load( remappedURI( nodeURI ) + ".html", function() {  // TODO: move to index.html; don't reach out to the window from the kernel; connect through a future vwf.initialize callback.
                        // remove 'loading' overlay
                    } );
}
                }
				
				if(nodeComponent == "index-vwf")
				{
					$(document).trigger('setstatecomplete');
					$('#loadstatus').remove(); 
				}

            } );

			
            this.logger.groupEnd();
        };

        // -- deleteNode ---------------------------------------------------------------------------

        this.deleteNode = function( nodeID ) {

            this.logger.group( "vwf.deleteNode " + nodeID );
			try{
				
				var children = this.children(nodeID);
				for(var i =0; i < children.length; i++)
				{
					this.deleteNode(children[i]);
				}
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

				if(this.tickable.nodeIDs.indexOf(nodeID) > -1)
				{	
					this.tickable.nodeIDs.splice(this.tickable.nodeIDs.indexOf(nodeID),1);
				}
			} catch(e)
			{
				console.log(e);
			}
            this.logger.groupEnd();
        };

        // -- setNode ------------------------------------------------------------------------------

        this.setNode = function( nodeID, nodeComponent, set_callback /* ( nodeID ) */ ) {  // TODO: merge with createChild?

            this.logger.group( "vwf.setNode " + JSON.stringify( loggableComponent( nodeComponent ) ) );

            // Direct property accessors to suppress kernel reentry so that we can write the state
            // without coloring from scripts.

            isolateProperties++;

            async.series( [

                function( series_callback /* ( err, results ) */ ) {

                    // Suppress kernel reentry so that we can write the state without coloring from
                    // any scripts.

                    isolateProperties && vwf.models.kernel.disable();

                    // Create the properties, methods, and events. For each item in each set, invoke
                    // createProperty(), createMethod(), or createEvent() to create the field. Each
                    // delegates to the models and views as above.

                    nodeComponent.properties && jQuery.each( nodeComponent.properties, function( propertyName, propertyValue ) {  // TODO: setProperties should be adapted like this to be used here

                        // Is the property specification directing us to create a new property, or
                        // initialize a property already defined on a prototype?

                        // Create a new property if the property is not defined on a prototype.
                        // Otherwise, initialize the property.

                        var creating = ! nodeHasProperty.call( vwf, nodeID, propertyName ); // not defined on prototype

                        // Create or initialize the property.

                        if ( creating ) {
                            vwf.createProperty( nodeID, propertyName, propertyValue );
                        } else {
                            vwf.setProperty( nodeID, propertyName, propertyValue );
                        }  // TODO: delete when propertyValue === null in patch

                    } );

                    // TODO: methods, events

                    // Restore kernel reentry.

                    isolateProperties && vwf.models.kernel.enable();

                    series_callback( undefined, undefined );
                },

                function( series_callback /* ( err, results ) */ ) {

                    // Create and attach the children. For each child, call createNode() with the
                    // child's component specification. createNode() delegates to the models and
                    // views as before.

                    async.forEach( Object.keys( nodeComponent.children || {} ), function( childName, each_callback /* ( err ) */ ) {

                        var creating = ! nodeHasOwnChild.call( vwf, nodeID, childName );

                        if ( creating ) {
                            vwf.createChild( nodeID, childName, nodeComponent.children[childName], function( childID ) {  // TODO: add in original order from nodeComponent.children  // TODO: ensure id matches nodeComponent.children[childName].id
                                each_callback( undefined );
                            } );
                        } else {
                            vwf.setNode( nodeComponent.children[childName].id, nodeComponent.children[childName], function( childID ) {  // TODO: match id from patch with current id
                                each_callback( undefined );
                            } );
                        }  // TODO: delete when nodeComponent.children[childName] === null in patch
    
                    }, function( err ) {
                        series_callback( err, undefined );
                    } );

                },

                function( series_callback /* ( err, results ) */ ) {

                    // Attach the scripts. For each script, load the network resource if the script is
                    // specified as a URI, then once loaded, call execute() to direct any model that
                    // manages scripts of this script's type to evaluate the script where it will
                    // perform any immediate actions and retain any callbacks as appropriate for the
                    // script type.

                    nodeComponent.scripts && nodeComponent.scripts.forEach( function( script ) {
                        if ( valueHasType( script ) ) {
                            script.text && vwf.execute( nodeID, script.text, script.type ); // TODO: external scripts too // TODO: callback
                        } else {
                            script && vwf.execute( nodeID, script, undefined ); // TODO: external scripts too // TODO: callback
                        }
                    } );

                    series_callback( undefined, undefined );
                },

            ], function( err, results ) {

                // Restore kernel reentry from property accessors.

                isolateProperties--;

                set_callback && set_callback( nodeID );

            } );

            this.logger.groupEnd();

            return nodeComponent;
        };

        // -- getNode ------------------------------------------------------------------------------

        this.getNode = function( nodeID, full ) {  // TODO: include/exclude children, prototypes

			if(!nodeID)
				return null;
            this.logger.group( "vwf.getNode " + nodeID + " " + full );

            // Direct property accessors to suppress kernel reentry so that we can read the state
            // without coloring from scripts.

            isolateProperties++;

            var nodeComponent = {};

            var nodeURI = this.models.object.uri( nodeID );

            if ( nodeURI ) {
                nodeComponent.patches = nodeURI;
            }

            var child_full = full;

            if ( full === undefined ) {
                full = ! Boolean( nodeComponent.patches );
            }

            if ( child_full === undefined && nodeComponent.patches ) {
                child_full = false;
            }

            // Intrinsic state.

            nodeComponent.id = nodeID;

            if ( full || this.models.object.changed( nodeID ) ) {

                var prototypeID = this.prototype( nodeID );

                if ( prototypeID !== undefined ) {
                    nodeComponent.extends = this.getNode( prototypeID );
                }

                nodeComponent.implements = this.behaviors( nodeID ).map( function( behaviorID ) {
                    return this.getNode( behaviorID );
                }, this );

                nodeComponent.implements.length || delete nodeComponent.implements;

                this.models.object.name_source_type( nodeID, nodeComponent ); // get name, source, type

                nodeComponent.source === undefined && delete nodeComponent.source;
                nodeComponent.type === undefined && delete nodeComponent.type;

            }

            // Suppress kernel reentry so that we can read the state without coloring from any
            // scripts.

            isolateProperties && vwf.models.kernel.disable();

            // Properties.

            if ( full || this.models.object.changed( nodeID ) ) {  // TODO: properties changed only

                nodeComponent.properties = this.getProperties( nodeID );

                for ( var propertyName in nodeComponent.properties ) {  // TODO: distinguish add, change, remove
                    if ( nodeComponent.properties[propertyName] === undefined ) {
                        delete nodeComponent.properties[propertyName];
                    }
                }

                Object.keys( nodeComponent.properties ).length ||
                    delete nodeComponent.properties;

            }

            // Methods.
			nodeComponent.methods = this.getMethods( nodeID );

                for ( var methodName in nodeComponent.methods ) {  // TODO: distinguish add, change, remove
                    if ( nodeComponent.methods[methodName] === undefined ) {
                        delete nodeComponent.methods[methodName];
                    }
                }

                if ( Object.keys( nodeComponent.methods ).length == 0 ) { 
                    delete nodeComponent.methods;
                } 
			//events
				nodeComponent.events = this.getEvents( nodeID );

                for ( var eventName in nodeComponent.events ) {  // TODO: distinguish add, change, remove
                    if ( nodeComponent.events[eventName] === undefined ) {
                        delete nodeComponent.events[eventName];
                    }
                }

                if ( Object.keys( nodeComponent.events ).length == 0 ) { 
                    delete nodeComponent.events;
                }

            // nodeComponent.methods = {};  // TODO

            // for ( var methodName in nodeComponent.methods ) {
            //     nodeComponent.methods[methodName] === undefined &&
            //         delete nodeComponent.methods[methodName];
            // }

            // Object.keys( nodeComponent.methods ).length ||
            //     delete nodeComponent.methods;

            // Events.

            // nodeComponent.events = {};  // TODO

            // for ( var eventName in nodeComponent.events ) {
            //     nodeComponent.events[eventName] === undefined &&
            //         delete nodeComponent.events[eventName];
            // }

            // Object.keys( nodeComponent.events ).length ||
            //     delete nodeComponent.events;

            // Restore kernel reentry.

            isolateProperties && vwf.models.kernel.enable();

            // Children.

            nodeComponent.children = {};

            this.children( nodeID ).forEach( function( childID ) {
                nodeComponent.children[ this.name( childID ) ] = this.getNode( childID, child_full );  // TODO: full = propagated for existing, full = undefined for new
            }, this );

            for ( var childName in nodeComponent.children ) {  // TODO: distinguish add, change, remove
                if ( nodeComponent.children[childName] === undefined ) { // ... delete if not changed
                    delete nodeComponent.children[childName];
                }
            }

            Object.keys( nodeComponent.children ).length ||
                delete nodeComponent.children;

            // Scripts.

            // TODO: scripts

            // Restore kernel reentry from property accessors.

            isolateProperties--;

            this.logger.groupEnd();

            if ( full || nodeComponent.properties || nodeComponent.methods || nodeComponent.events ||
                    nodeComponent.children || nodeComponent.scripts ) {
                return nodeComponent;
            } else if ( nodeComponent.patches ) {
                return nodeComponent.patches;
            } else {
                return undefined;
            }

        };

        // -- hashNode -----------------------------------------------------------------------------

        this.hashNode = function( nodeID ) {  // TODO: works with patches?  // TODO: only for nodes from getNode( , , true )

            this.logger.group( "vwf.hashNode", typeof nodeID == "object" ? nodeID.id : nodeID );

            var nodeComponent = typeof nodeID == "object" ? nodeID : this.getNode( nodeID );

            // Hash the intrinsic state.

            var internal = { id: nodeComponent.id, name: nodeComponent.name, source: nodeComponent.source, type: nodeComponent.type };  // TODO: get subset same way as getNode() puts them in without calling out specific field names

            internal.source === undefined && delete internal.source;
            internal.type === undefined && delete internal.type;

            var hashi = "i" + Crypto.MD5( JSON.stringify( internal ) ).toString().substring( 0, 16 );

            // Hash the properties.

            var properties = nodeComponent.properties || {};

            var hashp = Object.keys( properties ).length ?
                "p" + Crypto.MD5( JSON.stringify( properties ) ).toString().substring( 0, 16 ) : undefined;

            // Hash the children.

            var children = nodeComponent.children || {};

            var hashc = Object.keys( children ).length ?
                "c" + Crypto.MD5( JSON.stringify( children ) ).toString().substring( 0, 16 ) : undefined;

            this.logger.groupEnd();

            // Generate the combined hash.

            return hashi + ( hashp ? "." + hashp : "" ) + ( hashc ? "/" + hashc : "" );
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

        // -- createChild --------------------------------------------------------------------------

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

        this.createChild = function( nodeID, childName, childComponent, create_callback /* ( childID ) */ ) {

		this.creatingNodeCount++;
		
	console.log(	 "vwf.createChild " + nodeID + " " + childName + " ",childComponent);
            this.logger.group( "vwf.createChild " + nodeID + " " + childName + " " + (
                typeof childComponent == "string" || childComponent instanceof String ?
                    childComponent : JSON.stringify( loggableComponent( childComponent ) )
            ) );

            childComponent = normalizedComponent( childComponent );

            // Allocate an ID for the node. We just use an incrementing counter.  // TODO: must be unique and consistent regardless of load order; this is a gross hack.

            var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] || nodeTypeURI ) + "." + childName; childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); // stick to HTML id-safe characters  // TODO: hash uri => childID to shorten for faster lookups?  // TODO: canonicalize uri
			
	    
	    this.creatingNodeDefs[childID] = JSON.parse(JSON.stringify(childComponent));
	    this.creatingNodeDefs[childID].parent = nodeID;
	    this.creatingNodeDefs[childID].name = childName;
	    
	    var nodeExists = null;
	    try{
	    nodeExist = this.getNode(childID);
	    
	    }catch(e){}
	    
	    if(nodeExists)
	    {
		create_callback();
		return;
	    }
				
            var childPrototypeID = undefined, childBehaviorIDs = [], deferredInitializations = {};

            async.series( [

                function( series_callback /* ( err, results ) */ ) {

                    // Create the prototype and behavior nodes (or locate previously created
                    // instances).

                    async.parallel( [

                        function( parallel_callback /* ( err, results ) */ ) {

                            // Create or find the prototype and save the ID in childPrototypeID.

                            if ( childComponent["extends"] !== null ) {  // TODO: any way to prevent node loading node as a prototype without having an explicit null prototype attribute in node?
                                vwf.createNode( childComponent["extends"] || nodeTypeURI, function( prototypeID ) {
                                    childPrototypeID = prototypeID;
// TODO: the GLGE driver doesn't handle source/type or properties in prototypes properly; as a work-around pull those up into the component when not already defined
if ( ! childComponent.source ) {
    var prototype_name_source_type = vwf.models.object.name_source_type( prototypeID );
    if ( prototype_name_source_type.source ) {
        var prototype_uri = vwf.models.object.uri( prototypeID );
        var prototype_properties = vwf.getProperties( prototypeID );
        childComponent.source = require( "vwf/utility" ).resolveURI( prototype_name_source_type.source, prototype_uri );
        childComponent.type = prototype_name_source_type.type;
        childComponent.properties = childComponent.properties || {};
        Object.keys( prototype_properties ).forEach( function( prototype_property_name ) {
            if ( childComponent.properties[prototype_property_name] === undefined && prototype_property_name != "transform" ) {
                childComponent.properties[prototype_property_name] = prototype_properties[prototype_property_name];
            }
        } );
    }
}
                                    parallel_callback( undefined, undefined );
                                } );
                            } else {
                                childPrototypeID = undefined;
                                parallel_callback( undefined, undefined );
                            }

                        },

                        function( parallel_callback /* ( err, results ) */ ) {

                            // Create or find the behaviors and save the IDs in childBehaviorIDs.

                            async.map( childComponent["implements"] || [], function( behaviorComponent, map_callback /* ( err, result ) */ ) {
                                vwf.createNode( behaviorComponent, function( behaviorID ) {
                                    map_callback( undefined, behaviorID );
                                } );
                            }, function( err, behaviorIDs ) {
                                childBehaviorIDs = behaviorIDs;
                                parallel_callback( err, undefined );
                            } );

                        },

                    ], function( err, results ) {
                        series_callback( err, undefined );
                    } );

                },

                function( series_callback /* ( err, results ) */ ) {

                    // Call creatingNode() on each model. The node is considered to be constructed after
                    // each model has run.

                    async.forEachSeries( vwf.models, function( model, each_callback /* ( err ) */ ) {

                        var driver_ready = true;

                        model && model.creatingNode && model.creatingNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                                childComponent.source, childComponent.type, childComponent.uri, childName, function( ready ) {

									
                            if ( Boolean( ready ) != Boolean( driver_ready ) ) {
                                console.log( "vwf.construct: creatingNode", ready ? "resuming" : "pausing", "at", childID, "for", childComponent.source );
                                driver_ready = ready;
                                driver_ready && each_callback( undefined );
                            }

                        } );

                        driver_ready && each_callback( undefined );

                    }, function( err ) {
                        series_callback( err, undefined );
                    } );

                },

                function( series_callback /* ( err, results ) */ ) {

                    // Call createdNode() on each view. The view is being notified of a node that has
                    // been constructed.

                    async.forEach( vwf.views, function( view, each_callback /* ( err ) */ ) {

                        var driver_ready = true;

                        view.createdNode && view.createdNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                                childComponent.source, childComponent.type, childComponent.uri, childName, function( ready ) {

                            if ( Boolean( ready ) != Boolean( driver_ready ) ) {
                                vwf.logger.debug( "vwf.construct: createdNode", ready ? "resuming" : "pausing", "at", childID, "for", childComponent.source );
                                driver_ready = ready;
                                driver_ready && each_callback( undefined );
                            }

                        } );

                        driver_ready && each_callback( undefined );

                    }, function( err ) {
                        series_callback( err, undefined );
                    } );

                },

                function( series_callback /* ( err, results ) */ ) {

                    // Suppress kernel reentry so that we can read the state without coloring from
                    // any scripts.

                    isolateProperties && vwf.models.kernel.disable();

                    // Create the properties, methods, and events. For each item in each set, invoke
                    // createProperty(), createMethod(), or createEvent() to create the field. Each
                    // delegates to the models and views as above.

                    childComponent.properties && jQuery.each( childComponent.properties, function( propertyName, propertyValue ) {

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
                            ! nodeHasProperty.call( vwf, childID, propertyName ); // not defined on prototype

                        // Are we assigning the value here, or deferring assignment until the node
                        // is constructed because setters will run?

                        var assigning = value === undefined || // no value, or
                            set === undefined && ( creating || ! nodePropertyHasSetter.call( vwf, childID, propertyName ) ); // no setter

                        if ( ! assigning ) {
                            deferredInitializations[propertyName] = value;
                            value = undefined;
                        }

                        // Create or initialize the property.

                        if ( creating ) {
                            vwf.createProperty( childID, propertyName, value, get, set );
                        } else {
                            vwf.setProperty( childID, propertyName, value );
                        }

                    } );

                    childComponent.methods && jQuery.each( childComponent.methods, function( methodName, methodValue ) {

                        if ( valueHasBody( methodValue ) ) {
                            vwf.createMethod( childID, methodName, methodValue.parameters, methodValue.body );
                        } else {
                            vwf.createMethod( childID, methodName, undefined, methodValue );
                        }

                    } );

                    childComponent.events && jQuery.each( childComponent.events, function( eventName, eventValue ) {

                        if ( valueHasBody( eventValue ) ) {
                            vwf.createEvent( childID, eventName, eventValue.parameters ,eventValue.body );
                        } else {
                            vwf.createEvent( childID, eventName, undefined );
                        }

                    } );

                    // Restore kernel reentry.

                    isolateProperties && vwf.models.kernel.enable();

                    series_callback( undefined, undefined );
                },

                function( series_callback /* ( err, results ) */ ) {

                    // Create and attach the children. For each child, call createNode() with the
                    // child's component specification, then once loaded, call addChild() to attach the
                    // new node as a child. addChild() delegates to the models and views as before.

                    async.forEach( Object.keys( childComponent.children || {} ), function( childName, each_callback /* ( err ) */ ) {
                        var childValue = childComponent.children[childName];

                        vwf.createChild( childID, childName, childValue, function( childID ) {  // TODO: add in original order from childComponent.children
                            each_callback( undefined );
                        } );

                    }, function( err ) {
                        series_callback( err, undefined );
                    } );

                },

                function( series_callback /* ( err, results ) */ ) {

                    // Attach the scripts. For each script, load the network resource if the script is
                    // specified as a URI, then once loaded, call execute() to direct any model that
                    // manages scripts of this script's type to evaluate the script where it will
                    // perform any immediate actions and retain any callbacks as appropriate for the
                    // script type.

                    childComponent.scripts && childComponent.scripts.forEach( function( script ) {
                        if ( valueHasType( script ) ) {
                            script.text && vwf.execute( childID, script.text, script.type ); // TODO: external scripts too // TODO: callback
                        } else {
                            script && vwf.execute( childID, script, undefined ); // TODO: external scripts too // TODO: callback
                        }
                    } );

                    series_callback( undefined, undefined );
                },

                function( series_callback /* ( err, results ) */ ) {

                    // Perform initializations for properties with setter functions. These are
                    // assigned here so that the setters run on a fully-constructed node.

                    Object.keys( deferredInitializations ).forEach( function( propertyName ) {
                        vwf.setProperty( childID, propertyName, deferredInitializations[propertyName] );
                    } );

// TODO: Adding the node to the tickable list here if it contains a tick() function in JavaScript at initialization time. Replace with better control of ticks on/off and the interval by the node.



                    // Call initializingNode() on each model and initializedNode() on each view to
                    // indicate that the node is fully constructed.

                    vwf.models.forEach( function( model ) {
                        model.initializingNode && model.initializingNode( nodeID, childID );
                    } );

                    vwf.views.forEach( function( view ) {
                        view.initializedNode && view.initializedNode( nodeID, childID );
                    } );

                    series_callback( undefined, undefined );
                },

            ], function( err, results ) {

if ( nodeID != 0 ) // TODO: do this for 0 too (global root)? removes this.creatingNode( 0 ) in vwf/model/javascript and vwf/model/object? what about in getType()?
vwf.addChild( nodeID, childID, childName );  // TODO: addChild is (almost) implicit in createChild( parent-id, child-name, child-component ); remove this

                // The node is complete. Invoke the callback method and pass the new node ID and the
                // ID of its prototype. If this was the root node for the application, the
                // application is now fully initialized.

		vwf.creatingNodeCount--;
		
		delete vwf.creatingNodeDefs[childID];
		
                create_callback && create_callback( childID );
				
				if ( vwf.execute( childID, "Boolean( this.tick )" ) ) {
					if(vwf.tickable.nodeIDs.indexOf(childID) < 0)
						vwf.tickable.nodeIDs.push( childID );
					}
            } );

            this.logger.groupEnd();
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
                    if ( model_properties[propertyName] !== undefined || // copy values from this model
                            intermediate_properties[propertyName] === undefined ) { // as well as any new keys
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
                    if ( model_properties[propertyName] !== undefined || // copy values from this model
                            intermediate_properties[propertyName] === undefined ) { // as well as any new keys
                        intermediate_properties[propertyName] = model_properties[propertyName];
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
		
		this.getMethods = function( nodeID ) {  // TODO: rework as a cover for getProperty(), or remove; passing all properties to each driver is impractical since reentry can't be controlled when multiple gets are in progress.

            this.logger.group( "getMethods", nodeID );

            // Call gettingProperties() on each model.

            var methods = this.models.reduceRight( function( intermediate_methods, model ) {  // TODO: note that we can't go left to right and take the first result since we are getting all of the properties as a batch; verify that this creates the same result as calling getProperty individually on each property and that there are no side effects from getting through a driver after the one that handles the get.

                var model_methods = {};
				
                if ( model.gettingMethods ) {
                    model_methods = model.gettingMethods( nodeID, methods );
                } else if ( model.gettingMethod ) {
                    for ( var methodName in intermediate_methods ) {
                        model_methods[methodName] =
                            model.gettingMethod( nodeID, methodName, intermediate_methods[methodName] );
                        if ( vwf.models.kernel.blocked() ) {
                            model_methods[methodName] = undefined; // ignore result from a blocked getter
                        }
                    }
                }

                for ( var methodName in model_methods ) {
                    if ( model_methods[methodName] !== undefined ) { // copy values from this model
                        intermediate_methods[methodName] = model_methods[methodName];
                    } else if ( intermediate_methods[methodName] === undefined ) { // as well as recording any new keys
                        intermediate_methods[methodName] = undefined;
                    }
                }

                return intermediate_methods;

            }, {} );

            // Call gotProperties() on each view.

            this.views.forEach( function( view ) {

                if ( view.gotMethods ) {
                    view.gotMethods( nodeID, methods );
                } else if ( view.gotMethod ) {
                    for ( var methodName in methods ) {
                        view.gotMethod( nodeID, methodName, methods[methodName] );  // TODO: be sure this is the value actually gotten and not an intermediate value from above
                    }
                }

            } );

            this.logger.groupEnd();

            return methods;
        };

		this.getEvents = function( nodeID ) {  // TODO: rework as a cover for getProperty(), or remove; passing all properties to each driver is impractical since reentry can't be controlled when multiple gets are in progress.

            this.logger.group( "getevents", nodeID );

            // Call gettingProperties() on each model.

            var events = this.models.reduceRight( function( intermediate_events, model ) {  // TODO: note that we can't go left to right and take the first result since we are getting all of the properties as a batch; verify that this creates the same result as calling getProperty individually on each property and that there are no side effects from getting through a driver after the one that handles the get.

                var model_events = {};
				
                if ( model.gettingEvents ) {
                    model_events = model.gettingEvents( nodeID, events );
                } else if ( model.gettingEvent ) {
                    for ( var eventName in intermediate_events ) {
                        model_events[eventName] =
                            model.gettingEvent( nodeID, eventName, intermediate_events[eventName] );
                        if ( vwf.models.kernel.blocked() ) {
                            model_events[eventName] = undefined; // ignore result from a blocked getter
                        }
                    }
                }

                for ( var eventName in model_events ) {
                    if ( model_events[eventName] !== undefined ) { // copy values from this model
                        intermediate_events[eventName] = model_events[eventName];
                    } else if ( intermediate_events[eventName] === undefined ) { // as well as recording any new keys
                        intermediate_events[eventName] = undefined;
                    }
                }

                return intermediate_events;

            }, {} );

            // Call gotProperties() on each view.

            this.views.forEach( function( view ) {

                if ( view.gotEvents ) {
                    view.gotEvents( nodeID, events );
                } else if ( view.gotEvent ) {
                    for ( var eventName in events ) {
                        view.gotEvent( nodeID, eventName, events[eventName] );  // TODO: be sure this is the value actually gotten and not an intermediate value from above
                    }
                }

            } );

            this.logger.groupEnd();

            return events;
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

          
		   for(var index = 0; index < this.models.length; index++)
			{
                // Skip models up through the one making the most recent call here (if any).
				var model = this.models[index];
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

                    if( ! initializing && value !== undefined)  // TODO: this stops after p: { set: "this.p = value" } or p: { set: "return value" }, but should it also stop on p: { set: "this.q = value" }?
						break;
                }

            } 

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

                
				for(var i=0; i < this.views.length; i++)
				{
                    if ( initializing ) {
                        this.views[i].initializedProperty && this.views[i].initializedProperty( nodeID, propertyName, propertyValue );  // TODO: be sure this is the value actually set, not the incoming value
                    } else {
                        this.views[i].satProperty && this.views[i].satProperty( nodeID, propertyName, propertyValue );  // TODO: be sure this is the value actually set, not the incoming value
                    }
                } 

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

	    for(var index = 0; index < this.models.length; index++)
	    {
		var model = this.models[index];
	    

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

                    if( value !== undefined)
			break;
                }

            } ;

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
                    if (prototypeID&& prototypeID != nodeTypeURI.replace( /[^0-9A-Za-z_]+/g, "-" ) ) {
                        propertyValue = this.getProperty( prototypeID, propertyName );
                    }
                }

                // Call gotProperty() on each view.

		for(var i = 0; i < this.views.length; i++)
		{
			this.views[i].gotProperty && this.views[i].gotProperty( nodeID, propertyName, propertyValue );  // TODO: be sure this is the value actually gotten and not an intermediate value from above
		}

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
		
			if(methodName == 'tick')
			{
				
				if(vwf.tickable.nodeIDs.indexOf(nodeID) < 0)
					vwf.tickable.nodeIDs.push(nodeID)
			}
        };
		
		this.deleteMethod = function( nodeID, methodName) {

			
            this.logger.group( "deleteMethod", nodeID, methodName );

            // Call creatingMethod() on each model. The method is considered created after each
            // model has run.

            this.models.forEach( function( model ) {
                model.deletingMethod && model.deletingMethod( nodeID, methodName);
            } );

            // Call createdMethod() on each view. The view is being notified that a method has been
            // created.

            this.views.forEach( function( view ) {
                view.deletedMethod && view.deletedMethod( nodeID, methodName );
            } );
		
			//remove from the tickable queue.
			if(methodName == 'tick' && vwf.tickable.nodeIDs.indexOf(nodeID) != -1)
				vwf.tickable.nodeIDs.splice(vwf.tickable.nodeIDs.indexOf(nodeID),1);
            this.logger.groupEnd();
        };
        // -- callMethod ---------------------------------------------------------------------------

        this.callMethod = function( nodeID, methodName, methodParameters ) {

            this.logger.group( "vwf.callMethod " + nodeID + " " + methodName + " " + methodParameters );

            // Call callingMethod() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var methodValue = undefined;

	    
	    for(var i =0; i < this.models.length; i ++)
	    {	
		  var value = this.models[i].callingMethod && this.models[i].callingMethod( nodeID, methodName, methodParameters );
		  methodValue = value !== undefined ? value : methodValue;
	    }	
	    
           

            // Call calledMethod() on each view.
	    for(var i =0; i < this.views.length; i ++)
	    {
		this.views[i].calledMethod && this.views[i].calledMethod( nodeID, methodName, methodParameters );
	    }
            

            this.logger.groupEnd();

            return methodValue;
        };

        // -- createEvent --------------------------------------------------------------------------

        this.createEvent = function( nodeID, eventName, eventParameters,eventBody ) {  // TODO: parameters (used? or just for annotation?)  // TODO: allow a handler body here and treat as this.*event* = function() {} (a self-targeted handler); will help with ui event handlers

            this.logger.group( "vwf.createEvent " + nodeID + " " + eventName + " " + eventParameters );

            // Call creatingEvent() on each model. The event is considered created after each model
            // has run.

            this.models.forEach( function( model ) {
                model.creatingEvent && model.creatingEvent( nodeID, eventName, eventParameters,eventBody );
            } );

            // Call createdEvent() on each view. The view is being notified that a event has been
            // created.

            this.views.forEach( function( view ) {
                view.createdEvent && view.createdEvent( nodeID, eventName, eventParameters,eventBody );
            } );

            this.logger.groupEnd();
        };
		this.deleteEvent = function( nodeID, eventName) {  // TODO: parameters (used? or just for annotation?)  // TODO: allow a handler body here and treat as this.*event* = function() {} (a self-targeted handler); will help with ui event handlers

			
            this.logger.group( "deleteEvent", nodeID,eventName);

            // Call creatingEvent() on each model. The event is considered created after each model
            // has run.

            this.models.forEach( function( model ) {
                model.deletingEvent && model.deletingEvent( nodeID, eventName );
            } );

            // Call createdEvent() on each view. The view is being notified that a event has been
            // created.

            this.views.forEach( function( view ) {
                view.deletedEvent && view.deletedEvent( nodeID, eventName );
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

        // -- loadComponent ------------------------------------------------------------------------

        var loadComponent = function( nodeURI, load_callback /* ( nodeDescriptor ) */ ) {

            if ( nodeURI != nodeTypeURI ) {

                jQuery.ajax( {

                    url: remappedURI( nodeURI ),
                    dataType: "jsonp",

                    success: function( nodeDescriptor ) {
                        load_callback( nodeDescriptor );
                    }

                } );

            } else {
                load_callback( nodeTypeDescriptor );
            }

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

        var nodeHasChild = function( nodeID, childName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript
            var node = this.models.javascript.nodes[nodeID];
            return childName in node.children;
        };

        var nodeHasOwnChild = function( nodeID, childName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript
            var node = this.models.javascript.nodes[nodeID];
            return node.children.hasOwnProperty( childName );  // TODO: this is peeking inside of vwf-model-javascript
        };

        var nodePrototypeID = function( nodeID ) { // invoke with the kernel as "this"
            var node = this.models.javascript.nodes[nodeID];
            return Object.getPrototypeOf( node ).id;  // TODO: need a formal way to follow prototype chain from vwf.js; this is peeking inside of vwf-model-javascript
        };

        // Is a component specifier a URI?

        var componentIsURI = function( candidate ) {
            return ( typeof candidate == "string" || candidate instanceof String ) && ! componentIsID( candidate );
        };

        // Is a component specifier a descriptor?

        var componentIsDescriptor = function( candidate ) {
            return typeof candidate == "object" && candidate != null && ! isPrimitive( candidate );
        };

        // Is a component specifier an ID?

        var componentIsID = function( candidate ) {
            return isPrimitive( candidate ) &&
vwf.models.javascript.nodes[candidate];  // TODO: move to vwf/model/object
        };

        // Is a primitive or a boxed primitive.

        var isPrimitive = function( candidate ) {

            switch ( typeof candidate ) {

                case "string":
                case "number":
                case "boolean":
                    return true;

                case "object":
                    return candidate instanceof String || candidate instanceof Number ||
                        candidate instanceof Boolean;

                default:
                    return false;

            }

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

            if ( typeof candidate == "object" && candidate != null ) {

                componentAttributes.forEach( function( attributeName ) {
                    isComponent = isComponent || candidate.hasOwnProperty( attributeName );
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

            if ( typeof candidate == "object" && candidate != null ) {

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

            if ( typeof candidate == "object" && candidate != null ) {

                accessorAttributes.forEach( function( attributeName ) {
                    hasAccessors = hasAccessors || candidate.hasOwnProperty( attributeName );
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

            if ( typeof candidate == "object" && candidate != null ) {

                bodyAttributes.forEach( function( attributeName ) {
                    hasBody = hasBody || candidate.hasOwnProperty( attributeName );
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

            if ( typeof candidate == "object" && candidate != null ) {

                typeAttributes.forEach( function( attributeName ) {
                    hasType = hasType || candidate.hasOwnProperty( attributeName );
                } );

            }
            
            return hasType; 
        };

        // -- normalizedComponent ------------------------------------------------------------------

        var normalizedComponent = function( component ) {

            // Convert a component URI to an instance of that type or an asset reference to an
            // untyped reference to that asset. Convert a component ID to an instance of that
            // prototype.

            if ( componentIsURI( component ) ) {
                component = component.match( /\.vwf$/ ) ?
                    { extends: component } : { source: component };  // TODO: detect component from mime-type instead of extension?
            } else if ( componentIsID( component ) ) {
                component = { extends: component };
            }

            // Fill in the mime type from the source specification if not provided.

            if ( component.source && ! component.type ) {  // TODO: validate component

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

            if ( component.type && ! component.extends ) {  // TODO: load from a server configuration file

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

        // -- transitTransformation ----------------------------------------------------------------

        // vwf/utility/transform() transformation function to convert an object for proper JSON
        // serialization.

        var transitTransformation = function( object ) {

            // Convert typed arrays to regular arrays.

            return objectIsTypedArray( object ) ?
                Array.prototype.slice.call( object ) : object;

        };

        // -- queueTransitTransformation -----------------------------------------------------------

        // vwf/utility/transform() transformation function to convert the message queue for proper
        // JSON serialization.

        // queue: [ { ..., parameters: [ [ arguments ] ], ... }, { ... }, ... ]

        var queueTransitTransformation = function( object, index, depth ) {

            if ( depth == 0 ) {

                // Omit private direct messages to this client.

                return object.filter( function( fields ) {
                    return ! fields.respond && fields.action;  // TODO: fields.action is here to filter out tick messages
                } );

            } else if ( depth == 1 ) {

                // Remove the sequence fields since they're just local annotations (to stabilize the sort).

                var filtered = {};

                Object.keys( object ).filter( function( key ) {
                    return key != "sequence";
                } ).forEach( function( key ) {
                    filtered[key] = object[key];
                } );

                return filtered;

            } else if ( depth == 3 ) {

                // Convert array-like arguments objects to regular arrays.  // TODO: only safe so long as parameters is the only container in queue messages

                return Array.prototype.slice.call( object );

            } else {

                return object;

            }

        };

        // -- hashTransformation -------------------------------------------------------------------

        // vwf/utility/transform() transformation function to normalize an object so that it can be
        // serialized and hashed with consistent results.

        var hashTransformation = function( object ) {

            if ( typeof object == "number" ) {

                // Reduce precision slightly to match what passes through the reflector.

                return Number( object.toPrecision(15) );

            } else if ( typeof object == "object" && object != null && ! ( object instanceof Array ) ) {
                
                // Order objects alphabetically.

                var ordered = {};

                Object.keys( object ).sort().forEach( function( key ) {
                    ordered[key] = object[key];
                } );

                return ordered;

            } else {

                return object;

            }

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
