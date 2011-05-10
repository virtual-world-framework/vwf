( function( window ) {

    console.info( "loading vwf" );

    // vwf.js is the main Virtual World Framework manager. It is constructed as a JavaScript module
    // (http://www.yuiblog.com/blog/2007/06/12/module-pattern) to isolate it from the rest of the
    // page's JavaScript environment. The vwf module self-creates its own instance when loaded and
    // attaches to the global window object as window.vwf. Nothing else should affect the global
    // environment.

    window.vwf = new function() {

        console.info( "creating vwf" );

        // == Public variables =====================================================================

        // Each model and view module loaded by the main page registers itself here.

        this.modules = [];

        // vwf.initialize() creates an instance of each model and view module configured on the main
        // page and attaches them here.

        this.models = [];
        this.views = [];

        // This is the simulation clock, which contains the current time in milliseconds. Time is
        // controlled by the conference server and updates here as we receive control messages.

        this.time = 0;

        // == Private variables ====================================================================

        this.private = {}; // for debugging

        // Components describe the objects that make up the simulation. They may also serve as
        // prototype objects for further derived components. External components are identified by
        // URIs. Once loaded, we save a mapping here from its URI to the node ID of its prototype so
        // that we can find it if it is reused. Components specified internally as object literals
        // are anonymous and are not indexed here.

        var types = this.private.types = {}; // maps URI => id

// TODO: keep these public like this and replace "var types", or provide accessors?
this.typeIDs = {}; // maps URI => id
this.typeURIs = {}; // maps id => URI

        // Control messages from the conference server are stored here in a priority queue, ordered
        // by execution time.

        var queue = this.private.queue = [];

        // This is the connection to the conference server. In this sample implementation, "socket"
        // is a socket.io client that communicates over a channel provided by the server hosting the
        // client documents.

        var socket = undefined;

        // The proto-prototype of all nodes is "node", identified by this URI. This type is
        // intrinsic to the system and nothing is loaded from the URI.

        var nodeTypeURI = "http://vwf.example.com/types/node";

        // Each node is assigned an ID as it is created. This is the most recent ID assigned.

        // Communication between the manager and the models and views uses these IDs to refer to the
        // nodes. The manager doesn't maintain any particular state for the nodes and knows them
        // only as their IDs. The models work in federation to provide the meaning to each node.

        var lastID = 0;

        // Callback functions defined in this scope use this local "vwf" to locate the manager.

        var vwf = this;

        // == Public functions =====================================================================

        // -- initialize ---------------------------------------------------------------------------

        // The main page only needs to call vwf.initialize() to launch the world. initialize()
        // accepts three parameters.
        
        // A component specification identifies the world to be loaded. If a URI is provided, the
        // specification is loaded from there [1]. Alternately, a JavaScript object literal
        // containing the specfication may be provided [2]. Since a component can extend and
        // specialize a prototype, using a simple object literal allows existing component to be
        // configured for special uses [3].
        // 
        //     [1] vwf.initialize( "http://vwf.example.com/worlds/sample12345", ... )
        //
        //     [2] vwf.initialize( { source: "model.dae", type: "model/x-collada",
        //             properties: { "p1": ... }, ... }, ... )
        //
        //     [3] vwf.initialize( { extends: "http://vwf.example.com/worlds/sample12345",
        //             source: "alternate-model.dae", type: "model/x-collada" }, ... )
        // 
        // modelArguments and viewArguments identify the model and view modules that should be
        // attached to the simulation and provides their configuration parameters. Each argument set
        // is specified as an object (hash) in which each key is the name of a model or view to
        // construct, and the value is the set of arguments to pass to the constructor. The
        // arguments may be specified as an array of values [4], or as a single value is there is
        // only one [5].
        // 
        //     [4] vwf.initialize( ..., { scenejs: "#scene" }, { ... } )
        //     [5] vwf.initialize( ..., { ... }, { html: [ "#world", "second param" ] } )

        this.initialize = function( /* [ componentURI|componentObject ] [ modelArguments ]
            [ viewArguments ] */ ) {

            var args = Array.prototype.slice.call( arguments );

            // Get the world specification if one is provided in the query string. Parse it into a
            // world specification object if it's valid JSON, otherwise keep the query string and
            // assume it's a URI.

            var world = jQuery.getQueryString( "world" );

            try { world = jQuery.parseJSON( world ) || world || {}; } catch( e ) { }

            // Parse the function parameters. If the first parameter is a string or contains
            // component properties, then treat it as the world specification. Otherwise, fall back
            // to the "world" parameter in the query string.

            if ( typeof args[0] == "string" || args[0] instanceof String || objectIsComponent( args[0] ) ) {
                world = args.shift();
            }

            // Shift off the parameter containing the model argument lists.

            var modelArgumentLists = args.shift() || {};

            if ( typeof modelArgumentLists != "object" && ! modelArgumentLists instanceof Object )
                modelArgumentLists = {};

            // Shift off the parameter containing the view argument lists.

            var viewArgumentLists = args.shift() || {};

            if ( typeof viewArgumentLists != "object" && ! viewArgumentLists instanceof Object )
                viewArgumentLists = {};

            // Register a callback with jQuery to be invoked when the HTML page has finished
            // loading.

            jQuery( window.document ).ready( function() {

                // Create and attach each configured model.

                jQuery.each( modelArgumentLists, function( modelName, modelArguments ) {
                    var model = vwf.modules[modelName];
                    model && vwf.models.push( model.apply( new model(), [ vwf ].concat( modelArguments || [] ) ) );
                } );

                // Create and attach each configured view.

                jQuery.each( viewArgumentLists, function( viewName, viewArguments ) {
                    var view = vwf.modules[viewName];
                    view && vwf.views.push( view.apply( new view(), [ vwf ].concat( viewArguments || [] ) ) );
                } );

                // Load the world.

                vwf.ready( world );

            } );

        };

        // -- ready --------------------------------------------------------------------------------

        this.ready = function( component_uri_or_object ) {

            // Connect to the conference server. This implementation uses the socket.io library,
            // which communicates using a channel back to the server that provided the client
            // documents.

            try {

                socket = new io.Socket( undefined, {

                    // Increase the timeout due to starvation while loading the scene. The server
                    // timeout must also be increased.

                    transportOptions: {
                        "websocket": { timeout: 90000 },
                        "flashsocket": { timeout: 90000 },
                        "htmlfile": { timeout: 90000 },
                        "xhr-multipart": { timeout: 90000 },
                        "xhr-polling": { timeout: 90000 },
                        "jsonp-polling": { timeout: 90000 },
    			    }

    			} );

            } catch ( e ) {

                // If a connection to the conference server is not available, then run in single-
                // user mode. Messages intended for the conference server will loop directly back to
                // us in this case. Start a timer to monitor the incoming queue and dispatch the
                // messages as though they were received from the server.

                this.dispatch( 0 );

                setInterval( function() {

                    vwf.time += 10;
                    vwf.dispatch( vwf.time );

                }, 10 );

            }

            if ( socket ) {

                socket.on( "connect", function() { console.info( "vwf.socket connected" ) } );

                // Configure a handler to receive messages from the server. Note that this example
                // code doesn't implement a robust parser capable of handing arbitrary text and that
                // the messages should be placed in a dedicated priority queue for best performance
                // rather than resorting the queue as each message arrives. Additionally, 
                // overlapping messages may cause actions to be performed out of order in some cases
                // if messages are not processed on a single thread.

                socket.on( "message", function( message ) {

                    console.info( "vwf.socket message " + message );

                    var fields = message.split( " " );

                    // Add the message to the queue and keep it ordered by time.

                    queue.push( fields );
                    queue.sort( function( a, b ) { return Number( a[0] ) - Number( b[0] ) } );

                    // Each message from the server allows us to move time forward. Parse the
                    // timestamp from the message and call dispatch() to execute all queued actions
                    // through that time, including the message just received.
                    
                    // The simulation may perform immediate actions at the current time or it may
                    // post actions to the queue to be performed in the future. But we only move
                    // time forward for items arriving in the queue from the conference server.

                    var time = Number( fields[0] );
                    vwf.dispatch( time );

                } );

                socket.on( "disconnect", function() { console.log( "vwf.socket disconnected" ) } );

                // Start communication with the conference server. 

                socket.connect();

            }

            // Load the world. The world is a rooted in a single node constructed here as an
            // instance of the component passed to initialize(). That component, its prototype(s),
            // and its children, and their prototypes and children, flesh out the entire world.

            this.createNode( component_uri_or_object, function( rootID, rootTypeID ) {
                vwf.addChild( 0, rootID, undefined );
            } );

        };

        // -- send ---------------------------------------------------------------------------------

        // Send a message to the conference server. The message will be reflected back to all
        // participants in the conference.

        this.send = function( /* nodeID, actionName, parameters ... */ ) {

            var args = Array.prototype.slice.call( arguments );

            // Attach the current simulation time and pack the message as an array of the arguments.

            var fields = [ this.time ].concat( args );

            if ( socket ) {

                // Send the message if the connection is available.

                var message = fields.join( " " );
                socket.send( message );

            } else {
                
                // Otherwise, for single-user mode, loop it immediately back to the incoming queue.

                queue.push( fields );
                queue.sort( function( a, b ) { return Number( a[0] ) - Number( b[0] ) } );

            }

        };

        // -- receive ------------------------------------------------------------------------------

        // Handle receipt of a message. Unpack the arguments and call the appropriate handler.

        this.receive = function( fields ) {

            // Note that this example code doesn't implement a robust parser capable of handing
            // arbitrary text. Additionally, the message should be validated before looking up and
            // invoking an arbitrary handler.

//            var fields = message.split( " " );

            // Shift off the now-unneeded time parameter (dispatch() has already advanced the time)
            // and locate the node ID and action name.

            var time = Number( fields.shift() );
            var nodeID = Number( fields.shift() );
            var actionName = fields.shift();

            // Look up the action handler and invoke it with the remaining parameters.

//            this[actionName] && this[actionName].apply( this, [ nodeID ] + fields );
            this[actionName] && this[actionName].call( this, nodeID, fields[0], fields[1] );
            
        };

        // -- dispatch -----------------------------------------------------------------------------

        // Dispatch incoming messages waiting in the queue. "currentTime" specifies the current
        // simulation time that we should advance to and was taken from the time stamp of the last
        // message received from the conference server.

        this.dispatch = function( currentTime ) {

            // Handle messages until we empty the queue or reach the new current time.

            while ( queue.length > 0 && Number( queue[0][0] ) <= currentTime ) {

                // Set the simulation time to the message time, remove the message and perform the
                // action.

                this.time = Number( queue[0][0] );
                this.receive( queue.shift() );

            }

            // Set the simulation time to the new current time.

            this.time = currentTime;
            
        };

        // -- createNode ---------------------------------------------------------------------------

        // Create a node from a component specification. Construction may require loading data from
        // multiple remote documents. This function returns before construction is complete. A
        // callback is invoked once the node has fully loaded.
        // 
        // A simple node consists of a set of properties, methods and events, but a node may
        // specialize a prototype component and may also contain multiple child nodes, any of which
        // may specialize a prototype component and contain child nodes, etc. So components cover a
        // vast range of complexity. The world definition for the overall simulation is a single
        // component instance.
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

        this.createNode = function( component_uri_or_object, callback ) {

            console.info( "vwf.createNode " + component_uri_or_object );

            // Any component specification may be provided as either a URI identifying a network
            // resource containing the specification or as an object literal that provides the data
            // directly.

            // We must resolve a URI to an object before we can create the component. If the
            // specification parameter is a string, treat it as a URI and load the document at that
            // location. Call construct() with the specification once it has loaded.

            if ( typeof component_uri_or_object == "string" || component_uri_or_object instanceof String ) {

                var component = {};

                console.log( "vwf.createNode: creating node of type " + component_uri_or_object );

                this.getType( component_uri_or_object, function( prototypeID ) {
                    construct.call( this, component, prototypeID, callback );
                } );

            // If a component literal was provided, call getType() to locate or load the prototype
            // node, then pass the prototype and the component specification to construct().

            } else {

                var component = component_uri_or_object;

                console.log( "vwf.createNode: creating " + ( component["extends"] || nodeTypeURI ) + " literal" );

                this.getType( component["extends"] || nodeTypeURI, function( prototypeID ) {
                    construct.call( this, component, prototypeID, callback );
                } );

            }

        };

        // -- getType ------------------------------------------------------------------------------

        // Find or load a node that will serve as the prototype for a component specification. If
        // the component is identified using a URI, save a mapping from the URI to the prototype ID
        // in the "types" database for reuse. If the component is not identified by a URI, don't
        // save a reference in the database (since no other component can refer to it), and just
        // create it as an anonymous type.

        this.getType = function( uri, callback ) {

            var id = types[uri];

            // If we found the URI in the database, invoke the callback with the ID of the
            // previously-loaded prototype node.
            
            if ( id ) {

                callback && callback.call( this, id );

            // If the type has not been loaded but is identified with a URI, call createNode() to
            // make the node that we will use as the prototype. When it loads, save the ID in the
            // types database and invoke the callback with the new prototype node's ID.

            // nodeTypeURI is a special URI identifying the base "node" component that is the
            // ultimate prototype of all other components. Its specification is known
            // intrinsicly and does not exist as a network resource. If the component URI
            // identifies "node", call construct() directly and pass a null prototype and an
            // empty specification.

            } else if ( uri == nodeTypeURI ) {

                var component = {};
                var prototypeID = undefined;

                console.log( "vwf.getType: creating " + uri + " prototype" );

                construct.call( this, component, prototypeID, function( id, prototypeID ) {
                    types[uri] = id;
this.typeIDs[uri] = id;
this.typeURIs[id] = uri;
                    callback && callback.call( this, id );
                } );

            // For any other URI, load the document. Once it loads, call getType() to locate or
            // load the prototype node, then pass the prototype and the component specification
            // to construct().

            } else {

                console.log( "vwf.getType: creating " + uri + " prototype" );

                jQuery.ajax( {
                    url: remappedURI( uri ),
                    dataType: "jsonp",
                    jsonpCallback: "cb",
                    success: function( component ) {
                        this.getType( component["extends"] || nodeTypeURI, function( prototypeID ) { // TODO: if object literal?
                            if ( ! types[uri] ) {
                                construct.call( this, component, prototypeID, function( id, prototypeID ) {
                                    types[uri] = id;
this.typeIDs[uri] = id;
this.typeURIs[id] = uri;
                                    callback && callback.call( this, id );
                                } );
                            } else { // TODO: handle multiple loads of same type better
                                id = types[uri];
                                callback && callback.call( this, id );
                            }
                        } )
                    },
                    context: this
                } );

            }

        };

        // -- addChild -----------------------------------------------------------------------------

        this.addChild = function( nodeID, childID, childName ) {

            console.info( "vwf.addChild " + nodeID + " " + childID + " " + childName );

            // Call addingChild() on each model. The child is considered added after each model has
            // run.

            jQuery.each( vwf.models, function( index, model ) {
                model.addingChild && model.addingChild( nodeID, childID, childName );
            } );

            // Call addedChild() on each view. The view is being notified that a child has been
            // added.

            jQuery.each( vwf.views, function( index, view ) {
                view.addedChild && view.addedChild( nodeID, childID, childName );
            } );

        };

        // -- removeChild --------------------------------------------------------------------------

        this.removeChild = function( nodeID, childID ) {

            console.info( "vwf.removeChild " + nodeID + " " + childID );

            // Call removingChild() on each model. The child is considered removed after each model
            // has run.

            jQuery.each( vwf.models, function( index, model ) {
                model.removingChild && model.removingChild( nodeID, childID );
            } );

            // Call removedChild() on each view. The view is being notified that a child has been
            // removed.

            jQuery.each( vwf.views, function( index, view ) {
                view.removedChild && view.removedChild( nodeID, childID );
            } );

        };

        // -- parent -------------------------------------------------------------------------------

        this.parent = function( nodeID ) {

            // Call parenting() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var parent = undefined;

            jQuery.each( vwf.models, function( index, model ) {
                var modelParent = model.parenting && model.parenting( nodeID );
                parent = modelParent !== undefined ? modelParent  : parent;
            } );

            return parent;
        };

        // -- children -----------------------------------------------------------------------------

        this.children = function( nodeID ) {

            console.info( "vwf.children " + nodeID );

            // Call childrening() on each model. The return value is the union of the non-undefined
            // results.

            var children = [];

            jQuery.each( vwf.models, function( index, model ) {
                var modelChildren = model.childrening && model.childrening( nodeID ) || [];
                Array.prototype.push.apply( children, modelChildren );
            } );

            return children; // TODO: remove duplicates, hopefully without re-ordering.
        };

        // -- name ---------------------------------------------------------------------------------

        this.name = function( nodeID ) {

            // Call naming() on each model. The first model to return a non-undefined value dictates
            // the return value.

            var name = undefined;

            jQuery.each( vwf.models, function( index, model ) {
                var modelName = model.naming && model.naming( nodeID );
                name = modelName !== undefined ? modelName : name;
            } );

            return name;
        };

        // -- createProperty -----------------------------------------------------------------------

        // Create a property on a node and assign an initial value.

        this.createProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "vwf.createProperty " + nodeID + " " + propertyName + " " + propertyValue );

            // Call creatingProperty() on each model. The property is considered created after each
            // model has run.

            jQuery.each( vwf.models, function( index, model ) {
                model.creatingProperty && model.creatingProperty( nodeID, propertyName, propertyValue );
            } );

            // Call createdProperty() on each view. The view is being notified that a property has
            // been created.

            jQuery.each( vwf.views, function( index, view ) {
                view.createdProperty && view.createdProperty( nodeID, propertyName, propertyValue );
            } );

        };

        // -- setProperty --------------------------------------------------------------------------

        // Set a property value on a node.

        this.setProperty = function( nodeID, propertyName, propertyValue ) {

            console.info( "vwf.setProperty " + nodeID + " " + propertyName + " " + propertyValue );

            // Call settingProperty() on each model. The property is considered set after each model
            // has run.

            jQuery.each( vwf.models, function( index, model ) {
                model.settingProperty && model.settingProperty( nodeID, propertyName, propertyValue );
            } );

            // Call satProperty() on each view. The view is being notified that a property has been
            // set.

            jQuery.each( vwf.views, function( index, view ) {
                view.satProperty && view.satProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };

        // -- getProperty --------------------------------------------------------------------------

        // Get a property value for a node.

        this.getProperty = function( nodeID, propertyName ) {

            console.info( "vwf.getProperty " + nodeID + " " + propertyName );

            // Call gettingProperty() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var propertyValue = undefined;

            jQuery.each( vwf.models, function( index, model ) {
                var value = model.gettingProperty && model.gettingProperty( nodeID, propertyName );
                propertyValue = value !== undefined ? value : propertyValue;
            } );

            // Call gotProperty() on each view.

            jQuery.each( vwf.views, function( index, view ) {
                view.gotProperty && view.gotProperty( nodeID, propertyName, propertyValue );
            } );

            return propertyValue;
        };

        // -- createMethod -------------------------------------------------------------------------

        this.createMethod = function ( nodeID, methodName ) {

            console.info( "vwf.createMethod " + nodeID + " " + methodName );

            // Call creatingMethod() on each model. The method is considered created after each
            // model has run.

            jQuery.each( vwf.models, function ( index, model ) {
                model.creatingMethod && model.creatingMethod( nodeID, methodName );
            } );

            // Call createdMethod() on each view. The view is being notified that a method has been
            // created.

            jQuery.each( vwf.views, function ( index, view ) {
                view.createdMethod && view.createdMethod( nodeID, methodName );
            });

        };

        // -- callMethod ---------------------------------------------------------------------------

        this.callMethod = function( nodeID, methodName ) { // TODO: parameters

            console.info( "vwf.callMethod " + nodeID + " " + methodName ); // TODO: parameters

            // Call callingMethod() on each model. The first model to return a non-undefined value
            // dictates the return value.

            var methodValue = undefined;

            jQuery.each( vwf.models, function( index, model ) {
                var value = model.callingMethod && model.callingMethod( nodeID, methodName ); // TODO: parameters
                methodValue = value !== undefined ? value : methodValue;
            } );

            // Call calledMethod() on each view.

            jQuery.each( vwf.views, function( index, view ) {
                view.calledMethod && view.calledMethod( nodeID, methodName ); // TODO: parameters
            } );

            return methodValue;
        };

        // -- execute ------------------------------------------------------------------------------

        this.execute = function( nodeID, scriptText, scriptType ) {

            console.info( "vwf.execute " + nodeID + " " + ( scriptText || "" ).substring( 0, 16 ) + " " + scriptType );

            // Call executing() on each model. The script is considered executed after each model
            // has run.

            var scriptValue = undefined;

            jQuery.each( vwf.models, function( index, model ) {
                var value = model.executing && model.executing( nodeID, scriptText, scriptType ); // TODO: return value
                scriptValue = value !== undefined ? value : scriptValue;
            } );

            // Call executed() on each view. The view is being notified that a script has been
            // executed.

            jQuery.each( vwf.views, function( index, view ) {
                view.executed && view.executed( nodeID, scriptText, scriptType );
            } );

            return scriptValue;
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

        var construct = function( component, prototypeID, callback ) {

            // Allocate an ID for the node. We just use an incrementing counter.

            var nodeID = ++lastID;

            console.info( "vwf.createNode " + nodeID + " " + component.source + " " + component.type );

            // Call creatingNode() on each model. The node is considered to be constructed after
            // each model has run.

            jQuery.each( vwf.models, function( index, model ) {
                model.creatingNode && model.creatingNode( nodeID, prototypeID, [], component.source, component.type );
            } );

            // Call createdNode() on each view. The view is being notified of a node that has
            // been constructed.

            jQuery.each( vwf.views, function( index, view ) {
                view.createdNode && view.createdNode( nodeID, prototypeID, [], component.source, component.type );
            } );

            // Create the properties, methods, and events. For each item in each set, invoke
            // createProperty(), createMethod(), or createEvent() to create the field. Each
            // delegates to the models and views as above.

            component.properties && jQuery.each( component.properties, function( propertyName, propertyValue ) {
                vwf.createProperty( nodeID, propertyName, propertyValue );
            } );

            component.methods && jQuery.each( component.methods, function( methodName ) {
                vwf.createMethod( nodeID, methodName );
            } );

            component.events && jQuery.each( component.events, function( eventName ) {
                vwf.createEvent( nodeID, eventName );
            } );

            // The node is complete. Invoke the callback method and pass the new node ID and the
            // ID of its prototype. If this was the root node for the world, the world is now
            // fully initialized.

            // TODO: this was moved up from the end so that for a => b => c, addChild( a, b ) occurs
            // before addChild( b, c ) so that b can resolve to a before c attempts to resolve to b.
            // But this isn't at the end anymore. Is that OK? The comment above is wrong.

            callback && callback.call( this, nodeID, prototypeID ); // TODO: not until children and scripts have loaded

            // Create and attach the children. For each child, call createNode() with the
            // child's component specification, then once loaded, call addChild() to attach the
            // new node as a child. addChild() delegates to the models and views as before.

            component.children && jQuery.each( component.children, function( childName, child_uri_or_object ) {
                vwf.createNode( child_uri_or_object, function( childID, childTypeID ) {
                    vwf.addChild( nodeID, childID, childName );
                } );
            } );

            // Attach the scripts. For each script, load the network resource if the script is
            // specified as a URI, then once loaded, call execute() to direct any model that
            // manages scripts of this script's type to evaluate the script where it will
            // perform any immediate actions and retain any callbacks as appropriate for the
            // script type.

            component.scripts && jQuery.each( component.scripts, function( scriptNumber, script ) {
                script.text && vwf.execute( nodeID, script.text, script.type ); // TODO: external scripts too // TODO: callback
            } );

            // Invoke an initialization method.

            // This is placeholder for a call into the object to invoke its initialize() method
            // if it has a script attached that provides one.

        }

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

                jQuery.each( componentAttributes, function( index, attributeName ) {
                    isComponent = isComponent || Boolean( candidate[attributeName] );
                } );

            }
            
            return isComponent; 
        };

        // -- remappedURI --------------------------------------------------------------------------

        // Remap a type identifier to its location in a local cache.

        // http://vwf.example.com/types/sometype => http://localhost:8001/types/sometype.js

        var remappedURI = function( uri ) {

            var match = uri.match( RegExp( "http://vwf.example.com/types/(.*)" ) );

            if ( match ) {

                var document_uri = window.location.protocol + "//" + window.location.host + window.location.pathname;
                var document_base = document_uri.substring( 0, document_uri.lastIndexOf( "/" ) );

                uri = document_base + "/types/" + match[1] + ".js";
            }

            return uri;

        };

    };

} ) ( window );

// Extend jQuery to add a function to retrive parameters from the page's query string.

// From http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/2880929#2880929
// and http://stackoverflow.com/questions/901115/get-querystring-values-with-jquery/3867610#3867610.

jQuery.extend( {

    getQueryString: function( name ) {

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

        if ( !this.queryStringParams )
            this.queryStringParams = parseParams();

        return this.queryStringParams[name];

    } // getQueryString

} );
