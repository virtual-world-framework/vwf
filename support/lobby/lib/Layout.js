import React from "react";
import { TabContainer, Navbar, Image, Nav, NavItem, TabContent, TabPane, Button } from "react-bootstrap";

import Scenarios from "./scenarios";
import Sessions from "./sessions";
import Review from "./review";
import * as locals from "./locals";

export default function Layout( props ) {
  return <TabContainer defaultActiveKey={ locals.session.passport.user.instructor ? "scenarios" : "sessions" } generateChildId={ ( key, type ) => type + "-" + key }>
    <div>
      <Navbar fluid collapseOnSelect>
        <Navbar.Header>
          <Navbar.Toggle
            data-toggle="collapse" data-target="#navbar"/>
          <Navbar.Brand>
            <a href="#">
              <span><Image className="logo_img_small" src="/ONR_Logo.jpg"/></span>
              <span>&ensp;</span>
              <span>{ locals.version.title }</span>
            </a>
          </Navbar.Brand>
        </Navbar.Header>
        <Navbar.Collapse id="navbar">
          <Nav>
            { locals.session.passport.user.instructor && <NavItem eventKey="scenarios">Scenarios</NavItem> }
            { locals.session.passport.user.instructor && <NavItem eventKey="sessions">Sessions</NavItem> }
            { locals.session.passport.user.instructor && <NavItem eventKey="review">Review</NavItem> }
          </Nav>
          <Navbar.Form pullRight method="post" action="/logout">
            <Button type="submit" bsStyle="link"> Logout </Button>
          </Navbar.Form>
          <Navbar.Text pullRight>
            {
              ( locals.session.passport.user.last_name || "" ) + ( locals.session.passport.user.last_name && ( locals.session.passport.user.first_name || locals.session.passport.user.middle_initial ) ? ", " : "" )  +
              ( locals.session.passport.user.first_name || "" ) + ( locals.session.passport.user.first_name && locals.session.passport.user.middle_initial ? " " : "" )  +
              ( locals.session.passport.user.middle_initial || "" ) + ( locals.session.passport.user.middle_initial ? "." : "" )
            }
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>
      <TabContent animation={ false }>
        { locals.session.passport.user.instructor &&
          <TabPane eventKey="scenarios"><Scenarios/></TabPane> }
        { true &&
          <TabPane eventKey="sessions"><Sessions/></TabPane> }
        { locals.session.passport.user.instructor &&
          <TabPane eventKey="review"><Review/></TabPane> }
      </TabContent>
    </div>
  </TabContainer>;
}
