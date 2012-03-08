define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/document extends a view interface up to the browser document. When vwf/view/document
    // is active, scripts on the main page may make (reflected) kernel calls:

    //     window.vwf_view.createNode( nodeID, childID, childExtendsID, childImplementsIDs,
    //         childSource, childType, childName, function( childID ) {
    //         ...
    //     } );

    // And receive view calls:

    //     window.vwf_view.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
    //         childSource, childType, childName, callback /* ( ready ) */ ) {
    //         ...
    //     }

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            window.vwf_view = this;
        },
        
    }, function( kernelFunctionName ) {  // TODO: swap kernelGenerator and viewGenerator? we shouldn't need to provide a kernel function generator for view & model modules--only for stages

        // == Kernel API ===========================================================================
        
    }, function( viewFunctionName ) {

        // == View API =============================================================================

    } );

} );
