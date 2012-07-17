Cameras
===================
-------------------
The camera capability provides the users viewpoint into the application. Every application automatically creates a camera with the id <code>http-vwf-example-com-camera-vwf-camera</code>. This camera can be accessed in javascript through the camera property of the index-vwf component, or through the editor. New cameras can also be created by creating a component that extends <code>http://vwf.example.com/camera.vwf</code>. 

-------------------

Key Properties
-------------------
-------------------

**Camera Type**

The <code>cameraType</code> property controls whether the camera is a *persepective* or *orthographic* camera. With a perspective camera, the further away an object is, the smaller it will appear. Orthographic cameras always display objects as their actual size. <code>cameraType</code> defaults to "perspective" and can be set using the following syntax.

	camera.cameraType = "orthographic";

**Far**

The <code>far</code> property controls how far away from the camera another component can get before it is no longer displayed. The value cannot be less than 0, or less than the value of <code>near</code>. <code>far</code> defaults to 1000 and can be set using the following syntax..

	camera.far = 10000;

**Lookat**

The <code>lookAt</code> property affects how the camera moves. If it is set to the id of another component, that component will always be at the center of the cameras view. If the position of the camera changes, the camera will automatically rotate to keep the keep the other component in its view. <code>lookAt</code> can only be set to a valid id, and defaults to "". It can be set using the following syntax.

	camera.lookAt = "http-vwf-example-com-node3-vwf-sceneCenter";

**Near**

The <code>near</code> property controls how close to the camera another component can get before it is no longer displayed. The value cannot be less than 0, or greater than the value of <code>far</code>. <code>near</code> defaults to 0.1 and can be set using the following syntax.

	camera.near = 1.0;

**Rotation**

The <code>rotation</code> property controls the direction the camera is pointing, as an offset from the default orientation. Changing the property will rotate the camera and automatically update the view. The value takes the from of [x, y, z, angle] where the amount rotation around an axis is axis * angle. <code>rotation</code> defaults to looking down the positive y-axis with a value of [0,0,0,0] and can be set with the following syntax.

	camera.rotation = [1, 2, 0.5, 90]; // From looking down the positive y-axis, rotate 90 degrees around the x-axis, rotation 180 degrees around the y-axis and 45 degrees around the z-axis.

**Translation**

The <code>translation</code> property controls the position of the camera. Changing the property will move the camera to the new coordinates, and the view will automatically update with it. <code>translation</code> defaults to [0,0,0] and can be set using the following syntax.

	camera.translation = [100, -20, 30]; // Moves the camera to 100 on the x-axis, -20 on the y-axis, and 30  on the z-axis

-------------------

Using Multiple Cameras
-------------------
-------------------

The application uses the <code>activeCamera</code> property of the scene to determine which camera to use as the main viewpoint. Other cameras can be created, but they will not affect what is displayed in the browser unless they have been set as the active camera. Setting <code>activeCamera</code> to the id of a camera will automatically switch the view that is displayed in the browser to the view of that camera.

	// this is the scene
	this.activeCamera = "http-vwf-example-com-camera-vwf-newcamera";

-------------------