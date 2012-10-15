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

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        initialize: function( rootSelector ) {
           
			this.rootSelector = rootSelector;
			this.height = 600;
            this.width = 800;
            this.canvasQuery = null;
            if ( window && window.innerHeight ) this.height = window.innerHeight - 20;
            if ( window && window.innerWidth ) this.width = window.innerWidth - 20;
        },

        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */) {
			
			
			//the created node is a scene, and has already been added to the state by the model.
			//how/when does the model set the state object? 
			if(this.state.scenes[childID])
			{
				var threeview = this;
				var domWin = window;
				
				
				this.canvasQuery = jQuery(this.rootSelector).append("<canvas id='" + this.state.sceneRootID + "' width='"+this.width+"' height='"+this.height+"' class='vwf-scene'/>"
                ).children(":last");
				
				initScene.call(this,this.state.scenes[childID]);
			}
        },
 
 
        // -- deletedNode ------------------------------------------------------------------------------

        //deletedNode: function( nodeID ) { },

        // -- addedChild -------------------------------------------------------------------------------

        //addedChild: function( nodeID, childID, childName ) { },

        // -- removedChild -----------------------------------------------------------------------------

        //removedChild: function( nodeID, childID ) { },

        // -- createdProperty --------------------------------------------------------------------------

        //createdProperty: function (nodeID, propertyName, propertyValue) { },

        // -- initializedProperty ----------------------------------------------------------------------

        //initializedProperty: function (nodeID, propertyName, propertyValue) { },

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------

        //satProperty: function (nodeID, propertyName, propertyValue) { },

        // -- gotProperty ------------------------------------------------------------------------------

        //gotProperty: function ( nodeID, propertyName, propertyValue ) { },
    
    
    } );
	// private ===============================================================================
	    function initScene( sceneNode ) {
    
        var self = this;
        var requestAnimFrame, cancelAnimFrame;
        (function() {
            var lastTime = 0;
            var vendors = ['ms', 'moz', 'webkit', 'o'];
            for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
                window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
                window.cancelRequestAnimationFrame = window[vendors[x]+
                  'CancelRequestAnimationFrame'];
            }

            if (!window.requestAnimationFrame) {
                requestAnimFrame = window.requestAnimationFrame = function(callback, element) {
                    var currTime = +new Date;
                    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                    var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
                      timeToCall);
                    lastTime = currTime + timeToCall;
                    return id;
                };
            }
            else {
                requestAnimFrame = window.requestAnimationFrame;
            }

            if (!window.cancelAnimationFrame) {
                cancelAnimFrame = window.cancelAnimationFrame = function(id) {
                    clearTimeout(id);
                };
            }
            else {
                cancelAnimFrame = window.cancelAnimationFrame;
            }
        }());
        
        function renderScene(time) {
            requestAnimFrame( renderScene );
            sceneNode.frameCount++;
			
            renderer.render(scene,sceneNode.camera.threeJScameras[sceneNode.camera.ID]);
        };

        var mycanvas = this.canvasQuery.get( 0 );

        if ( mycanvas ) {
          
			sceneNode.renderer = new THREE.WebGLRenderer({canvas:mycanvas,antialias:true});
            sceneNode.renderer.setClearColor({r:.5,g:1,b:1},1.0);
			sceneNode.renderer.setFaceCulling(false);
            this.state.cameraInUse = sceneNode.threeScene.children[0];
           // this.state.cameraInUse.setAspect( ( mycanvas.width / mycanvas.height) /*/ 1.333 */ );

            
            // Schedule the renderer.

            var view = this;
            var scene = sceneNode.threeScene;
            var renderer = sceneNode.renderer;
			var scenenode = sceneNode;
			window._dScene = scene;
			window._dRenderer = renderer;
            sceneNode.frameCount = 0; // needed for estimating when we're pick-safe

            renderScene((+new Date));
        }
    } 
});