/**
 * Baseclass for toolbar element
 *
 * @class
 * @abstract
 * @param [options]
 * @param {Boolean} [options.toolbar] Control is displayed in toolbar
 */
gbi.Controls.ToolbarItem = function(options) {
    var defaults = {
        toolbar: true
    };
    this.disableable = false;
    this.options = $.extend({}, defaults, options);
    this.toolbar = this.options.toolbar;
    delete this.options.toolbar;
};
gbi.Controls.ToolbarItem.prototype = {
    CLASS_NAME: 'gbi.Controls.ToolbarItem',
    /**
     * Creates the OpenLayers.Control
     *
     * @memberof gbi.Controls.ToolbarItem
     * @instance
     */
    createControl: function() {
        if(this.layer) {
            this.olControl = this._createControl();
            this.dummyControl = false;
        } else {
            this.olControl = new OpenLayers.Control(this.options);
            this.olControl.activate = function() {};
            this.olControl.trigger = function() {};
            this.dummyControl = true;
            if(this.disableable == true) {
                this.olControl.displayClass = 'itemDisabled ' + this.olControl.displayClass;
            }
        }
    },
    /**
     * Reassign control already placed in a toolbar
     *
     * @memberof gbi.Controls.ToolbarItem
     * @instance
     * @param {gbi.Layer} layer
     */
    replaceToolbarControl: function(layer) {
        this.layer = layer;
        OpenLayers.Util.removeItem(this.olToolbar.controls, this.olControl);
        this.createControl();
        this.olToolbar.addControls([this.olControl]);
    },
    /**
     * Gets active status of control
     *
     * @memberof gbi.Controls.ToolbarItem
     * @instance
     */
    active: function() {
        return this.olControl.active;
    },
    /**
     * Activates the control
     *
     * @memberof gbi.Controls.ToolbarItem
     * @instance
     */
    activate: function() {
        this.olControl.activate();
    },
    /**
     * Deactivates the control
     *
     * @memberof gbi.Controls.ToolbarItem
     * @instance
     */
    deactivate: function() {
        this.olControl.deactivate();
    },
    /**
     * Registers an event
     *
     * @memberof gbi.Controls.ToolbarItem
     * @instance
     * @param {String} type event name
     * @param {Object} obj "this" in func contrext
     * @param {Function} func Called when event is triggered
     */
    registerEvent: function(type, obj, func) {
        this.olControl.events.register(type, obj, func);
    },
    /**
     * Unregisters an event
     *
     * @memberof gbi.Controls.ToolbarItem
     * @instance
     * @param {String} type event name
     * @param {Object} obj "this" in func contrext
     * @param {Function} func Function given to {registerEvent}
     */
    unregisterEvent: function(type, obj, func) {
        this.olControl.events.unregister(type, obj, func);
    }
};

/**
 * Creates a draw control
 *
 * @extends gbi.Controls.ToolbarItem
 * @constructor
 * @param {gbi.Layers.VectorLayer} layer
 * @param [options] All OpenLayers.Control.DrawFeature options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/DrawFeature-js.html|OpenLayers.Control.DrawFeature}
 * @param {Constant} options.drawType Type of drawn feature
 * @param {Boolean} options.selectDrawn Select last drawn feature
 */
