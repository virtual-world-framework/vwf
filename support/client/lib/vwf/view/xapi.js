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
			if( ['xapiConfigure'].indexOf(fn) != -1 )
			{
				console.log('XAPI:', id, fn, params);

				var wrapper;

				// if an obj has already initialized, use that
				if( id in this.wrapperOf ){
					wrapper = this.wrapperOf[id];
				}

				// if they're trying to initialize, do that
				else if( fn === 'xapiConfigure' ){
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
					case 'xapiConfigure':
						wrapper.changeConfig(params);
						break;
				}
			}
		}

	} );
});
