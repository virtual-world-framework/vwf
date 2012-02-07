System Reference
================

Kernel
------

*   createNode( nodeID, childComponent, childName, callback /* ( childID ) */  )

    Create a node from a component specification.

*   deleteNode( nodeID )

*   getNode( nodeID )

    Return an object describing the state of the node, its prototypes and its children.

*   setNode( nodeID, component )

    Restore a node, its prototypes and its children to a specific state.

*   prototype( nodeID )

    Return a node's prototype.

*   prototypes( nodeID )

    Return an array containing a node's entire prototype chain.

*   addChild( nodeID, childID, childName )

*   removeChild( nodeID, childID )

*   ancestors( nodeID )

*   parent( nodeID )

    Return a node's parent.

*   children( nodeID )

*   name( nodeID )

*   createProperty( nodeID, propertyName, propertyValue, propertyGet, propertySet )

    Create a property on a node and assign an initial value.

*   deleteProperty( nodeID, propertyName )

*   getProperty( nodeID, propertyName )

    Get a property value for a node.

*   setProperty( nodeID, propertyName, propertyValue )

    Set a property value on a node.

*   getProperties( nodeID )

    Get all of the properties for a node.

*   setProperties( nodeID, properties )

    Set all of the properties for a node.

*   createMethod( nodeID, methodName, methodParameters, methodBody )

*   deleteMethod( nodeID, methodName )

*   callMethod( nodeID, methodName, methodParameters )

*   createEvent( nodeID, eventName, eventParameters )

*   deleteEvent( nodeID, eventName )

*   fireEvent( nodeID, eventName, eventParameters )

*   dispatchEvent( nodeID, eventName, eventParameters, eventNodeParameters )

*   execute( nodeID, scriptText, scriptType )

*   time()

    Return the current simulation time.


Model Drivers
-------------

*   creatingNode( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName, callback /* ( ready ) */ )

*   deletingNode( nodeID )

*   prototyping( nodeID );

*   addingChild( nodeID, childID, childName )

*   removingChild( nodeID, childID )

*   parenting( nodeID )

*   childrening( nodeID )

*   naming( nodeID )

*   creatingProperty( nodeID, propertyName, propertyValue, propertyGet, propertySet )

*   deletingProperty( nodeID, propertyName )

*   gettingProperty( nodeID, propertyName, propertyValue )

*   settingProperty( nodeID, propertyName, propertyValue )

*   gettingProperties( nodeID, propertyValues )

*   settingProperties( nodeID, propertyValues )

*   creatingMethod( nodeID, methodName, methodParameters, methodBody )

*   deletingMethod( nodeID, methodName )

*   callingMethod( nodeID, methodName, methodParameters )

*   creatingEvent( nodeID, eventName, eventParameters )

*   deletingEvent( nodeID, eventName )

*   firingEvent( nodeID, eventName, eventParameters )

*   executing( nodeID, scriptText, scriptType )

*   ticking()


View Drivers
------------

*   createdNode( nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName, callback /* ( ready ) */ )

*   deletedNode( nodeID )

*   addedChild( nodeID, childID, childName )

*   removedChild( nodeID, childID )

*   createdProperty( nodeID, propertyName, propertyValue, propertyGet, propertySet )

*   deletingProperty( nodeID, propertyName )

*   gotProperty( nodeID, propertyName, propertyValue )

*   satProperty( nodeID, propertyName, propertyValue )

*   gotProperties( nodeID, propertyValues )

*   satProperties( nodeID, propertyValue )

*   createdMethod( nodeID, methodName, methodParameters, methodBody )

*   deletedMethod( nodeID, methodName )

*   calledMethod( nodeID, methodName, methodParameters )

*   createdEvent( nodeID, eventName, eventParameters )

*   deletingEvent( nodeID, eventName )

*   firedEvent( nodeID, eventName, eventParameters )

*   executed( nodeID, scriptText, scriptType )

*   ticking()
