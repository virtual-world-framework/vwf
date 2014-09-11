    var geometry, loader = new THREE.ColladaLoader(), scene, loopStart, skin = [], camera;
    
	//Scoping
	var init = function(){
		
		var renderer, t = 0, lastFrame = 34, totalFrames = 27, startFrame = 7, clock = new THREE.Clock();
		loopStart = loop;
		init();
		
		function init() {
			
			camera = new THREE.PerspectiveCamera( 25, 1, 1, 10000 );
			camera.position.set(4.5, 0, .9);
			camera.up.set( 0, 0, 1 );

			scene = new THREE.Scene();
			scene.add( new THREE.AmbientLight( 0xcccccc ) );

			renderer = new THREE.WebGLRenderer({ antialias: true, clearColor: 0xFFFFFF });
			renderer.setSize( 400, 400 );
			renderer.setClearColor(0xFFFFFF, 1);

		   $("#previewRender").html( renderer.domElement );
			//loader.load( "./avatars/VWS_Business_Male1.DAE", createScene );
		}
		
		function loop() {
			
			geometry.scene.rotation.z += .01;
			requestAnimationFrame( loop, renderer.domElement );
			var delta = clock.getDelta();
			
			
			if ( t > 1.2 ) t = 0;
			var currentFrame = startFrame + Math.floor(t*totalFrames/1.2);
			
			for(var i = 0; i < skin.length; i++){
				if ( skin[i] && skin[i].animationHandle)
				{
					skin[i].animationHandle.setKey(currentFrame);
				}
			}
			
			t += delta;
			lastFrame = currentFrame;
			THREE.AnimationHandler.update( delta );
			renderer.render( scene, camera );
		}
	};

