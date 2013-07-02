function CesiumTerrainAlgorithm(seed) 
{	
	importScripts("jquery.nodom.js");
	this.heightCache  = {res:[]};
	this.getHeight = function(x,y,res)
	{
		var i = this.MapCoordtoTile(x,res);
		var j = this.MapCoordtoTile(y,res);
		if(this.heightCache.res[res] && this.heightCache.res[res][i][j])
		{
			return this.sample(x,y,i,j,res);
		}else
		{
			this.loadTile(i,j,res);
			return this.sample(x,y,i,j,res);
		}
	
	}
	this.MapCoordtoTile = function(x,res)
	{
		return 0;
	}
	this.ToTileRelative = function(x,i,j,res)
	{
		return Math.floor(Math.abs(x)) % 64;
	}
	this.sample = function(x,y,i,j,res)
	{
		var tile = this.heightCache.res[res][i][j];
		x = this.ToTileRelative(x,i,j,res);
		y = this.ToTileRelative(y,i,j,res);
		var k = x*64 + y;
		
		return tile[k]/500.0;
	
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
        xhr.open('GET', "http://cesium.agi.com/smallterrain/10/392/702.terrain", false);
        xhr.send();
		
		this.heightCache.res[res][i][j] = new Int16Array(buff);
		
	}
	this.matrixToRes = function(matrix)
	{
		return 10;
	}
	this.displace= function(vert,matrix)
	{
		return this.getHeight(vert.x,vert.y,matrix[0]);
	}
	
}