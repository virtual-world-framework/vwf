import React from "react";
import { Table, Button } from "react-bootstrap";
import ReactTable from "react-table";
import dateFormat from "dateformat";

export default function Reviews( props ) {
  return <ReactTable data={ props.records } columns={ columns } className="-striped"/>;
}

const columns = [ {
  Header:
    "Scenario",
  accessor:
    "session.state.scenarioTitle",
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
    "Date",
  accessor:
    "session.document.timestamp",
  Cell:
    function Cell( props ) { return <DateCell { ...props }/> },
}, {
  Header:
    "",
  accessor:
    "session",
  Cell:
    function Cell( props ) { return <ActionCell { ...props }/> },
} ];

class DateCell extends React.Component {
  render() {
    return dateFormat( this.props.value );
  }
}

class ActionCell extends React.Component {
  render() {
    return <Button href={ this.props.value.instance || this.props.value.document.uri } target="_blank"
      bsSize="small" bsStyle="link"> Review </Button>;
  }
}
