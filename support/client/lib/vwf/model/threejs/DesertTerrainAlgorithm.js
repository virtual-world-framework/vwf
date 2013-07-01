function DesertTerrainAlgorithm() 
{	
	this.init = function(data)
	{
		console.log(data);
		importScripts('simplexNoise.js');
		importScripts('Rc4Random.js');
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function()
	{	
		
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(seed)
	{
		this.SimplexNoise = new SimplexNoise((new Rc4Random(seed +"")).random);
		this.random = (new Rc4Random(seed +"1")).random;
		this.Random = function(min,max)
		{
			var r = this.random();
			r = r * (max-min) + min;
			return r;
		}
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
		cliffSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/darkrock.jpg" ) },
		dirtSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/sand.jpg" ) },
		};
		
		uniforms_default.cliffSampler.value.wrapS = uniforms_default.cliffSampler.value.wrapT = THREE.RepeatWrapping;
		uniforms_default.dirtSampler.value.wrapS = uniforms_default.dirtSampler.value.wrapT = THREE.RepeatWrapping;
		
		return uniforms_default;
	}
	this.getDiffuseFragmentShader = function(mesh,matrix)
	{
		return (
		"uniform sampler2D cliffSampler;\n"+
		"uniform sampler2D dirtSampler;\n"+
		"uniform sampler2D noiseSampler;\n"+
		
		"vec4 getTexture(vec3 coords, vec3 norm)" +
		"{"+
			//"coords /= 100.0;\n"+
			"vec4 noiseMain = texture2D(noiseSampler,(pos.xy/10.0)/2.0);\n"+
			"vec2 c0 = (pos.xy/10.0)/2.0 ;\n"+
			"vec2 c1 = (pos.xy/10.0)/2.0 ;\n"+
			"c1.y /= .5;\n"+
			"vec2 c0a = (pos.xy/20.0)/2.0 ;\n"+
			"vec2 c1a = (pos.xy/100.0)/2.0 ;\n"+
			
			"vec4 cliff =.5*texture2D(cliffSampler,c0) +  .5*texture2D(cliffSampler,c0a);\n"+
			"vec4 dirt = .5*texture2D(dirtSampler,c1) +  .5*texture2D(dirtSampler,c1a);\n"+
			
			"float ss = smoothstep(0.0,20.0,pos.z);\n"+
			"return cliff * ss + dirt*(1.0-ss);\n"+
		"}")
	}
	this.displace= function(vert)
	{
		var z = 0;

		z += (this.SimplexNoise.noise2D((vert.x)/1000,(vert.y)/5000))-.5;
		var t = 0;
		if(z > 0)
		{
			for(var i = 0; i < 10; i++)
				t += (this.SimplexNoise.noise2D((vert.x)/(20 * i),(vert.y)/(20 * i)) + 1) * (4 * i);
			t *= z;	
		}
		var r = 0;
		{
			for(var i = 0; i < 3; i++)
				r += (this.SimplexNoise.noise2D((vert.x)/(20 * i),(vert.y)/(200 * i)) + 1) * ( 1* i);
			t += r;	
		}
		return t ;
	}
}