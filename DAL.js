var nStore = require('nstore');
nStore = nStore.extend(require('nstore/query')());
var async = require('async');
var fs = require('fs-extra');

var datapath = '';

var DBTablePath = '\\users.db';

var DB = '';


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
	DB.get(id,function(err,doc,key){
	
		cb(doc);
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
			DB.save(id,data,function(err,doc,key)
			{
				DB.get('UserIndex',function(err,UserIndex,key)
				{
					if(!UserIndex)
						UserIndex = [];
					UserIndex.push(id);
					DB.save('UserIndex',UserIndex,function()
					{
						cb(true);
					});
				});
			});
		}
	});
};
function deleteUser (id,cb)
{
	DB.remove(id,function(err,doc,key)
	{
		cb();
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
			callback();
		else
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
	console.log('saveinstancestate');
	var parsedData = typeof data == 'string' ? JSON.parse(data) : data;
	getInstance(id,function(instance){
	
		console.log('get instance callback inside saveinstancestate');
		if(instance)
		{
			global.log('instance '+ id + ' exists');
			async.waterfall([
				function(cb2)
				{
				
					MakeDirIfNotExist(datapath + '\\States\\' + id,function() 
						{
							cb2();
						});
				
				},
				function(cb2)
				{
					CheckHash(datapath + '\\States\\' + id+'\\state',data,function(issame)
					{
						cb2(undefined,issame);
					});
				},
				function(issame,cb2)
				{
					if(!issame)
					{
						RenameFile(datapath + '\\States\\' + id+'\\state',datapath + '\\States\\' + id+'\\statebackup'+GUID(),function()
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
						SaveFile(datapath + '\\States\\' + id+'\\state',data,function()
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
			console.log("instance not found");
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
						MakeDirIfNotExist(datapath + '\\States\\' + id,function() 
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
			console.log('delete demo folder');
			deleteFolderRecursive(datapath + '\\States\\' + id);
			cb2();
		});
	},
	function(cb2)
	{
		console.log('update state index');
		DB.get('StateIndex',function(err,stateIndex,key)
		{
			
			if(!stateIndex)
			{
				cb();
				return;
			}
			console.log('Got state index');
			stateIndex.splice(stateIndex.indexOf(id),1);
			DB.save('StateIndex',stateIndex,function()
			{
				console.log('Saved StateIndex');
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
function importStates()
{
	fs.readdir(datapath+"\\states\\",function(err,files){
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
						var instdata = fs.readFileSync(datapath+"\\states\\"+i+"\\state",'utf8');
						instdata = JSON.parse(instdata);
						var statedata = {};
						statedata.objects = instdata.length;
						statedata.owner = instdata[instdata.length -1].owner;
						statedata.title = "Imported State";
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
			if(!fs.existsSync(datapath +"\\States\\" + i))
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
			// do a bootstrap test
			global.log('startup test');
			getUser('Rob',function(user)
			{
				global.log('Rob is:');
				console.log(user);
				if(!user)
				{	
					createUser('Rob',{username:'Rob',id:'123',logincount:0},function(err)
					{
						global.log('Rob created');
						cb();
					});
				}
				else
					cb();
			});
		},
		function(cb)
		{
			global.log('GEt Rob');
			getUser('Rob',function(user)
			{
				global.log('Got Rob');
				updateUser('Rob',{logincount:user.logincount + 1},function(err)
				{
					global.log('Rob Update');
					cb();
				});
			});
			
		},
		function(cb)
		{
			global.log('Get Rob');
			getUser('Rob',function(user)
			{
				global.log('Rob is:');
				console.log(user);
				if(user.logincount >= 5)
				{
					deleteUser('Rob',function()
					{
						global.log('Delete Rob');
						cb();
					});
				}else
				{
					cb();
				}
			});
		},
		function(cb)
		{
			global.log('Get Demo');
			getInstance('Demo',function(state)
			{
				global.log('234234 callback Demo is:');
				console.log(state);
				if(!state)
				{
					createInstance('Demo',{title:'Demo World',description:'this is the demo world'},function()
					{
						global.log('Created Demo');
						cb();
					});
				}else
				{
					cb();
				}
			});
		},
		function(cb)
		{
			console.log('saving demo state');
			saveInstanceState('Demo',{test:GUID()},function()
			{
				cb();
			});
		},
		function(cb)
		{
			console.log('delete demo');
			deleteInstance('Demo',function()
			{
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
			
			exports.getInstance = getInstance;
			exports.updateInstance = updateInstance;
			exports.createInstance = createInstance;
			exports.deleteInstance = deleteInstance;
			
			exports.getUsers = getUsers;
			exports.getInstances = getInstances;
			
			exports.searchUsers = searchUsers;
			exports.searchInstances = searchInstances;
			exports.saveInstanceState = saveInstanceState;
			
			exports.importStates = importStates;
			exports.purgeInstances = purgeInstances;
			exports.findState = findState;
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