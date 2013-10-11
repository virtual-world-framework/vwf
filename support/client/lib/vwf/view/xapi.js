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
			var methods = {
				'configure':null,
				'testConfig':null,
				'getActivities':2,
				'getActivityProfile':4,
				'getAgentProfile':4,
				'getAgents':2,
				'getState':6,
				'getStatements':3,
				'sendActivityProfile':6,
				'sendAgentProfile':6,
				'sendState':8,
				'sendStatement':2,
				'sendStatements':2};

			// process only if prefixed method is handled, and this client or the system initiated the event
			if( fn.slice(0,5) == 'xapi_' && Object.keys(methods).indexOf(fn.slice(5)) != -1
			&& (vwf.client() == null || vwf.client() == vwf.moniker()) )
			{
				console.log('XAPI:', id, fn, params);
				//console.log('Client:', vwf.client(), 'Moniker:', vwf.moniker());
				var wrapper;

				// if an obj has already initialized, use that
				if( id in this.wrapperOf ){
					wrapper = this.wrapperOf[id];
				}

				// if they're trying to initialize, do that
				else if( fn === 'xapi_configure' ){
					console.log('Initializing xAPI for', id, 'with', params[0]);
					this.wrapperOf[id] = new XAPIWrapper(params[0]);
					return;
				}

				// otherwise, just fail
				else {
					console.error(id, 'must initialize the xAPI module before use');
					return;
				}

				var method = fn.slice(5);

				// fail request if they are trying to anonymously post
				if( vwf.client() == null && /^send/.test(method) ){
					console.error(id, ': posting to an LRS is only allowed from within events');
					return;
				}

				// select based on call method
				switch(method)
				{
					// reconfigure
					case 'configure':
						console.log('Reconfiguring xAPI for', id, 'with', params[0]);
						wrapper.changeConfig(params[0]);
						break;

					case 'testConfig':
						console.log('testConfig result:', wrapper.testConfig());
						break;

					// if not one of the special cases, just pass params through to wrapper
					default:

						// build a callback that replicates response to other clients
						var successCallback = params[0];
						var callback = function(xhr){
							if( successCallback ){
								vwf_view.kernel.callMethod(id, successCallback, [xhr]);
							}
						};

						// rearrange args so callback is always in proper position
						var args = params.slice(1);
						while( args.length < methods[method]-1 )
							args.push(undefined);
						args.push(callback);

						// call the function
						wrapper[fn.slice(5)].apply(wrapper, args);

						break;

				}
			}
		}

	} );
});
