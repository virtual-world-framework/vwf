<a name="drivers" />

<div class="well" markdown="1">
Drivers
===================
-------------------

### Configuring Drivers for an Application

An application allows for both its model and view drivers to be selected and activated via a configuration file. This system will look for a config file with the same base name as the application being loaded. For instance, *application.vwf* will search for and attempt to load a config file entitled *application.vwf.config.yaml.*

Within the configuration, both model and view drivers may be defined within the *model:* or *view:* tag, using the path to the driver file, as shown below. 

	---
	model:
	  vwf/model/threejs:
	view:
	  vwf/view/threejs: "#vwf-root"
	  vwf/view/lesson: 

For drivers that require parameters, such as the renderer view driver that requires the correct HTML element ID, these can be passed in one of two ways. If there is only one parameter, it can be passed in as shown above to the right of the colon: *"#vwf-root"*. Alternatively, the parameter name may also be explicitly listed as defined below.

	---
	view:
	  vwf/view/glge: 
	    application-root: "#vwf-root"

-------------------

### Default Drivers

By default, the following drivers are active:

* Threejs (vwf/model/threejs, vwf/view/threejs)
* Javascript (vwf/model/javscript)
* Object (vwf/model/object)
* Document (vwf/view/document)
* Editor (vwf/view/editor)

Alternative driver options also include:

* GLGE (vwf/model/glge, vwf/view/glge)
* JigLib (vwf/model/jiblib)
* Cesium (vwf/model/cesium, vwf/view/cesium)
* Google Earth (vwf/view/google-earth)
* Lesson (vwf/view/lesson)
* WebRTC (vwf/view/webrtc)

For 2D applications, or any application where the default drivers are not necessary, the keyword *nodriver* may be used. For example, in tile-puzzle-2D, a WebGL renderer is not required, and thus uses the following configuration:

	---
	model:
	  nodriver: 

-------------------

### Additional Information

In addition to defining the driver configuration for your application, the *config.yaml* file also allows you to set some additional information: an HTML title for the page. The following example configuration will set the title to the specified value, rather than the default *Virtual World Framework.*

	---
	info:
	  title: "My New VWF Application"

-------------------

### Passing Configuration Parameters in URL

An alternative option to using the *config.yaml* file is to pass in driver parameters via the URL. 

For instance, the Google Earth view driver may be loaded in an application without a configuration file:

	http://virtualworldframework.com/earth/#!google-earth

Both a model and a view driver may be loaded in an application with the following URL:

	http://virtualworldframework.com/humvee/?glge#!glge

Parameters may also be passed in via the URL. The following example passes in parameters for the application root and setting the pick interval:

	http://virtualworldframework.com/sandtable/?threejs#!threejs={"application-root":"#vwf-root","experimental-pick-interval":50}

*Note*: The URL takes precedence and will override anything defined via the configuration file.

</div>
-------------------

<!-- **How Drivers Connect to the Kernel** -->

<!-- The kernel has a list of drivers that stand side by side. It is setup so that there is a pipeline between the kernel and the drivers that setup the stages by performing things such as logging or translation between the kernel IDs and the object references. Drivers that don't care about the prototype relationship, can remove this information (ie glge can think about only a tree without thinking about the prototypes that make it up.) -->

<!-- KERNEL -> PIPELINE STAGES (ability to transform messages going across, currently only supported by the models) -> DRIVER / Check out redmine wiki article called 'Declaring a driver with pipeline stages' -->

<!-- Notes: Draw barrier between the view and the model? / User modules can be added or removed from the application (eventually will be loaded dynamically depending on what the application needs to function properly.) -->

