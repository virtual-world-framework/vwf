<a name="persistence" />

<div class="well" markdown="1">
Persistence
===================
-------------------
Persistence is the ability to save the state of any given instance of an application to load at a later time. For example, the state of 'instance-x' of 'my-app' can be saved at point 'A'. Another instance, 'instance-y', of 'my-app' can then load the saved state 'A'.

	instance-x  o---A---o...
	                |
	instance-y      o---o---o...

### Save the State of an Instance

The primary way to save the state of an application instance is using a POST HTTP request. (Note: The POST ability is only allowable when the server is in development mode by default.)

	// Save State Information
	var xhr = new XMLHttpRequest();
	var state = vwf.getState();

The state of the application then needs to be converted to JSON and encoded for URI. 

	xhr.open("POST", "/"+root+"/save/"+filename, true);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.send("root="+root+"/"+filename+"&filename=saveState&inst="+inst+"&timestamp="+timestamp+"&extension=.vwf.json"+"&jsonState="+json);

The above request will store the saved state (json) to 'documents/root/filename/saveState_inst.vwf.json' based on the input provided. 

If desired, the configuration file data can also be saved in the same manner.

	// Save config file to server
	var xhrConfig = new XMLHttpRequest();
	xhrConfig.open("POST", "/"+root+"/save/"+filename, true);
	xhrConfig.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhrConfig.send("root="+root+"/"+filename+"&filename=saveState&inst="+inst+"&timestamp="+timestamp+"&extension=.vwf.config.json"+"&jsonState="+jsonConfig);

### List Saved States for an Application

The primary way to retrieve saved states from the server is using a GET HTTP request via jQuery.getJSON(). There are two available URLs that can be passed as parameters to retrieve states. A URL including "listsaves" will return an object for every saved state of the given application (root). A URL including "listallsaves" will return an object for every saved state for any application. 

	$.getJSON( "/" + root + "/listsaves", function( data ) {
	  $.each( data, function( key, value ) {
	    // Programmatically append to selection list
	  } );
	} );

The above call using either "listsaves" or "listallsaves" will return an object array where each object contains the following information:

- applicationpath: "/app-name"
- savename: "filename" 
- revision: 1234567890 
- latestsave: true

This information can then be used to generate a list of available saved states, and subsequently, to load one.

### Load a Saved State

The selected saved state can be loaded programmatically via the URL path using the information obtained from the listsaves array object:

	window.location.pathname = applicationPath + "/" + instanceID + '/load/' + savename + '/';

The instance ID is optional. If one is not provided, a new one will be randomly generated. 

### Default Implementation

Persistence is a built-in feature of the editor view of the framework by default. 

To save the current state of an application instance:

  1. Open the Users tab of the [editor](documentation.html#editor).  
  2. Enter a file name for the file to save (if no name is entered, the instance ID from the URL will be selected).  
  3. Click the Save button. The document will be saved in /documents/app_name/file_name/ within the vwf directory.  

To open a previously saved application:

  1. Open the Users tab of the [editor](documentation.html#editor).  
  2. Select the drop down list above the Load button, and choose a file to load.  
  3. Click the Load button. The application will be loaded in the current browser tab.  

Note: Persistence functionality is only enabled by default in development mode on the server.

</div>
-------------------
