(function(){
		function terrain(childID, childSource, childName)
		{
			
			var self = this;
			var minTileSize = 128;
			var maxTileSize = 2048;
			var worldExtents = 128000;
			var tileres = 32;
			var SW = 0;
			var SE = 1;
			var NW = 3;
			var NE = 2;
	
			
			
	
    
	
    function loadScript	(url)
    {
	
	var xhr = $.ajax(url,{async:false});
	return eval(xhr.responseText);
    
    }
       
			function TileCache()
			{
				this.tiles = {};
				
				
						//default material expects all computation done cpu side, just renders
						// note that since the color, size, spin and orientation are just linear
						// interpolations, they can be done in the shader
						var vertShader_default = 
						
						
						

						"vec3 mod289(vec3 x) {	  return x - floor(x * (1.0 / 289.0)) * 289.0;	}		vec2 mod289(vec2 x) {	  return x - floor(x * (1.0 / 289.0)) * 289.0;	}		vec3 permute(vec3 x) {	  return mod289(((x*34.0)+1.0)*x);	}		float snoise(vec2 v)	  {	  const vec4 C = vec4(0.211324865405187, 	                      0.366025403784439,  	                     -0.577350269189626,  	                      0.024390243902439); 		  vec2 i  = floor(v + dot(v, C.yy) );	  vec2 x0 = v -   i + dot(i, C.xx);			  vec2 i1;		  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);		  vec4 x12 = x0.xyxy + C.xxzz;	  x12.xy -= i1;			  i = mod289(i); 	  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))			+ i.x + vec3(0.0, i1.x, 1.0 ));		  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);	  m = m*m ;	  m = m*m ;				  vec3 x = 2.0 * fract(p * C.www) - 1.0;	  vec3 h = abs(x) - 0.5;	  vec3 ox = floor(x + 0.5);	  vec3 a0 = x - ox;			  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );			  vec3 g;	  g.x  = a0.x  * x0.x  + h.x  * x0.y;	  g.yz = a0.yz * x12.xz + h.yz * x12.yw;	  return 130.0 * dot(m, g);	}"+
						
						"float getNoise(vec2 tpos)"+
						"{"+
						"float res = 0.0;"+
						"res += snoise(vec2(tpos.y / 10000.0,tpos.x/10000.0)) * 1000.0;\n" +
						"res += snoise(vec2(tpos.y / 1000.0,tpos.x/1000.0)) * 100.0;\n" +
						"res += snoise(vec2(tpos.y / 100.0,tpos.x/100.0)) * 10.0;\n" +
						"res += snoise(vec2(tpos.y / 10.0,tpos.x/10.0)) * 1.0;\n" +
						"return res;"+
						"}"+
						"varying vec3 pos;"+
						"varying vec3 npos;"+
						"varying vec3 n;"+
						"varying vec3 wN;"+
						"uniform float blendPercent;\n" + 



					
						"attribute vec3 everyOtherNormal;\n"+
						"attribute float everyOtherZ;\n"+
						"void main() {\n"+
						" pos = (modelMatrix * vec4(position,1.0)).xyz; \n"+
						"npos = pos;\n"+
						"npos.z += getNoise(pos.xy*200.0)/50.0; \n"+
						"wN = mix(everyOtherNormal,normal,blendPercent);\n"+
						"n = normalMatrix *  wN\n;"+
						"n = normalize(n);\n"+
						" float z = mix(everyOtherZ,position.z,blendPercent);\n"+
						"   vec4 mvPosition = modelViewMatrix * vec4( position.x,position.y,z, 1.0 );\n"+
					
						
						"   gl_Position = projectionMatrix * mvPosition;\n"+
						"}    \n";
						var fragShader_default = 
					   
						"uniform sampler2D grassSampler;\n"+
						"uniform sampler2D cliffSampler;\n"+
						"uniform sampler2D dirtSampler;\n"+
						"uniform sampler2D snowSampler;\n"+
						"#if MAX_DIR_LIGHTS > 0\n"+

						
						//"#define USE_FOG" : "",
						//"#define FOG_EXP2" : "",
					
						"uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];\n"+
						"uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];\n"+
						
						
		"uniform vec3 fogColor;"+				
"vec3 horizonColor;\n"+
"vec3 zenithColor;\n"+
"vec3 sunColor;\n"+
"vec3 atmosphereColor(vec3 rayDirection){\n"+
"    float a = max(0.0, dot(rayDirection, vec3(0.0, 1.0, 0.0)));\n"+
"    vec3 skyColor = mix(horizonColor, zenithColor, a);\n"+
"    float sunTheta = max( dot(rayDirection, directionalLightDirection[0].xzy), 0.0 );\n"+
"    return skyColor+directionalLightColor[0]*4.0*pow(sunTheta, 16.0)*0.5;\n"+
"}\n"+

"vec3 applyFog(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection){\n"+
"    float fogDensity = 0.00036;\n"+
"    float vFalloff = 20.0;\n"+ 
"    float fog = exp((-rayOrigin.y*vFalloff)*fogDensity) * (1.0-exp(-dist*rayDirection.y*vFalloff*fogDensity))/(rayDirection.y*vFalloff);\n"+
"    return mix(albedo, fogColor, clamp(fog, 0.0, 1.0));\n"+
"}\n"+

"vec3 aerialPerspective(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection){\n"+
"    float atmosphereDensity = 0.00025;\n"+
"    vec3 atmosphere = atmosphereColor(rayDirection)+vec3(0.0, 0.02, 0.04); \n"+
"    vec3 color = mix(albedo, atmosphere, clamp(1.0-exp(-dist*atmosphereDensity), 0.0, 1.0));\n"+
"    return applyFog(color, dist, rayOrigin, rayDirection);\n"+
"}						\n"+
						
						
						
						"#endif\n"+
						"uniform int fogType;"+
						
						"uniform float fogDensity;"+
						"uniform float fogNear;"+
						"uniform float fogFar;"+
						"varying vec3 pos;"+
						"varying vec3 n;"+
						"varying vec3 wN;"+
						"varying vec3 npos;"+
						"vec4 getTexture(vec3 coords, vec3 norm)" +
						"{"+
							//"coords /= 100.0;\n"+
							"vec2 c0 = (coords.xy/10.0)/2.0 ;\n"+
							"vec2 c1 = (coords.xy/10.0)/2.0 ;\n"+
							"vec2 c2 = (coords.xy/10.0)/2.0 ;\n"+
							"vec2 c3 = (coords.xy/30.0)/2.0 ;\n"+
							"vec2 c0a = (coords.xy/20.0)/2.0 ;\n"+
							"vec2 c1a = (coords.xy/100.0)/2.0 ;\n"+
							"vec2 c2a = (coords.xy/100.0)/2.0 ;\n"+
							"vec2 c3a = (coords.xy/300.0)/2.0 ;\n"+
							"vec4 grass =.5*texture2D(grassSampler,c0) +  .5*texture2D(grassSampler,c0a);\n"+
							"vec4 cliff =.5*texture2D(cliffSampler,c1) +  .5*texture2D(cliffSampler,c1a);\n"+
							"vec4 dirt = .5*texture2D(dirtSampler,c2) +  .5*texture2D(dirtSampler,c2a);\n"+
							"vec4 snow = .5*texture2D(snowSampler,c3) +  .5*texture2D(snowSampler,c3a);\n"+
							"float side = pow(abs(dot(norm,(viewMatrix * vec4(0.0,0.0,1.0,0.0)).xyz)),4.0 * min(3.0,abs(npos.z/55.0)));\n"+
							"float bottom = 1.0-smoothstep(-20.0,60.0,npos.z);\n"+
							"float top = clamp(0.0,1.0,(smoothstep(100.0,140.0,npos.z)));\n"+
							"float middle = 1.0 - bottom - top;\n"+
							
							
							"vec4 mix =  normalize(vec4(side*3.0,bottom,middle,top)) ;\n"+
							"return mix.r * grass + mix.g * grass + mix.b * cliff + mix.a * snow;\n"+
						"}"+
						"void main() {\n"+
						"	vec3 light = vec3(0.0,0.0,0.0);\n"+
						"	vec4 ambient = vec4(0.5,0.5,0.5,1.0);\n"+
						"	#if MAX_DIR_LIGHTS > 0\n"+
						"	light += directionalLightColor[0] * clamp(0.0,1.0,dot(n, (viewMatrix * vec4(directionalLightDirection[0],0.0)).xyz));\n"+
						"	#endif\n"+
						"	vec4 diffuse = getTexture(npos,n);\n"+
						"	diffuse.a = 1.0;\n"+
						"   gl_FragColor = ambient * diffuse + diffuse * vec4(light.xyz,1.0);\n"+
						"#ifdef USE_FOG\n"+

							"float depth = gl_FragCoord.z / gl_FragCoord.w;\n"+

							"#ifdef FOG_EXP2\n"+

								"const float LOG2 = 1.442695;"+
								"float fogFactor = exp2( - fogDensity * fogDensity * depth * depth * LOG2 );"+
								"fogFactor = 1.0 - clamp( fogFactor, 0.0, 1.0 );\n"+
								"fogFactor *= 1.0-smoothstep(0.0,1000.0,pos.z);\n"+
							"#else\n"+

								"float fogFactor = smoothstep( fogNear, fogFar, depth );\n"+

							"#endif\n"+

							//"gl_FragColor = mix( gl_FragColor, vec4( fogColor, gl_FragColor.w ), fogFactor );\n"+
							"horizonColor = fogColor;\n"+
							"zenithColor = vec3(0.78, 0.82, 0.999);\n"+
							"gl_FragColor.xyz = aerialPerspective(gl_FragColor.xyz, distance(pos,cameraPosition),cameraPosition.xzy, normalize(pos-cameraPosition).xzy);\n"+
						"#endif\n"+
						"}\n";
						
						//the default shader - the one used by the analytic solver, just has some simple stuff
						//note that this could be changed to do just life and lifespan, and calculate the 
						//size and color from to uniforms. Im not going to bother
						
						
						//uniforms_default.texture.value.wrapS = uniforms_default.texture.value.wrapT = THREE.RepeatWrapping;
				 
				this.getMat = function()
				{	
				
							var uniforms_default = {
						   
						
							ambientLightColor:   { type: "fv", value: [] },

							directionalLightColor:   { type: "fv", value: [] },
							directionalLightDirection:   { type: "fv", value: [] },

							pointLightColor:   { type: "fv", value: [] },
							pointLightPosition:   { type: "fv", value: [] },
							pointLightDistance:   { type: "fv1", value: [] },

							spotLightColor:   { type: "fv", value: [] },
							spotLightPosition:   { type: "fv", value: [] },
							spotLightDistance:   { type: "fv", value: [] },
							spotLightDirection:   { type: "fv1", value: [] },
							spotLightAngleCos:   { type: "fv1", value: [] },
							spotLightExponent:   { type: "fv1", value: [] },

							hemisphereLightSkyColor:   { type: "fv", value: [] },
							hemisphereLightGroundColor:   { type: "fv", value: [] },
							hemisphereLightDirection:   { type: "fv", value: [] },
							grassSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/grass.jpg" ) },
							cliffSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/cliff.jpg" ) },
							dirtSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/dirt.jpg" ) },
							snowSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/snow.jpg" ) },
							"fogDensity" : { type: "f", value: 0.00025 },
							"fogNear" : { type: "f", value: 1 },
							"fogFar" : { type: "f", value: 2000 },
							"fogColor" : { type: "c", value: new THREE.Color( 0xffffff ) },
							"blendPercent" : { type: "f", value: 0.00000 },
						
						};	  
						var attributes_default = {
							everyOtherNormal: { type: 'v3', value: [] },
							everyOtherZ: { type: 'f', value: [] },
						};
						var mat = new THREE.ShaderMaterial( {
							uniforms:       uniforms_default,
							attributes:     attributes_default,
							vertexShader:   vertShader_default,
							fragmentShader: fragShader_default

						});
						mat.lights = true;
						mat.fog = true;
						
						uniforms_default.grassSampler.value.wrapS = uniforms_default.grassSampler.value.wrapT = THREE.RepeatWrapping;
						uniforms_default.cliffSampler.value.wrapS = uniforms_default.cliffSampler.value.wrapT = THREE.RepeatWrapping;
						uniforms_default.dirtSampler.value.wrapS = uniforms_default.dirtSampler.value.wrapT = THREE.RepeatWrapping;
						uniforms_default.snowSampler.value.wrapS = uniforms_default.snowSampler.value.wrapT = THREE.RepeatWrapping;
						//mat.wireframe = true;
						return mat;
						
					// this.mat = new THREE.MeshPhongMaterial();
					// this.mat.color.r = .5;
					// this.mat.color.g = .5;
					// this.mat.color.b = .5;
					// this.mat.depthCheck = false;
					// this.mat.wireframe = false;
					// this.mat.transparent = true;	
				}
				
				this.buildMesh3 = function(size,res)
				{
					
					var geo = new THREE.Geometry();
					var step = size/(res);
					var count = 0;
					for(var i=0; i <= size+step+step; i += step)
					{
						
						for(var j=0; j <= size+step+step; j +=step)
						{
							var z = 0;
							var x = i-size/2;
							var y = j-size/2;
							var v = new THREE.Vector3(x,y,z);
							geo.vertices.push(v);
						}
						count++;
					}
					for(var i=0; i < count-2; i++)
					{
						for(var j=0; j < count-3; j++)
						{
							
							var x = i;
							var y = j;
							if(i==0)
							{
							     if((j/2) - Math.floor(j/2) == 0)
							     {
								if(j>0)
								{
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
									}
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y+1,(x)*count+y+2);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								
								var f = new THREE.Face3((x+1)*(count) + y+2,(x)*count+y+2,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								

														
							     }
							}
							else if(i == count-4)
							{
							     if((j/2) - Math.floor(j/2) == 0)
							     {
								if(j>0)
								{
								var f = new THREE.Face3((x+1)*(count) + y,(x)*count+y+1,(x)*count+y);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
									}
								var f = new THREE.Face3((x+1)*(count) + y,(x+1)*count+y+2,(x)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								
								var f = new THREE.Face3((x)*(count) + y+2,(x)*count+y+1,(x+1)*count+y+2);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								

														
							     }
							}
							else if(j==0)
							{
							     if((i/2) - Math.floor(i/2) == 0)
							     {
								
								var f = new THREE.Face3((x-2)*(count) + y,(x+0)*count+y,(x-1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								if( i < count-3)
								{								
								var f = new THREE.Face3((x-1)*(count) + y+1,(x+0)*count+y,(x+0)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								}

								if( i < count-3)
								{
								var f = new THREE.Face3((x+0)*count+y+0,(x+1)*count+y+1,(x+0)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								}
								
							     }
							}
							
							else if( i < count-3)
							{

								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y+1,(x)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								//f.vertexNormals.push(new THREE.Vector3(0,0,1));
							
							}

						}
					}
					geo.computeCentroids();
					return geo;
				}
				
				this.buildMesh2 = function(size,res)
				{
					
					var geo = new THREE.Geometry();
					var step = size/(res);
					var count = 0;
					for(var i=0; i <= size+step+step; i += step)
					{
						
						for(var j=0; j <= size+step+step; j +=step)
						{
							var z = 0;
							var x = i-size/2;
							var y = j-size/2;
							var v = new THREE.Vector3(x,y,z);
							geo.vertices.push(v);
						}
						count++;
					}
					for(var i=0; i < count-2; i++)
					{
						for(var j=0; j < count-3; j++)
						{
							
							var x = i;
							var y = j;
							if(i==0)
							{
							     if((j/2) - Math.floor(j/2) == 0)
							     {
								if(j>0)
								{
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
									}
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y+1,(x)*count+y+2);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								
								var f = new THREE.Face3((x+1)*(count) + y+2,(x)*count+y+2,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								

														
							     }
							}
							else if(j==0)
							{
							     if((i/2) - Math.floor(i/2) == 0)
							     {
								var f = new THREE.Face3((x-2)*(count) + y,(x+0)*count+y,(x-1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								var f = new THREE.Face3((x-1)*(count) + y+1,(x+0)*count+y,(x+0)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								if( i < count-3)
								{
								var f = new THREE.Face3((x+0)*count+y+0,(x+1)*count+y+1,(x+0)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								}
								
							     }
							}
							
							else if( i < count-3)
							{

								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y+1,(x)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								//f.vertexNormals.push(new THREE.Vector3(0,0,1));
							
							}

						}
					}
					geo.computeCentroids();
					return geo;
				}
				
				this.buildMesh1 = function(size,res)
				{
					
					var geo = new THREE.Geometry();
					var step = size/(res);
					var count = 0;
					for(var i=0; i <= size+step+step; i += step)
					{
						
						for(var j=0; j <= size+step+step; j +=step)
						{
							var z = 0;
							var x = i-size/2;
							var y = j-size/2;
							var v = new THREE.Vector3(x,y,z);
							geo.vertices.push(v);
						}
						count++;
					}
					for(var i=0; i < count-3; i++)
					{
						for(var j=0; j < count-3; j++)
						{
							
							var x = i;
							var y = j;
							if(i==0 && j < count-3)
							{
							     if((j/2) - Math.floor(j/2) == 0)
							     {
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);

								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y+1,(x)*count+y+2);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								var f = new THREE.Face3((x+1)*(count) + y+2,(x)*count+y+2,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);

														
							     }
							}
							else
							{

								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y+1,(x)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								//f.vertexNormals.push(new THREE.Vector3(0,0,1));
							
							}

						}
					}
					geo.computeCentroids();
					return geo;
				}
				this.buildMesh0 = function(size,res)
				{
					
					var geo = new THREE.Geometry();
					var step = size/(res);
					var count = 0;
					for(var i=0; i <= size+step+step; i += step)
					{
						
						for(var j=0; j <= size+step+step; j +=step)
						{
							var z = 0;
							var x = i-size/2;
							var y = j-size/2;
							var v = new THREE.Vector3(x,y,z);
							geo.vertices.push(v);
						}
						count++;
					}
					
					for(var i=0; i < count-3; i++)
					{
						for(var j=0; j < count-3; j++)
						{
							
							var x = i;
							var y = j;
							
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y,(x+1)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								
								var f = new THREE.Face3(x*(count) + y,(x+1)*count+y+1,(x)*count+y+1);//,x*count+y+1)
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								f.vertexNormals.push(new THREE.Vector3(1,0,0));
								f.vertexNormals.push(new THREE.Vector3(0,0,1));
								
								f.normal = new THREE.Vector3(0,0,1);
								geo.faces.push(f);
								//f.vertexNormals.push(new THREE.Vector3(0,0,1));
							
							

						}
					}
					geo.computeCentroids();
					return geo;
				}					
				this.getMesh = function(res,side)
				{
					if(this.tiles[res])
						for(var i = 0; i < this.tiles[res].length; i++)
							if(this.tiles[res][i].quadnode == null && this.tiles[res][i].side == side)
							{
								console.log('reusing tile');
								return this.tiles[res][i];
							}
					if(!this.tiles[res])		
						this.tiles[res] = [];
						
					//var newtile = new THREE.Mesh(new THREE.PlaneGeometry(size,size,res,res),this.mat);
					var newtile;
					if(side == 0)
						newtile = new THREE.Mesh(this.buildMesh0(100,res),this.getMat());
					if(side == 1)
						newtile = new THREE.Mesh(this.buildMesh1(100,res),this.getMat());
					if(side == 2)
						newtile = new THREE.Mesh(this.buildMesh2(100,res),this.getMat());
					if(side == 3)
						newtile = new THREE.Mesh(this.buildMesh3(100,res),this.getMat());	
					newtile.geometry.dynamic = true;
					newtile.doublesided = true;
					newtile.side = side;
					newtile.receiveShadow = true;
					newtile.castShadow = false;
					
					for(var i = 0; i < newtile.geometry.vertices.length; i++)
					{
						newtile.material.attributes.everyOtherZ.value.push(0);
						newtile.material.attributes.everyOtherNormal.value.push(new THREE.Vector3(0,0,1));
					}
					newtile.material.attributes.everyOtherZ.needsUpdate = true;
					newtile.material.attributes.everyOtherNormal.needsUpdate = true;
					this.tiles[res].push(newtile);
					return newtile;
				}
			}
			self.TileCache = new TileCache();
			self.debug = new THREE.Mesh(new THREE.SphereGeometry(3));
			self.debug2 = new THREE.Mesh(new THREE.SphereGeometry(3));
			self.debug.material.fog = false;
			self.debug2.material.fog = false;
			function QuadtreeNode(min,max,root,depth,quad)
			{
				
				if(!depth)
					this.depth = 1;
				else
					this.depth = depth;
				this.children = [];
				this.mesh = null;
				this.min = min;
				this.max = max;
				this.quadrent = quad;
				
				this.THREENode = root;
				this.c = [this.min[0] + (this.max[0]-this.min[0])/2,this.min[1] + (this.max[1]-this.min[1])/2]
				
				this.SW = function()
				{
					return this.children[SW];
				}
				this.SE = function()
				{
					return this.children[SE];
				}
				this.NW = function()
				{
					return this.children[NW];
				}
				this.NE = function()
				{
					return this.children[NE];
				}
				this.child = function(quad)
				{
					return this.children[quad];
				}
				this.sibling = function(quad)
				{
					return this.parent.child(quad);
				}
				this.twodeep = function()
				{
					if(!this.isSplit())
						return false;
					
					for(var i = 0; i < 4; i++)
					{
						if(this.children[i].isSplit())
							return true;

					}				
					return false;					
				}
				this.balance = function(removelist)
				{
				
				
					
					var leaves = this.getLeavesB();
					while(leaves.length > 0)
					{
						var l = leaves.shift();
						if(!l) continue;
						var nn = l.NN();
						var sn = l.SN();
						var en = l.EN();
						var wn = l.WN();
						if((nn && nn.twodeep() )||(sn && sn.twodeep())||(en && en.twodeep())||(wn && wn.twodeep()))
						{
							
							l.split(removelist);
							leaves.splice(0,0,l.NW());
							leaves.splice(0,0,l.NE());
							leaves.splice(0,0,l.SW());
							leaves.splice(0,0,l.SE());
							
							
						 }
						
						
						
						
						
					}
				}
				
				this.northNeighbor = function()
				{
					var p = this;
					while(p.quadrent != SW && p.quadrent != SE)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == SW)
					{
						p = p.sibling(NW);
						walk = SE;
					}
					else if(p.quadrent == SE)
					{
						p = p.sibling(NE);
						walk = SW;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[0] > this.c[0])
							p = p.child(SW);
						else if(p.c[0] < this.c[0])
							p = p.child(SE);	
					}
						
					return p;		
						
				}
				this.NN = this.northNeighbor;
				
				this.southNeighbor = function()
				{
					var p = this;
					while(p.quadrent != NW && p.quadrent != NE)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == NW)
					{
						p = p.sibling(SW);
						walk = NE;
					}
					else if(p.quadrent == NE)
					{
						p = p.sibling(SE);
						walk = NW;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[0] > this.c[0])
							p = p.child(NW);
						else if(p.c[0] < this.c[0])
							p = p.child(NE);	
					}
						
					return p;		
						
				}
				this.SN = this.southNeighbor;
				
				this.eastNeighbor = function()
				{
					var p = this;
					while(p.quadrent != NW && p.quadrent != SW)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == NW)
					{
						p = p.sibling(NE);
						walk = SW;
					}
					else if(p.quadrent == SW)
					{
						p = p.sibling(SE);
						walk = NW;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[1] > this.c[1])
							p = p.child(SW);
						else if(p.c[1] < this.c[1])
							p = p.child(NW);	
					}
					return p;		
						
				}
				this.EN = this.eastNeighbor;
				
				this.westNeighbor = function()
				{
					var p = this;
					while(p.quadrent != NE && p.quadrent != SE)
					{
						if(!p.parent) return null;
						p = p.parent;
					}
					var walk = -1;
					if(p.quadrent == NE)
					{
						p = p.sibling(NW);
						walk = NE;
					}
					else if(p.quadrent == SE)
					{
						p = p.sibling(SW);
						walk = SE;
					}
					while(p && p.depth < this.depth && p.isSplit())
					{
						if(p.c[1] > this.c[1])
							p = p.child(SE);
						else if(p.c[1] < this.c[1])
							p = p.child(NE);	
					}
					return p;		
						
				}
				this.WN = this.westNeighbor;
				
				this.northEastNeighbor = function()
				{
					return this.NN().EN();
						
				}
				this.NEN = this.northEastNeighbor;
				
				this.southEastNeighbor = function()
				{
					return this.SN().EN();
						
				}
				this.SEN = this.southEastNeighbor;
				
				this.northWestNeighbor = function()
				{
					return this.NN().WN();
						
				}
				this.NWN = this.northWestNeighbor;
				
				this.southWestNeighbor = function()
				{
					return this.SN().WN();
						
				}
				this.SWN = this.southWestNeighbor;
				
				this.getLeavesB = function(list)
				{
					if(!list)
						list = [];
				
					
					if(!this.isSplit())
						list.push(this);
					else
					{
						for(var i = 0; i < this.children.length; i ++)
						{
							this.children[i].getLeavesB(list);
						}
						this.children[0].getLeavesB(list);
					}
					
					return list;
				}
				this.getLeaves = function(list)
				{
					if(!list)
						list = [];
				
					
					if(!this.isSplit())
						list.push(this);
					else
					{
						for(var i = 0; i < this.children.length; i ++)
						{
							this.children[i].getLeaves(list);
						}
						
					}
					
					return list;
				}
				this.sideNeeded = function()
				{
					var nn = this.NN();
					var sn = this.SN();
					var wn = this.WN();
					var en = this.EN();
					
					var lowresside = 0;
					if(nn && nn.depth < this.depth)
						nn = true;
					else
						nn = false;
						
					if(sn && sn.depth < this.depth)
						sn = true;
					else
						sn = false;
					if(en && en.depth < this.depth)
						en = true;
					else
						en = false;
					if(wn && wn.depth < this.depth)
						wn = true;
					else
						wn = false;
						
					if(!nn && !sn && !wn &&!en)
						return 0;
					if(nn && !sn && !wn &&!en)
						return 1;
					if(!nn && sn && !wn &&!en)
						return 2;
					if(!nn && !sn && wn &&!en)
						return 3;
					if(!nn && !sn && !wn &&en)
						return 4;		
					
					if(nn && !sn && !wn &&en)
						return 5;
					if(!nn && sn && !wn &&en)
						return 6;
					if(nn && !sn && wn &&!en)
						return 7;
					if(!nn && sn && wn &&!en)
						return 8;
						
					return 0;
				}
				this.meshNeeded = function(i)
				{
					if(i == 0) return 0;
					if(i<=4) return 1;
					if(i<=8) return 2;
				
				}
				this.getRotation = function(i)
				{
					
					if(i ==0) return 0;
					if(i== 1) return -Math.PI/2;
					if(i== 2) return Math.PI/2;
					if(i== 4) return Math.PI;
					if(i== 7) return -Math.PI/2;
					if(i== 5) return -Math.PI;
					if(i== 6) return Math.PI/2;
					return 0;
				}
				this.updateMesh = function(cb)
				{
					var rebuilt = false;
					if(!this.isSplit())
					{
						var neededSide = this.sideNeeded();
						if(!this.mesh || neededSide != this.side)
						{
							var badsidemesh = null;
							if(this.mesh && neededSide != this.side)
							{
								badsidemesh = this.mesh;
								this.mesh = null;
							}
							
							if(this.max[0] - this.min[0] < maxTileSize)
							{
								var res = tileres;
								
								var scale = this.max[0] - this.min[0];
								
								this.side = neededSide;
								this.mesh = self.TileCache.getMesh(res,this.meshNeeded(this.side));
								this.mesh.scale.x = scale/100;
								this.mesh.scale.y = scale/100;
								this.mesh.scale.z = 1;//scale/100;
								this.mesh.rotation.z = this.getRotation(this.side);
								
								this.mesh.quadnode = this;
								if(self.removelist.indexOf(this.mesh)>-1)
								self.removelist.splice(self.removelist.indexOf(this.mesh),1);
								
								this.mesh.position.x = this.c[0];
								this.mesh.position.y = this.c[1];
								this.mesh.position.z = 1;
								
								rebuilt = true;	
								this.mesh.updateMatrixWorld(true);
								this.THREENode.add(this.mesh,true);	
								this.mesh.visible = false;
								self.BuildTerrainInner(this.mesh,(this.max[0] - this.min[0])/tileres,function()
								{
									this.mesh.visible = true;
									if(badsidemesh)
									{
										badsidemesh.parent.remove(badsidemesh);
										badsidemesh.quadnode = null;
									}
									cb(rebuilt);
								}.bind(this));
								return;
							}
						}
					}else
					{
						
						if(this.mesh  )
						{
							this.mesh.quadnode = null;
							if(this.mesh.parent)
							this.mesh.parent.remove(this.mesh);
							this.mesh.quadnode = null;
							this.mesh = null;
						}
					}
					if(cb)
						cb(rebuilt);
				//	if(this.isSplit())
				//	for(var i=0; i < this.children.length; i++)
				//		this.children[i].updateMesh();
				}
				this.cleanup = function(removelist)
				{
					this.walk(function(n)
					{
						if(n.setForDesplit)
						{
							
							for(var i=0; i < n.children.length; i++)
							n.children[i].destroy(removelist);
							n.children = [];
							delete n.setForDesplit;
						}
					});
				}
				this.isSplit = function() {if(this.setForDesplit) return false; return this.children.length > 0;}
				this.split = function(removelist)
				{
					if(this.setForDesplit)
					{
						delete this.setForDesplit;
						
					}
					if(this.isSplit())
						return;
					if(this.mesh)
					{
						//this.mesh.parent.remove(this.mesh);
						//removelist.push(this.mesh);
						this.backupmesh = this.mesh;
						this.mesh = null;
						
					}
					
					var sw = new QuadtreeNode([this.min[0],this.min[1]],[this.c[0],this.c[1]],this.THREENode,this.depth+1,SW);
					var se = new QuadtreeNode([this.c[0],this.min[1]],[this.max[0],this.c[1]],this.THREENode,this.depth+1,SE);
					var nw = new QuadtreeNode([this.min[0],this.c[1]],[this.c[0],this.max[1]],this.THREENode,this.depth+1,NW);
					var ne = new QuadtreeNode([this.c[0],this.c[1]],[this.max[0],this.max[1]],this.THREENode,this.depth+1,NE);
					
					sw.parent = this;
					se.parent = this;
					nw.parent = this;
					ne.parent = this;
					
					this.children[SW] = sw;
					this.children[SE] = se;
					this.children[NW] = nw;
					this.children[NE] = ne;
					
					
				}
				this.deSplit = function(removelist)
				{
					//this.walk(function(n)
					//{
						
					
					//});
					for(var i=0; i < this.children.length; i++)
						this.children[i].deSplit(removelist);
					this.setForDesplit = true;
				}
				this.destroy = function(removelist)
				{
					if(this.mesh)
					{
						//this.mesh.parent.remove(this.mesh);
						removelist.push(this.mesh);
						if(this.backupmesh)
						removelist.push(this.backupmesh);
						this.oldmesh = this.mesh;
						this.mesh = null;
					}
					for(var i=0; i < this.children.length; i++)
						this.children[i].destroy(removelist);
				}
				this.contains = function(point)
				{
					
					var tempmin = this.min;
					var tempmax = this.max;
					if(tempmin[0] < point[0] && tempmax[0] > point[0] && 
					tempmin[1] < point[1] && tempmax[1] > point[1])
						return true;
					return false;
				}
				this.loosecontains = function(point)
				{
					
					var tempmin = [this.min[0] - (this.max[0] - this.min[0])/2 , this.min[1] - (this.max[1] - this.min[1])/2]
					var tempmax = [this.max[0] + (this.max[0] - this.min[0])/2 , this.max[1] + (this.max[1] - this.min[1])/2]
					if(tempmin[0] < point[0] && tempmax[0] > point[0] && 
					tempmin[1] < point[1] && tempmax[1] > point[1])
						return true;
					return false;
				}
				this.containing = function(point)
				{
					if(this.contains(point) && !this.isSplit())
						return this;
					if(this.isSplit())
					{
						if(this.NW().contains(point))
							return this.NW().containing(point);
						if(this.NE().contains(point))
							return this.NE().containing(point);
						if(this.SW().contains(point))
							return this.SW().containing(point);
						if(this.SE().contains(point))
							return this.SE().containing(point);							
					
					}
					return null;
				}
				this.walk = function(cb)
				{
					cb(this);
					if(this.isSplit())
					for(var i =0 ; i < this.children.length; i++)
					{
						this.children[i].walk(cb);
					
					}
					
				}
				this.getBottom = function(list)
				{
					if(!list)
						list = [];
					this.walk(function(node)
					{
						if(node.bottom)
							list.push(node);
					
					});
					return list;	
				}
				//walk down the graph, unspliting nodes that to not contain target points, and spliting nodes that do
				this.update = function(campos,removelist)
				{
					var cont = false
					for(var i =0; i < campos.length; i++)
					{
						cont = cont || this.contains(campos[i]);
					}
					if(cont)
					{
						
						if(!this.isSplit())
						{
							if(this.max[0]-this.min[0] > minTileSize)
							{
								this.split(removelist);
								
								for(var i=0; i < this.children.length; i++)
									if(this.children[i].max[0]-this.children[i].min[0] < minTileSize)
										this.children[i].bottom = true;;
				
				
							}else
							{
								
							}
							
						}else
						{
							if(this.max[0]-this.min[0] < minTileSize)
							{
								this.deSplit(removelist);
							}
						}
					}else
					{
						if(this.isSplit())
						{
							this.deSplit(removelist);
							
						}
					
					}
					if(this.isSplit())
					for(var i=0; i < this.children.length; i++)
						this.children[i].update(campos,removelist);
				}
			}
			
			
			
			function ControlPoint(x,y,z,d,f)
			{
			    
				this.x = x || 0;
				this.y = y || 0;
				this.z = z || 0;
				this.falloff = f||1;
				this.dist = d||10;
				this.getPoint = function()
				{
					return new THREE.Vector3(this.x,this.y,this.z);
				}
			}
			
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'controlPoints')
				{
					this.controlPoints = propertyValue;
					this.BuildTerrain();
				}
			}
			this.controlPoints = [];
			this.initializingNode = function()
			{
				
				vwf.setProperty(this.ID,'controlPoints',this.controlPoints);
				Math.sign = function(e){ return e<0?-1:1};
				if(this.controlPoints.length == 0)
				{
				
				
				//this.controlPoints.push(new ControlPoint(0,0,0,1,1));
				
				
				}
				this.terrainGenerator = loadScript("vwf/model/threejs/terrainGenerator.js");
				window._dTerrainGenerator = this.terrainGenerator;
				
				this.terrainGenerator.init();
				this.DisableTransform();
				this.BuildTerrain();
				this.quadtree = new QuadtreeNode([-worldExtents,-worldExtents],[worldExtents,worldExtents],this.getRoot());
			
				this.minSize = 32;
				this.quadtree.update([[1,1]],[]);
				
				
				//this.quadtree.updateMesh();
				window.terrain = self;
				this.counter = 0;
				
				this.getRoot().FrustrumCast = function(frustrum,opts){return {};};
				this.getRoot().CPUPick = function(o,d,opts){
				
				var node = self.quadtree.containing(o);;
				var mesh = node.mesh;
				if(mesh)
					return mesh.CPUPick(o,d,opts);
				
				return [];
				
				}
				self.rebuild();
				_SceneManager.specialCaseObjects.push(this.getRoot());
				
			}
			this.Debug = function(pt)
			{
				this.debug.position.x = pt.c[0];
				this.debug.position.y = pt.c[1];
				this.debug.updateMatrixWorld();
				if(!this.debug.parent)
					this.getRoot().add(this.debug);
			}
			this.cancelUpdates =function()
			{
				self.needRebuild = [];
				self.terrainGenerator.cancel();
				
				this.quadtree.walk(function(n)
				{
					if(n.fadelist)
					{
						n.fadelist.forEach(function(e)
						{
							if(e.parent)
							e.parent.remove(e);
							e.quadnode = null;
							window.cancelAnimationFrame(e.fadeHandle);
						});
						n.fadelist = null;
						if(n.mesh)
						n.mesh.visible = true;
					}
					
				});
				
				this.quadtree.walk(function(n)
				{
					if(n.setForDesplit)
						delete n.setForDesplit;
					if(n.mesh && n.mesh.visible == false)
					{
						if(n.mesh.parent)
						n.mesh.parent.remove(n.mesh);
						n.mesh.quadnode = null;
						n.mesh.visible = true;
						n.mesh = null;
					}
					if(n.backupmesh)
					{
						n.mesh = n.backupmesh;
						n.mesh.quadnode = n;
						delete n.backupmesh;
					}
					delete n.oldmesh;
					delete n.waiting_for_rebuild;
					
				});
				this.quadtree.walk(function(n)
				{
					
					if(n.isSplit() && n.mesh)
					{
						var list = [];
						n.children[0].destroy(list);
						n.children[1].destroy(list);
						n.children[2].destroy(list);
						n.children[3].destroy(list);
						n.children = [];
						list.forEach(function(e)
						{
							e.quadnode = null;
							if(e.parent)
							e.parent.remove(e);
						});
					}
					
					
				});
			}
			this.removelist = [];
			this.containingList = [];
			self.needRebuild = [];
			this.enabled = true;
			this.ticking = function()
			{
				
				this.counter ++;
				if(this.counter >= 10 && this.enabled)
				{
					this.counter = 0;
					var  insertpt = _Editor.GetInsertPoint();
					var campos = _Editor.findcamera().position;
					var x = campos.x;
					var y = campos.y;
					var minRes = Math.pow(2,Math.floor(Math.log(campos.z)/Math.LN2));
					var maxRes = Math.pow(2,Math.floor(Math.log(campos.z)/Math.LN2)+4);
					 if(this.containingList.indexOf(this.quadtree.containing([x,y])) == -1 || this.currentMinRes != minRes)
					 {
						
						this.currentMinRes = minRes;
						
						minTileSize = Math.max(minRes,128);
						//cant resize the max side on the fly -- tiles in update have already made choice
						//maxTileSize = Math.max(maxRes,2048);
						if (self.needRebuild.length > 0)
						{	
							this.cancelUpdates();
						}
						
							
						
						this.quadtree.update([[x,y]],this.removelist);
					
						
					
						
						this.containing = this.quadtree.containing([x,y]).parent;
						
						
					
						while(this.containing.NN().depth != this.containing.depth)
							this.containing.NN().split(this.removelist);
						while(this.containing.SN().depth != this.containing.depth)
							this.containing.SN().split(this.removelist);
						while(this.containing.EN().depth != this.containing.depth)
							this.containing.EN().split(this.removelist);
						while(this.containing.WN().depth != this.containing.depth)
							this.containing.WN().split(this.removelist);
						
						
						while(this.containing.NEN().depth != this.containing.depth)
							this.containing.NEN().split(this.removelist);
						while(this.containing.SEN().depth != this.containing.depth)
							this.containing.SEN().split(this.removelist);
						while(this.containing.SWN().depth != this.containing.depth)
							this.containing.SWN().split(this.removelist);
						while(this.containing.NWN().depth != this.containing.depth)
							this.containing.NWN().split(this.removelist);
						
						
						this.containing.NN().split(this.removelist);
						this.containing.EN().split(this.removelist);
						this.containing.WN().split(this.removelist);
						this.containing.SN().split(this.removelist);						
						
						this.containing.NEN().split(this.removelist);
						this.containing.SEN().split(this.removelist);
						this.containing.NWN().split(this.removelist);
						this.containing.SWN().split(this.removelist);		
						
						var lowergrid = [this.containing,
										this.containing.NN(),
										this.containing.EN(),
										this.containing.SN(),
										this.containing.WN(),
										this.containing.NEN(),
										this.containing.NWN(),
										this.containing.SEN(),
										this.containing.SWN()]
								
						
						for(var i = 0; i < lowergrid.length ; i++)
						{
							for(var j =0; j < lowergrid[i].children.length; j++)
							{
							
								lowergrid[i].children[j].isMip = true;
							}
						
						}
						
						var lowergridinner = [this.containing.NW(),this.containing.NE(),this.containing.SE(),this.containing.SW(),
										this.containing.NN().SE(),this.containing.NN().SW(),
										this.containing.EN().NW(),this.containing.EN().SW(),
										this.containing.SN().NE(),this.containing.SN().NW(),
										this.containing.WN().SE(),this.containing.WN().NE(),
										this.containing.NEN().SW(),
										this.containing.NWN().SE(),
										this.containing.SEN().NW(),
										this.containing.SWN().NE()]
								
						
					
						
						
						this.containingList = lowergridinner;		
						this.quadtree.balance(this.removelist);
						this.quadtree.balance(this.removelist);
						//this.quadtree.cleanup(this.removelist);
						var nodes = this.quadtree.getBottom();
						
						//immediately remove old nodes that are now too big
						this.quadtree.walk(function(n)
						{
							if(n.max[0]-n.min[0] > maxTileSize && n.setForDesplit)
								{
									
									var list = [];
									n.cleanup(list);
									list.forEach(function(e)
									{
										if(e.parent)
										e.parent.remove(e);
										e.quadnode = null;
									});
									n.children = [];
									delete n.setForDesplit;
								}
						});
						var newleaves = this.quadtree.getLeaves();
					
						for(var i = 0; i <  newleaves.length; i++)
						{
						
							if(!newleaves[i].mesh)
							{
								if(newleaves[i].max[0] - newleaves[i].min[0] < maxTileSize)
									self.needRebuild.push(newleaves[i]);
							}
							else if(newleaves[i].sideNeeded() != newleaves[i].side)
							{
								self.needRebuild.push(newleaves[i]);
							}
								
						}
					
						self.needRebuild.sort(function(a,b)
						{
							return (a.max[0] - a.min[0]) - (b.max[0] - b.min[0]);
						
						});
						
						
						//walk the parents of the nodes whose meshs are removing, and 
						//note how may children that nodes has to rebuild
					var	splitting = [];
					  this.quadtree.walk(function(n)
					  {
						if(n.backupmesh && n.isSplit())
						{
							splitting.push(n);
							
							var count = 0;
							n.getLeaves().forEach(function(e)
							{
								if(!e.mesh)
									count++;
							
							});
							n.waiting_for_rebuild = count;
						}
					  
					  });
						
					
						
					//	if(self.buildTimeout)
					//		window.clearTimeout(self.buildTimeout);
					//	if (self.needRebuild.length > 0)
					//	{	
					//		self.buildTimeout = window.setTimeout(self.rebuild,3);
					//		
					//	}
						
					}
					
				}
			}
			self.rebuild = function()
			{
				
				if (self.needRebuild.length > 0 && self.terrainGenerator.countFreeWorkers() > 0)
				{
					
					var tile = self.needRebuild.shift();
					//async rebuild
					
					var rebuilt = tile.updateMesh(function()
					{
						//now that I've drawn my tile, I can remove my children.
						var list = []
						tile.cleanup(list)
						
						
						if(list.length > 0)
						tile.mesh.visible = false;
						var o = tile.mesh;
						list.forEach(function(e)
						{
							tile.fadelist = list;
							if(e.parent)
							{
								e.quadnode.mesh = null;
								e.material.uniforms.blendPercent.value = 1;
								 var fade = function()
								 {
									e.material.uniforms.blendPercent.value -= .01;
									 if(e.material.uniforms.blendPercent.value > 0)
									 {
										e.fadeHandle = window.requestAnimationFrame(fade);
									 }else
									 {
										if(e.parent)
										e.parent.remove(e);
										e.quadnode = null;
										o.visible = true
										tile.fadelist = null;
									 }
								 };
								 e.fadeHandle = window.requestAnimationFrame(fade);
								
							}
						});
						
						var e = tile.mesh;
						e.material.uniforms.blendPercent.value = 1;
						
						 var p = tile.parent;
						 //look up for the node I'm replaceing
						 while(p && !p.waiting_for_rebuild)
							p = p.parent;
						if(p)
						{							
						 if(p.waiting_for_rebuild > 1)
						 {
						 
							p.waiting_for_rebuild--;
							tile.mesh.visible = false;
							window.cancelAnimationFrame(tile.fade);
							
						 }
						 else  if(p.waiting_for_rebuild == 1)
						 {
							
							if(p.backupmesh && p.backupmesh.parent)
							{
							
								var e = p.backupmesh;
							
								e.quadnode = null;
								if(e.parent)
								e.parent.remove(e);
								
									
								
								p.backupmesh = null;
							}
								
							delete p.waiting_for_rebuild;
							p.walk(function(l)
							{
								//this really should be true now!
								if(l.mesh)
								{
									l.mesh.visible = true;
									var o = l.mesh;
									 o.material.uniforms.blendPercent.value = 0;
									 var fade = function()
									 {
										
										o.material.uniforms.blendPercent.value += .01;
										 if(o.material.uniforms.blendPercent.value < 1)
										 {
											window.requestAnimationFrame(fade);
										 }
										
									 };
									 window.requestAnimationFrame(fade);
								}	
							});
						 }
						}
						
						
						//self.rebuild();
						
						//console.log('rebuilding ' + self.needRebuild.length + ' tile');
					});
					
				}
			   self.buildTimeout = window.setTimeout(self.rebuild,3);	
			}.bind(self);
					
			this.callingMethod = function(methodName,args)
			{
				if(methodName == 'setPoint')
				{
					if(args.length == 6)
					{
						var cp = this.controlPoints[args[0]];
						cp.x = args[1];
						cp.y = args[2];
						cp.z = args[3];
						cp.dist = args[4];
						cp.falloff = args[5];
					}
					else if(args.length == 2)
					{
						this.controlPoints[args[0]] = args[1];
					}
					this.BuildTerrain();
					return true;
				}
				if(methodName == 'getPoint')
				{
					return this.controlPoints[args[0]];
				}
				if(methodName == 'getPointCount')
				{
					return this.controlPoints.length;
				}
			}
			this.gettingProperty = function(propertyName)
			{
				
				if(propertyName == 'controlPoints')
				{
					return this.controlPoints ;
				}
				if(propertyName == 'type')
				{	
					return 'Terrain';
				}					
			}
			
			this.BuildTerrain = function()
			{
				for(var i =0; i < this.getRoot().children.length; i++)
					this.BuildTerrainInner(this.getRoot().children[i]);
			
			}
			
			this.BuildTerrainInner= function(mesh,normlen,cb)
			{
			    
			     this.terrainGenerator.generateTerrain(mesh,normlen,cb);
			}
			
			
			//must be defined by the object
			this.getRoot = function()
			{
				return this.rootnode;
			}
			this.rootnode = new THREE.Object3D();
			this.inherits = ['vwf/model/threejs/transformable.js'];
			//this.Build();
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new terrain(childID, childSource, childName);
        }
})();