gbi.Controls.Draw = function(layer, options) {
    var defaults = {
        title: OpenLayers.i18n("Draw polygon"),
        displayClass: "olControlDrawFeaturePolygon",
        selectDrawn: true
    };
    gbi.Controls.ToolbarItem.call(this, $.extend({}, defaults, options));
    this.layer = layer;

    this.options.drawType = this.options.drawType || '';
    this.drawHandler;
    switch(this.options.drawType.toLowerCase()) {
        case gbi.Controls.Draw.TYPE_POINT:
            this.drawHandler = OpenLayers.Handler.Point;
            this.options.displayClass = "olControlDrawFeaturePoint";
            this.options.title = OpenLayers.i18n("Draw point");
            break;
        case gbi.Controls.Draw.TYPE_LINE:
            this.drawHandler = OpenLayers.Handler.Path;
            this.options.displayClass = "olControlDrawFeatureLine";
            this.options.title = OpenLayers.i18n("Draw line");
            break;
        case gbi.Controls.Draw.TYPE_RECT:
            this.drawHandler = OpenLayers.Handler.RegularPolygon;
            this.options.displayClass = "olControlDrawFeatureRect";
            this.options.title = OpenLayers.i18n("Draw rect");
            this.options.handlerOptions = $.extend({}, {
                    sides: 4,
                    irregular: true
                }, this.options.handlerOptions);
            break;
        case gbi.Controls.Draw.TYPE_POLYGON:
        default:
            this.drawHandler = OpenLayers.Handler.Polygon;
            break;
    };
    this.createControl();
};
/**
 * Draw type for polygons
 *
 * @constant
 */
gbi.Controls.Draw.TYPE_POLYGON = 'polygon';
/**
 * Draw type for rectangles
 *
 * @constant
 */
gbi.Controls.Draw.TYPE_RECT = 'rect';
/**
 * Draw type for lines
 *
 * @constant
 */
gbi.Controls.Draw.TYPE_LINE = 'line';
/**
 * Draw type for rectangles
 *
 * @constant
 */
gbi.Controls.Draw.TYPE_POINT = 'point';
gbi.Controls.Draw.prototype = new gbi.Controls.ToolbarItem();
$.extend(gbi.Controls.Draw.prototype, {
    CLASS_NAME: 'gbi.Controls.Draw',
    /**
     * Sets the layer to draw in
     *
     * @memberof gbi.Controls.Draw
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    changeLayer: function(layer) {
        this.layer = layer;
        if(this.dummyControl || !layer) {
            this.replaceToolbarControl(layer);
        } else {
            this.olControl.layer = layer.olLayer;
            this._olSelectControl.setLayer(layer.olLayer);
        }
    },
    /**
     * Creates the OpenLayers.Control.DrawFeature control
     *
     * @memberof gbi.Controls.Draw
     * @instance
     * @private
     */
    _createControl: function() {
        var self = this;
        var olControl = new OpenLayers.Control.DrawFeature(this.layer.olLayer, this.drawHandler, this.options)

        olControl.events.register('featureadded', this, this._featureAdded)
        this._olSelectControl = new OpenLayers.Control.SelectFeature(this.layer.olLayer);
        return olControl;
    },
    /**
     * Callback after feature is added
     *
     * @memberof gbi.Controls.Draw
     * @instance
     * @private
     */
    _featureAdded: function(f) {
        f.feature._drawType = this.options.drawType.toLowerCase();
        if(this.options.selectDrawn) {
            this._olSelectControl.unselectAll();
            this._olSelectControl.select(f.feature);
        }
    },
});

/**
 * Creates a edit control
 *
 * @extends gbi.Controls.ToolbarItem
 * @constructor
 * @param {gbi.Layers.VectorLayer} layer
 * @param opitons All OpenLayers.Control.ModifyFeature options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/ModifyFeature-js.html|OpenLayers.Control.ModifyFeature}
 */
