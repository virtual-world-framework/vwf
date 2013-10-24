(function(){
		function MaterialCache()
		{
			this.materials = {};
			this.getMaterialbyDef = function(def)
			{
				var id = JSON.stringify(def);
				if(this.materials[id])
					return this.materials[id];
				else
				{
					
					//this.materials[id].morphTargets  = true;
					if(def)
					{
						this.materials[id] =  this.setMaterialByDef(this.materials[id],def);
						this.materials[id].def = def;
					}else
						return null;
					return this.materials[id];				
					
				}
			}
			//assign the new material to the mesh, keep reference count of material use
			this.setMaterial = function(mesh,def)
			{
				

				var oldmat = mesh.material;
				if(oldmat && oldmat.refCount === undefined)
					oldmat.refCount = 1;
				if(oldmat)
					oldmat.refCount--;	
				if(oldmat.refCount == 0)
				{
					if(oldmat.dispose)
						oldmat.dispose();
					var olddef = oldmat.def;
					delete this.materials[olddef];
				}				
				mesh.material = this.getMaterialbyDef(def);
				if(mesh.material && mesh.material.refCount === undefined)
					mesh.material.refCount = 0;
				if(mesh.material)
					mesh.material.refCount++;
				this.cleanup();
			}
			//remove materials that are not used by any meshes
			this.cleanup = function()
			{
				for(var i in this.materials)
				{
					if(this.materials[i] && this.materials[i].refCount === 0)
						delete this.materials[i];
					if(!this.materials[i])
						delete this.materials[i];
				}
			}
			this.setMaterialByDef = function(currentmat,value)
			{
				if(!value) return null;
				if(!value.type)
					value.type = 'phong';
				if(value.type == 'phong')	
					return this.setMaterialDefPhong(currentmat,value);
				if(value.type == 'video')	
				{
						return this.setMaterialDefVideo(currentmat,value)
				}
				if(value.type == 'camera')	
				{
						return this.setMaterialDefCamera(currentmat,value)
				}
			}
			this.setMaterialDefVideo = function(currentmat,value)
			{
				
				if(currentmat && currentmat.dispose)
					currentmat.dispose();
						
				if(currentmat && !(currentmat instanceof THREE.ShaderMaterial))
				{
					currentmat = null;
				}
				
				if(!currentmat)
				{
					
					//startColor:{type: "v4", value:new THREE.Vector4(1,1,1,1)},
					currentmat = new THREE.ShaderMaterial({
						uniforms: {
							color:{type: "v4", value:new THREE.Vector4(1,1,1,1)},
							texture1:   { type: "t", value: null }
						},
						attributes: {},
						vertexShader: 
						"varying vec2 tc;"+
						"void main() {    "+
						"    gl_Position = modelViewMatrix * vec4( position, 1.0 );\n"+
						"    gl_Position = projectionMatrix * gl_Position;\n"+
						"    tc = uv;"+
						"} ",
						fragmentShader: "uniform vec4 color; "+
						"uniform sampler2D texture1;"+
						"varying vec2 tc;"+
						"void main() { "+
						"vec4 color1 = texture2D(texture1,tc);"+
						"gl_FragColor = color1;"+
						
						"}"
						
					});

				
				}
				
				
				currentmat.dispose = function()
				{
					;
					$(document).unbind('prerender',this.videoUpdateCallback);
					delete this.videoUpdateCallback;
					if(this.video)
						this.video.pause();
					delete this.video;
				}.bind(currentmat);
				
				if(currentmat.videoUpdateCallback)
				{
					$(document).unbind('prerender',currentmat.videoUpdateCallback);
					delete currentmat.videoUpdateCallback;
				}
				
				if(!currentmat.videoUpdateCallback)
				{
					currentmat.videoUpdateCallback = function()
					{
						
						if(this.uniforms.texture1.value.image.readyState === this.uniforms.texture1.value.image.HAVE_ENOUGH_DATA)
						{
							this.uniforms.texture1.value.needsUpdate = true;
						}
					
					}.bind(currentmat);
					
					$(document).bind('prerender',currentmat.videoUpdateCallback.bind(currentmat));
					
				}
				if(value.layers[0])
				{
					var src = value.videosrc;
					var video = document.createElement('video');
					
					video.setAttribute('crossorigin',  "anonymous");
					video.autoplay = true;
					video.loop = true;
					
					video.src = src;
					video.onload = function(){this.play();};
					//document.body.appendChild(video);
					//video.style.zIndex = 1000;
					//video.style.position = 'absolute';
				
					currentmat.video = video;
					currentmat.uniforms.texture1.value = new THREE.Texture(video);
					currentmat.uniforms.texture1.value.minFilter = THREE.LinearFilter;
					currentmat.uniforms.texture1.value.magFilter = THREE.LinearFilter;
					currentmat.uniforms.texture1.value.format = THREE.RGBFormat;
					currentmat.uniforms.texture1.value.generateMipmaps = false;
				}
				return currentmat;
			}
			this.setMaterialDefCamera = function(currentmat,value)
			{
				
				if(currentmat && currentmat.dispose)
					currentmat.dispose();
					
				if(currentmat && !(currentmat instanceof THREE.ShaderMaterial))
				{
					
					currentmat = null;
				}
				
				if(!currentmat)
				{
					
					//startColor:{type: "v4", value:new THREE.Vector4(1,1,1,1)},
					currentmat = new THREE.ShaderMaterial({
						uniforms: {
							
							texture1:   { type: "t", value: _SceneManager.getTexture('./checker.jpg') }
						},
						attributes: {},
						vertexShader: 
						"varying vec2 tc;"+
						"void main() {    "+
						"    gl_Position = modelViewMatrix * vec4( position, 1.0 );\n"+
						"    gl_Position = projectionMatrix * gl_Position;\n"+
						"    tc = uv;"+
						"} ",
						fragmentShader: 
						"uniform sampler2D texture1;"+
						"varying vec2 tc;"+
						"void main() { "+
						"vec4 color1 = texture2D(texture1,tc,0.0);"+
						
						"gl_FragColor = color1;"+
						
						"}"
						
					});

				
				}
				
				
				currentmat.dispose = function()
				{
					_dView.deleteRenderTarget(this.renderTarget);
				}.bind(currentmat);
				
				
				
				if(currentmat.renderTarget)
				{
					_dView.deleteRenderTarget(currentmat.renderTarget);
				}
				
					
					currentmat.uniforms.texture1.value = _dView.createRenderTarget(value.RTTCameraID);
					
					currentmat.renderTarget = currentmat.uniforms.texture1.value;
					//currentmat.uniforms.texture1.value.minFilter = THREE.LinearFilter;
					//currentmat.uniforms.texture1.value.magFilter = THREE.LinearFilter;
				
					currentmat.uniforms.texture1.value.generateMipmaps = true;
					
				
				return currentmat;
			}
			this.setMaterialDefPhong = function(currentmat,value)
			{
				if(!value) return;
				
				if(currentmat && currentmat.dispose)
					currentmat.dispose();
				
				if(currentmat && !(currentmat instanceof THREE.MeshPhongMaterial))
				{
					
					currentmat = null;
				}
				
				if(!currentmat) currentmat = new THREE.MeshPhongMaterial();
				
				currentmat.color.r = value.color.r;
				currentmat.color.g = value.color.g;
				currentmat.color.b = value.color.b;
				
				currentmat.ambient.r = value.ambient.r;
				currentmat.ambient.g = value.ambient.g;
				currentmat.ambient.b = value.ambient.b;
				
				currentmat.emissive.r = value.emit.r;
				currentmat.emissive.g = value.emit.g;
				currentmat.emissive.b = value.emit.b;
				
				currentmat.morphTargets = value.morphTargets || false;
				currentmat.specular.r = value.specularColor.r * value.specularLevel;
				currentmat.specular.g = value.specularColor.g * value.specularLevel;
				currentmat.specular.b = value.specularColor.b * value.specularLevel;
				
				currentmat.side = value.side || 0;
				currentmat.opacity = value.alpha;
				//if the alpha value less than 1, and the blendmode is defined but not noblending
				if(value.alpha < 1 || (value.blendMode !== undefined && value.blendMode !== THREE.NoBlending))
					currentmat.transparent = true;
				else
					currentmat.transparent = false;
				
				if(value.blendMode !== undefined)
				{
					currentmat.blending = value.blendMode;
				}
				if(value.fog !== undefined)
				{
					currentmat.fog = value.fog;
				}
				
				currentmat.wireframe = value.wireframe || false;
				currentmat.metal = value.metal || false;
				currentmat.combine = value.combine || 0;
				
				currentmat.shininess = value.shininess * 5 ;
				
				if(value.depthtest === true || value.depthtest === undefined)
					currentmat.depthTest = true;
				else 	
					currentmat.depthTest = false;
					
				if(value.depthwrite === true || value.depthwrite === undefined)
					currentmat.depthWrite = true;
				else 	
					currentmat.depthWrite = false;
					
				var mapnames = ['map','bumpMap','lightMap','normalMap','specularMap','envMap'];
				currentmat.reflectivity = value.reflect/10;
				
				
				for(var i =0; i < value.layers.length; i++)
				{
						var mapname;
						if(value.layers[i].mapTo == 1)
						{
							mapname = 'map';
							currentmat.alphaTest = 1 - value.layers[i].alpha;
							
						}
						if(value.layers[i].mapTo == 2)
						{
							mapname = 'bumpMap';
							currentmat.bumpScale = value.layers[i].alpha;
						}
						if(value.layers[i].mapTo == 3)
						{
							mapname = 'lightMap';
						}	
						if(value.layers[i].mapTo == 4)
						{
							mapname = 'normalMap';
							currentmat.normalScale.x = value.layers[i].alpha;
							currentmat.normalScale.y = value.layers[i].alpha;
						}	
						if(value.layers[i].mapTo == 5)
						{
							mapname = 'specularMap';
						}
						
						if(value.layers[i].mapTo == 6)
						{
							mapname = 'envMap';
						}
						
						mapnames.splice(mapnames.indexOf(mapname),1);				
						
						String.prototype.endsWith = function(suffix) {
							return this.indexOf(suffix, this.length - suffix.length) !== -1;
						};

						if((currentmat[mapname] && currentmat[mapname].image && !currentmat[mapname].image.src.toString().endsWith(value.layers[i].src)) || !currentmat[mapname])
						{
							currentmat[mapname] = _SceneManager.getTexture(value.layers[i].src);
							currentmat[mapname].needsUpdate = true;
							//currentmat[mapname] = THREE.ImageUtils.loadTexture(value.layers[i].src);
							
						}
						if(value.layers[i].mapInput == 0)
						{
							currentmat[mapname].mapping = new THREE.UVMapping();
						}
						if(value.layers[i].mapInput == 1)
						{
							currentmat[mapname].mapping = new THREE.CubeReflectionMapping();
						}
						if(value.layers[i].mapInput == 2)
						{
							currentmat[mapname].mapping = new THREE.CubeRefractionMapping();
						}
						if(value.layers[i].mapInput == 3)
						{
							currentmat[mapname].mapping = new THREE.SphericalReflectionMapping();
						}
						if(value.layers[i].mapInput == 4)
						{
							currentmat[mapname].mapping = new THREE.SphericalRefractionMapping();
						}
						currentmat[mapname].wrapS = THREE.RepeatWrapping;
						currentmat[mapname].wrapT = THREE.RepeatWrapping;
						currentmat[mapname].repeat.x = value.layers[i].scalex;
						currentmat[mapname].repeat.y = value.layers[i].scaley;
						currentmat[mapname].offset.x = value.layers[i].offsetx;
						currentmat[mapname].offset.y = value.layers[i].offsety;
				}
				for(var i in mapnames)
				{
					if(mapnames[i] == 'map')
						currentmat.map =  _SceneManager.getTexture('white.png');
					else	
					currentmat[mapnames[i]] = null;
				}
				if(currentmat.reflectivity)
				{
					var sky = vwf_view.kernel.kernel.callMethod('index-vwf','getSkyMat')
					if(sky)
					{
					currentmat.envMap = sky.uniforms.texture.value;
					currentmat.envMap.mapping = new THREE.CubeReflectionMapping();
					}
				}
				currentmat.needsUpdate = true;
				return currentmat;
			}
			
			
			
		
		
		
		
		
		}
		var _MaterialCache = new MaterialCache();
		window._MaterialCache = _MaterialCache;
		function materialDef(childID, childSource, childName)
		{
			
		    this.defaultmaterialDef = {
                    shininess:15,
                    alpha:1,
                    ambient:{r:1,g:1,b:1},
                    color:{r:1,g:1,b:1,a:1},
                    emit:{r:0,g:0,b:0},
                    reflect:0.8,
                    shadeless:false,
                    shadow:true,
                    specularColor:{r:0.5773502691896258,g:0.5773502691896258,b:0.5773502691896258},
                    specularLevel:1,
					side:0,
                    layers:[
                      {  alpha: 1,
                        blendMode: 0,
                        mapInput: 0,
                        mapTo: 1,
                        offsetx: 0,
                        offsety: 0,
                        rot: 0,
                        scalex: 1,
                        scaley: 1,
                        src: "checker.jpg"}
                    ]
			}
			this.initializingNode = function()
			{
				
				this.settingProperty( 'materialDef',this.materialDef);
				if(this.dirtyStack)
					this.dirtyStack(true);
			}
			
			this.GetAllLeafMeshes = function(threeObject,list)
			{
				
				if(threeObject instanceof THREE.Mesh)
				{
					list.push(threeObject);
				}
				if(threeObject.children)
				{
					for(var i=0; i < threeObject.children.length; i++)
					{
						if(!threeObject.children[i].vwfID)
							GetAllLeafMeshes(threeObject.children[i],list);
					}               
				}     
			}
			this.settingProperty = function(propname,propval)
			{
				if(propname == 'materialDef' && propval && propval.layers)
				{
					
					var needRebuild = false;
					
					if(this.materialDef)
					{
					if(this.materialDef && propval.layers.length > this.materialDef.layers.length)
						needRebuild = true;
					}	
					this.materialDef = propval;
					var list = [];
					
					this.GetAllLeafMeshes(this.getRoot(),list);
					for(var i =0; i < list.length; i++)
					{
						
						if(list[i].morphTargetInfluences)
							propval.morphTargets = true;
						else
							propval.morphTargets = false;
						_MaterialCache.setMaterial(list[i],propval);
							
						
						list[i].materialUpdated();
					}
					
					if(this.dirtyStack && needRebuild)
					{
						
						this.dirtyStack(true);
					}
				}
			}
			//get the material cache a chance to decrement the ref counter for the materails used by this object
			this.deletingNode = function()
			{
				//dont remove the materials, as the actual view node might still exist
				if(this.initializedFromAsset) return;
				
				//else, this object is deleting for real, and we can remvoe the materials from the cache.
				var list = [];
			
				this.GetAllLeafMeshes(this.getRoot(),list);
				for(var i =0; i < list.length; i++)
				{
					_MaterialCache.setMaterial(list[i],null);
				}
			}	
			this.gettingProperty = function(propname,propval)
			{
				
				if(propname == 'materialDef')
				{
					
					return this.materialDef || this.defaultmaterialDef;
				}
			}
		this.getDefForMaterial = function (currentmat)
		{
		   try{
		   
			var value = {};
			value.color = {}
			value.color.r = currentmat.color.r;
			value.color.g = currentmat.color.g;
			value.color.b = currentmat.color.b;
			value.ambient = {}
			value.ambient.r = currentmat.ambient.r;
			value.ambient.g = currentmat.ambient.g;
			value.ambient.b = currentmat.ambient.b;
			value.emit = {}
			value.emit.r = currentmat.emissive.r;
			value.emit.g = currentmat.emissive.g;
			value.emit.b = currentmat.emissive.b;
			value.specularColor = {}
			value.specularColor.r = currentmat.specular.r;
			value.specularColor.g = currentmat.specular.g;
			value.specularColor.b = currentmat.specular.b;
			value.specularLevel = 1;
			value.alpha = currentmat.opacity;
			value.shininess = (currentmat.shininess || 0) / 5 ;
			value.side = currentmat.side;
			 value.reflect = currentmat.reflectivity * 10;
			var mapnames = ['map', 'bumpMap', 'lightMap', 'normalMap', 'specularMap'];
			value.layers = [];
			for (var i = 0; i < mapnames.length; i++)
			{
				var map = currentmat[mapnames[i]];
				if (map)
				{
					value.layers.push(
					{});
					value.layers[value.layers.length-1].mapTo = i + 1;
					value.layers[value.layers.length-1].scalex = map.repeat.x;
					value.layers[value.layers.length-1].scaley = map.repeat.y;
					value.layers[value.layers.length-1].offsetx = map.offset.x;
					value.layers[value.layers.length-1].offsety = map.offset.y;
					if (i == 0) value.layers[value.layers.length-1].alpha = -currentmat.alphaTest + 1;
					if (i == 3) value.layers[value.layers.length-1].alpha = currentmat.normalScale.x;
					if (i == 1) value.layers[value.layers.length-1].alpha = currentmat.bumpScale;
					value.layers[value.layers.length-1].src = map.image.src;
					if (map.mapping instanceof THREE.UVMapping) value.layers[value.layers.length-1].mapInput = 0;
					if (map.mapping instanceof THREE.CubeReflectionMapping) value.layers[value.layers.length-1].mapInput = 1;
					if (map.mapping instanceof THREE.CubeRefractionMapping) value.layers[value.layers.length-1].mapInput = 2;
					if (map.mapping instanceof THREE.SphericalReflectionMapping) value.layers[value.layers.length-1].mapInput = 3;
					if (map.mapping instanceof THREE.SphericalRefractionMapping) value.layers[value.layers.length-1].mapInput = 4;
					
				}
			}
			return value;
			}catch(e)
			{
				return {}
			}
		}
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new materialDef(childID, childSource, childName);
        }
})();