# Create a 2D Interface

-------------------
Two dimensional components may be added to a user's *view* via HTML.  These components can then interact with the *model* state (update it and be updated from it).  The first step is to create an html file that matches the name of your application's vwf.yaml file.  For example, if your application is titled *application*.vwf.yaml, create a file in the same directory named *application*.vwf.html.  When your application loads, the framework automatically looks for an HTML file by this name.

Inside that file, create a structure like so:

	<body>
	  <div id="wrapper" class="wrapper">

	    (All your html here)

	  </div>
	  <script type="text/javascript">
	    $('#wrapper').appendTo('#vwf-root');
	  </script>
	</body>

Inside the *wrapper* div you can place any valid html. The script at the end appends the *wrapper* div to *vwf-root*, which is the main application view. 

*Note* - The loader strips out header and body tags and inserts content directly into index.html. Including these tags is helpful for testing as a standalone webpage, but not required for VWF. 

-------------------

**Monitor and Change the Simulation State**

The HTML can access the VWF application models through the vwf_view.kernel object. Thus, the HTML can watch what happens within the simulation and make changes to it such as setting properties, calling methods, and firing events. 

The [vwf.api.kernel](jsdoc/symbols/vwf.api.kernel.html) in the [system API](system.html) contains the list of kernel calls that can be made from the HTML.

The following sections show some examples.

-------------------

**Set Properties**

To set a property on an object, we first find a reference to that object and then set the property.  Like so:

	var nodeId = vwf_view.find( ... );
	vwf_view.kernel.setProperty( nodeId, "property1", value );

Explanations of the parameters can be found in the [find](query.html) and [setProperty](jsdoc/symbols/vwf.api.kernel.html#setProperty) documentation.  Note that the call to *find* returns immediately, but *setProperty* and the other kernel calls in this recipe are asynchronous processes - you can know when the property has been set by listening for the *satProperty* event - more on that under *Monitor the Simulation to Manipulate HTML* - and yes ... we know that *sat* is not really the past tense of *set*.

-------------------

**Call Methods**

To call an application method from HTML, you need to find a reference to the object (in the same manner as above) and then call the method like so:

	vwf_view.kernel.callMethod( nodeId, "method1" );

To pass parameters to the method, a third parameter may be passed as an array of values. 

	vwf_view.kernel.callMethod( nodeId, "method1", [ parameter1, parameter2, etc ] );

Explanations of the parameters can be found in the [callMethod](jsdoc/symbols/vwf.api.kernel.html#callMethod)  API description.

-------------------

**Create Components**

To create a component from HTML, the following syntax should be used:

	vwf_view.kernel.createChild( nodeId, "componentName", component, callback );

Explanations of the parameters can be found in the [createChild](jsdoc/symbols/vwf.api.kernel.html#createChild) API description.

-------------------

**Monitor the Simulation from HTML**

The HTML can reflect changes to the simulation such as property updates, method calls, or events. The following example enables the HTML to catch property changes in the application. 

	vwf_view.satProperty = function (nodeId, propertyName, propertyValue) {
	  if ( nodeId == someSpecificNodeId ) {
	    switch ( propertyName ) {
	      case "mouseMode":
	        doSomething( propertyValue );
	        break;
        }
      }
	}

In this case, any time a property has been set, this function will check to see if the property was changed on a specific node, and if so, will check the name of the property. If it is the property we are looking for, we can write javascript to update the HTML state.

Similarly, the HTML can monitor other application updates, such as those listed below:

* Method called - vwf_view.calledMethod = function ...
* Event fired - vwf_view.firedEvent = function ...
* Node created - vwf_view.createdNode = function ...
* Node deleted - vwf_view.deletedNode = function ...

Earlier we mentioned that calls to set a property and call a method are asynchronous.  If you would like to know when the action has completed, you may do so in satProperty/calledMethod/etc.  However, remember that you will get calls into those event handlers for every property/method/etc that is set/called/etc.

-------------------

