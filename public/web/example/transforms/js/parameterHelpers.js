//  Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
//  Secretary of Defense (Personnel & Readiness).
//  
//  Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
//  in compliance with the License. You may obtain a copy of the License at
//  
//    http://www.apache.org/licenses/LICENSE-2.0
//  
//  Unless required by applicable law or agreed to in writing, software distributed under the License
//  is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
//  or implied. See the License for the specific language governing permissions and limitations under
//  the License.



//  This javascript file contains helper functions for taking user input from fields
//  and properly formatting it into an array of floats, and also for taking an array
//  of floats and using it to populate the user input fields.



// Provided functions:
//     getWorldTransformParameters(): No parameters.  Returns array of 16 floats, populated from 
//                                    World Transformation input fields.
//     getTransformParameters(): No parameters.  Returns array of 16 floats, populated from the 
//                               Transform input fields.
//     getTranslationParameters(): No parameters.  Returns array of 3 floats, populated from the
//                                 Translation input fields.
//     getRotationParameters(): No parameters.  Returns array of 4 floats, populated from the
//                               Rotation input fields.
//     getQuaternionParameters(): No parameters.  Returns array of 4 floats, populated from the
//                                Quaternion input fields.
//     getScaleParameter(): No parameters.  Returns a single float, populated from the Scale input
//                          field.
//     getSetPropertyExampleParameter(): No parameters.  Returns a single string, populated from
//                                        the Set Property Example input field.
//     getTimePeriodParameter(): No parameters.  Returns a single float, populated from the Time
//                               Period input field.
//     getSelectedNodeId(): No parameters.  Returns a string, populated with the NodeId of the
//                          currently selected node (hello or world).
//     setWorldTransformInputs(worldTransformValues): Takes the world transform values as an array
//                          of 16 floats as an argument. Populates the world transform input fields
//                          with these values.
//     setTransformInputs(transformValues): Takes the transform values as an array of 16 floats as
//                           an argument.  Populates the transform input fields with these values.
//     setScaleInputs(scaleValues): Takes the scale values as an array of 1 float as an argument.
//                                  Populates the scale input field with this value.
//     setQuaternionInputs(quaternionValues): Takes the quaternion values as an array of 4 floats
//                        as an argument.  Populates the quaternion input fields with these values.
//     setRotationInputs(rotationValues): Takes the rotation values as an array of 4 floats as an
//                              argument.  Populates the rotation input fields with these values.
//     setTranslationInputs(translationValues): Takes the translation values as an array of 3 floats
//                        as an argument.  Populates the translation input fields with these values.




//     getWorldTransformParameters(): No parameters.  Returns array of 16 floats, populated from 
//     World Transformation input fields.
function getWorldTransformParameters( ) {
  // Initialize default return values.
  var wrldResult = [ 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 ];
  // Loop 16 times for a 4x4 matrix.
  for( var loopIndex = 0; loopIndex < 16; loopIndex++ ) {
    // Create the name by integer division/modulo... Index 0 becomes wt00, Index 1 becomes wt01, 
    // Index 15 becomes wt33, and so on.
    var inputFieldQuery = 'input[name="wt' + ( parseInt( loopIndex / 4 ) ).toString( ) + ( loopIndex % 4 ).toString( ) + '"]';
    //  Attempt to parse the contents of the input field.
    var parseAttempt = parseFloat( $( inputFieldQuery ).val( ) );
    // Check if the parse resulted in a valid number, if it did, update the return value array.
    if ( !( isNaN( parseAttempt ) ) ) {
      wrldResult[ loopIndex ] = parseAttempt;
    }
  }
  // Return the return value array.
  return wrldResult;
}



