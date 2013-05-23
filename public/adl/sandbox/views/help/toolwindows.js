{
	"title":"Tool and Editor Windows",
	"entries": [
		{
			"title": "",
			"icon": false,
			"body": "Most of VWF Sandbox capabilities are accessed through various editor windows. These windows will either appear to the side of the view, below the view, or as floating windows on top of the 3D scene.  Windows that float over the scene may be moved and placed, and can be closed with the small 'X' icon in the upper right. Windows that load in the side panel can be closed with the 'X', or rearranged by dragging them. Sidebar windows will always load on the top of the sidebar when they are shown. All windows can be accessed through the Windows menu on the main menu bar. This page will list a simple description of each window.  Further information may be available for some windows. If so, the section below will contain a link to that information."	
		},

		{
			"icon": "users.png",
			"title": "Users Window (Windows->Users)",
			"body": "This window simply lists the users logged into the current world. You can select a user from the list to see their profile."	
		},
		{
			"icon": "chat.png",
			"title": "Chat Window (Windows->Chat)",
			"body": "This shows the global chat for the world. You may also see some system status messages here. Enter text in the field at the bottom and press enter. Everyone in the world will see the message you send. If you want to send a private message, use the 'Private Message' button on the appropriate user's profile window."	
		},
		{
			"icon": "material.png",
			"title": "Material Editor Window (Windows->Material Editor)",
			"body": "This window lets you change the physical surface of the object. You can load textures, set colors, change shininess and specuarlity. It's even possible to build some complex effects, like normal mapping or reflections. A material is made of the base properties, and zero or more texture layers. Each layer will appear as a bar in the editor window. Click that bar to edit the settings for that layer. You can add a layer on the 'Basic Settings' tab. See more information in the <a href=\"materialeditor\">Material Editor</a> document."	
		},
		{
			"icon": "script.png",
			"title": "Script Editor Window (Windows->Script Editor)",
			"body": "The Script Editor allows you to program behaviors on objects. It will roll up from the bottom of the screen, and may be maximized with the up arrow button ( <img class=\"inlineicon\" src=\"../images/icons/up2.png\", ) on the right. You can restore it with the restore icon ( <img class=\"inlineicon\" src=\"../images/icons/window.png\", ), or minimize it with the down icon ( <img class=\"inlineicon\" src=\"../images/icons/down.png\", ). It has two tabs along the top - Events and Methods. Each tab contains the code for a given event or method. Events and methods for the selected object will be listed along the left side, with suggestions for new events and methods grayed out. Click the name of the event or method to see and edit the code for that script. More information is available in the <a href=\"scripteditor\">Script Editor</a> document."
		},
		{
			"icon": "properties.png",
			"title": "Object Properties Window (Windows-> Object Properties)",
			"body": "The Object Properties window will show you the editable properties of the selected object (with the exception of the scripts and materials). It will list the position, rotation, and scale of the object in the 'Transforms' tab, and show bars below for basic properties of the primitive object or the 3D model. It will also list all the modifiers applied to the object, and the settings for each of these. The available setting will differ based on what type of object is selected, and what modifiers are applied. Reference on these properties is available in the 'Primitive Objects' document, and the <a href=\"modifiers\">Modifiers</a> document."
		},
		{
			"icon": "models.png",
			"title": "Asset Library Window (Windows-> Models)",
			"body": "The Asset Library (the 3DR) is the storage location for geometry data that can be loaded into the sandbox. This window will allow you to search for content, browse, and load models into the view. Enter a search term in the blank field next the search button. When you click 'Search', you will see the results displayed as a grid of thumbnails with titles. There is a max of 32 results per page, with page numbers in blue at the bottom of the window. Click on the title of a model to see the model's description, polygon count, and other metadata. On the window that appears, you may choose to create the object by clicking 'Create'. The model will be loaded at the center of your view. It's important to note that the system can only currently load models that have the permissions set such that they are downloadable by anonymous users. Look for a separate tutorial on uploading content."
		},
		{
			"icon": "inventory.png",
			"title": "Inventory Window (Windows-> Inventory)",
			"body": "The Inventory window shows the objects you are storing in your inventory. This is a place where you can save copies of thing, to be recreated later. The inventory can hold 2 types of items - objects and scripts. You can select an inventory item by clicking its name. While an item is selected, you may create a new instance of this item in the world by clicking the 'Create' button. 'Delete' will remove the selected object from your inventory. 'Rename' allows you to set the name that is displayed for this object. To see the data that is actually contained in the inventory, select an item and click 'View'. This will show you the VWF node prototype that describes the object, and is useful to export VWF node definitions out of the Sandbox. Note that when you create a new object, it will appear in the center of your view. When you create a script item, it will be loaded into the Script Editor and onto the currently selected object. You must click 'Save Method' or 'Save Event' in the script editor to actually apply the script. To capture an item into your inventory, click 'Edit->Save Copy' on the main menu bar."
		},
		{
			"icon": "Hierarchy.gif",
			"title": "Hierarchy  Window (Hierarchy ->Show Hierarchy )",
			"body": "This window is complex, but powerful. It will show you the VWF nodes that are children of the currently selected object, and also the scene graph nodes that are part of the 3D model, but not replicated by the VWF. You can select the VWF children, and you can convert the scene graph nodes into VWF nodes - allowing you to edit and synchronize their properties. See the <a href=\"hierarchywindow\">Hierarchy  Window</a> article for more information."
		}
	]
}