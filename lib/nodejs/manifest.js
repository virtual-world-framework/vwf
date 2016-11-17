var http = require( "http" ),
  rp = require( "request-promise" ),
  Promise = require( "bluebird" ),
  glob = Promise.promisifyAll( require( "glob" ) ),
  fs = Promise.promisifyAll( require( "fs" ) ),
  _ = require( "lodash" );

var reflector = require( "./reflector" ),
  helpers = require( "./helpers" );

/// Return a promise for the list of applications available to launch, instances to connect to, and
/// documents to load.

function manifest() {
  return applications().then( documents ).then( instances );
}

/// {
///   "/path/to/application.vwf": {},
///   "/path/to/another/application.vwf": {},
///   ...
/// }

function applications() {

  var applications = {};

  return glob.globAsync( "public/**/*.vwf.@(json|yaml)" ).map( function( path ) {

    var applicationKey = path.replace( /^public/, "" ).replace( /\.(json|yaml)$/, "" );
    applications[ applicationKey ] = applications[ applicationKey ] || {};

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
///         state: { title },
///         document: { uri, timestamp },
///         instance,
///       },
///       sessions: [
///         {
///           state: { classroom: { company, platoon, unit } },
///           document: { uri, timestamp },
///           instance,
///         },
///         ...
///       ],
///     },
///     ...
///   },
///   ...
/// }

function documents( applications ) {

  return glob.globAsync( "documents/**/saveState?(_+([0-9])).vwf.json" ).map( function( path ) {

    var match = path.match( RegExp( "documents/(.+)/([^/]+)/saveState(?:_([0-9]+))?.vwf.json" ) );

    if ( match ) {

      var applicationKey = "/" + match[1] + "/index.vwf";
      var name = match[2];
      var revision = match[3];

      if ( ! revision ) {

        applications[ applicationKey ] = applications[ applicationKey ] || {};

        return Promise.join( fs.readFileAsync( path ), fs.statAsync( path ), function( json, stats ) {

          var state = JSON.parse( json );

          var applicationNode = ( ( state || {} ).nodes || [] ).filter( function( node ) {
            return node.patches === applicationKey;
          } )[ 0 ];

          // scenarioName:
          //   "name"
          // scenarioTitle:
          //   "longer title"
          // classroom: {
          //   company: "Company",
          //   platoon: "1",
          //   unit: "1" },
          // dateOfClass:
          //   "1970-01-01T00:00:00Z"

          var scenarioProperties = ( ( ( applicationNode || {} ).children || {} ).scenarioController || {} ).properties || {};

          var scenarioKey = scenarioProperties.scenarioName;
          if (scenarioKey) {
            var sName = scenarioKey.match( RegExp( "class_(.*)_Co" ) );
            if (sName && sName[1]){
              scenarioKey = sName[1];
            }
          }

          var sessionKey = _.pick( scenarioProperties.classroom || {}, [ "company", "platoon", "unit" ] );

          if ( _.keys( sessionKey ).length !== 3 ) {
            sessionKey = undefined;
          }

          var participants = ( ( ( applicationNode || {} ).children || {} ).participants || {} ).children || {};

          var participantInstructors = Object.keys( participants ).map( function( participantName ) {
            return !! ( participants[ participantName ].properties || {} ).isInstructor;
          } );

          var participantCounts = {
            document: {
              instructors: participantInstructors.filter( function( isInstructor ) {
                return isInstructor } ).length,
              students: participantInstructors.filter( function( isInstructor ) {
                return ! isInstructor } ).length,
            }
          };

          if ( scenarioKey ) {

            var document = {
              uri: applicationKey.replace( /\/index.vwf$/, "" ) + "/" + helpers.GenerateInstanceID() + "/load/" + name + "/",
              timestamp: scenarioProperties.scenarioTimestamp ? +new Date( scenarioProperties.scenarioTimestamp ) : stats.mtime
            };

            updateScenario( applications, applicationKey, scenarioKey, sessionKey, scenarioProperties,
              participantCounts, document );

          }

        } );

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
///         state: { title },
///         document: { uri, timestamp },
///         instance,
///       },
///       sessions: [
///         {
///           state: { classroom: { company, platoon, unit } },
///           document: { uri, timestamp },
///           instance,
///         },
///         ...
///       ],
///     },
///     ...
///   },
///   ...
/// }

function instances( applications ) {

  return Promise.map( Object.keys( applications ), function( applicationKey ) {

    var regexp = new RegExp( "^" + _.escapeRegExp( applicationKey ) + "(/|$)" );

    var applicationInstanceIDs = Object.keys( reflector.GetInstances() ).filter( function( instanceID ) {
      return instanceID.search( regexp ) === 0;
    } );

    return Promise.map( applicationInstanceIDs, function( instanceID ) {

      var scenarioPromise = reflector.Evaluate( instanceID, applicationKey,
        "this.scenarioController && this.scenarioController.properties" );

      var participantsPromise = reflector.Evaluate( instanceID, "http://vwf.example.com/clients.vwf",
        "this.children.map( function( client ) { return !! client.instructor } )" );

      return Promise.join( scenarioPromise, participantsPromise, function( scenarioProperties, participantInstructors ) {

        var scenarioProperties = scenarioProperties || {};
        scenarioProperties.classroom = scenarioProperties.classroom || {};

        var scenarioKey = scenarioProperties.scenarioName;
        if (scenarioKey) {
          var sName = scenarioKey.match( RegExp( "class_(.*)_Co" ) );
          if (sName && sName[1]){
            scenarioKey = sName[1];
          }
        }

        var sessionKey = _.pick( scenarioProperties.classroom, [ "company", "platoon", "unit" ] );

        if ( _.keys( sessionKey ).length !== 3 ) {
          sessionKey = undefined;
        }

        var participantCounts = {
          instance: {
            instructors: participantInstructors.filter( function( isInstructor ) {
              return isInstructor } ).length,
            students: participantInstructors.filter( function( isInstructor ) {
              return ! isInstructor } ).length,
          }
        };

        if ( scenarioKey ) {

          var instance = instanceID.replace( /\/index.vwf$/, "" ) + "/";

          updateScenario( applications, applicationKey, scenarioKey, sessionKey, scenarioProperties,
            participantCounts, undefined, instance );
        }

      } ).catch( function( exception ) {

        // Catch `refector.Evaluate` timeouts. Instances that can't be read are omitted from the
        // manifest since `scenarioProperties` is required to identify them.

      } );

    } );

  } ).then( function() {

    return applications;

  } );

}

/// Update a scenario in the application database with new a document and/or instance of the
/// scenario, or a scenario session.
/// 
/// @param applications
///   Application, scenario, session database.
/// @param applicationKey
///   Application id for the document/instance.
/// @param scenarioKey
///   Scenario id for the document/instance. The document/instance is the scenario if `sessionKey`
///   is falsy.
/// @param [sessionKey]
///   Session id of the document/instance if it is a session.
/// @param scenarioProperties
///   Important properties from the saved document or live instance.
/// @param [document]
///   URL and timestamp of a scenario/session saved document.
/// @param [instance]
///   URL of a scenario/session live instance.

function updateScenario( applications, applicationKey, scenarioKey, sessionKey, scenarioProperties,
  participantCounts, document, instance ) {

  /// Locate the application record in the database.

  var application = applications[ applicationKey ];

  /// Locate or create the scenario record in the application.

  var scenario = application[ scenarioKey ] = application[ scenarioKey ] || {
    application:
      applicationKey,
    scenario: {
      state: {} },
    sessions: [],
  };

  if ( ! sessionKey ) {

    // This is a scenario. Record the document/instance state and the document and/or instance URLs.

    _.merge( scenario.scenario, {
      state: scenarioProperties,
      completion: participantCounts,
      document: document,
      instance: instance,
    } );

  } else {

    // This is a session. Update the session record if it exists, or create a new session record.

    var matchedSession = scenario.sessions.reduce( function( matchedSession, session ) {

      // If the document/instance matches an existing session, record the document and/or instance
      // URLs in the session record.

      if ( _.isEqual( session.state.classroom, sessionKey ) ) {
        _.merge( session, {
          completion: participantCounts,
          document: document,
          instance: instance,
        } );
        return true;
      } else {
        return matchedSession;
      }

    }, false );

    // If there is no matching session, record the document/instance state and the document and/or
    // instance URLs in a new session record.

    if ( ! matchedSession ) {

      var session = {
        state: {},
      };

      _.merge( session, {
        state: scenarioProperties,
        completion: participantCounts,
        document: document,
        instance: instance,
      } );

      scenario.sessions.push( session );

    }

  }

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
