var styleEditorLabel = {
    'attributeLabel': OpenLayers.i18n('Attribute label'),
    'labelColor': OpenLayers.i18n('Label color'),
    'labelSize': OpenLayers.i18n('Label size'),
    'radius': OpenLayers.i18n('Radius'),
    'strokeWidth': OpenLayers.i18n('Stroke width'),
    'strokeColor': OpenLayers.i18n('Stroke color'),
    'strokeOpacity': OpenLayers.i18n('Stroke opacity'),
    'fillColor': OpenLayers.i18n('Fill color'),
    'fillOpacity': OpenLayers.i18n('Fill opacity'),
    'styleLayer': OpenLayers.i18n('Style layer'),
    'point': OpenLayers.i18n('Point'),
    'line': OpenLayers.i18n('Line'),
    'polygon': OpenLayers.i18n('Polygon')
}

gbi.widgets = gbi.widgets || {};

gbi.widgets.StyleEditor = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'styleeditor'
    };

    this.layerManager = editor.layerManager;
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);

    this.stylingLayer = this.layerManager.active();

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.stylingLayer = layer;
        self.render();
    });

    this.render();
};
gbi.widgets.StyleEditor.prototype = {
    CLASS_NAME: 'gbi.widgets.StyleEditor',
    render: function() {
        var self = this;
        this.element.empty();

        this.element.append(tmpl(gbi.widgets.StyleEditor.template, {symbolizer: this.stylingLayer.symbolizers}));

        var zIndex = 1000;
        $('.color_picker').each(function() {
            $(this).minicolors({
                'value': $(this).val(),
                change: function() {
                    self.setStyle();
                }
            });
            $(this).parent().css('cssText', 'z-index: '+(zIndex--)+ '!important;');
        });

        var sliderOpts = {
            range: [0, 100],
            start: 100,
            step: 1,
            handles: 1,
            slide: function() {
                self.setStyle();
            }
        }

        $('.noUiSlider').each(function() {
            $(this).noUiSlider($.extend(sliderOpts, {serialization: {to: $(this).prev()}}));
        });

        if(this.stylingLayer.symbolizers) {
            $.each(this.stylingLayer.symbolizers, function(type, style) {
                if (!type.match(/^_/)) {
                    $.each(style, function(key, value) {
                        var cssClass = '.' + type.toLowerCase() + '_' + key;
                        if (key.match('Opacity')) {
                            value = value * 100;
                            $(cssClass+".noUiSlider").val(value);
                        }

                        $(cssClass).val(value);
                    });
                }
            });
        }

        $(".styleControl").keyup(function() {
            self.setStyle();
        }).change(function() {
            self.setStyle();
        });
    },
    setStyle: function() {
        var self = this;
        var symbolizers = {};
        var point = {};
        $.each(['.point_label', '.point_fontColor', '.point_fontSize', '.point_pointRadius', '.point_strokeWidth', '.point_strokeOpacity', '.point_strokeColor', '.point_fillOpacity', '.point_fillColor'], function(idx, id) {
            self._setStyleProperty(id, point);
        });
        var line = {};
        $.each(['.line_label', '.line_fontColor', '.line_fontSize', '.line_strokeWidth', '.line_strokeOpacity', '.line_strokeColor'], function(idx, id) {
            self._setStyleProperty(id, line);
        });
        var polygon = {};
        $.each(['.polygon_label', '.polygon_fontColor', '.polygon_fontSize', '.polygon_strokeWidth', '.polygon_strokeOpacity', '.polygon_strokeColor', '.polygon_fillOpacity', '.polygon_fillColor'], function(idx, id) {
            self._setStyleProperty(id, polygon);
        });
        if(Object.keys(point).length > 0) {
            symbolizers["Point"] = point;
        }
        if(Object.keys(line).length > 0) {
            symbolizers["Line"] = line;
        }
        if(Object.keys(polygon).length > 0) {
            symbolizers["Polygon"] = polygon;
        }
        if(Object.keys(symbolizers).length > 0) {
            this.stylingLayer.setStyle(symbolizers);
            if(this.stylingLayer instanceof gbi.Layers.Couch) {
                this.stylingLayer._saveStyle();
            }
        }
    },
    _setStyleProperty: function(id, obj) {
        var value = $(id).val();
        if(value) {
            if(id.endsWith('Color')) {
                value = value;
            } else if (id.endsWith('label')) {
                value = '${' + value + '}';
            } else if (id.endsWith('Opacity')) {
                value = parseFloat(value) / 100;
            } else {
                value = parseFloat(value)
            }
        } else {
            value = null;
        }
        obj[id.split('_')[1]] = value;
    }
};
gbi.widgets.StyleEditor.template = '\
<form class="form-horizontal" id="styleeditor-form">\
    <h4>'+styleEditorLabel.point+'</h4>\
    <div class="control-group">\
        <label class="control-label" for="point_label">'+styleEditorLabel.attributeLabel+':</label>\
        <div class="controls">\
            <input id="point_label" class="point_label styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_fontColor">'+styleEditorLabel.labelColor+':</label>\
        <div class="controls">\
            <input id="point_fontColor" class="point_fontColor color_picker styleControl input-small" value="<%=symbolizer.Point.fontColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_fontSize">'+styleEditorLabel.labelSize+':</label>\
        <div class="controls">\
            <input id="point_fontSize" class="point_fontSize styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_pointRadius">'+styleEditorLabel.radius+':</label>\
        <div class="controls">\
            <input id="point_pointRadius" class="point_pointRadius styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_strokeWidth">'+styleEditorLabel.strokeWidth+':</label>\
        <div class="controls">\
            <input id="point_strokeWidth" class="point_strokeWidth styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_strokeColor">'+styleEditorLabel.strokeColor+':</label>\
        <div class="controls">\
            <input id="point_strokeColor" class="color_picker point_strokeColor styleControl input-small" value="<%=symbolizer.Point.strokeColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_strokeOpacity">'+styleEditorLabel.strokeOpacity+':</label>\
        <div class="controls">\
            <input id="point_strokeOpacity" class="point_strokeOpacity styleControl input-small" /><div class="noUiSlider point_strokeOpacity"></div>\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_fillColor">'+styleEditorLabel.fillColor+':</label>\
        <div class="controls">\
            <input id="point_fillColor" class="color_picker point_fillColor styleControl input-small" value="<%=symbolizer.Point.fillColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="point_fillOpacity">'+styleEditorLabel.fillOpacity+':</label>\
        <div class="controls">\
            <input id="point_fillOpacity" class="point_fillOpacity styleControl input-small" /><div class="noUiSlider point_fillOpacity"></div>\
        </div>\
    </div>\
    <h4>'+styleEditorLabel.line+'</h4>\
    <div class="control-group">\
        <label class="control-label" for="line_label">'+styleEditorLabel.attributeLabel+':</label>\
        <div class="controls">\
            <input id="line_label" class="line_label styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="line_fontColor">'+styleEditorLabel.labelColor+':</label>\
        <div class="controls">\
            <input id="line_fontColor" class="line_fontColor color_picker styleControl input-small" value="<%=symbolizer.Line.labelColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="line_fontSize">'+styleEditorLabel.labelSize+':</label>\
        <div class="controls">\
            <input id="line_fontSize" class="line_fontSize styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="line_strokeWidth">'+styleEditorLabel.strokeWidth+':</label>\
        <div class="controls">\
            <input id="line_strokeWidth" class="line_strokeWidth styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="line_strokeColor">'+styleEditorLabel.strokeColor+':</label>\
        <div class="controls">\
            <input id="line_strokeColor" class="color_picker line_strokeColor styleControl input-small" value="<%=symbolizer.Line.strokeColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="line_strokeOpacity">'+styleEditorLabel.strokeOpacity+':</label>\
        <div class="controls">\
            <input id="line_strokeOpacity" class="line_strokeOpacity styleControl input-small" /><div class="noUiSlider line_strokeOpacity"></div>\
        </div>\
    </div>\
    <h4>'+styleEditorLabel.polygon+'</h4>\
    <div class="control-group">\
        <label class="control-label" for="polygon_label">'+styleEditorLabel.attributeLabel+':</label>\
        <div class="controls">\
            <input id="polygon_label" class="polygon_label styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="polygon_fontColor">'+styleEditorLabel.labelColor+':</label>\
        <div class="controls">\
            <input id="polygon_fontColor" class="polygon_fontColor color_picker styleControl input-small" value="<%=symbolizer.Polygon.labelColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="polygon_fontSize">'+styleEditorLabel.labelSize+':</label>\
        <div class="controls">\
            <input id="polygon_fontSize" class="polygon_fontSize styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="polygon_strokeWidth">'+styleEditorLabel.strokeWidth+':</label>\
        <div class="controls">\
            <input id="polygon_strokeWidth" class="polygon_strokeWidth styleControl input-small" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="polygon_strokeColor">'+styleEditorLabel.strokeColor+':</label>\
        <div class="controls">\
            <input id="polygon_strokeColor" class="color_picker polygon_strokeColor styleControl input-small" value="<%=symbolizer.Polygon.strokeColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="polygon_strokeOpacity">'+styleEditorLabel.strokeOpacity+':</label>\
        <div class="controls">\
            <input id="polygon_strokeOpacity" class="polygon_strokeOpacity styleControl input-small" /><div class="noUiSlider polygon_strokeOpacity"></div>\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="polygon_fillColor">'+styleEditorLabel.fillColor+':</label>\
        <div class="controls">\
            <input id="polygon_fillColor" class="color_picker polygon_fillColor styleControl input-small" value="<%=symbolizer.Polygon.fillColor%>" />\
        </div>\
    </div>\
    <div class="control-group">\
        <label class="control-label" for="polygon_fillOpacity">'+styleEditorLabel.fillOpacity+':</label>\
        <div class="controls">\
            <input id="Polygon_fillOpacity" class="polygon_fillOpacity styleControl input-small" /><div class="noUiSlider polygon_fillOpacity"></div>\
        </div>\
    </div>\
</form>\
';
