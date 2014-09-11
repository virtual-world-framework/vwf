{
	"title":"Modifiers",
	"entries": [
		{
		
			"body": "Modifiers are settings that can be added to an object to edit that object in some way. Most of the existing modifiers edit the geometry of the node, but it's possible for a modifier to change any property. Modifiers that are applied to an object are listed in the \"Object Properties\" window, where you can delete them or modify their properties. When you add a new modifier to an object, it is applied to the result of any previous modifiers. Thus, you can bend an object after twisting it, to create something like a mobius strip. You must be the owner of objects that you wish to modify. To create add a modifier to an object, select the object, then choose 'Create->Modifier->(type)' from the main menu. You must have an object selected before creating a modifier.",
			"title": "",
			"icon": false
		},	
		{
			"title": "Bend (Create-Modifiers->Bend)",
			"body": "The Bend Modifier curves an object around an axis. The amount setting describes the total bend angle. A higher number will produce a tighter angle. A negative amound will bend the object in the opposite direction. Choosing an axis can be tricky. The major axis is easier to visualize - this is the axis the object will bend around. The minor axis is the axis that the shape will bend away from.  It might take some guessing to get the exact effect you desire. A good way to get a feel is to create a box that is tall, with the maximum height segments. Bend this with a major axis of X and a minor of Y. Now, try reversing these settings. Note that the major and minor axis should never be the same.",
			"icon": false
		},	
		{	
			"title": "Twist(Create-Modifiers->Twist)",
			"body": "A cube shape. The height, width, and length are editable, and you may specify the number of segments in each direction. When selecting 'Pivot from Base', the cube will move up, such that its center is at the negative extent, rather than the geometric middle.",
			"icon": false
		},	
		{	
			"title": "Offset (Create-Modifiers->Offset)",
			"body": "The offset modifier moves the geometry away from its center point. This is useful to make objects that rotate around a point other than their default center, like a door. You can offset the object in any axis. Note that the axis is always in local space. The offset can be added before a bend or twist for some very interesting effects!",
			"icon": false
		},	
		{	
			"title": "Taper (Create-Modifiers->Taper)",
			"body": "The taper modifier simply scales an object along the Z axis. A taper of one will make the object have a point at the maximum Z, and a taper of -1 will move the point to the minimum.",
			"icon": false
		},	
		{	
			"title": "Stretch (Create-Modifiers->Stretch)",
			"body": "The stretch modifier will scale an object in one axis, while making it thinner in the others. Image this effect like pulling taffy - as the two ends get farther apart, the center of the taffy gets thinner. The effect axis selects the direction to pull. Stretch Amount is how far to pull the ends, and Bulge amount is how much the object should thin given the stretch amount.",
			"icon": false
		},	
		{	
			"title": "Noise (Create-Modifiers->Noise)",
			"body": "The noise modifier is used to randomly offset each vertex in a model. It can be used to turn a plane into a terrain, or a sphere into a rock. You can specify which axis to deform with the 'Effect X', 'Effect Y', or 'Effect Z' buttons. Increasing the 'iterations' will layer additional smaller noise on the first, basically controlling the smoothness of the noise. The 'noise scale' slider can be used to control the size of the noise features, and the random seed can be changed to generate new unique noise.",
			"icon": false
		},		
		{
			"title": "UV map (Create-Modifiers->UV map)",
			"body": "The UV map modifier can edit the way a texture applies to an object. For now, you can only specify the x and y scale, and the rotation. The 'offset' setting will slide the texture over the surface. Note than many similar properties can be controlled per material as well.",
			"icon": false
		}	
	]
}