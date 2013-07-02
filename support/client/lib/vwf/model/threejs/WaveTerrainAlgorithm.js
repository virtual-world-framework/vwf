function WaveTerrainAlgorithm() 
{	
	this.displace= function(vert)
	{
		var z = 0;
		z += Math.sin(vert.y / 100) * 10;
		z += Math.cos(vert.x / 100) * 10;
		return z;
	}
}