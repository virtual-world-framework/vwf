<a name="querying" />

<div class="well" markdown="1">
Querying
===================
-------------------

Within VWF, there are several ways to query for a specific node for use in any application script. The *this.find* function runs a search and returns a set of matching nodes. The *this.test* function takes in a parameter to test against and returns a boolean value depending on whether the search was successful. 

From a component of the application, the function takes in a search criteria parameter and will run a search on the specified component. Thus, if the function is called on the main application, it will search all nodes of the application. The functions may also be called on any other component of the application, and will run a search on all the children of that node. 

The remainer of this section will focus on how to use the find and test query functions and provide several examples of various scenarios. 

-------------------

## Example Queries

### On the application level (in the [model](architecture.html))

The following will return any nodes with the specified path. 

	this.find( "/radio/bone1/MaxScene/Radio" );

The following will search for all children nodes of the component on which it is called.

	this.find( "/*" );

This call will execute the function defined for each ID that is returned from the query. 

	this.find( "/*", function( id ) { console.info( this.name( id ) ) } );

The *//* represents all children at any level beneath the node upon which the query is called. The following query will return any nodes within the scene matching Radio.

	this.find( "//Radio" );

The following query will return nodes at any level that have a parent named *Radio*. 

	this.find( "//Radio/*" );

The element keyword can also be used to specify search criteria (note that it is sensitive to white space - do not put spaces in the parameter list).

	this.find( "element(dir2)" );

The following query will return descendent nodes of the specified type (again, no spaces in *element*'s parameter list). 

	this.find( ".//element(*,'http://vwf.example.com/light.vwf')" )

The following query will return all children with *name1* who have a child with *name2*.

	this.find( "name1[name2]" );

The following query will return all children that have at least one child.

	this.find( "*[*]" );

Properties can also be used in a query. The following query searches for all children of *name1* that have the given property condition. 

	this.find( "name1[@property]" );

To test whether a node with certain criteria exist, use *test()* with the same parameters as *find()*. It will return true or false.

	this.test( "/camera" );

### On the driver level (in the [view](architecture.html))

The driver-level syntax is very similar, with three exceptions:

1. *find()* or *test()* is called on the view object instead of a node in the scene.
2. An extra parameter is added to the beginning for the id of the node from which you are searching - this can be *undefined* for absolute path searches (those that begin with a slash).
3. *find()* returns an array of ids corresponding to the matched nodes, rather than a reference to the node itself (since at the driver level all access to nodes is done through their ids).

For example:

	var matchedIds = vwf_view.kernel.find( parentNodeId, "/radio/bone1/MaxScene/Radio" );
	var nodeExists = vwf_view.kernel.test( nodeId, "/*" );

</div>
-------------------