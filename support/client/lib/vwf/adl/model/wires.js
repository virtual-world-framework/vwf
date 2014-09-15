"use strict";

// Copyright 2012 United States Government, as represented by the Secretary of Defense, Under
// Secretary of Defense (Personnel & Readiness).
// 
// Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
// in compliance with the License. You may obtain a copy of the License at
// 
//   http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software distributed under the License
// is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
// or implied. See the License for the specific language governing permissions and limitations under
// the License.

define( [ "module", "vwf/model" ], function( module, model ) {

    // vwf/model/object.js is a backstop property store.

    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.objects = {}; 
            this.creatingNode( undefined, 0 ); 
            this.wires = {};
            this.wires.incoming = {};
            this.wires.outgoing = {};

            
        },
        callingMethod:function(nodeID,method,args)
        {
            if(method == 'addWire')
            {
                this.addWire(nodeID,args[0],args[1],args[2]);
            }
        },
        addWire: function(node1,node2,prop1,prop2,dott,dots,funcstring)
        {
            if(prop1 == 'wires' || prop2 =='wires') {console.log('wireing the wire property is insane.'); return};

            var incoming = this.wires.incoming[node1];
            var outgoing = this.wires.outgoing[node2];
            if(!incoming)
            {
                this.wires.incoming[node1] = {};
            }
            if(!outgoing)
            {
                this.wires.outgoing[node2] = {};
            }
            incoming = this.wires.incoming[node1];
            outgoing = this.wires.outgoing[node2];

            var filter;
            if(funcstring)
            {
               var fullfuncstring = "(function(val){" + funcstring + "})";
               try{
                filter = eval(fullfuncstring);
               }catch(e)
               {

                filter = undefined;
               }
            }
            incoming[prop1] = {node:node2,prop:prop2,dott:dott,dots:dots,filterstring:funcstring,filter:filter};
            outgoing[prop2] = {node:node1,prop:prop1,dott:dott,dots:dots,filterstring:funcstring,filter:filter};
            
        },
        setDot:function(val,dot,newval)
        {
            var oldval = val;
            if(!dot || dot.length == 0 )
            {
                val = newval;
                return val;

            }
            dot = dot.slice(0);
            while(dot.length > 1)
            {
                val = val[dot[0]];
                dot.shift();
            }
            val[dot[0]] = newval;
            return oldval;
        },
        getDot:function(val,dot)
        {
            if(val === undefined ||val === null) return val;
            if(!dot || dot.length == 0) return val;
            dot = dot.slice(0);
            while(dot.length > 0)
            {
                val = val[dot[0]];
                dot.shift();
            }
            return val;
        },
        removeWire: function(node1,node2,prop1,prop2)
        {
            var incoming = this.wires.incoming[node1];
            var outgoing = this.wires.outgoing[node2];
            if(!incoming)
            {
                this.wires.incoming[node1] = {};
            }
            if(!outgoing)
            {
                this.wires.outgoing[node2] = {};
            }
            incoming = this.wires.incoming[node1];
            outgoing = this.wires.outgoing[node2];

            delete incoming[prop1];
            delete outgoing[prop2];
        },
        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function( nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {

            return;
            this.objects[childID] = {

                name: childName,

                id: childID,
                extends: childExtendsID,
                implements: childImplementsIDs,

                source: childSource,
                type: childType,

                uri: childURI,

                properties: {},

                

            };

        },

        // -- initializingNode ---------------------------------------------------------------------

        initializingNode: function( nodeID, childID ) {

            

        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function( nodeID ) {
            return;
            delete this.objects[nodeID];
            this.wires.incoming[nodeID];
            this.wires.outgoing[nodeID];
        },

    

        // -- addingChild --------------------------------------------------------------------------

        // addingChild: function( nodeID, childID, childName ) {  // TODO: not for global anchor node 0
        // },

        // -- removingChild ------------------------------------------------------------------------

        // removingChild: function( nodeID, childID ) {
        // },

        // TODO: creatingProperties, initializingProperties

        // -- settingProperties --------------------------------------------------------------------

        settingProperties: function( nodeID, properties ) {
            return;
            if ( ! this.objects[nodeID] ) return;  // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            var node_properties = this.objects[nodeID].properties;

            for ( var propertyName in properties ) {  // TODO: since undefined values don't serialize to json, interate over node_properties (has-own only) instead and set to undefined if missing from properties?

                node_properties[propertyName] = properties[propertyName];

            }

        },

        // -- gettingProperties --------------------------------------------------------------------

        gettingProperties: function( nodeID, properties ) {
            return;
            return this.objects[nodeID].properties;
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.initializingProperty( nodeID, propertyName, propertyValue );
        },

        // -- initializingProperty -----------------------------------------------------------------

        initializingProperty: function( nodeID, propertyName, propertyValue ) {
            return this.settingProperty( nodeID, propertyName, propertyValue );
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------

        settingProperty: function( nodeID, propertyName, propertyValue ) {
            return;
            var node = this.objects[nodeID];
            
            if(propertyName == 'wires')
            {
                node.properties[propertyName] = propertyValue;
                for(var i in this.wires.incoming[nodeID])
                {

                    var target = this.wires.incoming[nodeID][i].node;
                    var targetprop = this.wires.incoming[nodeID][i].prop;
                    delete this.wires.outgoing[target][targetprop];
                }
                this.wires.incoming[nodeID] = {};
                for(var i in propertyValue)
                {
                    var target = nodeID;
                    var source = propertyValue[i][0];
                    var targetprop = propertyValue[i][1];
                    var sourceprop = propertyValue[i][2];
                    var targetdot = propertyValue[i][3];
                    var sourcedot = propertyValue[i][4];

                    this.addWire(nodeID,propertyValue[i][0],propertyValue[i][1],propertyValue[i][2],propertyValue[i][3],propertyValue[i][4],propertyValue[i][5]);
                    if(this.objects[propertyValue[i][0]])
                    {
                        var newval = this.getDot(vwf.getProperty(source,sourceprop),sourcedot);
                        var oldval = vwf.getProperty(target,targetprop);
                        oldval = this.setDot(oldval,targetdot,newval);
                        vwf.setProperty(target,targetprop,oldval);
                    }
                    
                }
                return propertyValue;
            }

            var outgoing = this.wires.outgoing[nodeID];
            if(!outgoing) return;
            var wireout = outgoing[propertyName];
            if(wireout)
            {
                var target = wireout.node;
                var targetprop = wireout.prop;
                var targetdot = wireout.dott;
                var sourcedot = wireout.dots;
                var oldval = this.getDot(propertyValue,sourcedot);
                var newval = vwf.getProperty(target,targetprop);
                var oldval2 = this.getDot(newval,targetdot);
                if(oldval != oldval2)
                {
                    if(wireout.filter)
                        oldval = wireout.filter(oldval);

                    newval = this.setDot(newval,targetdot,oldval)
                    this.kernel.setProperty(target,targetprop,newval);
                }
            }
           

        },

        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function( nodeID, propertyName, propertyValue ) {
            return;
            if(propertyName == 'wires')
            {
              
                var incoming = this.wires.incoming[nodeID];
                var ret = [];
                for(var i in incoming)
                {
                    var prop = i;
                    var target = incoming[i].node;
                    var targetprop = incoming[i].prop;
                    ret.push([target,prop,targetprop,incoming[i].dott,incoming[i].dots,incoming[i].filterstring]);
                }
                return ret;
            }
        },

        // -- name_source_type --------------------------------------------------------------------

    } );

} );
