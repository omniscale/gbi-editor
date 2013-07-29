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
        element: 'thematicalvectorlegend'
    }
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);
    this.editor = editor;
    if(this.editor) {
        this.activeLayer = editor.layerManager.active();
        this.selectControl = false;
        this.legend = false;

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
    }
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
        self.legend = this.activeLayer.filteredFeatures();
        var entries = []
        this.element.empty();
        if(self.legend) {
            var units = 'm';
            $.each(self.legend.result, function(idx, r) {
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
                    attribute: self.legend.attribute,
                    type: thematicalVectorLegendLabel[self.legend.type],
                    entries: entries,
                    units: units
                }
            ));
        } else {
            this.element.append($('<div>' + thematicalVectorLegendLabel.noThematicalMap + '</div>'));
        }
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
