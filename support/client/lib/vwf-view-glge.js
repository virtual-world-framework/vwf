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
 
        this.keysDown = { keys: {}, mods: {} };

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
                switch ( event.keyCode ) {
                    case 17:
                    case 16:
                    case 18:
                    case 19:
                    case 20:
                        break;                        
                    default:
                        glgeView.keysDown.keys[ event.keyCode ] = true;
                        break;
                }
            };

            window.onkeyup = function( event ) {
                switch ( event.keyCode ) {
                    case 16:
                    case 17:
                    case 18:
                    case 19:
                    case 20:
                        break;                        
                    default:
                        delete glgeView.keysDown.keys[ event.keyCode ];
                        break;
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
        return value;

    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function ( nodeID, propertyName, propertyValue ) {

//        this.logger.info( "gotProperty", nodeID, propertyName, propertyValue );
        var value = undefined;
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
                checkKeys( view, now, lasttime );
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

    // -- checkKeys ------------------------------------------------------------------------

    var checkKeys = function( view, now, lasttime ) {
        
        var sceneNode = view.state.scenes[ view.state.sceneRootID ];
        if ( sceneNode ) {
            var cameraNode = view.state.nodes[ sceneNode.camera.ID ];
            if ( cameraNode && cameraNode.glgeObject ) {
                if ( view.keysDown.keys && Object.keys( view.keysDown.keys ).length ) {
  
                  view.keysDown.mods = {
                    alt: sceneNode.glgeKeys.isKeyPressed( GLGE.KI_ALT ),
                    shift: sceneNode.glgeKeys.isKeyPressed( GLGE.KI_SHIFT ),
                    ctrl: sceneNode.glgeKeys.isKeyPressed( GLGE.KI_CTRL ),
                  }; 
 
                  // should only be sending the keysDown, now, lastime, but I'm going to
                  // inlcude the additional data for now to cut some corners
                  var params = [ view.keysDown, 
                                 now, 
                                 lasttime
                                ];
                  view.dispatchEvent( sceneNode.ID, "handleKeyEvents", params );
                }
            }
        }

    }

    var mouse; 
    var sceneCanvas;
    var container;
    var mouseDown = false;
    var mouseDownTime = undefined;
    var mouseOverCanvas = false;

    // -- initMouseEvents ------------------------------------------------------------------------

    var initMouseEvents = function (canvas, view) {

        var sceneNode = view.state.scenes[view.state.sceneRootID], child;
        var sceneID = view.state.sceneRootID;
        var sceneView = view;

        var mouseDownObjectID = undefined;
        var mouseOverObjectID = undefined;

        var lastXPos = -1;
        var lastYPos = -1;
        var glgeActualObj = undefined;

        container = document.getElementById("container");
        sceneCanvas = canvas;
        mouse = new GLGE.MouseInput( sceneCanvas );

        var mouseInfo = function( e, debug ) {
            var pickInfo = mousePick( e, sceneNode );
            var x = mouseXPos(e);
            var y = mouseYPos(e);
            if ( pickInfo ) {
                if ( debug ) {
                    if ( pickInfo.coord ) {    console.info( "     pickInfo.coord = " + pickInfo.coord ); }
                    if ( pickInfo.distance ) { console.info( "     pickInfo.distance = " + pickInfo.distance ); }
                    if ( pickInfo.normal ) {   console.info( "     pickInfo.distance = " + pickInfo.normal ); }
                }
                glgeActualObj = pickInfo.object;
                var mouseOverID = getPickObjectID( pickInfo, sceneView, debug );
                return { 
                            "lastX": lastXPos,
                            "lastY": lastYPos,
                            "X" : x,
                            "Y" : y,
                            "xPercent": x / sceneCanvas.width,
                            "yPercent": y / sceneCanvas.height,
                            "mouseDownID" : mouseDownObjectID,
                            "mouseOverID" : mouseOverID,
                            "pickInfo" : {
                                            "coord": pickInfo.coord,
                                            "distance": pickInfo.distance,
                                            "normal": pickInfo.normal,
                                            "texture": { "u": pickInfo.texture[0], "v": pickInfo.texture[1] },
                                        },
                            "mouseDownTime": mouseDownTime,
                            "mouseEventTime": parseInt( new Date().getTime() ),
                        };
            } else {
                return { 
                            "lastX": lastXPos,
                            "lastY": lastYPos,
                            "X" : x,
                            "Y" : y,
                            "xPercent": x / sceneCanvas.width,
                            "yPercent": y / sceneCanvas.height,
                            "mouseDownID" : mouseDownObjectID,
                            "mouseOverID" : undefined,
                            "pickInfo" : undefined,
                            "mouseDownTime": mouseDownTime,
                            "mouseEventTime": parseInt( new Date().getTime() ),
                        };                
            }
                            
            return undefined;                
        }

        canvas.onmousedown = function (e) {
            mouseDown = true;
            var mi = mouseInfo( e, false );
            if ( mi ) {
                mouseDownObjectID = mi.mouseOverID;

                sceneView.dispatchEvent( sceneID, "mouseDown", [ mi ] );
            }
            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
            mouseDownTime = parseInt( new Date().getTime() );

        }

        canvas.onmouseup = function( e ) {
            var ctrlDown = sceneNode.glgeKeys.isKeyPressed( GLGE.KI_CTRL );
            var atlDown = sceneNode.glgeKeys.isKeyPressed( GLGE.KI_ALT );
            var ctrlAndAltDown = ctrlDown && atlDown;
            var mi = mouseInfo( e, ctrlAndAltDown );
            if ( mi ) {
                var mouseUpObjectID =  mi.mouseOverID;
                // check for time??
                if ( mouseUpObjectID && mouseDownObjectID && mouseUpObjectID == mouseDownObjectID ) {
//                    this.logger.info( "pointerClick: id: ", mouseDownObjectID, "   name: ", name( view.state.nodes[mouseDownObjectID].glgeObject ) );

                    var eventData = { client: "123456789ABCDEFG", button: "left", clicks: 1, buttons: { left: true, right: false, middle: false }, modifiers: { shift: false, ctrl: false, alt: false, meta: false } }; // representative event data
                    var eventNodeData = { position: [ 0, 0, 0 ], normal: [ 0, 0, 1 ], source: [ 0, 0, -1 ], distance: 1 }; // representative per-target event data

                    var eventParameters = [ eventData ]; // parameters for every target
                    var eventNodeParameters = { "": [ eventNodeData ] }; // additional per-target parameters

                    view.dispatchEvent( mouseUpObjectID, "pointerClick", eventParameters, eventNodeParameters );

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

                //this.throwEvent( "onMouseUp", mouseDownObjectID);
                sceneView.dispatchEvent( sceneID, "mouseUp", [ mi ] );

            }
            mouseDownObjectID = undefined;
            mouseDownTime = undefined;
            mouseDown = false;

            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
        }

        canvas.onmouseover = function (e) {
            mouseOverCanvas = true;
            var mi = mouseInfo( e, false );
            if ( mi ) {
                sceneView.dispatchEvent( sceneID, "mouseOver", [ mi ] );
            }

            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
        }


        canvas.onmousemove = function (e) {
            var mi = mouseInfo( e, false );
            if ( mi ) {
                if (mouseDown) {
                    //if (mouseDownObjectID) {

                        //this.throwEvent( "onMouseMove", mouseDownObjectID);
                        sceneView.dispatchEvent( sceneID, "mouseMove", [ mi ] );
                    //}

                    //view.callMethod( mouseDownObjectID, "onMouseMove" );
                } else {
                    if ( mi.mouseOverID ) {
                        if (mouseOverObjectID) {
                            if (mi.mouseOverID != mouseOverObjectID) {

                                //this.throwEvent( "onMouseLeave", mouseOverObjectID);

                                mouseOverObjectID = mi.mouseOverID;
                                sceneView.dispatchEvent( sceneID, "mouseLeave", [ mi ] );

                                //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                                sceneView.dispatchEvent( sceneID, "mouseEnter", [ mi ] );
                            } else {
                                //this.throwEvent( "onMouseHover", mouseOverObjectID);
                                sceneView.dispatchEvent( sceneID, "mouseHover", [ mi ] );
                            }
                        } else {
                            mouseOverObjectID = mi.mouseOverID;

                            //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                            sceneView.dispatchEvent( sceneID, "mouseEnter", [ mi ] );
                        }

                    } else {
                        if (mouseOverObjectID) {
                            //this.throwEvent( "onMouseLeave", mouseOverObjectID);
                            mouseOverObjectID = undefined;
                            sceneView.dispatchEvent( sceneID, "mouseLeave", [ mi ] );

                        }
                    }
                }
            }

            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );

            //this.mouseOverCanvas = true; 
        }

        canvas.onmouseout = function (e) {
            if (mouseOverObjectID) {
                //this.throwEvent( "onMouseLeave", mouseOverObjectID);
                mouseOverObjectID = undefined;
                //vwf.dispatchEvent( sceneID, "mouseOut" );
            }
            mouseOverCanvas = false;
        }

        canvas.onmousewheel = function (e) {
            var mi = mouseInfo( e, false );
            if ( mi ) {
                mi.wheelDelta = e.wheelDelta;
                mi.wheelDeltaX = e.wheelDeltaX;
                mi.wheelDeltaY = e.wheelDeltaY;
                
                sceneView.dispatchEvent( sceneID, "mouseWheel", [ mi ] );
            }
            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );            
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

})(window.vwf.modules, "vwf.view.glge");

