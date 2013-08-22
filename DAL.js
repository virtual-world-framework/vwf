var nStore = require('nstore');
var libpath = require('path');
nStore = nStore.extend(require('nstore/query')());
var async = require('async');
var fs = require('fs-extra');
require('./hash.js');
var datapath = '';

var DBTablePath = libpath.sep+'users.db';

var DB = '';
var safePathRE = RegExp('/\//'+(libpath.sep=='/' ? '\/' : '\\')+'/g');

Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}

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
	
function getUser (id,cb)
{
	getUsers(function(UserIndex){
	
		if(UserIndex.indexOf(id) != -1)
		{
			DB.get(id,function(err,doc,key){
			
				cb(doc);
			});
		}
		else
		{
			cb(null);
		}
	
	});
	
}
function updateUser (id,data,cb)
{
	async.waterfall([
		function(cb2)
		{
			//first, get the existing record
			getUser(id,function(user)
			{
				cb2(null,user);
			});
		},
		function(user,cb2)
		{
			//if the record does not exist, callback false
			if(user == null)
			{
				cb2('user does not exist');
			}else
			{
				cb2(null,user);
			}
		},
		function(user,cb2)
		{
			if(data.username)
			{
				
				cb2('cant change username');
				return;
			}
			for(var key in data)
			{
				user[key] = data[key];
			}
			
			DB.save(id,user,function(err,doc,key)
			{
				cb2(null,doc);
			});
		}],
		function(err, results)
		{
			if(err)
			{
				global.log(err,0);
				cb(false);
			}
				
			cb(true);	
		}
	);	
};
function deleteInventoryItem(userID,inventoryID,cb)
{
	getInventoryForUser(userID,function(inventory,Ikey)
	{	
		if(!inventory)
		{
			global.log('inventory not found');
			cb();
			return;
		}
		//item must be in list of user
		if(inventory.indexOf(inventoryID) != -1)
		{
			//remove from user inventory list
			while(inventory.indexOf(inventoryID) != -1)
				inventory.splice(inventory.indexOf(inventoryID),1);
			//save user inventory list	
			DB.save(Ikey,inventory,function()
			{
				//remove database entry
				DB.remove(inventoryID,function(){
				
					//delete file
					var file = datapath + '/Profiles/' + userID + '_Data/' + inventoryID;
					fs.unlink( file.replace(safePathRE),function()
					{
						cb();
					});
				});
			});
		}
		else
		{
			cb();
		}	
	});

}
function getInventoryItemAssetData(userID,inventoryID,cb)
{
	getInventoryForUser(userID,function(inventory,Ikey)
	{
	
		if(!inventory)
		{	
			global.log('inventory not found',0);
			cb(null);
			return;
		}
		if(inventory.indexOf(inventoryID) != -1)
		{
			fs.readFile((datapath+'/Profiles/'+userID+'_Data'+'/'+inventoryID).replace(safePathRE),"utf8",function(err,data)
			{
				cb(JSON.parse(data));
			});			
		}
		else
		{
			global.log('User does not contain inventory item');
			cb(null);
		}
	});
}
function getInventoryItemMetaData(userID,inventoryID, cb)
{
	getInventoryForUser(userID,function(inventory,Ikey)
	{
		if(!inventory)
		{
			cb(null);
			return;
		}
		if(inventory.indexOf(inventoryID) != -1)
		{
			DB.get(inventoryID,function(err,doc,key)
			{
				cb(doc,key);
			});
		}
		else
		{
			global.log('User does not contain inventory item');
			cb(null);
		}
	});
}

function updateInventoryItemMetadata(userID,inventoryID,data, cb)
{
	getInventoryForUser(userID,function(inventory,Ikey)
	{
		if(!inventory)
		{	
			global.log('inventory not found',0);
			cb(null);
			return;
		}
		if(inventory.indexOf(inventoryID) != -1)
		{
			DB.get(inventoryID,function(err,item)
			{
				if(!item)
				{	
					global.log('item not found',0);
					cb(null);
					return;
				}
				for(var key in data)
				{
					item[key] = data[key];
				}
				DB.save(inventoryID,item,function()
				{
				    global.log('saved' + item,0);
					cb();
				});
			});
		}
		else
		{
			global.log('User does not contain inventory item');
			cb(null);
		}
	});
}

