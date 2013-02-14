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

/// vwf/view/touch creates a view interface for touch sensitive functions. 
/// 
/// @module vwf/view/touch
/// @requires vwf/view

define( [ "module", "vwf/view" ], function( module, view ) {

    return view.load( module, {

        // == Module Definition ====================================================================

        initialize: function() {

            var $sw = $('body');

            $sw.on('transformstart', function (event) {
                event.stopPropagation();
            });

            $sw.on('transform', function (event) {
                event.stopPropagation();
                vwf_view.kernel.fireEvent( vwf.find("","/")[0], "touchTransform", [ event.rotation, event.scale ]);
            });

            var prevX, prevY;
            $sw.on('dragstart', function (event) {
                event.stopPropagation();
                prevX = event.distanceX;
                prevY = event.distanceY;            
            });

            $sw.on('drag', function (event) {
                event.stopPropagation();
                vwf_view.kernel.fireEvent( vwf.find("","/")[0], "touchDrag", [ event.distanceX-prevX, event.distanceY-prevY ]);
                prevX = event.distanceX;
                prevY = event.distanceY; 
            });

            $sw.on('tap', function (event) {
                event.stopPropagation();
                // event.position[0].x, event.position[0].y
                // $('canvas').trigger("mouseup", event);
            });

            $sw.on('doubletap', function (event) {
                event.stopPropagation();
            });

            $sw.on('hold', function (event) {
                event.stopPropagation();
            });

            $sw.on('swipe', function (event) {
                event.stopPropagation();
            });

        }
        
    } );

} );
