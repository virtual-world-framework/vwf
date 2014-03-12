define([],function(){


		var self = null;
		self =  {
	

//A watchable property will call the VWF set property kernel code when it's values are changed
		_Watchable : function()
		{
			Object.defineProperty(this,'internal_val',{configurable:true,enumerable:false,writable:true});
			Object.defineProperty(this,'propertyname',{configurable:true,enumerable:false,writable:true});
			Object.defineProperty(this,'id',{configurable:true,enumerable:false,writable:true});
			Object.defineProperty(this,'masterval',{configurable:true,enumerable:false,writable:true});
			Object.defineProperty(this,'dotNotation',{configurable:true,enumerable:false,writable:true});
		
		},
//Set up a watchable to mirror an object (including named properties)
		// note - we currently can't detect assignment of new properties to an object
		//should probably create a function to accomplish that
		setupWatchableObject: function (watchable,val,propertyname,id,masterval,dotNotation)
		{
				if(masterval === undefined)
					masterval = val;
				
				watchable.internal_val = val;
				watchable.propertyname = propertyname;
				watchable.id = id;
				watchable.masterval = masterval;
				var keys = Object.keys(val);
				for(var i = 0; i < keys.length; i++)
				{
					(function(){
					
					var _i = keys[i];
					
					Object.defineProperty(watchable,_i,{set:function(value){
						this.internal_val[_i] = value; 
						
						self.setWatchableValue(this.id,this.propertyname,this.internal_val,this.dotNotation);
					},
					get:function(){
						var ret = this.internal_val[_i];
						//This recursively builds new watchables, such that you can do things like
						//this.materialDef.layers[0].alpha -= .1;
						ret =  self.createWatchable(ret,this.propertyname,this.id,this.masterval,this.dotNotation+'%'+_i);
						return ret;
					},configurable:true,enumerable:true});
					})();
				}
				
				Object.defineProperty(watchable,'defineProperty',{
				value:function(name,newvalue)
				{
					Object.defineProperty(this,name,{set:function(value){
						this.internal_val[name] = value; 
						
						self.setWatchableValue(this.id,this.propertyname,this.internal_val,this.dotNotation);
					},
					get:function(){
						var ret = this.internal_val[name];
						//This recursively builds new watchables, such that you can do things like
						//this.materialDef.layers[0].alpha -= .1;
						ret =  self.createWatchable(ret,this.propertyname,this.id,this.masterval,this.dotNotation+'%'+name);
						return ret;
					},configurable:true,enumerable:true});
					this[name] = newvalue;
				
				
				}
				,configurable:true,enumerable:true});
				
		
		
		
		},
		//Setup a watchable to behave like an array. This creates accessor functions for the numbered integer properties.
		
		setupWatchableArray: function (watchable,val,propertyname,id,masterval,dotNotation)
		{
				if(masterval === undefined)
					masterval = val;
					
				
				watchable.internal_val = val;
				watchable.propertyname = propertyname;
				watchable.id = id;
				watchable.masterval = masterval;
				for(var i = 0; i < val.length; i++)
				{
					(function(){
					
					var _i = i;
					
					
					Object.defineProperty(watchable,_i,{set:function(value){
						this.internal_val[_i] = value; 
						
						self.setWatchableValue(this.id,this.propertyname,this.internal_val,this.dotNotation);
					},
					get:function(){
						var ret = this.internal_val[_i];
						//This recursively builds new watchables, such that you can do things like
						//this.materialDef.layers[0].alpha -= .1;
						ret =  self.createWatchable(ret,this.propertyname,this.id,this.masterval,this.dotNotation+'['+_i+']');
						return ret;
					},configurable:true,enumerable:true});
					})();
				}
				
				//Hookup some typical Array functions.
				watchable.push = function(newval)
				{
					var internal = this.internal_val;
					internal.push(newval);
					self.setWatchableValue(this.id,this.propertyname,this.internal_val,this.dotNotation);
					self.setupWatchableArray(this,internal,this.propertyname,this.id,this.masterval,this.dotNotation);
				}
				watchable.indexOf = function(val)
				{
					return this.internal_val.indexOf(val);
				}
				for(var i = 0; i < 7; i++) 
				{
					var func = ['pop','shift','slice','sort','splice','unshift','shift'][i];
					
					(function setupWatchableArrayVal(funcname){
					watchable[funcname] = function()
					{
						var internal = this.internal_val;
						
						Array.prototype[funcname].apply(internal,arguments)
						self.setWatchableValue(this.id,this.propertyname,this.internal_val,this.dotNotation);
						self.setupWatchableArray(this,internal,this.propertyname,this.id,this.masterval,this.dotNotation);
					}
					})(func);
				}
				
				Object.defineProperty(watchable,'length',{
					get:function(){
						return watchable.internal_val.length;
					},configurable:true,enumerable:true});
			
		
		},
		__WatchableCache : {},
		setValueByDotNotation : function(root,dot,val)
		{
			dot.replace(/\[/g,'%');
			dot.replace(/\]/g,'%');
			var names = dot.split('%');
			while(names.indexOf('') != -1)
			   names.splice(names.indexOf(''),1);
			   
			for(var i =0; i < names.length-1; i++)
			{
				root = root[names[i]];
			
			}
			root[names[names.length -1]] = val;
		
		},
		setWatchableValue: function(id, propertyName, value, dotNotation)
		{
			
			var masterid = dotNotation.substring(0,(dotNotation.indexOf('%') +1 || dotNotation.indexOf('[') +1) -1)
			masterid = masterid || dotNotation;
			if(this.__WatchableCache[masterid])
			{
				
				this.setValueByDotNotation(this.__WatchableCache[masterid], "masterval%" + dotNotation.substr(masterid.length), value);
				this.setValueByDotNotation(this.__WatchableCache[masterid], "internal_val%" + dotNotation.substr(masterid.length), value);
				this.__WatchableSetting ++;
				;
				
					
				self.kernel.setProperty(id,propertyName,this.__WatchableCache[masterid].masterval);

				//because we've set the value of the root watchable, we need to invalidate the cache of all child watchables
				for(var i in this.__WatchableCache)
				{
					//all child watchable keys start with the master watchable key
					if(i.indexOf(dotNotation) == 0 && i.length > dotNotation.length)
					{
						delete this.__WatchableCache[i]; 
					}
				}
				
				this.__WatchableSetting --;
				
				
			}else
			{	this.__WatchableSetting ++;
				

				
				self.kernel.setProperty(id,propertyName,value);
				
				this.__WatchableSetting --;
				
			}
			
			
		},
		__WatchableSetting : 0,
        // -- initializingProperty -----------------------------------------------------------------
		//create a new watchable for a given value. Val is the object itself, and masterval is the root property of the node
		createWatchable : function(val,propertyname,id,masterval,dotNotation)
		{
			
			
			
			
			
			if(!val) return val;
			
			if(val instanceof self._Watchable)
			{
				return self.createWatchable(val.internal_val,propertyname,id,undefined,dotNotation)
			
			}
			
			if(masterval === undefined)
					masterval = val;
			
			if(val.constructor == Array || val instanceof Float32Array)
			{
				
				if(this.__WatchableCache[dotNotation])
				{
					this.__WatchableCache[dotNotation].internal_val = val;
					return this.__WatchableCache[dotNotation];
				}
				
				var watchable = new self._Watchable();
				watchable.dotNotation = dotNotation;
				self.setupWatchableArray(watchable,val,propertyname,id,masterval,dotNotation);
				this.__WatchableCache[dotNotation] = watchable;
				return watchable;
			}
			else if(val.constructor == Object)
			{
				//don't create a watchable when the property value returned is a reference to a node. This just creates all sorts of madness
				if(val.extends)
					return val;

				if(this.__WatchableCache[dotNotation])
				{
					this.__WatchableCache[dotNotation].internal_val = val;
					return this.__WatchableCache[dotNotation];
				}
			
				var watchable = new self._Watchable();
				watchable.dotNotation = dotNotation;
				self.setupWatchableObject(watchable,val,propertyname,id,masterval,dotNotation);
				this.__WatchableCache[dotNotation] = watchable;
				return watchable;
			
			}else
			{
				//if the object is a primitive type, then we catch modifications to it
				//when it is set. 
				
				//We may have to handle strings here.....
				return val;
			}
		
		
		},
		//If you execute this.transform = this.transform, then the setter will get a watchable. Need to strip that before sending it back into the kernel.
		watchableToObject : function(watchable)
		{	
			
			if(!watchable) return watchable;
			
			if(watchable instanceof self._Watchable)
			{
				
				return watchable.internal_val;
			}
			else
			{
				
				return watchable;
			}
		
		},




}

return self;

});