# How to create a multi-user application

## (This is a work in progress)

All that is needed for a VWF app to become a multi-user app is for a second person to navigate to the same url.  By default, both users share the same view of the virtual world.

Often, you will want your users to be different "characters" in the scene.  For this to happen, we need to create three things when a new user joins.

## What needs to be created

- A camera that the user's point of view will be rendered from -<br/>&nbsp;&nbsp;This will go in the model (.yaml) so other users can assume your viewpoint, if desirable
- A 3D model for the user's avatar (optional if you don't want other users to be able to see them) -<br/>&nbsp;&nbsp;This will also go in the model (.yaml) so everyone will see it
- A reference that tells the user that this camera and 3D model is "theirs" -<br/>&nbsp;&nbsp;This will go in the view (.html) so every user's can be different

## How to create the avatar

You will need a method in your model (index.vwf.yaml) that we can call each time a user joins.  This one will do nicely:

>	var count = 0;
>	
>	this.createUser = function() {
>	
>	  // Ready the parameters to the call to create the child (3 steps)
>	  // Step 1: Set a unique user name
>	  var userName = "User" + count++;
>	
>	  // Step 2: Create the definition of an object that will groups a camera w/ an avatar 3D model
>	  var userDef = { 
>	    "extends": "http://vwf.example.com/node3.vwf",       
>	  };
>	  var cameraDef = {
>	    "extends": "http://vwf.example.com/camera.vwf", 
>	  }
>	  var avatarDef = {
>	    "extends": "http://vwf.example.com/node3.vwf",
>	    "source": "BlueCube.dae",
>	    "type": "model/vnd.collada+xml"
>	  }
>	  userDef.children[ "camera" ] = cameraDef;
>	  userDef.children[ "avatar" ] = avatarDef;
>	
>	  // Step 3: Create a callback function that will be called when the user object has been created
>	  var callbackWhenUserIsCreated = function( child ) { //Whatever you want here };
>	
>	  // Create the user object
>	  this.children.create( userName, userDef, callbackWhenUserIsCreated );
>	}

## When to create them

The new user's view needs to tell the model when to create the new user object (once the user has joined).  This means that the view must *know* when the user has joined.  In future versions of VWF, when the new user has joined, the kernel will call a callback function in the view.  For now, we can learn when the user has joined by showing him a login screen.  By the time the user can click the *Login* button, he has already joined the session.  Therefore, we can call the necessary functions in the model when the user clicks the *Login* button.  (This method has the added benefit of being able to grab a name, etc, by which you can identify the new user - note, though, that this is not a secure login ... the app has already loaded by the time you ask the user to log in ... info on secure logins is in progress).

So, the next step is to add the Login screen to your app.  Here is one that you can add directly, if you would like: (link here - then remove what is below) - show html, css

### A sample login screen

In your index.vwf.html file you could have a login dialog like so:

>	<div id="loginDialog">
>	  <div>
>	    <h3>Login</h3>
>	  </div>
>	  <div>
>	    <table>
>	      <tr>
>	        <td>
>	          <input type="text" id="userName" class="input-large" placeholder="Your Name" maxlength="15">
>	        </td>
>	        <td>
>	          <button id="loginButton"><i class="icon-user icon-white"/>  Sign in</button>
>	        </td>
>	      </tr>
>	    </table>
>	  </div>
>	  <div id="loadFooter">
>	  </div>
>	</div>

And then connect a script to the login button that will call your createUser function (also in index.vwf.html):

> 	$( "loginElementName" ).click( function( e ) {
>	  var userName = $( "#userName" ).val();
>	  if !( ( userName == "Your Name" ) || ( userName == "" ) ) {
>	    userName = userName.replace(/ /g,"_");
>	    userName = userName.replace(/([^0-9A-Za-z])/g,"");
>	    $( "#main" ).show();
>	    $( "#loginDialog" ).modal( "hide" );	
>	    vwf_view.kernel.callMethod( "index-vwf", "createUser", [ userName /*any parameters you want*/ ] );
>	  }
>	});

(Pick up here!)

- Get a return from this to save the reference to the user

## How to have your user control just his character

- Use reference to set properties and call methods on your particular user object, using vwf_view.kernel

## Pitfalls

Don't use this.moniker anywhere in the model.  Because this.moniker is unique per user, if it appears in the model, it can cause each user's model state to diverge - bad!
