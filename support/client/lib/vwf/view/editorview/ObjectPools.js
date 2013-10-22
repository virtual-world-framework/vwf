define(function()
{

	var ObjectPools = {};
	var isInitialized = false;
	return {
		getSingleton: function ()
		{
			if (!isInitialized)
			{
				initialize.call(ObjectPools);
				isInitialized = true;
			}
			return ObjectPools;
		}
	}

	function ObjectPool(type)
	{
		this.type = type;
		this.used = [];
		this.objects = [];
		this.freeCount = 0;
		this.count = 0;
		this._allocate = function(parms)
		{

			var obj;

			if(this.type === 0)
				obj = [];
			else
				obj = new _ObjectPools.__PoolTypes[this.type]();

			Object.defineProperty(obj,"__POOLTYPE",{enumerable:false,configurable:false,value:this.type})
			//if(parms)
			//	this.type.apply(obj,parms);
			this.objects.push(obj);
			this.used.push(true);
			this.count++;
			return obj;
		}
		this.getNew = function(parms)
		{
			
			if(this.getFreeCount() == 0)
			{
				return this._allocate(parms);
			}else
			{
				for(var i = 0; i < this.getCount(); i++)
				{
					if(this.used[i] == false)
					{
						this.used[i] = true;
						this.freeCount--;
						//if(parms)
						//	this.type.apply(this.objects[i],parms);
						return this.objects[i];

					}
				}

			}
		}
		this.cleanObject = function(obj)
		{
			for(var i in obj)
			{
				var val = obj[i];
				_DEALLOC(val);
				obj[i] = null;
			}
			if(obj.__POOLTYPE === 0) obj.length = 0;
		}
		this.free = function(obj)
		{
			var i = this.objects.indexOf(obj);
			if(i == -1) return;
			this.used[i] = false;
			this.freeCount++;
			this.cleanObject(obj);
		}
		this.getCount = function()
		{
			return this.count;
		}
		this.getFreeCount = function()
		{
			return this.freeCount;
		}
		this.getUsedCount = function()
		{
			return this.count - this.freeCount;
		}

	}

	function initialize()
	{
		
		this.pools = {};
		this.registerType = function(type)
		{
			this.__PoolTypes.push(type);
			return this.__PoolTypes.length -1;
		}
		this.__PoolTypes = [];
		this.allocate = function(type,p)
		{
			if(!window._ALLOC_Manual)
				return new _ObjectPools.__PoolTypes[type]();
			if(!this.pools[type])
			{
				this.pools[type] = new ObjectPool(type);
			}
			return this.pools[type].getNew(p);
		}
		this.deallocate = function(obj)
		{
			if(!window._ALLOC_Manual)
				return;

			if(!obj) return;
			if(this.pools[obj.__POOLTYPE])
				this.pools[obj.__POOLTYPE].free(obj);
		}
		this.ARRAY = this.registerType(Array);
		this.NUMBER = this.registerType(Number);
		window._ALLOC_Manual = false;
		window._DEALLOC = this.deallocate.bind(this);
		window._ALLOC = this.allocate.bind(this);
		window._ObjectPools = this;
	}
});