gbi.Controls.Edit = function(layer, options) {
    var defaults = {
        standalone: false,
        displayClass: "olControlModifyFeature",
        title: OpenLayers.i18n("Edit feature")
    };
    gbi.Controls.ToolbarItem.call(this, $.extend({}, defaults, options));
    this.layer = layer;
    this._draggable = 0;
    this.createControl();
};
gbi.Controls.Edit.prototype = new gbi.Controls.ToolbarItem();
$.extend(gbi.Controls.Edit.prototype, {
    CLASS_NAME: 'gbi.Controls.Edit',
    /**
     * Sets the layer to edit in
     *
     * @memberof gbi.Controls.Edit
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    changeLayer: function(layer) {
        if(this.dummyControl || !layer) {
            this.replaceToolbarControl(layer);
        } else {
            this.layer.olLayer.events.unregister('beforefeaturemodified', this, this._beforeModified);
            this.layer = layer;
            this.olControl.layer = layer.olLayer;
            this.olControl.dragControl.layer = layer.olLayer;
            this.olControl.dragControl.handlers.feature.layer = layer.olLayer;
            if(this.olControl.standalone === false) {
                this.olControl.selectControl.setLayer(layer.olLayer);
            }
        }
    },
    /**
     * Allow features to be draggable
     *
     * @memberof gbi.Controls.Edit
     * @instance
     * @param {Boolean} allow
     */
    draggable: function(allow) {
        this._draggable = allow ? OpenLayers.Control.ModifyFeature.DRAG : 0;
    },
    /**
     * Creates the OpenLayers.Control.ModifyFeature control
     *
     * @memberof gbi.Controls.Edit
     * @instance
     * @private
     */
    _createControl: function() {
        var self = this;
        var olControl = new OpenLayers.Control.ModifyFeature(this.layer.olLayer, this.options);
        olControl.activate = function() {self._activateExtension()};
        olControl.deactivate = function() {self._deactivateExtension()};
        return olControl;
    },
    /**
     * Callback before feature is modified
     *
     * @memberof gbi.Controls.Edit
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector} f
     */
    _beforeModified: function(f) {
        if(f.feature._drawType == gbi.Controls.Draw.TYPE_RECT) {
            this.olControl.mode = this._draggable | OpenLayers.Control.ModifyFeature.RESIZE | OpenLayers.Control.ModifyFeature.RESHAPE;
            this.olControl.preserveAspectRatio = true;
        } else {
            this.olControl.mode = this._draggable | OpenLayers.Control.ModifyFeature.RESHAPE;
        }
    },
    /**
     * Extends OpenLayers.Control.ModifyFeature.activate
     * @memberof gbi.Controls.Edit
     * @instance
     * @private
     */
    _activateExtension: function() {
        this.layer.olLayer.events.register('beforefeaturemodified', this, this._beforeModified);
        OpenLayers.Control.ModifyFeature.prototype.activate.apply(this.olControl, arguments);

        var vectorLayers = [];
        for(var i=0; i<this.olControl.map.layers.length; i++) {
            if(this.olControl.map.layers[i].CLASS_NAME == 'OpenLayers.Layer.Vector') {
                vectorLayers.push(this.olControl.map.layers[i]);
            }
        }
        var selectedFeature = (this.layer.olLayer.selectedFeatures.length > 0) ? this.layer.olLayer.selectedFeatures[0] : null;

        var selectControl = new OpenLayers.Control.SelectFeature(vectorLayers);
        selectControl.unselectAll({except: selectedFeature});
        selectControl.destroy();

        if(selectedFeature) {
            this._beforeModified({feature: selectedFeature});
            this.olControl.selectFeature(selectedFeature);
        }
    },
    /**
     * Extends OpenLayers.Control.ModifyFeature.deactivate
     * @memberof gbi.Controls.Edit
     * @instance
     * @private
     */
    _deactivateExtension: function () {
        this.layer.olLayer.events.unregister('beforefeaturemodified', this, this._beforeModified);
        OpenLayers.Control.ModifyFeature.prototype.deactivate.apply(this.olControl, arguments);
    }
});

/**
 * Creates a delete control
 *
 * @extends gbi.Controls.ToolbarItem
 * @constructor
 * @param {gbi.Layers.VectorLayer} layer
 * @param options All {OpenLayers.Control.DeleteFeature} options are allowed.
 */
