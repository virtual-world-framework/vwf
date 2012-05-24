"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

define( [ "module", "version", "vwf/view" ], function( module, version, view ) {

    // vwf/view/editor creates a view interface for editor functions. 

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {

            var self = this;
            window.slideOffset = 0;

            this.nodes = {};
            this.scenes = {};
            this.allScripts = {};

            // EDITOR CLOSED  --> 0
            // HIERARCHY OPEN --> 1
            // USER LIST OPEN --> 2
            // TIMELINE OPEN  --> 3
            // ABOUT OPEN     --> 4
            this.editorView = 0;
            this.editorOpen = false;
            this.timelineInit = false;
            this.aboutInit = false;
            this.modelsInit = false;
            this.editingScript = false;

            this.topdownName = '#topdown_a';
            this.topdownTemp = '#topdown_b';
            this.clientList = '#client_list';
            this.timeline = '#time_control';
            this.about = '#about_tab';
            this.models = '#model_tab';
            this.currentNodeID = '';
            
            jQuery('body').append(
                "<div id='editor' class='relClass'><div class='uiContainer'><div class='editor-tabs' id='tabs'><img id='x' style='display:none' src='images/tab_X.png' alt='x' /><img id='hierarchy' src='images/tab_Hierarchy.png' alt='hierarchy' /><img id='userlist' src='images/tab_UserList.png' alt='userlist' /><img id='timeline' src='images/tab_Timeline.png' alt='timeline' /><img id='models' src='images/tab_Models.png' alt='models' /><img id='about' src='images/tab_About.png' alt='about' /></div></div></div>" + 
                "<div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='topdown_a'></div></div></div>" + 
                "<div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='topdown_b'></div></div></div>" + 
                "<div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='client_list'></div></div></div>" +
                "<div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='time_control'></div></div></div>" +
                "<div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='about_tab'></div></div></div>" +
                "<div class='relClass'><div class='uiContainer'><div class='vwf-tree' id='model_tab'></div></div></div>"
            );
            
            $('#tabs').stop().animate({ opacity:0.0 }, 0);
            
            jQuery('#tabs').mouseenter( function(evt) { 
                evt.stopPropagation();
                $('#tabs').stop().animate({ opacity:1.0 }, 175);
                return false; 
            });
            
            jQuery('#tabs').mouseleave( function(evt) { 
                evt.stopPropagation(); 
                $('#tabs').stop().animate({ opacity:0.0 }, 175);
                return false; 
            });
            
            jQuery('#hierarchy').click ( function(evt) {
                openEditor.call(self, 1);
            });

            jQuery('#userlist').click ( function(evt) {
                openEditor.call(self, 2);
            });

            jQuery('#timeline').click ( function(evt) {
                openEditor.call(self, 3);
            });

            jQuery('#about').click ( function(evt) {
                openEditor.call(self, 4);
            });

            jQuery('#models').click ( function(evt) {
                openEditor.call(self, 5);
            });

            jQuery('#x').click ( function(evt) {
                closeEditor.call(self);
            });

            $('#topdown_a').hide();
            $('#topdown_b').hide();
            $('#client_list').hide();
            $('#time_control').hide();
            $('#about_tab').hide();
            $('#model_tab').hide();
            
            var canvas = document.getElementById("index-vwf");
            if ( canvas ) {
                $('#topdown_a').height(canvas.height);
                $('#topdown_b').height(canvas.height);
                $('#client_list').height(canvas.height);
                $('#time_control').height(canvas.height);
                $('#about_tab').height(canvas.height);
                $('#model_tab').height(canvas.height);
            }
            else
            {    
                $('#topdown_a').height(window.innerHeight-20);
                $('#topdown_b').height(window.innerHeight-20);
                $('#client_list').height(window.innerHeight-20);
                $('#time_control').height(window.innerHeight-20);
                $('#about_tab').height(window.innerHeight-20);
                $('#model_tab').height(window.innerHeight-20);
            }
        },
        
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {
            
            var kernel = this.kernel.kernel;
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
                implementsIDs: childImplementsIDs,
                source: childSource, 
                name: childName,
            };

            if ( parent ) {
                parent.children.push( node );
            }

            var prototypes = getPrototypes.call( this, kernel, childExtendsID );
            if ( prototypes && isGlgeSceneDefinition.call( this, prototypes ) && childID == "index-vwf" ) {
                this.scenes[ childID ] = node;
            }
            
            if ( nodeID === this.currentNodeID && this.editingScript == false )
            {
                $('#children hr:last').css('height', '1px');
                $("#children").append("<div id='" + childID + "' class='childContainer'><div class='childEntry'><b>" + childName + "</b></div><hr></div>");
                $('#' + childID).click( function(evt) {
                    drillDown.call(self, $(this).attr("id"));
                });
                $('#children hr:last').css('height', '3px');
            }
        },
        
        createdProperty: function (nodeID, propertyName, propertyValue) {

            return this.initializedProperty(nodeID, propertyName, propertyValue);   
        },
        
        initializedProperty: function (nodeID, propertyName, propertyValue) {
   
            var node = this.nodes[ nodeID ];
if ( ! node ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            var property = node.properties[ propertyName ] = {
                name: propertyName,
                value: propertyValue,
            };

            try {
                node.properties[ propertyName ].value = JSON.stringify( propertyValue );
            } catch (e) {
                this.logger.warnc( "createdProperty", nodeID, propertyName, propertyValue,
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
            $('#children hr:last').css('height', '3px');
        },

        //addedChild: [ /* nodeID, childID, childName */ ],
        //removedChild: [ /* nodeID, childID */ ],

        satProperty: function (nodeID, propertyName, propertyValue) {

            var node = this.nodes[ nodeID ];
if ( ! node ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            try {
                node.properties[ propertyName ].value = JSON.stringify( propertyValue );
            } catch (e) {
                this.logger.warnc( "satProperty", nodeID, propertyName, propertyValue,
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

        //calledMethod: function( nodeID, methodName, methodParameters ) {

        //},

        createdEvent: function( nodeID, eventName, eventParameters ) {
            var node = this.nodes[ nodeID ];
            if ( node ) {
                node.events[ eventName ] = eventParameters;
            }         
        },

        //firedEvent: function ( nodeID, eventName, eventParameters ) {

        //},

        executed: function( nodeID, scriptText, scriptType ) {

            var nodeScript = {
                text: scriptText,
                type: scriptType,
            };

            if ( !this.allScripts[ nodeID ] ) {
                var nodeScripts = new Array();
                nodeScripts.push(nodeScript);

                this.allScripts[ nodeID ] = nodeScripts;
            }

            else {
                this.allScripts[ nodeID ].push(nodeScript);
            }
        },

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

    function openEditor(eView) // invoke with the view as "this"
    {
        if(eView == 0)
        {
            closeEditor.call(this);
        }
        
        if(this.editorView != eView)
        {
            // Hierarchy
            if(eView == 1)
            {
                var topdownName = this.topdownName;
                var topdownTemp = this.topdownTemp;

                if( this.currentNodeID == '' )
                {
                    this.currentNodeID = "index-vwf";
                }

                drill.call(this, this.currentNodeID);
                $(this.clientList).hide();
                $(this.timeline).hide();
                $(this.about).hide();
                $(this.models).hide();

                if(this.editorOpen)
                {
                    $(topdownName).hide();
                    $(topdownTemp).show();
                }

                else
                {
                    $(topdownTemp).show('slide', {direction: 'right'}, 175);    
                }

                this.topdownName = topdownTemp;
                this.topdownTemp = topdownName;
            }

            // User List
            else if(eView == 2)
            {
                $(this.topdownName).hide();
                $(this.topdownTemp).hide();
                $(this.timeline).hide();
                $(this.about).hide();
                $(this.models).hide();
                showUserList.call(this);
            }

            // Timeline
            else if(eView == 3)
            {
                $(this.topdownName).hide();
                $(this.topdownTemp).hide();
                $(this.clientList).hide();
                $(this.about).hide();
                $(this.models).hide();
                showTimeline.call(this);
            }

            // About
            else if(eView == 4)
            {
                $(this.topdownName).hide();
                $(this.topdownTemp).hide();
                $(this.clientList).hide();
                $(this.timeline).hide();
                $(this.models).hide();
                showAboutTab.call(this);
            }

            // Models
            else if(eView == 5)
            {
                $(this.topdownName).hide();
                $(this.topdownTemp).hide();
                $(this.clientList).hide();
                $(this.timeline).hide();
                $(this.about).hide();
                showModelsTab.call(this);
            }


            if(this.editorView == 0)
            {
                window.slideOffset = 260;
                $('#vwf-root').animate({ 'left' : "-=260px" }, 175);
                $('#editor').animate({ 'left' : "-=260px" }, 175);
                $('#x').delay(1000).css({ 'display' : 'inline' });
            }

            this.editorView = eView;
            this.editorOpen = true;
        }
    }

    // -- closeEditor -----------------------------------------------------------------------

    function closeEditor() // invoke with the view as "this"
    {
        var topdownName = this.topdownName;

        window.slideOffset = 0;

        if (this.editorOpen && this.editorView == 1) // Hierarchy view open
        {
            $(topdownName).hide('slide', {direction: 'right'}, 175);
            $(this.clientList).hide();
            $(this.timeline).hide();
            $(this.about).hide();
            $(this.models).hide();
        }

        else if (this.editorOpen && this.editorView == 2) // Client list open
        {
            $(this.clientList).hide('slide', {direction: 'right'}, 175);
            $(topdownName).hide();
            $(this.timeline).hide();
            $(this.about).hide();
            $(this.models).hide();
        }

        else if (this.editorOpen && this.editorView == 3) // Timeline open
        {
            $(this.timeline).hide('slide', {direction: 'right'}, 175);
            $(topdownName).hide();
            $(this.clientList).hide();
            $(this.about).hide();
            $(this.models).hide();
        }

        else if (this.editorOpen && this.editorView == 4) // About open
        {
            $(this.about).hide('slide', {direction: 'right'}, 175);
            $(topdownName).hide();
            $(this.clientList).hide();
            $(this.timeline).hide();
            $(this.models).hide();
        }

        else if (this.editorOpen && this.editorView == 5) // Models open
        {
            $(this.models).hide('slide', {direction: 'right'}, 175);
            $(topdownName).hide();
            $(this.clientList).hide();
            $(this.timeline).hide();
            $(this.about).hide();
        }
        
        $('#vwf-root').animate({ 'left' : "+=260px" }, 175);
        $('#editor').animate({ 'left' : "+=260px" }, 175);
        $('#x').css({ 'display' : 'none' });
        this.editorView = 0;
        this.editorOpen = false;
    }

    // -- showUserList ----------------------------------------------------------------------

    function showUserList() // invoke with the view as "this"
    {
        var clientList = this.clientList;

        updateClients.call(this);

        if (!this.editorOpen)
        {
            $(clientList).show('slide', {direction: 'right'}, 175);    
        }
        else
        {
            $(clientList).show();
        }
    }

    // -- updateClients ---------------------------------------------------------------------

    function updateClients() {
        var app = window.location.pathname;
        var root = app.substring(1, app.length-18);
        var inst = app.substring(app.length-17, app.length-1);
        var match;

        var clients$ = $(this.clientList);

        jQuery.getJSON( "/" + root + "/admin/instances", function( data ) {
            jQuery.each( data, function( key, value ) {
                if ( match = key.match( RegExp( "/([^/]*)$" ) ) ) { // assignment is intentional

                    var instanceHTML = String( match[1] ).
                      replace( /&/g, "&amp;" ).
                      replace( /"/g, "&quot;" ).
                      replace( /'/g, "&#39;" ).
                      replace( /</g, "&lt;" ).
                      replace( />/g, "&gt;" );

                    if(instanceHTML == inst)
                    {
                        clients$.html("<div class='header'>Users</div>");
                        for (var clientID in value.clients) { 
                            clients$.append("<div class='clientEntry'>" + clientID + "</div><hr>"); 
                        }

                        clients$.append("<div style='padding:6px'><input class='update_button' type='button' id='load' value='Load' /><input class='update_button' type='button' id='save' value='Save' /></div>");
                        $('#load').click(function(evt) {
                            // Call function here
                        });
                        $('#save').click(function(evt) {
                            // Call function here
                        });
                    }
                }
            } );
        } );

        //setTimeout(updateClients.call(this), 5000);
    };

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

        $(topdownName).html(''); // Clear alternate div first to ensure content is added correctly
        
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

        // Add node behaviors
        $(topdownTemp).append("<div id='behaviors'></div>");
        for ( var i = 0; i < node.implementsIDs.length; i++ ) {
            $('#behaviors').append("<div class='propEntry'><table><tr><td style='width:92%'><b>" + node.implementsIDs[i] + "</b></td><td><input id='" + node.implementsIDs[i] + "-enable' type='checkbox' checked='checked' disabled='disabled' /></td></tr></table></div><hr>");

            /* 
            //Placeholder to Enable/Disable behaviors
            $('#' + node.implementsID[i] + '-enable').change( function(evt) {
            
            }); 
            */
        }

        $('#behaviors hr:last').css('height', '3px');

        // Add node scripts
        $(topdownTemp).append("<div id='scripts'></div>");
        for( var i=0; i < this.allScripts[ nodeID ].length; i++ )
        {
            var scriptFull = this.allScripts[nodeID][i].text;
            if(scriptFull != undefined)
            {
                var scriptName = scriptFull.substring(0, scriptFull.indexOf('='));
                $('#scripts').append("<div id='script-" + nodeID + "-" + i + "' class='childContainer'><div class='childEntry'><b>script </b>" + scriptName + "</div><hr></div>");
                $('#script-' + nodeID + "-" + i).click( function(evt) {
                    var id = $(this).attr("id").substring($(this).attr("id").indexOf('-')+1,$(this).attr("id").lastIndexOf('-'));
                    var scriptID = $(this).attr("id").substring($(this).attr("id").lastIndexOf('-')+1);
                    viewScript.call(self, id, scriptID);
                });
            }
        }

        $('#scripts hr:last').css('height', '3px');
        
        // Add node properties
        $(topdownTemp).append("<div id='properties'></div>");
        var displayedProperties = {};
        for ( var i = 0; i < node.properties.length; i++ ) {
            if ( !displayedProperties[ node.properties[i].name ] ) {
                displayedProperties[ node.properties[i].name ] = "instance";
                $('#properties').append("<div id='" + nodeID + "-" + node.properties[i].name + "' class='propEntry'><table><tr><td><b>" + node.properties[i].name + " </b></td><td><input type='text' class='input_text' id='input-" + nodeID + "-" + node.properties[i].name + "' value='" + node.properties[i].value + "'></td></tr></table></div><hr>");
            
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
        }

        $('#properties hr:last').css('height', '3px');

        this.logger.info(self + "    " + nodeID);

        // Add prototype properties
        $(topdownTemp).append("<div id='prototypeProperties'></div>");
        var prototypeProperties = getProperties.call( this, this.kernel.kernel, node.extendsID );
        for ( var key in prototypeProperties ) {
            var prop = prototypeProperties[key].prop;
            if ( !displayedProperties[ prop.name ]  ) {
                displayedProperties[ prop.name ] = prototypeProperties[key].prototype;
                if(prop.value == undefined)
                {
                    prop.value = JSON.stringify( vwf.getProperty( nodeID, prop.name, []) );
                }
                $('#prototypeProperties').append("<div id='" + nodeID + "-" + prop.name + "' class='propEntry'><table><tr><td><b>" + prop.name + " </b></td><td><input type='text' class='input_text' id='input-" + nodeID + "-" + prop.name + "' value='" + prop.value + "'></td></tr></table></div><hr>");
            
                $('#input-' + nodeID + '-' + prop.name).change( function(evt) {
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

                $('#input-' + nodeID + '-' + prop.name).keydown( function(evt) {
                    evt.stopPropagation();
                });

                $('#input-' + nodeID + '-' + prop.name).keypress( function(evt) {
                    evt.stopPropagation();
                });

                $('#input-' + nodeID + '-' + prop.name).keyup( function(evt) {
                    evt.stopPropagation();
                });
            }
        }

        $('#prototypeProperties hr:last').css('height', '3px');
        
        // Add node children
        $(topdownTemp).append("<div id='children'></div>");
        for ( var i = 0; i < node.children.length; i++ ) {
            $('#children').append("<div id='" + node.children[i].ID + "' class='childContainer'><div class='childEntry'><b>" + node.children[i].name + "</b></div><hr></div>");
            $('#' + node.children[i].ID).click( function(evt) {
                drillDown.call(self, $(this).attr("id"));
            });
        }

        $('#children hr:last').css('height', '3px');

        // Add node methods
        $(topdownTemp).append("<div id='methods'></div>");
        for ( var key in node.methods ) {
            var method = node.methods[key];
            $('#methods').append("<div id='" + key + "' class='methodEntry'><table><tr><td><b>" + key + " </b></td><td style='text-align:right;overflow:visible'><div id='rollover-" + key + "' style='position:relative;left:12px'><input type='button' class='input_button_call' id='call-" + key + "' value='Call'><img id='param-" + key + "' src='images/arrow.png' alt='arrow' style='position:relative;top:4px;left:2px;visibility:hidden'></div></td></tr></table></div><hr>");
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

        $('#methods hr:last').css('height', '3px');

        // Add prototype methods
        $(topdownTemp).append("<div id='prototypeMethods'></div>");
        var prototypeMethods = getMethods.call( this, this.kernel.kernel, node.extendsID );
        for ( var key in prototypeMethods ) {
            var method = prototypeMethods[key];
            $('#prototypeMethods').append("<div id='" + key + "' class='methodEntry'><table><tr><td><b>" + key + " </b></td><td style='text-align:right;overflow:visible'><div id='rollover-" + key + "' style='position:relative;left:12px'><input type='button' class='input_button_call' id='call-" + key + "' value='Call'><img id='param-" + key + "' src='images/arrow.png' alt='arrow' style='position:relative;top:4px;left:2px;visibility:hidden'></div></td></tr></table></div><hr>");
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

        $('#prototypeMethods hr:last').css('height', '3px');

        // Add node events
        $(topdownTemp).append("<div id='events'></div>");
        for ( var key in node.events ) {
            var nodeEvent = node.events[key];
            $('#events').append("<div id='" + key + "' class='methodEntry'><table><tr><td><b>" + key + " </b></td><td style='text-align:right;overflow:visible'><div id='rollover-" + key + "' style='position:relative;left:12px'><input type='button' class='input_button_call' id='fire-" + key + "' value='Fire'><img id='arg-" + key + "' src='images/arrow.png' alt='arrow' style='position:relative;top:4px;left:2px;visibility:hidden'></div></td></tr></table></div><hr>");
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

        $('#events hr:last').css('height', '3px');

        // Add prototype events
        $(topdownTemp).append("<div id='prototypeEvents'></div>");
        var prototypeEvents = getEvents.call( this, this.kernel.kernel, node.extendsID );
        for ( var key in prototypeEvents ) {
            var nodeEvent = prototypeEvents[key];
            $('#prototypeEvents').append("<div id='" + key + "' class='methodEntry'><table><tr><td><b>" + key + " </b></td><td style='text-align:right;overflow:visible'><div id='rollover-" + key + "' style='position:relative;left:12px'><input type='button' class='input_button_call' id='fire-" + key + "' value='Fire'><img id='arg-" + key + "' src='images/arrow.png' alt='arrow' style='position:relative;top:4px;left:2px;visibility:hidden'></div></td></tr></table></div><hr>");
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

        $('#prototypeEvents hr:last').css('height', '3px');
    }

    // -- viewScript ------------------------------------------------------------------------

    function viewScript (nodeID, scriptID) // invoke with the view as "this"
    {
        var self = this;
        var topdownName = this.topdownName;
        var topdownTemp = this.topdownTemp;
        var allScripts = this.allScripts;

        this.editingScript = true;
        
        $(topdownTemp).html("<div class='header'><img src='images/back.png' id='script-" + nodeID + "-back' alt='back'/> script</div>");
        jQuery('#script-' + nodeID + '-back').click ( function(evt) {
            self.editingScript = false;
            var id = $(this).attr("id").substring(7, $(this).attr("id").lastIndexOf('-'));
            drillUp.call(self, id);
        });

        var scriptText = self.allScripts[nodeID][scriptID].text;
        if(scriptText != undefined)
        {
            $(topdownTemp).append("<div class='scriptEntry'><pre class='scriptCode'><textarea id='scriptTextArea' class='scriptEdit' spellcheck='false' wrap='off'>" + scriptText + "</textarea></pre><input class='update_button' type='button' id='update-" + nodeID + "-" + scriptID + "' value='Update' /></div><hr>");
            $("#update-" + nodeID + "-" + scriptID).click ( function(evt) {
                var id = $(this).attr("id").substring(7, $(this).attr("id").lastIndexOf('-'));
                var s_id = $(this).attr("id").substring($(this).attr("id").lastIndexOf('-') + 1);
                self.allScripts[id][s_id].text = undefined;
                self.kernel.execute( id, $("#scriptTextArea").val() );
            });
            jQuery('#scriptTextArea').change( function(evt) { 
                evt.stopPropagation();
            });
        }
        
        $(topdownName).hide('slide', {direction: 'left'}, 175); 
        $(topdownTemp).show('slide', {direction: 'right'}, 175);
        
        this.topdownName = topdownTemp;
        this.topdownTemp = topdownName;
    }

    // -- setParams -------------------------------------------------------------------------

    function setParams (methodName, methodParams, nodeID) // invoke with the view as "this"
    {
        var self = this;
        var topdownName = this.topdownName;
        var topdownTemp = this.topdownTemp;
     
        $(topdownTemp).html("<div class='header'><img src='images/back.png' id='" + methodName + "-back' alt='back'/> " + methodName + "<input type='button' class='input_button_call' id='call' value='Call' style='float:right;position:relative;top:5px;right:33px'></input></div>");
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
                        this.logger.error('Invalid Value');
                    }
                }
            }

            self.kernel.callMethod(nodeID, methodName, parameters);
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
     
        $(topdownTemp).html("<div class='header'><img src='images/back.png' id='" + eventName + "-back' alt='back'/> " + eventName + "<input type='button' class='input_button_call' id='fire' value='Fire' style='float:right;position:relative;top:5px;right:33px'></input></div>");
        jQuery('#' + eventName + '-back').click ( function(evt) {
            drillUp.call(self, nodeID);
        });

        for(var i=1; i<=8; i++)
        {
            $(topdownTemp).append("<div id='arg" + i + "' class='propEntry'><table><tr><td><b>Argument " + i + ": </b></td><td><input type='text' class='input_text' id='input-arg" + i + "'></td></tr></table></div>");
        }

        $(topdownTemp).append("<div style='font-weight:bold;text-align:right;padding-right:10px'></div>");
        $('#fire').click ( function (evt) {

            var args = new Array();
            for(var i=1; i<=8; i++)
            {
                if( $('#input-arg'+ i).val() )
                {
                    var arg = $('#input-arg'+ i).val();
                    try {
                        arg = JSON.parse(arg);
                        args.push( arg );
                    } catch (e) {
                        this.logger.error('Invalid Value');
                    }
                }
            }

            self.kernel.fireEvent(nodeID, eventName, args);
        });

        $(topdownName).hide('slide', {direction: 'left'}, 175); 
        $(topdownTemp).show('slide', {direction: 'right'}, 175);    

        this.topdownName = topdownTemp;
        this.topdownTemp = topdownName;

    }

    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function getProperties( kernel, extendsID ) {
        var pTypes = getPrototypes( kernel, extendsID );
        var pProperties = {};
        if ( pTypes ) {
            for ( var i=0; i < pTypes.length; i++ ) {
                var nd = this.nodes[ pTypes[i] ];
                if ( nd && nd.properties ) {
                    for ( var key in nd.properties ) {
                        pProperties[ key ] = { "prop": nd.properties[ key ], "prototype": pTypes[i]  };
                    }
                }
            }
        }
        return pProperties;
    }

    function getEvents( kernel, extendsID ) {
        var pTypes = getPrototypes( kernel, extendsID );
        var events = {};
        if ( pTypes ) {
            for ( var i = 0; i < pTypes.length; i++ ) {
                var nd = this.nodes[ pTypes[i] ];
                if  ( nd && nd.events ) {
                    for ( var key in nd.events ) {
                        events[ key ] = nd.events[key];
                    }
                }
            }
        }
        return events;
    }

    function getMethods( kernel, extendsID ) {
        var pTypes = getPrototypes( kernel, extendsID );
        var methods = {};
        if ( pTypes ) {
            for ( var i = 0; i < pTypes.length; i++ ) {
                var nd = this.nodes[ pTypes[i] ];
                if  ( nd && nd.methods ) {
                    for ( var key in nd.methods ) {
                        methods[ key ] = nd.methods[key];
                    }
                }
            }
        }
        return methods;
    }

    function isGlgeSceneDefinition( prototypes ) {
        var foundGlge = false;
        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGlge; i++ ) {
                foundGlge = ( prototypes[i] == "http-vwf-example-com-scene-vwf" );    
            }
        }

        return foundGlge;
    }

    // -- showTimeline ----------------------------------------------------------------------

    function showTimeline() // invoke with the view as "this"
    {
        var timeline = this.timeline;

        if(!this.timelineInit)
        {
            jQuery('#time_control').append("<div class='header'>Timeline</div>" + 
                "<div style='text-align:center;padding-top:10px'><span><button id='play'></button><button id='stop'></button></span>" +
                "<span><span class='rate slider'></span>&nbsp;" + 
                "<span class='rate vwf-label' style='display: inline-block; width:8ex'></span></span></div>");

            var options = {};

            [ "play", "pause", "stop" ].forEach( function( state ) {
                options[state] = { icons: { primary: "ui-icon-" + state }, label: state, text: false };
            } );

            options.rate = { value: 0, min: -2, max: 2, step: 0.1, };

            var state = {};

            jQuery.get(
                "admin/state", 
                undefined, 
                function( data ) {
                    state = data;

                    jQuery( "button#play" ).button( "option", state.playing ? options.pause : options.play );
                    jQuery( "button#stop" ).button( "option", "disabled", state.stopped );

                    jQuery( ".rate.slider" ).slider( "value", Math.log( state.rate ) / Math.LN10 );

                    if ( state.rate < 1.0 ) {
                        var label_rate = 1.0 / state.rate;
                    } 
                    else {
                        var label_rate = state.rate;
                    }

                    var label = label_rate.toFixed(2).toString().replace( /(\.\d*?)0+$/, "$1" ).replace( /\.$/, "" );

                    if ( state.rate < 1.0 ) {
                        label = "&#x2215; " + label;
                    } else {
                        label = label + " &times;";
                    }

                    jQuery( ".rate.vwf-label" ).html( label );
                }, 
                "json" 
            );

            jQuery( "button#play" ).button(
                options.pause
            ). click( function() {
                jQuery.post(
                    state.playing ? "admin/pause" : "admin/play", 
                    undefined, 
                    function( data ) {
                        state = data;

                        jQuery( "button#play" ).button( "option", state.playing ? options.pause : options.play );
                        jQuery( "button#stop" ).button( "option", "disabled", state.stopped );
                    },
                    "json" 
                );
            } );


            jQuery( "button#stop" ).button(
                options.stop
            ). click( function() {
                jQuery.post(
                    "admin/stop", 
                    undefined, 
                    function( data ) {
                        state = data;

                        jQuery( "button#play" ).button( "option", state.playing ? options.pause : options.play );
                        jQuery( "button#stop" ).button( "option", "disabled", state.stopped );
                    }, 
                    "json" 
                );
            } );

            jQuery( ".rate.slider" ).slider(
                options.rate
            ) .bind( "slide", function( event, ui ) {
                jQuery.get( 
                    "admin/state", 

                    { "rate": Math.pow( 10, Number(ui.value) ) }, 

                    function( data ) {
                        state = data;

                        jQuery( ".rate.slider" ).slider( "value", Math.log( state.rate ) / Math.LN10 );

                        if ( state.rate < 1.0 ) {
                            var label_rate = 1.0 / state.rate;
                        } 
                        else {
                            var label_rate = state.rate;
                        }

                        var label = label_rate.toFixed(2).toString().replace( /(\.\d*?)0+$/, "$1" ).replace( /\.$/, "" );

                        if ( state.rate < 1.0 ) {
                            label = "&#x2215; " + label;
                        } else {
                            label = label + " &times;";
                        }

                        jQuery( ".rate.vwf-label" ).html( label );
                    }, 
                    "json"
                );
            } );

            this.timelineInit = true;
        }

        if (!this.editorOpen)
        {
            $(timeline).show('slide', {direction: 'right'}, 175);    
        }
        else
        {
            $(timeline).show();
        }
    }

        // -- showAboutTab ----------------------------------------------------------------------

    function showAboutTab() // invoke with the view as "this"
    {
        var about = this.about;

        if(!this.aboutInit)
        {
            jQuery('#about_tab').append("<div class='header'>About</div>" + 
                "<div class='about'><p style='font:bold 12pt Arial'>Virtual World Framework</p>" +
                "<p><b>Version: </b>" + version.join(".") + "</p>" +
                "<p><b>Site: </b><a href='http://virtualworldframework.com' target='_blank'>http://virtualworldframework.com</a></p>" +
                "<p><b>Source: </b><a href='https://github.com/virtual-world-framework' target='_blank'>https://github.com/virtual-world-framework</a></p></div>");

            this.aboutInit = true;
        }

        if (!this.editorOpen)
        {
            $(about).show('slide', {direction: 'right'}, 175);    
        }
        else
        {
            $(about).show();
        }
    }

    //  -- showModelsTab ----------------------------------------------------------------------

    function showModelsTab() // invoke with the view as "this"
    {
        var models = this.models;
        if(!this.modelsInit) {
            $(models).append("<div class='header'>Models</div>");
            this.modelsInit = true;
        }
        else {
            $(models+' .childContainer').remove();
        }

        $.getJSON("admin/models", function( data ) {
            $.each( data, function( key, value ) {
                var fileName = encodeURIComponent(value['basename']);
                var divId = fileName;
                if(divId.indexOf('.') != -1) {
                    divId = divId.replace(/\./g, "_");
                }
                var url = value['url'];

                $(models).append("<div><div id='" + divId + "' class='modelEntry' draggable='true' data-url='" + url + "'>"
                    + fileName + "</div><hr></div>");
                $("#" + divId).on("dragstart", function (e) {
                    var fileData = "{\"fileName\":\""+e.target.textContent+"\", \"fileUrl\":\""+e.target.getAttribute("data-url")+"\"}";
                    e.originalEvent.dataTransfer.setData('text/plain', fileData);
                    e.originalEvent.dataTransfer.setDragImage(e.target, 0, 0);
                    return true;
                });
            });
        } );

        if(!this.editorOpen) {
            $(models).show('slide', {direction: 'right'}, 175);
        }
        else {
            $(models).show();
        }
    }
} );
