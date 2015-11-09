var http = require( "http" ),
  rp = require( "request-promise" ),
  Promise = require( "bluebird" ),
  glob = Promise.promisifyAll( require( "glob" ) ),
  _ = require( "lodash" );

/// Return a promise for the list of applications available to launch, instances to connect to, and
/// documents to load.

function manifest() {
  return a().then( d ).then( i );
}

/// {
///   "/path/to/application.vwf": {},
///   "/path/to/another/application.vwf": {},
///   ...
/// }

function a() {

  var applications = {};

  return glob.globAsync( "public/**/*.vwf.@(json|yaml)" ).map( function( path ) {

    var application = path.replace( /^public/, "" ).replace( /\.(json|yaml)$/, "" );
    applications[ application ] = applications[ application ] || {};

  } ).then( function() {

    return applications;

  } );

}

/// {
///   "/path/to/application.vwf": {
///     name: {
///       application:
///         application,
///       scenario: {
///         document: { uri, timestamp },
///         instance,
///         state: { title },
///       },
///       sessions: [
///         {
///           document: { uri, timestamp },
///           instance,
///           state: { classroom: { company, platoon, unit } },
///         },
///         ...
///       ],
///     },
///     ...
///   },
///   ...
/// }

function d( applications ) {

  return glob.globAsync( "documents/**/saveState?(_+([0-9])).vwf.json" ).map( function( path ) {

    var match = path.match( RegExp( "documents/(.+)/([^/]+)/saveState(?:_([0-9]+))?.vwf.json" ) );

    if ( match ) {

      var application = "/" + match[1] + "/index.vwf";
      var name = match[2];
      var revision = match[3];

      if ( applications[ application ] && ! revision ) {
        applications[ application ][ name ] = {
          application:
            application,
          scenario: {
            document: {
              uri: application + "/0123456789ABCDEF/load/" + name + "/",
              timestamp: +new Date( "2015-01-01T03:00:00-0500" ) },
            state: {
              title: name },
          },
          sessions: [ {
            document: {
              uri: application + "/0123456789ABCDEF/load/" + name + "-notarealsession" + "/",
              timestamp: +new Date( "2015-02-01T00:00:00-0500" ) },
            state: {
              classroom: { company: "Company", platoon: "1", unit: "1" },
            }
          } ],
        };
      }

    }

  } ).then( function() {

    return applications;

  } );

}

/// {
///   "/path/to/application.vwf": {
///     name: {
///       application:
///         application,
///       scenario: {
///         document: { uri, timestamp },
///         instance,
///         state: { title },
///       },
///       sessions: [
///         {
///           document: { uri, timestamp },
///           instance,
///           state: { classroom: { company, platoon, unit } },
///         },
///         ...
///       ],
///     },
///     ...
///   },
///   ...
/// }

function i( applications ) {

  return Promise.map( Object.keys( applications ), function( application ) {

    var options = {
      url: "http://localhost:3000/" + application + "/admin/instances",
      json: true,
      proxy: null,
    };

    return rp( options ).then( function( instances ) {
      Object.keys( instances ).forEach( function( instance ) {
        applications[ application ][ application ] = {
          application:
            application,
          scenario: {
            instance: instance,
            state: { title: application },
          },
        };
      } );
    } );

  } ).then( function() {

    return applications;

  } );

}

/// Return a sample list of applications available to launch, instances to connect to, and documents
/// to load.

