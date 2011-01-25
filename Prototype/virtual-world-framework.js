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

    VirtualWorldFramework.world = undefined;

    VirtualWorldFramework.initialize = function( rootElementSelector ) {

        var worldURI = jQuery.getQueryString( "world" );
        // alert( "initialized: world = " + worldURI );

        jQuery.getJSON( worldURI, function( data ) { VirtualWorldFramework.load( data, rootElementSelector ) } );

	};

    VirtualWorldFramework.load = function( data, rootElementSelector ) {

        VirtualWorldFramework.world = data;

        // alert( "loading: title = " + data.title );

console.log( "world " + VirtualWorldFramework.world.children.length );
        
        jQuery.each( VirtualWorldFramework.world.children, function( index, value ) {
            var childQuery = VirtualWorldFramework.findOrCreate( jQuery( rootElementSelector ), index );


if ( value.children )
{
console.log( "parent " + value.children.length );
            jQuery.each( value.children, function( index, value ) {
                VirtualWorldFramework.findOrCreate( childQuery, index );
            } );
}
        } );

    };
    
    VirtualWorldFramework.findOrCreate = function( parentQuery, childName ) {

        var parentClass = parentQuery.attr( "class" ) || "";
        var parentDepth = Number( ( " " + parentClass + " " ).match( / vwf-depth-(\d+) / )[1] || "0" );

        var childDepth = parentDepth + 1;
        var childClass = "vwf-node vwf-depth-" + childDepth;

        var childQuery = parentQuery.append( "<div id='" + childName + "' class='" + childClass + "'></div>" ).children().last().
            append( "<p>" + childName + "</p>" ).children().last().
                // append( "<div id='" + childName + "b' class='vwf-node vwf-depth-2'></div>" ).children().last().
                //     append( "<p>" + childName + "b</p>" ).
                // end().end().
            end().end();

        return childQuery;

    };

    return window.VirtualWorldFramework = VirtualWorldFramework;

} ) ( window );
