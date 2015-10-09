var app = module.exports = require( "express" )();

var bodyParser = require( "body-parser" ),
  cookieParser = require( "cookie-parser" ),
  cookieSession = require( "cookie-session" ),
  crypto = require( "crypto" ),
  config = require( "config" ),
  flash = require( "flash" ),
  authentication = require( "./authentication" ),
  express = require( "express" );

app.set( "view engine", "jade" );

app.use( bodyParser.json() );
app.use( bodyParser.urlencoded( { extended: false } ) );
app.use( bodyParser.text() );
app.use( cookieParser() );
app.use( cookieSession( { secret: sessionSecret() } ) );
app.use( flash() );
app.use( "/bootstrap", express.static( "node_modules/bootstrap/dist" ) );
app.use( "/jquery", express.static( "node_modules/jquery/dist" ) );
app.use( authentication );

function sessionSecret() {
  return config.get( "session.secret" ) ||
    crypto.randomBytes( 32 ).toString( "hex" );
}
