var libpath = require('path'),
    http = require("http"),
    fs = require('fs-extra'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');
	
	
var datapath = 'C:\\VWFData';
var DAL = null;	
// default path to data. over written by setup flags

//generate a random id.
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
	


//simple functio to write a response
function respond(response,status,message)
{
	response.writeHead(status, {
					"Content-Type": "text/plain"
				});
	response.write(message + "\n");
	global.log(message);
	response.end();
}
//Just serve a simple file
function ServeFile(filename,response,URL, JSONHeader)
{
		global.log(filename);
		
		var datatype = 	"binary";
		if(JSONHeader)
		   datatype = "utf8";
			
		fs.readFile(filename, datatype, function (err, file) {
			if (err) {
				respond(response,500,err);
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
				respond(response,400,'Profile Not Found');
				return;
			}
 
			//check that the user can get the data
			var profile = JSON.parse(file);
			//def3735d7a0d2696775d6d72f379e4536c4d9e3cd6367f27a0bcb7f40d4558fb
			var storedPassword = profile.Password;
			var suppliedPassword = URL.query.P || URL.loginData.Password;
			if(storedPassword == suppliedPassword)
			{
				
				
				var o = {};
				profile.Password = '';
				o[JSONHeader] = JSON.stringify(profile);
				
				
				response.write(JSON.stringify(o), "utf8");			
				response.end();
				global.log('Served Profile ' + filename);
			}
			else
			{
				respond(response,401,'Incorrect password when getting Profile ' + filename);
				response.end();
			}
		});
}

function GetLoginData(response,URL)
{
	if(URL.loginData)
		respond(response,200,JSON.stringify({username:URL.loginData.UID}));
	else
		respond(response,401,JSON.stringify({username:null}));
	return;
}
function SessionData()
{
	this.sessionId = GUID();
	this.UID = '';
	this.Password = '';
	this.loginTime = new Date();
	this.clients = {};
	this.setTimeout = function(sec)
	{
		if(this.timeout) clearTimeout(this.timeout);
		this.timeout = setTimeout(function()
		{
			//if I have no active clients, log me out
			if(Object.keys(this.clients).length == 0)
				global.sessions.splice(global.sessions.indexOf(this),1);
			//wait another three minutes and try again
			else
				this.resetTimeout();
		
		}.bind(this),sec*1000);
	}
	this.resetTimeout = function()
	{
		this.setTimeout(180);
	}	
}

//login to the site
function SiteLogin(response,URL)
{
			var UID = URL.query.UID;
			var password = URL.query.P;
			
			console.log(UID);
			console.log(password);
			if(!UID || !password)
			{
				respond(response,401,'Login Format incorrect');
				return;
			}
			if(URL.loginData)
			{
				respond(response,401,'Already Logged in');
				return;
			}
			
			CheckPassword(UID,password,function(ok)
			{
				console.log("Login "+ ok);
				if(ok)
				{
					var session = new SessionData();
					session.UID = UID;
					session.Password = password;
					session.resetTimeout();
					global.sessions.push(session);
					console.log('set cookie');
					response.writeHead(200, {
							"Content-Type":  "text/plain",
							"Set-Cookie": "session="+session.sessionId+"; Path=/; HttpOnly;"
					});
					response.write("Login Successful", "utf8");
					global.log('Client Logged in');
					response.end();
				}else
				{
					respond(response,401,'Password incorrect');
					return;
				}
			});		
}

//login to the site
function SiteLogout(response,URL)
{
			
			if(!URL.loginData)
			{
				respond(response,401,"Client Not Logged In");
				return;
			}
			if(global.sessions.indexOf(URL.loginData) != -1)
			{
				global.sessions.splice(global.sessions.indexOf(URL.loginData),1);
				response.writeHead(200, {
							"Content-Type":  "text/plain",
							"Set-Cookie": "session=; HttpOnly;"
					});
				response.end();	
			}else
			{
				respond(response,401,"Client Not Logged In");
				return;
			}
			return;
			
}

//Take ownership if a client websocket connection
//must provide a password and name for the user, and the instance and client ids.
//This will associate a user with a reflector connection
//The reflector will not accept incomming messages from an anonymous connection
function InstanceLogin(response,URL)
{
			
			console.log('instance login');
			if(!URL.loginData)
			{
				console.log("Client Not Logged In");
				respond(response,401,"Client Not Logged In");
				return;
			}			
			var instance = URL.query.S;
			var cid = URL.query.CID;
			
			console.log(URL.loginData.clients);
			if(URL.loginData.clients[cid])
			{
				console.log("Client already logged into session");
				respond(response,401,"Client already logged into session");
				return;
			}	
			
			if(global.instances[instance] && global.instances[instance].clients[cid])
			{
				URL.loginData.clients[cid] = instance;
				global.instances[instance].clients[cid].loginData = URL.loginData;
				console.log("Client Logged Into " + instance);
				respond(response,200,"Client Logged Into " + instance);
				return;
			}else
			{
				respond(response,200,"Client Or Instance does not exist " + instance);
				return;
			}
			
}

function InstanceLogout(response,URL)
{
			if(!URL.loginData)
			{
				respond("Client Not Logged In",401,response);
				return;
			}	
			console.log(URL.loginData);
			var instance = URL.query.S;
			var cid = URL.query.CID;
			
			console.log(cid);
			console.log(URL.loginData.clients[cid]);
			if(URL.loginData.clients[cid])
			{
			
				if(global.instances[URL.loginData.clients[cid]])
				{
					console.log('got here1');
					if(global.instances[URL.loginData.clients[cid]].clients[cid])
					{
						console.log('got here2');
						delete global.instances[URL.loginData.clients[cid]].clients[cid].loginData;
							console.log('got here3');
					}
				}
				
				delete URL.loginData.clients[cid];
				respond(response,200,"Client Logged out " + instance);
			}else
			{				
			console.log('got here4');
				respond(response,200,"Client was not Logged into " + instance);
				console.log("Client was not Logged into " + instance);
				return;
			}
			
			return;
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
		global.log('Saved Profile ' + filename);
	}
	//the profile exists
	else
	{
		fs.readFile(filename, "utf8", function (err, file) {
			
			//the file could not be read
			if (err) {
				
				respond(response,500,err);
				return;
			}
 
			//check that the user can get the data
			var profile = JSON.parse(file);
			
			var storedPassword = profile.Password;
			var suppliedPassword = URL.query.P;
			if(storedPassword == suppliedPassword)
			{
				SaveFile(filename,data,response);
				global.log('Saved Profile ' + filename);
			}else
			{
				
				respond(response,401,'Incorrect password when saving Profile ' + filename);
				
			}
		});
	}
}