gbi.Controls.Delete = function(layer, options) {
    var defaults = {
        displayClass: "olControlDeleteFeature",
        title: OpenLayers.i18n("Delete feature")
    };
    gbi.Controls.ToolbarItem.call(this, $.extend({}, defaults, options));

    this.disableable = true;
    this.layer = layer;
    this.createControl();
};
gbi.Controls.Delete.prototype = new gbi.Controls.ToolbarItem();
$.extend(gbi.Controls.Delete.prototype, {
    CLASS_NAME: 'gbi.Controls.Delete',
    /**
     * Sets the layer to delete in
     *
     * @memberof gbi.Controls.Delete
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    changeLayer: function(layer) {
        if(this.dummyControl || !layer) {
            this.replaceToolbarControl(layer);
        } else {
            this.olControl.setLayer(layer.olLayer);
        }
    },
    /**
     * Creates the OpenLayers.Control.DeleteFeature control
     *
     * @memberof gbi.Controls.Delete
     * @instance
     * @private
     */
    _createControl: function() {
        return new OpenLayers.Control.DeleteFeature(this.layer.olLayer, this.options);
    }
});

/**
 * Creates a split control
 *
 * @extends gbi.Controls.ToolbarItem
 * @constructor
 * @param {gbi.Layers.VectorLayer} layer
 * @param [options] All {OpenLayers.Control.SplitFeature} options are allowed.
 */
gbi.Controls.Split = function(layer, options) {
    var defaults = {
        displayClass: "olControlSplitFeature",
        title: OpenLayers.i18n("Split feature")
    };
    gbi.Controls.ToolbarItem.call(this, $.extend({}, defaults, options));

    this.disableable = true;
    this.layer = layer;

    this.createControl();
};
gbi.Controls.Split.prototype = new gbi.Controls.ToolbarItem();
$.extend(gbi.Controls.Split.prototype, {
    CLASS_NAME: 'gbi.Controls.Split',
    /**
     * Sets the layer to split features in
     *
     * @memberof gbi.Controls.Split
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    changeLayer: function(layer) {
        if(this.dummyControl || !layer) {
            this.replaceToolbarControl(layer);
        } else {
            this.olControl.setLayer(layer.olLayer);
        }
    },
    /**
     * Creates the OpenLayers.Control.SplitFeature control
     *
     * @memberof gbi.Controls.Split
     * @instance
     * @private
     */
    _createControl: function() {
        return new OpenLayers.Control.SplitFeature(this.layer.olLayer, this.options);
    }
});

/**
 * Creates a merge control
 *
 * @extends gbi.Controls.ToolbarItem
 * @constructor
 * @param {gbi.Layers.VectorLayer} layer
 * @param [options] All {OpenLayers.Control.MergeFeature} options are allowed.
 */
gbi.Controls.Merge = function(layer, options) {
    var defaults = {
        displayClass: "olControlMergeFeature",
        titleMerge: OpenLayers.i18n("Merge features"),
        titleUnmerge: OpenLayers.i18n("Unmerge features")
    };
    gbi.Controls.ToolbarItem.call(this, $.extend({}, defaults, options));
    this.options.title = this.options.titleMerge;
    this.disableable = true;
    this.layer = layer;

    this.createControl();
};
gbi.Controls.Merge.prototype = new gbi.Controls.ToolbarItem();
$.extend(gbi.Controls.Merge.prototype, {
    CLASS_NAME: 'gbi.Controls.Merge',
    /**
     * Sets the layer to merge features in
     *
     * @memberof gbi.Controls.Merge
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    changeLayer: function(layer) {
        if(this.dummyControl || !layer) {
            this.replaceToolbarControl(layer);
        } else {
            this.olControl.setLayer(layer.olLayer);
        }
    },
    /**
     * Creates the OpenLayers.Control.MergeFeature control
     *
     * @memberof gbi.Controls.Merge
     * @instance
     * @private
     */
    _createControl: function() {
        return new OpenLayers.Control.MergeFeatures(this.layer.olLayer, this.options);
    }
});

/**
 * Baseclass for toolbar element which can handle more than one layer
 *
 * @class
 * @abstract
 * @extends gbi.Controls.ToolbarItem
 * @param {gbi.Layers.VectorLayers[]} layers
 * @param [options]
 */
