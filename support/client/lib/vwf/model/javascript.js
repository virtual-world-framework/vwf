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
            this.creatingNode( 0 ); // global root  // TODO: to allow vwf.children( 0 ), vwf.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType,
            callback /* ( ready ) */ ) {

            var type = nodeExtendsID ? this.types[nodeExtendsID] : Object;

            if ( ! type ) {

                var prototype = this.nodes[nodeExtendsID];

                type = this.types[nodeExtendsID] = function() { };

                type.prototype = prototype;
                type.prototype.constructor = type; // resetting constructor breaks enumerables?

            }

            var node = this.nodes[nodeID] = new type( nodeSource, nodeType );

node.id = nodeID; // TODO: move to a backstop model

            node.parent = undefined;

            node.source = nodeSource;
            node.type = nodeType;

            node.properties = {};
            node.properties.node = node; // for node.properties accessors
            node.getters = {};
            node.setters = {};

            node.methods = {};
            node.events = {};
            node.children = [];

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {

            var node = this.nodes[nodeID];
            var child = this.nodes[childID];

            child.name = childName;
            child.parent = node;

            if ( node ) {
                node.children.push( child );
                node.children[childName] = child;
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

            // TODO: only if no conflict with other names on node  TODO: recalculate as properties, methods, events are created and deleted; properties take precedence over methods over events, for example

            Object.defineProperty( node, propertyName, { // "this" is node in get/set
                get: function() { return self.kernel.getProperty( this.id, propertyName ) },
                set: function( value ) { self.kernel.setProperty( this.id, propertyName, value ) },
                enumerable: true
            } );

            if ( propertyGet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.getters[propertyName] = eval( getterScript( propertyGet ) );
                } catch( e ) {
                    this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating getter:", e );
                }
            } else if ( propertyValue !== undefined ) {
                node.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }
        
            if ( propertySet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.setters[propertyName] = eval( setterScript( propertySet ) );
                } catch( e ) {
                    this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating setter:", e );
                }
            } else if ( propertyValue !== undefined ) {
                node.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
            }

        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {

            var node = this.nodes[nodeID];

            if ( ! node.properties.hasOwnProperty( propertyName ) ) {
                this.kernel.createProperty( nodeID, propertyName, undefined );
            }

            var setter = findSetter( node, propertyName );

            if ( setter && setter !== true ) { // is there is a setter (and not just a guard value)
                try {
                    return setter.call( node, propertyValue );
                } catch( e ) {
                    this.logger.warn( "settingProperty", nodeID, propertyName, propertyValue,
                        "exception in setter:", e );
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
                } catch( e ) {
                    this.logger.warn( "gettingProperty", nodeID, propertyName, propertyValue,
                        "exception in getter:", e );
                }
            }

            return undefined;
        },

        // TODO: creatingMethod, deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName /* [, parameter1, parameter2, ... ] */ ) { // TODO: parameters

            var node = this.nodes[nodeID];
            var method = findMethod( node, methodName );
            var parameters = Array.prototype.slice.call( arguments, 2 );

            if ( method ) {
                try {
                    return method.apply( node, parameters );
                } catch( e ) {
                    this.logger.warn( "callingMethod", nodeID, methodName, parameters, // TODO: flatten parameters array, limit for log
                        "exception:", e );
                }
            }

            return undefined;
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {

            var node = this.nodes[nodeID];
            var value;

            if ( scriptType == "application/javascript" ) {
                try {
                    value = ( function( scriptText ) { return eval( scriptText ) } ).call( node, scriptText );
                } catch( e ) {
                    this.logger.warn( "executing", nodeID,
                        ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType, "exception:", e );
                }
            }

            return value;
        },

    } );

    // == Private functions ========================================================================

    // -- getterScript -----------------------------------------------------------------------------

    function getterScript( body ) {
        return accessorScript( "( function() {", body, "} )" );
    }

    // -- setterScript -----------------------------------------------------------------------------

    function setterScript( body ) {
        return accessorScript( "( function( value ) {", body, "} )" );
    }

    // -- accessorScript ---------------------------------------------------------------------------

    function accessorScript( prefix, body, suffix ) {  // TODO: sanitize script, limit access
        if ( body.charAt( body.length-1 ) == "\n" ) {
            return prefix + "\n" + body.replace( /^./gm, "  $&" ) + suffix + "\n";
        } else {
            return prefix + " " + body + " " + suffix;
        }
    }

    // -- findGetter -------------------------------------------------------------------------------

    function findGetter( node, propertyName ) {
        return node.getters && node.getters[propertyName] ||
            Object.getPrototypeOf( node ) && findGetter( Object.getPrototypeOf( node ), propertyName );
    }

    // -- findSetter -------------------------------------------------------------------------------

    function findSetter( node, propertyName ) {
        return node.setters && node.setters[propertyName] ||
            Object.getPrototypeOf( node ) && findSetter( Object.getPrototypeOf( node ), propertyName );
    }

    // -- findMethod -------------------------------------------------------------------------------

    function findMethod( node, methodName ) {
        return node.methods && node.methods[methodName] ||
( typeof node[methodName] == "function" || node[methodName] instanceof Function ) && node[methodName] ||  // TODO: use any old function property as a work-around until we support createMethod()
            Object.getPrototypeOf( node ) && findMethod( Object.getPrototypeOf( node ), methodName );
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
