define( [ "vwf-model", "module" ], function( model, module ) {

    // vwf-model-javascript.js is a placeholder for the JavaScript object interface to the
    // simulation.

    return model.register( module, {

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

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {

            this.logger.info( "creatingNode", nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType );

            var type = nodeExtendsID ? this.private.types[nodeExtendsID] : Object;

            if ( ! type ) {

                var prototype = this.private.nodes[nodeExtendsID];

                type = this.private.types[nodeExtendsID] = function() { };

                type.prototype = prototype;
                type.prototype.constructor = type; // resetting constructor breaks enumerables?

            }

            var node = this.private.nodes[nodeID] = new type( nodeSource, nodeType );

node.id = nodeID; // TODO: move to a backstop model

            node.parent = undefined;

            node.source = nodeSource;
            node.type = nodeType;

            node.properties = {};
            node.getters = {};
            node.setters = {};

            node.methods = {};
            node.events = {};
            node.children = [];

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {

            this.logger.info( "addingChild", nodeID, childID, childName );

            var node = this.private.nodes[nodeID];
            var child = this.private.nodes[childID];

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

            this.logger.info( "parenting", nodeID );

            var node = this.private.nodes[nodeID];

            return node.parent && node.parent.id || 0;
        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function( nodeID ) {  // TODO: move to a backstop model

            this.logger.info( "childrening", nodeID );

            var node = this.private.nodes[nodeID];

            return jQuery.map( node.children, function( child ) {
                return child.id;
            } );
        },

        // -- naming -------------------------------------------------------------------------------

        naming: function( nodeID ) {  // TODO: move to a backstop model

            this.logger.info( "naming", nodeID );

            var node = this.private.nodes[nodeID];

            return node.name || "";
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue, propertyGet, propertySet ) {

            this.logger.info( "creatingProperty", nodeID, propertyName, propertyValue );

            var node = this.private.nodes[nodeID];
            var self = this;

            Object.defineProperty( node.properties, propertyName, {
                get: function() { return self.getProperty( nodeID, propertyName ) }, // "this" is property's node  // TODO: or is it node.properties here?
                set: function( value ) { self.setProperty( nodeID, propertyName, value ) },
                enumerable: true
            } );

            // TODO: only if no conflict with other names on node  TODO: recalculate as properties, methods, events are created and deleted; properties take precedence over methods over events, for example

            Object.defineProperty( node, propertyName, {
                get: function() { return self.getProperty( nodeID, propertyName ) }, // "this" is property's node
                set: function( value ) { self.setProperty( nodeID, propertyName, value ) },
                enumerable: true
            } );

            if ( propertyGet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.getters[propertyName] = eval( this.private.getterScript( propertyGet ) );
                } catch( e ) {
                    this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                        "exception evaluating getter:", e );
                }
            } else if ( propertyValue !== undefined ) {
                node.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }
        
            if ( propertySet ) {  // TODO: assuming javascript here; how to specify script type?
                try {
                    node.setters[propertyName] = eval( this.private.setterScript( propertySet ) );
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

            this.logger.info( "settingProperty", nodeID, propertyName, propertyValue );

            var node = this.private.nodes[nodeID];

            if ( ! node.properties.hasOwnProperty( propertyName ) ) {
                this.createProperty( nodeID, propertyName, undefined );
            }

            var setter = this.private.findSetter( node, propertyName );

            if ( setter && setter !== true ) {
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

            this.logger.info( "gettingProperty", nodeID, propertyName, propertyValue );

            var node = this.private.nodes[nodeID];
            var getter = this.private.findGetter( node, propertyName );

            if ( getter && getter !== true ) {
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

        callingMethod: function( nodeID, methodName ) { // TODO: parameters

            this.logger.info( "callingMethod", nodeID, methodName ); // TODO: parameters

            var node = this.private.nodes[nodeID];
            // var method = ... verify it's in node.methods[], search prototypes, etc.
            var value;

            value = node[methodName] && node[methodName]();

            return value;
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {

            this.logger.info( "executing", nodeID,
                ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType );

            var node = this.private.nodes[nodeID];
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

        private: {

            // == Private variables ================================================================

            types: {}, // maps id => function() { }

            root: undefined,
            nodes: {}, // maps id => new type()

            // == Private functions ================================================================

            // -- getterScript ---------------------------------------------------------------------

            getterScript: function( body ) {
                return this.accessorScript( "( function() {", body, "} )" );
            },

            // -- setterScript ---------------------------------------------------------------------

            setterScript: function( body ) {
                return this.accessorScript( "( function( value ) {", body, "} )" );
            },

            // -- accessorScript -------------------------------------------------------------------

            accessorScript: function( prefix, body, suffix ) {  // TODO: sanitize script, limit access
                if ( body.charAt( body.length-1 ) == "\n" ) {
                    return prefix + "\n" + body.replace( /^./gm, "  $&" ) + suffix + "\n";
                } else {
                    return prefix + " " + body + " " + suffix;
                }
            },

            // -- findGetter -----------------------------------------------------------------------

            findGetter: function( node, propertyName ) {
                return node.getters && node.getters[propertyName] ||
                    Object.getPrototypeOf( node ) && this.findGetter( Object.getPrototypeOf( node ), propertyName );
            },

            // -- findSetter -----------------------------------------------------------------------

            findSetter: function( node, propertyName ) {
                return node.setters && node.setters[propertyName] ||
                    Object.getPrototypeOf( node ) && this.findSetter( Object.getPrototypeOf( node ), propertyName );
            },

        }

    } );

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
