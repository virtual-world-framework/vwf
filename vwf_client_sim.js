var  http = require("http");
var  fs = require('fs');
var  url = require("url");
var  mime = require('mime');
var  io = require('socket.io-client');
var  CryptoJS = require('cryptojs');
var messageCompress = require('./support/client/lib/messageCompress').messageCompress;
function GUID()
{
	var S4 = function ()
	{
		return Math.floor(
				Math.random() * 0x10000 /* 65536 */
			).toString(16);
	};

	return (
			S4() + S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + "-" +
			S4() + S4() + S4()
		);
}
		
var EncryptPassword = function (password, username,salt)
	{
		console.log(password,username,salt);
		var unencrpytedpassword = password + username + salt;
		for (var i = 0; i < 1000; i++)
		{
			unencrpytedpassword = CryptoJS.Crypto.SHA256(unencrpytedpassword) + '';
		}
		
		return unencrpytedpassword;
	}

function LaunchAvatar(username_in,password_in,server_in,port_in,session_in)
{
	var username = username_in;
	var passwordHASH;
	var password = password_in;
	var session = session_in;
	var socket;
	var socketid;
	var server = server_in;
	var port = port_in;
	var currenttime = 0;
	
	// some #defines for readability
	var UP =0;
	var DOWN = 1;
	var salt;
	
	process.on('exit', function() {
	  
	  socket.disconnect();
	});
	
	
	var stdin = process.openStdin();
	stdin.on('data', function(chunk) {
		if(!chunk) return;
		
		
		chunk = chunk + '';
		chunk = chunk.replace(/\r\n/g,'');
		
		if(chunk == 'quit')
			process.exit();
	});
	console.log('Launching Avatar at ' + server +':'+port+' with username: ' + username +' and password: ' + password+' in world '+session);
	
	//quick macro to send a message
	function send(data)
	{
		console.log(data);
		socket.emit('message',messageCompress.pack(JSON.stringify(data)));	
	}
	//generate a key event and send it
	// State is either UP or DOWN, key is a char
	function KeyEvent(state,key)
	{
		
		key = key.toUpperCase()[0];
		
		//the proper keyevent message
		var keyevent = {"time": currenttime,
		"node": "index-vwf",
		"action": "dispatchEvent",
		"member": (state == UP ? 'keyUp' :  'keyDown'),   //key up or key down
		"parameters": [
			[
				{
					"keysDown": {},
					"mods": {
						"alt": false,
						"shift": false,
						"ctrl": false,
						"meta": false
					},
					"keysUp": {}
				}
			],
			null
		],
		"client": socketid}
	  
	  
		keyevent.parameters[0][0][state == UP ? 'keysUp' :  'keysDown'][key] = {
							"key": key,
							"code": key.charCodeAt(0),
							"char": key
						}
		//send the event				
		send(keyevent);			
	}


	//once the entire login procedure is done, we can start sending commands over the socket
	worldLoginComplete = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
		str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
		console.log(str);
		
		//we are finally done logging in, so let's send the avatar object over the socket to be created
		//The object below is the proper defination of an avatar
		var component = 	
		{
			"time": currenttime,
			"node": "index-vwf",
			"action": "createChild",
			"member": username,
			"parameters": [
					{
						"extends": "character.vwf",
						"source": "usmale.dae",
						"type": "subDriver/threejs/asset/vnd.collada+xml",
						"properties": {
							"PlayerNumber": username,   //make it look like the user we logged in as is the owner of the avatar
							"owner": username,
							"ownerClientID": socket.socket.sessionid,	//this lets the avatar know which socket controlls it
							"profile": {
								"Username": username,
								"Name": "TEST AVATAR",
								"Age": "32",
								"Birthday": "",
								"Password": "",
								"Relationship": "Married",
								"City": "Mclean",
								"State": "VA",
								"Homepage": "",
								"Employer": "ADL",
								"Title": "",
								"Height": "",
								"Weight": "",
								"Nationality": "",
								"Avatar": "usmale.dae",
								"inventoryKey": "1komqvgn",
								"password": ""
							},
							"translation": [				//we randomly place him in the world center +-5
								(Math.random() - .5) * 5,
								(Math.random() - .5) * 5,
								0
							]
						},
						"events": {
							"ShowProfile": null,
							"Message": null
						},
						"scripts": [
							"this.ShowProfile = function(){if(vwf.client() != vwf.moniker()) return; _UserManager.showProfile(_DataManager.GetProfileForUser(this.PlayerNumber))     }; \nthis.Message = function(){if(vwf.client() != vwf.moniker()) return; setupPmWindow(this.PlayerNumber)     }"
						]
					}
				]
			}
		console.log('sending avatar');
		socket.emit('message',messageCompress.pack(JSON.stringify(component)));
	  });
	}

	//here, we handle incomming data from the server
	function OnMessage(data)
	{
		
		data = JSON.parse(messageCompress.unpack(data));
		console.log(data);
		//keep track of the server time pulse
		currenttime = data.time;
		//if we are keeping track of state and the server requests it, send it
		if(data.action == 'getState')
		{
			send({action:'getState','parameters':[],'result':{nodes:[global.state],queue:[]} || {}});
		}
		//if the server sends is world state, keep track of it
		if(data.action == 'createNode')
		{
			global.state = data.parameters[0];
			console.log(global.state);
		}
		if(data.action == 'createChild')
		{
			
			
			
			var childComponent = JSON.parse(JSON.stringify(data.parameters[0]));
			if(!childComponent) return;
			var childName = data.member;
			if(!childName) return;
			var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName.replace(/ /g,'-'); 
			childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
			if(!global.state.children)
			global.state.children={};
			global.state.children[childID] = childComponent;
		}
		if(data.action == 'setState')
		{
			global.state = data.parameters[0].nodes[0];
			console.log(global.state);
		}
		//Here is the real meat of the simulation.
		//This bot randomly hits the keys, and the avatar will move.
		if(data.action == 'tick')
		{
		
		
			//send a fake mouse event, to test server 
			
			var mouseevent  = {"time":5.799999999999987,"node":"index-vwf","action":"dispatchEvent","member":"pointerMove","parameters":[[{"button":"right","clicks":1,"buttons":{"left":false,"middle":false,"right":true},"modifiers":{"alt":false,"ctrl":false,"shift":false,"meta":false},"position":[0.37105263157894736,0.20229405630865485],"screenPosition":[705,194]}],{"":[{"distance":0.25039778107183475,"globalPosition":[null,null,null],"globalNormal":[0,0,1],"globalSource":[1.202807068824768,-3.8025035858154297,-3.8025035858154297]}],"box2-vwf-9d1cb46-c41b-e63-1ac-8fb9a3f7f073":[{"source":{"0":-1.5917856693267822,"1":5.0322041511535645,"2":-5.0322041511535645},"distance":0.25039778107183475,"globalSource":[1.202807068824768,-3.8025035858154297,-3.8025035858154297]}]}],"client":"wRI1voo6_Fp_h5ZMYXrM"};
			send(mouseevent);
			var rnd = Math.floor(Math.random() * 100);
			if(rnd == 0)
			{
				KeyEvent(DOWN,'w');
			}
			if(rnd == 1)
			{
				KeyEvent(UP,'w');
			}
			if(rnd == 2)
			{
				KeyEvent(DOWN,'s');
			}
			if(rnd == 3)
			{
				KeyEvent(UP,'s');		
			}
			if(rnd == 4)
			{
				KeyEvent(DOWN,'z');
			}
			if(rnd == 5)
			{
				KeyEvent(UP,'z');
			}
			if(rnd == 6)
			{
				KeyEvent(DOWN,'c');
			}
			if(rnd == 7)
			{
				KeyEvent(UP,'c');
			}
		
		}
	}   //end onMessage

	//now that we know the session cookie, we can call the world login endpoint
	function connectSocket(cookie)
	{
	  //first, we connect the websocket to the server	
	  socket = io.connect('http://'+server+':'+port+'/');
	  
	  //we need to know this so we can tell the server that the user with the given session cookie ownes the socket
	  socketid = socket.socket.sessionid;
	  
	  //link up the handler for the incomming data
	  socket.on('message', function (data) {
		OnMessage(data);
	  });
	  
	  //now that we have set the socket to the world, tell the server that the user at the session cookie are the owner of this socket
	  socket.on('namespaceSet', function (data) {
		console.log(socket.socket.sessionid);
		
		//we now must use an http request to tell the server that 'we' own the socket.
		//'we' meaning the user logged into the client with the given session cookie
		//goto worldLoginComplete when done
		var req = http.request({hostname:server,port:port,method:'GET', path:'/adl/sandbox///vwfDataManager.svc/login?S='+session+'&CID=' + socket.socket.sessionid,headers:{cookie:cookie}}, worldLoginComplete).end();
	  });
	  //This is a special case for the simulated client
	  //we must ask the server to associate this websocket with a the given world
	  //when complete, the server will call namespaceSet
	  socket.emit('setNamespace', messageCompress.pack({ space: session }));
	 
	  
	}

	
	//we get here after the client has submitted the username and password properly to the server
	siteLoginComplete = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
		str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
		console.log(str);
		
		//this is the session cookie for the client. It identifies that this client has session on the server
		console.log(response.headers['set-cookie']);
			
		//the server sends a session ID to the client. We need to remember this to log into the world
		connectSocket(response.headers['set-cookie']);
	  });
	}

	//after we have the salt for the user, we can create the proper username/password hash to log in
	saltRetreiveComplete = function(response) {
	  var str = '';

	  //another chunk of data has been recieved, so append it to `str`
	  response.on('data', function (chunk) {
		str += chunk;
	  });

	  //the whole response has been recieved, so we just print it out here
	  response.on('end', function () {
		console.log('salt: '+str);
		salt = str.trim();
		
		//create the proper hash for the password, and try to loging this client to the server
		//when complete, goto siteLoginComplete
		passwordHASH = EncryptPassword(password,username,salt);
		http.request('http://'+server+':'+port+'/vwfDataManager.svc/sitelogin?UID='+username+'&P='+passwordHASH, siteLoginComplete).end();
	  });
	}
	
	
	var postdata;
	function SignupPostCompete(response)
	{
	
		var str = '';

		  //another chunk of data has been recieved, so append it to `str`
		  response.on('data', function (chunk) {
			str += chunk;
		  });

		  //the whole response has been recieved, so we just print it out here
		  response.on('end', function () {
			console.log(str);
			//boot up the whole client, start by getting the hash for this user
			//when complete, goto saltRetreiveComplete
			http.request('http://'+server+':'+port+'/vwfDataManager.svc/salt?UID='+username, saltRetreiveComplete).end();
		  });
		  
	
	
	}
	
	function Signup()
	{
	
			var salt = GUID();
			var enc_password = EncryptPassword(password,username,salt);
			
			var profile = {};
			
			
			profile.Username = username;
			profile.Password = enc_password;
			profile.Avatar = 'usmale.dae';
			profile.Salt = salt;
			
			postdata = JSON.stringify(profile);
			
			var options = {
			 hostname : server,
			 port : port,
			 path : '/vwfDataManager.svc/CreateProfile?UID='+username+ "&P=" +enc_password,
			 method: 'POST'
			};

			var req = http.request(options, SignupPostCompete);
			req.write(postdata);
			req.end();
			
			
	
	
	}
	Signup();
	
	

}

// -u is the username of the account to use
var p = process.argv.indexOf('-u');
var user = p >= 0 ? process.argv[p+1] : "test";

// -p is the password
p = process.argv.indexOf('-p');
var password = p >= 0 ? process.argv[p+1] : "1111";

// -s the name of the server to connect to
p = process.argv.indexOf('-s');
var server = p >= 0 ? process.argv[p+1] : "localhost";

// -t is the port to use on the server
p = process.argv.indexOf('-t');
var port = p >= 0 ? process.argv[p+1] : "3000";
 
// -w is the UID of the world to attach to 
p = process.argv.indexOf('-w');
var world = p >= 0 ? process.argv[p+1] : "QNsNId8RYKeO6MSz";

//launch the simulated client 
LaunchAvatar(user,password,server,port,"/adl/sandbox/" + world + "/");

process.on('message', function(m) {
  console.log('CHILD got message:', m);
  if(m == 'kill')
	process.exit();
});	

  