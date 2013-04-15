define(
{
	initialize: function ()
	{
		

		function createIcon(src, menuitemname, tooltip)
		{
			var iconname = menuitemname + "icon";
			var mn = menuitemname;
			$('#toolbar').append('<img src="' + src + '" id="' + iconname + '" class="icon" />');
			$('#' + iconname).click(function ()
			{
				$('#' + mn).click();
				$(this).css('background: -webkit-linear-gradient(left, rgb(317, 138, 139) 0%, rgb(217, 238, 239) 100%);');
				$(".ddsmoothmenu").find('li').trigger('mouseleave');
			});
			$('#' + iconname).qtip(
			{
				content: tooltip,
				show: {
					delay: 1000
				}
			});
		}

		function clearCameraModeIcons()
		{
			$('#MenuCameraOrbiticon').css('background', '');
			$('#MenuCamera3RDPersonicon').css('background', '');
			$('#MenuCameraNavigateicon').css('background', '');
			$('#MenuCameraFreeicon').css('background', '');
		}

		function createSeperator()
		{
			$('#toolbar').append('<div class="seperator" />');
		}
		createIcon('../vwf/view/editorview/images/icons/logout.png', 'MenuLogIn', 'Log In');
		createIcon('../vwf/view/editorview/images/icons/login.png', 'MenuLogOut', 'Log Out');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/Move.png', 'MenuMove', 'Move Tool');
		createIcon('../vwf/view/editorview/images/icons/rotate.png', 'MenuRotate', 'Rotate Tool');
		createIcon('../vwf/view/editorview/images/icons/scale.png', 'MenuScale', 'Scale Tool');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/worldspace.png', 'MenuWorld', 'Use World Coordinates');
		createIcon('../vwf/view/editorview/images/icons/localspace.png', 'MenuLocal', 'Use Local Coordinates');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/pick.png', 'MenuSelectPick', 'Select by clicking');
		createIcon('../vwf/view/editorview/images/icons/selectnone.png', 'MenuSelectNone', 'Select None');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/copy.png', 'MenuCopy', 'Copy');
		createIcon('../vwf/view/editorview/images/icons/paste.png', 'MenuPaste', 'Paste');
		createIcon('../vwf/view/editorview/images/icons/duplicate.png', 'MenuDuplicate', 'Duplicate');
		createIcon('../vwf/view/editorview/images/icons/save.png', 'MenuSaveCopy', 'Save to Inventory');
		createIcon('../vwf/view/editorview/images/icons/delete.png', 'MenuDelete', 'Delete');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/link.png', 'MenuSetParent', 'Link');
		createIcon('../vwf/view/editorview/images/icons/unlink.png', 'MenuRemoveParent', 'Unlink');
		createIcon('../vwf/view/editorview/images/icons/up.png', 'MenuSelectParent', 'Select Parent');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/camera.png', 'MenuCameraOrbit', 'Orbit Camera');
		createIcon('../vwf/view/editorview/images/icons/firstperson.png', 'MenuCamera3RDPerson', 'First Person Camera');
		createIcon('../vwf/view/editorview/images/icons/navigate.png', 'MenuCameraNavigate', 'Navigation Camera');
		createIcon('../vwf/view/editorview/images/icons/free.png', 'MenuCameraFree', 'Free Camera');
		createIcon('../vwf/view/editorview/images/icons/target.png', 'MenuFocusSelected', 'Focus to selected object');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/sphere.png', 'MenuCreateSphere', 'Create Sphere');
		createIcon('../vwf/view/editorview/images/icons/cube.png', 'MenuCreateBox', 'Create Box');
		createIcon('../vwf/view/editorview/images/icons/Cylinder.png', 'MenuCreateCylinder', 'Create Cylinder');
		createIcon('../vwf/view/editorview/images/icons/cone.png', 'MenuCreateCone', 'Create Cone');
		createIcon('../vwf/view/editorview/images/icons/plane.png', 'MenuCreatePlane', 'Create Plane');
		createSeperator();
		createIcon('../vwf/view/editorview/images/icons/users.png', 'MenuUsers', 'Show Users Window');
		createIcon('../vwf/view/editorview/images/icons/chat.png', 'MenuChat', 'Show Chat Window');
		createIcon('../vwf/view/editorview/images/icons/material.png', 'MenuMaterialEditor', 'Show Material Editor Window');
		createIcon('../vwf/view/editorview/images/icons/script.png', 'MenuScriptEditor', 'Show Script Editor Window');
		createIcon('../vwf/view/editorview/images/icons/properties.png', 'MenuObjectProperties', 'Show Object Properties Window');
		createIcon('../vwf/view/editorview/images/icons/models.png', 'MenuModels', 'Show Model Library Window');
		createIcon('../vwf/view/editorview/images/icons/inventory.png', 'MenuInventory', 'Show Inventory Window');
		$('#MenuCameraOrbiticon').css('background', '#9999FF');
		$('#MenuMoveicon').css('background', "#9999FF");
		$('#MenuWorldicon').css('background', "#9999FF");
		$('#MenuLogOuticon').css('background', "#555555");
	}
});