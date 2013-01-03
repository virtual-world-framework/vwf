# Allowing users to control different "characters" in the scene

# (This is a work in progress)

All that is needed for a VWF app to become a multi-user app is for a second person to navigate to the same url.  However, by default, both users share the same view of the virtual world.  Often, you will want your users to be different "characters" in the scene.  For this to happen, we need to create three things when a new user joins:

- A camera that the user's point of view will be rendered from
- A 3D model for the user's avatar (optional if you don't want other users to be able to see them)
- A reference that tells the user that this camera and 3D model is "theirs"

## Where should they go?

Model (these objects will be created for all users) - .yaml:

- Camera (having this in the model will give you the ability to allow other users to assume your viewpoint, if desirable)
- 3D Model

View (will be different for every user) - .html:

- Reference to user's camera and 3D model

## How to create them

You will need a method like this one in your model (index.vwf.yaml):

> this.createAvatar = function() {
>     this.children.create( name, participantDef, function( child ) {} );
> }

## When to create them

The new user's view needs to tell the model when to create the new user object (once the user has joined).  This means that the view must *know* when the user has joined.  In future versions of VWF, when the new user has joined, the kernel will call a callback function in the view.  For now, we can learn when the user has joined by showing him a login screen.  By the time the user can click the *Login* button, he has already joined the session.  Therefore, we can call the necessary functions in the model when the user clicks the *Login* button.  (This method has the added benefit of being able to grab a name, etc, by which you can identify the new user - note, though, that this is not a secure login ... the app has already loaded by the time you ask the user to log in ... info on secure logins is in progress).

So, the first step is to add the Login screen to your app.  Here is one that you can add directly, if you would like: (link here - then remove what is below) - show html, css

### A sample login screen

In your index.vwf.html file you could have a login dialog like so:

>	<div id="loginDialog">
>		<div>
>			<h3>Login</h3>
>		</div>
>		<div>
>			<table>
>				<tr>
>					<td>
>						<input type="text" id="userName" class="input-large" placeholder="Your Name" maxlength="15">
>					</td>
>					<td>
>						<button id="loginButton"><i class="icon-user icon-white"/>  Sign in</button>
>					</td>
>				</tr>
>			</table>
>		</div>
>		<div class="modal-footer" id="loadFooter">
>		</div>
>	</div>

And then also in index.vwf.html:

> 	$( "loginElementName" ).click(function(e) {
>		if (($('#userName').attr("value") == "Your Name") || ($('#userName').attr("value") == "")){
>			$( "#loadFooter" ).html('<div class="alert alert-error">You must enter a name!</div>');
>		}
>		else {
>			clientName = $('#userName').val().replace(/ /g,"_");
>			clientName = $('#userName').val().replace(/([^0-9A-Za-z])/g,"");
>			$( "#main" ).show();
>			$( "#loginDialog" ).modal('hide');	
>			vwf_view.kernel.callMethod( "index-vwf", "clientJoined", [ vwf_view.kernel.moniker(), clientName ] );
>		}
>	});

- Talk about a login screen
- When user logs in, call a method in the model to create a new user component (camera and avatar)
- Get a return from this to save the reference to the user

## How to have your user control just his character

- Use reference to set properties and call methods on your particular user object, using vwf_view.kernel

## Pitfalls

Don't use this.moniker anywhere in the model.  Because this.moniker is unique per user, if it appears in the model, it can cause each user's model state to diverge - bad!
