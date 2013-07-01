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



						"varying vec3 debug;\n"+
						"uniform vec3 debugColor;\n"+
						"uniform float side;\n"+
						"attribute vec3 everyOtherNormal;\n"+
						"attribute float everyOtherZ;\n"+
						"void main() {\n"+
						" pos = (modelMatrix * vec4(position,1.0)).xyz; \n"+
						"npos = pos;\n"+
						"npos.z += getNoise(pos.xy*200.0)/50.0; \n"+
						
						"float  edgeblend = 0.0;"+
						
						"debug = vec3(0.0,0.0,0.0);\n"+
						" if(side == 1.0 && position.y > 49.0) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 2.0 && position.y < -49.0) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 3.0 && position.x < -49.0) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 4.0 && position.x > 49.0) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 5.0 && (position.y > 49.0 || position.x > 49.0)) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 5.0 && (position.y > 49.0 || position.x > 49.0)) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 6.0 && (position.y < -49.0 || position.x > 49.0)) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 7.0 && (position.y > 49.0 || position.x < -49.0)) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						" if(side == 8.0 && (position.y < -49.0 || position.x < -49.0)) {edgeblend = 1.0; debug = vec3(1.0,1.0,1.0);}\n" +
						
						" float z = mix(everyOtherZ,position.z,blendPercent);\n"+
						"wN = mix(everyOtherNormal,normal,blendPercent);\n"+
						"if(edgeblend == 1.0) {z=everyOtherZ;wN = everyOtherNormal; }\n"+
						"n = normalMatrix *  wN\n;"+
						"n = normalize(n);\n"+
						"   vec4 mvPosition = modelViewMatrix * vec4( position.x,position.y,z, 1.0 );\n"+
					
					//	"debug = debugColor;\n"+
						"   gl_Position = projectionMatrix * mvPosition;\n"+
						"}    \n";
						var fragShader_default_start = 
					   
						
						
						
						"#if MAX_DIR_LIGHTS > 0\n"+

						
						//"#define USE_FOG" : "",
						//"#define FOG_EXP2" : "",
					
						"uniform vec3 directionalLightColor[ MAX_DIR_LIGHTS ];\n"+
						"uniform vec3 directionalLightDirection[ MAX_DIR_LIGHTS ];\n"+
						
						
						"uniform vec3 fogColor;"+	
						"uniform int fogType;"+
												
												"uniform float fogDensity;"+
												"uniform float fogNear;"+
												"uniform float fogFar;"+		
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
						"    float fogDensityA = fogDensity ;\n"+
						"    float vFalloff = 20.0;\n"+ 
						"    float fog = exp((-rayOrigin.y*vFalloff)*fogDensityA) * (1.0-exp(-dist*rayDirection.y*vFalloff*fogDensityA))/(rayDirection.y*vFalloff);\n"+
						"    return mix(albedo, fogColor, clamp(fog, 0.0, 1.0));\n"+
						"}\n"+

						"vec3 aerialPerspective(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection){\n"+
						"    float atmosphereDensity = 0.00025;\n"+
						"    vec3 atmosphere = atmosphereColor(rayDirection)+vec3(0.0, 0.02, 0.04); \n"+
						"    atmosphere = mix( atmosphere, atmosphere*.75, clamp(1.0-exp(-dist*atmosphereDensity), 0.0, 1.0));\n"+
						"    vec3 color = mix( applyFog(albedo, dist, rayOrigin, rayDirection), atmosphere, clamp(1.0-exp(-dist*atmosphereDensity), 0.0, 1.0));\n"+
						"    return color;\n"+
						"}						\n"+
						
						
						
						"#endif\n"+
						
						"varying vec3 debug;\n"+
						"varying vec3 pos;"+
						"varying vec3 n;"+
						"varying vec3 wN;"+
						"varying vec3 npos;";
						
						
						
						
						var fragShader_default_end = 
						
						
						"void main() {\n"+
						"	vec3 nn = normalize(viewMatrix * vec4(wN,0.0)).xyz;\n"+
						"	vec3 light = vec3(0.0,0.0,0.0);\n"+
						"	vec4 ambient = vec4(0.5,0.5,0.5,1.0);\n"+
						
						
						"	#if MAX_DIR_LIGHTS > 0\n"+
						"   vec3 vLightDir = (viewMatrix * vec4(directionalLightDirection[0],0.0)).xyz;\n"+
						"   vec3 vEyeDir = (viewMatrix * vec4(normalize(pos-cameraPosition ),0.0)).xyz;\n"+
						"   vec3 vReflectDir = reflect(vLightDir,nn);\n"+
						"   float phong =pow( max(0.0,dot(vReflectDir,vEyeDir)),4.0 );\n"+
						"	light += directionalLightColor[0] * clamp(0.0,1.0,dot(nn, vLightDir));\n"+
						"	#endif\n"+
						
						"	vec4 diffuse = getTexture(npos,nn);\n"+
						"	diffuse.a = 1.0;\n"+
						"   gl_FragColor = ambient * diffuse + diffuse * vec4(light.xyz,1.0) + 0.0 * vec4(0.4,0.4,0.4,1.0);\n"+
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
							//"gl_FragColor.xyz = nn;\n"+
							"gl_FragColor.xyz = aerialPerspective(gl_FragColor.xyz, distance(pos,cameraPosition),cameraPosition.xzy, normalize(pos-cameraPosition).xzy);\n"+
						"#endif\n"+
						//"gl_FragColor = vec4(debug,1.0);\n"+
						"}\n";
						
						//the default shader - the one used by the analytic solver, just has some simple stuff
						//note that this could be changed to do just life and lifespan, and calculate the 
						//size and color from to uniforms. Im not going to bother
						
						
						//uniforms_default.texture.value.wrapS = uniforms_default.texture.value.wrapT = THREE.RepeatWrapping;
				
				this.getDefaultDiffuseString = function()
				{
					return "vec4 getTexture(vec3 coords, vec3 norm) {return vec4(1.0,1.0,1.0,1.0);}\n";
		
				}
				this.getMat = function()
				{	
						
						var algorithmShaderString = this.terrainGenerator.getDiffuseFragmentShader();
						var algorithmUniforms = this.terrainGenerator.getMaterialUniforms();
						
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
							
							noiseSampler:   { type: "t", value: _SceneManager.getTexture( "terrain/bestnoise.png" ) },
							"side" : { type: "f", value: 0 },
							"fogDensity" : { type: "f", value: 0.00025 },
							"fogNear" : { type: "f", value: 1 },
							"fogFar" : { type: "f", value: 2000 },
							"fogColor" : { type: "c", value: new THREE.Color( 0xffffff ) },
							"blendPercent" : { type: "f", value: 0.00000 },
							debugColor : { type: "c", value: new THREE.Color( 0xffff0f ) },
						
						};	 
						for(var i in algorithmUniforms)
							uniforms_default[i] = algorithmUniforms[i];
						var attributes_default = {
							everyOtherNormal: { type: 'v3', value: [] },
							everyOtherZ: { type: 'f', value: [] },
						};
						var mat = new THREE.ShaderMaterial( {
							uniforms:       uniforms_default,
							attributes:     attributes_default,
							vertexShader:   vertShader_default,
							fragmentShader: (fragShader_default_start + (algorithmShaderString || this.getDefaultDiffuseString()) + fragShader_default_end)

						});
						mat.lights = true;
						mat.fog = true;
						
						
						uniforms_default.noiseSampler.value.wrapS = uniforms_default.noiseSampler.value.wrapT = THREE.RepeatWrapping;
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
				this.returnMesh = function(mesh)	
				{
				
					if(mesh.quadnode)
						mesh.quadnode = null;
					if(mesh.parent)
						mesh.parent.remove(mesh);
				}
				this.clear = function()
				{
					this.tiles = [];
				}
				this.getMesh = function(res,side)
				{
					if(this.tiles[res])
						for(var i = 0; i < this.tiles[res].length; i++)
							if(this.tiles[res][i].quadnode == null && this.tiles[res][i].side == side)
							{
							//	console.log('reusing tile');
							
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
					newtile.material.uniforms.side.value = side;
					for(var i = 0; i < newtile.geometry.vertices.length; i++)
					{
						newtile.material.attributes.everyOtherZ.value.push(0);
						newtile.material.attributes.everyOtherNormal.value.push(new THREE.Vector3(0,0,1));
					}
					newtile.material.attributes.everyOtherZ.needsUpdate = true;
					newtile.material.attributes.everyOtherNormal.needsUpdate = true;
					//so, it appears that it might just be better to generate a new one than store it 
					//memory / cpu tradeoff
					this.tiles[res].push(newtile);
					return newtile;
				}
			}