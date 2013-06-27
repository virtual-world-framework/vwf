new (function(){

	   
	var MAXWORKERS =  8;   

	
	this.terrainDataReceived = function(dataBack,mesh,readers,cb)
	{
		var geo = mesh.geometry;
		
		var vertices = readers[0];
		var normals = readers[1];
		var everyOtherZ =readers[2];
		var everyOtherNormal =readers[3];
		
		var ai,aj,ac,bi,bj,bc,ci,cj,cc;
		var res = Math.floor(Math.sqrt(geo.vertices.length));
		 for(var i = 0; i < geo.faces.length; i++)
		 {	
			 ai = Math.floor(geo.faces[i].a/(res));
			 aj = geo.faces[i].a % res ;
			 ac = (ai * res + aj) * 3;
			 geo.faces[i].vertexNormals[0].x =  normals[ac];
			 geo.faces[i].vertexNormals[0].y =  normals[ac+1];
			 geo.faces[i].vertexNormals[0].z =  normals[ac+2];
			 
			 bi = Math.floor(geo.faces[i].b/(res));
			 bj = geo.faces[i].b % res ;
			 bc = (bi * res + bj) * 3;
			 geo.faces[i].vertexNormals[1].x =  normals[bc];
			 geo.faces[i].vertexNormals[1].y =  normals[bc+1];
			 geo.faces[i].vertexNormals[1].z =  normals[bc+2];
			 
			 ci = Math.floor(geo.faces[i].c/(res));
			 cj = geo.faces[i].c % res ;
			 cc = (ci * res + cj) * 3;
			 geo.faces[i].vertexNormals[2].x =  normals[cc];
			 geo.faces[i].vertexNormals[2].y =  normals[cc+1];
			 geo.faces[i].vertexNormals[2].z =  normals[cc+2];
		 }
		
		for(var i = 0; i < mesh.material.attributes.everyOtherNormal.value.length; i++)
		{
			mesh.material.attributes.everyOtherNormal.value[i].x = everyOtherNormal[i*3];
			mesh.material.attributes.everyOtherNormal.value[i].y = everyOtherNormal[i*3+1];
			mesh.material.attributes.everyOtherNormal.value[i].z = everyOtherNormal[i*3+2];
		}
		for(var i = 0; i < mesh.material.attributes.everyOtherZ.value.length; i++)
		{
			mesh.material.attributes.everyOtherZ.value[i] = everyOtherZ[i];
		}
		for(var i = 0; i < mesh.geometry.vertices.length; i++)
		{
		
			mesh.geometry.vertices[i].z = vertices[i*3+2];
		}
		
		mesh.material.attributes.everyOtherNormal.needsUpdate = true;
		mesh.material.attributes.everyOtherZ.needsUpdate = true;
		geo.verticesNeedUpdate = true;
		geo.computeBoundingSphere();
		geo.computeBoundingBox();
		//geo.computeVertexNormals(true);		
		geo.normalsNeedUpdate = true;
		geo.dirtyMesh = true;
		if(cb)
		  cb();
	
	}

	this.countFreeWorkers = function()
	{
		var i = 0;
		for(var j = 0; j < MAXWORKERS; j++)
		{
			if(this.currentMesh[j] === null)
				i++;
		}
		return i;
	}
	this.countBusyWorkers = function()
	{
		return MAXWORKERS - this.countFreeWorkers();
	}
	this.sendTerrainRequest = function(data,mesh,cb)
	{
		var i = -1;
		for(var j = 0; j < MAXWORKERS; j++)
		{
			if(this.currentMesh[j] === null)
				var i = j;
		}
		if(this.currentMesh[i])
			debugger;
		this.currentCB[i] = cb;
		this.currentMesh[i] = mesh;
		this.currentID[i] = Math.floor(Math.random()*10000000);
		
		var request = {command:'generateTerrain',data:data,id:this.currentID[i],buffers:this.currentBuffers[i]};
		this.worker[i].postMessage(request,request.buffers);
		
	}
	this.message = function(e)
	{
		if(e.data.command == "console")
			console.log(e.data.data);
		if(e.data.command == "terrainData")
		{
			
			var i = this.currentID.indexOf(e.data.id);
			if(this.currentMesh[i] &&  this.currentCB[i]  && i != -1)
			{
				
				var cb = this.currentCB[i];
				var mesh = this.currentMesh[i];
				this.currentCB[i] = null;
				this.currentMesh[i] = null;
			//	console.log("response from  tile");
			
		
				this.currentBuffers[i]=[e.data.data.vertices,e.data.data.normals,e.data.data.everyOtherZ,e.data.data.everyOtherNormal];
				//if(!this.readers[i])
				{
					
					this.readers[i] = [];
					this.readers[i][0] = new Float32Array(e.data.data.vertices);
					this.readers[i][1] = new Float32Array(e.data.data.normals);
					this.readers[i][2] = new Float32Array(e.data.data.everyOtherZ);
					this.readers[i][3] = new Float32Array(e.data.data.everyOtherNormal);
				}
				
				this.terrainDataReceived(e.data.data,mesh,this.readers[i],cb);	
				
			}else
			{
				console.log("response from canceled tile");
			}
		}
		
	}
	this.cancel = function()
	{
		for(var i = 0; i < MAXWORKERS; i++)
		{
			if(this.currentCB[i])
				this.currentCB[i](true);
			this.currentCB[i] =  null;
			this.currentMesh[i] = null;
			this.currentID[i] =  null;
			this.currentBuffers[i] = [];
		}
	}
	this.init = function(type,params)
	{
		
		this.worker = [];
		this.currentCB =  [];
		this.currentMesh = [];
		this.currentID =  [];
		this.currentBuffers = [];
		this.readers = [];
		for(var i = 0; i < MAXWORKERS; i++)
		{
			this.worker[i] = new Worker("vwf/model/threejs/terrainGeneratorThread.js");
			this.worker[i].addEventListener('message',this.message.bind(this));
			this.worker[i].postMessage({command:'init',data:{type:type,params:params}});
			this.currentCB[i] =  null;
			this.currentMesh[i] = null;
			this.currentID[i] =  null;
			this.currentBuffers[i] = [];
		}
	}
	this.test = function()
	{
		this.worker[0].postMessage({command:'test',data:null});
	}

	
	this.generateTerrain=function(mesh, normlen, cb){
		
		
		var vertices = [];
		
		for(var i = 0; i < mesh.geometry.vertices.length; i++)
		{
			vertices.push(mesh.geometry.vertices[i].x);
			vertices.push(mesh.geometry.vertices[i].y);
			vertices.push(mesh.geometry.vertices[i].z);
		}
		var data = {};
		data.vertices = vertices;
		mesh.updateMatrix();
		data.matrix = mesh.matrix.clone().elements;
		
		this.sendTerrainRequest(data,mesh,cb);
		//var dataBack = this.generateTerrainSimWorker(data)	
		
			
	}
	
})()