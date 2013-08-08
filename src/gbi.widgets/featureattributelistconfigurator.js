var featuresAttributeListLabel = {
    'attribute': OpenLayers.i18n('Attributes'),
    'showInList': OpenLayers.i18n('Show in list'),
    'showInPopup': OpenLayers.i18n('Show in popup'),
    'apply': OpenLayers.i18n('Apply')
};



gbi.widgets = gbi.widgets || {};

gbi.widgets.FeatureAttributesListConfigurator = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'featureattributelistconfigurator',
        mode: 'exact'
    }
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);
    this.editor = editor;
    this.activeLayer = editor.layerManager.active();

    $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
        self.activeLayer = layer;
        if(self.activeLayer instanceof gbi.Layers.SaveableVector && !self.activeLayer.loaded) {
            $(gbi).on('gbi.layer.couch.loadFeaturesEnd', function() {
                self.attributes = self.activeLayer.featuresAttributes();
                self.render();
            });
        } else {
            self.attributes = self.activeLayer ? self.activeLayer.featuresAttributes() : [];
            self.render();
        }
    });
    $(gbi).on('gbi.layer.couch.loadFeaturesEnd', function() {
        self.attributes = self.activeLayer.featuresAttributes();
        self.render();
    });
};
gbi.widgets.FeatureAttributesListConfigurator.prototype = {
    render: function() {
        var self = this;
        this.element.empty();
        this.element.append(tmpl(
            gbi.widgets.FeatureAttributesListConfigurator.template, {
                attributes: self.attributes
            }
        ));

        var listAttributes = self.activeLayer ? self.activeLayer.listAttributes() : [];
        var popupAttributes = self.activeLayer ? self.activeLayer.popupAttributes() : [];

        if(listAttributes) {
            this.element.find('.list-attribute').each(function(idx, elm) {
                if($.inArray(elm.value, listAttributes) != -1) {
                    $(elm).attr('checked', 'checked');
                }
            })
        }

        if(popupAttributes) {
            this.element.find('.popup-attribute').each(function(idx, elm) {
                if($.inArray(elm.value, popupAttributes) != -1) {
                    $(elm).attr('checked', 'checked');
                }
            })
        }

        this.element.find('#sortable').sortable();

        $('#setListAttributes').click(function() {
            var listAttributes = [];
            var popupAttributes = [];
            $.each(self.element.find('.list-attribute:checked'), function(idx, checkbox) {
                listAttributes.push(checkbox.value);
            });
            $.each(self.element.find('.popup-attribute:checked'), function(idx, checkbox) {
                popupAttributes.push(checkbox.value);
            });
            self.activeLayer.listAttributes(listAttributes);
            self.activeLayer.popupAttributes(popupAttributes);
            if(self.activeLayer instanceof gbi.Layers.Couch) {
                self.activeLayer._saveGBIData();
            }
        })
    }
};

gbi.widgets.FeatureAttributesListConfigurator.template = '\
    <table class="table">\
        <thead>\
            <tr>\
                <th>' + featuresAttributeListLabel.attribute + '</th>\
                <th>' + featuresAttributeListLabel.showInList + '</th>\
                <th>' + featuresAttributeListLabel.showInPopup + '</th>\
            </tr>\
        </thead>\
        <tbody id="sortable">\
            <% for(var a_key in attributes) { %>\
                <tr>\
                    <td><%=attributes[a_key]%></td>\
                    <td><input type="checkbox" class="list-attribute" value="<%=attributes[a_key]%>" /></td>\
                    <td><input type="checkbox" class="popup-attribute" value="<%=attributes[a_key]%>" /></td>\
                </tr>\
            <% } %>\
        </tbody>\
    </table>\
    <div class="text-center">\
        <button id="setListAttributes">' + featuresAttributeListLabel.apply + '</button>\
    </div>\
';