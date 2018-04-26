import React from "react";
import { Button } from "react-bootstrap";
import ReactTable from "react-table";
import dateFormat from "dateformat";

export default function PreviousSessions( props ) {
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
  Cell:
    props => <TextCell { ...props }/>,
}, {
  Header:
    "Company",
  accessor:
    "session.state.classroom.company",
  Cell:
    props => <TextCell { ...props }/>,
}, {
  Header:
    "Platoon",
  accessor:
    "session.state.classroom.platoon",
  Cell:
    props => <TextCell { ...props }/>,
}, {
  Header:
    "Unit",
  accessor:
    "session.state.classroom.unit",
  Cell:
    props => <TextCell { ...props }/>,
}, {
  Header:
    "Date",
  accessor:
    "session.document.timestamp",
  Cell:
    props => <DateCell { ...props }/>,
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
    props => <ReviewCell { ...props }/>,
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
    props => <ResumeCell { ...props }/>,
  sortable:
    false,
  filterable:
    false,
} ];

const buttonContainerStyle = {
  width: "100%",
  textAlign: "center"
}

class TextCell extends React.Component {
  render() {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
        { this.props.value }
      </div>
    );
  }
}

class DateCell extends React.Component {
  render() {
    return <TextCell value={ dateFormat( this.props.value ) } />;
  }
}

class ReviewCell extends React.Component {
  render() {
    const url = ( this.props.value.instance || this.props.value.document.uri ) + "?isReview=true";
    return (
      <div style={ buttonContainerStyle }>
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
      <div style={ buttonContainerStyle }>
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