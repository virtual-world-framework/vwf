define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/editor creates a view interface for editor functions. 

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            window.vwf_view = this;

            this.nodes = {};
            this.scenes = {};
            
            jQuery('body').prepend(
                "<div id='editor' class='relClass'><div class='eImg'><img id='launchEditor' src='images/editor.png' style='pointer-events:all' alt='launchEditor' /></div></div><div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='topdown'></div></div></div>"
            );
            
            $('#launchEditor').stop().animate({ opacity:0.0 }, 0);
            
            jQuery('#launchEditor').mouseenter( function(evt) { 
                evt.stopPropagation();
                $('#launchEditor').stop().animate({ opacity:1.0 }, 500);
                return false; 
            });
            
            jQuery('#launchEditor').mouseleave( function(evt) { 
                evt.stopPropagation(); 
                $('#launchEditor').stop().animate({ opacity:0.0 }, 500);
                return false; 
            });
            
            jQuery('#launchEditor').click ( function(evt) {
                openEditor();
            });

            $('#topdown').hide();
            
            var canvas = document.getElementById("index-vwf");
            $('#topdown').height(canvas.height);
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
        },
        
        createdProperty: function (nodeID, propertyName, propertyValue) {
   
            var node = this.nodes[ nodeID ];
            var property = node.properties[ propertyName ] = {
                name: propertyName,
                value: propertyValue,
            };
            
            if ( node ) {
                node.properties.push( property );
            }
        },
        
        //deletedNode: [ /* nodeID */ ],

        //addedChild: [ /* nodeID, childID, childName */ ],
        //removedChild: [ /* nodeID, childID */ ],

        satProperty: function (nodeID, propertyName, propertyValue) {
            var node = this.nodes[ nodeID ];
            node.properties[ propertyName ].value = propertyValue;
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

        //firedEvent: function ( nodeID, eventName, eventParameters ) {
        //},

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
    
    // -- getChildByName --------------------------------------------------------------------
    
    function getChildByName( node, childName ) {
        var childNode = undefined;
        for ( var i = 0; i < node.children.length && childNode === undefined; i++ ) {
            if ( node.children[i].name == childName ) {
                childNode = node.children[i];    
            }
        }
        return childNode;
    };
    
    // -- openEditor ------------------------------------------------------------------------
    
    var editorVisible = false;
        
    function openEditor()
    {
        if(!editorVisible)
        {
            editorVisible = true;
            drillDown.call(this, "index-vwf");
            $('#topdown').show('slide', {direction: 'right'}, 500); 
            $('#editor').animate({ 'left' : "-=260px" }, 500);
        }
        else
        {
            editorVisible = false;
            $('#topdown').hide('slide', {direction: 'right'}, 500); 
            $('#editor').animate({ 'left' : "+=260px" }, 500);
        }
    }
    
    // -- drillDown -------------------------------------------------------------------------

    function drillDown(nodeID)
    {
        var node = window.vwf_view.nodes[ nodeID ];
     
        if(nodeID == "index-vwf") node.name = "index";
        
        $('#topdown').html("<p>" + node.name + "<hr noshade='noshade'></p>");
        
        for ( var i = 0; i < node.properties.length; i++ ) {
            $('#topdown').append("<div><b>" + node.properties[i].name + " </b> " + node.properties[i].value + "</div>");
            if(i != node.properties.length-1) $('#topdown').append("<hr>");
        }

        $('#topdown').append("<hr noshade='noshade'>");
        
        for ( var i = 0; i < node.children.length; i++ ) {
            $('#topdown').append("<div id='" + node.children[i].ID + "'><b>" + node.children[i].name + "</b></div><hr>");
            $('#' + node.children[i].ID).click( function(evt) {
                drillDown($(this).attr("id"));
            });            
        }
    }
    
} );
