/***************************
 * Provide a per-object interface to the xAPIWrapper
 ***************************/

define( ["module", "vwf/view", "vwf/view/editorview/sha256", "vwf/view/editorview/_3DRIntegration"], function( module, view ) {

	return view.load( module, {

		initialize : function()
		{
			// pull in the xapi wrapper
			$('<script type="text/javascript" src="vwf/view/xapi/xapiwrapper.js"></script>').appendTo('head');

			// initialize object mappings
			this.wrapperOf = {};
		},

		calledMethod: function(id,fn,params)
		{
			var methods = [
				'xapi_configure',
				'xapi_getActivities',
				'xapi_getActivityProfile',
				'xapi_getAgentProfile',
				'xapi_getAgents',
				'xapi_getState',
				'xapi_getStatements',
				'xapi_prepareStatement',
				'xapi_sendActivityProfile',
				'xapi_sendAgentProfile',
				'xapi_sendState',
				'xapi_sendStatement',
				'xapi_sendStatements'];

			if( methods.indexOf(fn) != -1 )
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
				switch(fn)
				{
					case 'xapi_configure':
						wrapper.changeConfig(params);
						break;
					case 'xapi_getActivities':
					case 'xapi_getActivityProfile':
					case 'xapi_getAgentProfile':
					case 'xapi_getAgents':
					case 'xapi_getState':
					case 'xapi_getStatements':
					case 'xapi_prepareStatement':
					case 'xapi_sendActivityProfile':
					case 'xapi_sendAgentProfile':
					case 'xapi_sendState':
					case 'xapi_sendStatement':
					case 'xapi_sendStatements':
						break;

				}
			}
		}

	} );
});
