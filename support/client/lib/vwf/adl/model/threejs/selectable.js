//this functionality exists to make it possible for the VWF level to disable ray and spherecast functionality
//from objects
(function() {
    function isSelectable(childID, childSource, childName) {
        this.isSelectable = true;
        this.selectable_GetAllLeafMeshes = function(threeObject, list) {
            if (threeObject instanceof THREE.Mesh || threeObject instanceof THREE.Mesh) {
                list.push(threeObject);
            }
            if (threeObject.children) {
                for (var i = 0; i < threeObject.children.length; i++) {
                    if (!threeObject.children[i].vwfID)
                        this.GetAllLeafMeshes(threeObject.children[i], list);
                }
            }
        }
        this.settingProperty = function(propname, propval) {
            if (propname == 'isSelectable') {
                this.isSelectable = propval;
                var list = [];
                this.selectable_GetAllLeafMeshes(this.getRoot(), list);
                for (var i = 0; i < list.length; i++) {
                    list[i].InvisibleToCPUPick = !propval;
                }
            }
        }
        this.gettingProperty = function(propname, propval) {
            if (propname == 'isSelectable') {
                return this.isSelectable;
            }
        }
    }
    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new isSelectable(childID, childSource, childName);
    }
})();