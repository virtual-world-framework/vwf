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
	var stats;
    return view.load( module, {

		
        initialize: function( rootSelector ) {
           
	 
	    $(document).on('selectionChanged',this.selectionChanged.bind(this));
		this.renderTargetPasses = [];
            this.rootSelector = rootSelector;
            this.height = 600;
            this.width = 800;
            this.canvasQuery = null;
            if ( window && window.innerHeight ) this.height = window.innerHeight - 20;
            if ( window && window.innerWidth ) this.width = window.innerWidth - 20;
            this.keyStates = { keysDown: {}, mods: {}, keysUp: {} };
			
			
			this.stats = new THREE.Stats();
			this.stats.domElement.style.position = 'absolute';
			this.stats.domElement.style.top = '0px';
			this.stats.domElement.style.zIndex = 100000;
			document.body.appendChild( this.stats.domElement );
			
			stats = this.stats;
			window.stats = stats;
			window.stats.domElement.style.display = 'none';
			window._dView = this;
			
			$(document).on('setstatebegin',function()
			{
				this.paused = true;
			}.bind(this));
			$(document).on('setstatecomplete',function()
			{
				this.paused = false;
			}.bind(this));
			
			this.nodes = {};
			this.interpolateTransforms = true;
			this.tickTime = 0;
			this.realTickDif = 50;
			this.lastrealTickDif = 50;
			this.lastRealTick = performance.now();
			this.leftover = 0;
			this.future = 0;

        },
		lerp: function(a,b,l,c)
		{
			if(c) l = Math.min(1,Math.max(l,0));
			return (b*l) + a*(1.0-l);
		},
		matCmp: function(a,b,delta)
		{
			for(var i =0; i < 16; i++)
			{
				if(Math.abs(a[i] - b[i]) > delta)
					return false;
			}
			return true;
		},
		rotMatFromVec: function(x,y,z)
		{
			var n = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1];
			n[0] = x[0];n[1] = x[1];n[2] = x[2];
			n[4] = y[0];n[5] = y[1];n[6] = y[2];
			n[8] = z[0];n[9] = z[1];n[10] = z[2];
			return n;
		},
		matrixLerp: function(a,b,l)
		{
			var n = a.slice(0);
			n[12] = this.lerp(a[12],b[12],l);
			n[13] = this.lerp(a[13],b[13],l);
			n[14] = this.lerp(a[14],b[14],l);
			
			var x = [a[0],a[1],a[2]];
			var xl = Vec3.magnitude(x);
			
			var y = [a[4],a[5],a[6]];
			var yl = Vec3.magnitude(y);
			
			var z = [a[8],a[9],a[10]];
			var zl = Vec3.magnitude(z);
			
			
			var x2 = [b[0],b[1],b[2]];
			var xl2 = Vec3.magnitude(x2);
			
			var y2 = [b[4],b[5],b[6]];
			var yl2 = Vec3.magnitude(y2);
			
			var z2 = [b[8],b[9],b[10]];
			var zl2 = Vec3.magnitude(z2);
			
			var nxl = this.lerp(xl,xl2,l);
			var nyl = this.lerp(yl,yl2,l);
			var nzl = this.lerp(zl,zl2,l);
			
			x = Vec3.normalize(x,[]);
			y = Vec3.normalize(y,[]);
			z = Vec3.normalize(z,[]);
			
			x2 = Vec3.normalize(x2,[]);
			y2 = Vec3.normalize(y2,[]);
			z2 = Vec3.normalize(z2,[]);
			
			var q = Quaternion.fromRotationMatrix4(this.rotMatFromVec(x,y,z),[]);
			var q2 = Quaternion.fromRotationMatrix4(this.rotMatFromVec(x2,y2,z2),[]);
			
			var nq = Quaternion.slerp(q,q2,l,[]);
			var nqm = Quaternion.toRotationMatrix4(nq,[]);
			
			
			var nx = [nqm[0],nqm[1],nqm[2]];
			var ny = [nqm[4],nqm[5],nqm[6]];
			var nz = [nqm[8],nqm[9],nqm[10]];
			
			nx = Vec3.scale(nx,nxl,[]);
			ny = Vec3.scale(ny,nyl,[]);
			nz = Vec3.scale(nz,nzl,[]);
			
			
			nqm = this.rotMatFromVec(nx,ny,nz);
			
			nqm[12] = n[12];
			nqm[13] = n[13];
			nqm[14] = n[14];
			
			return nqm;
		},
		
		setInterpolatedTransforms: function(deltaTime)
		{
			
			
			var step = (this.tickTime) / (this.realTickDif);
			
			
			deltaTime = Math.min(deltaTime,this.realTickDif)
			this.tickTime += deltaTime || 0;

			if(this.tickTime > this.realTickDif)
				this.future = this.tickTime - this.realTickDif;
			else
				this.future = 0;
			//if going slower than tick rate, don't make life harder by changing values. it would be invisible anyway
			if(step > 2) return;
			
			for(var i in this.nodes)
			{
				
					var last = this.nodes[i].lastTickTransform;
					var now = this.nodes[i].thisTickTransform;
					if(last && now && !this.matCmp(last,now,.001))
					{
						
						var interp = last.slice(0);
						 
						
						interp = this.matrixLerp(last,now,step);
						
						
						this.state.nodes[i].settingProperty('transform',interp);
						this.nodes[i].needTransformRestore = true;
					}
					
					last = this.nodes[i].lastAnimationFrame;
					now = this.nodes[i].thisAnimationFrame;
					
					if(last != null && now != null && Math.abs(now - last) < 3 && Math.abs(now - last) > .01)
					{
						
						var interp = this.lerp(last,now,step,true);
						
						
						this.state.nodes[i].settingProperty('animationFrame',interp);
						this.nodes[i].needFrameRestore = true;
					}
			}
			
		
			
		},
		restoreTransforms: function()
		{
			for(var i in this.nodes)
			{
				
				var now = this.nodes[i].thisTickTransform;
				
				if(now && this.nodes[i].needTransformRestore)
				{
					this.state.nodes[i].settingProperty('transform',now);
					this.nodes[i].needTransformRestore = false;
				}
				
				now = this.nodes[i].thisAnimationFrame;
				if(now != null &&  this.nodes[i].needFrameRestore)
				{
					this.state.nodes[i].settingProperty('animationFrame',now);
					this.nodes[i].needFrameRestore = true;
				}
				
			}
		},
		ticked: function()
		{
			var now = performance.now();
			this.realTickDif = now - this.lastRealTick;
			this.lastRealTick = now;
			
			this.tickTime = this.future;
			//reset - loading can cause us to get behind and always but up against the max prediction value
			//if(this.future > 1) this.future = 0;
			this.future = 0;
			
			
			
			for(var i in this.nodes)
			{
				if(this.state.nodes[i] && this.state.nodes[i].gettingProperty)
				{				
					this.nodes[i].lastTickTransform = this.nodes[i].thisTickTransform;
					this.nodes[i].thisTickTransform = this.state.nodes[i].gettingProperty('transform');
					if(this.nodes[i].thisTickTransform) this.nodes[i].thisTickTransform = matCpy(this.nodes[i].thisTickTransform);
			
					this.nodes[i].lastAnimationFrame = this.nodes[i].thisAnimationFrame;
					this.nodes[i].thisAnimationFrame = this.state.nodes[i].gettingProperty('animationFrame');
					this.nodes[i].animationFrameTickChanged = false;
				}
			}
		
		},
		deletedNode: function(childID)
		{
			delete this.nodes[childID];
		},
        createdNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */) {
            
			if(childID != 'http-vwf-example-com-camera-vwf-camera')
				this.nodes[childID] = {id:childID,extends:childExtendsID};
			
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

        initializedProperty: function (nodeID, propertyName, propertyValue) { 
			this.satProperty(nodeID,propertyName,propertyValue);
		},

        // TODO: deletedProperty

        // -- satProperty ------------------------------------------------------------------------------
		getCamera: function()
		{
			if( !this.activeCamera)
				return this.state.scenes['index-vwf'].camera.threeJScameras[this.state.scenes['index-vwf'].camera.ID];
			return this.activeCamera;	
		},
		chooseCamera: function()
		{
			var namelist = ['Editor Camera'];
			var idlist = [''];
			
			for(var i in this.nodes)
			{
				if(this.nodes[i].extends == 'SandboxCamera-vwf')
				{
					idlist.push(i);
					namelist.push(vwf.getProperty(i,'DisplayName'));
				}
			}
			
			alertify.choice('Choose Scene Camera',function(ok,val){
				if(ok)
				{
					for(var i = 0; i < namelist.length; i++)
						if(namelist[i] == val)
							_dView.setCamera(idlist[i]);
				
				
				}
			},namelist);
		},
		selectionChanged: function(e,selection)
		{
			this.selection = selection;
			
			if(this.cameraHelper)
			{
				this.cameraHelper.parent.remove(this.cameraHelper);
				this.cameraHelper = null;
			}
			if(this.selection && vwf.getProperty(this.selection.id,'type') =='Camera')
			{
				var selcam = _Editor.findviewnode(this.selection.id).children[0];
				this.cameraHelper = new THREE.CameraHelper(selcam);
				selcam.add(this.cameraHelper,false);
			}
			
			
		},
		setCamera: function(camID)
		{
			var defaultCameraID;
			var instanceData = _DataManager.getInstanceData();
			var publishSettings = instanceData.publishSettings;

			if(publishSettings) defaultCameraID = publishSettings.camera;

			this.cameraID = camID || defaultCameraID;
			
			var cam = this.state.scenes['index-vwf'].camera.threeJScameras[this.state.scenes['index-vwf'].camera.ID];
			
			if(this.cameraID)
			{
				clearCameraModeIcons();
				cam = null;
				if(this.state.nodes[this.cameraID])
				if(this.state.nodes[this.cameraID].getRoot && this.state.nodes[this.cameraID].getRoot())
				{
					cam = this.state.nodes[this.cameraID].getRoot();
				}
			}
			
			if(cam)
			{
				var aspect = $('#index-vwf').width()/$('#index-vwf').height();
				cam.aspect = aspect;
				cam.updateProjectionMatrix();
			}
			this.activeCamera = cam;
		
		},
		inDefaultCamera: function()
		{
			return this.cameraID == null || this.cameraID =='' || this.cameraID ==undefined;
		},
		setCameraDefault: function()
		{
			this.setCamera();
		},
        satProperty: function (nodeID, propertyName, propertyValue) {
        
            //console.log([nodeID,propertyName,propertyValue]);
            var node = this.state.nodes[ nodeID ]; // { name: childName, threeObject: undefined }
            if(!node) node = this.state.scenes[nodeID];
            var value = undefined;
          
			if(vwf.client())
			{
			if(propertyName == 'transform')
			{
				if(this.nodes[nodeID])
				{
					
					this.nodes[nodeID].lastTickTransform = null;
					this.nodes[nodeID].thisTickTransform = null;
				
				}
			}
			if(propertyName == 'animationFrame')
			{
				if(this.nodes[nodeID])
				{
					this.nodes[nodeID].lastAnimationFrame = null;
					this.nodes[nodeID].thisAnimationFrame = null;
				}
			}
			}
			
			
            //this driver has no representation of this node, so there is nothing to do.
            if(!node) return;
          
            var threeObject = node.threeObject;
            if(!threeObject)
              threeObject = node.threeScene;
          
            //There is not three object for this node, so there is nothing this driver can do. return
            if(!threeObject) return value;  
              
            if ( node && threeObject && propertyValue !== undefined ) 
            {
                if(threeObject instanceof THREE.Scene)
                {
                    if(propertyName == 'enableShadows')
                    {
                        //debugger;
                        var sceneNode = this.state.scenes[nodeID];
                        sceneNode.renderer.shadowMapEnabled = propertyValue;
                    }
					if(propertyName == 'fogType')
					{
						
						var oldfog = threeObject.fog;
						var newfog;
						if(propertyValue == 'exp')
						{
							newfog = new THREE.FogExp2();
						}
						if(propertyValue == 'linear')
						{
							newfog = new THREE.Fog();
						}
						if(propertyValue == 'none')
						{
							newfog = null;
						}
						if(oldfog && newfog)
						{
							newfog.color.r = oldfog.color.r;
							newfog.color.g = oldfog.color.g;
							newfog.color.b = oldfog.color.b;
							newfog.near = oldfog.near;
							newfog.far = oldfog.far;
							newfog.density = oldfog.density;
						}
						threeObject.fog = newfog;
						rebuildAllMaterials.call(this,threeObject);
					}
					if(propertyName == 'fogColor')
					{
						
						if(!threeObject.fog)
							threeObject.fog = new THREE.Fog();
						
						threeObject.fog.color.r = propertyValue[0];
						threeObject.fog.color.g = propertyValue[1];
						threeObject.fog.color.b = propertyValue[2];
						rebuildAllMaterials.call(this,threeObject);
					}
					if(propertyName == 'fogNear')
					{
						
						if(!threeObject.fog)
							threeObject.fog = new THREE.Fog();
						threeObject.fog.near = propertyValue;	
						rebuildAllMaterials.call(this,threeObject);
					}
					if(propertyName == 'fogDensity')
					{
						
						if(!threeObject.fog)
							threeObject.fog = new THREE.Fog();
						threeObject.fog.near = propertyValue;	
						threeObject.fog.density = propertyValue;
						rebuildAllMaterials.call(this,threeObject);
					}
					if(propertyName == 'fogFar')
					{
						
						if(!threeObject.fog)
							threeObject.fog = new THREE.Fog();
						threeObject.fog.far = propertyValue;
						rebuildAllMaterials.call(this,threeObject);
					}
                    if ( propertyName == 'ambientColor' )
                    {
                        var lightsFound = 0;
						//this prop really should be a color array
						if(propertyValue.constructor != Array) return;
						
						if(propertyValue[0] > 1 && propertyValue[1] > 1 && propertyValue[2] > 1)
							{
								propertyValue[0]/=255;
								propertyValue[1]/=255;
								propertyValue[2]/=255;
							
							}
							
                        for( var i = 0; i < threeObject.__lights.length; i++ )
                        {
                            if(threeObject.__lights[i] instanceof THREE.AmbientLight)
                            {
                                threeObject.__lights[i].color.setRGB(propertyValue[0],propertyValue[1],propertyValue[2]);
                                //SetMaterialAmbients.call(this);
                                lightsFound++;
                            }else
							{
								threeObject.__lights[i].shadowDarkness = MATH.lengthVec3(propertyValue)/2.7320508075688772;
							}
                            
                        }
                        if ( lightsFound == 0 ) {
						
							
                            var ambientlight = new THREE.AmbientLight( '#000000' );
                            ambientlight.color.setRGB( propertyValue[0], propertyValue[1], propertyValue[2] );
                            node.threeScene.add( ambientlight );
                            //SetMaterialAmbients.call(this);                            
                        }
                        
                    }
                }
            }
        
        
        
        },
		createRenderTarget: function(cameraID)
		{
			
			var rtt = new THREE.WebGLRenderTarget( 512,512, { format: THREE.RGBFormat } );
			this.renderTargetPasses.push({camera:cameraID,target:rtt});
			return rtt;
		},
		deleteRenderTarget: function(rtt)
		{
			for(var i = 0; i < this.renderTargetPasses.length; i++)
			{
				if(this.renderTargetPasses[i].target == rtt)
					this.renderTargetPasses.splice(i,1);
			}
		},
		trigger: function(name,args)
		{
			if(!this.args)
			this.args = [null];
			for(var i = 0; i < args.length; i++)
				this.args[i+1] = args[i];

			var queue = this.events[name];
			if(!queue) return;
			for(var i = 0; i < queue.length; i++)
			{
				this.events[name][i].apply(this,this.args);
			}

		},
		bind:function (name,func)
		{

			if(!this.events)
				this.events = {};
			if(!this.events[name])
				this.events[name] = [];
			this.events[name].push(func);
			return this.events[name].length -1;
		},
		unbind:function (name,func)
		{

			var queue = this.events[name];
			if(!queue) return;

			if(func instanceof Number)
				queue.splice(func,1);
			else
			{
				func = queue.indexOf(func);
				queue.splice(func,1);
			}
		}
		

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
        
        function GetParticleSystems(node,list)
		{
			
			for(var i =0; i<node.children.length; i++)
			{
				if(node.children[i] instanceof THREE.ParticleSystem)
				{
					if(!list)
						list = [];
					list.push(node.children[i]);
				}
				list = 	GetParticleSystems(node.children[i],list);
			}			
				return list;
		}
	var timepassed;	
	var now;
	var cam;
	var t;
	var l;
	var w ;
	var h ;
	var wh;
	var ww;
	var selcam;
	var oldaspect;
	var camback ;
	var _viewProjectionMatrix = new THREE.Matrix4();
	var insetvp;
	var pss;
	var vp;
	var rootdiv;
	var minD;
	var temparray = [];
	var camback;
	var insetvp;
	var vpargs = [];
	var documentselector = $(document);
        function renderScene(time) {
			
			
			
            requestAnimFrame( renderScene );
			
			//get the camera. If a default was specified, but not yet availabe, get the system default.
			cam = self.getCamera();
			//if for some reason even the system default is not availabe, wait a frame
			if(!cam) return;

			//if we have a camera, but self.activecamera is null, then we were expecting a default camera, but it was not yet available
			//try to set it, so next frame we use it. 
			if(!self.activeCamera) self.setCamera();

			if(self.paused === true)
				return;
			self.inFrame = true;	
			sceneNode.frameCount++;
			now = ( window.performance !== undefined && window.performance.now !== undefined ) ? window.performance.now() : time;
			
			timepassed = now - sceneNode.lastTime;
			window.deltaTime = timepassed;
			if(_SceneManager)
				_SceneManager.update(timepassed);
			pss = GetParticleSystems(sceneNode.threeScene);
			for(var i in pss)
			{
				if(pss[i].update)
					pss[i].update(timepassed || 0);
			}

			if(self.interpolateTransforms)
				self.setInterpolatedTransforms(timepassed);
				
			
			
			cam.matrixWorldInverse.getInverse( cam.matrixWorld );
			 
			_viewProjectionMatrix.multiplyMatrices( cam.projectionMatrix, cam.matrixWorldInverse );
			vp =  _viewProjectionMatrix.transpose().flattenToArray(temparray);
			
			if(!rootdiv)
				rootdiv = document.getElementById('index-vwf');
			
			wh = $('#index-vwf').height();
			ww = $('#index-vwf').width();
			minD = Math.min(ww,wh);
			if(minD < 100) return;
			
			
			
			vpargs[0] = vp;
			vpargs[1] = wh;
			vpargs[2] = ww;
			
			
			self.trigger('prerender',vpargs);

		
			for(var i in vwf.models[0].model.nodes)
			{
				var node = vwf.models[0].model.nodes[i];
				if(node.private.bodies.prerender)
					node.private.bodies.prerender.call(node,[timepassed]);
			}
			
			//the camera changes the view projection in the prerender call
			
			_viewProjectionMatrix.multiplyMatrices( cam.projectionMatrix, cam.matrixWorldInverse );
			 vp =  _viewProjectionMatrix.transpose().flattenToArray(temparray);
			
			
			
            if(sceneNode.frameCount > 5)
            {
                
                sceneNode.frameCount = 0;
            
             
                var newPick = ThreeJSPick.call(self,sceneNode,cam,ww,wh);

                var newPickId = newPick ? getPickObjectID.call( view, newPick.object ) : view.state.sceneRootID;
                
                
				if(self.lastPickId != newPickId && self.lastEventData)
                {
					
                    if(self.lastPickId)
                    view.kernel.dispatchEvent( self.lastPickId, "pointerOut", self.lastEventData.eventData, self.lastEventData.eventNodeData );
					if(newPickId)
                    view.kernel.dispatchEvent( newPickId, "pointerOver", self.lastEventData.eventData, self.lastEventData.eventNodeData );
                }
                
                self.lastPickId = newPickId;
                _DEALLOC(self.lastPick);
                self.lastPick = newPick;
                if(view.lastEventData && (view.lastEventData.eventData[0].screenPosition[0] != oldMouseX || view.lastEventData.eventData[0].screenPosition[1] != oldMouseY)) {
                    oldMouseX = view.lastEventData.eventData[0].screenPosition[0];
                    oldMouseY = view.lastEventData.eventData[0].screenPosition[1];
                    hovering = false;
                }
                else if(self.lastEventData && self.mouseOverCanvas && !hovering && self.lastPick) {
                    var pickId = getPickObjectID.call( view, self.lastPick.object, false );
                    if(!pickId) {
                        pickId = view.state.sceneRootID;
                    }
                    view.kernel.dispatchEvent( pickId, "pointerHover", self.lastEventData.eventData, self.lastEventData.eventNodeData );
                    hovering = true;
                }
                
            }
			renderer.clear();
			
			//var far = cam.far;
			//var near = cam.near;
			
			
			renderer.render(backgroundScene,cam);
			
			renderer.clear(false,true,false);
			
			//use this for drawing really really far. Not usually necessary
			//cam.near = cam.far - (cam.far - cam.near)/100.0;
			//cam.far = far * 10;
			//cam.updateProjectionMatrix();
			//renderer.render(scene,cam);
			//renderer.clear(false,true,false);
			//cam.near = near;
			//cam.far = far;
			//cam.updateProjectionMatrix();
			renderer.render(scene,cam);
			
			
			
			if(self.selection && vwf.getProperty(self.selection.id,'type') =='Camera' && self.cameraID != self.selection.id)
			{
				selcam = _Editor.findviewnode(self.selection.id).children[0];
				oldaspect = selcam.aspect;
				selcam.aspect = 1;
				selcam.updateProjectionMatrix();
				
				t = $('#toolbar').offset().top + $('#toolbar').height() + 10;
				l = 10;
				w = ww/3;
				h = wh/3;
				
				
				
				renderer.setViewport(0,0,w,w);
				_Editor.hideMoveGizmo();
				_dRenderer.setScissor(0,0,w,w);
				renderer.enableScissorTest(true);
				
				
				
				camback = self.cameraID;
				self.cameraID = self.selection.id;
				
			
				selcam.matrixWorldInverse.getInverse( selcam.matrixWorld );
				
				_viewProjectionMatrix.multiplyMatrices( selcam.projectionMatrix, selcam.matrixWorldInverse );
				insetvp =  MATH.transposeMat4(_viewProjectionMatrix.flattenToArray(temparray));
				
				
				self.trigger('postprerender',[insetvp,w,w]);
				
				renderer.clear(true,true,true);
				renderer.render(backgroundScene,selcam);
				
				renderer.clear(false,true,false);
				renderer.render(scene,selcam);
				
				self.cameraID = camback;
				_Editor.showMoveGizmo();
				_dRenderer.setViewport(0,0,$('#index-vwf').attr('width'),$('#index-vwf').attr('height'));
				_dRenderer.setScissor(0,0,$('#index-vwf').attr('width'),$('#index-vwf').attr('height'));
				renderer.enableScissorTest(false);
				selcam.aspect = oldaspect;
				selcam.updateProjectionMatrix();
			
			}
			
			self.trigger('postprerender',vpargs);
			
			
			
			self.trigger('postrender',vpargs);
			
			if($('#glyphOverlay').css('display') != 'none')
			{
				self.trigger('glyphrender',vpargs);
			}
			
			
			for(var i = 0; i < self.renderTargetPasses.length; i++)
			{
				
				var rttcamID = self.renderTargetPasses[i].camera;
				var rttcam = self.state.nodes[rttcamID].getRoot();
				var rtt = self.renderTargetPasses[i].target;
				renderer.render(backgroundScene,rttcam,rtt,true);
				renderer.render(scene,rttcam,rtt);
				
				
			}
			
			
			
			
			sceneNode.lastTime = now;
			if(stats.domElement.style.display == 'block')
				stats.update();
			
			if(self.interpolateTransforms)
				self.restoreTransforms();
			
			self.inFrame = false;
			
        };

        var mycanvas = this.canvasQuery.get( 0 );
        
        function detectWebGL()
        {
            var asa; var canvas; var dcanvas; var gl; var expmt;

            $(document.body).append('<canvas width="100" height="100" id="testWebGLSupport" />');
            canvas = $('#testWebGLSupport');
            

            // check to see if we can do webgl
            // ALERT FOR JQUERY PEEPS: canvas is a jquery obj - access the dom obj at canvas[0]
                dcanvas = canvas[0];
                expmt = false;
                if ("WebGLRenderingContext" in window) {
                    console.log("browser at least knows what webgl is.");
                }
                // some browsers don't have a .getContext for canvas...
                try { gl = dcanvas.getContext("webgl"); }
                catch (x) { gl = null; }
                if (gl == null) {
                    try { gl = dcanvas.getContext("experimental-webgl"); }
                    catch (x) { gl = null; }
                    if (gl == null) { console.log('but can\'t speak it'); }
                    else { expmt = true; console.log('and speaks it experimentally.'); }
                } else {
                    console.log('and speaks it natively.');
                }

                if (gl || expmt) {
                    console.log("loading webgl content."); canvas.remove(); return true;
                } else {
                    console.log("image-only fallback. no webgl.");
                    canvas.remove();
                    return false;
                }

            
        
        
        }
        function getURLParameter(name) {
            return decodeURI(
                (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
            );
        }
        
        if ( mycanvas ) {
            var oldMouseX = 0;
            var oldMouseY = 0;
            var hovering = false;
            var view = this;
            window.onresize = function () {
                var origWidth = self.width;
                var origHeight = self.height;
                if ( window && window.innerHeight ) self.height = window.innerHeight - 20;
                if ( window && window.innerWidth ) self.width = window.innerWidth - 20;

                if ((origWidth != self.width) || (origHeight != self.height)) {
                    mycanvas.height = self.height;
                    mycanvas.width = self.width;
                    sceneNode.renderer.setViewport(0,0,window.innerWidth,window.innerHeight)
                    sceneNode.renderer.setSize($('#index-vwf').width(),$('#index-vwf').height());
					self.getCamera().aspect =  mycanvas.width / mycanvas.height;
					self.getCamera().updateProjectionMatrix()
                   
                }
            }

            if(detectWebGL() && getURLParameter('disableWebGL') == 'null')
            {
                sceneNode.renderer = new THREE.WebGLRenderer({canvas:mycanvas,antialias:true});
				sceneNode.renderer.autoUpdateScene = false;
				sceneNode.renderer.setSize($('#index-vwf').width(),$('#index-vwf').height());
				sceneNode.renderer.shadowMapEnabled = true;
				sceneNode.renderer.shadowMapType = THREE.PCFSoftShadowMap;
				sceneNode.renderer.autoClear = false;
				sceneNode.renderer.setClearColor({r:0,g:0,b:0},1.0);
            }else
            {
                sceneNode.renderer = new THREE.CanvasRenderer({canvas:mycanvas,antialias:true});
                sceneNode.renderer.setSize(window.innerWidth,window.innerHeight);
            }
            //
//            var ambientlight = new THREE.AmbientLight('#000000');
//            ambientlight.color.setRGB(.7,.7,.7);
//            sceneNode.threeScene.add(ambientlight);
            
            rebuildAllMaterials.call(this);
            if(sceneNode.renderer.setFaceCulling)
                sceneNode.renderer.setFaceCulling(false);
            this.state.cameraInUse = sceneNode.camera.threeJScameras[sceneNode.camera.ID];
           // this.state.cameraInUse.setAspect( ( mycanvas.width / mycanvas.height) /*/ 1.333 */ );

            
            // Schedule the renderer.

            var view = this;
            var scene = sceneNode.threeScene;
			var backgroundScene = new THREE.Scene();
			
            var renderer = sceneNode.renderer;
            var scenenode = sceneNode;
            window._dScene = scene;
			window._dbackgroundScene = backgroundScene;
            window._dRenderer = renderer;
			window._dSceneNode = sceneNode;
            sceneNode.frameCount = 0; // needed for estimating when we're pick-safe
            
            initInputEvents.call(this,mycanvas);
            renderScene((+new Date));
        }
    }
    function rebuildAllMaterials(start)
    {
        
        if(!start)
        {
            for(var i in this.state.scenes)
            {
                rebuildAllMaterials(this.state.scenes[i].threeScene);
            }
        }else
        {
            if(start && start.material)
            {
                start.material.needsUpdate = true;
            }
            if(start && start.children)
            {
               for(var i in start.children)
                rebuildAllMaterials(start.children[i]);
            }
        }
    }   
    //necessary when settign the amibent color to match MATH behavior
    //Three js mults scene ambient by material ambient
    function SetMaterialAmbients(start)
    {
        
        if(!start)
        {
            for(var i in this.state.scenes)
            {
                SetMaterialAmbients(this.state.scenes[i].threeScene);
            }
        }else
        {
            if(start && start.material)
            {
                //.005 chosen to make the 255 range for the ambient light mult to values that look like MATH values.
                //this will override any ambient colors set in materials.
                if(start.material.ambient)
                    start.material.ambient.setRGB(1,1,1);
            }
            if(start && start.children)
            {
               for(var i in start.children)
                SetMaterialAmbients(start.children[i]);
            }
        }
    }
        // -- initInputEvents ------------------------------------------------------------------------


    function initInputEvents( canvas ) {
        var sceneNode = this.state.scenes[this.state.sceneRootID], child;
        var sceneID = this.state.sceneRootID;
        var sceneView = this;

        var pointerDownID = undefined;
        var pointerOverID = undefined;
        var pointerPickID = undefined;
        var threeActualObj = undefined;

        var lastXPos = -1;
        var lastYPos = -1;
        var mouseRightDown = false;
        var mouseLeftDown = false;
        var mouseMiddleDown = false;
        var win = window;

        var container = document.getElementById("container");
        var sceneCanvas = canvas;
        //var mouse = new MATH.MouseInput( sceneCanvas );

        var self = this;

        var getEventData = function( e, debug ) {
            var returnData = { eventData: undefined, eventNodeData: undefined };
            var pickInfo = self.lastPick;
            pointerPickID = undefined;

            threeActualObj = pickInfo ? pickInfo.object : undefined;
            pointerPickID = pickInfo ? getPickObjectID.call( sceneView, pickInfo.object, debug ) : undefined;
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
                /*client: "123456789ABCDEFG", */
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
                position: [ mouseXPos.call( this,e)/sceneView.width, mouseYPos.call( this,e)/sceneView.height ],
                screenPosition: [mouseXPos.call(this,e), mouseYPos.call(this,e)]
            } ];



            var camera = self.getCamera();//sceneView.state.cameraInUse;
            var worldCamPos, worldCamTrans, camInverse;
            if ( camera ) { 
                worldCamTrans = new THREE.Vector3();
				worldCamTrans.getPositionFromMatrix(camera.matrix);
                worldCamPos = [ worldCamTrans.x, worldCamTrans.y, worldCamTrans.y];
                //worldCamPos = [ camera.getLocX(), camera.getLocY(), camera.getLocZ() ]; 
//                worldCamTrans = goog.vec.Mat4.createFromArray( camera.getLocalMatrix() );
//                goog.vec.Mat4.transpose( worldCamTrans, worldCamTrans );
//                camInverse = goog.vec.Mat4.create();
//                goog.vec.Mat4.invert( worldCamTrans, camInverse );
            }

            returnData.eventNodeData = { "": [ {
                distance: pickInfo ? pickInfo.distance : undefined,
                origin: pickInfo ? pickInfo.worldCamPos : undefined,
                globalPosition: pickInfo ? [pickInfo.point.x,pickInfo.point.y,pickInfo.point.z] : undefined,
                globalNormal: pickInfo ? [0,0,1] : undefined,    //** not implemented by threejs
                globalSource: worldCamPos,            
            } ] };

            if ( pickInfo && pickInfo.normal ) {
                var pin = pickInfo.normal;  
                var nml = goog.vec.Vec3.createFloat32FromValues( pin[0], pin[1], pin[2] );
                nml = goog.vec.Vec3.normalize( nml, goog.vec.Vec3.create() );
                returnData.eventNodeData[""][0].globalNormal = [ nml[0], nml[1], nml[2] ];
            }

            if ( sceneView && sceneView.state.nodes[ pointerPickID ] ) {
                var camera = sceneView.getCamera();
                var childID = pointerPickID;
                var child = sceneView.state.nodes[ childID ];
                var parentID = child.parentID;
                var parent = sceneView.state.nodes[ child.parentID ];
                var trans, parentTrans, localTrans, localNormal, parentInverse, relativeCamPos;
                while ( child ) {

                    trans = goog.vec.Mat4.createFromArray( child.threeObject.matrix.elements );
                    goog.vec.Mat4.transpose( trans, trans );                   
                    
                    if ( parent ) {                   
                        parentTrans = goog.vec.Mat4.createFromArray( parent.threeObject.matrix.elements );
                        goog.vec.Mat4.transpose( parentTrans, parentTrans ); 
                    } else {
                        parentTrans = undefined;
                    }

                    if ( trans && parentTrans ) {
                        // get the parent inverse, and multiply by the world
                        // transform to get the local transform 
                        parentInverse = goog.vec.Mat4.create();
                        if ( goog.vec.Mat4.invert( parentTrans, parentInverse ) ) {
                            localTrans = goog.vec.Mat4.multMat( parentInverse, trans,
                                goog.vec.Mat4.create()                       
                            );
                        }
                    }

                    // transform the global normal into local
                    if ( pickInfo && pickInfo.normal ) {
                        localNormal = goog.vec.Mat4.multVec3Projective( trans, pickInfo.normal, 
                            goog.vec.Vec3.create() );
                    } else {
                        localNormal = undefined;  
                    }

                    if ( worldCamPos ) { 
                        relativeCamPos = goog.vec.Mat4.multVec3Projective( trans, worldCamPos, 
                            goog.vec.Vec3.create() );                         
                    } else { 
                        relativeCamPos = undefined;
                    }
                                        
                    returnData.eventNodeData[ childID ] = [ {
                        position: localTrans,
                        normal: localNormal,
                        source: relativeCamPos,
                        distance: pickInfo ? pickInfo.distance : undefined,
                        globalPosition: pickInfo ? pickInfo.coord : undefined,
                        globalNormal: pickInfo ? pickInfo.normal : undefined,
                        globalSource: worldCamPos,            
                    } ];

                    childID = parentID;
                    child = sceneView.state.nodes[ childID ];
                    parentID = child ? child.parentID : undefined;
                    parent = parentID ? sceneView.state.nodes[ child.parentID ] : undefined;

                }
            }
            self.lastEventData = returnData;
            return returnData;
        }          

        canvas.onmousedown = function( e ) {
		
		if(window._Editor && (window._Editor.GetSelectMode() == 'Pick' || window._Editor.GetSelectMode() == 'TempPick') && e.button == 0)
			{
				return;
			}
			
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
            var event = getEventData( e, false );
            if ( event ) {
                pointerDownID = pointerPickID ? pointerPickID : sceneID;
                sceneView.kernel.dispatchEvent( pointerDownID, "pointerDown", event.eventData, event.eventNodeData );
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
                    sceneView.kernel.dispatchEvent( mouseUpObjectID, "pointerClick", eData.eventData, eData.eventNodeData );

                    // TODO: hierarchy output, helpful for setting up applications
                    //var obj3js = sceneView.state.nodes[mouseUpObjectID].threeObject;
                    //if ( obj3js ) {
                    //    if ( atlDown && !ctrlDown ) {
                    //        recurseGroup.call( sceneView, obj3js, 0 ); 
                    //    }
                    //}
                }
				if(pointerDownID)
                sceneView.kernel.dispatchEvent( pointerDownID, "pointerUp", eData.eventData, eData.eventNodeData );
            }
            pointerDownID = undefined;
        }

        canvas.onmouseover = function( e ) {
            self.mouseOverCanvas = true;
            var eData = getEventData( e, false );
            if ( eData ) {
                pointerOverID = pointerPickID ? pointerPickID : sceneID;
                sceneView.kernel.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
            }
        }
		var lastpoll = performance.now();
        canvas.onmousemove = function( e ) {
            
			var eData = getEventData( e, false );
            
            if ( eData ) {
                if ( mouseLeftDown || mouseRightDown || mouseMiddleDown ) {
					// lets begin filtering this - it should be possible to only send the data when the change is greater than some value
					if(pointerDownID)
					{
						
							var now = performance.now();
							var timediff = (now - lastpoll);
						if(timediff > 50)   //condition for filter
						{	
							lastpoll = now;
							sceneView.lastData = eData;
							sceneView.kernel.dispatchEvent( pointerDownID, "pointerMove", eData.eventData, eData.eventNodeData );
						}
					}
                } else {
                    if ( pointerPickID ) {
                        if ( pointerOverID ) {
                            if ( pointerPickID != pointerOverID ) {
								if(pointerOverID)
                                sceneView.kernel.dispatchEvent( pointerOverID, "pointerLeave", eData.eventData, eData.eventNodeData );
                                pointerOverID = pointerPickID;
								if(pointerOverID)
                                sceneView.kernel.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
                            }
                        } else {
                            pointerOverID = pointerPickID;
							if(pointerOverID)
                            sceneView.kernel.dispatchEvent( pointerOverID, "pointerEnter", eData.eventData, eData.eventNodeData );
                        }
                    } else {
                        if ( pointerOverID ) {
							if(pointerOverID)
                            sceneView.kernel.dispatchEvent( pointerOverID, "pointerLeave", eData.eventData, eData.eventNodeData );
                            pointerOverID = undefined;
                        }
                    }
                }
            }
        }

        canvas.onmouseout = function( e ) {
            if ( pointerOverID ) {
                sceneView.kernel.dispatchEvent( pointerOverID, "pointerLeave" );
                pointerOverID = undefined;
            }
            self.mouseOverCanvas = false;
        }

        canvas.setAttribute("onmousewheel", '');
        
        window.document.getElementById('index-vwf').onkeydown = function (event) {
                    
                    var key = undefined;
                    var validKey = false;
                    var keyAlreadyDown = false;
                    switch (event.keyCode) {
                        case 17:
                        case 16:
                        case 18:
                        case 19:
                        case 20:
                            break;
                        default:
                            key = getKeyValue.call( sceneView, event.keyCode);
                            keyAlreadyDown = !!sceneView.keyStates.keysDown[key.key];
                            sceneView.keyStates.keysDown[key.key] = key;
                            validKey = true;
                            break;
                    }

                    if (!sceneView.keyStates.mods) sceneView.keyStates.mods = {};
                    sceneView.keyStates.mods.alt = event.altKey;
                    sceneView.keyStates.mods.shift = event.shiftKey;
                    sceneView.keyStates.mods.ctrl = event.ctrlKey;
                    sceneView.keyStates.mods.meta = event.metaKey;

                    var sceneNode = sceneView.state.scenes[sceneView.state.sceneRootID];
                    if (validKey && sceneNode && !keyAlreadyDown /*&& Object.keys( sceneView.keyStates.keysDown ).length > 0*/) {
                        //var params = JSON.stringify( sceneView.keyStates );
                        sceneView.kernel.dispatchEvent(sceneNode.ID, "keyDown", [sceneView.keyStates]);
                    }
                };
	      window.document.getElementById('index-vwf').onblur = function()
		  {
				
				  for(var i in  sceneView.keyStates.keysDown)
				  {
					var key = sceneView.keyStates.keysDown[i];
					delete sceneView.keyStates.keysDown[i];
					sceneView.keyStates.keysUp[key.key] = key;
				  }
				  var sceneNode = sceneView.state.scenes[sceneView.state.sceneRootID];
                    if (sceneNode) {
                        //var params = JSON.stringify( sceneView.keyStates );
                        sceneView.kernel.dispatchEvent(sceneNode.ID, "keyUp", [sceneView.keyStates]);
                        
                    }
				 for(var i in  sceneView.keyStates.keysUp)
				  {
					
					delete sceneView.keyStates.keysUp[i];
					
				  }	
			
		  }
         window.document.getElementById('index-vwf').onkeyup = function (event) {
                    var key = undefined;
                    var validKey = false;
                    switch (event.keyCode) {
                        case 16:
                        case 17:
                        case 18:
                        case 19:
                        case 20:
                            break;
                        default:
                            key = getKeyValue.call( sceneView, event.keyCode);
                            delete sceneView.keyStates.keysDown[key.key];
                            sceneView.keyStates.keysUp[key.key] = key;
                            validKey = true;
                            break;
                    }

                    sceneView.keyStates.mods.alt = event.altKey;
                    sceneView.keyStates.mods.shift = event.shiftKey;
                    sceneView.keyStates.mods.ctrl = event.ctrlKey;
                    sceneView.keyStates.mods.meta = event.metaKey;

                    var sceneNode = sceneView.state.scenes[sceneView.state.sceneRootID];
                    if (validKey && sceneNode) {
                        //var params = JSON.stringify( sceneView.keyStates );
                        sceneView.kernel.dispatchEvent(sceneNode.ID, "keyUp", [sceneView.keyStates]);
                        delete sceneView.keyStates.keysUp[key.key];
                    }

                };
        
        if(typeof canvas.onmousewheel == "function") {
            canvas.removeAttribute("onmousewheel");
            canvas.onmousewheel = function( e ) {
                var eData = getEventData( e, false );
                if ( eData ) {
                    eData.eventNodeData[""][0].wheel = {
                        delta: e.wheelDelta / -40,
                        deltaX: e.wheelDeltaX / -40,
                        deltaY: e.wheelDeltaY / -40,
                    };
                    var id = sceneID;
                    if ( pointerDownID && mouseRightDown || mouseLeftDown || mouseMiddleDown )
                        id = pointerDownID;
                    else if ( pointerOverID )
                        id = pointerOverID; 
                    if(id)    
                    sceneView.kernel.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );
                }
            };
        }
        else {
            canvas.removeAttribute("onmousewheel");
            canvas.addEventListener('DOMMouseScroll', function( e ) {
                var eData = getEventData( e, false );
                if ( eData ) {
                    eData.eventNodeData[""][0].wheel = {
                        delta: e.detail,
                        deltaX: e.detail,
                        deltaY: e.detail,
                    };
                    var id = sceneID;
                    if ( pointerDownID && mouseRightDown || mouseLeftDown || mouseMiddleDown )
                        id = pointerDownID;
                    else if ( pointerOverID )
                        id = pointerOverID; 
                        
                    sceneView.kernel.dispatchEvent( id, "pointerWheel", eData.eventData, eData.eventNodeData );
                }
            });
        }

        // == Draggable Content ========================================================================