//Read the password from the profile for the UID user, and callback with the match
function CheckPassword(UID,Password, callback)
{
	var basedir = datapath + "\\profiles\\";
	var filename = basedir+UID;
	if(!fs.existsSync(filename))
	{
		callback(false);
		return;
	}
	else
	{
		fs.readFile(filename, "utf8", function (err, file) {
			var profile = JSON.parse(file);
			var storedPassword = profile.Password;
			var suppliedPassword = Password;
			callback(storedPassword == suppliedPassword);
			return;
		});
		return;
	}
	callback(false);
}

//Check that the UID is the author of the asset
function CheckAuthor(UID,assetFilename, callback)
{
	var basedir = datapath + "\\GlobalAssets\\";
	
	if(!fs.existsSync(assetFilename))
	{
		callback(false);
		return;
	}
	else
	{
		fs.readFile(assetFilename, "utf8", function (err, file) {
			var asset = JSON.parse(file);
			global.log(asset);
			var storedAuthor = asset.Author;
			
			var suppliedAuthor = UID;
			global.log(storedAuthor,suppliedAuthor);
			callback(storedAuthor == suppliedAuthor);
		});
		return;
	}
	return;
	callback(false);
}

//Check that the UID is the owner of the state
function CheckOwner(UID,stateFilename, callback)
{
	var basedir = datapath + "\\GlobalAssets\\";
	
	if(!fs.existsSync(stateFilename))
	{
		callback(false);
		return;
	}
	else
	{
		fs.readFile(stateFilename, "utf8", function (err, file) {
			var asset = JSON.parse(file);
			global.log(asset);
			
			var storedOwner = asset[asset.length-1].owner;
			
			var suppliedOwner = UID;
			global.log(storedOwner,suppliedOwner);
			callback(storedOwner == suppliedOwner);
		});
		return;
	}
	return;
	callback(false);
}

