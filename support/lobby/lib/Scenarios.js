import React from "react";
import { Table, Form, FormControl, Button, ControlLabel } from "react-bootstrap";

import { post } from "./utils";

export default function Scenarios( props ) {
  return <Table striped>
    <thead>
      <Head/>
    </thead>
    <tbody>
      <Application onServerChange={ props.onServerChange }/>
      <Scenarioos records={ props.records } onServerChange={ props.onServerChange }/>
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
    </th><th className="col-sm-2">
      &nbsp;
    </th><th className="col-sm-1">
      &nbsp;
    </th><th className="col-sm-1">
      &nbsp;
    </th>
  </tr>;
}

class Application extends React.Component {

  static TITLE_PLACEHOLDER = "New Scenario Title";
  static NAME_PLACEHOLDER = "Scenario Name";

  state = {
    title: ""
  };

  render() {
    return <tr>
      <Form onSubmit={ this.handleSubmit }>
      <td>
        <FormControl name="title" type="text" placeholder={ Application.TITLE_PLACEHOLDER } bsSize="small"
          value={ this.state.title } onChange={ this.handleTitle }/>
      </td><td colSpan="3">
        <FormControl name="name" type="text" placeholder={ Application.NAME_PLACEHOLDER } bsSize="small" className="hidden"
          value={ this.name() } />
      </td><td>
        &nbsp;
      </td><td>
        <Button type="submit" disabled={ !this.filled() } bsSize="small"> Create </Button>
      </td><td>
        <ControlLabel className="btn" bsSize="small">
          Import <FormControl type="file" accept=".zip" style={ { display: "none" } }
            onChange={ this.handleImport }/>
        </ControlLabel>
      </td>
      </Form>
    </tr>;
  }

  handleTitle = event => {
    this.setState( { title: event.target.value } );
  }

  handleSubmit = event => {
    let properties = {
      name: this.name(),
      title: this.state.title };
    post( "scenarios", properties ).
      then( result => {
        this.props.onServerChange && this.props.onServerChange() } ).
      catch( error => {
        console.log( error.message ) } );
    event.preventDefault();
  }

  handleImport = event => {
    let file = event.target.files &&
      event.target.files[0];
    if ( file ) {
      let formData = new FormData();
        formData.append( "file", file );
      post( "/import-scenarios", formData ).
        then( result => {
          this.props.onServerChange && this.props.onServerChange() } ).
        catch( error => {
          alert( "Uh oh ... we were unable to upload that file for import.\n" + error.message ) } );
    }
  }

  name() {
    return this.state.title.trim().replace( /[^0-9A-Za-z]+/g, "-" );
  }

  filled() {
    return this.state.title.length > 0;
  }

}

function Scenarioos( props ) {
  return <React.Fragment>
    { props.records.map( ( record, index ) => <Scenario key={ index } { ...record } onServerChange={ props.onServerChange }/> ) }
  </React.Fragment>;
}

class Scenario extends React.Component {

  static COMPANY_LENGTH = 8;
  static PLATOON_MIN = 1;
  static PLATOON_MAX = 9;
  static UNIT_MIN = 1;
  static UNIT_MAX = 9;

  state = {
    company: "",
    platoon: "",
    unit: "",
  };

  render() {
    const scenario = this.props.scenario,
      session = this.props.session;
    if ( !session ) {
      return <tr>
        <Form onSubmit={ this.handleSubmit }>
        <td>
          { scenario.state.scenarioTitle }
        </td><td>
          <FormControl name="company" type="text" maxLength={ Scenario.COMPANY_LENGTH } bsSize="small"
            value={ this.state.company } onChange={ this.handleCompany }/>
        </td><td>
          <FormControl name="platoon" type="number" min={ Scenario.PLATOON_MIN } max={ Scenario.PLATOON_MAX } step="1" bsSize="small"
            value={ this.state.platoon } onChange={ this.handlePlatoon }/>
        </td><td>
          <FormControl name="unit" type="number" min={ Scenario.UNIT_MIN } max={ Scenario.UNIT_MAX } step="1" bsSize="small"
            value={ this.state.unit } onChange={ this.handleUnit }/>
        </td><td>
          <FormControl name="name" type="hidden" value={ scenario.state.scenarioName }/>
        </td><td>
          <Button href={ scenario.instance || scenario.document.uri } target="_blank" bsSize="small" className={ this.filled() && "hidden" }> Edit </Button>
          <Button type="submit" disabled={ !this.filled() } bsSize="small" className={ !this.filled() && "hidden" }> Start </Button>
        </td><td>
          <Button href={ "/export-scenarios?scenarioName=" + scenario.state.scenarioName } bsSize="small"> Export </Button>
        </td>
        </Form>
      </tr>;
    } else {
      return null;
    }
  }

  handleCompany = event => {
    this.setState( { company: event.target.value } );
  }

  handlePlatoon = event => {
    this.setState( { platoon: event.target.value } );
  }

  handleUnit = event => {
    this.setState( { unit: event.target.value } );
  }

  handleSubmit = event => {
    let properties = {
      name: this.props.scenario.state.scenarioName,
      company: this.state.company,
      platoon: this.state.platoon,
      unit: this.state.unit };
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

  filled() {
    return this.state.company.length > 0 &&
      this.state.platoon.length > 0 &&
      this.state.unit.length > 0;
  }

}
