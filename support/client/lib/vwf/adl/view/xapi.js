/***************************
 * Provide a per-object interface to the xAPIWrapper
 ***************************/

define( ["module", "vwf/view", "vwf/adl/view/xapi/xapiwrapper.min"], function( module, view ) {

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
				'configureFromURL':null,
				'sendStatements':2};

			// process only if prefixed method is handled, and this client or the system initiated the event
			if( fn.slice(0,5) == 'xapi_' && Object.keys(methods).indexOf(fn.slice(5)) != -1)
			{
				//console.log('XAPI:', id, fn, params);
				var wrapper;

				var clients = vwf.getProperty(vwf.application(),'clients')
				
				
				// no-op if no users are logged in
				
				//since we allow anonymous users to use XAPI, this check is no longer needed.
				/*if( !_UserManager.getPlayers()[0] && fn != 'xapi_configure' ){
					console.log('xAPI module disabled for anonymous clients');
					return;
				}*/

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
				else if( fn === 'xapi_configureFromURL' ){
					console.log('Initializing xAPI for', id, 'with', params[0]);
					this.wrapperOf[id] = new XAPIWrapper(ADL.XAPIWrapper.lrs);
					return;
				}

				// otherwise, just fail
				else {
					console.error(id, 'must initialize the xAPI module before use');
					return;
				}

				var method = fn.slice(5);

				// fail request if they are trying to anonymously post
				/*if( vwf.client() == null && /^send/.test(method) ){
					console.error(id, ': posting to an LRS is only allowed from within events');
					return;
				}*/
				
				//you can configure without clients, but they must be present before any post
				if(!clients) return;
				
				var firstId = clients[Object.keys(clients)[0]].cid;
				var clientId = vwf.moniker();
				if( /^send/.test(method) && !(
					vwf.client() == vwf.moniker() ||
					vwf.client() == null && clientId == firstId)
				){
					console.log('xAPI pass');
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

					case 'configureFromURL':
						wrapper.changeConfig(ADL.XAPIWrapper.lrs);
						break;	

					// if not one of the special cases, just pass params through to wrapper
					default:

						// build a callback that replicates response to other clients
						var successCallback = params[0];
						var callback = function(){
							if( successCallback ){
								vwf_view.kernel.callMethod(id, successCallback, Array.prototype.slice.call(arguments));
							}
						};

						// rearrange args so callback is always in proper position
						var args = params.slice(1);
						while( args.length < methods[method]-1 )
							args.push(null);
						args.push(callback);

						// call the function
						console.log( 'XAPIWrapper.'+method, JSON.stringify(args) );
						wrapper[method].apply(wrapper, args);

						break;

				}
			}
		}

	} );
});
