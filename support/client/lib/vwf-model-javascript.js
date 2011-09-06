( function( modules, namespace ) {

    window.console && console.info && console.info( "loading " + namespace );

    // vwf-model-javascript.js is a placeholder for the JavaScript object interface to the
    // simulation.
    // 
    // vwf-model is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern). It
    // attaches to the vwf modules list as vwf.modules.javascript.

    var module = modules[namespace.split(".").pop()] = function( vwf ) {

        if ( ! vwf ) return;

        vwf.logger.info( "creating " + namespace );

        modules.model.call( this, vwf );
        this.namespace = namespace;

        this.types = {}; // maps id => function() { }

        this.root = undefined;
        this.nodes = {}; // maps id => new type()

    };

    // Delegate any unimplemented functions to vwf-model.

    module.prototype = new modules.model();

    // == Response API =============================================================================

    // This is a placeholder for providing a natural integration between simulation and the
    // browser's JavaScript environment.
    // 
    // Within the JavaScript environment, component instances appear as JavaScript objects.
    // 
    //   - Properties appear in the "properties" field. Each property contains a getter and setter
    //     callback to notify the object of property manipulation.
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
    // 

    // -- creatingNode -----------------------------------------------------------------------------

    module.prototype.creatingNode = function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {

        vwf.logger.info( namespace + ".creatingNode " + nodeID + " " +
            nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );

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
        node.getters = {};
        node.setters = {};

        node.methods = {};
        node.events = {};
        node.children = [];

    };

    // -- addingChild ------------------------------------------------------------------------------

    module.prototype.addingChild = function( nodeID, childID, childName ) {

        vwf.logger.info( namespace + ".addingChild " + nodeID + " " + childID + " " + childName );

        var node = this.nodes[nodeID];
        var child = this.nodes[childID];

        child.name = childName;
        child.parent = node;

        if ( node ) {
            node.children.push( child );
            node.children[childName] = child;
            node[childName] = child;  // TODO: if no conflict with other names on node
        }
    };

    // TODO: removingChild

    // -- parenting --------------------------------------------------------------------------------

    module.prototype.parenting = function( nodeID ) {  // TODO: move to a backstop model

        vwf.logger.info( namespace + ".parenting " + nodeID );

        var node = this.nodes[nodeID];

        return node.parent && node.parent.id || 0;
    };

    // -- childrening ------------------------------------------------------------------------------

    module.prototype.childrening = function( nodeID ) {  // TODO: move to a backstop model

        vwf.logger.info( namespace + ".childrening " + nodeID );

        var node = this.nodes[nodeID];

        return jQuery.map( node.children, function( child ) {
            return child.id;
        } );
    };

    // -- naming -----------------------------------------------------------------------------------

    module.prototype.naming = function( nodeID ) {  // TODO: move to a backstop model

        vwf.logger.info( namespace + ".naming " + nodeID );

        var node = this.nodes[nodeID];

        return node.name || "";
    };

    // -- creatingProperty -------------------------------------------------------------------------

    module.prototype.creatingProperty = function( nodeID, propertyName, propertyValue, propertyGet, propertySet ) {

        vwf.logger.info( namespace + ".creatingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];

        Object.defineProperty( node.properties, propertyName, {
            get: function() { return vwf.getProperty( nodeID, propertyName ) }, // "this" is property's node  // TODO: or is it node.properties here?
            set: function( value ) { vwf.setProperty( nodeID, propertyName, value ) },
            enumerable: true
        } );

        // TODO: only if no conflict with other names on node  TODO: recalculate as properties, methods, events are created and deleted; properties take precedence over methods over events, for example

        Object.defineProperty( node, propertyName, {
            get: function() { return vwf.getProperty( nodeID, propertyName ) }, // "this" is property's node
            set: function( value ) { vwf.setProperty( nodeID, propertyName, value ) },
            enumerable: true
        } );

        if ( propertyGet ) {  // TODO: assuming javascript here; how to specify script type?
            try {
                node.getters[propertyName] = eval( getterScript( propertyGet ) );
            } catch( e ) {
                vwf.logger.warn( namespace + ".creatingProperty " + nodeID + " " +
                    propertyName + " " + propertyValue + " exception evaluating getter: " + e );
            }
        } else if ( propertyValue !== undefined ) {
            node.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
        }
        
        if ( propertySet ) {  // TODO: assuming javascript here; how to specify script type?
            try {
                node.setters[propertyName] = eval( setterScript( propertySet ) );
            } catch( e ) {
                vwf.logger.warn( namespace + ".creatingProperty " + nodeID + " " +
                    propertyName + " " + propertyValue + " exception evaluating setter: " + e );
            }
        } else if ( propertyValue !== undefined ) {
            node.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
        }

    };

    // TODO: deletingProperty

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {

        vwf.logger.info( namespace + ".settingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];

        if ( ! node.properties.hasOwnProperty( propertyName ) ) {
            vwf.createProperty( nodeID, propertyName, undefined );
        }

        var setter = findSetter( node, propertyName );

        if ( setter && setter !== true ) {
            try {
                return setter.call( node, propertyValue );
            } catch( e ) {
                vwf.logger.warn( namespace + ".settingProperty " + nodeID + " " +
                    propertyName + " " + propertyValue + " exception in setter: " + e );
            }
        }

        return undefined;
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {

        vwf.logger.info( namespace + ".gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];
        var getter = findGetter( node, propertyName );

        if ( getter && getter !== true ) {
            try {
                return getter.call( node );
            } catch( e ) {
                vwf.logger.warn( namespace + ".gettingProperty " + nodeID + " " +
                    propertyName + " " + propertyValue + " exception in getter: " + e );
            }
        }

        return undefined;
    };

    // TODO: creatingMethod, deletingMethod

    // -- callingMethod ----------------------------------------------------------------------------

    module.prototype.callingMethod = function( nodeID, methodName ) { // TODO: parameters

        vwf.logger.info( namespace + ".callingMethod " + nodeID + " " + methodName ); // TODO: parameters

        var node = this.nodes[nodeID];
        // var method = ... verify it's in node.methods[], search prototypes, etc.
        var value;

        value = node[methodName] && node[methodName]();

        return value;
    };

    // -- executing --------------------------------------------------------------------------------

    module.prototype.executing = function( nodeID, scriptText, scriptType ) {

        vwf.logger.info( namespace + ".executing " + nodeID + " " + ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ) + " " + scriptType );

        var node = this.nodes[nodeID];
        var value;

        if ( scriptType == "application/javascript" ) {
            try {
                value = ( function( scriptText ) { return eval( scriptText ) } ).call( node, scriptText );
            } catch( e ) {
                vwf.logger.warn( namespace + ".executing " + nodeID + " " +
                    ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ) + " " + scriptType +
                    " exception: " + e );
            }
        }

        return value;
    };

    // == Private functions ========================================================================

    // -- getterScript -----------------------------------------------------------------------------

    var getterScript = function( body ) {
        return accessorScript( "( function() {", body, "} )" );
    }

    // -- setterScript -----------------------------------------------------------------------------

    var setterScript = function( body ) {
        return accessorScript( "( function( value ) {", body, "} )" );
    }
    
    // -- accessorScript ---------------------------------------------------------------------------

    var accessorScript = function( prefix, body, suffix ) {  // TODO: sanitize script, limit access
        if ( body.charAt( body.length-1 ) == "\n" ) {
            return prefix + "\n" + body.replace( /^./gm, "  $&" ) + suffix + "\n";
        } else {
            return prefix + " " + body + " " + suffix;
        }
    }

    // -- findGetter -------------------------------------------------------------------------------

    var findGetter = function( node, propertyName ) {
        return node.getters && node.getters[propertyName] ||
            Object.getPrototypeOf( node ) && findGetter( Object.getPrototypeOf( node ), propertyName );
    }

    // -- findSetter -------------------------------------------------------------------------------

    var findSetter = function( node, propertyName ) {
        return node.setters && node.setters[propertyName] ||
            Object.getPrototypeOf( node ) && findSetter( Object.getPrototypeOf( node ), propertyName );
    }




    // == Node =====================================================================================

    var node = function( nodeSource, nodeType ) {

        this.parent = undefined;

        // this.name = nodeName;

        this.source = nodeSource;
        this.type = nodeType;

        this.properties = {};
        this.methods = {};
        this.events = {};
        this.children = [];

    };

    // == Property =================================================================================

    var property = function( node, value ) {

        this.node = node; // TODO: make private
        this.value = value;
        this.get = undefined;
        this.set = undefined;

    };

} ) ( window.vwf.modules, "vwf.model.javascript" );
