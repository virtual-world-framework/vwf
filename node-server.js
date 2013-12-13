#!/usr/bin/env node

var server = require( './node_vwf' ),
    fs 	   = require( 'fs' ),
    cli    = require( './lib/nodejs/vwfCli.js' );

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

function printCreateHelp() {
	console.log("Usage: vwf create APP_PATH");
	console.log("");
	console.log("The `vwf create` command creates a new VWF application with a");
	console.log("default directory structure at the path you specified in APP_PATH.");
	console.log("");
	console.log("Example:");
	console.log("  vwf create ~/code/my-new-app");
}

if ( argv._[0] == 'create' && argv._.length == 1 ) {
	console.log("'create' requires a PATH to create the new VWF application.");
	console.log("");
	printCreateHelp();	
} else if ( argv._[0] == 'create' && argv._.length > 1 ) {
	var applicationPath = argv._[1];

	if ( cli.create( applicationPath ) ) {
		console.log("VWF application created at '" + applicationPath + "'.");
		console.log("");
		console.log("To get started quickly:");
		console.log("  $ cd " + applicationPath);
		console.log("  $ vwf");
		console.log("");
		console.log("See the Getting Started documentation at: ");
		console.log("http://www.virtual.wf/web/docs/readme.html");
	} else {
		console.log("VWF application could not be created at '" + applicationPath + "'");
	}
} else if ( argv.help || argv.h || ( argv._[0] == 'help' && argv._.length == 1 ) ) {
	printGeneralHelp();
} else if ( argv._[0] == 'help' && argv._[1] == 'create' ) {
	printCreateHelp();
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
} else if ( argv._[0] == 'run' || argv._.length == 0 ) {
	server.startVWF();
} else {
	console.log( "'" + argv._[0] + "' is not a VWF command. See 'vwf --help'." );
}
