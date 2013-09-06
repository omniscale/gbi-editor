gbi.Layers = gbi.Layers || {};

/**
 * Baseclass for layer
 *
 * @class
 * @abstract
 * @param [options]
 * @param {Boolean} [options.isBaseLayer]
 * @param {Boolean} [options.background=false]
 * @param {Boolean} [options.displayInLayerSwitcher]
 * @param {Boolean} [options.visibility]
 */
gbi.Layers.Layer = function(options) {
    var defaults = {
        isBaseLayer: false,
        displayInLayerSwitcher: true,
        visibility: true,
        gbiLayer: this
    }
    this.options = $.extend({}, defaults, options);
    this.isRaster = true;
    this.isBackground = this.options.background || false;
};
gbi.Layers.Layer.prototype = {
    CLASS_NAME: 'gbi.Layers.Layer',
    /**
     * Gets/sets layer visibility
     *
     * @memberof gbi.Layers.Layer
     * @instance
     * @param {Boolean} [visibility]
     * @returns {Boolean} Returns visibility of layer of no param is given
     */
    visible: function(visibility) {
        if(arguments.length == 0) {
            return this.olLayer.getVisibility();
        }
        this.olLayer.setVisibility(visibility);
    },
    /**
     * Destroys
     *
     * @memberof gbi.Layers.Layer
     * @instance
     */
    destroy: function() {
        $(this).off();
        this.olLayer.destroy();
    },
    /**
     * Gets the type of layer
     *
     * @memberof gbi.Layers.Layer
     * @instance
     * @returns {String}
     */
    type: function() {
        //XXXkai: make constants
        if(this.isBackground)
            return 'background';
        else if (this.isVector)
            return 'vector';
        else
            return 'raster';
    },
    /**
     * Registers an event
     *
     * @memberof gbi.Layers.Layer
     * @instance
     * @param {String} type event name
     * @param {Object} obj "this" in func context
     * @param {Function} func Called when event is triggered
     */
    registerEvent: function(type, obj, func) {
        if(this.olLayer) {
            this.olLayer.events.register(type, obj, func);
        }
    },
    /**
     * Unregisters an event
     *
     * @memberof gbi.Layers.Layer
     * @instance
     * @param {String} type event name
     * @param {Object} obj "this" in func context
     * @param {Function} func Function given to {registerEvent}
     */
    unregisterEvent: function(type, obj, func) {
        if(this.olLayer) {
            this.olLayer.events.unregister(type, obj, func);
        }
    },
    /**
     * Triggers an event
     *
     * @memberof gbi.Layers.Layer
     * @instance
     * @param {String} type event name
     * @param {Object} obj Object commited to eventListener
     */
    triggerEvent: function(type, obj) {
        if(this.olLayer) {
            this.olLayer.events.triggerEvent(type, obj);
        }
    }
};

/**
 * Creates a OSM layer
 *
 * @constructor
 * @extends gbi.Layers.Layer
 * @param [options] All OpenLayers.Layer.OSM options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/OSM-js.html|OpenLayers.Layer.OSM}
 * @param {String} options.name Name of the layer
 */
gbi.Layers.OSM = function(options) {
    gbi.Layers.Layer.call(this, options);
    this.olLayer = new OpenLayers.Layer.OSM(this.options.name, undefined, this.options);
};
gbi.Layers.OSM.prototype = new gbi.Layers.Layer();
$.extend(gbi.Layers.OSM.prototype, {
    CLASS_NAME: 'gbi.Layers.OSM'
});

/**
 * Creates a WMS layer
 *
 * @constructor
 * @extends gbi.Layers.Layer
 * @param [options] All OpenLayers.Layer.WMS options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/WMS-js.html|OpenLayers.Layer.WMS}
 * @param {String} options.name Name of the layer
 * @param {String} options.url
 * @param {String[]} options.layers
 * @param {String} [options.params.srs=EPSG:3857]
 */
gbi.Layers.WMS = function(options) {
    var defaults = {
        params: {
            srs: 'EPSG:3857'
        },
        ratio: 1,
        singleTile: true
    };
    gbi.Layers.Layer.call(this, $.extend({}, defaults, options));
    var params = this.options.params
    delete this.options.params
    this.olLayer = new OpenLayers.Layer.WMS(this.options.name, this.options.url, params, this.options)
};
gbi.Layers.WMS.prototype = new gbi.Layers.Layer();
$.extend(gbi.Layers.WMS.prototype, {
    CLASS_NAME: 'gbi.Layers.WMS',
    clone: function() {
        var clone_options = $.extend({}, this.options, {clone: true});
        var clone = new gbi.Layers.WMS(clone_options);
        clone.olLayer = this.olLayer.clone();
        return clone;
    }
});

/**
 * Creates a WMTS layer
 *
 * @constructor
 * @extends gbi.Layers.Layer
 * @param [options] All OpenLayers.Layer.WMTS options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/WMTS-js.html|OpenLayers.Layer.WMTS}
 * @param {String} options.name Name of the layer
 * @param {String} options.url
 * @param {String} options.layer
 */
gbi.Layers.WMTS = function(options) {
    var defaults = {
        getURL: this.tileURL,
        matrixSet: 'GoogleMapsCompatible',
        style: 'default'
    };
    gbi.Layers.Layer.call(this, $.extend({}, defaults, options));
    this.olLayer = this.options.clone ? null : new OpenLayers.Layer.WMTS(this.options);
};
gbi.Layers.WMTS.prototype = new gbi.Layers.Layer();
$.extend(gbi.Layers.WMTS.prototype, {
    CLASS_NAME: 'gbi.Layers.WMTS',
    /**
     * Generates the url for one tile
     *
     * @memberof gbi.Layers.WMTS
     * @instance
     * @private
     * @param {OpenLayers.Bounds} bounds
     * @returns {String} tileURL
     */
    tileURL: function(bounds) {
        var tileInfo = this.getTileInfo(bounds.getCenterLonLat());
        return this.url
            + this.layer + '/'
            + this.matrixSet + '-'
            + this.matrix.identifier + '-'
            + tileInfo.col + '-'
            + tileInfo.row + '/tile';
    },
    /**
     * Create a clone of this layer
     *
     * @memberof gbi.Layers.WMTS
     * @instance
     * @returns {gbi.Layers.WMTS}
     */
    clone: function() {
        var clone_options = $.extend({}, this.options, {clone: true});
        var clone = new gbi.Layers.WMTS(clone_options);
        clone.olLayer = this.olLayer.clone();
        return clone;
    }
});

/**
 * Creates a vector layer
 *
 * @constructor
 * @extends gbi.Layers.Layer
 * @param [options] All OpenLayers.Layer.Vector options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html|OpenLayers.Layer.Vector}
 * @param {String} options.name Layername
 * @param {Boolean} [options.editable=true]
 * @param {Boolean} [options.atrtibutePopop=false] Show a popup with feature attributes when select feature
 */
