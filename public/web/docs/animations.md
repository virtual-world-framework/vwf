Animations
===================
-------------------
The primary way to accomplish animations in VWF is the future call. Animations are often created using the future call within behavior files, and then implemented on specific components in the applications. These behavior files can be used to define paths or sequences of motion to create animations. Please see [behaviors](behaviors.html) for more information. Animations defined in the collada document will also be loaded and available to the framework.

-------------------

**Future Call**

The VWF future call can be used to run a method at a specified time in the future. This call can be inserted into the method call chain, and a parameter passed with an amount of time from the current point for when the method should be called. An example of the future call is shown below. 

	methods:
	  methodName: |
	    if( criteriaMet )
	    {
	      doSomething();
	      this.future( 0.05 ).methodName();
        }

The future call schedules the next step. The parameter passed to the function call can be raised or lowered to smooth or optimize the animation, respectively.

Future calls may also be used for property assignment or to fire an event at a given time in the future. 

	this.future.eventName();
	this.future.propertyName = value;

<!-- Coming soon! Relative vs. Absolute future calls: this.in() and this.at() -->

-------------------

**Animation Flags**

If an object already has an animation defined, the animation flags on the node3 prototype can be set to specify animation properties. 

*Playing* - A value of true will set the animation to play, where a value of false will stop the animation. 

*Looping* - Determines whether the animation will play a single time or loop.

*Speed* - Determines how fast the animation is played. Negative speeds will reverse the animation. 

<!-- Coming soon! Avatar animations, blended animations, animated transformations -->

-------------------





