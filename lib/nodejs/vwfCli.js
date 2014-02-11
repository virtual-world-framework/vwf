var fs   = require( 'fs-extra' ),
    path = require( 'path' );

var create = function( applicationPath ) {
	if ( fs.existsSync ( applicationPath ) ) {
		return false;
	}

	fs.mkdirpSync( applicationPath );

        var home = ( process.env.HOME || process.env.USERPROFILE );
        var vwfHome = path.join( home, ".vwf" );
     
        if ( fs.existsSync( path.join( process.cwd(), "support/cli/sample_app/" ) ) ) {
            fs.copySync( path.join( process.cwd(), "support/cli/sample_app/" ), applicationPath );
        } else if ( fs.existsSync( path.join( vwfHome, "support/cli/sample_app/" ) ) ) {
            fs.copySync( path.join( vwfHome, "support/cli/sample_app/" ), applicationPath );
        } else if ( process.env.VWF_DIR && fs.existsSync( path.join( process.env.VWF_DIR, "support/cli/sample_app/" ) ) ) {
            fs.copySync( path.join( process.env.VWF_DIR, "support/cli/sample_app/" ), applicationPath );
        } else {
            consoleError( "Could not find VWF support files." );
            return false;
        }

	return true;
}

module.exports.create = create;
