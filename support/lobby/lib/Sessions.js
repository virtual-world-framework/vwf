import React from "react";
import { Button } from "react-bootstrap";
import ReactTable from "react-table";

export default function Sessions( props ) {
  return <ReactTable data={ sessionRecords( props.records, props.instructor ) } columns={ columns } className="-striped"/>;
}

function sessionRecords( records, instructor ) {
  return records.filter( record => record.session && ( record.session.instance || instructor ) );
}

const columns = [ {
  Header:
    "Scenario",
  id:
    "session.state.scenarioTitle",
  accessor:
    "session",
  Cell:
    function Cell( props ) { return <ScenarioCell { ...props }/> },
}, {
  Header:
    "Company",
  accessor:
    "session.state.classroom.company",
}, {
  Header:
    "Platoon",
  accessor:
    "session.state.classroom.platoon",
}, {
  Header:
    "Unit",
  accessor:
    "session.state.classroom.unit",
}, {
  Header:
    "",
  id:
    "blank",
  accessor:
    d => "",
}, {
  Header:
    "",
  id:
    "action",
  accessor:
    "session",
  Cell:
    function Cell( props ) { return <ActionCell { ...props }/> },
} ];

class ScenarioCell extends React.Component {
  render() {
    return <React.Fragment>
      { this.props.value.state.scenarioTitle }
      <br/>
      <span className="small">{ instructorStudentsLabel( this.props.value ) }</span>
    </React.Fragment>;
  }
}

class ActionCell extends React.Component {
  render() {
    return <Button href={ this.props.value.instance || this.props.value.document.uri } target="_blank"
      bsSize="small" bsStyle="link"> { this.props.value.instance ? "Join" : "Start" } </Button>;
  }
}

// Generate the Instructor/Students annotation for a session.

function instructorStudentsLabel( session ) {

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
