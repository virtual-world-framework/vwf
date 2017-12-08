import React from "react";
import { Table, Button } from "react-bootstrap";

import * as locals from "./locals";

export default function Sessions( props ) {
  return <Table striped>
    <thead>
      <Head/>
    </thead>
    <tbody>
      <Sessioons/>
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
    </th><th className="col-sm-3">
      &nbsp;
    </th><th className="col-sm-1">
      &nbsp;
    </th>
  </tr>;
}

function Sessioons( props ) {
  const records =
    locals.scenarioScenarioSessions( locals.manifest[ "/ITDG/index.vwf" ] || [] );
  return <React.Fragment>
    { records.map( ( record, index ) => <Session key={ index } { ...record }/> ) }
  </React.Fragment>;
}

function Session( props ) {
  const scenario = props.scenario,
    session = props.session;
  if ( session && ( session.instance || locals.session.passport.user.instructor ) ) {
    return <tr>
      <td>
        { session.state.scenarioTitle }
        <br/>
        <span className="small">{ locals.instructorStudentsLabel( session ) }</span>
      </td><td>
        { session.state.classroom.company }
      </td><td>
        { session.state.classroom.platoon }
      </td><td>
        { session.state.classroom.unit }
      </td><td>
        &nbsp;
      </td><td>
        <Button href={ session.instance || session.document.uri } target="_blank" bsSize="small">{ session.instance ? "Join" : "Start" }</Button>
      </td><td>
        &nbsp;
      </td>
    </tr>;
  } else {
    return null;
  }
}
