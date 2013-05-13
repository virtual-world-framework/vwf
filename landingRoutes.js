var root = '/adl/sandbox';

exports.index = function(req, res){

	res.locals = { 'test' : 'Hey now.', root: root};
	res.render('index');
}
exports.create = function(req, res){


	res.locals = { 'test' : 'Hey now.', root: root};
	res.render('create');
}
exports.signup = function(req, res){


	res.locals = { 'test' : 'Hey now.', root: root};
	res.render('signup');
}
exports.login = function(req, res){


	res.locals = { 'test' : 'Hey now.', root: root};
	res.render('login');
}
exports.logout = function(req, res){


	res.locals = { 'test' : 'Hey now.', root: root};
	res.render('logout');
}