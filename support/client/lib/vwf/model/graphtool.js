"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

    // Set up render order constants
    var DEPTH_GRID = Number.MAX_SAFE_INTEGER - 3;
    var DEPTH_AXES = Number.MAX_SAFE_INTEGER - 2;
    var DEPTH_LINES = Number.MAX_SAFE_INTEGER - 1;

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.state.graphs = {};
            this.state.lines = {};
            this.state.kernel = this.kernel.kernel.kernel;
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName, callback /* ( ready ) */ ) {

            var node = undefined;
            var kernel = this.state.kernel;
            var protos = getPrototypes.call( this, kernel, childExtendsID );

            if ( protos && isGraphDefinition.call( this, protos ) ) {

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
                    "renderTop": undefined
                };

                node.initialized = false;

            } else if ( protos && isGraphLineDefinition.call( this, protos ) ) {

                node = this.state.lines[ childID ] = getThreeJSModel().state.nodes[ childID ];

                node.lineProperties = {
                    "lineFunction": undefined,
                    "startValue": undefined,
                    "endValue": undefined,
                    "pointCount": undefined,
                    "color": undefined,
                    "lineThickness": undefined,
                    "renderTop": undefined
                };

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

            } else if ( this.state.lines[ childID ] ) {

                node = this.state.lines[ childID ];
                createLine( node );
                node.initialized = true;

            }
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            if( nodeID ) {
                var childNode = this.state.lines[ nodeID ];
                if( childNode ) {
                    var threeObject = childNode.threeObject;
                    if( threeObject && threeObject.parent )
                    {
                        threeObject.parent.remove( threeObject );
                    }
                    delete this.state.lines[ childNode ];
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
                var node = this.state.lines[ nodeID ] || this.state.graphs[ nodeID ] ;
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
                                redrawLines( node.ID, this.state.lines );
                                break;
                            default:
                                redrawGraph( node );
                                break;
                        }

                    }

                }

            } else if ( this.state.lines[ nodeID ] ) {

                node = this.state.lines[ nodeID ];

                if ( node.lineProperties.hasOwnProperty( propertyName ) ) {

                    node.lineProperties[ propertyName ] = propertyValue;

                    if ( node.initialized ) {

                        redrawLine( node );

                    }

                }

            }
        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            var node = this.state.lines[ nodeID ];

            if ( node ) {
            }
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function( nodeID, methodName, methodParameters, methodBody ) {
        },

        // TODO: deletingMethod

        // -- callingMethod ------------------------------------------------------------------------

        callingMethod: function( nodeID, methodName, methodParameters, methodValue ) {
            if ( this.state.graphs[ nodeID ] ) {
                
                var node = this.state.graphs[ nodeID ];
                
                if ( methodName === "setGraphVisibility" ) {
                    var visible = methodParameters[0];
                    setGraphVisibility( node, visible );
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
    
    function getPrototypes( kernel, extendsID ) {
        var prototypes = [];
        var id = extendsID;

        while ( id !== undefined ) {
            prototypes.push( id );
            id = kernel.prototype( id );
        }
                
        return prototypes;
    }

    function isGraphDefinition( prototypes ) {

        var foundGraph = false;

        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGraph; i++ ) {
                foundGraph = ( prototypes[i] == "http-vwf-example-com-graph-vwf" );    
            }
        }

        return foundGraph;
    }

    function isGraphLineDefinition( prototypes ) {

        var foundGraph = false;

        if ( prototypes ) {
            for ( var i = 0; i < prototypes.length && !foundGraph; i++ ) {
                foundGraph = ( prototypes[i] == "http-vwf-example-com-graphline-vwf" );    
            }
        }

        return foundGraph;
    }

    function getThreeJSModel() {
        
        var threejs;

        threejs = vwf.models["vwf/model/threejs"];

        while ( threejs.model ) {
            threejs = threejs.model;
        }

        return threejs;

    }

    function createGraph( node ) {

        var props = node.graphProperties;
        var graph = makeGraph( 
                props.graphScale,
                props.gridInterval,
                props.gridLineInterval,
                props.gridLength,
                props.xAxisVisible,
                props.yAxisVisible,
                props.zAxisVisible,
                props.gridVisible,
                props.renderTop
            );

        node.threeObject.add( graph );

    }

    function createLine( node ) {

        var graphScale = node.parentGraph.graphProperties.graphScale;
        var props = node.lineProperties;
        var line = graphFunction(
                graphScale,
                props.lineFunction,
                props.startValue,
                props.endValue,
                props.pointCount,
                props.color,
                props.lineThickness,
                props.renderTop
            );

        line.visible = node.threeObject.visible;
        node.threeObject.add( line );

    }

    function redrawGraph( graph ) {
        graph.threeObject.remove( graph.threeObject.getObjectByName( "graph" ) );
        createGraph( graph );
    }

    function redrawLines( graphID, lines ) {
        for ( var lineID in lines ) {
            var line = lines[ lineID ];
            if ( line.parentID === graphID && line.initialized ) {
                redrawLine( line );
            }
        }
    }

    function redrawLine( line ) {
        line.threeObject.remove( line.threeObject.children[0] );
        createLine( line );
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

    function makeGraph( graphScale, gridInterval, gridLineInterval, gridLength, xAxisVisible, 
                        yAxisVisible, zAxisVisible, gridVisible, renderTop ) {

        var xAxis, yAxis, zAxis, gridX, gridY, axisLine;
        var thickness = 0.1;
        var graph = new THREE.Object3D();
        var gridLines = new THREE.Object3D();
        graph.name = "graph";
        gridLines.name = "gridLines";

        xAxis = draw3DLine( [ 1, 0, 0 ], graphScale, gridLength, [ 255, 0, 0 ], thickness, renderTop );
        xAxis.name = "xAxis";
        xAxis.visible = xAxisVisible;

        yAxis = draw3DLine( [ 0, 1, 0 ], graphScale, gridLength, [ 0, 0, 255 ], thickness, renderTop );
        yAxis.name = "yAxis";
        yAxis.visible = yAxisVisible;

        zAxis = draw3DLine( [ 0, 0, 1 ], graphScale, gridLength, [ 0, 255, 0 ], thickness, renderTop );
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

            gridX = draw3DLine( [ 1, 0, 0 ], graphScale, gridLength, [ 255, 255, 255 ], thickness, renderTop );
            gridX.position.set( 0, i, 0 );
            gridX.visible = gridVisible;

            gridY = draw3DLine( [ 0, 1, 0 ], graphScale, gridLength, [ 255, 255, 255 ], thickness, renderTop );
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

    function graphFunction( graphScale, functionString, startValue, endValue, 
                            pointCount, color, thickness, renderTop ) {

        var graphGeometry = new THREE.Geometry();
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
                var planePoints = getPlaneVertices( direction, point, thickness / 2 );
                for ( var j = 0; j < planePoints.length; j++ ) {
                    points.push( planePoints[j] );
                }
            }
        }

        graphGeometry.vertices = points;

        for ( var i = 0; i < points.length; i++ ) {
            if ( points[i + 4] !== undefined ) {
                graphGeometry.faces.push( new THREE.Face3( i, i + 4, i + 1 ) );
                graphGeometry.faces.push( new THREE.Face3( i, i + 3, i + 4 ) );
            }
        }

        var last = points.length - 1;
        graphGeometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        graphGeometry.faces.push( new THREE.Face3( 0, 2, 3 ) );
        graphGeometry.faces.push( new THREE.Face3( last, last - 1, last - 3 ) );
        graphGeometry.faces.push( new THREE.Face3( last - 1, last - 2, last - 3 ) );

        var vwfColor = new utility.color( color );
        color = vwfColor.getHex();
        var meshMaterial = new THREE.MeshBasicMaterial( 
                { "color": color, "depthTest": !renderTop } 
            );
        var mesh = new THREE.Mesh( graphGeometry, meshMaterial );
        mesh.renderDepth = renderTop ? DEPTH_LINES : null;

        return mesh;

    }

    function draw3DLine( axis, graphScale, gridLength, color, thickness, renderTop ) {

        var graphGeometry = new THREE.Geometry();
        var axisLength = graphScale * gridLength;
        var startPoint, endPoint, direction;
        var points = new Array();
        var planePoints, i;

        startPoint = new THREE.Vector3( 
                axis[ 0 ] * axisLength,
                axis[ 1 ] * axisLength,
                axis[ 2 ] * axisLength 
            );
        endPoint = new THREE.Vector3( 
                -axis[ 0 ] * axisLength,
                -axis[ 1 ] * axisLength,
                -axis[ 2 ] * axisLength 
            );
        direction = endPoint.clone();
        direction.sub( startPoint.clone() );
        direction.normalize();

        planePoints = getPlaneVertices( direction, startPoint, thickness / 2 );
        for ( i = 0; i < planePoints.length; i++ ) {
            points.push( planePoints[i] );
        }

        planePoints = getPlaneVertices( direction, endPoint, thickness / 2 );
        for ( i = 0; i < planePoints.length; i++ ) {
            points.push( planePoints[i] );
        }

        graphGeometry.vertices = points;

        for ( var i = 0; i < points.length; i++ ) {
            if ( points[i + 4] !== undefined ) {
                graphGeometry.faces.push( new THREE.Face3( i, i + 4, i + 1 ) );
                graphGeometry.faces.push( new THREE.Face3( i, i + 3, i + 4 ) );
            }
        }

        var last = points.length - 1;
        graphGeometry.faces.push( new THREE.Face3( 0, 1, 2 ) );
        graphGeometry.faces.push( new THREE.Face3( 0, 2, 3 ) );
        graphGeometry.faces.push( new THREE.Face3( last, last - 1, last - 3 ) );
        graphGeometry.faces.push( new THREE.Face3( last - 1, last - 2, last - 3 ) );

        var vwfColor = new utility.color( color );
        color = vwfColor.getHex();
        var meshMaterial = new THREE.MeshBasicMaterial( 
                { "color": color, "depthTest": !renderTop } 
            );
        var mesh = new THREE.Mesh( graphGeometry, meshMaterial );

        return mesh;

    }

    function getPlaneVertices( normal, origin, distance ) {

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

    function createRotationMatrix( axis, angle ) {

        var mat;
        var c = Math.cos( angle );
        var d = 1 - c;
        var s = Math.sin( angle );

        mat = new THREE.Matrix3(
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

} );