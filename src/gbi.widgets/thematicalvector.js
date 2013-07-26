var thematicalVectorLabel = {
    'selectValue': OpenLayers.i18n('Select a value'),
    'attribute': OpenLayers.i18n('Attribute'),
    'exact': OpenLayers.i18n('Exact'),
    'range': OpenLayers.i18n('Range'),
    'value': OpenLayers.i18n('Value'),
    'color': OpenLayers.i18n('Color'),
    'min': OpenLayers.i18n('Min'),
    'max': OpenLayers.i18n('Max'),
    'execute': OpenLayers.i18n('Execute'),
    'legendFor': OpenLayers.i18n('Legend for'),
    'areaIn': OpenLayers.i18n('Area in'),
    'noThematicalMap': OpenLayers.i18n('No thematical map present for this layer'),
    'addInputField': OpenLayers.i18n('Add input'),
    'removeInputField': OpenLayers.i18n('Remove input'),
    'active': OpenLayers.i18n('Active'),
    'choose': OpenLayers.i18n('Choose value')
};

gbi.widgets = gbi.widgets || {};

gbi.widgets.ThematicalVector = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'thematicalvector',
        mode: 'exact'
    }
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);
    this.legendElement = this.options.legendElement ? $('#' + this.options.legendElement) : false;
    this.editor = editor;
    this.activeLayer = editor.layerManager.active();
    this.attributes = [];
    this.mode = this.options.mode;

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.activeLayer = layer;
        if(self.activeLayer instanceof gbi.Layers.SaveableVector && !self.activeLayer.loaded) {
            $(gbi).on('gbi.layer.couch.loadFeaturesEnd', function() {
                self.attributes = self.activeLayer.featuresAttributes();
                self.render();
            });
        } else {
            self.attributes = self.activeLayer.featuresAttributes();
            self.render();
        }

    });

    $(gbi).on('gbi.layer.couch.loadFeaturesEnd', function() {
        self.attributes = self.activeLayer.featuresAttributes();
        self.render();
    });


};
gbi.widgets.ThematicalVector.prototype = {
    CLASS_NAME: 'gbi.widgets.ThematicalVector',
    render: function() {
        var self = this;

        this.element.empty();
        this.element.append(tmpl(
            gbi.widgets.ThematicalVector.template, {
                attributes: self.attributes,
                defaultColors: gbi.widgets.ThematicalVector.defaultColors
            }
        ));

        if(this.legendElement) {
            this.renderLegend();
        }

        $('#rangeInputDiv').hide();

        $('#toggleExact').click(function() {
            self.toggleExact();
        });

        $('#toggleRange').click(function() {
            self.toggleRange();
        });

        $('#attribute').change(function() {
            $.each($('.exactInputControl select'), function(idx, element) {
                element = $(element);
                self.fillExactInputSelect(element, element.val());
            });
        });

        $('#addInput').click(function() {
            self.addInput(self.mode);
        });

        $('#executeFilter').click(function() {
            self.execute();
        });

        if(this.activeLayer.featureStylingRule) {
            this.element.find('#attribute').val(this.activeLayer.featureStylingRule.attribute);
            this.element.find('#rule-active').attr('checked', this.activeLayer.featureStylingRule.active)
            this.mode = this.activeLayer.featureStylingRule.type;
            switch(this.mode) {
                case 'exact':
                    this.toggleExact();
                    $.each(this.activeLayer.featureStylingRule.filterOptions, function(idx, filterOption) {
                        self.addInput('exact', filterOption);
                    });
                    this.addInput('range');
                    break;
                case 'range':
                    this.toggleRange()
                    $.each(this.activeLayer.featureStylingRule.filterOptions, function(idx, filterOption) {
                        self.addInput('range', filterOption);
                    });
                    this.addInput('exact');
                    break;
            }

        } else {
            this.addInput('exact');
            this.addInput('range');
        }
    },
    renderLegend: function() {
        var self = this;
        var legend = this.activeLayer.filteredFeatures();
        var entries = []
        this.legendElement.empty();
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
            this.legendElement.append(tmpl(
                gbi.widgets.ThematicalVector.legendTemplate, {
                    attribute: legend.attribute,
                    type: thematicalVectorLabel[legend.type],
                    entries: entries,
                    units: units
                }
            ));
        } else {
            this.legendElement.append($('<div>' + thematicalVectorLabel.noThematicalMap + '</div>'));
        }
    },
    toggleExact: function() {
        var self = this;
        $('#toggleRange').removeClass('active');
        $('#toggleExact').addClass('active')
        $('#rangeInputDiv').hide();
        $('#exactInputDiv').show();
        self.mode = "exact";
    },
    toggleRange: function() {
        var self = this;
        $('#toggleRange').addClass('active');
        $('#toggleExact').removeClass('active')
        $('#rangeInputDiv').show();
        $('#exactInputDiv').hide();
        self.mode = "range";
    },
    fillExactInputSelect: function(element, value) {
        var self = this;
        element.empty();
        element.append($('<option disabled selected>' + thematicalVectorLabel.selectValue + '</option>'));
        var optionValues = self.activeLayer.attributeValues($('#attribute').val())
        $.each(optionValues, function(idx, value) {
            element.append($('<option value="'+ value+'">'+value+'</option>'));
        });
        if(value && $.inArray(value, optionValues) != -1) {
            element.val(value);
        }
    },
    addInput: function(mode, filterOption) {
        var idx, selectBaseId, colorBaseId, minBaseId, maxBaseId, colorClass;
        var tds = [];

        switch(mode) {
            case 'exact':
                idx = $('.exactInputControl tbody tr').length;
                selectBaseId = 'exactInputSelect_';
                colorBaseId = 'exactColor_';
                colorClass = 'exactColor';

                var select = $(gbi.widgets.ThematicalVector.selectTempalte);
                select.attr('id', selectBaseId + idx);
                this.fillExactInputSelect(select);
                if(filterOption) {
                    select.val(filterOption.value);
                }
                tds.push(select);
                break;
            case 'range':
                idx = $('.rangeInputControl tbody tr').length;
                minBaseId = 'rangeInputMin_';
                maxBaseId = 'rangeInputMax_';
                colorBaseId = 'rangeColor_';

                var minInput = $(gbi.widgets.ThematicalVector.inputTemplate);
                minInput.attr('id', minBaseId + idx);
                minInput.addClass('rangeInputMin');
                if(filterOption) {
                    minInput.val(filterOption.min || '');
                }
                tds.push(minInput);

                var maxInput = $(gbi.widgets.ThematicalVector.inputTemplate);
                maxInput.attr('id', maxBaseId + idx);
                maxInput.addClass('rangeInputMax');
                if(filterOption) {
                    maxInput.val(filterOption.max || '');
                }
                tds.push(maxInput)
        }

        var colorValue = filterOption ? filterOption.symbolizer.fillColor : gbi.widgets.ThematicalVector.defaultColors[idx];
        var color = $(gbi.widgets.ThematicalVector.colorTemplate);
        color.attr('id', colorBaseId + idx);
        color.addClass(colorClass);
        color.val(colorValue);
        tds.push(color)

        var remove = $(gbi.widgets.ThematicalVector.removeTemplate);
        remove.click(function() {
            $(this).parent().parent().remove();
        });
        tds.push(remove)

        var tr = $('<tr></tr>');
        $.each(tds, function(idx, element) {
            var td = $('<td></td>');
            td.append(element);
            tr.append(td);
        });
        $('.' + mode + 'InputControl tbody').append(tr);
        color.minicolors({
            'value': colorValue
        });
    },
    execute: function() {
        var self = this;
        var filterOptions = [];
        switch(this.mode) {
            case 'exact':
                $('.exactInputControl tbody tr').each(function(idx, element) {
                    element = $(element);
                    var value = element.find('.exactSelect').first().val() || false;
                    var color = element.find('.exactColor').first().val() || false;

                    filterOptions.push({
                        value: value,
                        symbolizer: {
                            'fillColor': color,
                            'strokeColor': color
                        }
                    });
                });
                break;
            case 'range':
                $('.rangeInputControl tbody tr').each(function(idx, element) {
                    element = $(element);
                    var min = element.find('.rangeInputMin').first().val() || false;
                    var max = element.find('.rangeInputMax').first().val() || false;
                    var color = element.find('.rangeColor').first().val() || false;
                    filterOptions.push({
                        min: min,
                        max: max,
                        symbolizer: {
                            'fillColor': color,
                            'strokeColor': color
                        }
                    })
                });
                break;
        }
        this.activeLayer.addAttributeFilter(this.mode, $('#attribute').val(), $('#rule-active').is(':checked'), filterOptions);
        if(this.legendElement) {
            this.renderLegend();
        }
        this.activeLayer._saveRule();
    }
};

