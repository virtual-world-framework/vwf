/***************************
 * Provide a per-object interface to the xAPIWrapper
 ***************************/

define( ["module", "vwf/view"], function( module, view ) {

	return view.load( module, {

		initialize : function()
		{
			
		},

		calledMethod: function(id,name,params)
		{
			if( name == 'herpderp' )
				console.log('xapi method called:', id, name, params);
		}

	} );
});
