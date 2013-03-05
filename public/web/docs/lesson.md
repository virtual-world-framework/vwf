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

In the following example, we'll focus on the *text* and *cameraPoseRef* properties. The remaining properties can be used for more complex lessons that are more than one level deep. In this example, they will be set only on the overall lesson task.

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
	  this.parent.taskIndex++;
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
          taskIndex: 0

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
                this.parent.taskIndex++;
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

In this example, the array *lessonSteps* will contain a list of instructional text for each step defined. As each *text* property value is created and initialized, it will be stored in the view, and the UI updated with the new instructions. 

	var lessonSteps = new Array();

	vwf_view.initializedProperty = function (nodeId, propertyName, propertyValue) {
	  switch (propertyName) {
	    case "text": 
	      lessonSteps[nodeId] = propertyValue;
	      updateLessonInstructions(); // JS function to update the HTML instruction list
	      break;
	  }
	}

Additionally, the UI will need to update based on the current *taskIndex* (defined in the overall lesson task). As the lesson progresses through each step, and this taskIndex updated, the *satProperty* listener for *taskIndex* will call the *updateLessonStep* function.

	vwf_view.satProperty = function (nodeId, propertyName, propertyValue) {
	  switch (propertyName) {
	    case "taskIndex":
	      updateLessonStep(propertyValue); // JS function to update which step is being shown in the HTML
	      break;
	  }
	}

--------------

<!-- **Note: need to update build to include subfolders** 
[task component](jsdoc_cmp/symbols/instruction.vwf.html) -->