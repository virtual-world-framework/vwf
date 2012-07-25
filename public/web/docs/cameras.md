Cameras
===================
-------------------
The camera capability provides the users viewpoint into the application. Every application automatically creates a camera as part of the scene. This camera can be accessed in javascript through the <code>camera</code> property of the scene node, or through the editor. 

-------------------

Creating New Cameras
-------------------
-------------------

New cameras can be created by creating a node that extends <code>http://vwf.example.com/camera.vwf</code>. 

	var newCamera = {
	  extends: "http://vwf.example.com/camera.vwf"
	};
	this.children.create("newCamera", newCamera);

See [components](components.html) for more information about creating new nodes.

-------------------

Camera Type
-------------------
-------------------

The <code>cameraType</code> property controls whether the camera is a *persepective* or *orthographic* camera. With a perspective camera, the further away an object is, the smaller it will appear. Orthographic cameras always display objects as their actual size. <code>cameraType</code> defaults to "perspective" and can be set using the following syntax.

	this.children['newCamera'].cameraType = "orthographic";

-------------------

Transform Properties
-------------------
-------------------

The camera component extends from node3, and inherits the transform properties, such as translation and rotation. 

The <code>translation</code> property controls the position of the camera. Changing the property will move the camera to the new coordinates, and the view will automatically update with it. <code>translation</code> defaults to [0,0,0] and can be set using the following syntax. The coordinate system defaults to +x to the right, +y forward, and +z up, if no rotation has been applied.

	this.children['newCamera'].translation = [100, -20, 30]; // Moves the camera to 100 on the x-axis, -20 on the y-axis, and 30 on the z-axis

The <code>rotation</code> property controls the direction the camera is pointing, as an offset from the default orientation. Changing the property will rotate the camera and automatically update the view. The value takes the from of [x, y, z, angle] where the amount rotation around an axis is axis * angle. 

	this.children['newCamera].rotation = [1, 2, 0.5, 90]; // From looking down the positive y-axis, rotate 90 degrees around the x-axis, rotation 180 degrees around the y-axis and 45 degrees around the z-axis.

Also, note that the x, y and z values in the rotation array are automatically normalized to a unit vector. So after the above example, reading the value of <code>rotation</code> would return [0.4364357888698578, 0.8728715777397156, 0.21821792423725128, 90].

-------------------

Clipping Plane
-------------------
-------------------

The <code>near</code> and <code>far</code> properties are used to control the clipping plane. <code>far</code> controls how far away from the camera another node can get before it is no longer displayed and <code>near</code> property controls how close to the camera another node can get before it is no longer displayed. The values of <code>near</code> and <code>far</code> are restricted so that 0 < near < far. They can be set with the following syntax.

	this.children['newCamera'].far = 10000;
	this.children['newCamera'].near = 1.0;

<code>near</code> and <code>far</code> also control the view buffer. The ratio of far / near should roughly match the size of the world, in order to have accurate depth calculations and avoid overlapping models.

-------------------

Lookat
-------------------
-------------------

The <code>lookAt</code> property affects how the camera moves. If it is set to the id of another node, that node will always be at the center of the cameras view. If the position of the camera changes, the camera will automatically stay pointed at the other node. <code>lookAt</code> can only be set to a valid id, and defaults to "". It can be set using the following syntax.

	this.children['newCamera'].lookAt = this.children['interestingNode'].id;

-------------------

Using Multiple Cameras
-------------------
-------------------

The application uses the <code>activeCamera</code> property of the scene to determine which camera to use as the main viewpoint. Other cameras can be created, but they will not affect what is displayed in the browser unless they have been set as the active camera. Cameras in the model are shared by all clients, and <code>activeCamera</code> will be seen by all clients, unless they switch to a different one in their private view. Setting <code>activeCamera</code> to the id of a camera will automatically switch the view that is displayed in the browser to the view of that camera.

	// this is the scene
	this.activeCamera = this.children['newCamera'].id;

-------------------