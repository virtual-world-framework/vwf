HTML Overlays
===================
-------------------
Two dimensional components may be added to any application via HTML. When an application loads, the framework automatically looks for an HTML file of the same name. For instance, if your application is entitled *index.vwf.yaml*, VWF will look for a file in the same directory called *index.vwf.html*. This HTML is of a standard format, and can, in fact, be loaded standalone in a browser. 

A few additions to the file can attach the 2D content as an overlay directly over the VWF view, and scripts can be added to attach the HTML content to the application pieces itself. 

-------------------

**Overlay HTML Content**

The first step is to create the HTML content as you'd like it to appear on the screen. In the example below, everything contained within the first div can stand alone as it's own HTML file, with standard css rules applied.

	<body>
	  <div id="wrapper" class="wrapper">
	    <div class="toolstyle" id="toolbar">
	      <img id="icon1" src="images/icon1.png" style="border:3px solid red" alt="icon1" 
	        onclick="setMode('mode1')"/>
	      <img id="icon2" src="images/icon2.png" style="border:2px solid black" alt="icon2" 
	        onclick="setMode('mode2')"/>
	    </div>
	  </div>
	  <script type="text/javascript">
	    $('#wrapper').appendTo('#vwf-root');
	  </script>
	</body>

In order to attach the content as an overlay to the application, we've added an additonal script tag, that appends the *wrapper* div to *vwf-root*, or the main application view. 

-------------------

**Allow HTML to Set Application Properties**

Properties of the application or of specific nodes may be set directly in the javascript of an HTML file. In order to set a property, the following syntax should be used. 

	vwf_view.kernel.setProperty("application-vwf", "property1", value);

The first argument is the name of the node containing the given property. In this case, the property is on the application itself. The second parameter is the name of the property to set, and the third argument is the value to be passed to the specified property. 

-------------------

**Allow HTML to Call Application Methods**

Application methods can be called directly from the HTML, with or without parameters. In order to call a method, the following syntax should be used.

	vwf_view.kernel.callMethod("http-vwf-example-com-node2-vwf-nodeName", "method1");

The first argument is the name of the node where the method resides. The second parameter is the name of the method as defined in the main application file. In order to pass parameters directly to the method call, a third parameter may be passed as an array of values. 

	vwf_view.kernel.callMethod("http-vwf-example-com-node2-vwf-nodeName", "method1", parameters);

-------------------

**Create Listeners to Manipulate HTML**

The HTML file can also be setup to react to changes in the application itself. In the instance, the HTML needs to update due to a property change, a function similar to the following may be used.

	vwf_view.satProperty = function (nodeId, propertyName, propertyValue) {
	  if (nodeId == "index-vwf" ) {
	    switch (propertyName) {
	      case "mouseMode":
	        doSomething( propertyValue );
	        break;
        }
      }
	}

In this case, any time a property has been set, this function will check to see if the property was changed on a specific node, and if so, will check the name of the property. It can then do something with the new property value, as needed.

Similar listeners can be setup for other types of application updates as well. A few of the common listeners are listed below.

* Node created - vwf_view.createdNode = function ...
* Node deleted - vwf_view.deletedNode = function ...
* Method called - vwf_view.calledMethod = function ...
* Event fired - vwf_view.firedEvent = function ...

-------------------

