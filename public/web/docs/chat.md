<a name="chat" />

<div class="well" markdown="1">
Add Chat to Your Application
==============
--------------

Often for multi-user applications, it is useful to have text-based communication among all users. In VWF, the model and the HTML view need to be integrated through the use of methods and/or events. 

For a basic chat feature within a VWF application, define a method or event within the model. Setup the HTML view to call that method with the appropriate parameters (i.e. who is sending the message and the actual text of the message). The view will also need an event listener to capture these parameters. When one client calls "send chat", the model will then call the method, and each view will pick up the parameters from the associated listener. 

--------------

### Additions to the Model

The application model first needs a method to allow one user to send out a chat message to everyone in the application. The view can then listen for the method call and update the HTML chat view accordingly. The code below shows a sample method definition in yaml.

	methods:
	  sendChat:
	    parameters:
          - player
          - message

--------------

### Additions to the HTML View

Begin by adding a section to the HTML to capture a chat conversation and an input field for new messages. Here we'll use a *div* to display the conversation text and a *textarea* to capture new chat messages. These two tags are then wrapped in a containing *div* for easy css styling. 

	<div id="chatWindow">
	  <div id="chatContent"></div>
	  <textarea id="chatInput" rows="1" style='width:100%'/>
	</div>

In the view side JavaScript, we'll need a way to track which client is represented by the view (so that when a message is sent, all clients will know who sent it). In this example, we'll create a variable playerName to store this information. Because this is defined in the view, it will be unique to each client in the application. This field can be populated by either a login input screen or upon creation of the player node. Visit the [multi-user recipe](multiuser.html) for more information. 

	var playerName = $("#playerNameInput").val();;

Next, setup a jQuery listener for the chat *textarea* input field. Set a keydown listener for the *Enter* key to trigger the sendChat method, by passing in the following: the scene node, where the method is defined, the name of the method to call, and the method parameters - the value of the playerName field defined above, and the current value of the *chatInput textarea*. Additionally, set a keyup listener to clear the *textarea* upon sending, so it's ready for the next chat message. 

	$('#chatInput').keydown(function(e) {
	  e.stopPropagation();
	  var code = (e.keyCode ? e.keyCode : e.which);
	  if (code == 13) { //Enter
	    vwf_view.kernel.callMethod( sceneNode, "sendChat", [ playerName, $(this).val() ]);
	  }
	}).keyup(function(e) {
	  e.stopPropagation();
	  var code = (e.keyCode ? e.keyCode : e.which);
	  if (code == 13) { //Enter
	    $(this).val('');
	  }
	});

Finally, setup a VWF method listener in the view, so that each client in the application can respond to the *sendChat* method call. 

	vwf_view.calledMethod = function (nodeId, methodName, methodParameters) {
	  if (nodeId == sceneNode ) {
	    switch (methodName) {
	      case "sendChat":
	        $('#chatContent').append( "<span><b>" + methodParameters[0] + ": " + methodParameters[1] + "</b><br/></span>" );
	        break;
	    }
	  }
	}

Essentially this listener will add the chat message to the *chatContent div* created above. 

</div>
--------------
