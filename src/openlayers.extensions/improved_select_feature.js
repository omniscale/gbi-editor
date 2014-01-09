/**
 * Extended SelectControl
 *
 * @class
 * @extends OpenLayers.Control.SelectFeature
 */
OpenLayers.Control.ImprovedSelectFeature = OpenLayers.Class(OpenLayers.Control.SelectFeature, {
    /**
     * Method: unselectAll
     * Unselect all selected features.  To unselect all except for a single
     *     feature, set the options.except property to the feature.
     *
     * Parameters:
     * options - {Object} Optional configuration object.
     */
    unselectAll: function(options) {
        // we'll want an option to supress notification here
        var layers = this.layers || [this.layer];
        var layer, feature;
        var start = new Date().getTime();
        for(var l=0; l<layers.length; ++l) {
            layer = layers[l];
            layer.events.triggerEvent("start_featuresunselecting", {layer: layer});
            for(var i=layer.selectedFeatures.length-1; i>=0; --i) {
                feature = layer.selectedFeatures[i];
                if(!options || options.except != feature) {
                    this.unselect(feature);
                }
            }
            layer.events.triggerEvent("finished_featuresunselecting", layer);
        }
    },
    CLASS_NAME: "OpenLayers.Control.ImprovedSelectFeature"
});
