var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
	sio = require('socket.io'),
	YAML = require('js-yaml');
	SandboxAPI = require('./sandboxAPI');

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
	
function StartShellInterface()
{
//shell interface defaults
	global.log('Starting shell interface',0);
	var stdin = process.openStdin();
	stdin.on('data', function(chunk) {
		if(!chunk) return;
		
		if(!global.instances)
					return;
					
		chunk = chunk + '  ';
		chunk = chunk.replace(/\r\n/g,'');
		var commands = chunk.split( ' ');
		
		if(commands[0] && commands[0] == 'show' && commands[1])
		{
			if(commands[1] == 'instances')
			{
				var keys = Object.keys(global.instances);
				for(var i in keys)
					global.log(keys[i],0);
				
			}
			if(commands[1] == 'clients')
			{
				for(var i in global.instances)
				{
					var keys = Object.keys(global.instances[i].clients);
					for(var j in keys)
					   global.log(keys[j],0);
				}
			}
			if(commands[1] == 'users')
			{
				for(var i in global.instances)
				{
					var keys = Object.keys(global.instances[i].clients);
					for(var j in keys)
					{
					   var client = global.instances[i].clients[keys[j]];
					   if(client && client.loginData)
					   {
						  global.log(client.loginData.UID,0);
					   }
					}
				}
			}
		}
		if(commands[0] && commands[0] == 'boot' && commands[1])
		{
			var name = commands[1];
			
				for(var i in global.instances)
				{
					//shuting down whole instance
					if(i == name)
					{
						var keys = Object.keys(global.instances[i].clients);
						for(var j in keys)
						{
						   var client = global.instances[i].clients[keys[j]];
						   client.disconnect();
						}
					}
					else
					{
						//find either the client or the user and boot them from all instances
						var keys = Object.keys(global.instances[i].clients);
						for(var j in keys)
						{
						   var client = global.instances[i].clients[keys[j]];
						   if(keys[j] == name)
						   {
							   client.disconnect();
						   }
						   if(client && client.loginData)
						   {
							  if(client.loginData.UID == name)
								   client.disconnect();
						   }
						}
					}
				}
			
		}
		if(commands[0] && commands[0] == 'loglevel' && commands[1])
		{
			global.logLevel = parseInt(commands[1]);	
		}
		if(commands[0] && commands[0] == 'loglevel' && !commands[1])
		{
			console.log(global.logLevel,0);
		}
		
		
		
		
		if(commands[0] && commands[0] == 'test' && commands[1] && commands[1] == 'login' && commands[2] && commands[3] && parseInt(commands[3]))
		{
			var name = commands[2];
			
				for(var i in global.instances)
				{
					//shuting down whole instance
					if(i == name)
					{
						var keys = Object.keys(global.instances[i].clients);
						for(var k =0; k < parseInt(commands[3]); k++)
						{
							for(var j in keys)
							{
								var client = global.instances[i].clients[keys[j]];
								client.emit('message',{"time":global.instances[i].time,"node":"index-vwf","action":"createChild","member":GUID(),"parameters":[{"extends":"NPCcharacter.vwf","source":"usmale.dae","type":"model/vnd.collada+xml","properties":{"activeCycle":"","motionStack":[],"rotZ":Math.random() * 180,"PlayerNumber":GUID(),"owner":GUID(),"ownerClientID":GUID(),"profile":{"Username":GUID(),"Name":"Robert Chadwick","Age":"32","Birthday":"","Password":"","Relationship":"Married","City":"Mclean","State":"VA","Homepage":"","Employer":"ADL","Title":"","Height":"","Weight":"","Nationality":"","Avatar":"usmale.dae"},"translation":[Math.random() * 100-50,Math.random()*100 -50,0.01]},"events":{"ShowProfile":null,"Message":null},"scripts":[
								"this.ShowProfile = "+
								"function(){ "+
								"	if(vwf.client() != vwf.moniker()) return; "+
								"   _UserManager.showProfile(_DataManager.GetProfileForUser(this.PlayerNumber))     "+
								" }; \n"+
								"this.Message = function(){"+
								"	if(vwf.client() != vwf.moniker()) return; "+
								"	setupPmWindow(this.PlayerNumber)     "+
								"}"
								]}],"client":GUID()});
							}
						}
					}
				}
		}	
	});
	
}
	
exports.StartShellInterface = StartShellInterface;