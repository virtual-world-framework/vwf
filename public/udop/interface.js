var ge;
google.load("earth", "1");

function init() {
	google.earth.createInstance('map3d', initCallback, failureCallback);
}

function initCallback(instance) {
	ge = instance;
	ge.getWindow().setVisibility(true);

	var kmlURL = 'http://earth-api-samples.googlecode.com/svn/trunk/examples/static/red.kml'
	function finished(object) {
		if (!object) {
			// wrap alerts in API callbacks and event handlers
			// in a setTimeout to prevent deadlock in some browsers
			setTimeout(function() {
				alert('Bad or null KML.');
			}, 0);
			return;
		}
		ge.getFeatures().appendChild(object);
	}
	google.earth.fetchKml(ge, kmlURL, finished)

}

function failureCallback(errorCode) {
}

google.setOnLoadCallback(init);