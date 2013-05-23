{
	"title":"Main Toolbar Buttons",
	"entries": [
		{
			"icon": "logout.png",
			"title": "Login  (File->Login)",
			"body": "The VWF Sandbox application requires user to log into a world before making any changes to that world. User accounts are stored on the server, and are valid for all worlds on the server. However, you must log in to each separate world when joining. If you do not have an account, you can create one from the log in dialog by selecting 'Create Profile...' from the list of user names. "
		},

		{
			"icon": "login.png",
			"title": "Logout (File->Logout)",
			"body": "You can use this to remove your character from the world, while keeping your browser pointer at that world. You will be able to see changes happening in the world, but you will not be able to interact.  "
		},
		
		{
			"icon": "move.png",
			"title": "Move (Edit->Transform->Move)",
			"body": "Activate the move tool.  This will place a 'gizmo' over the selected object. Click and drag on the colored lines to move the object in the direction of that line. Hold your mouse between lines to select the plane made from those two lines. Clicking and dragging while a plane handle is selected will move the object along the selected plane. "
		},
		
		{
			"icon": "rotate.png",
			"title": "Rotate (Edit->Transform->Rotate)",
			"body": "Activate the rotate tool. This will place a 'gizmo' over the selected object. Click and drag around the circumference of the circle to rotate the object around the vector that defines the center of that circle. TIP: drag around the circle, not tangent to it."
		},
		
		{
			"icon": "scale.png",
			"title": "Scale (Edit->Transform->Scale)",
			"body": "Activate the Scale tool. This will place a 'gizmo' over the selected object. Click and drag the center box to scale uniformly on all axis. Click and drag on one of the colored boxes to scale only in the direction of the selected box. TIP: scaling always happens in local space - you cannot rotate an object, then scale in worldspace to produce a skew."
		},
		
		{
			"icon": "worldspace.png",
			"title": "World Coordinates (Edit->Transform->World Coords)",
			"body": "Align the selected tool's gizmo with the world coordinate system. Thus, the X handle of the move gizmo will point toward the absolute X of the world, and Z will always be 'up', toward the sky. TIP: coordinate space selections currently do not work properly for objects that are children of other objects."
		},
		
		{
			"icon": "localspace.png",
			"title": "Local Coordinates (Edit->Transform->Local Coords)",
			"body": "Align the selected tool's gizmo with the selected object. Use this if you want to move an object toward its own 'front', even if that 'front' does not point strait along a world axis line because the object has been rotated. TIP: coordinate space selections currently do not work properly for objects that are children of other objects."
		},
		
		{
			"icon": "pick.png",
			"title": "Select By Clicking (Edit->Select->Pick)",
			"body": "When this mode is activated, clicking on an object will select it for editing. The object selection is used by all tools and windows to display properties. This button will light up blue when in 'Select' mode. TIP: if you find that you are clicking and not selecting the object you wish, check the status bar at the bottom of the screen. If you see 'Pick: None' in the 4th box, you are not in select mode. TODO: Add support for selecting multiple objects."
		},
		
		{
			"icon": "selectnone.png",
			"title": "Select None (Edit->Select->Select None)",
			"body": "Unselect the selected object, and exit select mode. Note that clicking the button will change the select mode to none, and you will have to click the 'Select By Clicking' button to enter selection mode again."
		},
		
		{
			"icon": "copy.png",
			"title": "Copy (Edit->Copy)",
			"body": "Copy the selected node to be pasted later. You must have a node selected for this operation. When copying, the entire hierarchy of the selected object will be copied as well. If the bounding box that marks the selection is red, you have selected a node that controls a part of a model that was loaded by and asset file (most likely from the 3DR). These objects cannot be copied. "
		},
		
		{
			"icon": "paste.png",
			"title": "Paste (Edit->Paste)",
			"body": "Paste the copied node into the scene. This will make a new node with all the properties of the copied node. You will be assigned as the new nodes owner. This new node will be placed at the center of your view, at z=0. Note that when looking at the world at very shallow angles, this may place the object farther away then you expect. "
		},
		
		{
			"icon": "duplicate.png",
			"title": "Duplicate (Edit->Duplicate)",
			"body": "A shortcut for copy, then paste. The only notable difference is that the new node will be placed exactly on top of the original."
		},
		
		{
			"icon": "save.png",
			"title": "Save Copy (Edit->Save Copy)",
			"body": "This will allow you to save a copy of the node to your inventory. From the inventory, you will be able to recreate a new instance of this node at any point. When you select this option, the inventory panel will be shown, and the new node selected. The new object in the inventory will have a randomly generated name. TIP: rename this object right away to keep things organized."
		},
		
		{
			"icon": "link.png",
			"title": "Link (Hierarchy->Link)",
			"body": "This tool allows you to make one object a child of another. You must be the owner of both objects to complete this operation. You must first select an object before clicking this tool. When activated, the cursor will change to a cross hair, and allow you to pick a second object. When you choose the second object, the selected object will be added as a child of the object you pick. TODO: When linking an object, we need to calculate the new transforms such that the object appears to the user in the same world space location."	
		},
		
		{
			"icon": "unlink.png",
			"title": "Unlink (Hierarchy->Unlink)",
			"body": "This button will unlink the selected object from its parent. The selected object must be a child of another object in the scene. TODO: When unlinking an object, we need to calculate the new transforms such that the object appears to the user in the same world space location."	
		},
		
		{
			"icon": "up.png",
			"title": "Select Parent (Hierarchy->Select Parent)",
			"body": "When a node is selected, clicking this button will select the node's parent, if the node has one. "	
		},
		
		{
			"icon": "camera.png",
			"title": "Orbit Camera (Camera->Orbit)",
			"body": "Activate 'Camera Orbit' mode. See the <a href=\"cameramodes\">Camera Modes</a> section for details on how the camera controls work."	
		},
		
		{
			"icon": "firstperson.png",
			"title": "First Person Camera (Camera->First Person)",
			"body": "Activate 'First Person' mode. See the <a href=\"cameramodes\">Camera Modes</a> section for details on how the camera controls work."	
		},
		
		{
			"icon": "navigate.png",
			"title": "Navigate Camera (Camera-> Navigate)",
			"body": "Activate 'Navigate' mode. See the <a href=\"cameramodes\">Camera Modes</a> section for details on how the camera controls work."	
		},
		
		{
			"icon": "free.png",
			"title": "Free Camera (Camera-> Free)",
			"body": "Activate 'Free Camera' mode. See the <a href=\"cameramodes\">Camera Modes</a> section for details on how the camera controls work."	
		},
		
		{
			"icon": "target.png",
			"title": "Focus (Camera->Focus Selected)",
			"body": "Move the camera such that it frames the selected object in the view. This will reset the camera mode to 'Orbit'. TODO: make sure the Orbit icon lights as selected when this is clicked."
		},
		
		{
			"icon": "sphere.png",
			"title": "Create Sphere (Create-Primitives->Sphere)",
			"body": "Create a new sphere object at the center of the view. See the <a href=\"primitiveobjects\">Primitive Objects</a> sections for information on the object settings."	
		},
		
		{
			"icon": "cube.png",
			"title": "Create Box (Create-Primitives->Box)",
			"body": "Create a new box object at the center of the view. See the <a href=\"primitiveobjects\">Primitive Objects</a> sections for information on the object settings."	
		},
		
		{
			"icon": "cylinder.png",
			"title": "Create Cylinder (Create-Primitives->Cylinder)",
			"body": "Create a new Cylinder object at the center of the view. See the <a href=\"primitiveobjects\">Primitive Objects</a> sections for information on the object settings."	
		},
		
		{
			"icon": "cone.png",
			"title": "Create Cone (Create-Primitives->Cone)",
			"body": "Create a new cone object at the center of the view. See the <a href=\"primitiveobjects\">Primitive Objects</a> sections for information on the object settings."	
		},
		
		{
			"icon": "pyramid.png",
			"title": "Create Pyramid (Create-Primitives-> Pyramid)",
			"body": "Create a new pyramid object at the center of the view. See the <a href=\"primitiveobjects\">Primitive Objects</a> sections for information on the object settings."	
		},
		
		{
			"icon": "plane.png",
			"title": "Create Plane (Create-Primitives-> Plane)",
			"body": "Create a new plane object at the center of the view. See the <a href=\"primitiveobjects\">Primitive Objects</a> sections for information on the object settings."	
		},
		
		{
			"icon": "users.png",
			"title": "Users Window (Windows->Users)",
			"body": "Show the Users window. See <a href=\"toolwindows\">Tool Windows</a> for more information."	
		},
		
		{
			"icon": "chat.png",
			"title": "Chat Window (Windows->Chat)",
			"body": "Show the Chat window. See <a href=\"toolwindows\">Tool Windows</a> for more information."	
		},
		
		{
			"icon": "material.png",
			"title": "Material Editor Window (Windows->Material Editor)",
			"body": "Show the Material Editor window. You should have an object selected when opening this window. See <a href=\"toolwindows\">Tool Windows</a> for more information."	
		},
		
		{
			"icon": "script.png",
			"title": "Script Editor Window (Windows->Script Editor)",
			"body": "Show the Script Editor window. You should have an object selected when opening this window. See <a href=\"toolwindows\">Tool Windows</a> for more information."
		},
		
		{
			"icon": "properties.png",
			"title": "Object Properties Window (Windows-> Object Properties)",
			"body": "Show the Object Properties window. You should have an object selected when opening this window. See <a href=\"toolwindows\">Tool Windows</a> for more information."
		},
		
		{
			"icon": "models.png",
			"title": "Asset Library Window (Windows-> Models)",
			"body": "Show the Asset Library window. See <a href=\"toolwindows\">Tool Windows</a> for more information."
		},
		
		{
			"icon": "inventory.png",
			"title": "Inventory Window (Windows-> Inventory)",
			"body": "Show the Inventory window. See <a href=\"toolwindows\">Tool Windows</a> for more information."
		}
	]
}