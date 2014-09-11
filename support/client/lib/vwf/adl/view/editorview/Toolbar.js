define({
    initialize: function() {


        (function($) {
            $.fn.dragScroll = function(options) {
                /* Mouse dragg scroll */
                var x, y, top, left, down, moved;
                var $scrollArea = $(this);

                $($scrollArea).attr("onselectstart", "return false;"); // Disable text selection in IE8

                $($scrollArea).mousedown(function(e) {
                    e.preventDefault();
                    down = true;
                    x = e.pageX;
                    y = e.pageY;
                    top = $(this).scrollTop();
                    left = $(this).scrollLeft();
                });
                $($scrollArea).mouseleave(function(e) {
                    down = false;
                });
                $("body").mousemove(function(e) {
                    if (down) {
                        var newX = e.pageX;
                        var newY = e.pageY;
                        $($scrollArea).scrollTop(top - newY + y);
                        $($scrollArea).scrollLeft(left - newX + x);
                    }
                });
                $("body").mouseup(function(e) {
                    if (down) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        down = false;
                        return false;
                    }
                });
            };
        })(jQuery);


        function createIcon(src, menuitemname, tooltip) {

            var translatedTooltip = i18n.t(tooltip);

            var iconname = menuitemname + "icon";
            var mn = menuitemname;
            $('#toolbar').dragScroll();

            $('#toolbar').append('<div src="' + src + '" id="' + iconname + '" class="icon ' + src + '" />');
            $('#' + iconname).click(function() {
                $('#' + mn).click();

                $(".ddsmoothmenu").find('li').trigger('mouseleave');
            });
            $('#' + iconname).tooltip({
                content: translatedTooltip,
                items: "div",
                show: {
                    delay: 500
                }
            });
        }



        function createSeperator() {
            $('#toolbar').append('<div class="seperator" />');
        }
        createIcon('logout', 'MenuLogIn', 'Log In');
        createIcon('login', 'MenuLogOut', 'Log Out');
        createSeperator();
        createIcon('undo', 'MenuUndo', 'Undo (ctrl-z)');
        createIcon('redo', 'MenuRedo', 'Redo (ctrl-y)');
        createSeperator();
        createIcon('move', 'MenuMove', 'Move Tool');
        createIcon('rotate', 'MenuRotate', 'Rotate Tool');
        createIcon('scale', 'MenuScale', 'Scale Tool');
        createSeperator();
        createIcon('worldspace', 'MenuWorld', 'Use World Coordinates');
        createIcon('localspace', 'MenuLocal', 'Use Local Coordinates');
        createSeperator();
        createIcon('pick', 'MenuSelectPick', 'Select by clicking');
        createIcon('selectnone', 'MenuSelectNone', 'Select None');
        createSeperator();
        createIcon('copy', 'MenuCopy', 'Copy');
        createIcon('paste', 'MenuPaste', 'Paste');
        createIcon('duplicate', 'MenuDuplicate', 'Duplicate');
        createIcon('save', 'MenuSaveCopy', 'Save to Inventory');
        createIcon('delete', 'MenuDelete', 'Delete');
        createSeperator();
        createIcon('link', 'MenuSetParent', 'Link');
        createIcon('unlink', 'MenuRemoveParent', 'Unlink');
        createIcon('up', 'MenuSelectParent', 'Select Parent');
        createSeperator();
        createIcon('camera', 'MenuCameraOrbit', 'Orbit Camera');
        createIcon('firstperson', 'MenuCamera3RDPerson', 'First Person Camera');
        createIcon('navigate', 'MenuCameraNavigate', 'Navigation Camera');
        createIcon('free', 'MenuCameraFree', 'Free Camera');
        createIcon('target', 'MenuFocusSelected', 'Focus to selected object');
        createSeperator();
        createIcon('sphere', 'MenuCreateSphere', 'Create Sphere');
        createIcon('cube', 'MenuCreateBox', 'Create Box');
        createIcon('cylinder', 'MenuCreateCylinder', 'Create Cylinder');
        createIcon('cone', 'MenuCreateCone', 'Create Cone');
        createIcon('plane', 'MenuCreatePlane', 'Create Plane');
        createSeperator();
        createIcon('users', 'MenuUsers', 'Show Users Window');
        createIcon('chat', 'MenuChat', 'Show Chat Window');
        createIcon('material', 'MenuMaterialEditor', 'Show Material Editor Window');
        createIcon('script', 'MenuScriptEditor', 'Show Script Editor Window');
        createIcon('properties', 'MenuObjectProperties', 'Show Object Properties Window');
        createIcon('models', 'MenuModels', 'Show Model Library Window');
        createIcon('inventory', 'MenuInventory', 'Show Inventory Window');
        createIcon('hierarchy', 'MenuHierarchyManager', 'Show Hierarchy Window');
        createIcon('physics', 'MenuPhysicsEditor', 'Show Hierarchy Window');
        $('#MenuCameraOrbiticon').addClass('iconselected');
        $('#MenuMoveicon').addClass('iconselected');
        $('#MenuWorldicon').addClass('iconselected');
        $('#MenuLogOuticon').addClass('icondisabled');
    }
});