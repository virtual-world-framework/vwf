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

/// vwf/model/test.js is a dummy driver used for tests.
/// 
/// @module vwf/model/test
/// @requires vwf/model

define( [ "module", "vwf/model" ], function( module, model ) {

	var foo = 0;
    return model.load( module, {

        // == Module Definition ====================================================================

        // -- initialize ---------------------------------------------------------------------------

        initialize: function() {
            this.arguments = Array.prototype.slice.call( arguments );
        },

		callingMethod: function( nodeID, methodName, params ){
			
			switch( methodName ){
                case "bar":
                    foo = foo + 1;
                    return foo;
            }

            return undefined;
		}

    } );

} );