gbi.widgets.ThematicalVector.defaultColors = gbi.widgets.ThematicalVector.defaultColors || [
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#770000',
    '#007700',
    '#000077',
    '#777700',
    '#770077',
    '#007777'
];

gbi.widgets.ThematicalVector.template = '\
<label for="active">\
    <input type="checkbox" id="rule-active" />\
    ' + thematicalVectorLabel.active + '\
</label>\
<div class="control-group">\
    <label class="control-label" for="attribute">' + thematicalVectorLabel.attribute + ':</label>\
    <div class="controls">\
        <select id="attribute">\
        <% for(var key in attributes) { %>\
            <option value="<%=attributes[key]%>"><%=attributes[key]%></option>\
        <% } %>\
        </select>\
    </div>\
</div>\
<div class="btn-group"\
     data-toggle="buttons-radio">\
    <button id="toggleExact"\
            type="button"\
            class="btn btn-small active">\
        ' + thematicalVectorLabel.exact + '\
    </button>\
    <button id="toggleRange"\
            type="button"\
            class="btn btn-small">\
        ' + thematicalVectorLabel.range + '\
    </button>\
</div>\
<div id="exactInputDiv">\
    <h3>' + thematicalVectorLabel.exact + '</h3>\
    <table class="exactInputControl">\
        <thead>\
            <tr>\
                <th>' + thematicalVectorLabel.choose + '</th>\
                <th>' + thematicalVectorLabel.color + '</th>\
                <th></th>\
            </tr>\
        </thead>\
        <tbody>\
        </tbody>\
    </table>\
</div>\
<div id="rangeInputDiv">\
    <h3>' + thematicalVectorLabel.range + '</h3>\
    <table class="rangeInputControl">\
        <thead>\
            <tr>\
                <th>' + thematicalVectorLabel.min + '</th>\
                <th>' + thematicalVectorLabel.max + '</th>\
                <th>' + thematicalVectorLabel.color + '</th>\
                <th></th>\
            </tr>\
        </thead>\
        <tbody>\
        </tbody>\
    </table>\
</div>\
<button class="btn btn-small btn-success" id="executeFilter">' + thematicalVectorLabel.execute + '</button>\
<button class="btn btn-small pull-right" id="addInput">' + thematicalVectorLabel.addInputField + '</button>\
';

