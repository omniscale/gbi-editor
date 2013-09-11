var thematicalVectorAttributeListLabels = {
    'noLayer': OpenLayers.i18n('No layer selected'),
    'noAttributeSelected': OpenLayers.i18n('No attributes selected'),
    'noAttribute': OpenLayers.i18n('Layer have no attributes'),
    'shortList': OpenLayers.i18n('Short list'),
    'fullList': OpenLayers.i18n('Complete list'),
    'filter': OpenLayers.i18n('Filter')
};
var thematicalVectorAttributeListTitles = {
    'removeFilter': OpenLayers.i18n('Remove Filter'),
    'toggleShortList': OpenLayers.i18n('Show feature list with user defined attributes'),
    'toggleFullList': OpenLayers.i18n('Show feature list with all attributes'),
    'showFeature': OpenLayers.i18n('Center on feature in map'),
    'odt': OpenLayers.i18n('odt'),
    'csv': OpenLayers.i18n('csv'),
};

gbi.widgets = gbi.widgets || {};

gbi.widgets.ThematicalVectorAttributeList = function(thematicalVector, options) {
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
gbi.widgets.ThematicalVectorAttributeList.prototype = {
    render: function(_features, filterValue) {
        var self = this;
        var element = $('#' + this.options.element);
        element.empty();
        var shortListAttributes = [];
        var fullListAttributes = [];

        if(self.activeLayer) {
            shortListAttributes = self.activeLayer.shortListAttributes() || [];
            fullListAttributes = self.activeLayer.fullListAttributes() || [];
            if(fullListAttributes.length == 0) {
                fullListAttributes = self.activeLayer.featuresAttributes() || [];
            }
        }

        var features = _features || self.activeLayer.features;

        var shortListFeatures = [];
        if(features && features.length > 0) {
            features = features.slice();
            for(var i = features.length; i--; i >= 0) {
                if(features[i].state == OpenLayers.State.DELETE) {
                    features.splice(i, 1);
                }
            }
            shortListFeatures = features.slice();
        }

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
            element.append($('<div class="text-center">' + thematicalVectorAttributeListLabels.noLayer + '</div>'));
            return;
        }
        if(fullListAttributes.length == 0) {
            element.append($('<div class="text-center">' + thematicalVectorAttributeListLabels.noAttribute + '</div>'));
            return;
        }
        element.append(tmpl(
            gbi.widgets.ThematicalVectorAttributeList.template, {
                shortListAttributes: shortListAttributes,
                fullListAttributes: fullListAttributes,
                shortListFeatures: shortListFeatures,
                features: features,
                filterValue: filterValue
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
        element.find('#removeFilter').click(function() {
            self.render();
        });

        element.find('#csvExport').click(function() {
            var geoJSON = new OpenLayers.Format.GeoJSON();
            var features;
            if (filterValue) {
                features = self.activeLayer.features_filterd;
            } else {
                features = self.activeLayer.features
            }
            var geoJSONText = geoJSON.write(features);
            $.postURL(exportCSVURL, {'data': geoJSONText, 'headers': self.activeLayer.fullListAttributes()})
        });

        element.find('#odtExport').click(function() {
            var geoJSON = new OpenLayers.Format.GeoJSON();
            var features;
            if (filterValue) {
                features = self.activeLayer.features_filterd;
            } else {
                features = self.activeLayer.features
            }
            var geoJSONText = geoJSON.write(features);
            $.postURL(exportODSURL, {'data': geoJSONText, 'headers': self.activeLayer.fullListAttributes()})
        });

        element.find('.show-feature').click(function() {
            var element = $(this);
            var feature = self.activeLayer.features[element.attr('id')];
            self.activeLayer.showFeature(feature);
        });
    },
    showFilteredFeatures: function(entry) {
        var filteredFeatures = this.activeLayer.filteredFeatures().result;
        var features;
        $.each(filteredFeatures, function(idx, filterItem) {
            if(filterItem.id == entry.id) {
                features = filterItem.features;
                return true;
            }
        });
        this.activeLayer.features_filterd = features;
        this.render(features, {'attribute': entry.attribute, 'value': entry.value, 'type': entry.type});
    },
    _registerLayerEvents: function(layer) {
        var self = this;
        if(layer instanceof gbi.Layers.SaveableVector && !layer.loaded) {
            $(layer).on('gbi.layer.couch.loadFeaturesEnd', function() {
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

gbi.widgets.ThematicalVectorAttributeList.template = '\
    <% if(filterValue) { %>\
        <div>\
            <h4 class="inline-block">' + thematicalVectorAttributeListLabels.filter + ': <% if(filterValue.type == "range") { %><%=filterValue.value%><% } else { %><%=filterValue.attribute%> = <%=filterValue.value%><% } %></h4>\
            <button class="btn btn-small" id="removeFilter" title="' + thematicalVectorAttributeListTitles.removeFilter + '">\
                <i class="icon-remove"></i>\
            </button>\
        </div>\
    <% } %>\
    <div class="btn-group"\
         data-toggle="buttons-radio">\
        <button id="toggleShortList"\
                type="button"\
                title="' + thematicalVectorAttributeListTitles.toggleShortList + '"\
                class="btn btn-small active">\
            ' + thematicalVectorAttributeListLabels.shortList + '\
        </button>\
        <button id="toggleFullList"\
                type="button"\
                title="' + thematicalVectorAttributeListTitles.toggleFullList + '"\
                class="btn btn-small">\
            ' + thematicalVectorAttributeListLabels.fullList + '\
        </button>\
    </div>\
        <div class="btn-group pull-right">\
        <button id="odtExport"\
                type="button"\
                title="' + thematicalVectorAttributeListTitles.odt + '"\
                class="btn btn-small">'+ thematicalVectorAttributeListTitles.odt + '</button>\
        <button id="csvExport"\
                type="button"\
                title="' + thematicalVectorAttributeListTitles.csv + '"\
                class="btn btn-small">'+ thematicalVectorAttributeListTitles.csv + '</button>\
    </div>\
    <% if(shortListAttributes.length == 0) { %>\
        <div id="shortList">' + thematicalVectorAttributeListLabels.noAttributeSelected + '</div>\
    <% } else { %>\
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
                        <button class="btn btn-small show-feature" id="<%=f_key%>" title="' + thematicalVectorAttributeListTitles.showFeature + '">\
                            <i class="icon-fullscreen"></i>\
                        </button>\
                    </td>\
                </tr>\
                <% } %>\
            <% } %>\
            </tbody>\
        </table>\
    <% } %>\
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
                    <button class="btn btn-small show-feature" id="<%=f_key%>" title="' + thematicalVectorAttributeListTitles.showFeature + '">\
                        <i class="icon-fullscreen"></i>\
                    </button>\
                </td>\
            </tr>\
        <% } %>\
        </tbody>\
    </table>\
';
