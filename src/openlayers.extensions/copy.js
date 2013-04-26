/**
 * Copy feature control
 *
 * @class
 * @extends OpenLayers.Control
 * @param {OpenLayers.Layer.Vector} layer Target layer
 * @param {OpenLayers.Layer.Vector[]} layers Source layers
 * @param options
 * @param {OpenLayers.Control.SelectFeature} [options.selectControl]
 */
OpenLayers.Control.CopyFeatures = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Init method
     *
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     * @private
     */
    initialize: function(layer, layers, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);
        this._layers = layers;
        for(var i=0; i<this._layers.length; i++) {
            this._layers[i].events.register('featureselected', this, this._toggleControlState);
            this._layers[i].events.register('featureunselected', this, this._toggleControlState);
        }
        this._targetLayer = layer;
        this._olSelectControl = new OpenLayers.Control.SelectFeature();
        if (options.selectControl) {
            this.selectControl = options.selectControl;
        }
    },
    /**
     * Sets target layer
     *
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     * @param {OpenLayers.Layer.Vector} layer
     */
    targetLayer: function(layer) {
        this._targetLayer = layer;
        this._toggleControlState();
    },
    /**
     * Sets source layers
     *
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     * @param {OpenLayers.Layer.Vector[]} layers
     */
    layers: function(layers) {
        if(layers === undefined) {
            return this._layers;
        }
        this._layers = layers;
        for(var i=0; i<this._layers.length; i++) {
            this._layers[i].events.register('featureselected', this, this._toggleControlState);
            this._layers[i].events.register('featureunselected', this, this._toggleControlState);
        }
    },
    /**
     * Sets map
     *
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.call(this, map);
        OpenLayers.Element.addClass(this.panel_div, 'itemDisabled');
    },
    /**
     * Activate this control
     *
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     */
    activate: function() {
        if(this._targetLayer && this._selectedFeatures().length > 0) {
            this._copy();
        }
        this.deactivate();
        if (this.selectControl) {
            this.selectControl.activate();
        }
    },
    /**
     * Copy operation
     *
     * @private
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     */
    _copy: function() {
        var selectedFeatures = this._selectedFeatures();
        var newFeatures = []
        for(var i = 0; i < selectedFeatures.length; i++) {
            var geometry = selectedFeatures[i].geometry.clone();
            var newFeature = new OpenLayers.Feature.Vector(geometry);
            newFeature.state = OpenLayers.State.INSERT;
            newFeature.attributes = selectedFeatures[i].attributes;
            newFeatures.push(newFeature);
            this._olSelectControl.unselect(selectedFeatures[i]);
        }
        this._targetLayer.addFeatures(newFeatures);
    },
    /**
     * Collects selected features
     *
     * @private
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     * @returns {OpenLayers.Feature.Vector[]}
     */
    _selectedFeatures: function() {
        var selectedFeatures = [];
        for(var i = 0; i < this._layers.length; i++) {
            if(this._layers[i] != this._targetLayer) {
                for(var j=0; j<this._layers[i].selectedFeatures.length; j++) {
                    selectedFeatures.push(this._layers[i].selectedFeatures[j]);
                }
            }
        }
        return selectedFeatures;
    },
    /**
     * Checks if control is activatable
     *
     * @private
     * @memberof OpenLayers.Control.CopyFeatures
     * @instance
     */
    _toggleControlState: function() {
        if(this._targetLayer && this._selectedFeatures().length > 0) {
            this.activatable = true;
            if(this.panel_div) {
                OpenLayers.Element.removeClass(this.panel_div, 'itemDisabled');
            }
        } else {
            this.activatable = false;
            if(this.panel_div) {
                OpenLayers.Element.addClass(this.panel_div, 'itemDisabled');
            }
        }
    },
    CLASS_NAME: "OpenLayers.Control.CopyFeatures"
});
