#!/usr/bin/env node

var server = require( './node_vwf' ),
    fs 	   = require( 'fs' );

var argv = require( 'optimist' ).argv;

function printGeneralHelp() {
	console.log("Usage: vwf [--help] <command> [<args>]");
	console.log("");
	console.log("With no arguments, 'vwf' runs the application in the current");
	console.log("directory in local development mode.");
	console.log("");
	console.log("Use 'vwf create <name>' to create a new VWF project.");
	console.log("");
	console.log("Commands:");
	console.log("  run                      [default] Start the VWF server");
	console.log("  create                   Create a new VWF application");
	console.log("");
	console.log("Options:");
	console.log("  -a, --applicationPath    Path to VWF application. Default: current directory.");
	console.log("  -p                       Port to start server on. Default: 3000");
	console.log("  -l                       Log level for server. Default: 1");
	console.log("  -h, --help               Output usage information");
}

if ( argv._.indexOf( 'create' ) == 0 ) {
	console.log( "Creating a new application" );
} else if ( argv.help || argv.h || ( argv._[0] == 'help' && argv._.length == 1 ) ) {
	printGeneralHelp();
} else if ( argv._[0] == 'help' && argv._[1] == 'create' ) {
	console.log("Usage: vwf create APP_PATH");
	console.log("");
	console.log("The `vwf create` command creates a new VWF application with a");
	console.log("default directory structure at the path you specified in APP_PATH.");
	console.log("");
	console.log("Example:");
	console.log("  vwf create ~/code/my-new-app");
} else if ( argv._[0] == 'help' && argv._[1] == 'run' ) {
	console.log("Usage:");
	console.log("  vwf [options]");
	console.log("  vwf [options] run");
	console.log("");
	console.log("The `vwf run` command runs the application in the current directory");
	console.log("in local development mode.");
	console.log("");
	console.log("Example:");
	console.log("  vwf run -a ~/code/my-new-app -p 5000");
	console.log("");
	console.log("Options:");
	console.log("  -a, --applicationPath    Path to VWF application. Default: current directory.");
	console.log("  -p                       Port to start server on. Default: 3000");
	console.log("  -l                       Log level for server. Default: 1");
	console.log("  -h, --help               Output usage information");
} else if ( argv._[0] == 'help' ) {
	console.log("VWF can't find help on that command.");
	console.log("");
	printGeneralHelp();
} else if ( argv._.length == 0 ) {
	server.startVWF();
} else {
	console.log( "'" + argv._[0] + "' is not a VWF command. See 'vwf --help'." );
}
