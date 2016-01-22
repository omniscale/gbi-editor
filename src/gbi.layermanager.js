/**
 * Creates a new LayerManager
 *
 * The LayerManager handels add/remove/activate and reordering layers
 *
 * @constructor
 * @param {OpenLayers.Map} olMap
 */
gbi.LayerManager = function(olMap, autoActivateAddedLayer) {
    this.counter = 0;
    this._layers = {};
    this.backgroundLayers = {};
    this.rasterLayers = {};
    this.vectorLayers = {};
    this.unshownLayers = {};
    this._activeLayer = false;
    this.olMap = olMap;
    this.autoActivateAddedLayer = autoActivateAddedLayer || false;
};
gbi.LayerManager.prototype = {
    CLASS_NAME: 'gbi.LayerManager',
    /**
     * Generates  continuing id
     *
     * @memberof gbi.LayerManager
     * @instance
     * @returns {Integer} id
     */
    nextID: function() {
        return this.counter++;
    },
    /**
     * Adds a layer
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     */
    addLayer: function(layer) {
        var self = this;
        var id = self.nextID();
        layer.id = layer.olLayer.gbiId = id;
        self._layers[id] = layer;
        self.olMap.addLayer(layer.olLayer);
        if(layer.isBaseLayer) {
            self.olMap.setBaseLayer(layer.olLayer);
        }
        if(!layer.options.displayInLayerSwitcher) {
            self.unshownLayers[id] = layer;
            if(layer.isVector) {
                $(gbi).trigger('gbi.layermanager.vectorlayer.add', layer);
            } else if (layer.isBackground) {
                $(gbi).trigger('gbi.layermanager.backgroundlayer.add', layer);
            } else if (layer.isRaster) {
                $(gbi).trigger('gbi.layermanager.rasterlayer.add', layer);
            }
        } else if(layer.isVector) {
            self.vectorLayers[id] = layer;
            $(gbi).trigger('gbi.layermanager.vectorlayer.add', layer);
            if(!self.active() && self.autoActivateAddedLayer) {
                self.active(layer);
            }
        } else if (layer.isBackground) {
            self.backgroundLayers[id] = layer;
            $(gbi).trigger('gbi.layermanager.backgroundlayer.add', layer);
        } else if (layer.isRaster) {
            self.rasterLayers[id] = layer;
            $(gbi).trigger('gbi.layermanager.rasterlayer.add', layer);
        }
        self.position(layer, self.minMaxPosition(layer)['max']);
        if(Object.keys(self.unshownLayers).length) {
            $.each(self.unshownLayers, function(idx, _layer) {
                self.position(_layer, self.minMaxPosition(_layer)['max']);
            });
        }
        $(gbi).trigger('gbi.layermanager.layer.add', layer);

    },
    /**
     * Adds a layers
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layers
     */
    addLayers: function(layers) {
        var self = this;
        $.each(layers, function(idx, layer) {
            self.addLayer(layer);
        });
    },
    /**
     * Removes a layer
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     */
    removeLayer: function(layer) {
        var id = layer.id;
        this.olMap.removeLayer(layer.olLayer);
        delete this._layers[id];
        $(gbi).trigger('gbi.layermanager.layer.remove');
        if(layer.isVector) {
            if(this.vectorLayers[id] !== undefined) {
                delete this.vectorLayers[id];
            }
            if(this.unshownLayers[id] !== undefined) {
                delete this.unshownLayers[id];
            }

            if(layer.isActive) {
                this._activeLayer = false;
                $(gbi).trigger('gbi.layermanager.layer.active', false);
            }
            $(gbi).trigger('gbi.layermanager.vectorlayer.remove', layer);
        } else if(layer.isBackground) {
            delete this.backgroundLayers[id];
            $(gbi).trigger('gbi.layermanager.backgroundLayer.remove', layer);
        } else if(layer.isRaster) {
            delete this.rasterLayers[id];
            $(gbi).trigger('gbi.layermanager.rasterlayer.remove', layer);
        }
        layer.destroy();
    },
    /**
     * Get all useable layers in top-down order
     *
     * @memberof gbi.LayerManager
     * @instance
     * @returns {gbi.Layers.Layer[]} List of layers
     */
    layers: function() {
        var self = this;
        var result = [];
        $.each(this.olMap.layers, function(idx, olLayer) {
            if(olLayer && !olLayer.isBaseLayer) {
                var gbiLayer = self._layers[olLayer.gbiId];
                if(gbiLayer) {
                    result.push(gbiLayer);
                }
            }
        });
        return result.reverse();
    },
    /**
     * Get layer by it's id
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {Integer} id
     * @returns {gbi.Layers.Layer}
     */
    layerById: function(id) {
        return this._layers[id];
    },
    /**
     * Get layer by it's name
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {String} name
     * @returns {gbi.Layers.Layer}
     */
    layerByName: function(name) {
        return this.olMap.getLayersByName(name)[0].gbiLayer;
    },
    /**
     * Activates a layer
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer}
     * @returns {gbi.Layers.Layer} Active layer if no layer is given as parameter
     */
    active: function(layer) {
        var self = this;
        if(arguments.length == 0) {
            return self._activeLayer;
        }
        if(self._activeLayer) {
            self._activeLayer.deactivate();
        }
        self._activeLayer = layer;
        self._activeLayer.activate();
        $(gbi).trigger('gbi.layermanager.layer.active', layer);
    },
    /**
     * Moves a layer up in the order of it's group (baselayer|rasterlayer|vectorlayer)
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     * @param {Integer} delta
     * @returns {Boolean} success
     */
    up: function(layer, delta) {
        var max = this.minMaxPosition(layer)['max'];
        delta = delta || 1;
        var pos = this.position(layer) + delta;
        if(pos > max) {
            return false;
        }
        this.position(layer, pos);
        return true;
    },
    /**
     * Moves a layer on the top
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     */
    top: function(layer) {
        this.position(layer, this.minMaxPosition(layer)['max']);
    },
    /**
     * Moves a layer down in order
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     * @returns {Boolean} success
     */
    down: function(layer, delta) {
        var min = this.minMaxPosition(layer)['min'];
        delta = delta || 1;
        var pos = this.position(layer) - delta;
        if(pos < min) {
            return false;
        }
        this.position(layer, pos);
        return true;
    },
    /**
     * Gets/sets the position of a layer in layerorder
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     * @param {Integer} [pos]
     * @return {Integer} Position of layer in layerorder if no pos param is passed
     */
    position: function(layer, pos) {
        if(!pos) {
            return this.olMap.getLayerIndex(layer.olLayer);
        }
        this.olMap.setLayerIndex(layer.olLayer, pos);
    },
    /**
     * Moves a layer at the bottom
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     */
    bottom: function(layer) {
        this.position(layer, this.minMaxPosition(layer)['min']);
    },
    /**
     * Gets min/max position of a layer in the layerorder
     *
     * @memberof gbi.LayerManager
     * @instance
     * @param {gbi.Layers.Layer} layer
     * @returns {Object} The returned object has a min- and a max-property
     */
    minMaxPosition: function(layer) {
        var min;
        var max;
        if(!layer.options.displayInLayerSwitcher) {
            min = Object.keys(this.backgroundLayers).length + Object.keys(this.rasterLayers).length + Object.keys(this.vectorLayers).length + 1;
            max = min + Object.keys(this.unshownLayers).length - 1;
        } else if(layer.isBackground) {
            min = 1;
            max = Object.keys(this.backgroundLayers).length;
        } else if (layer.isRaster) {
            min = Object.keys(this.backgroundLayers).length + 1;
            max = min + Object.keys(this.rasterLayers).length - 1;
        } else {
            min = Object.keys(this.backgroundLayers).length + Object.keys(this.rasterLayers).length + 1;
            max = min + Object.keys(this.vectorLayers).length - 1;
        }
        return {min: min, max: max};
    }
};
