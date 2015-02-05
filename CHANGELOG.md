VIRTUAL WORLD FRAMEWORK CHANGE LOG
==================================

----------------------------------
0.6.24
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change. 

- CHG: Fixes getWorldTransform and recursively sets transform dirty
- CHG: Don't create new watchers at every reload of a file
- CHG: Move required test files back to public for build purposes.
- CHG: Remove index.html as it is now replaced by the default duck app.
- CHG: Remove web example apps from main repository.
- CHG: Update path to duck content.
- NEW: Remove demo apps from main repository and created a new vwf-apps repo. 
- CHG: Fix bug is streaming for media files
- CHG: Fix requirements page link on browser compatibility warning. 
- CHG: Clean up threejs implementation and vwf drivers. 
- CHG: Update to version 69 of threejs. 
- CHG: Remove glgeLight behavior references from test apps. 
- CHG: Update test models and camera initializations.
- CHG: Update particle system tests.
- CHG: Update object transform tests.
- CHG: Remove GLGE references from tests. Update tests. 
- CHG: Update transparency of models in tests.
- CHG: Update camera related tests, including fixing alpha channels on box and duck collada models, and simplifying yaml files where applicable.
- CHG: Add support for single-point tactical graphics.
- NEW: Exclude `ArrayBuffer`s from recursion since they never contain nodes.
- NEW: Warn about foreign-format node references.
- NEW: Keep a `node.vwf` reference to avoid lookups on each `valueIsNode` call.
- NEW: Recursively apply the kernel:javascript property, etc. value mapping. This allows properties, method parameters and results, and event parameters to contain objects and arrays of node references rather than just simple node references themselves.
- CHG: Update pixelSize modifier.
- CHG: Remove the setting of playerConnected
- CHG: Update the findClients function to use find
- CHG: Get the blockly UI state to synchronize
- CHG: Update gem versions for compatability with demo.virtual.wf.
- CHG: Use the `/latest/{darwin,linux}` service at `http://download.virtual...`.
- NEW: Add messages for `loadComponent` and `loadScript` errors.
- CHG: Remove `Master` from the filename template. The version string now includes "" / "integration" / "development" as appropriate to identify the build type.
- CHG: Simulate the build context so that the Rakefile will stamp the version.
- CHG: Update tar build links in install.sh.
- CHG: Set this.tilePositions property directly at the end of the shuffle call to ensure the property changes are replicated for new joiners. Remove initializeCamera method, and set camera properties in initialize.
- CHG: Use a `sed` backup extension for compatibility with both Linux and BSD.
- CHG: Generate a SemVer-style version identifier that includes the `development` / `integration` annotation for those builds.
- NEW: Create a deployment tool to generate the version string from version.js.
- CHG: Re-enable auto-shutdown.
- CHG: Version the Windows installer file and post to `archive` instead of current.
- CHG: Don't include the node.js executable in the Windows build.
- NEW: Integration version of the bash build script.
- NEW: Bash build scripts as currently on the Windows build server.
- CHG: Move hammer event handler back down to canvas listeners to fix touch implementation.
- CHG: Add pushpin and line variables to be part of the sandtable app model. Fixes draw capability.


----------------------------------
0.6.23
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change. 

