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

            } else if ( protos && isGraphLineDefinition.call( this, protos ) ) {

                node = this.state.lines[ childID ] = getThreeJSModel().state.nodes[ childID ];

                node.lineProperties = {
                    lineFunction: undefined,
                    startValue: undefined,
                    endValue: undefined,
                    pointCount: undefined,
                    color: undefined,
                    lineThickness: undefined,
                };

            }
        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childIndex, childName ) {
            
            var node;

            if ( this.state.graphs[ childID ] ) {

                node = this.state.graphs[ childID ];
                createGrid( node );

            } else if ( this.state.lines[ childID ] ) {

                node = this.state.lines[ childID ];
                createLine( node );

            }
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {

            var node = this.state.lines[ childID ];

            if ( node ) {
            }

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
                var node = this.state.lines[ nodeID ];
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
            var node = this.state.lines[ nodeID ];

            if ( node ) {

                if ( node.lineProperties.hasOwnProperty( propertyName ) ) {

                    node.lineProperties[ propertyName ] = propertyValue;

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

    function addThreeChild( parentID, childID ) {
        
        var threejs = getThreeJSModel();
        var threeParent;
        var parent = threejs.state.nodes[ parentID ];
        if ( !parent && threejs.state.scenes[ parentID ] ) {
            parent = threejs.state.scenes[ parentID ];
            threeParent = parent.threeScene;
        } else {
            threeParent = parent.threeObject;
        }
            
        if ( threeParent && this.state.lines[ childID ]) {
            var child = this.state.lines[ childID ];

            if ( child.threeObject ) {
                threeParent.add( child.threeObject );
            }
        }
    }

    function getThreeJSModel() {
        
        var threejs;

        threejs = vwf.models["vwf/model/threejs"];

        while ( threejs.model ) {
            threejs = threejs.model;
        }

        return threejs;

    }

    function createGrid( node ) {

        var xAxis, yAxis, zAxis, grid;
        var opacity = 1;

        // Create axis lines
        xAxis = new THREE.Geometry();
        xAxis.vertices.push( new THREE.Vector3( 100, 0, 0 ) );
        xAxis.vertices.push( new THREE.Vector3( -100, 0, 0 ) );
        node.threeObject.add( new THREE.Line( xAxis, new THREE.LineBasicMaterial( { color: 0xFF0000 } ) ) );

        yAxis = new THREE.Geometry();
        yAxis.vertices.push( new THREE.Vector3( 0, 100, 0 ) );
        yAxis.vertices.push( new THREE.Vector3( 0, -100, 0 ) );
        node.threeObject.add( new THREE.Line( yAxis, new THREE.LineBasicMaterial( { color: 0x0000FF } ) ) );

        zAxis = new THREE.Geometry();
        zAxis.vertices.push( new THREE.Vector3( 0, 0, 100 ) );
        zAxis.vertices.push( new THREE.Vector3( 0, 0, -100 ) );
        node.threeObject.add( new THREE.Line( zAxis, new THREE.LineBasicMaterial( { color: 0x00FF00 } ) ) );

        for ( var i = -100; i <= 100; i++ ) {
            if ( i === 0 ) {
                continue;
            } else if ( i % 10 === 0 ) {
                opacity = 0.2;
            } else {
                opacity = 0.1;
            }

            grid = new THREE.Geometry();
            grid.vertices.push( new THREE.Vector3( 100, i, 0 ) );
            grid.vertices.push( new THREE.Vector3( -100, i, 0 ) );
            node.threeObject.add( new THREE.Line( grid, new THREE.LineBasicMaterial( { color: 0xFFFFFF, transparent: true, "opacity": opacity } ) ) );

            grid = new THREE.Geometry();
            grid.vertices.push( new THREE.Vector3( i, 100, 0 ) );
            grid.vertices.push( new THREE.Vector3( i, -100, 0 ) );
            node.threeObject.add( new THREE.Line( grid, new THREE.LineBasicMaterial( { color: 0xFFFFFF, transparent: true, "opacity": opacity } ) ) );

        }

    }

    function createLine( node ) {

        var props = node.lineProperties;
        var line = graphFunction( 
                props.lineFunction, 
                props.startValue, 
                props.endValue, 
                props.pointCount, 
                props.color, 
                props.lineThickness 
            );

        node.threeObject.add( line );

    }

    function graphFunction( functionString, startValue, endValue, pointCount, color, thickness ) {

        var graphGeometry = new THREE.Geometry();
        var point, direction;
        var points = new Array();
        var faces;
        var increment;
        var func = function( x, y, z ) {
            eval( functionString );
            return new THREE.Vector3( x || 0, y || 0, z || 0 );
        }

        endValue = endValue || 10;
        startValue = startValue || 0;
        pointCount = pointCount || 10;
        increment = Math.abs( endValue - startValue ) / pointCount;
        for ( var i = startValue; i <= endValue; i += increment ) {
            point = func( i );
            direction = func( i + increment );
            direction.sub( func( i - increment ) );
            direction.normalize();
            direction.multiplyScalar( thickness / 2 );
            if ( !isNaN( point.x ) && !isNaN( point.y ) && !isNaN( point.z ) ) {
                points.push( new THREE.Vector3( point.x, point.y, point.z + thickness / 2 ) );
                points.push( new THREE.Vector3( point.x - direction.y, point.y + direction.x, point.z ) );
                points.push( new THREE.Vector3( point.x, point.y, point.z - thickness / 2 ) );
                points.push( new THREE.Vector3( point.x + direction.y, point.y - direction.x, point.z ) );
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
        var meshMaterial = new THREE.MeshBasicMaterial( { "color": color } );
        var mesh = new THREE.Mesh( graphGeometry, meshMaterial );

        return mesh;
    }

} );