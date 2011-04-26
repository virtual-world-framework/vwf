( function( modules ) {

    console.info( "loading vwf.model.javascript" );

    var module = modules.javascript = function( vwf ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.model.javascript" );

        modules.model.call( this, vwf );

        this.types = {};

        this.root = undefined;
        this.nodes = {};

        return this;
    };

    module.prototype = new modules.model();

    // -- creatingNode -----------------------------------------------------------------------------

    module.prototype.creatingNode = function( nodeID, nodeName, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {

        console.info( "vwf.model.javascript.creatingNode " + nodeID + " " +  nodeName + " " +  nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );

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






    // -- xxx --------------------------------------------------------------------------------------

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










} ) ( window.vwf.modules );



