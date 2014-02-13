/**
 * Improved SelectFeatures control
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
            layer.events.triggerEvent("start_bulk", layer);
            for(var i=layer.selectedFeatures.length-1; i>=0; --i) {
                feature = layer.selectedFeatures[i];
                if(!options || options.except != feature) {
                    this.unselect(feature);
                }
            }
            layer.events.triggerEvent("end_bulk", layer);
        }
    },
    /**
     * Method: affectedLayers
     * Determine all different layers of given features
     *
     * Parameters:
     * features - {OpenLayers.Feature.Vector[]} Features
     *
     * Returns:
     * {OpenLayers.Layer[]} Affected layers
     */
    affectedLayers: function(features) {
        var layers = [];
        for(var i = 0; i < features.length; i++) {
            var found = false;
            for(var j = 0; j < layers.length; j++) {
                if(layers[j] == features[i].layer) {
                    found = true;
                    break;
                }
            }
            if(!found) {
                layers.push(features[i].layer)
            }
        }
        return layers;
    },
    /**
     * Method: selectFeatures
     * Select given features with this select control
     *
     * Parameters:
     * features - {OpenLayers.Feature.Vector[]} Features
     */
    selectFeatures: function(features) {
        var layers = this.affectedLayers(features);
        for(var i = 0; i < layers.length; i++) {
            layers[i].events.triggerEvent("start_bulk", layers[i]);
        }
        for(var i=0; i<features.length;i++) {
            if(OpenLayers.Util.indexOf(features[i].layer.selectedFeatures, features[i]) != -1) {
                this.unselect(features[i])
            }
            this.select(features[i]);
        }
        for(var i = 0; i < layers.length; i++) {
            layers[i].events.triggerEvent("end_bulk", layers[i]);
        }
    },
    /**
     * Method: overFeature
     * Called on over a feature.
     * Only responds if this.hover is true.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    overFeature: function(feature) {
        var layer = feature.layer;
        if(this.hover) {
            if(this.triggerHoverOnly) {
                this.events.triggerEvent("featureover", {feature : feature});
            } else if(this.highlightOnly) {
                this.highlight(feature);
            } else if(OpenLayers.Util.indexOf(
                layer.selectedFeatures, feature) == -1) {
                this.select(feature);
            }
        }
    },
    /**
     * Method: outFeature
     * Called on out of a selected feature.
     * Only responds if this.hover is true.
     *
     * Parameters:
     * feature - {<OpenLayers.Feature.Vector>}
     */
    outFeature: function(feature) {
        if(this.hover) {
            if(this.triggerHoverOnly) {
                this.events.triggerEvent("featureout", {feature : feature});
            } else if(this.highlightOnly) {
                // we do nothing if we're not the last highlighter of the
                // feature
                if(feature._lastHighlighter == this.id) {
                    // if another select control had highlighted the feature before
                    // we did it ourself then we use that control to highlight the
                    // feature as it was before we highlighted it, else we just
                    // unhighlight it
                    if(feature._prevHighlighter &&
                       feature._prevHighlighter != this.id) {
                        delete feature._lastHighlighter;
                        var control = this.map.getControl(
                            feature._prevHighlighter);
                        if(control) {
                            control.highlight(feature);
                        }
                    } else {
                        this.unhighlight(feature);
                    }
                }
            } else {
                this.unselect(feature);
            }
        }
    },
    CLASS_NAME: "OpenLayers.Control.ImprovedSelectFeature"
});