- NEW: Add view interpolation to smooth navigation. 
- NEW: Website redesign and getting started guide. 
- NEW: Add admin/instances/jsonp request to ruby server to allow new website to query current sessions using jsonp.
- NEW: Add support for blocky and a blockly app. 
- NEW: Update to latest three.js. 
- NEW: Add "checkForSuccess", "checkForFailure", and "failed" to task.vwf.yaml. Factor js out of task.vwf.yaml into task.js.
- NEW: Add 3D graph tool with example app. 
- NEW: Add graphFunction method to graph.vwf.
- NEW: Add graphgroup type. 
- NEW: Add sound driver. 
- NEW: Add sound driver layers. 
- NEW: Add ability to queue sounds. 
- NEW: Add handler for specularLevel in collada loader. 
- NEW: Add the mil-sym model and view drivers. 
- NEW*: Add kernel actions and driver handlers for managing event listeners. Event namespaces will be known to the kernel but will not normally be known by the drivers. Changes to an event's listeners need to pass through the kernel so that a possible namespace may be encoded into the name before the driver sees it. The kernel will also need knowledge of the listeners for replication and to check listened events for validity.
- NEW*: Support namespaced events to be used for node meta events. Namespaced events will allow the kernel to use the normal event listening/firing mechanism for meta events that are distinct from a node's regular events. Meta events will be used to announce changes to a node, such as adding and removing children, creating and deleting properties, methods and events, etc.
- NEW*: Add kernel utility module. 
- NEW*: Translate between kernel and model/javascript node references. The translation is performed for each value (property value, method or event parameter, or return value) that crosses between the kernel and the model/javascript driver. This allows components to make persistent, direct node references. Nodes may be assigned to properties and passed through methods and events.
- NEW*: Replicate node references. Regular properties replicate as `{ propertyName: value, ... }`, or the more general `{ propertyName: { value: value }, ... }`. Extend the general form to encode properties containing node references as `{ propertyName: { node: nodeID }, ... }`. The `node` field indicates that the property is a node reference instead of a simple value. Using a distinict field ensures that the reference won't be confused with any other value that could otherwise resemble a node ID.
- NEW*: Support property node references in `kernel.createChild`. Support properties containing node references in `kernel.createChild`, in addition to `kernel.setNode`. Node references are only valid during
replication, but properties of nodes created during replication are assigned in `kernel.createChild` and not `kernel.setNode`. Node references are property descriptors in the form: { properties: { p: { node: id } } } This is in contrast with regular property values, which have descriptors in the form: { properties: { p: { value: v } } } 
- NEW*: Clarify names that reference the proto-prototype node `node.vwf`. Rename the `kernel/utility` items `nodeTypeURI` and `nodeTypeDescriptor` to `protoNodeURI` and `protoNodeDescriptor`, respectively, to better reflect that they refer to the proto-prototype node. Rename the `model/javascript` internal variable `nodeNode` to `protoNodeNode` so that it parallels the `protoNodeURI` name it derives from and to hopefully clarify that it is the `model/javascript` `...Node` data for the `protoNode...` node. 
- NEW*: Support namespaced events to be used for node meta events. Namespaced events will allow the kernel to use the normal event listening/firing mechanism for meta events that are distinct from a node's regular events. Meta events will announce changes to a node, such as adding and removing children, creating and deleting properties, methods and events, etc. References #3094.
- NEW*: Track globals in the node registry. Keep track of which nodes are roots in the global space (such as the application, other reflector-created trees such as `clients.vwf` and the prototypes). Add the node name to the registry. This is to allow locating extra-application trees by URI and by annotation (name).
- NEW*: Add `kernel.globals`, `kernel.global` and `kernel.root`. `globals` returns the set of root nodes of the application and the other global trees. `global` locates a tree by URI or annotation. `root`
locates the root of the tree containing a reference node. 
- NEW*: Add `kernel.child`. Add `initializedOnly` to child functions. Since `kernel.children` has the global analogue `kernel.globals`, add `kernel.child` for consistency with `kernel.global`. `kernel.child`
locates a child by index number or name. Add `initializedOnly` protection to the downward query functions `kernel.children` and `kernel.descendants`. When enabled, `initializedOnly` in `kernel.parent` and
`kernel.ancestors` guards against references out of uninitialized nodes. In `kernel.children` and `kernel.descendants`, it guards against references into uninitialized nodes. Similarly, `initializedOnly` in `kernel.globals` and `kernel.global` guards against references into uninitialized trees. In `kernel.root`, it guards against a reference out of the current tree into the global space when the current tree is not yet initialized.
- NEW*: Use `kernel.root` instead of `kernel.application` for the `find` root. Use `kernel.root` to locate the node corresponding to `node.find( "/" )` to allow `find` and `test` to work if the context is a non-application tree. 
- NEW*: Support XPath `doc` for locating trees outside the application. In an XPath query, `doc(uri)` or `doc(annotation)` locates the root of a tree loaded from the given URI or assigned the annotation. A URI or annotation that doesn't look like an XPath QName must be quoted. 
  - `node.find( "/" )` locates the application root.
  - `node.find( "doc('application')" )` or `node.find( "doc(application)" )`
  locates the application root through the `"application"` annotation.
  - `node.find( "doc('http://vwf.example.com/clients.vwf')/" ) locates the
  root of the clients tree.
- NEW*: Clarify `kernel.createNode` comments. Describe slightly better how a URI is loaded to transform into a descriptor and is then constructed to transform into an ID. `createNode` will accept a component in any of the three forms and will walk it through the remaining steps. 
- NEW*: Allow `node.create` without the `component` parameter.
- NEW*: Allow `node.delete` by name as well as by reference.
- NEW: Add kinetic model and view drivers, and implement touch drawing interface. 
- NEW: Create kinetic example app. 
- NEW: Add a property to control the animation tick rate. It may be useful to reduce the rate at which animations are calculated to reduce the CPU load when 60 fps animations are not required. The tick rate may be set globally for all nodes that implement `animation.vwf` (after the animation component has loaded): node.find( "doc('http://vwf.example.com/animation.vwf')" )[0].animationTPS = 30; Or just for individual nodes: node.animationTPS = 10; The default animation tick rate is unchanged at 60 per second.
- NEW: Allow .dds files to load from collada.
- NEW: Add jPlayer driver. 
- NEW: Add basic shader material support. 
- NEW*: Add a `tock` variant of `tick` to restore per-change notifications. Tests for future-related functions need to see each time change. Fixes #4053, #4083.
- NEW: Support `devicePixelRatio` !== 1. Fixes resize issues on Retina displays.
- NEW*: Define `kernel.setMethod` and `kernel.getMethod`.
- NEW*: Only call `model.callingMethod` until the first driver returns a result.
- NEW*: Replace `jQuery.each` with `Object.keys` to remove dependency on jQuery.
- NEW*: Add new utility functions to convert between Handlers and functions.
- NEW*: Support keyed and indexed collections in preparation for listener tracking. Add `indexedCollectionPrototype` as a parallel to `nodeCollectionPrototype` for tracking event listeners and other ordered, id-based members. (Should for `node.children` in the future.) Rename `nodeCollectionPrototype` to `keyedCollectionPrototype`. Accept values for the collection `existing` members to be used for kernel-authoritative data about the member, such as event parameters and listener ids. Collect the added/removed/changed bits into one object per collection and allow for detailed change state. The detail will  include listener changes within events. Support ordered change lists for indexed collections so that patches may apply members added in the necessary order.
- NEW*: Record creations and deletions in the registry. Include "added" and "changed" members in the patch data. Previously creations were as changes, like any other change. The replication data still can't indicate deletions. 
- NEW*: Allow `*.vwf.config.yaml` files to include client configuration options. Provide a `configuration` section to specify `vwf/configuration` options for the application. Any options provided will override the factory and environment defaults. For example:
    ---
    info:
      title: "VWF Duck Application"
    configuration:
      preserve-script-closures: true
- CHG: Fix broken closure in apps caused by event handler replication change. 
- CHG: Make the kernel `jQuery` reference available for the tests. The tests initialize using `kernel.initialize`. They don't call `kernel.loadConfiguration` first. Setting the internal `jQuery` reference only in `loadConfiguration` breaks the tests.
- CHG: Add pointer event definitions to the sandtable yaml file to fix bug introducted with API changes. 
- CHG: Update 404 page to match new website styling. Fixes #4061. 
- CHG: Fix when the VWF spinner is present and add it to its own namespace to avoid app conflicts. 
- CHG: Updates to GTLT loader. 
- CHG: Only pick when the model has pointer event listeners to hear it.
- CHG: Add check for a material map before correcting any missing UV coordinates.
- CHG: Update cesium to the latest version 30. 
- CHG: Enabled editor interface in sandtable app. Fixes #2974. 
- CHG: Update bzflag to allow players to rejoin. Fix other bzflag bugs. 
- CHG: Fix path checking order for Mac/Linux. 
- CHG: Fix issues with default browser, and fixes relative path issues. Fixes #3172.
- CHG: Fix bzflag particle implementation. 
- CHG*: Only move queue forward on ticks. 
- CHG*: `kernel.execute` async adjustments.
- CHG*: Pass the `kernel.execute` result in its callback.
- CHG*: Rename the `initializingNode` callback parameter to include `callback`.
- CHG*: Use the name `prototypeDepth` consistently for that concept.
- CHG*: Rename to `callInitializers` and `initializerScript` for clarity.
- CHG*: Move per-prototype `initialize` from `model/javascript` to the kernel.
- CHG*: Refactor the `properties`, `methods` and `events` accessors. Refs #3078. 
- CHG: Update mouse navigation. 
- CHG: Remove library dependencies. 
- CHG: Change humvee-lesson driving to use translateTo, so it's not interpolated. 
- CHG: Notify user if websocket connection is blocked. 
- CHG: Rearrange order of prototype array so nodes come before their behaviors. 
- CHG: Moved the WebGLRenderer render call out of the renderScene function. Added a default render function to the view driver.
- CHG: Pass in renderer, scene, and camera rather than finding them in the render function.
- CHG: Create two directional lights and an ambientLight if the application omits lights.
- CHG: Change the default lights to directional and creates the lights directly in the render.
- CHG: Update RequireJS to 2.1.11 from 2.1.5. 
- CHG: Bail on view-side matrix interpolation if rotation matrices are not orthogonal. 
- CHG: Fix mirrored animations. 
- CHG: Fix hammer.js dependency for touch applications. 
- CHG: Allow app developer to disable creation of default nav object. 
- CHG: Enable view interpolation on navObject and camera when navigation mode is "none. 
- CHG: Add model side support for raycasting in Threejs.
- CHG: Add source URLs to animation.vwf.yaml.
- CHG: Ignore a pick on an object not in the VWF node hierarchy. 
- CHG: Fix collada opacity and alpha. 
- CHG: Refactor key navigation such that it will be easier for apps to specify their own. 
- CHG: Move navigation functions up into the driver object (now accessible from app). 
- CHG: Make navigation overridable. 
- CHG: Update logger. 
- CHG: Fix spacing and add mouseEventData to handler params
- CHG: Add pointerlock params and combine separate mousedowns into one object
- CHG: Tweak duck app for better home webpage viewing. 


----------------------------------
0.6.22
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change. 

- NEW: Pull out three.js render into an overridable function so application can replace with its own (to work with shaders, multiple viewports, etc)
- NEW: Notify user if websocket connection is blocked
- NEW: Add polyfill for performance.now. Refs #3046
- NEW: `kernel.{prototype,behaviors,prototypes,prototypes(...,true)}` tests.
- NEW: Add calledMethod handler to the view to prevent interpolation when animation functions are called with a duration of 0. Refs #3046
- NEW: Add Pace.min.js loading bar to VWF startup window.
- NEW: Interpolate between transforms on frames between ticks.
- NEW: Move per-prototype `initialize` from `model/javascript` to the kernel.

	In order for the javascript driver to create an async break between
	calls to a node's prototype `initialize` functions, it needs to call
	back into `kernel.execute` and iterate using the `execute` callback. But
	kernel reentry is during replication. The driver can't make the extra
	hop through the kernel to execute its script. It needs to execute it
	directly.

	This commit makes the kernel responsible for applying the prototypes'
	initializers to the node. Using the new `initializingNodeFromPrototype`
	handler, the kernel directs drivers to run the relevant prototype
	initializers on the node. The kernel provides an async break between
	initializations when needed.

	Drivers only need to apply one initializer at a time. They no longer
	need to search through the prototype chain and don't need to be
	concerned about waiting for async operations from a prototype's
	initializer to complete before calling a derived node's initializer.

	An added benefit is that multiple drivers can perform partial
	initialization correctly (such as if two scripting systems are active).
	Previously, one driver would execute initialization for the entire
	prototype chain without allowing the next driver to interleave its
	initialization for the same nodes.

	References #2417.

- NEW: Make jQuery and bootstrap load as RequireJS modules to remove them from the global namespace. Refs #3108, #3109
- CHG: New loader screen!
- CHG: Turn eval script into regular code so optimizer doesn't break it
- CHG: Change humvee-lesson driving to use translateTo, so it's not interpolated. Refs #3046
- CHG: Refactor `kernel.prototypes` slightly to remove duplicated code.
- CHG: Rearrange order of prototype array so nodes come before their behaviors
- CHG: Fix prototypes function so that it doesn't skip the behaviors of the first level prototype. Refs #2417
- CHG: Adding compatibility checking back into index.html for older browsers.
- CHG: Adjust EventLag minimum sampling to account for event lag of Three.JS
- CHG: Clean up duplicate code in renderScene. Refs #3046
- CHG: Fix mouse navigation. Refs #2417
- CHG: Only save nodes that are 3D objects for interpolation
- CHG: Fix example/transforms so that it doesn't throw errors before the app is fully loaded. Refs #3046
- CHG: In the nodejs reflector, store the time a new client connects to use for the time in the setState message.
- CHG: Change tick messages so they don't have an action. Refs #3046
- CHG: Add /r flag to RMDir to fully remove node-modules folder
- CHG: Only move queue forward on ticks
- CHG: Moved some functions private, eliminate matCpy for goog.vev.mat4.clone, avoid kernel access.
- CHG: Fix applications that depend on jQuery or bootstrap. Refs #3120
- CHG: Remove old websocket check
- CHG: Update build_windows_installer.nsi
- CHG: Relative path changed to absolute for source control version of NSIS script.
- CHG: Start a webpage with the local README loaded after install.
- CHG: Create does not take vwfPath argument.
- CHG: Update vwfCli.js to support multiple possible locations for VWF support files.
- CHG: Update spacing in node_vwf.js
- CHG: Combine nested-if into && conditional operator in node_vwf.js.
- CHG: Add check for VWF_DIR truthy values.
- CHG: Fix path checking order to fix Mac/Linux path lookup.
- CHG: Wordsmith installation instructions
- CHG: Removed the word folder in install documentation.
- CHG: Update installation notes to tighten up wording.
- CHG: Update installation page to match README.
- CHG: Update readme.md to remove extra wording.
- CHG: Add instructions on how to use vwf create / vwf to start node server.
- CHG: Update Readme.md to fix wording.
- CHG: Update to point to development as fork repo for VWF Core Developers.
- CHG: Update readme.md to include new instructions for VWF 1.0 Windows install. Closes #3039
- CHG: Added Core Developer instructions for Windows installation. Closes #3039
- CHG: Update to installation procedures to break into user/app developer installation and core developer installation. Refs #3039
- CHG: Remove VWF website from main VWF repository
- CHG: No longer create default lights in every app - only if app doesn't create any itself (the create two directional lights and one ambient)
- CHG: Remove/encapsulate external dependencies so they don't conflict with app dependencies


----------------------------------
0.6.21
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change. 

- NEW: Update vwf.bat based on new installation package for Windows. Refs #2962
- NEW: Simplify README quick start instructions. Refs #2962
- NEW: Add vwf-pong temporarily for demo purposes
- NEW: Add JSON skeletal & morph target animations (interim)  Refs #2981
- NEW: Initial test for JSON skinnedmesh animations  Refs #2981
- NEW: Three.js JSON Model loader and animations, Refs #2891
- NEW: Clean up the Three.js JSON model testcase.  Refs #2981
- NEW: Update to three.js r64
- CHG: Reorder client disconnect code in Node server.  Refs #2978
- CHG: Update shrinkwrap with the new modules.
- CHG: Update node server docs with application path info. Closes #3011
- CHG: Update readme.md to include new instructions for VWF 1.0 installation steps. Closes #2959
- CHG: Refactored script to put all setup in one step #2959
- CHG: Fix formatting issue with SSL documentation. Refs #3013
- CHG: Fix remaining jquery issues  closes #2972
- CHG: Fix event default propagation calls. Refs #2972
- CHG: Remove unnecessary call to close the accordion after the lesson is completed. Refs #2995, #2996
- CHG: Branch/nodejs 500 error Fixes #2886
- CHG: Make the vwf root path available to the CLI. Make blank app the default VWF application.
- CHG: Fixes the setting of the active Camera during initialization of the scene
- CHG: Fix particle system error from the latest threejs version. Refs #2947
- CHG: Sets the transform to the identity matrix, if the transform is undefined
- CHG: Cleans up some code that was repeated in two places.  Fixes 2987
- CHG: Editor fix for animations.  Handles node properties with '$' identifier.
- CHG: Remove unused global.activeinstances variable. Refs #2886
- CHG: Move global.instances creation to node_vwf.js, so that it is available as soon as the server starts. Refs #2886
- CHG: Fix node server infinite redirect bug. Fixes #2994, #2992, #3034, #3013, #3000, #3014
- CHG: Add Persistence Documentation. Fixes #2946.
- CHG: Branch/transform tool. Fixes #3010, #3066
- CHG: Branch/transform tool Uses the new rotate in x and/or y for the rotation handles
- CHG: Branch/transform tool Implements a default case that will listen to changes in x and/or y to rotate the object
- CHG: Branch/transform tool Removes the reference to the 'text' primitive type that was never completed
- CHG: Branch/transform tool Removes some properties that were being handled twice
- CHG: Branch/transform tool Removes the references to the old navtouch scene extension
- CHG: Branch/transform tool Adds a couple 'to do' comments to comments that discuss possible issues given some rare circumstance that might occur
- CHG: Branch/transform tool Fixes the decreasing scale issue as the user moves towards the center of the object
- CHG: Branch/transform tool Adds and implements the scale behavior for the transformTool.vwf.yaml
- CHG: Branch/transform tool Adds the scale-on-move behavior
- CHG: Branch/transform tool Calculates the world normal and uses that for the mouse data instead of the local normal
- CHG: Branch/transform tool Cleans up some debugging console output that was no longer needed
- CHG: Branch/transform tool Fixes the initial camera positions
- CHG: Branch/transform tool Finalizes the updates required to get branch/transformTool working.  Example application and usage example: public/tt Task 3001 and Rebase 2998
- CHG: Branch/transform tool Improved the look and colors of the transformTool
- CHG: Branch/transform tool Using the pointer vector from the mouse pick
- CHG: Branch/transform tool Normalize the calculated view vector
- CHG: Branch/transform tool Added the pointer vector of the camera that is calculated for the pick to the pickInfo
- CHG: Branch/transform tool Added a couple of objects to the transformTool test
- CHG: Branch/transform tool Additional changes for the 'parent_' temporary fix
- CHG: Branch/transform tool Fix for GLGE incorrectly returning a bad color value
- CHG: Branch/transform tool Transformtool now working in threejs
- CHG: Branch/transform tool Added transparent and opacity to Material
- CHG: Branch/transform tool Added the other primitives to the cube demo
- CHG: Branch/transform tool Added application as a test case for the issues I ran into with 'includes'
- CHG: Branch/transform tool Added nodes to test the new threejs primitives
- CHG: Branch/transform tool Updated the type for the mesh definition
- CHG: Branch/transform tool Added primitive components for threejs
- CHG: Branch/transform tool Added double sided to the createMesh in the threejs driver
- CHG: Branch/transform tool Fixed the scale corners of the transform tool
- CHG: Branch/transform tool Added the scaling component for the transform tool
- CHG: Branch/transform tool added the test application for transformTool
- CHG: Branch/transform tool Added the rotation handles
- CHG: Branch/transform tool Component files for the transformTool
- CHG: Update accordion calls to match the API for JQuery 1.10
- CHG: Update accordion calls to match the API for JQuery 1.10 Fixes #2995, #2996
- CHG: Fix Humvee-Lesson sounds only play the first time.  Fixes #3069
- CHG: Fix for the `vwf create` command
- CHG: Make blank app the default VWF application.
- CHG: Update getPositionFromMatrix calls to setFromMatrixPosition to match latest revision Copied from https://github.com/virtual-world-framework/three.js.git Revision 46afb9d4f8499d78c7996f6427420221e4b60556
- CHG: Move build status inline with the branch listing.
- CHG: Fix Humvee app sound issue where horn & ignition only play once in Chrome.  Fixes #2993
- CHG: Change name of nodejs log directory.  Refs #2828
- CHG: Check and set a non-set HTTP_PROXY variable. Closes #3063
- CHG: Add information on how to programmatically save and load states.
- CHG: Add persistence.md to Rakefile. Fix "Troubleshooting" typo in Testing section.
- CHG: Make the vwf root path available to the CLI.


----------------------------------
0.6.20
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change. 

Server:
- NEW: Update node server docs with application path info. Add exit in case vwf support files can't be found.Closes #3011

Client:
- NEW: Add proxy check for users behind corporate firewalls refs #2958
- NEW: Force the symbolic link command. Refs #2958
- NEW: Allow VWF command to be run from any folder location. Refs #2963.
- NEW: Pass command line arguments to the node server. Refs #2963
- NEW: Load the VWF support files from the right place.
- NEW: Fix NPM package call to occur after node.js is setup refs #2958
- NEW: Update node to extract under .vwf directory to contain all VWF structure in a single directory.  Refs #2958
- NEW: Add vwf script to start the vwf server from command line. Refs #2963.
- NEW: Install script for Linux/Mac for a "minimal install" version of vwf that can be executed from a command line. Refs #2958
- NEW: As a developer, I want a command-line interface for creating VWF apps. Add vwf run as a command. Fixes #2962 
- NEW: Implement `vwf create` and add mocha tests. Refs #2962
- NEW: Fix safari issue with trying to write to performance.now() Closes #2919 Closes #2802 Closes #2439 Closes #2441

Documentation:
- CHG: Reformat documentation to create a single searchable html file. Fixes #2923.-NEW: Update Readme.md to add build status. Closes #2963
- NEW: Update readme.md to include new instructions for VWF 1.0 installation steps. Closes #2958


----------------------------------
0.6.19
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change. 

- NEW: Adding map files for symbol debugging in jquery
- CHG: Fix bug introduced by upgrading jQuery.
- CHG: Update editor.js to remove console log messages.
- CHG: Add nokogiri requirements to the build script for debian.
- NEW: Packaging script to put a tarball in the scripts executed directory of the built package. Used by the VWF team to create Linux packages. Refs #2958
- NEW: Branch/node.js websocket url
- NEW: Don't look for a specific number of digits for the time parameter
- NEW: Change parseSocketUrl to get the application from the socket URL instead of the referrer URL
- NEW: Update node.js websocket URL format to include the app name and instance id
- NEW: Change 'else if' back to an 'if' for kfAnimations on animationTimeUpdated property. Add additional check for array length.
- NEW: In response to PR #74 (branch/jsonloader) peer review findings.   Refs #2951
- NEW: Refactor JSONLoader THREE.MorphAnimMesh, cleaned up for submission.  Refs: #2951
- NEW: Added additional touch data.Refs #2951
- NEW: Allow three.js JSON model format to load as a skinned mesh, since both skinned and morph anim meshes utilize morph target influences.
- NEW: Add animationRate, animationDuration, & animationFPS to Three.js JSON MorphAnimMesh nodes.  Updated testcase.  Refs #2951
- NEW: New Three.js JSON models.  Refs #2950
- NEW: Add new JSONLoader avatar model.  Refs #2950
- NEW: Add THREE.js JSONLoader and MorphAnimMesh support.  (initial commit)  Refs #2936, #2949, #2951
- NEW: Adding new build script to put jenkins build scripts under source control. Refs #2958
- NEW: Deleting travis.yml on main vwf core repo.  Forked repos may utilize their own continuous integration servers as needed.
- NEW: Merge pull request #67 from virtual-world-framework/branch/readme-rewrite
- NEW: Rewrite README Change questions link to our forum until StackOverflow migration is completed.
- NEW: Rewrite README Fix link to Getting Started.
- NEW: Rewrite README Improve wording.
- NEW: Rewrite README Fix spelling errors.
- NEW: Rewrite README Add link to what people are building with VWF.
- NEW: Rewrite README Add an ideal and a realistic README rewrite.
- NEW: Rewrite README Update README to the ideal.
- CHG: Add back stopPropogation calls on dialog keyup and keydown. Refs #2972
- CHG: BZFlag add javascript events back into application baseline. Closes #2972
- CHG: Merge pull request #71 from virtual-world-framework/branch/remove-vestigial-admin. Remove admin page that is no longer used.
- CHG: BZFlag fix for create button and to update application JQuery UI. References #2972
- CHG: Editor update to reference correct encoder function for prototypeEvents. Refs #2972
- CHG: Merge pull request #73 from virtual-world-framework/branch/nodejs-client-object. Send the message to all existing clients too. Refs #2971 Add message to create the client object in the "clients.vwf" global on connection Fixes #2971
- CHG: Caught a few references to old version of jQuery.
- CHG: Removed the extra css file in the js folder and updated admin.html.erb to include new jquery minfile. Refs #2660
- CHG: Update JQuery and JQuery UI to latest baseline. Refs #2660
- NEW: Branch/property delegation Refactor `getProperty` delegation to the behaviors and to the prototype.
- NEW: Branch/property delegation The `blocked` flag is no longer used during sets and gets.
- NEW: Branch/property delegation Update `getProperty` with `delegated`/`retrieved` like `setProperty`.
- NEW: Branch/property delegation Remove the `entry.value`/`reentry.value` field used to detect retrieval from an inner call since that is superseded by `retrieved`.
- NEW: Branch/property delegation Detect retrievals and delegations explicitly.
- NEW: Branch/property delegation Exit the `gettingProperty` loop on `delegated || retrieved` instead of on `value !== undefined`.
- NEW: Branch/property delegation Set the `entry.completed`/`reentry.completed` flag in an inner call so that the outer call won't reinvoke drivers already called when a property delegates to itself.
- NEW: Branch/property delegation Move delegation of the behaviors and prototype to not occur on the inner call when a property delegates to itself. This was unintentionally changed in commit:7d3dc92.
- NEW: Branch/property delegation Fix comments that refer to "set" and "assign" to describe getting instead.
- NEW: Branch/property delegation Add a `reentered` flag to clarify how property reentry is handled.
- NEW: Branch/property delegation Remove `nodeHasProperty` and `nodeHasOwnProperty` restored in a rebase. commit:89d018f removed them, but they were retained when the commit was rebased as commit:5702c04.
- NEW: Branch/property delegation Update node, settingProperty, and satProperty documentation refs #2593
- NEW: Branch/property delegation Change documentation that says properties default to value undefined
- NEW: Branch/property delegation refs #2593
- NEW: Branch/property delegation Removed inappropriate markup from node documentation and cleaned up documentation refs #2593
- NEW: Branch/property delegation Make satProperty only fire in an entry to setProperty if property was assigned refs #2593
- NEW: Branch/property delegation Update tests to only expect inner properties to send satProperty event. refs #2593
- NEW: Branch/property delegation Mark commented-out section of kernel node storage (methods and events) as TODO refs #2593
- NEW: Branch/property delegation Add comment to commented-out patches object to explain why it's commented out refs #2593
- NEW: Branch/property delegation Add documentation for the update of how property delegation behaves If a property setter transforms a property in a setter, satProperty is fired w/ the transformed value, not the original value
- NEW: Branch/property delegation Fire gotProperty event during replication when appropriate refs #2593
- NEW: Branch/property delegation Fix copy-paste error in getProperty refs #2593
- NEW: Branch/property delegation Fire satProperty event with the internal value when setProperty is called during replication. refs #2593
- NEW: Branch/property delegation Guard against cases when satProperty is called without an initializeProperty. The current implementation of property delegation allows an initializeProperty event to be skipped for properties that delegate. refs #2593
- NEW: Branch/property delegation Remove unused getPropertyValues function
- NEW: Branch/property delegation Modify getProperty to pass tests refs #2593
- NEW: Branch/property delegation Remove erroneous conditions that cause satProperty when it should not occur refs #2627
- NEW: Branch/property delegation Add tests to ensure "gets" and "sets" take proper path through drivers fixes #2563
- NEW: Branch/property delegation Detect delegation during property assignments. When a property assignment is executing, execution should stop once the property is assigned. If the kernel is configured with drivers A and B, for example, the kernel shouldn't call B if A handles the assignment. The existing implmentation only does this correctly when a property accepts the assignment directly or when it delegates to itself (such as
with `set: this.name = parseInt( value )`). If the assignment delegates to another property, this isn't considered assignment, and execution on
the initiating property continues with the remaining drivers. This causes extra work when invoking drivers lower in the stack for
properties that have already been delegated, change flags to be set on nodes that haven't actually changed (for example n, in the case of n.p
=> m.q), and properties delegating to other propertes to be incorrectly included in change sets (for example p in the case of n.p => n.q). This commit detects delegation to other properties by watching for other assignments made while executing `setProperty`. When delegation is
detected, execution completes just as it would if a driver accepted an assignment directly. Also, lots of tests. Closes #1635.
- NEW: Allow descriptors to declare properties without assigning a value. `kernel.createProperty( nodeID, name, undefined )` will create a new property without assigning an initial value. This can be useful if the property should have the value `undefined` or if a driver binds the node to an internal object that already has a value (such as `transform` in a Collada object). But since YAML and JSON have no representation for `undefined`, there has been no way to do the same thing using a component descriptor. This commit extends the detailed initializer format slightly to allow an `undefined` value to be explicitly declared:

    properties:
	  alpha:
	    "alpha"
	  beta:
	    value: "beta"
	  gamma:
	    undefined: true

`alpha` is created with the value `"alpha"` using a simple initializer. `beta` is created with the value `"beta"` using a detailed initializer.
And `gamma` is created using a detailed initializer with the initial value undefined.

- NEW: Track kernel re-entry originating with aggregate property sets and gets. Set the markers so that if `kernel.setProperties` or
`kernel.getProperties` set or get a property having an accessor function that refers back to the property, or if a driver calls back to the
kernel to refer to the property, `setProperty` or `getProperty` will start the action with the correct driver. Previously, only actions originating with `setProperty` or `getProperty` were tracked this way. This commit adds tracking for actions originating in `setProperties` and `getProperties` as well.
- NEW:  Only record changed properties in `getState`. Previously, after any property changed on a patchable node, `getNode` (which feeds `getState`) would include all of the node's properties in the patch. Now, only the properties that actually changed are included. Fixes #2236.
- NEW: Begin moving the node registry to the kernel from model/object. The kernel has been delegating knowledge of the node graph and node
change flags to the model/object driver. But this doesn't work well since model/object isn't normally notified about changes to a node until
after the other drivers. Extra calls into model/object are in place so that preceding drivers can ask about a node's ancestors or prototypes in
creatingNode, for example, but this is an abuse of the driver API. Tracking changes in model/object also requires extra work since
model/object doesn't see changes to properties handled by other drivers. Change flags may not be set in some cases, which can cause replication
errors. The kernel will be better off if it manages this data itself. With a local registry, it will be easier for the kernel to register a new node
just before it is first exposed to any driver and unregister a deleted node right after its last driver message. This commit creates the node and per-node property registries, and records per-node property change flags. Fixes #1815.
- CHG: Update KimRayValve to kimray. Closes #2952
- CHG: Fixes the issue with clients not initialiy syncing up correctly UCE - Fixes 2263 and there was a bug listed in VWF for this as well, but can't find the number




----------------------------------
0.6.17 and 0.6.18 Combined Release
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change. 0.6.17 and 0.6.18 were combined into a single release do to internal sprint planning changes.

Server:
- NEW: Merge pull request #47 from virtual-world-framework/branch/headless-qunit. Headless QUnit - Run qunit tests from command line. Move the qunit tests into the client Rakefile and update docs. Update docs with instructions to handle spaces in paths. Support paths with spaces across Windows and Mac. Added bundle exec to call. Update testing.md. Document how to run qunit tests. Add descriptions to tasks so they show up in 'rake -T'. Enable phantomjs to run on Windows. Check if phantomjs is installed before trying to run qunit tests. Pull phantomjs binary location from ENV. Add `kernel.views.actual` to match models, and update tests to use. This duplicates some code, but branch/model-sandbox moves the pipeline-following function to the driver modules so it will be short-lived. Update Gemfile.lock after pulling out the phantomjs gem. Include rake test:qunit in the rake test run so that all tests are run by rake test. Add expect nothing to broken tests to meet new qunit requirements. Improve console output from run-qunit and rake task. Remove phantomjs gem because not needed. Add a task for running the qunit tests using phantomjs. Add qunit runner for phantomjs. Upgrade qunit to most recent version
- NEW: Merge pull request #58 from virtual-world-framework/branch/node-doc. Add Node.js Server documentation. Add node-inspector configuration options to nodejs documentation Refs #2828. Add Node.js Server installation, execution, & debugging instructions.  Fixes #2855. Create Node Server 'Logs' directory on demand.  Fixes #2828
- CHG: Create Node Server 'Logs' directory on demand. Refs #2828
- CHG: Update install.md to include SSL setup instructions. Fixes #2807
- NEW: Streamline node package list. Add debug script for running node in debug mode. Switch out https for http npm registry. Adjust node module version strings. Set dependencies to N.N.x in order to retrive the most recent patches. Set devDependences to x.x.x to be the most expansive. For development tools, I assume we want the most recent versions, always. Removed all unused packages. I think I *only* removed unused packages, so if you notice something missing, add it back in! Upgraded libraries to the most recent versions. Switched to 0.0.x semantic versioning for specifying dependencies. The ".x" in the version will pull in patches, but not minor or major version changes. Changed sections referring to ADL to refer to VWF. Added start script so you can start the server by typing `npm start`. Moved testing and debugging tools to devDependencies so that they won't be installed in production. Changed license to Apache 2 from MIT. Regenerated `npm-shrinkwrap.json` with the new packages.

Client:
- NEW: Shift Key now allows for MouseMiddleDown behavior when held down and a mouse click is made. This allows a user without a middle mouse button to still access the orbit functionality. Fixes #2901

Demonstration Applications:
- NEW: 2D Editor Example Application
- NEW: Add link to Kimray Valve Demo to VWF main website.

----------------------------------
0.6.16
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

Server:
- CHG: Add flag to the Threejs View Driver to check if there is an outstanding getProperty request on 'userObject'.  This eliminates the issue of creating multiple user nodes in gotProperty (not currently implemented through a callback). Fixes #2671
- FIX: Updates threejs onresize behavior to adjust viewport based on the webgl canvas without the unused border included. Fixes #2800. 
- NEW: Add initial implementation of the node.js server. 

Client:
- NEW: Add new properties for controlling shadows. Refs #2806
- CHG: Fix bug linking the animationRate to the threejs driver. Deprecate fps property, and add new read-only property animationFPS that only comes from the collada model. Add new animationFrameCount and animationFrame properties. Allow for negative animationRate. Refs #2801

Demonstration Applications:
- Command Center: Texture Update for backboard. Fixes #2668
- Command Center: Fix bad path for command-center artwork.
- Write Togeter: Create a new 2D editor application for collaborate document creation. 
- Radio Lesson: Updates the 'turn the radio on' step of the lesson to listen for control value updated events rather than pointer up events. Fixes #2590.

Documentation:
- CHG: Update spacing on readme.md file for the 'Getting Started' documentation page. Fixes #2716. 
- CHG: Crispen warning about unzipping build w/ Windows utility. Fixes #2808

Test Applications:
- NEW: Add multi-nav-test app to debug Redmine #2671.



----------------------------------
0.6.15
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

Server: 
- NEW: Load the application chrome as a service instead of a file. Instead of having the client parse the URL and guess at the application name, load the `application.vwf.html` overlay using a fixed path relative to the application root. Since applications aren't required to provide an overlay, return an empty result with status code 200 when the overlay doesn't exist. Otherwise, the log will show an error for a condition that isn't really an error. Closes #741.
- NEW: Load the application chrome from view/document instead of the kernel. Test for the application explicitly rather than using the kernel's heuristic. Prevents attempting to load *component*.vwf.html for components referenced by the application. Suspend loading the application while the chrome document loads. Synthesize a `createdNode` call for the application node when the chrome provides a `createdNode` handler. Allows the chrome's `vwf_view` handlers to observe all of the actions for the document--not just the ones that occur after the chrome happens to load. Closes #188.
- NEW: Kernel reentry should be off for deferred properties too.
- NEW: Remove need for ./Log directory for Nodejs server default LogLevel.

Client:
- NEW: Add drag touch gesture to emulate fly behavior. Add ability to switch camera.touchmode to "orbit" or "none" as well. Orbit is minimally supported, but needs work. Remove hmmwv-touch application. Fixes #2604.
- NEW: Fixes bug in GetAllMaterials helper function which broke materials in some models for GetMaterials. Fixes #2681.
- NEW: Adds a isIdentityMatrix function, which was previously called despite not existing. Fixes #1927.
- NEW: Modifies CloneMaterial to take into account the difference between THREE.Material and THREE.MeshFaceMaterial. Fixes #2677.
- NEW: Add automatic generation of not yet represented materials to the threejs node creation process. Updates the material name to material matching system to support potential 'multiple identical yet distinct' materials. Fixes #2159.
- NEW: Load scripts from external URIs. 
- NEW: Process scripts in a separate async block. This is in preparation for loading scripts from external resources, which will be an async operation.
- NEW: Accept a single item in addition to an array for behaviors and scripts. Closes #173.
- NEW: Select the correct socket.io port when the application uses the default. References #2674.
- NEW: Use SSL WebSockets for SSL applications. Fixes #2674.
- NEW: Add additional mod to Rob's Asset Cache Material Clone fix (315ca5ff079043e4f658946952d7bf136b34b217).  Fixes #2617
- NEW: Move the `transforms.transit` normalization just before the socket send. Parameter and result values need to be normalized before they are converted to JSON and sent to the reflector. Specifically, Array-like objects must be converted to Arrays so that they pass through JSON serialization and deserialization properly. Actions initiated by views and sent using `kernel.send` weren't being normalized this way. This commit moves normalization into `kernel.send` and `kernel.respond` to ensure that it is applied consistently for each outgoing message. Other `transforms.transit` normalizations done in anticipation of the result being sent to the reflector are redundant and have been removed. The patch to explicitly convert array-likes to arrays in view/threejs is now also redundant and has been removed. Fixes #2666.
- NEW: Move processing of load portions of URL out of VWF::Pattern and into VWF::Application::Persistence.  Update editor panel and pattern test to work with the slightly changed URL syntax for loading saves that this produced. Fixes #2654.
- NEW: Updated regex to capture only .vwf.html files for 404 custom page. Fixes #2637

Demonstration Applications: 
- Marbles: Alters marbles material definitions in the YAML so that they properly identify materials in the collada model files. Fixes #2672.
- Cesium WebRTC: Fix Google Chrome location error in cesium-webrtc. If the location query returns and invalid response and presents an error, the billboard and associated label will be hidden. Fixes #2648. Fixes #2600.
- Command Center: add blank tv screens to the side wall televisions.  Fixes #2557
- Command Center: Migrate command-center to threejs.  Fixes #2663
- AGI/Cesium: Add check to only create the billboard and label in cesium is the geographic location is valid. This reimplements 2541c151879be9e3f029fdee0190099d14ddde8f. Fixes #2600.

Documentation:


Test Applications:



----------------------------------
0.6.14
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

Server: 
- NEW: Initial phase of node.js server integration from Pull Request #10.  Fixes #2495 #2496
- NEW: Add functionality to save and load from separate directory structure. Add new pattern matching to server that provides readable load and save URL's. Add basic support for save revisions, using the UTC timestamp in seconds as a revision number. References #2315. References #2534.
- NEW: Add support to the reflectors first connection flow to allow starting at non-zero times. Add functionality so that when loading initial state from JSON, time from JSON state is used as initial time.  Remove stripping of the queue from the editor save state functionality. References #2315. References #2534.
- NEW: Add additional means of requesting lists of saved files. Provide either a list of all saved files, or find all saved files that are at or a descendant of a certain URL. Updated the user panel of the editor to use the new 'list all save files' feature, and include an application name as part of the option label. Fixes #2533. Fixes #2315. Fixes #2534.

Client:
- NEW: Add touch events to node2 and node3 components (similar to pointer events), so that touch events may be extended in these component types. Fixes #2502.
- NEW: Ensure that proper reflector messages are ignored by view/threejs.js. The navigation system updates the view immediately and should therefore ignore the reflector message associated w/ that update.  Previously, it kept track of the number of messages it sent out and assumed that the next n messages that came in with a client id that matched its own were the ones to be ignored.  However, since other parts of the system can also make transform updates, this was not adequate. It now fires an event before updating the transform so it can listen for the event to know what to ignore. fixes #2505
- CHG: Rename variables in view/threejs.js. Avoid name conflicts w/ global and local "translation". Change outstandingTransformRequestToBeIgnored to outstandingTransformRequests refs #2505
- CHG: Refactor scene.vwf.yaml - reorder scripts to match methods refs #2505
- CHG: Remove unreachable intervalTimer variable and move to driver initialization. Fixes #2488.
- CHG: Set node3 transform to "value" when worldTransform is set on a node without a parent. Refs #2226.
- NEW: Add check that renderer and viewCam exist before setting viewport or aspect. Fixes #2466.
- NEW: Merge Pull Request #13 (assetCache Part II). Fixes #2576 #2570
- CHG: Adds a toArray function for a utility.color instance, useful for converting colors to vwf friendly values
- CHG: Adds the capture and color property for clients For task: 2548
- CHG: Put check in object.js for object being undefined. This will happen if there is no object with the nodeID provided to the internals() function.  We have only seen this happen when a second client joins and children of a node are added in a different order, resulting in node ids that don't match.  We do not know what caused that, and we cannot reproduce it (it only happened once).  As a result, we have placed this check to see if we can catch it in the act. I am marking the associated task as complete for now. fixes #2558
- CHG: Don't store models with keyframe animations in the asset cache, since we can't clone those successfully. Refs #2586
- CHG: Move cloneMaterials call outside the check for animations so it will clone the materials for animated models too Refs #2586
- CHG: Add basic tap and pinch-to-zoom touch gesture support to threejs driver. Tap currently emulates pointerUp, Down, and Click events to support current application implementation. Update humvee-lesson 'Walk to Vehicle Step' to support both mouse wheel and pinch-to-zoom. Refs #2456. Fixes #2598.
- CHG: Fix setting castShadow property on threejs objects. Add resetViewport event to fix blank screen issue when shadows are enabled. Refs #2567
- CHG: Adds a centralized way to debug node creation and properties.
- CHG: Add new properties to the light behaviour for controlling shadows Refs #2567
- NEW: config.ru update to resolve #2216 and mask 404 errors on autogeneratedd files.
- NEW: Added new 404 page for VWF style page. Resolves #2216.
- CHG: Remove remote URL call for font WOFF file from googleapis.com and serve file from local client for bootstrap usage calls. fixes #2614

Demonstration Applications: 
- CHG: BZFlag: Set Tank's visible property to false and only set to true when a user is activated. Fixes #2510.
- CHG: BZFlag: Fix bzflag explosion particles Fixes #2474
- CHG: BZFlag: Change player login procedure to check for username overlaps and prevent them. Fixes #2577.
- CHG: Duck-Lesson: Remove duck lesson application, as we now have more complex humvee and radio lessons. Fixes #2599.
- CHG: Humvee: Move humvee and humvee-lesson to use threejs by default. Update color and emit properties for Brake and Wait lights to work better in threejs. Lower navigation speed inside the humvee. Fixes #2349
- CHG: Humvee: Tone down the specular property on humvee materials. Remove VWF lights, since there are lights in the humvee model. Refs #2349
- CHG: Humvee-Lesson: Move humvee and humvee-lesson to use threejs by default. Update color and emit properties for Brake and Wait lights to work better in threejs. Lower navigation speed inside the humvee. Fixes #2349
- CHG: Humvee-Lesson: Decrease wait time for "Move Ignition to Start" in humvee-lesson. Fixes #2127.
- CHG: Humvee-Lesson: Add listener for pointerWheel on step 1.1 of humvee-lesson. Fixes #2587.
- CHG: Marbles: Enable shadows in marbles app Refs #2567
- CHG: Marbles: Remove transparent maps, since threejs can't use them Refs #2567
- CHG Cesium-WebRTC: New user interface files for the webrtc demo
- CHG Cesium-WebRTC: Adds the capture and color property for clients, and several other enhancements to get new UI working For task: 2548
- CHG Cesium-WebRTC: Updates the driver options to allow setting the capture property For task: #2548
- CHG Cesium-WebRTC: Updates to make the UI more rich and user friendly
- CHG Cesium-WebRTC: Switches the capture property to the sharing property. Webrtc clients will always capture both the audio and video and then will determine through properties where or not to share the media
- CHG Cesium-WebRTC: Updates the functions between the document view and the webrtc view
- CHG Cesium-WebRTC: Uses the root level clients list to determine when a client leaves and then remove the appropriate windows when a client leaves Fixes: http://redmine.virtualworldframework.com/issues/2564
- CHG: Sandtable: Add light to sandtable scene to show shadows/depth. Lighten black pushpin so its shadows are visible. Fixes #2418


Documentation:
- CHG: Add backslashes to square brackets in documentation to clear build warnings. Fixes #2485.
- CHG: Update the animation documentation to reflect the latest animation changes Refs #2131
- CHG: Update animation code example to have spaces instead of tabs #2131
- NEW: Add driver developer's guide entry to documentation. Reorganize documentation so that developer's guide entries are listed first. Fixes #1935.
- CHG: Add nodriver option as well as an example of passing parameters via the URL. Refs #1935

Test Applications:
- CHG: Fix the shadows test app to actually test shadow functionality Refs #2567
- CHG: Update pattern test to account for changes to the pattern matching interface. References #2534.



----------------------------------
0.6.13
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

Server: 
- No updates to server for 0.6.13.

Client:

- NEW: Implements cxml import for cesium/node3.
- NEW: Add support for assigning textures to multiple sets of texture coordinates. Copied from https://github.com/virtual-world-framework/three.js.git Refs #2464
- NEW: Add support in three.js for assigning textures to multiple sets of texture coordinates. Refs #2464
- NEW: Add support for both transparent modes in the collada loader. Refs #1860, #2464
- NEW: Add animationRate property to control component. Fixes #2490. Fixes #2491.
- NEW: Add debug to node3.vwf.yaml. refs #2462
- NEW: Add necessary properties to support alpha channel transparency from textures in threejs. References #2311.
- NEW: New cesium view option: invertMouse: { x and or y }  to invert the mouse due to the canvas being rotated
- CHG: Remove stale touch view driver from core. To be replaced with updated hammer.js library and touch support in threejs. Refs #2456. Fixes #1643.
- CHG: Updates the client user control to be the first user has control and does not release control to a up event.
- CHG: Fixes an error in a for loop variable that had a wide variety of undesired side effects. Fixes: #2521
- CHG: Fix getting/setting of light color. refs #1901
- CHG: Update to three.js r59. Brought files over from vwf fork of three.js. refs #1860
- CHG: Driver support for exposing the canvas Options. Plus allows the Cesium.Viewer to use those same options.
- CHG: Fix setting webrtc video's muted property.  webrtc and cesium should work both in Chrome and Firefox. Fixes: 2478
- CHG: Delays the setting of the url/stream until after the video element is created
- CHG: Experimental support in the collada loader for assigning textures to multiple sets of texture coordinates. Refs #2464
- CHG: Update the cross browser support to the latest version of the file from: https://code.google.com/p/webrtc/source/browse/trunk/samples/js/base/adapter.js version: https://code.google.com/p/webrtc/source/detail?spec=svn4384&r=4259 Fixes: 2478
- CHG: Limits client control of broad casting the current camera location to the user who has created the latest mouse event.
- CHG: Expand socket.io-sessionid-patch.js to account for other transports. fixes #2461
- CHG: Have clients reuse websocket session id when reconnecting. Since the sessionid is used as the user's unique moniker, this will solve the problems we were having when a user would reconnect and the session would treat him as a new user. refs #2461
- CHG: Remove default particle texture so that it doesn't cause 404 errors. Fixes #2268
- CHG: Remove texture case so that settingProperty will be called for textures during synchronization. Refs #2438
- CHG: Allow two users to control same object smoothly. fixes #2462
- CHG: Simplify transformTo calculation when duration is 0. refs #2462
- CHG: Add setting and initialization of property support for more material properties in three.js.Fixes #2241
- CHG: Update camera input field style to italic if in focus, to indicate it is not updating. Fixes #2193.
- CHG: Fix issue with passing encoded nodeID as nodeID. Fixes #1638.
- CHG: Add a focus check for editor input fields. Only auto-update fields if a cursor is not active in a field. Fixes #2193.
- CHG: Update editor delete node to properly delete the node. Add a call to delete the node from the editor's this.object, as well as to properly call splice passing in the index of the node to remove from node.parent.children. Fixes #2427.

Demonstration Applications: 

- CHG: AGI/Cesium: Updates the cesium canvas correctly so cesium will take up the entire browser view in Firefox. Fixes: 2228
- CHG: BZFlag: Fix bzflag chat messaging. Refs #2291
- CHG: BZFlag: Limit the number of shots that can be fired per keypress to improve performance. Refs #2124
- CHG: BZFlag: Change find function to only look one level down. Refs #2124
- CHG: Chat: Modify spacing in timestamp to use &nbsp; to avoid double spaces being treated as single space by browsers. Fixes #2501.
- CHG: Chat: Add handlers to login name and change display name entry fields to recognize and handle pressing enter. Fixes #2472.
- CHG: Chat: Add in tests and forbid blank username. Disable login and name change button when appropriate fields are blank. Fixes #2489.
- CHG: Chat: Change timestamp to monospace font, update its format to consistent length, and place the timestamp before the username in the chat log in order to improve UI readability. Fixes #2501.
- CHG: Chat: Update the 'at bottom of chat scroll' test for autoscrolling to have a small buffer so 'not quite 100% to the bottom' still counts as at bottom. Fixes #2473.
- CHG: Cesium-webrtc: Adds more info out to the console about the current browser for webrtc apps.
- CHG: Cesium-webrtc: Fix the name of the outer most div for the video elements.  It turns out that is you define the something as undefined in the driver options then the value is 'undefined' as a string.
- CHG: Humvee: Change the humvee translationSpeed on interior camera view to match the humvee-lesson and make it easier to explore inside. Fixes #2492.
- CHG: Humvee: Add function to sanitize username to avoid potential inject attacks. Add reaction to enter key presses for the login entry form. Add check to prevent weapons firing for users that have not yet logged in. Fixes #2481.  Fixes #2484.
- CHG: Humvee: Update user score so that it is set correctly when a player reconnects. Refs #2438
- CHG: Humvee: Fix start menu so that rejoin options work correctly. Limit rejoin options so they are only available for tanks of disconnected players. Refs #2438
- CHG: Humvee: Only send updates if a key is being pressed. Refs #2438
- CHG: Humvee Lesson: Verify control value is coming from STOP position on RUN step of humvee-lesson. Fixes #2499.
- CHG: Marbles: Remove solitaire game marbles delayed creation workaround since creating children during initialization is now functional and workaround was acting inconsistent. Fixes #2319.
- CHG: Marbles: Update graphic models in marbles application. References #2311.
- CHG: Marbles: Update artwork in marbles application. References #2311.
- CHG: Marbles: Add new model artwork. Update background to be emissive in order to remove lights added to light background. Remove outdated texture files. References #2311.
- CHG: Marbles: Update the walls model. References #2311.
- CHG: Marbles: Adding further model updates and small bumpScale tweaks. References #2311.
- CHG: Marbles: Integrate updated models. References #2311.
- CHG: Marbles: Add user messaging protocol, and send users messages to inform them that a solitaire game is already occupied if they attempt to join an already occupied solitaire game. Fixes #2319.
- CHG: Minesweeper: Default minesweeper to threejs. Fixes #2529
- CHG: Radio: Play static when squelch drops below 70. Fixes #2503.
- CHG: Radio: Remove preventDefault call and add user-select css properties none to prevent highlighting. Fixes #2245.
- CHG: Radio-Lesson: Remove preventDefault call and add user-select css properties none to prevent highlighting. Fixes #2245.
- CHG: Radio-Lesson: Move prevent highlighting css from radio apps, to index.css for use on all apps. Refs #2245. Fixes #2475.
- CHG: Sandtable: Add new followPath component to factor out common predator code, and update sandtable to use the followPath component for the predators. Remove unused old predator related files. Fixes #2410.
- CHG: Sandtable: Update toolbar size since navigation button was removed. Fixes #2468.

Documentation:
- CHG: Add reference to the transforms example in the appropriate recipes. References #2091.
- CHG: Add instructions to verify WebGL is enabled in the browser. Fixes #2520.
- CHG: Updated page layout and content for Firefox Proxy information. Fixes #2422
- CHG: Update multiuser recipe to reflect changes to multiuser app. fixes #1971

Test Applications:
- NEW: test/czml: Adds a simple application that loads czml into a cesium viewer based vwf application.
- NEW: test/clientNotification: Add sample client notification test. Displays console output when a client joins or leaves. Refs #1274. Refs #2025.
- CHG: test/dirlightPosY: Fix test/dirlightPosY to light actually changes in y axis instead of x. refs #1901

----------------------------------
0.6.12
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

Server: 

- NEW: Create a global `clients.vwf` node and maintain one child per client. The server creates the global node `http://vwf.example.com/clients.vwf` on launch (independent of the application) then adds one child to it for each client connected to the application instance. The child's name is the client's moniker. In the default implementation, neither the `clients.vwf` node nor its children contain any additional data. It is expected that server installations that have user data to share will make that available to the application by creating the nodes with additional behaviors and properties. References #1272.

