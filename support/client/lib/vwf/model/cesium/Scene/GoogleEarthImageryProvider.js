/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/loadText',
        '../Core/DeveloperError',
        '../Core/RuntimeError',
        '../Core/Event',
        '../Core/Extent',
        './ImageryProvider',
        './TileProviderError',
        './WebMercatorTilingScheme',
        './GeographicTilingScheme',
        './Credit',
        '../ThirdParty/when'
    ], function(
        defaultValue,
        defined,
        loadText,
        DeveloperError,
        RuntimeError,
        Event,
        Extent,
        ImageryProvider,
        TileProviderError,
        WebMercatorTilingScheme,
        GeographicTilingScheme,
        Credit,
        when) {
    "use strict";

    /**
     * Provides tiled imagery using the Google Earth Imagery API.
     *
     * Notes: This imagery provider does not work with the public Google Earth servers. It works with the
     *        Google Earth Enterprise Server.
     *
     *        By default the Google Earth Enterprise server does not set the
     *        <a href='http://www.w3.org/TR/cors/'>Cross-Origin Resource Sharing</a> headers. You can either
     *        use a proxy server which adds these headers, or in the /opt/google/gehttpd/conf/gehttpd.conf
     *        and add the 'Header set Access-Control-Allow-Origin "*"' option to the '&lt;Directory /&gt;' and
     *        '&lt;Directory "/opt/google/gehttpd/htdocs"&gt;' directives.
     *
     * @alias GoogleEarthImageryProvider
     * @constructor
     *
     * @param {String} description.url The url of the Google Earth server hosting the imagery.
     * @param {Number} description.channel The channel (id) to be used when requesting data from the server.
     *        The channel number can be found by looking at the json file located at:
     *        earth.localdomain/default_map/query?request=Json&vars=geeServerDefs The /default_map path may
     *        differ depending on your Google Earth Enterprise server configuration. Look for the "id" that
     *        is associated with a "ImageryMaps" requestType. There may be more than one id available.
     *        Example:
     *        {
     *          layers: [
     *            {
     *              id: 1002,
     *              requestType: "ImageryMaps"
     *            },
     *            {
     *              id: 1007,
     *              requestType: "VectorMapsRaster"
     *            }
     *          ]
     *        }
     * @param {String} [description.path="/default_map"] The path of the Google Earth server hosting the imagery.
     * @param {Number} [description.maximumLevel=23] The maximum level-of-detail supported by the Google Earth
     *        Enterprise server.
     * @param {TileDiscardPolicy} [description.tileDiscardPolicy] The policy that determines if a tile
     *        is invalid and should be discarded. To ensure that no tiles are discarded, construct and pass
     *        a {@link NeverTileDiscardPolicy} for this parameter.
     * @param {Proxy} [description.proxy] A proxy to use for requests. This object is
     *        expected to have a getURL function which returns the proxied URL, if needed.
     *
     * @exception {DeveloperError} <code>description.url</code> is required.
     * @exception {DeveloperError} <code>description.channel</code> is required.
     * @exception {RuntimeError} Could not find layer with channel (id) of <code>description.channel</code>.
     * @exception {RuntimeError} Could not find a version in channel (id) <code>description.channel</code>.
     * @exception {RuntimeError} Unsupported projection <code>data.projection</code>.
     *
     * @see ArcGisMapServerImageryProvider
     * @see BingMapsImageryProvider
     * @see OpenStreetMapImageryProvider
     * @see SingleTileImageryProvider
     * @see TileMapServiceImageryProvider
     * @see WebMapServiceImageryProvider
     *
     * @see <a href='http://www.w3.org/TR/cors/'>Cross-Origin Resource Sharing</a>
     *
     * @example
     * var google = new GoogleEarthImageryProvider({
     *     url : 'http://earth.localdomain',
     *     channel : 1008
     * });
     */
    var GoogleEarthImageryProvider = function GoogleEarthImageryProvider(description) {
        description = defaultValue(description, {});

        if (!defined(description.url)) {
            throw new DeveloperError('description.url is required.');
        }
        if (!defined(description.channel)) {
            throw new DeveloperError('description.channel is required.');
        }

        this._url = description.url;
        this._path = defaultValue(description.path, '/default_map');
        this._tileDiscardPolicy = description.tileDiscardPolicy;
        this._proxy = description.proxy;
        this._channel = description.channel;
        this._requestType = 'ImageryMaps';
        this._credit = new Credit('Google Imagery', GoogleEarthImageryProvider._logoData, 'http://www.google.com/enterprise/mapsearth/products/earthenterprise.html');

        /**
         * The default {@link ImageryLayer#gamma} to use for imagery layers created for this provider.
         * By default, this is set to 1.9.  Changing this value after creating an {@link ImageryLayer} for this provider will have
         * no effect.  Instead, set the layer's {@link ImageryLayer#gamma} property.
         *
         * @type {Number}
         * @default 1.9
         */
        this.defaultGamma = 1.9;

        this._tilingScheme = undefined;

        this._version = undefined;


        this._tileWidth = 256;
        this._tileHeight = 256;
        this._maximumLevel = defaultValue(description.maximumLevel, 23);
        this._imageUrlTemplate = this._url + this._path + '/query?request={request}&channel={channel}&version={version}&x={x}&y={y}&z={zoom}';

        this._errorEvent = new Event();

        this._ready = false;

        var metadataUrl = this._url + this._path + '/query?request=Json&vars=geeServerDefs&is2d=t';
        var that = this;
        var metadataError;

        function metadataSuccess(text) {
            var data;

            // The Google Earth server sends malformed JSON data currently...
            try {
                // First, try parsing it like normal in case a future version sends correctly formatted JSON
                data = JSON.parse(text);
            } catch(e) {
                // Quote object strings manually, then try parsing again
                data = JSON.parse(text.replace(/([\[\{,])[\n\r ]*([A-Za-z0-9]+)[\n\r ]*:/g, '$1"$2":'));
            }

            var layer;
            for(var i = 0; i < data.layers.length; i++) {
              if(data.layers[i].id === that._channel) {
                layer = data.layers[i];
                break;
              }
            }

            var message;

            if(!defined(layer)) {
              message = 'Could not find layer with channel (id) of ' + that._channel + '.';
              metadataError = TileProviderError.handleError(metadataError, that, that._errorEvent, message, undefined, undefined, undefined, requestMetadata);
              throw new RuntimeError(message);
            }

            if(!defined(layer.version)) {
              message = 'Could not find a version in channel (id) ' + that._channel + '.';
              metadataError = TileProviderError.handleError(metadataError, that, that._errorEvent, message, undefined, undefined, undefined, requestMetadata);
              throw new RuntimeError(message);
            }
            that._version = layer.version;

            if(defined(data.projection) && data.projection === 'flat') {
              that._tilingScheme = new GeographicTilingScheme({
                  numberOfLevelZeroTilesX : 2,
                  numberOfLevelZeroTilesY : 2,
                  extent: new Extent(-Math.PI, -Math.PI, Math.PI, Math.PI)
              });
            // Default to mercator projection when projection is undefined
            } else if(!defined(data.projection) || data.projection === 'mercator') {
              that._tilingScheme = new WebMercatorTilingScheme({
                  numberOfLevelZeroTilesX : 2,
                  numberOfLevelZeroTilesY : 2
              });
            } else {
              message = 'Unsupported projection ' + data.projection + '.';
              metadataError = TileProviderError.handleError(metadataError, that, that._errorEvent, message, undefined, undefined, undefined, requestMetadata);
              throw new RuntimeError(message);
            }

            that._imageUrlTemplate = that._imageUrlTemplate.replace('{request}', that._requestType)
              .replace('{channel}', that._channel).replace('{version}', that._version).replace('http:', '');;

            that._ready = true;
            TileProviderError.handleSuccess(metadataError);
        }

        function metadataFailure(e) {
            var message = 'An error occurred while accessing ' + metadataUrl + '.';
            metadataError = TileProviderError.handleError(metadataError, that, that._errorEvent, message, undefined, undefined, undefined, requestMetadata);
        }

        function requestMetadata() {
          var url = (!defined(that._proxy)) ? metadataUrl : that._proxy.getURL(metadataUrl);

          var metadata = loadText(url);
          when(metadata, metadataSuccess, metadataFailure);
        }

        requestMetadata();
    };

    /**
     * Gets the name of the Google Earth server url hosting the imagery.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {String} The url.
     */
    GoogleEarthImageryProvider.prototype.getUrl = function() {
        return this._url;
    };

    /**
     * Gets the url path of the data on the Google Earth server.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {String} The path.
     */
    GoogleEarthImageryProvider.prototype.getPath = function() {
        return this._path;
    };

    /**
     * Gets the proxy used by this provider.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Proxy} The proxy.
     *
     * @see DefaultProxy
     */
    GoogleEarthImageryProvider.prototype.getProxy = function() {
        return this._proxy;
    };

    /**
     * Gets the imagery channel (id) currently being used.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Number} The channel.
     */
    GoogleEarthImageryProvider.prototype.getChannel = function() {
        return this._channel;
    };


    /**
     * Gets the width of each tile, in pixels.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Number} The width.
     *
     * @exception {DeveloperError} <code>getTileWidth</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getTileWidth = function() {
        if (!this._ready) {
            throw new DeveloperError('getTileWidth must not be called before the imagery provider is ready.');
        }
        return this._tileWidth;
    };

    /**
     * Gets the height of each tile, in pixels.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Number} The height.
     *
     * @exception {DeveloperError} <code>getTileHeight</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getTileHeight = function() {
        if (!this._ready) {
            throw new DeveloperError('getTileHeight must not be called before the imagery provider is ready.');
        }
        return this._tileHeight;
    };

    /**
     * Gets the maximum level-of-detail that can be requested.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Number} The maximum level.
     *
     * @exception {DeveloperError} <code>getMaximumLevel</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getMaximumLevel = function() {
        if (!this._ready) {
            throw new DeveloperError('getMaximumLevel must not be called before the imagery provider is ready.');
        }
        return this._maximumLevel;
    };

    /**
     * Gets the minimum level-of-detail that can be requested.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Number} The minimum level.
     *
     * @exception {DeveloperError} <code>getMinimumLevel</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getMinimumLevel = function() {
        if (!this._ready) {
            throw new DeveloperError('getMaximumLevel must not be called before the imagery provider is ready.');
        }
        return 0;
    };

    /**
     * Gets the tiling scheme used by this provider.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {TilingScheme} The tiling scheme.
     * @see WebMercatorTilingScheme
     * @see GeographicTilingScheme
     *
     * @exception {DeveloperError} <code>getTilingScheme</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getTilingScheme = function() {
        if (!this._ready) {
            throw new DeveloperError('getTilingScheme must not be called before the imagery provider is ready.');
        }
        return this._tilingScheme;
    };

    /**
     * Gets the tiling scheme used by this provider.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {TilingScheme} The tiling scheme.
     * @see WebMercatorTilingScheme
     * @see GeographicTilingScheme
     *
     * @exception {DeveloperError} <code>getTilingScheme</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getTilingScheme = function() {
        if (!this._ready) {
            throw new DeveloperError('getTilingScheme must not be called before the imagery provider is ready.');
        }
        return this._tilingScheme;
    };

    /**
     * Gets the version of the data used by this provider.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Number} The data version number.
     *
     * @exception {DeveloperError} <code>getVersion</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getVersion = function() {
        if (!this._ready) {
            throw new DeveloperError('getVersion must not be called before the imagery provider is ready.');
        }
        return this._version;
    };

    /**
     * Gets the type of data that is being requested from the provider.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {String} The data request type.
     *
     * @exception {DeveloperError} <code>getRequestType</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getRequestType = function() {
        if (!this._ready) {
            throw new DeveloperError('getRequestType must not be called before the imagery provider is ready.');
        }
        return this._requestType;
    };

    /**
     * Gets the extent, in radians, of the imagery provided by this instance.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Extent} The extent.
     *
     * @exception {DeveloperError} <code>getExtent</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getExtent = function() {
        if (!this._ready) {
            throw new DeveloperError('getExtent must not be called before the imagery provider is ready.');
        }
        return this._tilingScheme.getExtent();
    };

    /**
     * Gets the tile discard policy.  If not undefined, the discard policy is responsible
     * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
     * returns undefined, no tiles are filtered.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {TileDiscardPolicy} The discard policy.
     *
     * @see DiscardMissingTileImagePolicy
     * @see NeverTileDiscardPolicy
     *
     * @exception {DeveloperError} <code>getTileDiscardPolicy</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.getTileDiscardPolicy = function() {
        if (!this._ready) {
            throw new DeveloperError('getTileDiscardPolicy must not be called before the imagery provider is ready.');
        }
        return this._tileDiscardPolicy;
    };

    /**
     * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
     * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
     * are passed an instance of {@link TileProviderError}.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Event} The event.
     */
    GoogleEarthImageryProvider.prototype.getErrorEvent = function() {
        return this._errorEvent;
    };

    /**
     * Gets a value indicating whether or not the provider is ready for use.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Boolean} True if the provider is ready to use; otherwise, false.
     */
    GoogleEarthImageryProvider.prototype.isReady = function() {
        return this._ready;
    };

    /**
     * Requests the image for a given tile.  This function should
     * not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     *
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     *
     * @exception {DeveloperError} <code>getTileDiscardPolicy</code> must not be called before the imagery provider is ready.
     */
    GoogleEarthImageryProvider.prototype.requestImage = function(x, y, level) {
        if (!this._ready) {
            throw new DeveloperError('requestImage must not be called before the imagery provider is ready.');
        }
        var url = buildImageUrl(this, x, y, level);
        return ImageryProvider.loadImage(this, url);
    };

   /**
     * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
     * the source of the imagery.  This function should not be called before {@link GoogleEarthImageryProvider#isReady} returns true.
     *
     * @memberof GoogleEarthImageryProvider
     *
     * @returns {Credit} The credit, or undefined if no credit exists
     */
    GoogleEarthImageryProvider.prototype.getCredit = function() {
        return this._credit;
    };

    GoogleEarthImageryProvider._logoData = 'data:image/png;base64,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';

    function buildImageUrl(imageryProvider, x, y, level) {
        var imageUrl = imageryProvider._imageUrlTemplate;

        imageUrl = imageUrl.replace('{x}', x);
        imageUrl = imageUrl.replace('{y}', y);
        // Google Earth starts with a zoom level of 1, not 0
        imageUrl = imageUrl.replace('{zoom}', (level + 1));

        var proxy = imageryProvider._proxy;
        if (defined(proxy)) {
            imageUrl = proxy.getURL(imageUrl);
        }

        return imageUrl;
    }

    return GoogleEarthImageryProvider;
});

