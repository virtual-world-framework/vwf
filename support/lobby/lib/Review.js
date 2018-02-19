import React from "react";
import { Button } from "react-bootstrap";
import ReactTable from "react-table";
import dateFormat from "dateformat";

export default function Reviews( props ) {
  return <ReactTable data={ props.records } columns={ columns } filterable className="-striped"
    defaultFilterMethod={ ( filter, row, column ) => {
      return row[ filter.id ] !== undefined ?
        String( row[ filter.id ] ).toLowerCase().indexOf( filter.value.toLowerCase() ) >= 0 : true
    } }
  />;
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
  filterable:
    false,
}, {
  Header:
    "",
  id:
    "action",
  accessor:
    "session",
  Cell:
    function Cell( props ) { return <ActionCell { ...props }/> },
  sortable:
    false,
  filterable:
    false,
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
