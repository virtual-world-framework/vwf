Querying
===================
-------------------
Within VWF, there are several ways to query for a specific node for use in any application script. The *this.find* function runs a search and returns a set of matching nodes. The *this.test* function takes in a parameter to test against and returns a boolean value depending on whether the search was successful. 

From a component of the application, the function takes in a search criteria parameter and will run a search on the specified component. Thus, if the function is called on the main application, it will search all nodes of the application. The functions may also be called on any other component of the application, and will run a search on all the children of that node. 

The remainer of this section will focus on how to use the find and test query functions and provide several examples of various scenarios. 

-------------------

**Example Queries**

The following query will search for the node on which it is called. This is most useful if called from the kernel (ie. using a vwf.find), it will return the root of the application.

	this.find( "/" );

The following query searches for all children nodes of type *camera*.

	this.find( "/camera" );

The following query searches for all children nodes of type *camera* with the given ID. 

	this.find( "/camera", "http-this-example-com-camera-this-camera" );

The following query will return a value of *false*, as a child node of type camera with the given ID does not exist in the application. 

	this.test( "/camera", "http-this-example-com-camera-this-camera-not" );

The following query will search for all children nodes of the component on which it is called.

	this.find( "/*" );

This call will execute the function defined for each ID that is returned from the query. 

	this.find( "/*", function( id ) { console.info( this.name( id ) ) } );

The following query will return any nodes with the specified path. 

	this.find( "/radio/bone1/MaxScene/Radio" );

Similary, the following query will return a direct child of the node with a path matching *dir2*. 

	this.find( "/dir2" );

The *//* represents all children at any level beneath the node upon which the query is called. The following query will return any nodes within the scene matching Radio.

	this.find( "//Radio" );

The following query will return child nodes at any level that match Radio and have at least one child. 

	this.find( "//Radio/*" );

The element keyword can also be used to specify search criteria.

	this.find( "element(dir2)" );

The following query will return all nodes of the specified type. 

	this.find( "element(*,'http://this.example.com/light.this')" );

The following query will return all children with *name1* who have a child with *name2*.

	this.find( "name1[name2]" );

The following query will return all children that have at least one child.

	this.find( "*[*]" );

Properties can also be used in a query. The following query searches for all children of *name1* that have the given property condition. 

	this.find( "name1[@property]" );

-------------------

