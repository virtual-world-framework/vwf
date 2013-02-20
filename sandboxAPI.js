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
function ServeJSON(jsonobject,response,URL)
{
		    
			response.writeHead(200, {
				"Content-Type": "text/json"
			});
			response.write(JSON.stringify(jsonobject), "utf8");
			response.end();
			
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
				ServeFile(basedir+"profiles\\" + UID,response,URL,'GetProfileResult');		
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
					SaveFile(basedir+"profiles\\"+UID,body,response);
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