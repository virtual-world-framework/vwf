var app = module.exports = require( "express" )();

var bodyParser = require( "body-parser" ),
  cookieParser = require( "cookie-parser" ),
  cookieSession = require( "cookie-session" ),
  crypto = require( "crypto" );

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.text() );
app.use( cookieParser() );
app.use( cookieSession( { secret: crypto.randomBytes( 32 ).toString( "hex" ) } ) );