gbi.Layers.Vector = function(options) {
    var self = this;
    var defaults = {
        editable: true,
        clickPopup: false,
        hoverPopup: false,
        hoverAutoActive: false,
        maxAttributeValues: 100
    };
    var default_symbolizers = {
      "Point": {
        pointRadius: 6,
        fillColor: "#ee9900",
        fillOpacity: 0.4,
        strokeWidth: 1,
        strokeOpacity: 1,
        strokeColor: "#ee9900"
      },
      "Line": {
        strokeWidth: 1,
        strokeOpacity: 1,
        strokeColor: "#ee9900"
       },
       "Polygon": {
        strokeWidth: 1,
        strokeOpacity: 1,
        strokeColor: "#ee9900",
        fillColor: "#ee9900",
        fillOpacity: 0.4
       }
    };
    this.selectStyle = new OpenLayers.Style();
    this.selectStyle.addRules([new OpenLayers.Rule({symbolizer: {
        fillColor: "blue",
        fillOpacity: 0.4,
        hoverFillColor: "white",
        hoverFillOpacity: 0.8,
        strokeColor: "blue",
        strokeOpacity: 1,
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeDashstyle: "solid",
        hoverStrokeColor: "red",
        hoverStrokeOpacity: 1,
        hoverStrokeWidth: 0.2,
        pointRadius: 6,
        hoverPointRadius: 1,
        hoverPointUnit: "%",
        pointerEvents: "visiblePainted",
        cursor: "pointer",
        fontColor: "#000000",
        labelAlign: "cm",
        labelOutlineColor: "white",
        labelOutlineWidth: 3
    }})]);

    gbi.Layers.Layer.call(this, $.extend({}, defaults, options));

    this.olLayer = new OpenLayers.Layer.Vector(this.options.name, this.options);

    this.isVector = this.olLayer.isVector = true;
    this.isRaster = false;
    this.isBackground = false;
    this.isActive = false;
    this.isEditable = this.options.editable;
    this.loaded = true;
    this.customStyle = false;
    this.default_symbolizers = default_symbolizers;
    this.jsonSchema = this.options.jsonSchema || false;

    this._shortListAttributes = [];
    this._fullListAttributes = [];
    this._popupAttributes = [];

    this.features = this.olLayer.features;
    if(!this.options.styleMap) {
        this.symbolizers = $.extend(true, {}, default_symbolizers, this.options.symbolizers);
        this._setStyle(this.symbolizers);
    } else {
        this.symbolizers = this.options.styleMap.styles['default'].rules[0].symbolizer;
    }

    this.featureStylingRuleActive = false;
    this.featureStylingRule = false;

    if(this.options.jsonSchemaUrl && !this.jsonSchema) {
        this.addSchemaFromUrl(this.options.jsonSchemaUrl);
    }

    //show popup when selectControl click
    if(this.options.clickPopup) {
        this.registerEvent('featureselected', this, this._showPopup);
        this.registerEvent('featureunselected', this, this._removePopup);
    }

    //show popup when selectControl highlight a feature
    //selectControl must trigger events on layer
    if(this.options.hoverPopup) {
        this.registerEvent('featurehighlighted', this, this._showPopup);
        this.registerEvent('featureunhighlighted', this, this._removePopup);
        this.registerEvent('added', this, function() {
            self.hoverCtrl = new gbi.Controls.Hover(self, {
                toolbar: false
            });
            self.olLayer.map.addControl(self.hoverCtrl.olControl);
        });
    }
}
gbi.Layers.Vector.prototype = new gbi.Layers.Layer();
$.extend(gbi.Layers.Vector.prototype, {
    CLASS_NAME: 'gbi.Layers.Vector',
    /**
     * Activates the layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    activate: function() {
        this.isActive = true;
        if(this.options.hoverPopup && this.options.hoverAutoActive) {
            this.hoverCtrl.activate();
        }
    },
    /**
     * Deactivates the layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    deactivate: function() {
        this.isActive = false;
        if(this.options.hoverPopup) {
            this.hoverCtrl.deactivate();
        }
    },
    /**
     * Destroys the layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    destroy: function() {
        if(this.options.hoverPopup) {
            this.hoverCtrl.destroy();
        }
        gbi.Layers.Layer.prototype.destroy.call(this);
    },
    refresh: function() {
        this.olLayer.refresh();
    },
    setStyle: function(symbolizers, temporary) {
        if(!temporary) {
            this.customStyle = true;
        }
        this._setStyle(symbolizers, temporary);
    },
    /**
     * Sets the style of this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {Object} symbolizers Object with styling informations. See {@link http://docs.openlayers.org/library/feature_styling.html|OpenLayers Styling}
     */
    _setStyle: function(symbolizers, temporary) {
        var applySymbolizers;
        if(temporary) {
            applySymbolizers = $.extend(true, {}, this.symbolizers, symbolizers)
        } else {
            applySymbolizers = $.extend(true, this.symbolizers, symbolizers);
        }
        var style = new OpenLayers.Style();
        style.addRules([
            new OpenLayers.Rule({symbolizer: applySymbolizers})
        ]);
        if(this.olLayer.styleMap) {
            this.olLayer.styleMap.styles['default'] = style;
            this.olLayer.styleMap.styles['select'] = this.selectStyle;
        } else {
            this.olLayer.styleMap = new OpenLayers.StyleMap({
                "default": style,
                "select": this.selectStyle
            });
        }
        this._applyFilterOptions();
        $(this).trigger('gbi.layer.vector.styleChanged')
        this.olLayer.redraw();
    },
    activateFeatureStylingRule: function() {
        this.featureStylingRuleActive = true;
        this._applyFilterOptions();
        this.olLayer.redraw();
    },
    deactivateFeatureStylingRule: function() {
        this.featureStylingRuleActive = false;
        this._applyFilterOptions();
        this.olLayer.redraw();
    },
    /**
     * Apply filters to styling
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @private
     */
    _applyFilterOptions: function() {
        var self = this;
        var rules = [];

        for(var i = self.olLayer.styleMap.styles.default.rules.length - 1; i >= 0; i--) {
            if(self.olLayer.styleMap.styles.default.rules[i].propertyFilter) {
                self.olLayer.styleMap.styles.default.rules.splice(i, 1);
            }
        }
        if(self.featureStylingRule && self.featureStylingRuleActive) {
            switch(self.featureStylingRule.filterType) {
                case 'exact':
                    $.each(self.featureStylingRule.filters, function(idx, filter) {
                        filter.olFilter = new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.EQUAL_TO,
                            property: self.featureStylingRule.filterAttribute,
                            value: filter.value
                        });

                        if(filter.symbolizer) {
                            rules.push(new OpenLayers.Rule({
                                filter: filter.olFilter,
                                symbolizer: filter.symbolizer,
                                propertyFilter: true
                            }));
                        }
                    });
                    break;
                case 'range':
                    $.each(self.featureStylingRule.filters, function(idx, filter) {
                        var minFilter = false;
                        var maxFilter = false;
                        var olFilter = false;

                        if(OpenLayers.String.isNumeric(filter.min)) {
                            minFilter = new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
                                property: self.featureStylingRule.filterAttribute,
                                value: OpenLayers.String.numericIf(filter.min)
                            });
                        }
                        if(OpenLayers.String.isNumeric(filter.max)) {
                            maxFilter = new OpenLayers.Filter.Comparison({
                                type: OpenLayers.Filter.Comparison.LESS_THAN,
                                property: self.featureStylingRule.filterAttribute,
                                value: OpenLayers.String.numericIf(filter.max)
                            });
                        }

                        if(!minFilter && !maxFilter) {
                            return;
                        }

                        if(minFilter && maxFilter) {
                            olFilter = new OpenLayers.Filter.Logical({
                                type: OpenLayers.Filter.Logical.AND,
                                filters: [minFilter, maxFilter]
                            });
                        }
                        filter.olFilter = olFilter || minFilter || maxFilter;

                        if(filter.symbolizer) {
                            rules.push(new OpenLayers.Rule({
                                filter: filter.olFilter,
                                symbolizer: filter.symbolizer,
                                propertyFilter: true
                            }));
                        }
                    });
                    break;
            };
            self.olLayer.styleMap.styles.default.rules = self.olLayer.styleMap.styles.default.rules.concat(rules);
        }
    },
    /**
     * Adds property filters
     *
     * At the moment, two types of filters are supported.
     * 1. 'exact'
     *    Filter value must match exactly.
     * 2. 'range'
     *    If min in filterOptions, all values >= min will be matched
     *    If max in filterOptions, all values < max will be matched
     *    If min and max in filterOptions, all min <= value < max will be matched
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {String} type
     * @param {String} attribute
     * @param {Object[]} filterOptions Contains the parameters for each filter
     */
    addAttributeFilter: function(type, attribute, filterOptions) {
        var self = this;
        var newFeatureStylingRule = $.isArray(filterOptions) && filterOptions.length > 0 ? {
            filterType: type,
            filterAttribute: attribute,
            filters: filterOptions
        } : false;

        this.featureStylingRule = newFeatureStylingRule;
        this._applyFilterOptions();
        $(this).trigger('gbi.layer.vector.ruleChanged', false);
        this.olLayer.redraw();
    },
    /**
     * Get a list of attributes of all features of this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @returns {String[]} List of attributes
     */
    featuresAttributes: function() {
        var self = this;
        var result = [];
        $.each(this.olLayer.features, function(idx, feature) {
            $.each(feature.attributes, function(key, value) {
                if($.inArray(key, result) == -1) {
                    result.push(key);
                }
            });
        });
        return result;
    },
    /**
     * Get a list of attributes defined in jsonSchema
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @returns {String[]} List of attributes
     */
    schemaAttributes: function() {
        var self = this;
        if(!self.jsonSchema) {
            return false;
        }
        var attributes = [];
        $.each(self.jsonSchema.properties, function(key, value) {
            attributes.push(key);
        });
        return attributes;
    },
    /**
     * Get a list of values of specified attribute
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {String} attribute
     * @returns {Mixed[]} List of values of given attribute
     */
    attributeValues: function(attribute) {
        var self = this;
        var result = [];
        $.each(this.olLayer.features, function(idx, feature) {
            if(feature.attributes[attribute] && $.inArray(feature.attributes[attribute], result) == -1) {
                result.push(feature.attributes[attribute]);
            }
            if(result.length > self.options.maxAttributeValues) {
                return false;
            }
        });
        return result;
    },
    /**
     * Get all filtered features sorted by matching filter
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @returns {Object} The returned Object has a attribute, type and result attribute.
     *                   The result attribute is also an object containing color, min,
     *                   max and value propties and a list of features
     */
    filteredFeatures: function() {
        var self = this;
        var result = {};
        var attribute = false;
        var type = false;

        if(this.featureStylingRule && this.featureStylingRule.filterAttribute && this.featureStylingRule.filters) {
            $.each(this.featureStylingRule.filters, function(idx, filterOption) {
                if(!(filterOption.value || filterOption.min || filterOption.max) || !filterOption.olFilter) {
                    return true;
                }
                result[idx] = {
                    'id': idx,
                    'color': filterOption.symbolizer.fillColor,
                    'value': filterOption.value,
                    'min': filterOption.min,
                    'max': filterOption.max,
                    'features': []
                };
            });


            $.each(this.olLayer.features, function(id, feature) {
                for(var i = self.featureStylingRule.filters.length - 1; i >= 0; i--) {
                    var filterOption = self.featureStylingRule.filters[i];
                    if(!filterOption.olFilter) {
                        break;
                    }
                    if(filterOption.olFilter.evaluate(feature)) {
                        result[i].features.push(feature);
                        break;
                    }
                }
            });
            return {
                attribute: this.featureStylingRule.filterAttribute,
                type: this.featureStylingRule.filterType,
                result: result
            };
        }
    },
    /**
     * Get feature of this layer by its id
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @returns {OpenLayers.Feature.Vector} feature if found
     */
    featureById: function(featureId) {
        return this.olLayer.getFeatureById(featureId);
    },
    /**
     * Adds features to this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {OpenLayers.Feature.Vector[]} features
     */
    addFeatures: function(features, options) {
        this.olLayer.addFeatures(features);
    },
    /**
     * Adds a feature to this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {OpenLayers.Feature.Vector} feature
     */
    addFeature: function(feature, options) {
        this.addFeatures([feature], options);
    },
    /**
     * Change/Add an attribute of/to given feature
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {OpenLayers.Feature.Vector} feature
     * @param {String} attribute
     * @param {Object} value
     * @returns {Boolean} success
     */
    changeFeatureAttribute: function(feature, attribute, value) {
        var self = this;
        if(feature.attributes[attribute] != value) {
            if(self._fullListAttributes.length > 0 && $.inArray(attribute, self._fullListAttributes) == -1) {
                self._fullListAttributes.push(attribute);
            }
            if(self.jsonSchema && attribute in self.jsonSchema.properties) {
                if(self.jsonSchema.properties[attribute].type == 'number') {
                    if($.isNumeric(value)) {
                        value = parseFloat(value)
                    }
                }
            }
            feature.attributes[attribute] = value;
            $(self).trigger('gbi.layer.vector.featureAttributeChanged', feature);
            return true;
        }
        return false;
    },
    /**
     * Removes an attribute from given feature
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {OpenLayers.Feature.Vector} feature
     * @param {String} attribute
     * @returns {Boolean} success
     */
    removeFeatureAttribute: function(feature, attribute) {
        if(attribute in feature.attributes) {
            if(this._fullListAttributes.length > 0 && $.inArray(attribute, this._fullListAttributes) != -1) {
                this._fullListAttributes.splice(this._fullListAttributes.indexOf(attribute), 1);
            }
            delete feature.attributes[attribute];
            $(this).trigger('gbi.layer.vector.featureAttributeChanged', feature);
            return true;
        }
        return false;
    },
    /**
     * Create a clone of this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @returns {gbi.Layers.Vector}
     */
    clone: function() {
        var clone_options = $.extend({}, this.options, {clone: true});
        var clone = new gbi.Layers.Vector(clone_options);
        clone.olLayer = this.olLayer.clone();
        return clone;
    },
    /**
     * Unselects all selected features of this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    unSelectAllFeatures: function() {
        var selectCtrl = new OpenLayers.Control.SelectFeature(this.olLayer);
        selectCtrl.unselectAll();
        selectCtrl.destroy();
        if(this.popup) {
            this._removePopup(this.popup);
        }
    },
    /**
     * Selects all features of this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    selectAllFeatures: function() {
        var selectCtrl = new OpenLayers.Control.SelectFeature();
        for(var i in this.features) {
            if($.inArray(this.features[i], this.olLayer.selectedFeatures) == -1) {
                selectCtrl.select(this.features[i]);
            }
        }
        selectCtrl.destroy();
        if(this.popup) {
            this._removePopup(this.popup);
        }
    },
    /**
     * Selects a single feature in this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {OpenLayers.Feature.Vector} feature to select
     * @param {Boolean} unselect Unselect other features befor select given feature
     */
    selectFeature: function(feature, unselect) {
        var self = this;
        if($.inArray(feature, self.features) != -1) {
            var selectCtrl = new OpenLayers.Control.SelectFeature();
            if(unselect) {
                self.unSelectAllFeatures();
            }
            selectCtrl.select(feature);
            selectCtrl.destroy();
            if(self.popup) {
                self._removePopup(self.popup);
            }
        }
    },
    /**
     * Center map on given feature
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {OpenLayers.Feature.Vector} feature
     */
    showFeature: function(feature) {
        var bounds = feature.geometry.getBounds();
        this.olLayer.map.zoomToExtent(bounds);
    },
    /**
     * Getter/Setter of shortListAttributes
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {String[]} List of attributes
     * @returns {String[]} List of attributes
     */
    shortListAttributes: function(shortListAttributes) {
        if(shortListAttributes) {
            this._shortListAttributes = shortListAttributes;
            $(this).trigger('gbi.layer.vector.listAttributesChanged', false);
        }
        return this._shortListAttributes;
    },
    /**
     * Getter/Setter of fullListAttributes
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {String[]} List of attributes
     * @returns {String[]} List of attributes
     */
    fullListAttributes: function(fullListAttributes) {
        if(fullListAttributes) {
            this._fullListAttributes = fullListAttributes;
            $(this).trigger('gbi.layer.vector.listAttributesChanged', false);
        }
        return this._fullListAttributes;
    },
    /**
     * Getter/Setter of popupAttributes
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {String[]} List of attributes
     * @returns {String[]} List of attributes
     */
    popupAttributes: function(popupAttributes) {
        if(popupAttributes) {
            this._popupAttributes = popupAttributes;
            $(this).trigger('gbi.layer.vector.popupAttributesChanged', false);
        }
        return this._popupAttributes;
    },
    /**
     * Selects all features of this layer with have given property equal given value
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {String} property
     * @param {String} value
     */
    selectByPropertyValue: function(property, value) {
        var self = this;
        var selectCtrl = new OpenLayers.Control.SelectFeature();
        $.each(this.olLayer.features, function(idx, feature) {
            selectCtrl.unselect(feature);
            if((property in feature.attributes && feature.attributes[property] == value)) {
                selectCtrl.select(feature);
            }
        });
        selectCtrl.destroy();
        if(this.popup) {
            this._removePopup(this.popup);
        }
    },
    /**
     * Zooms to data extend
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    zoomToDataExtent: function() {
        var dataExtent = this.olLayer.getDataExtent();
        if(dataExtent) {
            this.olLayer.map.zoomToExtent(dataExtent);
        }
    },
    /**
     * Activates hover control if present
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    activateHover: function() {
        if(this.options.hoverPopup) {
            this.hoverCtrl.activate();
        }
    },
    /**
     * Deactivates hover control if present
     *
     * @memberof gbi.Layers.Vector
     * @instance
     */
    deactivateHover: function() {
        if(this.options.hoverPopup) {
            this.hoverCtrl.deactivate();
        }
    },
    /**
     * Displays a popup with feature attributes
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector} f
     */
    _showPopup: function(f) {
        if(this.popup && f.feature.geometry == this.popupFeature.geometry) {
            this._removePopup();
        }
        this.popupFeature = f.feature;
        var point = this.popupFeature.geometry.getCentroid();
        var content = this._renderAttributes(this.popupFeature.attributes);
        if($.isArray(this._popupAttributes) && this._popupAttributes.length == 0) {
            content = OpenLayers.i18n('No attributes selected');
        }
        this.popup = new OpenLayers.Popup.Anchored(OpenLayers.i18n("Attributes"),
            new OpenLayers.LonLat(point.x, point.y),
            null,
            content || OpenLayers.i18n('No attributes'),
            null,
            !this.options.hoverPopup);
        this.popup.autoSize = true;

        this.olLayer.map.addPopup(this.popup);
    },
    /**
     * Hides a popup with feature attributes
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @private
     */
    _removePopup: function() {
        if(this.popup) {
            this.olLayer.map.removePopup(this.popup);
            this.popupFeature = false;
        }
    },
    /**
     * Renders attributes into a div
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @private
     * @param {Object} attributes
     * @returns {String} Ready to include html string
     */
    _renderAttributes: function(attributes) {
        var container = $('<div></div>');
        if(this._popupAttributes) {
            $.each(this._popupAttributes, function(idx, attribute) {
                container.append($('<div><span>'+attribute+': </span><span>'+ (attributes[attribute] || OpenLayers.i18n('Not defined')) +'</span></div>'));
            })
        } else {
            $.each(attributes, function(key, value) {
                container.append($('<div><span>'+key+':</span><span>'+value+'</span></div>'));
            });
        }
        return container.html();
    },
    /**
     * Validates attributes of each feature of this layer agains jsonSchema
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @returns {Object[]} when errors found
     * @returns {Boolean} true when valid
     */
    validateFeaturesAttributes: function() {
        var self = this;
        if(!self.jsonSchema) {
            return
        }
        var errors = []
        $.each(self.features, function(idx, feature) {
            result = Validator.validate(feature.attributes, self.jsonSchema);
            if(!result.valid) {
                errors.push({
                    feature: feature,
                    errors: result.errors
                })
            }
        });
        return errors.length == 0 ? true : errors;
    },
    /**
     * Validates attributes of given feature against jsonSchema
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @return {Boolean} valid
     */
    validateFeatureAttributes: function(feature) {
        return Validator.validate(feature.attributes, self.jsonSchema).valid;
    },
    addSchemaFromUrl: function(url) {
        var self = this;
        $.getJSON(url)
            .done(function(response) {
                self.jsonSchema = response;
                self.options.jsonSchemaUrl = url;
                $(self).trigger('gbi.layer.vector.schemaLoaded', self.jsonSchema);
            })
            .fail(function() {
                $(self).trigger('gbi.layer.vector.loadSchemaFail');
            });
    },
    removeJsonSchema: function() {
        this.jsonSchema = false;
        this.options.jsonSchemaUrl = false;
    }
});