//        canvas.addEventListener( "dragenter", function( e ) {
//            e.stopPropagation();
//            e.preventDefault();             
//        }, false );
//        canvas.addEventListener( "dragexit", function( e ) {
//            e.stopPropagation();
//            e.preventDefault();             
//        }, false );

        // -- dragOver ---------------------------------------------------------------------------------

        canvas.ondragover = function( e ) {
            sceneCanvas.mouseX=e.clientX;
            sceneCanvas.mouseY=e.clientY;
            var eData = getEventData( e, false );
            if ( eData ) {
                e.dataTransfer.dropEffect = "copy";
            }
            e.preventDefault();    
        };

        // -- drop ---------------------------------------------------------------------------------

        canvas.ondrop = function( e ) {

            e.preventDefault();
            var eData = getEventData( e, false );

            if ( eData ) {

                var fileData, fileName, fileUrl, rotation, scale, translation, match, object;

                try {

                    fileData = JSON.parse( e.dataTransfer.getData('text/plain') );
                    fileName = decodeURIComponent(fileData.fileName);
                    fileUrl = decodeURIComponent(fileData.fileUrl);
                    rotation = decodeURIComponent(fileData.rotation);
                    rotation = rotation ? JSON.parse(rotation) : undefined;
                    scale = decodeURIComponent(fileData.scale);
                    scale = scale ? JSON.parse(scale) : [1, 1, 1];
                    translation = decodeURIComponent(fileData.translation);
                    translation = translation ? JSON.parse(translation) : [0, 0, 0];
                    if($.isArray(translation) && translation.length == 3) {
                        translation[0] += eData.eventNodeData[""][0].globalPosition[0];
                        translation[1] += eData.eventNodeData[""][0].globalPosition[1];
                        translation[2] += eData.eventNodeData[""][0].globalPosition[2];
                    }
                    else {
                        translation = eData.eventNodeData[""][0].globalPosition;
                    }

                    if ( match = /* assignment! */ fileUrl.match( /(.*\.vwf)\.(json|yaml)$/i ) ) {

                        object = {
                          extends: match[1],
                          properties: { 
                            translation: translation,
                            rotation : rotation,
                            scale: scale,
                          },
                        };

                        fileName = fileName.replace( /\.(json|yaml)$/i, "" );

                    } else if ( match = /* assignment! */ fileUrl.match( /\.dae$/i ) ) {

                        object = {
                          extends: "http://vwf.example.com/node3.vwf",
                          source: fileUrl,
                          type: "model/vnd.collada+xml",
                          properties: { 
                            translation: translation,
                            rotation : rotation,
                            scale: scale,
                          },   
                        };

                    }

                    if ( object ) {
                        sceneView.kernel.createChild( "index-vwf", fileName, object );                
                    }

                } catch ( e ) {
                    // TODO: invalid JSON
                }

            }
        };
         
    };
    function mouseXPos(e) {
        return e.clientX - e.currentTarget.offsetLeft + window.scrollX;
    }

    function mouseYPos(e) {
        return e.clientY - e.currentTarget.offsetTop + window.scrollY;
    }

    function ThreeJSPick(sceneNode,cam,SCREEN_WIDTH,SCREEN_HEIGHT)
    {
        if(!this.lastEventData) return;
        
        if(!this.tempposarr)
        {
	        this.tempposarr = [0,0,0];
	    	this.tempdirarr = [0,0,0];
	    	this.firstpersonopts = {filter:function(o){return !(o.isAvatar === true)}};
    	}
        
        var threeCam = cam;//sceneNode.camera.threeJScameras[sceneNode.camera.ID];
        if(!this.ray) this.ray = new THREE.Ray();
        if(!this.projector) this.projector = new THREE.Projector();
        
      
        var x = ( this.lastEventData.eventData[0].screenPosition[0] / SCREEN_WIDTH ) * 2 - 1;
        var y = -( this.lastEventData.eventData[0].screenPosition[1] / SCREEN_HEIGHT ) * 2 + 1;
        
        if(!this.directionVector)
        	this.directionVector = new THREE.Vector3();
        this.directionVector.set(x, y, .5);
        
        
		var intersects;
		if(!sceneNode.threeScene.CPUPick || !_SceneManager)
		{
			this.projector.unprojectVector(directionVector, threeCam);
	        var pos = new THREE.Vector3();
			var pos2 = new THREE.Vector3();
			pos2.getPositionFromMatrix(threeCam.matrixWorld);
	        pos.copy(pos2);
	        this.directionVector.sub(pos);
	        this.directionVector.normalize();
	        
	        
	        this.ray.set(pos, directionVector);
			var caster = new THREE.Raycaster(pos,this.directionVector);

			intersects = caster.intersectObjects(sceneNode.threeScene.children, true);
			if (intersects.length) {
            // intersections are, by default, ordered by distance,
            // so we only care for the first one. The intersection
            // object holds the intersection point, the face that's
            // been "hit" by the ray, and the object to which that
            // face belongs. We only care for the object itself.
            var target = intersects[0].object;
            
            var ID = getPickObjectID.call(this,target);
            
			var found =  intersects[0];
			var priority = -1;
			var dist = 0;
			
			for(var i =0; i < intersects.length; i++)
			{
				if(intersects[i].object.visible == true)
				{
					if(intersects[i].object.PickPriority === undefined)
						intersects[i].object.PickPriority = 0;
					if(intersects[i].object.PickPriority > priority)
					{
						found = intersects[i];
						priority = intersects[i].object.PickPriority;
					}
				}
			}
			return found;
			
			
			}
    
		}else
		{
		
			this.tempposarr[0] = threeCam.matrixWorld.elements[12];
			this.tempposarr[1] = threeCam.matrixWorld.elements[13];
			this.tempposarr[2] = threeCam.matrixWorld.elements[14];

			this.tempdirarr[0] = this.directionVector.x;
			this.tempdirarr[1] = this.directionVector.y;
			this.tempdirarr[2] = this.directionVector.z;

			if(vwf.models[0].model.nodes['index-vwf'].cameramode == 'FirstPerson')
				intersects = _SceneManager.CPUPick(this.tempposarr,this.tempdirarr,this.firstpersonopts);
			else
				intersects = _SceneManager.CPUPick(this.tempposarr,this.tempdirarr);
			
				
			return intersects;
		}
    }
    function getPickObjectID(threeObject)
    {   
        
        if(threeObject.vwfID)
            return threeObject.vwfID;
        else if(threeObject.parent)
         return getPickObjectID(threeObject.parent);
        return null;    
    }
        function getKeyValue( keyCode ) {
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
                key.char = "7";
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
    }

});