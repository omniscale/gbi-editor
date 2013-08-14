var thematicalVectorLabels = {
    'legend': OpenLayers.i18n('Legend'),
    'shortList': OpenLayers.i18n('Short list'),
    'fullList': OpenLayers.i18n('Complete list'),
    'settings': OpenLayers.i18n('Settings'),
    'active': OpenLayers.i18n('Active')
}

gbi.widgets = gbi.widgets || {};

gbi.widgets.ThematicalVector = function(editor, options) {
    var self = this;
    var defaults = {
        "element": "thematical-vector",
        "changeAttributes": true,
        "components": {
            configurator: true,
            legend: true,
            list: true
        }
    };
    self.options = $.extend({}, defaults, options);

    self.element = $('#' + self.options.element);
    self.editor = editor;
    self.activeLayer = self.editor.layerManager.active();
    self.active = false;

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        if(layer != self.activeLayer) {
            self.activeLayer.deactivateHover();
            self.activeLayer.deactivateFeatureStylingRule();
            self.activeLayer = layer;
            self.active = false;
            self.render();
        }
    });

    self.components = {};
    if(self.options.components.list) {
        self.components["shortList"] = new gbi.widgets.FeatureAttributeList(self, {
            'element': 'thematical-feature-short-list',
            featurePopup: 'hover',
            initOnly: true
        });
        self.components["fullList"] = new gbi.widgets.FeatureAttributeList(self, {
            'element': 'thematical-feature-full-list',
            fullList: true,
            featurePopup: 'hover',
            initOnly: true
        });
    }
    if(self.options.components.configurator) {
        self.components["configurator"] = new gbi.widgets.ThematicalVectorConfigurator(self, {
            'element': 'thematical-settings-element',
            initOnly: true
        });
    }
    if(self.options.components.legend) {
        if(self.options.changeAttributes) {
            self.components["legend"] = new gbi.widgets.ThematicalVectorLegendChangeAttributes(self, {
                'element': 'thematical-legend-element',
                'featureList': self.components.shortList,
                initOnly: true
            });
        } else {
            self.components["legend"] = new gbi.widgets.ThematicalVectorLegend(self, {
                'element': 'thematical-legend-element',
                'featureList': self.components.shortList,
                initOnly: true
            });
        }
    }
    self.render();
};
gbi.widgets.ThematicalVector.prototype = {
    CLASS_NAME: 'gbi.widgets.ThematicalVectorConfigurator',
    render: function() {
        var self = this;
        self.element.empty();
        self.element.append(tmpl(gbi.widgets.ThematicalVector.template, {active: self.active}));

        $.each(self.components, function(name, component) {
            component.render();
        });
        self.element.find('#tabs a').click(function (e) {
            e.preventDefault();
            $(self).tab('show');
        });
        self.element.find('#thematical-map-active').change(function() {
            self.active = $(this).is(':checked');
            if(self.activeLayer) {
                if(self.active) {
                    self.activeLayer.activateFeatureStylingRule();
                    self.activeLayer.activateHover();
                } else {
                    self.activeLayer.deactivateFeatureStylingRule();
                    self.activeLayer.deactivateHover();
                }
            }
            self.render();
        });
    },
    showListView: function() {
        $('#thematical-short-list-tab').tab('show');
    }
};
gbi.widgets.ThematicalVector.template = '\
<label for="thematical-map-active" class="checkbox">\
    <input type="checkbox" <% if(active) {%>checked="checked"<% } %> id="thematical-map-active" />\
    ' + thematicalVectorLabels.active + '\
</label>\
<% if(active) { %>\
    <ul id="tabs" class="nav nav-tabs">\
        <li class="active">\
            <a href="#thematical-legend" data-toggle="tab">' + thematicalVectorLabels.legend + '</a>\
        </li>\
        <li>\
            <a href="#thematical-short-list" id="thematical-short-list-tab" data-toggle="tab">' + thematicalVectorLabels.shortList + '</a>\
        </li>\
        <li>\
            <a href="#thematical-full-list" id="thematical-full-list-tab" data-toggle="tab">' + thematicalVectorLabels.fullList + '</a>\
        </li>\
        <li>\
            <a href="#thematical-settings" data-toggle="tab">' + thematicalVectorLabels.settings + '</a>\
        </li>\
    </ul>\
    <div class="tab-content">\
        <div class="tab-pane fade in active" id="thematical-legend">\
            <h4>' + thematicalVectorLabels.legend + '</h4>\
            <div id="thematical-legend-element"></div>\
        </div>\
        <div class="tab-pane fade" id="thematical-short-list">\
            <h4>' + thematicalVectorLabels.shortList + '</h4>\
            <div id="thematical-feature-short-list"></div>\
        </div>\
        <div class="tab-pane fade" id="thematical-full-list">\
            <h4>' + thematicalVectorLabels.fullList + '</h4>\
            <div id="thematical-feature-full-list"></div>\
        </div>\
        <div class="tab-pane fade" id="thematical-settings">\
            <div id="thematical-settings-element"></div>\
        </div>\
    </div>\
<% } %>\
';
