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

function testWS()
{
    // var ws = 'ws' + document.URL.substring(4) + 'websocket';
    // var websocket = new WebSocket(ws);
    // websocket.onerror = function(evt) 
    // { 
    //     // For single user mode
    //     //$('#WS').html("<img src='images/warning.png' alt=' ' width='20px'/>WebSockets");
    //     $('#WS').html("<img src='images/x.png' alt=' ' width='20px'/>WebSockets");
    //     $('#loadText').html("<span class='loadError'>This browser is not compatible. <br/>Please review <a href='/web/docs/reqs.html'>documentation</a> for specific <br/>requirements. </span>");
    //     return;
    // };
 //   if(! io.Transport.websocket.check() )
 //   {
 //       $('#WS').html("<img src='images/x.png' alt=' ' width='20px'/>WebSockets");
 //       $('#loadText').html("<span class='loadError'>This browser is not compatible. <br/>Please review <a href='/web/docs/reqs.html'>documentation</a> for specific <br/>requirements. </span>");
 //   }
}

function updateOverlay()
{
    // Test for WebGL
    if(testWGL())
    {
        $('#WGL').prepend("<img src='images/check.png' alt=' ' width='20px'/>");
    }
    else
    {
        $('#WGL').prepend("<img src='images/x.png' alt=' ' width='20px'/>");
    }

    // Test for ECMAScript5
    if(testES5())
    {
        $('#ES5').prepend("<img src='images/check.png' alt=' ' width='20px'/>");
    }
    else
    {
        $('#ES5').prepend("<img src='images/x.png' alt=' ' width='20px'/>");
    }

    testWS();

    if($('#WS img').length == 0)
    {
        $('#WS').prepend("<img src='images/check.png' alt=' ' width='20px'/>"); 
    }

    // Test to to see if VWF can run
    if(! (testWGL() && testES5()) )
    {
        $('#loadText').html("<span class='loadError'>This browser is not compatible. <br/>Please review <a href='/web/docs/reqs.html'>documentation</a> for specific <br/>requirements. </span>");
    }
}