gbi.Controls.MultiLayerControl = function(layers, options) {
    var self = this;
    gbi.Controls.ToolbarItem.call(this, options);
    this.layers = {};
    if(layers) {
        if(!$.isArray(layers) && layers instanceof gbi.Layers.Layer) {
            //it's only one layer
            this.layers[layers.id] = layers;
        } else {
            $.each(layers, function(idx, layer) {
                if(layer instanceof gbi.Layers.Layer) {
                    self.layers[layer.id] = layer;
                }
            });
        }
    }
};
gbi.Controls.MultiLayerControl.prototype =  new gbi.Controls.ToolbarItem();
$.extend(gbi.Controls.MultiLayerControl.prototype, {
    CLASS_NAME: 'gbi.Controls.MultiLayerControl',
    /**
     * Gets layers belong to this control
     *
     * @memberof gbi.Controls.MultiLayerControl
     * @instance
     * @returns {gbi.Layers.VectorLayers[]}
     */
    olLayers: function() {
        var self = this;
        var olLayers = [];
        $.each(this.layers, function(idx, layer) {
            olLayers.push(layer.olLayer);
        });
        return olLayers;
    },
    /**
     * Creates the OpenLayers.Control
     * @memberof gbi.Controls.MultiLayerControl
     * @instance
     */
    createControl: function() {
        if(this.toolbar) {
            if(Object.keys(this.layers).length > 0) {
                this.olControl = this._createControl();
                this.dummyControl = false;
            } else {
                this.olControl = new OpenLayers.Control(this.options);
                this.olControl.activate = function() {};
                this.dummyControl = true;
                if(this.disableable == true) {
                    this.olControl.displayClass = 'itemDisabled ' + this.olControl.displayClass;
                }
            }
        } else {
            this.olControl = this._createControl();
            this.dummyControl = false;
        }
    }
});

/**
 * Creates a select control
 *
 * @extends gbi.Controls.MultiLayerControl
 * @constructor
 * @param {gbi.Layers.VectorLayer[]} layers
 * @param [options] All OpenLayers.Control.SelectFeature options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/SelectFeature-js.html|OpenLayers.Control.SelectFeature}
 */
gbi.Controls.Select = function(layers, options) {
    var self = this;
    var defaults = {
        displayClass: "olControlSelectFeature",
        title: OpenLayers.i18n("Select feature(s)"),
        multiple: false,
        toggleKey: "shiftKey",
        multipleKey: "shiftKey"
    };
    gbi.Controls.MultiLayerControl.call(this, layers, $.extend({}, defaults, options));

    this.createControl();
};
gbi.Controls.Select.prototype = new gbi.Controls.MultiLayerControl();
$.extend(gbi.Controls.Select.prototype, {
    CLASS_NAME: 'gbi.Controls.Select',
    /**
     * Adds a layer for selecting features in
     *
     * @memberof gbi.Controls.Select
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    addLayer: function(layer) {
        this.layers[layer.id] = layer;
        if(this.dummyControl) {
            this.replaceToolbarControl(layer);
        } else {
            this.olControl.setLayer(this.olLayers());
        }
    },
    /**
     * Removes a layer for selecting features in
     *
     * @memberof gbi.Controls.Select
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    removeLayer: function(layer) {
        delete this.layers[layer.id];
        this.olControl.setLayer(this.olLayers());
        if(this.toolbar && !Object.keys(this.layers).length) {
            this.replaceToolbarControl();
        }
    },
    /**
     * Unselect given feature
     *
     * @memberof gbi.Controls.Select
     * @instance
     * @param {OpenLayers.Feature.Vector} feature to unselect
     */
    unselectFeature: function(feature) {
        this.olControl.unselect(feature);
    },
    /**
     * Creates the OpenLayers.Control.SelectFeature control
     *
     * @memberof gbi.Controls.Select
     * @instance
     * @private
     */
    _createControl: function() {
        return new OpenLayers.Control.SelectFeature(this.olLayers(), this.options);
    }
});

