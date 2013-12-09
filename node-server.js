#!/usr/bin/env node

var server = require( './node_vwf' ),
    fs 	   = require( 'fs' );

var argv = require( 'optimist' ).argv;

if ( argv._.indexOf( 'create' ) == 0 ) {
	console.log( "Creating a new application" );
} else if ( argv.help || argv.h ) {

	console.log("Usage: vwf [--help] <command> [<args>]");
	console.log("");
	console.log("With no arguments, 'vwf' runs the project in the current");
	console.log("directory in local development mode.");
	console.log("");
	console.log("Use 'vwf create <name>' to create a new VWF project.");
	console.log("");
	console.log("Commands:");
	// console.log("  -V, --version            output the version number");
	console.log("  run                      [default] Start the VWF server");
	console.log("  create                   Create a new VWF application");
	console.log("");
	console.log("Options:");
	// console.log("  -V, --version            output the version number");
	console.log("  -a, --applicationPath    Path to VWF application. Default: current directory.");
	console.log("  -p                       Port to start server on. Default: 3000");
	console.log("  -l                       Log level for server. Default: 1");
	console.log("  -h, --help               Output usage information");
	console.log("");
	console.log("");

} else if ( argv._.length == 0 ) {
	server.startVWF();
} else {
	console.log( "'" + argv._[0] + "' is not a VWF command. See 'vwf --help'." );
}
