var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');
	SandboxAPI = require('./sandboxAPI');

// pick the application name out of the URL by finding the index.vwf.yaml
function findAppName(uri)
{
		
		var current = ".\\"
		while(!fs.existsSync(current+"index.vwf.yaml"))
		{	
			
			var next = uri.substr(0,Math.max(uri.indexOf('/'),uri.indexOf('\\'))+1);
			current += next;
			if(!next)
				break;
			
			
			uri = uri.substr(next.length);
		}
		if(fs.existsSync(current+"index.vwf.yaml"))
			return current;
		return null;	
}

//Generate a random ID for a session
var ValidIDChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function makeid()
{
    var text = "";
    

    for( var i=0; i < 16; i++ )
        text += ValidIDChars.charAt(Math.floor(Math.random() * ValidIDChars.length));

    return text;
}
var WaitingForConnection = 0;
var Active = 1;
var Dead = 2;

function Session(inid)
{
	this.id = inid;
	this.state = WaitingForConnection;
	this.clients = 0;
}

//Redirect the user to a new instance
function GenerateNewInstance(request,response,appname,newid)
{
	if(newid === undefined)
		newid = makeid() + "/";
	
	activesessions.push(new Session(newid));
	if(request.url[request.url.length-1] != '/')
		newid = request.url.substr(request.url.indexOf('/')) + '/' + newid;
				response.writeHead(200, {
					"Content-Type": "text/html"
				});
				response.write( "<html>" +
								"<head>" +
								"	<title>Virtual World Framework</title>" +
								"	<meta http-equiv=\"REFRESH\" content=\"0;url="+newid+"\">" +
								"</head>" +
								"<body>" +
								"</body>" +
								"</html>");
				response.end();
				return;
}

