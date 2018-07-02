import React from "react";
import PropTypes from "prop-types";
import { Modal, Form, FormGroup, FormControl, Checkbox, ControlLabel, Button, Image, Row, Fade, Alert } from "react-bootstrap";

import { get } from "./utils";

export default class Login extends React.Component {
    
  constructor(props) {
    super(props);
    this.state = {
        lastName: "",
        firstName: "",
        middleInitial: "",
        instructor: false,
        version: null,
        instructorBtn:false,
        studentBtn: false,
    };
  }

  static propTypes = {
    flash:
      PropTypes.arrayOf( PropTypes.object ).isRequired,
  };

  static defaultProps = {
    flash: []
  };



 instructorClick(){
     console.log("clicked");
     this.setInstructor(true);
 }


setInstructor(isInstructor){
    if(isInstructor){
        this.setState({studentBtn: false});
        this.setState({instructorBtn: true});
        this.setState( { instructor: true} );
    }
    
}


 studentClick(){
     console.log("clicked");
     this.setStudent(true);
 }


setStudent(isStudent){
    if(isStudent){
        this.setState({instructorBtn: false});
        this.setState({instructor: false});
        this.setState({studentBtn: true});
    }
}



  render() {
    if ( this.state.version ) {
      return <Modal.Dialog>
        <Form method="post" action="login">
          <Modal.Header>
            <Row>
              <FormGroup className="col-sm-9">
                <h2 className="modal-title">{ this.state.version.title }</h2>
              </FormGroup>
              <FormGroup className="col-sm-3">
                <Image className="logo_img" src="/ONR_Logo.jpg"/>
              </FormGroup>
            </Row>
          </Modal.Header>
          <Modal.Body>
                    
            <Row>  {/*Row 1*/}
                    
                    {/*Instructor*/}
  
           <Button bsStyle="primary"  onClick = {this.instructorClick.bind(this)} className="instructor" > Instructor </Button>
    
                    {/*Student*/}
     
             <Button bsStyle="primary" onClick = {this.studentClick.bind(this)} className= "student"> Student </Button>
    
             </Row>
        
            <Row> {/*Row 2*/}
            
        <Fade in = {this.state.studentBtn }>
        <Fade in = {this.state.instructorBtn}>
                <div>
              <FormGroup controlId="last-name" className="col-sm-5">
                <ControlLabel> Last name </ControlLabel>
                <FormControl name="last_name" type="text" value={ this.state.lastName } onChange={ this.handleLastName }/>
              </FormGroup>
              <FormGroup controlId="first-name" className="col-sm-5">
                <ControlLabel> First name </ControlLabel>
                <FormControl name="first_name" type="text" value={ this.state.firstName } onChange={ this.handleFirstName }/>
              </FormGroup>
              <FormGroup controlId="middle-initial" className="col-sm-2">
                <ControlLabel> M. I. </ControlLabel>
                <FormControl name="middle_initial" type="text" value={ this.state.middleInitial } onChange={ this.handleMiddleInitial }/>
              </FormGroup>
                </div>
        </Fade>
        </Fade>
        
        </Row>
        
        
            <Row> {/*Row 3*/}
        
        
         <Fade in={ this.state.instructorBtn }>
            <FormGroup controlId="password" className="col-sm-7">
            <style scoped>{ ".form-group { transition: height 0.1s }" }</style>
            <ControlLabel> Password </ControlLabel>
            <FormControl name="password" type="password" onChange= {this.handlePasswordCorrect}/>
            </FormGroup>
         </Fade> 
     
        
        <Fade in = {false}>
              <FormGroup className="col-sm-5">
                <ControlLabel>
                  &nbsp;
                </ControlLabel>
                <Checkbox id="instructor" name="instructor" value="instructor" checked={ this.state.instructorBtn } onChange={ this.handleInstructor }>
                  Instructor
                </Checkbox>
              </FormGroup>
        </Fade>


            </Row>
        
            <Row>
              <FormGroup className="col-sm-12" bsSize="small">
                { 
                  this.props.flash.map( 
                        ( message, index ) =>
                            <Alert key={ index } bsStyle={ bsStyle( message.type ) }> 
                            { message.message }
                            </Alert> 
                    ) 
                }
              </FormGroup>
            </Row>
          </Modal.Body>
          <Modal.Footer>
         <Fade in = {this.state.studentBtn }>
        <Fade in = {this.state.instructorBtn}>
            <Button bsStyle="primary"  type = "submit"  > Login </Button>
         </Fade>
      </Fade>
          </Modal.Footer>
        </Form>
      </Modal.Dialog>;
    
  
    }else {
      return null;
    }

}

  componentDidMount() {
    this.handleVersion();
  }

  handleLastName = event => {
    this.setState( { lastName: event.target.value } );
  }

  handleFirstName = event => {
    this.setState( { firstName: event.target.value } );
  }

  handleMiddleInitial = event => {
    this.setState( { middleInitial: event.target.value } );
  }

  handleInstructor = event => {
    this.setState( { instructor: true} );
  }

  handleVersion = () => {
    get( "version" ).
      then( version =>
        this.setState( { version: version || {} } ) ).
      catch( error =>
        console.log( error.message ) );  /* eslint no-console: "off" */
  }

}

/// Convert an Express flash `type` to a Bootstrap alert style.

function bsStyle( flashType ) {
  switch ( flashType ) {
    case "success":
      return "success";
    // case "warning":
    // case "warn":
    //   return "warning";
    case "error":
      return "danger";
    default:
      return "info";
  }
}