Client:

- NEW: Client: Implement mouse orbit refs #2258 fixes #2339
- NEW*: API: Add `kernel.deleteChild` to delete a node by name. References #1272.
- NEW*: API: Support annotations on top-level nodes and mark the application. Add a `nodeAnnotation` parameter to `createNode` to allow top-level nodes to be tagged. Interpret the "application" annotation as identifying the root of the application tree. Update the replication data to include the tags. This replaces the previous heuristic of treating the first node created as the application root. References #1272.
- CHG: Client: Set the default value for active to false for the scenejs renderer
- CHG: Client: Add in proper support for threejs nodes with multiple materials.
- CHG: Client: Add in basic bumpScale option to control degree of bump mapping. References #2311.
- CHG: Client: Fix for when findClients returns undefined. Refs #2424.
- CHG: Client: Make spin-on-click only respond to left-clicks. fixes #2339
- CHG: Client: Limit scroll speed to 9 times the translation speed. The idea is that if you scroll backward so far that things get clipped by the far plane or become so small that you can't scroll back in on them, it should only take you three scrolls forward on empty space (3 clicks per scroll) to get back where you were.  This solves the problem where a person can scroll out and get totally lost. fixes #2257
- CHG: Client: Maintain a current list of clients in an application. As each client joins an application instance, a node is created as a child of the "clients" node, which is parallel to the application root node. Add a findClients kernel function, similar to the find function. Whereas the find function finds nodes descending from the application root node, the findClients function finds nodes descending from the clients node.The Users tab of the editor shows a list of all clients in the application instance. A user can choose to login, which will add a displayName property to its client node. This can be seen by drilling down into that client in the editor. Fixes #1951. Fixes #1998. Fixes #1275.
- CHG: Client: Add sourceUrl to node3.transform.set for debugging refs #2259
- CHG: Client: Fix FindChildByName so recursive calls recurse all the way down The next level down was not calling itself recursively so it only ever went down one level refs #2259
- CHG: Client: Change key navigation while orbiting (and disable look and scroll). WS now move the user toward and away from the orbit point. ADQE now orbit the camera laterally around the orbit point. Right-click to rotate camera and scroll are disabled while middle mouse wheel are down. fixes #2258
- CHG: Client: Make ThreeJSPick only return visible objects (ignoring invisible ones) refs #2258
- CHG: Client: Added check when setting navmode to none to release cursor. Fixes #2374.
- CHG: Client: Remove extra assignment of self variable refs #2257
- CHG: Client: Make scroll-to-zoom work in Firefox, too refs #2257
- CHG: Client: Move a "translationSpeed" distance when scrolling over a non-object refs #2257
- CHG: Client: Add error checking to editor.js refs #2257
- CHG: Client: Add scroll-to-zoom navigation in "fly" mode fixes #2257
- CHG: Client: Disable pointer lock when navigation mode is "none". refs #2038
- CHG: Client: Use pointer lock so mouse stays inside window during navigation. fixes #2038