//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function SaveAsset(URL,filename,data,response)
{
	var UID = URL.query.UID || (URL.loginData && URL.loginData.UID);
	var P = URL.query.P || URL.loginData.Password;
	CheckPassword(UID,P,function(e){
	
		//Did no supply a good name password pair
		if(!e)
		{
				respond(response,401,'Incorrect password when saving Asset ' + filename);
				return;
		}else
		{
				//the asset is new
				if(!fs.existsSync(filename))
				{
					//Save the asset Author info
					global.log('parse asset');
					var asset = JSON.parse(data);
					asset.Author = URL.query.UID;
					data = JSON.stringify(asset);
					SaveFile(filename,data,response);
					global.log('Saved Asset ' + filename);
					return;
				}else
				{
					//overwriting the asset;
					CheckAuthor(UID,filename,function(e){
						
						//trying to overwrite existing file that user is not author of
						if(!e)
						{							
							respond(response,401,'Permission denied to overwrite asset ' + filename);
							return;
						}else
						{
							//Over writing an asset that the user owns
							var asset = JSON.parse(data);
							asset.Author = URL.query.UID;
							data = JSON.stringify(asset);
							SaveFile(filename,data,response);
							global.log('Saved Asset ' + filename);
							return;
						}
					});
				}
		}
	});
}



//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function DeleteProfile(URL,filename,response)
{
	var UID = URL.query.UID || (URL.loginData && URL.loginData.UID);
	var P = URL.query.P || URL.loginData.Password;
	CheckPassword(UID,P,function(e){
	
		//Did no supply a good name password pair
		if(!e)
		{
				
				respond(response,401,'Incorrect password when deleting state ' + filename);
				return;
		}
		else
		{
				//the asset is new
				if(!fs.existsSync(filename))
				{
					
					respond(response,401,'cant delete profile that does not exist' + filename);
					return;
				}
				else
				{
					fs.unlink(filename);
					respond(response,200,'Deleted profile '  + filename);
					
					return;			
				}
		}
	});
}


var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.statSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

function strBeginsWith(str, prefix) {
    return str.match('^' + prefix)==prefix;
}
function strEndsWith(str, suffix) {
    return str.match(suffix+"$")==suffix;
}

//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function CopyState(URL,filename,newname,response)
{
	
	var UID = URL.query.UID || (URL.loginData && URL.loginData.UID);
	var P = URL.query.P || URL.loginData.Password;
	
	if(!UID || !P)
	{
		
		respond(response,401,'No Credentials to copy state to ' + newname);
		return;
	}
	
	newname = newname.replace(/[\\\/]/g,'_');
	var appname = filename.replace(/_[a-zA-Z0-9]*?_$/,'');
	global.log(appname);
	var stateID = newname.match(/_([a-zA-Z0-9]*?)_$/)[1];
	if(!strBeginsWith(newname,appname) || !strEndsWith(newname,'_') || !stateID || stateID.length != 16)
	{
		
		respond(response,401,'Bad new name ' + newname);
		return;
	}
	
	filename = datapath+"\\states\\" + filename;
	newname = datapath+"\\states\\" + newname;

	
	CheckPassword(UID,P,function(e){
	
		//Did not supply a good name password pair
		if(!e)
		{
				
				respond(response,401,'Incorrect password when deleting state ' + filename);
				return;
		}
		else
		{
				//the asset is new
				if(!fs.existsSync(filename))
				{
					
					respond(response,401,'cant delete state that does not exist' + filename);
					return;
				}
				else
				{
					if(fs.existsSync(newname))
					{
						
						respond(response,500,'new state name in use' + filename);
						return;
					}
					else
					{
						fs.copy(filename,newname,function()
						{
							respond(response,200,"Copied state " + filename + " to " + newname);
						});
					}
				}
		}
	});
}

