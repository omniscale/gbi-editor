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
        this.hoverCtrl = new gbi.Controls.Select(this.activeLayer, {
            hover: true,
            highlightOnly: true,
            renderIntent: "temporary",
            autoActivate: true,
            eventListeners: {
            //trigger events in layer couse events only triggered in control
            featurehighlighted: function(f) {
                self.activeLayer.triggerEvent('featurehighlighted', {feature: f.feature})
            },
            featureunhighlighted: function(f) {
                console.log('here')
                self.activeLayer.triggerEvent('featureunhighlighted', {feature: f.feature})
            }
        }
        });
        this.editor.map.addControl(this.hoverCtrl);
        this.hoverCtrl.activate();
    }
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
    $(gbi).on('gbi.layer.vector.listAttributesChanged', function() {
        self.render();
    });
    $(gbi).on('gbi.layer.vector.featureAttributeChanged', function() {
        self.render();
    });
};
gbi.widgets.FeatureAttributeList.prototype = {
    render: function() {
        var self = this;
        this.element.empty();

        var attributes = self.activeLayer.listAttributes() || [];

        if(attributes.length > 0) {
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
        } else {
            this.element.append($('<div class="text-center">No attributes selected</div>'))
        }
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
                    <td><%=features[f_key].attributes[attributes[a_key]]%></td>\
                <% } %>\
            </tr>\
        <% } %>\
    </table>\
';