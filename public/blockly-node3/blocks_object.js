
// node3_objects =====================================

Blockly.Blocks['node3_objects'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([["redCube", "REDCUBE"], ["greenSphere", "GREENSPHERE"], ["blueCube", "BLUECUBE"], ["blueSphere", "BLUESPHERE"]]), "NODE3_NAME");
    this.appendStatementInput("NODE3_STATEMENTS");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

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


