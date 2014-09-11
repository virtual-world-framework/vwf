(function(){
		function lathe(childID, childSource, childName)
		{
			this.amount = 1;
			this.steps = 10;
			this.mymesh = null;
			this.updateSelf = function()
			{
				
				
				if(this.mymesh)
					this.mymesh.parent.remove(this.mymesh);
				var mesh = this.parentNode.GetMesh();
				if(!mesh) return;
				var geo = mesh.geometry;
				var points = [];
				
				var mat = new THREE.Matrix4();
				var transform = this.gettingProperty('transform');
				var temp = transform[14];
				transform[14] = transform[13];
				transform[13] = temp;
				mat.elements = transform;
				
				for(var i = 0; i < geo.vertices.length; i++)
				{
					points.push(new THREE.Vector3(geo.vertices[i].x,0,geo.vertices[i].y).applyMatrix4(mat));
				}
				
				var shape = new THREE.Shape(points);
				
				var geometry = new THREE.LatheGeometry(points,Math.floor(this.steps),0,this.amount*Math.PI*2);
				var p = mesh.parent;
			//	mesh.parent.remove(mesh);
				this.mymesh = new THREE.Mesh(geometry,mesh.material)
				
				var mat = new THREE.MeshPhongMaterial();
				this.mymesh.material = mat;
				this.mymesh.castShadow = this.parentNode.castShadows;
				this.mymesh.receiveShadow  = this.parentNode.receiveShadows;
				
				this.mymesh.rotation.x = -Math.PI/2;
				this.mymesh.updateMatrixWorld(true);
				
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
				if(prop == 'transform')
				{
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
								step:1
						}
					}
				}
			}
			this.inherits = ['vwf/model/threejs/modifier.js','vwf/model/threejs/transformable.js'];
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new lathe(childID, childSource, childName);
        }
})();