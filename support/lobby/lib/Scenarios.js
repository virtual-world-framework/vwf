import React from "react";
import { Table, Form, FormControl, Button, ControlLabel } from "react-bootstrap";
import $ from "jquery";

import * as locals from "./locals";

export default function Scenarios( props ) {
  return <Table striped>
    <thead>
      <Head/>
    </thead>
    <tbody>
      <Application/>
      <Scenarioos/>
    </tbody>
  </Table>;
}

function Head( props ) {
  return <tr>
    <th className="col-sm-5">
      Scenario
    </th><th className="col-sm-1">
      Company
    </th><th className="col-sm-1">
      Platoon
    </th><th className="col-sm-1">
      Unit
    </th><th className="col-sm-2">
      &nbsp;
    </th><th className="col-sm-1">
      &nbsp;
    </th><th className="col-sm-1">
      &nbsp;
    </th>
  </tr>;
}

class Application extends React.Component {

  static TITLE_PLACEHOLDER = "New Scenario Title";
  static NAME_PLACEHOLDER = "Scenario Name";

  state = {
    title: ""
  };

  render() {
    return <tr>
      <td>
        <FormControl name="title" type="text" placeholder={ Application.TITLE_PLACEHOLDER } bsSize="small"
          value={ this.state.title } onChange={ this.handleTitle }/>
      </td><td colSpan="3">
        <FormControl name="name" type="text" placeholder={ Application.NAME_PLACEHOLDER } bsSize="small" className="hidden"
          value={ this.name() } />
      </td><td>
        &nbsp;
      </td><td>
        <Button type="submit" disabled={ !this.filled() } bsSize="small"> Create </Button>
      </td><td>
        <ControlLabel className="btn" bsSize="small">
          Import <FormControl type="file" accept=".zip" style={ { display: "none" } }/>
        </ControlLabel>
      </td>
    </tr>;
  }

  handleTitle = event => {
    this.setState( { title: event.target.value } );
  }

  name() {
    return this.state.title.trim().replace( /[^0-9A-Za-z]+/g, "-" );
  }

  filled() {
    return this.state.title.length > 0;
  }

}

function Scenarioos( props ) {
  const records =
    locals.scenarioScenarioSessions( locals.manifest[ "/ITDG/index.vwf" ] || [] );
  return <React.Fragment>
    { records.map( ( record, index ) => <Scenario key={ index } { ...record }/> ) }
  </React.Fragment>;
}

class Scenario extends React.Component {

  static COMPANY_LENGTH = 8;
  static PLATOON_MIN = 1;
  static PLATOON_MAX = 9;
  static UNIT_MIN = 1;
  static UNIT_MAX = 9;

  state = {
    company: "",
    platoon: "",
    unit: "",
  };

  render() {
    const scenario = this.props.scenario,
      session = this.props.session;
    if ( !session ) {
      return <tr>
        <td>
          { scenario.state.scenarioTitle }
        </td><td>
          <FormControl name="company" type="text" maxLength={ Scenario.COMPANY_LENGTH } bsSize="small"
            value={ this.state.company } onChange={ this.handleCompany }/>
        </td><td>
          <FormControl name="platoon" type="number" min={ Scenario.PLATOON_MIN } max={ Scenario.PLATOON_MAX } step="1" bsSize="small"
            value={ this.state.platoon } onChange={ this.handlePlatoon }/>
        </td><td>
          <FormControl name="unit" type="number" min={ Scenario.UNIT_MIN } max={ Scenario.UNIT_MAX } step="1" bsSize="small"
            value={ this.state.unit } onChange={ this.handleUnit }/>
        </td><td>
          <FormControl name="name" type="hidden" value={ scenario.state.scenarioName }/>
        </td><td>
          <Button href={ scenario.instance || scenario.document.uri } target="_blank" bsSize="small" className={ this.filled() && "hidden" }> Edit </Button>
          <Button type="submit" disabled={ !this.filled() } bsSize="small" className={ !this.filled() && "hidden" }> Start </Button>
        </td><td>
          <Button href={ "/export-scenarios?scenarioName=" + scenario.state.scenarioName } bsSize="small"> Export </Button>
        </td>
      </tr>;
    } else {
      return null;
    }
  }

  handleCompany = event => {
    this.setState( { company: event.target.value } );
  }

  handlePlatoon = event => {
    this.setState( { platoon: event.target.value } );
  }

  handleUnit = event => {
    this.setState( { unit: event.target.value } );
  }

  filled() {
    return this.state.company.length > 0 &&
      this.state.platoon.length > 0 &&
      this.state.unit.length > 0;
  }

}
