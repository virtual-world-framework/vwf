var app = module.exports = require( "express" )();

var bodyParser = require( "body-parser" ),
  cookieParser = require( "cookie-parser" ),
  cookieSession = require( "cookie-session" ),
  crypto = require( "crypto" ),
  config = require( "config" ),
  flash = require( "flash" ),
  express = require( "express" );

var authentication = require( "./authentication" ),
  manifest = require( "./manifest" );

app.locals._ = require( "lodash" );

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

app.use( function( req, res, next ) {
  res.locals.user = req.isAuthenticated() ? req.user : undefined;
  next();
} );

app.get( "/", function( req, res ) {
  manifest().then( function( manifest ) {
    res.render( "index", { manifest: manifest || {} } );
  } );
} );

function sessionSecret() {
  return config.get( "session.secret" ) ||
    crypto.randomBytes( 32 ).toString( "hex" );
}
