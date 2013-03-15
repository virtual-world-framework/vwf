"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

function testWGL()
{
    var contextNames = ["webgl","experimental-webgl","moz-webgl","webkit-3d"];
    for(var i = 0; i < contextNames.length; i++){
        try{
            var canvas = document.createElement('canvas');
            var gl = canvas.getContext(contextNames[i]);
            if(gl){
                return true;
            }
        }
        catch(e){}
    }
    return false;
}

function testES5()
{
    return !this;
}

// Copied from socket.io's WS.check to avoid loading the library before testing.

function testWS(){
    return 'WebSocket' in window && WebSocket.prototype && ( WebSocket.prototype.send &&
        !!WebSocket.prototype.send.toString().match(/native/i)) && typeof WebSocket !== "undefined";
}

function updateOverlay()
{
	$("#loadVWFModal").centerInClient();
	$('#loadVWFModal').modal('show');

	
    // Test for WebGL
    if(testWGL())
    {
        //$('#WGL').prepend("<img src='images/check.png' alt=' ' width='20px'/>");
		$('#loadVWFProgressBar').width("33%");
    }
    else
    {
        $('#WGL').prepend("<img src='images/x.png' alt=' ' width='20px'/> WebGL");
		$('#loadVWFProgressBar').width("0%");
		$('#loadText').html("This browser is not compatible. Please review <a href='/web/docs/reqs.html'>documentation</a>.");
    }

    // Test for ECMAScript5
    if(testES5())
    {
        //$('#ES5').prepend("<img src='images/check.png' alt=' ' width='20px'/>");
		$('#loadVWFProgressBar').width("67%");
    }
    else
    {
        $('#ES5').prepend("<img src='images/x.png' alt=' ' width='20px'/> ECMAScript5");
		$('#loadVWFProgressBar').width("33%");
		$('#loadText').html("This browser is not compatible. Please review <a href='/web/docs/reqs.html'>documentation</a>.");
    }

	// Test for WebSockets
    if(testWS())
	{
		//$('#WS').prepend("<img src='images/check.png' alt=' ' width='20px'/>"); 
		$('#loadVWFProgressBar').width("90%");
		setTimeout("$('#loadVWFProgressBar').width('100%')",100);
		setTimeout("$('#loadVWFModal').modal('hide')",2000);

	}
	else
    {
        $('#WS').html("<img src='images/x.png' alt=' ' width='20px'/> WebSockets");
        $('#loadText').html("This browser is not compatible. Please review <a href='/web/docs/reqs.html'>documentation</a>.");
    }

}
