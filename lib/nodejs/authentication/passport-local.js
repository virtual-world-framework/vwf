var passport = require( "passport" ),
  passportLocal = require( "passport-local" );

var strategy = new passportLocal( function( username, password, done ) {
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

var router = require( "express" ).Router();

router.use( passport.initialize() );
router.use( passport.authenticate( "session" ) );

router.get( "/login", function( req, res ) {
  res.send(
    "<form method='post'>" +
      "<p>" + ( ( res.locals.flash.shift() || {} ).message || "" ) + "</p>" +
      "<label>Username <input type='text' name='username'></label>" + "<br>" +
      "<label>Password <input type='password' name='password'></label>" + "<br>" +
      "<button type='submit'>Login</button>" +
    "</form>"
  );
} );

router.post( "/login", passport.authenticate( "local", {
  successReturnToOrRedirect: /* req.baseUrl + */ "/",
  failureRedirect: /* req.baseUrl + */ "/login",
  failureFlash: true,
} ) );

router.get( "/logout", function( req, res ) {
  res.send(
    "<form method='post'>" +
      "<button type='submit'>Logout</button>" +
    "</form>"
  );
} );

router.post( "/logout", function( req, res ) {
  req.logout();
  req.session.vwf && delete req.session.vwf.client;
  res.redirect( req.baseUrl + "/login" );
} );

router.use( function( req, res, next ) {
  if ( req.isUnauthenticated() ) {
    res.redirect( req.baseUrl + "/login" );
    res.session.returnTo = req.baseUrl + req.url;
  } else {
    next();
  }
} );

module.exports = router;
