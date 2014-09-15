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
var jsDriverSelf = this;
define(["module", "vwf/model", "vwf/utility"], function(module, model, utility) {

    // vwf/model/javascript.js is a placeholder for the JavaScript object interface to the
    // simulation.

    return model.load(module, {

        // This is a placeholder for providing a natural integration between simulation and the
        // browser's JavaScript environment.
        // 
        // Within the JavaScript environment, component instances appear as JavaScript objects.
        // 
        //   - Properties appear in the "properties" field. Each property contains a getter and
        //     setter callback to notify the object of property manipulation.
        //   - Methods appear in "methods".
        //   - Events appear in "events".
        //   - "parent" refers to the parent node and "children" is an array of the child nodes.
        // 
        //   - Node prototypes use the JavaScript prototype chain.
        //   - Properties, methods, events, and children may be referenced directly on the node or
        //     within their respective collections by name when there is no conflict with another
        //     attribute.
        //   - Properties support getters and setters that invoke a handler that may influence the
        //     property access.

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            jsDriverSelf = this;
            this.nodes = {}; // maps id => new type()
            this.creatingNode(undefined, 0); // global root  // TODO: to allow vwf.children( 0 ), vwf.getNode( 0 ); is this the best way, or should the kernel createNode( global-root-id /* 0 */ )?
        },

        // == Model API ============================================================================

        // -- creatingNode -------------------------------------------------------------------------

        creatingNode: function(nodeID, childID, childExtendsID, childImplementsIDs,
            childSource, childType, childURI, childName, callback /* ( ready ) */ ) {



            // Get the prototype node.

            var prototype = this.nodes[childExtendsID] || Object.prototype;

            // Get the behavior nodes.

            var behaviors = (childImplementsIDs || []).map(function(childImplementsID) {
                return jsDriverSelf.nodes[childImplementsID];
            });

            // For each behavior, create a proxy for this node to the behavior and attach it above
            // the prototype, or above the most recently-attached behavior.

            behaviors.forEach(function(behavior) {
                prototype = proxiedBehavior.call(jsDriverSelf, prototype, behavior);
            });

            // Create the node. It's prototype is the most recently-attached behavior, or the
            // specific prototype if no behaviors are attached.

            var node = this.nodes[childID] = Object.create(prototype);
            node.__children_by_name = {};
            node.childExtendsID = childExtendsID;
            node.parentId = nodeID;
            Object.defineProperty(node, "private", {
                value: {} // for bookkeeping, not visible to scripts on the node  // TODO: well, ideally not visible; hide this better ("_private", "vwf_private", ?)
            });

            node.id = childID; // TODO: move to vwf/model/object

            node.name = childName;

            node.parent = undefined;

            node.source = childSource;
            node.type = childType;

            Object.defineProperty(node, "logger", {
                value: this.logger.for(childName),
                enumerable: true,
            });

            node.properties = Object.create(prototype.properties || Object.prototype, {
                node: {
                    value: node
                } // for node.properties accessors (non-enumerable)  // TODO: hide this better
            });

            Object.defineProperty(node.properties, "create", {
                value: function(name, value, get, set) { // "this" is node.properties
                    return jsDriverSelf.kernel.createProperty(this.node.id, name, value, get, set);
                }
            });

            node.private.getters = Object.create(prototype.private ?
                prototype.private.getters : Object.prototype
            );

            node.private.setters = Object.create(prototype.private ?
                prototype.private.setters : Object.prototype
            );

            node.methods = Object.create(prototype.methods || Object.prototype, {
                node: {
                    value: node
                } // for node.methods accessors (non-enumerable)  // TODO: hide this better
            });

            Object.defineProperty(node.methods, "create", {
                value: function(name, parameters, body) { // "this" is node.methods  // TODO: also accept create( name, body )
                    return jsDriverSelf.kernel.createMethod(this.node.id, name, parameters, body);
                }
            });

            node.private.bodies = Object.create(prototype.private ?
                prototype.private.bodies : Object.prototype
            );

            node.events = Object.create(prototype.events || Object.prototype, {
                node: {
                    value: node
                }, // for node.events accessors (non-enumerable)  // TODO: hide this better
            });

            // TODO: these only need to be on the base node's events object

            Object.defineProperty(node.events, "create", {
                value: function(name, parameters) { // "this" is node.events
                    return jsDriverSelf.kernel.createEvent(this.node.id, name, parameters);
                }
            });

            // Provide helper functions to create the directives for adding, removing and flushing
            // event handlers.

            // Add: node.events.*eventName* = node.events.add( *handler* [, *phases* ] [, *context* ] )

            Object.defineProperty(node.events, "add", {
                value: function(handler, phases, context) {
                    if (arguments.length != 2 || typeof phases == "string" || phases instanceof String || phases instanceof Array) {
                        return {
                            add: true,
                            handler: handler,
                            phases: phases,
                            context: context
                        };
                    } else { // interpret add( handler, context ) as add( handler, undefined, context )
                        return {
                            add: true,
                            handler: handler,
                            context: phases
                        };
                    }
                }
            });

            // Remove: node.events.*eventName* = node.events.remove( *handler* )

            Object.defineProperty(node.events, "remove", {
                value: function(handler) {
                    return {
                        remove: true,
                        handler: handler
                    };
                }
            });

            // Flush: node.events.*eventName* = node.events.flush( *context* )

            Object.defineProperty(node.events, "flush", {
                value: function(context) {
                    return {
                        flush: true,
                        context: context
                    };
                }
            });

            node.private.listeners = {}; // not delegated to the prototype as with getters, setters, and bodies; findListeners() filters recursion

            node.children = []; // TODO: connect children's prototype like properties, methods and events do? how, since it's an array? drop the ordered list support and just use an object?

            Object.defineProperty(node.children, "node", {
                value: node // for node.children accessors (non-enumerable)  // TODO: hide this better
            });

            Object.defineProperty(node.children, "create", {
                value: function(name, component, callback /* ( child ) */ ) { // "this" is node.children
                    return jsDriverSelf.kernel.createChild(this.node.id, name, component /* , callback */ ); // TODO: support callback and map callback's childID parameter to the child node
                }
            });

            Object.defineProperty(node.children, "delete", {
                value: function(child) {
                    return jsDriverSelf.kernel.deleteNode(child.id);
                }
            });

            Object.defineProperty(node, "children_by_name", { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function() {
                    return this.__children_by_name;
                },
                enumerable: true,

            });

            // Define the "time", "client", and "moniker" properties.

            Object.defineProperty(node, "time", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.kernel.time();
                },
                enumerable: true,
            });

            Object.defineProperty(node, "client", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.kernel.client();
                },
                enumerable: true,
            });

            Object.defineProperty(node, "moniker", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.kernel.moniker();
                },
                enumerable: true,
            });

            Object.defineProperty(node, "Scene", { // TODO: only define on shared "node" prototype?
                get: function() {
                    return jsDriverSelf.nodes['index-vwf'];
                },
                enumerable: true,
            });

            Object.defineProperty(node, 'bind', {

                value: function(eventName, value) {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {
                        listeners.push({
                            handler: value,
                            context: this
                        }); // for n
                    } else {
                        console.error('bound value must be a function');
                    }

                },
                enumerable: true,
                configurable: false
            });
            Object.defineProperty(node, 'unbind', {

                value: function(eventName, value) {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {

                        var found = -1;
                        for (var i = 0; i < listeners.length; i++) {
                            if (listeners[i].handler == value)
                                found = i;
                        }
                        if (found != -1) {
                            listeners.splice(found, 1);
                        }
                    } else {
                        console.error('bound value must be a function');
                    }

                },
                enumerable: true,
                configurable: false
            });

            // Define a "future" proxy so that for any this.property, this.method, or this.event, we
            // can reference this.future( when, callback ).property/method/event and have the
            // expression evaluated at the future time.

            Object.defineProperty(node, "in", { // TODO: only define on shared "node" prototype?
                value: function(when, callback) { // "this" is node
                    return refreshedFuture.call(jsDriverSelf, this, -when, callback); // relative time
                },
                enumerable: true,
            });

            Object.defineProperty(node, "at", { // TODO: only define on shared "node" prototype?
                value: function(when, callback) { // "this" is node
                    return refreshedFuture.call(jsDriverSelf, this, when, callback); // absolute time
                },
                enumerable: true,
            });

            Object.defineProperty(node, "future", { // same as "in"  // TODO: only define on shared "node" prototype?
                get: function() {
                    return this.in;
                },
                enumerable: true,
            });



            node.private.future = Object.create(prototype.private ?
                prototype.private.future : Object.prototype
            );

            Object.defineProperty(node.private.future, "private", {
                value: {
                    when: 0,
                    callback: undefined,
                    change: 0,
                }
            });

            node.private.change = 1; // incremented whenever "future"-related changes occur

            if (nodeID)
                this.addingChild(nodeID, childID, childName);


        },
        //allow a behavior node to directly acess the properties of it's parent
        hookupBehaviorProperty: function(behaviorNode, parentid, propname) {
            if (behaviorNode[propname] !== undefined) return;
            if (Object.keys(behaviorNode).indexOf(propname) != -1)
                return;

            //jsDriverSelf = this;
            var node = this.nodes[parentid];
            Object.defineProperty(behaviorNode, propname, { // "this" is node in get/set
                get: function() {
                    return node[propname];
                },
                set: function(value) {
                    node[propname] = value
                },
                enumerable: true
            });
        },
        //Allow the behavior to call the parent's methods
        hookupBehaviorMethod: function(behaviorNode, parentid, propname) {
            if (propname == "initialize") return;
            if (behaviorNode[propname] !== undefined) return;
            if (Object.keys(behaviorNode).indexOf(propname) != -1)
                return;

            var node = this.nodes[parentid];

            Object.defineProperty(behaviorNode, propname, {
                value: node.methods[propname].bind(node),
                enumerable: true,
                configurable: true
            });
        },
        //hook the behavior as a sort of proxy to the parent property and methods
        hookupBehavior: function(behaviorNode, parentid) {


            var node = this.nodes[parentid];
            for (var i in node.properties) {
                this.hookupBehaviorProperty(behaviorNode, parentid, i);
            }

            for (var i in node.methods) {
                this.hookupBehaviorMethod(behaviorNode, parentid, i);
            }



        },

        // -- initializingNode ---------------------------------------------------------------------

        // Invoke an initialize() function if one exists.

        initializingNode: function(nodeID, childID) {

            var child = this.nodes[childID];

            if (this.isBehavior(child)) {
                this.hookupBehavior(child, nodeID);


            }

            var scriptText = "this.initialize && this.initialize()";

            try {
                return (function(scriptText) {
                    return eval(scriptText)
                }).call(child, scriptText);
            } catch (e) {
                this.logger.warn("initializingNode", childID,
                    "exception in initialize:", utility.exceptionMessage(e));
            }

            return undefined;
        },

        // -- deletingNode -------------------------------------------------------------------------

        deletingNode: function(nodeID) {


            var child = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'deletingNode',[nodeID]);
            var node = child.parent;

            if (child.parent && child.parent.__children_by_name) {
                var oldname = vwf.getProperty(nodeID, 'DisplayName');
                delete child.parent.__children_by_name[oldname];

            }

            if (node) {

                if (child.children)
                    for (var i = 0; i < child.children.length; i++) {
                        this.deletingNode(child.children[i].id);
                    }

                var index = node.children.indexOf(child);

                if (index >= 0) {
                    node.children.splice(index, 1);
                }

                delete node.children[child.name]; // TODO: conflict if childName is parseable as a number

                if (node[child.name] === child) {
                    delete node[child.name]; // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                }

                child.parent = undefined;

            }

            var scriptText = "this.deinitialize && this.deinitialize()";

            try {
                (function(scriptText) {
                    return eval(scriptText)
                }).call(child, scriptText);
            } catch (e) {
                this.logger.warn("deinitializingNode", childID,
                    "exception in deinitialize:", utility.exceptionMessage(e));
            }

            delete this.nodes[nodeID];

        },

        // -- addingChild --------------------------------------------------------------------------

        addingChild: function(nodeID, childID, childName) {


            var node = this.nodes[nodeID];
            var child = this.nodes[childID];

            child.parent = node;

            if (node) {

                node.children.push(child);
                node.children[childName] = child; // TODO: conflict if childName is parseable as a number

                node.hasOwnProperty(childName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                (node[childName] = child);

            }

            var scriptText = "this.attached && this.attached()";

            try {
                (function(scriptText) {
                    return eval(scriptText)
                }).call(child, scriptText);
            } catch (e) {
                this.logger.warn("addingChild", childID,
                    "exception in addingChild:", utility.exceptionMessage(e));
            }

            scriptText = "this.childAdded && this.childAdded('" + childID + "')";

            try {
                (function(scriptText) {
                    return eval(scriptText)
                }).call(node, scriptText);
            } catch (e) {
                this.logger.warn("addingChild", childID,
                    "exception in addingChild:", utility.exceptionMessage(e));
            }

        },

        // TODO: removingChild

        // -- parenting ----------------------------------------------------------------------------

        parenting: function(nodeID) { // TODO: move to vwf/model/object

            var node = this.nodes[nodeID];

            return node && node.parent && node.parent.id || 0;
        },

        // -- childrening --------------------------------------------------------------------------

        childrening: function(nodeID) { // TODO: move to vwf/model/object

            var node = this.nodes[nodeID];
            if (!node) return null;
            return jQuery.map(node.children, function(child) {
                return child.id;
            });
        },

        // -- naming -------------------------------------------------------------------------------

        naming: function(nodeID) { // TODO: move to vwf/model/object

            var node = this.nodes[nodeID];

            return node.name || "";
        },

        // -- settingProperties --------------------------------------------------------------------

        settingProperties: function(nodeID, properties) { // TODO: these are here as a hack to keep scripts from coloring the setNode()/getNode() property values; vwf/kernel/model's disable and set/getProperties need to handle this properly (problem: getters can still return a value even when reentry is blocked)
        },

        // -- gettingProperties --------------------------------------------------------------------

        gettingProperties: function(nodeID, properties) { // TODO: these are here as a hack to keep scripts from coloring the setNode()/getNode() property values; vwf/kernel/model's disable and set/getProperties need to handle this properly (problem: getters can still return a value even when reentry is blocked)
        },

        // -- creatingProperty ---------------------------------------------------------------------

        creatingProperty: function(nodeID, propertyName, propertyValue, propertyGet, propertySet) {

            var node = this.nodes[nodeID];

            if (propertyGet) { // TODO: assuming javascript here; how to specify script type?
                //  try {
                node.private.getters[propertyName] = eval(getterScript(propertyGet));
                //  } catch ( e ) {
                //      this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                //          "exception evaluating getter:", utility.exceptionMessage( e ) );
                //  }
            } else {
                node.private.getters[propertyName] = true; // set a guard value so that we don't call prototype getters on value properties
            }

            if (propertySet) { // TODO: assuming javascript here; how to specify script type?
                // try {
                node.private.setters[propertyName] = eval(setterScript(propertySet));
                // } catch ( e ) {
                //     this.logger.warn( "creatingProperty", nodeID, propertyName, propertyValue,
                //         "exception evaluating setter:", utility.exceptionMessage( e ) );
                // }
            } else {
                node.private.setters[propertyName] = true; // set a guard value so that we don't call prototype setters on value properties
            }

            //add the new property to the API for the children nodes
            for (var i = 0; i < node.children.length; i++) {

                if (this.isBehavior(node.children[i])) {
                    this.hookupBehaviorProperty(node.children[i], nodeID, propertyName);
                }

            }


            return this.initializingProperty(nodeID, propertyName, propertyValue);
        },
        //A watchable property will call the VWF set property kernel code when it's values are changed
        _Watchable: function() {
            Object.defineProperty(this, 'internal_val', {
                configurable: true,
                enumerable: false,
                writable: true
            });
            Object.defineProperty(this, 'propertyname', {
                configurable: true,
                enumerable: false,
                writable: true
            });
            Object.defineProperty(this, 'id', {
                configurable: true,
                enumerable: false,
                writable: true
            });
            Object.defineProperty(this, 'masterval', {
                configurable: true,
                enumerable: false,
                writable: true
            });
            Object.defineProperty(this, 'dotNotation', {
                configurable: true,
                enumerable: false,
                writable: true
            });

        },
        //Set up a watchable to mirror an object (including named properties)
        // note - we currently can't detect assignment of new properties to an object
        //should probably create a function to accomplish that
        setupWatchableObject: function(watchable, val, propertyname, id, masterval, dotNotation) {
            if (masterval === undefined)
                masterval = val;

            watchable.internal_val = val;
            watchable.propertyname = propertyname;
            watchable.id = id;
            watchable.masterval = masterval;
            var keys = Object.keys(val);
            for (var i = 0; i < keys.length; i++) {
                (function() {

                    var _i = keys[i];

                    Object.defineProperty(watchable, _i, {
                        set: function(value) {
                            this.internal_val[_i] = value;

                            jsDriverSelf.setWatchableValue(this.id, this.propertyname, this.internal_val, this.dotNotation);
                        },
                        get: function() {
                            var ret = this.internal_val[_i];
                            //This recursively builds new watchables, such that you can do things like
                            //this.materialDef.layers[0].alpha -= .1;
                            ret = jsDriverSelf.createWatchable(ret, this.propertyname, this.id, this.masterval, this.dotNotation + '.' + _i);
                            return ret;
                        },
                        configurable: true,
                        enumerable: true
                    });
                })();
            }

            Object.defineProperty(watchable, 'defineProperty', {
                value: function(name, newvalue) {
                    Object.defineProperty(this, name, {
                        set: function(value) {
                            this.internal_val[name] = value;

                            jsDriverSelf.setWatchableValue(this.id, this.propertyname, this.internal_val, this.dotNotation);
                        },
                        get: function() {
                            var ret = this.internal_val[name];
                            //This recursively builds new watchables, such that you can do things like
                            //this.materialDef.layers[0].alpha -= .1;
                            ret = jsDriverSelf.createWatchable(ret, this.propertyname, this.id, this.masterval, this.dotNotation + '.' + name);
                            return ret;
                        },
                        configurable: true,
                        enumerable: true
                    });
                    this[name] = newvalue;


                },
                configurable: true,
                enumerable: true
            });



        },
        //Setup a watchable to behave like an array. This creates accessor functions for the numbered integer properties.

        setupWatchableArray: function(watchable, val, propertyname, id, masterval, dotNotation) {
            if (masterval === undefined)
                masterval = val;


            watchable.internal_val = val;
            watchable.propertyname = propertyname;
            watchable.id = id;
            watchable.masterval = masterval;
            for (var i = 0; i < val.length; i++) {
                (function() {

                    var _i = i;


                    Object.defineProperty(watchable, _i, {
                        set: function(value) {
                            this.internal_val[_i] = value;

                            jsDriverSelf.setWatchableValue(this.id, this.propertyname, this.internal_val, this.dotNotation);
                        },
                        get: function() {
                            var ret = this.internal_val[_i];
                            //This recursively builds new watchables, such that you can do things like
                            //this.materialDef.layers[0].alpha -= .1;
                            ret = jsDriverSelf.createWatchable(ret, this.propertyname, this.id, this.masterval, this.dotNotation + '[' + _i + ']');
                            return ret;
                        },
                        configurable: true,
                        enumerable: true
                    });
                })();
            }

            //Hookup some typical Array functions.
            watchable.push = function(newval) {
                var internal = this.internal_val;
                internal.push(newval);
                jsDriverSelf.setWatchableValue(this.id, this.propertyname, this.internal_val, this.dotNotation);
                jsDriverSelf.setupWatchableArray(this, internal, this.propertyname, this.id, this.masterval, this.dotNotation);
            }
            watchable.indexOf = function(val) {
                return this.internal_val.indexOf(val);
            }
            for (var i = 0; i < 7; i++) {
                var func = ['pop', 'shift', 'slice', 'sort', 'splice', 'unshift', 'shift'][i];

                (function setupWatchableArrayVal(funcname) {
                    watchable[funcname] = function() {
                        var internal = this.internal_val;

                        Array.prototype[funcname].apply(internal, arguments)
                        jsDriverSelf.setWatchableValue(this.id, this.propertyname, this.internal_val, this.dotNotation);
                        jsDriverSelf.setupWatchableArray(this, internal, this.propertyname, this.id, this.masterval, this.dotNotation);
                    }
                })(func);
            }

            Object.defineProperty(watchable, 'length', {
                get: function() {
                    return watchable.internal_val.length;
                },
                configurable: true,
                enumerable: true
            });


        },
        __WatchableCache: {},
        setValueByDotNotation: function(root, dot, val) {
            dot = dot.replace(/\[/g, ".");
            dot = dot.replace(/\]/g, ".");
            var names = dot.split('.');
            while (names.indexOf('') != -1)
                names.splice(names.indexOf(''), 1);

            for (var i = 0; i < names.length - 1; i++) {
                root = root[names[i]];

            }
            root[names[names.length - 1]] = val;
        },
        getValueByDotNotation: function(root, dot) {
            dot = dot.replace(/\[/g, ".");
            dot = dot.replace(/\]/g, ".");
            var names = dot.split('.');
            while (names.indexOf('') != -1)
                names.splice(names.indexOf(''), 1);

            for (var i = 0; i < names.length - 1; i++) {
                root = root[names[i]];

            }
            return root[names[names.length - 1]];
        },
        setWatchableValue: function(id, propertyName, value, dotNotation) {
            //when we set the value of a watchable, we need to update the cache. 
            // this is all moved into setproperty anyway, no?
            var masterid = dotNotation.substring(0, (dotNotation.indexOf('.') + 1 || dotNotation.indexOf('[') + 1) - 1)
            masterid = masterid || dotNotation;
            if (this.__WatchableCache[masterid]) {

                //the watchablesetting guard value prevents updating the values in the watchable cache.... can this be right?
                this.setValueByDotNotation(this.__WatchableCache[masterid], "masterval." + dotNotation.substr(masterid.length), value);
                this.setValueByDotNotation(this.__WatchableCache[masterid], "internal_val." + dotNotation.substr(masterid.length), value);


                jsDriverSelf.kernel.setProperty(id, propertyName, this.__WatchableCache[masterid].masterval);



            } else {


                jsDriverSelf.kernel.setProperty(id, propertyName, value);


            }


        },
        __WatchableSetting: 0,
        // -- initializingProperty -----------------------------------------------------------------
        //create a new watchable for a given value. Val is the object itjsDriverSelf, and masterval is the root property of the node
        createWatchable: function(val, propertyname, id, masterval, dotNotation) {



            if (!val) return val;

            if (val instanceof jsDriverSelf._Watchable) {
                return jsDriverSelf.createWatchable(val.internal_val, propertyname, id, undefined, dotNotation)

            }

            if (masterval === undefined)
                masterval = val;

            if (val.constructor == Array || val instanceof Float32Array) {
                if (this.__WatchableCache[dotNotation]) {
                    this.__WatchableCache[dotNotation].internal_val = val;
                    return this.__WatchableCache[dotNotation];
                }

                var watchable = new jsDriverSelf._Watchable();
                console.log('new watchable', dotNotation);
                watchable.dotNotation = dotNotation;
                jsDriverSelf.setupWatchableArray(watchable, val, propertyname, id, masterval, dotNotation);
                this.__WatchableCache[dotNotation] = watchable;
                return watchable;
            } else if (val.constructor == Object) {
                if (this.__WatchableCache[dotNotation]) {
                    this.__WatchableCache[dotNotation].internal_val = val;
                    return this.__WatchableCache[dotNotation];
                }

                var watchable = new jsDriverSelf._Watchable();
                console.log('new watchable', dotNotation);
                watchable.dotNotation = dotNotation;
                jsDriverSelf.setupWatchableObject(watchable, val, propertyname, id, masterval, dotNotation);
                this.__WatchableCache[dotNotation] = watchable;
                return watchable;

            } else {
                //if the object is a primitive type, then we catch modifications to it
                //when it is set. 

                //We may have to handle strings here.....
                return val;
            }


        },
        //If you execute this.transform = this.transform, then the setter will get a watchable. Need to strip that before sending it back into the kernel.
        watchableToObject: function(watchable) {

            if (!watchable) return watchable;

            if (watchable instanceof jsDriverSelf._Watchable) {

                return watchable.internal_val;
            } else {

                return watchable;
            }

        },
        initializingProperty: function(nodeID, propertyName, propertyValue) {

            var node = this.nodes[nodeID];

            //the getter on nodes.properties. create watchable proxy
            Object.defineProperty(node.properties, propertyName, { // "this" is node.properties in get/set
                get: function() {

                    //return a watchable from the cache if it exists. This is way way way too slow. 
                    //trying to be very careful to keep the cache working properly;
                    if (jsDriverSelf.__WatchableCache[this.node.id + "-" + propertyName]) {
                        //because other drivers might change the value, we have to update the cache on every get.
                        //this is  too bad, because it's a lot of work, but we shoudl be able to keep the watchable strucures
                        //even if we have to update the underlying cache.

                        //do we have to do this on set property? Lets not, that should be faster
                        //  this.updateWatchableCache(this.node.id,propertyName,jsDriverSelf.kernel.getProperty(this.node.id, propertyName));
                        return jsDriverSelf.__WatchableCache[this.node.id + "-" + propertyName];
                    } else
                        return jsDriverSelf.createWatchable(jsDriverSelf.kernel.getProperty(this.node.id, propertyName), propertyName, this.node.id, undefined, this.node.id + "-" + propertyName)

                },
                set: function(value) {
                    jsDriverSelf.setWatchableValue(this.node.id, propertyName, jsDriverSelf.watchableToObject(value), this.node.id + "-" + propertyName)
                },
                enumerable: true
            });

            //the getter on node, create watchable proxy
            if (!node.hasOwnProperty(propertyName)) // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            {
                Object.defineProperty(node, propertyName, { // "this" is node in get/set
                    get: function() {

                        //return a watchable from the cache if it exists. This is way way way too slow. 
                        //trying to be very careful to keep the cache working properly;
                        if (jsDriverSelf.__WatchableCache[this.id + "-" + propertyName]) {
                            //because other drivers might change the value, we have to update the cache on every get.
                            //this is  too bad, because it's a lot of work, but we shoudl be able to keep the watchable strucures
                            //even if we have to update the underlying cache.

                            //do we have to do this on set property? Lets not, that should be faster

                            //this is a godawful mess, but it profiles well....

                            var currentval = jsDriverSelf.kernel.getProperty(this.id, propertyName);
                            if (!currentval) return currentval;
                            //it's possible to fail to compate on circular json
                            try {
                                if (JSON.stringify(currentval) != JSON.stringify(jsDriverSelf.__WatchableCache[this.id + "-" + propertyName].internal_val)) {
                                    //it really seems like we should be reusing the objects in the cache, but it causes god awful problems that I 
                                    //cannot make any sense of. 
                                    // return jsDriverSelf.createWatchable(currentval, propertyName, this.id, undefined, this.id + "-" + propertyName)
                                    jsDriverSelf.updateWatchableCache(this.id, propertyName, currentval)
                                }
                                return jsDriverSelf.__WatchableCache[this.id + "-" + propertyName];
                            } catch (e) {
                                return jsDriverSelf.createWatchable(jsDriverSelf.kernel.getProperty(this.id, propertyName), propertyName, this.id, undefined, this.id + "-" + propertyName)
                            }
                        } else
                            return jsDriverSelf.createWatchable(jsDriverSelf.kernel.getProperty(this.id, propertyName), propertyName, this.id, undefined, this.id + "-" + propertyName)

                    },
                    set: function(value) {
                        jsDriverSelf.setWatchableValue(this.id, propertyName, jsDriverSelf.watchableToObject(value), this.id + "-" + propertyName)
                    },
                    enumerable: true
                });
            }
            node.private.change++; // invalidate the "future" cache

            return propertyValue !== undefined ?
                this.settingProperty(nodeID, propertyName, propertyValue) : undefined;
        },

        // TODO: deletingProperty

        // -- settingProperty ----------------------------------------------------------------------
        callSetter: function(setter, node, propertyValue, propertyName) {

            try {
                return setter.call(node, propertyValue);
            } catch (e) {
                this.logger.warn("settingProperty", node.ID, propertyName, propertyValue,
                    "exception in setter:", utility.exceptionMessage(e));
            }
        },
        settingProperty: function(nodeID, propertyName, propertyValue) {

            //notify all nodes of property changes
            //this.callMethodTraverse(this.nodes['index-vwf'],'satProperty',[nodeID, propertyName, propertyValue]);

            var node = this.nodes[nodeID];

            if (!node) return; // TODO: patch until full-graph sync is working; drivers should be able to assume that nodeIDs refer to valid objects

            if (propertyName == 'DisplayName' && this.nodes[node.parentId]) {

                var oldname = vwf.getProperty(nodeID, 'DisplayName');
                delete this.nodes[node.parentId].__children_by_name[oldname];
                this.nodes[node.parentId].__children_by_name[propertyValue] = node;
            }
            var setter = node.private.setters && node.private.setters[propertyName];

            if (setter && setter !== true) { // is there is a setter (and not just a guard value)

                this.callSetter(setter, node, propertyValue, propertyName);

            }


            //we do this on getproperty now.....
            //this.updateWatchableCache(nodeID,propertyName,propertyValue);

            return undefined;
        },
        updateWatchableCache: function(nodeID, propertyName, propertyValue) {

            //we are not setting our own watchable. in that case, the internal value is already cached
            if (this.__WatchableSetting === 0) {
                //constructing watchables is expensive. We need to update them in place, rather then delete and recreate on demand.
                var keys = Object.keys(this.__WatchableCache);
                var dels = []
                for (var i = 0; i < keys.length; i++) {
                    //be verycareful here. transform and transformAPI both start with the same dotnotation key, be sure that you check
                    //properly.
                    if (keys[i].indexOf(nodeID + '-' + propertyName + '.') == 0 || keys[i] === nodeID + '-' + propertyName) {
                        var watchable = this.__WatchableCache[keys[i]]

                        var new_prop_for_this_watchable;

                        //setting the root of the watchable;
                        if (watchable.dotNotation === nodeID + '-' + propertyName)
                            new_prop_for_this_watchable = propertyValue;
                        else //setting some sub watchable       
                        {
                            //the dot notation includes the name of the root prop - but propertyValue is already this. Remove 
                            //from the dot.
                            var dot = watchable.dotNotation.substr(watchable.dotNotation.indexOf('.') + 1);
                            new_prop_for_this_watchable = this.getValueByDotNotation(propertyValue, dot);
                        }
                        var old_prop = watchable.internal_val;
                        if (!new_prop_for_this_watchable) {
                            //if the new prop is null, just remove the cached watchable. No point in having a watchable interface for a null.
                            dels.push(keys[i]);
                        } else if (Object.keys(new_prop_for_this_watchable).join('') !== Object.keys(old_prop).join('')) {
                            //the structure of the value for this watchable has changed, so we need to recreate.
                            //instead of recreating the watchable now (when it may never be needed)
                            //just delete it an build a new one on demand
                            dels.push(keys[i]);
                        } else {
                            //ok, we can save the watchable and just swap in the new underlying value
                            watchable.internal_val = new_prop_for_this_watchable;
                            watchable.masterval = propertyValue;
                        }
                    }
                }
                for (var i = 0; i < dels.length; i++)
                    delete this.__WatchableCache[dels[i]];
            }


        },
        // -- gettingProperty ----------------------------------------------------------------------

        gettingProperty: function(nodeID, propertyName, propertyValue) {
            if (this.disabled) return;
            var node = this.nodes[nodeID];
            if (!node) return undefined;
            var getter = node.private.getters && node.private.getters[propertyName];

            if (getter && getter !== true) { // is there is a getter (and not just a guard value)
                try {
                    //unwrap watchables
                    var ret = getter.call(node);
                    if (ret && ret.internal_val) return ret.internal_val;
                    return ret;
                } catch (e) {
                    this.logger.warn("gettingProperty", nodeID, propertyName, propertyValue,
                        "exception in getter:", utility.exceptionMessage(e));
                }
            }

            return undefined;
        },
        gettingMethod: function(nodeID, methodName) {


            var node = this.nodes[nodeID];
            var method;

            var func = node.private.bodies && node.private.bodies[methodName];
            if (func) {
                var str = func.toString();

                str = str.substring(str.indexOf('{') + 1, str.lastIndexOf('}'));
                method = str;
            }
            return method;
        },
        gettingMethods: function(nodeID) {


            var node = this.nodes[nodeID];
            var methods = {};


            for (var i in node.methods) {
                if (node.methods.hasOwnProperty(i)) {
                    var methodName = i;
                    var func = node.private.bodies && node.private.bodies[methodName];
                    if (func) {
                        var str = func.toString();

                        var params = str.substring(str.indexOf('(') + 1, str.indexOf(')'));
                        params = params.split(',');
                        var cleanparms = [];
                        for (var i = 0; i < params.length; i++)
                            if (params[i] && $.trim(params[i]) != '')
                                cleanparms.push($.trim(params[i]));
                        str = str.substring(str.indexOf('{') + 1, str.lastIndexOf('}'));
                        methods[methodName] = {
                            body: str,
                            parameters: cleanparms
                        };
                    }
                }
            }
            node = Object.getPrototypeOf(node);

            return methods;
        },
        gettingEvents: function(nodeID) {

            var node = this.nodes[nodeID];
            var events = {};



            if (node.events)
                for (var i in node.events) {
                    var eventName = i;
                    if (node.events.hasOwnProperty(i)) {
                        //TODO: deal with multiple handlers. Requires refactor of childcomponent create code.
                        for (var j = 0; j < node.private.listeners[eventName].length; j++) {
                            var func = node.private.listeners && node.private.listeners[eventName] && node.private.listeners[eventName][j].handler;
                            if (func) {
                                var str = func.toString();
                                var params = str.substring(str.indexOf('(') + 1, str.indexOf(')'));
                                params = params.split(',');
                                str = str.substring(str.indexOf('{') + 1, str.lastIndexOf('}') - 1);
                                events[eventName] = {
                                    parameters: params,
                                    body: str
                                };
                            }
                        }
                    }
                }

            node = Object.getPrototypeOf(node);

            return events;
        },

        // -- creatingMethod -----------------------------------------------------------------------

        creatingMethod: function(nodeID, methodName, methodParameters, methodBody) {

            var node = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'creatingMethod',[methodName, methodParameters, methodBody]);

            Object.defineProperty(node.methods, methodName, { // "this" is node.methods in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.methods
                        return jsDriverSelf.kernel.callMethod(this.node.id, methodName, arguments);
                    };
                },
                set: function(value) {
                    this.node.methods.hasOwnProperty(methodName) ||
                        jsDriverSelf.kernel.createMethod(this.node.id, methodName);
                    this.node.private.bodies[methodName] = value;
                },
                enumerable: true,
                configurable: true
            });

            node.hasOwnProperty(methodName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            Object.defineProperty(node, methodName, { // "this" is node in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node
                        return jsDriverSelf.kernel.callMethod(this.id, methodName, arguments);
                    };
                },
                set: function(value) {
                    this.methods.hasOwnProperty(methodName) ||
                        jsDriverSelf.kernel.createMethod(this.id, methodName);
                    this.private.bodies[methodName] = value;
                },
                enumerable: true,
                configurable: true
            });
            try {
                node.private.bodies[methodName] = eval(bodyScript(methodParameters || [], methodBody || ""));
            } catch (e) {
                this.logger.warn("creatingMethod", nodeID, methodName, methodParameters,
                    "exception evaluating body:", utility.exceptionMessage(e));
            }


            for (var i = 0; i < node.children.length; i++) {

                if (this.isBehavior(node.children[i])) {
                    this.hookupBehaviorMethod(node.children[i], nodeID, methodName);
                }

            }
            node.private.change++; // invalidate the "future" cache

        },

        deletingMethod: function(nodeID, methodName) {


            var node = this.nodes[nodeID];
            //this.callMethodTraverse(this.nodes['index-vwf'],'deletingMethod',[nodeID,methodName]);
            if (!node) return undefined;


            var body = node.private.bodies && node.private.bodies[methodName];

            if (body) {
                try {

                    delete node.private.bodies[methodName];
                    if (node.hasOwnProperty(methodName))
                        delete node[methodName];
                    delete node.methods[methodName];



                } catch (e) {
                    this.logger.warn("deletingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }

            for (var i = 0; i < node.children.length; i++) {

                if (this.isBehavior(node.children[i])) {
                    this.dehookupBehaviorMethod(node.children[i], nodeID, methodName);
                }

            }

            return undefined;
        },
        // -- callingMethod ------------------------------------------------------------------------
        dehookupBehaviorMethod: function(obj, id, methodName) {
            if (obj[methodName]) {
                delete obj[methodName];
            }

        },
        callingMethod: function(nodeID, methodName, methodParameters) {


            //this.callMethodTraverse(this.nodes['index-vwf'],'calledMethod',[nodeID, methodName, methodParameters]);

            var node = this.nodes[nodeID];
            if (!node) return undefined;

            //used for the autocomplete - eval in the context of the node, and get the keys
            if (methodName == 'JavascriptEvalKeys') {
                var ret = (function() {

                    try {
                        return eval(
                            '(function(){' +
                            'var keys = [];' +
                            'for (var i in ' + methodParameters[0] + '){keys.push(i)}' +
                            'var ret = [];' +
                            'for( var i = 0; i < keys.length; i++) {' +
                            'ret.push([keys[i],' + methodParameters[0] + '[keys[i]] ?' + methodParameters[0] + '[keys[i]].constructor:null])' +
                            '};' +
                            'return ret;' +
                            '}.bind(this))()');
                    } catch (e) {
                        return null;
                    }

                }).apply(node);
                return ret;
            }
            //used by the autocomplete - eval in the context of the node and get the function params
            if (methodName == 'JavascriptEvalFunction') {

                var ret = (function() {

                    try {
                        return eval(
                            '(function(){' +
                            //'debugger;'+
                            'return ' + methodParameters[0] + '.toString();' +

                            '}.bind(this))()');
                    } catch (e) {
                        return null;
                    }

                }).apply(node);

                if (ret && ret.indexOf("function ( /* parameter1, parameter2, ... */ )") == 0) {

                    var nodereference = methodParameters[0].substr(0, methodParameters[0].lastIndexOf('.'));
                    var funcid = methodParameters[0].substr(methodParameters[0].lastIndexOf('.') + 1);

                    var refid = (function() {

                        try {
                            return eval(
                                '(function(){' +
                                //'debugger;'+
                                'return ' + nodereference + '.id' +

                                '}.bind(this))()');
                        } catch (e) {
                            return null;
                        }

                    }).apply(node);
                    ret = (this.nodes[refid].private.bodies[funcid] || "").toString();
                }

                if (ret) {
                    ret = ret.match(/\(.*\)/);
                    if (ret && ret[0])
                        return ret[0];
                    return null;
                } else
                    return null;
            }
            var body = node.private.bodies && node.private.bodies[methodName];

            if (body) {
                try {
                    var ret = body.apply(node, methodParameters);
                    if (ret && ret.internal_val) return ret.internal_val;
                    return ret;
                } catch (e) {
                    console.warn(e.toString() + " Node:'" + (node.properties.DisplayName || nodeID) + "' during: '" + methodName + "' with '" + JSON.stringify(methodParameters) + "'");
                    //            this.logger.warn( "callingMethod", nodeID, methodName, methodParameters, // TODO: limit methodParameters for log
                    //              "exception:", utility.exceptionMessage( e ) );
                }
            }

            return undefined;
        },

        // -- creatingEvent ------------------------------------------------------------------------

        creatingEvent: function(nodeID, eventName, eventParameters, eventBody) {


            var node = this.nodes[nodeID];


            Object.defineProperty(node.events, eventName, { // "this" is node.events in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node.events
                        return jsDriverSelf.kernel.fireEvent(this.node.id, eventName, arguments);
                    };
                },
                set: function(value) {
                    var listeners = this.node.private.listeners[eventName] ||
                        (this.node.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {
                        listeners.push({
                            handler: value,
                            context: this.node
                        }); // for node.events.*event* = function() { ... }, context is the target node
                    } else if (value.add) {
                        if (!value.phases || value.phases instanceof Array) {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: value.phases
                            });
                        } else {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: [value.phases]
                            });
                        }
                    } else if (value.remove) {
                        this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.handler !== value.handler;
                        });
                    } else if (value.flush) {
                        this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.context !== value.context;
                        });
                    }
                },
                enumerable: true,
                configurable: true
            });

            node.hasOwnProperty(eventName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
            Object.defineProperty(node, eventName, { // "this" is node in get/set
                get: function() {
                    return function( /* parameter1, parameter2, ... */ ) { // "this" is node
                        return jsDriverSelf.kernel.fireEvent(this.id, eventName, arguments);
                    };
                },
                set: function(value) {
                    var listeners = this.private.listeners[eventName] ||
                        (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                    if (typeof value == "function" || value instanceof Function) {
                        listeners.push({
                            handler: value,
                            context: this
                        }); // for node.*event* = function() { ... }, context is the target node
                    } else if (value.add) {
                        if (!value.phases || value.phases instanceof Array) {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: value.phases
                            });
                        } else {
                            listeners.push({
                                handler: value.handler,
                                context: value.context,
                                phases: [value.phases]
                            });
                        }
                    } else if (value.remove) {
                        this.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.handler !== value.handler;
                        });
                    } else if (value.flush) {
                        this.private.listeners[eventName] = listeners.filter(function(listener) {
                            return listener.context !== value.context;
                        });
                    }
                },
                enumerable: true,
                configurable: true
            });

            node.private.listeners[eventName] = [];
            if (eventBody) {

                try {
                    var handler = {
                        handler: null,
                        context: node
                    }
                    handler.handler = eval(bodyScript(eventParameters || [], eventBody || ""));
                    node.private.listeners[eventName].push(handler);
                } catch (e) {
                    this.logger.warn("creatingEvent", nodeID, eventName, eventParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }

            node.private.change++; // invalidate the "future" cache

        },

        deletingEvent: function(nodeID, eventName) {

            var node = this.nodes[nodeID];
            if (!node) return undefined;
            if (node) {
                try {
                    if (node.private.listeners && node.private.listeners[eventName])
                        delete node.private.listeners[eventName];
                    if (node.hasOwnProperty(eventName))
                        delete node[eventName];
                    if (node.events.hasOwnProperty(eventName))
                        delete node.events[eventName];
                } catch (e) {
                    this.logger.warn("deletingEvent", nodeID, eventName, eventParameters, // TODO: limit methodParameters for log
                        "exception:", utility.exceptionMessage(e));
                }
            }

        },
        callMethodTraverse: function(node, method, args) {

            if (!node) return;


            var body = node.private.bodies && node.private.bodies[method];

            if (body) {
                body.apply(node, args);
            }

            if (node.children)
                for (var i = 0; i < node.children.length; i++) {
                    this.callMethodTraverse(node.children[i], method, args);
                }
        },
        ticking: function() {
            this.callMethodTraverse(this.nodes['index-vwf'], 'tick', []);
        },
        isBehavior: function(node) {
            if (!node)
                return false;
            if (node.childExtendsID == 'http-vwf-example-com-behavior-vwf') {
                return true;
            }
            return this.isBehavior(node.__proto__);
        },
        // -- firingEvent --------------------------------------------------------------------------
        firingEvent: function(nodeID, eventName, eventParameters) {

            var phase = eventParameters && eventParameters.phase; // the phase is smuggled across on the parameters array  // TODO: add "phase" as a fireEvent() parameter? it isn't currently needed in the kernel public API (not queueable, not called by the drivers), so avoid if possible

            var node = this.nodes[nodeID];
            if (!node) return;
            var listeners = findListeners(node, eventName);



            // Call the handlers registered for the event, and calculate the logical OR of each
            // result. Normally, callers to fireEvent() ignore the handler result, but dispatched
            // events use the return value to determine when an event has been handled as it bubbles
            // up from its target.

            var handled = listeners && listeners.reduce(function(handled, listener) {
                // Call the handler. If a phase is provided, only call handlers tagged for that
                // phase.
                if (!phase || listener.phases && listener.phases.indexOf(phase) >= 0) {

                    var result = listener.handler.apply(listener.context || jsDriverSelf.nodes[0], eventParameters); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above

                    return handled || result === true || result === undefined; // interpret no return as "return true"
                }
                return handled;

            }, false);

            if (handled) return handled;

            //if not handled, iterate over all children.
            /*
            handled = handled || phase != 'bubble' && node.children && node.children.reduce( function( handled, child ) {
                        
                        //don't distribute to child behaviors.
                        //behavior listeners are picked up in findListeners
                        if(child.childExtendsID == 'http-vwf-example-com-behavior-vwf')
                            return false;

                        var result = handled || jsDriverSelf.firingEvent(child.id,eventName, eventParameters); // default context is the global root  // TODO: this presumes this.creatingNode( undefined, 0 ) is retained above
                        return handled || result===true || result===undefined; // interpret no return as "return true"
            }, handled );*/


            return handled;
        },

        // -- executing ----------------------------------------------------------------------------

        executing: function(nodeID, scriptText, scriptType) {

            var node = this.nodes[nodeID];

            if (scriptType == "application/javascript") {
                // try {
                return (function(scriptText) {
                    return eval(scriptText)
                }).call(node, scriptText);
                // } catch ( e ) {
                //     this.logger.warn( "executing", nodeID,
                //         ( scriptText || "" ).replace( /\s+/g, " " ).substring( 0, 100 ), scriptType, "exception:", utility.exceptionMessage( e ) );
                // }
            }

            return undefined;
        },

    });

    // == Private functions ========================================================================

    // -- proxiedBehavior --------------------------------------------------------------------------

    function proxiedBehavior(prototype, behavior) { // invoke with the model as "this"  // TODO: this is a lot like createProperty()/createMethod()/createEvent(), and refreshedFuture(). Find a way to merge.



        var proxy = Object.create(prototype);

        Object.defineProperty(proxy, "private", {
            value: Object.create(behavior.private || Object.prototype)
        });

        proxy.private.origin = behavior; // the node we're the proxy for

        proxy.id = behavior.id; // TODO: move to vwf/model/object

        proxy.name = behavior.name;

        proxy.parent = behavior.parent;

        proxy.source = behavior.source;
        proxy.type = behavior.type;

        proxy.properties = Object.create(prototype.properties || Object.prototype, {
            node: {
                value: proxy
            } // for proxy.properties accessors (non-enumerable)  // TODO: hide this better
        });

        for (var propertyName in behavior.properties) {

            if (behavior.properties.hasOwnProperty(propertyName)) {

                (function(propertyName) {

                    Object.defineProperty(proxy.properties, propertyName, { // "this" is proxy.properties in get/set
                        get: function() {
                            return jsDriverSelf.kernel.getProperty(this.node.id, propertyName)
                        },
                        set: function(value) {
                            jsDriverSelf.kernel.setProperty(this.node.id, propertyName, value)
                        },
                        enumerable: true
                    });

                    proxy.hasOwnProperty(propertyName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty(proxy, propertyName, { // "this" is proxy in get/set
                        get: function() {
                            return jsDriverSelf.kernel.getProperty(this.id, propertyName)
                        },
                        set: function(value) {
                            jsDriverSelf.kernel.setProperty(this.id, propertyName, value)
                        },
                        enumerable: true
                    });

                })(propertyName);

            }

        }

        proxy.methods = Object.create(prototype.methods || Object.prototype, {
            node: {
                value: proxy
            } // for proxy.methods accessors (non-enumerable)  // TODO: hide this better
        });

        for (var methodName in behavior.methods) {

            if (behavior.methods.hasOwnProperty(methodName)) {

                (function(methodName) {

                    Object.defineProperty(proxy.methods, methodName, { // "this" is proxy.methods in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.methods
                                return jsDriverSelf.kernel.callMethod(this.node.id, methodName, arguments);
                            };
                        },
                        set: function(value) {
                            this.node.methods.hasOwnProperty(methodName) ||
                                jsDriverSelf.kernel.createMethod(this.node.id, methodName);
                            this.node.private.bodies[methodName] = value;
                        },
                        enumerable: true,
                    });

                    proxy.hasOwnProperty(methodName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty(proxy, methodName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return jsDriverSelf.kernel.callMethod(this.id, methodName, arguments);
                            };
                        },
                        set: function(value) {
                            this.methods.hasOwnProperty(methodName) ||
                                jsDriverSelf.kernel.createMethod(this.id, methodName);
                            this.private.bodies[methodName] = value;
                        },
                        enumerable: true,
                    });

                })(methodName);

            }

        }

        proxy.events = Object.create(prototype.events || Object.prototype, {
            node: {
                value: proxy
            } // for proxy.events accessors (non-enumerable)  // TODO: hide this better
        });

        for (var eventName in behavior.events) {

            if (behavior.events.hasOwnProperty(eventName)) {

                (function(eventName) {

                    Object.defineProperty(proxy.events, eventName, { // "this" is proxy.events in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy.events
                                return jsDriverSelf.kernel.fireEvent(this.node.id, eventName, arguments);
                            };
                        },
                        set: function(value) {
                            var listeners = this.node.private.listeners[eventName] ||
                                (this.node.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if (typeof value == "function" || value instanceof Function) {
                                listeners.push({
                                    handler: value,
                                    context: this.node
                                }); // for node.events.*event* = function() { ... }, context is the target node
                            } else if (value.add) {
                                if (!value.phases || value.phases instanceof Array) {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: value.phases
                                    });
                                } else {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: [value.phases]
                                    });
                                }
                            } else if (value.remove) {
                                this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.handler !== value.handler;
                                });
                            } else if (value.flush) {
                                this.node.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.context !== value.context;
                                });
                            }
                        },
                        enumerable: true,
                    });

                    proxy.hasOwnProperty(eventName) || // TODO: recalculate as properties, methods, events and children are created and deleted; properties take precedence over methods over events over children, for example
                    Object.defineProperty(proxy, eventName, { // "this" is proxy in get/set
                        get: function() {
                            return function( /* parameter1, parameter2, ... */ ) { // "this" is proxy
                                return jsDriverSelf.kernel.fireEvent(this.id, eventName, arguments);
                            };
                        },
                        set: function(value) {
                            var listeners = this.private.listeners[eventName] ||
                                (this.private.listeners[eventName] = []); // array of { handler: function, context: node, phases: [ "phase", ... ] }
                            if (typeof value == "function" || value instanceof Function) {
                                listeners.push({
                                    handler: value,
                                    context: this
                                }); // for node.*event* = function() { ... }, context is the target node
                            } else if (value.add) {
                                if (!value.phases || value.phases instanceof Array) {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: value.phases
                                    });
                                } else {
                                    listeners.push({
                                        handler: value.handler,
                                        context: value.context,
                                        phases: [value.phases]
                                    });
                                }
                            } else if (value.remove) {
                                this.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.handler !== value.handler;
                                });
                            } else if (value.flush) {
                                this.private.listeners[eventName] = listeners.filter(function(listener) {
                                    return listener.context !== value.context;
                                });
                            }
                        },
                        enumerable: true,
                    });

                })(eventName);

            }

        }

        return proxy;
    }

    // -- refreshedFuture --------------------------------------------------------------------------

    function refreshedFuture(node, when, callback) { // invoke with the model as "this"



        if (Object.getPrototypeOf(node).private) {
            refreshedFuture.call(this, Object.getPrototypeOf(node));
        }

        var future = node.private.future;

        future.private.when = when;
        future.private.callback = callback; // TODO: would like to be able to remove this reference after the future call has completed

        if (future.private.change < node.private.change) { // only if out of date

            future.id = node.id;

            future.properties = Object.create(Object.getPrototypeOf(future).properties || Object.prototype, {
                future: {
                    value: future
                } // for future.properties accessors (non-enumerable)  // TODO: hide this better
            });

            for (var propertyName in node.properties) {

                if (node.properties.hasOwnProperty(propertyName)) {

                    (function(propertyName) {

                        Object.defineProperty(future.properties, propertyName, { // "this" is future.properties in get/set
                            get: function() {
                                return jsDriverSelf.kernel.getProperty(this.future.id,
                                    propertyName, this.future.private.when, this.future.private.callback
                                )
                            },
                            set: function(value) {
                                jsDriverSelf.kernel.setProperty(this.future.id,
                                    propertyName, value, this.future.private.when, this.future.private.callback
                                )
                            },
                            enumerable: true
                        });

                        future.hasOwnProperty(propertyName) || // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty(future, propertyName, { // "this" is future in get/set
                            get: function() {
                                return jsDriverSelf.kernel.getProperty(this.id,
                                    propertyName, this.private.when, this.private.callback
                                )
                            },
                            set: function(value) {
                                jsDriverSelf.kernel.setProperty(this.id,
                                    propertyName, value, this.private.when, this.private.callback
                                )
                            },
                            enumerable: true
                        });

                    })(propertyName);

                }

            }

            future.methods = Object.create(Object.getPrototypeOf(future).methods || Object.prototype, {
                future: {
                    value: future
                } // for future.methods accessors (non-enumerable)  // TODO: hide this better
            });

            for (var methodName in node.methods) {

                if (node.methods.hasOwnProperty(methodName)) {

                    (function(methodName) {

                        Object.defineProperty(future.methods, methodName, { // "this" is future.methods in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.methods
                                    return jsDriverSelf.kernel.callMethod(this.future.id,
                                        methodName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        });

                        future.hasOwnProperty(methodName) || // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty(future, methodName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    return jsDriverSelf.kernel.callMethod(this.id,
                                        methodName, arguments, this.private.when, this.private.callback
                                    );
                                }
                            },
                            enumerable: true
                        });

                    })(methodName);

                }

            }

            future.events = Object.create(Object.getPrototypeOf(future).events || Object.prototype, {
                future: {
                    value: future
                } // for future.events accessors (non-enumerable)  // TODO: hide this better
            });

            for (var eventName in node.events) {

                if (node.events.hasOwnProperty(eventName)) {

                    (function(eventName) {

                        Object.defineProperty(future.events, eventName, { // "this" is future.events in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future.events
                                    return jsDriverSelf.kernel.fireEvent(this.future.id,
                                        eventName, arguments, this.future.private.when, this.future.private.callback
                                    );
                                };
                            },
                            enumerable: true,
                        });

                        future.hasOwnProperty(eventName) || // TODO: calculate so that properties take precedence over methods over events, for example
                        Object.defineProperty(future, eventName, { // "this" is future in get/set
                            get: function() {
                                return function( /* parameter1, parameter2, ... */ ) { // "this" is future
                                    return jsDriverSelf.kernel.fireEvent(this.id,
                                        eventName, arguments, this.private.when, this.private.callback
                                    );
                                };
                            },
                            enumerable: true,
                        });

                    })(eventName);

                }

            }

            future.private.change = node.private.change;

        }

        return future;
    }

    // -- getterScript -----------------------------------------------------------------------------

    function getterScript(body) {
        return accessorScript("( function() {", body, "} )");
    }

    // -- setterScript -----------------------------------------------------------------------------

    function setterScript(body) {
        return accessorScript("( function( value ) {", body, "} )");
    }

    // -- bodyScript -------------------------------------------------------------------------------

    function bodyScript(parameters, body) {
        var parameterString = (parameters.length ? " " + parameters.join(", ") + " " : "");
        return accessorScript("( function(" + parameterString + ") {", body, "} )");
        // return accessorScript( "( function(" + ( parameters.length ? " " + parameters.join( ", " ) + " " : ""  ) + ") {", body, "} )" );
    }

    // -- accessorScript ---------------------------------------------------------------------------

    function accessorScript(prefix, body, suffix) { // TODO: sanitize script, limit access
        if (body.length && body.charAt(body.length - 1) == "\n") {
            var bodyString = body.replace(/^./gm, "  $&");
            return prefix + "\n" + bodyString + suffix + "\n";
        } else {
            var bodyString = body.length ? " " + body + " " : "";
            return prefix + bodyString + suffix;
        }
    }

    // -- findListeners ----------------------------------------------------------------------------

    // TODO: this walks the full prototype chain and is probably horribly inefficient.

    function nodeInstanceOf(node, type) {
        while (node) {
            if (node.childExtendsID == type)
                return true;
            if (vwf.prototype(node.id))
                node = jsDriverSelf.nodes[vwf.prototype(node.id)];
            else
                node = null;

        }
        return false;
    }

    function findListeners(node, eventName, targetOnly) {

        var prototypeListeners = Object.getPrototypeOf(node).private ? // get any jsDriverSelf-targeted listeners from the prototypes
            findListeners(Object.getPrototypeOf(node), eventName, true) : [];

        var nodeListeners = node.private.listeners && node.private.listeners[eventName] || [];


        if (targetOnly) {
            return prototypeListeners.concat(nodeListeners.filter(function(listener) {
                return listener.context == node || listener.context == node.private.origin; // in the prototypes, select jsDriverSelf-targeted listeners only
            }));
        } else {

            //run find listeners in the child behavior nodes
            var childBehaviorListeners = [];
            for (var i = 0; i < node.children.length; i++) {
                if (nodeInstanceOf(node.children[i], 'http-vwf-example-com-behavior-vwf'))
                    childBehaviorListeners = childBehaviorListeners.concat(findListeners(node.children[i], eventName));
            }

            return prototypeListeners.map(function(listener) { // remap the prototype listeners to target the node
                return {
                    handler: listener.handler,
                    context: node,
                    phases: listener.phases
                };
            }).concat(childBehaviorListeners).concat(nodeListeners);
        }

    }

});