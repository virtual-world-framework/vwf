(function(){
		function visible(childID, childSource, childName)
		{
			this.visible = true;
			

			this.vWalk = function(node,val)
			{
				node.visible = val;
				if(!node.vwfID && node.children)
				{
					for(var i=0; i < node.children.length; i++)
						this.vWalk(node.children[i],val);
				}


			}
			this.settingProperty = function(propname,propval)
			{
				if(propname == 'visible')
				{
					this.visible = propval;
					if(!this.gettingProperty('isStatic'))
					{
						this.vWalk(this.getRoot(),this.visible);
						if(this.getRoot().initializedFromAsset)
						{
							for(var i=0; i < this.getRoot().children.length; i++)
								this.vWalk(this.getRoot().children[i],propval);
						}
					}
					return propval;
				}
				
			}
			this.gettingProperty = function(propname,propval)
			{
				if(propname == 'visible')
				{
					return this.visible;	
				}
			}
		}


		//default factory code
        return function(childID, childSource, childName) {
			//name of the node constructor
            return new visible(childID, childSource, childName);
        }
})();