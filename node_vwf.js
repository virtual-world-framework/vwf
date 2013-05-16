var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml'),
	SandboxAPI = require('./sandboxAPI'),
	Shell = require('./ShellInterface'),
	DAL = require('./dal'),
	express = require('express'),
	app = express(),
	landing = require('./landingRoutes');
var zlib = require('zlib');
	
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

//Generate a random ID for a instance
var ValidIDChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

global.log = function()
{
	var args = Array.prototype.slice.call(arguments);
	var level = args.splice(args.length-1)[0];
	
	if(!isNaN(parseInt(level)))
	{
		level = parseInt(level);
	}
	else
	{
		args.push(level)
		level = 1;
	};
	
	if(level <= global.logLevel)
		console.log.apply(this,args);
}

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

function instance(inid)
{
	this.id = inid;
	this.state = WaitingForConnection;
	this.clients = 0;
}

//Redirect the user to a new instance
function RedirectToInstance(request,response,appname,newid)
{
	if(newid === undefined)
		newid = makeid() + "/";
	
	var query = (url.parse(request.url).query) || "";
	if(query)
	{
		query = '?'+query;
		newid += query;
	}
	
	
	var path = url.parse(request.url).pathname;
	if(path[path-1] != '/')
		newid = path.substr(path.indexOf('/')) + '/' + newid;
	newid = newid.replace(/\/\//g,'/');
	newid = newid.replace(/\/\/\//g,'/');
	
	
	redirect(newid,response);			
}

function redirect(url,response)
{
				url = url.replace(/\\\\/g,'/');
				url = url.replace(/\\/g,'/');
				url = url.replace(/\/\//g,'/');
				
				url = url.replace(/\/\/\//g,'/');
				//url = url.replace('http://','');
				url = url.replace(/\/\/\//g,"/");
				url = url.replace(/\/\/\/\//g,"/");
				//url = 'http://' + url;
				response.writeHead(200, {
					"Content-Type": "text/html" 
				});
				response.write( "<html>" +
								"<head>" +
								"	<title>Virtual World Framework</title>" +
								"	<meta http-equiv=\"REFRESH\" content=\"0;url="+url+"\">" +
								"</head>" +
								"<body>" +
								"</body>" +
								"</html>");
				response.end();
				return;
}
//Find the instance(instance) ID in a URL
function Findinstance(uri)
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
//Remove the instance identifer from the URL
function filterinstance(uri,instance)
{
	return uri.replace(instance +'\\','').replace(instance,'\\');
}

function hash(str)
{
	return require('crypto').createHash('md5').update(str).digest("hex");
}

function _FileCache() 
{
	this.files = [];
	this.enabled = true;
	this.clear = function()
	{
		this.files.length = 0;
	}
	this.getDataType = function(file)
	{
		var type = file.substr(file.lastIndexOf('.')+1).toLowerCase();
		if(type === 'js' || type === 'html' || type === 'xml' || type === 'txt' || type === 'xhtml' || type === 'css')
		{
			return "utf8";
		}
		else return "binary";
	}
	this.getFile = function(path,callback)
	{
		for(var i =0; i < this.files.length; i++)
		{
			if(this.files[i].path == path)
			{	
				console.log('serving from cache: ' + path);
				callback(this.files[i]);
				return;
			}
		}
		// if got here, have no record;
		var datatype = this.getDataType(path);
		var file = fs.readFileSync(path);
		var stats = fs.statSync(path);
		
		if(file)
		{
			var self = this;
			zlib.gzip(file,function(_,zippeddata)
			{
				
				var newentry = {};
				newentry.path = path;
				newentry.data = file;
				newentry.stats = stats;
				newentry.zippeddata = zippeddata;
				newentry.datatype = datatype;
				newentry.hash = hash(file);
				console.log(newentry.hash);
				console.log('loading into cache: ' + path);
				if(self.enabled == true)
					self.files.push(newentry);
				callback(newentry);
				return;
			});
			return;
		}
		callback(null);
	}
	this.ServeFile = function(request,filename,response,URL)
	{
		FileCache.getFile(filename,function(file)
		{
			if (!file) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write('file load error' + "\n");
				response.end();
				return;
			}
			var type = mime.lookup(filename);
			
			if(request.headers['if-none-match'] === file.hash)
			{
				response.writeHead(304, {
				"Content-Type": type,
				"Last-Modified": file.stats.mtime,
				"ETag": file.hash,
				"Cache-Control":"public; max-age=31536000" ,
				
				});
				response.end();
				return;
			}
			
			if(request.headers['accept-encoding'] && request.headers['accept-encoding'].indexOf('gzip') >= 0)
			{
				response.writeHead(200, {
					"Content-Type": type,
					"Last-Modified": file.stats.mtime,
					"ETag": file.hash,
					"Cache-Control":"public; max-age=31536000" ,
					'Content-Encoding': 'gzip'
				});
				response.write(file.zippeddata, file.datatype);
			
			
			}else
			{
				response.writeHead(200, {
					"Content-Type": type,
					"Last-Modified": file.stats.mtime,
					"ETag": file.hash,
					"Cache-Control":"public; max-age=31536000"
					
				});
				response.write(file.data, file.datatype);
			}
			response.end();
			
		
		});	
	}
}

var FileCache = new _FileCache();
global.FileCache = FileCache;
//Just serve a simple file
function ServeFile(request,filename,response,URL)
{
	FileCache.ServeFile(request,filename,response,URL)
		
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
			//global.log(tf);
			try{
			var deYAML = JSON.stringify(YAML.load(file));
			}catch(e)
			{
				global.log("error parsing YAML " + filename );
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
//Get the instance ID from the handshake headers for a socket
function getNamespace(socket)
{

		var referer = (socket.handshake.headers.referer);
	  var host = (socket.handshake.headers.host);
	  var namespace = referer.substr(7+host.length);
	  if(namespace[namespace.length-1] != "/")
		namespace += "/";
	  return namespace;

}
function checkOwner(node,name)
{
	
	if(!node) return false;
	if(!node.properties || !node.properties.owner)
		return true;
	var names = node.properties.owner.split(',');
	if(names.indexOf(name) != -1)
		return true;
	return false;
}
function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

function isPointerEvent(message)
{
	if(!message) return false;
	if(!message.member) return false;
	
	return (message.member == 'pointerMove' || 
			   message.member == 'pointerHover' ||
			   message.member == 'pointerEnter' ||
			   message.member == 'pointerLeave' ||
			   message.member == 'pointerOver' ||
			   message.member == 'pointerOut' ||
			   message.member == 'pointerUp' ||
			   message.member == 'pointerDown' ||
			   message.member == 'pointerWheel'
			   )

}
//change up the ID of the loaded scene so that they match what the client will have
		var fixIDs = function(node)
		{
			if(node.children)
			var childnames = {};
			for(var i in node.children)
			{
				childnames[i] = null;
			}
			for(var i in childnames)
			{
				var childComponent = node.children[i];
				var childName = i;
				var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName; 
				childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
				childComponent.id = childID;
				node.children[childID] = childComponent;
				delete node.children[i];
				fixIDs(childComponent);
			}
		}
		
//Start the VWF server
function startVWF(){
	
	global.activeinstances = [];
	function OnRequest(request, response) 
	{
	
		try{
			var path = ".\\public\\";
			
			var URL = url.parse(request.url,true);
			var uri = URL.pathname;
			//global.log( URL.pathname);
			uri = uri.replace(/\//g,'\\');
		
			if(URL.pathname.toLowerCase().indexOf('/vwfdatamanager.svc/') != -1)
			{
				//Route to DataServer
				SandboxAPI.serve(request,response);
				return;
			}
			if(URL.pathname == '/' || URL.pathname == '')
			{
				redirect('/adl/sandbox/',response);
				return;
			}
			
			var filename = libpath.join(path, uri);
			var instance = Findinstance(filename);
			//global.log(instance);
			//remove the instance identifier from the request
			filename = filterinstance(filename,instance);
			
			//file is not found - serve index or map to support files
			//file is also not a yaml document
			var c1;
			var c2;
			
			
			//global.log(filename);
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
					
					//no instance id is given, new instance
					if(appname && instance == null)
					{			
						//GenerateNewInstance(request,response,appname);
						
						
						redirect(URL.pathname+"/index.html",response);
						//console.log('redirect ' + appname+"./index.html");
						return;
					}
					//instance needs to end in a slash, so redirect but keep instance id
					if(appname && strEndsWith(URL.pathname,instance))
					{
						RedirectToInstance(request,response,appname,"");
						return;
					}
					//no app name but is directory. Not listing directories, so 404
					if(!appname)
					{
						global.log(filename + "is a directory")
						_404(response);
						
						return;
					}
					
					//this is the bootstrap html. Must have instnace and appname
					filename = './support/client/lib/index.html';
					
					//when loading the bootstrap, you must have an instance that exists in the database
					console.log(appname);
					DAL.getInstance(appname.substr(8).replace(/\\/g,'_') + instance + "_",function(data)
					{
						if(data)
							ServeFile(request,filename,response,URL);
						else
							redirect(filterinstance(URL.pathname,instance)+"/index.html",response);
					});
					return;
				}
				//just serve the file
				ServeFile(request,filename,response,URL);
				
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
					for(var i in global.instances)
					{
						data[i] = {clients:{}};
						for(var j in global.instances[i].clients)
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
				global.log("404 : " + filename)
				_404(response);
				
				return;
			}
		}
		catch(e)
		{
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write(e.toString(), "utf8");
				response.end();
		
		
		}
	} // close onRequest
	
	function WebSocketConnection(socket) {
	  
	
	  //get instance for new connection
	  var namespace = getNamespace(socket);
	  
	  //create or setup instance data
	  if(!global.instances)
	    global.instances = {};
	   
	  //if it's a new instance, setup record 
	  if(!global.instances[namespace])
	  {
		global.instances[namespace] = {};
		global.instances[namespace].clients = {};
		global.instances[namespace].time = 0.0;
		global.instances[namespace].state = {};
		
		//create or open the log for this instance
		var log = fs.createWriteStream(SandboxAPI.getDataPath()+'//Logs/'+namespace.replace(/[\\\/]/g,'_'), {'flags': 'a'});
		global.instances[namespace].Log = function(message,level)
		{
			if(global.logLevel >= level)
			{
				log.write(message +'\n');
				global.log(message +'\n');
			}
		}
		//keep track of the timer for this instance
		global.instances[namespace].timerID = setInterval(function(){
		
			global.instances[namespace].time += .05;
			for(var i in global.instances[namespace].clients)
			{
				var client = global.instances[namespace].clients[i];
				client.emit('message',{"action":"tick","parameters":[],"time":global.instances[namespace].time});
			}
		
		},50);
		
	  }
	 
	  //add the new client to the instance data
      global.instances[namespace].clients[socket.id] = socket;	 
	  
	  socket.pending = true;
	  socket.pendingList = [];
	  
	  
	  //The client is the first, is can just load the index.vwf, and mark it not pending
	  if(Object.keys(global.instances[namespace].clients).length == 1)
	  {
		
		//socket.emit('message',{"action":"getState","respond":true,"time":global.instances[namespace].time});
		
		var instance = namespace;
		//Get the state and load it.
		//Now the server has a rough idea of what the simulation is
		var state = SandboxAPI.getState(instance) || [];
		global.instances[namespace].state = {nodes:{}};
		global.instances[namespace].state.nodes['index-vwf'] = {id:"index-vwf",properties:state[state.length-1],children:{}};
		
		global.instances[namespace].state.findNode = function(id,parent)
		{
			var ret = null;
			if(!parent) parent = this.nodes['index-vwf'];
			if(parent.id == id)
				ret = parent;
			else if(parent.children)
			{
				for(var i in parent.children)
				{
					ret = this.findNode(id, parent.children[i]);
					if(ret) return ret;
				}
			}
			return ret;
		}
		global.instances[namespace].state.deleteNode = function(id,parent)
		{
			if(!parent) parent = this.nodes['index-vwf'];
			if(parent.children)
			{
				for(var i in parent.children)
				{
					if( i == id)
					{
						delete parent.children[i];
						return
					}
				}
			}
		}
		
		
		
		//only really doing this to keep track of the ownership
		for(var i =0; i < state.length-1; i++)
		{
			var childComponent = state[i];
			var childName = state[i].properties.DisplayName + i;
			var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName; 
			childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
			state[i].id = childID;
			global.instances[namespace].state.nodes['index-vwf'].children[childID] = state[i];
			fixIDs(state[i]);
		}
		//global.log(Object.keys(global.instances[namespace].state.nodes['index-vwf'].children));
		
		//this is a blank world, go ahead and load the default
		socket.emit('message',{"action":"createNode","parameters":["index.vwf"],"time":global.instances[namespace].time});
		socket.pending = false;
	  }
	  //this client is not the first, we need to get the state and mark it pending
	  else
	  {
		var firstclient = Object.keys(global.instances[namespace].clients)[0];
		firstclient = global.instances[namespace].clients[firstclient];
		firstclient.emit('message',{"action":"getState","respond":true,"time":global.instances[namespace].time});
		global.instances[namespace].Log('GetState from Client',2);
		socket.pending = true;
	  }
	  
	  socket.on('message', function (msg) {
		
			//need to add the client identifier to all outgoing messages
			try{
				var message = JSON.parse(msg);
			}catch(e)
			{
				return;
			}
			//global.log(message);
			message.client = socket.id;
			
			
			//Log all message if level is high enough
		   if(isPointerEvent(message))
		   {
				global.instances[namespace].Log(JSON.stringify(message), 4);
		   }
		   else
		   {
				global.instances[namespace].Log(JSON.stringify(message), 3);
		   }
			
				
				
			var sendingclient = global.instances[namespace].clients[socket.id];
			
			//do not accept messages from clients that have not been claimed by a user
			//currently, allow getstate from anonymous clients
			if(!sendingclient.loginData && message.action != "getState" && message.member != "latencyTest")
			{
				if(isPointerEvent(message))
					global.instances[namespace].Log('DENIED ' + JSON.stringify(message), 4);
				else
					global.instances[namespace].Log('DENIED ' + JSON.stringify(message), 2);				
				return;
			}
			//We'll only accept a setProperty if the user has ownership of the object
			if(message.action == "setProperty")
			{
			      var node = global.instances[namespace].state.findNode(message.node);
				  if(!node)
				  {
					global.instances[namespace].Log('server has no record of ' + message.node,1);
					return;
				  }
				  if(checkOwner(node,sendingclient.loginData.UID))
				  {	
						//We need to keep track internally of the properties
						//mostly just to check that the user has not messed with the ownership manually
						if(!node.properties)
							node.properties = {};
						node.properties[message.member] = message.parameters[0];
						global.instances[namespace].Log("Set " +message.member +" of " +node.id+" to " + message.parameters[0],1);
				  }
				  else
				  {
					global.instances[namespace].Log('permission denied for modifying ' + node.id,1);
					return;
				  }
			}
			//We'll only accept a any of these if the user has ownership of the object
			if(message.action == "createMethod" || message.action == "createProperty" || message.action == "createEvent" || 
				message.action == "deleteMethod" || message.action == "deleteProperty" || message.action == "deleteEvent")
			{
			      var node = global.instances[namespace].state.findNode(message.node);
				  if(!node)
				  {
					global.instances[namespace].Log('server has no record of ' + message.node,1);
					return;
				  }
				  if(checkOwner(node,sendingclient.loginData.UID))
				  {	
						global.instances[namespace].Log("Do " +message.action +" of " +node.id,1);
				  }
				  else
				  {
					global.instances[namespace].Log('permission denied for '+message.action+' on ' + node.id,1);
					return;
				  }
			}
			//We'll only accept a deleteNode if the user has ownership of the object
			if(message.action == "deleteNode")
			{
				  var node = global.instances[namespace].state.findNode(message.node);
				  if(!node)
				  {
					global.instances[namespace].Log('server has no record of ' + message.node,1);
					return;
				  }
				  if(checkOwner(node,sendingclient.loginData.UID))
				  {	
						//we do need to keep some state data, and note that the node is gone
						global.instances[namespace].state.deleteNode(message.node)
						global.instances[namespace].Log("deleted " +node.id,1);
				  }
				  else
				  {
					global.instances[namespace].Log('permission denied for deleting ' + node.id,1);
					return;
				  }
			}
			//We'll only accept a createChild if the user has ownership of the object
			//Note that you now must share a scene with a user!!!!
			if(message.action == "createChild")
			{
				  global.instances[namespace].Log(message,1);
				  var node = global.instances[namespace].state.findNode(message.node);
				  if(!node)
				  {
					global.instances[namespace].Log('server has no record of ' + message.node,1);
					return;
				  }
				  //Keep a record of the new node
				  if(checkOwner(node,sendingclient.loginData.UID) || message.node == 'index-vwf')
				  {	
						var childComponent = message.parameters[0];
						if(!childComponent) return;
						var childName = message.member;
						if(!childName) return;
						var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName; 
						childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
						childComponent.id = childID;
						if(!node.children) node.children = {};
						node.children[childID] = childComponent;
						if(!childComponent.properties)
							childComponent.properties = {};
						fixIDs(node.children[childID]);
						global.instances[namespace].Log("created " + childID,1);
				  }
				  else
				  {
					global.instances[namespace].Log('permission denied for creating child ' + node.id,1);
					return;
				  }
			}
			//distribute message to all clients on given instance
			for(var i in global.instances[namespace].clients)
			{
				var client = global.instances[namespace].clients[i];
				
				//if the message was get state, then fire all the pending messages after firing the setState
				if(message.action == "getState")
				{
					global.instances[namespace].Log('Got State',1);
					var state = message.result;
					global.instances[namespace].Log(state,2);
					client.emit('message',{"action":"setState","parameters":[state],"time":global.instances[namespace].time});
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
	  
	  //When a client disconnects, go ahead and remove the instance data
	  socket.on('disconnect', function () {
		  
		  var loginData = global.instances[namespace].clients[socket.id].loginData;
		  global.log(socket.id,loginData )
		  global.instances[namespace].clients[socket.id] = null;	
		  delete global.instances[namespace].clients[socket.id];
		  //if it's the last client, delete the data and the timer
		  
		  if(loginData)
		  {
			  delete loginData.clients[socket.id];
			  for(var i in global.instances[namespace].clients)
			  {
					var avatarID = 'character-vwf-'+loginData.UID;
					//deleting node for avatar
					global.log("Unexpected disconnect. Deleting node for user avatar " + loginData.UID);
					var cl = global.instances[namespace].clients[i];
					cl.emit('message',{"action":"deleteNode","node":avatarID,"time":global.instances[namespace].time});
					global.instances[namespace].state.deleteNode(avatarID);					
			  }
		  }
		  
		  
		  if(Object.keys(global.instances[namespace].clients).length == 0)
		  {
			clearInterval(global.instances[namespace].timerID);
			delete global.instances[namespace];
		  }

		});
		  
	}
	//create the server
	
	
	//start the DAL
	var p = process.argv.indexOf('-p');
	var port = p >= 0 ? parseInt(process.argv[p+1]) : 3000;
		
	p = process.argv.indexOf('-d');
	var datapath = p >= 0 ? process.argv[p+1] : "C:\\VWFData";
		
	p = process.argv.indexOf('-l');
	global.logLevel = p >= 0 ? process.argv[p+1] : 2;
	global.log('LogLevel = ' +  global.logLevel,0);	
	
	var adminUID = 'admin';
	
	p = process.argv.indexOf('-a');
	adminUID = p >= 0 ? process.argv[p+1] : adminUID;	
	
	p = process.argv.indexOf('-nocache');
	if(p >= 0)
	{
	   FileCache.enabled = false;
	   console.log('server cache disabled');
	}
	SandboxAPI.setDAL(DAL);
	SandboxAPI.setDataPath(datapath);
	Shell.setDAL(DAL);
	DAL.startup(function(){
		
		global.sessions = [];
		global.adminUID = adminUID;
		
		//var srv = http.createServer(OnRequest).listen(port);
		
		app.set('layout', 'layout');
		app.set('views', __dirname + '/public/adl/sandbox/views');
		app.set('view engine', 'html');
		app.engine('.html', require('hogan-express'));
		
		app.use(express.methodOverride());
		app.use (function(req, res, next) {
			
		   var data='';
		   req.setEncoding('utf8');
		   req.on('data', function(chunk) { 
			  data += chunk;
		   });

		   req.on('end', function() {
			req.body = data;
			next();
		   });
		});
		
		app.use(app.router);
		app.get('/adl/sandbox', landing.index);
		app.get('/adl/sandbox/index', landing.index);
		app.get('/adl/sandbox/create', landing.create);
		app.get('/adl/sandbox/signup', landing.signup);
		app.get('/adl/sandbox/login', landing.login);
		app.get('/adl/sandbox/logout', landing.logout);
		app.get('/adl/sandbox/edit', landing.edit);
		app.get('/adl/sandbox/remove', landing.remove);
		app.get('/adl/sandbox/user', landing.user);
		
		app.use(OnRequest);
		var listen = app.listen(port);
		
		global.log('Admin is "' + global.adminUID+"\"",0);
		global.log('Serving on port ' + port,0);
		
		Shell.StartShellInterface();  
		//create socket server
		sio = sio.listen(listen,{log:false});
		sio.set('transports', ['websocket']);
		sio.sockets.on('connection', WebSocketConnection);
	});

}

exports.startVWF = startVWF;