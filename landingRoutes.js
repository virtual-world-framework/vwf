var root = '/adl/sandbox',
fileList = [],
routesMap = {},
DAL = {},
fs = require('fs');
var async = require('async');
fs.readdir('./public' + root + '/views/help', function(err, files){
	var tempArr = [];
	
	for(var i = 0; i < files.length; i++){
		tempArr = files[i].split('.');
		if(tempArr[1] == 'js'){
			fileList.push(tempArr[0].toLowerCase());
		}
	}
});

exports.setDAL = function(d){
	DAL = d;
};

exports.acceptedRoutes = ['sandbox','index','create', 'signup', 'login','logout','edit','remove','user', 'admin', 'admin/users', 'admin/worlds', 'admin/edit'];
routesMap = {
	'sandbox': {template:'index'},
	'edit': {sid: true},
	'remove': {sid:true, title: 'Warning!'},
	'user': {sid:true, title: 'Account'},
	'admin': {sid:true, title:'Admin', fileList: fileList, template: 'admin/admin'},
	'admin/edit': {fileList: fileList}
};

exports.generalHandler = function(req, res, next){

	if(!req.params.page)
		req.params.page = 'sandbox';
		
	var routeIndex = exports.acceptedRoutes.indexOf(req.params.page);

	if(routeIndex >= 0){
		
		var currentAcceptedRoute = exports.acceptedRoutes[routeIndex], title = '', sid = '', template = currentAcceptedRoute, fileList = [];
		if(routesMap[currentAcceptedRoute]){
			
			title = routesMap[currentAcceptedRoute].title ? routesMap[currentAcceptedRoute].title : '';
			sid = routesMap[currentAcceptedRoute].sid ?  root + '/' + (req.query.id?req.query.id:'') + '/' : '';
			template = routesMap[currentAcceptedRoute].template ? routesMap[currentAcceptedRoute].template : currentAcceptedRoute;
			fileList = routesMap[currentAcceptedRoute].fileList ? routesMap[currentAcceptedRoute].fileList : [];	
		}
		
		res.locals = {sid: sid, root: root, title: title, fileList:fileList};
		res.render(template);
	}
	
	else{
		console.log("Not found");
		//res.status(404).end('Error');
		
		next();
	}
};

exports.help = function(req, res){
	
	var currentIndex = fileList.indexOf(req.params.page);
	var displayPage = currentIndex >= 0 ? fileList[currentIndex] : 'index';
	
	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: '', script: displayPage + ".js"};
	res.render('help/template');
};

exports.handlePostRequest = function(req, res, next){
	
	var data = req.body ? JSON.parse(req.body) : '';
	
	switch(req.params.action){
		case "delete_users":
			var cbNum = 0;
			console.log(data);
			
			async.eachSeries(data,function(val,cb)
			{
				DAL.deleteUser(val,function(){		
					cb();
				});	
			},
			function()
			{
				res.end("" + cbNum);
			});
			
			for(var i = 0; i < data.length; i++){
				console.log(data[i]);
				
			}
		break;	
		
		case "get_users":
			DAL.getUsers(function(users){

				var cbNum = 0;
				for(var i = 0; i < users.length; i++){
					DAL.getUser(users[i],function(doc){
						cbNum++;
						
						if(cbNum == users.length){
							res.end(JSON.stringify(users));
						}
					});
				}
			});
			break;
		
		default: 
			next();
			break;
	}
};



















