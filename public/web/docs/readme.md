Getting Started
===============
* * *

Virtual World Framework (VWF) is a collaborative training platform that is scalable, sustainable and can be run via a browser.

* * *

The most basic implementation of VWF is a single asset in a COLLADA format. A URL pointing directly to an asset COLLADA file (.dae) with no code will result in a scene containing the specified asset with default light, camera, and navigation.

Sample URL: *http://vwf.example.com/application/hello.dae*

* * *

An asset can be wrapped in a VWF application by specifying the source file in the code.

Code View: *index.vwf.yaml*

	---
	source: hello.dae

Sample URL: *http://vwf.example.com/application/index.vwf*

* * *

Prototypes for nodes are defined within the framework. Extend these prototypes and specify a file source to create application components. For example, an application child can extend a node type with a COLLADA file.

	--- 
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml

* * *

An application scene can extend the navscene type and transform properties may be set directly on a child node.

Code View: *index.vwf.yaml*

	--- 
	extends: http://vwf.example.com/navscene.vwf
	children: 
	  hello: 
	    extends: http://vwf.example.com/node3.vwf
	    source: hello.dae
	    type: model/vnd.collada+xml
	    properties: 
	      translation: [ 0, 0, 0 ]

Sample URL: *http://vwf.example.com/web/example/1/*

<!-- <iframe src="../../web/example/1">Example 1</iframe> -->
<div style="text-align:center">
<span style="color:3399FF" onclick="document.getElementById('ex1_frame').src = '../../web/example/1'">Activate Application</span><br/><br/>
<iframe id="ex1_frame" src="about:blank" style="width:100%;"></iframe>
</div>

* * *

Nodes inherit data from their prototype, including the following:

*   Source / Type
	*   Specifying a source or type within a derived node replaces the value in the prototype.
*   Properties / Methods / Events
	*   A derived node's definition augments those in the prototype.
	*   Creating one of a new name is a new definition
	*   Using an existing name overrides the prototype's definition
*   Children
    * A derived node's children augment the prototype
    * Creating one of a new name is a new definition
    * Using an existing name configures the definition from the prototype
*   Scripts
    * A derived node's scripts augment the prototype
	
* * *

Add additional children to the application and set their properties. 

Code View: *index.vwf.yaml*

	--- 
	extends: http://vwf.example.com/navscene.vwf
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  translation: [ 0, 0, 5 ]
		  rotation: [ 1, 0, 0, 0]
		  scale: 1
	  world:
		extends: http://vwf.example.com/node3.vwf
		source: world.dae
		type: model/vnd.collada+xml
		properties:
		  translation: [ 0, 0, -5 ]
		  rotation: [ 1, 0, 0, 0]
		  scale: 1

Sample URL: *http://vwf.example.com/web/example/2/*

<!-- <iframe src="../../web/example/2">Example 2</iframe> -->
<div style="text-align:center">
<span style="color:3399FF" onclick="document.getElementById('ex2_frame').src = '../../web/example/2'">Activate Application</span><br/><br/>
<iframe id="ex2_frame" src="about:blank" style="width:100%;"></iframe>
</div>

* * *

**Note:** A component specification may be an object literal, an uniform resource identifier (URI) to a .vwf or another type such as .dae, or a JSON-encoded object (primarily for use in the single-user mode application= URI parameter). Components may appear as an extends, implements, or child within the application or another component. 

* * *

Define properties of the application and children with or without accessors.

	--- 
	extends: http://vwf.example.com/navscene.vwf
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml
	    properties:
          translation:
            set: |
              this.translation = value;
            value: [ 0, 0, 5 ]

* * *

Specifying set or get as null prevents writing and/or reading, respectively.

	--- 
	extends: http://vwf.example.com/navscene.vwf
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml
	    properties:
          translation:
            set: null
			get: null
			
* * *	  

Bind children of the application to child nodes defined in the asset file and modify their properties. Set materials with direct access from the main node to the material node of the asset file, without defining the entire structure in code.

Code View: *index.vwf.yaml*

	---
	extends: http://vwf.example.com/navscene.vwf
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  translation: [ 0, 0, 5 ]
		children:
		  HelloMaterial:
			extends: http://vwf.example.com/material.vwf
			properties: 
			  texture: "images/red.png"
	  world:
		extends: http://vwf.example.com/node3.vwf
		source: world.dae
		type: model/vnd.collada+xml
		properties:
		  translation: [ 0, 0, -5 ]
		children:
		  WorldMaterial:
			extends: http://vwf.example.com/material.vwf
			properties: 
			  texture: "images/blue.png"
		  
URL: *http://vwf.example.com/web/example/3/*

<!-- <iframe src="../../web/example/3">Example 3</iframe> -->
<div style="text-align:center">
<span style="color:3399FF" onclick="document.getElementById('ex3_frame').src = '../../web/example/3'">Activate Application</span><br/><br/>
<iframe id="ex3_frame" src="about:blank" style="width:100%;"></iframe>
</div>

* * *

The properties of the default lighting and navigation can be specified within the application file.

	---
	children:
	  maincamera:
        extends: http://vwf.example.com/camera.vwf
		properties:
		  rotation: [ 1, 0, 0, 90 ]

* * *

