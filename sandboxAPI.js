var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');

//Just serve a simple file
function ServeFile(filename,response,URL, JSONHeader)
{
		console.log(filename);
		
		var datatype = 	"binary";
		if(JSONHeader)
		   datatype = "utf8";
			
		fs.readFile(filename, datatype, function (err, file) {
			if (err) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write(err + "\n");
				response.end();
				return;
			}
 
			var type = mime.lookup(filename) || "text/json";
			response.writeHead(200, {
				"Content-Type": !JSONHeader ? type : "text/json"
			});
			
			if(datatype == "binary")
				response.write(file, "binary");
			else
			{
				var o = {};
				o[JSONHeader] = file;
				response.write(JSON.stringify(o), "utf8");
	
			}			
			response.end();
			
		});
}
//get a profile for a user
//url must contain UID for user and password hash
function ServeProfile(filename,response,URL, JSONHeader)
{
		fs.readFile(filename, "utf8", function (err, file) {
			
			//the file could not be read
			if (err) {
				response.writeHead(400, {
					"Content-Type": "text/plain"
				});
				response.write("Profile not found" + "\n");
				console.log('Profile not found ' + filename);
				response.end();
				return;
			}
 
			//check that the user can get the data
			var profile = JSON.parse(file);
			//def3735d7a0d2696775d6d72f379e4536c4d9e3cd6367f27a0bcb7f40d4558fb
			var storedPassword = profile.Password;
			var suppliedPassword = URL.query.P;
			if(storedPassword == suppliedPassword)
			{
				
				
				var o = {};
				o[JSONHeader] = file;
				response.write(JSON.stringify(o), "utf8");			
				response.end();
				console.log('Served Profile ' + filename);
			}
			else
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Password not correct", "utf8");
				console.log('Incorrect password when getting Profile ' + filename);
				response.end();
			}
		});
}


//Take ownership if a client websocket connection
//must provide a password and name for the user, and the session and client ids.
//This will associate a user with a reflector connection
//The reflector will not accept incomming messages from an anonymous connection
function Login(filename,response,URL, JSONHeader)
{
			var UID = URL.query.UID;
			var password = URL.query.P;
			var session = URL.query.S;
			var cid = URL.query.CID;
			
			if(!UID || !password || !session || !cid)
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Login Format incorrect", "utf8");
				response.end();
				return;
			}
			if(!global.sessions || !global.sessions[session])
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Session does not exist", "utf8");
				response.end();
				return;
			}
			if(!global.sessions[session].clients[cid])
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Client is not connected to session", "utf8");
				response.end();
				return;
			}
			if(global.sessions[session].clients[cid].loginData)
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Client is already logged in", "utf8");
				response.end();
				return;
			}
			fs.readFile(filename, "utf8", function (err, file) {
			
				//the file could not be read
				if (err) {
					response.writeHead(401, {
						"Content-Type": "text/plain"
					});
					response.write("Profile not found" + "\n");
					console.log('Profile not found ' + filename);
					response.end();
					return;
				}
	 
				//check that the user can get the data
				var profile = JSON.parse(file);
				//def3735d7a0d2696775d6d72f379e4536c4d9e3cd6367f27a0bcb7f40d4558fb
				var storedPassword = profile.Password;
				
				if(storedPassword == password)
				{
					global.sessions[session].clients[cid].loginData = {};
					global.sessions[session].clients[cid].loginData.UID = UID;
					global.sessions[session].clients[cid].loginData.Password = password;
					response.writeHead(400, {
						"Content-Type":  "text/plain"
					});
					response.write("Login Successful", "utf8");
					console.log('Client Logged in');
					response.end();
				}
				else
				{
					response.writeHead(401, {
						"Content-Type":  "text/plain"
					});
					response.write("Password not correct", "utf8");
					console.log('Incorrect password when getting Profile ' + filename);
					response.end();
				}
				return;
			});
}

function Logout(filename,response,URL, JSONHeader)
{
			var UID = URL.query.UID;
			var password = URL.query.P;
			var session = URL.query.S;
			var cid = URL.query.CID;
			
			if(!UID || !password || !session || !cid)
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Logout Format incorrect", "utf8");
				response.end();
				return;
			}
			if(!global.sessions || !global.sessions[session])
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Session does not exist", "utf8");
				response.end();
				return;
			}
			if(!global.sessions[session].clients[cid])
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Client is not connected to session", "utf8");
				response.end();
				return;
			}
			if(!global.sessions[session].clients[cid].loginData)
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Client is not logged in", "utf8");
				response.end();
				return;
			}
			if(global.sessions[session].clients[cid].loginData.UID == UID && global.sessions[session].clients[cid].loginData.Password == password)
			{
				response.writeHead(400, {
					"Content-Type":  "text/plain"
				});
				response.write("Client logged out", "utf8");
				response.end();
				delete global.sessions[session].clients[cid].loginData;
				return;
			}else
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Name or password incorrect", "utf8");
				response.end();
				return;
			
			}
			
}

