"use strict";

// Copyright 2012-13 United States Government, as represented by the Secretary of Defense, Under
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

/// Test utility functions.
/// 
/// @module test/utility

define( [ "module" ], function( module ) {

    return {

        /// Create a unique name from a base.
        /// 
        /// @param {String} base
        ///   A string to serve as the base part of the name.
        /// 
        /// @returns {String}
        ///   A variant of `base` different from any other `uniqueName` result for the same base.

        uniqueName: function( base ) {

            if ( uniqueNameSequence === undefined ) {
                uniqueNameSequence = 0;
            }

            return base + "-" + ++uniqueNameSequence;
        },

        /// Run assertions against actions on the future queue. Call QUnit's `start` when completed
        /// to resume testing.
        /// 
        /// The assertion functions run when time leaves the time specified in the `assertions`
        /// objects. For example, if actions are scheduled for times t1 and t2, an assertion
        /// intended to test the first action should specify t1. The action at t1 will execute, time
        /// will move towards t2, the assertion will run, then the action at t2 will execute. If
        /// actions are scheduled for t1, t1, and t2, then the assertion will run after both t1
        /// actions execute.
        /// 
        /// @param {Function} [tocked]
        ///   A function to call each time the time changes, just before any assertions scheduled
        ///   for that time are run.
        /// @param {Array} assertions
        ///   Assertions to run at certain points in the future. Each object in `assertions` should
        ///   contain an `assertion` field that references a function that runs QUnit assertions,
        ///   and either an `absolute` or `relative` field specifying the time to call the function.
        ///   Relative times are calculated from the time that `runFutureAssertions` is called.
        /// @param {Function} [cleanup]
        ///   A function that may be used to clean up the test environment. If provided, `cleanup`
        ///   runs after the assertion functions have run, just before `start` is called.

        runFutureAssertions: function( tocked, assertions, cleanup ) {

            // Interpret runFutureAssertions( assertions, cleanup ) as
            // runFutureAssertions( undefined, assertions, cleanup )

            if ( typeof tocked != "function" && ! ( tocked instanceof Function ) ) {
                cleanup = assertions;
                assertions = tocked;
                tocked = undefined;
            }

            // Listen for the kernel tock.

            window.vwf_view.tocked = function( time ) {

                if ( next < assertions.length ) {

                    // Call our caller's function every time the time changes. The function runs
                    // just before any assertions.

                    tocked && tocked( time );

                    // Run any assertions that are ready.

                    while ( next < assertions.length && ready( assertions[next], time ) ) {
                        assertions[next++].assertion();
                    }

                } else {

                    // When finished, unlisten for the kernel tock, run the cleanup function, and
                    // tell qunit that we're done.

                    window.vwf_view.tocked = undefined;
                    cleanup && cleanup();

                    start();
                }

            }

            var reference = vwf.time();
            var next = 0;

            // Time to run the next one?

            function ready( assertion, time ) {
                return assertion.absolute !== undefined && time > assertion.absolute ||
                    assertion.relative !== undefined && time > reference + assertions[next].relative;
            }
          
        },

        /// Convert a component descriptor to a data URI component.

        dataURIFromDescriptor: function( descriptor ) {

            return "data:application/json;base64," + btoa( JSON.stringify( descriptor ) );

        },

        /// Convert a component descriptor to a data URI component.

        dataURIFromScriptText: function( scriptText ) {

            return "data:application/javascript;base64," + btoa( scriptText );

        },

    };

    /// Sequence counter for `uniqueName`.

    var uniqueNameSequence;

} );
