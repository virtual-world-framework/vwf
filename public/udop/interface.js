
//UDOP Functions

//This represents a UAV and its associated 3D model and video resource
function uav(id, modelUrl, videoUrl){
	this.id = id;
	this.modelUrl = modelUrl;
	this.videoUrl = videoUrl;
}

//This is an Area of Interest defined by a polygon
function aoi(id, points){
	this.id = id;
	this.points = points;
}




var ge;
google.load("earth", "1");

function init() {
	google.earth.createInstance('map3d', initCallback, failureCallback);
}

function initCallback(instance) {
	ge = instance;
	ge.getWindow().setVisibility(true);

	var uav1 = new uav('uav_1', 
			//'http://earth-api-samples.googlecode.com/svn/trunk/examples/static/splotchy_box.dae', '');
			//'C:\\Users\\piercess\\Desktop\\VWF\\integration\\public\\udop\\resources\\models\\splotchy_box.dae', '');
			//'file:///C:/Users/piercess/Desktop/VWF/integration/public/udop/resources/models/uav.dae', '');
			'http://localhost:3000/udop/249dcc5235fe5d5a/resources/models/uav.dae/', '');
	var uav1Placemark = ge.createPlacemark(uav1.id);
	var uav1Model = create3DModel(uav1.modelUrl);
	var uav1Location = ge.createLocation('');
	uav1Location.setLatLngAlt(37, -122, 1000);
	uav1Model.setLocation(uav1Location);
	var scale = ge.createScale('');
	scale.set(50,50,50);
	uav1Model.setScale(scale);
	uav1Placemark.setGeometry(uav1Model);
	ge.getFeatures().appendChild(uav1Placemark);
	

}

function failureCallback(errorCode) {
}

google.setOnLoadCallback(init);


function create3DModel(modelUrl){
	var model = ge.createModel('');
	var link = ge.createLink('');
	link.setHref(modelUrl);
	model.setLink(link);
	return model;
}

function createVideoBalloon(id, placemark, content){
	var balloon = ge.createHtmlStringBalloon('');
	balloon.setFeature(placemark);
	balloon.setMaxWidth(200);
	balloon.setContentString(content);
	return balloon;
}

function createPolygon(id, points){
	var polygon;
}