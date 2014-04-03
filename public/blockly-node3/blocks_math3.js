




Blockly.Blocks['type_vector3'] = {
  valueType: 'Vector3',
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(210);
    this.appendValueInput("XVALUE")
        .setCheck("Number")
        .appendField("x");
    this.appendValueInput("YVALUE")
        .setCheck("Number")
        .appendField("y");
    this.appendValueInput("ZVALUE")
        .setCheck("Number")
        .appendField("z");
    this.setInputsInline(true);
    this.setOutput(true, 'Type');
    this.setTooltip('');
  }
};



// Blockly.JavaScript['type_vector3'] = function(block) {
//   var value_xvalue = Blockly.JavaScript.valueToCode(block, 'XVALUE', Blockly.JavaScript.ORDER_ATOMIC);
//   var value_yvalue = Blockly.JavaScript.valueToCode(block, 'YVALUE', Blockly.JavaScript.ORDER_ATOMIC);
//   var value_zvalue = Blockly.JavaScript.valueToCode(block, 'ZVALUE', Blockly.JavaScript.ORDER_ATOMIC);
//   // TODO: Assemble JavaScript into code variable.
//   var code = "["+value_xvalue+","+value_yvalue+","+value_zvalue+"]";
//   // TODO: Change ORDER_NONE to the correct strength.
//   return [code, Blockly.JavaScript.ORDER_NONE];
// };


Blockly.Blocks['type_vector4'] = {
  valueType: 'Vector4',
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(210);
    this.appendValueInput("XVALUE")
        .setCheck("Number")
        .appendField("x");
    this.appendValueInput("YVALUE")
        .setCheck("Number")
        .appendField("y");
    this.appendValueInput("ZVALUE")
        .setCheck("Number")
        .appendField("z");
    this.appendValueInput("WVALUE")
        .setCheck("Number")
        .appendField("w");
    this.setInputsInline(true);
    this.setOutput(true, 'Type');
    this.setTooltip('');
  }
};

// Blockly.JavaScript['math_vector4'] = function(block) {
//   var value_xvalue = Blockly.JavaScript.valueToCode(block, 'XVALUE', Blockly.JavaScript.ORDER_ATOMIC);
//   var value_yvalue = Blockly.JavaScript.valueToCode(block, 'YVALUE', Blockly.JavaScript.ORDER_ATOMIC);
//   var value_zvalue = Blockly.JavaScript.valueToCode(block, 'ZVALUE', Blockly.JavaScript.ORDER_ATOMIC);
//   var value_wvalue = Blockly.JavaScript.valueToCode(block, 'WVALUE', Blockly.JavaScript.ORDER_ATOMIC);
//   // TODO: Assemble JavaScript into code variable.
//   var code = "["+value_xvalue+","+value_yvalue+","+value_zvalue+","+value_wvalue+"]";
//   // TODO: Change ORDER_NONE to the correct strength.
//   return [code, Blockly.JavaScript.ORDER_NONE];
// };







