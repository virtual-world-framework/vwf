function heightmapTerrainAlgorithm() 
{	
	//this init is called from each thread, and gets data from the poolInit function.
	this.init = function(data)
	{
		this.data = data.data;
		console.log('data received');
		this.height = data.height;
		this.width = data.width;
		this.min = data.min;
		importScripts('simplexNoise.js');
		importScripts('Rc4Random.js');
		this.SimplexNoise = new SimplexNoise((new Rc4Random(1 +"")).random);
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function(cb)
	{	
		
		this.type = 'bt';
		if(this.type == 'img')
		{
			canvas = document.createElement('canvas');
			
			var img = new Image();
			img.src = 'terrain/deathvally.jpeg';
			img.onload = function()
			{
				
				this.height = img.naturalHeight;
				this.width = img.naturalWidth;
				canvas.height = this.height;
				canvas.width = this.width;
				var context = canvas.getContext('2d');
				context.drawImage(img, 0, 0);
				var data = context.getImageData(0, 0, this.height, this.width).data;
				
				var array = new Uint8Array(this.height*this.width);
				for(var i =0; i < this.height*this.width * 4; i+=4)
					array[Math.floor(i/4)] = Math.pow(data[i]/255.0,2.2) * 255;
				cb({height:this.height,width:this.width,min:0,data:array});
			}
		}
		if(this.type == 'bt')
		{
			var buff;
			var self2 = this;
			var xhr = new XMLHttpRequest();
			xhr.responseType = 'arraybuffer';
			xhr.onload = function(e) {
				if (xhr.status === 200) {
				  buff = xhr.response;
				  self2.parseBT(buff,cb);
				} else
				{
					cb(null);
				}
			};
			xhr.open('GET', "terrain/deathvally.bt");
			xhr.send();
		}
		
		//signal the pool that we need an async startup
		return false;
	}
	this.parseBT = function(arraybuf,cb)
	{
		
		var DV = new DataView(arraybuf);
		this.width = DV.getInt32(10,true);
		this.height = DV.getInt32(14,true);
		var dataSize = DV.getInt16(18,true);
		var isfloat = DV.getInt16(20,true);
		var scale = DV.getFloat32(62,true);
		var data;
		if(isfloat == 1)
		{
			data = new Float32Array(this.width*this.height);
		}
		else
		{
			data = new Int16Array(this.width*this.height);
		}
		var min = Infinity;
		for(var i =0; i < this.width*this.height; i++)
		{
			if(isfloat == 1)
			{
				data[i] = DV.getFloat32(256 + 4 * i,true);			
			}else
			{
				data[i] = DV.getInt16(256 + 2 * i,true);
			}
			if(data[i] < min)
				min = data[i];
		}
		cb({height:this.height,width:this.width,min:min,data:data});
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(seed)
	{
		this.seed = seed;
	}
	//this sets the values on the pool side. Keep these cached here, so the engine can query them without an async call
	this.setAlgorithmDataPool = function(seed)
	{
		this.seed = seed;
	}
	//the engine will read the data values here
	this.getAlgorithmDataPool = function(seed)
	{
		return this.seed;
	}
	//The system might choose to not rebuild a tile after a param change by returning false
	//Note, you'll have to watch this to make sure that you're not canceling a needed tile.
	//actually, you'll need some additional data to make the choice, which the engine does not currently provide.
	this.forceTileRebuildCallback = function()
	{
		return true;
	}
	//This will allow you to setup shader variables that will be merged into the the terrain shader
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
	//This funciton allows you to compute the diffuse surface color however you like. 
	//must implement vec4 getTexture(vec3 coords, vec3 norm) or return null which will give you the default white
	this.getDiffuseFragmentShader = function(mesh,matrix)
	{
		return (
		"uniform sampler2D diffuseSampler;\n"+
		"uniform sampler2D dirtSampler;\n"+
		"vec4 getTexture(vec3 coords, vec3 norm)" +
		"{"+
			"vec4 diffuse = texture2D(diffuseSampler,((coords.yx * vec2(1.0,-1.0) + 2500.0)/5000.0));\n"+
			"vec4 near = texture2D(dirtSampler,((coords.yx / 10.0)));\n"+
			"float minamt = smoothstep(0.0,100.0,distance(cameraPosition , coords));\n"+
			"return mix(near,diffuse,minamt);\n"+
		"}")
	}
	//This is the displacement function, which is called in paralell by the thread pool
	this.displace= function(vert)
	{
		var z = this.SimplexNoise.noise2D((vert.x)/100,(vert.y)/100) * 4.5;
		z += this.SimplexNoise.noise2D((vert.x)/300,(vert.y)/300) * 4.5;
		z += this.SimplexNoise.noise2D((vert.x)/10,(vert.y)/10) * 0.5;
		return this.sampleBiCubic((vert.x+ 2500) / 5000 ,(vert.y + 2500) / 5000  ) * 1.0 - this.min + z|| 0;
	}
	this.at = function(x,y)
	{
		if( x > this.height || x < 0) return 0;
		if( y > this.width || y < 0) return 0;
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
		var y = Math.floor(u * this.height);
		var x = Math.floor(v * this.width);
		
		u = (u * this.height) - Math.floor(u * this.height);
		v = (v * this.width) - Math.floor(v * this.height);
		var p = [];
		var t = x;
		x = y;
		y = t;
		t = u;
		u = v;
		v = t;
		p[0] = [this.at(x-1,y-1),this.at(x-0,y-1),this.at(x+1,y-1),this.at(x+2,y-1)];
		p[1] = [this.at(x-1,y-0),this.at(x-0,y-0),this.at(x+1,y-0),this.at(x+2,y-0)];
		p[2] = [this.at(x-1,y+1),this.at(x-0,y+1),this.at(x+1,y+1),this.at(x+2,y+1)];
		p[3] = [this.at(x-1,y+2),this.at(x-0,y+2),this.at(x+1,y+2),this.at(x+2,y+2)];
		return this.bicubicInterpolate(p,u,v);
	}
}