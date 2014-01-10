<a name="pitfalls" />

<div class="well" markdown="1">
Pitfalls
==============
--------------

When you begin programming with VWF, it can be easy to wander off the well-worn path that keeps your apps synchronized across users.  Here are a mix of best practices and the most common pitfalls to avoid:

## Ensure that you've got the picky .yaml formatting right

- Two spaces for an indentation.  No tabs!
- Put a line return at the end of the file

You will know if your .yaml format is incorrect because you will get a 500 (Server Internal) error in your page.

## Do not reference *this.moniker* in the [model](architecture.html)

*this.moniker* is a read-only property that contains an id that is unique for every user in the application.  It might be tempting to make users behave differently by creating conditionals around this variable.  However, doing so breaks VWF's replicated computation since each user's [model](architecture.html) then diverges from the others.  All user-specific actions need to be on the [view](architecture.html) side.  To see an example, read the [*Create a Multi-user Application*](multiuser.html) cookbook recipe.

## Do not access the *vwf* object anywhere

The *vwf* object gives a coder direct access to manipulate the [model](architecture.html) from the [view](architecture.html).  This may seem convenient, but it side-steps VWF's mechanisms to ensure that state stays synchronized between users.  In the future this variable will be hidden from us coders for our safety, but in the mean time, steer clear of it!  (though while it is available, it can be useful to investigate the properties of the vwf object from the browser console for debugging purposes).  To see an example of how to properly manipulate the model from the view, read the [*Create a 2D Interface*](2d-interface.html) cookbook recipe. 

## When setting a field on a [model](architecture.html) property, set the whole property

When changing a property, the property's setter must be called to trigger VWF's synchronization mechanism.  If one sets only a field of a property (for example, the *x* field on a vector property), the setter will not be called, and that change will not be replicated to other users.  Instead (using the vector example again), create a new vector that has the updated properties and assign the entire vector to the property (to call the property's setter).

In cases like above when a property (let's call it *containerProperty*) has properties of its own, it is often better to make containerProperty a child of the object it is on, rather than a property.  That way its sub-properties can automatically be synchronized when set.  Beware of doing this on components, though.  See [*Do not add children to components*](#childrenOfComponents) for more details.

## Avoid most uses of global local variables in the [model](architecture.html)

Only public properties get saved and loaded with the scene (including the implicit save/load that occurs when a new user joins an exisiting app).  Generally, if a piece of state is important enough to be stored in a global local variable, it’s important enough to get replicated to new users – so store it in a public property.  However, global local variables are sometimes useful – for example, pre-computing a value calculated from public properties so that it does not have to be recomputed every frame.  But make sure that such a variable contains no new state information or the application will not replicate to new users properly.

<a name="childrenOfComponents" />

## Do not add children to components

When accessing children of an object, the kernel does not delegate to the object's prototype.  In other words, children are not "inherited" from the prototype.  If you add children to a component specification and then create an object of that type, the new object will not have the children.

## Do not hard-code node ids

From the [view](architecture.html), you will reference nodes by using [*find()*](query.html) to get their nodeIDs and then using that nodeID in [kernel calls](jsdoc/2c8753578a.html) to get and set properties and call methods.  These nodeIDs are not guaranteed to be identical from one run of the application to the next.  Therefore, you must not hard-code them. For more information on accessing [model](architecture.html) nodes from the [view](architecture.html), read the [*Create a 2D Interface*](2d-interface.html) cookbook recipe.

<a name="noAccessHtmlFromModel" />

## Do not access the html document from the [model](architecture.html)

The [model](architecture.html) (.yaml) should not have any knowledge of the [view](architecture.html) (.html).  Therefore, the .yaml should not make any reference to the .html document.  Instead, the [model](architecture.html) can throw an event or set a property, etc, that the [view](architecture.html) can listen for to access or change the document appropriately.  For more information about listening for [model](architecture.html) events from the [view](architecture.html), read the [*Create a 2D Interface*](2d-interface.html) cookbook recipe. 

## Do not call [view](architecture.html) functions from [model](architecture.html)

As mentioned in [*Do not access the html document from the model*](#noAccessHtmlFromModel), the [model](architecture.html) should have no knowledge of the [view](architecture.html).  Therefore, the [model](architecture.html) should not call [view](architecture.html) functions.  Calling [view](architecture.html) functions is especially dangerous if one passes a [model](architecture.html) object to a [view](architecture.html) function - the [view](architecture.html) function can then change the object without going through the VWF kernel which ensures synchronization between users.  That change would only be reflected for the user who made the change locally.

## Be aware of asynchronicity

When programming in the [view](architecture.html), calls to get/set [model](architecture.html) properties and call [model](architecture.html) methods do not execute immediately (the are sent to the [reflector](architecture.html) and queued in proper time order).  Therefore, you must wait until the [model](architecture.html) throws the appropriate event to indicate that your operation is complete.  For more information on accessing the [model](architecture.html) from the [view](architecture.html), read the [*Create a 2D Interface*](2d-interface.html) cookbook recipe.

## Be careful assigning named functions to event handlers

If you assign something like:

	node1.event = node2.method;

VWF will try to call *method* from node1, not node2.  Instead, set the event handler like so:

	node1.event = function() {
	  node2.method();
	}

</div>
--------------