Demonstration Applications: 

- CHG: BZFlag Demo: Clean up bzflag event handlers Refs #2291
- CHG: BZFlag Demo: Fix collision detection between tanks. Clean up references to player objects. Refs #2291
- CHG: BZFlag Demo: Fixes for using particles in threejs Refs #2291
- CHG: BZFlag Demo: Remove navigable behavior Refs #2291
- CHG: BZFlag Demo: Fix threejs bounding box calculations. Standardize bounding box return value to use objects. Refs #2040
- CHG: BZFlag Demo: Change bzflag to use new navigation system Refs #2291
- CHG: BZFlag Demo: Fix ambient color settings for bzflag models Refs #2291
- CHG: Chat Demo: Fix error where heartbeats were being reset to undefined. Fixes #2426.
- CHG: Chat Demo: Added tests for empty usernames to user joined chat message. Fixes #2443.
- CHG: Chat Demo: Add call to fire userDeleted event for manual disconnects. Fixes #2407.
- CHG: Chat Demo: Rename demochat to chat. Fixes #2334.
- CHG: Chat Demo: Rewrite heartbeat mechanism to identify users solely by username to avoid NodeId/View moniker synch issues. Add time tracking to the users collector to try to smooth over and avoid time synch issues. Fixes #2344.
- CHG: Chat Demo: Add vertical align to table cells to keep everything aliged to the top. Fixes #2225.
- CHG: Chat Demo: Set word-wrap style to break-word to deal with super long words/URLs in chat. Fixes #2225.
- CHG: Chat Demo: Fix issue with table rows not being placed in table with conversion to table layout for chat content. Fixes 2210. Fixes 2225.
- CHG: Chat Demo: Fix bugs in javascript date to timestamp string method. Fixes #2332.
- CHG: Chat Demo: Rework chat display to use tables to address multiple display issues. Fixes #2225 Fixes #2210
- CHG: Chat Demo: Add max field length to username entry field. Fixes #2285.
- CHG: Chat Demo: Add max length to user login name input field. Fixes #2317.
- CHG: Chat Demo: Update html so text entry renders properly for firefox. Fixes #2215.
- CHG: Cesium WebRTC Demo: Cesium global needed to be added to the view after the change to the way we load the lib
- CHG: Cesium WebRTC Demo: Set muted='true' for the video elements, chrome stopped supporting just adding muted
- CHG: Cesium WebRTC Demo: Latest version from cesium, switched from the built version to the source version
- CHG: Cesium WebRTC Demo: Update to the driver options: combined a couple of properties into an object
- CHG: Cesium WebRTC Demo: Add the earth to the application definition.
- CHG: Cesium WebRTC Demo: Fix for the uniforms property of a Cesium.Material
- CHG: Cesium WebRTC Demo: Update cesium-webrtc css and html files to adhere to VWF coding standards. Refs #2305.
- CHG: Cesium WebRTC Demo: Use the webrtc drivers default video elements
- CHG: Cesium WebRTC Demo: Calculate the distance to earth and set a reasonable minimum line distance for drawing
- CHG: Cesium WebRTC Demo: Updated the default driver options for webrtc, if videoProperties.create replaces createVideoElements
- CHG: Cesium WebRTC Demo: Use the default camera position
- CHG: Cesium WebRTC Demo: Node variable changed in the view, but was never changed in the model
- CHG: Cesium WebRTC Demo: Delete all polylines and billboards created from the toolbar on Reset
- CHG: Cesium WebRTC Demo: Move the distance calculations to the view( html )
- CHG: Cesium WebRTC Demo: Queue messages until an offer is received, and then process all messages after the offer. Added 'stereo' which can be set in the driver options. Attempted to fix the Firefox feedback issue.
- CHG: Cesium WebRTC Demo: Reset initial camera position when reset button is clicked (cesium-webrtc) Refs #2305.
- CHG: Cesium WebRTC Demo: Add 'yellow' to the named colors in the the color utility. Fixes #2381. Fixes #2378.
- CHG: Cesium WebRTC Demo: Remove circular clear/clearing reference is cesium-webrtc. Refs #2305.
- CHG: Cesium WebRTC Demo: Switch cesium-webrtc toolbar to use bootstrap. Refs #2305.
- CHG: Cesium WebRTC Demo: Add reset/clear capability to cesium-webrtc demo.
- CHG: Cesium WebRTC Demo: Polyline clearing still needs to be added to cesium driver. Refs #2305.
- CHG: Cesium WebRTC Demo: Add delete billboard support to cesium driver. Refs #2305.
- CHG: Cesium WebRTC Demo: Add reset capability for line markup. Still needs deletingNode implemented in cesium driver to remove polyLineCollection objects. Refs #2305.
- CHG: Cesium WebRTC Demo: Add clear functionality for pushpins. Cesium driver still needs to be updated to include deletingNode. Refs #2305.
- CHG: Cesium WebRTC Demo: Replace eraser image with "Reset". Remove circular clear/clearing reference. Refs #2305.
- CHG: Cesium WebRTC Demo: Fix for the mouse event data being passed to the model
- CHG: Cesium WebRTC Demo: Implemented mouse events in the Cesium driver
- CHG: Command Center Demo: command-center optimization, removed computer towers from scene.  ref #2325
- CHG: Command Center Demo: command-center, break out individual chair models.  Fixes #2325
- CHG: Duck Demo: Removed the glgeLight from duck. Fixes #2350.
- CHG: Google Earth Demo: Update so that mouse control of google earth is disabled when the view does not have control of the google-earth (as denoted in the controlView property of the google-earth node). Control is granted to a view when the google-earth is clicked. Fixes #2264.
- CHG: Humvee Demo: Modify humvee emergency brake to respond to only clicks, not drags. Fixes #2276.
- CHG: Humvee-Lesson Demo: Add animation time to emergency brake release control value. Fixes #2345. 
- CHG: Humvee-Lesson Demo: Update camera pose for transmission to make parking break easier to see. Fixes #2276.
- CHG: Marbles Demo: Update to use bump map employed models.
- CHG: Marbles Demo: Update solitaire and selection table prototypes to store marbles under marbles child in order to allow material child to not break logic. References #2333.
- CHG: Marbles Demo: Add selection exit button to selection table panel. Fixes #2403.
- CHG: Marbles Demo: Add skybox and lighting for skybox to marbles. Add bounding box option to navigation system, and add bounding box to marbles. Fixes #2402.
- CHG: Marbles Demo: Update light layout in marbles garden. Fixes #2320.
- CHG: Marbles Demo: Update CSS to hide close button on jQuery dialog. Fixes #2382.
- CHG: Marbles Demo: Manually set html element's overflow-y to hidden to prevent forced vertical scrollbar which was in turn causing the horizontal scrollbar to be required. Fixes #2351.
- CHG: Marbles Demo: Add exit solitaire button to solitaire panel. Fixes #2318.
- CHG: Sandtable Demo: Refactor sandtable methods and scripts. fixes #2259
- CHG: Sandtable Demo: Fix typo in definition of sandtable clear method and remove comment refs #2259
- CHG: Sandtable Demo: Remove toolbar child from sandtable/index.vwf.yaml refs #2259
- CHG: Sandtable Demo: Remove unused properties from sandtable/index.vwf.yaml refs #2259
- CHG: Sandtable Demo: Remove unnecessary type from sandtable/index.vwf.yaml refs #2259
- CHG: Sandtable Demo: Updated sandtable catalog description refs #2259
- CHG: Sandtable Demo: Remove some unnecessary files from sandtable app refs #2259
- CHG: Sandtable Demo: Move sandtable app to new navigation system. In the process, remove the orbit mode from sandtable toolbar since the user will now be able to navigate in all the input modes refs #2259
- CHG: Sandtable Demo: Change sandtable to only draw and drop pins on left mouse click Also, moved logic of when to start and stop drawing to view side so two users can draw at the same time w/o having to share a line refs #2259
- CHG: Sandtable Demo: Simplify sandtable app to use on inputMode property. Previously, the app had a mouseMode property and the toolbar had an inputMode property that had to stay in sync refs #2259
- CHG: Sandtable Demo: Merge sandtable/appscene.vwf.yaml into sandtable/index.vwf.yaml refs #2259

Test Applications:
- CHG: Test IntialRot: Move camera closer to duck in InitialRot/index.vwf.yaml As it was, the camera was so far away that the duck was past its far clip plane. refs #2258
- CHG: Test materialColor: Define counter as property so it synchs between views. Fixes #2327.

----------------------------------
0.6.11
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

Server Changes

- CHG: Server: Don't rewrite times when forwarding the pending client messages. They were stamped with the correct times when they were added to the queue. Connected clients received them with those times, so clients that are connecting should receive them the same way.
- CHG: Server: Use reflector client ids instead of Ruby object ids in log messages.
- CHG: Server: Do not remove pending clients from list when we log them refs #2182
- CHG: Server: Watch for new async actions started during an async action and resolve. Async operations need to complete in a consistent manner in order for the replication computation to work correctly across multiple clients.If a queue action starts one more more async operations, the operations need to complete before the next queue item is started. And they need to complete in the same order they were started. If an async action starts other async actions, the outer action shouldn't complete until the inner actions have completed. For example, if a node's `initiailze` calls `node.children.create`, wait for the child node to finish initializing before allowing the parent node to complete. Fixes #2137.
- CHG: Server: Switch `/* ( p1, p2 ) */` callback comment notation to `/* p1, p2 */`.
- CHG: Server: Move the test utility functions to a shared utility module.
- CHG: Server: Fix test/replication.html, broken in commit:aa0849b.
- CHG: Server: Send setState only to new joiners, not to everyone refs #2182
- CHG: Server: Use the minified client in production mode when available.
- CHG: Server: Add nil check for request.env["HTTP USER AGENT"] in ruby browser check. Refs #2076.
- CHG: Server: Add unsupported browser documentation page, and a redirect to it in the ruby code if a user launches a demo in IE8. Fixes #2076.
- CHG: Server: Use `setState`+`createNode` to launch since `setState` resets the queue. Fixes #2207. References #2122, #2106, #2167.
- CHG: Server: Update build_redhat.sh. Removed the call to turn off IPTables, and updated the note to the system administrator to allow port 80 traffic. Fixes #1617
- CHG: Server: Added information to use WinZip, WinRAR, or 7-Zip to unzip a package from the downloads page. Also fixed up numbering issues, cleaned up layout, and general other housekeeping items to cleanup the page.  fixes #2050
- CHG: Server: Repaired issue of catalog page auto deleting after first build. Fixes #2065
- CHG: Server: Updated the Rakefile to remove HTML files autogenerated from a previous build.  Fixes #2065
- CHG: Server: Update component Rakefile to build docs for child directories of vwf.example.com and update doc syntax to properly display. Fixes #1779 and fixes #1629.
- CHG: Server: Schedule future actions in front of reflector actions at the same time. Previously, if future and reflector actions were placed in the message queue with the same execution time, they would be arranged in order of arrival. But this would leave the queue in an indeterminate state. Since reflector messages arrive at different clients at different times, clients wouldn't order these sequences consistently. Additionally, it's probably expected that when an action generates a future action at delta time 0, the new action will run before a new external action executes--even if an external action for the current time has already arrived. Now, the message queue is sorted first by time, as before, then by origin to place future actions in front of reflector actions, then by arrival order, as before. This ensures that a sequence of future
actions, including one that generates new actions for the same time, will always run to completion before a reflector action executes, regardless of whether the external action arrives before, during or after the sequence starts executing. Fixes #2123.
- CHG: Server: Don't remove reflector messages in `setState` sent after the action. When updating the message queue to match the incoming specification, `setState` previously cleared the queue except for messages with a `respond` field. But that would delete messages sent after the `setState` that arrived before it finished executing. Those messages apply to the new state and should be retained. The correct process is to delete all future messages, including any generated during the `setState` since the incoming queue contains the correct messages for the new state, delete any reflector messages that arrived before the `setState` but were scheduled to execute at a later
time, but retain any reflector messages that arrived after the `setState`. Fixes #2122.

Client Changes

