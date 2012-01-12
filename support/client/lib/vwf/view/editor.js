define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/editor creates a view interface for editor functions. 

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            window.vwf_view = this;
            
            jQuery('body').append(
                "<div id='editor' style='position:relative'><div style='width:100%;text-align:right;position:absolute;left:-10px;top:-20px' onclick='openEditor()'>+</div></div><div class='vwf-tree' id='topdown'><p style='text-align:center;font-weight:bold'>TREE VIEW<hr></p><div style='padding-left:10px'><table id='topdowntree'><tr id='node-0'><td>Scene</td></tr><tr id='node-1' class='child-of-node-0' style='display:none'><td>Child</td></tr></table></div></div>"
            );
        },
        
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childName, callback /* ( ready ) */ ) {
            
            if(childExtendsID == 'http-vwf-example-com-types-node3' && childName != undefined)
            {       
                jQuery('#topdowntree').append(
                    "<tr id='node-" + childID + "' class='child-of-node-0'><td style='padding-left: 20px'>" + childName + "</td></tr>"
                );
            }
        },
        
        createdProperty: function (nodeID, propertyName, propertyValue) {
   
            if(nodeID.indexOf("http-vwf-example-com-types-node3") != -1)
            {
                var nodeName = nodeID.substring(nodeID.lastIndexOf('-')+1);
                if(nodeName != 'node3')
                {
                    jQuery('#topdowntree').append(
                        "<tr id='node-" + nodeID + '-' + propertyName + "' class='child-of-node-" + nodeID + "'><td>" + propertyName + ": " + propertyValue + "</td></tr>"
                    );
                }
            }
        },
        
    } );
} );
