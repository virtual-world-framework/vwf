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

        this.types = {};

        this.root = undefined;
        this.nodes = {};

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

node.id = nodeID;

        node.parent = undefined;

        node.source = nodeSource;
        node.type = nodeType;

        node.properties = {};
        node.methods = {};
        node.events = {};
        node.children = [];

    };

    // -- creatingProperty -------------------------------------------------------------------------

    module.prototype.creatingProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.model.javascript.creatingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];
        var property = node.properties[propertyName] = { node: node, value: propertyValue, get: undefined, set: undefined };

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
        var property = node.properties[propertyName];

        // return property.set ? property.set.call( node, propertyValue ) : ( property.value = propertyValue );
        return node["onSetProperty"] ? node["onSetProperty"].call( node, propertyValue ) : ( property.value = propertyValue );

    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.model.javascript.gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID];
        var property = node.properties[propertyName] ||
( node.__proto__ && node.__proto__.properties[propertyName] ) || ( node.__proto__ && node.__proto__.__proto__ && node.__proto__.__proto__.properties[propertyName] );

        return property.get ? property.get.call( node ) : property.value;

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
