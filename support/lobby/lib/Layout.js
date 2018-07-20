import React from "react";
import { TabContainer, Navbar, Image, Nav, NavItem, TabContent, TabPane, Button } from "react-bootstrap";
import _ from "lodash";

import "./LobbyTR";
import Scenarios from "./Scenarios";
import ActiveSessions from "./ActiveSessions";
import PreviousSessions from "./PreviousSessions";
import { get } from "./utils";

export default class Layout extends React.Component {

  state = {
    version: null,
    user: null,
    manifest: null,
  };

  render() {
    if ( this.state.version && this.state.user && this.state.manifest ) {
      return <TabContainer
        defaultActiveKey={ this.state.user.instructor ? "scenarios" : "activeSessions" }
        generateChildId={ ( key, type ) => type + "-" + key }
      >
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
                { this.state.user.instructor && <NavItem eventKey="scenarios">Scenario Templates</NavItem> 
                }
                { this.state.user.instructor && <NavItem eventKey="activeSessions">Active Sessions</NavItem> 
                }
                { this.state.user.instructor && <NavItem eventKey="previousSessions">Previous Sessions</NavItem>
                }
              </Nav>
              <Navbar.Form pullRight componentClass="form" method="post" action="/logout">
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
              <TabPane eventKey="scenarios"><Scenarios records={ this.scenarioRecords() } onServerChange={ this.handleManifest }/></TabPane> 
    }
            { true &&
              <TabPane eventKey="activeSessions">
                <ActiveSessions records={ this.activeSessionRecords() } />
              </TabPane>
            }
            { this.state.user.instructor &&
              <TabPane eventKey="previousSessions"><PreviousSessions records={ this.previousSessionRecords() }/></TabPane> 
            }
          </TabContent>
        </div>
      </TabContainer>;
    } else {
      return null;
    }
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
        console.log( error.message ) );  /* eslint no-console: "off" */
  }

  handleUser = () => {
    get( "user" ).
      then( user =>
        this.setState( { user: user || {} } ) ).
      catch( error =>
        console.log( error.message ) );  /* eslint no-console: "off" */
  }

  handleManifest = () => {
    get( "manifest" ).
      then( manifest =>
        this.setState( { manifest: manifest || {} } ) ).
      catch( error =>
        console.log( error.message ) );  /* eslint no-console: "off" */
  }

  scenarioRecords() {
    const scenarios = this.state.manifest[ "/ITDG/index.vwf" ] || {};
    const sortedScenariosArray =
      _.map( _.sortBy( _.toPairs( scenarios ), function( [ name, scenario ] ) {
        return name.toLowerCase();
      } ), 1 );
    return sortedScenariosArray.filter( function( scenario ) {
      return scenario.scenario.document;
    } );
  }

  activeSessionRecords() {
    return this.scenarioRecords().reduce( function( allActiveSessions, scenario ) {
      var activeSessions = ( scenario.sessions || [] ).filter( function( session ) {
        return session.instance && !session.completion.instance.isReview;
      } ).sort( sessionComparator );
      return allActiveSessions.concat( activeSessions );
    }, [] );
  }

  previousSessionRecords() {
    return this.scenarioRecords().reduce( function( allPreviousSessions, scenario ) {
      var previousSessions = ( scenario.sessions || [] ).filter( function( session ) {
        return !session.instance;
      } );
      return allPreviousSessions.concat( previousSessions );
    }, [] ).sort( function( a, b ) {
      return b.document.timestamp - a.document.timestamp;
    } );
  }

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