//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function DeleteState(URL,filename,response)
{
	var UID = URL.query.UID || (URL.loginData && URL.loginData.UID);
	var P = URL.query.P || URL.loginData.Password;
	CheckPassword(UID,P,function(e){
	
		//Did no supply a good name password pair
		if(!e)
		{
				
				respond(response,401,'Incorrect password when deleting state ' + filename);
				return;
		}
		else
		{
				//the asset is new
				if(!fs.existsSync(filename))
				{
					
					respond(response,500,'cant delete state that does not exist' + filename);
					return;
				}
				else
				{
					//overwriting the asset;
					CheckOwner(UID,filename + '/state',function(e){
						
						//trying to delete existing file that user is not author of
						if(!e)
						{
							
							respond(response,500,'Permission denied to delete state ' + filename);
							return;
						}else
						{
							
							deleteFolderRecursive(filename);
							respond(response,200,'Deleted state ' + filename);
							return;
							
							
						}
					});
				}
		}
	});
}

function RenameFile(filename,newname,callback,sync)
{
	if(!sync)
		fs.rename(filename,newname,callback);
	else
	{
		fs.renameSync(filename,newname);
		callback();
	}
}

//make a directory if the directory does not exist
function MakeDirIfNotExist(dirname,callback)
{
	fs.exists(dirname, function(e)
	{
		if(e)
			callback();
		else
		{
			fs.mkdir(dirname,function(){
			callback();
			});
		}
	
	});
}
//hash a string
function hash(str)
{
	return require('crypto').createHash('md5').update(str).digest("hex");
}
//no point clogging up the disk with backups if the state does not change.
function CheckHash(filename,data,callback)
{
	fs.readFile(filename, "utf8", function (err, file) {
			
			global.log("hash is:"+hash(data) +" "+ hash(file));
			callback(hash(data) == hash(file));
		});
		return;

}

//Save an instance. the POST URL must contain valid name/password and that UID must match the Asset Author
function SaveState(URL,id,data,response)
{
	var UID = URL.query.UID || (URL.loginData && URL.loginData.UID);
	var P = URL.query.P || URL.loginData.Password;
	CheckPassword(UID,P,function(e){
	
		//Did not supply a good name password pair
		if(!e)
		{
				
				respond(response,401,'Incorrect password when saving state ' + id);
				return;
		}
		else
		{
				DAL.saveInstanceState(id,data,function()
				{
					respond(response,200,'saved ' + id);
					return;
				});
		}
	});
}



//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function DeleteAsset(URL,filename,response)
{
	var UID = URL.query.UID || (URL.loginData && URL.loginData.UID);
	var P = URL.query.P || URL.loginData.Password;
	CheckPassword(UID,P,function(e){
	
		//Did no supply a good name password pair
		if(!e)
		{
			
				respond(response,401,'Incorrect password when deleting Asset ' + filename);
				return;
		}
		else
		{
				//the asset is new
				if(!fs.existsSync(filename))
				{
					
					respond(response,401,'cant delete asset that does not exist' + filename);
					return;
				}
				else
				{
					//overwriting the asset;
					CheckAuthor(UID,filename,function(e){
						
						//trying to delete existing file that user is not author of
						if(!e)
						{
							
							respond(response,401,'Permission denied to delete asset ' + filename);
							return;
						}else
						{
							
							fs.unlink(filename);
							
							respond(response,200,'Deleted asset ' + filename);
							return;
						}
					});
				}
		}
	});
}

