var assert = require( 'assert' ),
	fs     = require( 'fs-extra' ),
	should = require( 'should' );

var vwfCli = require('../lib/nodejs/vwfCli.js');

describe( 'VWF CLI', function() {
    describe( '#createApplication( path )', function() {
    	beforeEach( cleanUpTestDirectories );
    	afterEach( cleanUpTestDirectories );

	    it( 'creates a new folder in the current directory', function() {
	    	vwfCli.create( 'some-app-name' );
	    	fs.existsSync( './some-app-name' ).should.be.true;
	    });

	    it( 'creates a new folder at a user-specified path', function() {
	    	vwfCli.create( 'test/test-apps/my-test-app' );
	    	fs.existsSync( './test/test-apps/my-test-app' ).should.be.true;
	    });

	    it( 'returns true if create is successful', function() {
	    	vwfCli.create( 'test/test-apps/my-test-app' ).should.be.true;
	    });

	    it( 'copies the default application files', function() {
	    	vwfCli.create( 'test/test-apps/my-test-app' );
	    	fs.existsSync( './test/test-apps/my-test-app/index.vwf.yaml' ).should.be.true;
	    });

	    it( 'does not create a new application when directory already exists', function() {
	    	fs.mkdirpSync( './test/test-apps/an-existing-app' );
	    	vwfCli.create( 'test/test-apps/an-existing-app' ).should.be.false;
	    	fs.existsSync( './test/test-apps/an-existing-app/index.vwf.yaml' ).should.be.false;
	    });
    });
});

function cleanUpTestDirectories() {
	if ( fs.existsSync( 'some-app-name' ) ) {
		fs.removeSync( 'some-app-name' );
	}
	if ( fs.existsSync( 'test/test-apps' ) ) {
		fs.removeSync( 'test/test-apps' );
	}
}