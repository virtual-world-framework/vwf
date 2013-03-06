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

/// DOM element coordinate conversion functions.
/// 
/// @module vwf/utility/coordinates

define( function() {

    var exports = {

        /// Convert a coordinate from an element's content area to its internal coordinate system.
        /// The content box is the area within the element's padding.
        /// 
        /// @param {HTMLElement} element
        ///   The reference element.
        /// @param {Object} xyContent
        ///   An x, y coordinate relative to the element's content box, expressed as:
        ///   { x: value, y: value }.
        /// 
        /// @returns {Object}
        ///   An x, y coordinate relative to the element's internal coordinate system.

        canvasFromContent: function( element, xyContent ) {

            var computedStyle = getComputedStyle( element );

            var contentWidth = element.clientWidth -
                ( parseFloat( computedStyle.getPropertyValue( "padding-left" ) ) || 0 ) -
                ( parseFloat( computedStyle.getPropertyValue( "padding-right" ) ) || 0 );

            var contentHeight = element.clientHeight -
                ( parseFloat( computedStyle.getPropertyValue( "padding-top" ) ) || 0 ) -
                ( parseFloat( computedStyle.getPropertyValue( "padding-bottom" ) ) || 0 );

            return {
                x: ( xyContent && xyContent.x || 0 ) / contentWidth * ( element.width || contentWidth ),
                y: ( xyContent && xyContent.y || 0 ) / contentHeight * ( element.height || contentHeight ),
            };

        },

        /// Convert a coordinate from an element's padding area to its content area. The content box
        /// is the area within the element's padding. The padding box is the area within the
        /// element's border.
        /// 
        /// @param {HTMLElement} element
        ///   The reference element.
        /// @param {Object} xyPadding
        ///   An x, y coordinate relative to the element's padding box, expressed as:
        ///   { x: value, y: value }.
        /// 
        /// @returns {Object}
        ///   An x, y coordinate relative to the element's content box.

        contentFromPadding: function( element, xyPadding ) {

            var computedStyle = getComputedStyle( element );

            return {
                x: ( xyPadding && xyPadding.x || 0 ) - ( parseFloat( computedStyle.getPropertyValue( "padding-left" ) ) || 0 ) + element.scrollLeft,
                y: ( xyPadding && xyPadding.y || 0 ) - ( parseFloat( computedStyle.getPropertyValue( "padding-top" ) ) || 0 ) + element.scrollTop,
            };

        },

        /// Convert a coordinate from an element's border area to its padding area. The padding box
        /// is the area within the element's border. The border box encloses the overall element,
        /// including its content, padding and border.
        /// 
        /// @param {HTMLElement} element
        ///   The reference element.
        /// @param {Object} xyBorder
        ///   An x, y coordinate relative to the element's border box, expressed as:
        ///   { x: value, y: value }.
        /// 
        /// @returns {Object}
        ///   An x, y coordinate relative to the element's padding box.

        paddingFromBorder: function( element, xyBorder ) {

            var computedStyle = getComputedStyle( element );

            return {
                x: ( xyBorder && xyBorder.x || 0 ) - ( parseFloat( computedStyle.getPropertyValue( "border-left-width" ) ) || 0 ),
                y: ( xyBorder && xyBorder.y || 0 ) - ( parseFloat( computedStyle.getPropertyValue( "border-top-width" ) ) || 0 ),
            };

        },

        /// Convert a coordinate from an element's window coordinates to its border area. The border
        /// box encloses the overall element, including its content, padding and border. The window
        /// coordinates are the location of the border box in the browser window.
        /// 
        /// @param {HTMLElement} element
        ///   The reference element.
        /// @param {Object} xyWindow
        ///   An x, y coordinate relative to the element's border box in the browser window,
        ///   expressed as: { x: value, y: value }.
        /// 
        /// @returns {Object}
        ///   An x, y coordinate relative to the element's border box.

        borderFromWindow: function( element, xyWindow ) {

            var bounds = element.getBoundingClientRect(); // border box in window coordinates

            return {
                x: ( xyWindow && xyWindow.x || 0 ) - bounds.left,
                y: ( xyWindow && xyWindow.y || 0 ) - bounds.top,
            };

        },

        /// Convert a coordinate from an element's window coordinates to its content area.
        /// 
        /// @param {HTMLElement} element
        ///   The reference element.
        /// @param {Object} xyWindow
        ///   An x, y coordinate relative to the element's border box in the browser window,
        ///   expressed as: { x: value, y: value }.
        /// 
        /// @returns {Object}
        ///   An x, y coordinate relative to the element's content box.

        contentFromWindow: function( element, xyWindow ) {

            return this.contentFromPadding( element, this.paddingFromBorder( element,
                this.borderFromWindow( element, xyWindow ) ) );

        },

    };

    return exports;

} );
