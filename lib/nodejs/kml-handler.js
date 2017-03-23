// kml-handler.js
//  This file handles the sending/receiving of KML files between applications


var net = require( "net" ),
  fs = require( "fs" ),
  formidable = require( "formidable" ),
  util = require('util');



function sendKML ( req, res, next ) {
  var form = new formidable.IncomingForm();
  form.keepExtensions = true;
  // parse the file and then send response
  form.parse( req, function( err, fields, files ) {
    if ( !err ) {
      var client = new net.Socket();
      client.on( 'error', function( err ) {
        console.log( err );
      } );
      //connect to the host:port
      client.connect(fields[ 'port' ], fields[ 'host' ], function() {
        //send a file to the server
        var fileStream = fs.createReadStream( files[ 'file' ].path );
        fileStream.on('error', function( err ){
          console.log( "Error on file stream: " + err );
        } );

        fileStream.on( 'open',function() {
          fileStream.pipe( client );
        } );
        res.writeHead( 200, {'content-type': 'text/plain'} );
        res.end();
      } );
    } else {
      console.log("Error parsing file: " + err);
      res.writeHead(500);
      res.end();
    }
  });
}

exports.sendKML = sendKML;