/**
 * Creates a GeoJSON layer
 *
 * @constructor
 * @extends gbi.Layers.Vector
 * @param options All OpenLayers.Layer.Vector options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html|OpenLayers.Layer.Vector}
 * @param {String} options.url Location of GeoJSON
 */
gbi.Layers.GeoJSON = function(options) {
    var defaults = {};
    var geoJSONExtension = {};

    this.format = new OpenLayers.Format.GeoJSON();

    var featureCollection = options.featureCollection || false;
    if(!featureCollection) {
        geoJSONExtension = {
            protocol: new OpenLayers.Protocol.HTTP({
                url: options.url,
                format: this.format
            }),
            strategies: [
                new OpenLayers.Strategy.Fixed()
            ]
        };
    }
    gbi.Layers.Vector.call(this, $.extend({}, defaults, options, geoJSONExtension));
    if(featureCollection) {
        this.addFeatureCollection(featureCollection);
    }
};
gbi.Layers.GeoJSON.prototype = new gbi.Layers.Vector();
$.extend(gbi.Layers.GeoJSON.prototype, {
    CLASS_NAME: 'gbi.Layers.GeoJSON',
    addFeatureCollection: function(featureCollection) {
        this.addFeatures(this.format.read(featureCollection));
    }
});

/**
 * Baseclass for saveable vector layers
 *
 * @class
 * @abstract
 * @param options All OpenLayers.Layer.Vector options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html|OpenLayers.Layer.Vector}
 * @param [options.callbacks]
 * @param {Function[]} [options.callbacks.changes] Callbacks called when save status changes
 * @param {Function[]} [options.callbacks.start] Callbacks called when transaction has started
 * @param {Function[]} [options.callbacks.success] Callbacks called when transaction was successfull
 * @param {Function[]} [options.callbacks.fail] Callbacks called when transaction has failed
 */
