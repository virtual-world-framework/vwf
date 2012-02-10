    define( [ "module", "vwf/view" ], function( module, view ) {

    // vwf/view/editor creates a view interface for editor functions. 

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {

            var self = this;
            window.slideOffset = 0;

            this.nodes = {};
            this.scenes = {};
            this.editorVisible = false;
            this.topdownName = '#topdown_a';
            this.topdownTemp = '#topdown_b';
            this.currentNodeID = '';
            
            jQuery('body').append(
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
            else
            {    
                $('#topdown_a').height(window.innerHeight-20);
                $('#topdown_b').height(window.innerHeight-20);
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

            if ( childExtendsID =="http-vwf-example-com-glge-vwf" || childExtendsID =="appscene-vwf" ) {
                this.scenes[ childID ] = node;
            }
            
            if ( nodeID === this.currentNodeID )
            {
                $(this.topdownName + ' hr:last').css('height', '1px');
                $(this.topdownName).append("<div id='" + childID + "' class='childContainer'><div class='childEntry'><b>" + childName + "</b></div><hr></div>");
                $('#' + childID).click( function(evt) {
                    drillDown.call(self, $(this).attr("id"));
                });
                $(this.topdownName + ' hr:last').css('height', '3px');
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
            $(this.topdownName + ' hr:last').css('height', '3px');
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

        calledMethod: function( nodeID, methodName, methodParameters ) {
            //console.info('nodeID: ' + nodeID);
            //console.info('methodName: ' + methodName);
            //console.info('methodParameters: ' + methodParameters);
        },

        createdEvent: function( nodeID, eventName, eventParameters ) {
            var node = this.nodes[ nodeID ];
            if ( node ) {
                node.events[ eventName ] = eventParameters;
            }         
        },

        firedEvent: function ( nodeID, eventName, eventParameters ) {
            //console.info('nodeID: ' + nodeID);
            //console.info('eventName: ' + eventName);
            //console.info('eventParameters: ' + eventParameters);
        },

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
            window.slideOffset = 260;
            $('#vwf-root').animate({ 'left' : "-=260px" }, 175);
            $('#editor').animate({ 'left' : "-=260px" }, 175);
            $('#launchEditor').attr('src', 'images/editorClose.png');
        }
        else
        {
            this.editorVisible = false;
            window.slideOffset = 0;
            $(topdownName).hide('slide', {direction: 'right'}, 175);
            $('#vwf-root').animate({ 'left' : "+=260px" }, 175);
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
            $(topdownTemp).append("<div id='" + nodeID + "-" + node.properties[i].name + "' class='propEntry'><table><tr><td><b>" + node.properties[i].name + " </b></td><td><input type='text' class='input_text' id='input-" + nodeID + "-" + node.properties[i].name + "' value='" + node.properties[i].value + "'></td></tr></table></div><hr>");
            
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

        $(topdownTemp + ' hr:last').css('height', '3px');
        
        for ( var i = 0; i < node.children.length; i++ ) {
            $(topdownTemp).append("<div id='" + node.children[i].ID + "' class='childContainer'><div class='childEntry'><b>" + node.children[i].name + "</b></div><hr></div>");
            $('#' + node.children[i].ID).click( function(evt) {
                drillDown.call(self, $(this).attr("id"));
            });
        }

        $(topdownTemp + ' hr:last').css('height', '3px');

        for ( var key in node.methods ) {
            var method = node.methods[key];
            $(topdownTemp).append("<div id='" + key + "' class='methodEntry'><table><tr><td><b>" + key + " </b></td><td style='text-align:right'><div id='rollover-" + key + "'><input type='button' class='input_button_call' id='call-" + key + "' value='Call'><img id='param-" + key + "' src='images/arrow.png' alt='arrow' style='position:relative;top:4px;visibility:hidden'></div></td></tr></table></div><hr>");
            $('#rollover-' + key).mouseover( function(evt) {
                $('#param-' + $(this).attr("id").substring(9)).css('visibility', 'visible');
            });
            $('#rollover-' + key).mouseleave( function(evt) {
                $('#param-' + $(this).attr("id").substring(9)).css('visibility', 'hidden');
            });
            $('#call-' + key).click( function(evt) {
                self.kernel.callMethod( nodeID, $(this).attr("id").substring(5) );
            });
            $('#param-' + key).click( function(evt) {
                setParams.call(self, $(this).attr("id").substring(6), method, nodeID);                
            });
        }

        $(topdownTemp + ' hr:last').css('height', '3px');

        for ( var key in node.events ) {
            var nodeEvent = node.events[key];
            $(topdownTemp).append("<div id='" + key + "' class='methodEntry'><table><tr><td><b>" + key + " </b></td><td style='text-align:right'><div id='rollover-" + key + "'><input type='button' class='input_button_call' id='fire-" + key + "' value='Fire'><img id='arg-" + key + "' src='images/arrow.png' alt='arrow' style='position:relative;top:4px;visibility:hidden'></div></td></tr></table></div><hr>");
            $('#rollover-' + key).mouseover( function(evt) {
                $('#arg-' + $(this).attr("id").substring(9)).css('visibility', 'visible');
            });
            $('#rollover-' + key).mouseleave( function(evt) {
                $('#arg-' + $(this).attr("id").substring(9)).css('visibility', 'hidden');
            });
            $('#fire-' + key).click( function(evt) {
                self.kernel.fireEvent( nodeID, $(this).attr("id").substring(5) );
            });
            $('#arg-' + key).click( function(evt) {
                setArgs.call(self, $(this).attr("id").substring(4), nodeEvent, nodeID); 
            });
        }

        $(topdownTemp + ' hr:last').css('height', '3px');
    }

    // -- setParams -------------------------------------------------------------------------

    function setParams (methodName, methodParams, nodeID) // invoke with the view as "this"
    {
        var self = this;
        var topdownName = this.topdownName;
        var topdownTemp = this.topdownTemp;
     
        $(topdownTemp).html("<div class='header'><img src='images/back.png' id='" + methodName + "-back' alt='back'/> " + methodName + "<input type='button' class='input_button_call' id='call' value='Call' style='float:right;position:relative;top:5px;right:22px'></input></div>");
        jQuery('#' + methodName + '-back').click ( function(evt) {
            
            drillUp.call(self, nodeID);
        });

        for(var i=1; i<=16; i++)
        {
            $(topdownTemp).append("<div id='param" + i + "' class='propEntry'><table><tr><td><b>Parameter " + i + ": </b></td><td><input type='text' class='input_text' id='input-param" + i + "'></td></tr></table></div>");
        }

        $('#call').click ( function (evt) {

            var parameters = new Array();
            for(var i=1; i<=16; i++)
            {
                if( $('#input-param'+ i).val() )
                {
                    var prmtr = $('#input-param'+ i).val();
                    try {
                        prmtr = JSON.parse(prmtr);
                        parameters.push( prmtr );
                    } catch (e) {
                        console.error('Invalid Value');
                    }
                }
            }

            self.kernel.callMethod(nodeID, methodName, [parameters]);
        });

        $(topdownName).hide('slide', {direction: 'left'}, 175); 
        $(topdownTemp).show('slide', {direction: 'right'}, 175);    

        this.topdownName = topdownTemp;
        this.topdownTemp = topdownName;
    }

    // -- setArgs ---------------------------------------------------------------------------

    function setArgs (eventName, eventArgs, nodeID) // invoke with the view as "this"
    {
        var self = this;
        var topdownName = this.topdownName;
        var topdownTemp = this.topdownTemp;
     
        $(topdownTemp).html("<div class='header'><img src='images/back.png' id='" + eventName + "-back' alt='back'/> " + eventName + "<input type='button' class='input_button_call' id='fire' value='Fire' style='float:right;position:relative;top:5px;right:22px'></input></div>");
        jQuery('#' + eventName + '-back').click ( function(evt) {
            drillUp.call(self, nodeID);
        });

        for(var i=1; i<=8; i++)
        {
            $(topdownTemp).append("<div id='arg" + i + "' class='propEntry'><table><tr><td><b>Argument " + i + ": </b></td><td><input type='text' class='input_text' id='input-arg" + i + "'></td></tr></table></div>");
        }

        $(topdownTemp).append("<div style='font-weight:bold;text-align:right;padding-right:10px'></div>");
        $('#fire').click ( function (evt) {

            var arguments = new Array();
            for(var i=1; i<=8; i++)
            {
                if( $('#input-arg'+ i).val() )
                {
                    var arg = $('#input-arg'+ i).val();
                    try {
                        arg = JSON.parse(arg);
                        arguments.push( arg );
                    } catch (e) {
                        console.error('Invalid Value');
                    }
                }
            }

            self.kernel.fireEvent(nodeID, eventName, [arguments]);
        });

        $(topdownName).hide('slide', {direction: 'left'}, 175); 
        $(topdownTemp).show('slide', {direction: 'right'}, 175);    

        this.topdownName = topdownTemp;
        this.topdownTemp = topdownName;

    }
} );
