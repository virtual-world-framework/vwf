Getting Started
===============

Virtual World Framework (VWF) is a collaborative training platform that is scalable, sustainable and can be run via a browser.
_____________________________________________________________________________________
The most basic implementation of VWF is a single asset in a COLLADA format. A URL pointing directly to an asset COLLADA file (.dae) with no code will result in a scene containing the specified asset with default light, camera, and navigation.

URL: *http://vwf.example.com/documentation/hello.dae*

<!-- <iframe src="http://localhost:3000/documentation/hello.dae">hello.dae</iframe> -->
_____________________________________________________________________________________
An asset can be wrapped in a VWF application by specifying the source file in the code.

Code View: *hello.vwf.yaml*

	---
	source: hello.dae

URL: *http://vwf.example.com/documentation/hello.vwf*

<!-- <iframe src="http://localhost:3000/documentation/hello.vwf">hello.vwf</iframe> -->
_____________________________________________________________________________________
Prototypes for nodes are defined within the framework. Extend these prototypes and specify a file source to create application components. For example, an application child can extend a node type with a COLLADA file.

Code View: *hello.vwf.yaml*

	--- 
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml

URL: *http://vwf.example.com/documentation/hello.vwf*

<!-- <iframe src="http://localhost:3000/documentation/hello.vwf">hello.vwf</iframe> -->
_____________________________________________________________________________________
An application scene can extend the glge type with an xml scene file.

Code View: *index.vwf.yaml*

	--- 
	extends: http://vwf.example.com/types/glge
	source: index.xml
	type: model/x-glge
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
	  
URL: *http://vwf.example.com/documentation/1/index.vwf*

<iframe src="http://localhost:3000/documentation/1/">index.vwf</iframe>
_____________________________________________________________________________________
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
_____________________________________________________________________________________
Add additional children to the application and set their properties. 

Code View: *index.vwf.yaml*

	--- 
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  position: [ 0, 5, 0 ]
	  world:
		extends: http://vwf.example.com/types/node3
		source: world.dae
		type: model/vnd.collada+xml
		properties:
		  position: [ 0, -5, 0 ]

URL: *http://vwf.example.com/documentation/2/index.vwf*

<iframe src="http://localhost:3000/documentation/2/">index.vwf</iframe>
_____________________________________________________________________________________
**Note:** A component specification may be an object literal, an uniform resource identifier (URI) to a .vwf or another type such as .dae, or a JSON-encoded object (primarily for use in the single-user mode application= URI parameter). Components may appear as an extends, implements, or child within the application or another component. 
_____________________________________________________________________________________
Define properties of application and children with or without accessors.

Code View: *helloworld.vwf.yaml*

	--- 
	extends: http://vwf.example.com/types/glge
	source: index.xml
	type: model/x-glge
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
	    properties:
          position:
            set: |
              this.position = value;
            value: [ 0, 5, 0 ]

URL: *http://vwf.example.com/documentation/helloworld.vwf*

<!-- <iframe src="http://localhost:3000/documentation/helloworld.vwf">helloworld.vwf</iframe> -->
_____________________________________________________________________________________
Specifying set or get as null prevents writing and/or reading, respectively.

Code View: *helloworld.vwf.yaml*

	--- 
	extends: http://vwf.example.com/types/glge
	source: index.xml
	type: model/x-glge
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
	    properties:
          position:
            set: null
			get: null
			
URL: *http://vwf.example.com/documentation/helloworld.vwf*

<!-- <iframe src="http://localhost:3000/documentation/helloworld.vwf">helloworld.vwf</iframe> -->
_____________________________________________________________________________________	  
Bind children of application to child nodes defined in the asset file and modify their properties. Set materials with direct access from the main node to the material node of the asset file, without defining entire structure in code.

Code View: *index.vwf.yaml*

	---
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  position: [ 0, 5, 0 ]
		children:
		  HelloMaterial:
			extends: http://vwf.example.com/types/material
			properties: 
			  texture: “images/red.png”
	  world:
		extends: http://vwf.example.com/types/node3
		source: world.dae
		type: model/vnd.collada+xml
		properties:
		  position: [ 0, -5, 0 ]
		children:
		  WorldMaterial:
			extends: http://vwf.example.com/types/material
			properties: 
			  texture: “images/blue.png”
		  
URL: *http://vwf.example.com/documentation/3/index.vwf*

<iframe src="http://localhost:3000/documentation/3/">index.vwf</iframe>
_____________________________________________________________________________________
The properties of the default lighting and navigation can be specified within the application file.

Code View: *helloworld.vwf.yaml*

	---
	children:
	  maincamera:
        extends: http://vwf.example.com/types/camera
		properties:
		  rotation: [ 2.0, 0, 0]

URL: *http://vwf.example.com/documentation/helloworld.vwf*

<!-- <iframe src="http://localhost:3000/documentation/helloworld.vwf">helloworld.vwf</iframe> -->
_____________________________________________________________________________________
Assemble applications from content on multiple servers.

Code View: *helloworld.vwf.yaml*

	--- 
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
	  world:
		extends: http://vwf.example.com/types/node3
		source: http://anotherserver.com/world.dae
		type: model/vnd.collada+xml

