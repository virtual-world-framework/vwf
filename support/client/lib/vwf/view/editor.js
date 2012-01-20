define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/editor creates a view interface for editor functions. 

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {
            window.vwf_view = this;

            this.nodes = {};
            this.scenes = {};
            this.editorVisible = false;
            this.topdownName = '#topdown_a';
            this.topdownTemp = '#topdown_b';
            
            jQuery('body').prepend(
                "<div id='editor' class='relClass'><div class='eImg'><img id='launchEditor' src='images/editor.png' style='pointer-events:all' alt='launchEditor' /></div></div><div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='topdown_a'></div></div></div><div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='topdown_b'></div></div></div>"
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

            $('#topdown_a').hide();
            $('#topdown_b').hide();
            
            var canvas = document.getElementById("index-vwf");
            $('#topdown_a').height(canvas.height);
            $('#topdown_b').height(canvas.height);
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
            
            var divName = '#' + nodeID + '-' + propertyName;
            $(divName).html("<b>" + propertyName + " </b> " + propertyValue);
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

    function openEditor()
    {
        var topdownName = window.vwf_view.topdownName;
        
        if(!window.vwf_view.editorVisible)
        {
            if( $('#topdown_a').html() == '')
            {
                drillDown.call(this, "index-vwf");
            }

            window.vwf_view.editorVisible = true;
            $(topdownName).show('slide', {direction: 'right'}, 500); 
            $('#editor').animate({ 'left' : "-=260px" }, 500);
            $('#launchEditor').attr('src', 'images/editorClose.png');
        }
        else
        {
            window.vwf_view.editorVisible = false;
            $(topdownName).hide('slide', {direction: 'right'}, 500); 
            $('#editor').animate({ 'left' : "+=260px" }, 500);
            $('#launchEditor').attr('src', 'images/editor.png');
        }
    }
    
    // -- drillDown -------------------------------------------------------------------------

    function drillDown(nodeID)
    {
        var topdownName = window.vwf_view.topdownName;
        var topdownTemp = window.vwf_view.topdownTemp;
        
        drill(nodeID);
        
        if(nodeID != "index-vwf") $(topdownName).hide('slide', {direction: 'left'}, 500); 
        $(topdownTemp).show('slide', {direction: 'right'}, 500);    
        
        window.vwf_view.topdownName = topdownTemp;
        window.vwf_view.topdownTemp = topdownName;
    }
    
    // -- drillUp ---------------------------------------------------------------------------

    function drillUp(nodeID)
    {
        var topdownName = window.vwf_view.topdownName;
        var topdownTemp = window.vwf_view.topdownTemp;
        
        drill(nodeID);
        
        $(topdownName).hide('slide', {direction: 'right'}, 500); 
        $(topdownTemp).show('slide', {direction: 'left'}, 500);    
        
        window.vwf_view.topdownName = topdownTemp;
        window.vwf_view.topdownTemp = topdownName;
    }
    
    // -- drill -----------------------------------------------------------------------------

    function drill(nodeID)
    {
        var topdownName = window.vwf_view.topdownName;
        var topdownTemp = window.vwf_view.topdownTemp;
        
        var node = window.vwf_view.nodes[ nodeID ];
     
        if(nodeID == "index-vwf") 
        {
            $(topdownTemp).html("<div class='header'>index</div>");
        }
        else
        {
            $(topdownTemp).html("<div class='header'><img src='images/back.png' id='" + nodeID + "-back' alt='back'/> " + node.name + "</div>");
            jQuery('#' + nodeID + '-back').click ( function(evt) {
                drillUp(node.parentID);
            });
        }
        
        for ( var i = 0; i < node.properties.length; i++ ) {
            $(topdownTemp).append("<div id='" + nodeID + "-" + node.properties[i].name + "' class='propEntry'><table><tr><td><b>" + node.properties[i].name + " </b></td><td><input type='text' value='" + node.properties[i].value + "'></td></tr></table></div>");
            if(i != node.properties.length-1) 
            {
                $(topdownTemp).append("<hr>");
            }
        }

        if(node.properties.length != 0) $(topdownTemp).append("<hr style='height:3px'>");
        
        for ( var i = 0; i < node.children.length; i++ ) {
            $(topdownTemp).append("<div id='" + node.children[i].ID + "' class='childEntry'><b>" + node.children[i].name + "</b></div><hr noshade='noshade'>");
            $('#' + node.children[i].ID).click( function(evt) {
                drillDown($(this).attr("id"));
            });            
        }
    }
    
} );
