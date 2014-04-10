Blockly.Blocks['type_vector2'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(120);
    this.appendValueInput("XVALUE")
        .setCheck("Number")
        .appendField("X");
    this.appendValueInput("YVALUE")
        .setCheck("Number")
        .appendField("Y");
    this.setInputsInline(true);
    this.setOutput(true, "Vector2");
    this.setTooltip('');
  }
};



Blockly.JavaScript['type_vector2'] = function(block) {
  var xvalue = Blockly.JavaScript.valueToCode(block, 'XVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var yvalue = Blockly.JavaScript.valueToCode(block, 'YVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "["+xvalue+","+yvalue+","+zvalue+"]";;
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.JavaScript.ORDER_NONE];
};



Blockly.Blocks['type_vector3'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(210);
    this.appendValueInput("XVALUE")
        .setCheck("Number")
        .appendField("X");
    this.appendValueInput("YVALUE")
        .setCheck("Number")
        .appendField("Y");
    this.appendValueInput("ZVALUE")
        .setCheck("Number")
        .appendField("Z");
    this.setInputsInline(true);
    this.setOutput(true, 'Vector3');
    this.setTooltip('');
  }
};



Blockly.JavaScript['type_vector3'] = function(block) {
  var xvalue = Blockly.JavaScript.valueToCode(block, 'XVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var yvalue = Blockly.JavaScript.valueToCode(block, 'YVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var zvalue = Blockly.JavaScript.valueToCode(block, 'ZVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "["+xvalue+","+yvalue+","+zvalue+"]";
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.JavaScript.ORDER_NONE];
};


Blockly.Blocks['type_vector4'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(210);
    this.appendValueInput("XVALUE")
        .setCheck("Number")
        .appendField("X");
    this.appendValueInput("YVALUE")
        .setCheck("Number")
        .appendField("Y");
    this.appendValueInput("ZVALUE")
        .setCheck("Number")
        .appendField("Z");
    this.appendValueInput("WVALUE")
        .setCheck("Number")
        .appendField("W");
    this.setInputsInline(true);
    this.setOutput(true, 'Vector4');
    this.setTooltip('');
  }
};

Blockly.JavaScript['math_vector4'] = function(block) {
  var xvalue = Blockly.JavaScript.valueToCode(block, 'XVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var yvalue = Blockly.JavaScript.valueToCode(block, 'YVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var zvalue = Blockly.JavaScript.valueToCode(block, 'ZVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  var wvalue = Blockly.JavaScript.valueToCode(block, 'WVALUE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "["+xvalue+","+yvalue+","+zvalue+","+wvalue+"]";
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.JavaScript.ORDER_NONE];
};

Blockly.Blocks['type_boolean'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(230);
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["true", "BOOLEAN_TRUE"], ["false", "BOOLEAN_FALSE"]]), "BOOLEAN");
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setTooltip('');
  }
};

Blockly.JavaScript['type_boolean'] = function(block) {
  var dropdown_boolean = block.getFieldValue('BOOLEAN');
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  // TODO: Change ORDER_NONE to the correct strength.
  return [code, Blockly.JavaScript.ORDER_NONE];
};




