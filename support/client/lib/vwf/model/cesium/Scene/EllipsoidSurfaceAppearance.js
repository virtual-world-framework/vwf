/*global define*/
define([
        '../Core/defaultValue',
        '../Core/defined',
        '../Core/VertexFormat',
        './Material',
        './Appearance',
        '../Shaders/Appearances/EllipsoidSurfaceAppearanceVS',
        '../Shaders/Appearances/EllipsoidSurfaceAppearanceFS'
    ], function(
        defaultValue,
        defined,
        VertexFormat,
        Material,
        Appearance,
        EllipsoidSurfaceAppearanceVS,
        EllipsoidSurfaceAppearanceFS) {
    "use strict";

    /**
     * An appearance for geometry on the surface of the ellipsoid like {@link PolygonGeometry}
     * and {@link ExtentGeometry}, which supports all materials like {@link MaterialAppearance}
     * with {@link MaterialAppearance.MaterialSupport.ALL}.  However, this appearance requires
     * fewer vertex attributes since the fragment shader can procedurally compute <code>normal</code>,
     * <code>binormal</code>, and <code>tangent</code>.
     *
     * @alias EllipsoidSurfaceAppearance
     * @constructor
     *
     * @param {Boolean} [options.flat=false] When <code>true</code>, flat shading is used in the fragment shader, which means lighting is not taking into account.
     * @param {Boolean} [options.faceForward=false] When <code>true</code>, the fragment shader flips the surface normal as needed to ensure that the normal faces the viewer to avoid dark spots.  This is useful when both sides of a geometry should be shaded like {@link WallGeometry}.
     * @param {Boolean} [options.translucent=true] When <code>true</code>, the geometry is expected to appear translucent so {@link EllipsoidSurfaceAppearance#renderState} has alpha blending enabled.
     * @param {Boolean} [options.aboveGround=false] When <code>true</code>, the geometry is expected to be on the ellipsoid's surface - not at a constant height above it - so {@link EllipsoidSurfaceAppearance#renderState} has backface culling enabled.
     * @param {Material} [options.material=Material.ColorType] The material used to determine the fragment color.
     * @param {String} [options.vertexShaderSource=undefined] Optional GLSL vertex shader source to override the default vertex shader.
     * @param {String} [options.fragmentShaderSource=undefined] Optional GLSL fragment shader source to override the default fragment shader.
     * @param {RenderState} [options.renderState=undefined] Optional render state to override the default render state.
     *
     * @example
     * var primitive = new Primitive({
     *   geometryInstances : new GeometryInstance({
     *     geometry : new PolygonGeometry({
     *       vertexFormat : EllipsoidSurfaceAppearance.VERTEX_FORMAT,
     *       // ...
     *     })
     *   }),
     *   appearance : new EllipsoidSurfaceAppearance({
     *     material : Material.fromType('Stripe')
     *   })
     * });
     *
     * @see <a href='https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric'>Fabric</a>
     */
    var EllipsoidSurfaceAppearance = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var translucent = defaultValue(options.translucent, true);
        var aboveGround = defaultValue(options.aboveGround, false);

        /**
         * The material used to determine the fragment color.  Unlike other {@link EllipsoidSurfaceAppearance}
         * properties, this is not read-only, so an appearance's material can change on the fly.
         *
         * @type Material
         *
         * @default Material.ColorType
         *
         * @see <a href='https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric'>Fabric</a>
         */
        this.material = (defined(options.material)) ? options.material : Material.fromType(Material.ColorType);

        /**
         * The GLSL source code for the vertex shader.
         *
         * @type String
         *
         * @readonly
         */
        this.vertexShaderSource = defaultValue(options.vertexShaderSource, EllipsoidSurfaceAppearanceVS);

        /**
         * The GLSL source code for the fragment shader.  The full fragment shader
         * source is built procedurally taking into account {@link EllipsoidSurfaceAppearance#material},
         * {@link EllipsoidSurfaceAppearance#flat}, and {@link EllipsoidSurfaceAppearance#faceForward}.
         * Use {@link EllipsoidSurfaceAppearance#getFragmentShaderSource} to get the full source.
         *
         * @type String
         *
         * @readonly
         */
        this.fragmentShaderSource = defaultValue(options.fragmentShaderSource, EllipsoidSurfaceAppearanceFS);

        /**
         * The render state.  This is not the final {@link RenderState} instance; instead,
         * it can contain a subset of render state properties identical to <code>renderState</code>
         * passed to {@link Context#createRenderState}.
         * <p>
         * The render state can be explicitly defined when constructing a {@link EllipsoidSurfaceAppearance}
         * instance, or it is set implicitly via {@link EllipsoidSurfaceAppearance#translucent}
         * and {@link EllipsoidSurfaceAppearance#aboveGround}.
         * </p>
         *
         * @type Object
         *
         * @readonly
         */
        this.renderState = defaultValue(options.renderState, Appearance.getDefaultRenderState(translucent, !aboveGround));

        // Non-derived members

        /**
         * The {@link VertexFormat} that this appearance instance is compatible with.
         * A geometry can have more vertex attributes and still be compatible - at a
         * potential performance cost - but it can't have less.
         *
         * @type VertexFormat
         *
         * @readonly
         */
        this.vertexFormat = EllipsoidSurfaceAppearance.VERTEX_FORMAT;

        /**
         * When <code>true</code>, flat shading is used in the fragment shader,
         * which means lighting is not taking into account.
         *
         * @readonly
         *
         * @default false
         */
        this.flat = defaultValue(options.flat, false);

        /**
         * When <code>true</code>, the fragment shader flips the surface normal
         * as needed to ensure that the normal faces the viewer to avoid
         * dark spots.  This is useful when both sides of a geometry should be
         * shaded like {@link WallGeometry}.
         *
         * @readonly
         *
         * @default false
         */
        this.faceForward = defaultValue(options.faceForward, false);

        /**
         * When <code>true</code>, the geometry is expected to appear translucent so
         * {@link EllipsoidSurfaceAppearance#renderState} has alpha blending enabled.
         *
         * @readonly
         *
         * @default true
         */
        this.translucent = translucent;

        /**
         * When <code>true</code>, the geometry is expected to be closed so
         * {@link EllipsoidSurfaceAppearance#renderState} has backface culling enabled.
         * If the viewer enters the geometry, it will not be visible.
         *
         * @readonly
         *
         * @default true
         */
        this.closed = false;

        /**
         * When <code>true</code>, the geometry is expected to be on the ellipsoid's
         * surface - not at a constant height above it - so {@link EllipsoidSurfaceAppearance#renderState}
         * has backface culling enabled.
         *
         * @readonly
         *
         * @default false
         */
        this.aboveGround = aboveGround;
    };

    /**
     * The {@link VertexFormat} that all {@link EllipsoidSurfaceAppearance} instances
     * are compatible with, which requires only <code>position</code> and <code>st</code>
     * attributes.  Other attributes are procedurally computed in the fragment shader.
     *
     * @type VertexFormat
     *
     * @constant
     */
    EllipsoidSurfaceAppearance.VERTEX_FORMAT = VertexFormat.POSITION_AND_ST;

    /**
     * Procedurally creates the full GLSL fragment shader source.  For {@link EllipsoidSurfaceAppearance},
     * this is derived from {@link EllipsoidSurfaceAppearance#fragmentShaderSource}, {@link EllipsoidSurfaceAppearance#flat},
     * and {@link EllipsoidSurfaceAppearance#faceForward}.
     *
     * @memberof EllipsoidSurfaceAppearance
     *
     * @returns String The full GLSL fragment shader source.
     */
    EllipsoidSurfaceAppearance.prototype.getFragmentShaderSource = Appearance.prototype.getFragmentShaderSource;

    /**
     * Determines if the geometry is translucent based on {@link EllipsoidSurfaceAppearance#translucent} and {@link Material#isTranslucent}.
     *
     * @memberof EllipsoidSurfaceAppearance
     *
     * @returns {Boolean} <code>true</code> if the appearance is translucent.
     */
    EllipsoidSurfaceAppearance.prototype.isTranslucent = Appearance.prototype.isTranslucent;

    /**
     * Creates a render state.  This is not the final {@link RenderState} instance; instead,
     * it can contain a subset of render state properties identical to <code>renderState</code>
     * passed to {@link Context#createRenderState}.
     *
     * @memberof EllipsoidSurfaceAppearance
     *
     * @returns {Object} The render state.
     */
    EllipsoidSurfaceAppearance.prototype.getRenderState = Appearance.prototype.getRenderState;

    return EllipsoidSurfaceAppearance;
});