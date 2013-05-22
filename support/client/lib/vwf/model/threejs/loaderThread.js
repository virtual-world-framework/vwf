function GUID()
{
	var S4 = function ()
	{
		return Math.floor(Math.random() * 0x10000 /* 65536 */ ).toString(16);
	};
	return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
}

function stripParents(asset)
{
	if(asset.parent)
	{
		if(!asset.parent.tempid)
			asset.parent.tempid = GUID();
		asset.parent = asset.parent.tempid;	
	}
	if(asset.children)
	{
		for(var i =0; i < asset.children.length; i++)
		{	
			stripParents(asset.children[i]);
		}
	}
}

function decompressArrays(node)
{
     if (node.attributes) {
                for(var i in node.attributes)
				{
                    
                   var attributeArray = node.attributes[i];
				   self.log(i);
                   node.attributes[i] = DecodeArray(attributeArray,i);
				}
	 }
	  for (i in node.primitives) {
                if (node.primitives[i].indices) {
                    var array = node.primitives[i].indices;
                    array = DecodeArray(array);
					node.primitives[i].indices = array;
				}
		}
	 if(node.children)
	 {
		for( var i =0; i < node.children.length; i++)
			decompressArrays(node.children[i]);
	 }
}

self.init = function(data)
  {
	  if(!self.THREE)
	  {
	    importScripts('jquery.nodom.js');
		importScripts('three.js');
		importScripts('ColladaLoader.js');
		importScripts('UTF8JSONLoader.js');
	  }
	  self.decompressUTF8 = function(data)
	  {
	    if(!data) return;
		var compressed = data.compressed;
		var cbid = data.cbid;
		  
		var ret =  JSON.parse(decompress(compressed));
		decompressArrays(ret);
		self.command('decompressed',{decompressed:ret,cbid:cbid});
	  }
	  self.load = function(data)
	  {
		  var url = data.url;
		  var type = data.type;
		  var cbid = data.cbid;
		  
		 // self.loaded({name:'this is a loaded object'},cbid);
		  
		  
		   if(type == "model/vnd.collada+xml")
		   {
			 var loader = new self.THREE.ColladaLoader();
			 loader.load(url,function(e)
			 {
				 self.log("loaded");
			 });
		   }
		   else if(type == "model/vnd.osgjs+json+compressed")
		   {
				var loader = new UTF8JsonLoader({source:url},function(asset)
				{
					var asset = asset.scene;
					//stripParents(asset);
					
					self.loaded(asset,cbid);
				},
				function()
				{
					self.loaded(null,cbid);
				}
				);
		   }
		   else
		   {
				self.loaded(null,cbid);
		   }
	  }
	  self.testpass = function()
	  {
			self.log('testing array');
			self.command('log',new Array());
			self.log('testing Vec3');
			self.command('log',new THREE.Vector3());
			self.log('testing Matrix4');
			self.command('log',new THREE.Matrix4());
			self.log('testing Object3D');
			self.command('log',new THREE.Object3D());
	  }
	  self.command = function(command,data)
	  {
		   self.postMessage({command:command,data:data});
	  }
	  self.loaded = function(asset,cbid)
	  {
		   self.command('loaded',{asset:asset,cbid:cbid});
	  }
	  self.test = function()
	  {
		  self.log('got here');
	  }
	  self.log = function(message)
	  {
		   self.command('eval',"console.log('"+message+"');");
	  }
	  self.alert = function(message)
	  {
		   self.command('eval',"_Notifier.alert('"+message+"');");
	  }
	  self.log('background loader init complete');
  }
  
self.addEventListener('message', function(e) {
  
  var window = self;
  
  
  var data = e.data;
  var command = e.data.command;
  
  if(self[command])
	self[command](e.data.data);
  
  
  
}, false);