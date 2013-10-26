global.version = 23;
var libpath = require('path'),
http = require("http"),
fs = require('fs'),
url = require("url"),
mime = require('mime'),
sio = require('socket.io'),
YAML = require('js-yaml'),
SandboxAPI = require('./sandboxAPI'),
Shell = require('./ShellInterface'),
DAL = require('./DAL'),
express = require('express'),
app = express(),
Landing = require('./landingRoutes');
var zlib = require('zlib');
var requirejs = require('requirejs');
var compressor = require('node-minify');
var async = require('async');
var messageCompress = require('./support/client/lib/messageCompress').messageCompress;
var exec=require('child_process').exec;
//Get the version number. This will used to redirect clients to the proper url, to defeat their local cache when we release
global.version = require('./Version').version;

var  appNameCache = [];
// pick the application name out of the URL by finding the index.vwf.yaml
// Cache - this means that adding applications to the server will requrie a restart
function findAppName(uri)
{
		
	var current = "."+libpath.sep;
	var testcache = (current + uri);
	
	//cache and avoid some sync directory operations
	for(var i =0; i < appNameCache.length; i++)
	{
		if(testcache.indexOf(appNameCache[i]) ==0)
		{
			
			return appNameCache[i];
		}
	}
	while(!fs.existsSync(current+"index.vwf.yaml"))
	{	
		
		var next = uri.substr(0,Math.max(uri.indexOf('/'),uri.indexOf('\\'))+1);
		current += next;
		if(!next)
			break;
		
		
		uri = uri.substr(next.length);
	}
	if(fs.existsSync(current+"index.vwf.yaml"))
	{
		
		appNameCache.push(current);
		return current;
	}
	return null;	
}

//Generate a random ID for a instance
var ValidIDChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

global.error = function()
{
	var red, brown, reset;
					red   = '\u001b[31m';
					brown  = '\u001b[33m';
					reset = '\u001b[0m';
					
	var args = Array.prototype.slice.call(arguments);
	args[0] = red + args[0] + reset;
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
//amke a random VWF Instance id
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

//Redirect, just used on some invalid paths
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
	var parts = minusapp.split(libpath.sep);
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
	return uri.replace(instance+libpath.sep,'').replace(instance,libpath.sep);
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
	//Get the file entry, or load it
	this.getFile = function(path,callback)
	{
		path = libpath.normalize(path);
		path = libpath.resolve(__dirname, path);
		
		//Cannot escape above the application paths!!!!
		if(path.toLowerCase().indexOf(__dirname.toLowerCase()) != 0 && path.toLowerCase().indexOf(global.datapath.toLowerCase()) != 0)
		{
			global.error(path + " is illegal");
			callback(null);
			return;
		}
		//Cannot have the users.db!
		if(path.toLowerCase().indexOf('users.db') != -1)
		{
			global.error(path + " is illegal");
			callback(null);
			return;
		}
		
		//Find the record
		for(var i =0; i < this.files.length; i++)
		{
			if(this.files[i].path == path)
			{	
				global.log('serving from cache: ' + path,2);
				//Callback with the record
				callback(this.files[i]);
				return;
			}
		}
		// if got here, have no record;
		var datatype = this.getDataType(path);
		//Read the raw file
		fs.readFile(path,function(err,file){
			fs.stat(path,function(err,stats)
			{
				var self = this;
				//Call this after minify, or right away if not js or minify disabled
				var preMin = function(file)
				{
					if(file)
					{
						//gzip the data
						zlib.gzip(file,function(_,zippeddata)
						{
							//record the data
							var newentry = {};
							
							newentry.path = path;
							newentry.data = file;
							newentry.stats = stats;
							newentry.zippeddata = zippeddata;
							newentry.datatype = datatype;
							newentry.hash = hash(file);
							
							global.log(newentry.hash,2);
							global.log('loading into cache: ' + path,2);
							
							// if enabled, cache in memory
							if(FileCache.enabled == true)
							{
								global.log('cache ' + path,2); 
								FileCache.files.push(newentry);
								
								//minify is currently not compatable with auto-watch of files
								if(!FileCache.minify)
								{
									//reload files that change on disk
									fs.watch(path,{},function(event,filename){
									
									
									
										global.log(newentry.path + ' has changed on disk',2);
										FileCache.files.splice(FileCache.files.indexOf(newentry),1);
									
									});
								}
							}
							//send the record to the caller . Usually FileCache.serveFile
							callback(newentry);
							return;
						});
						return;
					}
					callback(null);
				}
				//Send right away if not minifying
				if(!FileCache.minify)
				{
					
					preMin(file);
				}
				else
				{
					//if minifying and ends with js
					if(strEndsWith(path,'js'))
					{
						//compress the JS then gzip and save the results
						console.log('minify ' + path);
						new compressor.minify({
						    type: 'uglifyjs',
						    fileIn: path,
						    fileOut: path+'_min.js',
						    callback: function(err, min){
							
							if(err)
								preMin(file)
							else
							{	
							//remove the file on disk - cached in memory
							fs.unlinkSync(path+'_min.js');
							//completed minify, go ahead and cache and serve
							preMin(min);
							}
						    }
						});
					}
					// likewise, try to minify the css
					else if(strEndsWith(path,'css'))
					{
						//compress the css then gzip and save the results
						console.log('minify ' + path);
						new compressor.minify({
						    type: 'yui-css',
						    fileIn: path,
						    fileOut: path+'_min.css',
						    callback: function(err, min){
							
							if(err)
								preMin(file)
							else
							{	
							//remove the file on disk - cached in memory
							fs.unlinkSync(path+'_min.css');
							//completed minify, go ahead and cache and serve
							preMin(min);
							}
						    }
						});
					}else
					{
						//minifying, but not a file that can minify
						preMin(file);
					}

				}				
			});
		});
	} // end getFile
	//Serve a file, takes absolute path
	//TODO, handle streaming of audio and video
	this.ServeFile = function(request,filename,response,URL)
	{
		//check if already loaded
		FileCache.getFile(filename,function(file)
		{
			//error if not found
			if (!file) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write('file load error' + "\n");
				response.end();
				return;
			}
			//get the type
			var type = mime.lookup(filename);
			
			//deal with the ETAG
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
			
			//If the clinet can take the gzipped encoding, send that
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
			
			
			}
			//if the client cannot accept the gzip, send raw
			else
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
}  //end FileCache

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

		try{
		var referer = (socket.handshake.headers.referer);
		
		var index = referer.indexOf('/adl/sandbox');
		var namespace = referer.substring(index);
		
	  if(namespace[namespace.length-1] != "/")
		namespace += "/";
	 
	  return namespace;
	  }catch(e)
	  {
		return null;
	  }

}
//Check that a user has permission on a node
function checkOwner(node,name)
{
	var level = 0;
	if(!node.properties) node.properties = {};
	if(!node.properties.permission) node.properties.permission = {}
	var permission = node.properties['permission'];
	var owner = node.properties['owner'];
	if(owner == name)
	{
		level = Infinity;
		return level;
	}
	if(permission)
	{
		level = Math.max(level?level:0,permission[name]?permission[name]:0,permission['Everyone']?permission['Everyone']:0);
	}
	var parent = node.parent;
	if(parent)
		level = Math.max(level?level:0,checkOwner(parent,name));
	return level?level:0;	
	
}

