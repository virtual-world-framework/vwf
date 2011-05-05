( function( modules ) {

    console.info( "loading vwf.view.glge" );

    // vwf-view-glge.js is a placeholder for an GLGE WebGL view of the scene.
    //
    // vwf-view-glge is a JavaScript module (http://www.yuiblog.com/blog/2007/06/12/module-pattern).
    // It attaches to the vwf modules list as vwf.modules.glge.

    var module = modules.glge = function( vwf, rootSelector ) {

        if ( ! vwf ) return;

        console.info( "creating vwf.view.glge" );

        modules.view.call( this, vwf );

        this.rootSelector = rootSelector;

        this.scenes = {}; // id => { glgeDocument: new GLGE.Document(), glgeRenderer: new GLGE.Renderer(), glgeScene: new GLGE.Scene() }
        this.nodes = {}; // id => { name: string, glgeObject: GLGE.Object, GLGE.Collada, GLGE.Light, or other...? }

        return this;
    };

    // Delegate any unimplemented functions to vwf-view.

    module.prototype = new modules.view();

    // == Response API =============================================================================

    // This is a placeholder for maintaining a view of the changing state of the simulation using
    // nested HTML block elements.

    // -- createdNode ------------------------------------------------------------------------------

    module.prototype.createdNode = function( nodeID, nodeExtendsID, nodeImplementsIDs, nodeSource, nodeType ) {

        console.info( "vwf.view.glge.createdNode " + nodeID + " " +
            nodeExtendsID + " " +  nodeImplementsIDs + " " +  nodeSource + " " +  nodeType );

        if ( vwf.typeURIs[nodeExtendsID] == "http://localhost/glge.js" ) {

            jQuery( this.rootSelector ).append(
                "<h2>Scene</h2>"
            );

            var canvasQuery = jQuery( this.rootSelector ).append(
                "<canvas id='" + nodeID + "' class='vwf-scene' width='800' height='450'/>"
            ) .children( ":last" );

            var scene = this.scenes[nodeID] = {
                glgeDocument: new GLGE.Document(),
                glgeRenderer: undefined,
                glgeScene: undefined
            };

            var view = this;

            scene.glgeDocument.onLoad = function() {

                scene.glgeRenderer = new GLGE.Renderer( canvasQuery.get(0) );
                scene.glgeScene = scene.glgeDocument.getElement( "mainscene" );
                scene.glgeRenderer.setScene( scene.glgeScene );

                // Resolve the mapping from VWF nodes to their corresponding GLGE objects for the
                // objects just loaded.

                bindSceneChildren( nodeID, view );

                // GLGE doesn't provide an onLoad() callback for any Collada documents referenced by
                // the GLGE document. They may still be loaded after we receive onLoad(). As a work-
                // around, wait 5 seconds after load and rebind.

                setTimeout( bindSceneChildren, 5000, nodeID, view );

                // Schedule the renderer.

                setInterval( function() { scene.glgeRenderer.render() }, 1 );

            };

            // Load the GLGE document into the scene.

            if ( nodeSource && nodeType == "model/x-glge" ) {
                scene.glgeDocument.load( nodeSource );
            }

        } else if ( vwf.typeURIs[nodeExtendsID] == "http://localhost/node3.js" ) {

            var node = this.nodes[nodeID] = {
                name: undefined,  // TODO: needed?
                glgeObject: undefined
            };

        }

    };

    // TODO: deletedNode

    // -- addedChild -------------------------------------------------------------------------------

    module.prototype.addedChild = function( nodeID, childID, childName ) {

        console.info( "vwf.view.glge.addedChild " + nodeID + " " + childID + " " + childName );

        var child = this.nodes[childID];

        if( child ) {
            bindChild( this.scenes[nodeID], this.nodes[nodeID], child, childName );
        }

    };

    // -- removedChild -----------------------------------------------------------------------------

    module.prototype.removedChild = function( nodeID, childID ) {

        console.info( "vwf.view.glge.removedChild " + nodeID + " " + childID );

    };

    // -- createdProperty --------------------------------------------------------------------------

    module.prototype.createdProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.view.glge.createdProperty " + nodeID + " " + propertyName + " " + propertyValue );

    };

    // TODO: deletedProperty

    // -- satProperty ------------------------------------------------------------------------------

    module.prototype.satProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.view.glge.satProperty " + nodeID + " " + propertyName + " " + propertyValue );

        var node = this.nodes[nodeID]; // { name: childName, glgeObject: undefined }

        // Demo hack: pause/resume an object's animation when its "angle" property is odd/even.

        if ( node && node.glgeObject && propertyName == "angle" ) {
            node.glgeObject.setPaused( ( propertyValue & 1 ) ? GLGE.TRUE : GLGE.FALSE );
        }

    };

    // -- gotProperty ------------------------------------------------------------------------------

    module.prototype.gotProperty = function( nodeID, propertyName, propertyValue ) {

        console.info( "vwf.view.glge.gotProperty " + nodeID + " " + propertyName + " " + propertyValue );

    };

    // == Private functions ========================================================================

    var bindSceneChildren = function( nodeID, view ) {

        var scene = view.scenes[nodeID], child;

        jQuery.each ( vwf.children( nodeID ), function( childIndex, childID ) {
            if ( child = view.nodes[childID] ) {
                if ( bindChild( scene, undefined, child, vwf.name( childID ) ) ) {
                    bindNodeChildren( childID, view );
                }
            }
        } );

    };

    var bindNodeChildren = function( nodeID, view ) {

        var node = view.nodes[nodeID], child;

        jQuery.each ( vwf.children( nodeID ), function( childIndex, childID ) {
            if ( child = view.nodes[childID] ) {
                if ( bindChild( undefined, node, child, vwf.name( childID ) ) ) {
                    bindNodeChildren( childID, view );
                }
            }
        } );

    };

    var bindChild = function( scene, node, child, childName ) {

        if ( scene ) {
            child.name = childName;
            child.glgeObject = scene.glgeScene && glgeSceneChild( scene.glgeScene, childName );
        }

        else if ( node ) {
            child.name = childName;
            child.glgeObject = node.glgeObject && glgeObjectChild( node.glgeObject, childName );
        }

        return Boolean( child.glgeObject );

//console.info( "scene: " + nodeID + " " + childID + " " + childName + " " + this.nodes[childID].glgeObject );
//console.info( "node: " + nodeID + " " + childID + " " + childName + " " + this.nodes[childID].glgeObject );

    };

    // Search a GLGE.Scene for a child with the given name.

    var glgeSceneChild = function( glgeScene, childName ) {

        return jQuery.grep( glgeScene.children || [], function( glgeChild ) {
            return ( glgeChild.name || glgeChild.id || glgeChild.docURL || "" ) == childName;
        } ) .shift();

    };

    // Search a GLGE.Object, GLGE.Collada, GLGE.Light for a child with the given name.  TODO: really, it's anything with children[]; could be the same as glgeSceneChild().

    var glgeObjectChild = function( glgeObject, childName ) {

        return jQuery.grep( glgeObject.children || [], function( glgeChild ) {
            return ( glgeChild.colladaName || glgeChild.colladaId || glgeChild.name || glgeChild.id || "" ) == childName;
        } ) .shift();

    };

} ) ( window.vwf.modules );
