# Add Training Instruction

For this recipe, let's assume that you want to teach a person how to perform a task that is composed of a number of steps.  To keep things simple, we will assume that there is a single correct path the person should take (the one thing that they should do next is always clear).

## The Instruction Component

At every step, we will issue an instruction to the student.  We can treat the instructions as the building block from which we will build the lesson.  To aid us, there is an [instruction component](jsdoc_cmp/symbols/instruction.vwf.html).  You can create one of these for each step of the task.  For each instruction you will set the following properties:

- instructionText: The text displayed to the user, explaining what the step is and why it is important (if undefined, will not be shown)
- actionText: The text displayed to the user, explaining what he needs to do to progress to the next step (if undefined, will not be shown - not recommended)
- cameraPoseRef: The search string used to find a node3 that represents the transform that the camera will move to at the beginning of this instruction (if undefined, camera will not move)

Also, in the event handler for the *entry* event, we will set up the success event (how the system know when the user has successfully completed the action specified in the actionText).  We will want to clean this up on the *exit* event:

	this.entered = function() {
		(some object).(some event) = this.completeInstruction();
	}

	this.exited = function() {
		(some object).(some event) = undefined;
	}

## The Lesson Component

Instructions are nice, but we need an overarching parent that ties all of them together and manages the orderly movement from one to the next.  Let me introduce the [lesson component](jsdoc_cmp/symbols/lesson.vwf.html).

- Array of steps