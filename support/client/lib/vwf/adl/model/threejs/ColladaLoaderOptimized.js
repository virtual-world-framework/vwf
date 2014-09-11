function ColladaLoaderOptimized()
{
	this.loader = new THREE.ColladaLoader();	
}
ColladaLoaderOptimized.prototype.optimize = function(root)
{

	if(root instanceof THREE.Geometry || root instanceof THREE.BufferGeometry)
    {
        root.GenerateBounds();
        root.BuildRayTraceAccelerationStructure();
    }
    if(root.children)
    {
        for(var i =0;i < root.children.length; i++)
            this.optimize(root.children[i]);
    }
    if(root.geometry)
    {
    	//for meshes that do not have animation, go ahead and convert to buffer geometry
        if(!root.animationHandle)
        {
        	console.log('optimizing geometry');
            root.geometry = THREE.BufferGeometryUtils.fromGeometry( root.geometry );
            if(root.material instanceof THREE.MeshFaceMaterial)
                root.material = root.material.materials[0];
        }
             

        this.optimize(root.geometry);
    }


}
ColladaLoaderOptimized.prototype.cleanup = function()
{
	this.loader.cleanup();
}
ColladaLoaderOptimized.prototype.load = function(url,success,fail)
{
	var self = this;
	this.loader.load(url,function(asset)
	{
		delete asset.dae;
		self.loader.cleanup();
		self.optimize(asset.scene);
		success(asset);
	},function(e){
		fail(e);
	});
}