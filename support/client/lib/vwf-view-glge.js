(function (modules, namespace) {

    window.console && console.info && console.info("loading " + namespace);

    // vwf-view-glge.js is a placeholder for an GLGE WebGL view of the scene.
    //
    // vwf-view-glge is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern).
    // It attaches to the vwf modules list as vwf.modules.glge.

    var module = modules[namespace.split(".").pop()] = function(vwf, rootSelector) {

        if (!vwf) return;

        modules.view.call( this, vwf );
        this.namespace = namespace;

        this.rootSelector = rootSelector;
        this.canvasQuery = undefined;
 
        this.keyStates = { keysDown: {}, mods: {} };

        this.height = 600;
        this.width = 800;

        if ( window && window.innerHeight ) this.height = window.innerHeight - 20;
        if ( window && window.innerWidth ) this.width = window.innerWidth - 20;

        //console.info( "aspectRatio = " + (( this.width / this.height ) / 1.333 ) );

        this.canvasQuery = jQuery(this.rootSelector).append(
            "<canvas id='" + this.state.sceneRootID + "' class='vwf-scene' width='"+this.width+"' height='"+this.height+"'/>"
        ).children(":last");
        
        var dropbox = document.getElementById(this.state.sceneRootID);
        dropbox.addEventListener("dragenter", dragEnter, false);
        dropbox.addEventListener("dragexit", dragExit, false);
        dropbox.addEventListener("dragover", dragOver, false);
        dropbox.addEventListener("drop", dropObject, false);
           
        // Connect GLGE to the VWF timeline.
        GLGE.now = function() {
            return vwf.time() * 1000;
        };

    };

    // Delegate any unimplemented functions to vwf-view.

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // This is a placeholder for maintaining a view of the changing state of the simulation using
    // nested HTML block elements.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, childID, childExtendsID, childImplementsIDs,
        childSource, childType, childName, callback /* ( ready ) */) {

//        this.logger.info( "createdNode", nodeID, childID, childExtendsID, childImplementsIDs,
//                            childSource, childType, childName );

        if ( childID == this.state.sceneRootID /*&& ( nodeExtendsID == "http-vwf-example-com-types-glge" || nodeExtendsID == "appscene-vwf" )*/ ) {
            
            var glgeView = this;
            var domWin = window;
            var canvas = this.canvasQuery.get( 0 );
            window.onkeydown = function( event ) {
                var key = undefined;
                switch ( event.keyCode ) {
                    case 17:
                    case 16:
                    case 18:
                    case 19:
                    case 20:
                        break;                        
                    default:
                        key = getKeyValue( event.keyCode );
                        glgeView.keyStates.keysDown[ key.key ] = key;
                        break;
                }

                if ( !glgeView.keyStates.mods ) glgeView.keyStates.mods = {};
                glgeView.keyStates.mods.alt = event.altKey;
                glgeView.keyStates.mods.shift = event.shiftKey;
                glgeView.keyStates.mods.ctrl = event.ctrlKey;
                glgeView.keyStates.mods.meta = event.metaKey;

                var sceneNode = glgeView.state.scenes[ glgeView.state.sceneRootID ];
                if ( sceneNode ) {
                  //var params = JSON.stringify( glgeView.keyStates );
                  glgeView.dispatchEvent( sceneNode.ID, "keyDown", [ glgeView.keyStates ] );
                }
            };

            window.onkeyup = function( event ) {
                var key = undefined;
                switch ( event.keyCode ) {
                    case 16:
                    case 17:
                    case 18:
                    case 19:
                    case 20:
                        break;                        
                    default:
                        key = getKeyValue( event.keyCode );
                        delete glgeView.keyStates.keysDown[ key.key ];
                        break;
                }

                glgeView.keyStates.mods.alt = event.altKey;
                glgeView.keyStates.mods.shift = event.shiftKey;
                glgeView.keyStates.mods.ctrl = event.ctrlKey;
                glgeView.keyStates.mods.meta = event.metaKey;

                var sceneNode = glgeView.state.scenes[ glgeView.state.sceneRootID ];
                if ( sceneNode ) {
                  //var params = JSON.stringify( glgeView.keyStates );
                  glgeView.dispatchEvent( sceneNode.ID, "keyUp", [ glgeView.keyStates ] );
                }

            };

            window.onresize = function() {
                var origWidth = glgeView.width;
                var origHeight = glgeView.height;
                if ( domWin && domWin.innerHeight ) glgeView.height = domWin.innerHeight - 20;
                if ( domWin && domWin.innerWidth ) glgeView.width = domWin.innerWidth - 20; 

                if ( ( origWidth != glgeView.width ) || ( origHeight != glgeView.height ) ) {
                    canvas.height = glgeView.height;
                    canvas.width = glgeView.width;
                    var camID = glgeView.state.cameraInUseID                
                    if ( !camID && camID != "" ) {
                        var cam = glgeView.state.cameraInUse;
                        camID = getObjectID.call( this, cam, glgeView, false, false );
                    }
                    if ( camID && camID != "" ) {
                        //console.info( "aspectRatio = " + (( glgeView.width / glgeView.height ) / 1.333 ) );
                        vwf.setProperty( camID, "aspect", (glgeView.width / glgeView.height) /*/ 1.333*/ );
                    }
                    vwf.setProperty( glgeView.state.sceneRootID, "size", [ glgeView.width, glgeView.height ] );
                }              
            }

            var sceneNode = this.state.scenes[ childID ];
            if ( sceneNode ) {
                initScene.call( this, sceneNode );
            }
        } 
    };

    // -- deletedNode ------------------------------------------------------------------------------

    module.prototype.deletedNode = function( nodeID ) {

       //this.logger.info( "deletedNode", nodeID );

       //vwf.logger.warn( namespace + ".deletedNode " + "unimplemented" );

    };

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function( nodeID, childID, childName ) {

//        this.logger.info( "addedChild", nodeID, childID, childName );

    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function( nodeID, childID ) {

//        this.logger.info( "removedChild", nodeID, childID );

    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function (nodeID, propertyName, propertyValue) {

//        this.logger.info( "createdProperty", nodeID, propertyName, propertyValue );

    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function (nodeID, propertyName, propertyValue) {

//        this.logger.info( "satProperty", nodeID, propertyName, propertyValue );
        var value = undefined;
//        if ( this.state.scenes[ nodeID ] ) {
//            var canvas = this.canvasQuery.get( 0 );
//            switch ( propertyName ) {
//                case "size":
//                   console.info( "satProperty " + propertyName ); 
//                   if ( canvas && propertyValue.constructor == Array && propertyValue.length > 1 ) {
//                       canvas.width = propertyValue[0];
//                       canvas.height = propertyValue[1];
//                       value = propertyValue;
//                   }
//                   break; 
//            }
//        }
        return value;

    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function ( nodeID, propertyName, propertyValue ) {

//        this.logger.info( "gotProperty", nodeID, propertyName, propertyValue );
        var value = undefined;
//        if ( this.state.scenes[ nodeID ] ) {
//            var canvas = this.canvasQuery.get( 0 );
//            switch ( propertyName ) {
//                case "size":
//                    console.info( "gotProperty " + propertyName ); 
//                    if ( canvas ) {
//                        value = [ canvas.width, canvas.height ];
//                    } else {
//                        value = [ this.width, this.height ];
//                    }
//                    break; 
//            }
//        }
        return value;

    };

    // == Private functions ========================================================================

    // -- initScene ------------------------------------------------------------------------

    function initScene( sceneNode ) {

        var canvas = this.canvasQuery.get( 0 );

        if ( canvas ) {
            sceneNode.glgeRenderer = new GLGE.Renderer( canvas );
            sceneNode.glgeRenderer.setScene( sceneNode.glgeScene );

            sceneNode.glgeScene.setAmbientColor( [ 183, 183, 183 ] );

            this.state.cameraInUse = sceneNode.glgeScene.camera;
            this.state.cameraInUse.setAspect( ( canvas.width / canvas.height) /*/ 1.333 */ );

            // set up all of the mouse event handlers
            initMouseEvents( canvas, this );

            // Schedule the renderer.

            var view = this;
            var scene = sceneNode.glgeScene;
            var renderer = sceneNode.glgeRenderer;
            var lasttime = 0;
            var now;
            function renderScene() {
                now = parseInt( new Date().getTime() );
                renderer.render();
                lasttime = now;
            };

            setInterval( renderScene, 1 );
        }
    } 

    // -- initCamera ------------------------------------------------------------------------

    function initCamera( glgeCamera ) {
        if ( glgeCamera ) {
            glgeCamera.setLoc( 0, 0, 0 );
            glgeCamera.setRot( 0, 0, 0 );
            glgeCamera.setType( GLGE.C_PERSPECTIVE );
            glgeCamera.setRotOrder( GLGE.ROT_XZY );
        }        
    }

    var mouse; 
    var sceneCanvas;
    var container;
    var mouseOverCanvas = false;

    // -- initMouseEvents ------------------------------------------------------------------------

    var initMouseEvents = function (canvas, view) {

        var sceneNode = view.state.scenes[view.state.sceneRootID], child;
        var sceneID = view.state.sceneRootID;
        var sceneView = view;

        var pointerDownID = undefined;
        var pointerOverID = undefined;
        var pointerPickID = undefined;
        var glgeActualObj = undefined;

        var lastXPos = -1;
        var lastYPos = -1;
        var mouseRightDown = false;
        var mouseLeftDown = false;
        var mouseMiddleDown = false;

        container = document.getElementById("container");
        sceneCanvas = canvas;
        mouse = new GLGE.MouseInput( sceneCanvas );

        var getEventData = function( e, debug ) {
            var returnData = { eventData: undefined, eventNodeData: undefined };
            var pickInfo = mousePick( e, sceneNode );
            pointerPickID = undefined;

            glgeActualObj = pickInfo ? pickInfo.object : undefined;
            pointerPickID = pickInfo ? getPickObjectID( pickInfo, sceneView, debug ) : undefined;
            var mouseButton = "left";
            switch( e.button ) {
                case 2: 
                    mouseButton = "right";
                    break;
                case 1: 
                    mouseButton = "middle";
                    break;
                default:
                    mouseButton = "left";
                    break;
            };

            returnData.eventData = [ {
                client: "123456789ABCDEFG",
                button: mouseButton,
                clicks: 1,
                buttons: {
                        left: mouseLeftDown,
                        middle: mouseMiddleDown,
                        right: mouseRightDown,
                    },
                modifiers: {
                        alt: e.altKey,
                        ctrl: e.ctrlKey,
                        shift: e.shiftKey,
                        meta: e.metaKey,
                    },
                position: [ mouseXPos(e)/sceneView.width, mouseYPos(e)/sceneView.height ],
            } ];

            returnData.eventNodeData = { "": [ {
                normal: undefined,
                source: undefined,
                distance: undefined,
                globalPosition: undefined,
                globalNormal: undefined,
                globalSource: undefined,            
            } ] };


            if ( pickInfo ) {
                returnData.eventNodeData[""][0].position = pickInfo.coord;
                returnData.eventNodeData[""][0].normal = pickInfo.normal;
                returnData.eventNodeData[""][0].distance = pickInfo.distance;
            }
            var camera = sceneView.state.cameraInUse;
            if ( camera ) {
                returnData.eventNodeData[""][0].source = new Array;
                returnData.eventNodeData[""][0].source.push( camera.getLocX(), camera.getLocY(), camera.getLocZ() );
            }

            return returnData;
        }          

        canvas.onmousedown = function( e ) {
           switch( e.button ) {
                case 2: 
                    mouseRightDown = true;
                    break;
                case 1: 
                    mouseMiddleDown = true;
                    break;
                case 0:
                    mouseLeftDown = true;
                    break;
            };
            var eData = getEventData( e, false );
            if ( eData ) {
                pointerDownID = pointerPickID ? pointerPickID : sceneID;
                sceneView.dispatchEvent( pointerDownID, "pointerDown", eData.eventData, eData.eventNodeData );
            }
        }

        canvas.onmouseup = function( e ) {
            var ctrlDown = e.ctrlKey;
            var atlDown = e.altKey;
            var ctrlAndAltDown = ctrlDown && atlDown;

            switch( e.button ) {
                case 2: 
                    mouseRightDown = false;
                    break;
                case 1: 
                    mouseMiddleDown = false;
                    break;
                case 0:
                    mouseLeftDown = false;
                    break;
            };

            var eData = getEventData( e, ctrlAndAltDown );
            if ( eData ) {
                var mouseUpObjectID = pointerPickID;
                if ( mouseUpObjectID && pointerDownID && mouseUpObjectID == pointerDownID ) {
                    view.dispatchEvent( mouseUpObjectID, "pointerClick", eData.eventData, eData.eventNodeData );

                    var glgeObj = sceneView.state.nodes[mouseUpObjectID].glgeObject;
                    if ( glgeObj ) {
                        if( ctrlDown && !atlDown ) {
                            if ( sceneView.state.nodes[mouseUpObjectID] ) {
                                var colladaObj;
                                var currentObj = glgeObj;
                                while ( !colladaObj && currentObj ) {
                                    if ( currentObj.constructor == GLGE.Collada )
                                        colladaObj = currentObj;
                                    else
                                        currentObj = currentObj.parent;
                                } 
                                if ( colladaObj ) {
                                    recurseGroup( colladaObj, 0 );
                                }
                            }                
                        } else if ( atlDown && !ctrlDown ) {
                            recurseGroup( glgeObj, 0 ); 
                        }
                    }
                }

                sceneView.dispatchEvent( pointerDownID, "pointerUp", eData.eventData, eData.eventNodeData );
            }
            pointerDownID = undefined;
        }

        canvas.onmouseover = function( e ) {
            mouseOverCanvas = true;
            var eData = getEventData( e, false );
            if ( eData ) {
                pointerOverID = pointerPickID ? pointerPickID : sceneID;
                sceneView.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
            }
        }

        canvas.onmousemove = function( e ) {
            var eData = getEventData( e, false );
            if ( eData ) {
                if ( mouseLeftDown || mouseRightDown || mouseMiddleDown ) {
                    sceneView.dispatchEvent( pointerDownID, "pointerMove", eData.eventData, eData.eventNodeData );
                } else {
                    if ( pointerPickID ) {
                        if ( pointerOverID ) {
                            if ( pointerPickID != pointerOverID ) {
                                sceneView.dispatchEvent( pointerOverID, "pointerLeave", eData.eventData, eData.eventNodeData );
                                pointerOverID = pointerPickID;
                                sceneView.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
                            } else {
                                sceneView.dispatchEvent( pointerOverID, "pointerHover", eData.eventData, eData.eventNodeData );
                            }
                        } else {
                            pointerOverID = pointerPickID;
                            sceneView.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
                        }
                    } else {
                        if ( pointerOverID ) {
                            sceneView.dispatchEvent( pointerOverID, "pointerLeave", eData.eventData, eData.eventNodeData );
                            pointerOverID = undefined;
                        }
                    }
                }
            }
        }

        canvas.onmouseout = function( e ) {
            if ( pointerOverID ) {
                sceneView.dispatchEvent( pointerOverID, "pointerLeave" );
                pointerOverID = undefined;
            }
            mouseOverCanvas = false;
        }

        canvas.onmousewheel = function( e ) {
            var eData = getEventData( e, false );
            if ( eData ) {
                eData.wheel = {
                    delta: e.wheelDelta,
                    deltaX: e.wheelDeltaX,
                    deltaY: e.wheelDeltaY,
                };
                var id = sceneID;
                if ( pointerDownID && mouseRightDown || mouseLeftDown || mouseMiddleDown )
                    id = pointerDownID;
                else if ( pointerOverID )
                    id = pointerOverID; 
                    
                sceneView.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );
            }
        }

    };

    function nameGlge(obj) {
        return obj.colladaName || obj.colladaId || obj.name || obj.id || obj.uid || "";
    }

    function name(obj) {
        return obj.colladaName || obj.colladaId || obj.name || obj.id || "";
    }

    function path(obj) {
        var sOut = "";
        var sName = "";

        while (obj && obj.parent) {
            if (sOut == "")
                sOut = name(obj);
            else
                sOut = name(obj) + "." + sOut;
            obj = obj.parent;
        }
        return sOut;
    }

    var mouseXPos = function(e) {
        return e.clientX - e.currentTarget.offsetLeft + window.scrollX;
    }

    var mouseYPos = function(e) {
        return e.clientY - e.currentTarget.offsetTop + window.scrollY;
    }

    var getPickObjectID = function( pickInfo, view, debug ) {

        if ( pickInfo && pickInfo.object ) {
            return getObjectID( pickInfo.object, view, true, debug );
        }
        return undefined;

    }

    var getObjectID = function( objectToLookFor, view, bubbleUp, debug ) {

        var objectIDFound = -1;
            
        while (objectIDFound == -1 && objectToLookFor) {
            if ( debug ) {
                console.info("====>>>  vwf.view-glge.mousePick: searching for: " + path(objectToLookFor) );
            }
            jQuery.each( view.state.nodes, function (nodeID, node) {
                if ( node.glgeObject == objectToLookFor && !node.glgeMaterial ) {
                    if ( debug ) { console.info("pick object name: " + name(objectToLookFor) + " with id = " + nodeID ); }
                    objectIDFound = nodeID;
                }
            });
            if ( bubbleUp ) {
                objectToLookFor = objectToLookFor.parent;
            } else {
                objectToLookFor = undefined;
            }
        }
        if (objectIDFound != -1)
            return objectIDFound;

        return undefined;
    };

    var mousePick = function( e, sceneNode ) {

        if (sceneNode && sceneNode.glgeScene) {
            var objectIDFound = -1;
            var x = mouseXPos( e );
            var y = mouseYPos( e );

            return sceneNode.glgeScene.pick(x, y);
        }
        return undefined;

    };

    var recurseGroup = function( grp, iDepth ) {
        if ( grp && grp.getChildren ) {
            var grpChildren = grp.getChildren();
            var sOut = indent(iDepth);
            var name = "";

            for (var i = 0; i < grpChildren.length; i++) {
                if (grpChildren[i].constructor == GLGE.Collada) {
                    iDepth++;
                    outputCollada(grpChildren[i], iDepth, true);
                    recurseGroup(grpChildren[i], iDepth + 1);
                    outputCollada(grpChildren[i], iDepth, false);
                    iDepth--;
                } else if (grpChildren[i].constructor == GLGE.Group) {
                    iDepth++;
                    outputGroup(grpChildren[i], iDepth, true);
                    recurseGroup(grpChildren[i], iDepth + 1);
                    outputGroup(grpChildren[i], iDepth, false);
                    iDepth--;
                } else if ( grpChildren[i].constructor == GLGE.Object ) {
                    outputObject(grpChildren[i], iDepth);
                }
            }
        } else if ( grp.constructor == GLGE.Object ) {
            outputObject( grp, iDepth );
        }
    };

    var getChildCount = function(grp) {
        var iCount = 0;
        if (grp) {
            var grpChildren = grp.getChildren();
            if (grpChildren) {
                for (var i = 0; i < grpChildren.length; i++) {
                    if (grpChildren[i].constructor != GLGE.Object) {
                        iCount++;
                    }
                }
            }
        }
        return iCount;
    };

    var indentStr = function() {
        return "  ";
    };

    var indent = function(iIndent) {
        var sOut = "";
        for (var j = 0; j < iIndent; j++) { sOut = sOut + indentStr(); }
        return sOut;
    };

    var outputCollada = function(collada, iIndent, open) {
        var sOut = indent(iIndent);
        if (open) {
            console.info(sOut + "children:")
        }
    };

    var outputGroup = function(group, iIndent, open) {
        var sOut = indent(iIndent + 1);
        if (open) {
            lastGroupName = name(group);
            console.info(indent(iIndent) + lastGroupName + ":");
            console.info(indent(iIndent + 1) + "extends: http://vwf.example.com/types/node3");

            if (getChildCount(group) > 0)
                console.info(sOut + "children:");
        }
    };

    var objectIndex = 1;
    var outputObject = function(obj, iIndent) {
        var indentAdd = 0;
        var objName = name( obj );
        if ( objName != "" ) {
            console.info( indent(iIndent) + "children:" );
            console.info( indent(iIndent+1) + objName + ":");
            console.info( indent(iIndent+2) + "extends: http://vwf.example.com/types/object3");
            indentAdd = 2;
        }

//        if ( ( obj.getMesh && obj.getMesh() ) || ( obj.multimaterials && obj.multimaterials.length > 0 ) ) {
//            console.info( indent( iIndent+indentAdd ) + "children:" );

//            if ( obj.getMesh && obj.getMesh() ) {
//                var mesh = obj.getMesh();
//                var meshName = name( mesh );
//                if ( meshName != "" ) {
//                    console.info( indent( iIndent + indentAdd + 1 ) + meshName + ":" );
//                    console.info( indent( iIndent + indentAdd + 2 ) + "extends: http://vwf.example.com/types/mesh" );
//                }
//            }
//            if ( obj.multimaterials && obj.multimaterials.length > 0 ) {
//                materialIndex = 1;
//                for ( var i = 0; i < obj.multimaterials.length; i++ ) {
//                    outputMaterial( obj.getMaterial(i), iIndent + 1 + indentAdd, objName, i );
//                }
//            }
//        }
    };

    var outputMaterial = function( obj, iIndent, objName, index  ) {

        var sOut = indent(iIndent + 1);
        console.info( indent(iIndent) + objName + "Material" + index + ":" );
        console.info( sOut + "extends: http://vwf.example.com/types/material");

    };
    
    // == Draggable Content ========================================================================
    
    // -- dragEnter --------------------------------------------------------------------------------
    
    function dragEnter( evt ) {
        evt.stopPropagation();
        evt.preventDefault();  
    }
    
    // -- dragExit ---------------------------------------------------------------------------------
    
    function dragExit( evt ) {
        evt.stopPropagation();
        evt.preventDefault();  
    }
    
    // -- dragOver ---------------------------------------------------------------------------------
    
    function dragOver( evt ) {
        evt.stopPropagation();
        evt.preventDefault();  
    }
    
    // -- dragObject --------------------------------------------------------------------------------
    
    function dropObject( evt ) {
        evt.stopPropagation();
        evt.preventDefault();  
            
        var files = evt.dataTransfer.files;
        var file = files[0];
        console.info(file.name);
        
        /*var object = {
          extends: "http://vwf.example.com/types/node3",
          source: file.name,
          type: "model/vnd.collada+xml",
          properties: { 
            position: [ 0, 0, 0 ],
            scale: [ 1, 1, 1 ], 
          },   
        };
        vwf.createNode( "index-vwf", object, "draggedObject", undefined );*/
    }

    var getKeyValue = function( keyCode ) {
        var key = { key: undefined, code: keyCode, char: undefined };
        switch ( keyCode ) {
            case 8:
                key.key = "backspace";
                break;
            case 9:
                key.key = "tab";
                break;
            case 13:
                key.key = "enter";
                break;
            case 16:
                key.key = "shift";
                break;
            case 17:
                key.key = "ctrl";
                break;
            case 18:
                key = "alt";
                break;
            case 19:
                key.key = "pausebreak";
                break;
            case 20:
                key.key = "capslock";
                break;
            case 27:
                key.key = "escape";
                break;
            case 33:
                key.key = "pageup";
                break;
            case 34:
                key.key = "pagedown";
                break;
            case 35:
                key.key = "end";
                break;
            case 36:
                key.key = "home";
                break;
            case 37:
                key.key = "leftarrow";
                break;
            case 38:
                key.key = "uparrow";
                break;
            case 39:
                key.key = "rightarrow";
                break;
            case 40:
                key.key = "downarrow";
                break;
            case 45:
                key.key = "insert";
                break;
            case 46:
                key.key = "delete";
                break;
            case 48:
                key.key = "0";
                key.char = "0";
                break;
            case 49:
                key.key = "1";
                key.char = "1";
                break;
            case 50:
                key.key = "2";
                key.char = "2";
                break;
            case 51:
                key.key = "3";
                key.char = "3";
                break;
            case 52:
                key.key = "4";
                key.char = "4";
                break;
            case 53:
                key.key = "5";
                key.char = "5";
                break;
            case 54:
                key.key = "6";
                key.char = "6";
                break;
            case 55:
                key.key = "7";
                key.char = "&";
                break;                
            case 56:
                key.key = "8";
                key.char = "8";
                break;
            case 57:
                key.key = "9";
                key.char = "9";
                break;  
            case 65:
                key.key = "A";
                key.char = "A";
                break;
            case 66:
                key.key = "B";
                key.char = "B";
                break;
            case 67:
                key.key = "C";
                key.char = "C";
                break;
            case 68:
                key.key = "D";
                key.char = "D";
                break;
            case 69:
                key.key = "E";
                key.char = "E";
                break;
            case 70:
                key.key = "F";
                key.char = "F";
                break;
            case 71:
                key.key = "G";
                key.char = "G";
                break;
            case 72:
                key.key = "H";
                key.char = "H";
                break;
            case 73:
                key.key = "I";
                key.char = "I";
                break;                
            case 74:
                key.key = "J";
                key.char = "J";
                break;
            case 75:
                key.key = "K";
                key.char = "K";
                break;                 
            case 76:
                key.key = "L";
                key.char = "L";
                break;
            case 77:
                key.key = "M";
                key.char = "M";
                break;
            case 78:
                key.key = "N";
                key.char = "N";
                break;
            case 79:
                key.key = "O";
                key.char = "O";
                break;
            case 80:
                key.key = "P";
                key.char = "P";
                break;
            case 81:
                key.key = "Q";
                key.char = "Q";
                break;
            case 82:
                key.key = "R";
                key.char = "R";
                break;
            case 83:
                key.key = "S";
                key.char = "S";
                break;                
            case 84:
                key.key = "T";
                key.char = "T";
                break;
            case 85:
                key.key = "U";
                key.char = "U";
                break;                  
            case 86:
                key.key = "V";
                key.char = "V";
                break;
            case 87:
                key.key = "W";
                key.char = "W";
                break;
            case 88:
                key.key = "X";
                key.char = "X";
                break;                
            case 89:
                key.key = "Y";
                key.char = "Y";
                break;
            case 90:
                key.key = "Z";
                key.char = "Z";
                break; 
            case 91:
                key.key = "leftwindow";
                break;
            case 92:
                key.key = "rightwindow";
                break;
            case 93:
                key.key = "select";
                break;
            case 96:
                key.key = "numpad0";
                key.char = "0";
                break;
            case 97:
                key.key = "numpad1";
                key.char = "1";
                break;
            case 98:
                key.key = "numpad2";
                key.char = "2";
                break;
            case 99:
                key.key = "numpad3";
                key.char = "3";
                break;
            case 100:
                key.key = "numpad4";
                key.char = "4";
                break;
            case 101:
                key.key = "numpad5";
                key.char = "5";
                break;
            case 102:
                key.key = "numpad6";
                key.char = "6";
                break;
            case 103:
                key.key = "numpad7";
                key.char = "7";
                break;
            case 104:
                key.key = "numpad8";
                key.char = "8";
                break;
            case 105:
                key.key = "numpad9";
                key.char = "9";
                break;
            case 106:
                key.key = "multiply";
                key.char = "*";
                break;
            case 107:
                key.key = "add";
                key.char = "+";
                break;
            case 109:
                key.key = "subtract";
                key.char = "-";
                break;
            case 110:
                key.key = "decimalpoint";
                key.char = ".";
                break;
            case 111:
                key.key = "divide";
                key.char = "/";
                break;
            case 112:
                key.key = "f1";
                break;
            case 113:
                key.key = "f2";
                break;
            case 114:
                key.key = "f3";
                break;
            case 115:
                key.key = "f4";
                break;
            case 116:
                key.key = "f5";
                break;
            case 117:
                key.key = "f6";
                break;
            case 118:
                key.key = "f7";
                break;
            case 119:
                key.key = "f8";
                break;
            case 120:
                key.key = "f9";
                break;
            case 121:
                key.key = "f10";
                break;
            case 122:
                key.key = "f11";
                break;
            case 123:
                key.key = "f12";
                break;
            case 144:
                key.key = "numlock";
                break;
            case 145:
                key.key = "scrolllock";
                break;
            case 186:
                key.key = "semicolon";
                key.char = ";";
                break;
            case 187:
                key.key = "equal";
                key.char = "=";
                break;
            case 188:
                key.key = "comma";
                key.char = ",";
                break;
            case 189:
                key.key = "dash";
                key.char = "-";
                break;
            case 190:
                key.key = "period";
                key.char = ".";
                break;
            case 191:
                key.key = "forwardslash";
                key.char = "/";
                break;
            case 192:
                key.key = "graveaccent";
                break;
            case 219:
                key.key = "openbraket";
                key.char = "{";
                break;
            case 220:
                key.key = "backslash";
                key.char = "\\";
                break;
            case 221:
                key.key = "closebraket";
                key.char = "}";
                break;
            case 222:
                key.key = "singlequote";
                key.char = "'";
                break;
            case 32:
                key.key = "space";
                key.char = " ";
                break;
        }
        return key;
    };

})(window.vwf.modules, "vwf.view.glge");

