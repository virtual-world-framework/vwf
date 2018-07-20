import React from "react";
import PropTypes from "prop-types";
import { Table, FormControl, Button, ControlLabel, Checkbox } from "react-bootstrap";
import ReactTable from "react-table";

import { post } from "./utils";

let COMPANY_LENGTH = 8;
let PLATOON_MIN = 1;
let PLATOON_MAX = 9;
let UNIT_MIN = 1;
let UNIT_MAX = 9;

export default function Scenarios( props ) {
  return <React.Fragment>
    <Table striped>
      <tbody>
        <Application onServerChange={ props.onServerChange }/>
      </tbody>
    </Table>
    <ReactTable
     filterable={ !!props.records.length }
      data={ props.records }
      columns={ columns }
     
      className="-striped"
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
      getTdProps={ () => ( {
        onServerChange: props.onServerChange
      } ) }
      defaultFilterMethod={ ( filter, row, column ) => {
        return row[ filter.id ] !== undefined ?
          String( row[ filter.id ] ).toLowerCase().indexOf( filter.value.toLowerCase() ) >= 0 : true
      } }
    />
  </React.Fragment>;
}


Scenarios.propTypes = {
  records:
    PropTypes.arrayOf( PropTypes.object ).isRequired,
  onServerChange:
    PropTypes.func,
};

class Application extends React.Component {

  static TITLE_PLACEHOLDER = "New Scenario Title";

  static propTypes = {
    onServerChange:
      PropTypes.func,
  };

  state = {
    title: "",
    isClicked : false,
    buttonOn: true,
  };
 
 //Function called when Create Scenario button is clicked
  createScenario(){
      this.isCreating(true);
  }

  isCreating(value){
      if(value){
        this.setState({isClicked: true});
        this.setState({buttonOn: false});
      }
  }
  

  render() {
    return  <React.Fragment>
       <tr>
        
        {/*Click on button to make create info pop up*/}
        <td><Button bsStyle="primary" onClick={this.createScenario.bind(this)} style={{display: this.state.buttonOn ? 'block' : 'none' }}> Create Scenario + </Button></td>
        
               {/*will not appear until create button is clicked*/}    
       <td className = "col-sm-8">
        <FormControl disabled = {!this.state.isClicked} style={{display: this.state.isClicked ? 'block' : 'none'}}
          name="title"
          type="text"
          placeholder={ Application.TITLE_PLACEHOLDER }
          bsSize="small"
          value={ this.state.title }
          onChange={ this.handleTitle }
          onKeyPress={ this.handleKeyPress } />
      </td>
   
        
      <td className="col-sm-1">

        <Button type="submit"  disabled = {!this.filled() }
          onClick={ this.handleSubmit} style={{display: this.state.isClicked ? 'block' : 'none' }}> Create </Button>

      </td>
    <td className="col-sm-1">
        <ControlLabel bsClass="btn" bsStyle="default" style={{display: this.state.isClicked ? 'block' : 'none' }}>
          Import <FormControl type="file" accept=".zip" style={ { display: "none" } }
            onChange={ this.handleImport }/>
        </ControlLabel>
      </td>

 {/*X out button to cancel out if you do not want to create scenario*/}
    <td className = "col-sm-1"> 
        <Button 
          onClick={ this.removeScenario.bind(this)} style={{display: this.state.isClicked ? 'block' : 'none' }}> X </Button>           
            </td>
    </tr>
 </React.Fragment>;

  }

  handleTitle = event => {
    this.setState( { title: event.target.value } );
  }

   //closes create info upon clicking 'create' button and leads to new page
  handleSubmit = event => {
     
    this.setState({isClicked: false});
    this.setState({buttonOn: true});
    let properties = {
      name: this.name(),
      title: this.state.title };
      let newTab = window.open("", "_blank");
      newTab.document.write("Loading...");
    post( "scenarios", properties ).
      then( result => {
        newTab.location.href = result.document.uri + "/";
        this.props.onServerChange && this.props.onServerChange() } ).
      catch( error => {
        console.log( error.message ) } );  /* eslint no-console: "off" */
    this.setState( { title: "" } );
    event.preventDefault();
    
  }
  
  
   removeScenario(){
      this.notCreating(true);
  }

  notCreating(value){
      if(value){
        this.setState({isClicked: false});
        this.setState({buttonOn: true});
        this.setState({title: ""});
           
      }
  }
  
  

  handleKeyPress = event => {
    if ( event.key === "Enter" ) {
      this.handleSubmit( event );
    }
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

const columns = [     
    {
  Header:
    "Scenario",
  accessor:
    "scenario.state.scenarioTitle",
  Filter:
    function Filter( props ) { return <ScenarioFilter { ...props }/> 
                             },
}, 
                 
                 
{
  Header:
    "Company",
  id:
    "company",
  Cell:
    function Cell( props ) { return <CompanyCell { ...props }/> 
                           },
}, {
  Header:
    "Platoon",
  id:
    "platoon",
  Cell:
    function Cell( props ) { return <PlatoonCell { ...props }/>
                           },
}, {
  Header:
    "Unit",
  id:
    "unit",
  Cell:
    function Cell( props ) { return <UnitCell { ...props }/> 
                           },
}, {
  Header:
    "",
  accessor:
    "scenario.state.scenarioName",
  Cell:
    function Cell( props ) { return <HiddenCell { ...props }/> 
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
    "scenario",
  Cell:
    function Cell( props ) { return <ActionCell { ...props }/> 
                           },
  sortable:
    false,
  filterable:
    false,
},{
  Header:
    "",
  id:
    "export",
  accessor:
    "scenario",
  Cell:
    function Cell( props ) { return <ExportCell { ...props }/> 
                           },
  sortable:
    false,
  filterable:
    false,
} ];

class ScenarioFilter extends React.Component {

  static propTypes = {
    filter:
      PropTypes.object,
    onChange:
      PropTypes.func.isRequired,
  };

  render() {
    return <input type="text"
      placeholder="Search"
      value={ this.props.filter ? this.props.filter.value : "" }
      onChange={ event => this.props.onChange( event.target.value ) } />;
  }

}

    


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

  static propTypes = {
    value:
      PropTypes.object.isRequired,
  };

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
        this.props.tdProps.rest.onServerChange && this.props.tdProps.rest.onServerChange() } ).
      catch( error => {
        console.log( error.message ) } );  /* eslint no-console: "off" */
    event.preventDefault();
  }

}

//class DeleteCell extends React.Component{
//
// static propTypes = {
//    value:
//      PropTypes.object.isRequired,
//  };
// state = {
//     check: false,
// }
//
//  render() {
//    return <React.Fragment>
//      <Checkbox href={this.props.value.instance || this.props.value.document.uri} 
//        onChange={ this.handleChange } checked = {this.state.check}>  </Checkbox>
//     
//    </React.Fragment>;
//  }
//
//  handleChange = event => {
//   this.setState({check: event.target.checked});
//  }
//  
//
//}


 


class HiddenCell extends React.Component {

  static propTypes = {
    value:
      PropTypes.string.isRequired,
  };

  render() {
    return <FormControl name="name" type="hidden" value={ this.props.value }/>;
  }

}

class ExportCell extends React.Component {

  static propTypes = {
    value:
      PropTypes.object.isRequired,
  };

  render() {
    return <Button href={ "/export-scenarios?scenarioName=" + this.props.value.state.scenarioName }
      bsSize="small"> Export </Button>;
  }

}
