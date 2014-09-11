{
	"title":"Primitive Objects",
	"entries": [
		{
			"body": "The VWF Sandbox allows you to create some simple shapes natively, without loading a model file. We call these objects 'Primitives', and each one has a set of properties that you can modify. Usually, these settings are the number of polygons used to build each object, and the dimensions of the object. The number of segments can be important when applying modifiers to the object. Modifiers can apply effects to the geometry, but must have polygons to work on. For instance, you cannot bend a box with only 8 vertices, because the edge between the vertices will always be a straight line. More polygons will make the bend effect smoother.",
			"title": "",
			"icon": false
		},
		{
			"icon": "sphere.png",
			"title": "Create Sphere (Create-Primitives->Sphere)",
			"body": "A Sphere shape. You may edit the radius, and the number of segments. More segments means more polygons."	
		},
		{
			"icon": "cube.png",
			"title": "Create Box (Create-Primitives->Box)",
			"body": "A cube shape. The height, width, and length are editable, and you may specify the number of segments in each direction. When selecting 'Pivot from Base', the cube will move up, such that its center is at the negative extent, rather than the geometric middle."
		},	
		{
			"icon": "cylinder.png",
			"title": "Create Cylinder (Create-Primitives->Cylinder)",
			"body": "The cylinder shape has 4 setting. You can set the radius, which makes the cylinder thicker or thinner, and the radial segments, which make the edge smoother. The height is the length of the cylinder, and the height segments affect the number of polygons in this direction. The cylinder also has a 'Base to pivot' setting, like the box."	
		},
		{
			"icon": "cone.png",
			"title": "Create Cone (Create-Primitives->Cone)",
			"body": "The cone shape has 4 setting. You can set the radius, which makes the cone thicker or thinner, and the radial segments, which make the edge smoother. The height is the distance from the base to the point, and the height segments affect the number of polygons in this direction. The cone also has a 'Base to pivot' setting, like the box."
		},	
		{
			"icon": "pyramid.png",
			"title": "Create Pyramid (Create-Primitives-> Pyramid)",
			"body": "The pyramid shape has a height, width, and length, and segments in each direction. It also has a 'Base to pivot' setting, like the box."	
		},
		{
			"icon": "plane.png",
			"title": "Create Plane (Create-Primitives-> Plane)",
			"body": "The plane is a 2 dimensional grid of polygons. The shape is always created such that it's local Z is the normal of the plane. You may specify the number of polygons in each direction of the plane, and its extent in the local X and Y."	
		}
	]
}