function SaveFile(filename,data,response,sync)
{
	if(!sync)
	{
		fs.writeFile(filename,data,'binary',function()
		{
				respond(response,200,'Saved ' + filename);
		});
	}else
	{
		fs.writeFileSync(filename,data,'binary');
		respond(response,200,'Saved ' + filename);
	}
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
function RecurseDirs(startdir, currentdir, files)
{	
	
	for(var i =0; i<files.length; i++)
	{
		if(fs.statSync(startdir + currentdir + "\\"+ files[i]).isDirectory())
		{
			var o = {};
			var newfiles = fs.readdirSync(startdir + currentdir + "\\" + files[i]+"\\");
			var tdir = currentdir ? currentdir + "\\" + files[i] : files[i];
			RecurseDirs(startdir,tdir,newfiles);
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
//Generate a random ID for a instance
var ValidIDChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
function makeid()
{
    var text = "";
    

    for( var i=0; i < 16; i++ )
        text += ValidIDChars.charAt(Math.floor(Math.random() * ValidIDChars.length));

    return text;
}
function createState(URL,data,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'Anonymous users cannot create instances');
		return;
	}
	data = JSON.parse(data);
	
	var statedata = {};
	statedata.objects = 0;
	statedata.owner = URL.loginData.UID;
	statedata.title = data.title;
	statedata.description = data.description;
	statedata.lastUpdate = (new Date());
	var id = '_adl_sandbox_' + makeid() +'_';	
	DAL.createInstance(id,statedata,function()
	{
		respond(response,200,'Created state ' + id);
	});
}
//Just return the state data, dont serve a response
function getState(SID)
{
	SID = SID.replace(/[\\,\/]/g,'_');
	var basedir = datapath + "\\";
	global.log('servestate ' + basedir+"states\\" + SID);
	if(fs.existsSync(basedir+"states\\" + SID+'\\state'))
	{
		file = fs.readFileSync(basedir+"states\\" + SID+'\\state','utf8');
		return JSON.parse(file);
	}
	return null;
}

//find the session data for a request
function GetSessionData(request)
{
  if(!request.headers['cookie'])
	return null;
	
  cookies = {};
  var cookielist = request.headers.cookie.split(';');
  
  for(var i = 0; i < cookielist.length; i++)
  {
	var parts = cookielist[i].split('=');
    cookies[parts[0].trim()] = (parts[1] || '').trim();
  }

  var SessionID = cookies.session;
  
  if(!SessionID) return null;
  global.log(SessionID);
  for(var i in global.sessions)
  {	
	console.log("checking "+global.sessions[i].sessionId+" == " + SessionID);
	if(global.sessions[i].sessionId == SessionID)
	{
		global.sessions[i].resetTimeout();
		return global.sessions[i];
	}
  }
  return null;
}

//router
function serve (request, response)
{
	var URL = url.parse(request.url,true);
	var command = URL.pathname.substr(URL.pathname.lastIndexOf('/')+1);
	command = command.toLowerCase();
	
	URL.loginData = GetSessionData(request);
	
	var UID = URL.query.UID;
	if(URL.loginData)
		UID = URL.loginData.UID;
	var SID = URL.query.SID;
	if(SID)
	 SID = SID.replace(/[\\,\/]/g,'_');
	 
	var basedir = datapath + "\\";
	global.log(command,UID);
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
				ServeFile(basedir+"states\\" + SID+'\\state',response,URL,'GetStateResult');		
			} break;
			case "statedata":{
				DAL.getInstance(SID,function(state)
				{
					if(state)
						ServeJSON(state,response,URL);
					else
						respond(response,500,'state not found' );
				});
			} break;
			case "clonestate":{
				CopyState(URL,SID,URL.query.SID2,response,'GetStateResult');		
			} break;
			case "profile":{
				ServeProfile(basedir+"profiles\\" + UID,response,URL,'GetProfileResult');		
			} break;
			case "login":{
				InstanceLogin(response,URL);		
			} break;
			case "sitelogin":{
				SiteLogin(response,URL);		
			} break;
			case "sitelogout":{
				SiteLogout(response,URL);		
			} break;
			case "logindata":{
				GetLoginData(response,URL);		
			} break;
			case "logout":{
				InstanceLogout(response,URL);		
			} break;
			case "profiles":{

				var files = fs.readdir(basedir+"profiles\\",function(err,files){
					var o = {};
					o.GetProfilesResult = JSON.stringify(files);
					ServeJSON(o,response,URL);
				});
				//DAL.getUsers(function(users)
				//{
				//	if(users)
				//		ServeJSON(users,response,URL);
				//	else
				//		respond(response,500,'users not found' );
				//});
			} break;
			case "states":{

			//	fs.readdir(basedir+"states\\",function(err,files){
			//		var o = {};
			//		o.GetStatesResult = JSON.stringify(files);
			//		ServeJSON(o,response,URL);
			//	});
				DAL.getInstances(function(state)
				{
					if(state)
						ServeJSON(state,response,URL);
					else
						respond(response,500,'state not found' );
				});
			} break;
			case "textures":{
				if(global.textures)
				{
					ServeJSON(global.textures,response,URL);
					return;
				}
				fs.readdir(basedir+"textures\\",function(err,files){
					RecurseDirs(basedir+"textures\\", "",files);
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
			case "globalassets":{
				fs.readdir(basedir+"GlobalAssets\\",function(err,files){
					RecurseDirs(basedir+"GlobalAssets\\", "",files);
					files.sort(function(a,b){
					   if(typeof a == "string" && typeof b == "string") return (a<b ? -1 : 1);
					   if(typeof a == "object" && typeof b == "string") return  1;
					   if(typeof a == "string" && typeof b == "object") return  -1;
					   return -1;
					});
					var o = JSON.stringify({root:files}).replace(/\\\\/g,"\\");
					ServeJSON(o,response,URL);
				});
					
			} break;
			case "globalasset":{
				ServeFile(basedir+"GlobalAssets\\" + URL.query.AID,response,URL);		
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

			if(body == '')
			{
				
				respond(response,500,"Error in post: data is null");
				return;
			}
			
			//Have to do this here! throw does not work quite as you would think 
			//with all the async stuff. Do error checking first.
			try{
				JSON.parse(body);
			}catch(e)
			{
				respond(response,500,"Error in post: data is not json");
				return;
			}
            switch(command)
			{	
				case "state":{
					SaveState(URL,SID,body,response);
				}break;
				case "createstate":{
					createState(URL,body,response);
				}break;
				case "globalasset":{
					SaveAsset(URL, basedir+"GlobalAssets\\"+URL.query.AID,body,response);
				}break;
				case "profile":{
					SaveProfile(URL, basedir+"profiles\\"+UID,body,response);
				}break;
				default:
				{
					global.log("POST");
					_404(response);
					return;
				}
			}

        });
	}	
	if(request.method == "DELETE")
	{
		var body = '';
        request.on('data', function (data) {
            body += data;
        });
        request.on('end', function () {

            switch(command)
			{	
				case "state":{
					DeleteState(URL,basedir+"states\\"+SID,response);
				}break;
				case "globalasset":{
					DeleteAsset(URL, basedir+"GlobalAssets\\"+URL.query.AID,response);
				}break;
				case "profile":{
					DeleteProfile(URL, basedir+"profiles\\"+UID,response);
				}break;
				default:
				{
					global.log("DELETE");
					_404(response);
					return;
				}
			}

        });
	}	

}

exports.serve = serve;
exports.getState = getState;
exports.setDataPath = function(p)
{
	global.log("datapath is " + p,0);
	datapath = p;
	if(DAL)
		DAL.setDataPath(p);
}
exports.setDAL = function(p)
{
	DAL = p;
}
exports.getDataPath = function()
{
	return datapath;
}