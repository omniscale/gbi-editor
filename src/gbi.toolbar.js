/**
 * Creates a toolbar
 *
 * @constructor
 * @param {gbi.Editor} editor A reference to the editor
 * @param [options] Options for the toolbar. All OpenLayers.Control.Panel options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/Panel-js.html|OpenLayers.Control.Panel}
 * @param {String} [options.element] DOM element to show the toolbar in
 * @param [options.tools] Enabled tools in toolbar
 * @param {Boolean} [options.tools.select=true]
 * @param {Boolean} [options.tools.drawPolygon=true]
 * @param {Boolean} [options.tools.drawRect=false]
 * @param {Boolean} [options.tools.drawLine=false]
 * @param {Boolean} [options.tools.drawPoint=false]
 * @param {Boolean} [options.tools.edit=true]
 * @param {Boolean} [options.tools.delete=true]
 * @param {Boolean} [options.tools.merge=false]
 * @param {Boolean} [options.tools.split=false]
 * @param {Boolean} [options.tools.copy=false]
 */
gbi.Toolbar = function(editor, options) {
    var self = this;
    var defaults = {
        'displayClass': 'customEditingToolbar',
        'allowDepress': true,
        'tools': {
            'select': true,
            'drawPolygon': true,
            'drawRect': false,
            'drawLine': false,
            'drawPoint': false,
            'edit': true,
            'delete': true,
            'merge': false,
            'split': false,
            'copy': false
        }
    };
    this.multiLayerControls = [];
    this.singleLayerControls = [];
    this.vectorLayers = {};
    $.each(editor.layerManager.vectorLayers, function(idx, layer) {
        if(layer.isEditable) {
            self.vectorLayers[idx] = layer;
        }
    });
    $.each(editor.layerManager.unshownLayers, function(idx, layer) {
        if(layer.isEditable && layer.isVector) {
            self.vectorLayers[Object.keys(self.vectorLayers).length] = layer;
        }
    });
    var _activeLayer = editor.layerManager.active();
    this.vectorActive = (_activeLayer && _activeLayer.isEditable) ? _activeLayer : false;

    this.options = $.extend({}, defaults, options);
    this.tools = this.options.tools;
    delete this.options.tools;

    if(this.options.element) {
        var element = $('#'+this.options.element);
        element.addClass(this.options.displayClass);

        this.options.div = element[0];
        delete this.options.element;
    }

    this.olControl = new OpenLayers.Control.Panel(this.options);

    this.olControl.onButtonClick = function(event) {
        $(gbi).trigger('gbi.toolbar.active', self);
        OpenLayers.Control.Panel.prototype.onButtonClick.call(this, event);
    };

    this.initTools();
    this.defaultControl(this.select);

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        if(!layer) {
            self.deactivateAllControls();
        }
        self.vectorActive = layer;
        self.activateLayer(layer);
    });
    $(gbi).on('gbi.layermanager.vectorlayer.add', function(event, layer) {
        self.addLayerToControl(layer);
    });
    $(gbi).on('gbi.layermanager.vectorlayer.remove', function(event, layer) {
        self.removeLayerFromControl(layer);
    });

    editor.addControls([this]);
};
gbi.Toolbar.prototype = {
    CLASS_NAME: 'gbi.Toolbar',
    /**
     * Initialize the toolbar tools
     *
     * @memberof gbi.Toolbar
     * @instance
     */
    initTools: function() {
        var self = this;
        var toolbarControls = [];
        $.each(this.tools, function(type, available) {
            if(available) {
                var newTool = false;
                switch(type) {
                    case 'drawPolygon':
                        newTool = self.drawPolygon = new gbi.Controls.Draw(self.vectorActive, {drawType: gbi.Controls.Draw.TYPE_POLYGON});
                        break;
                    case 'drawRect':
                        newTool = self.drawRect = new gbi.Controls.Draw(self.vectorActive, {drawType: gbi.Controls.Draw.TYPE_RECT});
                        break;
                    case 'drawLine':
                        newTool = self.drawLine = new gbi.Controls.Draw(self.vectorActive, {drawType: gbi.Controls.Draw.TYPE_LINE});
                        break;
                    case 'drawPoint':
                        newTool = self.drawPoint = new gbi.Controls.Draw(self.vectorActive, {drawType: gbi.Controls.Draw.TYPE_POINT});
                        break;
                    case 'edit':
                        newTool = self.edit = new gbi.Controls.Edit(self.vectorActive);
                        if(self.delete_) {
                            self.delete_.setModifyControl(self.edit.olControl);
                        }
                        break;
                    case 'delete':
                        var options = {};
                        if(self.select) {
                            $.extend(options, {selectControl: self.select.olControl});
                        }
                        if(self.edit) {
                            $.extend(options, {modifyControl: self.edit.olControl});
                        }
                        newTool = self.delete_ = new gbi.Controls.Delete(self.vectorActive, options);
                        break;
                    case 'select':
                        newTool = self.select = new gbi.Controls.Select(self.vectorLayers);
                        if(self.delete_) {
                            self.delete_.setSelectControl(self.select.olControl);
                        }
                        break;
                    case 'merge':
                        newTool = self.merge = new gbi.Controls.Merge(self.vectorActive, {selectControl: self.select.olControl});
                        break;
                    case 'split':
                        newTool = self.split = new gbi.Controls.Split(self.vectorActive, {selectControl: self.select.olControl});
                        break;
                    case 'copy':
                        newTool = self.split = new gbi.Controls.Copy(self.vectorActive, self.vectorLayers, {selectControl: self.select.olControl});
                        break;
                }
                if(newTool) {
                    toolbarControls.push(newTool);
                }
            }
        });
        this.addControls(toolbarControls);

    },
    /**
     * Activtes a layer
     *
     * @memberof gbi.Toolbar
     * @instance
     * @param {Layer} layer
     */
    activateLayer: function(layer) {
        if(!layer|| layer.isEditable) {
            var self = this;
            //XXXkai: use concat for single and multi
            $.each(this.singleLayerControls, function(idx, control) {
                if (control.changeLayer)
                    control.changeLayer(layer);
            });
            if(this.delete_ && this.edit) {
                if(this.delete_.olControl instanceof OpenLayers.Control.DeleteFeature) {
                    this.delete_.olControl.setModifyControl(this.edit.olControl);
                } else {
                    this.delete_.options.modifyControl = this.edit.olControl;
                }
            }
            $.each(this.multiLayerControls, function(idx, control) {
                if($.isFunction(control.changeLayer)) {
                    control.changeLayer(layer);
                }
            });
            this.olControl.redraw();
        }
    },
    /**
     * Adds a layer to all {MultiLayerControls} in this toolbar
     *
     * @memberof gbi.Toolbar
     * @instance
     * @param {Layer} layer
     */
    addLayerToControl: function(layer) {
        if(layer.isEditable) {
            var self = this;
            $.each(this.multiLayerControls, function(idx, control) {
                if($.isFunction(control.addLayer)) {
                    control.addLayer(layer);
                    if(control.CLASS_NAME == 'gbi.Controls.Select' && self.delete_) {
                        if(self.delete_.olControl instanceof OpenLayers.Control.DeleteFeature) {
                            self.delete_.olControl.setSelectControl(control.olControl);
                        } else {
                            self.delete_.options.selectControl = control.olControl;
                        }
                    }
                }
            });
            this.olControl.redraw();
        }
    },
    /**
     * Removes a layer from all {MultiLayerControls} in this toolbar
     *
     * @memberof gbi.Toolbar
     * @instance
     * @param {Layer} layer
     */
    removeLayerFromControl: function(layer) {
        if(layer.isEditable) {
            $.each(this.multiLayerControls, function(idx, control) {
                if($.isFunction(control.removeLayer)) {
                    control.removeLayer(layer);
                }
            });
        }
    },
    /**
     * Add a {ToolbarItem} to this toolbar
     *
     * @memberof gbi.Toolbar
     * @instance
     * @param {ToolbarItem} control
     */
    addControl: function(control) {
        if(control instanceof gbi.Controls.MultiLayerControl) {
            this.multiLayerControls.push(control);
        } else {
            this.singleLayerControls.push(control);
        }
        control.olToolbar = this.olControl;
        this.olControl.addControls([control.olControl]);
    },
    /**
     * Add a lot of {ToolbarItem} to this toolbar
     *
     * @memberof gbi.Toolbar
     * @instance
     * @param {ToolbarItem[]} controls
     */
    addControls: function(controls) {
        var self = this;
        $.each(controls, function(idx, control) {
            self.addControl(control);
        });
    },
    /**
     * Deactivate all controls belong to this toolbar
     *
     * @memberof gbi.Toolbar
     * @instance
     */
    deactivateAllControls: function() {
        var self = this;
        $.each(this.multiLayerControls.concat(this.singleLayerControls), function(idx, control) {
            if(control.active()) {
                control.deactivate();
            }
        });
    },
    /**
     * Set the default Control of this toolbar
     *
     * @memberof gbi.Toolbar
     * @instance
     * @param {ToolbarItem} control
     */
    defaultControl: function(control) {
        if(control) {
            this.olControl.defaultControl = control.olControl;
        }
    }
};