URL: *http://vwf.example.com/documentation/helloworld.vwf*

<!-- <iframe src="http://localhost:3000/documentation/helloworld.vwf">helloworld.vwf</iframe> -->
_____________________________________________________________________________________
Specify methods related to children of application.

Code View: *helloworld.vwf.yaml*

	--- 
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  rotation: [ 0, 0, 0]
		methods:
		  click: this.rotation.z += 5

URL: *http://vwf.example.com/documentation/helloworld.vwf*

<!-- <iframe src="http://localhost:3000/documentation/helloworld.vwf">helloworld.vwf</iframe> -->
_____________________________________________________________________________________
Move the child of the application or asset to a component, placing related code in a separate .yaml file. Reuse the created component on other assets.

Code View: *rotate.vwf.yaml*

	---
	methods:
	  click: this.rotation.z += 5
    
Code View: *helloworld.vwf.yaml*

	---
	children:
	  hello:
	    extends: rotate.vwf
	    source: hello.dae
	  world:
	    extends: rotate.vwf
	    source: world.dae

URL: *http://vwf.example.com/documentation/helloworld.vwf*

<!-- <iframe src="http://localhost:3000/documentation/helloworld.vwf">helloworld.vwf</iframe> -->
_____________________________________________________________________________________
Add JavaScript functions to application components by defining scripts as a child of the application or a specific component. Prototypes define some functions that can be extended, such as pointerClick.

Code View: *index.vwf.yaml*

	---
	extends: http://vwf.example.com/types/glge
	source: index.xml
	type: model/x-glge
	children:
	  hello:
		extends: http://vwf.example.com/types/node3
		source: hello.dae
		type: model/vnd.collada+xml
		properties:
		  position: [ 0, 5, 0 ]
		children:
		  HelloTextMaterial1:
            extends: http://vwf.example.com/types/material
            properties: 
              texture: “”
        scripts:
        - text: |
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
          type: application/javascript
	  world: 
		extends: http://vwf.example.com/types/node3
		source: world.dae
		type: model/vnd.collada+xml
		properties: 
		  position: [ 0, -5, 0 ]
		children:
		  WorldTextMaterial1:
			extends: http://vwf.example.com/types/material
			properties: 
			  texture: “”
	    scripts:
	    - text: |
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
	      type: application/javascript

URL: *http://vwf.example.com/documentation/4/index.vwf*

In this example, clicking on an object will run the pointerClick function, changing the color of the object's material. 

<iframe src="http://localhost:3000/documentation/4/">helloworld.vwf</iframe>
_____________________________________________________________________________________
Define additional HTML and jQuery components in an index.vwf.html file. The application will look for a file of this name on load, and will load any scripts or two dimensional components identified. This HTML file interaction can bind user interface components to children and properties defined in the application file. The following example shows the JavaScript defined in the HTML file interacting with the property defined in the YAML file.

Code View: *index.vwf.yaml*

	--- 
	extends: http://vwf.example.com/types/node
	children: 
	  game:
		extends: http://vwf.example.com/types/node
		properties:
		  position01: [ 0, 0 ]

Code View: *index.vwf.html*

	<!DOCTYPE html>
	<html>
	  <head>
		<script type="text/javascript">
		  function sample() {
			// Get property value from the application
			var pos = vwf.getProperty("http-vwf-example-com-types-node-game", 
									  “position01”);

			// Set property value in the application
			vwf.views[0].setProperty( "http-vwf-example-com-types-node-game", 
									  " position01", some_position );
		  }

		  // Defines a function to execute upon an application property
		  vwf.property( "http-vwf-example-com-types-node-game", "position01",         
			function() { doSomething(); } );
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

URL: *http://vwf.example.com/documentation/application.vwf*

<!-- <iframe src="http://localhost:3000/documentation/application.vwf">application.vwf</iframe> -->
_____________________________________________________________________________________
By default, the framework will search for index.vwf.yaml file. Thus, if the application is defined in that file, the application can be reached with the following URL: http://*server/IP:port*/*applicationname*/ and index.vwf will automatically be initiated. If the application is defined in another file, the application can be reached with the following URL: http://*servername*/*applicationname*/*applicationname*.vwf.
_____________________________________________________________________________________
The Virtual World Framework can be used in either single user or multi-user mode. An independent session of the application can be initialized by a URL without a session ID: *http://vwf.example.com/applicaiton/*. The URL from the initial user can be used to allow additional users to join the session, specified by the session ID. Example: *http://vwf.example.com/application/561f86e42b6763d0/*. This session ID will be pulled out of the URL, and replaced with a session variable that will still be accessible via the URL. The session can run for a given time, and as a new user joins, the content will be synched to the current state of the application.
_____________________________________________________________________________________
How to get started with your own instance of VWF
-------------------------------------------------
*	Public server maintained by VWF to host applications for review
*	Use VMware to host virtual instance of a VWF server
*	Initialize personal server via a Linux Boot CD, where content is loaded from flash drive
_____________________________________________________________________________________
Browser Requirements
--------------------
*	HTML5
*	Browser with WebGL enabled (Chrome 7, Firefox 3, IE 9)
*	Browser with WebSocket enabled for multi-user functionality (not on a corporate network)
_____________________________________________________________________________________
