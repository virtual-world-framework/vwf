/*global define*/
define([
        '../Core/defined',
        '../Core/destroyObject',
        './ImageryState'
    ], function(
        defined,
        destroyObject,
        ImageryState) {
    "use strict";

    /**
     * Stores details about a tile of imagery.
     *
     * @alias Imagery
     * @private
     */
    var Imagery = function(imageryLayer, x, y, level, extent) {
        this.imageryLayer = imageryLayer;
        this.x = x;
        this.y = y;
        this.level = level;

        if (level !== 0) {
            var parentX = x / 2 | 0;
            var parentY = y / 2 | 0;
            var parentLevel = level - 1;
            this.parent = imageryLayer.getImageryFromCache(parentX, parentY, parentLevel);
        }

        this.state = ImageryState.UNLOADED;
        this.imageUrl = undefined;
        this.image = undefined;
        this.texture = undefined;
        this.referenceCount = 0;

        if (!defined(extent) && imageryLayer.getImageryProvider().isReady()) {
            var tilingScheme = imageryLayer.getImageryProvider().getTilingScheme();
            extent = tilingScheme.tileXYToExtent(x, y, level);
        }

        this.extent = extent;
    };

    Imagery.createPlaceholder = function(imageryLayer) {
        var result = new Imagery(imageryLayer, 0, 0, 0);
        result.addReference();
        result.state = ImageryState.PLACEHOLDER;
        return result;
    };

    Imagery.prototype.addReference = function() {
        ++this.referenceCount;
    };

    Imagery.prototype.releaseReference = function() {
        --this.referenceCount;

        if (this.referenceCount === 0) {
            this.imageryLayer.removeImageryFromCache(this);

            if (defined(this.parent)) {
                this.parent.releaseReference();
            }

            if (defined(this.image) && defined(this.image.destroy)) {
                this.image.destroy();
            }

            if (defined(this.texture) && defined(this.texture.destroy)) {
                this.texture.destroy();
            }

            destroyObject(this);

            return 0;
        }

        return this.referenceCount;
    };

    return Imagery;
});