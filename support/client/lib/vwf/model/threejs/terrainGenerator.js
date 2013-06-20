new (function(){

	   
	var MAXWORKERS = 5;   

	this.terrainDataReceived = function(dataBack,mesh,cb)
	{
		
		var geo = mesh.geometry;
		var res = Math.floor(Math.sqrt(geo.vertices.length));
		for(var i = 0; i < geo.faces.length; i++)
		{	
			geo.faces[i].vertexNormals[0] =  dataBack.normals[Math.floor(geo.faces[i].a/(res))][geo.faces[i].a % res ];
			geo.faces[i].vertexNormals[1] =  dataBack.normals[Math.floor(geo.faces[i].b/res)][geo.faces[i].b % res ];
			geo.faces[i].vertexNormals[2] =  dataBack.normals[Math.floor(geo.faces[i].c/res)][geo.faces[i].c % res ];;
		}
		
		for(var i = 0; i < mesh.material.attributes.everyOtherNormal.value.length; i++)
		{
			mesh.material.attributes.everyOtherNormal.value[i].x = dataBack.everyOtherNormal[i].x;
			mesh.material.attributes.everyOtherNormal.value[i].y = dataBack.everyOtherNormal[i].y;
			mesh.material.attributes.everyOtherNormal.value[i].z = dataBack.everyOtherNormal[i].z;
		}
		for(var i = 0; i < mesh.material.attributes.everyOtherZ.value.length; i++)
		{
			mesh.material.attributes.everyOtherZ.value[i] = dataBack.everyOtherZ[i];
		}
		for(var i = 0; i < mesh.geometry.vertices.length; i++)
		{
			mesh.geometry.vertices[i].x = dataBack.vertices[i].x;
			mesh.geometry.vertices[i].y = dataBack.vertices[i].y;
			mesh.geometry.vertices[i].z = dataBack.vertices[i].z;
		}
		
		mesh.material.attributes.everyOtherNormal.needsUpdate = true;
		mesh.material.attributes.everyOtherZ.needsUpdate = true;
		geo.verticesNeedUpdate = true;
		geo.computeBoundingSphere();
		geo.computeBoundingBox();
				
		geo.normalsNeedUpdate = true;
		geo.dirtyMesh = true;
		if(cb)
		  cb();
	
	}
	this.generateTerrainSimWorkerHook = function(mesh,cb)
	{
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
		var request = {command:'generateTerrain',data:data,id:this.currentID[i]};
		this.worker[i].postMessage(request);
	
	}
	this.message = function(e)
	{
		if(e.data.command == "console")
			console.log(e.data.data);
		if(e.data.command == "terrainData")
		{
			
			var i = this.currentID.indexOf(e.data.id);
			if(this.currentMesh[i] && i != -1)
			{
				
				var cb = this.currentCB[i];
				var mesh = this.currentMesh[i];
				this.currentCB[i] = null;
				this.currentMesh[i] = null;
				this.terrainDataReceived(e.data.data,mesh,cb);	
			}
		}
		
	}
	this.cancel = function()
	{
		for(var i = 0; i < MAXWORKERS; i++)
		{
			this.currentCB[i] =  null;
			this.currentMesh[i] = null;
			this.currentID[i] =  null;
		}
	}
	this.init = function()
	{
		
		this.worker = [];
		this.currentCB =  [];
		this.currentMesh = [];
		this.currentID =  [];
		
		for(var i = 0; i < MAXWORKERS; i++)
		{
			this.worker[i] = new Worker("vwf/model/threejs/terrainGeneratorThread.js");
			this.worker[i].addEventListener('message',this.message.bind(this));
			this.worker[i].postMessage({command:'init',data:null});
			this.currentCB[i] =  null;
			this.currentMesh[i] = null;
			this.currentID[i] =  null;
		}
	}
	this.test = function()
	{
		this.worker[0].postMessage({command:'test',data:null});
	}

	
	this.generateTerrain=function(mesh, normlen, cb){
		
		
		this.generateTerrainSimWorkerHook(mesh,cb);
		
			
	}
	
})()