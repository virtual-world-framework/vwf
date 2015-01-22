/*global define*/
define([
        '../Core/Color',
        '../Core/defaultValue',
        '../Core/defineProperties',
        '../Core/Event',
        '../Core/GeographicTilingScheme'
    ], function(
        Color,
        defaultValue,
        defineProperties,
        Event,
        GeographicTilingScheme) {
    "use strict";

    /**
     * An {@link ImageryProvider} that draws a box around every rendered tile in the tiling scheme, and draws
     * a label inside it indicating the X, Y, Level coordinates of the tile.  This is mostly useful for
     * debugging terrain and imagery rendering problems.
     *
     * @alias TileCoordinatesImageryProvider
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {TilingScheme} [options.tilingScheme=new GeographicTilingScheme()] The tiling scheme for which to draw tiles.
     * @param {Color} [options.color=Color.YELLOW] The color to draw the tile box and label.
     * @param {Number} [options.tileWidth=256] The width of the tile for level-of-detail selection purposes.
     * @param {Number} [options.tileHeight=256] The height of the tile for level-of-detail selection purposes.
     */
    var TileCoordinatesImageryProvider = function TileCoordinatesImageryProvider(options) {
        options = defaultValue(options, {});

        this._tilingScheme = defaultValue(options.tilingScheme, new GeographicTilingScheme());
        this._color = defaultValue(options.color, Color.YELLOW);
        this._errorEvent = new Event();
        this._tileWidth = defaultValue(options.tileWidth, 256);
        this._tileHeight = defaultValue(options.tileHeight, 256);
    };


    defineProperties(TileCoordinatesImageryProvider.prototype, {
        /**
         * Gets the proxy used by this provider.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Proxy}
         */
        proxy : {
            get : function() {
                return undefined;
            }
        },

        /**
         * Gets the width of each tile, in pixels. This function should
         * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Number}
         */
        tileWidth : {
            get : function() {
                return this._tileWidth;
            }
        },

        /**
         * Gets the height of each tile, in pixels.  This function should
         * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Number}
         */
        tileHeight: {
            get : function() {
                return this._tileHeight;
            }
        },

        /**
         * Gets the maximum level-of-detail that can be requested.  This function should
         * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Number}
         */
        maximumLevel : {
            get : function() {
                return undefined;
            }
        },

        /**
         * Gets the minimum level-of-detail that can be requested.  This function should
         * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Number}
         */
        minimumLevel : {
            get : function() {
                return undefined;
            }
        },

        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {TilingScheme}
         */
        tilingScheme : {
            get : function() {
                return this._tilingScheme;
            }
        },

        /**
         * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
         * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Rectangle}
         */
        rectangle : {
            get : function() {
                return this._tilingScheme.rectangle;
            }
        },

        /**
         * Gets the tile discard policy.  If not undefined, the discard policy is responsible
         * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
         * returns undefined, no tiles are filtered.  This function should
         * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {TileDiscardPolicy}
         */
        tileDiscardPolicy : {
            get : function() {
                return undefined;
            }
        },

        /**
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
         * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
         * are passed an instance of {@link TileProviderError}.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Event}
         */
        errorEvent : {
            get : function() {
                return this._errorEvent;
            }
        },

        /**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Boolean}
         */
        ready : {
            get : function() {
                return true;
            }
        },

        /**
         * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
         * the source of the imagery.  This function should not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Credit}
         */
        credit : {
            get : function() {
                return undefined;
            }
        },

        /**
         * Gets a value indicating whether or not the images provided by this imagery provider
         * include an alpha channel.  If this property is false, an alpha channel, if present, will
         * be ignored.  If this property is true, any images without an alpha channel will be treated
         * as if their alpha is 1.0 everywhere.  Setting this property to false reduces memory usage
         * and texture upload time.
         * @memberof TileCoordinatesImageryProvider.prototype
         * @type {Boolean}
         */
        hasAlphaChannel : {
            get : function() {
                return true;
            }
        }
    });

    /**
     * Gets the credits to be displayed when a given tile is displayed.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level;
     * @returns {Credit[]} The credits to be displayed when the tile is displayed.
     *
     * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
     */
    TileCoordinatesImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };

    /**
     * Requests the image for a given tile.  This function should
     * not be called before {@link TileCoordinatesImageryProvider#ready} returns true.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     */
    TileCoordinatesImageryProvider.prototype.requestImage = function(x, y, level) {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        var context = canvas.getContext('2d');

        var cssColor = this._color.toCssColorString();

        context.strokeStyle = cssColor;
        context.lineWidth = 2;
        context.strokeRect(1, 1, 255, 255);

        var label = 'L' + level + 'X' + x + 'Y' + y;
        context.font = 'bold 25px Arial';
        context.textAlign = 'center';
        context.fillStyle = 'black';
        context.fillText(label, 127, 127);
        context.fillStyle = cssColor;
        context.fillText(label, 124, 124);

        return canvas;
    };

    /**
     * Picking features is not currently supported by this imagery provider, so this function simply returns
     * undefined.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @param {Number} longitude The longitude at which to pick features.
     * @param {Number} latitude  The latitude at which to pick features.
     * @return {Promise} A promise for the picked features that will resolve when the asynchronous
     *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
     *                   instances.  The array may be empty if no features are found at the given location.
     *                   It may also be undefined if picking is not supported.
     */
    TileCoordinatesImageryProvider.prototype.pickFeatures = function() {
        return undefined;
    };

    return TileCoordinatesImageryProvider;
});
