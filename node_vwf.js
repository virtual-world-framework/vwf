var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
    sio = require('socket.io'),
    YAML = require('js-yaml'),
    zlib = require('zlib');

var template_extensions = [ "", ".yaml", ".json" ];
	
// pick the application name out of the URL by finding the index.vwf.yaml
function findAppName(uri)
{
		
		var current = "."+libpath.sep;
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
function redirect(url, response) {
    response.writeHead(302, {'Location': url} );
    response.end();
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
	this.getFile = function(path,callback)
	{
		for(var i =0; i < this.files.length; i++)
		{
			if(this.files[i].path == path)
			{	
				global.log('serving from cache: ' + path,2);
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
				
				global.log(newentry.hash,2);
				global.log('loading into cache: ' + path,2);
				if(self.enabled == true)
				{
					self.files.push(newentry);
					fs.watch(path,{},function(event,filename){
				
					global.log(newentry.path + ' has changed on disk',2);
				      self.files.splice(self.files.indexOf(newentry),1);
					});
				}
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
		fs.readFile(filename, "utf8", function (err, data) {
			if (err) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write(err + "\n");
				response.end();
				return;
			}

			// Remove the Byte Order Mark (BOM) if one exists
            var file = data.replace(/^\uFEFF/, '');

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
function getNamespace( socket ) {
    var referer = (socket.handshake.headers.referer);
    var host = (socket.handshake.headers.host);
    if ( referer.indexOf( host ) > -1 ) {
        var updatedURL = referer.substr( referer.indexOf( host ) + host.length );
        var processedURL = processURL( updatedURL );
        if ( ( processedURL[ 'instance' ] ) && ( processedURL[ 'public_path' ] ) ) {
            return joinPath( joinPath( processedURL[ 'public_path' ], processedURL[ 'application' ] ), processedURL[ 'instance' ] );
        }
    }
    return undefined;
}

function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

function joinPath( segmentOne, segmentTwo ) {
    if ( segmentOne == undefined ) {
        segmentOne = "";
    }
    if ( segmentTwo == undefined ) {
        segmentTwo = "";
    }
    if ( ( segmentTwo[ 0 ] == "/" ) && ( segmentOne[ segmentOne.length - 1 ] == "/" ) ) {
        return segmentOne + segmentTwo.slice( 1 );
    }
    else if ( ( segmentTwo[ 0 ] == "/" ) || ( segmentOne[ segmentOne.length - 1 ] == "/" ) ) {
        return segmentOne + segmentTwo;
    }
    else
    {
        return segmentOne + "/" + segmentTwo;
    }
}

function isDirectory( path ) {
    var seperatorFixedPath = path.replace(/\//g,libpath.sep);
    if ( ! fs.existsSync( seperatorFixedPath ) ) {
        return false;
    }
    return fs.statSync( seperatorFixedPath ).isDirectory( );
}

function isFile( path ) {
    var seperatorFixedPath = path.replace(/\//g,libpath.sep);
    if ( ! fs.existsSync( seperatorFixedPath ) ) {
        return false;
    }
    return fs.statSync( seperatorFixedPath ).isFile( );
}

function getExtension( path ) {
    if ( path.match(/\.vwf$/) ) {
        for ( var index = 0; index < template_extensions.length; index++ ) {
            if ( isFile( joinPath( "./public/", path + template_extensions[ index ] ) ) ) {
                return template_extensions[ index ];
            }
        }
    }
    else if ( path.match(/\.(dae|unity3d)$/) ) {
        if ( isFile( joinPath( "./public/", path ) ) ) {
            return "";
        }
    }
    return undefined;
}

function isInstance( segment ) {
    if ( segment.match(/^[0-9A-Za-z]{16}$/) ) {
        return true;
    }
    return false;
}

function generateSegments( argument ) {
    var result = argument.split("/");
    if ( result.length > 0 ) {
        if ( result[ 0 ] == "" ) {
            result.shift();
        }
    }
    if ( result.length > 0 ) {
        if ( result[ result.length - 1 ] == "" ) {
            result.pop();
        }
    }
    return result;
}

function processURL( updatedURL ) {
    var result = { 'public_path': "/", 'application': undefined, 'instance': undefined, 'private_path': undefined};
    var segments = generateSegments( updatedURL );
    var extension = undefined;

    while ( ( segments.length > 0 ) && ( isDirectory( joinPath( "./public" + result[ 'public_path' ], segments[ 0 ] ) ) ) ) {
        result[ 'public_path' ] = joinPath( result[ 'public_path' ], segments.shift() );
    }

    if ( ( segments.length > 0 ) && ( extension = getExtension( joinPath( result[ 'public_path' ], segments[ 0 ] ) ) ) ) {
        result[ 'application' ] = segments.shift();
    }
    else if ( extension = getExtension( joinPath( result[ 'public_path' ], "index.vwf" ) ) ) {
        result[ 'application' ] = "index.vwf";
    }
    else if ( extension = getExtension( joinPath( result[ 'public_path' ], "index.dae" ) ) ) {
        result[ 'application' ] = "index.dae";
    }
    else if ( extension = getExtension( joinPath( result[ 'public_path' ], "index.unity3d" ) ) ) {
        result[ 'application' ] = "index.unity3d";
    }

    if ( extension ) {
        if ( ( segments.length > 0 ) && ( isInstance( segments[ 0 ] ) ) ) {
            result[ 'instance' ] = segments.shift();
        }
        if ( segments.length > 0 ) {
            result[ 'private_path' ] = segments.join("/");
        }
    }
    
    return result;
}

function invokeFile( request, response, filename ) {
    if ( isFile( filename ) ) {
        ServeFile( request, filename.replace(/\//g,libpath.sep), response, url.parse( request.url, true ) );
        return true;
    }
    return false;
}

function invokeComponent( request, response, filename ) {
    if ( isFile( filename + ".yaml" ) ) {
        ServeYAML( filename.replace(/\//g,libpath.sep) + ".yaml", response, url.parse( request.url, true ) );
        return true;
    }
    return false;
}

function invokeAdmin( request, response, parsedRequest ) {
    if ( parsedRequest[ 'private_path' ] ) {
        var segments = generateSegments( parsedRequest[ 'private_path' ] );
        if ( ( segments.length > 0 ) && ( segments[ 0 ] == "admin" ) ) {
            if ( segments.length == 1 ) {
                invokeFile( request, response, "./support/client/admin.html" );
                return true;
            }
            if ( segments.length == 2 ) {
                switch ( segments[ 1 ] ) {
                    case "state":
                        break;
                    case "rate":
                        break;
                    case "play":
                        break;
                    case "pause":
                        break;
                    case "stop":
                        break;
                    case "instances":
                        var data = {};
                        var applicationInstanceRegexp = new RegExp("^" + joinPath( parsedRequest[ 'public_path' ], parsedRequest[ 'application' ] ) + "/[0-9A-Za-z]{16}$");
					              for( var i in global.instances )
			              		{
                            if ( i.match( applicationInstanceRegexp ) ) {
		              				  	  data[ i ] = { "clients": { } };
		              					    for( var j in global.instances[ i ].clients )
		              			  		  {
		              			  			    data[ i ].clients[ j ] = null;
		              			  		  }
                            }
		              			}
			              		ServeJSON(data,response,url.parse(request.url,true));
			              		return true;
                    case "models":
                        break;
                    case "files":
                        break;
                    case "config":
                        break;
                }
            }
        }
    }
    return false;
}

function invokePersistence( request, response, parsedRequest ) {
    return false;
}

function invokeApplication( request, response, parsedRequest ) {
    var fileName = parsedRequest[ 'private_path' ];
    if ( fileName == undefined ) {
        fileName = "index.html";
    }
    if ( invokeFile( request, response, joinPath( "./support/client/lib/", fileName ) ) ) {
        return true;
    }
    if ( invokeFile( request, response, joinPath( joinPath( "./public/", parsedRequest[ 'public_path' ] ), parsedRequest[ 'private_path' ] ) ) ) {
        return true;
    }
    if ( invokeComponent( request, response, joinPath( joinPath( "./public/", parsedRequest[ 'public_path' ] ), parsedRequest[ 'private_path' ] ) ) ) {
        return true;
    }
    if ( invokePersistence( request, response, parsedRequest ) ) {
        return true;
    }
    if ( invokeAdmin( request, response, parsedRequest ) ) {
        return true;
    }
    
    return false;
}

function basicGet( request, response ) {
    var parsedRequest = processURL( url.parse(request.url).pathname );
    if ( ( request.url[ request.url.length - 1 ] != "/" ) && ( parsedRequest[ 'private_path' ] == undefined ) ) {
        if ( ( request.headers['user-agent'] ) && ( request.headers['user-agent'].indexOf("MSIE 8.0" ) > -1 ) ) {
            redirect( "/web/docs/unsupported.html", response ); // Redirect unsupported browsers to web/docs/unsupported.html
            return true;
        }
        else if ( ( parsedRequest[ 'instance' ] == undefined ) && ( request.headers['accept'].indexOf( "text/html" ) == -1 ) ) {
            return invokeComponent( request, response, joinPath( joinPath( "./public/", parsedRequest[ 'public_path' ] ), parsedRequest[ 'application' ] ) );
        }
        else {
            redirect( request.url + "/", response );
            return true;
        }
    }
    else if ( ( parsedRequest[ 'instance' ] == undefined ) && ( parsedRequest[ 'private_path' ] == undefined ) ) {

        redirect( request.url + makeid( ) + "/", response );
        return true;
          
    }
    else {
        return invokeApplication( request, response, parsedRequest );
          //Pass on to 'delegate to application'
    }
}

function basicProxy( request, response ) {
    var updatedURL = url.parse(request.url).pathname;
    var segments = generateSegments( updatedURL );
    if ( ( segments.length > 0 ) && ( segments[ 0 ] == "proxy" ) ) {
        if ( invokeFile( request, response, joinPath( "./support/", updatedURL ) ) ) {
            return true;
        }
        if ( invokeComponent( request, response, joinPath( "./support/", updatedURL ) ) ) {
            return true;
        }
    }
    return false;

}

function basicSplat( request, response ) {
    var updatedURL = url.parse(request.url).pathname;
    var segments = generateSegments( updatedURL );
    if ( segments.length == 0 ) {
        updatedURL = "/index.html";
    }
    return invokeFile( request, response, joinPath( "./public/", updatedURL ) );
}

//Start the VWF server
function startVWF(){
	
	global.activeinstances = [];
	function OnRequest(request, response) 
	{
		try{
        var handledRequest = basicSplat( request, response );
        if ( ! ( handledRequest ) ) {
            handledRequest = basicProxy( request, response );
        }        
        if ( ! ( handledRequest ) ) {
            handledRequest = basicGet( request, response );
        }
        if ( ! ( handledRequest ) ) {
				    global.log("404 : " + url.parse(request.url).pathname )
				    _404(response);
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
	  if ( namespace == undefined ) {
        return;
    }

	  //create or setup instance data
	  if(!global.instances)
	    global.instances = {};
	   
	  //if it's a new instance, setup record 
	  if(!global.instances[namespace])
	  {
		global.instances[ namespace ] = { };
		global.instances[ namespace ].clients = { };
		global.instances[ namespace ].time = 0.0;
    global.instances[ namespace ].rate = 1.0;
    global.instances[ namespace ].playing = true;
    global.instances[ namespace ].paused = false;
    global.instances[ namespace ].stopped = false;
		global.instances[ namespace ].state = { };
    
		//create or open the log for this instance
		if(global.logLevel >= 2) {
			var log = fs.createWriteStream('.//Logs/'+namespace.replace(/[\\\/]/g,'_'), {'flags': 'a'});
		}

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
		
		
		
		
		
		//keep track of the timer for this instance
		global.instances[ namespace ].timerID = setInterval( function( ) {
		    if ( global.instances[ namespace ].playing ) {
  			    global.instances[ namespace ].time += 0.05 * global.instances[ namespace ].rate;
        }
			  for ( var i in global.instances[ namespace ].clients )
			  {
				    var client = global.instances[ namespace ].clients[ i ];
				    client.emit( 'message', { action: "tick", parameters: [], time: global.instances[ namespace ].time } );
  			}
		
		}, 50 );
		
	  }
	 
	  //add the new client to the instance data
          global.instances[namespace].clients[socket.id] = socket;	 
	  
	  socket.pending = true;
	  socket.pendingList = [];
	  
	  
	  //The client is the first, is can just load the index.vwf, and mark it not pending
	  if(Object.keys(global.instances[namespace].clients).length == 1)
	  {
		
		
		
		var instance = namespace;
		//Get the state and load it.
		//Now the server has a rough idea of what the simulation is

        socket.emit('message',{action:"createNode",parameters:["http://vwf.example.com/clients.vwf"],time:global.instances[namespace].time});
		
		socket.emit('message',{action:"createNode",parameters:["index.vwf", "application"],time:global.instances[namespace].time});
		socket.pending = false;
	  }
	  //this client is not the first, we need to get the state and mark it pending
	  else
	  {
		var firstclient = Object.keys(global.instances[namespace].clients)[0];
		firstclient = global.instances[namespace].clients[firstclient];
		firstclient.emit('message',{action:"getState",respond:true,time:global.instances[namespace].time});
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
			
			message.client = socket.id;
			
			//distribute message to all clients on given instance
			for(var i in global.instances[namespace].clients)
			{
				var client = global.instances[namespace].clients[i];
				
				//if the message was get state, then fire all the pending messages after firing the setState
				if(message.action == "getState")
				{
					global.instances[namespace].Log('Got State',2);
					var state = message.result;
					global.instances[namespace].Log(state,2);
					client.emit('message',{action:"setState",parameters:[state],time:global.instances[namespace].time});
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
		  global.instances[namespace].clients[socket.id] = null;	
		  delete global.instances[namespace].clients[socket.id];
		  //if it's the last client, delete the data and the timer

		  if(Object.keys(global.instances[namespace].clients).length == 0)
		  {
			clearInterval(global.instances[namespace].timerID);
			delete global.instances[namespace];
		  }
	  });
	}
	//create the server
	
	
	
	var red, brown, reset;
					red   = '\u001b[31m';
					brown  = '\u001b[33m';
					reset = '\u001b[0m';
	//start the DAL
	var p = process.argv.indexOf('-p');
	var port = p >= 0 ? parseInt(process.argv[p+1]) : 3000;
		
	p = process.argv.indexOf('-d');
	var datapath = p >= 0 ? process.argv[p+1] : "C:\\VWFData";
		
	p = process.argv.indexOf('-l');
	global.logLevel = p >= 0 ? process.argv[p+1] : 1;
	global.log(brown+'LogLevel = ' +  global.logLevel+reset,0);	
	
	
	
	p = process.argv.indexOf('-nocache');
	if(p >= 0)
	{
	   FileCache.enabled = false;
	   console.log('server cache disabled');
	}
	

	var srv = http.createServer(OnRequest).listen(port);
	global.log(brown+'Serving on port ' + port+reset,0);
	
	
	//create socket server
	sio = sio.listen(srv,{log:false});
	sio.set('transports', ['websocket']);
	sio.sockets.on('connection', WebSocketConnection);
	

}

exports.startVWF = startVWF;
