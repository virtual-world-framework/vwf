function heightmapTerrainAlgorithm() 
{	
	this.init = function(data)
	{
		this.data = data;
		console.log('data received');
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function(cb)
	{	
		
		canvas = document.createElement('canvas');
		//document.body.appendChild(canvas);
		canvas.height = 1024;
		canvas.width = 1024;
		var img = new Image();
		img.src = 'terrain/heightmap.jpg';
		img.onload = function()
		{
			
			var context = canvas.getContext('2d');
			context.drawImage(img, 0, 0);
			var data = context.getImageData(0, 0, 1024, 1024).data;
			
			var array = new Uint8Array(1024*1024);
			for(var i =0; i < 1024*1024 * 4; i+=4)
				array[Math.floor(i/4)] = data[i];
			cb(array);
		}
		//signal the pool that we need an async statup
		return false;
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(seed)
	{
		this.seed = seed;
	}
	this.setAlgorithmDataPool = function(seed)
	{
		this.seed = seed;
	}
	this.getAlgorithmDataPool = function(seed)
	{
		return this.seed;
	}
	this.forceTileRebuildCallback = function()
	{
		return true;
	}
	this.getMaterialUniforms = function(mesh,matrix)
	{
		
	}
	this.getDiffuseFragmentShader = function(mesh,matrix)
	{
		
	}
	this.at = function(x,y)
	{
		x = x % 1024;
		y = y % 1024;
		var i = x * 1024  + y;
		return this.data[i];
	}
	this.sample = function(u,v)
	{
		//u = u - Math.floor(u);
		//v = v - Math.floor(v);
		u = u * 1024.0 - .5;
		v = v * 1024.0 - .5;
		var x = Math.floor(u);
		var y = Math.floor(v);
		var u_ratio = u -x;
		var v_ratio = v - y;
		var u_opposite = 1 - u_ratio;
		var v_opposite = 1 - v_ratio;
		var result = (this.at(x,y)   * u_opposite  + this.at(x+1,y)   * u_ratio) * v_opposite + 
                   (this.at(x,y+1) * u_opposite  + this.at(x+1,y+1) * u_ratio) * v_ratio;
		return result;
	}
	this.displace= function(vert)
	{
		
		return this.sample(vert.x / 40000,vert.y / 40000) * 3 || 0;
	}
}