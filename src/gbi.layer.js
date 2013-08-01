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
        visibility: true
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
     * @private
     */
    destroy: function() {
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
    CLASS_NAME: 'gbi.Layers.WMS'
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
        //XXXkai: clone in layer...!
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
        attributePopup: false,
        hoverPopup: false,
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

    this.features = this.olLayer.features;
    if(!this.options.styleMap) {
        this.symbolizers = $.extend(true, {}, default_symbolizers, this.options.symbolizers);
        this.setStyle(this.symbolizers);
    } else {
        this.symbolizers = this.options.styleMap.styles['default'].rules[0].symbolizer;
    }

    this.featureStylingRule = false;
    this.featureStylingRuleIndex = [];

    if(this.options.attributePopup) {
        this.registerEvent('featureselected', this, this._showPopup);
        this.registerEvent('featureunselected', this, this._removePopup);
    }

    //show popup when selectControl highlight a feature
    //selectControl must trigger events on layer
    if(this.options.hoverPopup) {
        this.registerEvent('featurehighlighted', this, this._showPopup);
        this.registerEvent('featureunhighlighted', this, this._removePopup);
    }
}
gbi.Layers.Vector.prototype = new gbi.Layers.Layer();
$.extend(gbi.Layers.Vector.prototype, {
    CLASS_NAME: 'gbi.Layers.Vector',
    /**
     * Sets the style of this layer
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {Object} symbolizers Object with styling informations. See {@link http://docs.openlayers.org/library/feature_styling.html|OpenLayers Styling}
     */
    setStyle: function(symbolizers) {
        $.extend(true, this.symbolizers, symbolizers);
        var style = new OpenLayers.Style();
        style.addRules([
            new OpenLayers.Rule({symbolizer: this.symbolizers})
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
        this.olLayer.redraw();
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
    addAttributeFilter: function(type, attribute, active, filterOptions) {
        var self = this;
        var rules = [];
        this.featureStylingRule = $.isArray(filterOptions) && filterOptions.length > 0 ? {
            type: type,
            attribute: attribute,
            active: active,
            filterOptions: filterOptions
        } : false;

        for(var i = this.olLayer.styleMap.styles.default.rules.length - 1; i >= 0; i--) {
            if(this.olLayer.styleMap.styles.default.rules[i].propertyFilter) {
                self.olLayer.styleMap.styles.default.rules.splice(i, 1);
            }
        }

        switch(type) {
            case 'exact':
                $.each(filterOptions, function(idx, filter) {
                    filter.olFilter = new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.EQUAL_TO,
                        property: attribute,
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
                $.each(filterOptions, function(idx, filter) {
                    var minFilter = false;
                    var maxFilter = false;
                    var olFilter = false;

                    if(OpenLayers.String.isNumeric(filter.min)) {
                        minFilter = new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
                            property: attribute,
                            value: OpenLayers.String.numericIf(filter.min)
                        });
                    }
                    if(OpenLayers.String.isNumeric(filter.max)) {
                        maxFilter = new OpenLayers.Filter.Comparison({
                            type: OpenLayers.Filter.Comparison.LESS_THAN,
                            property: attribute,
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
        $(gbi).trigger('gbi.layer.vector.ruleChanged', false);
        if(rules.length == 0 || !active) {
            this.olLayer.redraw();
            return;
        }

        this.olLayer.styleMap.styles.default.rules = this.olLayer.styleMap.styles.default.rules.concat(rules);

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

        if(this.featureStylingRule && this.featureStylingRule.attribute && this.featureStylingRule.filterOptions) {
            $.each(this.featureStylingRule.filterOptions, function(idx, filterOption) {
                if(!(filterOption.value || filterOption.min || filterOption.max) || !filterOption.olFilter) {
                    return true;
                }
                result[idx] = {
                    'color': filterOption.symbolizer.fillColor,
                    'value': filterOption.value,
                    'min': filterOption.min,
                    'max': filterOption.max,
                    'features': []
                };
            });
            $.each(this.olLayer.features, function(id, feature) {
                for(var i = self.featureStylingRule.filterOptions.length - 1; i >= 0; i--) {
                    var filterOption = self.featureStylingRule.filterOptions[i];
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
                attribute: this.featureStylingRule.attribute,
                type: this.featureStylingRule.type,
                result: result
            };
        }
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
     */
    changeFeatureAttribute: function(feature, attribute, value) {
        if(feature.attributes[attribute] != value) {
            feature.attributes[attribute] = value;
            $(gbi).trigger('gbi.layer.vector.featureAttributeChanged', feature);
        }
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
     * Getter/Setter of listAttributes
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @param {String[]} List of attributes
     * @returns {String[]} List of attributes
     */
    listAttributes: function(listAttributes) {
        if(listAttributes) {
            this._listAttributes = listAttributes;
            $(gbi).trigger('gbi.layer.vector.listAttributesChanged', false);
        }
        return this._listAttributes;
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
            $(gbi).trigger('gbi.layer.vector.popupAttributesChanged', false);
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
     * Displays a popup with feature attributes
     *
     * @memberof gbi.Layers.Vector
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector} f
     */
    _showPopup: function(f) {
        if(this.popup && f.feature == this.popupFeature) {
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
                container.append($('<div><span>'+attribute+': </span><span>'+ (attributes[attribute] || OpenLayers.i18n('notDefined')) +'</span></div>'));
            })
        } else {
            $.each(attributes, function(key, value) {
                container.append($('<div><span>'+key+':</span><span>'+value+'</span></div>'));
            });
        }
        return container.html();
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

    var geoJSONExtension = {
        protocol: new OpenLayers.Protocol.HTTP({
            url: options.url,
            format: new OpenLayers.Format.GeoJSON()
        }),
        strategies: [
            new OpenLayers.Strategy.Fixed()
        ]
    };

    gbi.Layers.Vector.call(this, $.extend({}, defaults, options, geoJSONExtension));
};
gbi.Layers.GeoJSON.prototype = new gbi.Layers.Vector();
$.extend(gbi.Layers.GeoJSON.prototype, {
    CLASS_NAME: 'gbi.Layers.GeoJSON'
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

    this.loaded = false;
    this.unsavedChanges = false;

    gbi.Layers.Vector.call(this, options);

    this.olLayer.events.register('loadend', '', function(response) {
        self.unsavedChanges = false;
        if(response && response.object && response.object.features.length == 0) {
            self.loaded = true;
        }
        self.olLayer.events.register('featureadded', self, self._trackStatus);
        self.olLayer.events.register('featureremoved', self, self._trackStatus);
        self.olLayer.events.register('afterfeaturemodified', self, self._trackStatus);

        self.features = self.olLayer.features;
    });

    $(gbi).on('gbi.layer.vector.featureAttributeChanged', function(event, feature) {
        feature.state = OpenLayers.State.UPDATE;
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
                callback.call(self, self.unsavedChanges);
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
        this.unsavedChanges = false;
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
            this.unsavedChanges = true;
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
        this.unsavedChanges = true;
        this._change();
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
 */
gbi.Layers.Couch = function(options) {
    var self = this;
    var defaults = {
        readExt: '_all_docs?include_docs=true',
        bulkExt: '_bulk_docs?include_docs=true',
        createDB: true,
        loadStyle: true
    };
    options = $.extend({}, defaults, options);

    this.haveCustomStyle = false;
    this.styleRev = false;

    this.format = new OpenLayers.Format.JSON();

    var nameLowerCase = options.name.toLowerCase();
    options.url += nameLowerCase.replace(/[^a-z0-9]*/g, '') + '/';

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

    gbi.Layers.SaveableVector.call(this, $.extend({}, defaults, options, couchExtension));

    if(this.options.createDB) {
        this._createCouchDB();
    }

    this.registerEvent('featuresadded', this, function() {
        self.loaded = true;
        self.features = self.olLayer.features;
        $(gbi).trigger('gbi.layer.couch.loadFeaturesEnd');
    });

    if(this.options.loadStyle) {
        this._loadStyle();
    }
};
gbi.Layers.Couch.prototype = new gbi.Layers.SaveableVector();
$.extend(gbi.Layers.Couch.prototype, {
    CLASS_NAME: 'gbi.Layers.Couch',
    /**
     * Loads styling informations from couchDB
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _loadStyle: function() {
        var self = this;
        var format = new OpenLayers.Format.JSON();
        var request = OpenLayers.Request.GET({
            url: this.options.url + 'style',
            async: false,
            headers: {
                'contentType': 'application/json'
            },
            success: function(response) {
                var responseObject = self.format.read(response.responseText);
                var rule = false;
                if(responseObject.rule != undefined) {
                    var rule = responseObject.rule;
                    delete responseObject.rule;
                }
                if(responseObject._rev != undefined) {
                    self.styleRev = responseObject._rev;
                    delete responseObject._rev;
                }
                delete responseObject._id;

                self.haveCustomStyle = Object.keys(responseObject).length > 0;

                self.setStyle(responseObject);
                if(rule) {
                    self.addAttributeFilter(rule.type, rule.attribute, rule.active, rule.filterOptions);
                }
            }
        });
    },
    /**
     * Prepares styling informations for insert into couchDB
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _saveStyle: function() {
        var stylingData = $.extend(true, {}, this.symbolizers);
        if(this.styleRev) {
            stylingData['_rev'] = this.styleRev;
        }
        if(this.featureStylingRule) {
            stylingData = this._addRule(stylingData);
        }
        this._saveStylingDate(stylingData);
    },
    /**
     * Saves thematical styling to couchDB
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _saveRule: function() {
        if(this.haveCustomStyle) {
            this._saveStyle();
        } else {
            var stylingData = this._addRule({});
            if(this.styleRev) {
                stylingData['_rev'] = this.styleRev;
            }
            this._saveStylingDate(stylingData);
        }
    },
    /**
     * Add thematical styling to stylingData
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     * @param {Object} stylingData without thematical data
     * @returns {Object} stylingData with thematical data
     */
    _addRule : function(stylingData) {
        if(!this.featureStylingRule) {
            return stylingData;
        }
        stylingData['rule'] = $.extend(true, {}, this.featureStylingRule);
        $.each(stylingData.rule.filterOptions, function(idx, filter) {
            delete filter['olFilter'];
        });
        return stylingData;
    },
    /**
     * Remove thematical styling before save stylingData to CouchDB
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _removeRule: function() {
        delete this.featureStylingRule;
        this._saveStyle()
    },
    /**
     * Store style document in CouchDB
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     * @param {Object} stylingData
     */
    _saveStylingDate: function(stylingData) {
        var self = this;
        var request = OpenLayers.Request.PUT({
            url: this.options.url + 'style',
            async: false,
            headers: {
                'Content-Type': 'application/json'
            },
            data: this.format.write(stylingData),
            success: function(response) {
                if(response.responseText) {
                    jsonResponse = self.format.read(response.responseText);
                    if(jsonResponse.rev) {
                        self.styleRev = jsonResponse.rev;
                    }
                }
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
    _createCouchDB: function() {
        var self = this;
        //GET to see if couchDB already exist
        OpenLayers.Request.GET({
            url: this.options.url,
            async: false,
            failure: function(response) {
                OpenLayers.Request.PUT({
                    url: self.options.url,
                    async: false,
                    success: function(response) {
                        self._createDefaultDocuments();
                    }
                });
            },
            success: function(response) {
                self.couchExists = true;
            }
        });
    },
    /**
     * Creates default documents needed in couchDB for couch layer
     *
     * @memberof gbi.Layers.Couch
     * @instance
     * @private
     */
    _createDefaultDocuments: function() {
        var metadata = {
            title: this.options.name,
            type: 'GeoJSON'
        }
        OpenLayers.Request.PUT({
            url: this.options.url + 'metadata',
            async: false,
            headers: {
                'Content-Type': 'application/json'
            },
            data: this.format.write(metadata)
        });
        OpenLayers.Request.PUT({
            url: this.options.url + 'style',
            async: false,
            headers: {
                'Content-Type': 'application/json'
            },
            data: this.format.write({})
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
    }
});

/**
 * Creates a WFS layer
 *
 * @constructor
 * @extends gbi.Layers.SaveableVector
 * @param options All OpenLayers.Layer.Vector options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Layer/Vector-js.html|OpenLayers.Layer.Vector}
 * @param {String} options.featureNS Namespace
 * @param {String} options.featureType
 * @param {String} options.geometryName Name of geometry column
 * @param {Integer} [options.maxFeatures=500]
 * @param {String} options.typename
 * @param {String} [options.srsName=EPSG:3857] EPSG code of WFS source
 */
gbi.Layers.WFS = function(options) {
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
    gbi.Layers.SaveableVector.call(this, $.extend({}, defaults, options, wfsExtension));
};
gbi.Layers.WFS.prototype = new gbi.Layers.SaveableVector();
$.extend(gbi.Layers.WFS.prototype, {
    CLASS_NAME: 'gbi.Layers.WFS',
    /**
     * Adds a filter to the WFS request
     *
     * @memberof gbi.Layers.WFS
     * @instance
     * @param {String} property
     * @param {String} value
     */
    filter: function(property, value, type) {
        var filterType;
        switch(type) {
            case 'like':
            default:
                filterType = OpenLayers.Filter.Comparison.LIKE;
                break;
        }
        this.olLayer.filter = new OpenLayers.Filter.Comparison({
            type: filterType,
            property: property,
            value: value
        });
        this.olLayer.refresh({force: true});
    }
});
