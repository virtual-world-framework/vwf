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
			var obj = new this.type();
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
			//if(obj.length) obj.length = 0;
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
		this.allocate = function(type,p)
		{
			if(!window._ALLOC_Manual)
				return new type;
			if(!this.pools[type])
			{
				this.pools[type] = new ObjectPool(type);
			}
			return this.pools[type].getNew(p);
		}
		this.deallocate = function(obj)
		{
			if(!obj) return;
			if(this.pools[obj.constructor])
				this.pools[obj.constructor].free(obj);
		}
		window._ALLOC_Manual = true;
		window._DEALLOC = this.deallocate.bind(this);
		window._ALLOC = this.allocate.bind(this);
		window._ObjectPools = this;
	}
});
