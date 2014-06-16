"use strict";

define( [ "module", "vwf/model", "vwf/utility" ], function( module, model, utility ) {

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
                    "gridScale": undefined,
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

                        node.threeObject.remove( node.threeObject.getObjectByName( "grid" ) );
                        createGraph( node );

                        if ( propertyName === "gridScale" ) {
                            for ( var lineID in this.state.lines ) {

                                var line = this.state.lines[ lineID ];

                                if ( line.parentID === nodeID && line.initialized ) {

                                    line.threeObject.remove( line.threeObject.children[0] );
                                    createLine( line );

                                }

                            }
                        }

                    }

                }

            } else if ( this.state.lines[ nodeID ] ) {

                node = this.state.lines[ nodeID ];

                if ( node.lineProperties.hasOwnProperty( propertyName ) ) {

                    node.lineProperties[ propertyName ] = propertyValue;

                    if ( node.initialized ) {

                        node.threeObject.remove( node.threeObject.children[0] );
                        createLine( node );

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
                props.gridScale,
                props.gridInterval,
                props.gridLineInterval,
                props.gridLength,
                props.xAxisVisible,
                props.yAxisVisible,
                props.zAxisVisible,
                props.gridVisible,
                props.renderTop
            );

        graph.visible = node.threeObject.visible;
        node.threeObject.add( graph );

    }

    function makeGraph( gridScale, gridInterval, gridLineInterval, gridLength, xAxisVisible, 
                        yAxisVisible, zAxisVisible, gridVisible, renderTop ) {

        // Scale grid
        gridInterval *= gridScale;
        gridLineInterval *= gridScale;
        gridLength *= gridScale;

        var xAxis, yAxis, zAxis, grid;
        var opacity = 1;
        var graph = new THREE.Object3D();
        graph.name = "grid";
        graph.renderDepth = renderTop ? Infinity : null;

        xAxis = new THREE.Geometry();
        xAxis.vertices.push( new THREE.Vector3( gridLength, 0, 0 ) );
        xAxis.vertices.push( new THREE.Vector3( -gridLength, 0, 0 ) );
        graph.add( new THREE.Line( xAxis, new THREE.LineBasicMaterial( 
                { "color": 0xFF0000, "visible": xAxisVisible, "depthTest": !renderTop } 
            ) ) );

        yAxis = new THREE.Geometry();
        yAxis.vertices.push( new THREE.Vector3( 0, gridLength, 0 ) );
        yAxis.vertices.push( new THREE.Vector3( 0, -gridLength, 0 ) );
        graph.add( new THREE.Line( yAxis, new THREE.LineBasicMaterial( 
                { "color": 0x0000FF, "visible": yAxisVisible, "depthTest": !renderTop } 
            ) ) );

        zAxis = new THREE.Geometry();
        zAxis.vertices.push( new THREE.Vector3( 0, 0, gridLength ) );
        zAxis.vertices.push( new THREE.Vector3( 0, 0, -gridLength ) );
        graph.add( new THREE.Line( zAxis, new THREE.LineBasicMaterial( 
                { "color": 0x00FF00, "visible": zAxisVisible, "depthTest": !renderTop } 
            ) ) );

        for ( var i = -gridLength; i <= gridLength; i += gridInterval ) {
            if ( i === 0 ) {
                continue;
            } else if ( i % gridLineInterval === 0 ) {
                opacity = 0.2;
            } else {
                opacity = 0.1;
            }

            grid = new THREE.Geometry();
            grid.vertices.push( new THREE.Vector3( gridLength, i, 0 ) );
            grid.vertices.push( new THREE.Vector3( -gridLength, i, 0 ) );
            graph.add( new THREE.Line( grid, new THREE.LineBasicMaterial( 
                {   "color": 0xFFFFFF, 
                    "transparent": true, 
                    "opacity": opacity, 
                    "visible": gridVisible, 
                    "depthTest": !renderTop 
                } ) ) );

            grid = new THREE.Geometry();
            grid.vertices.push( new THREE.Vector3( i, gridLength, 0 ) );
            grid.vertices.push( new THREE.Vector3( i, -gridLength, 0 ) );
            graph.add( new THREE.Line( grid, new THREE.LineBasicMaterial( 
                {   "color": 0xFFFFFF, 
                    "transparent": true, 
                    "opacity": opacity, 
                    "visible": gridVisible, 
                    "depthTest": !renderTop 
                } ) ) );

        }

        return graph;
    }

    function createLine( node ) {

        var gridScale = node.parentGraph.graphProperties.gridScale;
        var props = node.lineProperties;
        var line = graphFunction(
                gridScale,
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

    function graphFunction( gridScale, functionString, startValue, endValue, 
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
            x = ar[0] * gridScale;
            y = ar[1] * gridScale;
            z = ar[2] * gridScale;
            return new THREE.Vector3( x || 0, y || 0, z || 0 );
        }

        endValue = endValue;
        startValue = startValue;
        pointCount = pointCount;
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
        mesh.renderDepth = renderTop ? Infinity : null;

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