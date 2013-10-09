/***************************
 * Provide a per-object interface to the xAPIWrapper
 ***************************/

define( ["module", "vwf/view", "vwf/view/xapi/xapiwrapper"], function( module, view ) {

	return view.load( module, {

		initialize : function()
		{
			// initialize object mappings
			this.wrapperOf = {};
		},

		calledMethod: function(id,fn,params)
		{
			var methods = [
				'configure',
				'getActivities',
				'getActivityProfile',
				'getAgentProfile',
				'getAgents',
				'getState',
				'getStatements',
				'prepareStatement',
				'sendActivityProfile',
				'sendAgentProfile',
				'sendState',
				'sendStatement',
				'sendStatements'];

			if( methods.indexOf(fn.slice(5)) != -1 )
			{
				console.log('XAPI:', id, fn, params);

				var wrapper;

				// if an obj has already initialized, use that
				if( id in this.wrapperOf ){
					wrapper = this.wrapperOf[id];
				}

				// if they're trying to initialize, do that
				else if( fn === 'xapi_configure' ){
					this.wrapperOf[id] = new XAPIWrapper(params);
					return;
				}

				// otherwise, just fail
				else {
					console.error(id, 'must initialize the xAPI module before use');
					return;
				}


				// select based on call method
				switch(fn.slice(5))
				{
					// reconfigure
					case 'configure':
						wrapper.changeConfig(params);
						break;

					// if not one of the special cases, just pass params through to wrapper
					default:
						wrapper[fn.slice(5)].apply(wrapper, params)
						break;

				}
			}
		}

	} );
});
