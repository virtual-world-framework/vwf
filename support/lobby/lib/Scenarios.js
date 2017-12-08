import React from "react";
import { Table, Form, FormControl, Button, ControlLabel } from "react-bootstrap";

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

function Application( props ) {
  return <tr>
    <td>
      <FormControl name="title" type="text" placeholder="New Scenario Title" bsSize="small"/>
    </td><td colSpan="3">
      <FormControl name="name" type="text" placeholder="Scenario Name" bsSize="small" className="hidden"/>
    </td><td>
      &nbsp;
    </td><td>
      <Button type="submit" disabled bsSize="small"> Create </Button>
    </td><td>
      <ControlLabel className="btn" bsSize="small">
        Import <FormControl type="file" accept=".zip" style={ { display: "none" } }/>
      </ControlLabel>
    </td>
  </tr>;
}

function Scenarioos( props ) {
  const records =
    locals.scenarioScenarioSessions( locals.manifest[ "/ITDG/index.vwf" ] || [] );
  return <React.Fragment>
    { records.map( ( record, index ) => <Scenario key={ index } { ...record }/> ) }
  </React.Fragment>;
}

function Scenario( props ) {
  const scenario = props.scenario,
    session = props.session;
  if ( !session ) {
    return <tr>
      <td>
        { scenario.state.scenarioTitle }
      </td><td>
        <FormControl name="company" type="text" maxLength="8" bsSize="small"/>
      </td><td>
        <FormControl name="platoon" type="number" min="1" max="9" step="1" bsSize="small"/>
      </td><td>
        <FormControl name="unit" type="number" min="1" max="9" step="1" bsSize="small"/>
      </td><td>
        <FormControl name="name" type="hidden" value={ scenario.state.scenarioName }/>
      </td><td>
        <Button href={ scenario.instance || scenario.document.uri } target="_blank" bsSize="small"> Edit </Button>
        <Button type="submit" disabled bsSize="small" className="hidden"> Start </Button>
      </td><td>
        <Button href={ "/export-scenarios?scenarioName=" + scenario.state.scenarioName } bsSize="small"> Export </Button>
      </td>
    </tr>;
  } else {
    return null;
  }
}
