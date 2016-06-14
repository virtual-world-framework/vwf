var _ = require( "lodash" );

// Generate the scenarios/sessions list for the Scenarios tab.
// 
// Left join each scenario with its sessions. Select only launchable scenarios (with documents) and
// joinable sessions (not completed).

module.exports.scenarioScenarioSessions = function( scenarios ) {

  return _.sortBy( scenarios, function( scenario, name ) {
    return name;
  } ).filter( function( scenario ) {
    return scenario.scenario.document;
  } ).reduce( function( scenario_sessions, scenario ) {
    var sessions = ( scenario.sessions || [] ).filter( function( session ) {
      return true; // TODO: select only incomplete sessions
    } );
    return scenario_sessions.concat( sessions.map( function( session ) {
      return { scenario: scenario.scenario, session: session };
    } ) ).concat( { scenario: scenario.scenario, session: undefined } );
  }, [] );

};

// Generate the scenarios/sessions list for the Sessions tab.
// 
// Join each scenario with its sessions. Select only completed sessions.

module.exports.sessionScenarioSessions = function( scenarios ) {

  return _.sortBy( scenarios, function( scenario, name ) {
    return name;
  } ).reduce( function( scenario_sessions, scenario ) {
    var sessions = ( scenario.sessions || [] ).filter( function( session ) {
      return session.document;  // TODO: select only complete sessions
    } );
    return scenario_sessions.concat( sessions.map( function( session ) {
      return { scenario: scenario.scenario, session: session };
    } ) );
  }, [] ).sort( function( a, b ) {
    return b.session.document.timestamp - a.session.document.timestamp;
  } );

};

// `dateformat` module.

module.exports.dateFormat = require( "dateformat" );