function sample() {

  return {

    "/TDG/index.vwf": {

      "scenario-with-document-without-instance": {
        application:
          "/TDG/index.vwf",
        scenario: {
          document: {
            uri: "/TDG/load/scenario-with-document-without-instance",
            timestamp: +new Date( "2015-01-01T01:00:00-0500" ) },
          state: {
            title: "Scenario with document without instance" },
        },
      },

      "scenario-without-document-with-instance": {
        application:
          "/TDG/index.vwf",
        scenario: {
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            title: "Scenario without document with instance" },
        },
      },

      "scenario-with-document-with-instance": {
        application:
          "/TDG/index.vwf",
        scenario: {
          document: {
            uri: "/TDG/load/scenario-with-document-with-instance",
            timestamp: +new Date( "2015-01-01T03:00:00-0500" ) },
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            title: "Scenario with document with instance" },
        },
      },

      "scenario-without-sessions": {
        application:
          "/TDG/index.vwf",
        scenario: {
          document: {
            uri: "/TDG/load/scenario-without-sessions",
            timestamp: +new Date( "2015-01-01T04:00:00-0500" ) },
          state: {
            title: "Scenario without sessions" },
        },
      },

      "scenario-with-session-with-document-without-instance": {
        application:
          "/TDG/index.vwf",
        scenario: {
          document: {
            uri: "/TDG/load/scenario-with-session-with-document-without-instance",
            timestamp: +new Date( "2015-01-01T05:00:00-0500" ) },
          state: {
            title: "Scenario with session with document without instance" },
        },
        sessions: [ {
          document: {
            uri: "/TDG/load/scenario-with-session-with-document-without-instance+session1",
            timestamp: +new Date( "2015-02-01T00:00:00-0500" ) },
          state: {
            classroom: { company: "Company", platoon: "1", unit: "1" },
          }
        } ]
      },

      "scenario-with-session-without-document-with-instance": {
        application:
          "/TDG/index.vwf",
        scenario: {
          document: {
            uri: "/TDG/load/scenario-with-session-without-document-with-instance",
            timestamp: +new Date( "2015-01-01T06:00:00-0500" ) },
          state: {
            title: "Scenario with session without document with instance" },
        },
        sessions: [ {
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            classroom: { company: "Company", platoon: "1", unit: "1" },
          }
        } ]
      },

      "scenario-with-session-with-document-with-instance": {
        application:
          "/TDG/index.vwf",
        scenario: {
          document: {
            uri: "/TDG/load/scenario-with-session-with-document-with-instance",
            timestamp: +new Date( "2015-01-01T07:00:00-0500" ) },
          state: {
            title: "Scenario with session with document with instance" },
        },
        sessions: [ {
          document: {
            uri: "/TDG/load/scenario-with-session-with-document-with-instance+session1",
            timestamp: +new Date( "2015-02-01T00:00:00-0500" ) },
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            classroom: { company: "Company", platoon: "1", unit: "1" },
          }
        } ]
      },

      "scenario-with-multiple-sessions": {
        application:
          "/TDG/index.vwf",
        scenario: {
          document: {
            uri: "/TDG/load/scenario-with-multiple-sessions",
            timestamp: +new Date( "2015-01-01T08:00:00-0500" ) },
          state: {
            title: "Scenario with multiple sessions" },
        },
        sessions: [ {
          document: {
            uri: "/TDG/load/scenario-with-multiple-sessions+session1",
            timestamp: +new Date( "2015-02-01T00:00:00-0500" ) },
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            classroom: { company: "Company", platoon: "1", unit: "1" },
          }
        }, {
          document: {
            uri: "/TDG/load/scenario-with-multiple-sessions+session2",
            timestamp: +new Date( "2015-02-02T00:00:00-0500" ) },
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            classroom: { company: "Company", platoon: "1", unit: "1" },
          }
        }, {
          document: {
            uri: "/TDG/load/scenario-with-multiple-sessions+session3",
            timestamp: +new Date( "2015-02-03T00:00:00-0500" ) },
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            classroom: { company: "Company", platoon: "1", unit: "1" },
          }
        }, {
          document: {
            uri: "/TDG/load/scenario-with-multiple-sessions+session4",
            timestamp: +new Date( "2015-02-04T00:00:00-0500" ) },
          instance:
            "/TDG/0123456789ABCDEF",
          state: {
            classroom: { company: "Company", platoon: "1", unit: "1" },
          }
        } ]
      }

    }

  };

}

module.exports = manifest;
module.exports.sample = sample;