- CHG: Client: Fix bug w/ malformed pointerUp messages
- CHG: Client: Check for when pointerDownID is null and do not send the pointerUp event fixes #2243
- CHG: Client: Stop key-based movement when window goes out of focus. Key presses are going somewhere else when that happens. This fixes the bug where if a user pressed a key and then clicked on another window, the app would not register the key-up event and the user would continue to move w/o the key being down. fixes #366
- CHG: Client: Remove code to detect button states onmouseover that is obsolete. It didn't work anyway, but is made unnecessary by the fix that uses document.onmouseup to catch mouse-up events outside the window. refs #366
- CHG: Client: Listen for onmouseup on document instead of canvas. document will catch mouseup events that occur outside the window and fixes the bug where the app would think the mouse button was still down if the user moused-up outside the window and then re-entered refs #366
- CHG: Client: Add support for setting setting fps, start and stop frames to the animation behavior. Fixes #2250
- CHG: Client: Add support for making a user's own avatar invisible to himself. refs #2180
- CHG: Client: Add property to scene to make avatars invisible to their user. fixes #2180
- CHG: Client: Add comment about assumption in navscene.vwf.yaml refs #2265
- CHG: Client: Remove camera creation from GLGE model driver. It is now created in scene.vwf. refs #2265
- CHG: Client: Add debug code to find issue w/ navigation hopping and skipping. refs #2182
- CHG: Client: Replace vwf references in lesson view driver. Fixes #2097.
- CHG: Client: Add error checking for cameraNode to be null in view/threejs.js refs #2252
- CHG: Client: Separate disabling of view side nav from setting navscene nav. Disabling the view-side nav only needs to happen once, but setting the navscene nav might happen many times. refs #2252
- CHG: Client: Do not assign backup camera is activeCamera does not yet exist. This was leading to second clients having a prototype camera set as the one they were looking through (which made it unresponsive) - this was first seen in the tutorial apps. refs #2252
- CHG: Client: Update tutorials to initialize camera properties in a future call. refs #2252
- CHG: Client: Have navscene.vwf.yaml automatically disable view-side navigation. refs #2252
- CHG: Client: Move initialization of navscene navigation mode to future call. For now, we cannot assume that the camera has already been created in initialize - so we must wait until the queue resumes to know that it is there.  This will change once initialize waits for all nodes created inside it to complete before being done refs #2252
- CHG: Client: Update nodeHasOwnChild to manually loop over children to check the names, if the child name is numeric. Refs #2085
- CHG: Client: Update sourceURLs refs #2252
- CHG: Client: Update threeObject matrixWorld before using it in nodeLookAt. Was causing the sandtable camera position not to update. refs #2252
- CHG: Client: Explicitly set animation start and stop time in the node3 animation functions, so that the stop time is correct if the functions are called more than once. Refs #1953
- CHG: Client: Fix null reference exception in nodeLookAt. refs #2019
- CHG: Client: Fix bug where view was ignoring transform updates on own navObject. refs #2019
- CHG: Client: Expose translationSpeed and rotationSpeed in navigable.vwf.yaml. fixes #2197
- CHG: Client: Fix bug where "self" was being used locally and resetting global. refs #1972
- CHG: Client: Remove hard-coded node id from scene.vwf.yaml. refs #2186
- CHG: Client: Fix lookat. refs #2019
- CHG: Client: Remove extra newline from navigable.vwf.yaml. refs #2019
- CHG: Client: Remove code that sets view camera from the model. This is now exclusively done in controlNavObject(). Also, put some checks in for when node is null. fixes #2088
- CHG: Client: Add check for node being null in receiveModelTransformChanges. Also add some comments and rearrange some logic to make it more clear and efficient. refs #2019
- CHG: Client: Fix bug where user could not navigate w/ mouse keys. We were not always updating the three.js world matrix of the navigation object (and therefore, its children were not getting updated). refs #2027
- CHG: Client: Fix could not move navObject w/ mouse or keys. The three.js objects were auto-updating their matrices from their position and orientation values, overwriting the matrix that we had set. refs #2027
- CHG: Client: Fix camera coming in w/ unexpected 90 degree rotation on it. If a camera was a child of the navObject, but not the main navObject, its model and view transforms were not properly separated.  This checkin separates those transforms for all node3s, and fixes a bug where initial transforms were not properly being adopted on initializeProperty. refs #2027
- CHG: Client: Have second user create his own navigable object. fixes #1969. 
- CHG: Client: Change error messages to use errorx for extra context information. refs #2019
- CHG: Client: Add error checking to object driver. refs #2027
- CHG: Client: Resolve merge conflicts from rebase of navigation onto development. refs #2027
- CHG: Client: Add userObject property to scene.vwf.yaml for independent navigation. This object describes what will be created for each user as their "user object".  It usually includes a camera and an avatar in some configuration refs #1969
- CHG: Client: Do not look for children before they're attached (in controlNavObject). refs #1969
- CHG: Client: Remove trace code from navigation code in threejs.js view driver. refs #2019
- CHG: Client: Fix bug where second user would not always sync to scene.vwf.yaml. I was updating the view transform in satProperty, but not in initializedProperty, so the view was staying out of sync until the next set came through Also includes changes to allow the application to specify a navigation object that the user will be given control of. Also fixed a bug where the pointerOut event was being thrown on an undefined node fixes #1963 refs #1969
- CHG: Client: Remove properties from camera component that refer to navigation refs #1963
- CHG: Client: Make key presses control navObject position, not camera position directly refs #1963
- CHG: Client: Remove 90 degree unrotation from camera getProperty that is no longer needed refs #1963
- CHG: Client: Add check for non-existant node to core "nodeHasProperty" method refs #1963
- CHG: Client: Handle incoming transform requests from reflector (in threejs view driver)
- CHG: Client: Check mouse state onmouseover so we stay synched w/ mouse state refs #1960
- CHG: Client: Create camera dynamically in scene.vwf.yaml when appropriate. It was added as a child in the .yaml, but since children are not inherited from prototypes, the application did not get the child camera.  Now it is created dynamically in initialize if the usersShareView property is set to true (otherwise users will create their own "navigable" object) fixes #1970
- CHG: Client: Make viewTransform copy values, not reference to model transform. The viewTransform was copying the reference, so every time the model changed, it would clobber the view transform. refs #1960
- CHG: Client: Constrain camera pitch to +/- 90 degrees refs #1960
- CHG: Client: Navigation refactoring continued. Put camera in scene.vwf and removed default camera creation from Threejs model driver.  Required a callback workaround in the Threejs view driver that can be removed once the kernel implements the creatChild callback.
- CHG: Client: Allow user to change camera orientation w/ right-click and drag refs #1960
- CHG: Client: Hide right-click context menu when navigating refs #1960
- CHG: Client: Fix bug where pressing two mouse buttons would cause bad things. refs #1960
- CHG: Client: Remove unnecessary consoleOut refs #2019
- CHG: Client: Remove reference to kernel.kernel in view/threejs.js refs #2019
- CHG: Client: Add camera to scene.vwf.yaml, ref #1914
- CHG: Client: Sync navigation updates to render refs #1973. Move camera translation from navscene.vwf.yaml into view/threejs.js refs #1973.
- CHG: Client: Fix timeout call for navigation move and rotate (make it every 16 ms) refs #1973
- CHG: Client: Improve temporary navigation fixes #1973
- CHG: Client: Hide camera z-to-y-up transform from the user in model/threejs.js fixes #1955,#1956,#1957
- CHG: Client: Correctly set the view camera and render from it. fixes #1880, 1955, 1956, 1957
- CHG: Client: Remove frameCount property from sceneNode in threejs.js view driver. This was used to make sure we were render safe in GLGE, but is unnecessary in three.js - refs #1879
- CHG: Client: Added navigable.vwf.yaml behavior component
- CHG: Client: Add optional start and stopTime parameters to animationPlay method Refs #1953
- CHG: Client: Added animationStartTime and animationStopTime to allow playing subsections of an animation time line Fixes #1953
- CHG: Client: For animations loaded from the collada file, automatically calculate the animationDuration Refs #2172
- CHG: Client: Update collada loader to use the collada ID as the threejs ID to fix a bug in loading the animations Refs #2172
- CHG: Client: Add references to animations on the node that is animated, so that the animation can be played separately. Refs #2172
- CHG: Client: Add support for bump maps to the ColladaLoader Fixes #2116
- CHG: Client: Fix error in navigation distance calculation when elapsed time is 0
- CHG: Client: Add preventDefault calls in mouse event handlers to prevent the drag image behavior in the canvas Fixes #2108
- CHG: Client: Fixes the transformTo test but broken by #2122 fix.  Redmine #2106
- CHG: Client: Rakefile update to modify run.bat to check for file path whitespace and stop the script if it detects it.  This is a workaround until Bundler/Thin determine the error in their systems causing the whitespace issue. Submitted Ticket on GitHub for their issue: https://github.com/macournoyer/thin/issues/180   fixes #1535
- CHG: Client: Sequence counter reset to 0 when patched with no sequence field. Fixes #2138.
- CHG: Client: Stopped the Editor from listing prototype children until the children inherit from the prototype. Redmine #2032
- CHG: Client: Editor updates navigation properties correctly.  Specific to camera/navigation at 200ms update rate.  Redmine Task: 1626

Demonstration Application Changes

- CHG: All: Update GLGE apps to initialize camera properties in future call. Temporarily necessary because the camera is not yet created in initialize() - a fix is coming along that will make it so that the camera is created and ready in initialize at which point this madness will no longer be necessary  ;o) fixes #2265,#2281
- CHG: All: Rename "sharedCamera" to "camera". This is more appropriate since the camera itself might be shared at some points and not at others. refs #2186
- CHG: All: Update three.js apps in public to use new navigation system 
- CHG: BZFlag Demo: Performance improvements for bzflag. Refs #2124
- CHG: BZFlag Demo: Standardize names used in bzflag chat messages. Fixes #2256
- CHG: BZFlag Demo: Fix children with numeric names so that they get shortcut properties on the parent node  Fixes #2085
- NEW: cesiumTerrain Demo: Added cesiumTerrain demo
- CHG: Command Center Demo: Resolved a 'DAE' case issue in command-center.  Fixes #2253.
- CHG: Command Center Demo: Command-center: changed front left screen from video to png.  Redmine #2111
- CHG: DemoChat Demo: Update link addition to make links open in new window. References #2224.
- CHG: DemoChat Demo: Added check to turn www and http: in messages to links. Fixes #2224.
- CHG: DemoChat Demo: Add automatic scrolling. Fixes #2296.
- CHG: DemoChat Demo: Add in max field length and restrict to alphanumerics. Fixes #2213. Fixes #2212. Fixes #2211.
- CHG: DemoChat Demo: Move demochat to main public and add catalog image and description. Fixes #2206.
- CHG: DemoChat Demo: Added colorpicker widget. Fixes #2195.
- CHG: DemoChat Demo: Addresses user connection issues.  Addresses #2168.
- CHG: DemoChat Demo: Updated heartbeat and events. Tests for user node presence before issuing a heartbeat. Post heartbeat now results in verification that user is correctly correlated with view. Shift from custom events with additional data to using default events and view storing username/user color lookup. Added debug function that can be manually invoked, and automatically is invoked when oddities occur. Displays view side user information as well as causes all attached users models to provide similar information. Fixes #2168
- CHG: DemoChat Demo: Initial update. Heartbeat still unchanged, but login now uses vwf_view.kernel.moniker comparison to client that issued event in order to simplify identifying user/view pairs. Fixes #2168
- CHG: DemoChat Demo: Update the name search regexp so that all lowercase versions of usernames (for that matter, case insensitive matches) prompt alert sounds. fixes #2194
- CHG: DemoChat Demo: Update for minor appearance tweaks. Date format was already handled when the datestamp/username 'column' was added. Turned off text area resizing for the chat input box. Added HTML escaping functionality to the user messaging system, so posting HTML to the chat should display properly and not be interpreted as HTML. fixes #2196
- CHG: DemoChat Demo: Adjust the width of the timestamp column. Make certain all system messages also use the new column type layout. fixes #2140
- CHG: DemoChat Demo: Adjust chat display so that timestamp and username are in a defined 'column' separate from the actual chat messages to improve readability. May need to tweak exact width later. fixes #2140
- CHG: DemoChat Demo: Update the CSS definition of the chat content so that the text scrolling is available, and text doesn't overflow the div. #2145
- CHG: Marbles Demo: Implement basic selection mechanism. Fixes #2052.
- CHG: Marbles Demo: Implements workaround for bug. Fixes #2288.
- CHG: Marbles Demo: Update user model to use new functionality. Fixes #2270. Fixes #2271.
- CHG: Marbles Demo: Update models and new environment. Fixes #2054.
- CHG: Marbles Demo: Implement Solitaire Viewpoint Control. Fixes #2192.
- NEW: Marbles Demo: Check in initial marbles application with solitaire game functionality.
- CHG: Physics Demo: Increase translation speed in physics/index.vwf.yaml fixes #2266
- CHG: Physics Demo: Tidy code in physics/index.vwf.yaml Moved scripts section of physics/index.vwf.yaml to end of document refs #1960
- CHG: Plane Demo: Clean up vestigial properties in plane app. refs #2252
- CHG: Radio Demo: Update radio to use the animation behavior. Refs #2172
- CHG: Radio Lesson Demo: Update radio lesson squelch check and removed extra conditional comments. Fixes #2230.
- CHG: Radio Lesson Demo: In radio-lesson, do not proceed to the next lesson step until the user has correctly satisfied the previous task.  Fixes #2128
- CHG: Radio Lesson Demo: Adds checks to radio-lesson for out of sequence user selection.  Resolves lesson out of sync issue.  Fixes #2128.
- CHG: Sandtable Demo: Do not set view side navigation mode in sandtable (done in navscene). refs #2252
- CHG: Sandtable Demo: Move initialization of mouse mode to future call. For now, we cannot assume that the camera has already been created in initialize - so we must wait until the queue resumes to know that it is there.  This will change once initialize waits for all nodes created inside it to complete before being done. refs #2252
- CHG: Sandtable Demo: Disable view-side navigation in sandtable so navscene can do it. Leaving this app using navscene until the view-side navigation has an middle-mouse button orbit. refs #2252
- CHG: Sandtable Demo: Switched sandtable background color to a more pleasing blue. refs #2252
- CHG: Sandtable Demo: Fix bug where sandtable was not showing up. Known issues: View does not sync between users, and left-click to drag the sandtable does not work. refs #2252
- CHG: Sandtable Demo: Fix error in navigation distance calculation when scrolling the mouse wheel Refs #2108
- CHG: Test All: Update test apps to use new navigation system. refs #1972
- NEW: Test Polygon: Implemented a polygon component and wrote a test application
- CHG: Test Polyline: Fixed the agi/test/polyline application.  PolyLines and Materials now working
- CHG: Test TransformTo: Update the UI to expected approach. Fixes #2053.
- CHG: Test TransformTo: Cleaned up transformTo test, pulled toleranceTest method out of initialize based on Eric's recommendation.
- CHG: Test JQuery: Remove `jquery-encoder` tests. We don't need to run third-party library tests.
- CHG: Test Replication: Fix test/replication.html to expect replicated random internal state.
- CHG: Test WorldTrasnform: test/worldTransform determined to no longer be applicable.  Removed.  Redmine #1932
- CHG: Tutorials: Consolidated two "methods" objects in scripting tutorial app. refs #2281
- CHG: Tutorials: Comply w/ coding standard for spacing in tutorial app. refs #2252
- CHG: Tutorials: Increase translationSpeed in multiuser/index.vwf.yaml. refs #2197
- CHG: Webrtc-Cesium Demo: Load czml from the widget, needs the latest version of Cesium
- CHG: Webrtc-Cesium Demo: Removed resize hack, cesium is now fixed
- CHG: Webrtc-Cesium Demo: Added the camera navigation control flags into the cesium component, and fixed an issue dealing with setting a property to false
- CHG: Webrtc-Cesium Demo: Fixed issue with the Sun, and made sure to reference the existing sun, atmosphere, and sky box
- CHG: Webrtc-Cesium Demo: Fixed camera synchronization that the previous push broke. Updated driver options for selecting the type of Cesium root object ( manual Scene creation use( any string ), CesiumWidget use( 'widget' ),  Cesium.Viewer use( 'viewer' ) )
- CHG: Webrtc-Cesium Demo: Latest minified version of Cesium
- CHG: Webrtc-Cesium Demo: Removed debugger command
- NEW: Webrtc-Cesium Demo: Toolbar support for modes and color of the drawing
- NEW: Webrtc-Cesium Demo: New files for the toolbar
- CHG: Webrtc-Cesium Demo: Updated the variable name for the cesium object for each node
- CHG: Webrtc-Cesium Demo: Fixed the polylines so that they show up now, added a material component
- CHG: Webrtc-Cesium Demo: Added support for polyline, polygon, and dynamicObjects
- CHG: Webrtc-Cesium Demo: Fixed an issue resetting the terrainProvider property
- CHG: Webrtc-Cesium Demo: Move the main video to the top of the view
- CHG: Webrtc-Cesium Demo: Fixed an issue with the client colors being incorrect
- CHG: Webrtc-Cesium Demo: Increase the size of the video in the background( large video )
- CHG: Webrtc-Cesium Demo: Fixed the path to the cesium logo
- CHG: Webrtc-Cesium Demo: Updated the path to match case of the path on the server
- CHG: Webrtc-Cesium Demo: Implemented the transform property and fixed issues setting the camera'a frustum member properties
- CHG: Webrtc-Cesium Demo: Implemented translateTo and translateBy
- CHG: Webrtc-Cesium Demo: Remember the original location for the camera so that can be reset
- CHG: Webrtc-Cesium Demo: Added a initial position to move the earth down in the view
- CHG: Webrtc-Cesium Demo: Added camera synchronization, fixes #2217
- CHG: Webrtc-Cesium Demo: Added the camera component for each cesium application
- CHG: Webrtc-Cesium Demo: Double the resize delay frame count, fixes #2118
- CHG: Webrtc-Cesium Demo: Bug fix: Added the check for webgl to the cesium model driver fixes #2142 and #2143
- CHG: Webrtc-Cesium Demo: Bug fix for the wrong aspect ratio on start up fixes #2118
- CHG: Webrtc-Cesium Demo: Fixed more vwf side properties due to API changes in the latest cesium
- CHG: Webrtc-Cesium Demo: Fixed the renderStyle setting due to the latest cesium API changes
- CHG: Webrtc-Cesium Demo: Updated with the latest version of cesium, context options are now available to the CesiumWidget, which was the modification I had made to cesium
- CHG: Webrtc-Cesium Demo: Fixed an issue where all clients where checking the location of a new client locally, so new clients would end up at the host client location
- CHG: Webrtc-Cesium Demo: A minified build from the latest of cesium from github, which include the ability to pass in the canvas options into the CesiumWidget

Documentation Changes 

- CHG: Documentation: Update sandtable tutorial to reflect some navigation changes. This will need further updating when we move the sandtable app away from using navscene altogether. refs #2252
- CHG: Documentation: Update rgb color format of hello world material to properly toggle colors. Fixes #2244.
- CHG: Documentation: Update example apps to use new navigation system. fixes #1972
- CHG: Documentation: Update multiuser app to use new navigation system. fixes #2027
- CHG: Documentation: Update the FAQ page to remove TBDs and outdated information. Fixes #1982.
- CHG: Documentation: Update kernel api links. Fixes #2067.
- CHG: Documentation: Update the cookbook index page to give a description of the cookbook. Fixes #2113.
- CHG: Documentation: Updated grey text to be much lighter and changed links to be blue to differentiate from regular text. Refs #1922
- CHG: Documentation: Updated documentation to reflect kernel.createChild() callback is not currently supported.  Redmine #2023
- CHG: Documentation: Adjusted Blue for links to match alert-info blue. refs #1922
- CHG: Documentation: Updating WebGL to the WebGL logo. Fixes #2064
- CHG: Documentation: Remove static ID references from HTML overlay documentation. Fixes #1780.
- CHG: Documentation: Updated Browser Requirements from Tested and Support Browser versions.  Added notes about IE10 limited support, and potential IE11 WebGL support.  Fixes #2069





