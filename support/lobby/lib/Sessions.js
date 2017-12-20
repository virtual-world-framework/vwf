import React from "react";
import { Table, Button } from "react-bootstrap";

export default function Sessions( props ) {
  return <Table striped>
    <thead>
      <Head/>
    </thead>
    <tbody>
      <Sessioons records={ props.records } instructor={ props.instructor }/>
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
  return <React.Fragment>
    { props.records.map( ( record, index ) => <Session key={ index } { ...record } instructor={ props.instructor }/> ) }
  </React.Fragment>;
}

function Session( props ) {
  const scenario = props.scenario,
    session = props.session;
  if ( session && ( session.instance || props.instructor ) ) {
    return <tr>
      <td>
        { session.state.scenarioTitle }
        <br/>
        <span className="small">{ instructorStudentsLabel( session ) }</span>
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

// Generate the Instructor/Students annotation for a session.

export function instructorStudentsLabel( session ) {

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
