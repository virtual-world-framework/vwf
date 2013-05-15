var root = '/adl/sandbox';

exports.index = function(req, res){

	res.locals = {root: root};
	res.render('index');
}
exports.create = function(req, res){


	res.locals = {root: root};
	res.render('create');
}
exports.signup = function(req, res){


	res.locals = {root: root};
	res.render('signup');
}
exports.login = function(req, res){


	res.locals = {root: root};
	res.render('login');
}
exports.logout = function(req, res){


	res.locals = {root: root};
	res.render('logout');
}
exports.edit = function(req, res){

	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root};
	res.render('editInstance');
}
exports.remove = function(req, res){


	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root};
	res.render('deleteInstance');
}
exports.user = function(req, res){


	res.locals = { sid: root + '/' + (req.query.id?req.query.id:'') + '/', root: root};
	res.render('userManagement');
}