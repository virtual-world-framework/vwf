var root = '/adl/sandbox';

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
	res.render('editInstance');
}
exports.remove = function(req, res){


	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: 'Warning!'};
	res.render('deleteInstance');
}
exports.user = function(req, res){


	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: 'Account'};
	res.render('userManagement');
}
exports.help = function(req, res){
	
	var acceptedPages = ['index', 'modifiers', 'feedback', 'toolwindows', 'primitiveobjects', 'cameramodes', 'maintoolbarbuttons'];
	
	var currentIndex = acceptedPages.indexOf(req.params.page);
	var displayPage = currentIndex >= 0 ? acceptedPages[currentIndex] : acceptedPages[0];
	
	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root, title: ''};
	res.render('help/'+displayPage+'.html');
}







