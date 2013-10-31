var libpath = require('path'),
    http = require("http"),
    fs = require('fs-extra'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');
	require('./hash.js');
	
var safePathRE = RegExp('/\//'+(libpath.sep=='/' ? '\/' : '\\')+'/g');
var datapath = '.'+libpath.sep+'data';
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
	global.log(message,2);
	response.end();
}
//Just serve a simple file
function ServeFile(filename,response,URL, JSONHeader)
{
		global.log(filename,2);
		
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
function ServeProfile(UID,response,URL)
{
		DAL.getUser(UID,function(user)
		{
			if(!user)
			{
				respond(response,401,"user not logged in, or profile not found");
			}else
			{
				user.Password = '';
				respond(response,200,JSON.stringify(user));
			}
		
		});
}

function GetLoginData(response,URL)
{
	if(URL.loginData)
	{
		var logindata = {username:URL.loginData.UID,admin:URL.loginData.UID==global.adminUID};
		logindata.instances = [];
		logindata.clients = [];
		
		for(var i in global.instances)
		{
			for(var j in global.instances[i].clients)
			{
				if(global.instances[i].clients[j].loginData && global.instances[i].clients[j].loginData.UID == URL.loginData.UID)
				{
					logindata.instances.push(i);
					logindata.clients.push(j);
				}
			}
		}
		
		
		respond(response,200,JSON.stringify(logindata));
	}
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
			{
				global.sessions.splice(global.sessions.indexOf(this),1);
				global.log('Removing Session data for ' + this.UID,1);
			}
			//wait another three minutes and try again
			else
				this.resetTimeout();
		
		}.bind(this),sec*1000);
	}
	this.resetTimeout = function()
	{
		//15 mins
		this.setTimeout(900);
	}	
}