//cb(key);
function addToInventory(userID,data,assetdata,cb)
{
	//get the inventor list for the user
	getInventoryForUser(userID,function(inventory,Ikey)
	{
		//save the data
		DB.save(null,data,function(err,key)
		{	
			//put the key for the data in the inventory
			inventory.push(key);
			
			//save the inventory
			DB.save(Ikey,inventory,function(err)
			{
				var file = datapath+'/Profiles/' + userID + '_Data/' + key;
				fs.writeFile( file.replace(safePathRE),JSON.stringify(assetdata),function(err)
				{
					cb(key);
				});	
			});
			
		});
	});
}
function getInventoryForUser(userID,cb)
{
	getUser(userID,function(user)
	{
		var ik = user && user.inventoryKey;
		DB.get(ik,function(err,doc,key)
		{
			cb(doc,ik);
		});
		
	});
}
//cb(results)
function searchInventory(userID,searchTerms,cb)
{
	
	if(searchTerms.constructor != Array)
		searchTerms = [searchTerms];
	else
		searchTerms = searchTerms.getUnique();
		
		
	getInventoryDisplayData(userID,function(inventory){
	
		if(!inventory || ! searchTerms)
		{
			cb([]);
			return;
		}
		
		var results = [];
		for(var i =0; i < inventory.length; i ++)
		{
			var match = false;
			for(var j =0; j < searchTerms.length; j++)
			{
				if(searchTerms[j])
				{
					if(inventory[i].title && inventory[i].title.indexOf(searchTerms[j]) != -1)
						match = true;
					if(inventory[i].description && inventory[i].description.indexOf(searchTerms[j]) != -1)
						match = true;
					if(inventory[i].keywords && inventory[i].keywords.indexOf(searchTerms[j]) != -1)
						match = true;
				}					
			}
			if(match)
				results.push(inventory[i]);
	
		}
		cb(results.getUnique());
	});
}

//cb(list)
function getInventoryDisplayData(userID,cb)
{
	getInventoryForUser(userID,function(inventory)
	{
		var list = [];
		if(!inventory)
		{
			cb(list);
			return;
		}
		async.eachSeries(inventory,
		function(item,cb2){
		
			getInventoryItemMetaData(userID, item,function(data)
			{
				if(data)
					list.push({title:data.title,description:data.description,type:data.type,key:item});
				cb2();
			});
		
		},
		function(){
			cb(list);
		});
	
	
	})
}
function createUser (id,data,cb)
{
	getUser(id,function(user){
	
		if(user)
		{
			global.log('user '+ id + ' already exists');
			cb(false);
		}
		else
		{
			
			async.waterfall([
			function(cb2){
				
				var inventory = [];
				DB.save(null,inventory,function(err,key)
				{
					cb2(null,key);
				});
			
			},
			function(inventoryKey,cb2){
				
				
				data.inventoryKey = inventoryKey;
				DB.save(id,data,function(err,doc,key)
				{
					cb2();
				});
			
			},
			function(cb2){
				
				
				DB.get('UserIndex',function(err,UserIndex,key)
				{
					cb2(null,UserIndex);
				});
			
			},
			function(UserIndex, cb2)
			{
				
					if(!UserIndex)
						UserIndex = [];
					UserIndex.push(id);
					DB.save('UserIndex',UserIndex,function()
					{
						cb2();
					});
			},
			function(cb2)
			{
			
				
				var file = (datapath + '/Profiles/' + id).replace(safePathRE);
				global.log(file,0);
				MakeDirIfNotExist(file+'_Data',function(){
						
					cb2();
				});
			}],
			function(err,results)
			{
				
				console.log(err,0);
				cb(true);
			}
			);
		}
	});
}
function deleteUser (id,cb)
{
	//get all inventory
	getInventoryForUser(id,function(inventory,idk)
	{
		//remove each inveentory item metadata entry
		if(!inventory) inventory = [];
		async.each(inventory,function(item,cb2)
		{
			DB.remove(item,cb2);
		},
		function(){
			//remove the inventory index
			DB.remove(idk,function(err,doc,key)
			{
				//remove user from user index
				DB.get('UserIndex',function(err,UserIndex,key)
				{
					
					while(UserIndex.indexOf(id) != -1)
						UserIndex.splice(UserIndex.indexOf(id),1);
					
					//save user index
					DB.save('UserIndex',UserIndex,function(err,doc,key)
					{
						//remove user from database
						DB.remove(id,function(err,doc,key)
						{
							//delete user folder
							deleteFolderRecursive((datapath + '/Profiles/' + id).replace(safePathRE) + '_Data');
							cb();
						});
					});
				});
			});
		});
	});
};
			

