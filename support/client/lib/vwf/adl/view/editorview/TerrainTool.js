function TerrainTool() {

    var self = this;
    $('#sidepanel').append("<div id='TerrainToolGUI' class='ui-accordion-content ui-helper-reset ui-widget-content ui-corner-bottom ui-accordion-content-active' style='padding-bottom:5px;overflow:hidden;height:auto'></div>");

    $('#TerrainToolGUI').append("<div id='TerrainToolGUItitle' style = 'padding:3px 4px 3px 4px;font:1.5em sans-serif;font-weight: bold;' class='ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix' ><span class='ui-dialog-title' id='ui-dialog-title-Players'>Spline Tools</span></div>");
    $('#TerrainToolGUI').append("<input type='checkbox' id='TerrainToolGUIEditcontrolPoints'></input><label for='TerrainToolGUIEditcontrolPoints' style = 'display:block'/>");
    $('#TerrainToolGUI').append("<input type='checkbox' id='TerrainToolGUIRefine'></input><label for='TerrainToolGUIRefine' style = 'display:block'/>");
    $('#TerrainToolGUI').append("<div id='TerrainToolGUIDist'></div>");
    $('#TerrainToolGUI').append("<div id='TerrainToolGUIFalloff'></div>");
    $('#TerrainToolGUI').append("<div id='TerrainToolGUIRemove'></div>");
    $('#TerrainToolGUI').append("<div id='TerrainToolGUIDuplicate'></div>");
    $('#TerrainToolGUI').append("<div id='TerrainToolGUIRandom'></div>");
    $('#TerrainToolGUI').append("<div id='TerrainToolGUIClear'></div>");
    $('#TerrainToolGUIEditcontrolPoints').button({
        label: 'Active'
    });
    $('#TerrainToolGUIRefine').button({
        label: 'Refine'
    });
    $('#TerrainToolGUIRemove').button({
        label: 'Remove'
    });
    $('#TerrainToolGUIRandom').button({
        label: 'Random'
    });
    $('#TerrainToolGUIDuplicate').button({
        label: 'Duplicate'
    });
    $('#TerrainToolGUIClear').button({
        label: 'Clear'
    });

    $('#TerrainToolGUIFalloff').slider({
        min: 0,
        max: 2,
        step: .01,
        slide: function(e, ui) {

            self.controlPoints[self.selectedIndex].falloff = ui.value;
            _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
            _Editor.updateGizmoLocation();
            _Editor.updateBounds();

        }
    });
    $('#TerrainToolGUIDist').slider({
        min: 0,
        max: 100,
        step: .01,
        slide: function(e, ui) {

            self.controlPoints[self.selectedIndex].dist = ui.value;
            _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
            _Editor.updateGizmoLocation();
            _Editor.updateBounds();

        }
    });


    $('#TerrainToolGUIDuplicate').click(function(e) {



        var cp = self.controlPoints[self.selectedIndex];
        var cp2 = {};
        cp2.x = cp.x;
        cp2.y = cp.y;
        cp2.z = cp.z;
        cp2.dist = cp.dist;
        cp2.falloff = cp.falloff;
        self.controlPoints.push(cp2);
        self.selectedIndex = self.controlPoints.length - 1;
        _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
        self.updateDisplay();

        _Editor.updateGizmoLocation();
        _Editor.updateBounds();

    });
    $('#TerrainToolGUIRandom').click(function(e) {


        self.controlPoints = [];
        for (var i = 0; i < 100; i++) {
            var cp2 = {};
            cp2.x = Math.SecureRandom() * 1000 - 500
            cp2.y = Math.SecureRandom() * 1000 - 500
            cp2.z = Math.SecureRandom() * 30 - 15
            cp2.dist = Math.SecureRandom() * 200
            cp2.falloff = Math.SecureRandom() + .5
            self.controlPoints.push(cp2);
        }
        self.selectedIndex = self.controlPoints.length - 1;
        _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
        self.updateDisplay();

        _Editor.updateGizmoLocation();
        _Editor.updateBounds();

    });
    $('#TerrainToolGUIClear').click(function(e) {



        self.controlPoints = [];

        self.selectedIndex = -1;
        _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
        self.updateDisplay();

        _Editor.updateGizmoLocation();
        _Editor.updateBounds();

    });

    $('#TerrainToolGUItitle').append('<a id="TerrainToolclose" href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" style="display: inline-block;float: right;"><span class="ui-icon ui-icon-closethick">close</span></a>');
    $('#TerrainToolGUItitle').prepend('<img class="headericon" src="../vwf/view/editorview/images/icons/inventory.png" />');
    $('#TerrainToolGUI').css('border-bottom', '5px solid #444444')
    $('#TerrainToolGUI').css('border-left', '2px solid #444444')
    $('#TerrainToolclose').click(function() {
        _TerrainTool.hide()
    });


    $('#TerrainToolGUIEditcontrolPoints').change(function(e) {


        var checked = ($(this).next().attr('aria-pressed'));
        if (checked == 'true') {
            self.activate();
        } else {
            self.deactivate();
        }
    });

    self.activate = function() {

        var node = _Editor.getNode(_Editor.GetSelectedVWFID());

        if (_Editor.getSelectionCount() != 1) {
            _Notifier.alert('Select a single line object before using the Spline tool.');
            return;
        }

        if (!node || !node.properties || node.properties.type != 'Terrain') {
            _Notifier.alert('The Terrain tools can only be used on a terrain object. The object selected cannot be edited with this tool.');
            return;
        }


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
        self.controlPoints = vwf.getProperty(self.selectedID, 'controlPoints');
        self.transform = vwf.getProperty(self.selectedID, 'transform');
        _Editor.SetSelectMode('None');
        _Editor.updateGizmoLocation();
        _Editor.addTool('Spline', self);
        _Editor.setActiveTool('Spline');

        if (!self.display) {
            self.display = new THREE.Object3D();
        }
        while (self.display.children.length > 0)
            self.display.remove(self.display.children[0]);
        _dScene.add(self.display);
        self.updateDisplay();
        $(document).bind('prerender', self.prerender);
    }
    self.updateDisplay = function() {
        var need = self.controlPoints.length - self.display.children.length;
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
                //cube.InvisibleToCPUPick = true;			
                self.display.add(cube);
            }
        } else {
            for (var i = 0; i > need; i--)
                self.display.remove(self.display.children[0]);
        }
        var transform = self.transform.slice(0);
        var selfT = new THREE.Matrix4();
        selfT.elements = transform;

        for (var i = 0; i < self.controlPoints.length; i++) {
            var vec = new THREE.Vector3(self.controlPoints[i].x, self.controlPoints[i].y, self.controlPoints[i].z);

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
        for (var i = 0; i < self.controlPoints.length; i++) {

            var vec = new THREE.Vector3(self.controlPoints[i].x, self.controlPoints[i].y, self.controlPoints[i].z);

            vec = vec.applyMatrix4(selfT);
            var dist = MATH.distanceVec3([vec.x, vec.y, vec.z], campos);



            self.display.children[i].scale = new THREE.Vector3(dist / 100, dist / 100, dist / 100);
            self.display.children[i].updateMatrixWorld(true);
        }
    }
    self.deactivate = function() {
        _Editor.setTransformCallback = _Editor.setTransform;
        _Editor.setTranslationCallback = _Editor.setTranslation;
        _Editor.setScaleCallback = _Editor.setScale;

        _Editor.getTransformCallback = _Editor.getTransform;
        _Editor.getTranslationCallback = _Editor.getTranslation;
        _Editor.getScaleCallback = _Editor.getScale;
        _Editor.updateGizmoLocation();
        _Editor.setActiveTool('Gizmo');
        _dScene.remove(this.display);
        $(document).unbind('prerender', self.prerender);
    }









    $
    $('#TerrainToolGUIRemove').click(function(e) {



        self.controlPoints.splice(self.selectedIndex, 1);
        _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
        self.updateDisplay();

        _Editor.updateGizmoLocation();
        _Editor.updateBounds();

    });

    $(document).bind('sidePanelClosed', function() {

        _Editor.setActiveTool('Gizmo');
        var checked = ($('#TerrainToolGUIActivteTool').next().attr('aria-pressed'));
        if (checked == 'true')
            $('#TerrainToolGUIActivteTool').click();
    });

    self.setTransform = function(id, propertyValue) {

        var transform = self.transform.slice(0);

        var selfT = new THREE.Matrix4();
        selfT.elements = transform;

        var prop = new THREE.Matrix4();
        prop.elements = propertyValue;
        selfT.getInverse(selfT);
        prop = selfT.multiply(prop);

        self.controlPoints[self.selectedIndex].x = prop.elements[12];
        self.controlPoints[self.selectedIndex].y = prop.elements[13];
        self.controlPoints[self.selectedIndex].z = prop.elements[14];

        _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
        _Editor.updateGizmoLocation();
        _Editor.updateBounds();
        self.updateDisplay();
    }
    self.setTranslation = function(id, propertyValue) {
        // self.controlPoints[self.selectedIndex] = propertyValue;
        // _Editor.setProperty(self.selectedID,'controlPoints',self.controlPoints);
        // _Editor.updateGizmoLocation();
        // _Editor.updateBounds();
    }
    self.setScale = function(id, val) {


    }

    self.getTransform = function(id) {

        if (self.selectedIndex < 0 || self.selectedIndex >= self.controlPoints.length)
            return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

        var trans = new THREE.Matrix4();
        trans.elements[12] = self.controlPoints[self.selectedIndex].x;
        trans.elements[13] = self.controlPoints[self.selectedIndex].y;
        trans.elements[14] = self.controlPoints[self.selectedIndex].z;

        var transform = self.transform.slice(0);
        var selfT = new THREE.Matrix4();
        selfT.elements = transform;

        trans = selfT.multiply(trans);
        return trans.elements;
    }
    self.getTranslation = function(id) {
        //return self.controlPoints[self.selectedIndex];
    }
    self.getScale = function(id) {
        return [1, 1, 1];
    }
    self.defaultMouseDown = function(e) {
        self.mousemoved = false;
        _Editor.mousedown_Gizmo(e);
    }
    self.mousedown = function(e) {
        if (self.mousedownCallback)
            self.mousedownCallback(e);
    }

    $('#TerrainToolGUIRefine').change(function(e) {

        var checked = ($(this).next().attr('aria-pressed'));
        if (checked == 'true') {
            self.mouseupCallback = self.refine;
            self.mousedownCallback = null;
        } else {
            self.mouseupCallback = self.selectOrMove;
            self.mousedownCallback = self.defaultMouseDown;
        }
    });
    self.refine = function(e) {
        if (e.button != 0) return;
        var ray = _Editor.GetWorldPickRay(e);
        var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];

        var hits = _Editor.findviewnode(self.selectedID).children[0].CPUPick(campos, ray, {});
        if (hits.length > 0) {

            var point = hits[0].point;
            var cp = {};
            cp.x = point[0];
            cp.y = point[1];
            cp.z = point[2];
            cp.dist = 1;
            cp.falloff = 1;
            this.controlPoints.push(cp);
            this.selectedIndex = this.controlPoints.length - 1;
            $('#TerrainToolGUIDist').slider('option', 'value', 1);
            $('#TerrainToolGUIFalloff').slider('option', 'value', 1);
            _Editor.setProperty(self.selectedID, 'controlPoints', self.controlPoints);
            self.updateDisplay();
            _Editor.updateGizmoLocation();

            $('#TerrainToolGUIRefine').click();

        }

    }

    self.selectOrMove = function(e) {

        if (e.button != 0) return;
        var ray = _Editor.GetWorldPickRay(e);
        var campos = [_Editor.findcamera().position.x, _Editor.findcamera().position.y, _Editor.findcamera().position.z];


        var hits = self.display.CPUPick(campos, ray, {});
        if (hits.length > 0 && !self.mousemoved) {

            for (var i = 0; i < this.display.children.length; i++) {
                if (hits[0].object == this.display.children[i])
                    this.selectedIndex = i;
            }
            $('#TerrainToolGUIDist').slider('option', 'value', self.controlPoints[self.selectedIndex].falloff);
            $('#TerrainToolGUIFalloff').slider('option', 'value', self.controlPoints[self.selectedIndex].dist);
            _Editor.updateGizmoLocation();
            _Editor.mouseup_Gizmo(e);
        } else {
            _Editor.mouseup_Gizmo(e);
        }
    }

    self.mouseup = function(e) {
        if (self.mouseupCallback)
            self.mouseupCallback(e);
    }
    self.click = function(e) {

    }
    self.mousemove = function(e) {
        self.mousemoved = true;
        _Editor.mousemove_Gizmo(e);
    }
    self.mousewheel = function(e) {

    }
    self.keyup = function(e) {

    }
    self.keydown = function(e) {

    }


    self.show = function() {


        //$('#TerrainToolGUI').dialog('open');
        $('#TerrainToolGUI').prependTo($('#TerrainToolGUI').parent());
        $('#TerrainToolGUI').show('blind', function() {
            if ($('#sidepanel').data('jsp'))
                $('#sidepanel').data('jsp').reinitialise();
        });


        showSidePanel();
        _TerrainTool.open = true;

    }

    self.hide = function() {
        //$('#TerrainToolGUI').dialog('close');
        $('#TerrainToolGUI').hide('blind', function() {

            if ($('#sidepanel').data('jsp'))
                $('#sidepanel').data('jsp').reinitialise();
            if (!$('#sidepanel').children('.jspContainer').children('.jspPane').children().is(':visible'))
                hideSidePanel();
        });

        var checked = ($('#TerrainToolGUIActivteTool').next().attr('aria-pressed'));
        if (checked == 'true')
            $('#TerrainToolGUIActivteTool').click();

    }
    self.isOpen = function() {
        //return $("#TerrainToolGUI").dialog( "isOpen" );
        return $('#TerrainToolGUI').is(':visible');
    }
}
_TerrainTool = new TerrainTool();
_TerrainTool.hide();