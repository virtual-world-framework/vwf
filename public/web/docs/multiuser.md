<a name="multiuser" />

<div class="well" markdown="1">
Create a Multi-user Application
===================
-------------------

<sup>(Note: This recipe is based on the [multiuser example app](../example/multiuser) - check it out for greater context.  You can find the source for the app in the [github repository](https://github.com/virtual-world-framework/vwf) in public/web/example/multiuser.)</sup>

All that is needed for a VWF app to become a multi-user app is for a second person to navigate to the same url.  By default, both users share the same view of the virtual world.

Often, you will want your users to be different "characters" in the scene.  For this to happen, we need to set the scene's *usersShareView* property to false:

	extends: http://vwf.example.com/scene.vwf
	properties:
	  usersShareView: false

By default, the system will create a camera for each user who joins the application so users can move independently through the scene.  Often you will want some represention of each user (an avatar) in your application so users can see each other.  To specify the object that we want the system to create for each user, we need to set the scene's *userObject* property to a description of the desired object.  This userObject must play by two rules:

- It must implement the *navigable* behavior to be recognized as something the user can control.
- It must contain a camera so the user can see.

Here is an example of a user object that is a duck with a camera attached:

	  userObject:
	    extends: http://vwf.example.com/node3.vwf
	    implements: [ "http://vwf.example.com/navigable.vwf" ]
	    properties:
	      translationSpeed: 10000
	    children:     
	      camera:
	        extends: http://vwf.example.com/camera.vwf
	        properties:
	          translation: [ 0, 0, 800 ]
	          far: 1000000
	          near: 1
	      avatar:
	        extends: http://vwf.example.com/node3.vwf
	        source: models/duck.dae
	        type: model/vnd.collada+xml
	        properties:
	          rotation: [ 0, 0, 1, 90 ]
	          scale: 4.5

That's all!

## Notes

- Currently these instructions work with only the three.js renderer (since the functionality is implemented in the VWF drivers for three.js).
- Though the userObject property looks like a node description, it is only a property (later, the system will create a node for the user from this property). Therefore, one cannot manipulate userObject by calling methods for node operations (for example, we cannot call *userObject.createChild(..)*).  Once the system creates the actual node, we may call such functions on that node.

## Common Pitfalls

- Do not use *this.moniker* in the model (.yaml)!

*this.moniker* contains an id that is unique for every user in the application.  It might be tempting to make users behave differently by creating conditionals around this variable.  However, doing so breaks VWF's replicated computation since each user's model then diverges from the others.  All user-specific actions need to be on the view side.

- Do not access the *vwf* variable anywhere

*vwf* gives a coder direct access to manipulate the model.  This may seem convenient, but it side-steps VWF's mechanisms to ensure that state stays synchronized between users.  In the future this variable will be hidden from us coders for our safety, but in the mean time, steer clear of it!

- For a full list of pitfalls, see the document located [here](pitfalls.html).

</div>
-------------------
