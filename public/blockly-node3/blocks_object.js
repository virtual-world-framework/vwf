
<<<<<<< HEAD
// node3_objects =====================================
=======
>>>>>>> 096021f97cf2450fb4d3b4f4af831470e75586c7

Blockly.Blocks['node3_objects'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
<<<<<<< HEAD
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["redCube", "REDCUBE"], ["greenSphere", "GREENSPHERE"], ["blueCube", "BLUECUBE"], ["blueSphere", "BLUESPHERE"]]), "NODE3_NAME");
    this.appendStatementInput("NODE3_STATEMENTS");
    this.setInputsInline(true);
=======
    this.setColour(359);
    this.appendValueInput("NODE3NAME")
        .appendField("node3Name");
>>>>>>> 096021f97cf2450fb4d3b4f4af831470e75586c7
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

<<<<<<< HEAD
Blockly.JavaScript['node3_objects'] = function(block) {
  var statements_name = Blockly.JavaScript.statementToCode(block, 'NODE3_STATEMENTS');
  var dropdown_node3_name = block.getFieldValue('NODE3_NAME');
  var code = '';
  var id = Blockly.Blocks.vwfNodes[ dropdown_node3_name ];
  if ( id !== undefined ) {

  }
  // TODO: Assemble JavaScript into code variable.
  return code;
};


=======



Blockly.JavaScript['node3_objects'] = function(block) {
  var value_node3name = Blockly.JavaScript.valueToCode(block, 'NODE3NAME', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};
>>>>>>> 096021f97cf2450fb4d3b4f4af831470e75586c7
