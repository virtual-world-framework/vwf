"use strict";

// Copyright 2012-14 United States Government, as represented by the Secretary of Defense, Under
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
if (typeof define !== 'function') { var define = require('amdefine')(module) }
/// @module version

define( function() {

    /// The version identifier has the following form:
    /// 
    ///   major, minor, patch, release, build, derivative [ app, major, minor, patch ]
    /// 
    /// Fields are defined according to [SemVer](http://semver.org). The `release` and `build`
    /// fields are optional, but they are given low-precedence values by default so that official
    /// builds will always have a higher precedence than unofficial builds. The build tool removes
    /// these fields when appropriate.
    /// 
    /// The build tool overwrites the version identifier on the following line, and it isn't
    /// particuarly clever about it. Take care to keep the comment and formatting intact when
    /// bumping the version number.

    var version = [ 0, 8, 0, "", "", [ "ITDG", 2, 7, 1 ] ];  // version-identifier

    /// Render the version identifier as a SemVer-style string.

    version.toString = function() {
        return this.slice( 0, 3 ).join( "." ) +
            ( this[ 5 ] ? "-" + this[ 5 ][0] + "." + this[ 5 ].slice( 1, 4 ).join( "." ) : "" ) +
            ( this[ 3 ] ? "-" + this[ 3 ] : "" ) +
            ( this[ 4 ] ? "+" + this[ 4 ] : "" );
    };

    version.getDerivativeVersion = function () {
        return ( this[ 5 ] ? this[ 5 ][0] + " " + this[ 5 ].slice( 1, 4 ).join( "." ) : "" );
    }

    return version;

} );
