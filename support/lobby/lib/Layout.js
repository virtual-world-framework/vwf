import React from "react";
import { TabContainer, Navbar, Image, Nav, NavItem, TabContent, TabPane, Button } from "react-bootstrap";
import _ from "lodash";

import Scenarios from "./scenarios";
import Sessions from "./sessions";
import Review from "./review";
import { get } from "./utils";

export default class Layout extends React.Component {

  state = {
    version: { title: "ITDG" },
    user: {},
    manifest: {},
  };

  render() {
    return <TabContainer defaultActiveKey={ this.state.user.instructor ? "scenarios" : "sessions" } generateChildId={ ( key, type ) => type + "-" + key }>
      <div>
        <Navbar fluid collapseOnSelect>
          <Navbar.Header>
            <Navbar.Toggle
              data-toggle="collapse" data-target="#navbar"/>
            <Navbar.Brand>
              <a href="#">
                <span><Image className="logo_img_small" src="/ONR_Logo.jpg"/></span>
                <span>&ensp;</span>
                <span>{ this.state.version.title }</span>
              </a>
            </Navbar.Brand>
          </Navbar.Header>
          <Navbar.Collapse id="navbar">
            <Nav>
              { this.state.user.instructor && <NavItem eventKey="scenarios">Scenarios</NavItem> }
              { this.state.user.instructor && <NavItem eventKey="sessions">Sessions</NavItem> }
              { this.state.user.instructor && <NavItem eventKey="review">Review</NavItem> }
            </Nav>
            <Navbar.Form pullRight method="post" action="/logout">
              <Button type="submit" bsStyle="link"> Logout </Button>
            </Navbar.Form>
            <Navbar.Text pullRight>
              {
                ( this.state.user.last_name || "" ) + ( this.state.user.last_name && ( this.state.user.first_name || this.state.user.middle_initial ) ? ", " : "" )  +
                ( this.state.user.first_name || "" ) + ( this.state.user.first_name && this.state.user.middle_initial ? " " : "" )  +
                ( this.state.user.middle_initial || "" ) + ( this.state.user.middle_initial ? "." : "" )
              }
            </Navbar.Text>
          </Navbar.Collapse>
        </Navbar>
        <TabContent animation={ false }>
          { this.state.user.instructor &&
            <TabPane eventKey="scenarios"><Scenarios records={ this.scenarioRecords() }/></TabPane> }
          { true &&
            <TabPane eventKey="sessions"><Sessions records={ this.sessionRecords() } instructor={ this.state.user.instructor }/></TabPane> }
          { this.state.user.instructor &&
            <TabPane eventKey="review"><Review records={ this.reviewRecords() }/></TabPane> }
        </TabContent>
      </div>
    </TabContainer>;
  }

  componentDidMount() {
    this.handleVersion();
    this.handleUser();
    this.handleManifest();
  }

  handleVersion = () => {
    get( "version" ).
      then( version =>
        this.setState( { version: version || {} } ) ).
      catch( error =>
        console.log( error.message ) );
  }

  handleUser = () => {
    get( "user" ).
      then( user =>
        this.setState( { user: user || {} } ) ).
      catch( error =>
        console.log( error.message ) );
  }

  handleManifest = () => {
    get( "manifest" ).
      then( manifest =>
        this.setState( { manifest: manifest || {} } ) ).
      catch( error =>
        console.log( error.message ) );
  }

  scenarioRecords() {
    return scenarioScenarioSessions( this.state.manifest[ "/ITDG/index.vwf" ] || {} );
  }

  sessionRecords() {
    return scenarioScenarioSessions( this.state.manifest[ "/ITDG/index.vwf" ] || {} );
  }

  reviewRecords() {
    return sessionScenarioSessions( this.state.manifest[ "/ITDG/index.vwf" ] || {} );
  }

}

/// Generate the scenarios/sessions list for the Scenarios tab.
/// 
/// Left join each scenario with its sessions. Select only launchable scenarios (with documents) and
/// joinable sessions (not completed).

function scenarioScenarioSessions( scenarios ) {

  return _.map( _.sortBy( _.toPairs( scenarios ), function( [ name, scenario ] ) {
    return name.toLowerCase();
  } ), 1 ).filter( function( scenario ) {
    return scenario.scenario.document;
  } ).reduce( function( scenario_sessions, scenario ) {
    var sessions = ( scenario.sessions || [] ).filter( function( session ) {
      return ! sessionCompleted( session );
    } ).sort( sessionComparator );
    return scenario_sessions.concat( sessions.map( function( session ) {
      return { scenario: scenario.scenario, session: session };
    } ) ).concat( { scenario: scenario.scenario, session: undefined } );
  }, [] );

}

/// Generate the scenarios/sessions list for the Sessions tab.
/// 
/// Join each scenario with its sessions. Select only completed sessions.

function sessionScenarioSessions( scenarios ) {

  return _.map( _.sortBy( _.toPairs( scenarios ), function( [ name, scenario ] ) {
    return name.toLowerCase();
  } ), 1 ).reduce( function( scenario_sessions, scenario ) {
    var sessions = ( scenario.sessions || [] ).filter( function( session ) {
      return sessionCompleted( session );
    } );
    return scenario_sessions.concat( sessions.map( function( session ) {
      return { scenario: scenario.scenario, session: session };
    } ) );
  }, [] ).sort( function( a, b ) {
    return b.session.document.timestamp - a.session.document.timestamp;
  } );

}

/// Determine if a session is completed. Completed sessions are those saved in a document containing
/// student content and having no student instances. A session will become completed an hour after
/// it has been saved and once the last student leaves.

function sessionCompleted( session ) {

  var documentCounts = session.completion.document || { instructors: 0, students: 0 };
  var instanceCounts = session.completion.instance || { instructors: 0, students: 0 };

  return documentCounts.students > 0 && instanceCounts.students === 0 &&
    +new Date() - session.document.timestamp > 60*60*1000;

}

/// `Array#sort` comparison function to sort sessions by company, then platoon, then unit.

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