----------------------------------
0.6.10
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- NEW: Apple Macintosh OSX installation script and README.md updated. Fixes #1903
- CHG: Added source url name to help someone understand where the script is attached to
- CHG: Removed the test/planeMaterial application, test/nodeMaterial is working and does the same thing
- CHG: Removed material being used as a property( it's a child/component), and fixed test/nodeMaterial
- CHG: Fixed copy paste error dealing with getting the camera's world position
- CHG: Remove duplicate code from persistence by passing in an extension parameter. Refs #1810.
- CHG: Update persistence functionality to save current running state into a configuration file, including browser title, model and view drivers and as well as associated parameters. Fixes #1810.
- CHG: Fix bug in threejs ColladaLoader to allow multi materials to load correctly. Fix ambient color issues in minesweeper, test/axes and test/transformTo Fixes #1902, #1923
- CHG: Reduce the camera rotation rate to make the scene easier to navigate.
- CHG: Increase navigation updates from 10 to 30 fps. This is the maximum update rate. Time increments are still controlled by the server which currently defaults to 20 fps. Change the value in `schedule_tick` in `vwf/application/reflector.rb` to adjust.
- CHG: Add support for using animations from the collada model in threejs.js Refs #1867, #1953
- CHG: Split out Rakefile task for a new web task, updates the default to build a full build, and removes the web from the rake build command. Going forward: bundle exec rake - main default build that compiles everything and needs to be executed at least once to serve the website. bundle exec rake build - can be used to compile only the server components. fixes #1966
- CHG: Load index.vwf.config.yaml if a config file matching the name of the application is not present. Fixes #1810.
- CHG: Rewrote JQuery accordion to allow multiple hide/shows at once.  Added Expand All/Collapse All feature to top right.  Fixes #1543
- CHG: Fixed the handling of getting color properties when the alpha = 0
- CHG: Add new driver config option "experimental-disable-inputs", that keeps mouse and keyboard events from being mapped in the GLGE and threejs view drivers Fixes #1948
- CHG: Remove unnecessary setMaterialAmbients function. Refs #1873
- CHG: Remove requestAnimationFrame, since it is now in a separate javascript file. Refs #1322
- CHG: Updated hmmwv-touch to use the humvee component, and updated it's lighting to match that application. Fixes #1925.
- CHG: Converted .psd and .tga files to .png. Fixes #1909.
- CHG: Fix setClearColor call to pass in the hex representation of the colors. Refs #1928
- CHG: Installation documentation has been modified such that issues are now resolved, or OBE from earlier iterations. Fixes #100
- CHG: Renamed vcte to command-center. Fixes #1949.
- CHG: Updating 2D interface cookbook recipe to include information on setting the title and favicon of an application. Refs #1360.
- CHG: Add info/title config option. Updated duck application to use favicon and title option. Fixes #1360.
- CHG: Remove catalog files for simple and similar applications. Renamed catalog files for adl humvee until the application is working. Fixes #1950.
- CHG: Set humvee ground texture (LM logo) visible property to false for lesson.
- CHG: Update Installation Instructions to contain Java install.
- CHG: Change sandtable to use threejs by default Refs #2087
- CHG: Change emissive to ambient in CreateMesh material. Refs #1889
- NEW: Added nodes to test the new threejs primitives
- NEW: Added double sided to the createMesh in the threejs driver
- CHG: Cesium Version 17 just released
- CHG: Fix for the muted property on the local video
- CHG: Fixed firefox crash due to call to chrome only webkit
- CHG: Added features via properties to the cesium driver
- CHG: Remove unneeded properties that cause an animationUpdate to be called before the nodes are fully initialized. Fixes #2096 Update webrtc.js
- CHG: Fixed this reference that was the wrong object
- CHG: Fix ColladaLoader to assign specular maps to the specularMap property instead of overwriting the map property. Refs #2092
- CHG: Updated the agi/cesium application to use the new driver options
- CHG: Updated the cesium-webrtc application to use the new driver options
- CHG: Updated the webrtc application to use the new driver options
- NEW: Created options for the cesium driver
- NEW: Created options of the webrtc driver
- CHG: Moved the cesium lib into the vwf/view/cesium folder
- CHG: Fixed the video canvases z-index, now on top of cesium
- CHG: Fix load order dependencies in lesson.js view driver. Lesson driver depended on children to be added in the order that they are defined.  Now that children load in parallel, that is not always true (and it broke the humvee lesson) fixes #2084
- NEW: Added the cesium-webrtc application
- NEW: Initial checkin of a new demochat example app to serve as an example of the chat and sound recipes.
- CHG: Update to the transforms example app in order to match coding standard and make changes recommended in code review.
- CHG: Fix degree to radian conversion
- CHG: Uncomment out getting velocity property to fix issues when new clients join an app using physics. Fixes #1111
- CHG: Updated the cesium application with version r16
- CHG: Remove axes in the threejs driver, since not every app would want them. Fixes #1696
- CHG: Add stack depth tests. References #2035.
- CHG: Don't suspend the queue when `createChild` doesn't have a callback. References #2035.
- CHG: Ensure async breaks occur before and after each createChild(). Keeps the stack from growing from node to node while createChild() recursively traverses a component. The break at the beginning protects the way down, and the break at the end protects the way up. References #2035.
- CHG: Collapse async.series sequences of length 1. References #2035.
- CHG: Merge async.series operations without an async mode with those that do. Some intermediate steps in async.series sequences always completed synchronously and didn't actually need async support. Sequences were arranged that way for clarity, but having unnecessary steps in a series sequence is expensive on the stack. These steps have been merged down into the following async step, or merged into the completion function when they were at the end of the sequence. References #2035.
- CHG: Undo log calls commented out in commit:64cd0fe.
- CHG: Add new transforms example under public/web/example. The example is designed to demonstrate the lessons taught in the 2D Interface and Transforms cookbook instructions.
- CHG: Update Gemfile. Minor improvements to OS X build script. Specify the patch level for ruby to match the Rakefile. Defaulting to homebrew and trimming down the RVM calls. Set autolibs to use homebrew. Removed the rvm reload, as the source call on line 23 is the recommended way to reload after an installation
- CHG: Removed the second autolibs line, as it is a repeat of the option passed on line 22
- CHG: Remove material from the cube and sphere, so that GLGE won't cache it and reuse it Fixes #1813
- CHG: Fixed issue in the utility/color.js when with RGBA definitions
- CHG: Modified for loop to use previously defined length
- CHG: Moved the @sourceURL ref in OSX installation script.
- CHG: Whitespace removal from color string definitions - the utility/color.js should handle the white space removal
- CHG: Remove unused timer that is incompatible w/ Firefox. Fixes #2033
- CHG: Change radio buttons to momentary controls
- CHG: Remove lines to implement animation behavior, since that is now done by node3. Refs #1716
- CHG: Move node3 animations to the new animation behavior. Update node3 to implement animation behavior by default. Refs #1716, #1776




----------------------------------
0.6.9
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.
- CHG: Moved stopped static on squelch to radio component. Fixes #1933.
- CHG: Update multiuser.md to reflect clarifying change to example app refs #1711
- CHG: Add variables to multiuser example app to make code clearer refs #1711
- CHG: Remove url switches from catalog for physics and xmas-tree refs #1724
- CHG: Fix setClearColor call to pass in the hex representation of the colors Refs #1928
- CHG: Fix bugs in test/createDelete/index.vwf.yaml refs #1928
- CHG: Add negative scale fixes to three.js r58 fixes #1928
- CHG: Initial commit of three.js r58 refs #1928
- CHG: Switch xmas-tree to use three.js by default fixes #1872
- CHG: Default tile-puzzle to use three.js refs #1872
- CHG: Switch physics to use three.js by default refs #1724
- CHG: Remove deprecated matrix function calls fixes #1871
- CHG: Put a check in control for undefined positions
- CHG: Also switched hmmwv-touch/index.vwf.yaml to use control-old since it hadn't been updated, yet. refs #1872
- CHG: Replace deprecated THREE.UV with THREE.Vector2 refs #1871
- CHG: Fix parameter to renderer.setFaceCulling We had been passing "false" when it expected an enumerated value that specified the culling mode - the result was that it was culling both front and back faces ... which for obvious reasons was undesirable fixes #1870
- CHG: Add negative scale fixes to new three.js and remove deprecated calls refs #1683, 1870, 1871
- CHG: Initial commit of three.js r57 refs #1683
- CHG: Remove the `hash uri => id...?` comment since there is no performance issue.
- CHG: Give the child index priority when the name looks like a number.
- CHG: Keep child array order consistent with the child list in the component. Closes #1918.
- CHG: Establish the parent/child relationship before calling `creatingNode`. Fixes #1894.
- CHG: Add @function tags and callback types. Parameters weren't being rendered since JSDoc didn't know they were functions.
- CHG: Replace `childURI` with `childIndex` and expand initializingNode. References #1918.
- CHG: Delegate `node.uri` to the kernel. Make `node.id` read-only. References #1918.
- CHG: Add the `childURI` parameter.
- CHG: Clarify the action-considered-performed comments.
- CHG: Fix an "index-vwf" reference. This is a follow-on change from commit:184f459 now needed after the branch/threejs merge to development. Also see commit:ef1bbcf.
- CHG: Fix error in query.md refs #1711
- CHG: Fix ambient colors in collada models Refs #1873
- CHG: Update threejs drivers to store backgroundProperty and enableShadows until the renderer is ready. Change default backgroundColor. Refs #1873
- CHG: Fix ambient colors in collada models Refs #1873
- CHG: Remove setMaterialAmbients function Refs #1873
- CHG: Correct lesson UI driver to call next on the current task instead of the top level task. Update humvee and radio lessons to reset control behavior and node positions on start. Fixes #1799.
- CHG: Update radio.vwf to use new control behaviors. Updated html static sound to account for volume parameter. Fixed lesson bug on volume. Fixes #1817.
- CHG: Declare the Ruby 1.9 requirement. References #1742, #1878.
- CHG: Added a check for undefined before inserting the 'scripts'
- CHG: Use a simple translation instead of a rotated and translated transform.
- CHG: Use .DAE extensions until lower case extension issue can be resolved.
- CHG: Update radio.dae reference to lower case.
- CHG: Update humvee-lesson to reuse humvee component in public/humvee. Fixes #1886.
- CHG: Update radio lesson to reference radio component in public/radio and remove extraneous files. Refs #1886.
- CHG: Only check for socket.io WebSockets when socket.io is available. Tests don't load socket.io, for example.
- CHG: Use the `Location` `href` instead of the object as the random seed. It should have been that way from the start, but specifically, in IE the `Location` object doesn't survive `jQuery.extend` in a form that can have `toString` called on it.
- CHG: Update radio components from radio and radio-lesson application to match. Fix bug in lesson view driver for allowing applications not named index. Refs #1886.
- CHG: Prevent the jsdoc filter from generating a comment closing its own block. `/////...` was being converted to '/**//...' and causing a syntax error. Now, any `*/` sequence in the resulting comment is converted to `* /`. Also, only comment lines starting with exactly three slashes are considered to be jsdoc comments. For ruby-style comments in YAML files, jsdoc blocks must start with exactly two hash characters. Closes #1874, #1884.
PhantomJS integration of gem into baseline refs #1595
- NEW: Add 2D tile puzzle app. Fixes #207
- CHG: Fix config files to handle drivers it doesn't know about without failing. Refs #1850
- CHG: Update driver config to handle drivers it doesn't know about without failing. Move browser compatibility checks into the kernel and drivers, so that they are only performed if they are needed for the application. Fixes #1850, #1853
- CHG: Break radio lesson application into lesson and radio components. Refs #1817, #1842.
- CHG: pdate multiuser.md to reflect comments in code refs #1711
- CHG: Simplify multiuser example app code and add explanatory comments
- CHG: Fix lighting in multiuser/index.vwf.yaml refs #1711
- CHG: Add new radio lesson sound to alleviate issues with the HTML5 audio tag. Fixes #1783.
- CHG: Allow user to rotate in multiuser app
- CHG: Add info about Alt+click to simulation.md and resize image fixes #1818
- CHG: Update multiuser.md to match multiuser example app fixes #1711
- CHG: Update lesson recipe with information about multiple levels of tasks. Fixes #1828.
- NEW: Add beginning of multiuser example app
- NEW: Added radio static audio loop to radio-lesson app






----------------------------------
0.6.8
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- CHG: Make `lookAt` readable.
- NEW: Add config file to hmmwv-touch to default to glge.
- NEW: Add lights to example apps and fix yaml parsing errors
- NEW: Add config file to agi/cesium app so it uses cesium view driver
- CHG: Update simulation recipe
- CHG: Remove GLGE phantom nodes and update screenshot to current rendering fixes #1803
- CHG: VCTE Demo: Reduced video size
- CHG: Created radio component and fixed the replication bug
- CHG: Fix drag and drop model URLs Fixes #1761
- CHG: Fix drivers so they properly return assigned color values
- CHG: Reset humvee translation in humvee-lesson on lesson start.
- CHG: Fix physics and xmas-tree materials. Fixes #1796
- CHG: Default minesweeper, sandtable and tile-puzzle to glge until we figure out ambient light issue
- CHG: Move scoreBoard up to the properties block where its supposed to be. Fixes #1807
- CHG: Add catalog files for VCTE app.
- CHG: Fix issue with the navscene key handler removing keyUp information from the object passed into the event
- CHG: Fix case problems with .DAE extensions. Of the ones with problems, normalize to lower case since the errors tend to be in that direction.
- CHG: Increase the near clip. Prevents sizzling on the information boards in the back of the room.
- CHG: Fixed a 'this' reference in the textureLoading error callback
- CHG: VCTE: Removed tv_screens reference.  Throwing error once pushed to the development branch.
- CHG: VCTE: resolved a case sensitive issue with screenTest.dae
- CHG: VCTE: Changed default video size from 512x512 to 1024x512 (WxH)
- NEW: VCTE: Initial vcte app submission
- New: Editor: Add Rob's sandbox application to the catalog page.
- CHG: Merged over some of the texture changes from the threejs branch
- CHG: Add link to humvee-lesson to the lesson recipe.
- CHG: Add catalog files for the humvee lesson application, and update catalog files for the radio lesson.
- CHG: Add ambient color to tutorial applications. Fixes #1787.
- CHG: Change task text to green as a visible representation of task completion. Fixes #1785.

----------------------------------
0.6.7
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- CHG: Fix typos in lesson for GameTech Demonstration of Virtual World Framework.
- CHG: Remove old work-around for orientation problems. Not needed after the orientation fixes, plus it was making a direct kernel reference and using an invalid static ID. References #1680.
- CHG: Revert terrain z position and camera far changes from commit:6576d61. Raising the terrain would allow the camera to rotate to see underneath it. The distance to the far end of the terrain with the default orbit radius is approximatly 40000. The previous far value of 500000 should still be OK. References #1680.
- CHG: changed implements: //vwf.example.com/control.vwf to 'control-old.vwf' to account for threejs merge
- CHG: Explicity disable specular highlights in the humvee applications.
- CHG: Humvee lesson updates: Rename cameraPoses to more meaningful names.
- CHG: Humvee lesson updates: Added simple drive capability attached to 'G' key.
- CHG: Humvee lesson updates: Pass the key events down to the humvee
- CHG: Humvee lesson updates: Added the ability for the user to take control of the humvee
- CHG: Humvee lesson updates: Made some functions local due to issues calling those functions within the behavior
- CHG: Humvee lesson updates: Added resetting the humvee mode when entering the lesson
- CHG: Humvee lesson updates: Added support to remember the last active camera
- CHG: Humvee lesson updates: Merge branch 'branch/threejs' of http://github.com/virtual-world-framework/vwf into branch/threejs
- CHG: Humvee lesson updates: Remove empty `value:` fields from components.
- CHG: Humvee lesson updates: Rather than not setting a value, these were actually setting a value of `null`.
- CHG: Humvee lesson updates: Don't presume the application ID in the driver `initialize`.
- CHG: Apply the `this.scene.sceneRootID` => `this.kernel.application()` changes from model/glge to model/threejs too.
- CHG: Make `this.scene.sceneRootID` => `this.kernel.application()` changes to the new functions `isPrototype` in model/glge and `ifPrototypeGetId` in model/threejs.
- CHG: Merge branch 'development' into branch/threejs for rebasing current source code branch with main development branch.
- NEW*: Update driver configuration to look for a config file of the same name as the application, rather than a hard-coded index
- CHG: Remove unneeded property setters on terrain. Fixes #1720.
- CHG: Remove obsolete, unused `useLegacyID` conditions.
- NEW*: Add `kernel.application` to identify the application node. Removes `index-vwf` references from the kernel and drivers and should allow any remaining assumptions about the `index.vwf` application name to be removed. Closes #1748.
- NEW: Accept `undefined` for `rootID`.
- NEW: Hide references to ancestors from uninitialized nodes in applications.
- NEW*: Register nodes with the kernel before `creatingNode` rather than during. The kernel delegates node metadata, such as the name, source/type fields, and the prototype and behaviors lists, to vwf/model/object. But since vwf/model/object is the last driver, relying on the normal order for `creatingNode` prevented other drivers from asking about prototypes and other node information in their `creatingNode` handlers.
- CHG: Kernel documentation updates.
- CHG: Finish `kernel.prototypes( ..., includeBehaviors )`.
- CHG: Pass the read-only kernel functions generically. They all pass straight through so there is no need to handle each one separately to be able to reinterpret the arguments.
- NEW: Add drive behavior to humvee app.
- CHG: Update humvee lesson to use controlValueUpdated event to trigger task completions.
- CHG: Update checks to not set properties if the value is null
- CHG: Remove the axis marker for GLGE. It was causing an ugly box to appear in the middle of the scene until the assets loaded, and it isn't visible in most scenes anyway. Fixes #1782.
- CHG: Fix bug with laser collision detection
- CHG: Removing physics.xml from xmas-tree application, and updating appscene to match physics app. Fixes #1781.
- CHG*: Revert the fixed-with tick and convert tests counting on it to `future`. Ticks for models are deprecated, so we don't want to add new functionality. The reflector would like to have flexibility to alter the tick interval on slow networks, so the interval can't be known to models. Views primarily need to know when the simulation time has changed since the simulation state won't change otherwise. `setTimeout` and `setInterval` are available for views to use for other timing needs.
- NEW: Add cameraTransformComplete event to task component.
- NEW: Humvee: Update gear shift, high-low selector and turn signal to use detent control positions
- NEW: Humvee: Changing pointerClick listeners to pointerUp listeners to account for draggable controls.
- CHG: Humvee: Updated the camera positions
- NEW: Humvee: Added the worldTransform property for the internal view of the camera used for driving
- CHG: Humvee: Added worldTransform to the 'z' camera position info
- NEW: Humvee: Add ignition sound on humvee start.
- CHG: Humvee: Update animationTime to check for null to handle values of 0 correctly
- CHG: Humvee: Update gauge positions on engine start to be normal values, not the maximum.
- CHG: Humvee: Fix animateControlToPosition function so that it still works with momentary controls
- CHG: Humvee: Update hierarchy for the lights
- NEW: Humvee: Updated lesson with the correct hierarchy and inserted the drive behavior
- CHG: Humvee: Add new animateControlToPosition to control behavior. Update humvee gauges to use this method to animate.
- CHG: Humvee: Adjust volt, temp, oil, and fuel gauges based on engine ignition. Refs #1772
- NEW: Humvee: Add lesson instructions for vehicle ignition and drive capabilities. Fixes #1688. Updated lesson UI driver to add a space between instructions for level 3 and below.
- CHG: Fix proxy issue with Windows build.
- CHG: Update threejs view driver to take new experimental option to control the pick interval. Refs #1735
- CHG: Fixed the prototype property setting
- CHG: Update Redhat script install to fix #1616
- CHG: Fix URL issue for Debian install.
- NEW: Build update to Ruby 1.9.3
- CHG: Humvee: Pull humvee definition into component file for reuse in multiple applications.
- CHG: Update of installation instructions for VWF Framework.
- CHG: Humvee: Update the brake and engine wait lights so that they can turn on or off based on related controls.
- NEW: Humvee: Added started property to the humvee.
- NEW: Humvee: Added controlDisabled property to the control behavior. Fixes #1771
- CHG: Humvee: Move full humvee component and horn honk to lesson application. Refs #1585, #1770.
- CHG: Humvee: Add horn honk to humvee application. Fixes #1770.
- CHG: Humvee:  Move cameraPoses to lesson component, and reset initial camera position. Fixes #1585.
- CHG: Humvee:  Move lesson and humvee components into their own file, utilizing the includes directive. Refs #1585.
- NEW: Rudimentary support for `{ includes: prototype }`. The `includes` directive may used as an alternative to `extends` to work around certain cases where nodes don't inherit correctly from a prototype. Closes #1753.
- CHG: Remove debugging log message.
- CHG: Update glge view driver to take new experimental option to control the pick interval
- CHG: Update driver configuration to support JSON objects as parameters. Refs #1735
- CHG: Humvee: Change collada extension of humvee file to lowercase to match model file.
- CHG: Humvee: Update humvee-lesson door to use new control behavior.
- CHG: Revert "Rough animation test case."
- CHG: Revert duck to its original behavior
- NEW: Add an initialTransform property to the control behavior to fix issue with syncing animations with multiple clients. Refs #739
- NEW: Add the old control behavior as "control-old.vwf.yaml" and update the radio to use it, until it can be moved over to the new control behavior. Refs #739
- NEW: Update control types to allow text values. Refs #739
- CHG: Clean up logger statements
- CHG: Remove unnecessary check that would sometimes prevent the animationTime from being updated when the control value changed. Refs #1760
- CHG: Change the control positions so they don't extend node3. Refs: #739
- CHG: Humvee: Add control behavior to ignition switch. Fix bugs with spring control types. Refs #1685
- CHG: Humvee: Remove unneeded intermediateValue property. Refs #739
- NEW: Add new property to control behavior to simplify linking multiple controls together. Refs #739
- CHG: Humvee: Update humvee to use new control and animation behaviors. Refs #1584
- CHG: Humvee: Update control behavior to animate between positions. Fixes #1698
- CHG: Fix logic for snapping to control key values
- CHG: Add sequence property to animation and control key value nodes as a workaround for Ruby 1.8.7, which does not preserve child order in component objects
- CHG: Add basic mouse support to new control behavior
- CHG: First draft of updated control behavior that integrates with the new animation behavior
- CHG: Experimental patch to initialize using all prototypes' functions.
- NEW: Test the node3 animation behavior. An animation behavior for node3 nodes. Get behaviors from kernel.prototypes() Inherit initialize() from behaviors.
- CHG: Update for animation.vwf changes.
- NEW*: General animation behavior to add standard animation functions. Provides: animationTime, animationDuration, animationRate, animationLoop, animationPlaying, animationPlay(), animationPause(), animationResume(), animationStop() Sends: animationStarted(), animationStopped(), animationLooped(), animationTimeChanged() Nodes react to time changes by implementing: animationUpdate()
- NEW: Rough animation test case. Click the duck to play/pause. Control the time position using a hard-coded second slider under the editor's "Time" tab. The editor
patches cause several scripts errors on start.
- NEW: animation.vwf with working time, timeChange, events, and node update.
- CHG: Add terrain and background color to humvee-lesson. Fixes #1586. Add check to see if door is in proper position before moving to next lesson step.
- NEW: Added initial radio-lesson app
- NEW: Don't set properties from the prototypes if there's no value
- CHG: Remove ambient light from glge view driver (it is now in scene.vwf) refs #1737
- CHG: In glge.creatingNode, notify drivers of node's prototype properties. fixes #1762
- CHG: Remove glgeLight from test/Zup/index.vwf.yaml to avoid washout. refs #1762
- CHG: Remove glgeLight from radio app so it works more consistently
- NEW: Add sourceUrl to hmvee.vwf.yaml to aid in debugging
- NEW: Add default background color to scene.vwf.yaml
- NEW: Add guards in node3.vwf.yaml for null transform and boundingBox It had defaulted to undefined which wreaked havoc on the worldTransform getter.  This commit also places a check in that getter to guard against null/undefined values that get set later. refs #1762
- CHG: Add a check in bzflag/index.vwf.yaml for players being null. refs #1762
- CHG: Move bzflag scoreboard from appscene.vwf.yaml to index.vwf.yaml. scoreboard references players which is defined one level higher in index.vwf.yaml refs #1762
- CHG: Clean up loadCollada in GLGE model driver refs #1762
- CHG: In threejs.creatingNode, notify drivers of node's prototype properties. This fixes the problem that prototype properties were not being set int the renderer, so defaults were getting lost.  This commit fixes threejs.js, but the problem persists in glge.js. Also removed default ambient light in threejs.js because it is no longer necessary (taken care of by default value in scene.vwf) refs #1762
- NEW: ThreeJS: Spruce up lights in duck application a bit. refs #1680, #1682
- NEW: ThreeJS: Put a default ambient light in drivers as a stop-gap for proper fix refs #1680, #1682
- NEW: ThreeJS: Removed old legacy code
- NEW: ThreeJS: Brought over the prototype detection code from GLGE
- NEW: ThreeJS: Cleaned up the prototype code in preparation to copy over to threejs
- NEW: ThreeJS: Create another example of a component with children
- NEW: Added the prototype node3 skipping and implemented a new recursive search for GLGE.Collada children
- NEW: Removed the console output
- NEW: ThreeJS: Created a humvee component and converted the humvee app to use the component
- NEW: ThreeJS: Add config to hwmvee so it uses glge (glge-specific stuff inside)
- NEW: ThreeJS: Change "pointerEnter/pointerLeave" to "pointerOver/pointerOut"
- NEW: ThreeJS: Brings us into line w/ html spec and allowed us to remove code that was causing pointerOver/pointerOut errors.  refs #1680, #1682
- NEW: ThreeJS:  Fix bug in threejs view driver that caused a pick every frame
- NEW: ThreeJS: Fix ColladaLoader to identify transparent textures as such. Remove unneeded backup. References #1680.
- NEW: ThreeJS: Restore `up_axis` to the original `Z_UP`. These were changed from `Z_UP` to `Y_UP` to `Z` during the axis excursions. three.js' Collada parser only looks at the first character, so the behavior should be the same. But we shouldn't keep a change for no reason. References #1680.
- NEW: ThreeJS: Undo unintentional comment-out and tweak formatting.
- NEW: ThreeJS: Fixed the spin axis for the propeller
- NEW: ThreeJS: Added JSON output for alt-click
- NEW: ThreeJS: Support nodes with mirrored transforms (negative scales).
- NEW: ThreeJS: Matrix4#decompose will generate a negative scale and a correct rotation when the determinant < 0.
- NEW: ThreeJS: Object3D maintains a `matrixWorldIsMirrored` property.
- NEW: ThreeJS: WebGLRenderer.setMaterialFaces considers the node's mirror state when setting the face orientation.
- NEW: ThreeJS: `flipSided` moved from a shader parameter to a uniform. Fixes #1717.
- NEW: ThreeJS: GLGE Mouse pick fix when the editor is open or possibly when the view was scrolled
- NEW: ThreeJS: Don't rotate Collada objects after import. ColladaLoader's axis conversion will take care of this, and the correction would also incorrectly appear in the node3 transform. References #1680, #1556.
- NEW: ThreeJS: Set ColladaLoader options from the caller instead of modifying the source. This restores ColladaLoader.js to the upstream state, except for the
patch to honor Collada document names: 
- NEW: ThreeJS: Don't ignore the entire support/build directory. support/build/.gitignore has more precise patterns.
- NEW: ThreeJS: Add logic to allow overriding the renderer specified in a config file with URL parameters. Refs #1702.
- NEW: ThreeJS: Change default renderer to threejs. Add config files to bzflag and humvee so they still use glge. Fixes #1704
- NEW: ThreeJS: Corrected the default alpha value if parseFloat fails
- NEW: ThreeJS: Deleted commented out 3D lib references
- NEW: ThreeJS: Fixed the prop spin axis in GLGE
- NEW: ThreeJS: Add collada loader to driver configuration options
- NEW: ThreeJS: Fix dependency problems between three.js and ColladaLoader.js.
- NEW: ThreeJS: Upgrade to require.js 2.1.5 and domReady 2.0.1.
- NEW: ThreeJS: Implemented gettingProperty for several of the properties supported by the settingProperty/ Also updated all of the color properties to use the color utility. Particle systems are still allowing the properties to be passed through to the object model
- NEW: ThreeJS: Removed the satProperty function, everything is in the model now
- NEW: ThreeJS: Fixed the array parsing of colors
- NEW: ThreeJS: Corrected the color handling, and set up getting property for many properties
- NEW: ThreeJS: Cleaned up some commented out code
- NEW: ThreeJS: Added array handling to the color parser
- NEW: ThreeJS: Fixed the spin-axis for the prop. Something is still wrong here, the prop should be rotating around X, but the correct visual axis is Y
- NEW: ThreeJS: Convert the up axis to Z up during the import
- NEW: ThreeJS: Use the xml collada element name before using the id if defined
- NEW: ThreeJS: Initial commit from threejs of branch r51. Updated README and removed unneeded includes in example.
- NEW: ThreeJS: Updated the spin-axis for the prop
- NEW: ThreeJS: Skip extra nodes created by GLGE import to better match threejs
- NEW: ThreeJS: Some clean up and use the color converter utility
- NEW: ThreeJS: Added sourceurl references for easier debugging
- NEW: ThreeJS: moved interpolation of positions in Euler solver to shader
- NEW: ThreeJS: moved more computation into shader for Euler solver. some inline documentation
- NEW: ThreeJS: adding gravity and gravityCenter to particlesystem API
- NEW: ThreeJS: adding particle system propertes to API
- NEW: ThreeJS: Updated with new art, and set the color property of the material
- NEW: ThreeJS: New art files that contain materials instead of textures
- NEW: ThreeJS: Fixed logic to set color properties
- NEW: ThreeJS: particle gravity, colorRange, sizeRange, orientation
- NEW: ThreeJS: slight particle fix
- NEW: ThreeJS: minor tweak to orbit example, fix for lookat and axes test
- NEW: ThreeJS: Delayed the setting of the texture property and added callback for image loading
- NEW: ThreeJS: texure tiling
- NEW: ThreeJS: removing ECS demo
- NEW: ThreeJS: Added check for perfomance.now before calling the function
- NEW: ThreeJS: fix for older browsers that dont support performance.now()
- NEW: ThreeJS: Fixed the tile-puzzle by replacing the art
- NEW: ThreeJS: White space cleanup and converted to spaces instead of tabs
- NEW: ThreeJS: Fixed formatting issues with arrays in yaml
- NEW: ThreeJS: Corrected the pick vector calculations
- NEW: ThreeJS: support max and min spin in analyticShader
- NEW: ThreeJS: Three types of particle solver available. Euler can take into account drag, or in the future more complex sims, Analytic will do the analytic solution to the phyics sim cpu side. This works nicely, but takes some bandwidth on the GPU bus to upload each position at each frame. Analytic can take into account emitter movement properly. 'AnalyticShader' runs the analytic solution on the GPU. Much faster to compute and next to no data on the bus, but cannot take into account emitter movement.
- NEW: ThreeJS: added custom shader. now supporting start and end particle size. Can choose solver, either analytic or euler. Must use euler for damping. fixed timeing issue in frame counter. updated examples. Start and end color now take alphas
- NEW: ThreeJS: interpolate color for display as well
- NEW: ThreeJS: ticking integrator 10 times per second, interpolating for display values.
- NEW: ThreeJS: update aspect on window.resize
- NEW: ThreeJS: take cube root of random when picking radius for even random distribution in sphere. Some graphics update in samples
- NEW: ThreeJS: proper distribution of random sphere coords
- NEW: ThreeJS: Fixed the vector calculation for the mouse pick
- NEW: ThreeJS: particles now update on render, not tick. Timing aligned with old speeds.
- NEW: ThreeJS: particle position now calculated in world space, velocity in local
- NEW: ThreeJS: particle startcolor and endcolor, support for map, opacity and blendmode
- NEW: ThreeJS: Modified the collada import to remove extra node, and several other changes
- NEW: ThreeJS: Find the existing material, instead of creating a new material Set the name of the Object3D when the driver creates a Object3D Ambient Light created when the scene's ambient color is set
- NEW: ThreeJS: Modified to grab the name from the name attribute in the collada file
- NEW: ThreeJS: Implemented the mouse position calculations, and yaml hierarchy output
- NEW: ThreeJS: Remove unnecessary .bak files and stackdump
- NEW: ThreeJS: Added hierarchy output for the renderer
- NEW: ThreeJS: Added alpha to a previous color bug fix
- NEW: ThreeJS: Remove bin directory since the stubs are different on different platforms
- NEW: ThreeJS: YES! finally found that transform problem. it was in the lookat. Sandtable now works properly!
- NEW: ThreeJS: updated app to store local vars for access node3
- NEW: ThreeJS: had to modify the mesh creation code to store the normals in the correct object. Added utility.color support for material.color, needs to be added to other setRGB calls
- NEW: ThreeJS: removed the duplicated lightType definition, updated lights, major light work, added a directional light sample and pointlight demo.
- NEW: ThreeJS: Replace �tick� with a call to this.future. Insert threejs light property values. Insert the glgeLight behavior. Modify any glge light properties to the new name. Remove any calls to vwf.setProperty with calls to directly access the objects/properties
- NEW: ThreeJS: renderer selection in the url, light setup for the new API, the duck is the best test app so far
- NEW: ThreeJS: Implemented createMesh for the threejs model. added camera types, fov, near and far. initial work on supporting shadows
- NEW: ThreeJS: deleteNode implemented
- NEW: ThreeJS: ambient changes, updates to collada axis flip
- NEW: ThreeJS: added UTF-8 compressed model format parsing and associated test.
- NEW: ThreeJS: added test for physics. Identified bug in physics driver. there is a switch on array.length with the test values '2' and '5'. This compare fails, should be 2 and 5. Probably this worked at some point in some browsers. Failed on Chrome 23.0.1271.52 beta-m. Fixed in driver. Cannot set initial rotation of physics mesh, even when setting entire transform matrix
- NEW: ThreeJS: fixed physics example to use collada meshes. Added get MeshData. Physics example working. added set material. added key input.
- NEW: ThreeJS: initial work on materials, texture and color. changes to examples to reflect different scene graph from collada parse
- NEW: ThreeJS: adding test case for YAML parse error for initial properties
- NEW: ThreeJS: adding test for scene initialization
- NEW: ThreeJS: fixed some problems with the pointerClick - several new examples working. Plane, duck, and radio much closer along
- NEW: ThreeJS: get transform in threejs driver now working, slight updates to radio example
- NEW: ThreeJS: Now properly pausing the queue when loading meshes. TODO: deal with delayed properties. Handling scene ambient throught THREE AmbientLight, handling child transforms properly. NOTE: axis flip only necessary on top of heirarchy. LightColor working. Visible working. NOTE: threejs only hides specific node, not entire subgraph. handling manually. mouse picking working nicely. Should mouse over events bubble up? maybe leave it to the objects to inform parent. ActiveCamera implemented. Mouse movement and click hooked up.
- NEW: ThreeJS: added pointerOver and pointerOut events to glge view, fixed slight offset in mousepick coordinates
- NEW: ThreeJS: Added cross-origin texture support, fixed bugs related to drawing and picking transparent objects
- NEW: ThreeJS: More work on getting the coord systems straitened out. Looks like it's correct now. Checking in tests for coord transforms. Should look the same under GLGE and THREE.js
- NEW: ThreeJS: Beginning support for collada files. basic Lights and lightType working
- NEW: ThreeJS: initial commit for three.js driver. basics working - cameras, nodes and transforms. renderer. No input currently, all models rendered as cubes
- NEW: ThreeJS: 
- NEW: ThreeJS: 


----------------------------------
0.6.6
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- CHG: Remove unneeded lines from humvee-lesson. Refs #1684.
- NEW: Add lesson sequence for 'entering vehicle' task component. Fixes #1689.
- CHG: Fix bugs relating to instruction and progress bar progression for multiple levels of tasks. Refs #1684.
- CHG: Update lesson view driver to allow for multiple levels of tasks. Create test/lesson application to show down to five levels. Fixes #1708.
- NEW: This commit fixes #1719 - moved the 7z package to our own production servers and reference the download from this location.
- NEW: Add configuration file to lesson application to pull in lesson view driver. Fixes #1709.
- CHG: Update lesson cookbook recipe to use lesson view driver instead of the html overlay. Fixes # 1709.
- CHG: Add comments for event cookbook recipe. Hide link to events recipe until it's completed.
- CHG: Trap the WebSocketError from em-websocket when the connection is closing. References #1209, #1640, #1710.
- CHG: Fixes null reference crash on method serialization
- CHG: Fix missing image files error, and remove dependency on jquery file. Refs #1639.
- CHG: Task #1706 css/js path for documentation referencing incorrect relative path. Missing image files for JQuery UI.
- CHG: Add lesson view driver to autogenerate the lesson UI. Update lesson and humvee-lesson app to use the new driver, and add a driver configuration file to each. Fixes #1608 and #1639.
- CHG: Updating rack to the currently supported rails version for servers running rails applications with VWF.
- NEW: Add humvee lesson template for GameTech tutorial.
- CHG: Update .gitignore after the switch from Ruby 1.8.7 to 1.9.3. For the Windows stand-alone build. 
- CHG: Added support to kernel to serialize methods in getNode. This commit fixes #1659
- CHG: Reset progress bar width on start lesson.

----------------------------------
0.6.5
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- CHG: Separate requesting the config file from the initialize call, so apps will still work even if the request fails
- CHG: Fix tests broken by calling loadConfiguration in index.html instead of initialize
- CHG: Fix tests broken by moving the application parameter parsing out of the kernel
- CHG: Add driver config file for xmas-tree app
- NEW: Add touch driver to driver configuration options
- NEW*: Add ability to load configuration files to specify necessary drivers. Add sample configuration file in physics.
- CHG*: Move searching the query string for an application specification out of the kernel and into index.html
- CHG*:  Use "library" instead of "driver" to describe javascripts loaded before initialize
- NEW: Add comments to loadDriverConfiguration
- NEW: Move the driver configuration logic inside the kernel. Only the URL parsing stays in index.html.
- NEW*: Add threejs driver to driver configuration options
- CHG: Change index.html to keep a list of drivers in the correct order, with specific drivers enabled or disabled in the list based on URL parameters
- CHG: Fix adl/hwmvee game to work with driver configuration changes
- CHG: Update catalog page to use new URL parameters for selecting drivers
- CHG: Update index.html to use URL parameters to determine what drivers to load
- CHG: Rename google earth driver to google-earth.js
- CHG: Change connected parameter to google-earth for loading the google earth driver
- CHG: Update the lesson cookbook recipe with full UI information. Fixes #1599.
- NEW: Update to downloads page for automated zip distribution of master branch builds.
- CHG: Tweak the logging and debugging recipe. Fixes #1602.
- NEW: Add first draft of the logging and debugging recipe to the cookbook.
- NEW: Add progress bar and navigation buttons to lesson UI.
- CHG: Switch the Gemfile source from `https` to `http`.
- CHG: Make lesson/task move the camera's world transform to the proper place. It has been moving its transform to the cameraPose's transform, instead of moving it's worldTransform to the cameraPose's worldTransform - fixes #1456
- CHG: Add check in node3.worldTransformTo for when parent is not a node3 fixes #1447
- NEW: Add transformBy, worldTransformBy, and worldTransformTo to node3
- NEW: Also added public/test/transformTo so we can regression test future changes
- NEW: Add basic UI to a lesson to show task instructions. Update lesson recipe to match. Refs #1603 and #1599 and fixes #1627.
- CHG: Switch the Windows standalone build to Ruby 1.9.3. Fixes the `illegal switch in RUBYOPT: -"` error when launching `run.bat`. Bundler 1.3 is not compatible with Ruby 1.8 on Windows. Fixes #1630, references #1559.
- CHG: Allow subdirectory files in vwf.example.com to generate source files for jsdoc. 
- NEW: Add first draft of lesson recipe.

----------------------------------
0.6.4.1
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- CHG: Update to application.rb file to fix fatal crash caused by eventmachine

----------------------------------
0.6.4
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- CHG: Switch `source` from :rubygems to "https://rubygems.org".
- NEW: Add compliance page to the website to define what it means to use the framework.
- CHG: Fix part of lesson synch problem by making taskIndex a property
- NEW: Add first draft of complex transformation recipe to cookbook.
- CHG: Change task property for scene node to be scenePath. This avoids replication problems w/ node properties
- CHG*: Add scene property to task component. It need only be set on the top node, and it will recursively cascade to all its children tasks.
- CHG: Update pitfalls doc
- NEW: Add chat and sound recipes to the cookbook.
- CHG: Update OrientationCubeYUp.dae to convert -Y to Z.
- CHG: Update OrientationCubeYUp.dae to convert -Y to Z.
- NEW: Add OrientationCubeYUp.dae.
- CHG: Update lesson to work with new lesson/task component
- CHG: Add comments to task component
- CHG: Have task component use methods instead of events where appropriate
- NEW: Add two new cookbook templates for complex transforms and event system.
- CHG: Update login dialog to select an existing user or create a new one. Allow for multiplayer persistence.
- CHG: Fix documentation menu spacing issue for IE8 and correct typo in FAQ page.
- CHG*:  Add transformTo to node3
- CHG:  Add event handling pitfall to Pitfalls page
- CHG:  Add to-do comment to lesson app

0.6.3
----------------------------------------------------------------------------------------------------
Note: (*) indicates an API change.

- CHG: Add note that driver-level queries w/ an absolute path do not require a nodeId as the first parameter - undefined may be passed instead.
- NEW: Rename hammer.js directory to touch to match driver name.
- NEW: Add hammer.js library, touch component, and view driver.
- NEW: Update navscene applications to use touch interface as well.
- CHG: Increase max nesting in json parse for bzflag persistence.
- NEW: Lesson and Instruction components for a simple linear lesson
- CHG: Fix errors in query documentation - there are still more to be fixed
- CHG: Revert lesson recipe that inadvertently got checked in mid-progress
- CHG: Add error check for case when "find()" returns no results. Previously, this had errored out because find() tried to call map() directly on the results
- NEW: First draft of lesson cookbook recipe (not fully functional, yet)
- CHG: Change lesson and instruction components
- CHG: Added a lesson application to test
- NEW: Updated information for VWF branches, and provided link to VWF Forum topic posting on branching.
- NEW: Updated expected dates for cookbook recipes
- NEW: Add Pitfalls link to the left side of doc web pages
- NEW: Add pitfalls.md for documentation of best practices and pitfalls to avoid
- CHG: Fix google earth bug to use cameraData from model on application load if available.
- CHG: Update module declaration and comment style for JSDoc 3.

0.6.2
----------------------------------------------------------------------------------------------------
- BUG: Fix bug that overrides the glge color with vwf color.
- NEW: Add a JSDoc configuration file and enable Markdown.
- CHG: ruby -i requires an extension in Ruby 1.9.
- CHG: Update module declarations and comment styles for JSDoc 3.
- CHG: Standardize on "var exports = { ... } ; return exports;" so that JSDoc will identify the module's exported elements automatically.
- CHG: Add @module declarations. JSDoc 3 has explicit support for RequireJS-style modules. Standardize on placing the module description above the define() statement.
- CHG: Remove @namespace declarations. @namespace was the JSDoc Toolkit work-around to describe modules.
- CHG: Remove @name, @function, and @field declarations. JSDoc 3 recognizes the element names and types correctly in most cases.
- CHG: Add @function declarations to api/kernel since the API is described here.
- CHG: Add explicit @name declarations to vwf.js since the kernel is not a RequireJS module yet and JSDoc 3 can't parse it automatically.
- CHG: Add @see declarations to link vwf.js implementations to the vwf/api/kernel specifications.
- CHG: Convert most "//"-style descriptions to "///" to add them to the JSDoc 3 documentation.
- NEW: Add version.js and logger.js to the documentation build.
- NEW: Switch to JSDoc 3.
- CHG: Remove --recursion. Search *.vwf.yaml instead of *.yaml for components and remove .js from --ext.
- NEW: Be more specific to avoid vacuuming up non-component YAML files.
- CHG: Move the /// and ## to /** ... */ conversions into external scripts, and convert all files at once 
- CHG: Remove the "/** namespace */ function module.name() ..." hack from the conversion in anticipation of switching to JSDoc 3.
- CHG: Invoke JSDoc as: sh "java", "-jar", ... instead of: sh "java -jar ..." to bypass the shell 
- NEW: Interpret description text as Markdown.
- NEW: Allow the JSDoc scanner to automatically recognize more module elements.
- BUG: Patch the /// to /** */ conversion script to declare define() function arguments as namespaces and assign a name:
- CHG: Add @lends directives to vwf/configuration.js and vwf/utility.js to identify the object to JSDoc that provides the namespace members.
- CHG: Remove now-unnecessary @name and @function directives.
- CHG: Move the vwf/utility.js xpath quoteName and unquoteName functions to allow JSDoc to recognize them.
- CHG: Tweak vwf/configuration.js and vwf/utility.js comments.
- CHG: Tweak vwf/api/kernel.js comments.
- NEW: vwf.js JSDoc comments Correct bad JSDoc name overrides in vwf.js.
- NEW: vwf.js JSDoc comments Set a namespace.
- NEW: vwf.js JSDoc comments Add jsdoc comments for inner methods.
- CHG: vwf.js JSDoc comments Switch utility name overrides from instance to static.
- NEW: Add ambient lights to Humvee applications.
- NEW: Adding Bootstrap Framework to VWF Client Library. Upgrading VWF Client Loader to integrate Bootstrap framework into VWF startup compatibility check.
- BUG: 2D Interface recipe Remove appendTo instructions
- BUG: 2D Interface recipe Add requirements for position:absolute and no index.css
- BUG: 2D Interface recipe Other minor typos
- NEW: Add touch sensitive version of the hmmwv application.
- CHG: Replace Materials recipe "coming soon" page w/ a real recipe
- BUG: multiuser.md Remove typos
- BUG: multiuser.md Add a link to bootstrap.css in the login screen html where bootstrap classes are referenced
- BUG: multiuser.md Add a note that jquery is loaded automatically for every VWF app
- BUG: multiuser.md Edit "What needs to be created" section to show a clearer grouping that is now reflected in the later sections
- BUG: multiuser.md Remove one reference to "his" in multiuser.md to be more gender neutral.
- NEW: multiuser.md Add pages for cookbook recipes and add them to table of contents
- BUG: Fix type in html.md, standardized title capitalization across cookbook recipes
- BUG: Fix a typo in html.md
- BUG: Make title capitalization consistent on cookbook recipes
- NEW: Add 2D Interface recipe and reorganize doc link heirarchy to add cookbook






0.6.1
----------------------------------------------------------------------------------------------------
- BUG: Remove extraneous width in DIV for documentation page formatting.
- NEW: Change how state is written to file to remove POST errors for long states.
- NEW: Add versioning mechanism (instance ID and timestamp) when saving file. Allow save from any directory.
- NEW: Allow state files to be saved from anywhere in the directory structure.
- NEW: Update to latest version of the requestAnimationFrame implementation. Move it into a separate file so all drivers will have access to it.
- NEW: Redirect window to saved file when loading from editor.
- CHG: Changed the screenshot to be of the radio in Firefox where the textures actually show up
- CHG: Moved the location of the image in simulation.md to make more sense
- CHG: Added polish to cookbook recipes
- NEW: Added a "Create a simulation" cookbook recipe - fixed a typo in the radio application in the process
- CHG: Fix permissions for build rakefile updates.
- CHG: Compensate for canvas padding and border in GLGE.Scene.makeRay().
- BUG: Fix pick errors caused by the event-to-canvas coordinate translation.
- CHG: Use the vwf.utility.coordinates functions, which determine the element's page location without regard to other elements and properly account for the element's margins, borders, padding and offset.
- CHG: Remove the window.slideOffset special case that the editor maintained.
- NEW: DOM element coordinate conversion utilities.
- NEW: Make xpath a separate utility submodule.
- BUG: Correct capitalization in color utility references.
- NEW: Allow loading of saved state file directly from URL or editor.
- CHG: Removed the "work in progress" label at the top of multiuser.md
- CHG: Completed the first draft of the multiuser cookbook recipe
- CHG: Anchor ignores to the referenced directory. Ignore Windows standalone ruby.
- BUG: Fix build error: undefined method `DEVKIT' for main:Object.
- BUG: Removed generated file from source code
- NEW: Add list of available saved state files to the user tab in the editor.
- NEW: Add ability to save vwf state to file in current directory, either by name or instance id.
- CHG: GIT Update: Ignore *.pyc.
- CHG: Change 7z to p7zip in install instructions.
- CHG: Improved the multi-user cookbook recipe -Added a file for node.vwf.yaml so that documentation will be generated for it -Fixed a typo in node3.vwf.yaml comments
- CHG: Add 7z to cygwin installation instructions.
- CHG: Update downloads link on virtualworldframework.com
- CHG: Update master/apprentice move dates to late January/February
- CHG: Altered text in draft "about" page
- NEW: Added the source file for the landing page draft
- NEW: Updated new landing page draft and multiuser.md
- NEW: Adding the first draft of the VWF landing page (this will go away once we have a real draft and only the source markdown will remain)
- CHG: Move run.bat download information to be more prominent in README
- NEW: Updated multiuser.html documentation
- NEW: Add downloads navigation element to website
- CHG: Remove static ids in bzflag, test/worldtransform and tile-puzzle
- NEW*: Remove kernel.kernel calls
- CHG: Fix static id in car.vwf.yaml
- CHG: Fix static id in google earth
- CHG: Fix static IDs in cesium, google earth, physics and xmas tree
- NEW*: Change vwf.find to this.kernel.find
- CHG: Fix static ids in scripting tutorial
- NEW*: Add legacy ID patch to only use legacy IDs for index.vwf, appscene-vwf, the camera, and any prototype from vwf.example.com, except for node.vwf
- CHG: Fix static ids used for locating the application root
- CHG: Fix static ids in sandtable, tutorials and documentation
- CHG: Remove obsolete commented-out blocks that were referencing static IDs.
- NEW: Added the beginning of the Multiuser recipe
- NEW: Git Update Add branch information to README
- NEW: Git Update Normalize files still containing CRLF line endings.
- NEW: Git Update To Automatically normalize line endings on checkout and commit.
- NEW: Add vwf/utility to the define array instead of requiring it at each use
- NEW: Add new encodeForAlphaNumeric function to the jquery encoder.
- CHG: Update editor to use new function for HTML element IDs, so jQuery can use the IDs as a selector
- CHG: Update setParams function to use text encoding
- BUG: Fix converting typed arrays to regular arrays for prototype properties
- NEW: Encode editor content to handle untrusted data from the kernel
- NEW: Add the jquery-encoder utility for handling text encoding for various contexts.
- NEW*: Added navmode options to API.
- NEW*: Added backgroundColor property
- BUG: Fixed mouse navigation jump on key press
- BUG: Don't assume that the requestAnimationFrame() callback parameter is always a timestamp.
- BUG: Make proxy/test folder non-empty so that git retains the directory.
- CHG: Update CHANGELOG with API notation and additional comments.
- CHG: Update CHANGELOG for new release and converted to markdown file format.
- BUG: Don't create glge objects for the component prototypes, and boundingBox fix
- BUG: Views should use this (old style drivers) or this.kernel (new style) for accessing vwf.
- BUG: fixed parse error, needs more testing, white space should not cause and issues
- NEW: Added utility color object, fix bug when setting a texture to the same value, added color support to the model/glge driver
- CHG: Added ambientColor to the tile-puzzle and the minesweeper
- NEW: Demo to show use of the point light
- BUG: material fix for the tanks
- BUG: Correct spelling of 'antenna' property
- BUG: Add newline at end of last line to fix YAML parse error.
- CHG: Require "bundle exec rake ..." to utilize bundle environment.
- CHG: Don't "bundle install" within the build.
- CHG: Favor "bundle exec thin start" instead of "bin/thin start".
- CHG: Remove path gymnastics working around the lack of the bundler environment. Find the support/build tools without modifying /usr/bin.
- CHG: Save the Windows RubyInstall and DevKit downloads for reuse in a cache that's shared between working directories (if provided).
- CHG: Download, configure, and build the standalone Windows build incrementally.
- CHG: Factor common parts out into support/build/utility.rake.
- CHG: Make run.bat executable to fix the permissions error.
- CHG: GLGE Ambient Light removed the hard coded setting of the ambient light
- BUG: Remove and ignore .bundle, per Bundler's recommendation.
- CHG: Update forum link to http://forum.virtualworldframework.com.
- NEW: Google Earth - Enable buildings, terrain, and trees layers.
- NEW: Normalize node descriptors for kernel.hashNode().
- NEW: Provide the method return value to model.callingMethod() and view.calledMethod().
- CHG: Rename earth's "camera" to avoid a name conflict with the default camera.
- NEW: Use a dedicated driver flag for Cesium.
- NEW: Workaround texture bug by not allowing the texture to be reassigned to the same value
- CHG: Fix static ids in bzflag
- BUG: Fix horizontal rule incorrectly interpreted as a header indicator.
- BUG: Fix shuffled array out of sync problem in minesweeper and tile puzzle.
- CHG: Fix the static ID reference in the scene type test.
- CHG: Remove functions obsoleted by XPath tests.
- CHG: Fix the static ID reference in the scene type test by using kernel.test() with the URI (the formal type name).
- NEW: Fix static ID references in type tests by testing against the URI (the formal type name).
- NEW: Match the node itself and not just its prototypes in an XPath type test.
- CHG: Adapt to the logger's infoc()-to-infox() API change.
- CHG: Fix static ID references in the *application*.vwf.html by locating and testing nodes with kernel.find() and kernel.test().
- CHG: Fix navscene.vwf#orbitObjectID static ID references.
- CHG: Search for the node using the property as a search pattern, and use its ID.
- CHG: Rename the property to "orbitObjectPattern".
- CHG: Fix activeCamera and camera.lookAt static ID references.
- CHG: Navigate from the scene node to find the lookAt object, and use its ID.
- CHG: activeCamera doesn't need to be initialized since it's already defined in scene.vwf.
- NEW: Fix static ID references after this.children.create( ... ).
- CHG: Update minesweeper and tile-puzzle to use new replicated random function
- NEW: Replicated random (except for test/replication).
- CHG: Simplify prototypes(), to be like ancestors().
- NEW: The Alea pseudorandom number generator.
- NEW: Expose the Alea generator state.
- BUG: Work with Ruby 1.9.2+, where "." is no longer in the default $LOAD_PATH.
- CHG: Use the "testing" configuration for tests. Move shared config settings to the defaults.
- CHG: Deferred kernel.createNode() calls were referencing an undefined parameter.
- BUG: Remove orphan isolateProperties definition. Tweak comment about loading "chrome" html.
- BUG: Humvee Fix starting state of camera buttons so it is synced with state of existing clients
- BUG: Minesweeper Start button state when joining an in progress game
- BUG: Humvee Sync camera buttons so switching views on one client switches the view for all clients
- BUG: Humvee Move transform for interiorCamera to initialize function to fix problem where it would start outside the humvee
- BUG: Humvee Make accelerator and brake pedals momentary
- BUG: Humvee Fix problems with linked objects
- BUG: Humvee Prevent control value changes while an object is animating
- BUG: Humvee Link steering wheel and front wheels
- BUG: Humvee Link hood and hood latches
- BUG: Humvee Remove turning on rear tires
- BUG: Humvee Fix temperature knob
- BUG: Humvee Adjust camera positions
- CHG: Added control behavior to interior objects and added the ability to switch between exterior and interior views
- NEW: Added a controlValueUpdated event to the control behavior




0.6.0
----------------------------------------------------------------------------------------------------
- BUG: Fix exception on pointerHover event for undefined.
- BUG: Do not allow a texture to be reassigned to the same value. 
- BUG: Set minesweeper Start button state when joining an in-progress game.
- BUG: Fix starting state of the camera buttons in humvee so it is synced with state of existing clients.
- NEW*: Add a controlValueUpdated event to the control behavior.
- NEW: Add interaction and camera buttons to the humvee application.
- CHG: Replace humvee application model. Model now includes interior of the vehicle and articulated parts.
- NEW: Create bzflag application based on the classic arcade game, including tank navigation and firing effects. 
- BUG: Rename earth's "camera" to avoid a name conflict with the default camera.
- NEW: Add placeholder for Google Earth configuration options.
- NEW*: Use a dedicated driver flag for Cesium.
- NEW: Integrate ADL's hwmvee application.
- NEW: Integrate AGI's Cesium application.
- CHG: Update editor tab names.
- BUG: Add a message to the Models tab if no models are found.
- BUG: Correct drill up capability for prototype children in the editor. 
- CHG: Reorganize the order of the editor structure to: children, properties, methods, events, behaviors, scripts.
- CHG*: Update navscene component to have separate rotationSpeed and translationSpeed properties.
- BUG: Remove mouse movement choppiness.
- BUG: Allow cameras to be created under any node.
- CHG: Update mouse wheel zoom to use the same formula as keyboard navigation.
- CHG*: Change the camera speed to default to 1.
- NEW: Create worldTransform test for a pointer follower.
- CHG: Move the worldTransform property getter from the glge driver to the node3 component.
- NEW*: Add a replicated random function.
- NEW*: Add origin information to pickInfo.
- NEW: Include components in the auto-generated documentation.
- NEW: Add Developer's Guide to documentation.
- CHG: Clarify installation instructions. Add instructions to build website.
- BUG: Correct catalog to display sessions for applications with a forward slash in their name.
- CHG: Honor levels in the logger.
- CHG*: Rename the logger's infoc(), warnc(), etc. to infox(), warnx(), etc.
- CHG: Switch to MiniTest for compatibility with Ruby 1.9.
- NEW: Show a hint in run.bat to prompt users to launch a browser.
- BUG: Fix build error with pygmentize.
- CHG: Remove undefined kernel and view function properties from vwf_view.
- CHG*: Swap the modelGenerator/viewGenerator and kernelGenerator parameters in model.load()/view.load() to allow drivers to omit the kernel generator argument.

0.5.2.1
----------------------------------------------------------------------------------------------------
- BUG: Correct URL links on the about page.

0.5.2
----------------------------------------------------------------------------------------------------
- NEW: Add VWF Forum for General and Technical Questions.
- CHG: Add prototype Properties/Methods/Events/Children/Scripts to the editor interface.
- NEW: Increase the width of the editor when editing scripts.
- NEW: Add ability to create new scripts via the editor interface.
- NEW: Allow setting of basic properties (rotaiton, translation, scale) before dragging and dropping from the Model tab.
- CHG: Always attach new camera to its parent.
- BUG: Remove purple tint from drag and drop models.

0.5.1
----------------------------------------------------------------------------------------------------
- BUG: ERB files not generating HTML files during build process.
- BUG: Demonstration Missing Textures Causing Black Boxes for Imagery.
- NEW: Sync the entire graph when saving and loading the application state.
- NEW: Save and load the application state as a delta from the initial state.
- NEW: Support a script text editor in the list editor.
- NEW: Search Engine Optimization for Virtual World Framework Website.
- NEW: Create a Wikipedia Page for Virtual World Framework.
- NEW: Add SVN Change List to GitHub. Should occur at end of each sprint.
- NEW: Implement and complete VWF website.
- NEW: Update FAQs with enhanced version.
- BUG: Catalog page is not regenerated during the build process if it has already been created.
- NEW: Make script area editable.
- NEW: Submit edited scripts.
- NEW: Drag and Drop Components from Library into Scene.
- NEW: Create UI for component library.
- NEW: Add components from public/models to library.
- NEW: Update FAQs with full list.
- BUG: Remove duplicate scripts from editor view.
- NEW: Add sample tutorial application to demonstrate script editability.
- BUG: If new child nodes are added when hierarchy tab is visible, they do not show up in editor until the tab is refreshed. 
- CHG: Using mousewheel to zoom in and out of most applications is too fast. After one turn, most content isn't viewable.
- BUG: Warnings in build process.
- CHG: The loading overlay looks bad until the images load.
- CHG: Border around scene updated.
- BUG: Navigation doesn't work in sandtable anymore.
- BUG: Keyboard navigation in sandtable is much slower than it used to be.
- BUG: The position doesn't sync correctly when a second client joins an earth application.
- CHG: Default view for the earth application is not interesting.
- BUG: Toolbar states don't sync correctly in sandtable
- BUG: Lines don't sync correctly in sandtable.
- BUG: The clear button in physics doesn't clear items in a second client that existed when it joined.
- BUG: Javascript error when second client joins Humvee app.
- BUG: Remove toolbar buttons from earth application.
- BUG: Mousewheel doesn't zoom at all in Firefox.
- BUG: Users tab is empty on anything down a directory(i.e. the tutorial/ and adl/ applications)
- BUG: Editor hierarchy comes up blank on occasion
