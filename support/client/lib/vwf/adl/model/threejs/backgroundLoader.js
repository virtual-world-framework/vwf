define(function ()
{
	var BackgroundLoader = {};
	
	var isInitialized = false;
	 
	function getSingleton()
	{
		if (!isInitialized)
		{
			initialize.call(BackgroundLoader);
			isInitialized = true;
			window.backgroundLoader = BackgroundLoader;
		}
		return BackgroundLoader;
	}
	return getSingleton();

	
	function hookParents(asset)
	{
		
		if(asset.children)
		{
			for(var i =0; i < asset.children.length; i++)
			{	
				hookParents(asset.children[i]);
				asset.children[i].parent = asset;
			}
		}
		return asset;
	}

	function initialize ()
	{
		var self = this;
		this.callbacks = {};
		this.worker = new Worker('./vwf/adl/model/threejs/loaderThread.js');
		this.worker.onmessage = function(event) {
			self.onmessage(event.data);
		}
		
		this.onmessage = function(data)
		{
			
			if(this[data.command])
				this[data.command](data.data);
		}
		this.eval = function(data)
		{
			eval(data);
		}
		this.command = function(command,data)
		{
			this.worker.postMessage({command:command,data:data});
		}
		this.test = function()
		{
			this.command('test');
		}
		this.log = function(data)
		{
			console.log(data);
			this.lastLogged = data;
		}
		this.testpass = function()
		{
			this.command('testpass');
		}
		this.load = function(url,type,callback)
		{
			var cbid = GUID();
			this.callbacks[cbid] = callback;
			this.worker.postMessage({command:'load',data:{url:url,type:type,cbid:cbid}});
		}
		this.decompress = function(data,callback)
		{
			
			var cbid = GUID();
			this.callbacks[cbid] = callback;
			this.worker.postMessage({command:'decompressUTF8',data:{compressed:data,cbid:cbid}});
		}
		this.decompressed = function(data)
		{
			var asset = data.decompressed;//hookParents(JSON.parse(data.asset));
			var cbid = data.cbid;
			if(this.callbacks[cbid])
			{
				this.callbacks[cbid](asset)
				delete this.callbacks[cbid];
			}
		}
		this.error = function(data)
		{
			console.log('error in loader thread:' + data.error);
			var cbid = data.cbid;
			if(this.callbacks[cbid])
			{
				this.callbacks[cbid](null);
				delete this.callbacks[cbid];
			}
		}
		this.loaded = function(data)
		{
			var asset = data.asset;//hookParents(JSON.parse(data.asset));
			var cbid = data.cbid;
			if(this.callbacks[cbid])
			{
				this.callbacks[cbid](asset)
				delete this.callbacks[cbid];
			}
		
		}
		this.command('init');
	}
});