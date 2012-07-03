Querying
===================
-------------------
Within VWF, there are several ways to query for a specific node for use in any application script. The *vwf.find* function runs a search and returns a set of matching nodes. The *vwf.test* function takes in a parameter to test against and returns a boolean value depending on whether the search was successful. 

From a component of the application, the function takes in a search criteria parameter and will run a search on the specified component. Thus, if the function is called on the main application, it will search all nodes of the application. The functions may also be called on any other component of the application, and will run a search on all the children of that node. 

The following query searches for all children nodes of the component on which it is called.

	vwf.find( "/" );

The following query searches for all children nodes of type *camera*.

	vwf.find( "/camera" );

The following query searches for all children nodes of type *camera* with the given ID. 

	vwf.find( "/camera", "http-vwf-example-com-camera-vwf-camera" );

The following query will return a value of false, as a child node of type camera with the given ID does not exist in the application. 

	vwf.test( "/camera", "http-vwf-example-com-camera-vwf-camera-not" );

Additional Queries:

	vwf.find( "/*" );



	vwf.find( "/*", function( id ) { console.info( vwf.name( id ) ) } );



	vwf.find( "/radio/bone1/MaxScene/Radio" );



	vwf.find( [ "radio", "bone1", "MaxScene", "Radio" ] );



	vwf.find( "//Radio" );



	vwf.find( "//Radio/*" );



	vwf.find( "/dir2" );



	vwf.find( [ "", "dir2" ] );



	vwf.find( [ "", "element(dir2)" ] );



	vwf.find( [ "", "element(*,'http://vwf.example.com/light.vwf')" ] );

-------------------