//Find the instance(session) ID in a URL
function FindSession(uri)
{
	//find the application name
	var app = findAppName(uri);
	if(!app)
		return null;
	//remove the application name	
	var minusapp = uri.substr(app.length-2);
	var parts = minusapp.split('\\');
	var testapp = parts[0];
	
	//Really, any slash delimited string after the app name should work
	//sticking with 16 characters for now 
	if(testapp.length == 16)
	{
		for(var i = 0; i < 16; i++)
		{
			if(ValidIDChars.indexOf(testapp[i]) == -1)
				return null;
		}
	
		return testapp;
	}
	return null;
}
//Remove the session identifer from the URL
function filterSession(uri,session)
{
	return uri.replace(session +'\\','').replace(session,'\\');
}
//Just serve a simple file
function ServeFile(filename,response,URL)
{
			fs.readFile(filename, "binary", function (err, file) {
			if (err) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write(err + "\n");
				response.end();
				return;
			}
 
			var type = mime.lookup(filename);
			response.writeHead(200, {
				"Content-Type": type
			});
			response.write(file, "binary");
			response.end();
			
		});
}
//Return a 404 not found coude
function _404(response)
{
			response.writeHead(404, {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": "*"
				});
				response.write("404 Not Found\n");
				response.end();
}
//Parse and serve a YAML file
function ServeYAML(filename,response, URL)
{
		var tf = filename;
		fs.readFile(filename, "utf8", function (err, file) {
			if (err) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write(err + "\n");
				response.end();
				return;
			}
			console.log(tf);
			try{
			var deYAML = JSON.stringify(YAML.load(file));
			}catch(e)
			{
				console.log(file);
				_404(response);
				return;
			}
			var type = "text/json";
			
			var callback = URL.query.callback;
			
			if(callback)
			{
				deYAML = callback+"(" + deYAML + ")";
				type = "application/javascript";
			}
			response.writeHead(200, {
				"Content-Type": type
			});
			response.write(deYAML, "utf8");
			response.end();
			
		});

}
//Serve a JSON object
function ServeJSON(jsonobject,response,URL)
{
		    
			response.writeHead(200, {
				"Content-Type": "text/json"
			});
			response.write(JSON.stringify(jsonobject), "utf8");
			response.end();
			
}
//Get the session ID from the handshake headers for a socket
function getNamespace(socket)
{

		var referer = (socket.handshake.headers.referer);
	  var host = (socket.handshake.headers.host);
	  var namespace = referer.substr(7+host.length);
	  if(namespace[namespace.length-1] != "/")
		namespace += "/";
	  return namespace;

}
function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}
//Start the VWF server
function startVWF(){

	global.activesessions = [];
	function OnRequest(request, response) {
	var path = ".\\public\\";
	
	var URL = url.parse(request.url,true);
    var uri = URL.pathname;
	uri = uri.replace(/\//g,'\\');
	
	if(URL.pathname.toLowerCase().indexOf('/vwfdatamanager.svc/') != -1)
	{
		//Route to DataServer
		SandboxAPI.serve(request,response);
		return;
	}
	
	var filename = libpath.join(path, uri);
	var session = FindSession(filename);
	
	//remove the session identifier from the request
	filename = filterSession(filename,session);
    
	//file is not found - serve index or map to support files
	//file is also not a yaml document
	var c1;
	var c2;
	
	
	
	c1 = libpath.existsSync(filename);
	c2 = libpath.existsSync(filename+".yaml");
    if(!c1 && !c2)
	{
			
		 //try to find the correct support file	
		 var appname = findAppName(filename);
		 if(!appname)
		 {
			
				filename = filename.substr(13);
				filename = ".\\support\\" + filename;
				filename = filename.replace('vwf.example.com','proxy\\vwf.example.com');
				
				
		 }
		 else
		 {
			 filename = filename.substr(appname.length-2);
			 if(appname == "")
				filename = './support/client/lib/index.html'
			 else	
				filename = './support/client/lib/' + filename;
		 }

	}
	//file does exist, serve normally 
	var c3 = libpath.existsSync(filename);
	var c4 = libpath.existsSync(filename +".yaml");
	if(c3)
	{
		//if requesting directory, setup instance
		//also, redirect to current instnace name of does not end in slash
		if (fs.statSync(filename).isDirectory()) 
		{
			var appname = findAppName(filename);
			if(!appname)
				appname = findAppName(filename+"\\");
			
			//no session id is given, new instance
			if(appname && session == null)
			{			
				GenerateNewInstance(request,response,appname);
				return;
			}
			//session needs to end in a slash, so redirect but keep session id
			if(appname && strEndsWith(URL.pathname,session))
			{
				GenerateNewInstance(request,response,appname,"");
				return;
			}
			//no app name but is directory. Not listing directories, so 404
			if(!appname)
			{
				_404(response);
				
				return;
			}
			//should never reach here.
			filename = './support/client/lib/index.html';
		}
		//just serve the file
		ServeFile(filename,response,URL);
		
	}
	else if(c4)
	{
		//was not found, but found if appending .yaml. Serve as yaml
		ServeYAML(filename +".yaml",response,URL);

	}
	// is an admin call, currently only serving instances
	else if(uri.indexOf('\\admin\\') != -1)
	{
		if(uri.indexOf('\\admin\\instances'))
		{
			var data = {};
			for(var i in global.sessions)
			{
				data[i] = {clients:{}};
				for(var j in global.sessions[i].clients)
				{
					data[i].clients[j] = null;
				}
			}
			ServeJSON(data,response,URL);
			return;
		}
	}
	else
	{
		_404(response);
		
		return;
	}
	
	} // close onRequest
	
	//create the server
	var srv = http.createServer(OnRequest).listen(3000);
	console.log('Serving on port 3000');
	
	//create socket server
	sio = sio.listen(srv,{log:false});
	sio.set('transports', ['websocket']);
	sio.sockets.on('connection', function (socket) {
	  
	  
	  //get session for new connection
	  var namespace = getNamespace(socket);
	  
	  //create or setup session data
	  if(!global.sessions)
	    global.sessions = {};
	   
	  //if it's a new session, setup record 
	  if(!global.sessions[namespace])
	  {
		global.sessions[namespace] = {};
		global.sessions[namespace].clients = {};
		global.sessions[namespace].time = 0.0;
		//keep track of the timer for this session
		global.sessions[namespace].timerID = setInterval(function(){
		
			global.sessions[namespace].time += 33.3333333;
			for(var i in global.sessions[namespace].clients)
			{
				var client = global.sessions[namespace].clients[i];
				client.emit('message',{"action":"tick","parameters":[],"time":global.sessions[namespace].time});
			}
		
		},33.3333333);
		
	  }
	 
	  //add the new client to the session data
      global.sessions[namespace].clients[socket.id] = socket;	 
	  
	  socket.pending = true;
	  socket.pendingList = [];
	  
	  
	  //The client is the first, is can just load the index.vwf, and mark it not pending
	  if(Object.keys(global.sessions[namespace].clients).length == 1)
	  {
		socket.emit('message',{"action":"createNode","parameters":["index.vwf"],"time":global.sessions[namespace].time});
		socket.pending = false;
	  }
	  //this client is not the first, we need to get the state and mark it pending
	  else
	  {
		var firstclient = Object.keys(global.sessions[namespace].clients)[0];
		firstclient = global.sessions[namespace].clients[firstclient];
		firstclient.emit('message',{"action":"getState","respond":true,"time":global.sessions[namespace].time});
		console.log('GetState from Client');
		socket.pending = true;
	  }
	  
	  socket.on('message', function (msg) {
		
			//need to add the client identifier to all outgoing messages
		    var message = JSON.parse(msg);
			message.client = socket.id;
			//distribute message to all clients on given session
			for(var i in global.sessions[namespace].clients)
			{
				var client = global.sessions[namespace].clients[i];
				
				//if the message was get state, then fire all the pending messages after firing the setState
				if(message.action == "getState")
				{
					console.log('Got State');
					var state = message.result;
					client.emit('message',{"action":"setState","parameters":[state],"time":global.sessions[namespace].time});
					client.pending = false;
					for(var j = 0; j < client.pendingList.length; j++)
						client.emit('message',client.pendingList[j]);
					client.pendingList = [];	
				}
				else
				{
					//just a regular message, so push if the client is pending a load, otherwise just send it.
					if(client.pending === true)
					{
						client.pendingList.push(message);
					}else
					{
						client.emit('message',message);
					}
				}
			}
			
	  });
	  
	  //When a client disconnects, go ahead and remove the session data
	  socket.on('disconnect', function () {
		  
		  global.sessions[namespace].clients[socket.id] = null;	 
		  delete global.sessions[namespace].clients[socket.id];
		  //if it's the last client, delete the data and the timer
		  if(Object.keys(global.sessions[namespace].clients).length == 0)
		  {
			clearInterval(global.sessions[namespace].timerID);
			delete global.sessions[namespace];
		  }

		});
		  
	});

}

exports.startVWF = startVWF;