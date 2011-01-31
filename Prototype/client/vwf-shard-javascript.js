( function( window ) {

    var JavaScriptShard = function( vwf ) {

        if ( ! vwf ) return;

        var map = {};

        var types = {};






        
        this.onConstruct = function( nodeID, nodeName, ... nodeExtends, nodeImplements ..., nodeSource, nodeType ) {

            if ( nodeExtends && types[nodeExtends] ) {
                map[nodeID] = new types[nodeExtends]( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType );
            } else {
                map[nodeID] = new vwf.Node( nodeID, nodeName, nodeExtends, nodeImplements, nodeSource, nodeType );
            }

if ( nodeID == 0 ) vwf.root = map[nodeID];

        };

        this.onDestruct = function( nodeID ) {
        
        };

        this.onChildAdded = function( nodeID, childID ) { // TODO: node undef for root?

            var node = map[nodeID];
            var child = map[childID];

            node.children[child.name] = child;
            node.children.push( child );

            Object.defineProperty( node, child.name, {
                get: function() { return child },
                set: function( child ) { }, // TODO
                enumerable: true
            } );
        };

        this.onChildRemoved = function( nodeID ) {
        
        };

        this.onResolveAddress = function( nodeID ) {
        
        };
    
        this.onChildren = function( nodeID ) {
        
        };

        this.onCreateProperty = function( nodeID, propertyName, propertyValue ) {

            var node = map[nodeID];
            var property = node.properties[propertyName] = new vwf.Property( node, propertyValue );

            Object.defineProperty( node, propertyName, {
                get: function() { return vwf.getProperty( nodeID, propertyName ) }, // "this" is property's node
                set: function( value ) { vwf.setProperty( nodeID, propertyName, value ) },
                enumerable: true
            } );

// property.set = function( value ) { return this.properties[propertyName].value = value };
// property.get = function() { return this.properties[propertyName].value; };

            return this.onSetProperty( nodeID, propertyName, propertyValue );
        };

        this.onSetProperty = function( nodeID, propertyName, propertyValue ) {

            var node = map[nodeID];
            var property = node.properties[propertyName];

            return property.set ? property.set.call( node, propertyValue ) : ( property.value = propertyValue );
        };

        this.onGetProperty = function( nodeID, propertyName ) {
        
            var node = map[nodeID];
            var property = node.properties[propertyName] ||
node.prototype.properties[propertyName] || node.prototype.prototype.properties[propertyName];

            return property.get ? property.get.call( node ) : property.value;
        };

        this.onCreateMethod = function( nodeID, methodName ) {
        
        };

        this.onCallMethod = function( nodeID, methodName ) {
        
        };

        this.onCreateEvent = function( nodeID, eventName ) {
        
        };

        this.onFireEvent = function( nodeID, eventName ) {
        
        };

        this.onExecute = function( nodeID, scriptText, scriptType ) {

        };

        this.onTick = function( time ) {
        
        };






        JavaScriptShard.createTestClasses = function() {
            

vwf.makingPrototypes = true;

// var node = function( name, source, type )
// {
//     if ( arguments.length > 0 )
//     {
//         this.name = name;
//         this.source = source;
//         this.type = type;
// 
//         this.properties = {};
//     }
// };

// var node3 = function( name, source, type, transform )
// {
//     node.call( this, name, source, type );
//     
//     if ( arguments.length > 0 )
//     {
//         this.properties.transform = transform;
//     }
// };

// node3.prototype = new node();
// node3.prototype.constructor = node3; // with defineProperty to disable enum?








        // base: { properties: { basep1: true, basep2: [ 1, 2, 3 ] } }

        var base = types["base"] = function() { vwf.Node.apply( this, arguments ) };

var basePrototypeID = vwf.createNode( "base" );
map[basePrototypeID].this_is_the_base_prototype = true;
        base.prototype = map[basePrototypeID]; // new Node( /* { properties: { basep1: true, basep2: [ 1, 2, 3 ] } } */ );
        base.prototype.constructor = base;

        vwf.createProperty( basePrototypeID, "basep1", true );

        // base.prototype.properties["basep1"] = new Property( base.prototype, true );
        // 
        // Object.defineProperty( base.prototype, "basep1", {
        //     get: function() { return base.prototype.properties["basep1"].value },
        //     set: function( value ) { base.prototype.properties["basep1"].value = value },
        //     enumerable: true
        // } );

        vwf.createProperty( basePrototypeID, "basep2", [ 1, 2, 3 ] );

        // base.prototype.properties["basep2"] = new Property( base.prototype, [ 1, 2, 3 ] );
        // 
        // Object.defineProperty( base.prototype, "basep2", {
        //     get: function() { return base.prototype.properties["basep2"].value },
        //     set: function( value ) { base.prototype.properties["basep2"].value = value },
        //     enumerable: true
        // } );

        // derived: { properties: { derivedp1: "abcde" } }

        var derived = types["derived"] = function() { base.apply( this, arguments ) };

var derivedPrototypeID = vwf.createNode( "derived", "base" );
map[derivedPrototypeID].this_is_the_derived_prototype = true;
        derived.prototype = map[derivedPrototypeID]; // new base( /* { properties: { derivedp1: "abcde" } } */ );
        derived.prototype.constructor = derived;

        // derived.prototype.properties["derivedp1"] = new Property( derived.prototype, "abcde" );
        // 
        // Object.defineProperty( derived.prototype, "derivedp1", {
        //     get: function() { return derived.prototype.properties["derivedp1"].value },
        //     set: function( value ) { derived.prototype.properties["derivedp1"].value = value },
        //     enumerable: true
        // } );

        vwf.createProperty( derivedPrototypeID, "derivedp2", "abcde" );




vwf.makingPrototypes = false;

        }; // createTestClasses







        
        return this;

    };
    
    return window.vwf.js = JavaScriptShard;

} ) ( window );
