# Add Training Instruction

--------------

One purpose of using VWF is to create a lesson application, with the intent of teaching a user how to accomplish a series of tasks, or steps in a process. We'll start with the simplest form of a lesson - one with a single correct path. This means there is only one sequence of steps in the lesson, and no choice of which step to take next.

--------------

### The Task Component

At every step, the lesson will issue a task to the student. The sequence of tasks will form the building blocks of the lesson. The [task component](application.html) serves as the prototype for lesson tasks, and may be use for each required lesson step. 

The task component contains the following properties that can be set in the lesson model file:

* **text**: Text to display to the user to explain the task
* **cameraPoseRef**: Search string used to find a node3 that represents the transform to which the camera will move at the beginning of this task
* **scenePath**: xpath reference to the top node of the scene to which the lesson listens for task completion events
* **taskIndex**: Index of the currently active subtask

In the following example, we'll focus on the *text* and *cameraPoseRef* properties. The remaining properties can be used for more complex lessons that are more than one level deep. 

The task component also consists of the following methods and events:

Methods:

* **enter**
* **next**
* **exit**

Events:

* **entering**
* **completed**
* **exiting**

We can use the events defined above to add steps to the event handlers for each task. For instance, the entering event is in most cases the best place to increment the taskIndex and define the success event, or the step required to complete the task, as stated in the text property.

	this.entering = function() {
	  var self = this;
	  appObject.pointerClick = appObject.events.add( function() {
	    appObject.pointerClick = appObject.events.flush( this );
	    this.completed();
	  }, this );
	}

--------------

### Setting Up Lesson Structure in the Model

One can turn a VWF application into an instructional lesson by adding a task hierarchy to the model, using the task component type, described above.

First we'll need to add an overall lesson task as a child of the application. 

	--- 
	extends: http://vwf.example.com/navscene.vwf
	children:
	  lesson:
        extends: http://vwf.example.com/lesson/task.vwf
        properties:
          scenePath: /

Subtasks of the lesson, can then be defined as children of the lesson component. Here the entering event is used to define the success event - where clicking on the application object, flushes the click event and calls the completed event for the step. 

        children:
          step1:
            extends: http://vwf.example.com/lesson/task.vwf
            properties:
              text: First, do the first task.
              cameraPoseRef: /cameraPose1
            scripts:
            - |
              this.entering = function() {
                console.info( "Step 1 entering" );
                var self = this;
                var appObject = this.find( "/applicationObject" )[ 0 ];
                appObject.pointerClick = appObject.events.add( function() {
                  appObject.pointerClick = appObject.events.flush( this );
                  console.info( "Step 1 completed" );
                  self.completed();
                }, this );
              } //@ sourceURL=step1.entering
              this.exiting = function() {
                console.info( "Step 1 exiting" );
              } //@ sourceURL=step1.exiting

The overall lesson entering script can also be defined, as needed.

        scripts:
        - |
          this.entering = function() {
            console.info( "Lesson entering" );
          } //@ sourceURL=lesson.entering
          this.exiting = function() {
            console.info( "Lesson exiting" );
          } //@ sourceURL=lesson.exiting

Additionally, the cameraPoses referenced in the task properties each need to be defined. These represent the transform that the camera will move to at the beginning of the task. 

      cameraPose1:
        extends: http://vwf.example.com/node3.vwf
        properties:
          translation: [ 0, 0, 0 ]
          rotation: [ 1, 0, 0, 0 ]

Finally, we'll need to define the initialize script to kickoff the lesson by calling the enter method. 

    scripts:
    - |
      this.initialize = function() {
        var self = this;
        this.lesson.enter();
        this.lesson.completed = function() {
          console.info( "Lesson completed");
          self.lesson.exit();
        }
      } //@ sourceURL=index.vwf

Thus the complete lesson hierarchy is defined in the VWF model, including all lesson tasks, their cameraPoses, and their entering and exit methods. 

--------------

### Add Lesson Interface to the View

The user interface for the lesson will mainly be defined in the application's view. The primary interface for a lesson will consist of the instructional text for each lesson step.

First, add an accordian *div* to the HTML body.

	<body>
	  <div id="instructionPanel">
	    <div id="accordion">
	    </div>
	  </div>
	</body>

This will be populated and scripted on load.

In this example, the array *lessonSteps* will contain a list of instructional text for each step defined. On load, each *text* property value will be gathered and stored in the view, and the UI updated with the new instructions. 

	var lessonSteps = new Array();

	$(document).ready(function() {  
	  var vwfTasks = vwf.find("task", "/lesson/*");
	  for(var i=0; i<vwfTasks.length;i++)
	  {
	    vwf.getProperty(vwfTasks[i], "text");
	  }
	  updateLessonInstructions();
	});

	vwf_view.gotProperty = function (nodeId, propertyName, propertyValue) {
	  switch (propertyName) {
	    case "text": 
	      lessonSteps[vwf_view.kernel.name( nodeId )] = propertyValue;
	      break;
	  }
	}

The *updateLessonInstructions* function defined below will take the values stored in the *lessonSteps* array, and fill in appropriate values in the accordian *div* created above, and call the *jQuery accordion* method to activate the lesson panel. 

	function updateLessonInstructions() {
	  $('#accordion').html('');

	  for(var step in lessonSteps)
	  {
	    $('#accordion').append("<h2><a id='" + step + "' href='#'>" + step + "</a></h2>");
	    $('#accordion').append("<div><p>" + lessonSteps[step] + "</p></div>");
	  }

	  $("#accordion").accordion();
	}

Additionally, the UI will need to update the instruction list based on the current step as the student progress through the lesson. Here, this is accomplished through the *firedEvent* listener. Each step's *entering* event will trigger a click event on the appropriate step in the instruction panel. The text of that step will then be visible to the user. 

	vwf_view.firedEvent = function (nodeId, eventName, eventParameters) {
	  switch (eventName) {
	    case "entering":
	      $('#'+vwf_view.kernel.name( nodeId )).trigger('click');
	      break;
	    }
	}

--------------

<!-- **Note: need to update build to include subfolders** 
[task component](jsdoc_cmp/symbols/instruction.vwf.html) -->

<!-- Add screenshots -->