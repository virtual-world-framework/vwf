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
//     getWorldTransformParameters(): No parameters.  Returns array of 16 floats, populated from World Transformation input fields.
//     getTransformParameters(): No parameters.  Returns array of 16 floats, populated from the Transform input fields.
//     getTranslationParameters(): No parameters.  Returns array of 3 floats, populated from the Translation input fields.
//     getRotationParameters(): No parameters.  Returns array of 4 floats, populated from the Rotation input fields.
//     getQuaternionParameters(): No parameters.  Returns array of 4 floats, populated from the Quaternion input fields.
//     getScaleParameter(): No parameters.  Returns a single float, populated from the Scale input field.
//     getSetPropertyExampleParameter(): No parameters.  Returns a single string, populated from the Set Property Example input field.
//     getTimePeriodParameter(): No parameters.  Returns a single float, populated from the Time Period input field.
//     getSelectedNodeId(): No parameters.  Returns a string, populated with the NodeId of the currently selected node (hello or world).
//     setWorldTransformInputs(worldTransformValues): Takes the world transform values as an array of 16 floats as an argument.
//                                                    Populates the world transform input fields with these values.
//     setTransformInputs(transformValues): Takes the transform values as an array of 16 floats as an argument.  Populates the
//                                          transform input fields with these values.
//     setScaleInputs(scaleValues): Takes the scale values as an array of 1 float as an argument.  Populates the
//                                  scale input field with this value.
//     setQuaternionInputs(quaternionValues): Takes the quaternion values as an array of 4 floats as an argument.  Populates the
//                                            quaternion input fields with these values.
//     setTranslationInputs(translationValues): Takes the translation values as an array of 3 floats as an argument.  Populates the
//                                              translation input fields with these values.