gbi.Layers.SaveableVector = function(options) {
    var self = this;
    this.saveStrategy = new OpenLayers.Strategy.Save();
    this.saveStrategy.events.register('start', this, this._start);
    this.saveStrategy.events.register('success', this, this._success);
    this.saveStrategy.events.register('fail', this, this._fail);

    this.callbacks = {};
    if(options && options.callbacks) {
        var self = this;
        $.each(options.callbacks, function(key, callbacks) {
            if(!$.isArray(callbacks)) {
                callbacks = [callbacks];
            }
            self._addCallbacks(key, callbacks);
        });
        delete options.callbacks;
    }

    if(options) {
        options.strategies.push(this.saveStrategy);
    }

    gbi.Layers.Vector.call(this, options);

    this.loaded = false;
    this.unsavedFeatureChanges = false;

    this.olLayer.events.register('loadend', '', function(response) {
        self.unsavedFeatureChanges = false;
        if(response && response.object && response.object.features.length == 0) {
            self.loaded = true;
            $(this).trigger('gbi.layer.saveableVector.loadFeaturesEnd');
        }
        self.olLayer.events.register('featureadded', self, self._trackStatus);
        self.olLayer.events.register('featureremoved', self, self._trackStatus);
        self.olLayer.events.register('afterfeaturemodified', self, self._trackStatus);


        self.features = self.olLayer.features;
    });

    $(this).on('gbi.layer.vector.featureAttributeChanged', function(event, feature) {
        if(feature.state != OpenLayers.State.INSERT) {
            feature.state = OpenLayers.State.UPDATE;
        }
        self.changesMade();
    });

};
gbi.Layers.SaveableVector.prototype = new gbi.Layers.Vector();
$.extend(gbi.Layers.SaveableVector.prototype, {
    CLASS_NAME: 'gbi.Layers.SaveableVector',
    /**
     * Saves all changes
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     */
    save: function() {
        this.unSelectAllFeatures();
        this.saveStrategy.save();
    },
    /**
     * Registers a callback
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @param {String} key Event to bind
     * @param {Function} callback Function to call
     */
    registerCallback: function(key, callback) {
        this._addCallbacks(key, [callback]);
    },
    /**
     * Unregisters a callback
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @param {String} key Event to unbind
     * @param {Function} callback Function to remove
     */
    unregisterCallback: function(key, callback) {
        if(this.callbacks[key]) {
            var idx = $.inArray(callback, this.callbacks[key])
            if(idx > -1) {
                this.callbacks[key].splice(idx, 1);
            }
        }
    },
    /**
     * Adds callbacks
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @private
     * @param {String} key Event to bind
     * @param {Function[]} Functions to call
     */
    _addCallbacks: function(key, callbacks) {
        if(this.callbacks[key]) {
            this.callbacks[key] = this.callbacks[key].concat(callbacks);
        } else {
            this.callbacks[key] = callbacks;
        }
    },
    /**
     * Callback called when save status changes
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @private
     */
    _change: function() {
        if(this.callbacks.changes) {
            var self = this;
            $.each(this.callbacks.changes, function(idx, callback) {
                callback.call(self, self.unsavedChanges());
            });
        }
    },
    /**
     * Callback called when transaction starts
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @private
     */
    _start: function(response) {
        if(this.callbacks.start) {
            var self = this;
            $.each(this.callbacks.start, function(idx, callback) {
                callback.call(self);
            });
        }
    },
    /**
     * Callback called when transaction was successfull
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @private
     */
    _success: function(response) {
        this.unsavedFeatureChanges = false;
        this._change();
        if(this.callbacks.success) {
            var self = this;
            $.each(this.callbacks.success, function(idx, callback) {
                callback.call(self);
            });
        }
    },
    /**
     * Callback called when transaction has failed
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @private
     */
    _fail: function(response) {
        if(this.callbacks.fail) {
            var self = this;
            $.each(this.callbacks.fail, function(idx, callback) {
                callback.call(self);
            });
        }
    },
    /**
     * Callback called when feature was added, removed, edited
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @private
     */
    _trackStatus: function(e) {
        if (e.feature && (e.feature.state == OpenLayers.State.DELETE || e.feature.state == OpenLayers.State.UPDATE || e.feature.state == OpenLayers.State.INSERT)) {
            //XXXkai: set unsavedChanges to false when new feature inserted and then deleted?
            this.unsavedFeatureChanges = true;
            $(this).trigger('gbi.layer.saveableVector.unsavedChanges');
            this._change();
        }
    },
    /**
     * Tells SaveableVector that something has changed
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     */
    changesMade: function() {
        this.unsavedFeatureChanges = true;
        this._change();
    },
    /**
     * Checks if new or edited features unsaved
     *
     * @memberof gbi.Layers.SaveableVector
     * @instance
     * @returns {Boolean} unsaved feature changes
     */
    unsavedChanges: function() {
        return this.unsavedFeatureChanges;
    }
});

