import React from "react";
import PropTypes from "prop-types";
import { Modal, Form, FormGroup, FormControl, Checkbox, ControlLabel, Image, Row, Fade, Alert } from "react-bootstrap";

import { get } from "./utils";

const navy = '#000080';
const medBlue = '#0000CD';

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
        password: false,
        firstColor: navy,
        secondColor: navy,
    };
      this.changeColor = this.changeColor.bind(this);
  }

  static propTypes = {
    flash:
      PropTypes.arrayOf( PropTypes.object ).isRequired,
  };

  static defaultProps = {
    flash: []
  };

//Changes the color of the button 

changeColor(isStudent){
    if(isStudent){
        this.setState({secondColor: medBlue});
        this.setState({firstColor: navy});
    }
    else{
        this.setState({secondColor: navy});
        this.setState({firstColor: medBlue});
    }
}

 instructorClick(){
          
     this.setInstructor(true);
     this.changeColor(false);
 }


setInstructor(isInstructor){
    if(isInstructor){
        this.setState({studentBtn: false});
        this.setState({instructorBtn: true});
        this.setState( { instructor: true} );
   
        
    }
    
}


 studentClick(){
     this.setStudent(true);
    this.changeColor(true);
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
  
           <button type="button" bsstyle="primary"  onClick = {this.instructorClick.bind(this)} className="instructor" style={{background: this.state.firstColor}}> Instructor </button>
    
                    {/*Student*/}
     
             <button type = "button" bsstyle="primary" onClick = {this.studentClick.bind(this)} className= "student" style={{background: this.state.secondColor}}> Student </button>
    
             </Row>
        
            <Row> {/*Row 2*/}
            

         {/*Textfield appears when either instructor or student btn is clicked*/}
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
        
          {/*Password textfield appears once instructor btn is clicked*/}
         <Fade in={ this.state.instructorBtn }>
            <FormGroup controlId="password" className="col-sm-7">
            <style scoped>{ ".form-group { transition: height 0.1s }" }</style>
            <ControlLabel> Password </ControlLabel>
            <FormControl name="password" type="password"/>
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
       
          </Modal.Body>
          <Modal.Footer>
         <Fade in = {this.state.studentBtn }>
        <Fade in = {this.state.instructorBtn}>
            <button className = "login" bsstyle="primary"  type = "submit"  > Login </button>
         </Fade>
      </Fade>
          </Modal.Footer>
        </Form>
      </Modal.Dialog>;
    
  
    }else {
      return null;
    }

}
 //Checks the value in the textfields

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
        console.log( "Not working" ) );  /* eslint no-console: "off" */
  }

}

/// Convert an Express flash `type` to a Bootstrap alert style.

