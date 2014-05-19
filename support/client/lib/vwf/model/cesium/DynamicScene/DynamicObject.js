/*global define*/
define(['../Core/createGuid',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Event',
        '../Core/JulianDate',
        '../Core/TimeInterval',
        './createDynamicPropertyDescriptor'
    ], function(
        createGuid,
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        JulianDate,
        TimeInterval,
        createDynamicPropertyDescriptor) {
    "use strict";

    var reservedPropertyNames = ['cachedAvailabilityDate', 'cachedAvailabilityValue', 'id', 'propertyChanged', //
                                 'propertyNames', 'isAvailable', 'clean', 'merge', 'addProperty', 'removeProperty'];

    /**
     * DynamicObject instances are the primary data store for processed data.
     * They are used primarily by the visualizers to create and maintain graphic
     * primitives that represent the DynamicObject's properties at a specific time.
     * @alias DynamicObject
     * @constructor
     *
     * @param {String} [id] A unique identifier for this object.  If no id is provided, a GUID is generated.
     *
     * @see Property
     * @see DynamicObjectCollection
     */
    var DynamicObject = function(id) {
        this._cachedAvailabilityDate = undefined;
        this._cachedAvailabilityValue = undefined;

        if (!defined(id)) {
            id = createGuid();
        }

        this._id = id;
        this._availability = undefined;
        this._position = undefined;
        this._orientation = undefined;
        this._billboard = undefined;
        this._cone = undefined;
        this._ellipsoid = undefined;
        this._ellipse = undefined;
        this._label = undefined;
        this._name = undefined;
        this._parent = undefined;
        this._path = undefined;
        this._point = undefined;
        this._polygon = undefined;
        this._polyline = undefined;
        this._pyramid = undefined;
        this._vertexPositions = undefined;
        this._vector = undefined;
        this._viewFrom = undefined;

        this._propertyChanged = new Event();
        this._propertyNames = ['parent', 'position', 'orientation', 'billboard', //
                               'cone', 'ellipsoid', 'ellipse', 'label', 'path', 'point', 'polygon', //
                               'polyline', 'pyramid', 'vertexPositions', 'vector', 'viewFrom'];
    };

    defineProperties(DynamicObject.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof DynamicObject.prototype
         * @type {Event}
         */
        propertyChanged : {
            get : function() {
                return this._propertyChanged;
            }
        },
        /**
         * Gets the names of all properties registed on this instance.
         * @memberof DynamicObject.prototype
         * @type {Event}
         */
        propertyNames : {
            get : function() {
                return this._propertyNames;
            }
        },
        /**
         * Gets the unique ID associated with this object.
         * @memberof DynamicObject.prototype
         * @type {String}
         */
        id : {
            get : function() {
                return this._id;
            }
        },
        /**
         * Gets or sets the name of the object.  The name is intended for end-user
         * consumption and does not need to be unique.
         * @memberof DynamicObject.prototype
         * @type {String}
         */
        name : {
            configurable : false,
            get : function() {
                return this._name;
            },
            set : function(value) {
                var oldValue = this._name;
                if (oldValue !== value) {
                    this._name = value;
                    this._propertyChanged.raiseEvent(this, 'name', value, oldValue);
                }
            }
        },
        /**
         * The availability, if any, associated with this object.
         * If availability is undefined, it is assumed that this object's
         * other properties will return valid data for any provided time.
         * If availability exists, the objects other properties will only
         * provide valid data if queried within the given interval.
         * @memberof DynamicObject.prototype
         * @type {TimeIntervalCollection}
         */
        availability : createDynamicPropertyDescriptor('availability', '_availability'),
        /**
         * Gets or sets the position.
         * @memberof DynamicObject.prototype
         * @type {PositionProperty}
         */
        position : createDynamicPropertyDescriptor('position', '_position'),
        /**
         * Gets or sets the orientation.
         * @memberof DynamicObject.prototype
         * @type {Property}
         */
        orientation : createDynamicPropertyDescriptor('orientation', '_orientation'),
        /**
         * Gets or sets the suggested initial offset for viewing this object
         * with the camera.  The offset is defined in the east-north-up reference frame.
         * @memberof DynamicObject.prototype
         * @type {Cartesian3}
         */
        viewFrom : createDynamicPropertyDescriptor('viewFrom', '_viewFrom'),
        /**
         * Gets or sets the billboard.
         * @memberof DynamicObject.prototype
         * @type {DynamicBillboard}
         */
        billboard : createDynamicPropertyDescriptor('billboard', '_billboard'),
        /**
         * Gets or sets the cone.
         * @memberof DynamicObject.prototype
         * @type {DynamicCone}
         */
        cone : createDynamicPropertyDescriptor('cone', '_cone'),

        /**
         * Gets or sets the ellipsoid.
         * @memberof DynamicObject.prototype
         * @type {DynamicEllipsoid}
         */
        ellipsoid : createDynamicPropertyDescriptor('ellipsoid', '_ellipsoid'),
        /**
         * Gets or sets the ellipse.
         * @memberof DynamicObject.prototype
         * @type {DynamicEllipse}
         */
        ellipse : createDynamicPropertyDescriptor('ellipse', '_ellipse'),
        /**
         * Gets or sets the label.
         * @memberof DynamicObject.prototype
         * @type {DynamicLabel}
         */
        label : createDynamicPropertyDescriptor('label', '_label'),
        /**
         * Gets or sets the parent object.
         * @memberof DynamicObject.prototype
         * @type {DynamicObject}
         */
        parent : createDynamicPropertyDescriptor('parent', '_parent'),
        /**
         * Gets or sets the path.
         * @memberof DynamicObject.prototype
         * @type {DynamicPath}
         */
        path : createDynamicPropertyDescriptor('path', '_path'),
        /**
         * Gets or sets the point graphic.
         * @memberof DynamicObject.prototype
         * @type {DynamicPoint}
         */
        point : createDynamicPropertyDescriptor('point', '_point'),
        /**
         * Gets or sets the polygon.
         * @memberof DynamicObject.prototype
         * @type {DynamicPolygon}
         */
        polygon : createDynamicPropertyDescriptor('polygon', '_polygon'),
        /**
         * Gets or sets the polyline.
         * @memberof DynamicObject.prototype
         * @type {DynamicPolyline}
         */
        polyline : createDynamicPropertyDescriptor('polyline', '_polyline'),
        /**
         * Gets or sets the pyramid.
         * @memberof DynamicObject.prototype
         * @type {DynamicPyramid}
         */
        pyramid : createDynamicPropertyDescriptor('pyramid', '_pyramid'),
        /**
         * Gets or sets the vertex positions.
         * @memberof DynamicObject.prototype
         * @type {Property}
         */
        vertexPositions : createDynamicPropertyDescriptor('vertexPositions', '_vertexPositions'),
        /**
         * Gets or sets the vector.
         * @memberof DynamicObject.prototype
         * @type {DynamicVector}
         */
        vector : createDynamicPropertyDescriptor('vector', '_vector')
    });

    /**
     * Given a time, returns true if this object should have data during that time.
     * @memberof DynamicObject
     *
     * @param {JulianDate} time The time to check availability for.
     * @exception {DeveloperError} time is required.
     * @returns true if the object should have data during the provided time, false otherwise.
     */
    DynamicObject.prototype.isAvailable = function(time) {
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }

        var availability = this._availability;
        return !defined(availability) || availability.contains(time);
    };

    /**
     * Adds a property to this object.  Once a property is added, it can be
     * observed with {@link DynamicObject.propertyChanged} and composited
     * with {@link CompositeDynamicObjectCollection}
     * @memberof DynamicObject
     *
     * @param propertyName The name of the property to add.
     *
     * @exception {DeveloperError} propertyName is required.
     * @exception {DeveloperError} "propertyName" is a reserved property name.
     * @exception {DeveloperError} "propertyName" is already a registered property.
     */
    DynamicObject.prototype.addProperty = function(propertyName) {
        if (!defined(propertyName)) {
            throw new DeveloperError('propertyName is required.');
        }

        var propertyNames = this._propertyNames;
        if (propertyNames.indexOf(propertyName) !== -1) {
            throw new DeveloperError(propertyName + ' is already a registered property.');
        }
        if (reservedPropertyNames.indexOf(propertyName) !== -1) {
            throw new DeveloperError(propertyName + ' is a reserved property name.');
        }

        propertyNames.push(propertyName);

        Object.defineProperty(this, propertyName, createDynamicPropertyDescriptor(propertyName, '_' + propertyName, true));
    };

    /**
     * Removed a property previously added with addProperty.
     * @memberof DynamicObject
     *
     * @param propertyName The name of the property to remove.
     *
     * @exception {DeveloperError} propertyName is required.
     * @exception {DeveloperError} "propertyName" is a reserved property name.
     * @exception {DeveloperError} "propertyName" is not a registered property.
     */
    DynamicObject.prototype.removeProperty = function(propertyName) {
        if (!defined(propertyName)) {
            throw new DeveloperError('propertyName is required.');
        }

        var propertyNames = this._propertyNames;
        if (reservedPropertyNames.indexOf(propertyName) !== -1) {
            throw new DeveloperError(propertyName + ' is a reserved property name.');
        }
        if (propertyNames.indexOf(propertyName) === -1) {
            throw new DeveloperError(propertyName + ' is not a registered property.');
        }

        this._propertyNames.push(propertyName);
        delete this[propertyName];
    };

    /**
     * Assigns each unassigned property on this object to the value
     * of the same property on the provided source object.
     * @memberof DynamicObject
     *
     * @param {DynamicObject} source The object to be merged into this object.
     * @exception {DeveloperError} source is required.
     */
    DynamicObject.prototype.merge = function(source) {
        if (!defined(source)) {
            throw new DeveloperError('source is required.');
        }

        //Name and availability are not Property objects and are currently handled differently.
        this.name = defaultValue(this.name, source.name);
        this.availability = defaultValue(source.availability, this.availability);

        var propertyNames = this._propertyNames;
        var propertyNamesLength = propertyNames.length;
        for ( var i = 0; i < propertyNamesLength; i++) {
            var name = propertyNames[i];
            var targetProperty = this[name];
            var sourceProperty = source[name];
            if (defined(sourceProperty)) {
                if (defined(targetProperty)) {
                    if (defined(targetProperty.merge)) {
                        targetProperty.merge(sourceProperty);
                    }
                } else if (defined(sourceProperty.merge) && defined(sourceProperty.clone)) {
                    this[name] = sourceProperty.clone();
                } else {
                    this[name] = sourceProperty;
                }
            }
        }
    };

    return DynamicObject;
});
