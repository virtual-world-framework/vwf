function WaveTerrainAlgorithm() 
{	
	this.init = function(data)
	{
		console.log(data);
		
	}
	//This can generate data on the main thread, and it will be passed to the coppies in the thread pool
	this.poolInit = function()
	{
		return 65;
	}
	//This is the settings data, set both main and pool side
	this.setAlgorithmData = function(seed)
	{
		
	}
	this.setAlgorithmDataPool = function(seed)
	{
		this.seed = seed;
		
	}
	this.getAlgorithmDataPool = function(seed)
	{
		return this.seed;
	}
	this.forceTileRebuildCallback = function()
	{
		return true;
	}
	this.displace= function(vert)
	{
		var z = 0;
		z += Math.sin(vert.y / 100) * 10;
		z += Math.cos(vert.x / 100) * 10;
		return z;
	}
	
	
}