Assemble applications from content on multiple servers.

	--- 
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml
	  world:
		extends: http://vwf.example.com/node3.vwf
		source: http://anotherserver.com/world.dae
		type: model/vnd.collada+xml

* * *

Specify methods related to children of application.

	--- 
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  rotation: [ 1, 0, 0, 0]
		methods:
		  click: this.rotation.z += 5

* * *

Move the child of the application or asset to a component, placing related code in a separate .yaml file. Reuse the created component on other assets.

Code View: *rotate.vwf.yaml*

	---
	methods:
	  click: this.rotation.z += 5
    
Code View: *index.vwf.yaml*

	---
	children:
	  hello:
	    extends: rotate.vwf
	    source: hello.dae
	  world:
	    extends: rotate.vwf
	    source: world.dae

URL: *http://vwf.example.com/application/index.vwf*

* * *

Add JavaScript functions to application components by defining scripts as a child of the application or a specific component. Prototypes define some functions that can be extended, such as pointerClick.

Code View: *index.vwf.yaml*

	---
	extends: http://vwf.example.com/navscene.vwf
	children:
	  hello:
		extends: http://vwf.example.com/node3.vwf
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  translation: [ 0, 0, 5 ]
		children:
		  HelloTextMaterial1:
            extends: http://vwf.example.com/material.vwf
            properties: 
              texture: ""
        scripts:
        - |
            this.pointerClick = function() {
              if( this.HelloTextMaterial1.texture == "images/red.png" )
              {
                this.HelloTextMaterial1.texture = "images/blue.png";
              }
              else
              {
                this.HelloTextMaterial1.texture = "images/red.png";
              }
            }
	  world: 
		extends: http://vwf.example.com/node3.vwf
		source: world.dae
		type: model/vnd.collada+xml
		properties: 
		  translation: [ 0, 0, -5 ]
		children:
		  WorldTextMaterial1:
			extends: http://vwf.example.com/material.vwf
			properties: 
			  texture: ""
	    scripts:
	    - |
		    this.pointerClick = function() {
              if( this.WorldTextMaterial1.texture == "images/red.png" )
              {
                this.WorldTextMaterial1.texture = "images/blue.png";
              }
              else
              {
                this.WorldTextMaterial1.texture = "images/red.png";
              }
            }

URL: *http://vwf.example.com/web/example/4/*

In this example, clicking on an object will run the pointerClick function, changing the color of the object's material. 

<!-- <iframe src="../../web/example/4">Example 4</iframe> -->
<div style="text-align:center">
<span style="color:3399FF" onclick="document.getElementById('ex4_frame').src = '../../web/example/4'">Activate Application</span><br/><br/>
<iframe id="ex4_frame" src="about:blank" style="width:100%;"></iframe>
</div>

* * *

Define additional HTML and jQuery components in an index.vwf.html file. The application will look for a file of this name on load, and will load any scripts or two dimensional components identified. This HTML file interaction can bind user interface components to children and properties defined in the application file. The following example shows the JavaScript defined in the HTML file interacting with the property defined in the YAML file.

Code View: *index.vwf.yaml*

	--- 
	extends: http://vwf.example.com/node.vwf
	children: 
	  game:
		extends: http://vwf.example.com/node.vwf
		properties:
		  position01: [ 0, 0 ]

Code View: *index.vwf.html*

	<!DOCTYPE html>
	<html>
	  <head>
		<script type="text/javascript">
		  function sample() {
			// Set property value in the application
			vwf_view.kernel.setProperty( "http-vwf-example-com-node-vwf-game", 
									  "position01", some_position );
		  }

		  // Defines a function to execute upon an application property change	
		  vwf_view.satProperty = function (nodeId, propertyName, propertyValue) {
      		if (nodeId == "http-vwf-example-com-node-vwf-game" ) {
      	  	  switch (propertyName) {
      			case "position01":
      		  	  doSomething( propertyValue );
      		  	  break;
          	  }
        	}
      	  }
		</script>
	  </head>
	  <body>
		<div style="text-align:center">
		  <div id="board" style="position:relative">
			<span id="01" style="position:absolute">
			  <img src="images/01.png" alt="01" onclick="sample()"/>
			</span>
		</div>
	  </body>
	</html>

URL: *http://vwf.example.com/application/index.vwf*

* * *

By default, the framework will search for the index.vwf.yaml file. Thus, if the application is defined in that file, the application can be reached with the following URL: http://*server/IP:port*/*applicationname*/ and index.vwf will automatically be initiated. If the application is defined in another file, the application can be reached with the following URL: http://*servername*/*applicationname*/*applicationname*.vwf.

* * *

The Virtual World Framework can be used in either single user or multi-user mode. An independent session of the application can be initialized by a URL without a session ID: *http://vwf.example.com/applicaiton/*. The URL from the initial user can be used to allow additional users to join the session, specified by the session ID. Example: *http://vwf.example.com/application/561f86e42b6763d0/*. This session ID will be pulled out of the URL, and replaced with a session variable that will still be accessible via the URL. The session can run for a given time, and as a new user joins, the content will be synched to the current state of the application.

* * *

How to get started with your own instance of VWF
-------------------------------------------------
*	Public server maintained by VWF to host applications for review
*	Use VMware to host virtual instance of a VWF server
*	Initialize personal server via a Linux Boot CD, where content is loaded from flash drive

* * *

