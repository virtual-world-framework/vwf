var root = '/adl/sandbox',
fileList = [],
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

exports.index = function(req, res){

	res.locals = {root: root, title: ''};
	res.render('index');
}
exports.create = function(req, res){


	res.locals = {root: root, title:''};
	res.render('create');
}
exports.signup = function(req, res){


	res.locals = {root: root, title:''};
	res.render('signup');
}
exports.login = function(req, res){


	res.locals = {root: root, title:''};
	res.render('login');
}
exports.logout = function(req, res){


	res.locals = {root: root, title:''};
	res.render('logout');
}
exports.edit = function(req, res){

	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title:''};
	res.render('edit');
}
exports.remove = function(req, res){


	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: 'Warning!'};
	res.render('remove');
}
exports.user = function(req, res){


	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: 'Account'};
	res.render('user');
}
exports.admin = function(req, res){

	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: 'Admin', fileList: fileList};
	res.render('admin/admin');
}
exports.help = function(req, res){
	
	var currentIndex = fileList.indexOf(req.params.page);
	var displayPage = currentIndex >= 0 ? fileList[currentIndex] : 'index';
	
	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: '', script: displayPage + ".js"};
	res.render('help/template');
}

exports.handlePostRequest = function(req, res){
	
	fs.exists("public/adl/sandbox/views/create.html", function(exists){
		
		var currentIndex = fileList.indexOf(req.params.page);
		if(exists && currentIndex >= 0){
		
			console.log(fileList[currentIndex]);
			fs.writeFile('public/adl/sandbox/views/admin/'+fileList[currentIndex]+'.js', req.body.slice(req.body.indexOf("=")+1), function (err) {
			  if (err) throw err;
			  console.log('It\'s saved!');
			});
		}
		
		else console.log("Not there");
	});
	
	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: ''};
	res.render('help/template');
}







