/**
 * Merge features control
 *
 * @class
 * @extends OpenLayers.Control
 * @param {OpenLayers.Layer.Vector} layer
 * @param options
 * @param {OpenLayers.Control.SelectFeature} [options.selectControl]
  */
OpenLayers.Control.MergeFeatures = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Init method
     *
     * @memberof OpenLayers.Control.MergeFeatures
     * @instance
     * @private
     */
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this.layer = layer;
        this._olSelectControl = new OpenLayers.Control.SelectFeature();
        this.layer.events.register('featureselected', this, this._toggleControlState);
        this.layer.events.register('featureunselected', this, this._toggleControlState);
        if (options.selectControl) {
            this.selectControl = options.selectControl;
        }
    },
    /**
     * Sets layer
     *
     * @memberof OpenLayers.Control.MergeFeature
     * @instance
     * @param {OpenLayers.Layer.Vector} layer
     */
    setLayer: function(layer) {
        if(this.layer) {
            this.layer.events.unregister('featureselected', this, this._toggleControlState);
            this.layer.events.unregister('featureunselected', this, this._toggleControlState);
        }
        this.layer = layer;

        this.layer.events.register('featureselected', this, this._toggleControlState);
        this.layer.events.register('featureunselected', this, this._toggleControlState);
        this._toggleControlState();
    },
    /**
     * Sets the map
     *
     * @memberof OpenLayers.Control.MergeFeatures
     * @instance
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.call(this, map);
        OpenLayers.Element.addClass(this.panel_div, 'itemDisabled');
    },
    /**
     * Called when control is activated
     * Checks if two or more features selected and merge them
     *
     * @memberof OpenLayers.Control.MergeFeatures
     * @instance
     */
    activate: function() {
        if(this.layer.selectedFeatures.length > 1) {
            this.layer.addFeatures([this._merge(this.layer.selectedFeatures)]);
            while(this.layer.selectedFeatures[0]) {
                this._deleteFeature(this.layer.selectedFeatures[0]);
            }
        } else if(this.layer.selectedFeatures.length == 1 && this.layer.selectedFeatures[0].geometry.CLASS_NAME == 'OpenLayers.Geometry.MultiPolygon') {
            this.layer.addFeatures(this._unmerge(this.layer.selectedFeatures[0]));
            this._deleteFeature(this.layer.selectedFeatures[0]);
        }
        if (this.selectControl) {
            this.selectControl.activate();
        }
        this.deactivate();
    },
    /**
     * Checks if control is activatable
     *
     * @private
     * @memberof OpenLayers.Control.MergeFeatures
     * @instance
     */
    _toggleControlState: function() {
        if(this.layer.selectedFeatures.length > 1) {
            // check if type from selected features is identical
            var featureType = this.layer.selectedFeatures[0].geometry.CLASS_NAME;

            if(featureType == OpenLayers.Geometry.Point.prototype.CLASS_NAME) {
                featureType = false;
            }
            for(var i = 0; i < this.layer.selectedFeatures.length; i++) {
                var feature = this.layer.selectedFeatures[i];
                if (featureType != feature.geometry.CLASS_NAME) {
                    featureType = false;
                }
            }
            if (!featureType) {
                this.activatable = false;
                if(this.panel_div) {
                    OpenLayers.Element.removeClass(this.panel_div, 'unmergeActive');
                    OpenLayers.Element.addClass(this.panel_div, 'itemDisabled');
                }
                return false;
            }

            this.activatable = true;
            if(this.panel_div) {
                OpenLayers.Element.removeClass(this.panel_div, 'unmergeActive');
                OpenLayers.Element.removeClass(this.panel_div, 'itemDisabled');
            }
        } else if (this.layer.selectedFeatures.length == 1 && this.layer.selectedFeatures[0].geometry.CLASS_NAME == 'OpenLayers.Geometry.MultiPolygon') {
            this.activatable = true;
            if(this.panel_div) {
                OpenLayers.Element.removeClass(this.panel_div, 'itemDisabled');
                OpenLayers.Element.addClass(this.panel_div, 'unmergeActive');
            }
        } else {
            this.activatable = false;
            if(this.panel_div) {
                OpenLayers.Element.removeClass(this.panel_div, 'unmergeActive');
                OpenLayers.Element.addClass(this.panel_div, 'itemDisabled');
            }
        }
    },
    /**
     * Merge operation
     *
     * @memberof OpenLayers.Control.MergeFeatures
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector[]} polygonFeatures
     */
    _merge: function(polygonFeatures) {
        var jstsFromWkt = new jsts.io.WKTReader();
        var wktFromOl = new OpenLayers.Format.WKT();
        var olFromJsts = new jsts.io.OpenLayersParser();
        var union = false;
        var attributes = {};
        for(var i = 0; i < polygonFeatures.length; i++) {
            if(!union) {
                union = jstsFromWkt.read(wktFromOl.write(polygonFeatures[i]));
                attributes = polygonFeatures[i].attributes;
            } else {
                var polygon = jstsFromWkt.read(wktFromOl.write(polygonFeatures[i]));
                union = union.union(polygon);
                for(var key in polygonFeatures[i].attributes) {
                    if (!attributes[key]) { // test if element has attribute - take from first geometry
                        attributes[key] = polygonFeatures[i].attributes[key];
                    }
                }
            }
        }
        var feature = new OpenLayers.Feature.Vector(olFromJsts.write(union));
        feature.state = OpenLayers.State.INSERT;
        feature.attributes = attributes;
        return feature;
    },
    /**
     * Unmerge operation for multipolygons
     *
     * @memberof OpenLayers.Control.MergeFeatures
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector} multiPolygonFeature
     */
    _unmerge: function(multiPolygonFeature) {
        var features = [];
        for(var i = 0; i < multiPolygonFeature.geometry.components.length; i++) {
            var feature = new OpenLayers.Feature.Vector(multiPolygonFeature.geometry.components[i].clone());
            feature.state = OpenLayers.State.INSERT;
            feature.attributes = multiPolygonFeature.attributes;
            features.push(feature);
        }
        return features;
    },
    /**
     * Delete operation
     *
     * @memberof OpenLayers.Control.MergeFeatures
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector} feature
     */
    _deleteFeature: function(feature) {

        this._olSelectControl.unselect(feature);
        // if feature doesn't have a fid, destroy it
        if(feature.fid == undefined) {
            this.layer.destroyFeatures([feature]);
        } else {
            feature.state = OpenLayers.State.DELETE;
            this.layer.events.triggerEvent("afterfeaturemodified", {feature: feature});
            feature.renderIntent = "select";
            this.layer.drawFeature(feature);
        }
    },
    CLASS_NAME: "OpenLayers.Control.MergeFeatures"
});
