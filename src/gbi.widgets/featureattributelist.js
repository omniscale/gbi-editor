gbi.widgets = gbi.widgets || {};

gbi.widgets.FeatureAttributeList = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'featureattributelist',
        mode: 'exact'
    }
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);
    this.editor = editor;
    this.activeLayer = editor.layerManager.active();
    if(this.options.featurePopup == 'hover') {
        this.hoverCtrl = new gbi.Controls.Hover(this.activeLayer);
        this.editor.map.addControl(this.hoverCtrl);
    }
    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.activeLayer = layer;
        self.hoverCtrl.changeLayer(layer);
        if(self.activeLayer) {
            self._registerLayerEvents(self.activeLayer);
            self.attributes = self.activeLayer.featuresAttributes() || [];
        } else {
            self.attributes = [];
        }
        self.render();

    });
    if(this.activeLayer) {
        this._registerLayerEvents(this.activeLayer);
        this.attributes = this.activeLayer.featuresAttributes() || [];
    } else {
        this.attributes = [];
    }
    self.render();
};
gbi.widgets.FeatureAttributeList.prototype = {
    render: function() {
        var self = this;
        this.element.empty();

        if(!self.activeLayer) {
            this.element.append($('<div class="text-center">No layer selected</div>'));
            return;
        }

        var attributes = self.activeLayer ? self.activeLayer.listAttributes() || [] : [];

        if(attributes.length == 0) {
            this.element.append($('<div class="text-center">No attributes selected</div>'));
            return;
        }

        this.element.append(tmpl(
            gbi.widgets.FeatureAttributeList.template, {
                attributes: self.activeLayer.listAttributes() || self.attributes,
                features: self.activeLayer.features
            }
        ));

        this.element.find('.show-feature').click(function() {
            var element = $(this);
            var feature = self.activeLayer.features[element.attr('id')];
            self.activeLayer.showFeature(feature);
        });
    },
    _registerLayerEvents: function(layer) {
        var self = this;
        if(layer instanceof gbi.Layers.SaveableVector && !layer.loaded) {
            $(layer).on('gbi.layer.couch.loadFeaturesEnd', function() {
                self.attributes = layer.featuresAttributes();
                self.render();
            });
        }
        $(layer).on('gbi.layer.vector.listAttributesChanged', function() {
            self.render();
        });
        $(layer).on('gbi.layer.vector.featureAttributeChanged', function() {
            self.render();
        });
    }
};

gbi.widgets.FeatureAttributeList.template = '\
    <table class="table table-hover">\
        <tr>\
            <% for(var key in attributes) { %>\
                <th><%=attributes[key]%></th>\
            <% } %>\
        </tr>\
        <% for(var f_key in features) { %>\
            <tr class="show-feature" id="<%=f_key%>">\
                <% for(var a_key in attributes) { %>\
                    <td>\
                    <% if(features[f_key].attributes[attributes[a_key]]) { %>\
                        <%=features[f_key].attributes[attributes[a_key]]%>\
                    <% } else {%>\
                        &nbsp;\
                    <% } %>\
                    </td>\
                <% } %>\
            </tr>\
        <% } %>\
    </table>\
';