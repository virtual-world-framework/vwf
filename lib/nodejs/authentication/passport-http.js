// Example authentication module implemented with Passport and HTTP Basic authentication.
// 
// A valid login is required for all routes, but any username and password are accepted. Hooks for
// querying a user database are shown. A VWF `client.vwf` descriptor is published to the session to
// describe the user in the VWF application.
// 
// Add the NPM modules `passport` and `passport-http` to support this method.

var passport = require( "passport" ),
  passportHTTP = require( "passport-http" );

// Create and attach the Passport strategy object.

var strategy = new passportHTTP.BasicStrategy( function( username, password, done ) {

  // Given `username` and `password` from a login form, look up the user in a local database.

  var user = { username: username };

  // Return the result. For successful logins, return the user object. The user object will be
  // attached to the request at `req.user`.
  // 
  // For login errors, return `false` for `user` and provide an error message. If an error occurs
  // while performing the lookup, return the error object.

  if ( false /* lookup error */ ) {
    return done( {} /* err */ );
  } else if ( false /* bad user */ ) {
    return done( null, false, { message: 'Incorrect username' } );
  } else if ( false /* bad password */ ) {
    return done( null, false, { message: 'Incorrect password' } );
  } else {
    return done( null, user );
  }

} );

passport.use( strategy );

// Convert the user object to a reference to be stored in the session. Without a user database, this
// can be the user object. With a local user database, it should be the user id in the database.
// 
// Also attach a VWF `client.vwf` descriptor to the session to describe the user for the VWF
// application.

passport.serializeUser( function( req, user, done ) {
  req.session.vwf = req.session.vwf || {};
  req.session.vwf.client = { properties: { username: user.username } };
  done( null, user );
} );

// Convert a user reference in the session to a user object. Without a user database, the session
// data is the user object. With a local user database, look up the user from an id in the session.

passport.deserializeUser( function( req, id, done ) {
  done( null, id );
} );

// Export the Passport initializer, `session` module, and HTTP Basic strategy module.

module.exports = [
  passport.initialize(),
  passport.authenticate( "session" ),
  passport.authenticate( "basic" ),
];