function getInstance (id,cb)
{
	DB.get(id,function(err,doc,key){
	
		cb(doc);
	});
}
function updateInstance (id,data,cb)
{
	async.waterfall([
		function(cb2)
		{
			//first, get the existing record
			getInstance(id,function(instance)
			{
				cb2(null,instance);
			});
		},
		function(instance,cb2)
		{
			//if the record does not exist, callback false
			if(instance == null)
			{
				cb2('instance does not exist');
			}else
			{
				cb2(null,instance);
			}
		},
		function(instance,cb2)
		{
			for(var key in data)
			{
				instance[key] = data[key];
			}
			
			DB.save(id,instance,function(err,doc,key)
			{
				cb2(null,doc);
			});
		}],
		function(err, results)
		{
			if(err)
			{
				global.log(err,0);
				cb(false);
			}
				
			cb(true);	
		}
	);	
};

//make a directory if the directory does not exist
function MakeDirIfNotExist(dirname,callback)
{
	fs.exists(dirname, function(e)
	{
		if(e)
		{
			fs.stat(dirname,function(err,stats)
			{
				
				if(stats.isDirectory())
					callback();
				else
				{
					fs.mkdir(dirname,function(){
						callback();
					});
				}
			});
		}else
		{
			fs.mkdir(dirname,function(){
				callback();
			});
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

function SaveFile(filename,data,cb)
{
	fs.writeFile(filename,data,'binary',function()
	{
		cb();
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
//hash a string
function hash(str)
{
	return require('crypto').createHash('md5').update(str).digest("hex");
}
//no point clogging up the disk with backups if the state does not change.
function CheckHash(filename,data,callback)
{
	fs.readFile(filename, "utf8", function (err, file) {
			
			//global.log("hash is:"+hash(data) +" "+ hash(file));
			if(err || !file)
			{
				callback(false);
				return;
			}
			
			
			if(typeof data == "string")
			{
				
				callback(hash(data) == hash(file));
			}
			else
			{
				var str = JSON.stringify(data)
				var h1 = hash(str);
				var h2 = hash(file)
				callback(h1 == h2);
			}
		});
		return;

}
function saveInstanceState(id,data,cb)
{
	
	var parsedData = typeof data == 'string' ? JSON.parse(data) : data;
	getInstance(id,function(instance){
	
		
		if(instance)
		{
			global.log('instance '+ id + ' exists');
			async.waterfall([
				function(cb2)
				{
				
					MakeDirIfNotExist((datapath+'/States/'+id).replace(safePathRE),function() 
						{
							cb2();
						});
				
				},
				function(cb2)
				{
					CheckHash((datapath + '/States/' + id+'/state').replace(safePathRE),data,function(issame)
					{
						cb2(undefined,issame);
					});
				},
				function(issame,cb2)
				{
					if(!issame)
					{
						var path = (datapath + '/States/'+id+'/').replace(safePathRE);
						RenameFile(path+'state',path+'statebackup'+GUID(),function()
						{
							cb2(undefined,issame);
						});
					}else
					{
						cb2(undefined,issame);
					}
				},
				function(issame,cb2)
				{
					if(!issame)
					{
						SaveFile((datapath + '/States/' + id+'/state').replace(safePathRE),data,function()
						{
							cb2(undefined);
						});
					}else
					{
						cb2(undefined);
					}
				},
				function(cb2)
				{
					getInstance(id,function(state)
					{
						updateInstance(id,{lastUpdate:(new Date()),updates:1 + state.updates,objects:parsedData.length},function()
						{
							cb2(undefined);
						});
					});
				}
				],function(err,results)
				{
					cb();
				});
		
		}else
		{
			
			cb(false);
		}
	});
}

function createInstance (id,data,cb)
{
	getInstance(id,function(instance){
	
		if(instance)
		{
			global.log('instance '+ id + ' already exists');
			cb(false);
		}
		else
		{
			DB.save(id,data,function(err,doc,key)
			{
				DB.get('StateIndex',function(err,stateIndex,key)
				{
					if(!stateIndex)
						stateIndex = [];
					stateIndex.push(id);
					DB.save('StateIndex',stateIndex,function()
					{
						MakeDirIfNotExist((datapath + '/States/' + id).replace(safePathRE),function() 
						{
							cb(true);
						});
					});
				});
			});
		}
	});
};

function deleteInstance (id,cb)
{
	async.series([
	function(cb2)
	{
		DB.remove(id,function(err,doc,key)
		{
			
			deleteFolderRecursive((datapath + '/States/' + id).replace(safePathRE));
			cb2();
		});
	},
	function(cb2)
	{
		
		DB.get('StateIndex',function(err,stateIndex,key)
		{
			if(!stateIndex)
			{
				cb();
				return;
			}
			
			stateIndex.splice(stateIndex.indexOf(id),1);
			DB.save('StateIndex',stateIndex,function()
			{
				
				cb();
			});
		});
	}]);
};

function findState(query,cb)
{
	
	DB.find(query,function(err,res)
	{
		cb(res);
	});

}
function clearUsers()
{
	getUsers(function(UserIndex)
	{
		async.eachSeries(UserIndex,function(item,cb2)
		{
			
			deleteUser(item,function()
			{
				cb2();
			});
		},function()
		{
			
		});
	});
}

function importUsers()
{
	var profilePath = (datapath + '/Profiles/').replace(safePathRE);
	fs.readdir(profilePath,function(err,files){
		async.eachSeries(files,
			function(i,cb)
			{
				
				if(!fs.statSync(profilePath+i).isDirectory())
				{
					getUser(i,function(user)
					{
						if(user)
						{
							
							cb();	
						}else
						{
							var profile = fs.readFileSync(profilePath+i,"utf8");
							profile = JSON.parse(profile);
							profile.Password = Hash(profile.Password);
							var inventory = profile.inventory;
							delete profile.inventory;
							createUser(i,profile,function()
							{
								async.series([
									function(cb3)
									{
										if(inventory && inventory.objects)
										{
											async.eachSeries(Object.keys(inventory.objects),function(item,cb2)
											{
												
												var itemdata = inventory.objects[item];
												if(itemdata)
												{
													var type ="object";
													if( itemdata.type) type = itemdata.type;
													if(itemdata.properties && itemdata.properties.type) type = itemdata.properties.type;
													addToInventory(i,{title:item,type:type},itemdata,function()
													{
														cb2();
													});
												}else
												{
													cb2();
												}
												
												
											},function(res)
											{
												cb3();
											});
										}
										else{
										  cb3();
										}
									},
									function(cb3)
									{
									
										if(inventory && inventory.scripts)
										{
											async.eachSeries(Object.keys(inventory.scripts),function(item,cb2)
											{
												
												var itemdata = inventory.scripts[item];
												if(itemdata)
												{
													addToInventory(i,{title:item,type:itemdata.type},itemdata,cb2);
												}else
												{
													cb2();
												}
											},function(res)
											{
												cb3();
											});
										}
										else{
										  cb3();
										}
									
									}],function(err,res)
									{
										cb();
									}
								);	
							});
						};
							
					});
						
				}
				else
				{
					cb();
				}
			
				
				
			},
			function(err)
			{
				
			});
	});
}
function importStates()
{
	fs.readdir((datapath+"/states/").replace(safePathRE),function(err,files){
		async.each(files,
			function(i,cb)
			{
				console.log(i);
				getInstance(i,function(inst)
				{
					if(inst)
					{
						console.log(i + " already in database");
						cb();
					}
					else
					{
						var instdata = fs.readFileSync((datapath+"/states/"+i+"/state").replace(safePathRE),'utf8');
						instdata = JSON.parse(instdata);
						var statedata = {};
						statedata.objects = instdata.length;
						statedata.owner = instdata[instdata.length -1].owner;
						statedata.title = "Imported State " + i;
						statedata.description = "Imported automatically from database update";
						createInstance(i,statedata,function()
						{
							console.log('imported' + i);
							cb();
						});
					}
				});
				
			},
			function(err)
			{
				console.log('done');
			});
	});
}
function deleteInstances(list, cb){
	async.eachSeries(list, function(val,cb2)
	{
		getInstance(val,function(state){
			//Do some type of privilege checking
			//if(state.owner != URL.loginData.UID && URL.loginData.UID != global.adminUID)
			deleteInstance(val,function(){
				cb2();
			});
		});
	}, cb);
};
function deleteUsers(list, cb){
	async.eachSeries(list, function(val,cb2)
	{
		deleteUser(val, function(){		
			cb2();
		});	
	}, cb);
};

function getAllUsersInfo(cb){
	var userInfoList = [];
	getUsers(function(users){	
		async.eachSeries(users, function(val,cb2)
		{
			getUser(val, function(doc){
				userInfoList.push(doc);
				cb2();
			});
		}, function(){cb(userInfoList)});
	});
};
			
function getUsers (cb)
{
	DB.get('UserIndex',function(err,UserIndex,key)
	{
		cb(UserIndex);
	});
	
};
function purgeInstances()
{
	DB.get('StateIndex',function(err,stateIndex,key)
	{
		var data = {}
		async.each(stateIndex,function(i,cb)
		{
			if(!fs.existsSync((datapath +"/States/" + i).replace(safePathRE)))
			{
				console.log('delete instance ' + i);
				deleteInstance(i,function()
				{
					cb();
				})
			}else
			{
				cb();
			}
		},function(err)
		{
			
		});
		
	});
}
function getInstanceNamess (cb)
{
	DB.get('StateIndex',function(err,stateIndex,key)
	{
		cb(stateIndex);
	});
};
function getInstances (cb)
{
	DB.get('StateIndex',function(err,stateIndex,key)
	{
		var data = {}
		async.each(stateIndex,function(i,cb)
		{
			getInstance(i,function(inst)
			{
				data[i] = inst;
				cb();
			});
		},function(err)
		{
			cb(data);
		});
		
	});
};
			
function searchUsers (terms,cb)
{

};
function searchInstances (terms,cb)
{

};




function startup(callback)
{
	async.series([
		
		function(cb)
		{
			DB = nStore.new(DBTablePath, function () {
				cb();		
			});
		},
		function(cb)
		{
				DB.get('UserIndex',function(err,UserIndex)
				{
					if(!UserIndex)
						DB.save('UserIndex',[],function(err,data,key)
						{
							cb();
						});
					else
						cb();
				});
		},
		function(cb)
		{
				DB.get('StateIndex',function(err,StateIndex)
				{
					if(!StateIndex)
						DB.save('StateIndex',[],function(err,data,key)
						{
							cb();
						});
					else
						cb();
				});
		},
		function(cb)
		{
			global.log('DAL startup complete',0);
			exports.getUser = getUser;
			exports.updateUser = updateUser;
			exports.createUser = createUser;
			exports.deleteUser = deleteUser;
			exports.deleteUsers = deleteUsers;
			exports.getAllUsersInfo = getAllUsersInfo;
			
			exports.getInstance = getInstance;
			exports.updateInstance = updateInstance;
			exports.createInstance = createInstance;
			exports.deleteInstance = deleteInstance;
			exports.deleteInstances = deleteInstances;
			
			exports.getUsers = getUsers;
			exports.getInstances = getInstances;
			
			exports.searchUsers = searchUsers;
			exports.searchInstances = searchInstances;
			exports.saveInstanceState = saveInstanceState;
			
			exports.importStates = importStates;
			exports.purgeInstances = purgeInstances;
			exports.findState = findState;
			exports.deleteInventoryItem=deleteInventoryItem
			exports.getInventoryForUser = getInventoryForUser;
			exports.addToInventory = addToInventory;
			exports.getInventoryItemMetaData = getInventoryItemMetaData;
			exports.getInventoryItemAssetData = getInventoryItemAssetData;
			exports.getInventoryDisplayData = getInventoryDisplayData;
			exports.updateInventoryItemMetadata = updateInventoryItemMetadata;
			exports.importUsers = importUsers;
			exports.clearUsers = clearUsers;
			exports.searchInventory = searchInventory;
			callback();
		}
	

	]);
	
}

exports.setDataPath = function(p)
{
	global.log("datapath is " + p,0);
	datapath = p;
	DBTablePath = datapath + DBTablePath;
	
	
	
	
}
exports.startup = startup;
