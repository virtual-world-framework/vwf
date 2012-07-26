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
var playerNode = undefined;
var playerName = undefined;
var sceneNode = 'index-vwf';

var canvas = $('#' + sceneNode).get(0);
var keyStates = { keysDown: {}, mods: {}, keysUp: {} };
var buttonStates = {left: false, middle: false, right: false};
var lastUpdateTime = (+new Date);
var input = { 
    futureActive: function() {
        return ( this.lookActive || this.moveActive || this.button1Down || this.button2Down || this.keysAreDown() ); 
    },
    pointerDelta: function() { 
        if ( this.pointerInfo && this.lastPointerInfo ) {
          return [ (this.lastPointerInfo.position[0] - this.pointerInfo.position[0]) * 50,
                   (this.lastPointerInfo.position[1] - this.pointerInfo.position[1]) * 50 
                 ];
        }
        return undefined;
    },        
    keysAreDown: function() { return ( this.keyInfo && Object.keys( this.keyInfo.keysDown ).length > 0 ); },
    keyInfo: undefined,
    pointerInfo: undefined,
    lastPointerInfo: undefined,       
    pointerDownTime: undefined,
    pointerEventTime: undefined,
    lookActive: false, 
    moveActive: false, 
    look: [ 0, 0 ],
    move: [ 0, 0 ],
    button1Down: false,
    button2Down: false,
    lastUpdateTime: undefined,
    lastInputTime: undefined,
};

vwf_view.createdNode = function(nodeID, childID, childExtendsID, childImplementsIDs,
	childSource, childType, childURI, childName, callback /* ( ready ) */ ) {
	if(childName == playerName) {
		playerNode = childID;
	}
	else if(childName == (playerName + "Camera")) {
		var glgeCamera = vwf.views[0].state.nodes[ childID ].glgeObject;
		glgeCamera.setAspect(canvas.width / canvas.height);
		vwf.views[0].state.cameraInUse = glgeCamera;
		vwf.views[0].state.cameraInUseID = childID;
		vwf.views[0].state.scenes[sceneNode].glgeScene.setCamera(glgeCamera);
		vwf.views[0].state.scenes[sceneNode].camera.ID = childID;
	}
}

vwf_view.firedEvent = function ( nodeID, eventName, eventParameters ) {
    if(eventName == "playerDestroyed" && eventParameters[0] == playerNode) {
        $( "#gameOver" ).dialog( "open" );
    }
}

canvas.onmousedown = function(e) {
    if(playerNode) {
        switch( e.button ) {
            case 2: 
                buttonStates.right = true;
                break;
            case 1: 
                buttonStates.middle = true;
                break;
            case 0:
                buttonStates.left = true;
                break;
        };
        var eData = getMouseEventData( e );
        if ( eData ) {
            vwf_view.kernel.callMethod(sceneNode, "fireLaser", [playerName]);
        }
    }
}

canvas.onmouseup = undefined;

canvas.onmouseover = function(e) {
    if(playerNode) {
        var eData = getMouseEventData( e, false );
        if ( eData ) {
            // input.lastPointerInfo = input.pointerInfo;
            // input.pointerInfo = eData;
            // input.lastInputTime = vwf_view.kernel.time(); 
            // input.moveActive = true;
            // updateModel((+new Date));
        }
    }
}

canvas.onmouseout = function(e) {
    if(playerNode) {
        var eData = getMouseEventData( e, false );
        if ( eData ) {
            // input.lastPointerInfo = input.pointerInfo;
            // input.pointerInfo = undefined;
            // input.lastInputTime = vwf_view.kernel.time(); 
            // input.moveActive = false;
        }
    }
}

canvas.onmousemove = function(e) {
    if(playerNode) {
        var eData = getMouseEventData( e, false );
        if ( eData ) {
            // input.pointerEventTime = vwf_view.kernel.time();
            // input.lastInputTime = input.pointerEventTime;
            // input.lastPointerInfo = input.pointerInfo;
            // input.pointerInfo = eData;
            // input.lastInputTime = vwf_view.kernel.time(); 
        }
    }
}

canvas.onmousewheel = undefined;

window.onkeydown = function(e) {
	if(playerNode) {
        var active = input.futureActive();
        var validKey = false;
        var keyAlreadyDown = false;
        switch (e.keyCode) {
            case 13:
                vwf_view.kernel.callMethod(sceneNode, "fireLaser", [playerName]);
                break;
            case 17:
            case 16:
            case 18:
            case 19:
            case 20:
                break;
            default:
                keyAlreadyDown = !!keyStates.keysDown[e.keyCode];
                keyStates.keysDown[e.keyCode] = true;
                validKey = true;
                break;
        }

        if (!keyStates.mods) keyStates.mods = {};
        keyStates.mods.alt = e.altKey;
        keyStates.mods.shift = e.shiftKey;
        keyStates.mods.ctrl = e.ctrlKey;
        keyStates.mods.meta = e.metaKey;
        if(!keyAlreadyDown) {
            input.keyInfo = keyStates;
            input.lastInputTime = vwf_view.kernel.time();
            if(!active) {
                updateModel((+new Date));
            }
		}
	}
}

window.onkeyup = function(e) {
	if(playerNode) {
        var active = input.futureActive();
        var validKey = false;
        switch (e.keyCode) {
            case 16:
            case 17:
            case 18:
            case 19:
            case 20:
                break;
            default:
                delete keyStates.keysDown[e.keyCode];
                keyStates.keysUp[e.keyCode] = true;
                validKey = true;
                break;
        }

        keyStates.mods.alt = e.altKey;
        keyStates.mods.shift = e.shiftKey;
        keyStates.mods.ctrl = e.ctrlKey;
        keyStates.mods.meta = e.metaKey;
        input.keyInfo = keyStates;
        input.lastInputTime = vwf_view.kernel.time();
        if(!active) {
            updateModel((+new Date));
        }
        delete keyStates.keysUp[e.keyCode];
	}
}

function updateModel(time) {
    if(time - lastUpdateTime > 100) {
        vwf_view.kernel.callMethod(playerNode, "update", [input]);
        input.lastInputTime = vwf_view.kernel.time();
        lastUpdateTime = time;
    }
    if(input.futureActive()) {
        window.requestAnimationFrame(updateModel);
    }
}

function getMouseEventData(e) {
    var mouseButton = "left";
    switch( e.button ) {
        case 2: 
            mouseButton = "right";
            break;
        case 1: 
            mouseButton = "middle";
            break;
        default:
            mouseButton = "left";
            break;
    };

    var eventData = {
        button: mouseButton,
        clicks: 1,
        buttons: buttonStates,
        modifiers: {
                alt: e.altKey,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                meta: e.metaKey,
            },
        position: [ mouseXPos.call( this,e)/(window.innerWidth - 20), mouseYPos.call( this,e)/(window.innerHeight - 20) ],
        screenPosition: [mouseXPos.call(this,e), mouseYPos.call(this,e)]
    };
    return eventData;
}

function mouseXPos(e) {
    return e.clientX - e.currentTarget.offsetLeft + window.scrollX + window.slideOffset;
}

function mouseYPos(e) {
    return e.clientY - e.currentTarget.offsetTop + window.scrollY;
}
