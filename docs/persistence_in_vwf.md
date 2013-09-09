# Persistence in VWF

## Terms

- **Application** - Any component file, described in YAML or JSON, intended to 
  be run as a complete application.
- **Instance** - An occurrence of an *application* with a distinct *state* for
  clients to interact with.
    - **Running Instance** - An *instance* with active clients connected to it.
    - **Instance ID** - The unique identifier for an *instance* of an 
      *application*. Currently represented by a random 16-digit sequence of 
      letters and numbers.
- **State** - The values for all internal properties of an *instance* of an 
  *application*.
- **Save state** - The persisted *state* of an *instance* of an *application* 
  at some given point in time.
- **Client** - Any actor that interacts with the *state* of an *instance* of 
  an *application*, whether to read or write it.

## Objective

We're using the term persistence in VWF to describe two different capabilities:

- **Instance persistence** - Persist an instance of an application so that
  the instance is able to be accessed later with the same instance ID and
  state.

  For example, a client connects to an application instance `instance-x`, at
  point `A` and then disconnects at point `B`. At that point, the instance
  has no connected clients. A client then reconnects to the same instance at
  point `C`. The state should be maintained for `instance-x` and be available
  to the client.

```
instance-x  o---A---o---B...C---o---...
```

- **Save Instance State** - Save the state of any given instance of an
  application so that it's available later.

  For example, the application instance `instance-x` has it's state saved at
  point `A`, and later new instance `instance-y` is created with the save
  state `A` of `application-x`. 

```
instance-x  o---A---o…
                |
instance-y      o---o---o...
```

### Relationship Between State Persistence and Instance Persistence

As it turns out, once we add the *state persistence* capability, we can have the server save the state automatically when the last client disconnects. When a client connects to the same instance ID, the server can load the last save state when it bootstraps the environment. In other words, we'll accomplish *instance persistence* using *state persistence*.

## Socket Connection Versus Web Service

Within the context of a running instance of an application, there are two different ways of interacting with the application instance.

**Socket Connection** - The socket connection is used to manipulate. This is currently represented by function calls on `vwf_view` in client code.

**Web Service** - The web service is used to communicate information *about* an instance. This is currently supported by direct web service calls from the client.

However, from the perspective of an application developer, we want to *present a unified API* that does not force the developer to distinguish between those two use cases. To that end, we will wrap the web service in a VWF object with a namespace dedicated to communicating *about* the instance. For example, `vwf_view.admin.someFunction`.

To reiterate, the web service is *primarily for internal use.* Our goal is to provide a javascript API to application developers.

## Application Developer Use Cases

### Save the state of an instance

**Motivation**

Application developer wants to save the state of the application instance at a specific point in order to return to that "point in history" at some time in the future.

**API**

From within a running application:

```
vwf_admin.saveState({"name": "state-name"}, function (stateName) {
  // body of callback function to execute on completion
});
```

*Returns:* the name of the saved state if save is successful, false otherwise.

*Notes:*

- If a save state with `"state-name"` already exists, it will be overwritten with the current state.

**Web Service**

`POST /path/to/app/{INSTANCE_NAME}/saves/`

*Arguments*

- *name* - The name assigned to the save state, which will be used to retrieve the save state.

**Open Design Questions**

- Should we make name optional and generate an ID automatically when no name is provided?
- Should we return the generated ID or specified name rather than true when save is successful?

### List instances of an application

**Motivation**

Application developer wants to retrieve a list of the instances of an application.

**API**

From within a running application:

```
vwf_view.admin.getInstances();
```

*Returns:* Array of instance objects, with all metadata, including ID, name, description, and a URL to connect to the instance.

**Web Service**

`GET /path/to/app/instances`

*Returns:* An array of instance objects.

**Open Design Questions**

- Are ID and name different?
- What does the instance object looks like exactly? Add an example JSON into the documentation.

### List saved states for an application

**Motivation**

Application developer wants to retrieve a list of all saved states for all 
instances of an application.

**API**

From within a running application:

```
vwf_admin.getSaveStates(function (savedStates) {
  // savedStates has 
});
```

*Returns:* 

