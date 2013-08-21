(function(){
		function transformable(childID, childSource, childName)
		{
			this.overrideTransform = false;
			this.DisableTransform = function(){this.overrideTransform = true;}
			this.EnableTransform = function(){this.overrideTransform = false;}
			this.TransformEnabled = function(){return !this.overrideTransform;}
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(!this.TransformEnabled()) { return propertyValue};
				if(propertyName == 'transform')
                {
					
					var threeObject = this.getRoot().parent;
					if(this.getRoot().initializedFromAsset)
						threeObject = this.getRoot();
					var transform = goog.vec.Mat4.createFromArray( propertyValue || [] );

					// Rotate 90 degress around X to convert from VWF Z-up to MATH Y-up.
					if ( threeObject instanceof THREE.Camera ) {
						var columny = goog.vec.Vec4.create();
						goog.vec.Mat4.getColumn( transform, 1, columny );
						var columnz = goog.vec.Vec4.create();
						goog.vec.Mat4.getColumn( transform, 2, columnz );
						goog.vec.Mat4.setColumn( transform, 1, columnz );
						goog.vec.Mat4.setColumn( transform, 2, goog.vec.Vec4.negate( columny, columny ) );
					}
					
					if(!matComploose(transform,threeObject.matrix.elements))
					{
						if(threeObject instanceof THREE.ParticleSystem)
						{	
							threeObject.updateTransform(transform);
						}
						
						threeObject.matrixAutoUpdate = false;
						threeObject.matrix.elements = matCpy(transform);
						threeObject.updateMatrixWorld(true);      
						_SceneManager.setDirty(threeObject);							
					}

					//signals the driver that we don't have to process further, this prop was handled
					return propertyValue;		
				}						
			}
			this.gettingProperty = function(propertyName,propertyValue)
			{
				if(!this.TransformEnabled()) { return propertyValue};
				if(propertyName == 'transform')
                {
					var threeObject = this.getRoot().parent;
					if(this.getRoot().initializedFromAsset)
						threeObject = this.getRoot();
					var value = matCpy(threeObject.matrix.elements); 
					
					if ( threeObject instanceof THREE.Camera ) {
						var columny = goog.vec.Vec4.create();
						goog.vec.Mat4.getColumn( value, 1, columny );
						var columnz = goog.vec.Vec4.create();
						goog.vec.Mat4.getColumn( value, 2, columnz );
						goog.vec.Mat4.setColumn( value, 2, columny );
						goog.vec.Mat4.setColumn( value, 1, goog.vec.Vec4.negate( columnz, columnz ) );
					}
					
					var ret =  value;
					return ret;
                }
			}
		}
		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new transformable(childID, childSource, childName);
        }
})();