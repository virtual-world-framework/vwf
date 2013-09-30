(function(){
		function camera(childID, childSource, childName, childType, assetSource, asyncCallback, assetRegistry)
		{

			this.inherits = ['vwf/model/threejs/transformable.js'];
			this.initializingNode = function()
			{
				this.near = 1;
				this.far = 1000;
				this.fov = 45;
			}
			this.gettingProperty = function(propertyName)
			{
				if(propertyName == 'near')
					return this.near;
				if(propertyName == 'far')
					return this.far;
				if(propertyName == 'fov')
					return this.fov;
			}
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'near')
				{
					this.near = propertyValue;
					this.rootnode.near = this.near;
					this.rootnode.updateProjectionMatrix();
				}
				if(propertyName == 'far')
				{
					this.far = propertyValue;
					this.rootnode.far = this.far;
					this.rootnode.updateProjectionMatrix();
				}
				if(propertyName == 'fov')
				{
					this.fov = propertyValue;
					this.rootnode.fov = this.fov;
					this.rootnode.updateProjectionMatrix();
				}
			}
			//must be defined by the object
			this.getRoot = function()
			{
				return this.rootnode;
			}
			this.rootnode = new THREE.PerspectiveCamera();
			this.rootnode.fov = 45;
			this.rootnode.far = 1000;
			this.rootnode.near = 1;
			this.rootnode.aspect = 1;
			
			this.rootnode.updateProjectionMatrix();
			this.deletingNode = function()
			{
				
				
			}
		}
		//default factory code
        return function(childID, childSource, childName, childType, assetSource, asyncCallback) {
			//name of the node constructor

	    
            return new camera(childID, childSource, childName, childType, assetSource, asyncCallback, this.assetRegistry);
        }
})();