//login to the site
function SiteLogin(response,URL)
{
			var UID = URL.query.UID;
			var password = URL.query.P;
			
			
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
				global.log("Login "+ ok,2);
				if(ok)
				{
					var session = new SessionData();
					session.UID = UID;
					session.Password = password;
					session.resetTimeout();
					global.sessions.push(session);
					
					response.writeHead(200, {
							"Content-Type":  "text/plain",
							"Set-Cookie": "session="+session.sessionId+"; Path=/; HttpOnly;"
					});
					response.write("Login Successful", "utf8");
					global.log('Client Logged in',1);
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
			
			global.log('instance login',2);
			if(!URL.loginData)
			{
				global.log("Client Not Logged In",1);
				respond(response,401,"Client Not Logged In");
				return;
			}			
			var instance = URL.query.S;
			var cid = URL.query.CID;
			
			
			if(URL.loginData.clients[cid])
			{
				
				respond(response,401,"Client already logged into session");
				return;
			}	
			
			if(global.instances[instance] && global.instances[instance].clients[cid])
			{
				URL.loginData.clients[cid] = instance;
				global.instances[instance].clients[cid].loginData = URL.loginData;
				
				if(global.instances[instance].state.findNode('index-vwf').properties['owner'] == undefined)
					global.instances[instance].state.findNode('index-vwf').properties['owner'] = URL.loginData.UID;
					
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
			
			var instance = URL.query.S;
			var cid = URL.query.CID;
			
			
			if(URL.loginData.clients[cid])
			{
			
				if(global.instances[URL.loginData.clients[cid]])
				{
					
					if(global.instances[URL.loginData.clients[cid]].clients[cid])
					{
						
						delete global.instances[URL.loginData.clients[cid]].clients[cid].loginData;
							
					}
				}
				
				delete URL.loginData.clients[cid];
				respond(response,200,"Client Logged out " + instance);
			}else
			{				
			
				respond(response,200,"Client was not Logged into " + instance);
				
				return;
			}
			
			return;
}


function getInventory(URL,response)
{	
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	DAL.getInventoryDisplayData(URL.loginData.UID,function(inventory)
	{
		ServeJSON(inventory,response,URL);
	});
}

function getInventoryItemAssetData(URL,response)
{	
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	if(!URL.query.AID)
	{
		respond(response,500,'no AID in query string');
		return;
	}
	DAL.getInventoryItemAssetData(URL.loginData.UID,URL.query.AID,function(item)
	{
		ServeJSON(item,response,URL);
	});
}

function getInventoryItemMetaData(URL,response)
{	
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	if(!URL.query.AID)
	{
		respond(response,500,'no AID in query string');
		return;
	}
	DAL.getInventoryItemMetaData(URL.loginData.UID,URL.query.AID,function(item)
	{
		ServeJSON(item,response,URL);
	});
}
function addInventoryItem(URL,data,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	DAL.addToInventory(URL.loginData.UID,{title:URL.query.title,uploaded:new Date(),description:'',type:URL.query.type},data,function(id)
	{
		respond(response,200,id);
	});
}
function updateInventoryItemMetadata(URL,data,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	if(!URL.query.AID)
	{
		respond(response,500,'no AID in query string');
		return;
	}
	DAL.updateInventoryItemMetadata(URL.loginData.UID,URL.query.AID,JSON.parse(data),function()
	{
		respond(response,200,'ok');
	});
}
function deleteInventoryItem(URL,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	if(!URL.query.AID)
	{
		respond(response,500,'no AID in query string');
		return;
	}
	DAL.deleteInventoryItem(URL.loginData.UID,URL.query.AID,function()
	{
		respond(response,200,'ok');
	});
}

function getGlobalInventory(URL,response)
{
	DAL.getInventoryDisplayData('___Global___',function(inventory)
	{
		ServeJSON(inventory,response,URL);
	});
}

function getGlobalInventoryItemAssetData(URL,response)
{	
	if(!URL.query.AID)
	{
		respond(response,500,'no AID in query string');
		return;
	}
	DAL.getInventoryItemAssetData('___Global___',URL.query.AID,function(item)
	{
		ServeJSON(item,response,URL);
	});
}

function getGlobalInventoryItemMetaData(URL,response)
{	
	if(!URL.query.AID)
	{
		respond(response,500,'no AID in query string');
		return;
	}
	DAL.getInventoryItemMetaData('___Global___',URL.query.AID,function(item)
	{
		ServeJSON(item,response,URL);
	});
}
function addGlobalInventoryItem(URL,data,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	DAL.addToInventory('___Global___',{uploader:URL.loginData.UID,title:URL.query.title,uploaded:new Date(),description:'',type:URL.query.type},data,function(id)
	{
		respond(response,200,id);
	});
}
function deleteGlobalInventoryItem(URL,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'no login data');
		return;
	}
	if(!URL.query.AID)
	{
		respond(response,500,'no AID in query string');
		return;
	}
	DAL.getInventoryItemMetaData('___Global___',URL.query.AID,function(item)
	{
		if(item.uploader == URL.loginData.UID)
		{
			DAL.deleteInventoryItem('___Global___',URL.query.AID,function()
			{
				respond(response,200,'ok');
			});
		}else
		{
			respond(response,401,'you are not the asset owner');
		}
	});
}

function ServeJSON(jsonobject,response,URL)
{
		    
			response.writeHead(200, {
				"Content-Type": "text/json"
			});
			if (jsonobject.constructor != String)
				response.write(JSON.stringify(jsonobject), "utf8");
			else
				response.write(jsonobject, "utf8");
			response.end();
			
}
function SaveProfile(URL,data,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'no login data saving profile ' + filename);
		return;
	}
	data = JSON.parse(data);
	//do not allow update of password in this way.
	delete data.Password;
	delete data.password;
	delete data.Username;
	delete data.username;
	delete data.Salt;
	delete data.salt;
	delete data.inventoryKey;
	DAL.updateUser(URL.loginData.UID,data,function()
	{
		respond(response,200,'');
		return;
	});
}
function CreateProfile(URL,data,response)
{
	data = JSON.parse(data);
	data.Password = Hash(URL.query.P);
	DAL.createUser(URL.query.UID,data,function(ok,err)
	{
		if(ok)
			respond(response,200,'');
		else
			respond(response,500,err);
		return;
	});
}
//Read the password from the profile for the UID user, and callback with the match
function CheckPassword(UID,Password, callback)
{
	DAL.getUser(UID,function(user)
	{
		if(!user)
		{
			callback(false);
			return;
		}	
		callback(user.Password == Hash(Password));
		return;
	
	});
}

