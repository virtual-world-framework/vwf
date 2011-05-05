( function( modules ) {

    console.info( "loading vwf.model.javascript" );

    // vwf-model-javascript.js is a placeholder for the JavaScript object interface to the
    // simulation.
    // 
    // vwf-model is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern). It
    // attaches to the vwf modules list as vwf.modules.javascript.

    var module = modules.javascript = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.model.javascript" );

        modules.model.call( this, vwf );

        this.types = {}; // id => function() { }

        this.root = undefined;
        this.nodes = {}; // id => new type()

        return this;
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

        console.info( "vwf.model.javascript.creatingNode " + nodeID + " " +
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
        node.methods = {};
        node.events = {};
        node.children = [];

    };

    // -- addingChild ------------------------------------------------------------------------------

    module.prototype.addingChild = function( nodeID, childID, childName ) {

        console.info( "vwf.model.javascript.addingChild " + nodeID + " " + childID + " " + childName );

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

        console.info( "vwf.model.javascript.parenting " + nodeID );

        var node = this.nodes[nodeID];

        return node.parent && node.parent.id || 0;
    };

    // -- childrening ------------------------------------------------------------------------------

    module.prototype.childrening = function( nodeID ) {  // TODO: move to a backstop model

        console.info( "vwf.model.javascript.childrening " + nodeID );

        var node = this.nodes[nodeID];

        return jQuery.map( node.children, function( child ) {
            return child.id;
        } );
    };

    // -- naming -----------------------------------------------------------------------------------

    module.prototype.naming = function( nodeID ) {  // TODO: move to a backstop model

        console.info( "vwf.model.javascript.naming " + nodeID );

        var node = this.nodes[nodeID];

        return node.name || "";
    };

    // -- creatingProperty -------------------------------------------------------------------------

    module.prototype.creatingProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.model.javascript.creatingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];

        var property = node.properties[propertyName] = {
            getter: undefined,
            setter: undefined,
            value: undefined,
            getting: false, // TODO: make private?
            setting: false, // TODO: make private?
            internal: propertyValue // TODO: make private?
        };

        Object.defineProperty( property, "value", {
            get: function() { return vwf.getProperty( nodeID, propertyName ) }, // "this" is property's node
            set: function( value ) { vwf.setProperty( nodeID, propertyName, value ) }
        } );

        // TODO: if no conflict with other names on node

        Object.defineProperty( node, propertyName, {
            get: function() { return vwf.getProperty( nodeID, propertyName ) }, // "this" is property's node
            set: function( value ) { vwf.setProperty( nodeID, propertyName, value ) },
            enumerable: true
        } );

    };

    // TODO: deletingProperty

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.model.javascript.settingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];
        var property = node.properties[propertyName]; // TODO: search recursively through prototypes and copy on write.

        if ( property.setter && !property.setting ) {
            property.setting = true;
            value = property.setter.call( node, propertyValue );
            property.setting = false;
        } else {
            value = property.internal = propertyValue;
        }

        return value;
    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.model.javascript.gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];
        var property = node.properties[propertyName] || ( node.__proto__ && node.__proto__.properties[propertyName] ) || ( node.__proto__ && node.__proto__.__proto__ && node.__proto__.__proto__.properties[propertyName] ); // TODO: search recursively through prototypes.

        if ( property.getter && !property.getting ) {
            property.getting = true;
            value = property.getter.call( node );
            property.getting = false;
        } else {
            value = property.internal;
        }

        return value;
    };

    // -- executing --------------------------------------------------------------------------------

    module.prototype.executing = function( nodeID, scriptText, scriptType ) {

        console.info( "vwf.model.javascript.executing " + nodeID + " " + ( scriptText || "" ).substring( 0, 16 ) + " " + scriptType );

        var node = this.nodes[nodeID];

        if ( scriptType == "application/javascript" ) { // TODO: or others
            ( function( scriptText ) { eval( scriptText ) } ).call( node, scriptText );
        }

    };









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

} ) ( window.vwf.modules );
