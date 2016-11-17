var _ = require( "lodash" );

// Generate the scenarios/sessions list for the Scenarios tab.
// 
// Left join each scenario with its sessions. Select only launchable scenarios (with documents) and
// joinable sessions (not completed).

module.exports.scenarioScenarioSessions = function( scenarios ) {

  return _.sortBy( scenarios, function( scenario, name ) {
    return name.toLowerCase();
  } ).filter( function( scenario ) {
    return scenario.scenario.document;
  } ).reduce( function( scenario_sessions, scenario ) {
    var sessions = ( scenario.sessions || [] ).filter( function( session ) {
      return ! sessionCompleted( session );
    } ).sort( sessionComparator );
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
    return name.toLowerCase();
  } ).reduce( function( scenario_sessions, scenario ) {
    var sessions = ( scenario.sessions || [] ).filter( function( session ) {
      return sessionCompleted( session );
    } );
    return scenario_sessions.concat( sessions.map( function( session ) {
      return { scenario: scenario.scenario, session: session };
    } ) );
  }, [] ).sort( function( a, b ) {
    return b.session.document.timestamp - a.session.document.timestamp;
  } );

};

// Generate the Instructor/Students annotation for a session.

module.exports.instructorStudentsLabel = function( session ) {

  var instanceCounts = session.completion.instance || { instructors: 0, students: 0 },
    label = "";

  if ( instanceCounts.instructors > 0 || instanceCounts.students > 0 ) {

    if ( instanceCounts.instructors > 0 ) {
      label += "Instructor, ";
    }

    if ( instanceCounts.students === 1 ) {
      label += instanceCounts.students + " student";
    } else {
      label += instanceCounts.students + " students";
    }

  }

  return label;

}

// `dateformat` module.

module.exports.dateFormat = require( "dateformat" );

// Determine if a session is completed. Completed sessions are those saved in a document containing
// student content and having no student instances. A session will become completed an hour after it
// has been saved and once the last student leaves.

function sessionCompleted( session ) {

  var documentCounts = session.completion.document || { instructors: 0, students: 0 };
  var instanceCounts = session.completion.instance || { instructors: 0, students: 0 };

  return documentCounts.students > 0 && instanceCounts.students === 0 &&
    +new Date() - session.document.timestamp > 60*60*1000;

}

// `Array#sort` comparison function to sort sessions by company, then platoon, then unit.

function sessionComparator( sessionA, sessionB ) {

  var stateA = sessionA.state || {},
    classroomA = stateA.classroom || {},
    companyA = ( classroomA.company || "" ).toLowerCase(),
    platoonA = Number( classroomA.platoon ),
    unitA = Number( classroomA.unit );

  var stateB = sessionB.state || {},
    classroomB = stateB.classroom || {},
    companyB = ( classroomB.company || "" ).toLowerCase(),
    platoonB = Number( classroomB.platoon ),
    unitB = Number( classroomB.unit );

  if ( companyA < companyB ) {
    return -1;
  } else if ( companyA > companyB ) {
    return 1;
  }

  if ( platoonA < platoonB ) {
    return -1;
  } else if ( platoonA > platoonB ) {
    return 1;
  }

  if ( unitA < unitB ) {
    return -1;
  } else if ( unitA > unitB ) {
    return 1;
  }

  return 0;

}
