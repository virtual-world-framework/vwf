(function(){
		function materialDef(childID, childSource, childName)
		{
			this.materialDef = {
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
				currentmat.reflectivity = value.reflect;
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
							currentmat[mapname] = THREE.ImageUtils.loadTexture(value.layers[i].src);
							
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
					currentmat[mapnames[i]] = null;
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
				if(propname == 'materialDef')
				{
					
					var needRebuild = false;
					
					if(propval.layers.length > this.materialDef.layers.length)
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
					return this.materialDef;
				}
			}
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new materialDef(childID, childSource, childName);
        }
})();