/**
 * Creates a Couch layer
 *
 * @constructor
 * @extends gbi.Layers.SaveableVector
 * @param opitons All OpenLayers.Layer.Vector options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html|OpenLayers.Layer.Vector}
 * @param {Boolean} [options.createDB=true] Creates a couchDB if not exists
 * @param {Boolean} [options.loadStyle=true] Loads layer style from couchDB if exists
 * @param {Boolean} [options.loadGBI=true] Loads layer gbi_editor from couchDB if exists
 */
gbi.Layers.Couch = function(options) {
    var self = this;
    var defaults = {
        readExt: '_design/features/_view/all?&include_docs=true',
        bulkExt: '_bulk_docs?include_docs=true',
        createDB: true
    };
    options = $.extend({}, defaults, options);

    this.format = new OpenLayers.Format.JSON();

    var nameLowerCase = options.name.toLowerCase();

    this.couchUrl = options.url;
    // options.url += nameLowerCase.replace(/[^a-z0-9]*/g, '') + '/';
    options.url += nameLowerCase + '/';

    var couchExtension = {
        protocol: new OpenLayers.Protocol.CouchDB({
            url: options.url,
            readExt: options.readExt,
            bulkExt: options.bulkExt,
            format: new OpenLayers.Format.CouchDB()
        }),
        strategies: [
            new OpenLayers.Strategy.Fixed()
        ]
    };

    delete options.readExt;
    delete options.bulkExt;

    gbi.Layers.SaveableVector.call(this, $.extend(true, {}, defaults, options, couchExtension));

    this.metadataDocument = {
        title: self.options.name,
        type: 'GeoJSON',
        appOptions: {}
    };

    this.views = {
        'features': {
            'data':  {
                'language': 'javascript',
                'views': {
                    'all': {
                        'map': 'function(doc) {if (doc.type == "Feature") {emit(doc.type, doc.drawType); } }'
                    }
                }
            }
        },
        'savepoints': {
            'data':  {
                'language': 'javascript',
                'views': {
                    'all': {
                        'map': 'function(doc) {if (doc.type == "savepoint") {emit(doc.title, doc._rev); } }'
                    }
                }
            }
        }
    }


    if(this.options.createDB) {
        this._createCouchDB();
    }

    this.registerEvent('featuresadded', this, function() {
        self.loaded = true;
        self.features = self.olLayer.features;
            $(this).on('gbi.layer.vector.featureAttributeChanged', function() {
        self.unsavedFeatureChanges = true;
        });
        $(this).on('gbi.layer.vector.gbi.layer.vector.styleChanged', function() {
            self.unsavedMetaChanges = true;
        });
        $(this).on('gbi.layer.vector.gbi.layer.vector.ruleChanged', function() {
            self.unsavedMetaChanges = true;
        });
        $(this).on('gbi.layer.vector.gbi.layer.vector.listAttributesChanged', function() {
            self.unsavedMetaChanges = true;
        });
        $(this).on('gbi.layer.vector.gbi.layer.vector.popupAttributesChanged', function() {
            self.unsavedMetaChanges = true;
        });
        $(this).on('gbi.layer.vector.schemaLoaded', function() {
            self.unsavedMetaChanges = true;
        })
        $(this).trigger('gbi.layer.couch.loadFeaturesEnd');
    });

    this._loadMetaDocument();
};
gbi.Layers.Couch.prototype = new gbi.Layers.SaveableVector();
$.extend(gbi.Layers.Couch.prototype, {
    CLASS_NAME: 'gbi.Layers.Couch',
    /**
     * Prepare style document data for insert into couch
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     * @returns {Object} styleData
     */
    _prepareStylingData: function() {
        return this.customStyle ? $.extend(true, {}, this.symbolizers) : undefined;
    },
    /**
     * Prepares gbi_editor document data for insert into couch
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     * @returns {Object} gbiData
     */
    _prepareThematicalData: function() {
        var self = this;
        var thematicalData = {};

        if(this.featureStylingRule) {
            thematicalData = $.extend(true, {}, this.featureStylingRule);
            if(thematicalData.filters) {
                $.each(thematicalData.filters, function(idx, filter) {
                    delete filter['olFilter'];
                });
            }
            return thematicalData;
        }
    },
    _prepareAttributeListsData: function() {
        var lists = {};
        if(this._popupAttributes.length > 0) {
            lists['popupAttributes'] = this._popupAttributes;
        }

        if(this._shortListAttributes.length > 0) {
            lists['shortListAttributes'] = this._shortListAttributes
        }
        if(this._fullListAttributes.length > 0) {
            lists['fullListAttributes'] = this._fullListAttributes
        }
        return lists.popupAttributes || lists.shortListAttributes || lists.fullListAttributes ? lists : undefined;
    },
    _prepareJsonSchemaData: function() {
        if(this.jsonSchema) {
            return {
                "url": this.options.jsonSchemaUrl,
                "schema": this.jsonSchema
            }
        }
    },
    _saveMetaDocument: function() {
        var self = this;
        self._createMetadataDocument(self);

        OpenLayers.Request.PUT({
            url: self.options.url + 'metadata',
            async: false,
            header: {
                'Content-Type': 'application/json'
            },
            data: self.format.write(self.metadataDocument),
            success: function(response) {
                self.unsavedMetaChanges = false;
                var jsonResponse = self.format.read(response.responseText);
                if(jsonResponse.rev) {
                    self.metadataDocument._rev = jsonResponse.rev;
                }
            }
        });
    },
    _useMetaData: function(self, triggerEvent) {
        var self = self;
        if(self.metadataDocument.appOptions != undefined) {
            // load ol styling or set default styling if not in metadata
            if(self.metadataDocument.appOptions.olDefaultStyle != undefined) {
                self.setStyle(self.metadataDocument.appOptions.olDefaultStyle);
            } else {
                self.setStyle(self.default_symbolizers);
                self.customStyle = false;
            }

            if(self.metadataDocument.appOptions.gbiThematicalMap != undefined) {
                self.addAttributeFilter(
                    self.metadataDocument.appOptions.gbiThematicalMap.filterType,
                    self.metadataDocument.appOptions.gbiThematicalMap.filterAttribute,
                    self.metadataDocument.appOptions.gbiThematicalMap.filters
                );
            } else {
                self.featureStylingRule = false;
                self.deactivateFeatureStylingRule();
            }


            if(self.metadataDocument.appOptions.gbiAttributeLists != undefined) {
                if(self.metadataDocument.appOptions.gbiAttributeLists.popupAttributes != undefined) {
                    self.popupAttributes(self.metadataDocument.appOptions.gbiAttributeLists.popupAttributes);
                } else {
                    self.popupAttributes([]);
                }

                if(self.metadataDocument.appOptions.gbiAttributeLists.shortListAttributes != undefined) {
                    self.shortListAttributes(self.metadataDocument.appOptions.gbiAttributeLists.shortListAttributes);
                } else {
                    self.shortListAttributes([]);
                }

                if(self.metadataDocument.fullListAttributes != undefined) {
                    self.fullListAttributes(self.metadataDocument.appOptions.gbiAttributeLists.fullListAttributes);
                } else {
                    self.fullListAttributes([]);
                }
            } else {
                self.popupAttributes([]);
                self.shortListAttributes([]);
                self.fullListAttributes([]);
            }


            if(self.metadataDocument.appOptions.jsonSchema != undefined) {
                self.options.jsonSchemaUrl = self.metadataDocument.appOptions.jsonSchema.url;
                self.jsonSchema = self.metadataDocument.appOptions.jsonSchema.schema;
            }
        }

        if (triggerEvent) {
            $(this).trigger('gbi.layer.vector.loadMetaData')
        }
        self.unsavedMetaChanges = false;
    },

    _loadMetaDocument: function() {
        var self = this;
        var request = OpenLayers.Request.GET({
            url: this.options.url + 'metadata',
            async: false,
            headers: {
                'contentType': 'application/json'
            },
            success: function(response) {
                self.metadataDocument = self.format.read(response.responseText);
                self._useMetaData(self)
            }
        });
    },
    _createMetadataDocument: function(self) {
        if (self.metadataDocument.appOptions == undefined) {
            self.metadataDocument['appOptions'] = {}
        }
        self.metadataDocument.appOptions['olDefaultStyle'] = self._prepareStylingData();
        self.metadataDocument.appOptions['gbiThematicalMap'] = self._prepareThematicalData();
        self.metadataDocument.appOptions['gbiAttributeLists'] = self._prepareAttributeListsData();
        self.metadataDocument.appOptions['jsonSchema'] = self._prepareJsonSchemaData();
    },
    /**
     * Creates default documents needed in couchDB for couch layer
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _createMetaDocument: function(withData) {
        var self = this;

        if(withData) {
            self._createMetadataDocument();
        }

        OpenLayers.Request.PUT({
            url: self.options.url + 'metadata',
            async: false,
            headers: {
                'Content-Type': 'application/json'
            },
            data: self.format.write(self.metadataDocument),
            success: function(response) {
                self.unsavedMetaChanges = false;
                var jsonResponse = self.format.read(response.responseText);
                if(jsonResponse.rev) {
                    self.metadataDocument._rev = jsonResponse.rev;
                }
                $(self).trigger('gbi.layers.couch.created');
            }
        });

    },
    /**
     * Create the views for the couch layer
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _createViews: function() {
        var self = this;

        $.each(self.views, function(name, obj) {
            OpenLayers.Request.PUT({
                url: self.options.url + '/_design/'+name,
                async: false,
                headers: {
                        'Content-Type': 'application/json'
                },
                data: self.format.write(obj.data)
            });
        });
    },
    /**
     * Removes couchDB for this layer and destroys the layer
     *
     * @memberof gbi.Layers.Couch
     * @instance
     */
    destroy: function() {
        this._deleteCouchDB();
        gbi.Layers.SaveableVector.prototype.destroy.apply(this)
    },
    /**
     * Removes the couchDB for this layer
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _deleteCouchDB: function() {
        OpenLayers.Request.DELETE({
            url: this.options.url,
            async: false,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },
    /**
     * Checks if couchDB for this layer exists. If not, create couchDB
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _createCouchDB: function(withData) {
        var self = this;
        //GET to see if couchDB already exist
        OpenLayers.Request.GET({
            url: this.options.url,
            async: false,
            failure: function(response) {
                // create new couchdb
                OpenLayers.Request.PUT({
                    url: self.options.url,
                    async: false,
                    success: function(response) {
                        self._createMetaDocument(withData);
                        self._createViews();
                    }
                });
            },
            success: function(response) {
                var jsonFormat = new OpenLayers.Format.JSON();
                var doc = jsonFormat.read(response.responseText);
                if (doc.error = 'not_found') {
                    OpenLayers.Request.PUT({
                        url: self.options.url,
                        async: false,
                        success: function(response) {
                            self._createMetaDocument(withData);
                            self._createViews();
                        }
                    });
                } else {
                    self.couchExists = true;
                }
            }
        });
    },
    /**
     * Reload layer from couch
     *
     * @memberof gbi.Layers.Couch
     * @instance
     */
    refresh: function() {
        this._loadMetaDocument();
        gbi.Layers.SaveableVector.prototype.refresh.apply(this)
    },
    /**
     * Returns if layer has unsaved changes
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @returns {Boolean} unsaved changes
     */
    unsavedChanges: function() {
        return this.unsavedFeatureChanges || this.unsavedMetaChanges;
    },
    /**
     * Returns a clone of this layer with a new name
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @param {String} newName
     * @param {Boolean} [createDB=false] createDB
     * @returns {gbi.Layers.Couch} The clone
     */
    clone: function(newName, createDB) {
        var self = this;
        var copyOptions = $.extend(true, {}, self.options, {
            name: newName,
            url: self.couchUrl,
            symbolizers: self.symbolizers,
            createDB: false,
            loadStyle: false,
            loadGBI: false,
            visibility: false
        });
        var layerCopy = new gbi.Layers.Couch(copyOptions);
        layerCopy.olLayer.setMap(self.olLayer.map);

        layerCopy.featureStylingRule = $.extend(true, {}, self.featureStylingRule)
        if(self._popupAttributes.length > 0) {
            layerCopy._popupAttributes = self._popupAttributes.slice();
        }
        if(self._shortListAttributes.length > 0) {
            layerCopy._shortListAttributes = self._shortListAttributes.slice();
        }
        if(self._fullListAttributes.length > 0) {
            layerCopy._fullListAttributes = self._fullListAttributes.slice();
        }

        var features = [];
        $.each(self.features, function(idx, feature) {
            if(feature.state == OpenLayers.State.DELETE) {
                return true;
            }
            newFeature = feature.clone()
            newFeature.state = OpenLayers.State.INSERT;
            features.push(newFeature);
        });
        layerCopy.addFeatures(features);

        if(createDB) {
            $(layerCopy).on('gbi.layers.couch.created', function() {
                layerCopy.save();
            });
            layerCopy._createCouchDB(true);
        }
        return layerCopy;
    },
    /**
     * create a save point in the database and returns the statustext
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @returns responseText
     */
    setSavepoint: function() {
        var self = this;
        var couchFormat = new OpenLayers.Format.CouchDB();

        var complete_data = [];
        for(var i=0; i<self.features.length; i++) {
            var geojson = couchFormat._prepareGeoJSON(this.features[i]);
            complete_data[i] = {
                '_id' : self.features[i].fid,
                'doc': geojson
            }
        }

        // add metadata so savepoint
        self._createMetadataDocument(self);
        complete_data.push(self.metadataDocument)

        var now = new Date();
        var datetime = now.format("yyyy-mm-dd HH-MM-ss");

        var complete_data = {
            'rows' : complete_data,
            'title': datetime,
            'type': 'savepoint'
        }

        var request = OpenLayers.Request.PUT({
            url: self.options.url + '/savepoint_'+ datetime,
            async: false,
            headers: {
                'Content-Type': 'application/json'
            },
            data: self.format.write(complete_data)
        });

        if (request) {
            return self.format.read(request.responseText);
        } else {
            return {"error": "request not possible"}
        }
    },
    /**
     * load the geometries from the savepoint and add it to the layer
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @param {String} id
     * @returns responseText
     */
    loadSavepoint: function(id) {
        var self = this;
        var couchFormat = new OpenLayers.Format.CouchDB();

        var request = OpenLayers.Request.GET({
            url: self.options.url + '/' + id,
            async: false,
            headers: {
                'contentType': 'application/json'
            },
            success: function(response) {
                for(var i=0; i < self.features.length; i++) {
                    self.features[i].state = OpenLayers.State.DELETE;
                    self.features[i].renderIntent = "select";
                    if (self.features[i].style) {
                        delete self.features[i].style;
                    }
                    self.olLayer.drawFeature(self.features[i]);
                }
                // load metadata document
                var jsonFormat = new OpenLayers.Format.JSON();
                var doc = jsonFormat.read(response.responseText);
                var metadataDocument;
                for(var i=0; i < doc.rows.length; i++) {
                    if (doc.rows[i]._id == 'metadata') {
                        metadataDocument = doc.rows[i]
                    }
                }

                var rev;
                if (self.metadataDocument._rev) {
                    rev = self.metadataDocument._rev
                }
                self.metadataDocument = metadataDocument
                if (rev) {
                    self.metadataDocument._rev = rev;
                }
                self._useMetaData(self, tiggerEvent=true)

                // add features
                var featuresAdded = couchFormat.read(response.responseText);
                for(var i=0; i < featuresAdded.length; i++) {
                    featuresAdded[i].state = OpenLayers.State.INSERT;
                    delete featuresAdded[i]._rev
                };
                self.addFeatures(featuresAdded);
            }

        });

        if (request) {
            return self.format.read(request.responseText);
        } else {
            return {"error": "request not possible"}
        }
    },
    /**
     * delete the savepoint
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @param {String} id
     * @returns responseText
     */
    deleteSavepoint: function(id, rev) {
        var self = this;
        var request = OpenLayers.Request.DELETE({
            url: self.options.url + '/' + id,
            async: false,
            headers: {
                'contentType': 'application/json'
            },
            params: {'rev': rev }
        });

        if (request) {
            return self.format.read(request.responseText);
        } else {
            return {"error": "request not possible"}
        }
    },
    /**
     * load the all savepoints from the couchdb and returns the repsonsetext as json
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @returns responseText (json)
     */
    getSavepoints: function() {
        var self = this;
        var request = OpenLayers.Request.GET({
            url: self.options.url + '/_design/savepoints/_view/all',
            async: false,
            headers: {
                'contentType': 'application/json'
            }
        });

        if (request) {
            return self.format.read(request.responseText);
        } else {
            return {"error": "request not possible"}
        }
    }
});

