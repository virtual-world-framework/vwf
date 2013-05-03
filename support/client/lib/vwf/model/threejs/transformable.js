(function(){
		function transformable(childID, childSource, childName)
		{
			this.settingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'transform')
                {
					var threeObject = this.getRoot().parent;
					
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
					
					if(!matComp(transform,threeObject.matrix.elements))
					{
						if(threeObject instanceof THREE.ParticleSystem)
						{	
							threeObject.updateTransform(transform);
						}
					
						threeObject.matrixAutoUpdate = false;
						threeObject.matrix.elements = matCpy(transform);
						threeObject.updateMatrixWorld(true);      
						threeObject.sceneManagerUpdate();							
					}

					//signals the driver that we don't have to process further, this prop was handled
					return propertyValue;		
				}						
			}
			this.gettingProperty = function(propertyName,propertyValue)
			{
				if(propertyName == 'transform')
                {
					var threeObject = this.getRoot().parent;
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