define(function() {
    var PrimEditor = {};
    var isInitialized = false;
    return {
        getSingleton: function() {
            if (!isInitialized) {
                initialize.call(PrimEditor);
                isInitialized = true;
            }
            return PrimEditor;
        }
    }

    function initialize() {

        this.propertyEditorDialogs = [];

        $('#sidepanel').append("<div id='PrimitiveEditor'>" + "<div id='primeditortitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span id='primeditortitletext' class='ui-dialog-title' id='ui-dialog-title-Players'>Object Properties</span></div>" +
            '<div id="accordion" style="height:100%;overflow:hidden">' +
            '<h3><a href="#">Flags</a></h3>' +
            '<div>' +
            "<div id='otherprops'>" +
            "<input class='TransformEditorInput' style='width:50%;margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='text' id='dispName'>Name</input><br/>" +
            "<input disabled='disabled' class='TransformEditorInput' style='width:50%;margin: 7px 2px 6px 0px;text-align: center;vertical-align: middle;' type='text' id='dispOwner'>Owners</input><br/>" +

            "<input class='editorCheck' type='checkbox' id='isVisible'>Visible</input><br/>" +
            "<input class='editorCheck' type='checkbox' id='isStatic'>Static (does not move)</input><br/>" +
            "<input class='editorCheck' type='checkbox' id='isDynamic'>Dynamic (moves frequently)</input><br/>" +
            "<input class='editorCheck' type='checkbox' id='castShadows'>Cast Shadows</input><br/>" +
            "<input class='editorCheck'type='checkbox' id='receiveShadows'>Receive Shadows</input><br/>" +
            "<input class='editorCheck' type='checkbox' id='passable'>Passable (collides with avatars)</input><br/>" +
            "<input class='editorCheck' type='checkbox' id='isSelectable'>Selectable (visible to pick)</input><br/>" +
            "<input class='editorCheck' type='checkbox' id='inheritScale'>Inherit Parent Scale</input><br/>" +
            "</div>" +
            '</div>' +
            '<h3><a href="#">Transforms</a></h3>' +
            '<div>' +
            "<div class='EditorLabel'>Translation</div>" +
            "<div id='Translation'>" +
            "<input type='number'  class='TransformEditorInput' id='PositionX'/>" +
            "<input type='number'  class='TransformEditorInput' id='PositionY'/>" +
            "<input type='number'  class='TransformEditorInput' id='PositionZ'/>" +
            "</div>" + "<div class='EditorLabel'>Rotation</div>" +
            "<div id='Rotation'>" +
            "<input type='number' class='TransformEditorInput' id='RotationX'/>" +
            "<input type='number' class='TransformEditorInput' id='RotationY'/>" +
            "<input type='number' class='TransformEditorInput' id='RotationZ'/>" +
            "<input type='number' class='TransformEditorInput' id='RotationW'/>" +
            "</div>" +
            "<div class='EditorLabel'>Scale</div>" +
            "<div id='Scale'>" +
            "<input type='number' min='.0001' step='.05'  class='TransformEditorInput' id='ScaleX'/>" +
            "<input type='number' min='.0001' step='.05' class='TransformEditorInput' id='ScaleY'/>" +
            "<input type='number' min='.0001' step='.05' class='TransformEditorInput' id='ScaleZ'/>" +
            "</div>" +
            '</div>' +
            '</div>');
        $('#primeditortitle').append('<a id="primitiveeditorclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
        $('#primeditortitle').prepend('<div class="headericon properties" />');
        $('#primitiveeditorclose').click(function() {
            _PrimitiveEditor.hide();
        });

        $('#isStatic').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'isStatic', this.checked)
        });
        $('#inheritScale').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'inheritScale', this.checked)
        });
        $('#isVisible').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'visible', this.checked)
        });
        $('#isDynamic').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'isDynamic', this.checked)
        });
        $('#castShadows').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'castShadows', this.checked)
        });
        $('#isSelectable').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'isSelectable', this.checked)
        });
        $('#receiveShadows').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'receiveShadows', this.checked)
        });
        $('#passable').change(function(e) {
            _PrimitiveEditor.setProperty('selection', 'passable', this.checked)
        });
        $('#dispName').blur(function(e) {
            if (vwf.getProperty(_Editor.GetSelectedVWFNode().id, 'DisplayName') === undefined) {
                vwf.createProperty(_Editor.GetSelectedVWFNode().id, 'DisplayName', $(this).val());
            }
            _PrimitiveEditor.setProperty(_Editor.GetSelectedVWFNode().id, 'DisplayName', $(this).val());
        });
        $('#PrimitiveEditor').css('border-bottom', '5px solid #444444')
        $('#PrimitiveEditor').css('border-left', '2px solid #444444')
        //$('#PrimitiveEditor').resizable({
        //    maxHeight: 550,
        //    maxWidth: 320,
        //    minHeight: 150,
        //    minWidth: 320
        //});
        //$('#PrimitiveEditor').dialog({title:'Primitive Editor',autoOpen:false, 
        //	resize:function(){
        //		$( "#accordion" ).accordion( "resize" );
        //		this.updateOtherWindows();
        //	}.bind(this),
        //	close:function(){
        //		this.updateOtherWindows();
        //	}.bind(this)
        //});
        $("#accordion").accordion({
            fillSpace: true,
            heightStyle: "content",
            change: function() {
                if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
            }
        });
        $(".ui-accordion-content").css('height', 'auto');
        this.show = function() {
            $('#MenuObjectPropertiesicon').addClass('iconselected');
            //$('#PrimitiveEditor').dialog('open');
            //$('#PrimitiveEditor').dialog('option','position',[1282,40]);
            $('#PrimitiveEditor').prependTo($('#PrimitiveEditor').parent());
            $('#PrimitiveEditor').show('blind', function() {
                if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
            });
            showSidePanel();
            this.SelectionChanged(null, _Editor.GetSelectedVWFNode());
            this.open = true;

        }
        this.hide = function() {
            //$('#PrimitiveEditor').dialog('close');
            if (this.isOpen()) {
                $('#PrimitiveEditor').hide('blind', function() {
                    if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                    if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible')) hideSidePanel();
                });

            }
            $('#MenuObjectPropertiesicon').removeClass('iconselected');
        }
        this.isOpen = function() {
            //return $("#PrimitiveEditor").dialog( "isOpen" )
            return $('#PrimitiveEditor').is(':visible')
        }
        this.setProperty = function(id, prop, val, skipUndo) {
            //prevent the handlers from firing setproperties when the GUI is first setup;
            if (this.inSetup) return;

            if (document.PlayerNumber == null) {
                _Notifier.notify('You must log in to participate');
                return;
            }
            if (id != 'selection') {
                if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), id) == 0) {
                    _Notifier.notify('You do not have permission to edit this object');
                    return;
                }
                if (!skipUndo)
                    _UndoManager.recordSetProperty(id, prop, val);
                vwf_view.kernel.setProperty(id, prop, val)
            }
            if (id == 'selection') {
                var undoEvent = new _UndoManager.CompoundEvent();

                for (var k = 0; k < _Editor.getSelectionCount(); k++) {
                    if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), _Editor.GetSelectedVWFNode(k).id) == 0) {
                        _Notifier.notify('You do not have permission to edit this object');
                        continue;
                    }

                    undoEvent.push(new _UndoManager.SetPropertyEvent(_Editor.GetSelectedVWFNode(k).id, prop, val));
                    vwf_view.kernel.setProperty(_Editor.GetSelectedVWFNode(k).id, prop, val)
                }
                if (!skipUndo)
                    _UndoManager.pushEvent(undoEvent);
            }
        }

        this.callMethod = function(id, method) {
            if (document.PlayerNumber == null) {
                _Notifier.notify('You must log in to participate');
                return;
            }
            if (id != 'selection') {
                if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), id) == 0) {
                    _Notifier.notify('You do not have permission to edit this object');
                    return;
                }
                vwf_view.kernel.callMethod(id, method);
            }
            if (id == 'selection') {
                alertify.alert('calling methods on multiple selections is not supported');
            }
        }

        this.SelectionChanged = function(e, node) {
            try {
                if (node) {
                    this.inSetup = true;
                    this.clearPropertyEditorDialogs();
                    var lastTab = $("#accordion").accordion('option', 'active');
                    $("#accordion").accordion('destroy');
                    $("#accordion").children('.modifiersection').remove();
                    //update to ensure freshness
                    node = _Editor.getNode(node.id);
                    node.properties = vwf.getProperties(node.id);
                    if (!node.properties) return;



                    $('#ui-dialog-title-ObjectProperties').text(vwf.getProperty(node.id, 'DisplayName') + " Properties");
                    $('#dispName').val(vwf.getProperty(node.id, 'DisplayName') || node.id);

                    this.addPropertyEditorDialog(node.id, 'DisplayName', $('#dispName'), 'text');

                    $('#primeditortitletext').text($('#dispName').val() + ' Properties')

                    if ($('#dispName').val() == "") {
                        $('#dispName').val(node.name);
                    }
                    $('#dispOwner').val(vwf.getProperty(node.id, 'owner'));

                    if (vwf.getProperty(node.id, 'isStatic')) {
                        $('#isStatic').attr('checked', 'checked');
                    } else {
                        $('#isStatic').removeAttr('checked');
                    }

                    if (vwf.getProperty(node.id, 'visible')) {
                        $('#isVisible').attr('checked', 'checked');
                    } else {
                        $('#isVisible').removeAttr('checked');
                    }

                    if (vwf.getProperty(node.id, 'inheritScale')) {
                        $('#inheritScale').attr('checked', 'checked');
                    } else {
                        $('#inheritScale').removeAttr('checked');
                    }

                    if (vwf.getProperty(node.id, 'isDynamic')) {
                        $('#isDynamic').attr('checked', 'checked');
                    } else {
                        $('#isDynamic').removeAttr('checked');
                    }
                    if (vwf.getProperty(node.id, 'castShadows')) {
                        $('#castShadows').attr('checked', 'checked');
                    } else {
                        $('#castShadows').removeAttr('checked');
                    }
                    if (vwf.getProperty(node.id, 'isSelectable')) {
                        $('#isSelectable').attr('checked', 'checked');
                    } else {
                        $('#isSelectable').removeAttr('checked');
                    }
                    if (vwf.getProperty(node.id, 'passable')) {
                        $('#passable').attr('checked', 'checked');
                    } else {
                        $('#passable').removeAttr('checked');
                    }
                    if (vwf.getProperty(node.id, 'receiveShadows')) {
                        $('#receiveShadows').attr('checked', 'checked');
                    } else {
                        $('#receiveShadows').removeAttr('checked');
                    }
                    $('#BaseSectionTitle').text(node.properties.type || "Type" + ": " + node.id);
                    this.SelectionTransformed(null, node);
                    this.setupAnimationGUI(node, true);
                    this.setupEditorData(node, true);
                    this.recursevlyAddModifiers(node);
                    this.addBehaviors(node);
                    $("#accordion").accordion({
                        heightStyle: 'fill',
                        activate: function() {
                            if ($('#sidepanel').data('jsp')) $('#sidepanel').data('jsp').reinitialise();
                        }
                    });
                    $(".ui-accordion-content").css('height', 'auto');
                    this.inSetup = false;

                    $("#accordion").accordion({
                        'active': lastTab
                    });
                } else {
                    this.hide();
                }
            } catch (e) {
                console.log(e);
            }
        }

        this.recursevlyAddModifiers = function(node) {
            for (var i in node.children) {
                /*	section = '<h3 class="modifiersection" ><a href="#">'+node.children[i].properties.type+'</a></h3>'+
			'<div class="modifiersection">'+
			'<div class="EditorLabel">Amount</div>' +
					'<div id="'+node.children[i].id+'Amount" nodename="'+node.children[i].id+'">'
			'</div>';
			$( "#accordion" ).append(section);
			//$("#Radius").slider({min:0,max:10,step:.10,slide:this.updateSize.bind(this)});
			$("#"+node.children[i].id+"Amount").slider({min:-1,max:1,step:.10,slide:this.modifierAmountUpdate,stop:this.modifierAmountUpdate});
			//$("#"+node.children[i].id+"Amount").slider('value',vwf.getProperty(node.children[i].id,'amount'));
			*/
                if (vwf.getProperty(node.children[i].id, 'isModifier') == true) {
                    this.setupEditorData(node.children[i], false);
                    this.recursevlyAddModifiers(node.children[i]);
                }
            }
        }
        this.addBehaviors = function(node) {
            for (var i in node.children) {
                /*	section = '<h3 class="modifiersection" ><a href="#">'+node.children[i].properties.type+'</a></h3>'+
			'<div class="modifiersection">'+
			'<div class="EditorLabel">Amount</div>' +
					'<div id="'+node.children[i].id+'Amount" nodename="'+node.children[i].id+'">'
			'</div>';
			$( "#accordion" ).append(section);
			//$("#Radius").slider({min:0,max:10,step:.10,slide:this.updateSize.bind(this)});
			$("#"+node.children[i].id+"Amount").slider({min:-1,max:1,step:.10,slide:this.modifierAmountUpdate,stop:this.modifierAmountUpdate});
			//$("#"+node.children[i].id+"Amount").slider('value',vwf.getProperty(node.children[i].id,'amount'));
			*/
                if (vwf.getProperty(node.children[i].id, 'type') == 'behavior') {
                    this.setupEditorData(node.children[i], false);
                }
            }
        }
        this.primPropertySlide = function(e, ui) {

            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            $('#' + id + prop + 'value').val(ui.value);
            var amount = ui.value;
            //be sure to skip undo - handled better in slidestart and slidestop
            _PrimitiveEditor.setProperty(id, prop, parseFloat(amount), true);

        }
        this.primPropertySlideStart = function(e, ui) {
            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            $('#' + id + prop + 'value').val(ui.value);
            var amount = ui.value;
            this.undoEvent = new _UndoManager.CompoundEvent();
            if (id == 'selection') {
                for (var i = 0; i < _Editor.getSelectionCount(); i++)
                    this.undoEvent.push(new _UndoManager.SetPropertyEvent(_Editor.GetSelectedVWFNode(i).id, prop, null))
            } else {
                this.undoEvent.push(new _UndoManager.SetPropertyEvent(id, prop, null))
            }
            _PrimitiveEditor.setProperty(id, prop, parseFloat(amount), true);
        }
        this.primPropertySlideStop = function(e, ui) {
            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            $('#' + id + prop + 'value').val(ui.value);
            var amount = ui.value;

            if (this.undoEvent)
                for (var i = 0; i < this.undoEvent.list.length; i++)
                    this.undoEvent.list[i].val = amount;
            _UndoManager.pushEvent(this.undoEvent);
            this.undoEvent = null;

            _PrimitiveEditor.setProperty(id, prop, parseFloat(amount), true);
        }
        this.primPropertyUpdate = function(e, ui) {
            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            $('#' + id + prop + 'value').val(ui.value);
            var amount = ui.value;
            _PrimitiveEditor.setProperty(id, prop, parseFloat(amount));
        }
        this.primPropertyTypein = function(e, ui) {
            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            var amount = $(this).val();
            var slider = $(this).attr('slider');
            $(slider).slider('value', amount);
            _PrimitiveEditor.setProperty(id, prop, parseFloat(amount));
        }
        this.primSpinner = function(e, ui) {
            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            var amount = $(this).val();
            var slider = $(this).attr('slider');
            $(slider).slider('value', ui.value);
            _PrimitiveEditor.setProperty(id, prop, parseFloat(ui.value));

        }
        this.primPropertyValue = function(e, ui) {
            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            var val = $(this).attr('value');
            _PrimitiveEditor.setProperty(id, prop, val);
        }
        this.primPropertyChecked = function(e, ui) {
            var id = $(this).attr('nodename');
            var prop = $(this).attr('propname');
            if ($(this).attr('checked') == 'checked') _PrimitiveEditor.setProperty(id, prop, true);
            else _PrimitiveEditor.setProperty(id, prop, false);
        }
        this.setupAnimationGUI = function(node, wholeselection) {

            var animationLength = vwf.getProperty(node.id, 'animationLength');
            if (animationLength > 0) {

                var animationStart = vwf.getProperty(node.id, 'animationStart');
                var animationEnd = vwf.getProperty(node.id, 'animationEnd');
                var animationFrame = vwf.getProperty(node.id, 'animationFrame');
                var animationSpeed = vwf.getProperty(node.id, 'animationSpeed');
                var nodeid = node.id;
                var section = '<h3 class="modifiersection" ><a href="#"><div style="font-weight:bold;display:inline"> </div>Animation</a></h3><div class="modifiersection" id="animationSettings' + nodeid + '">' + '</div>';
                $("#accordion").append(section);
                $('#animationSettings' + nodeid).append('<div id="animationFrame">');
                var inputstyle = "";
                $('#animationSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + 'animationFrame' + ': </div>');
                $('#animationSettings' + nodeid).append('<input class="primeditorinputbox" style="' + inputstyle + '" type="number" id="' + nodeid + 'animationFrame' + 'value"></input>');
                $('#' + nodeid + 'animationFrame' + 'value').val(vwf.getProperty(node.id, 'animationFrame'));
                $('#' + nodeid + 'animationFrame' + 'value').change(this.primPropertyTypein);
                $('#' + nodeid + 'animationFrame' + 'value').attr("nodename", nodeid);
                $('#' + nodeid + 'animationFrame' + 'value').attr("propname", 'animationFrame');
                $('#' + nodeid + 'animationFrame' + 'value').attr("slider", '#' + nodeid + 'animationFrame');
                $('#animationSettings' + nodeid).append('<div id="' + nodeid + 'animationFrame' + '" nodename="' + nodeid + '" propname="' + 'animationFrame' + '"/>');
                var val = vwf.getProperty(node.id, 'animationFrame');
                if (val == undefined) val = 0;
                $('#' + nodeid + 'animationFrame').slider({
                    step: .01,
                    min: parseFloat(0),
                    max: parseFloat(animationLength),
                    slide: this.primPropertyUpdate,
                    stop: this.primPropertyUpdate,
                    value: val
                });

                this.addPropertyEditorDialog(node.id, 'animationFrame', $('#' + nodeid + 'animationFrame'), 'slider');
                this.addPropertyEditorDialog(node.id, 'animationFrame', $('#' + nodeid + 'animationFrame' + 'value'), 'text');

                $('#animationSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + 'Animation Cycle' + ': </div>');
                $('#animationSettings' + nodeid).append('<div style="display: block;margin: 5px;" id="' + nodeid + i + '" nodename="' + nodeid + '" propnamemax="' + 'animationEnd' + '" propnamemin="' + 'animationStart' + '"/>');

                var minval = animationStart;
                var maxval = animationEnd;
                var val = [minval, maxval]
                $('#' + nodeid + i).slider({
                    range: true,
                    step: parseFloat(.1),
                    min: 0,
                    max: animationLength,
                    values: val,
                    slide: function(e, ui) {
                        var propmin = $(this).attr('propnamemin');
                        var propmax = $(this).attr('propnamemax');
                        var nodeid = $(this).attr('nodename');
                        _PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
                        _PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
                    },
                    stop: function(e, ui) {
                        var propmin = $(this).attr('propnamemin');
                        var propmax = $(this).attr('propnamemax');
                        var nodeid = $(this).attr('nodename');
                        _PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
                        _PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
                    }
                });

                $('#animationSettings' + nodeid).append('<div id="animationSpeed">');
                var inputstyle = "";
                $('#animationSettings' + nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + 'animationSpeed' + ': </div>');
                $('#animationSettings' + nodeid).append('<input class="primeditorinputbox" style="' + inputstyle + '" type="number" id="' + nodeid + 'animationSpeed' + 'value"></input>');
                $('#' + nodeid + 'animationSpeed' + 'value').val(vwf.getProperty(node.id, 'animationSpeed'));
                $('#' + nodeid + 'animationSpeed' + 'value').change(this.primPropertyTypein);
                $('#' + nodeid + 'animationSpeed' + 'value').attr("nodename", nodeid);
                $('#' + nodeid + 'animationSpeed' + 'value').attr("propname", 'animationSpeed');
                $('#' + nodeid + 'animationSpeed' + 'value').attr("slider", '#' + nodeid + 'animationSpeed');
                $('#animationSettings' + nodeid).append('<div id="' + nodeid + 'animationSpeed' + '" nodename="' + nodeid + '" propname="' + 'animationSpeed' + '"/>');
                var val = vwf.getProperty(node.id, 'animationSpeed');
                if (val == undefined) val = 0;
                $('#' + nodeid + 'animationSpeed').slider({
                    step: .01,
                    min: parseFloat(0),
                    max: parseFloat(10),
                    slide: this.primPropertyUpdate,
                    stop: this.primPropertyUpdate,
                    value: val
                });

                this.addPropertyEditorDialog(node.id, 'animationSpeed', $('#' + nodeid + 'animationSpeed'), 'slider');
                this.addPropertyEditorDialog(node.id, 'animationSpeed', $('#' + nodeid + 'animationSpeed' + 'value'), 'text');



                $('#animationSettings' + nodeid).append('<div id="' + nodeid + 'play' + '" nodename="' + nodeid + '" methodname="' + 'play' + '"/>');
                $('#' + nodeid + 'play').button({
                    label: 'Play'
                });
                $('#' + nodeid + 'play').css('display', 'block');
                $('#' + nodeid + 'play').click(function() {
                    var nodename = $(this).attr('nodename');
                    var method = $(this).attr('methodname');
                    _PrimitiveEditor.callMethod(nodename, method);
                });

                $('#animationSettings' + nodeid).append('<div id="' + nodeid + 'pause' + '" nodename="' + nodeid + '" methodname="' + 'pause' + '"/>');
                $('#' + nodeid + 'pause').button({
                    label: 'Pause'
                });
                $('#' + nodeid + 'pause').css('display', 'block');
                $('#' + nodeid + 'pause').click(function() {
                    var nodename = $(this).attr('nodename');
                    var method = $(this).attr('methodname');
                    _PrimitiveEditor.callMethod(nodename, method);
                });

            }
        }
        this.setupEditorData = function(node, wholeselection) {
            var nodeid = node.id;
            if (wholeselection && _Editor.getSelectionCount() > 1) nodeid = 'selection';
            var editordata = vwf.getProperty(node.id, 'EditorData');

            editordatanames = [];
            for (var i in editordata) {
                editordatanames.push(i);
            }
            if (editordatanames.length == 0) return;
            editordatanames.sort();
            section = '<h3 class="modifiersection" ><a href="#"><div style="font-weight:bold;display:inline">' + (vwf.getProperty(node.id, 'type') || "Type") + ": </div>" + (node.properties.DisplayName || "None") + '</a></h3>' + '<div class="modifiersection" id="basicSettings' + nodeid + '">' + '</div>';
            $("#accordion").append(section);
            for (var j = 0; j < editordatanames.length; j++) {
                var i = editordatanames[j];
                if (editordata[i].type == 'sectionTitle') {
                    var inputstyle = "";
                    $('#basicSettings' + nodeid).append('<div style="" class = "EditorDataSectionTitle">' + editordata[i].displayname + ': </div>');
                }
                if (editordata[i].type == 'slider') {
                    var inputstyle = "";
                    $('#basicSettings' + nodeid).append('<div class="editorSliderLabel">' + editordata[i].displayname + ': </div>');
                    $('#basicSettings' + nodeid).append('<input class="primeditorinputbox" style="' + inputstyle + '" type="" id="' + nodeid + editordata[i].property + 'value"></input>');
                    //	$('#' + nodeid + editordata[i].property + 'value').val(vwf.getProperty(node.id, editordata[i].property));
                    //	$('#' + nodeid + editordata[i].property + 'value').change(this.primPropertyTypein);
                    $('#' + nodeid + editordata[i].property + 'value').attr("nodename", nodeid);
                    $('#' + nodeid + editordata[i].property + 'value').attr("propname", editordata[i].property);
                    $('#' + nodeid + editordata[i].property + 'value').attr("slider", '#' + nodeid + i);
                    $('#' + nodeid + editordata[i].property + 'value').spinner({
                        step: parseFloat(editordata[i].step) || 1,
                        change: this.primPropertyTypein,
                        spin: this.primSpinner

                    })
                    $('#' + nodeid + editordata[i].property + 'value').spinner('value', vwf.getProperty(node.id, editordata[i].property));
                    $('#' + nodeid + editordata[i].property + 'value').parent().css('float', 'right');

                    $('#basicSettings' + nodeid).append('<div id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
                    var val = vwf.getProperty(node.id, editordata[i].property);
                    if (val == undefined) val = 0;
                    $('#' + nodeid + i).slider({
                        step: parseFloat(editordata[i].step),
                        min: parseFloat(editordata[i].min),
                        max: parseFloat(editordata[i].max),
                        slide: this.primPropertySlide,
                        stop: this.primPropertySlideStop,
                        start: this.primPropertySlideStart,
                        value: val
                    });

                    this.addPropertyEditorDialog(node.id, editordata[i].property, $('#' + nodeid + i), 'slider');
                    this.addPropertyEditorDialog(node.id, editordata[i].property, $('#' + nodeid + editordata[i].property + 'value'), 'text');
                }
                if (editordata[i].type == 'check') {
                    $('#basicSettings' + nodeid).append('<div><input style="vertical-align: middle" type="checkbox" id="' + i + nodeid + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/><div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">' + editordata[i].displayname + ': </div></div>');
                    var val = vwf.getProperty(node.id, editordata[i].property);
                    $('#' + i + nodeid).click(this.primPropertyChecked);
                    if (val == true) {
                        $('#' + i + nodeid).attr('checked', 'checked');
                    }

                    this.addPropertyEditorDialog(node.id, editordata[i].property, $('#' + i + nodeid), 'check');
                    //$('#'+i).
                }
                if (editordata[i].type == 'button') {

                    $('#basicSettings' + nodeid).append('<div id="' + nodeid + i + '" nodename="' + nodeid + '" methodname="' + editordata[i].method + '"/>');
                    $('#' + nodeid + i).button({
                        label: editordata[i].label
                    });
                    $('#' + nodeid + i).css('display', 'block');
                    $('#' + nodeid + i).click(function() {
                        var nodename = $(this).attr('nodename');
                        var method = $(this).attr('methodname');
                        _PrimitiveEditor.callMethod(nodename, method);
                    });
                }
                if (editordata[i].type == 'choice') {


                    //	$('#basicSettings' + nodeid).append('<input type="button" style="width: 100%;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' +  editordata[i].property + '"/>');
                    $('#basicSettings' + nodeid).append('<div><div class="editorSliderLabel">' + editordata[i].displayname + ': </div>' + '<select id="' + nodeid + i + '" style="float:right;clear:right" ' + ' nodename="' + nodeid + '" propname="' + editordata[i].property + '"" ></select></div>');

                    $('#' + nodeid + i).val(editordata[i].displayname + ": " + editordata[i].labels[vwf.getProperty(node.id, editordata[i].property)]);
                    $('#' + nodeid + i).attr('index', i);

                    for (var k = 0; k < editordata[i].labels.length; k++) {
                        $('#' + nodeid + i).append("<option value='" + editordata[i].values[k] + "'>  " + editordata[i].labels[k] + "  </option>")
                    }
                    //$('#' + nodeid + i).button();


                    //find and select the current value in the dropdown
                    var selectedindex = editordata[i].values.indexOf(vwf.getProperty(node.id, editordata[i].property));
                    var selectedLabel = editordata[i].labels[selectedindex];
                    $("select option").filter(function() {
                        //may want to use $.trim in here
                        return $.trim($(this).text()) == $.trim(selectedLabel);
                    }).prop('selected', true);

                    $('#' + nodeid + i).change(function() {

                        var propname = $(this).attr('propname');
                        var nodename = $(this).attr('nodename');

                        var value = $(this).val();
                        var div = this;
                        _PrimitiveEditor.setProperty(nodename, propname, value);

                    });
                    this.addPropertyEditorDialog(node.id, editordata[i].property, $('#' + nodeid + i), 'text');

                    //$('#'+i).
                }
                if (editordata[i].type == 'rangeslider') {
                    $('#basicSettings' + nodeid).append('<div  class="editorSliderLabel">' + editordata[i].displayname + ': </div>');
                    $('#basicSettings' + nodeid).append('<div style="display: block;margin: 5px;" id="' + nodeid + i + '" nodename="' + nodeid + '" propnamemax="' + editordata[i].property[2] + '" propnamemin="' + editordata[i].property[1] + '"/>');
                    var setval = vwf.getProperty(node.id, editordata[i].property[0]);
                    var minval = vwf.getProperty(node.id, editordata[i].property[1]);
                    var maxval = vwf.getProperty(node.id, editordata[i].property[2]);
                    var val = [minval || editordata[i].min, maxval || editordata[i].max]
                    $('#' + nodeid + i).slider({
                        range: true,
                        step: parseFloat(editordata[i].step),
                        min: parseFloat(editordata[i].min),
                        max: parseFloat(editordata[i].max),
                        values: val,
                        slide: function(e, ui) {
                            var propmin = $(this).attr('propnamemin');
                            var propmax = $(this).attr('propnamemax');
                            var nodeid = $(this).attr('nodename');
                            _PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
                            _PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
                        },
                        stop: function(e, ui) {
                            var propmin = $(this).attr('propnamemin');
                            var propmax = $(this).attr('propnamemax');
                            var nodeid = $(this).attr('nodename');
                            _PrimitiveEditor.setProperty(nodeid, propmin, parseFloat(ui.values[0]));
                            _PrimitiveEditor.setProperty(nodeid, propmax, parseFloat(ui.values[1]));
                        }
                    });
                }
                if (editordata[i].type == 'rangevector') {
                    var vecvalchanged = function(e) {
                        var propname = $(this).attr('propname');
                        var component = $(this).attr('component');
                        var nodeid = $(this).attr('nodename');
                        var thisid = $(this).attr('id');
                        thisid = thisid.substr(0, thisid.length - 1);
                        var x = $('#' + thisid + 'X').val();
                        var y = $('#' + thisid + 'Y').val();
                        var z = $('#' + thisid + 'Z').val();
                        _PrimitiveEditor.setProperty(nodeid, propname, [parseFloat(x), parseFloat(y), parseFloat(z)]);
                    }
                    $('#basicSettings' + nodeid).append('<div  class="editorSliderLabel">' + editordata[i].displayname + ': </div>');
                    var baseid = 'basicSettings' + nodeid + i + 'min';
                    $('#basicSettings' + nodeid).append('<div style="text-align:right"><div style="display:inline" >min:</div> <div style="display:inline-block;">' + '<input id="' + baseid + 'X' + '" component="X" nodename="' + nodeid + '" propname="' + editordata[i].property[0] + '" type="number" step="' + editordata[i].step + '" class="vectorinputfront"/>' + '<input id="' + baseid + 'Y' + '" component="Y" nodename="' + nodeid + '" propname="' + editordata[i].property[0] + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '<input id="' + baseid + 'Z' + '" component="Z" nodename="' + nodeid + '" propname="' + editordata[i].property[0] + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '</div></div>');
                    var propmin = vwf.getProperty(node.id, editordata[i].property[0]);
                    if (propmin) {
                        $('#' + baseid + 'X').val(propmin[0]);
                        $('#' + baseid + 'Y').val(propmin[1]);
                        $('#' + baseid + 'Z').val(propmin[2]);
                    }
                    $('#' + baseid + 'X').change(vecvalchanged);
                    $('#' + baseid + 'Y').change(vecvalchanged);
                    $('#' + baseid + 'Z').change(vecvalchanged);
                    baseid = 'basicSettings' + nodeid + i + 'max';
                    $('#basicSettings' + nodeid).append('<div style="text-align:right"><div style="display:inline">max:</div> <div style="display:inline-block;">' + '<input id="' + baseid + 'X' + '" component="X" nodename="' + nodeid + '" propname="' + editordata[i].property[1] + '" type="number" step="' + editordata[i].step + '"  class="vectorinputfront"/>' + '<input id="' + baseid + 'Y' + '" component="Y" nodename="' + nodeid + '" propname="' + editordata[i].property[1] + '" type="number" step="' + editordata[i].step + '"  class="vectorinput"/>' + '<input id="' + baseid + 'Z' + '" component="Z" nodename="' + nodeid + '" propname="' + editordata[i].property[1] + '" type="number" step="' + editordata[i].step + '"  class="vectorinput"/>' + '</div></div>');
                    var propmax = vwf.getProperty(node.id, editordata[i].property[1]);
                    if (propmax) {
                        $('#' + baseid + 'X').val(propmax[0]);
                        $('#' + baseid + 'Y').val(propmax[1]);
                        $('#' + baseid + 'Z').val(propmax[2]);
                    }
                    $('#' + baseid + 'X').change(vecvalchanged);
                    $('#' + baseid + 'Y').change(vecvalchanged);
                    $('#' + baseid + 'Z').change(vecvalchanged);
                }
                if (editordata[i].type == 'vector') {
                    var vecvalchanged = function(e) {
                            var propname = $(this).attr('propname');
                            var component = $(this).attr('component');
                            var nodeid = $(this).attr('nodename');
                            var thisid = $(this).attr('id');
                            thisid = thisid.substr(0, thisid.length - 1);
                            var x = $('#' + thisid + 'X').val();
                            var y = $('#' + thisid + 'Y').val();
                            var z = $('#' + thisid + 'Z').val();
                            _PrimitiveEditor.setProperty(nodeid, propname, [parseFloat(x), parseFloat(y), parseFloat(z)]);
                        }
                        //$('#basicSettings'+nodeid).append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 3px;">'+editordata[i].displayname+': </div>');
                    var baseid = 'basicSettings' + nodeid + i + 'min';
                    $('#basicSettings' + nodeid).append('<div class="editorSliderLabel"  style="width:100%;text-align: left;margin-top: 4px;" ><div style="display:inline" >' + editordata[i].displayname + ':</div> <div style="display:inline-block;float:right">' + '<input id="' + baseid + 'X' + '" component="X" nodename="' + nodeid + '" propname="' + editordata[i].property + '" type="number" step="' + editordata[i].step + '" class="vectorinputfront"/>' + '<input id="' + baseid + 'Y' + '" component="Y" nodename="' + nodeid + '" propname="' + editordata[i].property + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '<input id="' + baseid + 'Z' + '" component="Z" nodename="' + nodeid + '" propname="' + editordata[i].property + '" type="number" step="' + editordata[i].step + '" class="vectorinput"/>' + '</div><div style="clear:both"/></div>');
                    var propmin = vwf.getProperty(node.id, editordata[i].property);
                    if (propmin) {
                        $('#' + baseid + 'X').val(propmin[0]);
                        $('#' + baseid + 'Y').val(propmin[1]);
                        $('#' + baseid + 'Z').val(propmin[2]);
                    }
                    $('#' + baseid + 'X').change(vecvalchanged);
                    $('#' + baseid + 'Y').change(vecvalchanged);
                    $('#' + baseid + 'Z').change(vecvalchanged);
                }
                if (editordata[i].type == 'map') {
                    $('#basicSettings' + nodeid).append('<div style="display: block;margin: 5px;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
                    $('#' + nodeid + i).button({
                        label: editordata[i].displayname
                    });
                    $('#' + nodeid + i).click(function() {
                        _MapBrowser.setTexturePickedCallback(function(e) {
                            var propname = $(this).attr('propname');
                            var nodename = $(this).attr('nodename');
                            _MapBrowser.setTexturePickedCallback(null);
                            _PrimitiveEditor.setProperty(nodename, propname, e);
                            _MapBrowser.hide();
                        }.bind(this));
                        _MapBrowser.show();
                    });
                }
                if (editordata[i].type == 'text') {
                    $('#basicSettings' + nodeid).append('<div style="">' + editordata[i].displayname + '</div><input type="text" style="display: block;width: 100%;padding: 2px;border-radius: 5px;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
                    $('#' + nodeid + i).val(vwf.getProperty(node.id, editordata[i].property));
                    $('#' + nodeid + i).keyup(function() {
                        var propname = $(this).attr('propname');
                        var nodename = $(this).attr('nodename');
                        _PrimitiveEditor.setProperty(nodename, propname, $(this).val());
                    });
                    this.addPropertyEditorDialog(node.id, editordata[i].property, $('#' + nodeid + i), 'text');
                }
                if (editordata[i].type == 'prompt') {
                    $('#basicSettings' + nodeid).append('<div style="">' + editordata[i].displayname + '</div><input type="text" style="text-align: center;border: outset 1px;background-color: #DDDDDD;margin: 0px 0px 5px 0px;cursor: pointer;display: block;width: 100%;padding: 2px;border-radius: 5px;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/>');
                    $('#' + nodeid + i).val(vwf.getProperty(node.id, editordata[i].property));
                    $('#' + nodeid + i).click(function() {

                        var propname = $(this).attr('propname');
                        var nodename = $(this).attr('nodename');
                        var div = this;
                        alertify.prompt('Enter a value for ' + propname, function(ok, value) {
                            if (ok) {
                                $(div).val(value);
                                _PrimitiveEditor.setProperty(nodename, propname, value);
                            }
                        }, $(this).val());
                    });
                }
                if (editordata[i].type == 'nodeid') {

                    $('#basicSettings' + nodeid).append('<div style="margin-top: 5px;margin-bottom: 5px;"><div >' + editordata[i].displayname + '</div><input type="text" style="display: inline;width: 50%;padding: 2px;border-radius: 5px;font-weight: bold;" id="' + nodeid + i + '" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/><div  style="float:right;width:45%;height:2em" id="' + nodeid + i + 'button" nodename="' + nodeid + '" propname="' + editordata[i].property + '"/></div><div style="clear:both" />');
                    $('#' + nodeid + i).val(vwf.getProperty(node.id, editordata[i].property));
                    $('#' + nodeid + i).attr('disabled', 'disabled');
                    $('#' + nodeid + i + 'button').button({
                        label: 'Choose Node'
                    });
                    var label = $('#' + nodeid + i);
                    $('#' + nodeid + i + 'button').click(function() {
                        var propname = $(this).attr('propname');
                        var nodename = $(this).attr('nodename');

                        _Editor.TempPickCallback = function(node) {
                            label.val(node.id);
                            _Editor.TempPickCallback = null;
                            _Editor.SetSelectMode('Pick');
                            _PrimitiveEditor.setProperty(nodename, propname, node.id);
                        };
                        _Editor.SetSelectMode('TempPick');

                    });

                    this.addPropertyEditorDialog(node.id, editordata[i].property, $('#' + nodeid + i), 'text');
                }
                if (editordata[i].type == 'color') {
                    var colorswatchstyle = "margin: 5px;float:right;clear:right;background-color: #FF19E9;width: 25px;height: 25px;border: 2px solid lightgray;border-radius: 3px;display: inline-block;margin-left: 20px;vertical-align: middle;box-shadow: 2px 2px 5px,1px 1px 3px gray inset;background-image: url(vwf/view/editorview/images/select3.png);background-position: center;";
                    $('#basicSettings' + nodeid).append('<div style="margin-bottom:10px" id="' + nodeid + i + '" />');
                    $('#' + nodeid + i + '').append('<div style="display:inline-block;margin-bottom: 3px;margin-top: 15px;"  class="editorSliderLabel">' + editordata[i].displayname + ': </div>');
                    $('#' + nodeid + i + '').append('<div id="' + nodeid + i + 'ColorPicker" style="' + colorswatchstyle + '"></div>')
                    var colorval = vwf.getProperty(node.id, editordata[i].property);
                    if (!colorval) colorval = [1, 1, 1];
                    colorval = 'rgb(' + parseInt(colorval[0] * 255) + ',' + parseInt(colorval[1] * 255) + ',' + parseInt(colorval[2] * 255) + ')';
                    $('#' + nodeid + i + 'ColorPicker').css('background-color', colorval);
                    var parentid = nodeid + i + 'ColorPicker';
                    $('#' + nodeid + i + 'ColorPicker').ColorPicker({
                        colorpickerId: parentid + 'picker',
                        onShow: function(e) {
                            $(e).fadeIn();
                        },
                        onHide: function(e) {
                            $(e).fadeOut();
                            return false
                        },
                        onSubmit: function(hsb, hex, rgb) {
                            $('#' + (this.attr('parentid'))).css('background-color', "#" + hex);
                            _PrimitiveEditor.setProperty(this.attr('nodeid'), this.attr('propname'), [rgb.r / 255, rgb.g / 255, rgb.b / 255]);
                        },
                        onChange: function(hsb, hex, rgb) {
                            $('#' + (this.attr('parentid'))).css('background-color', "#" + hex);
                            _PrimitiveEditor.setProperty(this.attr('nodeid'), this.attr('propname'), [rgb.r / 255, rgb.g / 255, rgb.b / 255]);
                        }
                    });
                    $('#' + $('#' + nodeid + i + 'ColorPicker').data('colorpickerId')).attr('parentid', parentid);;
                    $('#' + $('#' + nodeid + i + 'ColorPicker').data('colorpickerId')).attr('propname', editordata[i].property);
                    $('#' + $('#' + nodeid + i + 'ColorPicker').data('colorpickerId')).attr('nodeid', nodeid);
                    this.addPropertyEditorDialog(node.id, editordata[i].property, $('#' + nodeid + i + 'ColorPicker'), 'color');
                }
            }
            $('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'deletebutton"/>');
            $('#' + nodeid + 'deletebutton').button({
                label: 'Delete'
            });
            $('#' + nodeid + 'deletebutton').click(this.deleteButtonClicked);
            $('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'selectbutton"/>');
            $('#' + nodeid + 'selectbutton').button({
                label: 'Select'
            });
            $('#' + nodeid + 'selectbutton').click(this.selectButtonClicked);
            //remove save button. too confusing
            // $('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'savebutton"/>');
            // $('#' + nodeid + 'savebutton').button(
            // {
            // label: 'Save'
            // });
            // $('#' + nodeid + 'savebutton').click(this.saveButtonClicked);
            $('#basicSettings' + nodeid).append('<div style="margin-top: 1em;" nodename="' + node.id + '" id="' + nodeid + 'copybutton"/>');
            $('#' + nodeid + 'copybutton').button({
                label: 'Copy'
            });
            $('#' + nodeid + 'copybutton').click(this.copyButtonClicked);
        }
        this.deleteButtonClicked = function() {
            if (document.PlayerNumber == null) {
                _Notifier.notify('You must log in to participate');
                return;
            }
            var id = $(this).attr('nodename');
            if (_PermissionsManager.getPermission(_UserManager.GetCurrentUserName(), id) == 0) {
                _Notifier.notify('You do not have permission to delete this object');
                return;
            }
            if (id == _Editor.GetSelectedVWFNode().id) {
                _Editor.DeleteSelection();
            } else {
                vwf_view.kernel.deleteNode(id);
                vwf_view.kernel.callMethod(_Editor.GetSelectedVWFNode().id, 'dirtyStack');
                window.setTimeout(function() {
                    _PrimitiveEditor.SelectionChanged(null, _Editor.GetSelectedVWFNode());
                }, 500);
            }
        }
        this.selectButtonClicked = function() {
            var id = $(this).attr('nodename');
            _Editor.SelectObject(id);
        }
        this.copyButtonClicked = function() {
            var id = $(this).attr('nodename');

            _Editor.Copy([{
                id: id
            }]);
        }
        this.saveButtonClicked = function() {
            var id = $(this).attr('nodename');
            _InventoryManager.Take(id);
        }
        this.modifierAmountUpdate = function(e, ui) {
            var id = $(this).attr('nodename');
            var amount = ui.value;
            _PrimitiveEditor.setProperty(id, 'amount', amount);
        }
        this.positionChanged = function() {
            this.setTransform();
        }
        this.makeRotMat = function(x, y, z) {
            var xm = [

                1, 0, 0, 0,
                0, Math.cos(x), -Math.sin(x), 0,
                0, Math.sin(x), Math.cos(x), 0,
                0, 0, 0, 1

            ];

            var ym = [

                Math.cos(y), 0, Math.sin(y), 0,
                0, 1, 0, 0, -Math.sin(y), 0, Math.cos(y), 0,
                0, 0, 0, 1
            ];

            var zm = [

                Math.cos(z), -Math.sin(z), 0, 0,
                Math.sin(z), Math.cos(z), 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1

            ];
            return goog.vec.Mat4.multMat(xm, goog.vec.Mat4.multMat(ym, zm, []), []);

        }
        this.rotationMatrix_2_XYZ = function(m) {
            var x = Math.atan2(m[9], m[10]);
            var y = Math.atan2(-m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10]));
            var z = Math.atan2(m[4], m[0]);
            return [x, y, z];
        }
        this.setTransform = function() {

            var val = [0, 0, 0];
            val[0] = $('#RotationX').val();
            val[1] = $('#RotationY').val();
            val[2] = $('#RotationZ').val();

            var rotmat = this.makeRotMat(parseFloat(val[0]) / 57.2957795, parseFloat(val[1]) / 57.2957795, parseFloat(val[2]) / 57.2957795);
            var scale = [parseFloat($('#ScaleX').val()), parseFloat($('#ScaleY').val()), parseFloat($('#ScaleZ').val())];
            var pos = [parseFloat($('#PositionX').val()), parseFloat($('#PositionY').val()), parseFloat($('#PositionZ').val())];


            rotmat = goog.vec.Mat4.scale(rotmat, scale[0], scale[1], scale[2]);

            pos = goog.vec.Mat4.translate(goog.vec.Mat4.createIdentity(), pos[0], pos[1], pos[2])

            var val = goog.vec.Mat4.multMat(pos, rotmat, []);

            this.setProperty(_Editor.GetSelectedVWFNode().id, 'transform', val);
        }
        this.rotationChanged = function() {
            this.setTransform();
        }
        this.scaleChanged = function() {
            this.setTransform();
        }
        this.NodePropertyUpdate = function(nodeID, propName, propVal) {


            for (var i = 0; i < this.propertyEditorDialogs.length; i++) {

                var diag = this.propertyEditorDialogs[i];

                if (diag.propName == propName && diag.nodeid == nodeID) {
                    //typing into the textbox can be infuriating if it updates while you type!
                    //need to filter out sets from self
                    if (diag.type == 'text' && vwf.client() != vwf.moniker())
                        diag.element.val(propVal);
                    if (diag.type == 'slider')
                        diag.element.slider('value', propVal);
                    if (diag.type == 'check')
                        diag.element.attr('checked', propVal);
                }
            }
        }
        this.addPropertyEditorDialog = function(nodeid, propname, element, type) {
            this.propertyEditorDialogs.push({
                propName: propname,
                type: type,
                element: element,
                nodeid: nodeid

            });
        }
        this.clearPropertyEditorDialogs = function() {
            this.propertyEditorDialogs = [];
        }
        this.SelectionTransformed = function(e, node) {
            try {
                if (node) {

                    var mat = vwf.getProperty(node.id, 'transform');
                    var angles = this.rotationMatrix_2_XYZ(mat);
                    var pos = [mat[12],mat[13],mat[14]];

                    var scl = [MATH.lengthVec3([mat[0],mat[4],mat[8]]),MATH.lengthVec3([mat[1],mat[5],mat[9]]),MATH.lengthVec3([mat[2],mat[6],mat[10]])]
                    $('#PositionX').val(Math.floor(pos[0] * 1000) / 1000);
                    $('#PositionY').val(Math.floor(pos[1] * 1000) / 1000);
                    $('#PositionZ').val(Math.floor(pos[2] * 1000) / 1000);

                    //since there is ambiguity in the matrix, we need to keep these values aroud. otherwise , the typeins don't really do what you would think		
                    $('#RotationX').val(Math.round(angles[0] * 57.2957795));
                    $('#RotationY').val(Math.round(angles[1] * 57.2957795));
                    $('#RotationZ').val(Math.round(angles[2] * 57.2957795));

                    //$('#RotationW').val(rot[3]);
                    $('#ScaleX').val(Math.floor(scl[0] * 1000) / 1000);
                    $('#ScaleY').val(Math.floor(scl[1] * 1000) / 1000);
                    $('#ScaleZ').val(Math.floor(scl[2] * 1000) / 1000);
                }
            } catch (e) {
                //console.log(e);
            }
        }
        $(document).bind('selectionChanged', this.SelectionChanged.bind(this));
        $(document).bind('modifierCreated', this.SelectionChanged.bind(this));
        $(document).bind('selectionTransformedLocal', this.SelectionTransformed.bind(this));
        $(document).bind('nodePropChanged', this.NodePropertyUpdate.bind(this));
        $('#PositionX').change(this.positionChanged.bind(this));
        $('#PositionY').change(this.positionChanged.bind(this));
        $('#PositionZ').change(this.positionChanged.bind(this));
        $('#RotationX').change(this.rotationChanged.bind(this));
        $('#RotationY').change(this.rotationChanged.bind(this));
        $('#RotationZ').change(this.rotationChanged.bind(this));
        $('#RotationW').change(this.rotationChanged.bind(this));
        $('#ScaleX').change(this.scaleChanged.bind(this));
        $('#ScaleY').change(this.scaleChanged.bind(this));
        $('#ScaleZ').change(this.scaleChanged.bind(this));
        $('#RotationW').hide();
    }
});