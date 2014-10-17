/*global define*/
define([
        '../Core/Cartesian3',
        '../Core/Color',
        '../Core/defined',
        '../Core/destroyObject',
        '../Core/DeveloperError',
        '../Core/JulianDate',
        '../Core/Matrix3',
        '../Core/Matrix4',
        '../Core/ReferenceFrame',
        '../Core/TimeInterval',
        '../Core/Transforms',
        '../Scene/Material',
        '../Scene/PolylineCollection',
        '../Scene/SceneMode',
        './CompositePositionProperty',
        './ConstantPositionProperty',
        './MaterialProperty',
        './ReferenceProperty',
        './SampledPositionProperty',
        './TimeIntervalCollectionPositionProperty'
    ], function(
        Cartesian3,
        Color,
        defined,
        destroyObject,
        DeveloperError,
        JulianDate,
        Matrix3,
        Matrix4,
        ReferenceFrame,
        TimeInterval,
        Transforms,
        Material,
        PolylineCollection,
        SceneMode,
        CompositePositionProperty,
        ConstantPositionProperty,
        MaterialProperty,
        ReferenceProperty,
        SampledPositionProperty,
        TimeIntervalCollectionPositionProperty) {
    "use strict";

    var scratchTimeInterval = new TimeInterval();
    var subSampleCompositePropertyScratch = new TimeInterval();
    var subSampleIntervalPropertyScratch = new TimeInterval();

    function subSampleSampledProperty(property, start, stop, updateTime, referenceFrame, maximumStep, startingIndex, result) {
        var times = property._property._times;

        var r = startingIndex;
        //Always step exactly on start (but only use it if it exists.)
        var tmp;
        tmp = property.getValueInReferenceFrame(start, referenceFrame, result[r]);
        if (defined(tmp)) {
            result[r++] = tmp;
        }

        var steppedOnNow = !defined(updateTime) || JulianDate.lessThanOrEquals(updateTime, start) || JulianDate.greaterThanOrEquals(updateTime, stop);

        //Iterate over all interval times and add the ones that fall in our
        //time range.  Note that times can contain data outside of
        //the intervals range.  This is by design for use with interpolation.
        var t = 0;
        var len = times.length;
        var current = times[t];
        var loopStop = stop;
        var sampling = false;
        var sampleStepsToTake;
        var sampleStepsTaken;
        var sampleStepSize;

        while (t < len) {
            if (!steppedOnNow && JulianDate.greaterThanOrEquals(current, updateTime)) {
                tmp = property.getValueInReferenceFrame(updateTime, referenceFrame, result[r]);
                if (defined(tmp)) {
                    result[r++] = tmp;
                }
                steppedOnNow = true;
            }
            if (JulianDate.greaterThan(current, start) && JulianDate.lessThan(current, loopStop) && !current.equals(updateTime)) {
                tmp = property.getValueInReferenceFrame(current, referenceFrame, result[r]);
                if (defined(tmp)) {
                    result[r++] = tmp;
                }
            }

            if (t < (len - 1)) {
                if (maximumStep > 0 && !sampling) {
                    var next = times[t + 1];
                    var secondsUntilNext = JulianDate.getSecondsDifference(next, current);
                    sampling = secondsUntilNext > maximumStep;

                    if (sampling) {
                        sampleStepsToTake = Math.ceil(secondsUntilNext / maximumStep);
                        sampleStepsTaken = 0;
                        sampleStepSize = secondsUntilNext / Math.max(sampleStepsToTake, 2);
                        sampleStepsToTake = Math.max(sampleStepsToTake - 1, 1);
                    }
                }

                if (sampling && sampleStepsTaken < sampleStepsToTake) {
                    current = JulianDate.addSeconds(current, sampleStepSize, new JulianDate());
                    sampleStepsTaken++;
                    continue;
                }
            }
            sampling = false;
            t++;
            current = times[t];
        }

        //Always step exactly on stop (but only use it if it exists.)
        tmp = property.getValueInReferenceFrame(stop, referenceFrame, result[r]);
        if (defined(tmp)) {
            result[r++] = tmp;
        }

        return r;
    }

    function subSampleGenericProperty(property, start, stop, updateTime, referenceFrame, maximumStep, startingIndex, result) {
        var tmp;
        var i = 0;
        var index = startingIndex;
        var time = start;
        var stepSize = Math.max(maximumStep, 60);
        var steppedOnNow = !defined(updateTime) || JulianDate.lessThanOrEquals(updateTime, start) || JulianDate.greaterThanOrEquals(updateTime, stop);
        while (JulianDate.lessThan(time, stop)) {
            if (!steppedOnNow && JulianDate.greaterThanOrEquals(time, updateTime)) {
                steppedOnNow = true;
                tmp = property.getValueInReferenceFrame(updateTime, referenceFrame, result[index]);
                if (defined(tmp)) {
                    result[index] = tmp;
                    index++;
                }
            }
            tmp = property.getValueInReferenceFrame(time, referenceFrame, result[index]);
            if (defined(tmp)) {
                result[index] = tmp;
                index++;
            }
            i++;
            time = JulianDate.addSeconds(start, stepSize * i, new JulianDate());
        }
        //Always sample stop.
        tmp = property.getValueInReferenceFrame(stop, referenceFrame, result[index]);
        if (defined(tmp)) {
            result[index] = tmp;
            index++;
        }
        return index;
    }

    function subSampleIntervalProperty(property, start, stop, updateTime, referenceFrame, maximumStep, startingIndex, result) {
        subSampleIntervalPropertyScratch.start = start;
        subSampleIntervalPropertyScratch.stop = stop;

        var index = startingIndex;
        var intervals = property.intervals;
        for (var i = 0; i < intervals.length; i++) {
            var interval = intervals.get(i);
            if (!TimeInterval.intersect(interval, subSampleIntervalPropertyScratch, scratchTimeInterval).isEmpty) {
                var time = interval.start;
                if (!interval.isStartIncluded) {
                    if (interval.isStopIncluded) {
                        time = interval.stop;
                    } else {
                        time = JulianDate.addSeconds(interval.start, JulianDate.getSecondsDifference(interval.stop, interval.start) / 2, new JulianDate());
                    }
                }
                var tmp = property.getValueInReferenceFrame(time, referenceFrame, result[index]);
                if (defined(tmp)) {
                    result[index] = tmp;
                    index++;
                }
            }
        }
        return index;
    }

    function subSampleConstantProperty(property, start, stop, updateTime, referenceFrame, maximumStep, startingIndex, result) {
        var tmp = property.getValueInReferenceFrame(start, referenceFrame, result[startingIndex]);
        if (defined(tmp)) {
            result[startingIndex++] = tmp;
        }
        return startingIndex;
    }

    function subSampleCompositeProperty(property, start, stop, updateTime, referenceFrame, maximumStep, startingIndex, result) {
        subSampleCompositePropertyScratch.start = start;
        subSampleCompositePropertyScratch.stop = stop;

        var index = startingIndex;
        var intervals = property.intervals;
        for (var i = 0; i < intervals.length; i++) {
            var interval = intervals.get(i);
            if (!TimeInterval.intersect(interval, subSampleCompositePropertyScratch, scratchTimeInterval).isEmpty) {
                var intervalStart = interval.start;
                var intervalStop = interval.stop;

                var sampleStart = start;
                if (JulianDate.greaterThan(intervalStart, sampleStart)) {
                    sampleStart = intervalStart;
                }

                var sampleStop = stop;
                if (JulianDate.lessThan(intervalStop, sampleStop)) {
                    sampleStop = intervalStop;
                }

                var intervalProperty = interval.data;
                if (intervalProperty instanceof ReferenceProperty) {
                    intervalProperty = intervalProperty.resolvedProperty;
                }

                if (intervalProperty instanceof SampledPositionProperty) {
                    index = subSampleSampledProperty(intervalProperty, sampleStart, sampleStop, updateTime, referenceFrame, maximumStep, index, result);
                } else if (intervalProperty instanceof CompositePositionProperty) {
                    index = subSampleCompositeProperty(intervalProperty, sampleStart, sampleStop, updateTime, referenceFrame, maximumStep, index, result);
                } else if (intervalProperty instanceof TimeIntervalCollectionPositionProperty) {
                    index = subSampleIntervalProperty(intervalProperty, sampleStart, sampleStop, updateTime, referenceFrame, maximumStep, index, result);
                } else if (intervalProperty instanceof ConstantPositionProperty) {
                    index = subSampleConstantProperty(intervalProperty, sampleStart, sampleStop, updateTime, referenceFrame, maximumStep, index, result);
                } else {
                    //Fallback to generic sampling.
                    index = subSampleGenericProperty(intervalProperty, sampleStart, sampleStop, updateTime, referenceFrame, maximumStep, index, result);
                }
            }
        }
        return index;
    }

    function subSample(property, start, stop, updateTime, referenceFrame, maximumStep, result) {
        if (!defined(result)) {
            result = [];
        }

        if (property instanceof ReferenceProperty) {
            property = property.resolvedProperty;
        }

        var length = 0;
        if (property instanceof SampledPositionProperty) {
            length = subSampleSampledProperty(property, start, stop, updateTime, referenceFrame, maximumStep, 0, result);
        } else if (property instanceof CompositePositionProperty) {
            length = subSampleCompositeProperty(property, start, stop, updateTime, referenceFrame, maximumStep, 0, result);
        } else if (property instanceof TimeIntervalCollectionPositionProperty) {
            length = subSampleIntervalProperty(property, start, stop, updateTime, referenceFrame, maximumStep, 0, result);
        } else if (property instanceof ConstantPositionProperty) {
            length = subSampleConstantProperty(property, start, stop, updateTime, referenceFrame, maximumStep, 0, result);
        } else {
            //Fallback to generic sampling.
            length = subSampleGenericProperty(property, start, stop, updateTime, referenceFrame, maximumStep, 0, result);
        }
        result.length = length;
        return result;
    }

    var toFixedScratch = new Matrix3();
    var PolylineUpdater = function(scene, referenceFrame) {
        this._unusedIndexes = [];
        this._polylineCollection = new PolylineCollection();
        this._scene = scene;
        this._referenceFrame = referenceFrame;
        scene.primitives.add(this._polylineCollection);
    };

    PolylineUpdater.prototype.update = function(time) {
        if (this._referenceFrame === ReferenceFrame.INERTIAL) {
            var toFixed = Transforms.computeIcrfToFixedMatrix(time, toFixedScratch);
            if (!defined(toFixed)) {
                toFixed = Transforms.computeTemeToPseudoFixedMatrix(time, toFixedScratch);
            }
            Matrix4.fromRotationTranslation(toFixed, Cartesian3.ZERO, this._polylineCollection.modelMatrix);
        }
    };

    PolylineUpdater.prototype.updateObject = function(time, dynamicObject) {
        var dynamicPath = dynamicObject._path;
        if (!defined(dynamicPath)) {
            return;
        }

        var positionProperty = dynamicObject._position;
        if (!defined(positionProperty)) {
            return;
        }

        var polyline;
        var property;
        var sampleStart;
        var sampleStop;
        var showProperty = dynamicPath._show;
        var pathVisualizerIndex = dynamicObject._pathVisualizerIndex;
        var show = !defined(showProperty) || showProperty.getValue(time);

        //While we want to show the path, there may not actually be anything to show
        //depending on lead/trail settings.  Compute the interval of the path to
        //show and check against actual availability.
        if (show) {
            property = dynamicPath._leadTime;
            var leadTime;
            if (defined(property)) {
                leadTime = property.getValue(time);
            }

            property = dynamicPath._trailTime;
            var trailTime;
            if (defined(property)) {
                trailTime = property.getValue(time);
            }

            var availability = dynamicObject._availability;
            var hasAvailability = defined(availability);
            var hasLeadTime = defined(leadTime);
            var hasTrailTime = defined(trailTime);

            //Objects need to have either defined availability or both a lead and trail time in order to
            //draw a path (since we can't draw "infinite" paths.
            show = hasAvailability || (hasLeadTime && hasTrailTime);

            //The final step is to compute the actual start/stop times of the path to show.
            //If current time is outside of the availability interval, there's a chance that
            //we won't have to draw anything anyway.
            if (show) {
                if (hasTrailTime) {
                    sampleStart = JulianDate.addSeconds(time, -trailTime, new JulianDate());
                }
                if (hasLeadTime) {
                    sampleStop = JulianDate.addSeconds(time, leadTime, new JulianDate());
                }

                if (hasAvailability) {
                    var start = availability.start;
                    var stop = availability.stop;

                    if (!hasTrailTime || JulianDate.greaterThan(start, sampleStart)) {
                        sampleStart = start;
                    }

                    if (!hasLeadTime || JulianDate.lessThan(stop, sampleStop)) {
                        sampleStop = stop;
                    }
                }
                show = JulianDate.lessThan(sampleStart, sampleStop);
            }
        }

        if (!show) {
            //don't bother creating or updating anything else
            if (defined(pathVisualizerIndex)) {
                polyline = this._polylineCollection.get(pathVisualizerIndex);
                polyline.show = false;
                dynamicObject._pathVisualizerIndex = undefined;
                this._unusedIndexes.push(pathVisualizerIndex);
            }
            return;
        }

        if (!defined(pathVisualizerIndex)) {
            var unusedIndexes = this._unusedIndexes;
            var length = unusedIndexes.length;
            if (length > 0) {
                pathVisualizerIndex = unusedIndexes.pop();
                polyline = this._polylineCollection.get(pathVisualizerIndex);
            } else {
                pathVisualizerIndex = this._polylineCollection.length;
                polyline = this._polylineCollection.add();
            }
            dynamicObject._pathVisualizerIndex = pathVisualizerIndex;
            polyline.id = dynamicObject;

            polyline.width = 1;
            var material = polyline.material;
            if (!defined(material) || (material.type !== Material.PolylineOutlineType)) {
                material = Material.fromType(Material.PolylineOutlineType);
                polyline.material = material;
            }
            var uniforms = material.uniforms;
            Color.clone(Color.WHITE, uniforms.color);
            Color.clone(Color.BLACK, uniforms.outlineColor);
            uniforms.outlineWidth = 0;
        } else {
            polyline = this._polylineCollection.get(pathVisualizerIndex);
        }

        polyline.show = true;

        var maxStepSize = 60.0;
        property = dynamicPath._resolution;
        if (defined(property)) {
            var resolution = property.getValue(time);
            if (defined(resolution)) {
                maxStepSize = resolution;
            }
        }

        polyline.positions = subSample(positionProperty, sampleStart, sampleStop, time, this._referenceFrame, maxStepSize, polyline.positions);
        polyline.material = MaterialProperty.getValue(time, dynamicPath._material, polyline.material);

        property = dynamicPath._width;
        if (defined(property)) {
            var width = property.getValue(time);
            if (defined(width)) {
                polyline.width = width;
            }
        }
    };

    PolylineUpdater.prototype.removeObject = function(dynamicObject) {
        var pathVisualizerIndex = dynamicObject._pathVisualizerIndex;
        if (defined(pathVisualizerIndex)) {
            var polyline = this._polylineCollection.get(pathVisualizerIndex);
            polyline.show = false;
            this._unusedIndexes.push(pathVisualizerIndex);
            dynamicObject._pathVisualizerIndex = undefined;
        }
    };

    PolylineUpdater.prototype.destroy = function() {
        this._scene.primitives.remove(this._polylineCollection);
        return destroyObject(this);
    };

    /**
     * A {@link Visualizer} which maps {@link DynamicObject#path} to a {@link Polyline}.
     * @alias DynamicPathVisualizer
     * @constructor
     *
     * @param {Scene} scene The scene the primitives will be rendered in.
     * @param {DynamicObjectCollection} dynamicObjectCollection The dynamicObjectCollection to visualize.
     */
    var DynamicPathVisualizer = function(scene, dynamicObjectCollection) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(scene)) {
            throw new DeveloperError('scene is required.');
        }
        if (!defined(dynamicObjectCollection)) {
            throw new DeveloperError('dynamicObjectCollection is required.');
        }
        //>>includeEnd('debug');

        dynamicObjectCollection.collectionChanged.addEventListener(DynamicPathVisualizer.prototype._onObjectsRemoved, this);

        this._scene = scene;
        this._updaters = {};
        this._dynamicObjectCollection = dynamicObjectCollection;
    };

    /**
     * Updates all of the primitives created by this visualizer to match their
     * DynamicObject counterpart at the given time.
     *
     * @param {JulianDate} time The time to update to.
     * @returns {Boolean} This function always returns true.
     */
    DynamicPathVisualizer.prototype.update = function(time) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(time)) {
            throw new DeveloperError('time is required.');
        }
        //>>includeEnd('debug');

        var updaters = this._updaters;
        for ( var key in updaters) {
            if (updaters.hasOwnProperty(key)) {
                updaters[key].update(time);
            }
        }

        var dynamicObjects = this._dynamicObjectCollection.getObjects();
        for (var i = 0, len = dynamicObjects.length; i < len; i++) {
            var dynamicObject = dynamicObjects[i];

            if (!defined(dynamicObject._path)) {
                continue;
            }

            var positionProperty = dynamicObject._position;
            if (!defined(positionProperty)) {
                continue;
            }

            var lastUpdater = dynamicObject._pathUpdater;

            var frameToVisualize = ReferenceFrame.FIXED;
            if (this._scene.mode === SceneMode.SCENE3D) {
                frameToVisualize = positionProperty.referenceFrame;
            }

            var currentUpdater = this._updaters[frameToVisualize];

            if ((lastUpdater === currentUpdater) && (defined(currentUpdater))) {
                currentUpdater.updateObject(time, dynamicObject);
                continue;
            }

            if (defined(lastUpdater)) {
                lastUpdater.removeObject(dynamicObject);
            }

            if (!defined(currentUpdater)) {
                currentUpdater = new PolylineUpdater(this._scene, frameToVisualize);
                currentUpdater.update(time);
                this._updaters[frameToVisualize] = currentUpdater;
            }

            dynamicObject._pathUpdater = currentUpdater;
            if (defined(currentUpdater)) {
                currentUpdater.updateObject(time, dynamicObject);
            }
        }
        return true;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    DynamicPathVisualizer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Removes and destroys all primitives created by this instance.
     */
    DynamicPathVisualizer.prototype.destroy = function() {
        var dynamicObjectCollection = this._dynamicObjectCollection;
        dynamicObjectCollection.collectionChanged.removeEventListener(DynamicPathVisualizer.prototype._onObjectsRemoved, this);

        var updaters = this._updaters;
        for ( var key in updaters) {
            if (updaters.hasOwnProperty(key)) {
                updaters[key].destroy();
            }
        }

        var dynamicObjects = dynamicObjectCollection.getObjects();
        var length = dynamicObjects.length;
        for (var i = 0; i < length; i++) {
            dynamicObjects[i]._pathUpdater = undefined;
            dynamicObjects[i]._pathVisualizerIndex = undefined;
        }
        return destroyObject(this);
    };

    DynamicPathVisualizer.prototype._onObjectsRemoved = function(dynamicObjectCollection, added, dynamicObjects) {
        for (var i = dynamicObjects.length - 1; i > -1; i--) {
            var dynamicObject = dynamicObjects[i];
            var _pathUpdater = dynamicObject._pathUpdater;
            if (defined(_pathUpdater)) {
                _pathUpdater.removeObject(dynamicObject);
            }
        }
    };

    //for testing
    DynamicPathVisualizer._subSample = subSample;

    return DynamicPathVisualizer;
});
