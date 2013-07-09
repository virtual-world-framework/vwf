//  Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
//  Secretary of Defense (Personnel & Readiness).
//  
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
//  in compliance with the License. You may obtain a copy of the License at
//  
//    http://www.apache.org/licenses/LICENSE-2.0
//  
//  Unless required by applicable law or agreed to in writing, software distributed under the License
//  is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
//  or implied. See the License for the specific language governing permissions and limitations under
//  the License.





//  This javascript file contains the variable definition and functions necessary for providing the 
//  heartbeat function used to track when users are connected.



//  var playerId:     Variable to store the node ID of the user that this view is connected as.
//                    starts as undefined before the user has logged in.
//  var heartbeatId:  Javascript Interval ID. Used to stop the heartbeat function when necessary.

//  function startHeartbeat(newPlayerId, heartbeatInterval):  Function that stores the playerID
//                                  and starts heartbeating for that playerID, frequency based
//                                  on heartbeatInterval.
//  function isConnected():  Returns whether the client is connected and logged in to the server
//                           or not.


var heartbeatId = undefined;
var localUsername = undefined;

function startHeartbeat( heartbeatInterval ) {
    heartbeatId = setInterval( heartbeat, heartbeatInterval );
}

function stopHeartbeat( ) {
    if ( heartbeatId != undefined ) {
        clearInterval( heartbeatId );
        heartbeatId = undefined;
    }
}

function heartbeat( ) {
    if ( isConnected( ) ) {
        vwf_view.kernel.callMethod( sceneId, "heartbeatUser", [ localUsername ] );
    }
    else {
        stopHeartbeat( );
    }
}

function isConnected( ) {
    if ( localUsername != undefined ) {
        return true;
    }
    return false;
}
