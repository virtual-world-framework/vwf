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

        var height = 600;
        var width = 800;

        if ( window && window.innerHeight ) height = window.innerHeight - 40;
        if ( window && window.innerWidth ) width = window.innerWidth - 40;

        console.info( "aspectRatio = " + ( width / height ) );

        this.canvasQuery = jQuery(this.rootSelector).append(
            "<canvas id='" + this.state.sceneRootID + "' class='vwf-scene' width='"+width+"' height='"+height+"'/>"
        ).children(":last");
           
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
                var height = 600;
                var width = 800;
                if ( domWin && domWin.innerHeight ) height = domWin.innerHeight - 40;
                if ( domWin && domWin.innerWidth ) width = domWin.innerWidth - 40; 
                canvas.height = height;
                canvas.width = width;
                var camID = glgeView.state.cameraInUseID                
                if ( !camID && camID != "" ) {
                    var cam = glgeView.state.cameraInUse;
                    camID = getObjectID.call( this, cam, glgeView, false, false );
                }
                if ( camID && camID != "" ) {
                    glgeView.settingProperty( camID, "aspect", width/height*0.90 );
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
        return undefined;

    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function (nodeID, propertyName, propertyValue) {

//        this.logger.info( "gotProperty", nodeID, propertyName, propertyValue );

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
                   
                  var mat = cameraNode.glgeObject.getRotMatrix();
                  var trans = GLGE.mulMat4Vec4( mat, [0, 0, -1, 1] );
                  var mag = Math.pow( Math.pow( trans[0], 2 ) + Math.pow( trans[1], 2 ), 0.5 );
 
                  // should only be sending the keysDown, now, lastime, but I'm going to
                  // inlcude the additional data for now to cut some corners
                  var params = [ JSON.stringify( view.keysDown ), 
                                    JSON.stringify(now), 
                                    JSON.stringify(lasttime), 
                                    JSON.stringify(mat),
                                    JSON.stringify(trans),
                                    JSON.stringify(mag) ];
                  view.execute( sceneNode.ID, "this.handleKeyEvents && this.handleKeyEvents("+params.join(',')+")", "application/javascript" );
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
                            "X" : mouseXPos(e),
                            "Y" : mouseYPos(e),
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
                            "trans": undefined,
                            "mag": undefined,
                            "camPos": undefined, 
                            "camRot": undefined,                             
                        };
            } else {
                return { 
                            "lastX": lastXPos,
                            "lastY": lastYPos,
                            "X" : mouseXPos(e),
                            "Y" : mouseYPos(e),
                            "mouseDownID" : mouseDownObjectID,
                            "mouseOverID" : undefined,
                            "pickInfo" : undefined,
                            "mouseDownTime": mouseDownTime,
                            "mouseEventTime": parseInt( new Date().getTime() ),
                            "trans": undefined,
                            "mag": undefined,
                            "camPos": undefined, 
                            "camRot": undefined,
                        };                
            }
                            
            return undefined;                
        }
        
        var cameraInfo = function( info ) {
            var camera = sceneView.state.cameraInUse;
            if ( camera ) {
                info.trans = GLGE.mulMat4Vec4(camera.getRotMatrix(), [0, 0, -1, 1]);
                info.mag = Math.pow(Math.pow(info.trans[0], 2) + Math.pow(info.trans[1], 2), 0.5);
                info.camPos = new Array;
                info.camPos.push( camera.getLocX(), camera.getLocY(), camera.getLocZ() );
                info.camRot = new Array;
                info.camRot.push( camera.getRotX(), camera.getRotY(), camera.getRotZ() );
            }
        }

        canvas.onmousedown = function (e) {
            mouseDown = true;
            var mi = mouseInfo( e, false );
            if ( mi ) {
                cameraInfo( mi );
                mouseDownObjectID = mi.mouseOverID;

                var strParams = JSON.stringify( mi );
                sceneView.execute( sceneID, "this.mouseDown && this.mouseDown("+strParams+")", "application/javascript" );
            }
            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
            mouseDownTime = parseInt( new Date().getTime() );

        }

        canvas.onmouseup = function( e ) {
            var ctrlAndAltDown = sceneNode.glgeKeys.isKeyPressed( GLGE.KI_CTRL ) && sceneNode.glgeKeys.isKeyPressed( GLGE.KI_ALT );
            var mi = mouseInfo( e, ctrlAndAltDown );
            if ( mi ) {
                cameraInfo( mi );
                var mouseUpObjectID =  mi.mouseOverID;
                // check for time??
                if ( mouseUpObjectID && mouseDownObjectID && mouseUpObjectID == mouseDownObjectID ) {
//                    this.logger.info( "pointerClick: id: ", mouseDownObjectID, "   name: ", name( view.state.nodes[mouseDownObjectID].glgeObject ) );
                    //this.throwEvent( "onMouseClick", mouseDownObjectID);
                    view.callMethod( mouseUpObjectID, "pointerClick" );

                    var glgeObj = sceneView.state.nodes[mouseUpObjectID].glgeObject;
                    if ( glgeObj ) {
                        if ( mi && mi.pickInfo ) {
                                
                        }
                        if( sceneNode.glgeKeys.isKeyPressed( GLGE.KI_CTRL ) ) {
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
                        } else if ( sceneNode.glgeKeys.isKeyPressed( GLGE.KI_ALT ) ) {
                            recurseGroup( glgeObj, 0 ); 
                        }
                    }
                }

                //this.throwEvent( "onMouseUp", mouseDownObjectID);
                var strParams = JSON.stringify( mi );
                sceneView.execute( sceneID, "this.mouseUp && this.mouseUp("+strParams+")", "application/javascript" );

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
                cameraInfo( mi );
                var strParams = JSON.stringify( mi );
                sceneView.execute( sceneID, "this.mouseOver && this.mouseOver("+strParams+")", "application/javascript" );
            }

            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
        }


        canvas.onmousemove = function (e) {
            var mi = mouseInfo( e, false );
            if ( mi ) {
                cameraInfo( mi );
                var strParams = JSON.stringify( mi );
                if (mouseDown) {
                    //if (mouseDownObjectID) {

                        //this.throwEvent( "onMouseMove", mouseDownObjectID);
                        sceneView.execute( sceneID, "this.mouseMove("+strParams+")", "application/javascript" );
                    //}

                    //view.callMethod( mouseDownObjectID, "onMouseMove" );
                } else {
                    if ( mi.mouseOverID ) {
                        if (mouseOverObjectID) {
                            if (mi.mouseOverID != mouseOverObjectID) {

                                //this.throwEvent( "onMouseLeave", mouseOverObjectID);

                                mouseOverObjectID = mi.mouseOverID;
                                sceneView.execute( sceneID, "this.mouseLeave("+strParams+")", "application/javascript" );

                                //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                                sceneView.execute( sceneID, "this.mouseEnter("+strParams+")", "application/javascript" );
                            } else {
                                //this.throwEvent( "onMouseHover", mouseOverObjectID);
                                sceneView.execute( sceneID, "this.mouseHover("+strParams+")", "application/javascript" );
                            }
                        } else {
                            mouseOverObjectID = mi.mouseOverID;

                            //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                            sceneView.execute( sceneID, "this.mouseEnter("+strParams+")", "application/javascript" );
                        }

                    } else {
                        if (mouseOverObjectID) {
                            //this.throwEvent( "onMouseLeave", mouseOverObjectID);
                            mouseOverObjectID = undefined;
                            sceneView.execute( sceneID, "this.mouseLeave("+strParams+")", "application/javascript" );

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
                //vwf.execute( sceneID, "this.mouseOut && this.mouseOut()", "application/javascript" );
            }
            mouseOverCanvas = false;
        }

        canvas.onmousewheel = function (e) {
            var mi = mouseInfo( e, false );
            if ( mi ) {
                cameraInfo( mi );
                mi.wheelDelta = e.wheelDelta;
                mi.wheelDeltaX = e.wheelDeltaX;
                mi.wheelDeltaY = e.wheelDeltaY;
                
                var strParams = JSON.stringify( mi );
                sceneView.execute( sceneID, "this.mouseWheel && this.mouseWheel("+strParams+")", "application/javascript" );
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

    var recurseGroup = function(grp, iDepth) {
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
            } else if (grpChildren[i].constructor == GLGE.Object) {
                outputObject(grpChildren[i], iDepth);
            }
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
            console.info(indent(iIndent) + "objName:");
            indentAdd = 1;
        }
        if ( obj.multimaterials && obj.multimaterials.length > 0 ) {
            console.info( indent( iIndent+indentAdd ) + "children:" );
            materialIndex = 1;
            for ( var i = 0; i < obj.multimaterials.length; i++ ) {
                outputMaterial( obj.getMaterial(i), iIndent + 1 + indentAdd );
            }
        }
    };

    var outputMaterial = function(obj, iIndent) {

        var sOut = indent(iIndent + 1);
        console.info(indent(iIndent) + lastGroupName + "Material" + materialIndex++ + ":");
        console.info(sOut + "extends: http://vwf.example.com/types/material");

    };

})(window.vwf.modules, "vwf.view.glge");

