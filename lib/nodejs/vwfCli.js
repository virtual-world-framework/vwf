var fs = require( 'fs-extra' );

var create = function( applicationPath ) {
	if ( fs.existsSync ( applicationPath ) ) {
		return false;
	}

	fs.mkdirpSync( applicationPath );

	fs.copySync( 'support/cli/sample_app/', applicationPath );

	return true;
}

module.exports.create = create;
