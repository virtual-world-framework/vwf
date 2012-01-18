define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/editor creates a view interface for editor functions. 

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            window.vwf_view = this;

            this.nodes = {};
            this.scenes = {};
            
            jQuery('body').append(
                "<div id='editor' style='position:relative'><div style='width:100%;text-align:right;position:absolute;left:-10px;top:-20px' onclick='openEditor()'>+</div></div><div class='vwf-tree' id='topdown'><p style='text-align:center;font-weight:bold'>TREE VIEW<hr></p><div style='padding-left:10px'><table id='topdowntree'><tr id='node-0'><td>Scene</td></tr><tr id='node-1' class='child-of-node-0' style='display:none'><td>Child</td></tr></table></div></div>"
            );
        },
        
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childName, callback /* ( ready ) */ ) {
            
            var parent = this.nodes[ nodeID ];
            var node = this.nodes[ childID ] = {
                children: [],
                properties: [],
                events: {},
                methods: {},
                parent: parent,
                parentID: nodeID,
                ID: childID,
                extendsID: childExtendsID,
                source: childSource, 
                name: childName,
            };

            if ( parent ) {
                parent.children.push( node );
            }

            if ( childExtendsID =="http-vwf-example-com-types-glge" || childExtendsID =="appscene-vwf" ) {
                this.scenes[ childID ] = node;
            }

            if( childExtendsID == 'http-vwf-example-com-types-node3' && childName != undefined )
            {     
                if ( nodeID == "index-vwf" ) {
                    // this is a child of the scene, so hard code to attach 
                    // to the root of tree
                    jQuery('#topdowntree').append(
                        "<tr id='node-" + childID + "' class='child-of-node-0'><td style='padding-left: 20px'>" + childName + "</td></tr>"
                    );
                } else {
                    // child of something other than the root, so use the full
                    // id to attach this child to the correct tree view
                    jQuery('#topdowntree').append(
                        "<tr id='node-" + childID + "' class='child-of-node-" + nodeID + "'><td style='padding-left: 20px'>" + childName + "</td></tr>"
                    );                    
                }
                
                $('#topdowntree').treeTable();
            }
        },
        
        createdProperty: function (nodeID, propertyName, propertyValue) {
   
            var node = this.nodes[ nodeID ];
            if ( node ) {
                node.properties.push[ propertyName ];
            }

            if(nodeID.indexOf("http-vwf-example-com-types-node3") != -1)
            {
                var nodeName = nodeID.substring(nodeID.lastIndexOf('-')+1);
                if( nodeName != 'node3' )
                {
                    jQuery('#topdowntree').append(
                        "<tr id='node-" + nodeID + '-' + propertyName + "' class='child-of-node-" + nodeID + "'><td>" + propertyName + ": " + propertyValue + "</td></tr>"
                    );
                    
                    $('#topdowntree').treeTable();
                    //$('#node-0').toggleBranch();
                    //$('#node-0').collapse();
                    //$('#node-0').expand();
                }
            }
        },
        
        //deletedNode: [ /* nodeID */ ],

        //addedChild: [ /* nodeID, childID, childName */ ],
        //removedChild: [ /* nodeID, childID */ ],

        satProperty: function( nodeID, propertyName, propertyValue ) {
            
        },
        //gotProperty: [ /* nodeID, propertyName, propertyValue */ ],

        
        createdMethod: function( nodeID, methodName, methodParameters, methodBody ){
            var node = this.nodes[ nodeID ];
            if ( node ) {
                node.methods[ methodName ] = methodParameters;
            }            
        },
        //calledMethod: [ /* nodeID, methodName, methodParameters */ ],

        createdEvent: function( nodeID, eventName, eventParameters ) {
            var node = this.nodes[ nodeID ];
            if ( node ) {
                node.events[ eventName ] = eventParameters;
            }         
        },

        //firedEvent: [ /* nodeID, eventName, eventParameters */ ],

        //executed: [ /* nodeID, scriptText, scriptType */ ],

        //ticked: [ /* time */ ],
        
    } );


    // -- getPropertyValues -----------------------------------------------------------------

    function getPropertyValues( node ) {
        var pv = {};
        if ( node ) {
            for ( var i = 0; i < node.properties.length; i++ ) {
                pv[ node.properties[i] ] = vwf.getProperty( node.ID, node.properties[i], [] );
            }
        }
        return pv;
    };

    function getChildByName( node, childName ) {
        var childNode = undefined;
        for ( var i = 0; i < node.children.length && childNode === undefined; i++ ) {
            if ( node.children[i].name == childName ) {
                childNode = node.children[i];    
            }
        }
        return childNode;
    };


} );
