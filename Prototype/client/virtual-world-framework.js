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

( function( window ) {

    var VirtualWorldFramework = function() { };

    VirtualWorldFramework.socket = undefined;
    VirtualWorldFramework.world = undefined;

    VirtualWorldFramework.initialize = function( rootElementSelector ) {

        VirtualWorldFramework.socket = new io.Socket();
        VirtualWorldFramework.socket.on( "connect", function() { console.log( "(client) Connected" ) } );

        VirtualWorldFramework.socket.on( "message", function( message ) {
            console.log( "(client) Message: " + message );

            time_statement = message.split( " " );
            property_value = time_statement[1].split( "=" );

            VirtualWorldFramework.world.properties.values[property_value[0]] = property_value[1];
console.log( "(client) " + "vwf-root.Properties." + property_value[0] + " / " + property_value[0] + ": " + property_value[1] );
            jQuery( "#vwf-root-Properties-" + property_value[0] ).children().text( property_value[0] + ": " + property_value[1] );

        } );

        VirtualWorldFramework.socket.on( "disconnect", function() { console.log( "(client) Disconnected" ) } );

        VirtualWorldFramework.socket.connect();
        // VirtualWorldFramework.socket.send( "Test message" );


        var worldURI = jQuery.getQueryString( "world" );
        var parentQuery = jQuery( rootElementSelector );

        // jQuery.getJSON( worldURI + "?callback=?", function( data ) { VirtualWorldFramework.loadWorld( parentQuery, data ) } );

        jQuery.ajax( {
            url: worldURI,
            dataType: "jsonp",
            jsonpCallback: "cb",
            success: function( data ) {
                VirtualWorldFramework.loadWorld( parentQuery, data )
            }
        } );

        return parentQuery;

	}; // initialize

    VirtualWorldFramework.loadWorld = function( parentQuery, data ) {

        VirtualWorldFramework.world = data;

        parentQuery.addClass( "vwf-node vwf-depth-0" );

        VirtualWorldFramework.createProperties( parentQuery, data.properties );
        VirtualWorldFramework.createMethods( parentQuery, data.methods );
        VirtualWorldFramework.createEvents( parentQuery, data.events );
        VirtualWorldFramework.createChildren( parentQuery, data.children );
        
    }; // loadWorld

    VirtualWorldFramework.createProperties = function( parentQuery, properties ) {

        if ( properties ) {

            Object.defineProperty( properties, "values", { value: {}, enumerable: false } );

            var containerQuery = VirtualWorldFramework.createBlock( parentQuery, "Properties", "vwf-properties", true );

            jQuery.each( properties, function( index, value ) {

                properties.values[index] = value;

                Object.defineProperty( properties, index, {

                    get: function() {
                        console.log( "get " + index );
                        return properties.values[index];
                    },

                    set: function( value ) {
                        console.log( "set " + index );
                        VirtualWorldFramework.socket.send( "0 " + index + "=" + value );
                        // childQuery.children().text( index + ": " + value );
                        // properties.values[index] = value;
                    }

                } );



                var childQuery = VirtualWorldFramework.createBlock( containerQuery, index, "vwf-property", true );
                childQuery.children().text( index + ": " + value );



            } );

        }
        
    }; // createProperties

    VirtualWorldFramework.createMethods = function( parentQuery, methods ) {

        if ( methods ) {

            var containerQuery = VirtualWorldFramework.createBlock( parentQuery, "Methods", "vwf-methods", true );

            jQuery.each( methods, function( index, value ) {
                var childQuery = VirtualWorldFramework.createBlock( containerQuery, index, "vwf-method", true );
                // record value
            } );

        }
        
    }; // createMethods

    VirtualWorldFramework.createEvents = function( parentQuery, events ) {

        if ( events ) {

            var containerQuery = VirtualWorldFramework.createBlock( parentQuery, "Events", "vwf-events", true );

            jQuery.each( events, function( index, value ) {
                var childQuery = VirtualWorldFramework.createBlock( containerQuery, index, "vwf-event", true );
                // record value
            } );

        }
        
    }; // createProperties

    VirtualWorldFramework.createChildren = function( parentQuery, children ) {

        if ( children ) {

            // make container: class = vwf-children
            // make each child: class = vwf-node, vwf-depth

            var parentClass = parentQuery.attr( "class" ) || "";
            var parentDepth = Number( ( " " + parentClass + " " ).match( / vwf-depth-(\d+) / )[1] || "0" );

            var childDepth = parentDepth + 1;
            var childClass = "vwf-node vwf-depth-" + childDepth;

            var containerQuery = VirtualWorldFramework.createBlock( parentQuery, "Children", "vwf-children vwf-depth-" + childDepth, true );

            jQuery.each( children, function( index, value ) {
                // var childQuery = VirtualWorldFramework.findOrCreate( parentQuery, index );
                var childQuery = VirtualWorldFramework.createBlock( containerQuery, index, childClass, true );
                VirtualWorldFramework.createChildren( childQuery, value.children );
            } );

        }

    }; // createChildren


    // A node, a container for properties, methods, events, or children, or property, method, or event.
    
    // node container (children): id = path.from.root.children, class = vwf-children, label = "children"
    // property container: id = path.from.root.properties, class = vwf-properties, label = "properties"
    // method container: id = path.from.root.methods, class = vwf-properties, label = "methods"
    // event container: id = path.from.root.events, class = vwf-properties, label = "events"

    // node: id = path.from.root.children.name (cleaned), class = vwf-node, vwf-depth-xxx, label = name
    // property: id = path.from.root.properties.name (cleaned), class = vwf-property, label = ?
    // method: id = path.from.root.methods.name (cleaned), class = vwf-method, label = ?
    // event: id = path.from.root.events.name (cleaned), class = vwf-event, label = ?

    VirtualWorldFramework.createBlock = function( parentQuery, childName, childClass, labelChild ) {

        var parentID = parentQuery.attr( "id" ) || "";
        var childID = ( parentID && parentID + "-" ) + childName;

        var childIDHTML = childID ? "id='" + childID + "' " : "";
        var childClassHTML = childClass ? "class='" + childClass + "' " : "";

        var childQuery = parentQuery.append( "<div " + childIDHTML + childClassHTML + "></div>" ).children().last();
        
        if ( labelChild )
        {
            var childLabelHTML = childName;
            var childLabelClassHTML = "class='vwf-label'";

            childQuery.append( "<p " + childLabelClassHTML + ">" + childLabelHTML + "</p>" );
        }

        return childQuery;

    }; // createBlock


    var Node = VirtualWorldFramework.node = function() {

        this.parent = undefined;
        this.children = [];

        this.properties = [];
        this.methods = [];
        this.events = [];

    };

    Node.prototype.createProperty = function( name, value ) {

        var property = new Property( value );

        Object.defineProperty( this.properties, name, {
            get: function() { return property.value; },
            set: function( value ) { property.value = value; }
        } );

    };

    var Property = VirtualWorldFramework.property = function( value ) {

        this.changing = new Event();
        this.changed = new Event();

        this.value = value;

    };

    var Event = VirtualWorldFramework.event = function() {

        this.listeners = [];

    };

    Event.prototype.fire = function() {

        jQuery.each( listeners, function( index, value ) {
            value();
        } );

    };
    
    return window.vwf = VirtualWorldFramework;

} ) ( window );
