# Add Training Instruction

--------------

One purpose of using VWF is to create a lesson application, with the intent of teaching a user how to accomplish a series of tasks, or steps in a process. 

We'll start with the simplest form of a lesson - one with a single correct path. This means there is only one sequence of steps in the lesson, and no choice of which step to take next.

--------------

### The Task Component

At every step, the lesson will issue a task to the student. The sequence of tasks will form the building blocks of the lesson. The [task component](application.html) serves as the prototype for lesson tasks, and may be used for each required lesson step. 

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

We can use the events defined above to add steps to the event handlers for each task. For instance, the entering event is in most cases the best place to define the success event, or the step required to complete the task (i.e. fire the *completed* event), as stated in the text property.

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

Subtasks of the lesson can then be defined as children of the lesson component. Here the *text* and *cameraPosRef* are set, and the entering event is used to define the success event - where clicking on the application object flushes the click event and calls the completed event for the step. 

        children:
          step1:
            extends: http://vwf.example.com/lesson/task.vwf
            properties:
              text: First, do the first task.
              cameraPoseRef: /cameraPose1
            scripts:
            - |
              this.entering = function() {
                this.logger.info( "Step 1 entering" );
                var self = this;
                var appObject = this.find( "/applicationObject" )[ 0 ];
                appObject.pointerClick = appObject.events.add( function() {
                  appObject.pointerClick = appObject.events.flush( this );
                  this.logger.info( "Step 1 completed" );
                  self.completed();
                }, this );
              } //@ sourceURL=step1.entering
              this.exiting = function() {
                this.logger.info( "Step 1 exiting" );
              } //@ sourceURL=step1.exiting

The overall lesson entering script can also be defined, as needed.

        scripts:
        - |
          this.entering = function() {
            this.logger.info( "Lesson entering" );
          } //@ sourceURL=lesson.entering
          this.exiting = function() {
            this.logger.info( "Lesson exiting" );
          } //@ sourceURL=lesson.exiting

Additionally, the cameraPoses referenced in the task properties each need to be defined. These represent the transform to which the camera will move at the beginning of the task. 

      cameraPose1:
        extends: http://vwf.example.com/node3.vwf
        properties:
          translation: [ 0, 0, 0 ]
          rotation: [ 1, 0, 0, 0 ]

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

	  $("#accordion").accordion({ active: false, collapsible: true });
	}

Next, add a *div* for the navigation buttons: *Start*, *Next*, and *Complete*.

	<div id="navigation">
	  <ul>
	    <li id='message'><label class="buttonLabel">Lesson Complete!</label></li>
	    <li id='startButton'>
	      <button type="button" class="btn btn-info" onclick="startLesson()">
	        <label class="buttonLabel">Start</label>
	      </button>	
	    </li>
	    <li id='nextButton'>
	      <button type="button" class="btn btn-info" onclick="nextTask()">
	        <label class="buttonLabel">Next</label>
	      </button>	
	    </li>
	    <li id='completeButton'>
	      <button type="button" class="btn btn-info" onclick="completeLesson()">
	        <label class="buttonLabel">Complete</label>
	      </button>
	    </li>
	  </ul>
	</div>

Then, add the functions to call the related vwf method.

	function startLesson()
	{
	  vwf_view.kernel.callMethod(vwf.find('','/lesson')[0], 'enter', []);
	}

	function nextTask()
	{
	  vwf_view.kernel.callMethod(vwf.find('','/lesson')[0], 'next', []);
	}

	function completeLesson()
	{
	  vwf_view.kernel.callMethod(vwf.find('','/lesson')[0], 'exit', []);
	}

The final piece of the user interface is a progress bar to show progress through the lesson. Add another *div* to the instruction panel.

	<div id="progress">
	  <div class="progress progress-striped active">
	    <div class="bar" id="lessonProgressBar"></div>
	  </div>
	</div>

Then, add a function to update the progress bar as each task is completed.

	var progressWidth = 10;
	function increaseProgressBar() {
	  var numTasks = vwf.find("task", "/lesson/*").length;
	  var widthDelta = Math.ceil(100 / numTasks);
	  var pixelWidth = $('#progress').css('width');

	  pixelWidth = pixelWidth.substring(0, pixelWidth.length-2);

	  progressWidth = progressWidth + (pixelWidth*widthDelta*0.01);
	  $('#lessonProgressBar').css('width', progressWidth+'px');
	}

Finally we'll need to set up the VWF fired event listeners in order to kickoff the lesson and open the first instruction, update the instruction list based on the current step, and update the progress bar as the student progresses through the lesson.

	vwf_view.firedEvent = function (nodeId, eventName, eventParameters) {
	  if(nodeId == vwf.find('', '/lesson')[0])
	  {
	    switch (eventName) {
	      case "entering":
	        $('#lessonProgressBar').css('display', 'block');
	        $('#lessonProgressBar').css('width', '10px');
	        $('#message').css('display', 'none');
	        $('#startButton').css('display', 'none');
	        $('#nextButton').css('display', 'inline-block');
	        $('#'+vwf_view.kernel.name( vwf.find('task', '/lesson/*')[0] )).trigger('click');
	        break;
	      case "completed":
	        $('#lessonProgressBar').css('width', '100%');
	        $('#nextButton').css('display', 'none');
	        $('#completeButton').css('display', 'inline-block');
	        $("#accordion").accordion("activate", false);
	        break;
	      case "exiting":
	        $('#lessonProgressBar').css('display', 'none');
	        $('#completeButton').css('display', 'none');
	        $('#message').css('display', 'inline-block');
	        $('#startButton').css('display', 'inline-block');
	    }
	  }
	  else
	  {
	    switch (eventName) {
	      case "entering":
	        $('#'+vwf_view.kernel.name( nodeId )).trigger('click');
	        break;
	      case "completed":
	        increaseProgressBar();
	        break;
	    }
	  }
	}

Each step's *entering* event will trigger a click event on the appropriate step in the instruction panel. The text of that step will then be visible to the user. Each step's *completed* event will trigger an update the progress bar. Additionally, if the task is the overall lesson, navigation buttons may update and the UI initialized or closed.

Visit the [lesson application](../../../lesson) to view the final result.

--------------

<!-- **Note: need to update build to include subfolders** 
[task component](jsdoc_cmp/symbols/instruction.vwf.html) -->

<!-- Add screenshots -->