//     getTransformParameters(): No parameters.  Returns array of 16 floats, populated from the 
//                               Transform input fields.
function getTransformParameters( ) {
  // Initialize default return values.
  var trnsfrmResult = [ 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 ];
  // Loop 16 times for a 4x4 matrix.
  for( var loopIndex = 0; loopIndex < 16; loopIndex++ ) {
    // Create the name by integer division/modulo... Index 0 becomes trfrm00, Index 1 becomes
    // trfrm01, Index 15 becomes wt33, and so on.
    var inputFieldQuery = 'input[name="trfrm' + ( parseInt( loopIndex / 4 ) ).toString( ) + ( loopIndex % 4 ).toString( ) + '"]';
    //  Attempt to parse the contents of the input field.
    var parseAttempt = parseFloat( $( inputFieldQuery ).val( ) );
    // Check if the parse resulted in a valid number, if it did, update the return value array.
    if ( !( isNaN( parseAttempt ) ) ) {
      trnsfrmResult[ loopIndex ] = parseAttempt;
    }
  }
  // Return the return value array.
  return trnsfrmResult;
}



//     getTranslationParameters(): No parameters.  Returns array of 3 floats, populated from the
//                                 Translation input fields.
function getTranslationParameters( )  {
  // Initialize default return values.
  var trnslateResult = [ 0.0, 0.0, 0.0 ];
  // Create variable to hold parse attempts, attempt to parse first input field.
  var parseAttempt = parseFloat( $( 'input[name="trnslt-x"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    trnslateResult[ 0 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="trnslt-y"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    trnslateResult[ 1 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="trnslt-z"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    trnslateResult[ 2 ] = parseAttempt;
  }
  // Return the return value array.
  return trnslateResult;
}



//     getRotationParameters(): No parameters.  Returns array of 4 floats, populated from the
//                               Rotation input fields.
function getRotationParameters( ) {
  // Initialize default return values.
  var rotateResult = [ 0.0, 0.0, 1.0, 0.0 ];
  // Create variable to hold parse attempts, attempt to parse first input field.
  var parseAttempt = parseFloat( $( 'input[name="rot-x"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    rotateResult[ 0 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="rot-y"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    rotateResult[ 1 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="rot-z"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    rotateResult[ 2 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="rot-degree"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    rotateResult[ 3 ] = parseAttempt;
  }
  // Return the return value array.
  return rotateResult;
}



//     getQuaternionParameters(): No parameters.  Returns array of 4 floats, populated from the
//                                Quaternion input fields.
function getQuaternionParameters( ) {
  // Initialize default return values.
  var quatResult = [ 0.0, 0.0, 1.0, 0.0 ];
  // Create variable to hold parse attempts, attempt to parse first input field.
  var parseAttempt = parseFloat( $( 'input[name="quat-x"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    quatResult[ 0 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="quat-y"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    quatResult[ 1 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="quat-z"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    quatResult[ 2 ] = parseAttempt;
  }
  // Attempt to parse the next input field.
  parseAttempt = parseFloat( $( 'input[name="quat-degree"]' ).val( ) );
  // If parse generated a valid float, update the return value.
  if ( !( isNaN( parseAttempt ) ) ) {
    quatResult[ 3 ] = parseAttempt;
  }
  // Return the return value array.
  return quatResult;
}



//     getScaleParameter(): No parameters.  Returns a single float, populated from the Scale input
//                          field.
function getScaleParameter( ) {
  // Create variable to hold parse attempt, attempt to parse the input field.
  var parseAttempt = parseFloat( $( 'input[name="scale-ratio"]' ).val( ) );
  // If we cannot parse, return 1.0 as a default value.
  if ( isNaN( parseAttempt ) ) {
    return 1.0;
  }
  // If we could parse, return the parsed result.
  return parseAttempt;
}



//     getSetPropertyExampleParameter(): No parameters.  Returns a single string, populated from
//                                        the Set Property Example input field.
function getSetPropertyExampleParameter( ) {
  return $( 'input[name="setpropdemo"]' ).val( );
}



//     getTimePeriodParameter(): No parameters.  Returns a single float, populated from the Time
//                               Period input field.
function getTimePeriodParameter( ) {
  // Create variable to hold parse attempt, attempt to parse the input field.
  var parseAttempt = parseFloat($('input[name="timeperiod"]').val());
  // If we cannot parse, return 3.0 as a default value.
  if ( isNaN( parseAttempt ) ) {
    return 3.0;
  }
  // If we could parse, return parsed result.
  return parseAttempt;
}



//     getSelectedNodeId(): No parameters.  Returns a string, populated with the NodeId of the
//                          currently selected node (hello or world).
function getSelectedNodeId( ) {
  return vwf_view.kernel.find( "" , $( 'input[name="objectselect"]:checked' ).val( ) )[ 0 ];
}



//     setWorldTransformInputs(worldTransformValues): Takes the world transform values as an array
//                          of 16 floats as an argument. Populates the world transform input fields
//                          with these values.
function setWorldTransformInputs( worldTransformValues ) {
  // Loop 16 times for a 4x4 matrix.
  for ( var loopIndex = 0; loopIndex < 16; loopIndex++ ) {
    // Create the name by integer division/modulo... Index 0 becomes wt00, Index 1 becomes wt01, 
    // Index 15 becomes wt33, and so on.
    var inputFieldName = 'input[name="wt' + ( parseInt( loopIndex / 4 ) ).toString( ) + ( loopIndex % 4 ).toString( ) + '"]';
    // Set the value in the input to the value of the appropriate member of the array.
    $( inputFieldName ).val( worldTransformValues[ loopIndex ] );
  }
}



//     setTransformInputs(transformValues): Takes the transform values as an array of 16 floats as
//                           an argument.  Populates the transform input fields with these values.
function setTransformInputs( transformValues ) {
  // Loop 16 times for a 4x4 matrix.
  for ( var loopIndex = 0; loopIndex < 16; loopIndex++ ) {
    // Create the name by integer division/modulo... Index 0 becomes trfrm00, Index 1 becomes trfrm01, 
    // Index 15 becomes trfrm33, and so on.
    var inputFieldName = 'input[name="trfrm' + ( parseInt( loopIndex / 4 ) ).toString( ) + ( loopIndex % 4 ).toString( ) + '"]';
    // Set the value in the input to the value of the appropriate member of the array.
    $( inputFieldName ).val( transformValues[ loopIndex ] );
  }
}



//     setScaleInputs(scaleValues): Takes the scale values as an array of 1 float as an argument.
//                                  Populates the scale input field with this value.
function setScaleInputs( scaleValues ) {
  $( 'input[name="scale-ratio"]' ).val( scaleValues[ 0 ] ); 
}



//     setQuaternionInputs(quaternionValues): Takes the quaternion values as an array of 4 floats
//                        as an argument.  Populates the quaternion input fields with these values.
function setQuaternionInputs( quaternionValues ) {
  $( 'input[name="quat-x"]' ).val( quaternionValues[ 0 ] );
  $( 'input[name="quat-y"]' ).val( quaternionValues[ 1 ] );
  $( 'input[name="quat-z"]' ).val( quaternionValues[ 2 ] );
  $( 'input[name="quat-degree"]' ).val( quaternionValues[ 3 ] );
}



//     setRotationInputs(rotationValues): Takes the rotation values as an array of 4 floats as an
//                              argument.  Populates the rotation input fields with these values.
function setRotationInputs( rotationValues ) {
  $( 'input[name="rot-x"]' ).val( rotationValues[ 0 ] );
  $( 'input[name="rot-y"]' ).val( rotationValues[ 1 ] );
  $( 'input[name="rot-z"]' ).val( rotationValues[ 2 ] );
  $( 'input[name="rot-degree"]' ).val( rotationValues[ 3 ] );
}



//     setTranslationInputs(translationValues): Takes the translation values as an array of 3 floats
//                        as an argument.  Populates the translation input fields with these values.
function setTranslationInputs( translationValues ) {
  $( 'input[name="trnslt-x"]' ).val( translationValues[ 0 ] );
  $( 'input[name="trnslt-y"]' ).val( translationValues[ 1 ] );
  $( 'input[name="trnslt-z"]' ).val( translationValues[ 2 ] );
}