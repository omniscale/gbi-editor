var thematicalVectorLegendLabel = {
    'legendFor': OpenLayers.i18n('Legend for'),
    'areaIn': OpenLayers.i18n('Area in'),
    'noThematicalMap': OpenLayers.i18n('No thematical map present for this layer'),
    'value': OpenLayers.i18n('Value'),
    'color': OpenLayers.i18n('Color'),
    'exact': OpenLayers.i18n('Exact'),
    'range': OpenLayers.i18n('Range'),
    'noLayer': OpenLayers.i18n('No layer selected')
};

gbi.widgets = gbi.widgets || {};

gbi.widgets.ThematicalVectorLegend = function(thematicalVector, options) {
    if(!(thematicalVector instanceof gbi.widgets.ThematicalVector)) {
        return;
    }
    var self = this;
    var defaults = {
        element: 'thematicalvectorlegend',
        featureList: false,
        initOnly: false
    }
    this.options = $.extend({}, defaults, options);
    this.thematicalVector = thematicalVector
    this.editor = thematicalVector.editor;

    this.activeLayer = this.editor.layerManager.active();
    this.selectControl = false;
    this.legend = false;

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.activeLayer = layer;
        if(self.activeLayer) {
            self._registerLayerEvents(self.activeLayer);
        }
        self.render();
    });

    if(this.activeLayer) {
        this._registerLayerEvents(this.activeLayer);
    }

    if(!this.options.initOnly) {
        self.render();
    }
};
gbi.widgets.ThematicalVectorLegend.prototype = {
    render: function() {
        var self = this;
        var element = $('#' + this.options.element);
        self.legend = this.activeLayer ? this.activeLayer.filteredFeatures() : false;
        var entries = []
        element.empty();

        if(!self.activeLayer) {
            element.append($('<div class="text-center">' + thematicalVectorLegendLabel.noLayer + '</div>'));
            return;
        }

        if(self.legend) {
            $.each(self.legend.result, function(idx, r) {
                var value = '';
                if(r.min && r.max) {
                    value = r.min + ' <= ' + self.legend.attribute + ' < ' + r.max;
                } else if(r.min) {
                    value = r.min + ' <= ' + self.legend.attribute;
                } else if(r.max) {
                    value =  self.legend.attribute + ' < ' + r.max
                } else {
                    value = r.value;
                }
                entries.push({
                    id: r.id,
                    attribute: self.legend.attribute,
                    color: r.color,
                    value: value,
                    type: self.legend.type
                });
            })

            element.append(tmpl(
                gbi.widgets.ThematicalVectorLegend.template, {
                    attribute: self.legend.attribute,
                    type: thematicalVectorLegendLabel[self.legend.type],
                    entries: entries,
                    featureList: self.options.featureList instanceof gbi.widgets.FeatureAttributeList
                }
            ));

            self.updateAreas(element);

            if(self.options.featureList instanceof gbi.widgets.FeatureAttributeList) {
                // bind events
                $.each(entries, function(idx, entry) {
                    $('#_' + entry.id + '_list_view').click(function() {
                        self.options.featureList.showFilteredFeatures(entry);
                        self.thematicalVector.showListView();
                    });
                });
            }

        } else {
            element.append($('<div>' + thematicalVectorLegendLabel.noThematicalMap + '</div>'));
        }
    },
    updateAreas: function(element) {
        var self = this;
        self.legend = this.activeLayer ? this.activeLayer.filteredFeatures() : false;
        if(self.legend) {
            var units = 'm';
            $.each(self.legend.result, function(idx, r) {
                var area = 0;
                $.each(r.features, function(idx, feature) { area += feature.geometry.getGeodesicArea(self.editor.map.olMap.getProjectionObject())});
                if(area > 100000) {
                    area /= 1000000;
                    area = Math.round(area * 10000) / 10000;
                    units = 'km';
                } else {
                    area = Math.round(area * 100) / 100;
                }
                element.find('#_' + r.id + '_area').text(area)
            });
            element.find('#area-unit').text(units);
        }
    },
    _registerLayerEvents: function(layer) {
        var self = this;
        if(layer instanceof gbi.Layers.SaveableVector && !layer.loaded) {
            $(layer).on('gbi.layer.couch.loadFeaturesEnd', function() {
                self.render();
            });
        }
        $(layer).on('gbi.layer.vector.ruleChanged', function(event) {
            self.render();
        });
    }
};

