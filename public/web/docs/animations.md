Animations
===================
-------------------
There are two common ways to accomplish animation within the framework: the tick function and the future call. The most efficient and optimal way to control the animation is to use the future call. Animations are often created using the future call within behavior files, and then implemented on specific components in the applications. These behavior files can be used to define paths or sequences of motion to create animations. Please see [behaviors](behaviors.html) for more information. 

-------------------

**Tick Function**

The tick function should only be used for actions that *must* be run at every tick of the application clock. If too many actions are contained within the tick function, the application will show signs of lagging. 

	this.tick = function(time) {
	  doSomething(time);
	}

For most animations, actions only need to occur at a certain interval to create a smooth animation, and thus, the VWF future call should be used.

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

-------------------