//***node, uses REGEX, escape properly!
function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

//Is an event in the websocket stream a mouse event?
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
		var childName = childComponent.name || i;
		var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName.replace(/ /g,'-'); 
		childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
		childComponent.id = childID;
		node.children[childID] = childComponent;
		node.children[childID].parent = node;
		delete node.children[i];
		fixIDs(childComponent);
	}
}
		
//Start the VWF HTTP server
function startVWF(){
	
	global.activeinstances = [];
	function OnRequest(request, response) 
	{
	
		try{
			var safePathRE = RegExp('/\//'+(libpath.sep=='/' ? '\/' : '\\')+'/g');
			var path = "./public".replace(safePathRE);
			
			var URL = url.parse(request.url,true);
			var uri = URL.pathname.replace(safePathRE);
			//global.log( URL.pathname );
			
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
			
			
			//obey some old VWF URL formatting
			if(uri.indexOf('/admin/'.replace(safePathRE)) != -1)
			{
				
				//gets a list of all active sessions on the server, and all clients
				if(uri.indexOf('/admin/instances'.replace(safePathRE)) != -1)
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
			//file is not found - serve index or map to support files
			//file is also not a yaml document
			var c1;
			var c2;
			
			
			//global.log(filename);
			libpath.exists(filename,function(c1){
				libpath.exists(filename+".yaml",function(c2){
					if(!c1 && !c2)
					{
							
						 //try to find the correct support file	
						 var appname = findAppName(filename);
						 if(!appname)
						 {
							
								filename = filename.substr(13);
								filename = "./support/".replace(safePathRE) + filename;
								filename = filename.replace('vwf.example.com','proxy/vwf.example.com');
								
						 }
						 else
						 {
								
							 filename = filename.substr(appname.length-2);
							 if(appname == "")
								filename = './support/client/lib/index.html'.replace(safePathRE);
							 else	
								filename = './support/client/lib/'.replace(safePathRE) + filename;
							
						 }

					}
					//file does exist, serve normally 
					libpath.exists(filename,function(c3){
						libpath.exists(filename +".yaml",function(c4){
							if(c3)
							{
								//if requesting directory, setup instance
								//also, redirect to current instnace name of does not end in slash
								fs.stat(filename,function(err,isDir)
								{
									if (isDir.isDirectory()) 
									{
										var appname = findAppName(filename);
										if(!appname)
											appname = findAppName(filename+libpath.sep);
										
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
											
											_404(response);
											
											return;
										}
										
										//this is the bootstrap html. Must have instnace and appname
										filename = './support/client/lib/index.html'.replace(safePathRE);
										
										//when loading the bootstrap, you must have an instance that exists in the database
										global.log('Appname:', appname);
										var instanceName = appname.substr(8).replace(/\//g,'_').replace(/\\/g,'_') + instance + "_";
										DAL.getInstance(instanceName,function(data)
										{
											if(data)
												ServeFile(request,filename,response,URL);
											else {
												
												redirect(filterinstance(URL.pathname,instance)+"/index.html",response);
											}
										});
										return;
									}
									//just serve the file
									ServeFile(request,filename,response,URL);
								});
							}
							else if(c4)
							{
								//was not found, but found if appending .yaml. Serve as yaml
								ServeYAML(filename +".yaml",response,URL);

							}
							// is an admin call, currently only serving instances
							else
							{
								global.log("404 : " + filename)
								_404(response);
								
								return;
							}
						});
					});
				});	
			});
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
	
	
	function ServeSinglePlayer(socket, namespace,instancedata)
	{
		console.log('single player');
		var instance = namespace;
		var state = SandboxAPI.getState(instance) || [{owner:undefined}];
		var state2 = SandboxAPI.getState(instance) || [{owner:undefined}];
		
		fs.readFile("./public/adl/sandbox/index.vwf.yaml", 'utf8',function(err,blankscene)
		{
			blankscene= YAML.load(blankscene);
			
			blankscene.id = 'index-vwf';
			blankscene.patches= "index.vwf";
			if(!blankscene.children)
				blankscene.children = {};
			//only really doing this to keep track of the ownership
			for(var i =0; i < state.length-1; i++)
			{
				
				var childComponent = state[i];
				var childName = state[i].name || state[i].properties.DisplayName + i;
				var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName.replace(/ /g,'-'); 
				childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
				//state[i].id = childID;
				//state2[i].id = childID;
				blankscene.children[childName] = state2[i];
				state[i].id = childID;
				
				fixIDs(state[i]);
			}
			var props = state[state.length-1];
			if(props)
			{
				if(!blankscene.properties)
					blankscene.properties = {};
				for(var i in props)
				{
					blankscene.properties[i] = props[i];
				}
				for(var i in blankscene.properties)
				{
					if( blankscene.properties[i] && blankscene.properties[i].value)
						blankscene.properties[i] = blankscene.properties[i].value;
					else if(blankscene.properties[i] && (blankscene.properties[i].get || blankscene.properties[i].set))
						delete blankscene.properties[i];
				}
			}
			//global.log(Object.keys(global.instances[namespace].state.nodes['index-vwf'].children));
			
			//this is a blank world, go ahead and load the default
			
			
			
			
			socket.emit('message',{"action":"createNode","parameters":[blankscene],"time":0});
			socket.emit('message',{"action":"goOffline","parameters":[blankscene],"time":0});
			socket.pending = false;
		});
		
	}
	
	function WebSocketConnection(socket, _namespace) {
	
		var namespace = _namespace || getNamespace(socket);
		
		 if(!namespace)
		  {
			  socket.on('setNamespace',function(msg)
			  {
				console.log(msg.space);
				WebSocketConnection(socket,msg.space);
				socket.emit('namespaceSet',{});
			  });
			  return;
		  }
	  
		DAL.getInstance(namespace.replace(/\//g,"_"),function(instancedata)
		{
			
			//if this is a single player published world, there is no need for the server to get involved. Server the world state and tell the client to disconnect
			if(instancedata && instancedata.publishSettings && instancedata.publishSettings.singlePlayer)
			{
				ServeSinglePlayer(socket, namespace,instancedata)
			}else
				ClientConnected(socket, namespace,instancedata);
		});
	};
	
	function ClientConnected(socket, namespace, instancedata) {
	  
	  
	  //create or setup instance data
	  if(!global.instances)
	    global.instances = {};
	   
	  socket.loginData = {};
	  var allowAnonymous = false;
	  if(instancedata.publishSettings && instancedata.publishSettings.allowAnonymous)
	  		   allowAnonymous = true;
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
		global.instances[namespace].Error = function(message,level)
		{
			var red, brown, reset;
			red   = '\u001b[31m';
			brown  = '\u001b[33m';
			reset = '\u001b[0m';
			if(global.logLevel >= level)
			{
				log.write(message +'\n');
				global.log(red + message + reset + '\n');
			}
		}
		
		
		
		
		global.instances[namespace].totalerr = 0;
		
		
		//keep track of the timer for this instance
		global.instances[namespace].timerID = setInterval(function(){
		
			var now = process.hrtime();
			now = now[0] * 1e9 + now[1];
			now = now/1e9;
			
			
			var timedelta = (now - global.instances[namespace].lasttime) || 0;
			var timeerr = (timedelta - .050)*1000;
			global.instances[namespace].lasttime = now;
			global.instances[namespace].totalerr += timeerr;
			
			
			global.instances[namespace].time += .05;
			
			var tickmessage = messageCompress.pack(JSON.stringify({"action":"tick","parameters":[],"time":global.instances[namespace].time}));
			for(var i in global.instances[namespace].clients)
			{
				var client = global.instances[namespace].clients[i];
				if(!client.pending)
					client.emit('message',tickmessage);
				else
				{
					client.pendingList.push(tickmessage);
					console.log('pending tick');
				}
			}
		
		},50);
		
	  }
	 
	  
	  
	  
	  var loadClient = null;
	  
	  if(Object.keys(global.instances[namespace].clients).length != 0)
	  {
		for(var i in global.instances[namespace].clients)
		{
		   var testClient = global.instances[namespace].clients[i];
		   if(!testClient.pending && testClient.loginData)
		   {
				loadClient = testClient;
				break;
			}
		}
	  }
	  
	  //add the new client to the instance data
	  global.instances[namespace].clients[socket.id] = socket;	 
	  
	  socket.pending = true;
	  socket.pendingList = [];
	  //The client is the first, is can just load the index.vwf, and mark it not pending
	  if(!loadClient)
	  {
		console.log('load from db');
		//socket.emit('message',{"action":"getState","respond":true,"time":global.instances[namespace].time});
		
		var instance = namespace;
		//Get the state and load it.
		//Now the server has a rough idea of what the simulation is
		var state = SandboxAPI.getState(instance) || [{owner:undefined}];
		
		var state2 = SandboxAPI.getState(instance) || [{owner:undefined}];
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
		
		fs.readFile("./public/adl/sandbox/index.vwf.yaml", 'utf8',function(err,blankscene)
		{
			blankscene= YAML.load(blankscene);
			
			blankscene.id = 'index-vwf';
			blankscene.patches= "index.vwf";
			if(!blankscene.children)
				blankscene.children = {};
			//only really doing this to keep track of the ownership
			for(var i =0; i < state.length-1; i++)
			{
				
				var childComponent = state[i];
				var childName = state[i].name || state[i].properties.DisplayName + i;
				var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName.replace(/ /g,'-'); 
				childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
				//state[i].id = childID;
				//state2[i].id = childID;
				blankscene.children[childName] = state2[i];
				state[i].id = childID;
				global.instances[namespace].state.nodes['index-vwf'].children[childID] = state[i];
				global.instances[namespace].state.nodes['index-vwf'].children[childID].parent = global.instances[namespace].state.nodes['index-vwf'];
				fixIDs(state[i]);
			}
			var props = state[state.length-1];
			if(props)
			{
				if(!blankscene.properties)
					blankscene.properties = {};
				for(var i in props)
				{
					blankscene.properties[i] = props[i];
				}
				for(var i in blankscene.properties)
				{
					if( blankscene.properties[i] && blankscene.properties[i].value)
						blankscene.properties[i] = blankscene.properties[i].value;
					else if(blankscene.properties[i] && (blankscene.properties[i].get || blankscene.properties[i].set))
						delete blankscene.properties[i];
				}
			}
			//global.log(Object.keys(global.instances[namespace].state.nodes['index-vwf'].children));
			
			//this is a blank world, go ahead and load the default
			
			
			
			
			socket.emit('message',messageCompress.pack(JSON.stringify({"action":"createNode","parameters":[blankscene],"time":global.instances[namespace].time})));
			socket.pending = false;
		});
	  }
	  //this client is not the first, we need to get the state and mark it pending
	  else
	  {
		console.log('load from client');
		var firstclient = loadClient;//Object.keys(global.instances[namespace].clients)[0];
		//firstclient = global.instances[namespace].clients[firstclient];
		socket.pending = true;
		global.instances[namespace].getStateTime = global.instances[namespace].time;
		firstclient.emit('message',messageCompress.pack(JSON.stringify({"action":"getState","respond":true,"time":global.instances[namespace].time})));
		
		var timeout = function(namespace){
			
			this.namespace = namespace;
			this.time = function()
			{
				try{
				
					var loadClients = [];
		  
					  if(Object.keys(this.namespace.clients).length != 0)
					  {
						for(var i in this.namespace.clients)
						{
						   var testClient = this.namespace.clients[i];
						   if(!testClient.pending && testClient.loginData)
							loadClients.push(testClient);
						}
					  }
					var loadClient = loadClients[Math.floor((Math.max(0,Math.random() -.001)) * loadClients.length)];
					if(loadClient)
					{
						console.log('did not get state, resending request');	
						this.namespace.getStateTime = this.namespace.time;
						loadClient.emit('message',messageCompress.pack(JSON.stringify({"action":"getState","respond":true,"time":this.namespace.time})));
						this.handle = global.setTimeout(this.time.bind(this),2000);			
					}else
					{
						console.log('need to load from db');	
					}
				}catch(e){}
			}
			this.deleteMe = function()
			{
				global.clearTimeout(this.handle);
				this.namespace.requestTimer = null;
			}
			this.namespace.requestTimer = this;
			this.handle = global.setTimeout(this.time.bind(this),1000);
		}
		global.instances[namespace].Log('GetState from Client',2);
		if(!global.instances[namespace].requestTimer)
			(new timeout(global.instances[namespace]));
		
	  }
	 
	  socket.on('message', function (msg) {
		
		  
			//need to add the client identifier to all outgoing messages
			try{
				var message = JSON.parse(messageCompress.unpack(msg));
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
			if(!allowAnonymous && !sendingclient.loginData && message.action != "getState" && message.member != "latencyTest")
			{
				if(isPointerEvent(message))
					global.instances[namespace].Error('DENIED ' + JSON.stringify(message), 4);
				else
					global.instances[namespace].Error('DENIED ' + JSON.stringify(message), 2);				
				return;
			}
			if(message.action == 'callMethod' && message.node =='index-vwf' && message.member=='PM')
			{
				var textmessage = JSON.parse(message.parameters[0]);
				if(textmessage.receiver == '*System*')
				{
					var red, blue, reset;
					red   = '\u001b[31m';
					blue  = '\u001b[33m';
					reset = '\u001b[0m';
					global.log(blue + textmessage.sender + ": " + textmessage.text + reset,0);
					
				}
				for(var i in global.instances[namespace].clients)
				{
					var client = global.instances[namespace].clients[i];
					if(client && client.loginData && (client.loginData.UID == textmessage.receiver || client.loginData.UID == textmessage.sender))
					{	
						client.emit('message',messageCompress.pack(JSON.stringify(message)));
						
					}
						
				}
				
				
				return;
			}

			// only allow users to hang up their own RTC calls
			var rtcMessages = ['rtcCall', 'rtcVideoCall', 'rtcData', 'rtcDisconnect'];
			if( message.action == 'callMethod' && message.node == 'index-vwf' && rtcMessages.indexOf(message.member) != -1 )
			{
				var params = message.parameters[0];

				// allow no transmitting of the 'rtc*Call' messages; purely client-side
				if( rtcMessages.slice(0,2).indexOf(message.member) != -1 )
					return;

				// route messages by the 'target' param, verifying 'sender' param
				if( rtcMessages.slice(2).indexOf(message.member) != -1 &&
					sendingclient.loginData && 
					params.sender == sendingclient.loginData.UID
				){
					for( var i in global.instances[namespace].clients ){
						var client = global.instances[namespace].clients[i];
						if( client && client.loginData && client.loginData.UID == params.target )
							client.emit('message', messageCompress.pack(JSON.stringify(message)));
					}
				}
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
				  if(allowAnonymous || checkOwner(node,sendingclient.loginData.UID))
				  {	
						//We need to keep track internally of the properties
						//mostly just to check that the user has not messed with the ownership manually
						if(!node.properties)
							node.properties = {};
						node.properties[message.member] = message.parameters[0];
						global.instances[namespace].Log("Set " +message.member +" of " +node.id+" to " + message.parameters[0],2);
				  }
				  else
				  {
					global.instances[namespace].Error('permission denied for modifying ' + node.id,1);
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
					global.instances[namespace].Error('server has no record of ' + message.node,1);
					return;
				  }
				  if(allowAnonymous || checkOwner(node,sendingclient.loginData.UID))
				  {	
						global.instances[namespace].Log("Do " +message.action +" of " +node.id,2);
				  }
				  else
				  {
					global.instances[namespace].Error('permission denied for '+message.action+' on ' + node.id,1);
					return;
				  }
			}
			//We'll only accept a deleteNode if the user has ownership of the object
			if(message.action == "deleteNode")
			{
				  var node = global.instances[namespace].state.findNode(message.node);
				  if(!node)
				  {
					global.instances[namespace].Error('server has no record of ' + message.node,1);
					return;
				  }
				  if(allowAnonymous || checkOwner(node,sendingclient.loginData.UID))
				  {	
						//we do need to keep some state data, and note that the node is gone
						global.instances[namespace].state.deleteNode(message.node)
						global.instances[namespace].Log("deleted " +node.id,1);
				  }
				  else
				  {
					global.instances[namespace].Error('permission denied for deleting ' + node.id,1);
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
					global.instances[namespace].Error('server has no record of ' + message.node,1);
					return;
				  }
				  //Keep a record of the new node
				  if(allowAnonymous || checkOwner(node,sendingclient.loginData.UID) || message.node == 'index-vwf')
				  {	
						var childComponent = JSON.parse(JSON.stringify(message.parameters[0]));
						if(!childComponent) return;
						var childName = message.member;
						if(!childName) return;
						var childID = childComponent.id || childComponent.uri || ( childComponent["extends"] ) + "." + childName.replace(/ /g,'-'); 
						childID = childID.replace( /[^0-9A-Za-z_]+/g, "-" ); 
						childComponent.id = childID;
						if(!node.children) node.children = {};
						node.children[childID] = childComponent;
						node.children[childID].parent = node;
						if(!childComponent.properties)
							childComponent.properties = {};
						fixIDs(node.children[childID]);
						global.instances[namespace].Log("created " + childID,1);
				  }
				  else
				  {
					global.instances[namespace].Error('permission denied for creating child ' + node.id,1);
					return;
				  }
			}
			
			var compressedMessage = messageCompress.pack(JSON.stringify(message))
			//distribute message to all clients on given instance
			for(var i in global.instances[namespace].clients)
			{
				var client = global.instances[namespace].clients[i];
				
				//if the message was get state, then fire all the pending messages after firing the setState
				if(message.action == "getState")
				{
					global.instances[namespace].Log('Got State',1);
					if(global.instances[namespace].requestTimer)
						global.instances[namespace].requestTimer.deleteMe();
					var state = message.result;
					
					
					
					
					
					
					if(message.client != i && client.pending===true)
						client.emit('message',messageCompress.pack(JSON.stringify({"action":"setState","parameters":[state],"time":global.instances[namespace].getStateTime})));
					client.pending = false;
					for(var j = 0; j < client.pendingList.length; j++)
					{
						
						client.emit('message',client.pendingList[j]);
						
						
					}
					client.pendingList = [];	
				}
				else
				{
					//just a regular message, so push if the client is pending a load, otherwise just send it.
					if(client.pending == true)
					{
						client.pendingList.push(compressedMessage);
						console.log('PENDING');
						
					}else
					{
						
						client.emit('message',compressedMessage);
						
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
		  
		  if(loginData && loginData.clients)
		  {
			  delete loginData.clients[socket.id];
			  global.error("Unexpected disconnect. Deleting node for user avatar " + loginData.UID);
			 var avatarID = 'character-vwf-'+loginData.UID;
			 for(var i in global.instances[namespace].clients)
			  {
					var cl = global.instances[namespace].clients[i];
					cl.emit('message',messageCompress.pack(JSON.stringify({"action":"deleteNode","node":avatarID,"time":global.instances[namespace].time})));					
			  }
			  global.instances[namespace].state.deleteNode(avatarID);	
		  }
		  
		  
		  if(Object.keys(global.instances[namespace].clients).length == 0)
		  {
			clearInterval(global.instances[namespace].timerID);
			delete global.instances[namespace];
			console.log('Shutting down ' + namespace )
		  }

		});
		  
	}  // end WebSocketConnection
	
	
	
	
	var red, brown, reset;
					red   = '\u001b[31m';
					brown  = '\u001b[33m';
					reset = '\u001b[0m';
	//start the DAL
	var p = process.argv.indexOf('-p');
	var port = p >= 0 ? parseInt(process.argv[p+1]) : 3000;
		
	p = process.argv.indexOf('-d');
	var datapath = p >= 0 ? process.argv[p+1] : libpath.join(__dirname, "data");
	global.datapath = datapath;	
	p = process.argv.indexOf('-l');
	global.logLevel = p >= 0 ? process.argv[p+1] : 1;
	global.log(brown+'LogLevel = ' +  global.logLevel+reset,0);	
	
	var adminUID = 'admin';
	
	p = process.argv.indexOf('-a');
	adminUID = p >= 0 ? process.argv[p+1] : adminUID;	
	
	p = process.argv.indexOf('-nocache');
	if(p >= 0)
	{
	   FileCache.enabled = false;
	   console.log('server cache disabled');
	}
	
	p = process.argv.indexOf('-build');
	if(p >= 0)
	{
	  //build the VWF AMD with requrie optimizer
	  BuildVWF();
	}
	
	p = process.argv.indexOf('-min');
	if(p >= 0)
	{
		FileCache.minify = true;
	}
	
	var compile = false;
	p = process.argv.indexOf('-compile');
	if(p >= 0)
	{
		compile = true;
	}
	
	var versioning = false;
	p = process.argv.indexOf('-cc');
	if(p >= 0)
	{
		versioning = true;
		console.log(brown + 'Versioning is on. Version is ' + global.version + reset);
	}else
	{
		console.log(brown+'Versioning is off.'+reset);
		delete global.version;
	}	
	
	//301 redirect
	function _302(url,response)
	{
		response.writeHead(302, {
			"Location": url 
		});
		response.end();
	}
	
	//Boot up sequence. May call immediately, or after build step	
	function StartUp()
	{
		SandboxAPI.setDAL(DAL);
		SandboxAPI.setDataPath(datapath);
		Shell.setDAL(DAL);
		Landing.setDAL(DAL);
		
		
		
		DAL.startup(function(){
			
			global.sessions = [];
			global.adminUID = adminUID;
			
			//var srv = http.createServer(OnRequest).listen(port);
			
			app.set('layout', 'layout');
			app.set('views', __dirname + '/public/adl/sandbox/views');
			app.set('view engine', 'html');
			app.engine('.html', require('hogan-express'));
			
			
			//This first handler in the pipeline deal with the version numbers
			// we append a version to the front if every request to keep the clients fresh
			// otherwise, a user would have to know to refresh the cache every time we release
			app.use(function(req, res, next)
			{
				
				//find the version number
				var version = req.url.match(/^\/[0-9]+\//);
				
				//if there was a match
				if(version)
				{
					 //parse the version as an integer
					 var versionInt = version.toString().match(/[0-9]+/);
					 versionInt = parseInt(versionInt);
					 
					 
					 
					 //remove the version number from the request
					 req.url =  req.url.substr(version.toString().length -1);
					 
					 //if the version number from the request was not the current version number
					 //301 redirect to he proper version
					 if(versionInt != global.version)
					 { 
						if(global.version)
							_302('/'+global.version+''+req.url,res);
						else
							_302(req.url,res);
						return;
					 
					 }
				}
				//if there is no version number, redirect to the current version
				if(!version && global.version)
				{
					
					_302('/'+global.version+''+req.url,res);
					return;
				}
				
				//if we got here, then there is a good version number
				//and, we have stripped it out, so we can continue processing as if the version was not in the url
				next();
			
			});
			
			
			//find pretty world URL's, and redirect to the non-pretty url for the world
			app.use(function(req, res, next)
			{
				var url = req.url
				// only do this at all of the url contians /worlds/
				var index = url.toLowerCase().indexOf('/worlds/');
				if(index != -1)
				{
					//find the name to search for
					var worldName = url.substring(index+8);
					
					//decode from URL encoding, which will happen if there are spaces
					worldName = decodeURIComponent(worldName);
					
					//search the DB for worlds that have that title
					DAL.find({title:worldName},function(err,worlds)
					{
						//if there is one , just forward to it
						if(worlds && Object.keys(worlds).length == 1)
						{
							 var worldURL = Object.keys(worlds)[0];
							 worldURL = worldURL.replace(/_/g,'/');
							 _302(worldURL,res);
							 return;
						}
						//If there are more than one, create a page with links to each
						if(worlds && Object.keys(worlds).length > 1)
						{
							worlds = Object.keys(worlds);
							
							res.writeHead(200, {
								"Content-Type": "text/html" 
							});
							res.write( "<html>" +
											"<head>" +
											"	<title>Virtual World Framework</title>" +
											
											"</head>" +
											"<body>" );
						
							
							 //create a link for each world
							 for(var i = 0; i < worlds.length; i++)
							 {
								var worldURL = worlds[i];
								worldURL = worldURL.replace(/_/g,'/');
								
								res.write(  "<a href='"+worldURL+"'>"+worldURL+"</a><br/>" );
								
							 }
							 
							 res.write(  "</body> </html>" );
							 res.end();
							 return;
						}
						
						//if we did not find any results, just continue - which will 404
						next();
					
					
					});
				}
				//does not contain /worlds/, so continue
				else
					next();
			});
			
			app.use(express.methodOverride());
			
			//Wait until all data is loaded before continuing
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
			//CORS support
			app.use(function(req, res, next) {
				
				if(req.headers['access-control-request-headers']) {
					res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
				}else
				{
					res.header('Access-Control-Allow-Headers', 'Content-Type');
				}
				
				if(req.headers['Access-Control-Allow-Origin']) {
					res.header('Access-Control-Allow-Origin', req.headers.origin);
				}else
				{
					res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
				}
				
				if(req.headers['access-control-request-method']) {
					res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
				}else
				{
					res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
				}
				
				res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
				
				if (req.method == 'OPTIONS') {
					res.send(200);
				}
				else
					next();
			});
			app.use(app.router);
			app.get('/adl/sandbox/help', Landing.help);
			app.get('/adl/sandbox/help/:page([a-zA-Z]+)', Landing.help);
			app.get('/adl/sandbox', Landing.generalHandler);
			app.get('/adl/sandbox/:page([a-zA-Z/]+)', Landing.generalHandler);		
			
			app.post('/adl/sandbox/admin/:page([a-zA-Z]+)', Landing.handlePostRequest);
			app.post('/adl/sandbox/data/:action([a-zA-Z_]+)', Landing.handlePostRequest);
			
			//The file handleing logic for vwf engine files
			app.use(OnRequest); 
			var listen = app.listen(port);
			
			global.log(brown+'Admin is "' + global.adminUID+"\""+reset,0);
			global.log(brown+'Serving on port ' + port+reset,0);
			global.log(brown+'minify is ' + FileCache.minify+reset,0);
			Shell.StartShellInterface();  
			//create socket server
			sio = sio.listen(listen,{log:false});
			sio.configure(function()
			{
				//VWF requries websocket. We will not allow socket.io to fallback on flash or long polling
				sio.set('transports', ['websocket']);
				//Somehow, we still need to get the timeouts lower. This does tot seem to do it.
				sio.set('heartbeat interval', 5);
			
			});
			//When there is a new connection, goto WebSocketConnection.
			sio.sockets.on('connection', WebSocketConnection);
		});
	} //end StartUp
	//Use Require JS to optimize and the main application file.
	if(compile)
	{
		var config = {
		    baseUrl: './support/client/lib',
		    name:'boot',
		    out:'./build/boot.js'
		};
		
		//This will concatenate almost 50 of the project JS files, and serve one file in it's place
		requirejs.optimize(config, function (buildResponse) {
		
			console.log('RequrieJS Build complete');
			async.series([
			function(cb3)
			{
				
				console.log('Closure Build start');
				//lets do the most agressive compile possible here!
				if(fs.existsSync("./build/compiler.jar"))
				{

					var c1 = exec('java -jar compiler.jar --js boot.js --compilation_level ADVANCED_OPTIMIZATIONS --js_output_file boot-c.js',{cwd:"./build/"},
					function (error, stdout, stderr) {
					  
					 	//console.log('stdout: ' + stdout);
					    //console.log('stderr: ' + stderr);
					    if (error !== null) {
					      console.log('exec error: ' + error);
					    }
						if(fs.existsSync("./build/boot-c.js"))
						{
							config.out = './build/boot-c.js';
						}
						cb3();

					});



				}else
				{
					console.log('compiler.jar not found');
					cb3();
				}
			},
			function(cb3)
			{
				console.log('loading '+ config.out);
				var contents = fs.readFileSync(config.out, 'utf8');
				//here, we read the contents of the built boot.js file
				var path = libpath.normalize('./support/client/lib/boot.js');
				path = libpath.resolve(__dirname, path);			
				//we zip it, then load it into the file cache so that it can be served in place of the noraml boot.js 
				zlib.gzip(contents,function(_,zippeddata)
				{		   
					    var newentry = {};				
					    newentry.path = path;
					    newentry.data = contents;
					    newentry.stats = fs.statSync(config.out);
					    newentry.zippeddata = zippeddata;
					    newentry.datatype = "utf8";
					    newentry.hash = hash(contents);
					    FileCache.files.push(newentry); 
					    //now that it's loaded into the filecache, we can delete it
					    //fs.unlinkSync(config.out);
					   cb3();
				});
			}],function(err)
			{
				console.log(err);
 				StartUp();
			});
		}, function(err) {
			//there was a requireJS build error. Not a prob, keep going.
			console.log(err);
			StartUp();
		});
	
	}else
	{
		//boot up the rest of the server
		StartUp();
	}
	
	
	
}

exports.startVWF = startVWF;
