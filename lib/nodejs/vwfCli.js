var fs   = require( 'fs-extra' ),
    path = require( 'path' );

var create = function( applicationPath ) {
	if ( fs.existsSync ( applicationPath ) ) {
		return false;
	}

	fs.mkdirpSync( applicationPath );

	fs.copySync( path.join( global.vwfRoot, 'support/cli/sample_app/' ), applicationPath );

	return true;
}

module.exports.create = create;