//Check that the UID is the author of the asset
function CheckAuthor(UID,assetFilename, callback)
{
	var basedir = datapath + "/GlobalAssets/".replace(safePathRE);
	
	if(!fs.existsSync(assetFilename))
	{
		callback(false);
		return;
	}
	else
	{
		fs.readFile(assetFilename, "utf8", function (err, file) {
			var asset = JSON.parse(file);
			
			var storedAuthor = asset.Author;
			
			var suppliedAuthor = UID;
			global.log(storedAuthor,suppliedAuthor,2);
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
	var basedir = datapath + "/GlobalAssets/".replace(safePathRE);
	
	if(!fs.existsSync(stateFilename))
	{
		callback(false);
		return;
	}
	else
	{
		fs.readFile(stateFilename, "utf8", function (err, file) {
			var asset = JSON.parse(file);
			
			
			var storedOwner = asset[asset.length-1].owner;
			
			var suppliedOwner = UID;
			global.log(storedOwner,suppliedOwner,2);
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
	var P = URL.query.P || (URL.loginData && URL.loginData.Password);
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
					global.log('parse asset',2);
					var asset = JSON.parse(data);
					asset.Author = URL.query.UID;
					data = JSON.stringify(asset);
					SaveFile(filename,data,response);
					global.log('Saved Asset ' + filename,2);
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
							global.log('Saved Asset ' + filename,2);
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
	DAL.deleteUser(URL.loginData,function()
	{
		respond(response,200,'');
	});
}


var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + libpath.sep + file;
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

//Copy the world to a new world
function CopyInstance(URL, SID, response){

	if(!URL.loginData)
	{
		respond(response,401,'Anonymous users cannot copy instances');
		return;
	}
	
	SID = SID ? SID : URL.query.SID;
	if(SID.length == 16){
		SID = '_adl_sandbox_' + SID + '_';
	}
	
	DAL.copyInstance(SID, URL.loginData.UID, function(newId){
	
		if(newId) respond(response, 200, newId);
		else respond(response, 500, 'Error in trying to copy world');
	});
}

//Get list of files in State dir of a given world id
function GetStateList(URL, SID, response){
	
	SID = SID ? SID : URL.query.SID;
	if(SID.length == 16){
		SID = '_adl_sandbox_' + SID + '_';
	}
	
	DAL.getStatesFilelist(SID, function(fileList){
	
		if(fileList) respond(response, 200, JSON.stringify(fileList));
		else respond(response, 500, 'Error in trying to retrieve backup list');
	});
}

//Get list of files in State dir of a given world id
function RestoreBackupState(URL, SID, response){
	
	SID = SID ? SID : URL.query.SID;
	var statename = URL.query.statename;
	
	var backup = URL.query.backup;
	
	if(backup == "state"){
		respond(response, 500, 'Cannot restore from current state file');
		return;
	}
	
	if(SID.length == 16){
		SID = '_adl_sandbox_' + SID + '_';
	}
	
	DAL.restoreBackup(SID, statename, function(success){
	
		if(success) respond(response, 200, JSON.stringify("Success"));
		else respond(response, 500, 'Error in trying to retrieve backup list');
	});
}

//Publish the world to a new world
//This is just a copy with some special settings
function Publish(URL, SID, publishdata, response){

	try{
	publishdata = JSON.parse(publishdata);
	}catch(e){

		if(publishdata != 'null')
			respond(response,500,'Bad format');

	}
	if(!URL.loginData)
	{
		respond(response,401,'Anonymous users cannot copy instances');
		return;
	}
	
	SID = SID ? SID : URL.query.SID;
	if(SID.length == 16){
		SID = '_adl_sandbox_' + SID + '_';
	}
	
	console.log(SID);
	DAL.getInstance(SID,function(state)
	{
	
		if(!state)
		{
			respond(response,500,'State ID is incorrect');
			return;
		}
		
		//Make sure that the logged in user is the owner of the world they are trying to publish
		if(state.owner != URL.loginData.UID)
		{
			respond(response,500,'You must be the owner of a world you publish');
			return;
		}
		
		var publishSettings = null;
		//The settings  for the published state. 
		//have to handle these in the client side code, with some enforcement at the server
		console.log(publishdata);
		if(publishdata)
		{
			var singlePlayer = publishdata.SinglePlayer;
			var camera = publishdata.camera;
			var allowAnonymous = publishdata.allowAnonymous;
			var createAvatar = publishdata.createAvatar;
			var allowTools = publishdata.allowTools;
		
			 publishSettings = {singlePlayer:singlePlayer,camera:camera,allowAnonymous:allowAnonymous,createAvatar:createAvatar,allowTools:allowTools};
		}
		//publish the state, and get the new id for the pubished state
		DAL.Publish(SID, publishSettings, function(newId){
		
			//get the db entry for the published state
			DAL.getInstance(newId,function(statedata)
			{
				//this should really never happen
				if(!statedata)
				{
					respond(response,401,'State not found. State ' + SID);
					return;
				}
				
				if(publishdata)
				{
					statedata.title = publishdata.title;
					statedata.description = publishdata.description;
					//Should not need to check permission again
					DAL.updateInstance(newId,statedata,function()
					{
						respond(response,200,newId);
					});
				}else
				{
					respond(response,200,newId);
				}
			});	
		});
	});
}

function SaveThumbnail(URL,SID,body,response)
{


	if(!URL.loginData)
	{
		respond(response,401,'Anonymous users cannot delete instances');
		return;
	}

	var data = body.replace(/^data:image\/\w+;base64,/, "");
	var buf = new Buffer(data, 'base64');
	SID = SID ? SID : request.url.query.SID;
	if(SID.length == 16){
		SID = '_adl_sandbox_' + SID + '_';
	}
	DAL.getInstance(SID,function(state)
	{
		if(state.owner != URL.loginData.UID && URL.loginData.UID != global.adminUID)
		{
			respond(response,401,'User does not have permission to edit instance');
			return;
		}else
		{
			var filename = datapath + libpath.sep+"States"+libpath.sep+ SID + libpath.sep + "thumbnail.png";
			fs.writeFile(filename, buf,function(err)
			{

				if(err)
				respond(response,500,err.toString());
				else	
				respond(response,200,'');

			});
		}
	});
}

function GetThumbnail(request,SID,response)
{

	SID = SID ? SID : request.url.query.SID;
	if(SID.length == 16){
		SID = '_adl_sandbox_' + SID + '_';
	}
	global.FileCache.ServeFile(request,datapath + libpath.sep+"States"+libpath.sep+ SID + libpath.sep + "thumbnail.png" ,response,request.url);		
}

//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function DeleteState(URL,SID,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'Anonymous users cannot delete instances');
		return;
	}
	DAL.getInstance(SID,function(state)
	{
		if(state.owner != URL.loginData.UID && URL.loginData.UID != global.adminUID)
		{
			respond(response,401,'User does not have permission to delete instance');
			return;
		}else
		{
			DAL.deleteInstance(SID,function()
			{
				respond(response,200,'deleted instance');
				return;
			});
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
			
			global.log("hash is:"+hash(data) +" "+ hash(file),2);
			callback(hash(data) == hash(file));
		});
		return;

}

//Save an instance. the POST URL must contain valid name/password and that UID must match the Asset Author
function SaveState(URL,id,data,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'No login data when saving state');
		return;
	}
	
	DAL.getInstance(id,function(state)
	{
	
		//not allowed to update a published world
		if(state.publishSettings)
		{
			respond(response,500,'World is published, Should never have tried to save. How did we get here? ' + id);
			return;
		}
	
		//not currently checking who saves the state, so long as they are logged in
		DAL.saveInstanceState(id,data,function()
		{
			respond(response,200,'saved ' + id);
			return;
		});
	
	});
	
	
	
		
}



//Save an asset. the POST URL must contain valid name/password and that UID must match the Asset Author
function DeleteAsset(URL,filename,response)
{
	var UID = URL.query.UID || (URL.loginData && URL.loginData.UID);
	var P = URL.query.P || (URL.loginData && URL.loginData.Password);
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
		if(fs.statSync(startdir + currentdir + libpath.sep+ files[i]).isDirectory())
		{
			var o = {};
			var newfiles = fs.readdirSync(startdir + currentdir + libpath.sep + files[i]+libpath.sep);
			var tdir = currentdir ? currentdir + libpath.sep + files[i] : files[i];
			RecurseDirs(startdir,tdir,newfiles);
			newfiles.sort(function(a,b){
			   if(typeof a == "string" && typeof b == "string") return (a<b ? -1 : 1);
			   if(typeof a == "object" && typeof b == "string") return  1;
			   if(typeof a == "string" && typeof b == "object") return  -1;
			   return -1;
			});
			for(var j = 0; j < newfiles.length; j++)
				if(typeof newfiles[j] == "string")
					newfiles[j] = currentdir + libpath.sep + files[i] + libpath.sep + newfiles[j];
			o[currentdir ? currentdir + libpath.sep + files[i] : files[i]] = newfiles;
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

function setStateData(URL,data,response)
{
	if(!URL.loginData)
	{
		respond(response,401,'Anonymous users cannot edit instances');
		return;
	}
	data = JSON.parse(data);
	var sid = URL.query.SID;
	var statedata = {};
	sid = sid.replace(/\//g,'_');
	statedata.title = data.title;
	statedata.description = data.description;
	statedata.lastUpdate = (new Date());
	
	DAL.getInstance(sid,function(state)
	{
		if(!state)
		{
			respond(response,401,'State not found. State ' + sid);
			return;
		}
		if(state.owner == URL.loginData.UID || URL.loginData.UID == global.adminUID)
		{
			DAL.updateInstance(sid,statedata,function()
			{
				respond(response,200,'Created state ' + sid);
			});
		}else
		{
			respond(response,401,'Not authorized to edit state ' + sid);
		}

	});	

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
	var basedir = datapath + libpath.sep;
	var statedir = (basedir + 'States/' + SID).replace(safePathRE);
	var statefile = statedir + '/state'.replace(safePathRE);
	global.log('serve state ' + statedir,2);
	if(fs.existsSync(statefile))
	{
		file = fs.readFileSync(statefile,'utf8');
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
  global.log(SessionID,3);
  for(var i in global.sessions)
  {	
	//console.log("checking "+global.sessions[i].sessionId+" == " + SessionID);
	if(global.sessions[i].sessionId == SessionID)
	{
		global.sessions[i].resetTimeout();
		return global.sessions[i];
	}
  }
  return null;
}

function Salt(URL,response)
{	
	DAL.getUser(URL.query.UID,function(user){
		
		if(user && user.Salt)
		{
			respond(response,200,user.Salt);
			
		}else if (user)
		{
			respond(response,200,'OBS#$%SGSDF##$%#DA');
		}else
		{
			//respond with a fake salt so attackers can't identify which is a valid account using this endpoint
			//note: probably a timing attack here
			respond(response,401,GUID());
		}
	
		
	});

}

//router
function serve (request, response)
{


	var URL = url.parse(request.url,true);
	var serviceRoute = "vwfdatamanager.svc/";
	var pathAfterRoute = URL.pathname.substr(URL.pathname.toLowerCase().lastIndexOf(serviceRoute)+serviceRoute.length);
	
	//format is /{anything}/vwfDataManager.svc/command/path/after/command
	
	
	//the first string after /vwfDataManager.svc/
	var command = pathAfterRoute.substr(0,pathAfterRoute.indexOf('/')) || pathAfterRoute;
	var pathAfterCommand = pathAfterRoute.substr(command.length);
	
	command = command.toLowerCase();
	
	//Load the session data
	URL.loginData = GetSessionData(request);
	
	
	//Allow requests to submit the username in the URL querystring if not session data
	var UID;
	if(URL.loginData)
		UID = URL.loginData.UID;
	if(URL.query.UID)
	UID = URL.query.UID;	
	var SID = URL.query.SID;
	if(SID)
	 SID = SID.replace(/[\\,\/]/g,'_');
	 
	//Normalize the path for max/unix
	pathAfterCommand = pathAfterCommand.replace(/\//g,libpath.sep);
	var basedir = datapath + libpath.sep;
	//console.log(basedir+"DataFiles"+ pathAfterCommand);
	
	global.log(command,UID,3);
	if(request.method == "GET")
	{
		switch(command)
		{	
			case "texture":{
				global.FileCache.ServeFile(request,basedir+"Textures"+libpath.sep+ URL.query.UID,response,URL);		
			} break;
			case "thumbnail":{
				GetThumbnail(request,SID,response);	
			} break;
			case "datafile":{
				global.FileCache.ServeFile(request,basedir+"DataFiles"+ pathAfterCommand,response,URL);		
			} break;
			case "texturethumbnail":{
				global.FileCache.ServeFile(request,basedir+"Thumbnails"+libpath.sep + URL.query.UID,response,URL);		
			} break;
			case "state":{
				ServeFile((basedir+"States/"+SID+'/state').replace(safePathRE),response,URL,'GetStateResult');		
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
			case "statehistory":{
				console.log("statehistory");
				DAL.getHistory(SID,function(statehistory)
				{
					if(statehistory)
						ServeJSON(statehistory,response,URL);
					else
						respond(response,500,'state not found' );
				});
			} break;
			case "copyinstance":{
				CopyInstance(URL, SID, response);		
			} break;
			case "stateslist":{
				GetStateList(URL, SID, response);		
			} break;
			case "restorebackup":{
				RestoreBackupState(URL, SID, response);		
			} break;
			case "salt":{
				Salt(URL,response);		
			} break;
			case "profile":{
				ServeProfile(UID,response,URL);		
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
				DAL.getUsers(function(users)
				{
					if(users)
						ServeJSON(users,response,URL);
					else
						respond(response,500,'users not found' );
				});
			} break;
		    case "inventory":{
				getInventory(URL,response);
			}break;
			case "inventoryitemassetdata":{
				getInventoryItemAssetData(URL,response);
			}break;
			case "inventoryitemmetadata":{
				getInventoryItemMetaData(URL,response);
			}break;
			case "states":{
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
				fs.readdir(basedir+"Textures"+libpath.sep,function(err,files){
					RecurseDirs(basedir+"Textures"+libpath.sep, "",files);
					files.sort(function(a,b){
					   if(typeof a == "string" && typeof b == "string") return (a<b ? -1 : 1);
					   if(typeof a == "object" && typeof b == "string") return  1;
					   if(typeof a == "string" && typeof b == "object") return  -1;
					   return -1;
					});
					var o = {};
					o.GetTexturesResult = JSON.stringify({root:files}).replace(/\\\\/g,"\\").replace(/\/\//g, '/');
					global.textures = o;
					ServeJSON(o,response,URL);
				});
					
			} break;
			case "globalassets":{
				getGlobalInventory(URL,response);
			} break;
			case "globalassetassetdata":{
				getGlobalInventoryItemAssetData(URL,response);
			} break;
			case "globalassetmetadata":{
				getGlobalInventoryItemMetaData(URL,response);
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
		var body = request.body;

		if(body == '')
		{
			
			respond(response,500,"Error in post: data is null");
			return;
		}
		
		//Have to do this here! throw does not work quite as you would think 
		//with all the async stuff. Do error checking first.
		if(command != 'thumbnail')   //excpetion for the base64 encoded thumbnails
		{
			try{
				JSON.parse(body);
			}catch(e)
			{
				respond(response,500,"Error in post: data is not json");
				return;
			}
		}
		switch(command)
		{	

			case "thumbnail":{
				SaveThumbnail(URL,SID,body,response);	
			} break;
			case "state":{
				SaveState(URL,SID,body,response);
			}break;
			case "createstate":{
				createState(URL,body,response);
			}break;
			case "statedata":{
				setStateData(URL,body,response);
			}break;
			case "globalasset":{
				addGlobalInventoryItem(URL,body,response);
			}break;
			case "profile":{
				SaveProfile(URL,body,response);
			}break;
			case "createprofile":{
				CreateProfile(URL,body,response);
			}break;
			case "inventoryitem":{
				addInventoryItem(URL,body,response);
			}break;
			case "inventoryitemmetadata":{
				updateInventoryItemMetadata(URL,body,response);
			} break;
			case "publish":{
				Publish(URL, SID,body, response);		
			} break;
			default:
			{
				global.log("POST",2);
				_404(response);
				return;
			}
		}
	}	
	if(request.method == "DELETE")
	{
		var body = request.body;

		switch(command)
		{	
			case "state":{
				DeleteState(URL,SID,response);
			}break;
			case "inventoryitem":{
				deleteInventoryItem(URL,response);
			} break;
			case "globalasset":{
				 deleteGlobalInventoryItem(URL,response);
			}break;
			case "profile":{
				DeleteProfile(URL, basedir+"Profiles"+libpath.sep+UID,response);
			}break;
			default:
			{
				global.log("DELETE",2);
				_404(response);
				return;
			}
		}
	}	
}

exports.serve = serve;
exports.getState = getState;
exports.getSessionData = GetSessionData;
exports.setDataPath = function(p)
{
	p = libpath.resolve(p);
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
