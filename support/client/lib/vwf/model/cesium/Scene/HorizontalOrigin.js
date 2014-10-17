/*global define*/
define(function() {
    "use strict";

    /**
     * The horizontal location of an origin relative to an object, e.g., a {@link Billboard}.
     * For example, the horizontal origin is used to display a billboard to the left or right (in
     * screen space) of the actual position.
     *
     * @exports HorizontalOrigin
     *
     * @see Billboard#horizontalOrigin
     */
    var HorizontalOrigin = {
        /**
         * The origin is at the horizontal center of the object.
         *
         * @type {Number}
         * @constant
         */
        CENTER : 0,

        /**
         * The origin is on the left side of the object.
         *
         * @type {Number}
         * @constant
         */
        LEFT : 1,

        /**
         * The origin is on the right side of the object.
         *
         * @type {Number}
         * @constant
         */
        RIGHT : -1
    };

    return HorizontalOrigin;
});