<a name="sound" />

<div class="well" markdown="1">
Add Sound Effects to Your Application
==============
--------------

For any interactive application, you may want to add sound, either for effect or to notify all users that something has occurred (e.g. a laser was fired, a message has been sent, etc). As with much of the framework, we can accomplish simple sound effects through the use of HTML5's native features. 

A method or event within the application's model may be used to play a synchronized sound effect by setting up a VWF listener in the HTML view that will play the sound whenever a specific method is called or an event is fired.

--------------

### Define the Sound Source

HTML5 allows one to specify sound through the use of the *audio* tag. The audio tag simply contains a source which specifies the file location of a sound effect. This audio tag will need to be added to the application's HTML. 

	<audio id='exampleAudio'>
	  <source src="sounds/example.wav"></source>
	</audio>

--------------

### Additions to the Model

Within the model, define a method or event. This method can either be completely separate, used solely to play a sound, or attached to another method or event, so that a sound is played in conjunction with another action. 

	methods:
	  playSound:

--------------

### Additions to the View

In addition to defining the sound source using the HTML5 native audio tag, set up a listener for the method call. 

	vwf_view.calledMethod = function (nodeId, methodName, methodParameters) {
	  if (nodeId == sceneNode ) {
	    switch (methodName) {
	      case "playSound":
	        $('#exampleAudio')[0].play();
	        break;
	    }
	  }
	}

Each time the *playSound* method is called, each client will hear the *exampleAudio* sound bite.

</div>
--------------
