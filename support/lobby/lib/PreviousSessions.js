import React from "react";
import PropTypes from "prop-types";
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

PreviousSessions.propTypes = {
  records:
    PropTypes.arrayOf( PropTypes.object ).isRequired,
};

const columns = [ {
  Header:
    "Scenario",
  accessor:
    "state.scenarioTitle",
  Cell:
    function Cell( props ) { return <TextCell { ...props }/> 
                           },
  Filter:
    function Filter( props ) { return <ScenarioFilter { ...props }/> 
                             },
}, {
  Header:
    "Company",
  accessor:
    "state.classroom.company",
  Cell:
    function Cell( props ) { return <TextCell { ...props }/> 
                           },
}, {
  Header:
    "Platoon",
  accessor:
    "state.classroom.platoon",
  Cell:
    function Cell( props ) { return <TextCell { ...props }/> 
                           },
}, {
  Header:
    "Unit",
  accessor:
    "state.classroom.unit",
  Cell:
    function Cell( props ) { return <TextCell { ...props }/> 
                           },
}, {
  Header:
    "Date",
  accessor:
    "document.timestamp",
  Cell:
    function Cell( props ) { return <DateCell { ...props }/> 
                           },
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
    session => session,
  Cell:
    function Cell( props ) { return <ReviewCell { ...props }/> 
                           },
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
    session => session,
  Cell:
    function Cell( props ) { return <ResumeCell { ...props }/> 
                           },
  sortable:
    false,
  filterable:
    false,
} ];

const buttonContainerStyle = {
  width: "100%",
  textAlign: "center"
}

class ScenarioFilter extends React.Component {

  static propTypes = {
    filter:
      PropTypes.object,
    onChange:
      PropTypes.func.isRequired,
  };

  render() {
    return <input
      type="text"
      placeholder="Search"
      value={ this.props.filter ? this.props.filter.value : "" }
      onChange={ event => this.props.onChange( event.target.value ) } />;
  }

}

class TextCell extends React.Component {

  static propTypes = {
    value:
      PropTypes.string.isRequired,
  };

  render() {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center" }}>
        { this.props.value }
      </div>
    );
  }

}

class DateCell extends React.Component {

  static propTypes = {
    value:
      PropTypes.string.isRequired,
  };

  render() {
    return <TextCell value={ dateFormat( this.props.value ) } />;
  }

}

class ReviewCell extends React.Component {

  static propTypes = {
    value:
      PropTypes.object.isRequired,
  };

  render() {
    const url =
      ( this.props.value.instance || this.props.value.document.uri ) + "?isReview=true";
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

  static propTypes = {
    value:
      PropTypes.object.isRequired,
  };

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