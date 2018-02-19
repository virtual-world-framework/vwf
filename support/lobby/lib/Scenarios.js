import React from "react";
import { Table, Form, FormControl, Button, ControlLabel } from "react-bootstrap";
import ReactTable from "react-table";
import PropTypes from "prop-types";

import { post } from "./utils";

let COMPANY_LENGTH = 8;
let PLATOON_MIN = 1;
let PLATOON_MAX = 9;
let UNIT_MIN = 1;
let UNIT_MAX = 9;

export default function Scenarios( props ) {
  return <ReactTable data={ scenarioRecords( props.records ) } columns={ columns } className="-striped"
    getTrProps={ () => ( {
      fields:
        [ "company", "platoon", "unit" ],
      readers: {
        filled:
          values => values.company.length > 0 && values.platoon.length > 0 && values.unit.length > 0 },
      writers: {
        company:
          event => ( { company: event.target.value } ),
        platoon:
          event => ( { platoon: event.target.value } ),
        unit:
          event => ( { unit: event.target.value } ) },
    } ) }
  />;
}

function scenarioRecords( records ) {
  return records.filter( record => !record.session );
}

const columns = [ {
  Header:
    "Scenario",
  accessor:
    "scenario.state.scenarioTitle",
}, {
  Header:
    "Company",
  Cell:
    function Cell( props ) { return <CompanyCell { ...props }/> },
}, {
  Header:
    "Platoon",
  Cell:
    function Cell( props ) { return <PlatoonCell { ...props }/> },
}, {
  Header:
    "Unit",
  Cell:
    function Cell( props ) { return <UnitCell { ...props }/> },
}, {
  Header:
    "",
  accessor:
    "scenario.state.scenarioName",
  Cell:
    function Cell( props ) { return <FormControl name="name" type="hidden" value={ props.value }/> },
}, {
  Header:
    "",
  accessor:
    "scenario",
  Cell:
    function Cell( props ) { return <ActionCell { ...props }/> },
}, {
  Header:
    "",
  accessor:
    "scenario",
  Cell:
    function Cell( props ) { return <ExportCell { ...props }/> },
} ];

class LobbyCell  extends React.Component {
  static contextTypes = {
    values:
      PropTypes.objectOf( PropTypes.string ).isRequired,
    readers:
      PropTypes.objectOf( PropTypes.func ).isRequired,
    writers:
      PropTypes.objectOf( PropTypes.func ).isRequired,
  };
}

class CompanyCell extends LobbyCell {
  render() {
    return <FormControl name="company" type="text" maxLength={ COMPANY_LENGTH } bsSize="small"
      value={ this.context.values.company } onChange={ this.context.writers.company }/>;
  }
}

class PlatoonCell extends LobbyCell {
  render() {
    return <FormControl name="platoon" type="number" min={ PLATOON_MIN } max={ PLATOON_MAX } step="1" bsSize="small"
      value={ this.context.values.platoon } onChange={ this.context.writers.platoon }/>;
  }
}

class UnitCell extends LobbyCell {
  render() {
    return <FormControl name="unit" type="number" min={ UNIT_MIN } max={ UNIT_MAX } step="1" bsSize="small"
      value={ this.context.values.unit } onChange={ this.context.writers.unit }/>;
  }
}

class ActionCell extends LobbyCell {

  render() {
    return <React.Fragment>
      <Button href={ this.props.value.instance || this.props.value.document.uri } target="_blank"
        bsSize="small" bsStyle="link" className={ this.context.readers.filled() && "hidden" }> Edit </Button>
      <Button type="submit" disabled={ !this.context.readers.filled() }
        bsSize="small" className={ !this.context.readers.filled() && "hidden" }
        onClick={ this.handleSubmit }> Start </Button>
    </React.Fragment>;
  }

  handleSubmit = event => {
    let properties = {
      name: this.props.value.state.scenarioName,
      company: this.context.values.company,
      platoon: this.context.values.platoon,
      unit: this.context.values.unit };
    let newTab = window.open( "", "_blank" );
      newTab.document.write( "Loading..." );
    post( "sessions", properties ).
      then( result => {
        newTab.location.href = result.document.uri + "/";
        this.props.onServerChange && this.props.onServerChange() } ).
      catch( error => {
        console.log( error.message ) } );
    event.preventDefault();
  }

}

class ExportCell extends React.Component {
  render() {
    return <Button href={ "/export-scenarios?scenarioName=" + this.props.value.state.scenarioName }
      bsSize="small" bsStyle="link"> Export </Button>;
  }
}
