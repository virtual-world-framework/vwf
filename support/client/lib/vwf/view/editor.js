    define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/editor creates a view interface for editor functions. 

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {

            var self = this;

            this.nodes = {};
            this.scenes = {};
            this.editorVisible = false;
            this.topdownName = '#topdown_a';
            this.topdownTemp = '#topdown_b';
            this.currentNodeID = '';
            
            jQuery('body').prepend(
                "<div id='editor' class='relClass'><div class='eImg'><img id='launchEditor' src='images/editor.png' style='pointer-events:all' alt='launchEditor' /></div></div><div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='topdown_a'></div></div></div><div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='topdown_b'></div></div></div>"
            );
            
            $('#launchEditor').stop().animate({ opacity:0.0 }, 0);
            
            jQuery('#launchEditor').mouseenter( function(evt) { 
                evt.stopPropagation();
                $('#launchEditor').stop().animate({ opacity:1.0 }, 175);
                return false; 
            });
            
            jQuery('#launchEditor').mouseleave( function(evt) { 
                evt.stopPropagation(); 
                $('#launchEditor').stop().animate({ opacity:0.0 }, 175);
                return false; 
            });
            
            jQuery('#launchEditor').click ( function(evt) {
                openEditor.call(self);
            });

            $('#topdown_a').hide();
            $('#topdown_b').hide();
            
            var canvas = document.getElementById("index-vwf");
            if ( canvas ) {
                $('#topdown_a').height(canvas.height);
                $('#topdown_b').height(canvas.height);
            }
        },
        
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childName, callback /* ( ready ) */ ) {
            
            var self = this;
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
            
            if ( nodeID === this.currentNodeID )
            {
                $(this.topdownName).append("<div id='" + childID + "' class='childContainer'><div class='childEntry'><b>" + childName + "</b></div><hr noshade='noshade'></div>");
                $('#' + childID).click( function(evt) {
                    drillDown.call(self, $(this).attr("id"));
                });
            }
        },
        
        createdProperty: function (nodeID, propertyName, propertyValue) {
   
            var node = this.nodes[ nodeID ];
            var property = node.properties[ propertyName ] = {
                name: propertyName,
                value: propertyValue,
            };

            try {
                node.properties[ propertyName ].value = JSON.stringify( propertyValue );
            } catch (e) {
                this.logger.warn( "createdProperty", nodeID, propertyName, propertyValue,
                    "stringify error:", e.message );
                node.properties[ propertyName ].value = propertyValue;
            }
            
            if ( node ) {
                node.properties.push( property );
            }
        },
        
        deletedNode: function (nodeID) {
            var node = this.nodes[ nodeID ];
            node.parent.children.splice( node );
            $('#' + nodeID).remove();
        },

        //addedChild: [ /* nodeID, childID, childName */ ],
        //removedChild: [ /* nodeID, childID */ ],

        satProperty: function (nodeID, propertyName, propertyValue) {
            var self = this;
            var node = this.nodes[ nodeID ];
if ( ! node ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            try {
                node.properties[ propertyName ].value = JSON.stringify( propertyValue );
            } catch (e) {
                this.logger.warn( "satProperty", nodeID, propertyName, propertyValue,
                    "stringify error:", e.message );
                node.properties[ propertyName ].value = propertyValue;
            }

            $('#input-' + nodeID + '-' + propertyName).val(node.properties[ propertyName ].value);
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

    function openEditor() // invoke with the view as "this"
    {
        var topdownName = this.topdownName;
        
        if(!this.editorVisible)
        {
            if( $('#topdown_a').html() == '')
            {
                drillDown.call(this, "index-vwf");
            }
            else
            {
                $(topdownName).show('slide', {direction: 'right'}, 175);
            }

            this.editorVisible = true;
            $('#editor').animate({ 'left' : "-=260px" }, 175);
            $('#launchEditor').attr('src', 'images/editorClose.png');
        }
        else
        {
            this.editorVisible = false;
            $(topdownName).hide('slide', {direction: 'right'}, 175); 
            $('#editor').animate({ 'left' : "+=260px" }, 175);
            $('#launchEditor').attr('src', 'images/editor.png');
        }
    }
    
    // -- drillDown -------------------------------------------------------------------------

    function drillDown(nodeID) // invoke with the view as "this"
    {
        var topdownName = this.topdownName;
        var topdownTemp = this.topdownTemp;
        
        drill.call(this, nodeID);
        
        if(nodeID != "index-vwf") $(topdownName).hide('slide', {direction: 'left'}, 175); 
        $(topdownTemp).show('slide', {direction: 'right'}, 175);    
        
        this.topdownName = topdownTemp;
        this.topdownTemp = topdownName;
    }
    
    // -- drillUp ---------------------------------------------------------------------------

    function drillUp(nodeID) // invoke with the view as "this"
    {
        var topdownName = this.topdownName;
        var topdownTemp = this.topdownTemp;
        
        drill.call(this, nodeID);
        
        $(topdownName).hide('slide', {direction: 'right'}, 175); 
        $(topdownTemp).show('slide', {direction: 'left'}, 175);    
        
        this.topdownName = topdownTemp;
        this.topdownTemp = topdownName;
    }
    
    // -- drill -----------------------------------------------------------------------------

    function drill(nodeID) // invoke with the view as "this"
    {
        var self = this;
        var topdownName = this.topdownName;
        var topdownTemp = this.topdownTemp;
        
        var node = this.nodes[ nodeID ];
        this.currentNodeID = nodeID;
     
        if(nodeID == "index-vwf") 
        {
            $(topdownTemp).html("<div class='header'>index</div>");
        }
        else
        {
            $(topdownTemp).html("<div class='header'><img src='images/back.png' id='" + nodeID + "-back' alt='back'/> " + node.name + "</div>");
            jQuery('#' + nodeID + '-back').click ( function(evt) {
                drillUp.call(self, node.parentID);
            });
        }
        
        for ( var i = 0; i < node.properties.length; i++ ) {
            $(topdownTemp).append("<div id='" + nodeID + "-" + node.properties[i].name + "' class='propEntry'><table><tr><td><b>" + node.properties[i].name + " </b></td><td><input type='text' id='input-" + nodeID + "-" + node.properties[i].name + "' value='" + node.properties[i].value + "'></td></tr></table></div>");
            if(i != node.properties.length-1) 
            {
                $(topdownTemp).append("<hr>");
            }
            
            $('#input-' + nodeID + '-' + node.properties[i].name).change( function(evt) {
                var inputID = ($(this).attr("id"));
                var nodeID = inputID.substring(6, inputID.lastIndexOf('-'));
                var propName = inputID.substring(inputID.lastIndexOf('-')+1);
                var propValue = $(this).val();
                
                try {
                    propValue = JSON.parse(propValue);
                    self.kernel.setProperty(nodeID, propName, propValue);
                } catch (e) {
                    // restore the original value on error
                    $(this).val(node.properties[ propName ].value);
                }
            } );

            $('#input-' + nodeID + '-' + node.properties[i].name).keydown( function(evt) {
                evt.stopPropagation();
            });

            $('#input-' + nodeID + '-' + node.properties[i].name).keypress( function(evt) {
                evt.stopPropagation();
            });

            $('#input-' + nodeID + '-' + node.properties[i].name).keyup( function(evt) {
                evt.stopPropagation();
            });
        }

        if(node.properties.length != 0) $(topdownTemp).append("<hr style='height:3px'>");
        
        for ( var i = 0; i < node.children.length; i++ ) {
            $(topdownTemp).append("<div id='" + node.children[i].ID + "' class='childContainer'><div class='childEntry'><b>" + node.children[i].name + "</b></div><hr noshade='noshade'></div>");
            $('#' + node.children[i].ID).click( function(evt) {
                drillDown.call(self, $(this).attr("id"));
            });            
        }
    }
    
} );
