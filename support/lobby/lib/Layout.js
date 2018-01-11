import React from "react";
import { TabContainer, Navbar, Image, Nav, NavItem, TabContent, TabPane, Button } from "react-bootstrap";

export default function Layout( props ) {
  return <TabContainer generateChildId={ ( key, type ) => type + "-" + key }>
    <div>
      <Navbar fluid collapseOnSelect>
        <Navbar.Header>
          <Navbar.Toggle
            data-toggle="collapse" data-target="#navbar"/>
          <Navbar.Brand>
            <a href="#">
              <span><Image className="logo_img_small" src="/ONR_Logo.jpg"/></span>
              <span>&ensp;</span>
              <span>Title</span>
            </a>
          </Navbar.Brand>
        </Navbar.Header>
        <Navbar.Collapse id="navbar">
          <Nav>
            <NavItem eventKey="scenarios">Scenarios</NavItem>
            <NavItem eventKey="sessions">Sessions</NavItem>
            <NavItem eventKey="review">Review</NavItem>
          </Nav>
          <Navbar.Form pullRight method="post" action="/logout">
            <Button type="submit" bsStyle="link"> Logout </Button>
          </Navbar.Form>
          <Navbar.Text pullRight>
            Last, First MI.
          </Navbar.Text>
        </Navbar.Collapse>
      </Navbar>
      <TabContent animation={ false }>
        <TabPane eventKey="scenarios">Scenarios</TabPane>
        <TabPane eventKey="sessions">Sessions</TabPane>
        <TabPane eventKey="review">Review</TabPane>
      </TabContent>
    </div>
  </TabContainer>;
}
