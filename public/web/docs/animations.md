<a name="animations" />

<div class="well" markdown="1">
Animations
===================
-------------------

**Animation Behavior**

The primary way to accomplish animations in VWF is the animation behavior. All components that extend node3 automatically implement the animation behavior, which provides standardized methods and properties for creating and executing an animation. 

In order to create an animation on a node, the <code>animationUpdate</code> method needs to be implemented. This method is called each time the animation time changes, and is used to update the node to the correct state for that time.

	scripts:
	- |
	  this.animationUpdate = function(time, duration) {
	    // Animate the node. For example, update the translation based on the time
	    this.translateBy([0, 0, 1 * time], 0);
	  }

The animation can then be started by calling the <code>animationPlay</code> method and stopped by calling <code>animationStop</code>.

Common properties used to customize the animation include:

* animationDuration - The length of the animation
* animationRate - The animation playback rate
* animationLoop - Whether or not the animation should replay after reaching the end

A full list of methods and properties can be found under [animation](jsdoc_cmp/symbols/animation.vwf.html) in the [Application API](application.html).

-------------------

**Collada Animations**

Animations defined in the collada document will also be loaded and available to the framework. They are controlled the same way as animations created in a component, except there is no need to implement an <code>animationUpdate</code> method, since the animation information is pulled from the collada file.

Common properties used to customize collada animations include:

* animationStartTime - The time the animation should start at. Used to play a subsection of the animation.
* animationStopTime - The time the animation should stop at. Used to play a subsection of the animation.
* animationStartFrame - Equivalent to animationStartTime, but in frames, instead of seconds.
* animationStopFrame - Equivalent to animationStopTime, but in frames, instead of seconds.
* fps - The frames per second the animation should play at.

-------------------

**Future Call**

Animations can also be created using the future call. The VWF future call can be used to run a method at a specified time in the future. This call can be inserted into the method call chain, and a parameter passed with an amount of time from the current point for when the method should be called. An example of the future call is shown below. 

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

</div>
-------------------