/**
 * Creates a snap control
 *
 * @extends gbi.Controls.MultiLayerControl
 * @constructor
 * @param {gbi.Layers.VectorLayer} layer
 * @param {gbi.Layers.VectorLayer[]} layers
 * @param [options] All OpenLayers.Control.Snapping options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/Snapping-js.html|OpenLayers.Control.Snapping}
 * @param {Boolean} [options.toolbar=false] Control appears in toolbar
 */
gbi.Controls.Snap = function(layer, layers, options) {
    var defaults = {
        toolbar: false,
        displayClass: "olControlSnapp",
        title: OpenLayers.i18n("Snap on features"),
        type: OpenLayers.Control.TYPE_TOGGLE
    };
    layers = layers || [layer];
    this.layer = layer;
    gbi.Controls.MultiLayerControl.call(this, layers, $.extend({}, defaults, options));

    this.createControl();
};
gbi.Controls.Snap.prototype = new gbi.Controls.MultiLayerControl();
$.extend(gbi.Controls.Snap.prototype, {
    CLASS_NAME: 'gbi.Controls.Snap',
    /**
     * Sets the editable layer
     *
     * @memberof gbi.Controls.Snap
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    changeLayer: function(layer) {
        this.layer = layer;
        if(this.dummyControl || !layer) {
            if(this.options.toolbar) {
                this.replaceToolbarControl(layer);
            } else {
                this.createControl();
            }
        } else {
            this.olControl.setLayer(layer.olLayer);
        }
    },
    /**
     * Adds a layer for snapping features in
     *
     * @memberof gbi.Controls.Snap
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    addLayer: function(layer) {
        this.layers[layer.id] = layer;
        this.layer = this.layer || layer;
        if(this.dummyControl) {
            if(this.options.toolbar) {
                this.replaceToolbarControl(layer);
            } else {
                this.createControl();
            }
        } else {
            if(!this.olControl.layer) {
                this.olControl.setLayer(layer.olLayer);
            }
            this.olControl.setTargets(this.olLayers());
        }
    },
    /**
     * Removes a layer for snapping features in
     *
     * @memberof gbi.Controls.Snap
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    removeLayer: function(layer) {
        delete this.layers[layer.id];
        this.olControl.setTargets(this.olLayers());
        if(this.toolbar && !Object.keys(this.layers).length) {
            this.replaceToolbarControl();
        }
    },
    /**
     * Creates the OpenLayers.Control.Snapping control
     *
     * @memberof gbi.Controls.Snap
     * @instance
     * @private
     */
    _createControl: function() {
        if(this.layer) {
            this.options.layer = this.layer.olLayer;
        }
        if(this.layers) {
            this.options.targets = [];
            var olLayers = this.olLayers();
            for(var i = 0; i<olLayers.length; i++) {
                this.options.targets.push({layer:olLayers[i]});
            }
        }
        return new OpenLayers.Control.Snapping(this.options);
    }
});

/**
 * Creates a copy control
 *
 * @extends gbi.Controls.MultiLayerControl
 * @constructor
 * @param {gbi.Layers.VectorLayer} layer Target layer
 * @param {gbi.Layers.VectorLayer[]} layers Source layers
 * @param [options] All {OpenLayers.Control.CopyFeatures} options are allowed
 */