- Array of saved state objects, with all metadata, including ID, name, and a 
  URL to connect load the saved state.
- Empty array if there are no saved states.

**Web Service**

`GET /path/to/app/{INSTANCE_NAME}/saves/`

*Returns:* An array of saved state objects.

**Open Design Questions**

- What does the saved state object looks like exactly? Add an example JSON into
  the documentation.

### List saved states for an instance

**Motivation**

Application developer wants to retrieve a list of the saved states for an
instance of an application.

**API**

From within a running application:

```
vwf_admin.getSavedStates( function ( savedStates ) {

});
```

*Returns:* 

- Array of saved state objects, with all metadata, including ID, 
  name, and a URL to connect load the instance save state.
- Empty array if there are no saved states.

**Web Service**

`GET /path/to/app/{INSTANCE_NAME}/saves/`

*Returns:* An array of saved state objects.

**Open Design Questions**

- What does the save state object looks like exactly? Add an example JSON into the documentation.

### Persist an instance

**Motivation**

Application developer wants to specify that this instance should persist, which means that the instance is available and the state maintained at the current URL even when all clients disconnect.

**API**

From within a running application:

```
vwf_view.admin.persistInstance();
```

*Returns:* true or false.

**Web Service**

`PUT /path/to/app/{INSTANCE_NAME}`

Update the persistence flag of the instance object to be true, or something like that.

*Returns:* True or false?

*Arguments*

An instance object with the persistence flag set to true.

**Open Design Questions**

- How do we represent the persistence option on the instance object in JSON?
- Do we want to persist instances by default?
- Should the application developer be able to specify that instances persist in the index.vwf.config.yaml?
- Should the application developer be able to specify that all instances automatically persist for all applications on the server? Some level of server configuration that we currently don't have?
- Should `vwf_view.admin.persistInstance()` refer to this instance by default? Should we allow an ID to be passed to be able to persist other instances?

### Load a specific instance with the latest save state

**Motivation**

Application developer wants to allow user to connect to an existing instance, loading the latest save state in the process.

**Browser Interface**

Navigate to `/path/to/app/{INSTANCE_NAME}`.

*Note:* There is no web service or internal API for this.

*Note:* Changes will need to be made to the loading process to look for save states for {INSTANCE_NAME} when bootstrapping the client.

### Load a specific save state as a new instance

**Motivation**

Application developer wants to allow user to load a specific save state in a new instance.

**Browser Interface**

Navigate to `/path/to/app/{INSTANCE_NAME}/saves/{SAVE_NAME}`.

Browser will be redirected to `/path/to/app/{NEW_INSTANCE_NAME}` with the save state loaded.

### Set metadata for an instance

**Motivation**

Application developer wants to set specific metadata for an application to make it easier to identify the instance within a list.

**API**

From within a running application:

```
vwf_view.admin.updateMetadata();
```

*Returns:* true or false.

*Arguments*

An instance object with the name, description and whatever else set.

**Web Service**

`PUT /path/to/app/{INSTANCE_NAME}`

*Returns:* True or false?

*Arguments*

An instance object with the name, description and whatever else set.

**Open Design Questions**

- What does an instance object look like?
- Is setting an instance to be persistent just a special case of updating metadata?

---

## Open Design Questions

- What should the URL be to load an application?
- What should we call a *save state* of an application instance? What should we call the *process* of creating a save state? Other suggested terms are "version", "historical state", "breadcrumb", or just "save".
- What's in the state of an application and what's out?
- If we save the timestamp of the state for an instance, should we set the time to that timestamp when we load the application? What ramifications does that have?
- Should functions in the `vwf_view.admin` namespace be able to manipulate other that the one that is currently running?
- Currently we're persisting save states to disk at `/documents`. Is that the best place? Is that the best name?

## Naming Instances

- No spaces, dots, or slashes to prevent clobbering resources served up by the application server.

## Alternative Persistence Stores

Currently, using the filesystem, but should be able to support databases, etc. Should be configurable by application developer.

---

## "Server" Concerns

1. Reflector - 
2. Bootstrap the client - 
3. Rendering vwf.yaml as json - 
4. File serving - 
5. Launching an app instance - 

