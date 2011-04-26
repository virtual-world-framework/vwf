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

    module.prototype.creatingNode = function( nodeID, nodeName, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {

        console.info( "vwf.model.javascript.creatingNode " + nodeID + " " +  nodeName + " " + 
            nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );

        var type = this.types[nodeExtendsID];

        if ( ! type ) {

            var prototype = this.nodes[nodeExtendsID];

            this.types[nodeExtendsID] = type = function() { base.apply( this, arguments ) }; // TODO: base?

            type.prototype = prototype;
            type.prototype.constructor = type; // resetting constructor breaks enumerables?

        }

        this.nodes[nodeID] = new type( nodeName, nodeSource, nodeType );

    };

    // -- settingProperty --------------------------------------------------------------------------

    module.prototype.settingProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.model.javascript.settingProperty " + nodeID + " " + propertyName + " " + propertyValue );

    };

    // -- gettingProperty --------------------------------------------------------------------------

    module.prototype.gettingProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.model.javascript.gettingProperty " + nodeID + " " + propertyName + " " + propertyValue );

    };




Node.prototype.createProperty = function( propertyName, propertyValue ) {

    var property = this.properties[propertyName] = new vwf.property( this, propertyValue );

    Object.defineProperty( this, propertyName, {
        get: function() { return property.value }, // "this" is property's node
        set: function( value ) { property.value = value }, // TODO: getters & setters
        enumerable: true
    } );

    var result = this.setProperty( propertyName, propertyValue );

    vwf.onCreateProperty( this.id, propertyName, propertyValue ); // TODO: redundancy with onSetProperty call

    return result;
};

Node.prototype.setProperty = function( propertyName, propertyValue ) {

    var property = this.properties[propertyName];

    var result = property.set ? property.set.call( this, propertyValue ) : ( property.value = propertyValue );

    vwf.onSetProperty( this.id, propertyName, propertyValue );

    return result;
};

Node.prototype.getProperty = function( propertyName ) {

    var property = this.properties[propertyName] ||
this.prototype.properties[propertyName] || this.prototype.prototype.properties[propertyName]; // TODO: make recursive

    var result =  property.get ? property.get.call( this ) : property.value;

    vwf.onGetProperty( this.id, propertyName );

    return result;
};











    // == Node =====================================================================================

    var node = function( nodeName, nodeSource, nodeType ) {

        this.parent = undefined;

        this.name = nodeName;

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
