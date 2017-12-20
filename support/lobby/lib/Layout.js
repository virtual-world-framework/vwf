import React from "react";
import { TabContainer, Navbar, Image, Nav, NavItem, TabContent, TabPane, Button } from "react-bootstrap";

import Scenarios from "./scenarios";
import Sessions from "./sessions";
import Review from "./review";
import * as locals from "./locals";

export default class Layout extends React.Component {

  state = {
    version: locals.version,
    user: locals.session.passport.user,
    manifest: locals.manifest,
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
            <TabPane eventKey="scenarios"><Scenarios/></TabPane> }
          { true &&
            <TabPane eventKey="sessions"><Sessions instructor={ this.state.user.instructor }/></TabPane> }
          { this.state.user.instructor &&
            <TabPane eventKey="review"><Review/></TabPane> }
        </TabContent>
      </div>
    </TabContainer>;
  }

}
