function heightmapTerrainAlgorithm() 
{	
	this.init = function(data)
	{
		this.data = data;
		console.log('data received');
		this.height = 1024;
		this.width = 1024;
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function(cb)
	{	
		this.height = 1024;
		this.width = 1024;
		canvas = document.createElement('canvas');
		
		canvas.height = this.height;
		canvas.width = this.width;
		var img = new Image();
		img.src = 'terrain/deathvally.jpeg';
		img.onload = function()
		{
			
			var context = canvas.getContext('2d');
			context.drawImage(img, 0, 0);
			var data = context.getImageData(0, 0, this.height, this.width).data;
			
			var array = new Uint8Array(this.height*this.width);
			for(var i =0; i < this.height*this.width * 4; i+=4)
				array[Math.floor(i/4)] = Math.pow(data[i]/255.0,2.2) * 255;
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
		var uniforms_default = {
		diffuseSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/deathvallydiffuse.jpeg" ) },
		dirtSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/dirt.jpg" ) },
		};
		uniforms_default.diffuseSampler.value.wrapS = uniforms_default.diffuseSampler.value.wrapT = THREE.RepeatWrapping;
		uniforms_default.dirtSampler.value.wrapS = uniforms_default.dirtSampler.value.wrapT = THREE.RepeatWrapping;
		return uniforms_default;
	}
	this.getDiffuseFragmentShader = function(mesh,matrix)
	{
		return (
		"uniform sampler2D diffuseSampler;\n"+
		"uniform sampler2D dirtSampler;\n"+
		"vec4 getTexture(vec3 coords, vec3 norm)" +
		"{"+
			"vec4 diffuse = texture2D(diffuseSampler,((coords.yx * vec2(1.0,-1.0))/5000.0));\n"+
			"vec4 near = texture2D(dirtSampler,((coords.yx / 10.0)));\n"+
			"float minamt = smoothstep(0.0,100.0,distance(cameraPosition , coords));\n"+
			"return mix(near,diffuse,minamt);\n"+
		"}")
	}
	this.at = function(x,y)
	{
		x = x > this.height ? 0 : x;
		y = y > this.height ? 0 : y;
		var i = x * this.height  + y;
		return this.data[i];
	}
	this.sampleBiLinear = function(u,v)
	{
		//u = u - Math.floor(u);
		//v = v - Math.floor(v);
		u = u * this.height - .5;
		v = v * this.width - .5;
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
	this.cubicInterpolate = function(p, x) 
	{
		return p[1] + 0.5 * x*(p[2] - p[0] + x*(2.0*p[0] - 5.0*p[1] + 4.0*p[2] - p[3] + x*(3.0*(p[1] - p[2]) + p[3] - p[0])));
	}
	this.bicubicInterpolate = function(p, x, y)
	{
		var arr = [];
		arr[0] = this.cubicInterpolate(p[0], y);
		arr[1] = this.cubicInterpolate(p[1], y);
		arr[2] = this.cubicInterpolate(p[2], y);
		arr[3] = this.cubicInterpolate(p[3], y);
		return this.cubicInterpolate(arr, x);
	}
	this.sampleBiCubic = function(u,v)
	{
		var x = Math.floor(u * this.height);
		var y = Math.floor(v * this.width);
		
		u = (u * this.height) - x;
		v = (v * this.width) - y;
		var p = [];
		p[0] = [this.at(x-1,y-1),this.at(x-0,y-1),this.at(x+1,y-1),this.at(x+2,y-1)];
		p[1] = [this.at(x-1,y-0),this.at(x-0,y-0),this.at(x+1,y-0),this.at(x+2,y-0)];
		p[2] = [this.at(x-1,y+1),this.at(x-0,y+1),this.at(x+1,y+1),this.at(x+2,y+1)];
		p[3] = [this.at(x-1,y+2),this.at(x-0,y+2),this.at(x+1,y+2),this.at(x+2,y+2)];
		return this.bicubicInterpolate(p,u/2,v/2);
	}
	this.displace= function(vert)
	{
		
		return this.sampleBiLinear((vert.x) / 5000,(vert.y) / 5000) * 1.5 - 30|| 0;
	}
}