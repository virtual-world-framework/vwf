define(function(){

	var HelpManager = {};
	var isInitialized = false;
	return {
		getSingleton : function(){
			if(!isInitialized)
			{
				initialize.call(HelpManager);
				isInitialized = true;
				
			}
			return HelpManager;
		}
	}
	function initialize()
	{
$(document.body).append('<div id="welcomescreen" />');

$('#welcomescreen').append('<p style="text-align: center;">'+
'			<span style="font-size:36px;"><span style="font-family: arial, helvetica, sans-serif;">Welcome!</span></span></p>'+
'		<p>'+
'			<span style="font-size:12px;"><span style="font-family: arial, helvetica, sans-serif;">If you&#39;ve found your way here, you must be interested in virtual environments, scenario based training, or modeling and simulation. The VWF Sandbox is a application built on the Virtual World Framework that demonstrates the capabilities of this robust simulation engine. The VWF is a project funded by the Office of the Secretary of Defense that hopes to lower the barriers to creating immerisve training experiances. The VWF is an entirely client side, multiuser simulation environment. This means that user can experiance the immersive 3D content you create without download or installing any software on their computer. This is possible though cutting edge HTML technologies, including WebGL, WebSockets, and ECMAScript 5. Please take a while to play with this tool and see the capabilities of the VWF as a platform. </span></span></p>'+
		'<p>'+
			'<span style="font-size:12px;"><span style="font-family: arial, helvetica, sans-serif;">You&#39;re seeing this message becase you&#39;ve entered an empty world. This world is yours to create using the tools you see in front of you. All content will be backed up on our servers when you leave, so you can come back at another time or from another computer and continue building. You can even invite others to join you in this world, or browse worlds created by other people. To invite someone to this world, simply email them the exact text of your browsers URL. This URL contains a randomly generated ID that will always bring you back to this world. To see other worlds that already exist, click &quot;File-&gt;Change Instance&quot; on the menu above. &nbsp; &nbsp;</span></span></p>')

$('#welcomescreen').dialog({title:"Welcome to the VWF Sandbox",autoOpen:false,modal:true,width:'700px',height:'auto',position:'center',moveable:false,resizable:false,buttons:{
"Start Building!":function()
{
	$('#welcomescreen').dialog('close');
	_UserManager.showLogin();
},
"Visit an Existing World":function()
{
	$('#welcomescreen').dialog('close');
	_DataManager.chooseInstance();
}
}});

function showWelcomeScreen()
{
	$('#welcomescreen').dialog('open');
}
function startHelp()
{
	//if(vwf.models[0].model.nodes['index-vwf'].children.length == 1)
		showWelcomeScreen();
}
function PointAt(div,callback)
{
	var left1;
	var top1;
	if(typeof div === "string")
	{
	 left1 = $('#'+div).offset().left;
	 top1 = $('#'+div).offset().top;
	}else
	{
		left1 = div[0];
		top1 = div[1];
	}
	var width = $(window).width();
	var height = $(window).height();
	var centerx = width/2;
	var centery = height/2;
	var leftoffset = left1 - centerx;
	var topoffset = top1 - centery;
	var tan = Math.abs(leftoffset)/Math.abs(topoffset);
	var deg = 0;//Math.atan(tan) * 57.2957795;
	if(leftoffset > 0 && topoffset > 0)
	{
		deg = 45;
	}
	if(leftoffset < 0 && topoffset > 0)
	{
		deg = 45+90;
	}
	if(leftoffset > 0 && topoffset < 0)
	{
		deg = 300;
	}
	if(leftoffset < 0 && topoffset < 0)
	{
		deg = 220;
	}
	
	var x = 45;
	var y = 50;
	var cs = Math.cos(deg/ 57.2957795);
    var sn = Math.sin(deg/ 57.2957795);
	var ox = x * cs - y * sn;
	var oy = x * sn + y * cs;
	
	var left = (left1 +0) + 'px';
	var top =  (top1-64) + 'px';
	var rot = deg;
	$('#TutorialArrow').attr('targetRot',rot);
	$('#TutorialArrow').animate({  left:left,top:top }, {
    step: function(now,fx) {
		
	  var currentrot = parseFloat($('#TutorialArrow').attr('currentRot'));
	  var targetrot = parseFloat($('#TutorialArrow').attr('targetRot'));
	  currentrot = currentrot + (targetrot-currentrot)*.05;
	  $('#TutorialArrow').attr('currentRot',currentrot);
	  currentrot += 180;
      $(this).css('-webkit-transform','rotate('+currentrot+'deg)');
      $(this).css('-moz-transform','rotate('+currentrot+'deg)'); 
      $(this).css('transform','rotate('+currentrot+'deg)');  
    },
	complete:function()
	{
		window.setTimeout(function(){
		if(callback)callback();},1000);
	},
    duration:1500
	},'linear');
}
function PointAtAndClick(div,callback)
{
	var left1 = $('#'+div).offset().left;
	var top1 = $('#'+div).offset().top;
	var width = $(window).width();
	var height = $(window).height();
	var centerx = width/2;
	var centery = height/2;
	var leftoffset = left1 - centerx;
	var topoffset = top1 - centery;
	var tan = Math.abs(leftoffset)/Math.abs(topoffset);
	var deg = 0;//Math.atan(tan) * 57.2957795;
	if(leftoffset > 0 && topoffset > 0)
	{
		deg = 45;
	}
	if(leftoffset < 0 && topoffset > 0)
	{
		deg = 45+90;
	}
	if(leftoffset > 0 && topoffset < 0)
	{
		deg = 300;
	}
	if(leftoffset < 0 && topoffset < 0)
	{
		deg = 220;
	}
	
	var x = 45;
	var y = 50;
	var cs = Math.cos(deg/ 57.2957795);
    var sn = Math.sin(deg/ 57.2957795);
	var ox = x * cs - y * sn;
	var oy = x * sn + y * cs;
	
	var left = (left1 +0) + 'px';
	var top =  (top1-64) + 'px';
	var rot = deg;
	$('#TutorialArrow').attr('targetRot',rot);
	$('#TutorialArrow').animate({  left:left,top:top }, {
    step: function(now,fx) {
		
	  var currentrot = parseFloat($('#TutorialArrow').attr('currentRot'));
	  var targetrot = parseFloat($('#TutorialArrow').attr('targetRot'));
	  currentrot = currentrot + (targetrot-currentrot)*.05;
	  $('#TutorialArrow').attr('currentRot',currentrot);
	  currentrot += 180;
      $(this).css('-webkit-transform','rotate('+currentrot+'deg)');
      $(this).css('-moz-transform','rotate('+currentrot+'deg)'); 
      $(this).css('transform','rotate('+currentrot+'deg)');  
    },
	complete:function()
	{
		$('#'+div).mouseover();
		window.setTimeout(function(){
		$('#'+div).click();
		if(callback)callback();},1000);
	},
    duration:1500
	},'linear');
}
function tutStep13()
{
		$(document).unbind('selectionTransformedLocal',tutStep13);
		_Notifier.alert('Good! You`ve manually typed in a transformation on this object. You can also modify some other properties of the sphere.',function(){
			_Notifier.alert('Now, lets look at some of the properties this object allows you to modify',tutStep11);
	});
}
function tutStep12()
{
		_Notifier.alert('As you can see, this window shows you the transforms for the object. Type a number in one of these fields, and hit enter.',function(){
			$(document).bind('selectionTransformedLocal',tutStep13);
		});	
}
function tutStep11()
{
	PointAtAndClick('MenuObjectPropertiesicon',tutStep12)
}
function tutStep10()
{
	$(document).unbind('selectionTransformedLocal',tutStep10)
	_Notifier.alert('Good! You`ve used the transform tools to move, rotate, or scale this object.',function(){
			_Notifier.alert('Now, lets look at some of the properties this object allows you to modify',tutStep11);
	});
}
function tutStep9()
{
		_Notifier.alert('Click and drag on one of the bright axis lines to move the sphere. Go ahead and try it.',function(){
			$(document).bind('selectionTransformedLocal',tutStep10);
		});	
}
function tutStep8()
{
			_Notifier.notify('Scale Tool');
			PointAtAndClick('MenuScaleicon',tutStep9)
}
function tutStep7()
{
			_Notifier.notify('Rotate Tool');
			PointAtAndClick('MenuRotateicon',tutStep8)
}
function tutStep6()
{
	_Editor.SelectObject(vwf.models[0].model.nodes['index-vwf'].children[2].id);
	window.setTimeout(function()
	{
		_Notifier.alert('You should now see a white outline indicating that the box is selected. Lets look at the transform tools.',function(){
			_Notifier.notify('Move Tool');
			PointAtAndClick('MenuMoveicon',tutStep7)
		});	
	}
	,1000);
}
function tutStep5()
{
	_Notifier.alert('We`re now in "Select" mode.  This allows you to select objects to edit by clicking on them.',function(){
		PointAt([$(window).width()/2,$(window).height()/2],tutStep6)
	});	
}
function tutStep4()
{
	_Notifier.alert('You should see a white sphere. Lets select it so we can move it.',function(){
		PointAtAndClick('MenuSelectPickicon',tutStep5)
	});	
}
function tutStep3()
{
		PointAt([$(window).width()/2,$(window).height()/2],tutStep4)	
}
function tutStep2a()
{
PointAtAndClick('MenuCreateSphereicon',tutStep3)
}
function tutStep2()
{
	
	_Notifier.alert('First, lets create a simple object. I`ll click the "Sphere" button to create a sphere at the center of our view.',tutStep2a);	
}
function StartTutorial()
{
	$('#TutorialArrow').remove();
	$(document.body).append('<img src="./images/tutorialArrow.png" id="TutorialArrow" />');
	$('#TutorialArrow').css('z-index',100000);
	$('#TutorialArrow').css('position','fixed');
	$('#TutorialArrow').css('left','0px');
	$('#TutorialArrow').css('top','0px');
	$('#TutorialArrow').css('width','128px');
	$('#TutorialArrow').attr('currentRot',0);
	$('#TutorialArrow').css('-webkit-transform-origin','0% 50%');
	//PointAtAndClick('MenuScriptEditoricon',tutStep2)
	_Notifier.alert('Welcome to the VWF Sandbox tutorial. This presentation will show you some of the system features. You`ll see text appear in boxes like this one, and arrows will show you where the demo clicks. Please don`t interact with the system except when prompted to do so.',tutStep2);	
}
window.startHelp = startHelp 
}});