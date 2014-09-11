function heightmapTerrainAlgorithm() 
{	
	
	this.dataHeight =  0;
	this.dataWidth =  0;
	this.worldLength =  13500;
	this.worldWidth =  9500;
	this.addNoise =  false;
	this.cubic =  false;
	this.gamma =  false;
	this.min =  0;

	//this init is called from each thread, and gets data from the poolInit function.
	this.init = function(data)
	{
		this.data = data.data;
		
		console.log('data received');
		
		this.dataHeight = data.dataHeight || 0;
		this.dataWidth = data.dataWidth || 0;

		this.worldLength = data.worldLength || 13500;
		this.worldWidth = data.worldWidth || 9500;
		this.addNoise = data.addNoise || false;
		this.cubic = data.cubic || false;
		this.gamma = data.gamma || false;
		this.min = data.min || 0;
		console.log('from thread: min is ' + this.min);
		//this.type = 'bt';
		this.heightScale = data.heightScale || 1;
		this.importScript('simplexNoise.js');
		this.importScript('Rc4Random.js');
		this.SimplexNoise = new SimplexNoise((new Rc4Random(1 +"")).random);
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function(cb,params)
	{	
		
		this.type = 'bt';
		if(!params) params = {};
		this.addNoise = params.addNoise || false;
		this.cubic = params.cubic || false;
		this.gamma = params.gamma || false;
		this.heightScale = params.heightScale || 1;
		this.url = (params && params.url) || 'terrain/River.bt';

		if(this.url && this.url.lastIndexOf('.') > -1)
		{
			var type = this.url.substr(this.url.lastIndexOf('.')+1);
			if(type.toLowerCase() == 'bt')
				this.type = 'bt'
			else
				this.type = 'img';
		}
		this.diffuseUrl = (params && params.diffuseUrl) || 'terrain/River.jpg';
		this.mixUrl = (params && params.mixUrl) || 'terrain/flatnormals.jpg';
		this.rUrl = (params && params.rUrl) || 'terrain/River.jpg';
		this.gUrl = (params && params.gUrl) || 'terrain/River.jpg';
		this.bUrl = (params && params.bUrl) || 'terrain/River.jpg';
		this.baseUrl = (params && params.baseUrl) || 'terrain/River.jpg';

		this.rUrlNorm = (params && params.rUrlNorm) || 'terrain/flatnormals.jpg';
		this.gUrlNorm = (params && params.gUrlNorm) || 'terrain/flatnormals.jpg';
		this.bUrlNorm = (params && params.bUrlNorm) || 'terrain/flatnormals.jpg';
		this.baseUrlNorm = (params && params.baseUrlNorm) || 'terrain/flatnormals.jpg';

		if(this.type == 'img')
		{
			canvas = document.createElement('canvas');

			this.worldLength = params && parseFloat(params.worldLength) || 13500;
			this.worldWidth =  params && parseFloat(params.worldWidth) || 9500;
			var img = new Image();
			img.src = this.url;
			
			img.onload = function()
			{
				
				this.worldLength = params && parseFloat(params.worldLength) || 13500;
				this.worldWidth =  params && parseFloat(params.worldWidth) || 9500;
				this.dataHeight = img.naturalHeight;
				this.dataWidth = img.naturalWidth;
				this.heightScale = params.heightScale || 1;
				canvas.height = this.dataHeight;
				canvas.width = this.dataWidth;
				var context = canvas.getContext('2d');
				context.drawImage(img, 0, 0);
				var data = context.getImageData(0, 0, this.dataHeight, this.dataWidth).data;
				
				var array = new Uint8Array(this.dataHeight*this.dataWidth);
				for(var i =0; i < this.dataHeight*this.dataWidth * 4; i+=4)
					array[Math.floor(i/4)] = Math.pow(data[i]/255.0,1.0) * 255;
				var data = new Uint8Array(this.dataHeight*this.dataWidth);
				for(var i = 0; i < this.dataWidth; i++)
				{
					for(var j = 0; j < this.dataHeight; j++)
					{
						var c = i * this.dataWidth + j;
						var c2 = j * this.dataHeight + i;
						data[c] = array[c2];
					}
				}

				cb({heightScale:this.heightScale,worldLength:this.worldLength,worldWidth:this.worldWidth,dataHeight:this.dataHeight,dataWidth:this.dataWidth,min:0,data:data,addNoise:params.addNoise,cubic:params.cubic,gamma:params.gamma});
			}
		}
		if(this.type == 'bt')
		{
			this.worldLength = params && parseFloat(params.worldLength) || 13500;
			this.worldWidth =  params && parseFloat(params.worldWidth) || 9500;
			
			//check if it was preloaded
			if(_assetLoader.getTerrain(this.url))
			{
				var terraindata = _assetLoader.getTerrain(this.url);
				terraindata.worldLength = this.worldLength;
				terraindata.worldWidth = this.worldWidth;
				terraindata.addNoise=this.addNoise
				terraindata.cubic=this.cubic;
				terraindata.gamma=this.gamma;
				terraindata.heightScale = this.heightScale;
				window.setTimeout(function(){
					cb(terraindata);	
				},0);
				
			}
			else
			{
				var buff;
				var self2 = this;
				var xhr = new XMLHttpRequest();
				xhr.responseType = 'arraybuffer';
				xhr.onload = function(e) {
					if (xhr.status === 200) {
					  buff = xhr.response;
					  cb(self2.parseBT(buff));
					} else
					{
						cb(null);
					}
				};
				xhr.open('GET', this.url);
				xhr.send();
			}
		}
		
		//signal the pool that we need an async startup
		return false;
	}
	this.parseBT = function(arraybuf)
	{
		
		var DV = new DataView(arraybuf);
		this.dataWidth = DV.getInt32(10,true);
		this.dataHeight = DV.getInt32(14,true);
		var dataSize = DV.getInt16(18,true);
		var isfloat = DV.getInt16(20,true);
		var scale = DV.getFloat32(62,true);
		var data;
		if(isfloat == 1)
		{
			data = new Float32Array(this.dataWidth*this.dataHeight);
		}
		else
		{
			data = new Int16Array(this.dataWidth*this.dataHeight);
		}
		var min = Infinity;
		for(var i =0; i < this.dataWidth*this.dataHeight; i++)
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
		this.min = min;
		this.data = data;
		return {heightScale:this.heightScale,worldLength:this.worldLength,worldWidth:this.worldWidth,dataHeight:this.dataHeight,dataWidth:this.dataWidth,min:min,data:data,addNoise:this.addNoise,cubic:this.cubic,gamma:this.gamma}
	}
	//This is the settings data, set both main and pool side
	this.getEditorData = function(data)
	{
		return {

		h_aaalable:{
								
				      			displayname: 'Heightmap Algorithm',
				      			type: 'sectionTitle'
      					},	
		h_heightmapSrc:{
								displayname : 'HeightMap (Data Source) URL',
								property:'url',
								type:'map'
						},
		h_worldLength:{
								displayname : 'Data Source Length (m)',
								property:'worldLength',
								type:'prompt'
						},
		h_worldWidth:{
								displayname : 'Data Source Width (m)',
								property:'worldWidth',
								type:'prompt'
						},
						h_addNoise:{
								displayname : 'Add additional noise',
								property:'addNoise',
								type:'check'
						},
						h_cubic:{
								displayname : 'Use Bicubic interpolation',
								property:'cubic',
								type:'check'
						},
						h_gamma:{
								displayname : 'Use gamma correction',
								property:'gamma',
								type:'check'
						},
						h_heightScale:{
								displayname : 'Height Scale',
								property:'heightScale',
								type:'prompt'
						},
		zh_:{
								displayname : 'Material',
								type:'sectionTitle'
						},				
		zzh_diffuseSrc:{
								displayname : 'Texture URL',
								property:'diffuseUrl',
								type:'map'
						},
		zzh_mixSrc:{
								displayname : 'Mix Map URL',
								property:'mixUrl',
								type:'map'
						},
		zh_rSrc:{
								displayname : 'Red Channel Texture',
								property:'rUrl',
								type:'map'
						},
		zh_gSrc:{
								displayname : 'Green Channel Texture',
								property:'gUrl',
								type:'map'
						},
		zh_bSrc:{
								displayname : 'Blue Channel Texture',
								property:'bUrl',
								type:'map'
						},																																
		
		zh_baseSrc:{
								displayname : 'Black Channel Texture',
								property:'baseUrl',
								type:'map'
						},																																
		
		zh_rSrcNorm:{
								displayname : 'Red Channel NormalMap',
								property:'rUrlNorm',
								type:'map'
						},
		zh_gSrcNorm:{
								displayname : 'Green Channel NormalMap',
								property:'gUrlNorm',
								type:'map'
						},
		zh_bSrcNorm:{
								displayname : 'Blue Channel NormalMap',
								property:'bUrlNorm',
								type:'map'
						},																																
		
		zh_baseSrcNorm:{
								displayname : 'Black Channel NormalMap',
								property:'baseUrlNorm',
								type:'map'
						}																																
		};
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(data)
	{
		
	}
	//this sets the values on the pool side. Keep these cached here, so the engine can query them without an async call
	//updatelist is the existing tiles. Return tiles in an array  that will need an update after the property set. This will 
	//allow the engine to only schedule tile updates that are necessary.
	this.setAlgorithmDataPool = function(data,updateList)
	{
		if(!data) return [];
		var needRebuild = false;
		if(data.url && data.url != this.url)
		{
			this.url = data.url;
			needRebuild = true;
		}
		if(data.worldLength && data.worldLength != this.worldLength)
		{
			this.worldLength =  parseFloat(data.worldLength);
			needRebuild = true;
		}
		if(data.worldWidth && data.worldWidth != this.worldWidth)
		{

			this.worldWidth =  parseFloat(data.worldWidth);
			needRebuild = true;
		}
		if(data.cubic != this.cubic)
		{
			this.cubic =  data.cubic;
			needRebuild = true;
		}
		if(data.gamma != this.gamma)
		{
			this.gamma =  data.gamma;
			needRebuild = true;
		}
		if(data.addNoise != this.addNoise)
		{
			this.addNoise =  data.addNoise;
			needRebuild = true;
		}
		if(data.heightScale != this.heightScale)
		{
			
			this.heightScale =  data.heightScale;
			needRebuild = true;
		}
		if(data.diffuseUrl != this.diffuseUrl)	
		{
			this.diffuseUrl = data.diffuseUrl;
			this.materialRebuildCB();
		}
		if(data.rUrl != this.rUrl)	
		{
			this.rUrl = data.rUrl;
			this.materialRebuildCB();
		}
		if(data.gUrl != this.gUrl)	
		{
			this.gUrl = data.gUrl;
			this.materialRebuildCB();
		}
		if(data.bUrl != this.bUrl)	
		{
			this.bUrl = data.bUrl;
			this.materialRebuildCB();
		}
		if(data.baseUrl != this.baseUrl)	
		{
			this.baseUrl = data.baseUrl;
			this.materialRebuildCB();
		}
		if(data.rUrlNorm != this.rUrlNorm)	
		{
			this.rUrlNorm = data.rUrlNorm;
			this.materialRebuildCB();
		}
		if(data.gUrlNorm != this.gUrlNorm)	
		{
			this.gUrlNorm = data.gUrlNorm;
			this.materialRebuildCB();
		}
		if(data.bUrlNorm != this.bUrlNorm)	
		{
			this.bUrlNorm = data.bUrlNorm;
			this.materialRebuildCB();
		}
		if(data.baseUrlNorm != this.baseUrlNorm)	
		{
			this.baseUrlNorm = data.baseUrlNorm;
			this.materialRebuildCB();
		}
		if(data.mixUrl != this.mixUrl)	
		{
			
			this.mixUrl = data.mixUrl;
			this.materialRebuildCB();
		}
		if(needRebuild) return updateList;
		return [];
	}
	
	//the engine will read the data values here
	this.getAlgorithmDataPool = function(seed)
	{
		return {
			url:this.url,
			diffuseUrl:this.diffuseUrl,
			mixUrl:this.mixUrl,
			baseUrl:this.baseUrl,
			rUrl:this.rUrl,
			gUrl:this.gUrl,
			bUrl:this.bUrl,
			baseUrlNorm:this.baseUrlNorm,
			rUrlNorm:this.rUrlNorm,
			gUrlNorm:this.gUrlNorm,
			bUrlNorm:this.bUrlNorm,
			worldWidth:this.worldWidth,
			worldLength:this.worldLength,
			cubic:this.cubic || false,
			gamma:this.gamma || false,
			addNoise:this.addNoise || false,
			heightScale:this.heightScale || 1
		};
	}
	this.getTexture = function(url)
	{
		if(!this.texCache)
			this.texCache = {}
		if(!this.texCache[url])
		{
			this.texCache[url] = _SceneManager.getTexture(url);
			this.texCache[url].anisotropy = 1;
		}
		return this.texCache[url];

	}
	//This will allow you to setup shader variables that will be merged into the the terrain shader
	this.getMaterialUniforms = function(mesh,matrix)
	{
		
		var uniforms_default = {
		diffuseSampler:   { type: "t", value: this.getTexture( this.diffuseUrl,true) },
		baseSampler:   { type: "t", value: this.getTexture( this.baseUrl || "terrain/ground.jpg",true ) },
		gSampler:   { type: "t", value: this.getTexture( this.gUrl ||"terrain/cliff.jpg",true ) },
		rSampler:   { type: "t", value: this.getTexture( this.rUrl ||"terrain/cliff.jpg",true ) },
		bSampler:   { type: "t", value: this.getTexture( this.bUrl ||"terrain/ground.jpg",true ) },

		baseNormalMap:   { type: "t", value: this.getTexture( this.baseUrlNorm ||"terrain/3091-normal.jpg",true ) },
		gNormalMap:   { type: "t", value: this.getTexture( this.gUrlNorm ||"terrain/grassnorm.jpg",true ) },
		rNormalMap:   { type: "t", value: this.getTexture( this.rUrlNorm ||"terrain/4979-normal.jpg",true ) },
		bNormalMap:   { type: "t", value: this.getTexture( this.bUrlNorm ||"textures/waternormal.jpg",true ) },
		
		mixMap:   { type: "t", value: this.getTexture( this.mixUrl || "terrain/rivermix.png",true ) },
		
		};

		return uniforms_default;
	}

	this.getNormalFragmentShader = function()
	{
		
		
		
		// http://www.thetenthplanet.de/archives/1180
		 
		return ""+
		
		"uniform sampler2D baseNormalMap;\n"+
		"uniform sampler2D rNormalMap;\n"+
		"uniform sampler2D gNormalMap;\n"+
		"uniform sampler2D bNormalMap;\n"+

		"mat3 cotangent_frame(in vec3 N,in  vec3 p, in vec2 uv)\n"+
		"{\n"+
		"    // get edge vectors of the pixel triangle\n"+
		"    lowp vec3 dp1 = dFdx( p );\n"+
		"    lowp vec3 dp2 = dFdy( p );\n"+
		"    lowp vec2 duv1 = dFdx( uv );\n"+
		"    lowp vec2 duv2 = dFdy( uv );\n"+
		 
		"    // solve the linear system\n"+
		"    lowp vec3 dp2perp = cross( dp2, N );\n"+
		"    lowp vec3 dp1perp = cross( N, dp1 );\n"+
		"   lowp  vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;\n"+
		"    lowp vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;\n"+
		 
		"    // construct a scale-invariant frame \n"+
		"    lowp float invmax = inversesqrt( max( dot(T,T), dot(B,B) ) );\n"+
		"    return  mat3( T * invmax, B * invmax, N );\n"+
		"}\n"+

		"vec3 perturb_normal( in mat3 TBN, in vec2 texcoord, in sampler2D sampler )\n"+
		"{\n"+
		"    // assume N, the interpolated vertex normal and \n"+
		"    // V, the view vector (vertex to eye)\n"+
		"    lowp vec3 map = texture2D(sampler, texcoord ).xyz;\n"+
		"    map = map * 2.0 - 1.0;\n"+
		"    return normalize(TBN * map);\n"+
		"}\n"+
		"vec3 triPlanerNorm(in mat3 TBN0, in mat3 TBN1, in mat3 TBN2, in vec3 coords, in vec3 norm, in sampler2D sampler)" +
		"{"+
			"lowp vec3 dirt0 = perturb_normal(TBN0, coords.yz, sampler);\n"+
			"lowp vec3 dirt1 = perturb_normal(TBN1, coords.zx, sampler);\n"+
			"lowp vec3 dirt2 = perturb_normal(TBN2, coords.xy, sampler);\n"+
			"return blend_weights.x * dirt0 + blend_weights.y * dirt1 + blend_weights.z * dirt2;\n"+
		"}"+
		"vec3 blendNorm(in vec3 texture1,in vec3 texture2, in float a1)\n"+
		"{\n"+
		"    return mix(texture1,texture2,1.0-a1);\n"+
		"}\n"+
		"vec3 getNormal(in vec3 coords,in  vec3 viewNorm,in  vec2 uv,in vec3 wN) {\n"+

		//"return  viewNorm;\n"+

		
		" lowp vec3 med = viewNorm;\n"+
		" lowp vec3 near = viewNorm;\n"+
		"	 lowp vec3 V = -((viewMatrix * vec4(coords,1.0)).xyz);\n"+
		"    lowp mat3 TBN0 = cotangent_frame(viewNorm, V, coordsScaleA.yz);\n"+
		"   lowp  mat3 TBN1 = cotangent_frame(viewNorm, V, coordsScaleA.zx);\n"+
		"   lowp  mat3 TBN2 = cotangent_frame(viewNorm, V, coordsScaleA.xy);\n"+

		"lowp float faramt = interp(300.0,400.0,distance(cameraPosition , coords));\n"+
		"lowp float nearamt = interp(25.0,35.0,distance(cameraPosition , coords));\n"+
		
			"if(faramt < 1.0){\n"+
			"	 lowp vec3 basemap = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleA,wN,baseNormalMap);\n"+
			"	 lowp vec3 rmap = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleA,wN,rNormalMap);\n"+
			"	 lowp vec3 gmap = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleA,wN,gNormalMap);\n"+
			"	 lowp vec3 bmap = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleA,wN,bNormalMap);\n"+
			"	 med = blendNorm(bmap,blendNorm(gmap,blendNorm(rmap,basemap,mixVal.r),mixVal.g),mixVal.b);\n"+
			"}\n"+
	

	//	"if(modelMatrix[0][0] < 0.2 ){\n"+//it's faster to branch on a uniform value than a computed model. This limits to tiles less than a certain size, which must be a given distance
			"if(nearamt < 1.0 ){\n"+
			"	 lowp vec3 basenear = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleB,wN,baseNormalMap) * coordA/coordB;\n"+
			"	 lowp vec3 rnear = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleB,wN,rNormalMap) * coordA/coordB;\n"+
			"	 lowp vec3 gnear = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleB,wN,gNormalMap) * coordA/coordB;\n"+
			"	 lowp vec3 bnear = triPlanerNorm(TBN0,TBN1,TBN2,coordsScaleB,wN,bNormalMap) * coordA/coordB;\n"+
			"    near = blendNorm(bnear,blendNorm(gnear,blendNorm(rnear,basenear,mixVal.r),mixVal.g),mixVal.b);\n"+
			"}\n"+
	//	"}\n"+
			
		
			
			
			
			"lowp vec3 dist =  mix(med,viewNorm,faramt);\n"+
			"return  normalize(near*(1.0-nearamt) +dist);\n"+
			
		"}\n";
	}
	//This funciton allows you to compute the diffuse surface color however you like. 
	//must implement vec4 getTexture(vec3 coords, vec3 norm) or return null which will give you the default white
	this.getDiffuseFragmentShader = function(mesh,matrix)
	{
		
		return (
		
		"uniform sampler2D diffuseSampler;\n"+
		"uniform sampler2D baseSampler;\n"+
		"uniform sampler2D rSampler;\n"+
		"uniform sampler2D gSampler;\n"+
		"uniform sampler2D bSampler;\n"+
		"uniform sampler2D mixMap;\n"+
		"uniform mat4 modelMatrix;\n"+
		"vec4 mixVal=vec4(0.0,0.0,0.0,0.0);\n"+
		"vec3 blend_weights = vec3(0.0,0.0,0.0);\n"+

		"vec4 triPlanerMap(in vec3 coords, in vec3 norm, in sampler2D sampler)" +
		"{"+
			"lowp vec4 dirt0 = texture2D(sampler,((coords.yz )));\n"+
			"lowp vec4 dirt1 = texture2D(sampler,((coords.zx )));\n"+
			"lowp vec4 dirt2 = texture2D(sampler,((coords.xy )));\n"+
			"lowp vec3 blend_weights = abs( norm.xyz );   // Tighten up the blending zone:  \n"+
			
			"return blend_weights.x * dirt0 + blend_weights.y * dirt1 + blend_weights.z * dirt2;\n"+
		"}"+
		"vec4 blend(in vec4 texture1, in vec4 texture2, in float a1)\n"+
		"{\n"+
		" lowp float a2 = 1.0-a1;\n"+
		"    lowp float depth = 0.2;\n"+
		"    lowp float ma = max(length(texture1) + a1,length( texture2) + a2) - depth;\n"+

		"    lowp float b1 = max(length(texture1) + a1 - ma, 0.0);\n"+
		"    lowp float b2 = max(length(texture2) + a2 - ma, 0.0);\n"+
		//"return mix(texture1,texture2,a1);\n"+
		"    return  vec4((texture1.rgb * b1 + texture2.rgb * b2) / (b1 + b2),max(texture1.a,texture2.a));\n"+
		"}\n"+
		"float interp(in float min, in float max, in float val)"+
		"{"+
			"return clamp((val - min)/(max-min),0.0,1.0);"+
		"}"+
		"vec4 getGrassDensity(in vec3 coords, in vec3 norm, in vec2 uv)" +
		"{"+
			(this.type == 'bt'?
			"mixVal = texture2D(mixMap,((coords.yx * vec2(1.0,1.0) + vec2("+((this.worldWidth)/2).toFixed(5)+","+((this.worldLength)/2).toFixed(5)+"))/vec2("+((this.worldWidth)).toFixed(5)+","+((this.worldLength)).toFixed(5)+")));\n"
			:
			"mixVal = texture2D(mixMap,((coords.yx * vec2(1.0,-1.0) + vec2("+((this.worldWidth)/2).toFixed(5)+","+((this.worldLength)/2).toFixed(5)+"))/vec2("+((this.worldWidth)).toFixed(5)+","+((this.worldLength)).toFixed(5)+")));\n"
			)+

			
			
			"return vec4(mixVal);"+
		"}"+
		"vec4 getTexture(in vec3 coords, in vec3 norm, in vec2 uv)" +
		"{"+

			(this.type == 'bt'?
			"mixVal = texture2D(mixMap,((coords.yx * vec2(1.0,1.0) + vec2("+((this.worldWidth)/2).toFixed(5)+","+((this.worldLength)/2).toFixed(5)+"))/vec2("+((this.worldWidth)).toFixed(5)+","+((this.worldLength)).toFixed(5)+")));\n"
			:
			"mixVal = texture2D(mixMap,((coords.yx * vec2(1.0,-1.0) + vec2("+((this.worldWidth)/2).toFixed(5)+","+((this.worldLength)/2).toFixed(5)+"))/vec2("+((this.worldWidth)).toFixed(5)+","+((this.worldLength)).toFixed(5)+")));\n"
			)+

			
			"mixVal /= (mixVal.x + mixVal.y+mixVal.z);\n"+
			"blend_weights = abs( wN.xyz );   // Tighten up the blending zone:  \n"+
			"blend_weights = (blend_weights -  0.2679);  \n"+
			"blend_weights = max(blend_weights, 0.0);      // Force weights to sum to 1.0 (very important!)  \n"+
			"blend_weights /= (blend_weights.x + blend_weights.y + blend_weights.z ); \n"+

			(this.type == 'bt'?
			"lowp vec4 diffuse = texture2D(diffuseSampler,((coords.yx * vec2(1.0,1.0) + vec2("+((this.worldWidth)/2).toFixed(5)+","+((this.worldLength)/2).toFixed(5)+"))/vec2("+((this.worldWidth)).toFixed(5)+","+((this.worldLength)).toFixed(5)+")));\n"
			:
			"lowp vec4 diffuse = texture2D(diffuseSampler,((coords.yx * vec2(1.0,-1.0) + vec2("+((this.worldWidth)/2).toFixed(5)+","+((this.worldLength)/2).toFixed(5)+"))/vec2("+((this.worldWidth)).toFixed(5)+","+((this.worldLength)).toFixed(5)+")));\n"
			)+
			
			"lowp vec4 med = diffuse;\n"+
			

			"lowp float faramt = interp(300.0,400.0,distance(cameraPosition , coords));\n"+
			"lowp float nearamt = interp(25.0,35.0,distance(cameraPosition , coords));\n"+

			
		//	"if(modelMatrix[0][0] < 3.0 ){\n"+//it's faster to branch on a uniform value than a computed model. This limits to tiles less than a certain size, which must be a given distance
			"if(faramt < 1.0 ){\n"+
				"lowp vec4 basemap = triPlanerMap(coordsScaleA,wN,baseSampler);\n"+
				"lowp vec4 rmap = triPlanerMap(coordsScaleA,wN,rSampler);\n"+
				"lowp vec4 gmap = triPlanerMap(coordsScaleA,wN,gSampler);\n"+
				"lowp vec4 bmap = triPlanerMap(coordsScaleA,wN,bSampler);\n"+
				"med = blend(bmap,blend(gmap,blend(rmap,basemap,mixVal.r),mixVal.g),mixVal.b);\n"+
			"}\n"+
		//	"}\n"+
			"lowp vec4 near = med;\n"+
			
		//	"if(modelMatrix[0][0] < 0.2 ){\n"+//it's faster to branch on a uniform value than a computed model. This limits to tiles less than a certain size, which must be a given distance
			"if(nearamt < 1.0){\n"+
			
				"lowp vec4 basenear = triPlanerMap(coordsScaleB,wN,baseSampler);\n"+
				"lowp vec4 rnear = triPlanerMap(coordsScaleB,wN,rSampler);\n"+
				"lowp vec4 gnear = triPlanerMap(coordsScaleB,wN,gSampler);\n"+
				"lowp vec4 bnear = triPlanerMap(coordsScaleB,wN,bSampler);\n"+
				"near = blend(bnear,blend(gnear,blend(rnear,basenear,mixVal.r),mixVal.g),mixVal.b);\n"+
		//	"}\n"+
			"}\n"+
			
			
			
			
			//"vec4 near = blend(dirt,vec4(0.0,0.0,0.0,0.0),mixVal.r);\n"+
			

			"lowp vec4 medAndFar = mix(med,diffuse,faramt);\n"+
			"return mix(near,medAndFar,nearamt);\n"+
		"}")
	}
	
	//This is the displacement function, which is called in paralell by the thread pool
	this.displace= function(vert,matrix,res)
	{
		var z = 0;

		if(this.addNoise)
		{
			z = this.SimplexNoise.noise2D((vert.x)/100,(vert.y)/100) * 4.5;
			z += this.SimplexNoise.noise2D((vert.x)/300,(vert.y)/300) * 4.5;
			z += this.SimplexNoise.noise2D((vert.x)/10,(vert.y)/10) * 0.5;
		}
		//this is gamma correction
		var h = this.type == 'img' && this.gamma?2.2:1.0;
		if(this.cubic)
			return this.sampleBiCubic((vert.x+ (this.worldLength/2)) / this.worldLength ,(vert.y + (this.worldWidth/2)) / this.worldWidth,matrix,res  ) * h * this.heightScale  + z|| 0;
		else
			return this.sampleBiLinear((vert.x+ (this.worldLength/2)) / this.worldLength ,(vert.y + (this.worldWidth/2)) / this.worldWidth,matrix,res  ) * h * this.heightScale + z|| 0;
	}
	this.at = function(x,y)
	{
		x = Math.floor(x);
		y = Math.floor(y);
		if(!this.data) return 0;
		if( x >= this.dataHeight || x < 0) return 0;
		if( y >= this.dataWidth || y < 0) return 0;
		var i = y * this.dataWidth  + x;
		return this.data[i]  - this.min;
	}
	this.sampleBiLinear = function(u,v)
	{
		//u = u - Math.floor(u);
		//v = v - Math.floor(v);
		u = u * this.dataWidth - .5;
		v = v * this.dataHeight - .5;
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
	this.mipAt = function(x,xo,y,yo,mip)
	{
		return this.at(x*mip + xo * mip,y*mip+yo*mip);
	}
	this.sampleBiCubic = function(u,v,matrix,tileres)
	{

		var res = 1;
		if((this.worldWidth/this.dataWidth) < 2)
		    res = Math.min(1,(this.worldWidth/this.dataWidth)/50);
		var mip = 1/res;
		var dh = this.dataHeight * res;
		var dw = this.dataWidth * res;


		var y = Math.floor(u * dh);
		var x = Math.floor(v * dw);
		
		u = (u * dh) - Math.floor(u * dh);
		v = (v * dw) - Math.floor(v * dw);
		var p = [];
		var t = x;
		x = y;
		y = t;
		t = u;
		u = v;
		v = t;


	//	p[0] = [this.at(x-1 ,y-1 ),this.at(x-0,y-1 ),this.at(x+1 ,y-1 ),this.at(x+2 ,y-1 )];
	//	p[1] = [this.at(x-1 ,y-0 ),this.at(x-0,y-0 ),this.at(x+1 ,y-0 ),this.at(x+2 ,y-0 )];
	//	p[2] = [this.at(x-1 ,y+1 ),this.at(x-0,y+1 ),this.at(x+1 ,y+1 ),this.at(x+2 ,y+1 )];
	//	p[3] = [this.at(x-1 ,y+2 ),this.at(x-0,y+2 ),this.at(x+1 ,y+2 ),this.at(x+2 ,y+2 )];


		p[0] = [this.mipAt(x,-1 ,y,-1,mip ),this.mipAt(x,0,y,-1,mip ),this.mipAt(x,1 ,y,-1,mip ),this.mipAt(x,2 ,y,-1,mip )];
		p[1] = [this.mipAt(x,-1 ,y,-0,mip ),this.mipAt(x,0,y,0,mip ),this.mipAt(x,1 ,y,0,mip ),this.mipAt(x,2 ,y,0,mip )];
		p[2] = [this.mipAt(x,-1 ,y,1,mip ),this.mipAt(x,0,y,1,mip ),this.mipAt(x,1 ,y,1,mip ),this.mipAt(x,2 ,y,1,mip )];
		p[3] = [this.mipAt(x,-1 ,y,2,mip ),this.mipAt(x,0,y,2,mip ),this.mipAt(x,1 ,y,2,mip ),this.mipAt(x,2 ,y,2,mip )];
		return this.bicubicInterpolate(p,u,v);
	}
}