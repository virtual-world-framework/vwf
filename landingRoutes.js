var root = '/adl/sandbox',
fileList = [],
routesMap = {},
fs = require('fs');

fs.readdir('./public' + root + '/views/help', function(err, files){
	var tempArr = [];
	
	for(var i = 0; i < files.length; i++){
		tempArr = files[i].split('.');
		if(tempArr[1] == 'js'){
			fileList.push(tempArr[0].toLowerCase());
		}
	}
});

exports.acceptedRoutes = ['sandbox','index','create', 'signup', 'login','logout','edit','remove','user', 'admin', 'admin/users', 'admin/worlds', 'admin/edit'];
routesMap = {
	'sandbox': {template:'index'},
	'edit': {sid: true},
	'remove': {sid:true, title: 'Warning!'},
	'user': {sid:true, title: 'Account'},
	'admin': {sid:true, title:'Admin', fileList: fileList, template: 'admin/admin'},
	'admin/edit': {fileList: fileList}
};

exports.generalHandler = function(req, res){

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
		res.status(404).end('Error');
	}
}

exports.help = function(req, res){
	
	var currentIndex = fileList.indexOf(req.params.page);
	var displayPage = currentIndex >= 0 ? fileList[currentIndex] : 'index';
	
	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: '', script: displayPage + ".js"};
	res.render('help/template');
}

exports.handlePostRequest = function(req, res){
	
	var currentIndex = fileList.indexOf(req.params.page);
	fs.exists('public/adl/sandbox/views/help/'+fileList[currentIndex]+'.js', function(exists){
		//Disables file editing
		return;
		
		if(exists && currentIndex >= 0){
		
			console.log(fileList[currentIndex]);
			fs.writeFile('public/adl/sandbox/views/help/'+fileList[currentIndex]+'.js', req.body.slice(req.body.indexOf("=")+1), function (err) {
			  if (err) throw err;
			  console.log('It\'s saved!');
			});
		}
		
		else console.log("Not there");
	});
	
	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: ''};
	res.render('help/template');
}
