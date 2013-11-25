// To run: casperjs test test/duckTesting.js

casper.test.begin('Google search retrieves 10 or more results', 1, function suite(test) {
    casper.start("http://virtual.wf/duck/", function() {
        test.assertTitle("VWF Duck Application", "accesses the duck application successfully");
    });

    // casper.then(function() {
    //     test.assertTitle("casperjs - Recherche Google", "google title is ok");
    //     test.assertUrlMatch(/q=casperjs/, "search term has been submitted");
    //     test.assertEval(function() {
    //         return __utils__.findAll("h3.r").length >= 10;
    //     }, "google search for \"casperjs\" retrieves 10 or more results");
    // });

    casper.run(function() {
        test.done();
    });
});