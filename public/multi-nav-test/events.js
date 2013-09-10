var playerPosition = undefined;
var lastUpdateTime = 0;
var maxUpdateTime = 30;
var playerNode;
var keyboardRotationSpeed = 0.6;
var translationSpeed = 80;
var keyStates = { keysDown: {}, mods: {}, keysUp: {} };

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
    look: [ 0, 0 ],
    move: [ 0, 0 ],
    lastUpdateTime: undefined,
}

//Detect keydown event and modify our input accordingly.
window.onkeydown = function(e) {
	if (!playerNode) playerNode = vwf.find("","/navobj_" + vwf_view.kernel.moniker() + "/")[0];
	var active = input.futureActive();
	var validKey = false;
	var keyAlreadyDown = false;
	switch (e.keyCode) {
		default:
			keyAlreadyDown = !!keyStates.keysDown[e.keyCode];
			keyStates.keysDown[e.keyCode] = true;
			validKey = true;
			break;
	}
	if(!keyAlreadyDown) {
		input.keyInfo = keyStates;
		input.lastInputTime = vwf_view.kernel.time();
		switch (e.keyCode) {
			case 38: // Up Arrow
			case 87: // W
				input.move[1] += 5;
				break;
			case 40: // Down Arrow
			case 83: // S
				input.move[1] += -5;
				break;
			case 37: // left              
			case 65:  //a
				input.look[0] += -1;
				vwf.setProperty("index-vwf","aProperty",1);
				break;
			case 39: // right              
			case 68:  //d
				input.look[0] += 1;
				//debugger;
				vwf.getNode("index-vwf");
				break;
			default:
				break;
		}
		if(!active) {
			updateModel();
		}
	}
}
//Detect keyup events and modify our input accordingly.
window.onkeyup = function(e) {
	var active = input.futureActive();
	var validKey = false;
	switch (e.keyCode) {
		default:
			delete keyStates.keysDown[e.keyCode];
			keyStates.keysUp[e.keyCode] = true;
			validKey = true;
			break;
	}

	input.keyInfo = keyStates;
	input.lastInputTime = vwf_view.kernel.time();
	if(!active) {
		updateModel();
	}
	switch (e.keyCode) {
			case 38: // Up Arrow
			case 87: // W
				input.move[1] -= 5;
				break;
			case 40: // Down Arrow
			case 83: // S
				input.move[1] -= -5;
				break;
			case 37: // left              
			case 65:  //a
				input.look[0] -= -1;
				break;
			case 39: // right              
			case 68:  //d
				input.look[0] -= 1;
				break;
			default:
				break;
	}
	delete keyStates.keysUp[e.keyCode];
}
//Call the movePlayer function and update the player's position
function updateModel(time) {
	movePlayer(input);
	input.lastInputTime = vwf_view.kernel.time();
    if(input.futureActive()) {
        window.requestAnimationFrame(updateModel);
    }
}
//Rotate and move the player according to keyboard input.
function movePlayer(input) {
	//this corresponds to the old update function.
	if (!playerPosition) playerPosition = vwf.getNode(playerNode).properties.translation;
	if ( input ) {
		if (input.look[0] != 0 || input.look[1] != 0) rotatePlayer(input, input.look[0], input.look[1]);
		if (input.move[0] != 0 || input.move[1] != 0) translatePlayer(input, input.move[0], input.move[1]);
	}
}

function angularDistance(input) {
	// Should take 4 seconds to go around 360 degrees
	return keyboardRotationSpeed * 90 * timeElapsed(input);
}

function timeElapsed(input) {
	var timeElapsed = vwf_view.kernel.time() - input.lastInputTime;
	if ( !input.lastInputTime || timeElapsed > 1 ) {
		timeElapsed = 1;  
	}
	return timeElapsed;
}

function rotatePlayer(input, x, y) {
	//this corresponds to the old look function
	var rotation = undefined;
	if ( input.pointerInfo && input.pointerInfo.modifiers.ctrl ) {
		if ( y != 0 ) rotation = [ 1, 0, 0, -y * angularDistance(input) ];
	}
	else {
		if ( x != 0 ) { 
			rotation = [ 0, 0, 1, -x * angularDistance(input) ];
		}
	}
	if (rotation) {
		vwf_view.kernel.callMethod(playerNode,"look",[rotation]);
	}
}


function translatePlayer(input, x, y) {
	var trans = getCameraVec( x, y, 0 );
	trans[2] = 0;
	if ( goog.vec.Vec3.magnitudeSquared( trans ) > goog.vec.EPSILON ) {
		trans = goog.vec.Vec3.scale(
			trans,
			distanceCalc(input),
			trans
		);
		var avatarPos = goog.vec.Vec3.add(
			playerPosition,
			trans,
			goog.vec.Vec3.create()
		);
		playerPosition = avatarPos;
		//call yaml method to update everyone else's position of this player
		vwf_view.kernel.callMethod(playerNode,"move", [playerPosition]);
	}
}


function getCameraVec( x, y, z ) {
      var camRotMat = vwf.getNode(playerNode).properties.transform;
      for (var i=11; i<16; i++) camRotMat[i] = 0;
      var camAt = goog.vec.Mat4.multVec4(
        camRotMat,
        goog.vec.Vec4.createFromValues( x, y, z, 1 ),
        goog.vec.Vec3.create()
      );
      return camAt;
}


function distanceCalc(input) {
	return translationSpeed * timeElapsed(input);
}
