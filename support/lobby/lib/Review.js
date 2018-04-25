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
  width:
    190,
}, {
  Header:
    "",
  id:
    "action",
  accessor:
    "session",
  Cell:
    function Cell( props ) { return <ReviewCell { ...props }/> },
  sortable:
    false,
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
    function Cell( props ) { return <ResumeCell { ...props }/> },
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

class ReviewCell extends React.Component {
  render() {
    const url = ( this.props.value.instance || this.props.value.document.uri ) + "?isReview=true";
    return (
      <div style={{ width: "100%", textAlign: "center"}}>
        <Button href={ url } target="_blank" bsSize="small" bsStyle="link">
          Review
        </Button>
      </div>
    );
  }
}

class ResumeCell extends React.Component {
  render() {
    return (
      <div style={{ width: "100%", textAlign: "center"}}>
        <Button
          href={ this.props.value.instance || this.props.value.document.uri }
          target="_blank"
          bsSize="small"
          bsStyle="link"
        >
          Resume
        </Button>
      </div>
    );
  }
}