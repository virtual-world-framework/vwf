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

    createdNode: [ /* nodeID, childID, childExtendsID, childImplementsIDs, childSource, childType, childName, callback /- ( ready ) -/ */ ],
    deletedNode: [ /* nodeID */ ],

    addedChild: [ /* nodeID, childID, childName */ ],
    removedChild: [ /* nodeID, childID */ ],

    createdProperty: [ /* nodeID, propertyName, propertyValue */ ],
    initializedProperty: [ /* nodeID, propertyName, propertyValue */ ],
    /* TODO: deletedProperty, */
    satProperty: [ /* nodeID, propertyName, propertyValue */ ],
    gotProperty: [ /* nodeID, propertyName, propertyValue */ ],

    createdMethod: [ /* nodeID, methodName, methodParameters, methodBody */ ],
    /* TODO: deletedMethod, */
    calledMethod: [ /* nodeID, methodName, methodParameters */ ],

    createdEvent: [ /* nodeID, eventName, eventParameters */ ],
    /* TODO: deletedEvent, */
    firedEvent: [ /* nodeID, eventName, eventParameters */ ],

    executed: [ /* nodeID, scriptText, scriptType */ ],

    ticked: [ /* time */ ],

} );
