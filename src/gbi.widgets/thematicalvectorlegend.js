var thematicalVectorLegendLabel = {
    'legendFor': OpenLayers.i18n('Legend for'),
    'areaIn': OpenLayers.i18n('Area in'),
    'noThematicalMap': OpenLayers.i18n('No thematical map present for this layer'),
    'value': OpenLayers.i18n('Value'),
    'color': OpenLayers.i18n('Color'),
    'exact': OpenLayers.i18n('Exact'),
    'range': OpenLayers.i18n('Range')
};

gbi.widgets = gbi.widgets || {};

gbi.widgets.ThematicalVectorLegend = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'thematicalvectorlegend',
        modifyFeatures: true
    }
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);
    this.editor = editor;
    this.activeLayer = editor.layerManager.active();
    this.selectControl = false;

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.activeLayer = layer;
    });

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.activeLayer = layer;
        self.render();
    });

    $(gbi).on('gbi.layer.vector.ruleChanged', function(event) {
        self.render();
    });

    self.render();
};
gbi.widgets.ThematicalVectorLegend.prototype = {
    render: function() {
        var self = this;
        if(self.activeLayer instanceof gbi.Layers.SaveableVector && !self.activeLayer.loaded) {
            $(gbi).on('gbi.layer.couch.loadFeaturesEnd', function() {
                self._render();
            });
        } else {
            self._render();
        }
    },
    _render: function() {
        var self = this;
        var legend = this.activeLayer.filteredFeatures();
        var entries = []
        this.element.empty();
        if(legend) {
            var units = 'm';
            $.each(legend.result, function(idx, r) {
                var value = '';
                if(r.min && r.max) {
                    value = r.min + ' <= x < ' + r.max;
                } else if(r.min) {
                    value = r.min + ' <= x';
                } else if(r.max) {
                    value = 'x < ' + r.max
                } else {
                    value = r.value;
                }
                var area = 0;
                $.each(r.features, function(idx, feature) { area += feature.geometry.getGeodesicArea(self.editor.map.olMap.getProjectionObject())});
                if(area > 100000) {
                    area /= 1000000;
                    area = Math.round(area * 10000) / 10000;
                    units = 'km';
                } else {
                    area = Math.round(area * 100) / 100;
                }
                entries.push({
                    color: r.color,
                    value: value,
                    area: area

                });
            });
            this.element.append(tmpl(
                gbi.widgets.ThematicalVectorLegend.template, {
                    attribute: legend.attribute,
                    type: thematicalVectorLegendLabel[legend.type],
                    entries: entries,
                    units: units
                }
            ));

            if(self.options.modifyFeatures) {

                this.element.append(tmpl(
                    gbi.widgets.ThematicalVectorLegend.modifyFeaturesTemplate
                ));

                if(legend.type == 'exact') {
                    this.element.find('.gbi_widget_legend_color').click(function() {
                        var element = $(this);
                        self._removeSelectControl();
                        self._addSelectControl(element, legend.attribute, element.children().first().text())
                    });
                }
                if(self.activeLayer instanceof gbi.Layers.SaveableVector) {
                    self.activeLayer.registerCallback('changes', function() {
                        self.element.find('#applyChanges').first().removeAttr('disabled');
                        self.element.find('#discardChanges').first().removeAttr('disabled');
                    })
                    self.activeLayer.registerCallback('success', function() {
                        self.element.find('#applyChanges').first().attr('disabled', 'disabled');
                        self.element.find('#discardChanges').first().attr('disabled', 'disabled');
                    })
                    self.element.find('#applyChanges').first().click(function() {
                        self.activeLayer.save();
                        self._removeSelectControl();
                        self.render();
                    });
                    self.element.find('#discardChanges').first().click(function() {
                        self.activeLayer.olLayer.refresh();
                        self._removeSelectControl();
                        self.element.find('#applyChanges').first().attr('disabled', 'disabled');
                        self.element.find('#discardChanges').first().attr('disabled', 'disabled');
                    });
                }
            }
        } else {
            this.element.append($('<div>' + thematicalVectorLegendLabel.noThematicalMap + '</div>'));
        }
    },
    _addSelectControl: function(element, attribute, value) {
        var self = this;
        element.addClass('highlight_legend_color');
        self.selectControl = new gbi.Controls.Select(self.activeLayer)
        self.editor.map.addControl(self.selectControl)
        self.activeLayer.registerEvent('featureselected', {attribute: attribute, value: value, self: self}, self._changeFeatureAttributeValue);
        self.selectControl.activate();
    },
    _removeSelectControl: function() {
        var self = this;
        if(self.selectControl) {
            self.selectControl.deactivate();
            self.element.find('.highlight_legend_color').first().removeClass('highlight_legend_color');
            self.activeLayer.unregisterEvent('featureselected', null, self._changeFeatureAttributeValue)
            self.editor.map.removeControl(self.selectControl);
            self.selectControl = false;
        }
    },
    _changeFeatureAttributeValue: function(f) {
        if(f.feature.attributes[this.attribute] != this.value) {
            f.feature.attributes[this.attribute] = this.value;
            f.feature.state = OpenLayers.State.UPDATE;
            if(this.self.activeLayer instanceof gbi.Layers.SaveableVector) {
                this.self.activeLayer.changesMade();
            }
        }
        this.self.selectControl.unselectFeature(f.feature);
    }
};

gbi.widgets.ThematicalVectorLegend.template = '\
    <h5>' + thematicalVectorLegendLabel.legendFor + ' "<%=attribute%>" (<%=type%>)</h5>\
    <table class="table">\
        <thead>\
            <tr>\
                <th class="text-center">' + thematicalVectorLegendLabel.color + '</th>\
                <th class="text-center">' + thematicalVectorLegendLabel.value + '</th>\
                <th class="text-center">' + thematicalVectorLegendLabel.areaIn + ' <%=units%><sup>2</sup></th>\
            </tr>\
        </thead>\
        <tbody>\
            <% for(var key in entries) { %>\
                <tr>\
                    <td class="text-center"><div class="gbi_widget_legend_color inline-block" style="background-color: <%=entries[key].color%>;"><span class="hide"><%=entries[key].value%></div></td>\
                    <td class="text-center"><%=entries[key].value%></td>\
                    <td class="text-center"><%=entries[key].area%></td>\
                </tr>\
            <% } %>\
        </tbody>\
    </table>\
';

gbi.widgets.ThematicalVectorLegend.modifyFeaturesTemplate = '\
    <button id="applyChanges" disabled="disabled">Apply Changes</button>\
    <button id="discardChanges" disabled="disabled">Discard Changes</button>\
';
