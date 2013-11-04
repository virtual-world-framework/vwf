(function(){
		function asset(childID, childSource, childName, childType, assetSource, asyncCallback, assetRegistry)
		{
		
			
			//asyncCallback(false);
			
		
			this.inherits = ['vwf/model/threejs/transformable.js','vwf/model/threejs/materialDef.js','vwf/model/threejs/animatable.js','vwf/model/threejs/shadowcaster.js','vwf/model/threejs/passable.js','vwf/model/threejs/visible.js','vwf/model/threejs/static.js'];
			this.initializingNode = function()
			{
				
			}
			this.gettingProperty = function(propertyName)
			{
				
				
			}
			this.settingProperty = function(propertyName,propertyValue)
			{
				
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'materialDef')
				{
					
					if(this.materialDef == null)
					{
						
						var list = [];
						this.GetAllLeafMeshes(this.rootnode,list);
						return this.getDefForMaterial(list[0].material);
					
					}else
					{
						return this.materialDef;
					}
				}
			}
			//must be defined by the object
			this.getRoot = function()
			{
				return this.rootnode;
			}
			this.rootnode = new THREE.Object3D();
			
			//for the subNode case
			this.setAsset = function(asset)
			{
				this.initializedFromAsset = true;
				this.backupmats = [];
				this.backupMatrix = asset.matrix.clone();
				this.rootnode = asset;
				this.rootnode = asset;
				asset.initializedFromAsset = true;
				var list = [];
				this.GetAllLeafMeshes(this.rootnode,list);
				for(var i =0; i < list.length; i++)
				{
					if(list[i].material)
					{
						this.backupmats.push([list[i],list[i].material.clone()]);
					}					
				}
				asset.matrixAutoUpdate = false;
				asset.updateMatrixWorld(true);      
				_SceneManager.setDirty(asset);	
				
				this.settingProperty('transform',this.gettingProperty('transform'));
			
			}
			this.deletingNode = function()
			{
				
				if(this.initializedFromAsset)
				{
					
					delete this.rootnode.vwfID;
					//delete this.rootnode.initializedFromAsset;
					
					for(var i =0; i < this.backupmats.length; i++)
					{
						
						this.backupmats[i][0].material = this.backupmats[i][1];
					}
					this.rootnode.matrix = this.backupMatrix
					this.rootnode.updateMatrixWorld(true);
				}
			}
			this.loadFailed = function(id)
			{
				$(document).trigger('EndParse');
				//the collada loader uses the failed callback as progress. data means this is not really an error;
				if(!id && window._Notifier)
					_Notifier.alert('error loading asset ' + this.assetSource);
			
			}
			this.loaded = function(asset)
			{
				
				this.getRoot().add(asset.scene);
				$(document).trigger('EndParse',['Loading...',assetSource]);
				
				
				//get the entry from the asset registry
				reg = this.assetRegistry[this.assetSource];
				//it's not pending, and it is loaded
				reg.pending = false;
				reg.loaded = true;
				//store this asset in the registry
				reg.node = asset.scene.clone();
				
				var list = [];
					
					this.GetAllLeafMeshes(reg.node,list);
					for(var i =0; i < list.length; i++)
						if(list[i].material)
						{
							list[i].material = list[i].material.clone();
							list[i].material.needsUpdate = true;
							if(list[i].material.map)
							{
								list[i].material.map =  _SceneManager.getTexture(list[i].material.map.image.src);
								list[i].material.map.needsUpdate = true;
							}else
							{
								list[i].material.map =  _SceneManager.getTexture('white.png');
								list[i].material.map.needsUpdate = true;
							}
							if(list[i].material.bumpMap)
							{
								list[i].material.bumpMap = _SceneManager.getTexture(list[i].material.bumpMap.image.src);
								list[i].material.bumpMap.needsUpdate = true;
							}
							if(list[i].material.lightMap)
							{
								list[i].material.lightMap = _SceneManager.getTexture(list[i].material.lightMap.image.src);
								list[i].material.lightMap.needsUpdate = true;
							}
							if(list[i].material.normalMap)
							{
								list[i].material.normalMap = _SceneManager.getTexture(list[i].material.normalMap.image.src);
								list[i].material.normalMap.needsUpdate = true;								
							}
											
							list[i].materialUpdated();
						}
				
					
				
				
				this.settingProperty('materialDef',this.materialDef);
				//if any callbacks were waiting on the asset, call those callbacks
				for(var i = 0; i < reg.callbacks.length; i++)
					reg.callbacks[i](asset.scene);
				//nothing should be waiting on callbacks now.	
				reg.callbacks = [];	
				
				
				asyncCallback(true);
				
				
			
			}.bind(this);
			
			
			//if there is no asset source, perhaps because this linked to an existing node from a parent asset, just continue with loading
			if(!assetSource)
			{
				
				return;
			}
			
			
			
			
			
			
			
		this.assetRegistry	= assetRegistry;
		this.assetSource = assetSource;
			
			// if there is no entry in the registry, create one
		if(!assetRegistry[assetSource])
		{
			//its new, so not waiting, and not loaded
			assetRegistry[assetSource] = {};
			assetRegistry[assetSource].loaded = false;
			assetRegistry[assetSource].pending = false;
			assetRegistry[assetSource].callbacks = [];
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
			
			//grab the registry entry for this asset
			var reg = assetRegistry[assetSource];
			
			//if the asset entry is not loaded and not pending, you'll have to actaully go download and parse it
			if(reg.loaded == false && reg.pending == false)
			{
				//thus, it becomes pending
				reg.pending = true;
				asyncCallback( false );
			
				$(document).trigger('BeginParse',['Loading...',assetSource]);
				
				if(childType == 'subDriver/threejs/asset/vnd.collada+xml')
				{
					this.loader = new THREE.ColladaLoader();
					
					this.loader.load(assetSource,this.loaded,this.loadFailed.bind(this));
					
					asyncCallback(false);
				}
				if(childType == 'subDriver/threejs/asset/vnd.osgjs+json+compressed')
				{
					
					this.loader = new UTF8JsonLoader({source:assetSource},this.loaded,this.loadFailed);
					
					asyncCallback(false);
				}
				
				
				
			}
			//if the asset registry entry is not pending and it is loaded, then just grab a copy, no download or parse necessary
			else if(reg.loaded == true && reg.pending == false)
			{
				this.getRoot().add(reg.node.clone());
				
				var list = [];
					
					this.GetAllLeafMeshes(this.rootnode,list);
					for(var i =0; i < list.length; i++)
						if(list[i].material)
						{
							list[i].material = list[i].material.clone();
							list[i].material.needsUpdate = true;
							
				
							if(list[i].material.map)
							{
								list[i].material.map =  _SceneManager.getTexture(list[i].material.map.image.src);
								list[i].material.map.needsUpdate = true;
							}else
							{
								list[i].material.map =  _SceneManager.getTexture('white.png');
								list[i].material.map.needsUpdate = true;
							}
							if(list[i].material.bumpMap)
							{
								list[i].material.bumpMap = _SceneManager.getTexture(list[i].material.bumpMap.image.src);
								list[i].material.bumpMap.needsUpdate = true;
							}
							if(list[i].material.lightMap)
							{
								list[i].material.lightMap = _SceneManager.getTexture(list[i].material.lightMap.image.src);
								list[i].material.lightMap.needsUpdate = true;
							}
							if(list[i].material.normalMap)
							{
								list[i].material.normalMap = _SceneManager.getTexture(list[i].material.normalMap.image.src);
								list[i].material.normalMap.needsUpdate = true;								
							}
							
						
							
							
							list[i].materialUpdated();
						}
					
					
					this.settingProperty('materialDef',this.materialDef);
				$(document).trigger('EndParse');
			}
			//if it's pending but not done, register a callback so that when it is done, it can be attached.
			else if(reg.loaded == false && reg.pending == true)
			{	
				
			
				asyncCallback( false );
				
				var tcal = asyncCallback;
				reg.callbacks.push(function(node)
				{
					
					//just clone the node and attach it.
					//this should not clone the geometry, so much lower memory.
					//seems to take near nothing to duplicated animated avatar
					$(document).trigger('EndParse');
					this.getRoot().add(node.clone());
					
					var list = [];
					
					this.GetAllLeafMeshes(this.rootnode,list);
					for(var i =0; i < list.length; i++)
						if(list[i].material)
						{
							list[i].material = list[i].material.clone();
							list[i].material.needsUpdate = true;
							
							if(list[i].material.map)
							{
								list[i].material.map =  _SceneManager.getTexture(list[i].material.map.image.src);
								list[i].material.map.needsUpdate = true;
							}else
							{
								list[i].material.map =  _SceneManager.getTexture('white.png');
								list[i].material.map.needsUpdate = true;
							}
							if(list[i].material.bumpMap)
							{
								list[i].material.bumpMap = _SceneManager.getTexture(list[i].material.bumpMap.image.src);
								list[i].material.bumpMap.needsUpdate = true;
							}
							if(list[i].material.lightMap)
							{
								list[i].material.lightMap = _SceneManager.getTexture(list[i].material.lightMap.image.src);
								list[i].material.lightMap.needsUpdate = true;
							}
							if(list[i].material.normalMap)
							{
								list[i].material.normalMap = _SceneManager.getTexture(list[i].material.normalMap.image.src);
								list[i].material.normalMap.needsUpdate = true;								
							}
							
							
							list[i].materialUpdated();
						}
					
					
					this.settingProperty('materialDef',this.materialDef);
					this.getRoot().updateMatrixWorld(true);
					this.getRoot().sceneManagerUpdate();
					tcal( true );
				}.bind(this));
			}	
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			
			//this.Build();
		}
		//default factory code
        return function(childID, childSource, childName, childType, assetSource, asyncCallback) {
			//name of the node constructor

			
			
		//create an asset registry if one does not exist for this driver
		if(!this.assetRegistry)
		{
			this.assetRegistry = {};
		}
		
    	    
	    
            return new asset(childID, childSource, childName, childType, assetSource, asyncCallback, this.assetRegistry);
        }
})();