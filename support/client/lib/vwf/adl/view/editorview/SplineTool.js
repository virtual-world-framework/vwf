function SplineTool() {

    var self = this;
    $('#sidepanel').append("<div id='SplineToolGUI' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");

    $('#SplineToolGUI').append("<div id='SplineToolGUItitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Spline Tools</span></div>");
    $('#SplineToolGUI').append("<div id='SplineToolGUIEditPoints' style='width:100%'></div>");
    $('#SplineToolGUI').append("<div id='SplineToolGUIRefine' style='width:49%'></div>");
    $('#SplineToolGUI').append("<div id='SplineToolGUIDraw' style='width:49%'></div>");
    $('#SplineToolGUI').append("<div id='SplineToolGUIRemove'></div>");
    $('#SplineToolGUI').append("<div id='SplineToolGUIClear'></div>");
    $('#SplineToolGUI').append("<div id='SplineToolGUISmooth'></div>");
    $('#SplineToolGUI').append("<div id='SplineToolGUIReduce'></div>");
    $('#SplineToolGUIEditPoints').button({
        label: 'Active'
    });
    $('#SplineToolGUIRefine').button({
        label: 'Refine'
    });
    $('#SplineToolGUIRemove').button({
        label: 'Remove'
    });
    $('#SplineToolGUIClear').button({
        label: 'Clear'
    });
    $('#SplineToolGUIDraw').button({
        label: 'Draw'
    });
    $('#SplineToolGUISmooth').button({
        label: 'Smooth'
    });
    $('#SplineToolGUIReduce').button({
        label: 'Reduce'
    });



    $('#SplineToolGUItitle').append('<a id="SplineToolclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
    $('#SplineToolGUItitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/inventory.png" />');
    $('#SplineToolGUI').css('border-bottom', '5px solid #444444')
    $('#SplineToolGUI').css('border-left', '2px solid #444444')
    $('#SplineToolclose').click(function() {
        _SplineTool.hide()
    });


    $('#SplineToolGUIEditPoints').click(function(e) {



        if (!self.active) {
            self.activate();

        } else {
            self.deactivate();

        }
    });

    self.createdNode = function(parentid, childid, childname, proto) {


    }
    self.active = false;
    self.activate = function() {


        var node = _Editor.getNode(_Editor.GetSelectedVWFID());



        if (_Editor.getSelectionCount() != 1) {
            _Notifier.alert('Select a single line object before using the Spline tool.');
            return;
        }

        if (!node || !(vwf.getProperty(node.id, 'type') == 'Line' || vwf.getProperty(node.id, 'type') == 'Spline')) {
            _Notifier.alert('The Spline tools can only be used on a line object. The object selected cannot be edited with this tool.');
            self.deactivate();
            return;
        }
        if (vwf.getProperty(node.id, 'type') == 'Spline') {
            alertify.confirm('The Spline tools can only be used on a line object. The selected object can be converted into an editable line. This action cannot be undone. Continue?', function(e) {
                if (!e) {
                    self.deactivate();
                    return;


                } else {
                    _Editor.addTool('Spline', self);
                    _Editor.setActiveTool('Spline');

                    var parent = vwf.parent(node.id);
                    var name = node.name
                    var proto = _DataManager.getCleanNodePrototype(node);
                    proto.properties.owner = _UserManager.GetCurrentUserName();
                    proto.properties.points = vwf.callMethod(_Editor.GetSelectedVWFID(), 'getPoints');
                    proto.extends = 'line2.vwf';
                    proto.source = "vwf/model/threejs/line.js"
                    _Editor.DeleteSelection();
                    _Editor.createChild(parent, name, proto);
                    _Editor.SelectOnNextCreate([name]);

                }

            });
            return;
        }
        $('#SplineToolGUIEditPoints').children().css('background-color', 'red');
        _Editor.addTool('Spline', self);
        _Editor.setActiveTool('Spline');

        self.mousemoved = false;
        self.selectedIndex = 0;
        self.mouseupCallback = self.selectOrMove;
        self.mousedownCallback = self.defaultMouseDown;
        _Editor.setTransformCallback = self.setTransform;
        _Editor.setTranslationCallback = self.setTranslation;
        _Editor.setScaleCallback = self.setScale;

        _Editor.getTransformCallback = self.getTransform;
        _Editor.getTranslationCallback = self.getTranslation;
        _Editor.getScaleCallback = self.getScale;
        self.selectedID = _Editor.GetSelectedVWFID();
        self.points = vwf.getProperty(self.selectedID, 'points');
        self.transform = vwf.getProperty(self.selectedID, 'transform');
        _Editor.SetSelectMode('None');
        _Editor.updateGizmoLocation();
        self.active = true;

        if (!self.display) {
            self.display = new THREE.Object3D();
        }
        while (self.display.children.length > 0)
            self.display.remove(self.display.children[0]);
        _dScene.add(self.display);
        self.updateDisplay();
        _dView.bind('prerender', self.prerender);
    }
    self.updateDisplay = function() {
        var need = self.points.length - self.display.children.length;
        if (!self.mat) {
            self.mat = new THREE.MeshBasicMaterial();
            self.mat.color.r = 0;
            self.mat.color.g = 0;
            self.mat.color.b = 1;
            self.mat.depthTest = false;
            self.mat.transparent = true;

        }
        if (need > 0) {
            for (var i = 0; i < need; i++) {
                var cube = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), self.mat);
                cube.geometry.InvisibleToCPUPick = true;
                self.display.add(cube);
            }
        } else {
            for (var i = 0; i > need; i--)
                self.display.remove(self.display.children[0]);
        }
        var transform = self.transform.slice(0);
        var selfT = new THREE.Matrix4();
        selfT.elements = transform;

        for (var i = 0; i < self.points.length; i++) {
            var vec = new THREE.Vector3(self.points[i][0], self.points[i][1], self.points[i][2]);

            vec = vec.applyMatrix4(selfT);

            self.display.children[i].position = vec;
            self.display.children[i].updateMatrixWorld(true);
        }
    }
    self.prerender = function() {

        var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];
        var transform = self.transform.slice(0);
        var selfT = new THREE.Matrix4();
        selfT.elements = transform;
        for (var i = 0; i < self.points.length; i++) {

            var vec = new THREE.Vector3(self.points[i][0], self.points[i][1], self.points[i][2]);

            vec = vec.applyMatrix4(selfT);
            var dist = MATH.distanceVec3([vec.x, vec.y, vec.z], campos);



            self.display.children[i].scale.x = dist / 100;
            self.display.children[i].scale.y = dist / 100;
            self.display.children[i].scale.z = dist / 100;
            self.display.updateMatrixWorld(true);
        }
    }
    self.unselectAllModeButtons = function() {
        $('#SplineToolGUIRefine').children().css('background-color', '');
        $('#SplineToolGUIDraw').children().css('background-color', '');
    }
    self.selectModeButton = function(id) {
        $(id).children().css('background-color', 'red');
    }
    self.deactivate = function() {

        $('#SplineToolGUIEditPoints').children().css('background-color', '');
        _Editor.setTransformCallback = _Editor.setTransform;
        _Editor.setTranslationCallback = _Editor.setTranslation;
        _Editor.setScaleCallback = _Editor.setScale;

        _Editor.getTransformCallback = _Editor.getTransform;
        _Editor.getTranslationCallback = _Editor.getTranslation;
        _Editor.getScaleCallback = _Editor.getScale;
        _Editor.updateGizmoLocation();
        _Editor.setActiveTool('Gizmo');
        if (this.display)
            _dScene.remove(this.display);
        _dView.unbind('prerender', self.prerender);
        self.active = false;
    }
    $('#SplineToolGUIRefine').click(function(e) {



        if (self.mouseupCallback != self.refine) {
            self.mouseupCallback = self.refine;
            self.mousedownCallback = null;
            self.unselectAllModeButtons();
            self.selectModeButton('#SplineToolGUIRefine');
        } else {
            self.mouseupCallback = self.selectOrMove;
            self.mousedownCallback = self.defaultMouseDown;
            self.unselectAllModeButtons();
        }
    });

    $('#SplineToolGUIDraw').click(function(e) {



        if (self.mouseupCallback != self.draw) {
            self.mouseupCallback = self.draw;
            self.mousedownCallback = null;
            self.unselectAllModeButtons();
            self.selectModeButton('#SplineToolGUIDraw');
        } else {
            self.mouseupCallback = self.selectOrMove;
            self.mousedownCallback = self.defaultMouseDown;
            self.unselectAllModeButtons();
        }
    });



    $('#SplineToolGUISmooth').click(function(e) {

        var spline = new THREE.SplineCurve3();
        for (var i = 0; i < self.points.length; i++) {
            spline.points.push(new THREE.Vector3(self.points[i][0], self.points[i][1], self.points[i][2]));
        }

        var newcount = self.points.length * 2;
        var step = 1.0 / newcount;
        self.points = []
        for (var i = 0; i < 1.0; i += step) {
            var p = spline.getPoint(i);
            self.points.push([p.x, p.y, p.z]);
        }
        var p = spline.getPoint(1);
        self.points.push([p.x, p.y, p.z]);
        _Editor.setProperty(self.selectedID, 'points', self.points);
        self.updateDisplay();
        _Editor.updateBounds();

    });

    $('#SplineToolGUIReduce').click(function(e) {

        var spline = new THREE.SplineCurve3();
        for (var i = 0; i < self.points.length; i++) {
            spline.points.push(new THREE.Vector3(self.points[i][0], self.points[i][1], self.points[i][2]));
        }

        var newcount = self.points.length / 2;
        var step = 1.0 / newcount;
        self.points = []
        for (var i = 0; i < 1.0; i += step) {
            var p = spline.getPoint(i);
            self.points.push([p.x, p.y, p.z]);
        }
        var p = spline.getPoint(1);
        self.points.push([p.x, p.y, p.z]);
        _Editor.setProperty(self.selectedID, 'points', self.points);
        self.updateDisplay();
        _Editor.updateBounds();

    });

    $('#SplineToolGUIClear').click(function(e) {
        self.points = [];
        _Editor.setProperty(self.selectedID, 'points', self.points);
        self.updateDisplay();
        _Editor.updateGizmoLocation();
    });
    $('#SplineToolGUIRemove').click(function(e) {



        self.points.splice(self.selectedIndex, 1);
        _Editor.setProperty(self.selectedID, 'points', self.points);
        self.updateDisplay();

        _Editor.updateGizmoLocation();
        _Editor.updateBounds();

    });

    $(document).bind('sidePanelClosed', function() {

        _Editor.setActiveTool('Gizmo');
        var checked = ($('#SplineToolGUIActivteTool').next().attr('aria-pressed'));
        if (checked == 'true')
            $('#SplineToolGUIActivteTool').click();
    });

    self.setTransform = function(id, propertyValue) {

        var transform = self.transform.slice(0);

        var selfT = new THREE.Matrix4();
        selfT.elements = transform;

        var prop = new THREE.Matrix4();
        prop.elements = propertyValue;
        selfT.getInverse(selfT);
        prop = selfT.multiply(prop);

        self.points[self.selectedIndex][0] = prop.elements[12];
        self.points[self.selectedIndex][1] = prop.elements[13];
        self.points[self.selectedIndex][2] = prop.elements[14];

        _Editor.setProperty(self.selectedID, 'points', self.points);
        _Editor.updateGizmoLocation();
        _Editor.updateBounds();
        self.updateDisplay();
    }
    self.setTranslation = function(id, propertyValue) {
        // self.points[self.selectedIndex] = propertyValue;
        // _Editor.setProperty(self.selectedID,'points',self.points);
        // _Editor.updateGizmoLocation();
        // _Editor.updateBounds();
    }
    self.setScale = function(id, val) {


    }

    self.getTransform = function(id) {

        if (self.selectedIndex < 0 || self.selectedIndex >= self.points.length)
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        var trans = new THREE.Matrix4();
        trans.elements[12] = self.points[self.selectedIndex][0];
        trans.elements[13] = self.points[self.selectedIndex][1];
        trans.elements[14] = self.points[self.selectedIndex][2];

        var transform = self.transform.slice(0);
        var selfT = new THREE.Matrix4();
        selfT.elements = transform;

        trans = selfT.multiply(trans);
        return trans.elements;
    }
    self.getTranslation = function(id) {
        var mat = self.getTransform(id);
        return [mat[12], mat[13], mat[14]];
    }
    self.getScale = function(id) {
        return [1, 1, 1];
    }
    self.defaultMouseDown = function(e) {
        self.mousemoved = false;
        _Editor.mousedown_Gizmo(e);
    }

    self.refine = function(e) {
        if (e.button != 0) return;
        var ray = _Editor.GetWorldPickRay(e);
        var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];

        var hits = _Editor.findviewnode(self.selectedID).children[0].CPUPick(campos, ray, {});
        if (hits.length > 0) {
            var v1 = hits[0].vertindex;
            var v2;
            var t = hits[0].t
            if (t > .5)
                v2 = v1 - 1;
            else v2 = v1 + 1;
            var i1 = Math.min(v1, v2);
            var i2 = Math.max(v1, v2);

            var p1 = self.points[i1];
            var p2 = self.points[i2];
            var newp = MATH.addVec3(p1, MATH.scaleVec3(MATH.subVec3(p2, p1), t));
            self.points.splice(i1 + 1, 0, newp);

            this.selectedIndex = i2;

            _Editor.setProperty(self.selectedID, 'points', self.points);
            self.updateDisplay();
            _Editor.updateGizmoLocation();

            $('#SplineToolGUIRefine').click();
        } else {

        }

    }
    self.remove = function(e) {
        var ray = _Editor.GetWorldPickRay(e);
        var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];

        var hits = _Editor.findviewnode(self.selectedID).children[0].CPUPick(campos, ray, {});
        if (hits.length > 0) {

            self.points.splice(hits[0].vertindex, 1);
            _Editor.setProperty(self.selectedID, 'points', self.points);
            _Editor.updateGizmoLocation();
            _Editor.updateBounds();

            $('#SplineToolGUIRemove').click();
        } else {

        }

    }
    self.selectOrMove = function(e) {

        if (e.button != 0) return;
        var ray = _Editor.GetWorldPickRay(e);
        var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];
        var hits = _Editor.findviewnode(self.selectedID).children[0].CPUPick(campos, ray, {});

        if (hits.length > 0 && !self.mousemoved) {
            self.selectedIndex = hits[0].vertindex;

            _Editor.updateGizmoLocation();
            _Editor.mouseup_Gizmo(e);
        } else {
            _Editor.mouseup_Gizmo(e);
        }
    }
    self.draw = function(e) {
        if (e.button != 0) return;
        var pos = _Editor.GetInsertPoint(e);
        pos = new THREE.Vector3(pos[0], pos[1], pos[2]);
        var transform = self.transform.slice(0);

        var selfT = new THREE.Matrix4();
        selfT.elements = transform;


        selfT.getInverse(selfT);
        pos = pos.applyMatrix4(selfT);
        self.points.push([pos.x, pos.y, pos.z]);
        _Editor.setProperty(self.selectedID, 'points', self.points);
        self.updateDisplay();
        _Editor.updateBounds();
    }
    self.mouseup = function(e) {
        self.lastMouseEvent = e;
        if (self.mouseupCallback)
            self.mouseupCallback(e);
    }
    self.click = function(e) {
        self.lastMouseEvent = e;
    }
    self.mousemove = function(e) {
        if (self.lastMouseEvent) {
            //somehow, we're getting a move event even when the mouse does not seem to have moved.
            //could be related to scrolltop on the body?
            if (self.lastMouseEvent.screenX != e.screenX && self.lastMouseEvent.screenY != e.screenY)
                self.mousemoved = true;
        }
        self.lastMouseEvent = e;

        _Editor.mousemove_Gizmo(e);
    }
    self.mousedown = function(e) {
        self.lastMouseEvent = e;
        if (self.mousedownCallback)
            self.mousedownCallback(e);
    }
    self.mousewheel = function(e) {

    }
    self.keyup = function(e) {

    }
    self.keydown = function(e) {

    }


    self.show = function() {


        //$('#SplineToolGUI').dialog('open');
        $('#SplineToolGUI').prependTo($('#SplineToolGUI').parent());
        $('#SplineToolGUI').show('blind', function() {
            if ($('#sidepanel').data('jsp'))
                $('#sidepanel').data('jsp').reinitialise();
        });


        showSidePanel();
        _SplineTool.open = true;

    }

    self.hide = function() {
        //$('#SplineToolGUI').dialog('close');
        $('#SplineToolGUI').hide('blind', function() {

            if ($('#sidepanel').data('jsp'))
                $('#sidepanel').data('jsp').reinitialise();
            if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible'))
                hideSidePanel();
        });

        var checked = ($('#SplineToolGUIActivteTool').next().attr('aria-pressed'));
        if (checked == 'true')
            $('#SplineToolGUIActivteTool').click();

    }
    self.isOpen = function() {
        //return $("#SplineToolGUI").dialog( "isOpen" );
        return $('#SplineToolGUI').is(':visible');
    }
    $(document).bind('selectionChanged', self.deactivate.bind(self));
}
_SplineTool = new SplineTool();
_SplineTool.hide();