var featureAttributeListLabels = {
    'noLayer': OpenLayers.i18n('No layer selected'),
    'noAttribute': OpenLayers.i18n('No attributes selected'),
    'reset': OpenLayers.i18n('Show all features'),
    'shortList': OpenLayers.i18n('Short list'),
    'fullList': OpenLayers.i18n('Complete list')
}

gbi.widgets = gbi.widgets || {};

gbi.widgets.FeatureAttributeList = function(thematicalVector, options) {
    if(!(thematicalVector instanceof gbi.widgets.ThematicalVector)) {
        return;
    }
    var self = this;
    var defaults = {
        element: 'featureattributelist',
        mode: 'exact',
        initOnly: false
    }
    this.options = $.extend({}, defaults, options);
    this.thematicalVector = thematicalVector;
    this.editor = thematicalVector.editor;
    this.activeLayer = this.editor.layerManager.active();
    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.activeLayer = layer;
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
    if(!this.options.initOnly) {
        self.render();
    }
};
gbi.widgets.FeatureAttributeList.prototype = {
    render: function(_features) {
        var self = this;
        var element = $('#' + this.options.element);
        element.empty();
        var shortListAttributes = self.activeLayer ? self.activeLayer.listAttributes() || [] : [];
        var fullListAttributes = self.activeLayer ? self.activeLayer.featuresAttributes() || [] : [];
        var features = features || self.activeLayer.features;
        var shortListFeatures = features.slice();

        $.each(shortListFeatures, function(idx, feature) {
            var hasValues = false;
            $.each(shortListAttributes, function(idx, attribute) {
                if(feature.attributes[attribute]) {
                    hasValues = true;
                }
            });
            feature.hasValues = hasValues;
        });
        if(!self.activeLayer) {
            element.append($('<div class="text-center">' + featureAttributeListLabels.noLayer + '</div>'));
            return;
        }
        var attributes = self.activeLayer ? self.activeLayer.listAttributes() || [] : [];

        if(attributes.length == 0) {
            element.append($('<div class="text-center">' + featureAttributeListLabels.noAttribute + '</div>'));
            return;
        }

        element.append(tmpl(
            gbi.widgets.FeatureAttributeList.template, {
                shortListAttributes: shortListAttributes,
                fullListAttributes: fullListAttributes,
                shortListFeatures: shortListFeatures,
                features: features,
                resetButton: _features ? true : false
            }
        ));

        element.find('#toggleFullList').click(function() {
            element.find('#shortList').addClass('hide');
            element.find('#fullList').removeClass('hide');
        });
        element.find('#toggleShortList').click(function() {
            element.find('#fullList').addClass('hide');
            element.find('#shortList').removeClass('hide');
        });

        if(_features) {
            element.find('#reset-list').click(function() {
                self.render();
            });
        }

        element.find('.show-feature').click(function() {
            var element = $(this);
            var feature = self.activeLayer.features[element.attr('id')];
            self.activeLayer.showFeature(feature);
        });
    },
    showFilteredFeatures: function(value) {
        var filteredFeatures = this.activeLayer.filteredFeatures().result;
        var features;
        $.each(filteredFeatures, function(idx, filterItem) {
            if(filterItem.value == value) {
                features = filterItem.features;
                return true;
            }
        });
        this.render(features);
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
    <div class="btn-group"\
         data-toggle="buttons-radio">\
        <button id="toggleShortList"\
                type="button"\
                class="btn btn-small active">\
            ' + featureAttributeListLabels.shortList + '\
        </button>\
        <button id="toggleFullList"\
                type="button"\
                class="btn btn-small">\
            ' + featureAttributeListLabels.fullList + '\
        </button>\
    </div>\
    <table id="shortList" class="table table-hover">\
        <thead>\
            <tr>\
                <% for(var key in shortListAttributes) { %>\
                    <th><%=shortListAttributes[key]%></th>\
                <% } %>\
                <th>&nbsp;</th>\
            </tr>\
        </thead>\
        <tbody>\
        <% for(var f_key in shortListFeatures) { %>\
            <% if(shortListFeatures[f_key].hasValues) { %>\
            <tr>\
                <% for(var a_key in shortListAttributes) { %>\
                    <td>\
                    <% if(features[f_key].attributes[shortListAttributes[a_key]]) { %>\
                        <%=features[f_key].attributes[shortListAttributes[a_key]]%>\
                    <% } else {%>\
                        &nbsp;\
                    <% } %>\
                    </td>\
                <% } %>\
                <td>\
                    <button class="btn btn-small show-feature" id="<%=f_key%>">\
                        <i class="icon-fullscreen"></i>\
                    </button>\
                </td>\
            </tr>\
            <% } %>\
        <% } %>\
        </tbody>\
    </table>\
    <table id="fullList" class="table table-hover hide">\
        <thead>\
            <tr>\
                <% for(var key in fullListAttributes) { %>\
                    <th><%=fullListAttributes[key]%></th>\
                <% } %>\
                <th>&nbsp;</th>\
            </tr>\
        </thead>\
        <tbody>\
        <% for(var f_key in features) { %>\
            <tr>\
                <% for(var a_key in fullListAttributes) { %>\
                    <td>\
                    <% if(features[f_key].attributes[fullListAttributes[a_key]]) { %>\
                        <%=features[f_key].attributes[fullListAttributes[a_key]]%>\
                    <% } else {%>\
                        &nbsp;\
                    <% } %>\
                    </td>\
                <% } %>\
                <td>\
                    <button class="btn btn-small show-feature" id="<%=f_key%>">\
                        <i class="icon-fullscreen"></i>\
                    </button>\
                </td>\
            </tr>\
        <% } %>\
        </tbody>\
    </table>\
';
