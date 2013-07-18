function CesiumTerrainAlgorithm(seed) 
{	
	
	this.heightCache  = {res:[]};
	this.getHeight = function(x,y,res)
	{
	
		
		
		return this.sample(x,y,res);
		
	
	}
	this.MapCoordtoTile = function(x,res)
	{
		return 0;
	}
	this.ToTileRelative = function(x,i,j,res)
	{
		return Math.floor(x);
	}
	
	this.cubicInterpolate = function(p, x) 
	{
		return p[1] + 0.5 * x*(p[2] - p[0] + x*(2.0*p[0] - 5.0*p[1] + 4.0*p[2] - p[3] + x*(3.0*(p[1] - p[2]) + p[3] - p[0])));
	}
	this.bicubicInterpolate = function(p, x, y)
	{
		var arr = [];
		arr[0] = this.cubicInterpolate(p[0], y);
		arr[1] = this.cubicInterpolate(p[1], y);
		arr[2] = this.cubicInterpolate(p[2], y);
		arr[3] = this.cubicInterpolate(p[3], y);
		return this.cubicInterpolate(arr, x);
	}
	this.getTile = function(i,j,res)
	{
		if(!this.heightCache.res[res] || !this.heightCache.res[res][i] || ! this.heightCache.res[res][i][j])
		{
			
			this.loadTile(i,j,res);
			
		}
		return this.heightCache.res[res][i][j];	
	}
	this.at = function(tiles,x,y)
	{
		
		
		var index = 0;
		if( x >= 65 && y >= 65) {index = 3; x = x-65; y = y-65;}
		if( x >= 65 && y < 65 && y >= 0) {index = 1; x = x-65;}
		if( x >= 65 && y < 0) {index = 7; x = x-65; y+= 65;}
		
		
		if(x < 65 && x >= 0 && y >= 65 ) {index = 2; y = y-65;}
		if(x < 0 && y >= 65 ) {index = 8; y = y-65; x += 65;}
		
		if( x < 65 && x >= 0 && y < 0 ) {index = 5; y = 65+y;}
		if( x < 0 && y < 0 ) {index = 6; y = 65+y; x += 65;}
		
		if( x < 0 && y >= 0 && y < 65 ) {index = 4; x = 65+x;}
		
		var i = x * 65  + y;
		if(i > tiles[index].length || i < 0)
			console.log(x + " " +y+ " "+ index);
		return tiles[index][i];
	}
	this.sample = function(u,v,res)
	{
		
		
		
		if(!self.importScripts)
			return 0;
		
		
		u /= 9480;    //the horizontal size in real meters of a level 10 cesium tile
		v /= 9480;
		var i = Math.floor(v);
		var j = Math.floor(u);
		u -= j;
		v -= i;
		//i = 0;
		//j = 0;
		var tile00 = this.getTile(i,j,0);
		var tile10 = this.getTile(i-1,j-0,0);
		var tile01 = this.getTile(i-0,j-1,0);
		var tile11 = this.getTile(i-1,j-1,0);
		var tilen10 = this.getTile(i+1,j+0,0);
		var tile0n1 = this.getTile(i+0,j+1,0);
		var tilen1n1 = this.getTile(i+1,j+1,0);
		var tile1n1 = this.getTile(i-1,j+1,0);
		var tilen11 = this.getTile(i+1,j-1,0);
		
		var tiles = [tile00,tile10,tile01,tile11,tilen10,tile0n1,tilen1n1,tile1n1,tilen11];
		
		var x = Math.floor(v * 64);
		var y = Math.floor(u * 64);
		
		u = (u * 64) - Math.floor(u * 64);
		v = (v * 64) - Math.floor(v * 64);
		var p = [];
		var t = x;
		x = y;
		y = t;
		t = u;
		u = v;
		v = t;
		p[0] = [this.at(tiles,x-1,y-1),this.at(tiles,x-0,y-1),this.at(tiles,x+1,y-1),this.at(tiles,x+2,y-1)];
		p[1] = [this.at(tiles,x-1,y-0),this.at(tiles,x-0,y-0),this.at(tiles,x+1,y-0),this.at(tiles,x+2,y-0)];
		p[2] = [this.at(tiles,x-1,y+1),this.at(tiles,x-0,y+1),this.at(tiles,x+1,y+1),this.at(tiles,x+2,y+1)];
		p[3] = [this.at(tiles,x-1,y+2),this.at(tiles,x-0,y+2),this.at(tiles,x+1,y+2),this.at(tiles,x+2,y+2)];
		
		//return this.at(tiles,x,y)/25.0;
		
		return this.bicubicInterpolate(p,u,v)/5.0 - 1000.0;
	
	
	}
	function str2ab(str) {
	  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
	  var bufView = new Uint16Array(buf);
	  for (var i=0, strLen=str.length; i<strLen; i++) {
		bufView[i] = str.charCodeAt(i);
	  }
	  return bufView;
	}
	this.loadTile = function(i,j,res)
	{	
	
		
		if(!this.heightCache.res)
			this.heightCache.res = [];
		if(!this.heightCache.res[res])
			this.heightCache.res[res] = [];	
		if(!this.heightCache.res[res][i])
			this.heightCache.res[res][i] = [];		
			if(!this.heightCache.res[res][i][j])
			
			

		
		var buff;
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'arraybuffer';
        xhr.onload = function(e) {
            if (xhr.status === 200) {
              buff = xhr.response;
            } 
        };
        xhr.open('GET', "http://cesium.agi.com/smallterrain/10/"+(392+i)+"/"+(702-j)+".terrain", false);
        xhr.send();
		
		this.heightCache.res[res][i][j] = new Int16Array(65*65);
		var data = this.heightCache.res[res][i][j];
		var DV = new DataView(buff);
		for(var i = 0; i < 65; i++)
		for(var j = 0; j < 65; j++)
		{
			data[i * 65 + j] = DV.getInt16(2 * (i * 65 + j),true);
		}
		
		
	}
	this.matrixToRes = function(matrix)
	{
		return 10;
	}
	this.displace= function(vert,matrix)
	{
		return this.getHeight(vert.x,vert.y,matrix?matrix[0]:0);
	}
	
	
	this.init = function()
	{
		if(self.importScripts)
			importScripts("jquery.nodom.js");
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function()
	{
		
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(seed)
	{
		
	}
	this.setAlgorithmDataPool = function(seed)
	{
		
		
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(data)
	{
		
	}
	this.getAlgorithmDataPool = function(seed)
	{
		
	}
	this.forceTileRebuildCallback = function()
	{
		return true;
	}
}