
// node3 == castShadows ================================================

Blockly.Blocks[ 'node3_castShadows' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "CASTSHADOWS" )
        .setCheck( "Boolean" )
        .appendField( "castShadows" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_castShadows' ] = function( block ) {
  var value_castShadows = Blockly.JavaScript.valueToCode(block, 'CASTSHADOWS', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == receiveShadows ================================================

Blockly.Blocks[ 'node3_receiveShadows' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "RECEIVESHADOWS" )
        .setCheck( "Boolean" )
        .appendField( "receiveShadows" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_receiveShadows' ] = function( block ) {
  var value_receiveShadows = Blockly.JavaScript.valueToCode(block, 'RECEIVESHADOWS', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == worldTransform ================================================

Blockly.Blocks[ 'node3_worldTransform' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "WORLDTRANSFORM" )
        .setCheck( "String" )
        .appendField( "worldTransform" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_worldTransform' ] = function( block ) {
  var value_worldTransform = Blockly.JavaScript.valueToCode(block, 'WORLDTRANSFORM', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == transform ================================================

Blockly.Blocks[ 'node3_transform' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "TRANSFORM" )
        .setCheck( "String" )
        .appendField( "transform" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};


Blockly.JavaScript[ 'node3_transform' ] = function( block ) {
  var value_transform = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == translation ================================================

Blockly.Blocks[ 'node3_translation' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "TRANSLATION" )
        .setCheck( "Vector3" )
        .appendField( "translation" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};


Blockly.JavaScript[ 'node3_translation' ] = function( block ) {
  var value_translation = Blockly.JavaScript.valueToCode(block, 'TRANSLATION', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};


// node3 == rotation ================================================

Blockly.Blocks[ 'node3_rotation' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "ROTATION" )
        .setCheck( "Vector3" )
        .appendField( "rotation" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};


Blockly.JavaScript[ 'node3_rotation' ] = function( block ) {
  var value_translation = Blockly.JavaScript.valueToCode(block, 'ROTATION', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == scale ================================================

Blockly.Blocks[ 'node3_scale' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "SCALE" )
        .setCheck( "Vector3" )
        .appendField( "scale" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};


Blockly.JavaScript[ 'node3_scale' ] = function( block ) {
  var value_translation = Blockly.JavaScript.valueToCode(block, 'SCALE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};


// node3 == quaternion ================================================

Blockly.Blocks[ 'node3_quaternion' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "QUATERNION" )
        .setCheck( "Vector4" )
        .appendField( "quaternion" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};


Blockly.JavaScript[ 'node3_quaternion' ] = function( block ) {
  var value_translation = Blockly.JavaScript.valueToCode(block, 'QUATERNION', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == enabled ================================================

Blockly.Blocks[ 'node3_enabled' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "ENABLED" )
        .setCheck( "Boolean" )
        .appendField( "enabled" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_enabled' ] = function( block ) {
  var value_enabled = Blockly.JavaScript.valueToCode(block, 'ENABLED', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};


// node3 == visible ================================================

Blockly.Blocks[ 'node3_visible' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "VISIBLE" )
        .setCheck( "Boolean" )
        .appendField( "visible" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_visible' ] = function( block ) {
  var value_visible = Blockly.JavaScript.valueToCode(block, 'VISIBLE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == playing ================================================

Blockly.Blocks[ 'node3_playing' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "PLAYING" )
        .setCheck( "Boolean" )
        .appendField( "playing" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_playing' ] = function( block ) {
  var value_playing = Blockly.JavaScript.valueToCode(block, 'PLAYING', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == looping ================================================

Blockly.Blocks[ 'node3_looping' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "LOOPING" )
        .setCheck( "Boolean" )
        .appendField( "looping" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_looping' ] = function( block ) {
  var value_looping = Blockly.JavaScript.valueToCode(block, 'LOOPING', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == speed ================================================

Blockly.Blocks[ 'node3_speed' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "SPEED" )
        .setCheck( "Number" )
        .appendField( "speed" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_speed' ] = function( block ) {
  var value_speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3 == lookAt ================================================

Blockly.Blocks[ 'node3_lookAt' ] = {
  init: function() {
    this.setHelpUrl( 'http://www.example.com/' );
    this.setColour( 105 );
    this.appendValueInput( "LOOKAT" )
        .setCheck( "String" )
        .appendField( "lookAt" );
    this.setInputsInline( true );
    this.setPreviousStatement( true );
    this.setNextStatement( true );
    this.setTooltip( '' );
  }
};

Blockly.JavaScript[ 'node3_lookAt' ] = function( block ) {
  var value_lookAt = Blockly.JavaScript.valueToCode(block, 'LOOKAT', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = '...';
  return code;
};

// node3_animation == translateBy ================================================

Blockly.Blocks['node3_animation_translateBy'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'translateBy' );
    this.appendValueInput("TRANSLATION")
        .setCheck("Vector3")
        .appendField("translation");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_translateBy'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'TRANSLATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['translateBy','"+dist+"','"+t+"']);\n";
};

// node3_animation == translateTo ================================================

Blockly.Blocks['node3_animation_translateTo'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'translateTo' );
    this.appendValueInput("TRANSLATION")
        .setCheck("Vector3")
        .appendField("translation");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_translateTo'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'TRANSLATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['translateTo','"+dist+"','"+t+"']);\n";
};

// node3_animation == rotateBy ================================================

Blockly.Blocks['node3_animation_rotateBy'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'rotateBy' );
    this.appendValueInput("ROTATION")
        .setCheck("Vector3")
        .appendField("rotation");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_rotateBy'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'ROTATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['rotateBy','"+dist+"','"+t+"']);\n";
};

// node3_animation == rotateTo ================================================

Blockly.Blocks['node3_animation_rotateTo'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'rotateTo' );
    this.appendValueInput("ROTATION")
        .setCheck("Vector3")
        .appendField("rotation");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_rotateTo'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'ROTATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['rotateTo','"+dist+"','"+t+"']);\n";
};

// node3_animation == quaterniateBy ================================================

Blockly.Blocks['node3_animation_quaterniateBy'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'quaterniateBy' );
    this.appendValueInput("QUATERNION")
        .setCheck("Vector4")
        .appendField("quaternion");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_quaterniateBy'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'QUATERNION', Blockly.JavaScript.ORDER_NONE) || '[0,0,1,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['quaterniateBy','"+dist+"','"+t+"']);\n";
};

// node3_animation == quaterniateTo ================================================

Blockly.Blocks['node3_animation_quaterniateTo'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'quaterniateTo' );
    this.appendValueInput("QUATERNION")
        .setCheck("Vector4")
        .appendField("quaternion");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_quaterniateTo'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'QUATERNION', Blockly.JavaScript.ORDER_NONE) || '[0,0,1,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['quaterniateTo','"+dist+"','"+t+"']);\n";
};

// node3_animation == transformBy ================================================

Blockly.Blocks['node3_animation_transformBy'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'transformBy' );
    this.appendValueInput("TRANSFORM")
        .setCheck("String")
        .appendField("transform");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_transformBy'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['transformBy','"+dist+"','"+t+"']);\n";
};

// node3_animation == transformTo ================================================

Blockly.Blocks['node3_animation_transformTo'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'transformTo' );
    this.appendValueInput("TRANSFORM")
        .setCheck("String")
        .appendField("transform");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_transformTo'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['transformTo','"+dist+"','"+t+"']);\n";
};

// node3_animation == transformBy ================================================

Blockly.Blocks['node3_animation_transformBy'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'transformBy' );
    this.appendValueInput("TRANSFORM")
        .setCheck("String")
        .appendField("transform");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_transformBy'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['transformBy','"+dist+"','"+t+"']);\n";
};

// node3_animation == worldTransformTo ================================================

Blockly.Blocks['node3_animation_worldTransformTo'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'worldTransformTo' );
    this.appendValueInput("TRANSFORM")
        .setCheck("String")
        .appendField("worldTransform");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_worldTransformTo'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['worldTransformTo','"+dist+"','"+t+"']);\n";
};

// node3_animation == worldTransformBy ================================================

Blockly.Blocks['node3_animation_worldTransformBy'] = {
  // Block for moving forward.
  init: function() {
    this.setHelpUrl('');
    this.setColour(110);
    this.appendDummyInput()
        .appendField( 'worldTransformBy' );
    this.appendValueInput("TRANSFORM")
        .setCheck("String")
        .appendField("worldTransform");
    this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("duration");
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setTooltip('');
  }
};

Blockly.JavaScript['node3_animation_worldTransformBy'] = function(block) {
  var id = Blockly.Blocks.vwfNodes[ "player" ];
  var dist = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "vwf.callMethod('"+id+"','executeBlocklyCmd',['worldTransformBy','"+dist+"','"+t+"']);\n";
};


