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
				'testConfig',
				'getActivities',
				'getActivityProfile',
				'getAgentProfile',
				'getAgents',
				'getState',
				'getStatements',
				'sendActivityProfile',
				'sendAgentProfile',
				'sendState',
				'sendStatement',
				'sendStatements'];

			if( fn.slice(0,5) == 'xapi_' && methods.indexOf(fn.slice(5)) != -1 )
			{
				console.log('XAPI:', id, fn, params);

				var wrapper;

				// if an obj has already initialized, use that
				if( id in this.wrapperOf ){
					wrapper = this.wrapperOf[id];
				}

				// if they're trying to initialize, do that
				else if( fn === 'xapi_configure' ){
					console.log('Initializing xAPI for', id, 'with', params);
					this.wrapperOf[id] = new XAPIWrapper(params);
					return;
				}

				// otherwise, just fail
				else {
					console.error(id, 'must initialize the xAPI module before use');
					return;
				}

				// build a callback that replicates response to other clients
				var successCallback = params[0];
				var callback = function(data){
					console.log('Callback arguments:', arguments);
					if( successCallback ){
						vwf_view.kernel.callMethod(id, successCallback, [data]);
					}
				};

				// select based on call method
				switch(fn.slice(5))
				{
					// reconfigure
					case 'configure':
						wrapper.changeConfig(params);
						break;

					case 'testConfig':
						console.log('testConfig result:', wrapper.testConfig());
						break;


					// if not one of the special cases, just pass params through to wrapper
					default:
						console.log('Default path');
						var args = params.splice(1);
						args.push(callback);
						console.log(wrapper, fn.slice(5), args);
						wrapper[fn.slice(5)].apply(wrapper, args);
						break;

				}
			}
		}

	} );
});
