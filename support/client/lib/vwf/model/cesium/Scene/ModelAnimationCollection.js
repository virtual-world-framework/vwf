/*global define*/
define([
        '../Core/clone',
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/defineProperties',
        '../Core/DeveloperError',
        '../Core/Event',
        '../Core/JulianDate',
        '../Core/Math',
        './ModelAnimation',
        './ModelAnimationLoop',
        './ModelAnimationState'
    ], function(
        clone,
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        JulianDate,
        CesiumMath,
        ModelAnimation,
        ModelAnimationLoop,
        ModelAnimationState) {
    "use strict";

    /**
     * A collection of active model animations.  Access this using {@link Model#activeAnimations}.
     *
     * @alias ModelAnimationCollection
     * @internalConstructor
     *
     * @see Model#activeAnimations
     */
    var ModelAnimationCollection = function(model) {
        /**
         * The event fired when an animation is added to the collection.  This can be used, for
         * example, to keep a UI in sync.
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * model.activeAnimations.animationAdded.addEventListener(function(model, animation) {
         *   console.log('Animation added: ' + animation.name);
         * });
         */
        this.animationAdded = new Event();

        /**
         * The event fired when an animation is removed from the collection.  This can be used, for
         * example, to keep a UI in sync.
         *
         * @type {Event}
         * @default new Event()
         *
         * @example
         * model.activeAnimations.animationRemoved.addEventListener(function(model, animation) {
         *   console.log('Animation removed: ' + animation.name);
         * });
         */
        this.animationRemoved = new Event();

        this._model = model;
        this._scheduledAnimations = [];
        this._previousTime = undefined;
    };

    defineProperties(ModelAnimationCollection.prototype, {
        /**
         * The number of animations in the collection.
         *
         * @memberof ModelAnimationCollection.prototype
         *
         * @type {Number}
         * @readonly
         */
        length : {
            get : function() {
                return this._scheduledAnimations.length;
            }
        }
    });

    /**
     * Creates and adds an animation with the specified initial properties to the collection.
     * <p>
     * This raises the {@link ModelAnimationCollection#animationAdded} event so, for example, a UI can stay in sync.
     * </p>
     *
     * @param {Object} options Object with the following properties:
     * @param {String} options.name The glTF animation name that identifies the animation.
     * @param {JulianDate} [options.startTime] The scene time to start playing the animation.  When this is <code>undefined</code>, the animation starts at the next frame.
     * @param {Number} [options.delay=0.0] The delay, in seconds, from <code>startTime</code> to start playing.
     * @param {JulianDate} [options.stopTime] The scene time to stop playing the animation.  When this is <code>undefined</code>, the animation is played for its full duration.
     * @param {Boolean} [options.removeOnStop=false] When <code>true</code>, the animation is removed after it stops playing.
     * @param {Number} [options.speedup=1.0] Values greater than <code>1.0</code> increase the speed that the animation is played relative to the scene clock speed; values less than <code>1.0</code> decrease the speed.
     * @param {Boolean} [options.reverse=false] When <code>true</code>, the animation is played in reverse.
     * @param {ModelAnimationLoop} [options.loop=ModelAnimationLoop.NONE] Determines if and how the animation is looped.
     * @returns {ModelAnimation} The animation that was added to the collection.
     *
     * @exception {DeveloperError} Animations are not loaded.  Wait for the {@link Model#readyToRender} event.
     * @exception {DeveloperError} options.name must be a valid animation name.
     * @exception {DeveloperError} options.speedup must be greater than zero.
     *
     * @example
     * // Example 1. Add an animation
     * model.activeAnimations.add({
     *   name : 'animation name'
     * });
     *
     * @example
     * // Example 2. Add an animation and provide all properties and events
     * var startTime = Cesium.JulianDate.now();
     *
     * var animation = model.activeAnimations.add({
     *   name : 'another animation name',
     *   startTime : startTime,
     *   delay : 0.0,                          // Play at startTime (default)
     *   stopTime : Cesium.JulianDate.addSeconds(startTime, 4.0, new Cesium.JulianDate()),
     *   removeOnStop : false,                 // Do not remove when animation stops (default)
     *   speedup : 2.0,                        // Play at double speed
     *   reverse : true,                       // Play in reverse
     *   loop : Cesium.ModelAnimationLoop.REPEAT      // Loop the animation
     * });
     *
     * animation.start.addEventListener(function(model, animation) {
     *   console.log('Animation started: ' + animation.name);
     * });
     * animation.update.addEventListener(function(model, animation, time) {
     *   console.log('Animation updated: ' + animation.name + '. glTF animation time: ' + time);
     * });
     * animation.stop.addEventListener(function(model, animation) {
     *   console.log('Animation stopped: ' + animation.name);
     * });
     */
    ModelAnimationCollection.prototype.add = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var model = this._model;
        var animations = model._runtime.animations;

        //>>includeStart('debug', pragmas.debug);
        if (!defined(animations)) {
            throw new DeveloperError('Animations are not loaded.  Wait for the model\'s readyToRender event or ready property.');
        }
        //>>includeEnd('debug');

        var animation = animations[options.name];

        //>>includeStart('debug', pragmas.debug);
        if (!defined(animation)) {
            throw new DeveloperError('options.name must be a valid animation name.');
        }

        if (defined(options.speedup) && (options.speedup <= 0.0)) {
            throw new DeveloperError('options.speedup must be greater than zero.');
        }
        //>>includeEnd('debug');

        var scheduledAnimation = new ModelAnimation(options, model, animation);
        this._scheduledAnimations.push(scheduledAnimation);
        this.animationAdded.raiseEvent(model, scheduledAnimation);
        return scheduledAnimation;
    };

    /**
     * Creates and adds an animation with the specified initial properties to the collection
     * for each animation in the model.
     * <p>
     * This raises the {@link ModelAnimationCollection#animationAdded} event for each model so, for example, a UI can stay in sync.
     * </p>
     *
     * @param {Object} [options] Object with the following properties:
     * @param {JulianDate} [options.startTime] The scene time to start playing the animations.  When this is <code>undefined</code>, the animations starts at the next frame.
     * @param {Number} [options.delay=0.0] The delay, in seconds, from <code>startTime</code> to start playing.
     * @param {JulianDate} [options.stopTime] The scene time to stop playing the animations.  When this is <code>undefined</code>, the animations are played for its full duration.
     * @param {Boolean} [options.removeOnStop=false] When <code>true</code>, the animations are removed after they stop playing.
     * @param {Number} [options.speedup=1.0] Values greater than <code>1.0</code> increase the speed that the animations play relative to the scene clock speed; values less than <code>1.0</code> decrease the speed.
     * @param {Boolean} [options.reverse=false] When <code>true</code>, the animations are played in reverse.
     * @param {ModelAnimationLoop} [options.loop=ModelAnimationLoop.NONE] Determines if and how the animations are looped.
     * @returns {ModelAnimation[]} An array of {@link ModelAnimation} objects, one for each animation added to the collection.  If there are no glTF animations, the array is empty.
     *
     * @exception {DeveloperError} Animations are not loaded.  Wait for the {@link Model#readyToRender} event.
     * @exception {DeveloperError} options.speedup must be greater than zero.
     *
     * @example
     * model.activeAnimations.addAll({
     *   speedup : 0.5,                        // Play at half-speed
     *   loop : Cesium.ModelAnimationLoop.REPEAT      // Loop the animations
     * });
     */
    ModelAnimationCollection.prototype.addAll = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        //>>includeStart('debug', pragmas.debug);
        if (!defined(this._model._runtime.animations)) {
            throw new DeveloperError('Animations are not loaded.  Wait for the model\'s readyToRender event or ready property.');
        }

        if (defined(options.speedup) && (options.speedup <= 0.0)) {
            throw new DeveloperError('options.speedup must be greater than zero.');
        }
        //>>includeEnd('debug');

        options = clone(options);

        var scheduledAnimations = [];
        var animations = this._model.gltf.animations;
        for (var name in animations) {
            if (animations.hasOwnProperty(name)) {
                options.name = name;
                scheduledAnimations.push(this.add(options));
            }
        }

        return scheduledAnimations;
    };

    /**
     * Removes an animation from the collection.
     * <p>
     * This raises the {@link ModelAnimationCollection#animationRemoved} event so, for example, a UI can stay in sync.
     * </p>
     * <p>
     * An animation can also be implicitly removed from the collection by setting {@link ModelAnimation#removeOnStop} to
     * <code>true</code>.  The {@link ModelAnimationCollection#animationRemoved} event is still fired when the animation is removed.
     * </p>
     *
     * @param {ModelAnimation} animation The animation to remove.
     * @returns {Boolean} <code>true</code> if the animation was removed; <code>false</code> if the animation was not found in the collection.
     *
     * @example
     * var a = model.activeAnimations.add({
     *   name : 'animation name'
     * });
     * model.activeAnimations.remove(a); // Returns true
     */
    ModelAnimationCollection.prototype.remove = function(animation) {
        if (defined(animation)) {
            var animations = this._scheduledAnimations;
            var i = animations.indexOf(animation);
            if (i !== -1) {
                animations.splice(i, 1);
                this.animationRemoved.raiseEvent(this._model, animation);
                return true;
            }
        }

        return false;
    };

    /**
     * Removes all animations from the collection.
     * <p>
     * This raises the {@link ModelAnimationCollection#animationRemoved} event for each
     * animation so, for example, a UI can stay in sync.
     * </p>
     */
    ModelAnimationCollection.prototype.removeAll = function() {
        var model = this._model;
        var animations = this._scheduledAnimations;
        var length = animations.length;

        this._scheduledAnimations = [];

        for (var i = 0; i < length; ++i) {
            this.animationRemoved.raiseEvent(model, animations[i]);
        }
    };

    /**
     * Determines whether this collection contains a given animation.
     *
     * @param {ModelAnimation} animation The animation to check for.
     * @returns {Boolean} <code>true</code> if this collection contains the animation, <code>false</code> otherwise.
     */
    ModelAnimationCollection.prototype.contains = function(animation) {
        if (defined(animation)) {
            return (this._scheduledAnimations.indexOf(animation) !== -1);
        }

        return false;
    };

    /**
     * Returns the animation in the collection at the specified index.  Indices are zero-based
     * and increase as animations are added.  Removing an animation shifts all animations after
     * it to the left, changing their indices.  This function is commonly used to iterate over
     * all the animations in the collection.
     *
     * @param {Number} index The zero-based index of the animation.
     * @returns {ModelAnimation} The animation at the specified index.
     *
     * @example
     * // Output the names of all the animations in the collection.
     * var animations = model.activeAnimations;
     * var length = animations.length;
     * for (var i = 0; i < length; ++i) {
     *   console.log(animations.get(i).name);
     * }
     */
    ModelAnimationCollection.prototype.get = function(index) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(index)) {
            throw new DeveloperError('index is required.');
        }
        //>>includeEnd('debug');

        return this._scheduledAnimations[index];
    };

    function animateChannels(runtimeAnimation, localAnimationTime) {
        var channelEvaluators = runtimeAnimation.channelEvaluators;
        var length = channelEvaluators.length;
        for (var i = 0; i < length; ++i) {
            channelEvaluators[i](localAnimationTime);
        }
    }

    var animationsToRemove = [];

    function createAnimationRemovedFunction(modelAnimationCollection, model, animation) {
        return function() {
            modelAnimationCollection.animationRemoved.raiseEvent(model, animation);
        };
    }

    /**
     * @private
     */
    ModelAnimationCollection.prototype.update = function(frameState) {
        if (JulianDate.equals(frameState.time, this._previousTime)) {
            // Animations are currently only time-dependent so do not animate when paused or picking
            return false;
        }
        this._previousTime = JulianDate.clone(frameState.time, this._previousTime);

        var animationOccured = false;
        var sceneTime = frameState.time;

        var model = this._model;
        var scheduledAnimations = this._scheduledAnimations;
        var length = scheduledAnimations.length;

        for (var i = 0; i < length; ++i) {
            var scheduledAnimation = scheduledAnimations[i];
            var runtimeAnimation = scheduledAnimation._runtimeAnimation;

            if (!defined(scheduledAnimation._startTime)) {
                scheduledAnimation._startTime = JulianDate.addSeconds(defaultValue(scheduledAnimation.startTime, sceneTime), scheduledAnimation.delay, new JulianDate());
            }

            if (!defined(scheduledAnimation._duration)) {
                scheduledAnimation._duration = runtimeAnimation.stopTime * (1.0 / scheduledAnimation.speedup);
            }

            var startTime = scheduledAnimation._startTime;
            var duration = scheduledAnimation._duration;
            var stopTime = scheduledAnimation.stopTime;

            // [0.0, 1.0] normalized local animation time
            var delta = (duration !== 0.0) ? (JulianDate.secondsDifference(sceneTime, startTime) / duration) : 0.0;
            var pastStartTime = (delta >= 0.0);

            // Play animation if
            // * we are after the start time, and
            // * before the end of the animation's duration or the animation is being repeated, and
            // * we did not reach a user-provided stop time.
            var play = pastStartTime &&
                       ((delta <= 1.0) ||
                        ((scheduledAnimation.loop === ModelAnimationLoop.REPEAT) ||
                         (scheduledAnimation.loop === ModelAnimationLoop.MIRRORED_REPEAT))) &&
                       (!defined(stopTime) || JulianDate.lessThanOrEquals(sceneTime, stopTime));

            if (play) {
                // STOPPED -> ANIMATING state transition?
                if (scheduledAnimation._state === ModelAnimationState.STOPPED) {
                    scheduledAnimation._state = ModelAnimationState.ANIMATING;
                    if (scheduledAnimation.start.numberOfListeners > 0) {
                        frameState.afterRender.push(scheduledAnimation._raiseStartEvent);
                    }
                }

                // Truncate to [0.0, 1.0] for repeating animations
                if (scheduledAnimation.loop === ModelAnimationLoop.REPEAT) {
                    delta = delta - Math.floor(delta);
                } else if (scheduledAnimation.loop === ModelAnimationLoop.MIRRORED_REPEAT) {
                    var floor = Math.floor(delta);
                    var fract = delta - floor;
                    // When even use (1.0 - fract) to mirror repeat
                    delta = (floor % 2 === 1.0) ? (1.0 - fract) : fract;
                }

                if (scheduledAnimation.reverse) {
                    delta = 1.0 - delta;
                }

                var localAnimationTime = delta * duration * scheduledAnimation.speedup;
                // Clamp in case floating-point roundoff goes outside the animation's first or last keyframe
                localAnimationTime = CesiumMath.clamp(localAnimationTime, runtimeAnimation.startTime, runtimeAnimation.stopTime);

                animateChannels(runtimeAnimation, localAnimationTime);

                if (scheduledAnimation.update.numberOfListeners > 0) {
                    scheduledAnimation._updateEventTime = localAnimationTime;
                    frameState.afterRender.push(scheduledAnimation._raiseUpdateEvent);
                }
                animationOccured = true;
            } else {
                // ANIMATING -> STOPPED state transition?
                if (pastStartTime && (scheduledAnimation._state === ModelAnimationState.ANIMATING)) {
                    scheduledAnimation._state = ModelAnimationState.STOPPED;
                    if (scheduledAnimation.stop.numberOfListeners > 0) {
                        frameState.afterRender.push(scheduledAnimation._raiseStopEvent);
                    }

                    if (scheduledAnimation.removeOnStop) {
                        animationsToRemove.push(scheduledAnimation);
                    }
                }
            }
        }

        // Remove animations that stopped
        length = animationsToRemove.length;
        for (var j = 0; j < length; ++j) {
            var animationToRemove = animationsToRemove[j];
            scheduledAnimations.splice(scheduledAnimations.indexOf(animationToRemove), 1);
            frameState.afterRender.push(createAnimationRemovedFunction(this, model, animationToRemove));
        }
        animationsToRemove.length = 0;

        return animationOccured;
    };

    return ModelAnimationCollection;
});