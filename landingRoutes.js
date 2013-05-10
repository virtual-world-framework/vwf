

exports.index = function(req, res){


	res.locals = { 'test' : 'Hey now.'};
	res.render('index');

	console.log("Test!!");
}
exports.create = function(req, res){


	res.locals = { 'test' : 'Hey now.'};
	res.render('create');

	console.log("Test!!");
}
exports.signup = function(req, res){


	res.locals = { 'test' : 'Hey now.'};
	res.render('signup');

	console.log("Test!!");
}
exports.login = function(req, res){


	res.locals = { 'test' : 'Hey now.'};
	res.render('login');

	console.log("Test!!");
}
exports.logout = function(req, res){


	res.locals = { 'test' : 'Hey now.'};
	res.render('logout');

	console.log("Test!!");
}