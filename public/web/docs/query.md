Querying
===================
-------------------
Within VWF, there are several ways to query for a specific node for use in any application script. The vwf.match function takes in the searchable node as the first parameter. In this case, *index-vwf* is the application root node, so all queries will be run on the whole application. The second parameter takes the criteria for the query. 

The following query searches for all children nodes of the application.

	vwf.match( "index-vwf", "/" );

The follwoing query searches for all children nodes of type *camera*.

	vwf.match( "index-vwf", "/camera" );

Additional queries: 

	vwf.match( "index-vwf", "/camera", "http-vwf-example-com-camera-vwf-camera" );



	vwf.match( "index-vwf", "/camera", "http-vwf-example-com-camera-vwf-camera-not" );



	vwf.match( "index-vwf", "/*" );



	vwf.match( "index-vwf", "/*", function( id ) { console.info( vwf.name( id ) ) } );



	vwf.match( "index-vwf", "/radio/bone1/MaxScene/Radio" );



	vwf.match( "index-vwf", [ "radio", "bone1", "MaxScene", "Radio" ] );



	vwf.match( "index-vwf", "//Radio" );



	vwf.match( "index-vwf", "//Radio/*" );



	vwf.match( "index-vwf", "/dir2" );



	vwf.match( "index-vwf", [ "", "dir2" ] );



	vwf.match( "index-vwf", [ "", "element(dir2)" ] );



	vwf.match( "index-vwf", [ "", "element(*,'http://vwf.example.com/light.vwf')" ] );

-------------------

