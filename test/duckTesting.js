// To run: casperjs test test/duckTesting.js

casper.test.begin('Tests the duck application', 1, function suite(test) {
    casper.start("http://localhost:3000/duck/", function() {
        test.assertTitle("VWF Duck Application", "accesses the duck application successfully");
    });

    casper.run(function() {
        test.done();
    });
});

casper.test.begin('Tests the duck application config file', 1, function suite(test) {
    casper.start("http://localhost:3000/duck/admin/config", function() {
        test.assertHttpStatus(200, "fetches the config file");
    });

    casper.run(function() {
        test.done();
    });
});