var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');
	


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
function FindSession(uri)
{
	var app = findAppName(uri);
	if(!app)
		return null;
	var minusapp = uri.substr(app.length-2);
	var parts = minusapp.split('\\');
	var testapp = parts[0];
	
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
function filterSession(uri,session)
{
	return uri.replace(session +'\\','').replace(session,'\\');
}

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
function _404(response)
{
			response.writeHead(404, {
				"Content-Type": "text/plain",
				"Access-Control-Allow-Origin": "*"
				});
				response.write("404 Not Found\n");
				response.end();
}
function ServeYAML(filename,response, URL)
{

		fs.readFile(filename, "utf8", function (err, file) {
			if (err) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write(err + "\n");
				response.end();
				return;
			}
 
			
			
			
			var deYAML = JSON.stringify(YAML.load(file));
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

function ServeJSON(jsonobject,response,URL)
{
		    
			response.writeHead(200, {
				"Content-Type": "text/json"
			});
			response.write(JSON.stringify(jsonobject), "utf8");
			response.end();
			
}

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
function startVWF(){

	global.activesessions = [];
	function OnRequest(request, response) {
	var path = ".\\public\\";
	
	var URL = url.parse(request.url,true);
    var uri = URL.pathname;
	uri = uri.replace(/\//g,'\\');
	
	
	var filename = libpath.join(path, uri);
	var session = FindSession(filename);
	
	//remove the session identifier from the request
	filename = filterSession(filename,session);
    
	//file is not found - serve index or map to support files
	//file is also not a yaml document
    if(!libpath.existsSync(filename) && !libpath.existsSync(filename+".yaml"))
	{

		 var appname = findAppName(filename);
		 if(!appname)
		 {
				console.log(filename);
				filename = filename.substr(13);
				filename = ".\\support\\" + filename;
				filename = filename.replace('vwf.example.com','proxy\\vwf.example.com');
				console.log(filename);
				
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
	
	if(libpath.existsSync(filename))
	{
		//if requesting directory, setup instance
		if (fs.statSync(filename).isDirectory()) 
		{
			var appname = findAppName(filename);
			if(!appname)
				appname = findAppName(filename+"\\");
			
			if(appname && session == null)
			{			
				GenerateNewInstance(request,response,appname);
				return;
			}
			//session needs to end in a slash, so redirect
			if(appname && strEndsWith(URL.pathname,session))
			{
				GenerateNewInstance(request,response,appname,"");
				return;
			}
			if(!appname)
			{
				_404(response);
				
				return;
			}
			filename = './support/client/lib/index.html';
		}
		
		ServeFile(filename,response,URL);
		
	}
	else if(libpath.existsSync(filename +".yaml"))
	{
		
		ServeYAML(filename +".yaml",response,URL);

	}
	// is an admin call
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
	
}
	
	var srv = http.createServer(OnRequest).listen(3000);
	console.log('Serving on port 3000');
	
	
	
	sio = sio.listen(srv,{log:false});
	sio.set('transports', ['websocket']);
	sio.sockets.on('connection', function (socket) {
	  
	  
	  
	  var namespace = getNamespace(socket);
	  
	  if(!global.sessions)
	    global.sessions = {};
	   
	  if(!global.sessions[namespace])
	  {
		global.sessions[namespace] = {};
		global.sessions[namespace].clients = {};
		global.sessions[namespace].time = 0.0;
		global.sessions[namespace].timerID = setInterval(function(){
		
			global.sessions[namespace].time += 33.3333333;
			for(var i in global.sessions[namespace].clients)
			{
				var client = global.sessions[namespace].clients[i];
				client.emit('message',{"action":"tick","parameters":[],"time":global.sessions[namespace].time});
			}
		
		},33.3333333);
		
	  }
	 
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
		
		    var message = JSON.parse(msg);
			message.client = socket.id;
			for(var i in global.sessions[namespace].clients)
			{
				var client = global.sessions[namespace].clients[i];
				
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
	  
	  socket.on('disconnect', function () {
		  
		  global.sessions[namespace].clients[socket.id] = null;	 
		  delete global.sessions[namespace].clients[socket.id];
		  if(Object.keys(global.sessions[namespace].clients).length == 0)
		  {
			clearInterval(global.sessions[namespace].timerID);
			delete global.sessions[namespace];
		  }

		});
		  
	});

}






exports.startVWF = startVWF;