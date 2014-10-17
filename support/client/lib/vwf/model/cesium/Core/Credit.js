/*global define*/
define([
        './defined',
        './defineProperties',
        './DeveloperError'
    ], function(
        defined,
        defineProperties,
        DeveloperError) {
    "use strict";

    /**
     * A credit contains data pertaining to how to display attributions/credits for certain content on the screen.
     *
     * @param {String} [text] The text to be displayed on the screen if no imageUrl is specified.
     * @param {String} [imageUrl] The source location for an image
     * @param {String} [link] A URL location for which the credit will be hyperlinked
     *
     * @alias Credit
     * @constructor
     *
     * @example
     * //Create a credit with a tooltip, image and link
     * var credit = new Cesium.Credit('Cesium', '/images/cesium_logo.png', 'http://cesiumjs.org/');
     */

    var Credit = function(text, imageUrl, link) {
        var hasLink = (defined(link));
        var hasImage = (defined(imageUrl));
        var hasText = (defined(text));

        //>>includeStart('debug', pragmas.debug);
        if (!hasText && !hasImage && !hasLink) {
            throw new DeveloperError('text, imageUrl or link is required');
        }
        //>>includeEnd('debug');

        if (!hasText && !hasImage) {
            text = link;
        }

        this._text = text;

        this._imageUrl = imageUrl;

        this._link = link;

        this._hasLink = hasLink;

        this._hasImage = hasImage;
    };

    defineProperties(Credit.prototype, {
        /**
         * The credit text
         * @memberof Credit.prototype
         * @type {String}
         */
        text : {
            get : function() {
                return this._text;
            }
        },

        /**
         * The source location for the image.
         * @memberof Credit.prototype
         * @type {String}
         */
        imageUrl : {
            get : function() {
                return this._imageUrl;
            }
        },

        /**
         * A URL location for the credit hyperlink
         * @memberof Credit.prototype
         * @type {String}
         */
        link : {
            get : function() {
                return this._link;
            }
        }
    });

    /**
     * Returns true if the credit has an imageUrl
     *
     * @returns {Boolean}
     */
    Credit.prototype.hasImage = function() {
        return this._hasImage;
    };

    /**
     * Returns true if the credit has a link
     *
     * @returns {Boolean}
     */
    Credit.prototype.hasLink = function() {
        return this._hasLink;
    };

    /**
     * Returns true if the credits are equal
     *
     * @param {Credit} left The first credit
     * @param {Credit} left The second credit
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Credit.equals = function(left, right) {
        var leftUndefined = (!defined(left));
        var rightUndefined = (!defined(right));

        return ((left === right) ||
               ((leftUndefined && rightUndefined) ||
               (!leftUndefined && !rightUndefined)) &&
               ((left._text === right._text &&
               left._imageUrl === right._imageUrl &&
               left._link === right._link)));
    };

    /**
     * Returns true if the credits are equal
     *
     * @param {Credit} credits The credit to compare to.
     * @returns {Boolean} <code>true</code> if left and right are equal, <code>false</code> otherwise.
     */
    Credit.prototype.equals = function(credit) {
        return Credit.equals(this, credit);
    };

    return Credit;
});