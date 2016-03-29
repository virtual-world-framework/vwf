var passport = require( "passport" ),
  passportHTTP = require( "passport-http" );

var strategy = new passportHTTP.BasicStrategy( function( username, password, done ) {
  return done( null, { username: username } );
} );

passport.use( strategy );

passport.serializeUser( function( req, user, done ) {
  req.session.vwf = req.session.vwf || {};
  req.session.vwf.client = { properties: { username: user.username } };
  done( null, user );
} );

passport.deserializeUser( function( req, id, done ) {
  done( null, id );
} );

module.exports = [
  passport.initialize(),
  passport.authenticate( "session" ),
  passport.authenticate( "basic" ),
];
