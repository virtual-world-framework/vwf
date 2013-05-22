
self.addEventListener('message', function(e) {
  
  var window = self;
  
  if(!self.THREE)
  {
	importScripts('three.js');
	importScripts('ColladaLoader.js');
  }
  var data = e.data;
  
  var url = data.url;
  var type = data.type;
  if(type == "model/vnd.collada+xml")
  {
	var loader = new self.THREE.ColladaLoader();
	loader.load(url,function(e)
	{
		self.postMessage('loading: ' + data.url + " as " + data.type);
		//self.close();
	});
	
  
  }
  
  
}, false);