gbi.Controls.Copy = function(layer, layers, options) {
    var defaults = {
        title: OpenLayers.i18n('Copy feature(s)'),
        displayClass: 'olControlCopyFeatures'
    };
    gbi.Controls.MultiLayerControl.call(this, layers, $.extend({}, defaults, options));

    this.disableable = true;
    this.layer = layer || true;

    this.createControl();
};
gbi.Controls.Copy.prototype = new gbi.Controls.MultiLayerControl();
$.extend(gbi.Controls.Copy.prototype, {
    CLASS_NAME: 'gbi.Control.Copy',
    /**
     * Creates the OpenLayers.Control.CopyFeatures control
     *
     * @memberof gbi.Controls.Copy
     * @instance
     * @private
     */
    _createControl: function() {
        var self = this;
        var olControl = new OpenLayers.Control.CopyFeatures(this.layer.olLayer, this.olLayers(), this.options);
        return olControl;
    },
    /**
     * Sets the target layer for copy operation
     *
     * @memberof gbi.Controls.Copy
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    changeLayer: function(layer) {
        if(layer) {
            this.olControl.targetLayer(layer.olLayer);
        } else {
            this.olControl.targetLayer();
        }
    },
    /**
     * Adds a layer to source layers
     *
     * @memberof gbi.Controls.Copy
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    addLayer: function(layer) {
        this.layers[layer.id] = layer;
        if(this.dummyControl) {
            this.replaceToolbarControl(layer);
        } else {
            this.olControl.layers(this.olLayers());
        }
    },
    /**
     * Removes a layer from source layers
     *
     * @memberof gbi.Controls.Copy
     * @instance
     * @param {gbi.Layers.VectorLayer} layer
     */
    removeLayer: function(layer) {
        delete this.layers[layer.id];
        this.olControl.layers(this.olLayers());
        if(this.toolbar && !Object.keys(this.layers).length) {
            this.replaceToolbarControl();
        }
    }
});

/**
 * Baseclass for toolbar element which don't need a layer
 *
 * @class
 * @abstract
 * @extends gbi.Controls.ToolbarItem
 * @param [options]
 */
gbi.Controls.NoLayerControl = function(options) {
    var self = this;
    gbi.Controls.ToolbarItem.call(this, options);
};
gbi.Controls.NoLayerControl.prototype =  new gbi.Controls.ToolbarItem();
$.extend(gbi.Controls.NoLayerControl.prototype, {
    CLASS_NAME: 'gbi.Controls.NoLayerControl',
    /**
     * Creates the OpenLayers.Control
     * @memberof gbi.Controls.NoLayerControl
     * @instance
     */
    createControl: function() {
        this.olControl = this._createControl();
        this.dummyControl = false;
    }
});

/**
 * Creates a measure control
 *
 * @extends gbi.Controls.NoLayerControl
 * @constructor
 * @param options
 * @param {String} [options.displayClass=olControlMeasurePolygon] CSS class for toolbar icon
 * @param {String} [options.title]
 * @param {Boolean} [options.geodesic=true]
 * @param {String} [options.mapSRS=EPSG:3857] EPSG code of map projection
 * @param {String} [options.displaySRS] EPSG code for point coordinate output
 * @param {Constant} [options.measureType={gbi.Controls.Measure.TYPE_POLYGON}]
 * @param {Function} callback
 * @param [symbolizers] Defines how measurement is displayed in map
 */
gbi.Controls.Measure = function(options, callback, symbolizers) {
    var self = this;
    var defaults = {
        displayClass: 'olControlMeasurePolygon',
        geodesic: true,
        mapSRS: 'EPSG:3857',
        displaySRS: 'EPSG:3857'
    };
    gbi.Controls.NoLayerControl.call(this, $.extend({}, defaults, options));

    symbolizers = symbolizers || {
        "Point": {
            pointRadius: 4,
            graphicName: "square",
            fillColor: "white",
            fillOpacity: 1,
            strokeWidth: 1,
            strokeOpacity: 1,
            strokeColor: "#333333"
        },
        "Line": {
            strokeWidth: 3,
            strokeOpacity: 1,
            strokeColor: "#666666",
            strokeDashstyle: "dash"
        },
        "Polygon": {
            strokeWidth: 2,
            strokeOpacity: 1,
            strokeColor: "#666666",
            fillColor: "white",
            fillOpacity: 0.3
        }
    };

    var style = new OpenLayers.Style();
    style.addRules([
        new OpenLayers.Rule({symbolizer: symbolizers})
    ]);
    this.styleMap = new OpenLayers.StyleMap({"default": style});

    this.options.measureType = this.options.measureType || gbi.Controls.Measure.TYPE_POLYGON;

    this.mapSRS = new OpenLayers.Projection(this.options.mapSRS);
    this.displaySRS = new OpenLayers.Projection(this.options.displaySRS);

    this.callback = callback;

    this.layer = true;

    this.drawHandler = null;
    switch(this.options.measureType.toLowerCase()) {
        case gbi.Controls.Measure.TYPE_POINT:
            this.drawHandler = OpenLayers.Handler.Point;
            this.options.displayClass = 'olControlMeasurePoint';
            this.options.title = OpenLayers.i18n('Measure point');
            this.options.geodesic = false;
            break;
        case gbi.Controls.Measure.TYPE_LINE:
            this.drawHandler = OpenLayers.Handler.Path;
            this.options.title = OpenLayers.i18n('Measure path');
            this.options.displayClass = 'olControlMeasureLine';
            break;
        case gbi.Controls.Measure.TYPE_POLYGON:
        default:
            this.drawHandler = OpenLayers.Handler.Polygon;
            this.options.title= OpenLayers.i18n('Measure area');
            this.options.displayClass = 'olControlMeasurePolygon';
            break;
    };
    this.createControl();
};
/**
 * Measure type for points
 *
 * @constant
 */
