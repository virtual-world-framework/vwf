"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    // Set up render order constants for use with renderTop
    // Transparent objects render back to front, so use small numbers
    var DEPTH_GRID = Number.MIN_SAFE_INTEGER + 3;
    var DEPTH_AXES = Number.MIN_SAFE_INTEGER + 2;
    var DEPTH_OBJECTS = Number.MIN_SAFE_INTEGER + 1;

    var self;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            self = this;
            this.state.graphs = {};
            this.state.objects = {};
            this.state.kernel = this.kernel.kernel.kernel;
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            var node = undefined;
            var kernel = this.state.kernel;
            var protos = getPrototypes.call( this, kernel, childExtendsID );

            if ( protos && isGraph( protos ) ) {

                node = this.state.graphs[ childID ] = getThreeJSModel().state.nodes[ childID ];

                node.graphProperties = {
                    "graphScale": undefined,
                    "gridInterval": undefined,
                    "gridLineInterval": undefined,
                    "gridLength": undefined,
                    "xAxisVisible": undefined,
                    "yAxisVisible": undefined,
                    "zAxisVisible": undefined,
                    "gridVisible": undefined,
                    "axisOpacity": undefined,
                    "gridOpacity": undefined,
                    "renderTop": undefined
                };

                node.initialized = false;

            } else if ( protos && isGraphObject( protos ) ) {

                var type = getObjectType( protos );

                node = this.state.objects[ childID ] = getThreeJSModel().state.nodes[ childID ];

                node.type = type;
                switch ( type ) {
                    case "line":
                        node.objectProperties = {
                            "axis": undefined,
                            "startValue": undefined,
                            "endValue": undefined,
                            "color": undefined,
                            "opacity": undefined,
                            "lineThickness": undefined,
                            "renderTop": undefined
                        };
                        break;
                    case "function":
                        node.objectProperties = {
                            "lineFunction": undefined,
                            "startValue": undefined,
                            "endValue": undefined,
                            "pointCount": undefined,
                            "color": undefined,
                            "opacity": undefined,
                            "lineThickness": undefined,
                            "renderTop": undefined
                        };
                        break;
                    case "plane":
                        node.objectProperties = {
                            "origin": undefined,
                            "normal": undefined,
                            "rotationAngle": undefined,
                            "size": undefined,
                            "color": undefined,
                            "opacity": undefined,
                            "doubleSided": undefined,
                            "renderTop": undefined
                        };
                        break;
                    case "group":
                        node.objectProperties = {
                            "groupVisible": undefined,
                            "graphObjects": undefined
                        };
                        break;
                }

                node.parentGraph = this.state.graphs[ node.parentID ];

                node.initialized = false;

            }
        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {
            
            var node;

            if ( this.state.graphs[ childID ] ) {

                node = this.state.graphs[ childID ];
                createGraph( node );
                node.initialized = true;

            } else if ( this.state.objects[ childID ] ) {

                node = this.state.objects[ childID ];
                createObject( node );
                node.initialized = true;

            }
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if( nodeID ) {
                var childNode = this.state.objects[ nodeID ];
                if( childNode ) {
                    var threeObject = childNode.threeObject;
                    if( threeObject && threeObject.parent )
                    {
                        threeObject.parent.remove( threeObject );
                    }
                    delete this.state.objects[ childNode ];
                }
            }

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function( nodeID, childID, childName ) {
        },

        // -- removingChild ------------------------------------------------------------------------

        removingChild: function( nodeID, childID ) {
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            var value = undefined;

            if ( propertyValue !== undefined ) {
                var node = this.state.objects[ nodeID ] || this.state.graphs[ nodeID ] ;
                if ( node !== undefined ) {
                    switch ( propertyName ) {
                        default:
                            value = this.settingProperty( nodeID, propertyName, propertyValue );                  
                            break;
                    }
                }
            }

            return value;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            var node;

            if ( this.state.graphs[ nodeID ] ) {

                node = this.state.graphs[ nodeID ];

                if ( node.graphProperties.hasOwnProperty( propertyName ) ) {

                    node.graphProperties[ propertyName ] = propertyValue;

                    if ( node.initialized ) {

                        switch ( propertyName ) {
                            case "xAxisVisible":
                            case "yAxisVisible":
                            case "zAxisVisible":
                            case "gridVisible":
                                setGraphVisibility( node, true );
                                break;
                            case "graphScale":
                                redrawGraph( node );
                                redrawObjects( node.ID, this.state.objects );
                                break;
                            default:
                                redrawGraph( node );
                                break;
                        }

                    }

                }

            } else if ( this.state.objects[ nodeID ] ) {

                node = this.state.objects[ nodeID ];

                if ( node.objectProperties.hasOwnProperty( propertyName ) ) {

                    node.objectProperties[ propertyName ] = propertyValue;

                    if ( node.initialized ) {

                        redrawObject( node );

                    }

                }

            }
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            var node = this.state.objects[ nodeID ];

            if ( node ) {
            }
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            var node;

            if ( this.state.graphs[ nodeID ] ) {
                node = this.state.graphs[ nodeID ];
                
                if ( methodName === "setGraphVisibility" ) {
                    var visible = methodParameters[0];
                    setGraphVisibility( node, visible );
                }

            } else if ( this.state.objects[ nodeID ] ) {
                node = this.state.objects[ nodeID ];

                if ( methodName === "setGroupItemProperty" ) {
                    var itemIndexList = methodParameters[ 0 ];
                    var itemPropertyName = methodParameters[ 1 ];
                    var itemPropertyValue = methodParameters[ 2 ];
                    for ( var i = 0; i < itemIndexList.length; i++ ) {
                        node.threeObject.children[ 0 ].children[ itemIndexList[ i ] ][ itemPropertyName ] = itemPropertyValue;
                    }
                }
            }
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function( nodeID, eventName, eventParameters ) {
        },

        // TODO: deletingEvent

        // -- firingEvent --------------------------------------------------------------------------

        firingEvent: function( nodeID, eventName, eventParameters ) {
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function( nodeID, scriptText, scriptType ) {
        },

    } );

    function getThreeJSModel() {
        
        var threejs;

        threejs = vwf.models[ "vwf/model/threejs" ];

        while ( threejs.model ) {
            threejs = threejs.model;
        }

        return threejs;

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

    function isGraph( prototypes ) {

        var foundGraph = false;

        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGraph; i++ ) {
                foundGraph = ( prototypes[i] == "http-vwf-example-com-graphtool-graph-vwf" );    
            }
        }

        return foundGraph;
    }

    function isGraphObject( prototypes ) {

        var foundObject = false;

        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundObject; i++ ) {
                foundObject = ( prototypes[i] == "http-vwf-example-com-graphtool-graphline-vwf" ) ||
                    ( prototypes[i] == "http-vwf-example-com-graphtool-graphlinefunction-vwf" ) ||
                    ( prototypes[i] == "http-vwf-example-com-graphtool-graphplane-vwf" ) ||
                    ( prototypes[i] == "http-vwf-example-com-graphtool-graphgroup-vwf" );
            }
        }

        return foundObject;
    }

    function getObjectType( prototypes ) {

        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length; i++ ) {
                if ( prototypes[i] == "http-vwf-example-com-graphtool-graphline-vwf" ) {
                    return "line";
                } else if ( prototypes[i] == "http-vwf-example-com-graphtool-graphlinefunction-vwf" ) {
                    return "function";
                } else if ( prototypes[i] == "http-vwf-example-com-graphtool-graphplane-vwf" ) {
                    return "plane";
                } else if ( prototypes[i] == "http-vwf-example-com-graphtool-graphgroup-vwf" ) {
                    return "group";
                }
            }
        }

        return undefined;
    }

    function createGraph( node ) {

        var props = node.graphProperties;
        var graph = generateGraph( 
                props.graphScale,
                props.gridInterval,
                props.gridLineInterval,
                props.gridLength,
                props.xAxisVisible,
                props.yAxisVisible,
                props.zAxisVisible,
                props.gridVisible,
                props.axisOpacity,
                props.gridOpacity,
                props.renderTop
            );

        node.threeObject.add( graph );

    }

    function createObject( node ) {

        var graphScale = node.parentGraph.graphProperties.graphScale;
        var props = node.objectProperties;
        var obj = null;

        switch( node.type ) {

            case "line":
                obj = generateLine(
                    graphScale,
                    props.axis,
                    props.startValue,
                    props.endValue,
                    props.color,
                    props.opacity,
                    props.lineThickness,
                    props.renderTop
                );
                break;

            case "function":
                obj = generateLineFuction(
                    graphScale,
                    props.lineFunction,
                    props.startValue,
                    props.endValue,
                    props.pointCount,
                    props.color,
                    props.opacity,
                    props.lineThickness,
                    props.renderTop
                );
                break;

            case "plane":
                obj = generatePlane(
                    graphScale,
                    props.origin,
                    props.normal,
                    props.rotationAngle,
                    props.size,
                    props.color,
                    props.opacity,
                    props.doubleSided,
                    props.renderTop
                );
                break;
            case "group":
                obj = generateGroup(
                    graphScale,
                    props.groupVisible,
                    props.graphObjects
                );
                break;
        }

        obj.visible = node.threeObject.visible;
        node.threeObject.add( obj );

    }

    function redrawGraph( graph ) {
        var oldObj = graph.threeObject.getObjectByName( "graph" );
        graph.threeObject.remove( oldObj );
        if ( oldObj.children.length > 0 ) {
            disposeObject( oldObj );
        }
        createGraph( graph );
    }

    function redrawObjects( graphID, objects ) {
        for ( var objID in objects ) {
            var obj = objects[ objID ];
            if ( obj.parentID === graphID && obj.initialized ) {
                redrawObject( obj );
            }
        }
    }

    function redrawObject( obj ) {
        var oldObj = obj.threeObject.children[ 0 ];
        obj.threeObject.remove( oldObj );
        if ( oldObj.children.length > 0 ) {
            disposeObject( oldObj );
        }
        createObject( obj );
    }

    function disposeObject( obj ) {
        var child, i;
        for ( i = 0; i < obj.children.length; i++ ) {
            child = obj.children[ i ];
            if ( child.children.length > 0 ) {
                disposeObject( child );
            } else if ( child instanceof THREE.Mesh ) {
                if ( child.geometry ) {
                    child.geometry.dispose();
                }
                if ( child.material ) {
                    if ( child.material.map ) {
                        child.material.map.dispose();
                    }
                    child.material.dispose();
                }
            }
        }
    }

    function setGraphVisibility( node, value ) {
        
        var graph, xAxis, yAxis, zAxis, gridLines;
        graph = node.threeObject.getObjectByName( "graph" );

        if ( graph ) {
            xAxis = graph.getObjectByName( "xAxis" );
            yAxis = graph.getObjectByName( "yAxis" );
            zAxis = graph.getObjectByName( "zAxis" );
            gridLines = graph.getObjectByName( "gridLines" );

            if ( value ) {
                xAxis.visible = node.graphProperties.xAxisVisible;
                yAxis.visible = node.graphProperties.yAxisVisible;
                zAxis.visible = node.graphProperties.zAxisVisible;
                gridLines.visible = node.graphProperties.gridVisible;
                for ( var line in gridLines.children ) {
                    gridLines.children[ line ].visible = gridLines.visible;
                }
            } else {
                xAxis.visible = false;
                yAxis.visible = false;
                zAxis.visible = false;
                gridLines.visible = false;
                for ( var line in gridLines.children ) {
                    gridLines.children[ line ].visible = false;
                }
            }
        }
    }

    function generateGraph( graphScale, gridInterval, gridLineInterval, gridLength, xAxisVisible, 
                        yAxisVisible, zAxisVisible, gridVisible, axisOpacity, gridOpacity, renderTop ) {

        var xAxis, yAxis, zAxis, gridX, gridY, axisLine;
        var thickness = 0.1;
        var graph = new THREE.Object3D();
        var gridLines = new THREE.Object3D();
        graph.name = "graph";
        gridLines.name = "gridLines";

        xAxis = generateLine( graphScale, [ 1, 0, 0 ], -gridLength, gridLength, [ 255, 0, 0 ], axisOpacity, thickness, renderTop );
        xAxis.name = "xAxis";
        xAxis.visible = xAxisVisible;

        yAxis = generateLine( graphScale, [ 0, 1, 0 ], -gridLength, gridLength, [ 0, 0, 255 ], axisOpacity, thickness, renderTop );
        yAxis.name = "yAxis";
        yAxis.visible = yAxisVisible;

        zAxis = generateLine( graphScale, [ 0, 0, 1 ], -gridLength, gridLength, [ 0, 255, 0 ], axisOpacity, thickness, renderTop );
        zAxis.name = "zAxis";
        zAxis.visible = zAxisVisible;

        if ( renderTop ) {
            xAxis.renderDepth = yAxis.renderDepth = zAxis.renderDepth = DEPTH_AXES;
        }
        
        graph.add( xAxis );
        graph.add( yAxis );
        graph.add( zAxis );

        // Scale grid
        gridInterval *= graphScale;
        gridLineInterval *= graphScale;

        for ( var i = -gridLength * graphScale; i <= gridLength * graphScale; i += gridInterval ) {
            if ( i % gridLineInterval === 0 ) {
                thickness = 0.075;
            } else {
                thickness = 0.025;
            }

            gridX = generateLine( graphScale, [ 1, 0, 0 ], -gridLength, gridLength, [ 255, 255, 255 ], gridOpacity, thickness, renderTop );
            gridX.position.set( 0, i, 0 );
            gridX.visible = gridVisible;

            gridY = generateLine( graphScale, [ 0, 1, 0 ], -gridLength, gridLength, [ 255, 255, 255 ], gridOpacity, thickness, renderTop );
            gridY.position.set( i, 0, 0 );
            gridY.visible = gridVisible;

            if ( renderTop ) {
                gridX.renderDepth = gridY.renderDepth = DEPTH_GRID;
            }

            gridLines.add( gridX );
            gridLines.add( gridY );

        }

        graph.add( gridLines );

        return graph;
    }

    function generateLineFuction( graphScale, functionString, startValue, endValue, 
                            pointCount, color, opacity, thickness, renderTop ) {

        if ( !isValidFunction( functionString ) ) {
            return new THREE.Mesh();
        }

        var geometry = new THREE.Geometry();
        var point, direction;
        var points = new Array();
        var faces;
        var increment;
        var func = function( x, y, z ) {
            var fn = "var x = " + x + ", y = " + y + ", z = " + z + ";\n" 
                    + functionString + ";\n" 
                    + "[ x, y, z ];";
            var ar = eval( fn );
            x = ar[0] * graphScale;
            y = ar[1] * graphScale;
            z = ar[2] * graphScale;
            return new THREE.Vector3( x || 0, y || 0, z || 0 );
        }

        increment = Math.abs( endValue - startValue ) / pointCount;

        // Check for endvalue + ( increment / 2 ) to account for approximation errors
        for ( var i = startValue; i <= endValue + ( increment / 2 ); i += increment ) {
            point = func( i );
            direction = func( i + increment );
            direction.sub( func( i - increment ) );
            direction.normalize();
            if ( !isNaN( point.x ) && !isNaN( point.y ) && !isNaN( point.z ) ) {
                var planePoints = generateLineVertices( direction, point, thickness / 2 );
                for ( var j = 0; j < planePoints.length; j++ ) {
                    points.push( planePoints[j] );
                }
            }
        }

        geometry.vertices = points;

        for ( var i = 0; i < points.length; i++ ) {
            if ( points[i + 4] !== undefined ) {
                geometry.faces.push( new THREE.Face3( i, i + 4, i + 1 ) );
                geometry.faces.push( new THREE.Face3( i, i + 3, i + 4 ) );
            }
        }

        var last = points.length - 1;
        geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );
        geometry.faces.push( new THREE.Face3( last, last - 1, last - 3 ) );
        geometry.faces.push( new THREE.Face3( last - 1, last - 2, last - 3 ) );

        var transparent = renderTop || opacity < 1;
        var vwfColor = new utility.color( color );
        color = vwfColor.getHex();
        var meshMaterial = new THREE.MeshBasicMaterial( 
                { "color": color, "transparent": transparent, "opacity": opacity, "depthTest": !renderTop } 
            );
        var mesh = new THREE.Mesh( geometry, meshMaterial );
        mesh.renderDepth = renderTop ? DEPTH_OBJECTS : null;

        return mesh;

    }

    function generateLine( graphScale, axis, startValue, endValue, color, opacity, thickness, renderTop ) {

        var geometry = new THREE.Geometry();
        startValue *= graphScale;
        endValue *= graphScale;
        var startPoint, endPoint, direction;
        var points = new Array();
        var planePoints, i;

        startPoint = new THREE.Vector3(
                axis[ 0 ] * startValue,
                axis[ 1 ] * startValue,
                axis[ 2 ] * startValue
            );
        endPoint = new THREE.Vector3(
                axis[ 0 ] * endValue,
                axis[ 1 ] * endValue,
                axis[ 2 ] * endValue
            );
        direction = endPoint.clone();
        direction.sub( startPoint.clone() );
        direction.normalize();

        planePoints = generateLineVertices( direction, startPoint, thickness / 2 );
        for ( i = 0; i < planePoints.length; i++ ) {
            points.push( planePoints[i] );
        }

        planePoints = generateLineVertices( direction, endPoint, thickness / 2 );
        for ( i = 0; i < planePoints.length; i++ ) {
            points.push( planePoints[i] );
        }

        geometry.vertices = points;

        for ( var i = 0; i < points.length; i++ ) {
            if ( points[i + 4] !== undefined ) {
                geometry.faces.push( new THREE.Face3( i, i + 4, i + 1 ) );
                geometry.faces.push( new THREE.Face3( i, i + 3, i + 4 ) );
            }
        }

        var last = points.length - 1;
        geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );
        geometry.faces.push( new THREE.Face3( last, last - 1, last - 3 ) );
        geometry.faces.push( new THREE.Face3( last - 1, last - 2, last - 3 ) );

        var transparent = renderTop || opacity < 1;
        var vwfColor = new utility.color( color );
        color = vwfColor.getHex();
        var meshMaterial = new THREE.MeshBasicMaterial( 
                { "color": color, "transparent": transparent, "opacity": opacity, "depthTest": !renderTop } 
            );
        var mesh = new THREE.Mesh( geometry, meshMaterial );
        mesh.renderDepth = renderTop ? DEPTH_OBJECTS : null;

        return mesh;

    }

    function generatePlane( graphScale, origin, normal, rotationAngle, size, color, opacity, doubleSided, renderTop ) {

        var geometry = new THREE.Geometry();
        normal = new THREE.Vector3( normal[ 0 ], normal[ 1 ], normal[ 2 ] );
        origin = new THREE.Vector3( origin[ 0 ], origin[ 1 ], origin[ 2 ] );
        var points;
        size *= graphScale;
        origin.multiplyScalar( graphScale );

        points = generatePlaneVertices( normal, origin, size );
        geometry.vertices = points;

        geometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        geometry.faces.push( new THREE.Face3( 0, 2, 3 ) );

        var transparent = renderTop || opacity < 1;
        var vwfColor = new utility.color( color );
        color = vwfColor.getHex();
        var meshMaterial = new THREE.MeshBasicMaterial( 
                { "color": color, "transparent": transparent, "opacity": opacity, "depthTest": !renderTop } 
            );
        if ( doubleSided ) {
            meshMaterial.side = THREE.DoubleSide;
        }
        var mesh = new THREE.Mesh( geometry, meshMaterial );
        mesh.renderDepth = renderTop ? DEPTH_OBJECTS : null;

        return mesh;

    }

    function generateGroup( graphScale, groupVisible, graphObjects ) {

        var groupObject = new THREE.Object3D();

        for ( var i = 0; i < graphObjects.length; i++ ) {
            var type = Object.keys( graphObjects[ i ] )[ 0 ];
            var props = graphObjects[ i ][ type ];
            var obj;
            switch( type ) {

                case "line":
                    obj = generateLine(
                        graphScale,
                        props.axis,
                        props.startValue,
                        props.endValue,
                        props.color,
                        props.opacity,
                        props.lineThickness,
                        props.renderTop
                    );
                    break;

                case "function":
                    obj = generateLineFuction(
                        graphScale,
                        props.lineFunction,
                        props.startValue,
                        props.endValue,
                        props.pointCount,
                        props.color,
                        props.opacity,
                        props.lineThickness,
                        props.renderTop
                    );
                    break;

                case "plane":
                    obj = generatePlane(
                        graphScale,
                        props.origin,
                        props.normal,
                        props.rotationAngle,
                        props.size,
                        props.color,
                        props.opacity,
                        props.doubleSided,
                        props.renderTop
                    );
                    break;
                case "group":
                    obj = generateGroup(
                        graphScale,
                        props.groupVisible,
                        props.graphObjects
                    );
                    break;
            }

            obj.visible = groupVisible;
            groupObject.add( obj );
        }

        return groupObject;
    }

    function generateLineVertices( normal, origin, distance ) {

        var vertices = new Array();
        var up = new THREE.Vector3();
        var left = new THREE.Vector3();

        var rotAxis = new THREE.Vector3( 0, 0, 1 );
        var rotAngle, rotMat;

        if ( Math.abs( normal.z ) === 1 ) {
            rotAxis.x += 0.1;
            rotAxis.normalize();
        }

        rotAxis.crossVectors( normal, rotAxis );
        rotAxis.normalize();
        rotAngle = Math.acos( normal.dot( rotAxis ) );
        rotMat = createRotationMatrix( rotAxis, rotAngle );

        up.copy( normal );
        up.applyMatrix3( rotMat );
        up.normalize();
        left.crossVectors( up, normal );
        left.normalize();

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( up.x * distance ),
                origin.y + ( up.y * distance ),
                origin.z + ( up.z * distance )
            ) 
        );

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( left.x * distance ),
                origin.y + ( left.y * distance ),
                origin.z + ( left.z * distance )
            ) 
        );

        up.negate();
        left.negate();

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( up.x * distance ),
                origin.y + ( up.y * distance ),
                origin.z + ( up.z * distance )
            ) 
        );

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( left.x * distance ),
                origin.y + ( left.y * distance ),
                origin.z + ( left.z * distance )
            ) 
        );

        return vertices;

    }

    function generatePlaneVertices( normal, origin, distance ) {

        var vertices = new Array();
        var up = new THREE.Vector3();
        var left = new THREE.Vector3();

        var rotAxis = new THREE.Vector3( 0, 0, 1 );
        var rotAngle, rotMat;

        distance /= 2;

        if ( Math.abs( normal.z ) === 1 ) {
            rotAxis.x += 0.1;
            rotAxis.normalize();
        }

        rotAxis.crossVectors( normal, rotAxis );
        rotAxis.normalize();
        rotAngle = Math.acos( normal.dot( rotAxis ) );
        rotMat = createRotationMatrix( rotAxis, rotAngle );

        up.copy( normal );
        up.applyMatrix3( rotMat );
        up.normalize();
        left.crossVectors( up, normal );
        left.normalize();

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( up.x * distance ) + ( left.x * distance ),
                origin.y + ( up.y * distance ) + ( left.y * distance ),
                origin.z + ( up.z * distance ) + ( left.z * distance )
            ) 
        );

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( up.x * distance ) - ( left.x * distance ),
                origin.y + ( up.y * distance ) - ( left.y * distance ),
                origin.z + ( up.z * distance ) - ( left.z * distance )
            ) 
        );

        up.negate();
        left.negate();

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( up.x * distance ) + ( left.x * distance ),
                origin.y + ( up.y * distance ) + ( left.y * distance ),
                origin.z + ( up.z * distance ) + ( left.z * distance )
            ) 
        );

        vertices.push( 
            new THREE.Vector3( 
                origin.x + ( up.x * distance ) - ( left.x * distance ),
                origin.y + ( up.y * distance ) - ( left.y * distance ),
                origin.z + ( up.z * distance ) - ( left.z * distance )
            ) 
        );

        return vertices;

    }

    function createRotationMatrix( axis, angle ) {

        var mat;
        var c = Math.cos( angle );
        var d = 1 - c;
        var s = Math.sin( angle );

        mat = new THREE.Matrix3();

        mat.set(
            axis.x * axis.x * d + c,
            axis.x * axis.y * d + axis.z * s,
            axis.x * axis.z * d - axis.y * s,

            axis.x * axis.y * d - axis.z * s,
            axis.y * axis.y * d + c,
            axis.y * axis.z * d + axis.x * s,

            axis.x * axis.z * d + axis.y * s,
            axis.y * axis.z * d - axis.x * s,
            axis.z * axis.z * d + c
        );

        return mat;

    }

    function isValidFunction( functionString ) {
        return ( function( x, y, z ) {
            var fn = "var x = " + x + ", y = " + y + ", z = " + z + ";\n" 
                    + functionString + ";\n" 
                    + "[ x, y, z ];";
            try {
                var ar = eval( fn );
            } catch ( error ) {
                self.logger.errorx( "generateLineFuction", error.stack );
                return false;
            }
            return true;
        } )();
    }

} );