function ServeJSON(jsonobject,response,URL)
{
		    
			response.writeHead(200, {
				"Content-Type": "text/json"
			});
			response.write(JSON.stringify(jsonobject), "utf8");
			response.end();
			
}
function SaveProfile(URL,filename,data,response)
{
	//the profile is new
	if(!fs.existsSync(filename))
	{
		SaveFile(filename,data,response);
		console.log('Saved Profile ' + filename);
	}
	//the profile exists
	else
	{
		fs.readFile(filename, "utf8", function (err, file) {
			
			//the file could not be read
			if (err) {
				response.writeHead(500, {
					"Content-Type": "text/plain"
				});
				response.write(err + "\n");
				response.end();
				return;
			}
 
			//check that the user can get the data
			var profile = JSON.parse(file);
			//def3735d7a0d2696775d6d72f379e4536c4d9e3cd6367f27a0bcb7f40d4558fb
			var storedPassword = profile.Password;
			var suppliedPassword = URL.query.P;
			if(storedPassword == suppliedPassword)
			{
				SaveFile(filename,data,response);
				console.log('Saved Profile ' + filename);
			}else
			{
				response.writeHead(401, {
					"Content-Type":  "text/plain"
				});
				response.write("Password not correct", "utf8");
				console.log('Incorrect password when saving Profile ' + filename);
				response.end();
			}
		});
	}
}
function SaveFile(filename,data,response)
{
	fs.writeFile(filename,data,'binary',function()
	{
			response.writeHead(200, {
				"Content-Type": "text/json"
			});
			response.write("ok", "utf8");
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
function RecurseDirs(currentdir, files)
{	
	
	for(var i =0; i<files.length; i++)
	{
		if(fs.statSync("C:\\VWFData\\textures\\" + currentdir + "\\"+ files[i]).isDirectory())
		{
			var o = {};
			var newfiles = fs.readdirSync("C:\\VWFData\\textures\\" + currentdir + "\\" + files[i]+"\\");
			var tdir = currentdir ? currentdir + "\\" + files[i] : files[i];
			RecurseDirs(tdir,newfiles);
			newfiles.sort(function(a,b){
			   if(typeof a == "string" && typeof b == "string") return (a<b ? -1 : 1);
			   if(typeof a == "object" && typeof b == "string") return  1;
			   if(typeof a == "string" && typeof b == "object") return  -1;
			   return -1;
			});
			for(var j = 0; j < newfiles.length; j++)
				if(typeof newfiles[j] == "string")
					newfiles[j] = currentdir + "\\" + files[i] + "\\" + newfiles[j];
			o[currentdir ? currentdir + "\\" + files[i] : files[i]] = newfiles;
			files[i] = o;
		}
	}
}
function getState(UID)
{
	var basedir = "C:\\VWFData\\";
	console.log('servestate ' + basedir+"states\\" + UID);
	if(fs.existsSync(basedir+"states\\" + UID))
	{
		file = fs.readFileSync(basedir+"states\\" + UID,'utf8');
		return JSON.parse(file);
	}
	return null;
}
function serve (request, response)
{
	var URL = url.parse(request.url,true);
	var command = URL.pathname.substr(URL.pathname.lastIndexOf('/')+1);
	command = command.toLowerCase();
	var UID = URL.query.UID;
	var basedir = "C:\\VWFData\\";
	console.log(command,UID);
	if(request.method == "GET")
	{
		switch(command)
		{	
			case "texture":{
				ServeFile(basedir+"textures\\" + UID,response,URL);		
			} break;
			case "thumbnail":{
				ServeFile(basedir+"thumbnails\\" + UID,response,URL);		
			} break;
			case "state":{
				ServeFile(basedir+"states\\" + UID,response,URL,'GetStateResult');		
			} break;
			case "profile":{
				ServeProfile(basedir+"profiles\\" + UID,response,URL,'GetProfileResult');		
			} break;
			case "login":{
				Login(basedir+"profiles\\" + UID,response,URL);		
			} break;
			case "logout":{
				Logout(basedir+"profiles\\" + UID,response,URL,'GetProfileResult');		
			} break;
			case "profiles":{

				var files = fs.readdir(basedir+"profiles\\",function(err,files){
					var o = {};
					o.GetProfilesResult = JSON.stringify(files);
					ServeJSON(o,response,URL);
				});
			} break;
			case "states":{

				fs.readdir(basedir+"states\\",function(err,files){
					var o = {};
					o.GetStatesResult = JSON.stringify(files);
					ServeJSON(o,response,URL);
				});

			} break;
			case "textures":{
				if(global.textures)
				{
					ServeJSON(global.textures,response,URL);
					return;
				}
				fs.readdir(basedir+"textures\\",function(err,files){
					RecurseDirs("",files);
					files.sort(function(a,b){
					   if(typeof a == "string" && typeof b == "string") return (a<b ? -1 : 1);
					   if(typeof a == "object" && typeof b == "string") return  1;
					   if(typeof a == "string" && typeof b == "object") return  -1;
					   return -1;
					});
					var o = {};
					o.GetTexturesResult = JSON.stringify({root:files}).replace(/\\\\/g,"\\");
					global.textures = o;
					ServeJSON(o,response,URL);
				});
					
			} break;
			default:
			{
				_404(response);
				return;
			}
		
		}
	}
	if(request.method == "POST")
	{
		var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {

            switch(command)
			{	
				case "state":{
				
					SaveFile(basedir+"states\\"+UID,body,response);
				}break;
				case "profile":{
					SaveProfile(URL, basedir+"profiles\\"+UID,body,response);
				}break;
				default:
				{
					console.log("POST");
					_404(response);
					return;
				}
			}

        });
	}	

}

exports.serve = serve;
exports.getState = getState;