gbi.Controls.Measure.TYPE_POINT = 'point';
/**
 * Measure type for lines
 *
 * @constant
 */
gbi.Controls.Measure.TYPE_LINE = 'line';
/**
 * Measure type for polygons
 *
 * @constant
 */
gbi.Controls.Measure.TYPE_POLYGON = 'polygon';
gbi.Controls.Measure.prototype = new gbi.Controls.NoLayerControl();
$.extend(gbi.Controls.Measure.prototype, {
    CLASS_NAME: 'gbi.Controls.Measure',
    /**
     * Handler for measurement results
     *
     * @memberof gbi.Controls.Measure
     * @instance
     * @private
     * @param {OpenLayers.Event} eventlayer
     */
    measureHandler: function(event) {
        var self = this;
        self.lastMeasure = event;
        var result = null;
        switch(event.geometry.CLASS_NAME) {
            case OpenLayers.Geometry.Point.prototype.CLASS_NAME:
                var geometry = event.geometry.clone();
                geometry.transform(self.mapSRS, self.displaySRS);
                result = {
                    type: gbi.Controls.Measure.TYPE_POINT,
                    measure: [geometry.x, geometry.y]
                };
                break;
            case OpenLayers.Geometry.LineString.prototype.CLASS_NAME:
                result = {
                    type: gbi.Controls.Measure.TYPE_LINE,
                    measure: event.measure.toFixed(3),
                    units: event.units
                };
                break;
            case OpenLayers.Geometry.Polygon.prototype.CLASS_NAME:
                result = {
                    type: gbi.Controls.Measure.TYPE_POLYGON,
                    measure: event.measure.toFixed(3),
                    units: event.units
                };
                break;
        }
        self.callback.call(self, result);
    },
    /**
     * Change coordinate system for point coordinate output
     *
     * @memberof gbi.Controls.Measure
     * @instance
     * @param {String} srs EPSG code
     */
    updateSRS: function(srs) {
        this.displaySRS = new OpenLayers.Projection(srs);
        if(this.lastMeasure) {
            this.measureHandler(this.lastMeasure);
        }
    },
    /**
     * Creates the OpenLayers.Control.Measure control
     *
     * @memberof gbi.Controls.Measure
     * @instance
     * @private
     */
    _createControl: function() {
        var self = this;
        var olControl = new OpenLayers.Control.Measure(this.drawHandler, {
            persist: true,
            immediate: true,
            displayClass: this.options.displayClass,
            title: this.options.title,
            geodesic: this.options.geodesic,
            handlerOptions: {
                layerOptions: {
                    styleMap: this.styleMap
                }
            }
        });
        olControl.events.on({
            "measure": function(event) { self.measureHandler(event) },
            "measurepartial": function(event) { self.measureHandler(event) }
        });
        return olControl;
    }
});