/**
 * Creates a WFS-T layer
 *
 * @constructor
 * @extends gbi.Layers.SaveableVector
 * @param options All OpenLayers.Layer.Vector options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html|OpenLayers.Layer.Vector}
 * @param {String} options.featureNS Namespace
 * @param {String} options.featureType Layername
 * @param {String} options.geometryName Name of geometry column
 * @param {Integer} [options.maxFeatures=500]
 * @param {String} options.typename
 * @param {String} [options.srsName=EPSG:3857] EPSG code of WFS source
 */
gbi.Layers.WFST = function(options) {
    var defaults = {
        featureNS: '',
        featureType: '',
        geometryName: '',
        version: '1.1.0',
        maxFeatures: 500,
        typename: '',
        srsName: 'EPSG:3857'
    };
    options = $.extend({}, defaults, options);
    var wfsExtension = {
        protocol: new OpenLayers.Protocol.WFS({
            version: '1.1.0_ordered',
            url: options.url,
            srsName: options.srsName,
            featureNS: options.featureNS,
            featureType: options.featureType,
            geometryName: options.geometryName,
            schema: options.url + 'service=wfs&request=DescribeFeatureType&version='+options.version+'&typename='+options.typename+':'+options.featureType,
            maxFeatures: options.maxFeatures,
            typename: options.typename + ':' + options.featureType
        }),
        strategies: [
            new OpenLayers.Strategy.BBOX()
        ]
    };
    delete options.jsonSchema;
    delete options.jsonSchemaUrl;
    gbi.Layers.SaveableVector.call(this, $.extend({}, defaults, options, wfsExtension));
};
gbi.Layers.WFST.prototype = new gbi.Layers.SaveableVector();
$.extend(gbi.Layers.WFST.prototype, {
    CLASS_NAME: 'gbi.Layers.WFST',
    /**
     * Adds a filter to the WFS-T request
     *
     * @memberof gbi.Layers.WFST
     * @instance
     * @param {String} property
     * @param {String, Array} value
     */
    filter: function(property, value, type) {
        var filterType;
        switch(type) {
            case 'like':
            default:
                filterType = OpenLayers.Filter.Comparison.LIKE;
                break;
        }
        if (!isArray(value)) {
            value = [value]
        }
        filters = []
        for (var i=0; i<value.length; i++)  {
            var search_value = value[i];
            filters.push(new OpenLayers.Filter.Comparison({
                type: filterType,
                property: property,
                value: search_value
            }))
        }
        this.olLayer.filter = new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.OR,
            filters: filters
        });
        this.olLayer.refresh({force: true});
    },
    /**
     * Removes all filter from layer
     *
     * @memberof gbi.Layers.WFST
     * @instance
     */
    removeFilter: function() {
        this.olLayer.filter = null;
        this.olLayer.refresh({force: true});
    },
    /**
     * Returns attributes defined in schema
     *
     * @memberof gbi.Layers.WFST
     * @instance
     * @returns {String[]} attributes
     */
    attributes: function() {
        var attributes = this.olLayer.protocol.attribute_order.slice();;
        // remove geometry column
        delete attributes[attributes.indexOf(this.options.geometryName)];
        return attributes;
    },
    /**
     * Returns type of given attribute
     *
     * @memberof gbi.Layer.WFST
     * @instance
     * @returns {String} attribute type
     */
    attributeType: function(attribute) {
        return this.olLayer.protocol.attribute_types[attribute];
    }
});
