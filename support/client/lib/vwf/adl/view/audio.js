/*
 * WebRTC.js : Behaves as a wrapper for vwf/view/rtcObject
 * Maps simple 1:1 signal model to a broadcast model using target and sender ids
 */

define( [ "module", "vwf/view", "vwf/adl/view/buzz/buzz.min"], function( module, view ) {

		
	
	//a simple structure to hold the BUZZ sound reference and position data
	function SoundSource()
	{
		this.id = null;
		this.sound = null;
		this.position = null;
		this.volume = 1;
		this.endrange = 100;
		this.startrange = 1;
		this.looping = false;
		this.playing = false;
		this.play = function()
		{

			
			if(!this.playing)
				this.sound.play();
			if(this.playing &&  this.sound.getPercent() == 100)
			{
				this.sound.stop();
				this.sound.play();
			}

			this.playing = true;


		}
		this.pause = function()
		{

			
			if(this.playing)
				this.sound.pause();
			
			this.playing = false;


		}
		this.stop = function()
		{

			
			if(this.playing)
				this.sound.stop();
			
			this.playing = false;


		}
		;
	}
	SoundSource.prototype.loop = function()
	{
		if(!this.looping)
		{
			this.looping = true;
			this.sound.loop();
		}
	}
	SoundSource.prototype.unloop = function()
	{
		if(this.looping)
		{
			this.looping = false;
			this.sound.unloop();
		}
	}
	//Get the position of your source object
	//note: the 3D driver must keep track of this
	SoundSource.prototype.updateSourcePosition = function()
	{
		
		this.position = vwf.getProperty(this.id,'worldPosition');
	}
	//use inverse falloff, adjust the range parameters of the falloff curve by the "volume"
	//since HTML cant actually play it louder, but we can make it 'carry' farther
	SoundSource.prototype.updateVolume = function(camerapos)
	{
		var x = Vec3.distance(camerapos,this.position);
		x = Math.max(0,x);
		var v = this.volume;
		
		var vol = ((-x+v)/v) * ((-x+v)/v);
		if(x > v) vol = 0;
		this.sound.setVolume(Math.max(Math.min(vol,1),0) * 100 );
	}
	//the driver
	return view.load( module, {

		initialize : function()
		{
			this.buzz = require("buzz");
			window._buzz = this.buzz;
			
			this.sounds = {};
			this.soundSources = {};
			//set this up as a global, so that we can play a click to indicate GUI actions
			window._SoundManager = this;
			
		},
		//simple function for gui elements to play sounds
		playSound:function(url,volume)
		{
			this.calledMethod('index-vwf','playSound',[url,false,volume]);
		},
		calledMethod : function(id,name,params)
		{
			//if the scene played the sound, it has no position and just plays at full volume
			if(name == 'playSound' && id == 'index-vwf')
			{
				
				var url = params[0];
				var loop = params[1] || false;
				
				//cache the sound - can only be played simultainously by different nodes
				if(this.sounds[url])
				{
					if(this.sounds[url].getPercent() == 100)
						this.sounds[url].stop();	
					this.sounds[url].play();
					if(loop)
					this.sounds[url].loop();
					else
					this.sounds[url].unloop();
				}
				else
				{
					var mySound = new this.buzz.sound(url,{
						autoplay: false,
						loop: false
					});
					this.sounds[url] = mySound;
					mySound.play();
				
				}
				
			} 
			//Nodes that are not the scene use their position to adjust the volume
			else if(name == 'playSound')
			{
				var url = params[0];
				var loop = params[1] || false;
				var vol =  params[2] || 1;
				var soundid = id+url;
				var Sound = this.soundSources[soundid];
				//cache the sound - can only be played simultainously by different nodes
				if(!Sound)
				{
					var Sound = this.soundSources[soundid] = new SoundSource()
					Sound.id = id;
					Sound.url = url;
					
					Sound.volume = vol;
					Sound.sound = new this.buzz.sound(url,{
							autoplay: true,
							loop: loop
							
					});
					Sound.looping = loop;
					Sound.position = [0,0,0];
					window._dSound = Sound;
				}else
				{
					if(Sound.sound.getPercent() == 100)
						Sound.stop();
					Sound.sound.setPercent(0);
					Sound.play();
					if(loop)
					Sound.loop();
					else
					Sound.unloop();
					Sound.volume = vol;
				}
			}
			//pause the sound
			if(name == 'pauseSound')
			{
				var url = params[0];
				var soundid = id+url;
				var Sound = this.soundSources[soundid];
				if(Sound)
				Sound.pause();
			}
			//stop the sound
			if(name == 'stopSound')
			{
				var url = params[0];
				var soundid = id+url;
				var Sound = this.soundSources[soundid];
				if(Sound)
				Sound.stop();
			}
			//delete the sound completely - only use this if you sure the sound will not play again anytime soon.
			if(name == 'deleteSound')
			{
				var url = params[0];
				var soundid = id+url;
				var Sound = this.soundSources[soundid];
				if(Sound)
				{
					Sound.stop();
					Sound.sound = null;
				}
				delete this.soundSources[soundid];
			}
		},
		//Update the sound volume based on the position of the camera and the position of the object
		ticked : function()
		{
			try{
			var campos = [_dView.getCamera().matrixWorld.elements[12],_dView.getCamera().matrixWorld.elements[13],_dView.getCamera().matrixWorld.elements[14]];
			for(var i in this.soundSources)
			{
				this.soundSources[i].updateSourcePosition();
				this.soundSources[i].updateVolume(campos);
			}
			}catch(e)
			{
			
			}
		
		},
		deletedNode: function(id)
		{
			for(var i in this.soundSources)
			{
				if(this.soundSources[i].id == id)
					delete this.soundSources[i];
			
			}
		}
	})
});
