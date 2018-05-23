import React from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";
import ReactTable from "react-table";

export default function ActiveSessions( props ) {
  return (
    <ReactTable
      data={ props.records }
      columns={ columns }
      filterable
      className="-striped"
      defaultFilterMethod={ ( filter, row, column ) => {
        return row[ filter.id ] !== undefined ?
          String( row[ filter.id ] ).toLowerCase().indexOf( filter.value.toLowerCase() ) >= 0 : true
      } } />
  );
}

ActiveSessions.propTypes = {
  records:
    PropTypes.arrayOf( PropTypes.object ).isRequired,
};

const columns = [ {
  Header:
    "Scenario",
  id:
    "session.state.scenarioTitle",
  accessor:
    session => session,
  Cell:
    function Cell( props ) { return <ScenarioCell { ...props }/> },
  filterMethod:
    function( filter, row, column ) {
      return row[ filter.id ] !== undefined ?
        String( row[ filter.id ].state.scenarioTitle ).toLowerCase().indexOf( filter.value.toLowerCase() ) >= 0 : true;
    },
  Filter:
    function Filter( { filter, onChange } ) {
      return <input
        type="text"
        placeholder="Search"
        value={ filter ? filter.value : "" }
        onChange={ event => onChange( event.target.value ) } />;
    },
}, {
  Header:
    "Company",
  accessor:
    "state.classroom.company",
}, {
  Header:
    "Platoon",
  accessor:
    "state.classroom.platoon",
}, {
  Header:
    "Unit",
  accessor:
    "state.classroom.unit",
}, {
  Header:
    "",
  id:
    "blank",
  accessor:
    session => "",
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
    function Cell( props ) { return <ActionCell { ...props }/> },
  sortable:
    false,
  filterable:
    false,
} ];

class ScenarioCell extends React.Component {

  static propTypes = {
    value:
      PropTypes.object.isRequired,
  };

  render() {
    return <React.Fragment>
      { this.props.value.state.scenarioTitle }
      <br/>
      <span className="small">{ instructorStudentsLabel( this.props.value ) }</span>
    </React.Fragment>;
  }

}

class ActionCell extends React.Component {

  static propTypes = {
    value:
      PropTypes.object.isRequired,
  };

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
