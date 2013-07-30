(function(){
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
			this.setMaterialByDef = function(currentmat,value)
			{
				if(!value) return;
				currentmat.color.r = value.color.r;
				currentmat.color.g = value.color.g;
				currentmat.color.b = value.color.b;
				
				currentmat.ambient.r = value.ambient.r;
				currentmat.ambient.g = value.ambient.g;
				currentmat.ambient.b = value.ambient.b;
				
				currentmat.emissive.r = value.emit.r;
				currentmat.emissive.g = value.emit.g;
				currentmat.emissive.b = value.emit.b;
				
				currentmat.specular.r = value.specularColor.r * value.specularLevel;
				currentmat.specular.g = value.specularColor.g * value.specularLevel;
				currentmat.specular.b = value.specularColor.b * value.specularLevel;
				
				currentmat.opacity = value.alpha;
				if(value.alpha < 1)
					currentmat.transparent = true;
				else
					currentmat.transparent = false;
					
				currentmat.shininess = value.shininess * 5 ;
				
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
					currentmat.envMap = sky.uniforms.texture.value;
					currentmat.envMap.mapping = new THREE.CubeReflectionMapping();
				}
				currentmat.needsUpdate = true;
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
						GetAllLeafMeshes(threeObject.children[i],list);
					}               
				}     
			}
			this.settingProperty = function(propname,propval)
			{
				if(propname == 'materialDef' && propval && propval.layers)
				{
					
					var needRebuild = false;
					
					if(this.materialDef && propval.layers.length > this.materialDef.layers.length)
						needRebuild = true;
						
					this.materialDef = propval;
					var list = [];
					GetAllLeafMeshes(this.getRoot(),list);
					for(var i =0; i < list.length; i++)
					{
						if(!(list[i].material instanceof THREE.MeshPhongMaterial))
							list[i].material =  new THREE.MeshPhongMaterial();
						this.setMaterialByDef(list[i].material || new THREE.MeshPhongMaterial,propval);
						list[i].materialUpdated();
					}
					
					if(this.dirtyStack && needRebuild)
					{
						
						this.dirtyStack(true);
					}
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