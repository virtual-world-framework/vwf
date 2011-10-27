(function (modules, namespace) {

    window.console && console.info && console.info("loading " + namespace);

    // vwf-view-glge.js is a placeholder for an GLGE WebGL view of the scene.
    //
    // vwf-view-glge is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern).
    // It attaches to the vwf modules list as vwf.modules.glge.

    var module = modules[namespace.split(".").pop()] = function(vwf, rootSelector) {

        if (!vwf) return;

        vwf.logger.info("creating " + namespace);

        modules.view.call( this, vwf );
        this.namespace = namespace;

        this.rootSelector = rootSelector;
        this.canvasQuery = undefined;
        this.rootNodeID = undefined;

        this.keysDown = {};
        var view = this;

        this.canvasQuery = jQuery(this.rootSelector).append(
            "<canvas id='index-vwf' class='vwf-scene' width='800' height='600'/>"
        ).children(":last");
           
        window.onkeydown = function( event ) {
             view.keysDown[ event.keyCode ] = true;
        };

        window.onkeyup = function( event ) {
            delete view.keysDown[ event.keyCode ];
        };

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

    module.prototype.createdNode = function (nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType) {

        vwf.logger.info(namespace + ".createdNode " + nodeID + " " +
            nodeExtendsID + " " + nodeImplementsIDs + " " + nodeSource + " " + nodeType);

        if ( nodeID == "index-vwf" && ( nodeExtendsID == "http-vwf-example-com-types-glge" || nodeExtendsID == "appscene-vwf" ) ) {

            if ( !this.rootNodeID ) {
                this.rootNodeID = nodeID;
            }
            var sceneNode = this.state.scenes[ nodeID ];
            if ( sceneNode ) {
                initScene.call( this, sceneNode );
            }
        } 
    };


    // TODO: deletedNode

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function (nodeID, childID, childName) {

        vwf.logger.info(namespace + ".addedChild " + nodeID + " " + childID + " " + childName);

    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function (nodeID, childID) {

        vwf.logger.info(namespace + ".removedChild " + nodeID + " " + childID);

    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function (nodeID, propertyName, propertyValue) {

        vwf.logger.info(namespace + ".createdProperty " + nodeID + " " + propertyName + " " + propertyValue);

    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function (nodeID, propertyName, propertyValue) {

        vwf.logger.info(namespace + ".satProperty " + nodeID + " " + propertyName + " " + propertyValue);

    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function (nodeID, propertyName, propertyValue) {

        vwf.logger.info(namespace + ".gotProperty " + nodeID + " " + propertyName + " " + propertyValue);

    };

    // == Private functions ========================================================================

    // -- createScene ------------------------------------------------------------------------

    function initScene( sceneNode ) {

        console.info( "glge.view.initScene [[[ "+sceneNode.ID+" ]]]" );
        var canvas = this.canvasQuery.get( 0 );

        if ( canvas ) {
            sceneNode.glgeRenderer = new GLGE.Renderer( canvas );
            sceneNode.glgeScene = sceneNode.glgeDocument.getElement("mainscene");
            if ( !sceneNode.glgeScene ) {
                sceneNode.glgeScene = createScene.call( this, sceneNode );
            }
            sceneNode.glgeRenderer.setScene( sceneNode.glgeScene );

            // set up all of the mouse event handlers
            initMouseEvents( canvas, this.rootNodeID, this );

            // Schedule the renderer.

            var view = this;
            var scene = sceneNode.glgeScene;
            var renderer = sceneNode.glgeRenderer;
            var lasttime = 0;
            var now;
            function renderScene() {
                now = parseInt( new Date().getTime() );
                renderer.render();
                checkKeys( view.rootNodeID, view, now, lasttime );
                lasttime = now;
            };

            setInterval( renderScene, 1 );
        }
    } 


    function createScene( sceneNode ) {

        var glgeScene = new GLGE.Scene();
        var cam;

        sceneNode.glgeScene = glgeScene;
        if ( glgeScene.camera ) {
            cam = glgeScene.camera;
            sceneNode.camera.defaultCam = cam;
            sceneNode.camera.glgeCameras[ sceneNode.camera.defaultName ] = cam;
        } else {
            cam = new GLGE.Camera();
            sceneNode.camera.defaultCam = cam; 
            sceneNode.camera.glgeCameras[ sceneNode.camera.defaultName ] = cam;
        }
        initCamera.call( this, cam );
        setActiveCamera.call( this, cam, sceneNode, undefined );
        glgeScene.setAmbientColor( [ 183, 183, 183 ] );
        return glgeScene;
    }

    function initCamera( glgeCamera ) {
        if ( glgeCamera ) {
            glgeCamera.setLoc( 0, 0, 0 );
            glgeCamera.setRot( 0, 0, 0 );
            glgeCamera.setType( GLGE.C_PERSPECTIVE );
            glgeCamera.setRotOrder( GLGE.ROT_XZY );
        }        
    }

    function setActiveCamera( glgeCamera, sceneNode, nodeID ) {
        if ( sceneNode && sceneNode.glgeScene && glgeCamera ) {
            sceneNode.glgeScene.setCamera( glgeCamera );
            if ( nodeID && this.state.nodes[nodeID] ) {
                sceneNode.camera.camNode = this.state.nodes[ nodeID ];
                sceneNode.camera.ID = nodeID;
            } else {
                sceneNode.camera.camNode = sceneNode.camera.defaultCamNode;
                sceneNode.camera.ID = undefined;
            }
        }
    }


    var checkKeys = function( nodeID, view, now, lasttime ) {
        
        var sceneNode = view.state.scenes[nodeID], child;
        if (sceneNode && sceneNode.glgeScene) {
            var camera = sceneNode.glgeScene.camera;
            if ( camera ) {
                var cameraComponent = sceneNode.camera.camNode;

                if ( cameraComponent && view.keysDown && Object.keys( view.keysDown ).length ) {
  
                  var mat = camera.getRotMatrix();
                  var trans = GLGE.mulMat4Vec4( mat, [0, 0, -1, 1] );
                  var mag = Math.pow( Math.pow( trans[0], 2 ) + Math.pow( trans[1], 2 ), 0.5 );
 
                  // should only be sending the keysDown, now, lastime, but I'm going to
                  // inlcude the additional data for now to cut some corners
                  var params = [ JSON.stringify(view.keysDown), 
                                    JSON.stringify(now), 
                                    JSON.stringify(lasttime), 
                                    JSON.stringify(mat),
                                    JSON.stringify(trans),
                                    JSON.stringify(mag) ];
                  //view.callMethod( this.cameraID, "handleKeyEvents", strParams );
                  view.execute( nodeID, "this.handleKeyEvents && this.handleKeyEvents("+params.join(',')+")", "application/javascript" );
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

    var initMouseEvents = function (canvas, nodeID, view) {

        var sceneNode = view.state.scenes[nodeID], child;
        var sceneID = nodeID;
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

                //vwf.logger.info("CANVAS mouseDown: " + mouseDownObjectID);
                //this.throwEvent( "onMouseDown", mouseDownObjectID);
                var strParams = JSON.stringify( mi );
                sceneView.execute( sceneID, "this.mouseDown && this.mouseDown("+strParams+")", "application/javascript" );
            }
            lastXPos = mouseXPos( e );
            lastYPos = mouseYPos( e );
            mouseDownTime = parseInt( new Date().getTime() );

        }

        canvas.onmouseup = function( e ) {
            var mi = mouseInfo( e, false );
            if ( mi ) {
                cameraInfo( mi );
                var mouseUpObjectID =  mi.mouseOverID;
                // check for time??
                if ( mouseUpObjectID && mouseDownObjectID && mouseUpObjectID == mouseDownObjectID ) {
                    vwf.logger.info("pointerClick: id:" + mouseDownObjectID + "   name: " + name( view.state.nodes[mouseDownObjectID].glgeObject ) );
                    //this.throwEvent( "onMouseClick", mouseDownObjectID);
                    view.callMethod( mouseUpObjectID, "pointerClick" );

                    var glgeObj = sceneView.state.nodes[mouseUpObjectID].glgeObject;
                    if ( glgeObj ) {
                        if ( mi && mi.pickInfo ) {
                                
                        }
                        if( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_CTRL) ) {
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
                        } else if ( sceneNode.glgeKeys.isKeyPressed(GLGE.KI_ALT) ) {
                            recurseGroup( glgeObj, 0 ); 
                        }
                    }
                }

                //vwf.logger.info("CANVAS onMouseUp: " + mouseDownObjectID);
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

                        //vwf.logger.info("CANVAS onMouseMove: " + mouseDownObjectID);
                        //this.throwEvent( "onMouseMove", mouseDownObjectID);
                        sceneView.execute( sceneID, "this.mouseMove("+strParams+")", "application/javascript" );
                    //}

                    //view.callMethod( mouseDownObjectID, "onMouseMove" );
                } else {
                    if ( mi.mouseOverID ) {
                        if (mouseOverObjectID) {
                            if (mi.mouseOverID != mouseOverObjectID) {

                                //vwf.logger.info("CANVAS onMouseLeave: " + mouseOverObjectID);
                                //this.throwEvent( "onMouseLeave", mouseOverObjectID);

                                mouseOverObjectID = mi.mouseOverID;
                                sceneView.execute( sceneID, "this.mouseLeave("+strParams+")", "application/javascript" );

                                //vwf.logger.info("CANVAS onMouseEnter: " + mouseOverObjectID);
                                //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                                sceneView.execute( sceneID, "this.mouseEnter("+strParams+")", "application/javascript" );
                            } else {
                                //vwf.logger.info("CANVAS onMouseHover: " + mouseOverObjectID);
                                //this.throwEvent( "onMouseHover", mouseOverObjectID);
                                sceneView.execute( sceneID, "this.mouseHover("+strParams+")", "application/javascript" );
                            }
                        } else {
                            mouseOverObjectID = mi.mouseOverID;

                            //vwf.logger.info("CANVAS onMouseEnter: " + mouseOverObjectID);
                            //this.throwEvent( "onMouseEnter", mouseOverObjectID);
                            sceneView.execute( sceneID, "this.mouseEnter("+strParams+")", "application/javascript" );
                        }

                    } else {
                        if (mouseOverObjectID) {
                            //vwf.logger.info("CANVAS onMouseLeave: " + mouseOverObjectID);
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
                //vwf.logger.info("CANVAS onMouseLeave: " + mouseOverObjectID);
                //this.throwEvent( "onMouseLeave", mouseOverObjectID);
                mouseOverObjectID = undefined;
                //vwf.execute( sceneID, "this.mouseOut && this.mouseOut()", "application/javascript" );
            }
            mouseOverCanvas = false;
        }

        canvas.onmousewheel = function (e) {
            console.info( "     onmousewheel() " );
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

    var outputObject = function(obj, iIndent) {
        if (obj.multimaterials && obj.multimaterials.length > 0) {
            console.info(indent(iIndent) + "children:");
            materialIndex = 1;
            for (var i = 0; i < obj.multimaterials.length; i++) {
                outputMaterial(obj.getMaterial(i), iIndent + 1);
            }
        }
    };

    var outputMaterial = function(obj, iIndent) {

        var sOut = indent(iIndent + 1);
        console.info(indent(iIndent) + lastGroupName + "Material" + materialIndex++ + ":");
        console.info(sOut + "extends: http://vwf.example.com/types/material");

    };

})(window.vwf.modules, "vwf.view.glge");


//                var childObj;
//                var objName;
//                var node;
//                var type;
//                var extendType;
//                for ( var i = 0; i < children.length; i++ ) {
//                    childObj = children[i];
//                    objName = name( childObj );
//                    
//                    if ( childObj.constructor == GLGE.Group || childObj.constructor == GLGE.Object ) {
//                        extendType = "http://vwf.example.com/types/node3";
//                        type = "http-vwf-example-com-types-node3";
//                        node = type +"-"+ objName;
//                    }

//                    if ( node && type ) {
//                        if ( !view.nodes[ node ] ) {
//                            console.info( "[[  Creating " + type  );
//                            vwf.createNode( { "extends": extendType }, function( nodeID, prototypeID ) {
//                                console.info( "     [[  Adding " + type + "     nodeID: " + nodeID );
//                                vwf.addChild( nodeID, nodeID, objName );
//                                console.info( "     ]]  Adding " + type + "     nodeID: " + nodeID );
//                            }, objName );
//                            console.info( "]]  Creating " + type  );
//                        }
//                    }

//                    var mesh;
//                    var meshType;
//                    var meshName;
//                    var meshNodeID;
//                    var meshID;
//                    if ( childObj.constructor == GLGE.Object && childObj.getMesh && childObj.getMesh() ) {
//                        mesh = childObj.getMesh();
//                        meshName = name( mesh );
//                        if ( meshName == "" ) {
//                            meshName = objName + "Mesh" + meshIndex++;
//                            mesh.name = meshName;
//                        }
//                        meshType = "http://vwf.example.com/types/mesh";
//                        meshID = "http-vwf-example-com-types-mesh";
//                        meshNodeID = meshID +"-"+ meshName;    

//                        //vwf.logger.enable = true;
//                        if ( meshNodeID && meshType ) {
//                            if ( !view.nodes[ meshNodeID ] ) {
//                                console.info( "        ++  Creating Mesh  Named: " + meshName );
//                                vwf.createNode( { "extends": meshType }, function( nodeID, prototypeID ) {
//                                    //vwf.logger.enable = true;
//                                    console.info( "     createNode.callback( "+nodeID+", "+prototypeID+ " )" )
//                                    console.info( "     [[  Adding " + type + "     nodeID: " + nodeID );
//                                    vwf.addChild( nodeID, nodeID, meshName );
//                                    console.info( "     ]]  Adding " + type + "     nodeID: " + nodeID );
//                                    //vwf.logger.enable = false;
//                                }, meshName );
//                                console.info( "        ++  Creating Mesh  Named: " + meshName );
//                            }
//                        }    
//                        //vwf.logger.enable = false;                    
//                                                
//                    }
//                }  