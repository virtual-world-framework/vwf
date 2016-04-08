// A null authentication method. See `authentication/*` for concrete examples.
// 
// This method does not require a login for any route and does not declare a VWF `client.vwf`
// descriptor to describe the user to the VWF application.

module.exports = function( req, res, next ) {
  next();
}
