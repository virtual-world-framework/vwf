this.enter = function() {

    // If this task has a parent task, get the scene node from the parent
    // Else, search for it via the scenePath
    var parentTaskArray = this.find( "parent::element(*,'http://vwf.example.com/lesson/task.vwf')" );
    if ( parentTaskArray.length ) {
        var parentTask = parentTaskArray[ 0 ];
        this.scene = parentTask.scene;
    }

    // If a camera pose has been specified for this task, move the camera to it
    if ( this.cameraPoseRef ) {
        var cameraPoseSearchResults = this.find( this.cameraPoseRef );
        if ( cameraPoseSearchResults && cameraPoseSearchResults.length ) {
            var newCameraPose = cameraPoseSearchResults[ 0 ];
            if ( newCameraPose.translation && newCameraPose.quaternion ) {
                if ( this.scene ) {
                    var camera = this.scene.camera;
                    if ( camera ) {
                        var duration = 2;
                        camera.worldTransformTo( newCameraPose.worldTransform, duration);
                        this.in(duration).cameraTransformComplete();
                    } else {
                        console.error( "Could not find camera - to move the 3D camera using cameraPose, make sure the " +
                                                     "scene derives from navScene.vwf or another component that defines a valid camera" );
                    }
                } else {
                    console.error( "Scene property is not set - must be set for task to find camera to move" );
                }
            } else {
                console.error( "Camera pose '" + this.cameraPoseRef + "' is not a valid node3" );
            }
        } else {
            console.error( "Could not find camera pose: " + this.cameraPoseRef + " - will not move camera" );
        }
    }

    this.status = "entered";

    // Fire the entering event which runs lesson-specific code
    this.entering( this.text );

    // Activate subtasks if they exist
    this.taskIndex = null;
    if ( this.subtasks && this.subtasks.length ) {
        this.next();
    }

    //@ sourceURL=task.enter
}

this.next = function() {

    // If the first subtask has not been run yet (so taskIndex is null), initialize it
    // Else, exit the current subtask and increment taskIndex
    if ( this.taskIndex == null )
        this.taskIndex = 0;
    else {
        var oldSubtask = this.subtasks[ this.taskIndex ];
        oldSubtask.completed = oldSubtask.events.flush( this );
        oldSubtask.exit();
        this.taskIndex++;
    }

    // If there are subtasks still to run, enter the next one
    // Else, mark this task as complete
    if ( this.taskIndex < this.subtasks.length ) {
        var newSubtask = this.subtasks[ this.taskIndex ];
        newSubtask.enter();
        newSubtask.completed = newSubtask.events.add( function() { this.in(0).next(); }, this );
    }
    else
        this.completed();

    //@ sourceURL=task.next
} 

this.exit = function() {

    // TODO: Find the scene node properly to make this possible
    // this.scene.events.flush( this );

    // Fire the exiting event
    this.exiting();

    this.status = "inactive";
}

this.completed = function() {
    this.status = "completed";
}