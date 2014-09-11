(function(){
		function modifier(childID, childSource, childName)
		{
			this.amount = 0;
			this.updateSelf = function()
			{
				
				var mesh = this.GetMesh();
				var geo = mesh.geometry;
				for(var i = 0; i < geo.faces.length; i++)
				{
					var verta = geo.vertices[geo.faces[i].a];
					verta = verta.sub(geo.faces[i].vertexNormals[0].clone().setLength(this.amount));
					var vertb = geo.vertices[geo.faces[i].b];
					vertb = vertb.sub(geo.faces[i].vertexNormals[1].clone().setLength(this.amount));
					var vertc = geo.vertices[geo.faces[i].c];
					vertc = vertc.sub(geo.faces[i].vertexNormals[2].clone().setLength(this.amount));
					if(geo.faces[i].d)
					{
						var vertd = geo.vertices[geo.faces[i].d];
						vertd = vertd.sub(geo.faces[i].vertexNormals[3].clone().setLength(this.amount));
					}
					
					
				}
				geo.verticesNeedUpdate = true;
				
			}
			this.settingProperty = function(prop,val)
			{
				if(prop == 'amount')
				{
					this.amount = val;
					this.dirtyStack();
				}
				
			}
			this.gettingProperty = function(prop)
			{
				if(prop == 'amount')
				{
					return this.amount;
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
						}
					}
				}
			}
			this.inherits = ['vwf/model/threejs/modifier.js'];
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new modifier(childID, childSource, childName);
        }
})();