function getWorldTransformParameters() {
  var wrldResult = [1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0];
  var parseAttempt;
  parseAttempt = parseFloat($('input[name="wt00"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[0] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt01"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[1] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt02"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[2] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt03"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[3] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt10"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[4] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt11"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[5] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt12"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[6] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt13"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[7] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt20"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[8] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt21"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[9] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt22"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[10] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt23"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[11] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt30"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[12] = parseAttempt;
  }
   parseAttempt = parseFloat($('input[name="wt31"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[13] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt32"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[14] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="wt33"]').val());
  if (!(isNaN(parseAttempt)))
  {
    wrldResult[15] = parseAttempt;
  }
  return wrldResult;
}

function getTransformParameters() {
  var trnsfrmResult = [1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0,0.0,0.0,0.0,0.0,1.0];
  var parseAttempt;
  parseAttempt = parseFloat($('input[name="trfrm00"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[0] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm01"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[1] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm02"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[2] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm03"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[3] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm10"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[4] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm11"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[5] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm12"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[6] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm13"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[7] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm20"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[8] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm21"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[9] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm22"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[10] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm23"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[11] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm30"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[12] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm31"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[13] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm32"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[14] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trfrm33"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnsfrmResult[15] = parseAttempt;
  }
  return trnsfrmResult;
}

function getTranslationParameters()  {
  var trnslateResult = [0.0,0.0,0.0];
  var parseAttempt;
  parseAttempt = parseFloat($('input[name="trnslt-x"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnslateResult[0] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trnslt-y"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnslateResult[1] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="trnslt-z"]').val());
  if (!(isNaN(parseAttempt)))
  {
    trnslateResult[2] = parseAttempt;
  }
  return trnslateResult;
}

function getRotationParameters() {
  var rotateResult = [0.0,0.0,1.0,0.0];
  var parseAttempt;
  parseAttempt = parseFloat($('input[name="rot-x"]').val());
  if (!(isNaN(parseAttempt)))
  {
    rotateResult[0] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="rot-y"]').val());
  if (!(isNaN(parseAttempt)))
  {
    rotateResult[1] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="rot-z"]').val());
  if (!(isNaN(parseAttempt)))
  {
    rotateResult[2] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="rot-degree"]').val());
  if (!(isNaN(parseAttempt)))
  {
    rotateResult[3] = parseAttempt;
  }
  return rotateResult;
}

function getQuaternionParameters() {
  var quatResult = [0.0,0.0,1.0,0.0];
  var parseAttempt;
  parseAttempt = parseFloat($('input[name="quat-x"]').val());
  if (!(isNaN(parseAttempt)))
  {
    quatResult[0] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="quat-y"]').val());
  if (!(isNaN(parseAttempt)))
  {
    quatResult[1] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="quat-z"]').val());
  if (!(isNaN(parseAttempt)))
  {
    quatResult[2] = parseAttempt;
  }
  parseAttempt = parseFloat($('input[name="quat-degree"]').val());
  if (!(isNaN(parseAttempt)))
  {
    quatResult[3] = parseAttempt;
  }
  return quatResult;
}

function getScaleParameter() {
  var parseAttempt;
  parseAttempt = parseFloat($('input[name="scale-ratio"]').val());
  if (isNaN(parseAttempt))
  {
    return 1.0;
  }
  return parseAttempt;
}

function getSetPropertyExampleParameter() {
  return $('input[name="setpropdemo"]').val();
}

function getTimePeriodParameter() {
  var parseAttempt;
  parseAttempt = parseFloat($('input[name="timeperiod"]').val());
  if (isNaN(parseAttempt))
  {
    return 3.0;
  }
  return parseAttempt;
}

function getSelectedNodeId() {
  return vwf_view.kernel.find("", $('input[name="objectselect"]:checked').val())[0];
}

function setWorldTransformInputs(worldTransformValues) {
  $('input[name="wt00"]').val(worldTransformValues[0]);
  $('input[name="wt01"]').val(worldTransformValues[1]);
  $('input[name="wt02"]').val(worldTransformValues[2]);
  $('input[name="wt03"]').val(worldTransformValues[3]);
  $('input[name="wt10"]').val(worldTransformValues[4]);
  $('input[name="wt11"]').val(worldTransformValues[5]);
  $('input[name="wt12"]').val(worldTransformValues[6]);
  $('input[name="wt13"]').val(worldTransformValues[7]);
  $('input[name="wt20"]').val(worldTransformValues[8]);
  $('input[name="wt21"]').val(worldTransformValues[9]);
  $('input[name="wt22"]').val(worldTransformValues[10]);
  $('input[name="wt23"]').val(worldTransformValues[11]);
  $('input[name="wt30"]').val(worldTransformValues[12]);
  $('input[name="wt31"]').val(worldTransformValues[13]);
  $('input[name="wt32"]').val(worldTransformValues[14]);
  $('input[name="wt33"]').val(worldTransformValues[15]);
}

function setTransformInputs(transformValues) {
  $('input[name="trfrm00"]').val(transformValues[0]);
  $('input[name="trfrm01"]').val(transformValues[1]);
  $('input[name="trfrm02"]').val(transformValues[2]);
  $('input[name="trfrm03"]').val(transformValues[3]);
  $('input[name="trfrm10"]').val(transformValues[4]);
  $('input[name="trfrm11"]').val(transformValues[5]);
  $('input[name="trfrm12"]').val(transformValues[6]);
  $('input[name="trfrm13"]').val(transformValues[7]);
  $('input[name="trfrm20"]').val(transformValues[8]);
  $('input[name="trfrm21"]').val(transformValues[9]);
  $('input[name="trfrm22"]').val(transformValues[10]);
  $('input[name="trfrm23"]').val(transformValues[11]);
  $('input[name="trfrm30"]').val(transformValues[12]);
  $('input[name="trfrm31"]').val(transformValues[13]);
  $('input[name="trfrm32"]').val(transformValues[14]);
  $('input[name="trfrm33"]').val(transformValues[15]);
}

function setScaleInputs(scaleValues) {
  $('input[name="scale-ratio"]').val(scaleValues[0]); 
}

function setQuaternionInputs(quaternionValues) {
  $('input[name="quat-x"]').val(quaternionValues[0]);
  $('input[name="quat-y"]').val(quaternionValues[1]);
  $('input[name="quat-z"]').val(quaternionValues[2]);
  $('input[name="quat-degree"]').val(quaternionValues[3]);
}

function setRotationInputs(rotationValues) {
  $('input[name="rot-x"]').val(rotationValues[0]);
  $('input[name="rot-y"]').val(rotationValues[1]);
  $('input[name="rot-z"]').val(rotationValues[2]);
  $('input[name="rot-degree"]').val(rotationValues[3]);
}

function setTranslationInputs(translationValues) {
  $('input[name="trnslt-x"]').val(translationValues[0]);
  $('input[name="trnslt-y"]').val(translationValues[1]);
  $('input[name="trnslt-z"]').val(translationValues[2]);
}