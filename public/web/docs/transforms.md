<a name="transforms" />

<div class="well" markdown="1">
Complex Transforms
==============
--------------

Among the most common properties to set on a node within the Virtual World Framework are various transforms. The [node3](jsdoc_cmp/symbols/node3.vwf.html) component defines the basic transforms including the following:

* worldTransform
* transform
* translation 
* rotation 
* quaternion
* scale

These properties may be used to either initially set the property on application load, or to specifically set a value as a result of an action or event. Directly setting these properties are most useful in simple cases, when the proper values to pass in are known.

Transform property values may be set directly in the property definition, as shown below.

	properties:
	  rotation: [ 1, 0, 0, 90 ]
	  scale: 10

Additionally, property values can be set within script, as shown below. 

	this.transform = [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 500, 100, 1 ];
	this.translation = [ 0, 100, 0 ];
	this.scale = [ 10, 0, 0];

*Note* - There is an example application by the name of [transforms](../example/transforms). This application allows the user to set and view the various properties discussed in this recipe, and see the outcome on an actual model. The source for this app can be found in the [github repository](https://github.com/virtual-world-framework/vwf) in public/web/example/transforms.) 

-------------

### Transform By Methods

Alternatively, the *node3* component defines several methods to aid in more complex transformations of 3D objects in the scene. The following methods are available to combine various transforms on top of each other. Such methods include:

* translateBy
* rotateBy
* quaterniateBy
* scaleBy

Each of these methods takes in an array transform (or scalar value in the case of *scaleBy*) to combine with the existing transform on the node. Additionally, these methods will take an optional value *duration* to perform the transform over time. 

Example from the model:

	this.objectNode.rotateTo( [ 0, 0, 1, 45 ], 10 );

Example from the view:

	vwf_view.kernel.callMethod( objectNode, "rotateTo", [ [ 0, 0, 1, 45 ], 10 ] );

The above method calls will rotate objectNode 45 degrees around the z-axis, over a duration of 10 milliseconds. 

--------------

### Transform To Methods

Another option for transforming an object over time is the transform to methods. These methods will take in an array or scalar value in the same format as in the property definition itself. However, unlike setting the property directly, use of these methods allow for an optional *duration* to animate a node's transformation. 

* translateTo
* rotateTo
* quaterniateTo
* scaleTo
* transformTo

Example from the model:

	this.camera.translateTo( [ 0, 0, 5 ], 10 );

Example from the view:

	vwf_view.kernel.callMethod( camera, "translateTo", [ [ 0, 0, 5 ], 10 ] );

The above method calls will translate the camera to \[ 0, 0, 5 \], over a duration of 10 milliseconds. 

--------------

### Closure Library

Another alternative for complex transformations is simply to use the transform property or the transformTo method in conjuction with complex matrix math. Both of these options require a 16 value array, representing the transform matrix. Vector arrays may also be calculated and used with the individual transform properties and methods. Any combination of transformations can be calculated using matrix math and the vector classes of the [Google Closure Library](https://developers.google.com/closure/library/), which has been integrated into the framework. 

The following are some examples of the closure library in action. There are several vector and matrix operations that can be used to calculate a vector and/or matrix to assign to the transform properties or passed to the transform methods.

The functions below will create a new vector or matrix. 

	var newVector = goog.vec.Vec3.create();

	var newMatrix = goog.vec.Mat4.create();

	newVector = goog.vec.Vec3.createFromArray( [ value[0], value[1], value[2] + newValue ] );

Below are examples of using the closure library to perform operations on vectors and matrices, and assigning them to a variable or directly to a transform. 

	var newMat = goog.vec.Mat4.multMat( mat1, mat2,
	  goog.vec.Mat4.create()                       
	);

	var trans = goog.vec.Vec3.scale(
	  this.directionVector,
	  this.distance,
	  goog.vec.Vec3.create()
	);

	this.camera.translation = goog.vec.Vec3.add(
	  this.camera.translation,
	  this.translationToAdd,
	  goog.vec.Vec3.create()
	);

Finally, here are few more examples to do matrix operations such as normalization, transposition, inversion, and quaternions. 

	goog.vec.Vec3.normalize( v1, normalizedV1 );

	goog.vec.Mat4.transpose( example, exampleTranspose ); 

	goog.vec.Mat4.invert( example, exampleInverse );

	goog.vec.Quaternion.createFromValues( 0, 0, 0, 1 );

</div>
--------------
