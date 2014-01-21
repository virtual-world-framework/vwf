<a name="materials" />

<div class="well" markdown="1">
Switch Materials on an Object
===================
-------------------

Imagine you have a simple scene (a cube) and you would like to programatically change the material on the cube.  (Note: it is important that the collada file for the 3D object have properly mapped texture coordinates)

Let's look at the code for the simple scene, with a material object added as a child to the cube:

	--- 
	extends: http://vwf.example.com/navscene.vwf
	properties:
	children:
	  cube:
	    extends: node3.vwf
	    source: cube.dae
	    type: model/vnd.collada+xml
	    children:
	      material:
	        extends: http://vwf.example.com/material.vwf
	scripts:
	- |
	    this.initialize = function() {
	    }

You can change the cube's material anywhere in the code that you would like.  For the purpose of this example, let's assume that you want to change it right at the beginning in the *initialize* function.  Everything you could want to change about the material can actually be changed via the properties of the existing material:

	this.initialize = function() {

		var material = this.cube.material;

		// Change the color
		material.color = [ 0, 0, 205 ];

		// Change the texture
		material.texture = "images/grandma.png";

		// Make the object transparent
		material.alpha = 0.1;
	}

A full list of material properties can be found in the [material](jsdoc_cmp/symbols/material.vwf.html) application API.

Sometimes it may be desirable to switch out the entire material - if for example, you wanted to toggle between two that had many distinct properties or have more than one object share the same material.  Here's how you could do that:

	this.initialize = function() {

		var self = this;

		this.children.create( "material1", "http://vwf.example.com/material.vwf", function() {
			this.color = [ 0, 0, 205 ];
			this.texture = "images/grandma.png";
			this.alpha = 0.1;
			self.cube.material = self.material1;
		} );
	}

You can read about the parameters of the create function on the API page for [node.children](jsdoc_cmp/symbols/node.vwf.html#children).

</div>
-------------------
