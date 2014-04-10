
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
  var shadows = Blockly.JavaScript.valueToCode(block, 'CASTSHADOWS', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.castShadows='+shadows+";\n";
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
  var shadows = Blockly.JavaScript.valueToCode(block, 'RECEIVESHADOWS', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.receiveShadows='+shadows+";\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'WORLDTRANSFORM', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.worldTransform='+trans+";\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.transform='+trans+";\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSLATION', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.translation='+trans+";\n";
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
  var rot = Blockly.JavaScript.valueToCode(block, 'ROTATION', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.rotation='+rot+";\n";
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
  var scale = Blockly.JavaScript.valueToCode(block, 'SCALE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.scale='+scale+";\n";
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
  var quat = Blockly.JavaScript.valueToCode(block, 'QUATERNION', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = 'this.quaternion='+quat+";\n";
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
  var code = "this.enabled="+value_enabled+";\n";
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
  var visible = Blockly.JavaScript.valueToCode(block, 'VISIBLE', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "this.visible="+visible+";\n";
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
  var playing = Blockly.JavaScript.valueToCode(block, 'PLAYING', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "this.playing="+playing+";\n";
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
  var looping = Blockly.JavaScript.valueToCode(block, 'LOOPING', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "this.looping="+looping+";\n";
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
  var speed = Blockly.JavaScript.valueToCode(block, 'SPEED', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "this.speed="+speed+";\n";
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
  var lookAt = Blockly.JavaScript.valueToCode(block, 'LOOKAT', Blockly.JavaScript.ORDER_ATOMIC);
  // TODO: Assemble JavaScript into code variable.
  var code = "this.lookAt="+lookAt+";\n";
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
        .setCheck("Vector3");
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSLATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var duration = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '1';
  return "this.translateBy("+trans+"','"+t+"']);\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSLATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '1';
  return "this.translateTo("+trans+"','"+t+"']);\n";
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
  var rot = Blockly.JavaScript.valueToCode(block, 'ROTATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '1';
  return "this.rotateBy("+rot+"','"+t+"']);\n";
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
  var rot = Blockly.JavaScript.valueToCode(block, 'ROTATION', Blockly.JavaScript.ORDER_NONE) || '[0,0,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "this.rotateBy("+rot+"','"+t+"']);\n";
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
  var quat = Blockly.JavaScript.valueToCode(block, 'QUATERNION', Blockly.JavaScript.ORDER_NONE) || '[0,0,1,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "this.quaterniateBy("+rot+"','"+t+"']);\n";
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
  var quat = Blockly.JavaScript.valueToCode(block, 'QUATERNION', Blockly.JavaScript.ORDER_NONE) || '[0,0,1,0]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "this.quaterniateBy("+rot+"','"+t+"']);\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "this.transformBy("+trans+"','"+t+"']);\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "this.transformTo("+trans+"','"+t+"']);\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "this.worldTransformTo("+trans+"','"+t+"']);\n";
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
  var trans = Blockly.JavaScript.valueToCode(block, 'TRANSFORM', Blockly.JavaScript.ORDER_NONE) || '[1,0,1,0,0,1,0,0,0,0,1,0,0,0,0,1]';
  var t = Blockly.JavaScript.valueToCode(block, 'DURATION', Blockly.JavaScript.ORDER_NONE) || '0';
  return "this.worldTransformBy("+trans+"','"+t+"']);\n";
};


