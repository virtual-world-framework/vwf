(function() {
    function isStatic(childID, childSource, childName) {
        this.isStatic = false;
        this.dynamic = false;
        this.settingProperty = function(propname, propval) {
            if (propname == 'isStatic') {

                if (this.sourceType == 'subDriver/threejs/asset/vnd.collada+xml+optimized') {
                    console.warn('Optimized assets cannot currently be marked static.');
                    return propval;
                }

                this.isStatic = propval;
                if (!this.dynamic)
                    this.getRoot().setStatic(this.isStatic);
                if (this.isStatic)
                    this.settingProperty('visible', true);
                return propval;
            }
            if (propname == 'isDynamic') {

                if (this.sourceType == 'subDriver/threejs/asset/vnd.collada+xml+optimized') {
                    console.warn('Optimized assets cannot currently be marked dynamic.');
                    return propval;
                }

                this.settingProperty('isStatic', false);
                this.dynamic = propval;
                this.getRoot().setDynamic(propval);
                return propval;
            }
        }
        this.gettingProperty = function(propname, propval) {
            if (propname == 'isStatic') {
                return this.isStatic;
            }
            if (propname == 'isDynamic') {
                return this.dynamic;
            }
        }
    }


    //default factory code
    return function(childID, childSource, childName) {
        //name of the node constructor
        return new isStatic(childID, childSource, childName);
    }
})();