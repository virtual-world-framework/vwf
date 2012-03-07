/*Copyright 2012 Lockheed Martin

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License. */
define( {

    createNode: [ /* nodeID, childComponent, childName, callback /- ( childID ) -/ */ ],
    deleteNode: [ /* nodeID */ ],
    setNode: [ /* nodeID, component */ ],
    getNode: [ /* nodeID */ ],

    prototype: [ /* nodeID */ ],
    prototypes: [ /* nodeID */ ],

    addChild: [ /* nodeID, childID, childName */ ],
    removeChild: [ /* nodeID, childID */ ],

    ancestors: [ /* nodeID */ ],
    parent: [ /* nodeID */ ],
    children: [ /* nodeID */ ],
    name: [ /* nodeID */ ],

    setProperties: [ /* nodeID, properties */ ],
    getProperties: [ /* nodeID */ ],
    createProperty: [ /* nodeID, propertyName, propertyValue, propertyGet, propertySet */ ],
    /* TODO: deleteProperty, */
    setProperty: [ /* nodeID, propertyName, propertyValue */ ],
    getProperty: [ /* nodeID, propertyName */ ],

    createMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],
    /* TODO: deleteMethod, */
    callMethod: [ /* nodeID, methodName, methodParameters */ ],

    createEvent: [ /* nodeID, eventName, eventParameters */ ],
    /* TODO: deleteEvent, */
    fireEvent: [ /* nodeID, eventName, eventParameters */ ],
    dispatchEvent: [ /* nodeID, eventName, eventParameters, eventNodeParameters */ ],

    execute: [ /* nodeID, scriptText, scriptType */ ],

    time: [],
    client: [],
    moniker: [],

} );
