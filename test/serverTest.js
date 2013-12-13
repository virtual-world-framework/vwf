// To run: 
// npm install -g casperjs
// bundle exec thin start
// node node-server -a ./public/ -p 4000
// casperjs test test/serverTest.js

var servers = {"Ruby": 3000, "Node": 4000};
// var servers = {"Ruby": 3000}
// var servers = {"Node": 4000}

var loadsApplication = function(url) {
    casper.echo("Loading '" + url + "'", "INFO");
    casper.test.assertHttpStatus(200, 'Loads the application');
    casper.test.assertResourceExists('vwf.js', 'Loads the VWF framework');
}

var loadsComponent = function(url) {
    casper.echo("Loading '" + url + "'", "INFO");
    casper.test.assertHttpStatus(200, 'Loads the component');
    casper.test.assertResourceExists('vwf.js', 'Loads the VWF framework');
}

Object.keys(servers).forEach(function(server) {
    var port = servers[server];
    var serverAddress = 'http://localhost:' + port;

    casper.test.begin('Testing a VWF application with the ' + server + ' server', 31, function suite(test) {

        //--------------//
        // Applications //
        //--------------//

        casper.start(serverAddress + '/duck', function() {
            loadsApplication('/duck');
        });

        casper.thenOpen(serverAddress + '/duck/', function() {
            loadsApplication('/duck/');
        });

        casper.thenOpen(serverAddress + '/duck/0000000000000000', function() {
            loadsApplication('/duck/0000000000000000');
        });

        // TODO: Not sure why, but this test fails. Fails to load vwf.js.
        // casper.thenOpen(serverAddress + '/duck/0000000000000000/', loadsApplication);

        casper.thenOpen(serverAddress + '/duck/index.vwf', function() {
            loadsApplication('/duck/index.vwf');
        });

        casper.thenOpen(serverAddress + '/duck/index.vwf/', function() {
            loadsApplication('/duck/index.vwf/');
        });

        casper.thenOpen(serverAddress + '/duck/index.vwf/0000000000000000', function() {
            loadsApplication('/duck/index.vwf/0000000000000000');
        });

        // TODO: Not sure why, but this test fails. Fails to load vwf.js.
        // casper.thenOpen(serverAddress + '/duck/index.vwf/0000000000000000/', loadsApplication);

        //--------------//
        // Static Files //
        //--------------//

        casper.thenOpen(serverAddress + '/duck/images/duckCM.png', function(response) {
            casper.echo("Loading '/duck/images/duckCM.png'", 'INFO');
            test.assertHttpStatus(200, 'Retrieves a static file');
            test.assertMatch(response.headers.get('Content-Type'), /^image\/png/i, 'File is of type image/png')
        });

        casper.thenOpen(serverAddress + '/duck/0000000000000000/images/duckCM.png', function(response) {
            casper.echo("Loading '/duck/0000000000000000/images/duckCM.png'", 'INFO');
            test.assertHttpStatus(200, 'Retrieves a static file');
            test.assertMatch(response.headers.get('Content-Type'), /^image\/png/i, 'File is of type image/png')
        });

        casper.thenOpen(serverAddress + '/', function() {
            casper.echo("Loading '/'", 'INFO');
            test.assertHttpStatus(200, 'Retrieves static html page');
            test.assertTextExists("Virtual World Framework is minimally installed", 'Displays index.html');
        });

        //------//
        // 404s //
        //------//

        casper.thenOpen(serverAddress + '/this-is-not-an-app/', function() {
            casper.echo("Loading '/this-is-not-an-app/'", 'INFO');
            test.assertHttpStatus(404, 'Gets a 404 error');
            test.assertTextExists("Error 404", 'Displays the 404 page');
        });

        casper.thenOpen(serverAddress + '/some-file-that-does-not-exist.html', function() {
            casper.echo("Loading '/some-file-that-does-not-exist.html'", 'INFO');
            test.assertHttpStatus(404, 'Gets a 404 error');
            test.assertTextExists("Error 404", 'Displays the 404 page');
        });

        //--------//
        // Admins //
        //--------//

        casper.thenOpen(serverAddress + '/duck/admin/config', function() {
            casper.echo("Loading '/duck/admin/config'", 'INFO');
            test.assertHttpStatus(200, 'Retrieves the config file');
            test.assertTextExists("VWF Duck Application", 'Parses the config file');
        });

        casper.thenOpen(serverAddress + '/duck/', function() {
            casper.echo("Loading '/duck/'", 'INFO');
            test.assertTitle('VWF Duck Application', 'Sets the title from the config file');
        });

        //------------//
        // Components //
        //------------//

        casper.thenOpen(serverAddress + '/test/component.vwf', function() {
            loadsComponent('/test/component.vwf');
        });

        casper.thenOpen(serverAddress + '/test/component.vwf/', function() {
            loadsComponent('/test/component.vwf/');
        });

        casper.thenOpen(serverAddress + '/test/component.vwf/0000000000000000', function() {
            loadsComponent('/test/component.vwf/0000000000000000');
        });

        // TODO: Not sure why, but this test fails. Fails to load vwf.js.
        // casper.thenOpen(serverAddress + '/test/component.vwf/0000000000000000/', loadsComponent);

        casper.run(function() {
            casper.echo('Finished testing the ' + server + ' server.\n', "INFO");
            test.done();
        });
    });
});

