//UDOP Functions

//This represents a UAV and its associated 3D model and video resource
function uav(id, modelUrl, videoUrl) {
	this.id = id;
	this.modelUrl = modelUrl;
	this.videoUrl = videoUrl;
}

//This is an Area of Interest defined by a polygon
function aoi(id, points) {
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
	//'/udop/resources/models/splotchy_box.dae', '');
	//'splotchy_box.dae', '');
	'http://localhost:3000/udop/0286aa4eb724b3eb/resources/models/uav.dae', '');
	var uav1Placemark = ge.createPlacemark('');
	var uav1Model = create3DModel(uav1.modelUrl);
	var uav1Location = ge.createLocation('');
	uav1Location.setLatLngAlt(40, -106, 10000);
	uav1Model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
	uav1Model.setLocation(uav1Location);
	var scale1 = ge.createScale('');
	scale1.set(500, 500, 500);
	uav1Model.setScale(scale1);
	uav1Placemark.setGeometry(uav1Model);
	ge.getFeatures().appendChild(uav1Placemark);

	var view1 = ge.createPlacemark('');
	var view1Model = create3DModel('http://localhost:3000/udop/0286aa4eb724b3eb/resources/models/view.dae');
	var view1Location = ge.createLocation('');
	view1Location.setLatLngAlt(40, -106, 10600);
	view1Model.setAltitudeMode(ge.ALTITUDE_ABSOLUTE);
	view1Model.setLocation(view1Location);
	var scale2 = ge.createScale('');
	scale2.set(500, 500, 500);
	view1Model.setScale(scale2);
	view1.setGeometry(view1Model);
	ge.getFeatures().appendChild(view1);

	
	var uav1Balloon = ge.createHtmlStringBalloon('');
	uav1Balloon.setFeature(uav1Placemark);
	var uavHtml = ''
			+ '<video width="200" height="150" class="isr-video" id="isr-1" poster="video/video.png" '
			+ 'controls> <source src="resources/isr_data/isr_1.ogv" '
			+ 'type=\'video/ogg; codecs="theora, vorbis"\' /> '
			+ '<p>Video playback is not supported in this browser.</p></video>';	
	uav1Balloon.setContentString(uavHtml);
	uav1Balloon.setMaxWidth(300);
	uav1Balloon.setMaxHeight(225);
	ge.setBalloon(uav1Balloon);

	google.earth.addEventListener(uav1Placemark, 'click', function(event){
		event.preventDefault();
		ge.setBalloon(uav1Balloon);
		
	});
	
	var balloonOn = function(){
		ge.setBalloon(uav1Balloon);
	}
	
	var button= document.createElement('input');
	button.setAttribute('type','button');
	button.setAttribute('name','video');
	button.setAttribute('value','video');
	document.body.appendChild(button);
	button.onclick = balloonOn;
	
	
	// AOI (40.4, -107.2) -> (39.5, -105.3)
	var aoiPlacemark = ge.createPlacemark('');
	var aoiPoly = ge.createPolygon('');
	aoiPlacemark.setGeometry(aoiPoly);
	aoiPoly.setAltitudeMode(ge.ALTITUDE_CLAMP_TO_GROUND);
	var aoiRing = ge.createLinearRing('');
	aoiPoly.setOuterBoundary(aoiRing);
	var aoiCoords = aoiRing.getCoordinates();
	aoiCoords.pushLatLngAlt(40.4, -107.2, 0);
	aoiCoords.pushLatLngAlt(40.4, -105.3, 0);
	aoiCoords.pushLatLngAlt(39.5, -105.3, 0);
	aoiCoords.pushLatLngAlt(39.5, -107.2, 0);
	aoiPlacemark.setStyleSelector(ge.createStyle(''));
	var aoiLineStyle = aoiPlacemark.getStyleSelector().getLineStyle();
	aoiLineStyle.getColor().setR(255);
	aoiLineStyle.getColor().setG(255);
	aoiLineStyle.getColor().setB(255);
	aoiLineStyle.getColor().setA(200);
	var aoiPolyStyle = aoiPlacemark.getStyleSelector().getPolyStyle();
	aoiPolyStyle.getColor().setR(35);
	aoiPolyStyle.getColor().setG(200);
	aoiPolyStyle.getColor().setB(225);
	aoiPolyStyle.getColor().setA(80);
	ge.getFeatures().appendChild(aoiPlacemark);

}

function failureCallback(errorCode) {
}

google.setOnLoadCallback(init);

function create3DModel(modelUrl) {
	var model = ge.createModel('');
	var link = ge.createLink('');
	link.setHref(modelUrl);
	model.setLink(link);
	return model;
}

function createVideoBalloon(id, placemark, content) {
	var balloon = ge.createHtmlStringBalloon('');
	balloon.setFeature(placemark);
	balloon.setMaxWidth(200);
	balloon.setContentString(content);
	return balloon;
}

function createPolygon(id, points) {
	var polygon;
}