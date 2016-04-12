// Example authentication module implemented with Passport and login forms.
// 
// A valid login is required for all routes, but any username and password are accepted. Hooks for
// querying a user database are shown. A VWF `client.vwf` descriptor is published to the session to
// describe the user in the VWF application.
// 
// Add the NPM modules `passport` and `passport-local` to support this method.

var passport = require( "passport" ),
  passportLocal = require( "passport-local" );

// Create and attach the Passport strategy object.

var strategy = new passportLocal( function( username, password, done ) {

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

// Create a router to contain the Passport middleware and login/logout routes.

var router = require( "express" ).Router();

// Passport and the Passport `session` module.

router.use( passport.initialize() );
router.use( passport.authenticate( "session" ) );

// Show a login form at `/login`.

router.get( "/login", function( req, res ) {
  res.render( "login" );
} );

// Receive a login request and attempt to authenticate.
// 
// The URLs would need the base URL prepended if the application is not mounted at `/`. Since the
// authentication middleware is created outside the request, we don't have access to `baseUrl` to
// do this.

router.post( "/login", passport.authenticate( "local", {
  successReturnToOrRedirect: /* req.baseUrl + */ "/",
  failureRedirect: /* req.baseUrl + */ "/login",
  failureFlash: true,
} ) );

// Receive a logout request and log out. Also remove the VWF `client.vwf` descriptor from the
// session.

router.post( "/logout", function( req, res ) {
  req.logout();
  req.session.vwf && delete req.session.vwf.client;
  res.redirect( req.baseUrl + "/login" );
} );

// Enforce authentication rules. This implementation requires a valid login for all routes except
// for `/login` and `/logout`.

router.use( function( req, res, next ) {
  if ( req.isUnauthenticated() ) {
    res.redirect( req.baseUrl + "/login" );
    res.session.returnTo = req.baseUrl + req.url;
  } else {
    next();
  }
} );

// Export the router.

module.exports = router;
