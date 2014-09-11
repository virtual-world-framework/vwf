(function(){
		function extrude(childID, childSource, childName)
		{
			this.amount = 1;
			this.steps = 1;
			this.mymesh = null;
			this.updateSelf = function()
			{
				
				if(this.mymesh)
					this.mymesh.parent.remove(this.mymesh);

				var mesh = this.parentNode.GetMesh();
				if(!mesh) return;
				var geo = mesh.geometry;
				var points = [];
				
				var extrusionSettings = {
					amount:this.amount, steps:this.steps, size: this.amount, height: this.amount, curveSegments: this.steps + 2,
					bevelThickness: 1, bevelSize: 2, bevelEnabled: false,
					material: 0, extrudeMaterial: 1
				};
				for(var i = 0; i < geo.vertices.length; i++)
				{
					points.push(new THREE.Vector2(geo.vertices[i].x,geo.vertices[i].y));
				}
				
				var shape = new THREE.Shape(points);
				var geometry = new THREE.ExtrudeGeometry(shape,extrusionSettings);
				var p = mesh.parent;
			//	mesh.parent.remove(mesh);
				this.mymesh = new THREE.Mesh(geometry,mesh.material)
				
				var mat = new THREE.MeshPhongMaterial();
				this.mymesh.material = mat;
				this.mymesh.castShadow = this.parentNode.castShadows;
				this.mymesh.receiveShadow  = this.parentNode.receiveShadows;
				_Editor.setMaterialByDef(mat,this.parentNode.materialDef);
				p.add(this.mymesh);
				
			}
			this.deletingNode = function()
			{
				this.dirtyStack();
				if(this.mymesh)
					this.mymesh.parent.remove(this.mymesh);
			}
			this.initializingNode = function()
			{
				this.updateSelf();
				this.dirtyStack();
			}
			this.settingProperty = function(prop,val)
			{
				if(prop == 'amount')
				{
					this.amount = val;
					this.dirtyStack();
				}
				if(prop == 'steps')
				{
					this.steps = val;
					this.dirtyStack();
				}
				
			}
			this.GetMesh = function()
			{
				return this.mymesh;
			}
			this.gettingProperty = function(prop)
			{
				if(prop == 'amount')
				{
					return this.amount;
				}
				if(prop == 'steps')
				{
					return this.steps;
				}
				if(prop == 'type')
				{
					return 'modifier';
				}
				if(prop == 'EditorData')
				{
					return {
						_active:{displayname : 'Active',property:'active',type:'check',min:-10,max:10,step:.01},
						amount:{
								displayname : 'Amount',
								property:'amount',
								type:'slider',
								min:-1,
								max:1,
								step:.01
						},
						steps:{
								displayname : 'Steps',
								property:'steps',
								type:'slider',
								min:1,
								max:20,
								step:.01
						}
					}
				}
			}
			this.inherits = ['vwf/model/threejs/modifier.js',];
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new extrude(childID, childSource, childName);
        }
})();