

Blockly.Blocks['node3_objects'] = {
  init: function() {
    this.setHelpUrl('http://www.example.com/');
    this.setColour(359);
    this.appendValueInput("NODE3NAME")
        .appendField("node3Name");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};




Blockly.JavaScript['node3_objects'] = function(block) {
  var value_node3name = Blockly.JavaScript.valueToCode(block, 'NODE3NAME', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};