gbi.widgets.ThematicalVector.inputTemplate = '<input type="text" id="" class="input-small">';
gbi.widgets.ThematicalVector.selectTempalte = '<select id="" class="exactSelect input-medium"></select>';
gbi.widgets.ThematicalVector.colorTemplate = '<input id="" class="color_picker styleControl input-small" value="" />';
gbi.widgets.ThematicalVector.removeTemplate = '<i class="icon-remove pointer" title="' + thematicalVectorLabel.removeInputField + '"></i>'

gbi.widgets.ThematicalVector.legendTemplate = '\
<h3>' + thematicalVectorLabel.legendFor + ' "<%=attribute%>" (<%=type%>)</h3>\
<table>\
    <thead>\
        <tr>\
            <th class="text-center">' + thematicalVectorLabel.color + '</th>\
            <th class="text-center">' + thematicalVectorLabel.value + '</th>\
            <th class="text-center">' + thematicalVectorLabel.areaIn + ' <%=units%><sup>2</sup></th>\
        </tr>\
    </thead>\
    <tbody>\
        <% for(var key in entries) { %>\
            <tr>\
                <td class="text-center"><div class="gbi_widget_legend_color inline-block" style="background-color: <%=entries[key].color%>;">&nbsp;</div></td>\
                <td class="text-center"><%=entries[key].value%></td>\
                <td class="text-center"><%=entries[key].area%></td>\
            </tr>\
        <% } %>\
    </tbody>\
</table>\
';
