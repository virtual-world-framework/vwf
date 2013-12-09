var assert = require('assert');
var vwfCli = require('../lib/nodejs/vwfCli.js');

describe( 'VWF CLI', function() {
  describe( '#createApplication( path )', function() {
    it( 'creates a new folder', function() {
    	vwfCli('something');
    });

    it( 'creates a new folder at a user-specified path' );
    it( 'copies the default application files' );
    it( 'does not create a new folder when one exists already' );
  });
});
