define(function() {

    this.initialize = function() {
        $('#sidepanel').append("<div id='sidetabs' />");

        $("#sidetabs").append("<div id='SideTabModels' class='sidetab'>Models</div>");
        $("#sidetabs").append("<div id='SideTabProperties'  class='sidetab'>Properties</div>");
        $("#sidetabs").append("<div id='SideTabMaterials'  class='sidetab'>Material</div>");
        $("#sidetabs").append("<div id='SideTabHierarchy'  class='sidetab'>Hierarchy</div>");
        $("#sidetabs").append("<div id='SideTabUsers'  class='sidetab'>Users</div>");
        $("#sidetabs").append("<div id='SideTabInventory'  class='sidetab'>Inventory</div>");
        $("#sidetabs").append("<div id='SideTabScripts'  class='sidetab'>Scripts</div>");
        $("#sidetabs").append("<div id='SideTabChat'  class='sidetab'>Chat</div>");
        $("#sidetabs").append("<div id='SideTabPhysics'  class='sidetab'>Physics</div>");
        $("#sidepanel").css('overflow', 'visible');

        $("#SideTabModels").click(function() {
            _ModelLibrary.show();
        });

        $("#SideTabUsers").click(function() {
            $('#Players').prependTo($('#Players').parent());
            $('#Players').show('blind', function() {});
            showSidePanel();
        });

        $("#SideTabChat").click(function() {
            $('#ChatWindow').dialog('open');
        });

        $("#SideTabProperties").click(function() {
            if (!_PrimitiveEditor.isOpen())
                _PrimitiveEditor.show()
            else
                _PrimitiveEditor.hide();
        })

        $("#SideTabMaterials").click(function() {
            if (!_MaterialEditor.isOpen())
                _MaterialEditor.show()
            else
                _MaterialEditor.hide();
        })
        $("#SideTabHierarchy").click(function() {
            if (!HierarchyManager.isOpen())
                HierarchyManager.show()
            else
                HierarchyManager.hide();
        })
        $("#SideTabInventory").click(function() {
            if (!_InventoryManager.isOpen())
                _InventoryManager.show()
            else
                _InventoryManager.hide();
        })
        $("#SideTabScripts").click(function() {
            if (!_ScriptEditor.isOpen())
                _ScriptEditor.show()
            else
                _ScriptEditor.hide();
        })
        $("#SideTabPhysics").click(function() {
            if (!_PhysicsEditor.isOpen())
                _PhysicsEditor.show()
            else
                _PhysicsEditor.hide();
        })
    }
    return this;
});