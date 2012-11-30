VIRTUAL WORLD FRAMEWORK CHANGE LOG
==================================

----------------------------------

Note: (*) indicates an API change.

0.6.0.x Release
----------------------------------------------------------------------------
- BUG: Fix exception on pointerHover event for undefined.
- BUG: Do not allow a texture to be reassigned to the same value. 
- BUG: Set minesweeper Start button state when joining an in-progress game.
- BUG: Fix starting state of the camera buttons in humvee so it is synced with state of existing clients.
- NEW: Add a controlValueUpdated event to the control behavior.
- NEW: Enhance humvee application capabilities including interior interaction, including the following: link steering wheel and front wheels, link hood and hood latches, fix temperature knob, adjust camera positions, make accelerator and brake pedals momentary, add camera buttons to switch view from inside to outside the vehicle.
- CHG: Update humvee application to use control behavior for external objects (doors, tires and hatches, etc.)
- CHG: Replace humvee application model. Model now includes interior of the vehicle and articulated parts.
- NEW: Create bzflag application based on the classic arcade game, including tank navigation and firing effects. 
- BUG: Rename earth's "camera" to avoid a name conflict with the default camera.
- NEW*: Add placeholder for Google Earth configuration options.
- NEW*: Use a dedicated driver flag for Cesium.
- NEW: Integrate ADL's hwmvee application into the VWF core.
- NEW: Integrate AGI's Cesium application into the VWF core.
- CHG: Update editor tabs to new names.
- BUG: Add a message to the Models tab if no models are found.
- BUG: Correct drill up capability for prototype children in the editor. 
- CHG: Reorganize the order of the editor structure to: children, properties, methods, events, behaviors, scripts.
- CHG: Update navscene component to have separate rotationSpeed and translationSpeed properties.
- BUG: Remove mouse movement choppiness
- CHG: Add sceneID to node objects to support cameras being created under any node
- CHG: Update mouse wheel zoom to use the same formula for moving the camera as the keyboard translation.
- CHG: Change the camera speed to default to 1, and remove from the tutorial application, as the default value is sufficient.
- NEW: Create worldTransform test to test the worldTransform for a pointer follower.
- CHG: Move worldTransform property getter from glge to node3 component implementation.
- NEW*: Add replicated random function, using the Alea psuedorandom number generator.
- NEW: Add origin information to pickInfo.
- CHG: Update build process to include the application API.
- NEW: Add API descriptions to the components in the proxy folder.
- NEW: Add Developer's Guide to documentation covering the following sections: Introduction, Architecture, Components, Cameras, Lights, Prototypes, Behaviors, Animations, HTML, Editor, Querying.
- CHG: Clarify installation instructions. Add instructions to build website.
- NEW: Create video of sandtable tutorial.
- BUG: Correct catalog to display sessions for applications with a forward slash in their name.
- CHG*: Adapt to the logger's infoc()-to-infox() API change.
- CHG: Switch to MiniTest for compatibility with Ruby 1.9.
- NEW: Create third-stage branch for development, feeding into integration, then to master.
- NEW: Add echo note for run.bat file to give some initial hint of what to do next when the server is started.
- BUG: Update build process to create Pygmentize in usr/bin and give it full permissions if it does not already exist.
- CHG*: Remove undefined kernel and view function properties from vwf_view.
- CHG*: Swap the modelGenerator/viewGenerator and kernelGenerator parameters in model.load()/view.load() to allow drivers can omit the kernel generator argument.

0.5.2.x Patch
----------------------------------------------------------------------------
- BUG: Correct URL links on the about page.

0.5.2.x Release
----------------------------------------------------------------------------
- NEW: Add VWF Forum for General and Technical Questions.
- CHG: Add prototype Properties/Methods/Events/Children/Scripts to the editor interface.
- NEW: Increase the width of the editor when editing scripts.
- NEW: Add ability to create new scripts via the editor interface.
- NEW: Allow setting of basic properties (rotaiton, translation, scale) before dragging and dropping from the Model tab.
- CHG: Always attach new camera to its parent.
- BUG: Remove purple tint from drag and drop models.

0.5.1.x Release
----------------------------------------------------------------------------
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
