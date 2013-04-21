var nStore = require('nstore');
nStore = nStore.extend(require('nstore/query')());

var async = require('async');

var datapath = '';

var DBTablePath = '\\users.db';

var DB = '';

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
						cb(true);
					});
				});
			});
		}
	});
};
function deleteInstance (id,cb)
{
	DB.remove(id,function(err,doc,key)
	{
		cb();
	});
};
			
function getUsers (cb)
{
	DB.get('UserIndex',function(err,UserIndex,key)
	{
		cb(UserIndex);
	});
	
};
function getInstances (cb)
{
	DB.get('StateIndex',function(err,stateIndex,key)
	{
		cb(stateIndex);
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
				global.log('Demo is:');
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