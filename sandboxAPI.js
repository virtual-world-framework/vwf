var libpath = require('path'),
    http = require("http"),
    fs = require('fs-extra'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');
	
	
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
	
var datapath = 'C:\\VWFData';

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


//Take ownership if a client websocket connection
//must provide a password and name for the user, and the instance and client ids.
//This will associate a user with a reflector connection
//The reflector will not accept incomming messages from an anonymous connection
function Login(filename,response,URL, JSONHeader)
{
			var UID = URL.query.UID;
			var password = URL.query.P;
			var instance = URL.query.S;
			global.log(instance);
			global.log(global.instances);
			var cid = URL.query.CID;
			
			if(!UID || !password || !instance || !cid)
			{
				respond(response,401,'Login Format incorrect');
				return;
			}
			if(!global.instances || !global.instances[instance])
			{
				respond(response,401,'instance does not exist');
				return;
			}
			if(!global.instances[instance].clients[cid])
			{
				
				respond(response,401,'Client is not connected to instance');
				return;
			}
			if(global.instances[instance].clients[cid].loginData)
			{

				respond(response,401,'Client is already logged in');
				return;
			}
			for (var i in global.instances[instance].clients)
			{
				if(global.instances[instance].clients[i].loginData && global.instances[instance].clients[i].loginData.UID == UID)
				{
				
					respond(response,401,'User is already logged in');
					return;
				}
			}
			fs.readFile(filename, "utf8", function (err, file) {
			
				//the file could not be read
				if (err) {

					respond(response,401,'Profile not found');
					return;
				}
	 
				//check that the user can get the data
				var profile = JSON.parse(file);
				
				var storedPassword = profile.Password;
				
				if(storedPassword == password)
				{
					global.instances[instance].clients[cid].loginData = {};
					global.instances[instance].clients[cid].loginData.UID = UID;
					global.instances[instance].clients[cid].loginData.Password = password;
					global.instances[instance].clients[cid].loginData.SocketClient = cid;
					global.instances[instance].clients[cid].loginData.InstanceID = instance;
					var SessionID = GUID();
					global.instances[instance].clients[cid].loginData.SessionID = SessionID;
					response.writeHead(200, {
						"Content-Type":  "text/plain",
						"Set-Cookie": "session="+SessionID+"; HttpOnly; Path="+instance 
					});
					response.write("Login Successful", "utf8");
					global.log('Client Logged in');
					response.end();
				}
				else
				{
					
					respond(response,401,'Incorrect password when getting Profile ' + filename);
					
				}
				return;
			});
}

function Logout(filename,response,URL, JSONHeader)
{
			var UID = URL.query.UID || URL.loginData.UID;
			var password = URL.query.P || URL.loginData.Password;
			var instance = URL.query.S || URL.loginData.InstanceID;
			var cid = URL.query.CID || URL.loginData.SocketClient;
			
			if(!UID || !password || !instance || !cid)
			{
			
				respond(response,401,"Logout Format incorrect");
				return;
			}
			if(!global.instances || !global.instances[instance])
			{
				
				respond(response,401,"instance does not exist");
				return;
			}
			if(!global.instances[instance].clients[cid])
			{
			
				respond(response,401,"Client is not connected to instance");
				return;
			}
			if(!global.instances[instance].clients[cid].loginData)
			{
				
				respond(response,401,"Client is not logged in");
				return;
			}
			if(global.instances[instance].clients[cid].loginData.UID == UID && global.instances[instance].clients[cid].loginData.Password == password)
			{
				response.writeHead(200, {
					"Content-Type":  "text/plain",
					"Set-Cookie": "session=; HttpOnly"
				});
				response.write("Client logged out", "utf8");
				response.end();
				delete global.instances[instance].clients[cid].loginData;
				return;
			}else
			{
			
				respond(response,401,"Name or password incorrect");
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
	var UID = URL.query.UID || URL.loginData.UID;
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
	var UID = URL.query.UID || URL.loginData.UID;
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
	
	var UID = URL.query.UID || URL.loginData.UID;
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
	var UID = URL.query.UID || URL.loginData.UID;
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
function SaveState(URL,dirname,data,response)
{
	var UID = URL.query.UID || URL.loginData.UID;
	var P = URL.query.P || URL.loginData.Password;
	CheckPassword(UID,P,function(e){
	
		//Did no supply a good name password pair
		if(!e)
		{
				
				respond(response,401,'Incorrect password when saving state ' + dirname);
				return;
		}
		else
		{
				//the state is new
				if(!fs.existsSync(dirname+'/state'))
				{
					
					respond(response,200,'saving new state' + dirname);
					MakeDirIfNotExist(dirname,function(){SaveFile(dirname+'/state',data,response);});
					return;
				}
				else
				{
					//overwriting the state;
					//check that the owner property of hte state did not change
					var asset = JSON.parse(data);
					global.log(asset);
					var storedOwner = asset[asset.length-1].owner;
			
					CheckOwner(storedOwner,dirname+'/state',function(e){
						
						//trying to delete existing file that user is not author of
						if(!e)
						{
							
							respond(response,401,'Cannot change owner of existing state' + dirname);
							return;
						}else
						{
							
							respond(response,200,'saving over state' + dirname);
							MakeDirIfNotExist(dirname,function(){     //pretty sure the dir must exist at this point
								//dont write the same file over and over
								CheckHash(dirname+'/state',data,function(same){
									if(!same)
									{
										//rename must be sync
										RenameFile(dirname+'/state',dirname+'/state_backup' + GUID(),function(){
										//writeing over a file must by sync
										SaveFile(dirname+'/state',data,response,true);
										},true);
									}else
									{
										respond(response,200,'The state has not changed' + dirname);
									}
								});
							});
							return;
						}
					});
				}
		}
	});
}



//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function DeleteAsset(URL,filename,response)
{
	var UID = URL.query.UID || URL.loginData.UID;
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
	return {};
	
  cookies = {};
  var cookielist = request.headers.cookie.split(';');
  
  for(var i = 0; i < cookielist.length; i++)
  {
	var parts = cookielist[i].split('=');
    cookies[parts[0].trim()] = (parts[1] || '').trim();
  }

  var SessionID = cookies.session;
  
  if(!SessionID) return {};
  global.log(SessionID);
  for(var i in global.instances)
  {
	for(var j in global.instances[i].clients)
	{
		if(global.instances[i].clients[j].loginData && global.instances[i].clients[j].loginData.SessionID == SessionID)
		   return global.instances[i].clients[j].loginData;
	}
  }
  return {};
}

//router
function serve (request, response)
{
	var URL = url.parse(request.url,true);
	var command = URL.pathname.substr(URL.pathname.lastIndexOf('/')+1);
	command = command.toLowerCase();
	
	URL.loginData = GetSessionData(request);
	
	var UID = URL.query.UID || URL.loginData.UID;
	var SID = URL.query.SID || URL.loginData.InstanceID;
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
			case "clonestate":{
				CopyState(URL,SID,URL.query.SID2,response,'GetStateResult');		
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
					SaveState(URL,basedir+"states\\"+SID,body,response);
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
}
exports.getDataPath = function()
{
	return datapath;
}