gbi.widgets.ThematicalVectorLegend.template = '\
    <h5>' + thematicalVectorLegendLabel.legendFor + ' "<%=attribute%>" (<%=type%>)</h5>\
    <table class="table">\
        <thead>\
            <tr>\
                <th class="text-center">' + thematicalVectorLegendLabel.color + '</th>\
                <th class="text-center">' + thematicalVectorLegendLabel.value + '</th>\
                <th class="text-center">' + thematicalVectorLegendLabel.areaIn + ' <span id="area-unit"></span><sup>2</sup></th>\
                <% if(featureList) { %><th class="text-center">&nbsp;</th><% } %>\
            </tr>\
        </thead>\
        <tbody>\
            <% for(var key in entries) { %>\
                <tr id="_<%=entries[key].id%>_row">\
                    <td class="text-center"><div id="_<%=entries[key].id%>_color" class="gbi_widget_legend_color inline-block" style="background-color: <%=entries[key].color%>;"><span class="hide"><%=entries[key].value%></div></td>\
                    <td class="text-center"><%=entries[key].value%></td>\
                    <td class="text-center" id="_<%=entries[key].id%>_area"></td>\
                    <% if(featureList) { %>\
                        <td class="text-center">\
                            <button id="_<%=entries[key].id%>_list_view" class="btn btn-small">\
                                <i class="icon-list"></i>\
                            </button>\
                        </td>\
                    <% } %>\
                </tr>\
            <% } %>\
        </tbody>\
    </table>\
';

var thematicalVectorLegendChangeAttributesLabel = {
    'applyChanges': OpenLayers.i18n('Apply changes'),
    'discardChanges': OpenLayers.i18n('Discard changes')
};

gbi.widgets = gbi.widgets || {};

gbi.widgets.ThematicalVectorLegendChangeAttributes = function(thematicalVector, options) {
    gbi.widgets.ThematicalVectorLegend.call(this, thematicalVector, $.extend({}, options));
};
gbi.widgets.ThematicalVectorLegendChangeAttributes.prototype = new gbi.widgets.ThematicalVectorLegend();
$.extend(gbi.widgets.ThematicalVectorLegendChangeAttributes.prototype, {
    render: function() {
        var self = this;
        var element = $('#' + this.options.element);
        gbi.widgets.ThematicalVectorLegend.prototype.render.call(this);
        if(self.legend && self.legend.type == 'exact') {
            element.append(tmpl(
                gbi.widgets.ThematicalVectorLegendChangeAttributes.template
            ));

            element.find('.gbi_widget_legend_color').click(function() {
                var _this = $(this);
                var id = _this.attr('id').split('_')[1]
                self._removeSelectControl(element);
                self._addSelectControl(element, id, self.legend.attribute, _this.children().first().text())
            });

            if(self.activeLayer instanceof gbi.Layers.SaveableVector) {
                self.activeLayer.registerCallback('changes', function() {
                    element.find('#applyChanges').first().removeAttr('disabled');
                    element.find('#discardChanges').first().removeAttr('disabled');
                })
                self.activeLayer.registerCallback('success', function() {
                    element.find('#applyChanges').first().attr('disabled', 'disabled');
                    element.find('#discardChanges').first().attr('disabled', 'disabled');
                })
                element.find('#applyChanges').first().click(function() {
                    self.activeLayer.save();
                    self._removeSelectControl(element);
                    self.render();
                });
                element.find('#discardChanges').first().click(function() {
                    self.activeLayer.olLayer.refresh();
                    self._removeSelectControl(element);
                    element.find('#applyChanges').first().attr('disabled', 'disabled');
                    element.find('#discardChanges').first().attr('disabled', 'disabled');
                });
            }
        }
    },
    _addSelectControl: function(element, id, attribute, value) {
        var self = this;
        element.find('#_' + id + '_row').addClass('warning')
        self.selectControl = new gbi.Controls.Select(self.activeLayer);
        self.selectControlObject = {attribute: attribute, value: value, self: self};
        self.editor.map.addControl(self.selectControl)
        self.activeLayer.registerEvent('featureselected', self.selectControlObject, self._changeFeatureAttributeValue);
        self.selectControl.activate();
    },
    _removeSelectControl: function(element) {
        var self = this;
        if(self.selectControl) {
            self.selectControl.deactivate();
            element.find('tr.warning').removeClass('warning');
            self.activeLayer.unregisterEvent('featureselected', self.selectControlObject, self._changeFeatureAttributeValue)
            self.editor.map.removeControl(self.selectControl);
            self.selectControl = false;
            self.selectControlObject = false;
        }
    },
    _changeFeatureAttributeValue: function(f) {
        this.self.activeLayer.changeFeatureAttribute(f.feature, this.attribute, this.value);
        this.self.selectControl.unselectFeature(f.feature);
        this.self.updateAreas($('#' + this.self.options.element));
    }
});


gbi.widgets.ThematicalVectorLegendChangeAttributes.template = '\
    <button id="applyChanges" class="btn btn-small btn-success" disabled="disabled">' + thematicalVectorLegendChangeAttributesLabel.applyChanges + '</button>\
    <button id="discardChanges" class="btn btn-small" disabled="disabled">' + thematicalVectorLegendChangeAttributesLabel.discardChanges + '</button>\
';
