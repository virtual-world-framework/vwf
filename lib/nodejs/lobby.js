var app = module.exports = require( "express" )();

var bodyParser = require( "body-parser" ),
  cookieParser = require( "cookie-parser" );

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.text() );
app.use( cookieParser() );
