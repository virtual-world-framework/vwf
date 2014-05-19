/*global define*/
define([
        '../Core/defaultValue',
        '../Core/DeveloperError',
        '../Core/Cartesian2',
        '../Core/Cartesian3',
        '../Core/Color',
        '../Core/defined',
        '../Core/NearFarScalar',
        './Billboard',
        './LabelStyle',
        './HorizontalOrigin',
        './VerticalOrigin'
    ], function(
        defaultValue,
        DeveloperError,
        Cartesian2,
        Cartesian3,
        Color,
        defined,
        NearFarScalar,
        Billboard,
        LabelStyle,
        HorizontalOrigin,
        VerticalOrigin) {
    "use strict";

    function rebindAllGlyphs(label) {
        if (!label._rebindAllGlyphs && !label._repositionAllGlyphs) {
            // only push label if it's not already been marked dirty
            label._labelCollection._labelsToUpdate.push(label);
        }
        label._rebindAllGlyphs = true;
    }

    function repositionAllGlyphs(label) {
        if (!label._rebindAllGlyphs && !label._repositionAllGlyphs) {
            // only push label if it's not already been marked dirty
            label._labelCollection._labelsToUpdate.push(label);
        }
        label._repositionAllGlyphs = true;
    }

    /**
     * A Label draws viewport-aligned text positioned in the 3D scene.  This constructor
     * should not be used directly, instead create labels by calling {@link LabelCollection#add}.
     *
     * @alias Label
     * @internalConstructor
     *
     * @exception {DeveloperError} translucencyByDistance.far must be greater than translucencyByDistance.near
     * @exception {DeveloperError} pixelOffsetScaleByDistance.far must be greater than pixelOffsetScaleByDistance.near
     *
     * @see LabelCollection
     * @see LabelCollection#add
     *
     * @demo <a href="http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Labels.html">Cesium Sandcastle Labels Demo</a>
     */
    var Label = function(options, labelCollection) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        if (defined(options.translucencyByDistance) &&
                options.translucencyByDistance.far <= options.translucencyByDistance.near) {
            throw new DeveloperError('translucencyByDistance.far must be greater than translucencyByDistance.near.');
        }
        if (defined(options.pixelOffsetScaleByDistance) &&
                options.pixelOffsetScaleByDistance.far <= options.pixelOffsetScaleByDistance.near) {
            throw new DeveloperError('pixelOffsetScaleByDistance.far must be greater than pixelOffsetScaleByDistance.near.');
        }

        this._text = defaultValue(options.text, '');
        this._show = defaultValue(options.show, true);
        this._font = defaultValue(options.font, '30px sans-serif');
        this._fillColor = Color.clone(defaultValue(options.fillColor, Color.WHITE));
        this._outlineColor = Color.clone(defaultValue(options.outlineColor, Color.BLACK));
        this._outlineWidth = defaultValue(options.outlineWidth, 1.0);
        this._style = defaultValue(options.style, LabelStyle.FILL);
        this._verticalOrigin = defaultValue(options.verticalOrigin, VerticalOrigin.BOTTOM);
        this._horizontalOrigin = defaultValue(options.horizontalOrigin, HorizontalOrigin.LEFT);
        this._pixelOffset = Cartesian2.clone(defaultValue(options.pixelOffset, Cartesian2.ZERO));
        this._eyeOffset = Cartesian3.clone(defaultValue(options.eyeOffset, Cartesian3.ZERO));
        this._position = Cartesian3.clone(defaultValue(options.position, Cartesian3.ZERO));
        this._scale = defaultValue(options.scale, 1.0);
        this._id = options.id;
        this._translucencyByDistance = options.translucencyByDistance;
        this._pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance;

        this._labelCollection = labelCollection;
        this._glyphs = [];

        this._rebindAllGlyphs = true;
        this._repositionAllGlyphs = true;
    };

    /**
     * Returns true if this label will be shown.  Call {@link Label#setShow}
     * to hide or show a label, instead of removing it and re-adding it to the collection.
     *
     * @memberof Label
     *
     * @returns {Boolean} <code>true</code> if this label will be shown; otherwise, <code>false</code>.
     *
     * @see Label#setShow
     */
    Label.prototype.getShow = function() {
        return this._show;
    };

    /**
     * Determines if this label will be shown.  Call this to hide or show a label, instead
     * of removing it and re-adding it to the collection.
     *
     * @memberof Label
     *
     * @param {Boolean} value Indicates if this label will be shown.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getShow
     */
    Label.prototype.setShow = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (value !== this._show) {
            this._show = value;

            var glyphs = this._glyphs;
            for ( var i = 0, len = glyphs.length; i < len; i++) {
                var glyph = glyphs[i];
                if (defined(glyph.billboard)) {
                    glyph.billboard.setShow(value);
                }
            }
        }
    };

    /**
     * Returns the Cartesian position of this label.
     *
     * @memberof Label
     *
     * @returns {Cartesian3} The Cartesian position of this label.
     *
     * @see Label#setPosition
     */
    Label.prototype.getPosition = function() {
        return this._position;
    };

    /**
     * Sets the Cartesian position of this label.
     * <br /><br />
     * As shown in the examples, <code>value</code> can be either a {@link Cartesian3}
     * or an object literal with <code>x</code>, <code>y</code>, and <code>z</code> properties.
     * A copy of <code>value</code> is made, so changing it after calling <code>setPosition</code>
     * does not affect the label's position; an explicit call to <code>setPosition</code> is required.
     *
     * @memberof Label
     *
     * @param {Cartesian3} value The Cartesian position.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getPosition
     *
     * @example
     * // Example 1. Set a label's position using a Cartesian3.
     * l.setPosition(new Cartesian3(1.0, 2.0, 3.0));
     *
     * //////////////////////////////////////////////////////////////////
     *
     * // Example 2. Set a label's position using an object literal.
     * l.setPosition({
     *   x : 1.0,
     *   y : 2.0,
     *   z : 3.0
     * });
     */
    Label.prototype.setPosition = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        var position = this._position;
        if (!Cartesian3.equals(position, value)) {
            Cartesian3.clone(value, position);

            var glyphs = this._glyphs;
            for ( var i = 0, len = glyphs.length; i < len; i++) {
                var glyph = glyphs[i];
                if (defined(glyph.billboard)) {
                    glyph.billboard.setPosition(value);
                }
            }
        }
    };

    /**
     * Gets the text of this label.
     *
     * @memberof Label
     *
     * @see Label#setText
     */
    Label.prototype.getText = function() {
        return this._text;
    };

    /**
     * Sets the text of this label.
     *
     * @memberof Label
     *
     * @param {String} value The text.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getText
     */
    Label.prototype.setText = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (value !== this._text) {
            this._text = value;
            rebindAllGlyphs(this);
        }
    };

    /**
     * Gets the font used to draw this label. Fonts are specified using the same syntax as the CSS 'font' property.
     *
     * @memberof Label
     *
     * @see Label#setFont
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles'>HTML canvas 2D context text styles</a>
     */
    Label.prototype.getFont = function() {
        return this._font;
    };

    /**
     * Sets the font used to draw this label. Fonts are specified using the same syntax as the CSS 'font' property.
     *
     * @memberof Label
     *
     * @param {String} value The font.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getFont
     * @see Label#setFillColor
     * @see Label#setOutlineColor
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#text-styles'>HTML canvas 2D context text styles</a>
     */
    Label.prototype.setFont = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (this._font !== value) {
            this._font = value;
            rebindAllGlyphs(this);
        }
    };

    /**
     * Gets the fill color of this label.
     *
     * @memberof Label
     *
     * @see Label#setFillColor
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles'>HTML canvas 2D context fill and stroke styles</a>
     */
    Label.prototype.getFillColor = function() {
        return this._fillColor;
    };

    /**
     * Sets the fill color of this label.
     *
     * @memberof Label
     *
     * @param {Color} value The fill color.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getFillColor
     * @see Label#setOutlineColor
     * @see Label#setFont
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles'>HTML canvas 2D context fill and stroke styles</a>
     */
    Label.prototype.setFillColor = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        var fillColor = this._fillColor;
        if (!Color.equals(fillColor, value)) {
            Color.clone(value, fillColor);
            rebindAllGlyphs(this);
        }
    };

    /**
     * Gets the outline color of this label.
     *
     * @memberof Label
     *
     * @see Label#setOutlineColor
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles'>HTML canvas 2D context fill and stroke styles</a>
     */
    Label.prototype.getOutlineColor = function() {
        return this._outlineColor;
    };

    /**
     * Sets the outline color of this label.
     *
     * @memberof Label
     *
     * @param {Color} value The fill color.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getOutlineColor
     * @see Label#setFillColor
     * @see Label#setFont
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles'>HTML canvas 2D context fill and stroke styles</a>
     */
    Label.prototype.setOutlineColor = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        var outlineColor = this._outlineColor;
        if (!Color.equals(outlineColor, value)) {
            Color.clone(value, outlineColor);
            rebindAllGlyphs(this);
        }
    };

    /**
     * Gets the outline width of this label.
     *
     * @memberof Label
     *
     * @see Label#setOutlineWidth
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles'>HTML canvas 2D context fill and stroke styles</a>
     */
    Label.prototype.getOutlineWidth = function() {
        return this._outlineWidth;
    };

    /**
     * Sets the outline width of this label.
     *
     * @memberof Label
     *
     * @param {Number} value The outline width.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getOutlineWidth
     * @see Label#setFillColor
     * @see Label#setFont
     * @see <a href='http://www.whatwg.org/specs/web-apps/current-work/multipage/the-canvas-element.html#fill-and-stroke-styles'>HTML canvas 2D context fill and stroke styles</a>
     */
    Label.prototype.setOutlineWidth = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (this._outlineWidth !== value) {
            this._outlineWidth = value;
            rebindAllGlyphs(this);
        }
    };

    /**
     * Gets the style of this label.
     *
     * @memberof Label
     *
     * @see Label#setStyle
     */
    Label.prototype.getStyle = function() {
        return this._style;
    };

    /**
     * Sets the style of this label.
     *
     * @memberof Label
     *
     * @param {LabelStyle} value The style.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getStyle
     * @see Label#setOutlineColor
     * @see Label#setFillColor
     */
    Label.prototype.setStyle = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (this._style !== value) {
            this._style = value;
            rebindAllGlyphs(this);
        }
    };

    /**
     * Returns the pixel offset from the origin of this label.
     *
     * @memberof Label
     *
     * @returns {Cartesian2} The pixel offset of this label.
     *
     * @see Label#setPixelOffset
     */
    Label.prototype.getPixelOffset = function() {
        return this._pixelOffset;
    };

    /**
     * Sets the pixel offset in screen space from the origin of this label.  This is commonly used
     * to align multiple labels and billboards at the same position, e.g., an image and text.  The
     * screen space origin is the bottom, left corner of the canvas; <code>x</code> increases from
     * left to right, and <code>y</code> increases from bottom to top.
     * <br /><br />
     * <code>value</code> can be either a {@link Cartesian2}  or an object literal with
     * <code>x</code> and <code>y</code> properties.  A copy of <code>value</code> is made, so
     * changing it after calling <code>setPixelOffset</code> does not affect the label's pixel
     * offset; an explicit call to <code>setPixelOffset</code> is required.
     * <br /><br />
     * <div align='center'>
     * <table border='0' cellpadding='5'><tr>
     * <td align='center'><code>default</code><br/><img src='images/Label.setPixelOffset.default.png' width='250' height='188' /></td>
     * <td align='center'><code>l.setPixelOffset({ x : 25, y : -75 });</code><br/><img src='images/Label.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
     * </tr></table>
     * The label's origin is indicated by the yellow point.
     * </div>
     *
     * @memberof Label
     *
     * @param {Cartesian2} value The 2D Cartesian pixel offset.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getPixelOffset
     * @see Billboard#setPixelOffset
     */
    Label.prototype.setPixelOffset = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        var pixelOffset = this._pixelOffset;
        if (!Cartesian2.equals(pixelOffset, value)) {
            Cartesian2.clone(value, pixelOffset);
            repositionAllGlyphs(this);
        }
    };

    /**
     * Returns the near and far translucency properties of a Label based on the label's distance from the camera.
     *
     * @memberof Label
     *
     * @returns {NearFarScalar} The near/far translucency values based on camera distance to the billboard
     *
     * @see Label#setTranslucencyByDistance
     */
    Label.prototype.getTranslucencyByDistance = function() {
        return this._translucencyByDistance;
    };

    /**
     * Sets near and far translucency properties of a Label based on the Label's distance from the camera.
     * A label's translucency will interpolate between the {@link NearFarScalar#nearValue} and
     * {@link NearFarScalar#farValue} while the camera distance falls within the upper and lower bounds
     * of the specified {@link NearFarScalar#near} and {@link NearFarScalar#far}.
     * Outside of these ranges the label's translucency remains clamped to the nearest bound.  If undefined,
     * translucencyByDistance will be disabled.
     *
     * @memberof Label
     *
     * @param {NearFarScalar} translucency The configuration of near and far distances and their respective translucency values
     *
     * @exception {DeveloperError} far distance must be greater than near distance.
     *
     * @see Label#getTranslucencyByDistance
     *
     * @example
     * // Example 1.
     * // Set a label's translucencyByDistance to 1.0 when the
     * // camera is 1500 meters from the label and disappear as
     * // the camera distance approaches 8.0e6 meters.
     * text.setTranslucencyByDistance(new NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0));
     *
     * // Example 2.
     * // disable translucency by distance
     * text.setTranslucencyByDistance(undefined);
     */
    Label.prototype.setTranslucencyByDistance = function(value) {
        if (NearFarScalar.equals(this._translucencyByDistance, value)) {
            return;
        }

        if (value.far <= value.near) {
            throw new DeveloperError('far distance must be greater than near distance.');
        }

        this._translucencyByDistance = NearFarScalar.clone(value, this._translucencyByDistance);
        rebindAllGlyphs(this);
    };

    /**
     * Returns the near and far pixel offset scaling properties of a Label based on the label's distance from the camera.
     *
     * @memberof Label
     *
     * @returns {NearFarScalar} The near/far pixel offset scale values based on camera distance to the label
     *
     * @see Label#setPixelOffsetScaleByDistance
     * @see Label#setPixelOffset
     * @see Label#getPixelOffset
     */
    Label.prototype.getPixelOffsetScaleByDistance = function() {
        return this._pixelOffsetScaleByDistance;
    };

    /**
     * Sets near and far pixel offset scaling properties of a Label based on the Label's distance from the camera.
     * A label's pixel offset will be scaled between the {@link NearFarScalar#nearValue} and
     * {@link NearFarScalar#farValue} while the camera distance falls within the upper and lower bounds
     * of the specified {@link NearFarScalar#near} and {@link NearFarScalar#far}.
     * Outside of these ranges the label's pixel offset scaling remains clamped to the nearest bound.  If undefined,
     * pixelOffsetScaleByDistance will be disabled.
     *
     * @memberof Label
     *
     * @param {NearFarScalar} pixelOffsetScale The configuration of near and far distances and their respective scaling factor to be applied to the pixelOffset
     *
     * @exception {DeveloperError} far distance must be greater than near distance.
     *
     * @see Label#getPixelOffsetScaleByDistance
     * @see Label#setPixelOffset
     * @see Label#getPixelOffset
     *
     * @example
     * // Example 1.
     * // Set a label's pixel offset scale to 0.0 when the
     * // camera is 1500 meters from the label and scale pixel offset to 10.0 pixels
     * // in the y direction the camera distance approaches 8.0e6 meters.
     * text.setPixelOffset(new Cartesian2(0.0, 1.0);
     * text.setPixelOffsetScaleByDistance(new NearFarScalar(1.5e2, 0.0, 8.0e6, 10.0));
     *
     * // Example 2.
     * // disable pixel offset by distance
     * text.setPixelOffsetScaleByDistance(undefined);
     */
    Label.prototype.setPixelOffsetScaleByDistance = function(value) {
        if (NearFarScalar.equals(this._pixelOffsetScaleByDistance, value)) {
            return;
        }

        if (value.far <= value.near) {
            throw new DeveloperError('far distance must be greater than near distance.');
        }

        this._pixelOffsetScaleByDistance = NearFarScalar.clone(value, this._pixelOffsetScaleByDistance);
        rebindAllGlyphs(this);
    };

    /**
     * Returns the 3D Cartesian offset applied to this label in eye coordinates.
     *
     * @memberof Label
     *
     * @returns {Cartesian3} The 3D Cartesian offset applied to this label in eye coordinates.
     *
     * @see Label#setEyeOffset
     */
    Label.prototype.getEyeOffset = function() {
        return this._eyeOffset;
    };

    /**
     * Sets the 3D Cartesian offset applied to this label in eye coordinates.  Eye coordinates is a left-handed
     * coordinate system, where <code>x</code> points towards the viewer's right, <code>y</code> points up, and
     * <code>z</code> points into the screen.  Eye coordinates use the same scale as world and model coordinates,
     * which is typically meters.
     * <br /><br />
     * An eye offset is commonly used to arrange multiple label or objects at the same position, e.g., to
     * arrange a label above its corresponding 3D model.
     * <br /><br />
     * <code>value</code> can be either a {@link Cartesian3} or an object literal with <code>x</code>,
     * <code>y</code>, and <code>z</code> properties.  A copy of <code>value</code> is made, so changing it after
     * calling <code>setEyeOffset</code> does not affect the label's eye offset; an explicit call to
     * <code>setEyeOffset</code> is required.
     * <br /><br />
     * Below, the label is positioned at the center of the Earth but an eye offset makes it always
     * appear on top of the Earth regardless of the viewer's or Earth's orientation.
     * <br /><br />
     * <div align='center'>
     * <table border='0' cellpadding='5'><tr>
     * <td align='center'><img src='images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
     * <td align='center'><img src='images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
     * </tr></table>
     * <code>l.setEyeOffset({ x : 0.0, y : 8000000.0, z : 0.0 });</code><br /><br />
     * </div>
     *
     * @memberof Label
     *
     * @param {Cartesian3} value The 3D Cartesian offset in eye coordinates.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getEyeOffset
     */
    Label.prototype.setEyeOffset = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        var eyeOffset = this._eyeOffset;
        if (!Cartesian3.equals(eyeOffset, value)) {
            Cartesian3.clone(value, eyeOffset);

            var glyphs = this._glyphs;
            for ( var i = 0, len = glyphs.length; i < len; i++) {
                var glyph = glyphs[i];
                if (defined(glyph.billboard)) {
                    glyph.billboard.setEyeOffset(value);
                }
            }
        }
    };

    /**
     * Returns the horizontal origin of this label.
     *
     * @memberof Label
     *
     * @returns {HorizontalOrigin} The horizontal origin of this label.
     *
     * @see Label#setHorizontalOrigin
     */
    Label.prototype.getHorizontalOrigin = function() {
        return this._horizontalOrigin;
    };

    /**
     * Sets the horizontal origin of this label, which determines if the label is drawn
     * to the left, center, or right of its position.
     * <br /><br />
     * <div align='center'>
     * <img src='images/Billboard.setHorizontalOrigin.png' width='400' height='300' /><br />
     * </div>
     *
     * @memberof Label
     *
     * @param {HorizontalOrigin} value The horizontal origin.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getHorizontalOrigin
     * @see Label#setVerticalOrigin
     *
     * @example
     * // Use a top, right origin
     * l.setHorizontalOrigin(HorizontalOrigin.RIGHT);
     * l.setVerticalOrigin(VerticalOrigin.TOP);
     */
    Label.prototype.setHorizontalOrigin = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (this._horizontalOrigin !== value) {
            this._horizontalOrigin = value;
            repositionAllGlyphs(this);
        }
    };

    /**
     * Returns the vertical origin of this label.
     *
     * @memberof Label
     *
     * @returns {VerticalOrigin} The vertical origin of this label.
     *
     * @see Label#setVerticalOrigin
     */
    Label.prototype.getVerticalOrigin = function() {
        return this._verticalOrigin;
    };

    /**
     * Sets the vertical origin of this label, which determines if the label is
     * to the above, below, or at the center of its position.
     * <br /><br />
     * <div align='center'>
     * <img src='images/Billboard.setVerticalOrigin.png' width='400' height='300' /><br />
     * </div>
     *
     * @memberof Label
     *
     * @param {VerticalOrigin} value The vertical origin.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getVerticalOrigin
     * @see Label#setHorizontalOrigin
     *
     * @example
     * // Use a top, right origin
     * l.setHorizontalOrigin(HorizontalOrigin.RIGHT);
     * l.setVerticalOrigin(VerticalOrigin.TOP);
     */
    Label.prototype.setVerticalOrigin = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (this._verticalOrigin !== value) {
            this._verticalOrigin = value;
            repositionAllGlyphs(this);
        }
    };

    /**
     * Returns the uniform scale that is multiplied with the label's size in pixels.
     *
     * @memberof Label
     *
     * @returns {Number} The scale used to size the label.
     *
     * @see Label#setScale
     */
    Label.prototype.getScale = function() {
        return this._scale;
    };

    /**
     * Returns the user-defined object returned when the label is picked.
     *
     * @memberof Label
     *
     * @returns {Object} The user-defined object returned when the label is picked.
     */
    Label.prototype.getId = function() {
        return this._id;
    };

    /**
     * Sets the uniform scale that is multiplied with the label's size in pixels.
     * A scale of <code>1.0</code> does not change the size of the label; a scale greater than
     * <code>1.0</code> enlarges the label; a positive scale less than <code>1.0</code> shrinks
     * the label.
     * <br /><br />
     * Applying a large scale value may pixelate the label.  To make text larger without pixelation,
     * use a larger font size when calling {@link Label#setFont} instead.
     * <br /><br />
     * <div align='center'>
     * <img src='images/Label.setScale.png' width='400' height='300' /><br/>
     * From left to right in the above image, the scales are <code>0.5</code>, <code>1.0</code>,
     * and <code>2.0</code>.
     * </div>
     *
     * @memberof Label
     *
     * @param {Number} value The scale used to size the label.
     *
     * @exception {DeveloperError} value is required.
     *
     * @see Label#getScale
     * @see Label#setFont
     */
    Label.prototype.setScale = function(value) {
        if (!defined(value)) {
            throw new DeveloperError('value is required.');
        }

        if (this._scale !== value) {
            this._scale = value;

            var glyphs = this._glyphs;
            for ( var i = 0, len = glyphs.length; i < len; i++) {
                var glyph = glyphs[i];
                if (defined(glyph.billboard)) {
                    glyph.billboard.setScale(value);
                }
            }

            repositionAllGlyphs(this);
        }
    };

    /**
     * Computes the screen-space position of the label's origin, taking into account eye and pixel offsets.
     * The screen space origin is the bottom, left corner of the canvas; <code>x</code> increases from
     * left to right, and <code>y</code> increases from bottom to top.
     *
     * @memberof Label
     *
     * @param {Context} context The context.
     * @param {FrameState} frameState The same state object passed to {@link LabelCollection#update}.
     *
     * @returns {Cartesian2} The screen-space position of the label.
     *
     * @exception {DeveloperError} context is required.
     * @exception {DeveloperError} frameState is required.
     *
     * @see Label#setEyeOffset
     * @see Label#setPixelOffset
     *
     * @example
     * console.log(l.computeScreenSpacePosition(scene.getContext(), scene.getFrameState()).toString());
     */
    Label.prototype.computeScreenSpacePosition = function(context, frameState) {
        if (!defined(context)) {
            throw new DeveloperError('context is required.');
        }

        if (!defined(frameState)) {
            throw new DeveloperError('frameState is required.');
        }

        var labelCollection = this._labelCollection;
        var modelMatrix = labelCollection.modelMatrix;
        var actualPosition = Billboard._computeActualPosition(this._position, frameState, modelMatrix);

        return Billboard._computeScreenSpacePosition(modelMatrix, actualPosition, this._eyeOffset, this._pixelOffset, context, frameState);
    };

    /**
     * Determines if this label equals another label.  Labels are equal if all their properties
     * are equal.  Labels in different collections can be equal.
     *
     * @memberof Label
     *
     * @param {Label} other The label to compare for equality.
     *
     * @returns {Boolean} <code>true</code> if the labels are equal; otherwise, <code>false</code>.
     */
    Label.prototype.equals = function(other) {
        return this === other ||
               defined(other) &&
               this._show === other._show &&
               this._scale === other._scale &&
               this._style === other._style &&
               this._verticalOrigin === other._verticalOrigin &&
               this._horizontalOrigin === other._horizontalOrigin &&
               this._text === other._text &&
               this._font === other._font &&
               Cartesian3.equals(this._position, other._position) &&
               Color.equals(this._fillColor, other._fillColor) &&
               Color.equals(this._outlineColor, other._outlineColor) &&
               Cartesian2.equals(this._pixelOffset, other._pixelOffset) &&
               Cartesian3.equals(this._eyeOffset, other._eyeOffset) &&
               NearFarScalar.equals(this._translucencyByDistance, other._translucencyByDistance) &&
               NearFarScalar.equals(this._pixelOffsetScaleByDistance, other._pixelOffsetScaleByDistance) &&
               this._id === other._id;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     * <br /><br />
     * If this object was destroyed, it should not be used; calling any function other than
     * <code>isDestroyed</code> will result in a {@link DeveloperError} exception.
     *
     * @memberof Label
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    Label.prototype.isDestroyed = function() {
        return false;
    };

    return Label;
});
