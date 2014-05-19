/*global define*/
define([
        '../../Core/BingMapsApi',
        '../../Core/Cartesian3',
        '../../Core/defaultValue',
        '../../Core/defined',
        '../../Core/defineProperties',
        '../../Core/DeveloperError',
        '../../Core/Ellipsoid',
        '../../Core/Extent',
        '../../Core/jsonp',
        '../../Core/Matrix3',
        '../../Core/Matrix4',
        '../../Scene/CameraFlightPath',
        '../../Scene/SceneMode',
        '../createCommand',
        '../../ThirdParty/knockout',
        '../../ThirdParty/when'
    ], function(
        BingMapsApi,
        Cartesian3,
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Ellipsoid,
        Extent,
        jsonp,
        Matrix3,
        Matrix4,
        CameraFlightPath,
        SceneMode,
        createCommand,
        knockout,
        when) {
    "use strict";

    /**
     * The view model for the {@link Geocoder} widget.
     * @alias GeocoderViewModel
     * @constructor
     *
     * @param {Scene} description.scene The Scene instance to use.
     * @param {String} [description.url='http://dev.virtualearth.net'] The base URL of the Bing Maps API.
     * @param {String} [description.key] The Bing Maps key for your application, which can be
     *        created at <a href='https://www.bingmapsportal.com/'>https://www.bingmapsportal.com/</a>.
     *        If this parameter is not provided, {@link BingMapsApi.defaultKey} is used.
     *        If {@link BingMapsApi.defaultKey} is undefined as well, a message is
     *        written to the console reminding you that you must create and supply a Bing Maps
     *        key as soon as possible.  Please do not deploy an application that uses
     *        this widget without creating a separate key for your application.
     * @param {Ellipsoid} [description.ellipsoid=Ellipsoid.WGS84] The Scene's primary ellipsoid.
     * @param {Number} [description.flightDuration=1500] The duration of the camera flight to an entered location, in milliseconds.
     *
     * @exception {DeveloperError} scene is required.
     */
    var GeocoderViewModel = function(description) {
        if (!defined(description) || !defined(description.scene)) {
            throw new DeveloperError('description.scene is required.');
        }

        this._url = defaultValue(description.url, 'http://dev.virtualearth.net/');
        if (this._url.length > 0 && this._url[this._url.length - 1] !== '/') {
            this._url += '/';
        }

        this._key = BingMapsApi.getKey(description.key);
        this._scene = description.scene;
        this._ellipsoid = defaultValue(description.ellipsoid, Ellipsoid.WGS84);
        this._flightDuration = defaultValue(description.flightDuration, 1500);
        this._searchText = '';
        this._isSearchInProgress = false;
        this._geocodeInProgress = undefined;

        var that = this;
        this._searchCommand = createCommand(function() {
            if (that.isSearchInProgress) {
                cancelGeocode(that);
            } else {
                geocode(that);
            }
        });

        knockout.track(this, ['_searchText', '_isSearchInProgress']);

        /**
         * Gets a value indicating whether a search is currently in progress.  This property is observable.
         *
         * @type {Boolean}
         */
        this.isSearchInProgress = undefined;
        knockout.defineProperty(this, 'isSearchInProgress', {
            get : function() {
                return this._isSearchInProgress;
            }
        });

        /**
         * Gets or sets the text to search for.
         *
         * @type {String}
         */
        this.searchText = undefined;
        knockout.defineProperty(this, 'searchText', {
            get : function() {
                if (this.isSearchInProgress) {
                    return 'Searching...';
                }
                return this._searchText;
            },
            set : function(value) {
                if (typeof value !== 'string') {
                    throw new DeveloperError('value must be a valid string.');
                }
                this._searchText = value;
            }
        });

        /**
         * Gets or sets the the duration of the camera flight in milliseconds.
         * A value of zero causes the camera to instantly switch to the geocoding location.
         *
         * @type {Number}
         * @default 1500
         */
        this.flightDuration = undefined;
        knockout.defineProperty(this, 'flightDuration', {
            get : function() {
                return this._flightDuration;
            },
            set : function(value) {
                if (value < 0) {
                    throw new DeveloperError('value must be positive.');
                }
                this._flightDuration = value;
            }
        });
    };

    defineProperties(GeocoderViewModel.prototype, {
        /**
         * Gets the Bing maps url.
         * @memberof GeocoderViewModel.prototype
         *
         * @type {String}
         */
        url : {
            get : function() {
                return this._url;
            }
        },

        /**
         * Gets the Bing maps key.
         * @memberof GeocoderViewModel.prototype
         *
         * @type {String}
         */
        key : {
            get : function() {
                return this._key;
            }
        },

        /**
         * Gets the scene to control.
         * @memberof GeocoderViewModel.prototype
         *
         * @type {Scene}
         */
        scene : {
            get : function() {
                return this._scene;
            }
        },

        /**
         * Gets the ellipsoid to be viewed.
         * @memberof GeocoderViewModel.prototype
         *
         * @type {Ellipsoid}
         */
        ellipsoid : {
            get : function() {
                return this._ellipsoid;
            }
        },

        /**
         * Gets the Command that is executed when the button is clicked.
         * @memberof GeocoderViewModel.prototype
         *
         * @type {Command}
         */
        search : {
            get : function() {
                return this._searchCommand;
            }
        }
    });

    function geocode(viewModel) {
        var query = viewModel.searchText;

        if (/^\s*$/.test(query)) {
            //whitespace string
            return;
        }

        viewModel._isSearchInProgress = true;

        var promise = jsonp(viewModel._url + 'REST/v1/Locations', {
            parameters : {
                query : query,
                key : viewModel._key

            },
            callbackParameterName : 'jsonp'
        });

        var geocodeInProgress = viewModel._geocodeInProgress = when(promise, function(result) {
            if (geocodeInProgress.cancel) {
                return;
            }
            viewModel._isSearchInProgress = false;

            if (result.resourceSets.length === 0) {
                viewModel.searchText = viewModel._searchText + ' (not found)';
                return;
            }

            var resourceSet = result.resourceSets[0];
            if (resourceSet.resources.length === 0) {
                viewModel.searchText = viewModel._searchText + ' (not found)';
                return;
            }

            var resource = resourceSet.resources[0];

            viewModel._searchText = resource.name;
            var bbox = resource.bbox;
            var south = bbox[0];
            var west = bbox[1];
            var north = bbox[2];
            var east = bbox[3];
            var extent = Extent.fromDegrees(west, south, east, north);

            var position = viewModel._scene.getCamera().controller.getExtentCameraCoordinates(extent);
            if (!defined(position)) {
                // This can happen during a scene mode transition.
                return;
            }

            var up;
            var direction;
            if (viewModel._scene.mode === SceneMode.SCENE3D) {
                up = Cartesian3.UNIT_Z;
                direction = Cartesian3.negate(viewModel._ellipsoid.geodeticSurfaceNormal(position));
            } else {
                up = Cartesian3.UNIT_Y;
                direction = Cartesian3.negate(Cartesian3.UNIT_Z);
            }

            var description = {
                destination : position,
                duration : viewModel._flightDuration,
                up : up,
                direction : direction
            };

            var camera = viewModel._scene.getCamera();
            if (!Matrix4.equals(camera.transform, Matrix4.IDENTITY)) {
                var transform = Matrix4.inverseTransformation(camera.transform);
                Matrix4.multiplyByPoint(camera.transform, camera.position, camera.position);

                var rotation = Matrix4.getRotation(camera.transform);
                Matrix3.multiplyByVector(rotation, camera.direction, camera.direction);
                Matrix3.multiplyByVector(rotation, camera.up, camera.up);
                Cartesian3.cross(camera.direction, camera.up, camera.right);

                camera.transform = Matrix4.IDENTITY;
                viewModel._scene.getScreenSpaceCameraController().setEllipsoid(viewModel._ellipsoid);
            }

            var flight = CameraFlightPath.createAnimation(viewModel._scene, description);
            viewModel._scene.getAnimations().add(flight);
        }, function() {
            if (geocodeInProgress.cancel) {
                return;
            }

            viewModel._isSearchInProgress = false;
            viewModel.searchText = viewModel._searchText + ' (error)';
        });
    }

    function cancelGeocode(viewModel) {
        viewModel._isSearchInProgress = false;
        if (defined(viewModel._geocodeInProgress)) {
            viewModel._geocodeInProgress.cancel = true;
            viewModel._geocodeInProgress = undefined;
        }
    }

    return GeocoderViewModel;
});