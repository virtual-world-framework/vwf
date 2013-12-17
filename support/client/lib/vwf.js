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

/// @module vwf

/// vwf.js is the main Virtual World Framework manager. It is constructed as a JavaScript module
/// (http://www.yuiblog.com/blog/2007/06/12/module-pattern) to isolate it from the rest of the
/// page's JavaScript environment. The vwf module self-creates its own instance when loaded and
/// attaches to the global window object as window.vwf. Nothing else should affect the global
/// environment.

( function( window ) {

    window.console && console.debug && console.debug( "loading vwf" );

    window.vwf = new function() {

        window.console && console.debug && console.debug( "creating vwf" );

        // == Public variables =====================================================================

        /// The runtime environment (production, development, testing) and other configuration
        /// settings appear here.
        /// 
        /// @name module:vwf.configuration
        /// 
        /// @private

        this.configuration = undefined; // require( "vwf/configuration" ).active; // "active" updates in place and changes don't invalidate the reference  // TODO: assign here after converting vwf.js to a RequireJS module and listing "vwf/configuration" as a dependency

        /// The kernel logger.
        /// 
        /// @name module:vwf.logger
        /// 
        /// @private

        this.logger = undefined; // require( "logger" ).for( undefined, this );  // TODO: for( "vwf", ... ), and update existing calls  // TODO: assign here after converting vwf.js to a RequireJS module and listing "vwf/logger" as a dependency

        /// Each model and view module loaded by the main page registers itself here.
        /// 
        /// @name module:vwf.modules
        /// 
        /// @private

        this.modules = [];

        /// vwf.initialize() creates an instance of each model and view module configured on the main
        /// page and attaches them here.
        /// 
        /// @name module:vwf.models
        /// 
        /// @private

        this.models = [];

        /// vwf.initialize() creates an instance of each model and view module configured on the main
        /// page and attaches them here.
        /// 
        /// @name module:vwf.views
        /// 
        /// @private

        this.views = [];

        /// this.models is a list of references to the head of each driver pipeline. Define an
        /// `actual` property that evaluates to a list of references to the pipeline tails. This is
        /// a list of the actual drivers after any intermediate stages and is useful for debugging.
        /// 
        /// @name module:vwf.models.actual

        Object.defineProperty( this.models, "actual", {

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

        /// this.views is a list of references to the head of each driver pipeline. Define an
        /// `actual` property that evaluates to a list of references to the pipeline tails. This is
        /// a list of the actual drivers after any intermediate stages and is useful for debugging.
        /// 
        /// @name module:vwf.views.actual

        Object.defineProperty( this.views, "actual", {

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

        /// The simulation clock, which contains the current time in seconds. Time is controlled by
        /// the reflector and updates here as we receive control messages.
        /// 
        /// @name module:vwf.now
        /// 
        /// @private

        this.now = 0;

        /// The queue's sequence number for the currently executing action.
        /// 
        /// The queue enumerates actions in order of arrival, which is distinct from execution order
        /// since actions may be scheduled to run in the future. `sequence_` can be used to
        /// distinguish between actions that were previously placed on the queue for execution at a
        /// later time, and those that arrived after the current action, regardless of their
        /// scheduled time.
        /// 
        /// @name module:vwf.sequence_
        /// 
        /// @private

        this.sequence_ = undefined;

        /// The moniker of the client responsible for the currently executing action. `client_` will
        /// be falsy for actions originating in the server, such as time ticks.
        /// 
        /// @name module:vwf.client_
        /// 
        /// @private

        this.client_ = undefined;

        /// The identifer assigned to the client by the server.
        /// 
        /// @name module:vwf.moniker_
        /// 
        /// @private

        this.moniker_ = undefined;

        /// Nodes that are receiving ticks.
        /// 
        /// @name module:vwf.tickable
        /// 
        /// @private

        this.tickable = {
            // models: [],
            // views: [],
            nodeIDs: [],
        };

        // == Private variables ====================================================================

        /// @name module:vwf.private
        /// 
        /// @private

        this.private = {}; // for debugging

        /// The application root ID.
        /// 
        /// @name module:vwf~applicationID

        var applicationID = undefined;

        /// Components describe the objects that make up the simulation. They may also serve as
        /// prototype objects for further derived components. External components are identified by
        /// URIs. Once loaded, we save a mapping here from its URI to the node ID of its prototype so
        /// that we can find it if it is reused. Components specified internally as object literals
        /// are anonymous and are not indexed here.
        /// 
        /// @name module:vwf~components

        var components = this.private.components = {}; // maps component node ID => component specification

        /// The proto-prototype of all nodes is "node", identified by this URI. This type is
        /// intrinsic to the system and nothing is loaded from the URI.
        /// 
        /// @name module:vwf~nodeTypeURI

        var nodeTypeURI = "http://vwf.example.com/node.vwf";

        /// The "node" component descriptor.
        /// 
        /// @name module:vwf~nodeTypeDescriptor

        var nodeTypeDescriptor = { extends: null };  // TODO: detect nodeTypeDescriptor in createChild() a different way and remove this explicit null prototype

        /// This is the connection to the reflector. In this sample implementation, "socket" is a
        /// socket.io client that communicates over a channel provided by the server hosting the
        /// client documents.
        /// 
        /// @name module:vwf~socket

        var socket = this.private.socket = undefined;

        // Each node is assigned an ID as it is created. This is the most recent ID assigned.

        // Communication between the manager and the models and views uses these IDs to refer to the
        // nodes. The manager doesn't maintain any particular state for the nodes and knows them
        // only as their IDs. The models work in federation to provide the meaning to each node.

        // var lastID = 0;

        /// Callback functions defined in this scope use this local "vwf" to locate the manager.
        /// 
        /// @name module:vwf~vwf

        var vwf = this;

        // == Public functions =====================================================================

        // -- loadConfiguration ---------------------------------------------------------------------------

        // The main page only needs to call vwf.loadConfiguration() to launch the application. Use
        // require.ready() or jQuery(document).ready() to call loadConfiguration() once the page has
        // loaded. loadConfiguration() accepts three parameters.
        // 
        // A component specification identifies the application to be loaded. modelInitializers and 
        // viewInitializers identify the model and view libraries that were parsed out of the URL that 
        // should be attached to the simulation. Each is specified as an object with each library 
        // name as a property of the object with any arguments as the value of the property.
        // Arguments may be specified as an array [1], as a single value if there is only one [2], or as 
        // undefined if there are none[3].
        // 
        //     [1] vwf.loadConfiguration( ..., { "vwf/model/glge": [ "#scene, "second param" ] }, { ... } )
        //     [2] vwf.loadConfiguration( ..., { "vwf/model/glge": "#scene" }, { ... } )
        //     [3] vwf.loadConfiguration( ..., { "vwf/model/javascript": undefined }, { ... } )
        this.loadConfiguration = function(/* [ componentURI|componentObject ] { modelInitializers }
            { viewInitializers } */) {
            var args = Array.prototype.slice.call( arguments );

            if ( typeof args[0] != "object" || ! ( args[0] instanceof Array ) ) {
                application = args.shift();
            }

            var userLibraries = args.shift() || {};

            var callback = args.shift();

            var requireConfig = {
                shim: {
                    "vwf/model/threejs/three": {
                        exports: "THREE",
                    },
                    "vwf/model/threejs/js/loaders/ColladaLoader": {
                        deps: [ "vwf/model/threejs/three" ],
                        exports: "THREE.ColladaLoader",
                    },
                }
            };

            var requireArray = [
                { library: "domReady", active: true },
                { library: "vwf/configuration", active: true },
                { library: "vwf/kernel/model", active: true },
                { library: "vwf/model/javascript", active: true },
                { library: "vwf/model/jiglib", linkedLibraries: ["vwf/model/jiglib/jiglib"], active: false },
                { library: "vwf/model/glge", linkedLibraries: ["vwf/model/glge/glge-compiled"], disabledBy: ["vwf/model/threejs", "vwf/view/threejs"], active: false },
                { library: "vwf/model/threejs", linkedLibraries: ["vwf/model/threejs/three", "vwf/model/threejs/js/loaders/ColladaLoader"], disabledBy: ["vwf/model/glge", "vwf/view/glge"], active: false },
                { library: "vwf/model/cesium", linkedLibraries: ["vwf/model/cesium/Cesium"], active: false },
                { library: "vwf/model/scenejs", active: false },
                { library: "vwf/model/object", active: true },
                { library: "vwf/model/stage/log", active: true },
                { library: "vwf/kernel/view", active: true },
                { library: "vwf/view/document", active: true },
                { library: "vwf/view/editor", active: true },
                { library: "vwf/view/glge", disabledBy: ["vwf/model/threejs", "vwf/view/threejs"], active: false },
                { library: "vwf/view/lesson", active: false},
                { library: "vwf/view/threejs", disabledBy: ["vwf/model/glge", "vwf/view/glge"], active: false },
                { library: "vwf/view/webrtc", linkedLibraries: ["vwf/view/webrtc/adapter"],  active: false },
                { library: "vwf/view/cesium", active: false },
                { library: "vwf/utility", active: true },
                { library: "vwf/model/glge/glge-compiled", active: false },
                { library: "vwf/model/threejs/three", active: false },
                { library: "vwf/model/threejs/js/loaders/ColladaLoader", active: false },
                { library: "vwf/model/jiglib/jiglib", active: false },
                { library: "vwf/view/webrtc/adapter", active: false },
                { library: "vwf/view/google-earth", active: false },
                { library: "vwf/model/cesium/Cesium", active: false },
                { library: "vwf/admin", active: true }
            ];

            var initializers = {
                model: [
                    { library: "vwf/model/javascript", active: true },
                    { library: "vwf/model/jiglib", active: false },
                    { library: "vwf/model/glge", active: false },
                    { library: "vwf/model/threejs", active: false },
                    { library: "vwf/model/cesium", active: false },
                    { library: "vwf/model/object", active: true }
                ],
                view: [
                    { library: "vwf/view/glge", parameters: {"application-root":"#vwf-root"}, active: false },
                    { library: "vwf/view/threejs", parameters: {"application-root":"#vwf-root"}, active: false },
                    { library: "vwf/view/document", active: true },
                    { library: "vwf/view/editor", active: true },
                    { library: "vwf/view/lesson", active: false},
                    { library: "vwf/view/google-earth", active: false },
                    { library: "vwf/view/cesium", active: false },
                    { library: "vwf/view/webrtc", active: false}
                ]
            };
            mapLibraryName(requireArray);
            mapLibraryName(initializers["model"]);
            mapLibraryName(initializers["view"]);

            function mapLibraryName(array) {
                for(var i=0;i<array.length;i++) {
                    array[array[i].library] = array[i];
                }
            }

            function getActiveLibraries(libraryList, includeParameters) {
                var activeLibraryList = [];
                for(var i=0; i<libraryList.length; i++) {
                    if(libraryList[i].active) {
                        if(includeParameters) {
                            var activeLibrary = {};
                            activeLibrary[libraryList[i].library] = libraryList[i].parameters;
                            activeLibraryList.push(activeLibrary);
                        }
                        else {
                            activeLibraryList.push(libraryList[i].library);
                        }
                    }
                }
                return activeLibraryList;
            }

            $.getJSON("admin/config", function(configLibraries) {
                if(configLibraries && typeof configLibraries == "object") {
                    Object.keys(configLibraries).forEach(function(libraryType) {
                        if(libraryType == 'info' && configLibraries[libraryType]["title"])
                        {
                            $('title').html(configLibraries[libraryType]["title"]);
                        }
                        if(!userLibraries[libraryType]) {
                            userLibraries[libraryType] = {};
                        }
                        Object.keys(configLibraries[libraryType]).forEach(function(libraryName) {
                            var disabled = false;
                            if(requireArray[libraryName] && requireArray[libraryName].disabledBy) {
                                for(var i=0; i<requireArray[libraryName].disabledBy.length; i++) {
                                    Object.keys(userLibraries).forEach(function(userLibraryType) {
                                        Object.keys(userLibraries[userLibraryType]).forEach(function(userLibraryName) {
                                            if(requireArray[libraryName].disabledBy[i] == userLibraryName) {
                                                disabled = true;
                                            }
                                        })
                                    })
                                }
                            }
                            if(!disabled) {
                                if(userLibraries[libraryType][libraryName] == undefined) {
                                    userLibraries[libraryType][libraryName] = configLibraries[libraryType][libraryName];
                                }
                                else if(typeof userLibraries[libraryType][libraryName] == "object" && typeof configLibraries[libraryType][libraryName] == "object") {
                                    userLibraries[libraryType][libraryName] = $.extend({}, configLibraries[libraryType][libraryName], userLibraries[libraryType][libraryName]);
                                }
                            }
                        });
                    });
                }
            }).complete(function(jqXHR, textStatus) { 

                Object.keys(userLibraries).forEach(function(libraryType) {
                    if(initializers[libraryType]) {
                        Object.keys(userLibraries[libraryType]).forEach(function(libraryName) {
                            if(requireArray[libraryName]) {
                                requireArray[libraryName].active = true;
                                initializers[libraryType][libraryName].active = true;
                                if(userLibraries[libraryType][libraryName] && userLibraries[libraryType][libraryName] != "") {
                                    if(typeof initializers[libraryType][libraryName].parameters == "object") {
                                        initializers[libraryType][libraryName].parameters = $.extend({}, initializers[libraryType][libraryName].parameters,
                                            userLibraries[libraryType][libraryName]);
                                    }
                                    else {
                                        initializers[libraryType][libraryName].parameters = userLibraries[libraryType][libraryName];
                                    }
                                }
                                if(requireArray[libraryName].linkedLibraries) {
                                    for(var i=0; i<requireArray[libraryName].linkedLibraries.length; i++) {
                                        requireArray[requireArray[libraryName].linkedLibraries[i]].active = true;
                                    }
                                }
                            }
                        });
                    }
                });

                // Load default renderer if no other librarys specified
                if(Object.keys(userLibraries["model"]).length == 0 && Object.keys(userLibraries["view"]).length == 0) {
                    requireArray["vwf/model/threejs"].active = true;
                    requireArray["vwf/view/threejs"].active = true;
                    requireArray["vwf/model/threejs/three"].active = true;
                    requireArray["vwf/model/threejs/js/loaders/ColladaLoader"].active = true;
                    initializers["model"]["vwf/model/threejs"].active = true;
                    initializers["view"]["vwf/view/threejs"].active = true;
                }

                require( requireConfig, getActiveLibraries(requireArray, false), function( ready ) {

                    ready( function() {

                        // With the scripts loaded, we must initialize the framework. vwf.initialize()
                        // accepts three parameters: a world specification, model configuration parameters,
                        // and view configuration parameters.

                        vwf.initialize(application, getActiveLibraries(initializers["model"], true), getActiveLibraries(initializers["view"], true), callback);

                    } );

                } );
            });
        }

        // -- initialize ---------------------------------------------------------------------------

        /// The main page only needs to call vwf.initialize() to launch the application. Use
        /// require.ready() or jQuery(document).ready() to call initialize() once the page has
        /// loaded. initialize() accepts three parameters.
        /// 
        /// A component specification identifies the application to be loaded. If a URI is provided,
        /// the specification is loaded from there [1]. Alternately, a JavaScript object literal
        /// containing the specfication may be provided [2]. Since a component can extend and
        /// specialize a prototype, using a simple object literal allows existing component to be
        /// configured for special uses [3].
        /// 
        ///     [1] vwf.initialize( "http://vwf.example.com/applications/sample12345", ... )
        ///
        ///     [2] vwf.initialize( { source: "model.dae", type: "model/vnd.collada+xml",
        ///             properties: { "p1": ... }, ... }, ... )
        ///
        ///     [3] vwf.initialize( { extends: "http://vwf.example.com/applications/sample12345",
        ///             source: "alternate-model.dae", type: "model/vnd.collada+xml" }, ... )
        /// 
        /// modelInitializers and viewInitializers identify the model and view modules that should be
        /// attached to the simulation. Each is specified as an array of objects that map the name of
        /// a model or view to construct to the set of arguments to pass to its constructor. Modules
        /// without parameters may be specified as a string [4]. Arguments may be specified as an
        /// array [5], or as a single value if there is only one [6].
        /// 
        ///     [4] vwf.initialize( ..., [ "vwf/model/javascript" ], [ ... ] )
        ///     [5] vwf.initialize( ..., [ { "vwf/model/glge": [ "#scene, "second param" ] } ], [ ... ] )
        ///     [6] vwf.initialize( ..., [ { "vwf/model/glge": "#scene" } ], [ ... ] )
        /// 
        /// @name module:vwf.initialize

        this.initialize = function( /* [ componentURI|componentObject ] [ modelInitializers ]
            [ viewInitializers ] */ ) {

            var args = Array.prototype.slice.call( arguments );
            var application;

            // Load the runtime configuration. We start with the factory defaults. The reflector may
            // provide additional settings when we connect.

            this.configuration = require( "vwf/configuration" ).active; // "active" updates in place and changes don't invalidate the reference

            // Create the logger.

            this.logger = require( "logger" ).for( "vwf", this );  // TODO: for( "vwf", ... ), and update existing calls

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

            var callback = args.shift();
            var compatibilityStatus = { compatible: true, errors: {} };

            // Create the model interface to the kernel. Models can make direct calls that execute
            // immediately or future calls that are placed on the queue and executed when removed.

            this.models.kernel = require( "vwf/kernel/model" ).create( vwf );

            // Create and attach each configured model.

            modelInitializers.forEach( function( modelInitializer ) {

                // Skip falsy values to allow initializers to be conditionally included by the
                // loader.

                if ( modelInitializer ) {

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
                        
                        if(model.model.compatibilityStatus) {
                            if(!model.model.compatibilityStatus.compatible) {
                                compatibilityStatus.compatible = false;
                                $.extend(compatibilityStatus.errors, model.model.compatibilityStatus.errors);
                            }
                        }
                    }

                }

            }, this );

            // Create the view interface to the kernel. Views can only make replicated calls which
            // bounce off the reflection server, are placed on the queue when received, and executed
            // when removed.

            this.views.kernel = require( "vwf/kernel/view" ).create( vwf );

            // Create and attach each configured view.

            viewInitializers.forEach( function( viewInitializer ) {

                // Skip falsy values to allow initializers to be conditionally included by the
                // loader.

                if ( viewInitializer ) { 

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

                            if(view.compatibilityStatus) {
                                if(!view.compatibilityStatus.compatible) {
                                    compatibilityStatus.compatible = false;
                                    $.extend(compatibilityStatus.errors, view.compatibilityStatus.errors);
                                }
                            }
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

                            if(view.compatibilityStatus) {
                                if(!view.compatibilityStatus.compatible) {
                                    compatibilityStatus.compatible = false;
                                    $.extend(compatibilityStatus.errors, view.compatibilityStatus.errors);
                                }
                            }
                        }

                    }

                }

            }, this );

            // Test for ECMAScript 5
            if(!(function() { return !this })()) {
                compatibilityStatus.compatible = false;
                $.extend(compatibilityStatus.errors, {"ES5": "This browser is not compatible. VWF requires ECMAScript 5."});
            }

            // Test for WebSockets
            if( window.io && !io.Transport.websocket.check() )
            {
                compatibilityStatus.compatible = false;
                $.extend(compatibilityStatus.errors, {"WS": "This browser is not compatible. VWF requires WebSockets."});
            }

            if(callback) {
                callback(compatibilityStatus);
            }

            // Load the application.

            this.ready( application );

        };

        // -- ready --------------------------------------------------------------------------------

        /// @name module:vwf.ready

        this.ready = function( component_uri_or_json_or_object ) {

            // Connect to the reflector. This implementation uses the socket.io library, which
            // communicates using a channel back to the server that provided the client documents.
            try {
                if ( isSocketIO07() ) {
                    var options = {
    
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
                        transportOptions: {
                            "websocket": { timeout: 90000 }
                            // "flashsocket": { timeout: 90000 },
                            // "htmlfile": { timeout: 90000 },
                            // "xhr-multipart": { timeout: 90000 },
                            // "xhr-polling": { timeout: 90000 },
                            // "jsonp-polling": { timeout: 90000 },
                        }
    
                    };
                    if ( window.location.protocol === "https:" )
                    {
                        socket = io.connect("wss://"+window.location.host, options);
                    } else {
                        socket = io.connect("ws://"+window.location.host, options); 
                    }
 
                } else {  // Ruby Server

                    socket = new io.Socket( undefined, {
    
                        // The socket is relative to the application path.
    
                        resource: window.location.pathname.slice( 1,
                            window.location.pathname.lastIndexOf("/") ),

                        // Use a secure connection when the application comes from https.

                        secure: window.location.protocol === "https:",

                        port: window.location.port ||
                            ( window.location.protocol === "https:" ? 443 : 80 ),
    
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
    
                        transportOptions: {
                            "websocket": { timeout: 90000 }
                            // "flashsocket": { timeout: 90000 },
                            // "htmlfile": { timeout: 90000 },
                            // "xhr-multipart": { timeout: 90000 },
                            // "xhr-polling": { timeout: 90000 },
                            // "jsonp-polling": { timeout: 90000 },
                        }
    
                    } );
                }

            } catch ( e ) {

                // If a connection to the reflector is not available, then run in single-user mode.
                // Messages intended for the reflector will loop directly back to us in this case.
                // Start a timer to monitor the incoming queue and dispatch the messages as though
                // they were received from the server.

                this.dispatch();

                setInterval( function() {

                    var fields = {
                        time: vwf.now + 0.010, // TODO: there will be a slight skew here since the callback intervals won't be exactly 10 ms; increment using the actual delta time; also, support play/pause/stop and different playback rates as with connected mode.
                        origin: "reflector",
                    };

                    queue.insert( fields, true ); // may invoke dispatch(), so call last before returning to the host

                }, 10 );

            }

            if ( socket ) {

                socket.on( "connect", function() {

                    vwf.logger.infox( "-socket", "connected" );

                    if ( isSocketIO07() ) {
                        vwf.moniker_ = this.json.namespace.socket.sessionid;                        
                    } else {  //Ruby Server
                        vwf.moniker_ = this.transport.sessionid;
                    }

                } );

                // Configure a handler to receive messages from the server.
                
                // Note that this example code doesn't implement a robust parser capable of handling
                // arbitrary text and that the messages should be placed in a dedicated priority
                // queue for best performance rather than resorting the queue as each message
                // arrives. Additionally, overlapping messages may cause actions to be performed out
                // of order in some cases if messages are not processed on a single thread.

                socket.on( "message", function( message ) {

                    // vwf.logger.debugx( "-socket", "message", message );

                    try {

                        if ( isSocketIO07() ) {
                            var fields = message;
                        } else { // Ruby Server - Unpack the arguements
                            var fields = JSON.parse( message );
                        }

                        fields.time = Number( fields.time );
                        // TODO: other message validation (check node id, others?)

                        fields.origin = "reflector";

                        // Update the queue. Insert the message (unless it is only a time tick), and
                        // advance the queue's record of the current time. Messages in the queue are
                        // ordered by time, then by order of arrival.

                        queue.insert( fields, true ); // may invoke dispatch(), so call last before returning to the host

                        // Each message from the server allows us to move time forward. Parse the
                        // timestamp from the message and call dispatch() to execute all queued
                        // actions through that time, including the message just received.
                    
                        // The simulation may perform immediate actions at the current time or it
                        // may post actions to the queue to be performed in the future. But we only
                        // move time forward for items arriving in the queue from the reflector.

                    } catch ( e ) {

                        vwf.logger.warn( fields.action, fields.node, fields.member, fields.parameters,
                            "exception performing action:", require( "vwf/utility" ).exceptionMessage( e ) );

                    }

                } );

                socket.on( "disconnect", function() {

                    vwf.logger.infox( "-socket", "disconnected" );

                } );

                socket.on( "error", function() { 

                    //Overcome by compatibility.js websockets check
                    //jQuery('body').html("<div class='vwf-err'>WebSockets connections are currently being blocked. Please check your proxy server settings.</div>"); 

                } );

                if ( !isSocketIO07() ) {
                    // Start communication with the reflector. 

                    socket.connect();  // TODO: errors can occur here too, particularly if a local client contains the socket.io files but there is no server; do the loopback here instead of earlier in response to new io.Socket.
                }

            } else if ( component_uri_or_json_or_object ) {

                // Load the application. The application is rooted in a single node constructed here
                // as an instance of the component passed to initialize(). That component, its
                // prototype(s), and its children, and their prototypes and children, flesh out the
                // entire application.

                // TODO: add note that this is only for a self-determined application; with socket, wait for reflection server to tell us.
                // TODO: maybe depends on component_uri_or_json_or_object too; when to override and not connect to reflection server?

                this.createNode( component_uri_or_json_or_object, "application" );

            } else {  // TODO: also do this if component_uri_or_json_or_object was invalid and createNode() failed

                // TODO: show a selection dialog

            }

        };

        // -- plan ---------------------------------------------------------------------------------

        /// @name module:vwf.plan

        this.plan = function( nodeID, actionName, memberName, parameters, when, callback_async /* ( result ) */ ) {

            this.logger.debuggx( "plan", nodeID, actionName, memberName,
                parameters && parameters.length, when, callback_async && "callback" );

            var time = when > 0 ? // absolute (+) or relative (-)
                Math.max( this.now, when ) :
                this.now + ( -when );

            var fields = {
                time: time,
                node: nodeID,
                action: actionName,
                member: memberName,
                parameters: parameters,
                client: this.client_, // propagate originating client
                origin: "future",
                // callback: callback_async,  // TODO
            };

            queue.insert( fields );

            this.logger.debugu();
        };

        // -- send ---------------------------------------------------------------------------------

        /// Send a message to the reflector. The message will be reflected back to all participants
        /// in the instance.
        /// 
        /// @name module:vwf.send

        this.send = function( nodeID, actionName, memberName, parameters, when, callback_async /* ( result ) */ ) {

            this.logger.debuggx( "send", nodeID, actionName, memberName,
                parameters && parameters.length, when, callback_async && "callback" );  // TODO: loggableParameters()

            var time = when > 0 ? // absolute (+) or relative (-)
                Math.max( this.now, when ) :
                this.now + ( -when );

            // Attach the current simulation time and pack the message as an array of the arguments.

            var fields = {
                time: time,
                node: nodeID,
                action: actionName,
                member: memberName,
                parameters: require( "vwf/utility" ).transform( parameters, require( "vwf/utility" ).transforms.transit ),
                // callback: callback_async,  // TODO: provisionally add fields to queue (or a holding queue) then execute callback when received back from reflector
            };

            if ( socket ) {
    
                // Send the message.
                var message = JSON.stringify( fields );
                socket.send( message );
 
            } else {
                
                // In single-user mode, loop the message back to the incoming queue.

                fields.client = this.moniker_; // stamp with the originating client like the reflector does
                fields.origin = "reflector";

                queue.insert( fields );
    
            }

            this.logger.debugu();
        };

        // -- respond ------------------------------------------------------------------------------

        /// Return a result for a function invoked by the server.
        /// 
        /// @name module:vwf.respond

        this.respond = function( nodeID, actionName, memberName, parameters, result ) {

            this.logger.debuggx( "respond", nodeID, actionName, memberName,
                parameters && parameters.length, "..." );  // TODO: loggableParameters(), loggableResult()

            // Attach the current simulation time and pack the message as an array of the arguments.

            var fields = {
                // sequence: undefined,  // TODO: use to identify on return from reflector?
                time: this.now,
                node: nodeID,
                action: actionName,
                member: memberName,
                parameters: require( "vwf/utility" ).transform( parameters, require( "vwf/utility" ).transforms.transit ),
                result: require( "vwf/utility" ).transform( result, require( "vwf/utility" ).transforms.transit ),
            };

            if ( socket ) {

                // Send the message.

                var message = JSON.stringify( fields );
                socket.send( message );

            } else {

                // Nothing to do in single-user mode.

            }

            this.logger.debugu();
        };

        // -- receive ------------------------------------------------------------------------------

        /// Handle receipt of a message. Unpack the arguments and call the appropriate handler.
        /// 
        /// @name module:vwf.receive

        this.receive = function( nodeID, actionName, memberName, parameters, respond, origin ) {

            // origin == "reflector" ?
            //     this.logger.infogx( "receive", nodeID, actionName, memberName,
            //         parameters && parameters.length, respond, origin ) :
            //     this.logger.debuggx( "receive", nodeID, actionName, memberName,
            //         parameters && parameters.length, respond, origin );

// TODO: delegate parsing and validation to each action.

            // Look up the action handler and invoke it with the remaining parameters.

            // Note that the message should be validated before looking up and invoking an arbitrary
            // handler.

            var args = [];

            if ( nodeID || nodeID === 0 ) args.push( nodeID );
            if ( memberName ) args.push( memberName );
            if ( parameters ) args = args.concat( parameters ); // flatten

            var self = this;

            var callback;
            if( respond ) {
                switch(actionName) {
                    case "createChild":
                        callback = args[4];
                        args[4] = respondFunction;
                        break;
                    case "createNode":
                        callback = args[2];
                        args[2] = respondFunction;
                        break;
                }
            }

            // Invoke the action.

            var result = this[actionName] && this[actionName].apply( this, args );

            // Return the result.

            switch(actionName) {
                case "createChild":
                case "createNode":
                    break;
                default:
                    respond && this.respond( nodeID, actionName, memberName, parameters, result );
            }

            function respondFunction (result) { 
                callback && callback.apply(this, arguments); 
                respond && self.respond( nodeID, actionName, memberName, parameters, result );
            }

            // origin == "reflector" ?
            //     this.logger.infou() : this.logger.debugu();
        };

        // -- dispatch -----------------------------------------------------------------------------

        /// Dispatch incoming messages waiting in the queue. "currentTime" specifies the current
        /// simulation time that we should advance to and was taken from the time stamp of the last
        /// message received from the reflector.
        /// 
        /// @name module:vwf.dispatch

        this.dispatch = function() {

            var fields;

            // Actions may use receive's ready function to suspend the queue for asynchronous
            // operations, and to resume it when the operation is complete.

            while ( fields = /* assignment! */ queue.pull() ) {

                // Advance time to the message time.

                if ( this.now != fields.time ) {
                    this.sequence_ = undefined; // clear after the previous action
                    this.client_ = undefined;   // clear after the previous action
                    this.now = fields.time;
                    this.tick();
                }

                // Perform the action.

                if ( fields.action ) {  // TODO: don't put ticks on the queue but just use them to fast-forward to the current time (requires removing support for passing ticks to the drivers and nodes)
                    this.sequence_ = fields.sequence; // note the message's queue sequence number for the duration of the action
                    this.client_ = fields.client;     // ... and note the originating client
                    this.receive( fields.node, fields.action, fields.member, fields.parameters, fields.respond, fields.origin );
                }

            }

            // Advance time to the most recent time received from the server. Tick if the time
            // changed.

            if ( queue.ready() && this.now != queue.time ) {
                this.sequence_ = undefined; // clear after the previous action
                this.client_ = undefined;   // clear after the previous action
                this.now = queue.time;
                this.tick();
            }
            
        };

        // -- log ----------------------------------------------------------------------------------

        /// Send a log message to the reflector.
        /// 
        /// @name module:vwf.log

        this.log = function() {

            this.respond( undefined, "log", undefined, undefined, arguments );

        }

        // -- tick ---------------------------------------------------------------------------------

        /// Tick each tickable model, view, and node. Ticks are sent on each time change.
        /// 
        /// @name module:vwf.tick

        // TODO: remove, in favor of drivers and nodes exclusively using future scheduling;
        // TODO: otherwise, all clients must receive exactly the same ticks at the same times.

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

        // -- setState -----------------------------------------------------------------------------

        /// setState may complete asynchronously due to its dependence on createNode. To prevent
        /// actions from executing out of order, queue processing must be suspended while setState is
        /// in progress. createNode suspends the queue when necessary, but additional calls to
        /// suspend and resume the queue may be needed if other async operations are added.
        /// 
        /// @name module:vwf.setState
        /// 
        /// @see {@link module:vwf/api/kernel.setState}

        this.setState = function( applicationState, callback_async /* () */ ) {

            this.logger.debuggx( "setState" );  // TODO: loggableState

            // Set the runtime configuration.

            if ( applicationState.configuration ) {
                require( "vwf/configuration" ).instance = applicationState.configuration;
            }

            // Update the internal kernel state.

            if ( applicationState.kernel ) {
                if ( applicationState.kernel.time !== undefined ) vwf.now = applicationState.kernel.time;
            }

            // Create or update global nodes and their descendants.

            var nodes = applicationState.nodes || [];
            var annotations = applicationState.annotations || {};

            var nodeIndex = 0;

            async.forEachSeries( nodes, function( nodeComponent, each_callback_async /* ( err ) */ ) {

                // Look up a possible annotation for this node. For backward compatibility, if the
                // state has exactly one node and doesn't contain an annotations object, assume the
                // node is the application.

                var nodeAnnotation = nodes.length > 1 || applicationState.annotations ?
                    annotations[nodeIndex] : "application";

                vwf.createNode( nodeComponent, nodeAnnotation, function( nodeID ) /* async */ {
                    each_callback_async( undefined );
                } );

                nodeIndex++;

            }, function( err ) /* async */ {

                // Clear the message queue, except for reflector messages that arrived after the
                // current action.

                queue.filter( function( fields ) {

                    if ( fields.origin === "reflector" && fields.sequence > vwf.sequence_ ) {
                        return true;
                    } else {
                        vwf.logger.debugx( "setState", function() {
                            return [ "removing", JSON.stringify( loggableFields( fields ) ), "from queue" ];
                        } );
                    }

                } );

                // Set the queue time and add the incoming items to the queue.

                if ( applicationState.queue ) {
                    queue.time = applicationState.queue.time;
                    queue.insert( applicationState.queue.queue || [] );
                }

                callback_async && callback_async();

            } );

            this.logger.debugu();
        };

        // -- getState -----------------------------------------------------------------------------

        /// @name module:vwf.getState
        /// 
        /// @see {@link module:vwf/api/kernel.getState}

        this.getState = function( full, normalize ) {

            this.logger.debuggx( "getState", full, normalize );

            // Get the application nodes and queue.

            var applicationState = {

                // Runtime configuration.

                configuration:
                    require( "vwf/configuration" ).active,

                // Internal kernel state.

                kernel: {
                    time: vwf.now,
                },

                // Global node and descendant deltas.

                nodes: [  // TODO: all global objects
                    this.getNode( "http-vwf-example-com-clients-vwf", full ),
                    this.getNode( "http-vwf-example-com-devices-vwf", full ),
                    this.getNode( applicationID, full ),
                ],

                // `createNode` annotations, keyed by `nodes` indexes.

                annotations: {
                    1: "application",
                },

                // Message queue.

                queue: {  // TODO: move to the queue object
                    time: queue.time,
                    queue: require( "vwf/utility" ).transform( queue.queue, queueTransitTransformation ),
                },

            };

            // Normalize for consistency.

            if ( normalize ) {
                applicationState = require( "vwf/utility" ).transform(
                    applicationState, require( "vwf/utility" ).transforms.hash );
            }
    
            this.logger.debugu();

            return applicationState;
        };

        // -- hashState ----------------------------------------------------------------------------

        /// @name module:vwf.hashState
        /// 
        /// @see {@link module:vwf/api/kernel.hashState}

        this.hashState = function() {

            this.logger.debuggx( "hashState" );

            var applicationState = this.getState( true, true );

            // Hash the nodes.

            var hashn = this.hashNode( applicationState.nodes[0] );  // TODO: all global objects

            // Hash the queue.

            var hashq = "q" + Crypto.MD5( JSON.stringify( applicationState.queue ) ).toString().substring( 0, 16 );

            // Hash the other kernel properties.

            var hashk = "k" + Crypto.MD5( JSON.stringify( applicationState.kernel ) ).toString().substring( 0, 16 );

            this.logger.debugu();

            // Generate the combined hash.

            return hashn + ":" + hashq + ":" + hashk;
        }

        // -- createNode ---------------------------------------------------------------------------

        /// Create a node from a component specification. Construction may require loading data from
        /// multiple remote documents. This function returns before construction is complete. A
        /// callback is invoked once the node has fully loaded.
        /// 
        /// A simple node consists of a set of properties, methods and events, but a node may
        /// specialize a prototype component and may also contain multiple child nodes, any of which
        /// may specialize a prototype component and contain child nodes, etc. So components cover a
        /// vast range of complexity. The application definition for the overall simulation is a
        /// single component instance.
        /// 
        /// A node is a component instance--a single, anonymous specialization of its component.
        /// Nodes specialize components in the same way that any component may specialize a prototype
        /// component. The prototype component is made available as a base, then new or modified
        /// properties, methods, events, child nodes and scripts are attached to modify the base
        /// implemenation.
        /// 
        /// To create a node, we first make the prototoype available by loading it (if it has not
        /// already been loaded). This is a recursive call to createNode() with the prototype
        /// specification. Then we add new, and modify existing, properties, methods, and events
        /// according to the component specification. Then we load and add any children, again
        /// recursively calling createNode() for each. Finally, we attach any new scripts and invoke
        /// an initialization function.
        /// 
        /// createNode may complete asynchronously due to its dependence on setNode, createChild and
        /// loadComponent. To prevent actions from executing out of order, queue processing must be
        /// suspended while createNode is in progress. setNode, createChild and loadComponent suspend
        /// the queue when necessary, but additional calls to suspend and resume the queue may be
        /// needed if other async operations are added.
        /// 
        /// @name module:vwf.createNode
        /// 
        /// @see {@link module:vwf/api/kernel.createNode}

        this.createNode = function( nodeComponent, nodeAnnotation, callback_async /* ( nodeID ) */ ) {

            // Interpret `createNode( nodeComponent, callback )` as
            // `createNode( nodeComponent, undefined, callback )`. (`nodeAnnotation` was added in
            // 0.6.12.)

            if ( typeof nodeAnnotation == "function" || nodeAnnotation instanceof Function ) {
                callback_async = nodeAnnotation;
                nodeAnnotation = undefined;
            }

            this.logger.debuggx( "createNode", function() {
                return [ JSON.stringify( loggableComponent( nodeComponent ) ), nodeAnnotation ];
            } );

            var nodePatch;

            if ( componentIsDescriptor( nodeComponent ) && nodeComponent.patches ) {
                nodePatch = nodeComponent;
                nodeComponent = nodeComponent.patches;  // TODO: possible sync errors if the patched node is a URI component and the kernel state (time, random) is different from when the node was created on the originating client
            }

            // nodeComponent may be a URI, a descriptor, or an ID, and while being created will
            // transform from a URI to a descriptor to an ID (depending on its starting state).
            // nodeURI, nodeDescriptor, and nodeID capture the applicable intermediate states.

            var nodeURI, nodeDescriptor, nodeID;

            async.series( [

                // If nodeComponent is a URI, load the descriptor.

                function( series_callback_async /* ( err, results ) */ ) { // nodeComponent is a URI, a descriptor, or an ID

                    if ( componentIsURI( nodeComponent ) ) { // URI  // TODO: allow non-vwf URIs (models, images, etc.) to pass through to stage 2 and pass directly to createChild()

                        nodeURI = nodeComponent;  // TODO: canonicalize uri

                        // Load the document if we haven't seen this URI yet. Mark the components
                        // list to indicate that this component is loading.

                        if ( ! components[nodeURI] ) { // uri is not loading (Array) or is loaded (id)

                            components[nodeURI] = []; // [] => array of callbacks while loading => true

                            loadComponent( nodeURI, function( nodeDescriptor ) /* async */ {
                                nodeComponent = nodeDescriptor;
                                series_callback_async( undefined, undefined );
                            } );

                        // If we've seen this URI, but it is still loading, just add our callback to
                        // the list. The original load's completion will call our callback too.

                        } else if ( components[nodeURI] instanceof Array ) { // uri is loading
 
                            callback_async && components[nodeURI].push( callback_async );  // TODO: is this leaving a series callback hanging if we don't call series_callback_async?

                        // If this URI has already loaded, skip to the end and call the callback
                        // with the ID.

                        } else { // uri is loaded

                            if ( nodePatch ) {
                                vwf.setNode( components[nodeURI], nodePatch, function( nodeID ) /* async */ {
                                    callback_async && callback_async( components[nodeURI] );  // TODO: is this leaving a series callback hanging if we don't call series_callback_async?
                                } );
                            } else {
                                callback_async && callback_async( components[nodeURI] );  // TODO: is this leaving a series callback hanging if we don't call series_callback_async?
                            }

                        }

                    } else { // descriptor, ID or error
                        series_callback_async( undefined, undefined );
                    }

                },

                // Rudimentary support for `{ includes: prototype }`, which absorbs a prototype
                // descriptor into the node descriptor before creating the node.

                // Notes:
                // 
                //   - Only supports one level, so `{ includes: prototype }` won't work if the
                //     prototype also contains a `includes` directive).
                //   - Only works with prototype URIs, so `{ includes: { ... descriptor ... } }`
                //     won't work.
                //   - Loads the prototype on each reference, so unlike real prototypes, multiple
                //     references to the same prototype cause multiple network loads.
                // 
                // Also see the `mergeDescriptors` limitations.

                function( series_callback_async /* ( err, results ) */ ) {

                    if ( componentIsDescriptor( nodeComponent ) && nodeComponent.includes && componentIsURI( nodeComponent.includes ) ) {  // TODO: for "includes:", accept an already-loaded component (which componentIsURI exludes) since the descriptor will be loaded again

                        var prototypeURI = nodeComponent.includes;

                        loadComponent( prototypeURI, function( prototypeDescriptor ) /* async */ {
                            nodeComponent = mergeDescriptors( nodeComponent, prototypeDescriptor ); // modifies prototypeDescriptor
                            series_callback_async( undefined, undefined );
                        } );

                    } else {
                        series_callback_async( undefined, undefined );
                    }

                },

                // If nodeComponent is a descriptor, construct and get the ID.

                function( series_callback_async /* ( err, results ) */ ) { // nodeComponent is a descriptor or an ID

                    if ( componentIsDescriptor( nodeComponent ) ) { // descriptor  // TODO: allow non-vwf URIs (models, images, etc.) to pass through to stage 2 and pass directly to createChild()

                        nodeDescriptor = nodeComponent;

                        // Create the node as an unnamed child global object.

                        vwf.createChild( 0, nodeAnnotation, nodeDescriptor, nodeURI, function( nodeID ) /* async */ {
                            nodeComponent = nodeID;
                            series_callback_async( undefined, undefined );
                        } );
                        
                    } else { // ID or error
                        series_callback_async( undefined, undefined );
                    }

                },

                // nodeComponent is the ID.

                function( series_callback_async /* ( err, results ) */ ) { // nodeComponent is an ID

                    if ( componentIsID( nodeComponent ) ) {  // ID

                        nodeID = nodeComponent;

                        if ( nodePatch ) {
                            vwf.setNode( nodeID, nodePatch, function( nodeID ) /* async */ {
                                series_callback_async( undefined, undefined );
                            } );
                        } else {
                            series_callback_async( undefined, undefined );
                        }

                    } else {  // error
                        series_callback_async( undefined, undefined );  // TODO: error
                    }

                },

            ], function( err, results ) /* async */ {

                // If this node derived from a URI, save the list of callbacks waiting for
                // completion and update the component list with the ID.

                if ( nodeURI ) {
                    var callbacks_async = components[nodeURI];
                    components[nodeURI] = nodeID;
                }

                // Pass the ID to our callback.

                callback_async && callback_async( nodeID );  // TODO: handle error if invalid id

                // Call the other callbacks.

                if ( nodeURI ) {
                    callbacks_async.forEach( function( callback_async ) {
                        callback_async && callback_async( nodeID );
                    } );
                }

            } );

            this.logger.debugu();
        };

        // -- deleteNode ---------------------------------------------------------------------------

        /// @name module:vwf.deleteNode
        /// 
        /// @see {@link module:vwf/api/kernel.deleteNode}

        this.deleteNode = function( nodeID ) {

            this.logger.debuggx( "deleteNode", nodeID );

            // Remove the entry in the components list if this was the root of a component loaded
            // from a URI.

            Object.keys( components ).some( function( nodeURI ) { // components: nodeURI => nodeID
                if (  components[nodeURI] == nodeID ) {
                    delete components[nodeURI];
                    return true;
                }
            } );

            // Call deletingNode() on each model. The node is considered deleted after all models
            // have run.

            this.models.forEach( function( model ) {
                model.deletingNode && model.deletingNode( nodeID );
            } );

            // Unregister the node.

            nodes.delete( nodeID );

            // Clear the root ID if the application root node is deleted.

            if ( nodeID === applicationID ) {
                applicationID = undefined;
            }

            // Call deletedNode() on each view. The view is being notified that a node has been
            // deleted.

            this.views.forEach( function( view ) {
                view.deletedNode && view.deletedNode( nodeID );
            } );

            this.logger.debugu();
        };

        // -- setNode ------------------------------------------------------------------------------

        /// setNode may complete asynchronously due to its dependence on createChild. To prevent
        /// actions from executing out of order, queue processing must be suspended while setNode is
        /// in progress. createChild suspends the queue when necessary, but additional calls to
        /// suspend and resume the queue may be needed if other async operations are added.
        /// 
        /// @name module:vwf.setNode
        /// 
        /// @see {@link module:vwf/api/kernel.setNode}

        this.setNode = function( nodeID, nodeComponent, callback_async /* ( nodeID ) */ ) {  // TODO: merge with createChild?

            this.logger.debuggx( "setNode", function() {
                return [ nodeID, JSON.stringify( loggableComponent( nodeComponent ) ) ];
            } );

            var node = nodes.existing[nodeID];

            // Set the internal state.

            vwf.models.object.internals( nodeID, nodeComponent );

            // Suppress kernel reentry so that we can write the state without coloring from
            // any scripts.

            vwf.models.kernel.disable();

            // Create the properties, methods, and events. For each item in each set, invoke
            // createProperty(), createMethod(), or createEvent() to create the field. Each

            // delegates to the models and views as above.

            nodeComponent.properties && jQuery.each( nodeComponent.properties, function( propertyName, propertyValue ) {  // TODO: setProperties should be adapted like this to be used here

                // Is the property specification directing us to create a new property, or
                // initialize a property already defined on a prototype?

                // Create a new property if the property is not defined on a prototype.
                // Otherwise, initialize the property.

                var creating = ! node.properties.has( propertyName );  // not defined on node or prototype

                // Create or initialize the property.

                if ( creating ) {
                    vwf.createProperty( nodeID, propertyName, propertyValue );
                } else {
                    vwf.setProperty( nodeID, propertyName, propertyValue );
                }  // TODO: delete when propertyValue === null in patch

            } );

            // TODO: methods, events

            // Restore kernel reentry.

            vwf.models.kernel.enable();


            async.series( [

                function( series_callback_async /* ( err, results ) */ ) {

                    // Create and attach the children. For each child, call createChild() with the
                    // child's component specification. createChild() delegates to the models and
                    // views as before.

                    async.forEach( Object.keys( nodeComponent.children || {} ), function( childName, each_callback_async /* ( err ) */ ) {

                        var creating = ! nodeHasOwnChild.call( vwf, nodeID, childName );

                        if ( creating ) {
                            vwf.createChild( nodeID, childName, nodeComponent.children[childName], undefined, function( childID ) /* async */ {  // TODO: add in original order from nodeComponent.children  // TODO: ensure id matches nodeComponent.children[childName].id  // TODO: propagate childURI + fragment identifier to children of a URI component?
                                each_callback_async( undefined );
                            } );
                        } else {
                            vwf.setNode( nodeComponent.children[childName].id || nodeComponent.children[childName].patches,
                                    nodeComponent.children[childName], function( childID ) /* async */ {
                                each_callback_async( undefined );
                            } );
                        }  // TODO: delete when nodeComponent.children[childName] === null in patch

                    }, function( err ) /* async */ {
                        series_callback_async( err, undefined );
                    } );

                },

                function( series_callback_async /* ( err, results ) */ ) {

                    // Attach the scripts. For each script, load the network resource if the script
                    // is specified as a URI, then once loaded, call execute() to direct any model
                    // that manages scripts of this script's type to evaluate the script where it
                    // will perform any immediate actions and retain any callbacks as appropriate
                    // for the script type.

                    var scripts = nodeComponent.scripts ?
                        [].concat( nodeComponent.scripts ) : []; // accept either an array or a single item

                    async.map( scripts, function( script, map_callback_async /* ( err, result ) */ ) {

                        if ( valueHasType( script ) ) {
                            if ( script.source ) {
                                loadScript( script.source, function( scriptText ) /* async */ {  // TODO: this load would be better left to the driver, which may want to ignore it in certain cases, but that would require a completion callback from kernel.execute()
                                    map_callback_async( undefined, { text: scriptText, type: script.type } );
                                } );
                            } else {
                                map_callback_async( undefined, { text: script.text, type: script.type } );
                            }
                        } else {
                            map_callback_async( undefined, { text: script, type: undefined } );
                        }

                    }, function( err, scripts ) /* async */ {

                        // Suppress kernel reentry so that initialization functions don't make any
                        // changes during replication.

                        vwf.models.kernel.disable();

                        // Create each script.

                        scripts.forEach( function( script ) {
                            vwf.execute( nodeID, script.text, script.type ); // TODO: callback
                        } );

                        // Restore kernel reentry.

                        vwf.models.kernel.enable();

                        series_callback_async( err, undefined );
                    } );

                },

            ], function( err, results ) /* async */ {

                callback_async && callback_async( nodeID );

            } );

            this.logger.debugu();

            return nodeComponent;
        };

        // -- getNode ------------------------------------------------------------------------------

        /// @name module:vwf.getNode
        /// 
        /// @see {@link module:vwf/api/kernel.getNode}

        this.getNode = function( nodeID, full, normalize ) {  // TODO: options to include/exclude children, prototypes

            this.logger.debuggx( "getNode", nodeID, full );

            var node = nodes.existing[nodeID];

            // Start the descriptor.

            var nodeComponent = {};

            // Arrange the component as a patch if the node originated in a URI component. We want
            // to refer to the original URI but apply any changes that have been made to the node
            // since it was loaded.

            var patches = this.models.object.patches( nodeID ),
                patched = false;

            if ( node.patchable ) {
                nodeComponent.patches = node.uri || nodeID;
            } else {
                nodeComponent.id = nodeID;
            }

            // Intrinsic state. These don't change once created, so they can be omitted if we're
            // patching.

            if ( full || ! node.patchable ) {

                var intrinsics = this.intrinsics( nodeID ); // source, type

                var prototypeID = this.prototype( nodeID );

                if ( prototypeID === undefined ) {
                    nodeComponent.extends = null;
                } else if ( prototypeID !== nodeTypeURI ) {
                    nodeComponent.extends = this.getNode( prototypeID );  // TODO: move to vwf/model/object and get from intrinsics
                }

                nodeComponent.implements = this.behaviors( nodeID ).map( function( behaviorID ) {
                    return this.getNode( behaviorID );  // TODO: move to vwf/model/object and get from intrinsics
                }, this );

                nodeComponent.implements.length || delete nodeComponent.implements;

                if ( intrinsics.source !== undefined ) nodeComponent.source = intrinsics.source;
                if ( intrinsics.type !== undefined ) nodeComponent.type = intrinsics.type;

            }

            // Internal state.

            if ( full || ! node.patchable || patches.internals ) {

                var internals = this.models.object.internals( nodeID ); // sequence and random

                nodeComponent.sequence = internals.sequence;
                nodeComponent.random = internals.random;

            }

            // Suppress kernel reentry so that we can read the state without coloring from any
            // scripts.

            vwf.models.kernel.disable();

            // Properties.

            if ( full || ! node.patchable ) {

                // Want everything, or only want patches but the node is not patchable.

                nodeComponent.properties = this.getProperties( nodeID );

                for ( var propertyName in nodeComponent.properties ) {  // TODO: distinguish add, change, remove
                    if ( nodeComponent.properties[propertyName] === undefined ) {
                        delete nodeComponent.properties[propertyName];
                    }
                }

                if ( Object.keys( nodeComponent.properties ).length == 0 ) { 
                    delete nodeComponent.properties;
                } else {
                    patched = true;
                }

            } else if ( node.properties.changed ) {

                // The node is patchable and properties have changed.

                nodeComponent.properties = {};

                Object.keys( node.properties.changed ).forEach( function( propertyName ) {
                    nodeComponent.properties[propertyName] = this.getProperty( nodeID, propertyName );
                }, this );

                patched = true;

            }

            // Methods.

            // Because methods are much more data than properties, we only send them when patching
            if ( patches && patches.methods ) {
                var self = this;
                nodeComponent.methods = {};
                patches.methods.forEach( function( methodName ) {
                    var method = self.models.javascript.nodes[ nodeID ].methods.node.private.bodies[ methodName ];
                    if ( method )
                        nodeComponent.methods[ methodName ] = method.toString();
                } );

                if ( Object.keys( nodeComponent.methods ).length == 0 )
                    delete nodeComponent.methods;
                else
                    patched = true;
            }

            // Events.

            // nodeComponent.events = {};  // TODO

            // for ( var eventName in nodeComponent.events ) {
            //     nodeComponent.events[eventName] === undefined &&
            //         delete nodeComponent.events[eventName];
            // }

            // Object.keys( nodeComponent.events ).length ||
            //     delete nodeComponent.events;

            // Restore kernel reentry.

            vwf.models.kernel.enable();

            // Children.

            nodeComponent.children = {};

            this.children( nodeID ).forEach( function( childID ) {
                nodeComponent.children[ this.name( childID ) ] = this.getNode( childID, full );
            }, this );

            for ( var childName in nodeComponent.children ) {  // TODO: distinguish add, change, remove
                if ( nodeComponent.children[childName] === undefined ) {
                    delete nodeComponent.children[childName];
                }
            }

            if ( Object.keys( nodeComponent.children ).length == 0 ) { 
                delete nodeComponent.children;
            } else {
                patched = true;
            }

            // Scripts.

            // TODO: scripts

            // Normalize for consistency.

            if ( normalize ) {
                nodeComponent = require( "vwf/utility" ).transform(
                    nodeComponent, require( "vwf/utility" ).transforms.hash );
            }

            this.logger.debugu();

            // Return the descriptor created, unless it was arranged as a patch and there were no
            // changes. Otherwise, return the URI if this is the root of a URI component.

            if ( full || ! node.patchable || patched ) {
                return nodeComponent;
            } else if ( node.uri ) {
                return node.uri;
            } else {
                return undefined;
            }

        };

        // -- hashNode -----------------------------------------------------------------------------

        /// @name module:vwf.hashNode
        /// 
        /// @see {@link module:vwf/api/kernel.hashNode}

        this.hashNode = function( nodeID ) {  // TODO: works with patches?  // TODO: only for nodes from getNode( , , true )

            this.logger.debuggx( "hashNode", typeof nodeID == "object" ? nodeID.id : nodeID );

            var nodeComponent = typeof nodeID == "object" ? nodeID : this.getNode( nodeID, true, true );

            // Hash the intrinsic state.

            var internal = { id: nodeComponent.id, source: nodeComponent.source, type: nodeComponent.type };  // TODO: get subset same way as getNode() puts them in without calling out specific field names

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

            this.logger.debugu();

            // Generate the combined hash.

            return hashi + ( hashp ? "." + hashp : "" ) + ( hashc ? "/" + hashc : "" );
        };

        // -- createChild --------------------------------------------------------------------------

        /// When we arrive here, we have a prototype node in hand (by way of its ID) and an object
        /// containing a component specification. We now need to create and assemble the new node.
        /// 
        /// The VWF manager doesn't directly manipulate any node. The various models act in
        /// federation to create the greater model. The manager simply routes messages within the
        /// system to allow the models to maintain the necessary data. Additionally, the views
        /// receive similar messages that allow them to keep their interfaces current.
        ///
        /// To create a node, we simply assign a new ID, then invoke a notification on each model and
        /// a notification on each view.
        /// 
        /// createChild may complete asynchronously due to its dependence on createNode and the
        /// creatingNode and createdNode driver calls. To prevent actions from executing out of
        /// order, queue processing must be suspended while createChild is in progress. createNode
        /// and the driver callbacks suspend the queue when necessary, but additional calls to
        /// suspend and resume the queue may be needed if other async operations are added.
        /// 
        /// @name module:vwf.createChild
        /// 
        /// @see {@link module:vwf/api/kernel.createChild}

        this.createChild = function( nodeID, childName, childComponent, childURI, callback_async /* ( childID ) */ ) {

            this.logger.debuggx( "createChild", function() {
                return [ nodeID, childName, JSON.stringify( loggableComponent( childComponent ) ), childURI ];
            } );

            childComponent = normalizedComponent( childComponent );

            var child, childID, childIndex, childPrototypeID, childBehaviorIDs = [], deferredInitializations = {};

            // Determine if we're replicating previously-saved state, or creating a fresh object.

            var replicating = !! childComponent.id;

            // Allocate an ID for the node. IDs must be unique and consistent across all clients
            // sharing the same instance regardless of the component load order. Each node maintains
            // a sequence counter, and we allocate the ID based on the parent's sequence counter and
            // ID. Top-level nodes take the ID from their origin URI when available or from a hash
            // of the descriptor. An existing ID is used when synchronizing to state drawn from
            // another client or to a previously-saved state.

var useLegacyID = nodeID === 0 && childURI &&
    ( childURI == "index.vwf" || childURI == "appscene.vwf" || childURI.indexOf( "http://vwf.example.com/" ) == 0 ) &&
    childURI != "http://vwf.example.com/node.vwf";
    
useLegacyID = useLegacyID ||
    nodeID == applicationID && childName == "camera"; // TODO: fix static ID references and remove; model/glge still expects a static ID for the camera

            if ( childComponent.id ) {  // incoming replication: pre-calculated id
                childID = childComponent.id;
                childIndex = this.children( nodeID ).length;
            } else if ( nodeID === 0 ) {  // global: component's URI or hash of its descriptor
                childID = childURI ||
                    Crypto.MD5( JSON.stringify( childComponent ) ).toString();  // TODO: MD5 may be too slow here
if ( useLegacyID ) {  // TODO: fix static ID references and remove
    childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" );  // TODO: fix static ID references and remove
}
                childIndex = childURI;
            } else {  // descendant: parent id + next from parent's sequence
if ( useLegacyID ) {  // TODO: fix static ID references and remove
    childID = ( childComponent.extends || nodeTypeURI ) + "." + childName;  // TODO: fix static ID references and remove
    childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" );  // TODO: fix static ID references and remove
    childIndex = this.children( nodeID ).length;
} else {    
                childID = nodeID + ":" + this.sequence( nodeID ) +
                    ( this.configuration["randomize-ids"] ? "-" + ( "0" + Math.floor( this.random( nodeID ) * 100 ) ).slice( -2 ) : "" ) +
                    ( this.configuration["humanize-ids"] ? "-" + childName.replace( /[^0-9A-Za-z_-]+/g, "-" ) : "" );
                childIndex = this.children( nodeID ).length;
}
            }

            // Record the application root ID. The application is the first global node annotated as
            // "application".

            if ( nodeID === 0 && childName == "application" && ! applicationID ) {
                applicationID = childID;
            }

            // Register the node.

            child = nodes.create( childID, childPrototypeID, childBehaviorIDs, childURI, childName, nodeID );

            // Register the node in vwf/model/object. Since the kernel delegates many node
            // information functions to vwf/model/object, this serves to register it with the
            // kernel. The node must be registered before any async operations occur to ensure that
            // the parent's child list is correct when following siblings calculate their index
            // numbers.

            vwf.models.object.creatingNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                childComponent.source, childComponent.type, childIndex, childName );  // TODO: move node metadata back to the kernel and only use vwf/model/object just as a property store?

            // Construct the node.

            async.series( [

                function( series_callback_async /* ( err, results ) */ ) {

                    // Rudimentary support for `{ includes: prototype }`, which absorbs a prototype
                    // descriptor into the child descriptor before creating the child. See the notes
                    // in `createNode` and the `mergeDescriptors` limitations.

                    // This first task always completes asynchronously (even if it doesn't perform
                    // an async operation) so that the stack doesn't grow from node to node while
                    // createChild() recursively traverses a component. If this task is moved,
                    // replace it with an async stub, or make the next task exclusively async.

                    if ( componentIsDescriptor( childComponent ) && childComponent.includes && componentIsURI( childComponent.includes ) ) {  // TODO: for "includes:", accept an already-loaded component (which componentIsURI exludes) since the descriptor will be loaded again

                        var prototypeURI = childComponent.includes;

                        var sync = true; // will loadComponent() complete synchronously?

                        loadComponent( prototypeURI, function( prototypeDescriptor ) /* async */ {

                            childComponent = mergeDescriptors( childComponent, prototypeDescriptor ); // modifies prototypeDescriptor

                            if ( sync ) {

                                queue.suspend( "before beginning " + childID ); // suspend the queue

                                async.nextTick( function() {
                                    series_callback_async( undefined, undefined );
                                    queue.resume( "after beginning " + childID ); // resume the queue; may invoke dispatch(), so call last before returning to the host
                                } );

                            } else {
                                series_callback_async( undefined, undefined );
                            }

                        } );

                        sync = false; // not if we got here first

                    } else {

                        queue.suspend( "before beginning " + childID ); // suspend the queue

                        async.nextTick( function() {
                            series_callback_async( undefined, undefined );
                            queue.resume( "after beginning " + childID ); // resume the queue; may invoke dispatch(), so call last before returning to the host
                        } );

                    }

                },

                function( series_callback_async /* ( err, results ) */ ) {

                    // Create the prototype and behavior nodes (or locate previously created
                    // instances).

                    async.parallel( [

                        function( parallel_callback_async /* ( err, results ) */ ) {

                            // Create or find the prototype and save the ID in childPrototypeID.

                            if ( childComponent.extends !== null ) {  // TODO: any way to prevent node loading node as a prototype without having an explicit null prototype attribute in node?
                                vwf.createNode( childComponent.extends || nodeTypeURI, function( prototypeID ) /* async */ {
                                    childPrototypeID = prototypeID;

// TODO: the GLGE driver doesn't handle source/type or properties in prototypes properly; as a work-around pull those up into the component when not already defined
if ( ! childComponent.source ) {
    var prototype_intrinsics = vwf.intrinsics( prototypeID );
    if ( prototype_intrinsics.source ) {
        var prototype_uri = vwf.uri( prototypeID );
        var prototype_properties = vwf.getProperties( prototypeID );
        childComponent.source = require( "vwf/utility" ).resolveURI( prototype_intrinsics.source, prototype_uri );
        childComponent.type = prototype_intrinsics.type;
        childComponent.properties = childComponent.properties || {};
        Object.keys( prototype_properties ).forEach( function( prototype_property_name ) {
            if ( childComponent.properties[prototype_property_name] === undefined && prototype_property_name != "transform" ) {
                childComponent.properties[prototype_property_name] = prototype_properties[prototype_property_name];
            }
        } );
    }
}
                                    parallel_callback_async( undefined, undefined );
                                } );
                            } else {
                                childPrototypeID = undefined;
                                parallel_callback_async( undefined, undefined );
                            }

                        },

                        function( parallel_callback_async /* ( err, results ) */ ) {

                            // Create or find the behaviors and save the IDs in childBehaviorIDs.

                            var behaviorComponents = childComponent.implements ?
                                [].concat( childComponent.implements ) : []; // accept either an array or a single item

                            async.map( behaviorComponents, function( behaviorComponent, map_callback_async /* ( err, result ) */ ) {
                                vwf.createNode( behaviorComponent, function( behaviorID ) /* async */ {
                                    map_callback_async( undefined, behaviorID );
                                } );
                            }, function( err, behaviorIDs ) /* async */ {
                                childBehaviorIDs = behaviorIDs;
                                parallel_callback_async( err, undefined );
                            } );

                        },

                    ], function( err, results ) /* async */ {
                        series_callback_async( err, undefined );
                    } );

                },

                function( series_callback_async /* ( err, results ) */ ) {

                    // Re-register the node now that we have the prototypes and behaviors.

                    child = nodes.create( childID, childPrototypeID, childBehaviorIDs, childURI, childName, nodeID );

                    // Re-register the node in vwf/model/object now that we have the prototypes and
                    // behaviors. vwf/model/object knows that we call it more than once and only
                    // updates the new information.

                    vwf.models.object.creatingNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                        childComponent.source, childComponent.type, childIndex, childName );  // TODO: move node metadata back to the kernel and only use vwf/model/object just as a property store?

                    // Call creatingNode() on each model. The node is considered to be constructed
                    // after all models have run.

                    async.forEachSeries( vwf.models, function( model, each_callback_async /* ( err ) */ ) {

                        var driver_ready = true;

                        // TODO: suppress kernel reentry here (just for childID?) with kernel/model showing a warning when breached; no actions are allowed until all drivers have seen creatingNode()

                        model.creatingNode && model.creatingNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                                childComponent.source, childComponent.type, childIndex, childName, function( ready ) /* async */ {

                            if ( driver_ready && ! ready ) {
                                queue.suspend( "while loading " + childComponent.source + " for " + childID + " in creatingNode" ); // suspend the queue
                                driver_ready = false;
                            } else if ( ! driver_ready && ready ) {
                                each_callback_async( undefined ); // resume createChild()
                                queue.resume( "after loading " + childComponent.source + " for " + childID + " in creatingNode" ); // resume the queue; may invoke dispatch(), so call last before returning to the host
                                driver_ready = true;
                            }

                        } );

                        // TODO: restore kernel reentry here

                        driver_ready && each_callback_async( undefined );

                    }, function( err ) /* async */ {
                        series_callback_async( err, undefined );
                    } );

                },

                function( series_callback_async /* ( err, results ) */ ) {

                    // Call createdNode() on each view. The view is being notified of a node that has
                    // been constructed.

                    async.forEach( vwf.views, function( view, each_callback_async /* ( err ) */ ) {

                        var driver_ready = true;

                        view.createdNode && view.createdNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                                childComponent.source, childComponent.type, childIndex, childName, function( ready ) /* async */ {

                            if ( driver_ready && ! ready ) {
                                queue.suspend( "while loading " + childComponent.source + " for " + childID + " in createdNode" ); // suspend the queue
                                driver_ready = false;
                            } else if ( ! driver_ready && ready ) {
                                each_callback_async( undefined ); // resume createChild()
                                queue.resume( "after loading " + childComponent.source + " for " + childID + " in createdNode" ); // resume the queue; may invoke dispatch(), so call last before returning to the host
                                driver_ready = true;
                            }

                        } );

                        driver_ready && each_callback_async( undefined );

                    }, function( err ) /* async */ {
                        series_callback_async( err, undefined );
                    } );

                },

                function( series_callback_async /* ( err, results ) */ ) {

                    // Set the internal state.

                    vwf.models.object.internals( childID, childComponent );

                    // Suppress kernel reentry so that we can read the state without coloring from
                    // any scripts.

                    replicating && vwf.models.kernel.disable();

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
                            ! child.properties.has( propertyName );  // not defined on prototype

                        // Are we assigning the value here, or deferring assignment until the node
                        // is constructed because setters will run?

                        var assigning = value === undefined || // no value, or
                            set === undefined && ( creating || ! nodePropertyHasSetter.call( vwf, childID, propertyName ) ) || // no setter, or
                            replicating; // replicating previously-saved state (setters never run during replication)

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
                            vwf.createEvent( childID, eventName, eventValue.parameters );
                        } else {
                            vwf.createEvent( childID, eventName, undefined );
                        }

                    } );

                    // Restore kernel reentry.

                    replicating && vwf.models.kernel.enable();

                    // Create and attach the children. For each child, call createChild() with the
                    // child's component specification. createChild() delegates to the models and
                    // views as before.

                    async.forEach( Object.keys( childComponent.children || {} ), function( childName, each_callback_async /* ( err ) */ ) {
                        var childValue = childComponent.children[childName];

                        vwf.createChild( childID, childName, childValue, undefined, function( childID ) /* async */ {  // TODO: add in original order from childComponent.children  // TODO: propagate childURI + fragment identifier to children of a URI component?
                            each_callback_async( undefined );
                        } );

                    }, function( err ) /* async */ {
                        series_callback_async( err, undefined );
                    } );

                },

                function( series_callback_async /* ( err, results ) */ ) {

                    // Attach the scripts. For each script, load the network resource if the script is
                    // specified as a URI, then once loaded, call execute() to direct any model that
                    // manages scripts of this script's type to evaluate the script where it will
                    // perform any immediate actions and retain any callbacks as appropriate for the
                    // script type.

                    var scripts = childComponent.scripts ?
                        [].concat( childComponent.scripts ) : []; // accept either an array or a single item

                    async.map( scripts, function( script, map_callback_async /* ( err, result ) */ ) {

                        if ( valueHasType( script ) ) {
                            if ( script.source ) {
                                loadScript( script.source, function( scriptText ) /* async */ {  // TODO: this load would be better left to the driver, which may want to ignore it in certain cases, but that would require a completion callback from kernel.execute()
                                    map_callback_async( undefined, { text: scriptText, type: script.type } );
                                } );
                            } else {
                                map_callback_async( undefined, { text: script.text, type: script.type } );
                            }
                        } else {
                            map_callback_async( undefined, { text: script, type: undefined } );
                        }

                    }, function( err, scripts ) /* async */ {

                        // Watch for any async kernel calls generated as we run the scripts and wait for
                        // them complete before completing the node.

                        vwf.models.kernel.capturingAsyncs( function() {

                            // Suppress kernel reentry so that initialization functions don't make any
                            // changes during replication.

                            replicating && vwf.models.kernel.disable();

                            // Create each script.

                            scripts.forEach( function( script ) {
                                vwf.execute( childID, script.text, script.type ); // TODO: callback
                            } );

                            // Perform initializations for properties with setter functions. These are
                            // assigned here so that the setters run on a fully-constructed node.

                            Object.keys( deferredInitializations ).forEach( function( propertyName ) {
                                vwf.setProperty( childID, propertyName, deferredInitializations[propertyName] );
                            } );

                            // TODO: Adding the node to the tickable list here if it contains a tick() function in JavaScript at initialization time. Replace with better control of ticks on/off and the interval by the node.

                            if ( vwf.execute( childID, "Boolean( this.tick )" ) ) {
                                vwf.tickable.nodeIDs.push( childID );
                            }

                            // Call initializingNode() on each model and initializedNode() on each view to
                            // indicate that the node is fully constructed.

                            vwf.models.forEach( function( model ) {
                                model.initializingNode && model.initializingNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                                    childComponent.source, childComponent.type, childIndex, childName );
                            } );

                            vwf.views.forEach( function( view ) {
                                view.initializedNode && view.initializedNode( nodeID, childID, childPrototypeID, childBehaviorIDs,
                                    childComponent.source, childComponent.type, childIndex, childName );
                            } );

                            // Restore kernel reentry.

                            replicating && vwf.models.kernel.enable();

                        }, function() {

                            // Mark the node as initialized.
                            nodes.initialize( childID );

                            series_callback_async( err, undefined );

                        } );

                    } );

                },

            ], function( err, results ) /* async */ {

                // The node is complete. Invoke the callback method and pass the new node ID and the
                // ID of its prototype. If this was the root node for the application, the
                // application is now fully initialized.

                // Always complete asynchronously so that the stack doesn't grow from node to node
                // while createChild() recursively traverses a component.

                if ( callback_async ) {

                    queue.suspend( "before completing " + childID ); // suspend the queue

                    async.nextTick( function() {
                        callback_async( childID );
                        queue.resume( "after completing " + childID ); // resume the queue; may invoke dispatch(), so call last before returning to the host
                    } );

                }

            } );

            this.logger.debugu();
        };

        // -- deleteChild --------------------------------------------------------------------------

        /// @name module:vwf.deleteChild
        /// 
        /// @see {@link module:vwf/api/kernel.deleteChild}

        this.deleteChild = function( nodeID, childName ) {

            var childID = this.children( nodeID ).filter( function( childID ) {
                return this.name( childID ) === childName;
            }, this )[0];

            if ( childID !== undefined ) {
                return this.deleteNode( childID );
            }

        }

        // -- addChild -----------------------------------------------------------------------------

        /// @name module:vwf.addChild
        /// 
        /// @see {@link module:vwf/api/kernel.addChild}

        this.addChild = function( nodeID, childID, childName ) {

            this.logger.debuggx( "addChild", nodeID, childID, childName );

            // Call addingChild() on each model. The child is considered added after all models have
            // run.

            this.models.forEach( function( model ) {
                model.addingChild && model.addingChild( nodeID, childID, childName );
            } );

            // Call addedChild() on each view. The view is being notified that a child has been
            // added.

            this.views.forEach( function( view ) {
                view.addedChild && view.addedChild( nodeID, childID, childName );
            } );

            this.logger.debugu();
        };

        // -- removeChild --------------------------------------------------------------------------

        /// @name module:vwf.removeChild
        /// 
        /// @see {@link module:vwf/api/kernel.removeChild}

        this.removeChild = function( nodeID, childID ) {

            this.logger.debuggx( "removeChild", nodeID, childID );

            // Call removingChild() on each model. The child is considered removed after all models
            // have run.

            this.models.forEach( function( model ) {
                model.removingChild && model.removingChild( nodeID, childID );
            } );

            // Call removedChild() on each view. The view is being notified that a child has been
            // removed.

            this.views.forEach( function( view ) {
                view.removedChild && view.removedChild( nodeID, childID );
            } );

            this.logger.debugu();
        };

        // -- setProperties ------------------------------------------------------------------------

        /// Set all of the properties for a node.
        /// 
        /// @name module:vwf.setProperties
        /// 
        /// @see {@link module:vwf/api/kernel.setProperties}

        this.setProperties = function( nodeID, properties ) {  // TODO: rework as a cover for setProperty(), or remove; passing all properties to each driver is impractical since initializing and setting are different, and reentry can't be controlled when multiple sets are in progress.

            this.logger.debuggx( "setProperties", nodeID, properties );

            var node = nodes.existing[nodeID];

            var entrants = this.setProperty.entrants;

            // Call settingProperties() on each model.

            properties = this.models.reduceRight( function( intermediate_properties, model, index ) {  // TODO: note that we can't go left to right and stop after the first that accepts the set since we are setting all of the properties as a batch; verify that this creates the same result as calling setProperty individually on each property and that there are no side effects from setting through a driver after the one that handles the set.

                var model_properties = {};

                if ( model.settingProperties ) {

                    model_properties = model.settingProperties( nodeID, properties );

                } else if ( model.settingProperty ) {

                    Object.keys( node.properties.existing ).forEach( function( propertyName ) {

                        if ( properties[propertyName] !== undefined ) {

                            var reentry = entrants[nodeID+'-'+propertyName] = { index: index }; // the active model number from this call  // TODO: need unique nodeID+propertyName hash

                            model_properties[propertyName] =
                                model.settingProperty( nodeID, propertyName, properties[propertyName] );
                            if ( vwf.models.kernel.blocked() ) {
                                model_properties[propertyName] = undefined; // ignore result from a blocked setter
                            }

                            delete entrants[nodeID+'-'+propertyName];

                        }

                    } );

                }

                Object.keys( node.properties.existing ).forEach( function( propertyName ) {
                    if ( model_properties[propertyName] !== undefined ) { // copy values from this model
                        intermediate_properties[propertyName] = model_properties[propertyName];
                    } else if ( intermediate_properties[propertyName] === undefined ) { // as well as recording any new keys
                        intermediate_properties[propertyName] = undefined;
                    }
                } );

                return intermediate_properties;

            }, {} );

            // Record the change.

            if ( node.initialized && node.patchable ) {
                Object.keys( properties ).forEach( function( propertyName ) {
                    node.properties.change( propertyName );
                } );
            }

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

            this.logger.debugu();

            return properties;
        };

        // -- getProperties ------------------------------------------------------------------------

        /// Get all of the properties for a node.
        /// 
        /// @name module:vwf.getProperties
        /// 
        /// @see {@link module:vwf/api/kernel.getProperties}

        this.getProperties = function( nodeID ) {  // TODO: rework as a cover for getProperty(), or remove; passing all properties to each driver is impractical since reentry can't be controlled when multiple gets are in progress.

            this.logger.debuggx( "getProperties", nodeID );

            var node = nodes.existing[nodeID];

            var entrants = this.getProperty.entrants;

            // Call gettingProperties() on each model.

            var properties = this.models.reduceRight( function( intermediate_properties, model, index ) {  // TODO: note that we can't go left to right and take the first result since we are getting all of the properties as a batch; verify that this creates the same result as calling getProperty individually on each property and that there are no side effects from getting through a driver after the one that handles the get.

                var model_properties = {};

                if ( model.gettingProperties ) {

                    model_properties = model.gettingProperties( nodeID, properties );

                } else if ( model.gettingProperty ) {

                    Object.keys( node.properties.existing ).forEach( function( propertyName ) {

                        var reentry = entrants[nodeID+'-'+propertyName] = { index: index }; // the active model number from this call  // TODO: need unique nodeID+propertyName hash

                        model_properties[propertyName] =
                            model.gettingProperty( nodeID, propertyName, intermediate_properties[propertyName] );
                        if ( vwf.models.kernel.blocked() ) {
                            model_properties[propertyName] = undefined; // ignore result from a blocked getter
                        }

                        delete entrants[nodeID+'-'+propertyName];

                    } );

                }

                Object.keys( node.properties.existing ).forEach( function( propertyName ) {
                    if ( model_properties[propertyName] !== undefined ) { // copy values from this model
                        intermediate_properties[propertyName] = model_properties[propertyName];
                    } else if ( intermediate_properties[propertyName] === undefined ) { // as well as recording any new keys
                        intermediate_properties[propertyName] = undefined;
                    }
                } );

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

            this.logger.debugu();

            return properties;
        };

        // -- createProperty -----------------------------------------------------------------------

        /// Create a property on a node and assign an initial value.
        /// 
        /// @name module:vwf.createProperty
        /// 
        /// @see {@link module:vwf/api/kernel.createProperty}

        this.createProperty = function( nodeID, propertyName, propertyValue, propertyGet, propertySet ) {

            this.logger.debuggx( "createProperty", function() {
                return [ nodeID, propertyName, JSON.stringify( loggableValue( propertyValue ) ) ];  // TODO: add truncated propertyGet, propertySet to log
            } );

            var node = nodes.existing[nodeID];

            // Register the property.

            node.properties.create( propertyName );

            // Call creatingProperty() on each model. The property is considered created after all
            // models have run.

            this.models.forEach( function( model ) {
                model.creatingProperty && model.creatingProperty( nodeID, propertyName, propertyValue, propertyGet, propertySet );
            } );

            // Record the change.

            if ( node.initialized && node.patchable ) {
                node.properties.change( propertyName );
            }

            // Call createdProperty() on each view. The view is being notified that a property has
            // been created.

            this.views.forEach( function( view ) {
                view.createdProperty && view.createdProperty( nodeID, propertyName, propertyValue, propertyGet, propertySet );
            } );

            this.logger.debugu();

            return propertyValue;
        };

        // -- setProperty --------------------------------------------------------------------------

        /// Set a property value on a node.
        /// 
        /// @name module:vwf.setProperty
        /// 
        /// @see {@link module:vwf/api/kernel.setProperty}

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

            this.logger.debuggx( "setProperty", function() {
                return [ nodeID, propertyName, JSON.stringify( loggableValue( propertyValue ) ) ];
            } );

            var node = nodes.existing[nodeID];

            // Record calls into this function by nodeID and propertyName so that models may call
            // back here (directly or indirectly) to delegate responses further down the chain
            // without causing infinite recursion.

            var entrants = this.setProperty.entrants;

            var entry = entrants[nodeID+'-'+propertyName] || {}; // the most recent call, if any  // TODO: need unique nodeID+propertyName hash
            var reentry = entrants[nodeID+'-'+propertyName] = {}; // this call

            // Select the actual driver calls. Create the property if it doesn't exist on this node
            // or its prototypes. Initialize it if it exists on a prototype but not on this node.
            // Set it if it already exists on this node.

            if ( ! node.properties.has( propertyName ) || entry.creating ) {
                reentry.creating = true;
                var settingPropertyEtc = "creatingProperty";
                var satPropertyEtc = "createdProperty";
                node.properties.create( propertyName );
            } else if ( ! node.properties.hasOwn( propertyName ) || entry.initializing ) {
                reentry.initializing = true;
                var settingPropertyEtc = "initializingProperty";
                var satPropertyEtc = "initializedProperty";
                node.properties.create( propertyName );
            } else {
                var settingPropertyEtc = "settingProperty";
                var satPropertyEtc = "satProperty";
            }

            // Keep track of the number of assignments made by this `setProperty` call and others
            // invoked indirectly by it, starting with the outermost call.

            var outermost = entrants.assignments === undefined;

            if ( outermost ) {
                entrants.assignments = 0;
            }

            // Have we been called for the same property on the same node for a property still being
            // assigned (such as when a setter function assigns the property to itself)? If so, then
            // the inner call should skip drivers that the outer call has already invoked, and the
            // outer call should complete without invoking drivers that the inner call will have
            // already called.

            var reentered = ( entry.index !== undefined );

            // We'll need to know if the set was delegated to other properties or actually assigned
            // here.

            var delegated = false, assigned = false;

            // Call settingProperty() on each model. The first model to return a non-undefined value
            // has performed the set and dictates the return value. The property is considered set
            // after all models have run.

            this.models.some( function( model, index ) {

                // Skip initial models that an outer call has already invoked for this node and
                // property (if any). If an inner call completed for this node and property, skip
                // the remaining models.

                if ( ( ! reentered || index > entry.index ) && ! reentry.completed ) {

                    // Record the active model number.
 
                    reentry.index = index;

                    // Record the number of assignments made since the outermost call. When
                    // `entrants.assignments` increases, a driver has called `setProperty` to make
                    // an assignment elsewhere.

                    var assignments = entrants.assignments;

                    // Make the call.

                    if ( ! delegated && ! assigned ) {
                        var value = model[settingPropertyEtc] && model[settingPropertyEtc]( nodeID, propertyName, propertyValue );
                    } else {
                        model[settingPropertyEtc] && model[settingPropertyEtc]( nodeID, propertyName, undefined );
                    }

                    // Ignore the result if reentry is disabled and the driver attempted to call
                    // back into the kernel. Kernel reentry is disabled during replication to 
                    // prevent coloring from accessor scripts.

                    if ( this.models.kernel.blocked() ) {  // TODO: this might be better handled wholly in vwf/kernel/model by converting to a stage and clearing blocked results on the return
                        value = undefined;
                    }

                    // The property was delegated if the call made any assignments.

                    if ( entrants.assignments !== assignments ) {
                        delegated = true;
                    }

                    // Otherwise if the call returned a value, the property was assigned here.

                    else if ( value !== undefined ) {
                        entrants.assignments++;
                        assigned = true;
                    }

                    // Record the value actually assigned. This may differ from the incoming value
                    // if it was range limited, quantized, etc. by the model. This is the value
                    // passed to the views.

                    if ( value !== undefined ) {
                        propertyValue = value;
                    }

                    // If we are setting, exit from the this.models.some() iterator once the value
                    // has been set. Don't exit early if we are creating or initializing since every
                    // model needs the opportunity to register the property.

                    return settingPropertyEtc == "settingProperty" && ( delegated || assigned );
                }

            }, this );

            // Record the change if the property was assigned here.

            if ( assigned && node.initialized && node.patchable ) {
                node.properties.change( propertyName );
            }

            // Call satProperty() on each view. The view is being notified that a property has
            // been set. Only call for value properties as they are actually assigned. Don't call
            // for accessor properties that have delegated to other properties. Notifying when
            // setting an accessor property would be useful, but since that information is
            // ephemeral, and views on late-joining clients would never see it, it's best to never
            // send those notifications.

            if ( assigned ) {
                this.views.forEach( function( view ) {
                    view[satPropertyEtc] && view[satPropertyEtc]( nodeID, propertyName, propertyValue );
                } );
            }

            // For a reentrant call, restore the previous state, move the index forward to cover
            // the models we called.

            if ( reentered ) {
                entrants[nodeID+'-'+propertyName] = entry;
                entry.completed = true;
            }

            // Delete the call record if this is the first, non-reentrant call here (the normal
            // case).

            else {
                delete entrants[nodeID+'-'+propertyName];
            }

            // Clear the assignment counter when the outermost `setProperty` completes.

            if ( outermost ) {
                delete entrants.assignments;
            }

            this.logger.debugu();

            return propertyValue;
        };

        this.setProperty.entrants = {}; // maps ( nodeID + '-' + propertyName ) => { index: i, value: v }

        // -- getProperty --------------------------------------------------------------------------

        /// Get a property value for a node.
        /// 
        /// @name module:vwf.getProperty
        /// 
        /// @see {@link module:vwf/api/kernel.getProperty}

        this.getProperty = function( nodeID, propertyName, ignorePrototype ) {

            this.logger.debuggx( "getProperty", nodeID, propertyName );

            var propertyValue = undefined;

            // Record calls into this function by nodeID and propertyName so that models may call
            // back here (directly or indirectly) to delegate responses further down the chain
            // without causing infinite recursion.

            var entrants = this.getProperty.entrants;

            var entry = entrants[nodeID+'-'+propertyName] || {}; // the most recent call, if any  // TODO: need unique nodeID+propertyName hash
            var reentry = entrants[nodeID+'-'+propertyName] = {}; // this call

            // Keep track of the number of retrievals made by this `getProperty` call and others
            // invoked indirectly by it, starting with the outermost call.

            var outermost = entrants.retrievals === undefined;

            if ( outermost ) {
                entrants.retrievals = 0;
            }

            // Have we been called for the same property on the same node for a property still being
            // retrieved (such as when a getter function retrieves the property from itself)? If so,
            // then the inner call should skip drivers that the outer call has already invoked, and
            // the outer call should complete without invoking drivers that the inner call will have
            // already called.

            var reentered = ( entry.index !== undefined );

            // We'll need to know if the get was delegated to other properties or actually retrieved
            // here.

            var delegated = false, retrieved = false;

            // Call gettingProperty() on each model. The first model to return a non-undefined value
            // dictates the return value.

            this.models.some( function( model, index ) {

                // Skip initial models that an outer call has already invoked for this node and
                // property (if any). If an inner call completed for this node and property, skip
                // the remaining models.

                if ( ( ! reentered || index > entry.index ) && ! reentry.completed ) {

                    // Record the active model number.
 
                    reentry.index = index;

                    // Record the number of retrievals made since the outermost call. When
                    // `entrants.retrievals` increases, a driver has called `getProperty` to make
                    // a retrieval elsewhere.

                    var retrievals = entrants.retrievals;

                    // Make the call.

                    var value = model.gettingProperty &&
                        model.gettingProperty( nodeID, propertyName, propertyValue );  // TODO: probably don't need propertyValue here

                    // Ignore the result if reentry is disabled and the driver attempted to call
                    // back into the kernel. Kernel reentry is disabled during replication to 
                    // prevent coloring from accessor scripts.

                    if ( this.models.kernel.blocked() ) {  // TODO: this might be better handled wholly in vwf/kernel/model by converting to a stage and clearing blocked results on the return
                        value = undefined;
                    }

                    // The property was delegated if the call made any retrievals.

                    if ( entrants.retrievals !== retrievals ) {
                        delegated = true;
                    }

                    // Otherwise if the call returned a value, the property was retrieved here.

                    else if ( value !== undefined ) {
                        entrants.retrievals++;
                        retrieved = true;
                    }

                    // Record the value retrieved.

                    if ( value !== undefined ) {
                        propertyValue = value;
                    }

                    // Exit from the this.models.some() iterator once we have a return value.

                    return delegated || retrieved;
                }

            }, this );

            if ( reentered ) {

                // For a reentrant call, restore the previous state, move the index forward to cover
                // the models we called.

                entrants[nodeID+'-'+propertyName] = entry;
                entry.completed = true;

            } else {

                // Delete the call record if this is the first, non-reentrant call here (the normal
                // case).

                delete entrants[nodeID+'-'+propertyName];

                // Delegate to the behaviors and prototype if we didn't get a result from the
                // current node.

                if ( propertyValue === undefined && ! ignorePrototype ) {

                    this.behaviors( nodeID ).reverse().concat( this.prototype( nodeID ) ).
                        some( function( prototypeID, prototypeIndex, prototypeArray ) {

                        if ( prototypeIndex < prototypeArray.length - 1 ) {
                            propertyValue = this.getProperty( prototypeID, propertyName, true ); // behavior node only, not its prototypes
                        } else if ( prototypeID !== nodeTypeURI ) {
                            propertyValue = this.getProperty( prototypeID, propertyName ); // prototype node, recursively
                        }

                        return propertyValue !== undefined;

                    }, this );

                }

                // Call gotProperty() on each view.

                this.views.forEach( function( view ) {
                    view.gotProperty && view.gotProperty( nodeID, propertyName, propertyValue );  // TODO: be sure this is the value actually gotten and not an intermediate value from above
                } );

            }

            // Clear the retrieval counter when the outermost `getProperty` completes.

            if ( outermost ) {
                delete entrants.retrievals;
            }

            this.logger.debugu();

            return propertyValue;
        };

        this.getProperty.entrants = {}; // maps ( nodeID + '-' + propertyName ) => { index: i, value: v }

        // -- createMethod -------------------------------------------------------------------------

        /// @name module:vwf.createMethod
        /// 
        /// @see {@link module:vwf/api/kernel.createMethod}

        this.createMethod = function( nodeID, methodName, methodParameters, methodBody ) {

            this.logger.debuggx( "createMethod", nodeID, methodName, methodParameters );

            // Call creatingMethod() on each model. The method is considered created after all
            // models have run.

            this.models.forEach( function( model ) {
                model.creatingMethod && model.creatingMethod( nodeID, methodName, methodParameters, methodBody );
            } );

            // Call createdMethod() on each view. The view is being notified that a method has been
            // created.

            this.views.forEach( function( view ) {
                view.createdMethod && view.createdMethod( nodeID, methodName, methodParameters, methodBody );
            } );

            this.logger.debugu();
        };

        // -- callMethod ---------------------------------------------------------------------------

        /// @name module:vwf.callMethod
        /// 
        /// @see {@link module:vwf/api/kernel.callMethod}

        this.callMethod = function( nodeID, methodName, methodParameters ) {

            this.logger.debuggx( "callMethod", function() {
                return [ nodeID, methodName, JSON.stringify( loggableValues( methodParameters ) ) ];
            } );

            // Call callingMethod() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var methodValue = undefined;

            this.models.forEach( function( model ) {
                var value = model.callingMethod && model.callingMethod( nodeID, methodName, methodParameters, methodValue );
                methodValue = value !== undefined ? value : methodValue;
            } );

            // Call calledMethod() on each view.

            this.views.forEach( function( view ) {
                view.calledMethod && view.calledMethod( nodeID, methodName, methodParameters, methodValue );
            } );

            this.logger.debugu();

            return methodValue;
        };

        // -- createEvent --------------------------------------------------------------------------

        /// @name module:vwf.creatEvent
        /// 
        /// @see {@link module:vwf/api/kernel.createEvent}

        this.createEvent = function( nodeID, eventName, eventParameters ) {  // TODO: parameters (used? or just for annotation?)  // TODO: allow a handler body here and treat as this.*event* = function() {} (a self-targeted handler); will help with ui event handlers

            this.logger.debuggx( "createEvent", nodeID, eventName, eventParameters );

            // Call creatingEvent() on each model. The event is considered created after all models
            // have run.

            this.models.forEach( function( model ) {
                model.creatingEvent && model.creatingEvent( nodeID, eventName, eventParameters );
            } );

            // Call createdEvent() on each view. The view is being notified that a event has been
            // created.

            this.views.forEach( function( view ) {
                view.createdEvent && view.createdEvent( nodeID, eventName, eventParameters );
            } );

            this.logger.debugu();
        };

        // -- fireEvent ----------------------------------------------------------------------------

        /// @name module:vwf.fireEvent
        /// 
        /// @see {@link module:vwf/api/kernel.fireEvent}

        this.fireEvent = function( nodeID, eventName, eventParameters ) {

            this.logger.debuggx( "fireEvent", function() {
                return [ nodeID, eventName, JSON.stringify( loggableValues( eventParameters ) ) ];
            } );

            // Call firingEvent() on each model.

            var handled = this.models.reduce( function( handled, model ) {
                return model.firingEvent && model.firingEvent( nodeID, eventName, eventParameters ) || handled;
            }, false );

            // Call firedEvent() on each view.

            this.views.forEach( function( view ) {
                view.firedEvent && view.firedEvent( nodeID, eventName, eventParameters );
            } );

            this.logger.debugu();

            return handled;
        };

        // -- dispatchEvent ------------------------------------------------------------------------

        /// Dispatch an event toward a node. Using fireEvent(), capture (down) and bubble (up) along
        /// the path from the global root to the node. Cancel when one of the handlers returns a
        /// truthy value to indicate that it has handled the event.
        /// 
        /// @name module:vwf.dispatchEvent
        /// 
        /// @see {@link module:vwf/api/kernel.dispatchEvent}

        this.dispatchEvent = function( nodeID, eventName, eventParameters, eventNodeParameters ) {

            this.logger.debuggx( "dispatchEvent", function() {
                return [ nodeID, eventName, JSON.stringify( loggableValues( eventParameters ) ),
                    JSON.stringify( loggableIndexedValues( eventNodeParameters ) ) ];
            } );

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

            this.logger.debugu();
        };

        // -- execute ------------------------------------------------------------------------------

        /// @name module:vwf.execute
        /// 
        /// @see {@link module:vwf/api/kernel.execute}

        this.execute = function( nodeID, scriptText, scriptType ) {

            this.logger.debuggx( "execute", function() {
                return [ nodeID, ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType ];  // TODO: loggableScript()
            } );

            // Assume JavaScript if the type is not specified and the text is a string.

            if ( ! scriptType && ( typeof scriptText == "string" || scriptText instanceof String ) ) {
                scriptType = "application/javascript";
            }

            // Call executing() on each model. The script is considered executed after all models
            // have run.

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

            this.logger.debugu();

            return scriptValue;
        };

        // -- random -------------------------------------------------------------------------------

        /// @name module:vwf.random
        /// 
        /// @see {@link module:vwf/api/kernel.random}

        this.random = function( nodeID ) {
            return this.models.object.random( nodeID );
        };

        // -- seed ---------------------------------------------------------------------------------

        /// @name module:vwf.seed
        /// 
        /// @see {@link module:vwf/api/kernel.seed}

        this.seed = function( nodeID, seed ) {
            return this.models.object.seed( nodeID, seed );
        };

        // -- time ---------------------------------------------------------------------------------

        /// The current simulation time.
        /// 
        /// @name module:vwf.time
        /// 
        /// @see {@link module:vwf/api/kernel.time}

        this.time = function() {
            return this.now;
        };

        // -- client -------------------------------------------------------------------------------

        /// The moniker of the client responsible for the current action. Will be falsy for actions
        /// originating in the server, such as time ticks.
        /// 
        /// @name module:vwf.client
        /// 
        /// @see {@link module:vwf/api/kernel.client}

        this.client = function() {
            return this.client_;
        };

        // -- moniker ------------------------------------------------------------------------------

        /// The identifer the server assigned to this client.
        /// 
        /// @name module:vwf.moniker
        /// 
        /// @see {@link module:vwf/api/kernel.moniker}

        this.moniker = function() {
            return this.moniker_;
        };

        // -- application --------------------------------------------------------------------------

        /// @name module:vwf.application
        /// 
        /// @see {@link module:vwf/api/kernel.application}

        this.application = function( initializedOnly ) {
            return applicationID && ( ! initializedOnly || this.models.object.initialized( applicationID ) ) ?
                applicationID : undefined;
        };

        // -- intrinsics ---------------------------------------------------------------------------

        /// @name module:vwf.intrinsics
        /// 
        /// @see {@link module:vwf/api/kernel.intrinsics}

        this.intrinsics = function( nodeID, result ) {
            return this.models.object.intrinsics( nodeID, result );
        };

        // -- uri ----------------------------------------------------------------------------------

        /// @name module:vwf.uri
        /// 
        /// @see {@link module:vwf/api/kernel.uri}

        this.uri = function( nodeID ) {
            return this.models.object.uri( nodeID );
        };

        // -- name ---------------------------------------------------------------------------------

        /// @name module:vwf.name
        /// 
        /// @see {@link module:vwf/api/kernel.name}

        this.name = function( nodeID ) {
            return this.models.object.name( nodeID );
        };

        // -- prototype ----------------------------------------------------------------------------

        /// @name module:vwf.prototype
        /// 
        /// @see {@link module:vwf/api/kernel.prototype}

        this.prototype = function( nodeID ) {
            return this.models.object.prototype( nodeID );
        };

        // -- prototypes ---------------------------------------------------------------------------

        /// @name module:vwf.prototypes
        /// 
        /// @see {@link module:vwf/api/kernel.prototypes}

        this.prototypes = function( nodeID, includeBehaviors ) {

            var prototypes = [];

            if ( includeBehaviors ) {
                var b = [].concat( this.behaviors( nodeID ) );
                Array.prototype.push.apply( prototypes, b.reverse() );
            }

            nodeID = this.prototype( nodeID );

            while ( nodeID ) {

                prototypes.push( nodeID );
                nodeID = this.prototype( nodeID );

                if ( nodeID && includeBehaviors ) {
                    var b = [].concat( this.behaviors( nodeID ) );
                    Array.prototype.push.apply( prototypes, b.reverse() );
                }

            }

            return prototypes;
        };

        // -- behaviors ----------------------------------------------------------------------------

        /// @name module:vwf.behaviors
        /// 
        /// @see {@link module:vwf/api/kernel.behaviors}

        this.behaviors = function( nodeID ) {
            return this.models.object.behaviors( nodeID );
        };

        // -- ancestors ----------------------------------------------------------------------------

        /// @name module:vwf.ancestors
        /// 
        /// @see {@link module:vwf/api/kernel.ancestors}

        this.ancestors = function( nodeID, initializedOnly ) {

            var ancestors = [];

            nodeID = this.parent( nodeID, initializedOnly );

            while ( nodeID && nodeID !== 0 ) {
                ancestors.push( nodeID );
                nodeID = this.parent( nodeID, initializedOnly );
            }

            return ancestors;
        };

        // -- parent -------------------------------------------------------------------------------

        /// @name module:vwf.parent
        /// 
        /// @see {@link module:vwf/api/kernel.parent}

        this.parent = function( nodeID, initializedOnly ) {
            return this.models.object.parent( nodeID, initializedOnly );
        };

        // -- children -----------------------------------------------------------------------------

        /// @name module:vwf.children
        /// 
        /// @see {@link module:vwf/api/kernel.children}

        this.children = function( nodeID ) {

            if ( nodeID === undefined ) {
                this.logger.errorx( "children", "cannot retrieve children of nonexistent node" );
                return;
            }

            return this.models.object.children( nodeID );
        };

        // -- descendants --------------------------------------------------------------------------

        /// @name module:vwf.descendants
        /// 
        /// @see {@link module:vwf/api/kernel.descendants}

        this.descendants = function( nodeID ) {

            if ( nodeID === undefined ) {
                this.logger.errorx( "descendants", "cannot retrieve children of nonexistent node" );
                return;
            }

            var descendants = [];

            this.children( nodeID ).forEach( function( childID ) {
                descendants.push( childID );
                Array.prototype.push.apply( descendants, this.descendants( childID ) );
            }, this );             

            return descendants;
        };

        // -- sequence -----------------------------------------------------------------------------

        /// @name module:vwf.sequence
        /// 
        /// @see {@link module:vwf/api/kernel.sequence}

        this.sequence = function( nodeID ) {
            return this.models.object.sequence( nodeID );
        };

        /// Locate nodes matching a search pattern. See vwf.api.kernel#find for details.
        /// 
        /// @name module:vwf.find
        ///
        /// @param {ID} nodeID
        ///   The reference node. Relative patterns are resolved with respect to this node. `nodeID`
        ///   is ignored for absolute patterns.
        /// @param {String} matchPattern
        ///   The search pattern.
        /// @param {Boolean} [initializedOnly]
        ///   Interpret nodes that haven't completed initialization as though they don't have
        ///   ancestors. Drivers that manage application code should set `initializedOnly` since
        ///   applications should never have access to uninitialized parts of the application graph.
        /// @param {Function} [callback]
        ///   A callback to receive the search results. If callback is provided, find invokes
        ///   callback( matchID ) for each match. Otherwise the result is returned as an array.
        /// 
        /// @returns {ID[]|undefined}
        ///   If callback is provided, undefined; otherwise an array of the node ids of the result.
        /// 
        /// @see {@link module:vwf/api/kernel.find}

        this.find = function( nodeID, matchPattern, initializedOnly, callback /* ( matchID ) */ ) {

            // Interpret `find( nodeID, matchPattern, callback )` as
            // `find( nodeID, matchPattern, undefined, callback )`. (`initializedOnly` was added in
            // 0.6.8.)

            if ( typeof initializedOnly == "function" || initializedOnly instanceof Function ) {
                callback = initializedOnly;
                initializedOnly = undefined;
            }

            // Evaluate the expression, using the application as the root and the provided node as
            // the reference.

            var matchIDs = require( "vwf/utility" ).xpath.resolve( matchPattern,
                this.application( initializedOnly ), nodeID, resolverWithInitializedOnly, this );

            // Return the result, either by invoking the callback when provided, or returning the
            // array directly.

            if ( callback ) {

                matchIDs.forEach( function( matchID ) {
                    callback( matchID );
                } );

            } else {  // TODO: future iterator proxy

                return matchIDs;
            }

            // Wrap `xpathResolver` to pass `initializedOnly` through.

            function resolverWithInitializedOnly( step, contextID, resolveAttributes ) {
                return xpathResolver.call( this, step, contextID, resolveAttributes, initializedOnly );
            }

        };

        // -- findClients ------------------------------------------------------------------------------

        /// Locate client nodes matching a search pattern. 
        ///
        /// @name module:vwf.findClients
        ///
        /// @param {ID} nodeID
        ///   The reference node. Relative patterns are resolved with respect to this node. `nodeID`
        ///   is ignored for absolute patterns.
        /// @param {String} matchPattern
        ///   The search pattern.
        /// @param {Function} [callback]
        ///   A callback to receive the search results. If callback is provided, find invokes
        ///   callback( matchID ) for each match. Otherwise the result is returned as an array.
        /// 
        /// @returns {ID[]|undefined}
        ///   If callback is provided, undefined; otherwise an array of the node ids of the result.
        /// 
        /// @see {@link module:vwf/api/kernel.clients}

        this.findClients = function( nodeID, matchPattern, callback /* ( matchID ) */ ) {

            var matchIDs = require( "vwf/utility" ).xpath.resolve( matchPattern,
                "http-vwf-example-com-clients-vwf", nodeID, xpathResolver, this );

            if ( callback ) {

                matchIDs.forEach( function( matchID ) {
                    callback( matchID );
                } );

            } else { 

                return matchIDs;
            }

        };

        // -- findDevices ------------------------------------------------------------------------------

        /// Locate device nodes matching a search pattern. 
        ///
        /// @name module:vwf.findDevices
        ///
        /// @param {ID} nodeID
        ///   The reference node. Relative patterns are resolved with respect to this node. `nodeID`
        ///   is ignored for absolute patterns.
        /// @param {String} matchPattern
        ///   The search pattern.
        /// @param {Function} [callback]
        ///   A callback to receive the search results. If callback is provided, find invokes
        ///   callback( matchID ) for each match. Otherwise the result is returned as an array.
        /// 
        /// @returns {ID[]|undefined}
        ///   If callback is provided, undefined; otherwise an array of the node ids of the result.
        /// 
        /// @see {@link module:vwf/api/kernel.devices}

        this.findDevices = function( nodeID, matchPattern, callback /* ( matchID ) */ ) {

            var matchIDs = require( "vwf/utility" ).xpath.resolve( matchPattern,
                "http-vwf-example-com-devices-vwf", nodeID, xpathResolver, this );

            if ( callback ) {

                matchIDs.forEach( function( matchID ) {
                    callback( matchID );
                } );

            } else { 

                return matchIDs;
            }

        };

        /// Test a node against a search pattern. See vwf.api.kernel#test for details.
        /// 
        /// @name module:vwf.test
        /// 
        /// @param {ID} nodeID
        ///   The reference node. Relative patterns are resolved with respect to this node. `nodeID`
        ///   is ignored for absolute patterns.
        /// @param {String} matchPattern
        ///   The search pattern.
        /// @param {ID} testID
        ///   A node to test against the pattern.
        /// @param {Boolean} [initializedOnly]
        ///   Interpret nodes that haven't completed initialization as though they don't have
        ///   ancestors. Drivers that manage application code should set `initializedOnly` since
        ///   applications should never have access to uninitialized parts of the application graph.
        /// 
        /// @returns {Boolean}
        ///   true when testID matches the pattern.
        /// 
        /// @see {@link module:vwf/api/kernel.test}

        this.test = function( nodeID, matchPattern, testID, initializedOnly ) {

            // Evaluate the expression, using the application as the root and the provided node as
            // the reference.

            var matchIDs = require( "vwf/utility" ).xpath.resolve( matchPattern,
                this.application( initializedOnly ), nodeID, resolverWithInitializedOnly, this );

            // Search for the test node in the result.

            return matchIDs.some( function( matchID ) {
                return matchID == testID;
            } );

            // Wrap `xpathResolver` to pass `initializedOnly` through.

            function resolverWithInitializedOnly( step, contextID, resolveAttributes ) {
                return xpathResolver.call( this, step, contextID, resolveAttributes, initializedOnly );
            }

        };

        // == Private functions ====================================================================

        var isSocketIO07 = function() {
            return ( parseFloat( io.version ) >= 0.7 );
        }

        // -- loadComponent ------------------------------------------------------------------------

        /// @name module:vwf~loadComponent

        var loadComponent = function( nodeURI, callback_async /* ( nodeDescriptor ) */ ) {  // TODO: turn this into a generic xhr loader exposed as a kernel function?

            if ( nodeURI == nodeTypeURI ) {

                callback_async( nodeTypeDescriptor );

            } else if ( nodeURI.match( RegExp( "^data:application/json;base64," ) ) ) {

                // Primarly for testing, parse one specific form of data URIs. We need to parse
                // these ourselves since Chrome can't load data URIs due to cross origin
                // restrictions.

                callback_async( JSON.parse( atob( nodeURI.substring( 29 ) ) ) );  // TODO: support all data URIs

            } else {

                queue.suspend( "while loading " + nodeURI ); // suspend the queue

                jQuery.ajax( {

                    url: remappedURI( nodeURI ),
                    dataType: "jsonp",

                    success: function( nodeDescriptor ) /* async */ {
                        callback_async( nodeDescriptor );
                        queue.resume( "after loading " + nodeURI ); // resume the queue; may invoke dispatch(), so call last before returning to the host
                    },

                    // error: function() {  // TODO
                    // },

                } );

            }

        };

        // -- loadScript ---------------------------------------------------------------------------

        /// @name module:vwf~loadScript

        var loadScript = function( scriptURI, callback_async /* ( scriptText ) */ ) {

            if ( scriptURI.match( RegExp( "^data:application/javascript;base64," ) ) ) {

                // Primarly for testing, parse one specific form of data URIs. We need to parse
                // these ourselves since Chrome can't load data URIs due to cross origin
                // restrictions.

                callback_async( atob( scriptURI.substring( 35 ) ) );  // TODO: support all data URIs

            } else {

                queue.suspend( "while loading " + scriptURI ); // suspend the queue

                jQuery.get( remappedURI( scriptURI ), function( scriptText ) /* async */ {
                    callback_async( scriptText );
                    queue.resume( "after loading " + scriptURI ); // resume the queue; may invoke dispatch(), so call last before returning to the host
                }, "text" );

            }

        };

        /// Determine if a given property of a node has a setter function, either directly on the
        /// node or inherited from a prototype.
        /// 
        /// This function must run as a method of the kernel. Invoke as: nodePropertyHasSetter.call(
        ///   kernel, nodeID, propertyName ).
        /// 
        /// @name module:vwf~nodePropertyHasSetter
        /// 
        /// @param {ID} nodeID
        /// @param {String} propertyName
        /// 
        /// @returns {Boolean}

        var nodePropertyHasSetter = function( nodeID, propertyName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript; need to delegate to all script drivers
            var node = this.models.javascript.nodes[nodeID];
            var setter = node.private.setters && node.private.setters[propertyName];
            return typeof setter == "function" || setter instanceof Function;
        };

        /// Determine if a given property of a node has a setter function. The node's prototypes are
        /// not considered.
        /// 
        /// This function must run as a method of the kernel. Invoke as:
        ///   nodePropertyHasOwnSetter.call( kernel, nodeID, propertyName ).
        /// 
        /// @name module:vwf~nodePropertyHasOwnSetter
        /// 
        /// @param {ID} nodeID
        /// @param {String} propertyName
        /// 
        /// @returns {Boolean}

        var nodePropertyHasOwnSetter = function( nodeID, propertyName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript; need to delegate to all script drivers
            var node = this.models.javascript.nodes[nodeID];
            var setter = node.private.setters && node.private.setters.hasOwnProperty( propertyName ) && node.private.setters[propertyName];
            return typeof setter == "function" || setter instanceof Function;
        };

        /// Determine if a node has a child with the given name, either directly on the node or
        /// inherited from a prototype.
        /// 
        /// This function must run as a method of the kernel. Invoke as: nodeHasChild.call(
        ///   kernel, nodeID, childName ).
        /// 
        /// @name module:vwf~nodeHasChild
        /// 
        /// @param {ID} nodeID
        /// @param {String} childName
        /// 
        /// @returns {Boolean}

        var nodeHasChild = function( nodeID, childName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript
            var node = this.models.javascript.nodes[nodeID];
            return childName in node.children;
        };

        /// Determine if a node has a child with the given name. The node's prototypes are not
        /// considered.
        /// 
        /// This function must run as a method of the kernel. Invoke as: nodeHasOwnChild.call(
        ///   kernel, nodeID, childName ).
        /// 
        /// @name module:vwf~nodeHasOwnChild
        /// 
        /// @param {ID} nodeID
        /// @param {String} childName
        /// 
        /// @returns {Boolean}

        var nodeHasOwnChild = function( nodeID, childName ) { // invoke with the kernel as "this"  // TODO: this is peeking inside of vwf-model-javascript
            var node = this.models.javascript.nodes[nodeID];
            var hasChild = false;
            if ( parseInt( childName ).toString() !== childName ) {
                hasChild = node.children.hasOwnProperty( childName );  // TODO: this is peeking inside of vwf-model-javascript
            }
            else {
                // Children with numeric names do not get added as properties of the children array, so loop over the children
                // to check manually
                for(var i=0, il=node.children.length; i<il;i++) {
                    if(childName === node.children[i].name) {
                        hasChild = true; 
                    }
                }
            }
            return hasChild;
        };

        /// Determine if a component specifier is a URI.
        /// 
        /// A component may be specified as the URI of a resource containing a descriptor (string),
        /// a descriptor (object), or the ID of a previously-created node (primitive).
        /// 
        /// @name module:vwf~componentIsURI
        /// 
        /// @param {String|Object} candidate
        /// 
        /// @returns {Boolean}

        var componentIsURI = function( candidate ) {
            return ( typeof candidate == "string" || candidate instanceof String ) && ! componentIsID( candidate );
        };

        /// Determine if a component specifier is a descriptor.
        /// 
        /// A component may be specified as the URI of a resource containing a descriptor (string),
        /// a descriptor (object), or the ID of a previously-created node (primitive).
        /// 
        /// @name module:vwf~componentIsDescriptor
        /// 
        /// @param {String|Object} candidate
        /// 
        /// @returns {Boolean}

        var componentIsDescriptor = function( candidate ) {
            return typeof candidate == "object" && candidate != null && ! isPrimitive( candidate );
        };

        /// Determine if a component specifier is an ID.
        /// 
        /// A component may be specified as the URI of a resource containing a descriptor (string),
        /// a descriptor (object), or the ID of a previously-created node (primitive).
        /// 
        /// @name module:vwf~componentIsID
        /// 
        /// @param {String|Object} candidate
        /// 
        /// @returns {Boolean}

        var componentIsID = function( candidate ) {
            return isPrimitive( candidate ) && vwf.models.object.exists( candidate );
        };

        /// Determine if a value is a JavaScript primitive, or the boxed version of a JavaScript
        /// primitive.
        /// 
        /// Node IDs are JavaScript primitives. This function may be used to determine if a value
        /// has the correct type to be a node ID.
        /// 
        /// @name module:vwf~isPrimitive
        /// 
        /// @param candidate
        /// 
        /// @returns {Boolean}

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

        /// Determine if an object is a component descriptor. Detect the type by searching for
        /// descriptor keys in the candidate object.
        /// 
        /// @name module:vwf~objectIsComponent
        /// 
        /// @param {Object} candidate
        /// 
        /// @returns {Boolean}

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

                isComponent = componentAttributes.some( function( attributeName ) {
                    return candidate.hasOwnProperty( attributeName );
                } );

            }
            
            return isComponent; 
        };

        /// Determine if a property initializer is a detailed initializer containing explicit
        /// accessor and value parameters (rather than a simple value specification). Detect the
        /// type by searching for property initializer keys in the candidate object.
        /// 
        /// @name module:vwf~valueHasAccessors
        /// 
        /// @param {Object} candidate
        /// 
        /// @returns {Boolean}

        var valueHasAccessors = function( candidate ) {

            var accessorAttributes = [
                "get",
                "set",
                "value",
                "create",
                "undefined",
            ];

            var hasAccessors = false;

            if ( typeof candidate == "object" && candidate != null ) {

                hasAccessors = accessorAttributes.some( function( attributeName ) {
                    return candidate.hasOwnProperty( attributeName );
                } );

            }
            
            return hasAccessors; 
        };

        /// Determine if a method or event initializer is a detailed initializer containing a
        /// parameter list along with the body text (method initializers only). Detect the type by
        /// searching for method and event initializer keys in the candidate object.
        /// 
        /// @name module:vwf~valueHasBody
        /// 
        /// @param {Object} candidate
        /// 
        /// @returns {Boolean}

        var valueHasBody = function( candidate ) {  // TODO: refactor and share with valueHasAccessors and possibly objectIsComponent  // TODO: unlike a property initializer, we really only care if it's an object vs. text; text == use as body; object == presume o.parameters and o.body  // TODO: except that a script in the unnamed-list format would appear as an object but should be used as the body

            var bodyAttributes = [
                "parameters",
                "body",
            ];

            var hasBody = false;  // TODO: "body" term is confusing, but that's the current terminology used in vwf/model/javascript

            if ( typeof candidate == "object" && candidate != null ) {

                hasBody = bodyAttributes.some( function( attributeName ) {
                    return candidate.hasOwnProperty( attributeName );
                } );

            }
            
            return hasBody; 
        };

        /// Determine if a script initializer is a detailed initializer containing explicit text and
        /// type parameters (rather than being a simple text specification). Detect the type by
        /// searching for the script initializer keys in the candidate object.
        /// 
        /// @name module:vwf~valueHasType
        /// 
        /// @param {Object} candidate
        /// 
        /// @returns {Boolean}

        var valueHasType = function( candidate ) {  // TODO: refactor and share with valueHasBody, valueHasAccessors and possibly objectIsComponent

            var typeAttributes = [
                "source",
                "text",
                "type",
            ];

            var hasType = false;

            if ( typeof candidate == "object" && candidate != null ) {

                hasType = typeAttributes.some( function( attributeName ) {
                    return candidate.hasOwnProperty( attributeName );
                } );

            }
            
            return hasType; 
        };

        /// Convert a (potentially-abbreviated) component specification to a descriptor parsable by
        /// vwf.createChild. The following forms are accepted:
        /// 
        ///   - Descriptor: { extends: component, source: ..., type: ..., ... }
        ///   - Component URI: http://host/path/to/component.vwf
        ///   - Asset URI: http://host/ath/to/asset.type
        ///   - Node ID
        /// 
        /// They are converted as follows:
        /// 
        ///   - Descriptor: unchanged [1]
        ///   - Component URI: a component that extends the component identified by the URI
        ///   - Asset URI: a component having the asset identified by the URI as its source
        ///   - Node ID: a component that extends the previously-created node identified by the ID
        /// 
        /// [1] As a special case, missing MIME types are filled in for assets matcching the
        /// patterns *.unity3d and *.dae, and components having assets of those types but no
        /// prototype declared will be upgraded to extend scene.vwf and navscene.vwf, respectively.
        /// 
        /// @name module:vwf~normalizedComponent
        /// 
        /// @param {String|Object} component
        /// 
        /// @returns {Object}

        var normalizedComponent = function( component ) {

            // Convert a component URI to an instance of that type or an asset reference to an
            // untyped reference to that asset. Convert a component ID to an instance of that
            // prototype.

            if ( componentIsURI( component ) ) {
                if ( component.match( /\.vwf$/ ) ) {  // TODO: detect component from mime-type instead of extension?
                    component = { extends: component };
                } else {
                    component = { source: component };
                }
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

        /// Convert a fields object as passed between the client and reflector, and stored in the
        /// message queue, into a form suitable for writing to a log.
        /// 
        /// @name module:vwf~loggableFields
        /// 
        /// @param {Object} fields
        /// 
        /// @returns {Object}

        var loggableFields = function( fields ) {
            return require( "vwf/utility" ).transform( fields, require( "vwf/utility" ).transforms.transit );
        };

        /// Convert a component URI, descriptor or ID into a form suitable for writing to a log.
        /// 
        /// @name module:vwf~loggableComponent
        /// 
        /// @param {String|Object} component
        /// 
        /// @returns {String|Object}

        var loggableComponent = function( component ) {
            return require( "vwf/utility" ).transform( component, loggableComponentTransformation );
        };

        /// Convert an arbitrary JavaScript value into a form suitable for writing to a log.
        /// 
        /// @name module:vwf~loggableValue
        /// 
        /// @param {Object} component
        /// 
        /// @returns {Object}

        var loggableValue = function( value ) {
            return require( "vwf/utility" ).transform( value, function( object, names, depth ) {
                object = require( "vwf/utility" ).transforms.transit( object, names, depth );
                return typeof object == "number" ? Number( object.toPrecision(5) ) : object; // reduce numeric precision to remove visual noise
            } );
        };

        /// Convert an array of arbitrary JavaScript values into a form suitable for writing to a
        /// log.
        /// 
        /// @name module:vwf~loggableValues
        /// 
        /// @param {Array|undefined} component
        /// 
        /// @returns {Array|undefined}

        var loggableValues = function( values ) {
            return loggableValue( values );
        };

        /// Convert an object indexing arrays of arbitrary JavaScript values into a form suitable
        /// for writing to a log.
        /// 
        /// @name module:vwf~loggableIndexedValues
        /// 
        /// @param {Object|undefined} component
        /// 
        /// @returns {Object|undefined}

        var loggableIndexedValues = function( values ) {
            return loggableValue( values );
        };

        // -- remappedURI --------------------------------------------------------------------------

        /// Remap a component URI to its location in a local cache.
        /// 
        /// http://vwf.example.com/component.vwf => http://localhost/proxy/vwf.example.com/component.vwf
        /// 
        /// @name module:vwf~remappedURI

        var remappedURI = function( uri ) {

            var match = uri.match( RegExp( "http://(vwf.example.com)/(.*)" ) );

            if ( match ) {
                uri = window.location.protocol + "//" + window.location.host +
                    "/proxy/" + match[1] + "/" + match[2];
            }

            return uri;
        };

        // -- queueTransitTransformation -----------------------------------------------------------

        /// vwf/utility/transform() transformation function to convert the message queue for proper
        /// JSON serialization.
        /// 
        /// queue: [ { ..., parameters: [ [ arguments ] ], ... }, { ... }, ... ]
        /// 
        /// @name module:vwf~queueTransitTransformation

        var queueTransitTransformation = function( object, names, depth ) {

            if ( depth == 0 ) {

                // Omit any private direct messages for this client, then sort by arrival order
                // (rather than by time) so that messages will retain the same arrival order when
                // reinserted.

                return object.filter( function( fields ) {
                    return ! fields.respond && fields.action;  // TODO: fields.action is here to filter out tick messages  // TODO: don't put ticks on the queue but just use them to fast-forward to the current time (requires removing support for passing ticks to the drivers and nodes)
                } ).sort( function( fieldsA, fieldsB ) {
                    return fieldsA.sequence - fieldsB.sequence;
                } );

            } else if ( depth == 1 ) {

                // Remove the sequence fields since they're just local annotations used to keep
                // messages ordered by insertion order and aren't directly meaniful outside of this
                // client.

                var filtered = {};

                Object.keys( object ).filter( function( key ) {
                    return key != "sequence";
                } ).forEach( function( key ) {
                    filtered[key] = object[key];
                } );

                return filtered;

            }

            return object;
        };

        // -- loggableComponentTransformation ------------------------------------------------------

        /// vwf/utility/transform() transformation function to truncate the verbose bits of a
        /// component so that it may be written to a log.
        /// 
        /// @name module:vwf~loggableComponentTransformation

        var loggableComponentTransformation = function( object, names, depth ) {

            // Find the index of the lowest nested component in the names list.

            var componentIndex = names.length;

            while ( componentIndex > 2 && names[componentIndex-1] == "children" ) {
                componentIndex -= 2;
            }

            // depth                                                  names  notes
            // -----                                                  -----  -----
            // 0:                                                        []  the component
            // 1:                                          [ "properties" ]  its properties object
            // 2:                          [ "propertyName", "properties" ]  one property
            // 1:                                            [ "children" ]  the children object
            // 2:                               [ "childName", "children" ]  one child
            // 3:                 [ "properties", "childName", "children" ]  the child's properties
            // 4: [ "propertyName", "properties", "childName", "children" ]  one child property

            if ( componentIndex > 0 ) {

                // Locate the container ("properties", "methods", "events", etc.) below the
                // component in the names list.

                var containerIndex = componentIndex - 1;
                var containerName = names[containerIndex];

                // Locate the member as appropriate for the container.

                if ( containerName == "extends" ) {

                    var memberIndex = containerIndex;
                    var memberName = names[memberIndex];

                } else if ( containerName == "implements" ) {

                    if ( containerIndex > 0 ) {
                        if ( typeof names[containerIndex-1] == "number" ) {
                            var memberIndex = containerIndex - 1;
                            var memberName = names[memberIndex];
                        } else {
                            var memberIndex = containerIndex;
                            var memberName = undefined;
                        }
                    } else if ( typeof object != "object" || ! ( object instanceof Array ) ) {
                        var memberIndex = containerIndex;
                        var memberName = undefined;
                    }

                } else if ( containerName == "properties" || containerName == "methods" || containerName == "events" ||
                        containerName == "children" ) {

                    if ( containerIndex > 0 ) {
                        var memberIndex = containerIndex - 1;
                        var memberName = names[memberIndex];
                    }
    
                } else if ( containerName == "scripts" ) {

                    if ( containerIndex > 0 ) {
                        if ( typeof names[containerIndex-1] == "number" ) {
                            var memberIndex = containerIndex - 1;
                            var memberName = names[memberIndex];
                        } else {
                            var memberIndex = containerIndex;
                            var memberName = undefined;
                        }
                    } else if ( typeof object != "object" || ! ( object instanceof Array ) ) {
                        var memberIndex = containerIndex;
                        var memberName = undefined;
                    }

                } else {

                    containerIndex = undefined;
                    containerName = undefined;

                }

            }

            // Transform the object at the current recusion level.

            switch ( containerName ) {

                case "extends":

                    // Omit a component descriptor for the prototype.

                    if ( memberIndex == 0 && componentIsDescriptor( object ) ) {
                        return {};
                    }

                    break;

                case "implements":

                    // Omit component descriptors for the behaviors.

                    if ( memberIndex == 0 && componentIsDescriptor( object ) ) {
                        return {};
                    }

                    break;

                case "properties":

                    // Convert property values to a loggable version, and omit getter and setter
                    // text.

                    if ( memberIndex == 0 && ! valueHasAccessors( object ) ||
                            memberIndex == 1 && names[0] == "value" ) {
                        return loggableValue( object );
                    } else if ( memberIndex == 1 && ( names[0] == "get" || names[0] == "set" ) ) {
                        return "...";
                    }

                    break;

                case "methods":

                    // Omit method body text.

                    if ( memberIndex == 0 && ! valueHasBody( object ) || 
                            memberIndex == 1 && names[0] == "body" ) {
                        return "...";
                    }

                    break;

                case "events":

                    // Nothing for events.

                    break;

                case "children":

                    // Omit child component descriptors.

                    if ( memberIndex == 0 && componentIsDescriptor( object ) ) {
                        return {};
                    }

                    break;

                case "scripts":

                    // Shorten script text.

                    if ( memberIndex == 0 && ! valueHasType( object ) || 
                            memberIndex == 1 && names[0] == "text" ) {
                        return "...";
                    }

                    break;

            }

            return object;
        };

        // -- xpathResolver ------------------------------------------------------------------------

        /// Interpret the steps of an XPath expression being resolved. Use with
        /// vwf.utility.xpath#resolve.
        ///
        /// @name module:vwf~xpathResolver
        /// 
        /// @param {Object} step
        /// @param {ID} contextID
        /// @param {Boolean} [resolveAttributes]
        /// @param {Boolean} [initializedOnly]
        ///   Interpret nodes that haven't completed initialization as though they don't have
        ///   ancestors. Drivers that manage application code should set `initializedOnly` since
        ///   applications should never have access to uninitialized parts of the application graph.
        /// 
        /// @returns {ID[]}

        var xpathResolver = function( step, contextID, resolveAttributes, initializedOnly ) {

            var resultIDs = [];

            switch ( step.axis ) {

                // case "preceding":  // TODO
                // case "preceding-sibling":  // TODO

                case "ancestor-or-self":
                    resultIDs.push( contextID );
                    Array.prototype.push.apply( resultIDs, this.ancestors( contextID, initializedOnly ) );
                    break;

                case "ancestor":
                    Array.prototype.push.apply( resultIDs, this.ancestors( contextID, initializedOnly ) );
                    break;

                case "parent":
                    var parentID = this.parent( contextID, initializedOnly );
                    parentID && resultIDs.push( parentID );
                    break;

                case "self":
                    resultIDs.push( contextID );
                    break;

                case "child":
                    Array.prototype.push.apply( resultIDs, this.children( contextID ) );
                    break;

                case "descendant":
                    Array.prototype.push.apply( resultIDs, this.descendants( contextID ) );
                    break;

                case "descendant-or-self":
                    resultIDs.push( contextID );
                    Array.prototype.push.apply( resultIDs, this.descendants( contextID ) );
                    break;

                // case "following-sibling":  // TODO
                // case "following":  // TODO

                case "attribute":
                    if ( resolveAttributes ) {
                        resultIDs.push( "@" + contextID );  // TODO: @?
                    }
                    break;

                // n/a: case "namespace":
                // n/a:   break;

            }

            switch ( step.kind ) {

                // Name test.

                case undefined:

                    resultIDs = resultIDs.filter( function( resultID ) {
                        if ( resultID[0] != "@" ) {  // TODO: @?
                            return xpathNodeMatchesStep.call( this, resultID, step.name );
                        } else {
                            return xpathPropertyMatchesStep.call( this, resultID.slice( 1 ), step.name );  // TODO: @?
                        }
                    }, this );

                    break;

                // Element test.

                case "element":

                    // Cases: kind(node,type)

                    // element()
                    // element(name)
                    // element(,type)
                    // element(name,type)

                    resultIDs = resultIDs.filter( function( resultID ) {
                        return resultID[0] != "@" && xpathNodeMatchesStep.call( this, resultID, step.name, step.type );  // TODO: @?
                    }, this );

                    break;

                case "attribute":

                    resultIDs = resultIDs.filter( function( resultID ) {
                        return resultID[0] == "@" && xpathPropertyMatchesStep.call( this, resultID.slice( 1 ), step.name );  // TODO: @?
                    }, this );

                    break;

                // Any-kind test.

                case "node":

                    break;

                // Unimplemented test.

                default:

                    resultIDs = [];

                    break;

            }

            return resultIDs;
        }

        // -- xpathNodeMatchesStep -----------------------------------------------------------------

        /// Determine if a node matches a step of an XPath expression being resolved.
        ///
        /// @name module:vwf~xpathNodeMatchesStep
        /// 
        /// @param {ID} nodeID
        /// @param {String} [name]
        /// @param {String} [type]
        /// 
        /// @returns {Boolean}

        var xpathNodeMatchesStep = function( nodeID, name, type ) {

            if ( name && this.name( nodeID ) != name ) {
                return false;
            }

            var matches_type = ! type || this.uri( nodeID ) == type ||
                this.prototypes( nodeID, true ).some( function( prototypeID ) {
                    return this.uri( prototypeID ) == type;
            }, this );

            return matches_type;
        }

        // -- xpathPropertyMatchesStep -------------------------------------------------------------

        /// Determine if a property matches a step of an XPath expression being resolved.
        ///
        /// @name module:vwf~xpathPropertyMatchesStep
        /// 
        /// @param {ID} nodeID
        /// @param {String} [name]
        /// 
        /// @returns {Boolean}

        var xpathPropertyMatchesStep = function( nodeID, name ) {

            var properties = this.models.object.properties( nodeID );

            if ( name ) {
                return properties[name];
            } else {
                return Object.keys( properties ).some( function( propertyName ) {
                    return properties[propertyName];
                }, this );
            }

        }

        /// Merge two component descriptors into a single descriptor for a combined component. A
        /// component created from the combined descriptor will behave in the same way as a
        /// component created from `nodeDescriptor` that extends a component created from
        /// `prototypeDescriptor`.
        ///
        /// Warning: this implementation modifies `prototypeDescriptor`.
        ///
        /// @name module:vwf~mergeDescriptors
        ///
        /// @param {Object} nodeDescriptor
        ///   A descriptor representing a node extending `prototypeDescriptor`.
        /// @param {Object} prototypeDescriptor
        ///   A descriptor representing a prototype for `nodeDescriptor`.

        // Limitations:
        // 
        //   - Doesn't merge children from the prototype with like-named children in the node.
        //   - Doesn't merge property setters and getters from the prototype when the node provides
        //     an initializing value.
        //   - Methods from the prototype descriptor are lost with no way to invoke them if the node
        //     overrides them.
        //   - Scripts from both the prototype and the node are retained, but if both define an
        //     `initialize` function, the node's `initialize` will overwrite `initialize` in
        //     the prototype.
        //   - The prototype doesn't carry its location with it, so relative paths will load with
        //     respect to the location of the node.

        var mergeDescriptors = function( nodeDescriptor, prototypeDescriptor ) {

            if ( nodeDescriptor.implements ) {
                prototypeDescriptor.implements = ( prototypeDescriptor.implements || [] ).
                    concat( nodeDescriptor.implements );
            }

            if ( nodeDescriptor.source ) {
                prototypeDescriptor.source = nodeDescriptor.source;
                prototypeDescriptor.type = nodeDescriptor.type;
            }

            if ( nodeDescriptor.properties ) {

                prototypeDescriptor.properties = prototypeDescriptor.properties || {};

                for ( var propertyName in nodeDescriptor.properties ) {
                    prototypeDescriptor.properties[propertyName] = nodeDescriptor.properties[propertyName];
                }

            }

            if ( nodeDescriptor.methods ) {

                prototypeDescriptor.methods = prototypeDescriptor.methods || {};

                for ( var methodName in nodeDescriptor.methods ) {
                    prototypeDescriptor.methods[methodName] = nodeDescriptor.methods[methodName];
                }

            }

            if ( nodeDescriptor.events ) {

                prototypeDescriptor.events = prototypeDescriptor.events || {};

                for ( var eventName in nodeDescriptor.events ) {
                    prototypeDescriptor.events[eventName] = nodeDescriptor.events[eventName];
                }

            }

            if ( nodeDescriptor.children ) {

                prototypeDescriptor.children = prototypeDescriptor.children || {};

                for ( var childName in nodeDescriptor.children ) {
                    prototypeDescriptor.children[childName] = nodeDescriptor.children[childName];
                }

            }

            if ( nodeDescriptor.scripts ) {
                prototypeDescriptor.scripts = ( prototypeDescriptor.scripts || [] ).
                    concat( nodeDescriptor.scripts );
            }

            return prototypeDescriptor;
        };

        // == Private variables ====================================================================

        // Prototype for the `properties`, `methods` and `events` collections in the `nodes`
        // objects.

        var nodeCollectionPrototype = {

            /// Record that a property, method or event has been created.
            /// 
            /// @param {String} name
            /// 
            /// @returns {Boolean}
            ///   `true` if the member was successfully added. `false` if a member by that name
            ///   already exists.

            create: function( name ) {

                if ( ! this.hasOwn( name ) ) {

                    // Add the member. We just record its existence. Everything else is managed by
                    // the drivers.
                    // 
                    // `Object.defineProperty` is used instead of `this.existing[name] = ...` since
                    // the prototype may be a behavior proxy, and the accessor properties would
                    // prevent normal assignment.

                    Object.defineProperty( this.existing, name, {
                        value: undefined,
                        configurable: true,
                        enumerable: true,
                        writable: true,
                    } );

                    return true;

                } else {

                    return false;

                }

            },

            /// Record that a member has been deleted. Remove it from any change lists that is in.
            /// 
            /// @param {String} name
            /// 
            /// @returns {Boolean}
            ///   `true` if the member was successfully removed. `false` if a member by that name
            ///   does not exist.

            delete: function( name ) {

                if ( this.hasOwn( name ) ) {

                    // Remove the member.

                    delete this.existing[name];

                    // Remmove the member from any change lists it's in. Completely remove lists
                    // that become empty.

                    if ( this.added ) {
                        delete this.added[name];
                        Object.keys( this.added ).length || delete this.added;
                    }

                    if ( this.removed ) {
                        delete this.removed[name];
                        Object.keys( this.removed ).length || delete this.removed;
                    }

                    if ( this.changed ) {
                        delete this.changed[name];
                        Object.keys( this.changed ).length || delete this.changed;
                    }

                    return true;

                } else {

                    return false;

                }

            },

            /// Record that a member has changed. Create the change list if it does not exist.
            /// 
            /// @param {String} name
            /// 
            /// @returns {Boolean}
            ///   `true` if the change was successfully recorded. `false` if a member by that name
            ///   does not exist.

            change: function( name ) {

                if ( this.hasOwn( name ) ) {

                    // Ensure that the change list exists and record the change.

                    this.changed = this.changed || {};
                    this.changed[name] = undefined;

                    return true;

                } else {

                    return false;

                }

            },

            /// Determine if a node has a member with the given name, either directly on the node or
            /// inherited from a prototype.
            /// 
            /// @param {String} name
            /// 
            /// @returns {Boolean}

            has: function( name ) {
                return name in this.existing;
            },

            /// Determine if a node has a member with the given name. The node's prototypes are not
            /// considered.
            /// 
            /// @param {String} name
            /// 
            /// @returns {Boolean}

            // Since prototypes of the collection objects mirror the node's prototype chain,
            // collection objects for the proto-prototype `node.vwf` intentionally don't inherit
            // from `Object.prototype`. Otherwise the Object members `hasOwnProperty`,
            // `isPrototypeOf`, etc. would be mistaken as members of a VWF node.

            // Instead of using the simpler `this.existing.hasOwnProperty( name )`, we must reach
            // `hasOwnProperty through `Object.prototype`.

            hasOwn: function( name ) {
                return Object.prototype.hasOwnProperty.call( this.existing, name );
            },

        };

        /// The application's nodes, indexed by ID.
        /// 
        /// The kernel defines an application as:
        /// 
        ///   * A tree of nodes,
        ///   * Extending prototypes and implementing behaviors,
        ///   * Publishing properties, and
        ///   * Communicating using methods and events.
        /// 
        /// This definition is as abstract as possible to avoid imposing unnecessary policy on the
        /// application. The concrete realization of these concepts lives in the hearts and minds of
        /// the drivers configured for the application. `nodes` contains the kernel's authoritative
        /// data about this arrangement.
        /// 
        /// @name module:vwf~nodes

        // Note: this is a first step towards moving authoritative data out of the vwf/model/object
        // and vwf/model/javascript drivers and removing the kernel's dependency on them as special
        // cases. Only `nodes.existing[id].properties` is currently implemented this way.

        var nodes = {

            /// Register a node as it is created.
            /// 
            /// @param {ID} nodeID
            ///   The ID assigned to the new node. The node will be indexed in `nodes` by this ID.
            /// @param {ID} prototypeID
            ///   The ID of the node's prototype, or `undefined` if this is the proto-prototype,
            ///   `node.vwf`.
            /// @param {ID[]} behaviorIDs
            ///   An array of IDs of the node's behaviors. `behaviorIDs` should be an empty array if
            ///   the node doesn't have any behaviors.
            /// @param {String} nodeURI
            ///   The node's URI. `nodeURI` should be the component URI if this is the root node of
            ///   a component loaded from a URI, and undefined in all other cases.
            /// @param {String} nodeName
            ///   The node's name.
            /// @param {ID} parentID
            ///   The ID of the node's parent, or `undefined` if this is the application root node
            ///   or another global, top-level node.
            /// 
            /// @returns {Object} 
            ///   The kernel `node` object if the node was successfully added. `undefined` if a node
            ///   identified by `nodeID` already exists.

            create: function( nodeID, prototypeID, behaviorIDs, nodeURI, nodeName, parentID ) {

                // if ( ! this.existing[nodeID] ) {

                    var self = this;

                    var prototypeNode = behaviorIDs.reduce( function( prototypeNode, behaviorID ) {
                        return self.proxy( prototypeNode, self.existing[behaviorID] );
                    }, this.existing[prototypeID] );

                    var parentNode = this.existing[parentID];

                    return this.existing[nodeID] = {

                        // id: ...,

                        // Inheritance. -- not implemented here yet; still using vwf/model/object

                        // prototype: ...,
                        // behaviors: [],

                        // Intrinsic state. -- not implemented here yet.

                        // source: ...,
                        // type: ...,

                        uri: nodeURI,

                        // name: ...,

                        // Internal state. The change flags are omitted until needed. -- not implemented here yet; still using vwf/model/object

                        // sequence: ...,
                        // sequenceChanged: true / false,

                        // prng: ...,
                        // prngChanged: true / false,

                        // Tree. -- not implemented here yet; still using vwf/model/object

                        // parent: ...,
                        // children: [],

                        // Property, Method and Event members defined on the node.
                        // 
                        // The `existing`, `added`, `removed` and `changed` objects are sets: the
                        // keys are the data, and only existence on the object is significant. As an
                        // exception, the last known value for a delegating property is stored on
                        // its `existing` entry.
                        // 
                        // For each collection, `existing` is the authoritative list the node's
                        // members. Use `existing.hasOwnProperty( memberName )` to determine if the
                        // node defines a property, method or event by that name.
                        // 
                        // The prototype of each `existing` object is the `existing` object of the
                        // node's prototype (or a proxy to the top behavior for nodes with
                        // behaviors). Use `memberName in existing` to determine if a property,
                        // method or event is defined on the node or its prototypes.
                        // 
                        // For patchable nodes, `added`, `removed`, and `changed` record changes
                        // that occurred after the node was first initialized. They are omitted
                        // until needed. Only the change is recorded here. Values are retrieved from
                        // the drivers when needed.

                        properties: Object.create( nodeCollectionPrototype, {

                            existing: {
                                value: Object.create( prototypeNode ?
                                    prototypeNode.properties.existing : null ),
                            },

                            // Created when needed.

                            // added: {
                            //     name: undefined
                            // },

                            // removed: {
                            //     name: undefined
                            // },

                            // changed: {
                            //     name: undefined
                            // },

                        } ),

                        // TODO: Store nodes' methods and events here in the kernel

                        // methods: Object.create( nodeCollectionPrototype, {

                        //     existing: {
                        //         value: Object.create( prototypeNode ?
                        //             prototypeNode.methods.existing : null ),
                        //     },

                        //     // Created when needed.

                        //     // added: {
                        //     //     name: undefined
                        //     // },

                        //     // removed: {
                        //     //     name: undefined
                        //     // },

                        //     // changed: {
                        //     //     name: undefined
                        //     // },

                        // } ),

                        // events: Object.create( nodeCollectionPrototype, {

                        //     existing: {
                        //         value: Object.create( prototypeNode ?
                        //             prototypeNode.events.existing : null ),
                        //     },

                        //     // Created when needed.

                        //     // added: {
                        //     //     name: undefined
                        //     // },

                        //     // removed: {
                        //     //     name: undefined
                        //     // },

                        //     // changed: {
                        //     //     name: undefined
                        //     // },

                        // } ),

                        // END TODO

                        // Is this node patchable? Nodes are patchable if they were loaded from a
                        // component.

                        patchable: !! ( nodeURI ||
                            parentNode && ! parentNode.initialized && parentNode.patchable ),

                        // Has this node completed initialization? For applications, visibility to
                        // ancestors from uninitialized nodes is blocked. Change tracking starts
                        // after initialization.

                        initialized: false,

                    };

                // } else {

                //     return undefined;

                // }

            },

            /// Record that a node has initialized.

            initialize: function( nodeID ) {

                if ( this.existing[nodeID] ) {

                    this.existing[nodeID].initialized = true;

                    return true;

                } else {

                    return false;

                }

            },

            /// Unregister a node as it is deleted.

            delete: function( nodeID ) {

                if ( this.existing[nodeID] ) {

                    delete this.existing[nodeID];

                    return true;

                } else {

                    return false;

                }

            },

            /// Create a proxy node in the form of the nodes created by `nodes.create` to represent
            /// a behavior node in another node's prototype chain. The `existing` objects of the
            /// proxy's collections link to the prototype collection's `existing` objects, just as
            /// with a regular prototype. The proxy's members delegate to the corresponding members
            /// in the behavior.

            proxy: function( prototypeNode, behaviorNode ) {

                return {

                    properties: {
                        existing: Object.create(
                            prototypeNode ? prototypeNode.properties.existing : null,
                            propertyDescriptorsFor( behaviorNode.properties.existing )
                        ),
                    },

                    // methods: {
                    //     existing: Object.create(
                    //         prototypeNode ? prototypeNode.methods.existing : null,
                    //         propertyDescriptorsFor( behaviorNode.methods.existing )
                    //     ),
                    // },

                    // events: {
                    //     existing: Object.create(
                    //         prototypeNode ? prototypeNode.events.existing : null,
                    //         propertyDescriptorsFor( behaviorNode.events.existing )
                    //     ),
                    // },

                };

                /// Return an `Object.create` properties object for a proxy object for the provided
                /// collection's `existing` object.

                function propertyDescriptorsFor( collectionExisting ) {

                    return Object.keys( collectionExisting ).reduce(

                        function( propertiesObject, memberName ) {

                            propertiesObject[memberName] = {
                                get: function() { return collectionExisting[memberName] },
                                enumerable: true,
                            };

                            return propertiesObject;
                        },

                        {}

                    );

                }

            },

            /// Registry of all nodes, indexed by ID. Each is an object created by `nodes.create`.

            existing: {

                // id: {
                //     id: ...,
                //     uri: ...,
                //     name: ...,
                //     ...
                // }

            },

        };

        /// Control messages from the reflector are stored here in a priority queue, ordered by
        /// execution time.
        /// 
        /// @name module:vwf~queue

        var queue = this.private.queue = {

            /// Insert a message or messages into the queue. Optionally execute the simulation
            /// through the time marked on the message.
            /// 
            /// When chronic (chron-ic) is set, vwf#dispatch is called to execute the simulation up
            /// through the indicated time. To prevent actions from executing out of order, insert
            /// should be the caller's last operation before returning to the host when invoked with
            /// chronic.
            /// 
            /// @name module:vwf~queue.insert
            /// 
            /// @param {Object|Object[]} fields
            /// @param {Boolean} [chronic]

            insert: function( fields, chronic ) {

                var messages = fields instanceof Array ? fields : [ fields ];

                messages.forEach( function( fields ) {

                    // if ( fields.action ) {  // TODO: don't put ticks on the queue but just use them to fast-forward to the current time (requires removing support for passing ticks to the drivers and nodes)

                        fields.sequence = ++this.sequence; // track the insertion order for use as a sort key
                        this.queue.push( fields );

                    // }

                    if ( chronic ) {
                        this.time = Math.max( this.time, fields.time ); // save the latest allowed time for suspend/resume
                    }

                }, this );

                // Sort by time, then future messages ahead of reflector messages, then by sequence.  // TODO: we probably want a priority queue here for better performance
                // 
                // The sort by origin ensures that the queue is processed in a well-defined order
                // when future messages and reflector messages share the same time, even if the
                // reflector message has not arrived at the client yet.
                // 
                // The sort by sequence number ensures that the messages remain in their arrival
                // order when the earlier sort keys don't provide the order.

                this.queue.sort( function( a, b ) {

                    if ( a.time != b.time ) {
                        return a.time - b.time;
                    } else if ( a.origin != "reflector" && b.origin == "reflector" ) {
                        return -1;
                    } else if ( a.origin == "reflector" && b.origin != "reflector" ) {
                        return 1;
                    } else {
                        return a.sequence - b.sequence;
                    }

                } );

                // Execute the simulation through the new time.

                // To prevent actions from executing out of order, callers should immediately return
                // to the host after invoking insert with chronic set.

                if ( chronic ) {
                    vwf.dispatch();
                }

            },

            /// Pull the next message from the queue.
            /// 
            /// @name module:vwf~queue.pull
            /// 
            /// @returns {Object|undefined} The next message if available, otherwise undefined.

            pull: function() {

                if ( this.suspension == 0 && this.queue.length > 0 && this.queue[0].time <= this.time ) {
                    return this.queue.shift();                
                }

            },

            /// Update the queue to include only the messages selected by a filtering function.
            /// 
            /// @name module:vwf~queue.filter
            /// 
            /// @param {Function} callback
            ///   `filter` calls `callback( fields )` once for each message in the queue. If
            ///   `callback` returns a truthy value, the message will be retained. Otherwise it will
            ///   be removed from the queue.

            filter: function( callback /* fields */ ) {

                this.queue = this.queue.filter( callback );

            },

            /// Suspend message execution.
            /// 
            /// @name module:vwf~queue.suspend
            /// 
            /// @returns {Boolean} true if the queue was suspended by this call.

            suspend: function( why ) {

                if ( this.suspension++ == 0 ) {
                    vwf.logger.infox( "-queue#suspend", "suspending queue at time", vwf.now, why ? why : "" );
                    return true;
                } else {
                    vwf.logger.debugx( "-queue#suspend", "further suspending queue at time", vwf.now, why ? why : "" );
                    return false;
                }

            },

            /// Resume message execution.
            ///
            /// vwf#dispatch may be called to continue the simulation. To prevent actions from
            /// executing out of order, resume should be the caller's last operation before
            /// returning to the host.
            /// 
            /// @name module:vwf~queue.resume
            /// 
            /// @returns {Boolean} true if the queue was resumed by this call.

            resume: function( why ) {

                if ( --this.suspension == 0 ) {
                    vwf.logger.infox( "-queue#resume", "resuming queue at time", vwf.now, why ? why : "" );
                    vwf.dispatch();
                    return true;
                } else {
                    vwf.logger.debugx( "-queue#resume", "partially resuming queue at time", vwf.now, why ? why : "" );
                    return false;
                }

            },

            /// Return the ready state of the queue.
            /// 
            /// @name module:vwf~queue.ready
            /// 
            /// @returns {Boolean}

            ready: function() {
                return this.suspension == 0;
            },

            /// Current time as provided by the reflector. Messages to be executed at this time or
            /// earlier are available from #pull.
            /// 
            /// @name module:vwf~queue.time

            time: 0,

            /// Suspension count. Queue processing is suspended when suspension is greater than 0.
            /// 
            /// @name module:vwf~queue.suspension

            suspension: 0,

            /// Sequence counter for tagging messages by order of arrival. Messages are sorted by
            /// time, origin, then by arrival order.
            /// 
            /// @name module:vwf~queue.sequence

            sequence: 0,

            /// Array containing the messages in the queue.
            /// 
            /// @name module:vwf~queue.queue

            queue: [],

        };

    };

} ) ( window );
