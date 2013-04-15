(function(){
		function uvmap(childID, childSource, childName)
		{
			this._length = 1;
			this.width = 1;
			this.height = 1;
			this.mode = 'sphere';
			this.plane = 'z';
			this.rotate = 1;
			this.tilex = 2;
			this.tiley = 2;
			this.xaxis = new THREE.Vector3(1,0,0);
			this.yaxis = new THREE.Vector3(0,1,0);
			this.zaxis = new THREE.Vector3(0,0,1);
			this.projectToSphere = function(vert)
			{	
				var x = vert.x * this._length;
				var y = vert.z * this.width;
				var z = vert.y * this.height;
				var r = Math.sqrt((x*x + y*y + z*z)); 
				var t = Math.atan(y/x);
				var p = Math.acos(z/r);
				
				return new THREE.Vector2(t/(1*Math.PI),p/(1*Math.PI));
			}
			this.tileAndRotate = function(uv)
			{
				uv.x *= this.tilex;
				uv.y *= this.tiley;
				
				var x2 = uv.x * Math.cos(this.rotate) - uv.y * Math.sin(this.rotate);
				var y2 = uv.y * Math.cos(this.rotate) + uv.x * Math.sin(this.rotate);
				
				uv.x = x2;
				uv.y = y2;
				return uv;
			}
			this.projectToPlane = function(vert,plane)
			{
				
				var ret = new THREE.Vector2();
				if(plane == 'z')
				{
					ret.x = vert.x/this._length;
					ret.y = vert.y/this.width;
				}
				if(plane == 'y')
				{
					ret.x = vert.z/this.height;
					ret.y = vert.x/this._length;
				}
				if(plane == 'x')
				{
					ret.x = vert.z/this._length;
					ret.y = vert.y/this.width;
				}
				return ret;
			}
			this.choosePlane = function(norm)
			{
				var dx = Math.abs(norm.dot(this.xaxis));
				var dy = Math.abs(norm.dot(this.yaxis));
				var dz = Math.abs(norm.dot(this.zaxis));
				var d = Math.max(dx,dy,dz);
				if(d == dx) return 'x';
				if(d == dy) return 'y';
				if(d == dz) return 'z';
			}
			this.updateSelf = function()
			{
				
				var mesh = this.GetMesh();
				var geo = mesh.geometry;
				var faceVertexUVs = geo.faceVertexUvs[0];
				for(var i = 0; i < geo.faces.length; i++)
				{
					var face = geo.faces[i];
					if(!faceVertexUVs)
						return;
					var uvs = faceVertexUVs [i];
					if(!uvs)
					{
						uvs=[];
						faceVertexUVs [i] = uvs;
						uvs.push(new THREE.Vector2());
						uvs.push(new THREE.Vector2());
						uvs.push(new THREE.Vector2());
						if(face instanceof THREE.Face4)	
							uvs.push(new THREE.Vector2());
					}
					var v1 = geo.vertices[face.a];
					var v2 = geo.vertices[face.b];
					var v3 = geo.vertices[face.c];
					var v4 = null;
					if(face instanceof THREE.Face4)
						v4 = geo.vertices[face.d];
					var verts = [v1,v2,v3];
					if(v4)
						verts.push(v4);
						
					for(var j = 0; j < verts.length; j++)
					{
						var uv;
						if(this.mode == 'plane')
							uv = this.projectToPlane(verts[j],this.plane);
						if(this.mode == 'box')
						{
							uv = this.projectToPlane(verts[j],this.choosePlane(face.normal));	
						}
						if(this.mode == 'sphere')
							uv = this.projectToSphere(verts[j]);
						uv = this.tileAndRotate(uv);	
						uvs[j].x = uv.x;
						uvs[j].y = uv.y;
					}
				}
				
				geo.uvsNeedUpdate = true;
				
			}
			this.settingProperty = function(prop,val)
			{
				if(prop == '_length' || prop == 'width' || prop == 'height' || prop == 'rotate' || prop == 'tilex' || prop == 'tiley' || prop == 'mode' || prop == 'plane')
				{
					this[prop] = val;
					this.dirtyStack();
				}
			}
			this.gettingProperty = function(prop)
			{
				if(prop == '_length' || prop == 'width' || prop == 'height' || prop == 'rotate' || prop == 'tilex' || prop == 'tiley' || prop == 'mode' || prop == 'plane')
				{
					return this[prop];
				}
				if(prop == 'EditorData')
				{
					return {
						_active:{displayname : 'Active',property:'active',type:'check',min:-10,max:10,step:.01},
						_length:{displayname : 'Length',property:'_length',type:'slider',min:-10,max:10,step:.01},
						width:{displayname : 'Width',property:'width',type:'slider',min:-10,max:10,step:.01},
						height:{displayname : 'Height',property:'height',type:'slider',min:-10,max:10,step:.01},
						tilex:{displayname : 'Tile X',property:'tilex',type:'slider',min:-10,max:10,step:.01},
						tiley:{displayname : 'Tile Y',property:'tiley',type:'slider',min:-10,max:10,step:.01},
						rotate:{displayname : 'Rotate',property:'rotate',type:'slider',min:-3.14159,max:3.14159,step:.01},
						plane:{displayname : 'Plane Axis',property:'plane',type:'choice',values:['x','y','z'],labels:['X','Y','Z']},
						mode:{displayname : 'Mode',property:'mode',type:'choice',values:['plane','box','sphere'],labels:['Plane','Box','Sphere']}
					}
				}
			}
			this.inherits = ['vwf/model/threejs/modifier.js'];
		}
		
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new uvmap(childID, childSource, childName);
        }
})();
