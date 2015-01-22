/*global define*/
define([
        './defaultValue',
        './defined',
        './defineProperties',
        './Ellipsoid',
        './Event',
        './GeographicTilingScheme',
        './HeightmapTerrainData',
        './TerrainProvider'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        Ellipsoid,
        Event,
        GeographicTilingScheme,
        HeightmapTerrainData,
        TerrainProvider) {
    "use strict";

    /**
     * A very simple {@link TerrainProvider} that produces geometry by tessellating an ellipsoidal
     * surface.
     *
     * @alias EllipsoidTerrainProvider
     * @constructor
     *
     * @param {Object} [options] Object with the following properties:
     * @param {TilingScheme} [options.tilingScheme] The tiling scheme specifying how the ellipsoidal
     * surface is broken into tiles.  If this parameter is not provided, a {@link GeographicTilingScheme}
     * is used.
     * @param {Ellipsoid} [options.ellipsoid] The ellipsoid.  If the tilingScheme is specified,
     * this parameter is ignored and the tiling scheme's ellipsoid is used instead. If neither
     * parameter is specified, the WGS84 ellipsoid is used.
     *
     * @see TerrainProvider
     */
    var EllipsoidTerrainProvider = function EllipsoidTerrainProvider(options) {
        options = defaultValue(options, {});

        this._tilingScheme = options.tilingScheme;
        if (!defined(this._tilingScheme)) {
            this._tilingScheme = new GeographicTilingScheme({
                ellipsoid : defaultValue(options.ellipsoid, Ellipsoid.WGS84)
            });
        }

        // Note: the 64 below does NOT need to match the actual vertex dimensions, because
        // the ellipsoid is significantly smoother than actual terrain.
        this._levelZeroMaximumGeometricError = TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(this._tilingScheme.ellipsoid, 64, this._tilingScheme.getNumberOfXTilesAtLevel(0));

        var width = 16;
        var height = 16;
        this._terrainData = new HeightmapTerrainData({
            buffer : new Uint8Array(width * height),
            width : 16,
            height : 16
        });

        this._errorEvent = new Event();
    };

    defineProperties(EllipsoidTerrainProvider.prototype, {
        /**
         * Gets an event that is raised when the terrain provider encounters an asynchronous error.  By subscribing
         * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
         * are passed an instance of {@link TileProviderError}.
         * @memberof EllipsoidTerrainProvider.prototype
         * @type {Event}
         */
        errorEvent : {
            get : function() {
                return this._errorEvent;
            }
        },

        /**
         * Gets the credit to display when this terrain provider is active.  Typically this is used to credit
         * the source of the terrain.  This function should not be called before {@link EllipsoidTerrainProvider#ready} returns true.
         * @memberof EllipsoidTerrainProvider.prototype
         * @type {Credit}
         */
        credit : {
            get : function() {
                return undefined;
            }
        },

        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link EllipsoidTerrainProvider#ready} returns true.
         * @memberof EllipsoidTerrainProvider.prototype
         * @type {GeographicTilingScheme}
         */
        tilingScheme : {
            get : function() {
                return this._tilingScheme;
            }
        },

        /**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof EllipsoidTerrainProvider.prototype
         * @type {Boolean}
         */
        ready : {
            get : function() {
                return true;
            }
        },

        /**
         * Gets a value indicating whether or not the provider includes a water mask.  The water mask
         * indicates which areas of the globe are water rather than land, so they can be rendered
         * as a reflective surface with animated waves.  This function should not be
         * called before {@link EllipsoidTerrainProvider#ready} returns true.
         * @memberof EllipsoidTerrainProvider.prototype
         * @type {Boolean}
         */
        hasWaterMask : {
            get : function() {
                return false;
            }
        },

        /**
         * Gets a value indicating whether or not the requested tiles include vertex normals.
         * This function should not be called before {@link EllipsoidTerrainProvider#ready} returns true.
         * @memberof EllipsoidTerrainProvider.prototype
         * @type {Boolean}
         */
        hasVertexNormals : {
            get : function() {
                return false;
            }
        }
    });

    /**
     * Requests the geometry for a given tile.  This function should not be called before
     * {@link TerrainProvider#ready} returns true.  The result includes terrain
     * data and indicates that all child tiles are available.
     *
     * @param {Number} x The X coordinate of the tile for which to request geometry.
     * @param {Number} y The Y coordinate of the tile for which to request geometry.
     * @param {Number} level The level of the tile for which to request geometry.
     * @param {Boolean} [throttleRequests=true] True if the number of simultaneous requests should be limited,
     *                  or false if the request should be initiated regardless of the number of requests
     *                  already in progress.
     * @returns {Promise|TerrainData} A promise for the requested geometry.  If this method
     *          returns undefined instead of a promise, it is an indication that too many requests are already
     *          pending and the request will be retried later.
     */
    EllipsoidTerrainProvider.prototype.requestTileGeometry = function(x, y, level, throttleRequests) {
        return this._terrainData;
    };

    /**
     * Gets the maximum geometric error allowed in a tile at a given level.
     *
     * @param {Number} level The tile level for which to get the maximum geometric error.
     * @returns {Number} The maximum geometric error.
     */
    EllipsoidTerrainProvider.prototype.getLevelMaximumGeometricError = function(level) {
        return this._levelZeroMaximumGeometricError / (1 << level);
    };

    /**
     * Determines whether data for a tile is available to be loaded.
     *
     * @param {Number} x The X coordinate of the tile for which to request geometry.
     * @param {Number} y The Y coordinate of the tile for which to request geometry.
     * @param {Number} level The level of the tile for which to request geometry.
     * @returns {Boolean} Undefined if not supported, otherwise true or false.
     */
    EllipsoidTerrainProvider.prototype.getTileDataAvailable = function(x, y, level) {
        return undefined;
    };

    return EllipsoidTerrainProvider;
});