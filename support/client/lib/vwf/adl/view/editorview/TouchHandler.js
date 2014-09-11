define({
	initialize:function()
	{
		var lastbutton = -1;
		var ongoingTouches = [];
		function ongoingTouchIndexById(idToFind) {
		  for (var i=0; i<ongoingTouches.length; i++) {
				var id = ongoingTouches[i].identifier;
				 
				if (id == idToFind) {
				  return i;
				}
			  }
			  return -1;    // not found
			}
		
		function touchHandler(event)
		{
			try{
			var touches = event.changedTouches,
				first = touches[0],
				type = "";
				 switch(event.type)
			{
				case "touchstart": type = "mousedown"; break;
				case "touchmove":  type="mousemove"; break;        
				case "touchend":   type="mouseup"; break;
				case "touchleave":   type="mouseup"; break;
				case "touchcancel":   type="mouseup"; break;
				default: return;
			}
			if(event.type == 'touchstart')
			{
				for (var i=0; i<touches.length; i++) {
						if(ongoingTouchIndexById(touches[i].identifier) == -1) ongoingTouches.push(touches[i]);
				}
				var simulatedEvent2 = document.createEvent("MouseEvent");
				simulatedEvent2.initMouseEvent("mouseup", true, true, window, 1, 
									  first.screenX, first.screenY, 
									  first.clientX, first.clientY, false, 
									  false, false, false, lastbutton/*left*/, null);
				simulatedEvent2.currentTarget = first.target;
				first.target.dispatchEvent(simulatedEvent2);

			}
			if(event.type == 'touchend' || event.type == 'touchleave' || event.type == 'touchcancel')
			{
				 for (var i=0; i<touches.length; i++) {
				 if(ongoingTouchIndexById(touches[i].identifier) != -1)  ongoingTouches.splice(ongoingTouchIndexById(touches[i].identifier), 1);  // remove it; we're done
				}
	  
			}
			
			

			//initMouseEvent(type, canBubble, cancelable, view, clickCount, 
			//           screenX, screenY, clientX, clientY, ctrlKey, 
			//           altKey, shiftKey, metaKey, button, relatedTarget);
			
			var mousebutton = 0;
			mousebutton = ongoingTouches.length -1;
			lastbutton = mousebutton;
					document.title =  ongoingTouches.length;
				

			if(type=="mouseup")
			mousebutton++;			

			var simulatedEvent = document.createEvent("MouseEvent");
			simulatedEvent.initMouseEvent(type, true, true, window, 1, 
									  first.screenX, first.screenY, 
									  first.clientX, first.clientY, false, 
									  false, false, false, mousebutton /*left*/, null);
			simulatedEvent.currentTarget = first.target;
			first.target.dispatchEvent(simulatedEvent);
			if(type == 'mouseup')
			{
				var simulatedEvent = document.createEvent("MouseEvent");
				simulatedEvent.initMouseEvent('click', true, true, window, 1, 
										  first.screenX, first.screenY, 
										  first.clientX, first.clientY, false, 
										  false, false, false, mousebutton /*left*/, null);
				
				 first.target.dispatchEvent(simulatedEvent);
			
			}
			
			event.preventDefault();
			}catch(e)
			{
			document.title = e.message;
			}
		}
	//	document.addEventListener("touchstart", touchHandler, true);
	//	document.addEventListener("touchmove", touchHandler, true);
	//	document.addEventListener("touchend", touchHandler, true);
	//	document.addEventListener("touchcancel", touchHandler, true); 	
	}
});