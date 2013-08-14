var thematicalVectorLegendChangeAttributesLabel = {
    'applyChanges': OpenLayers.i18n('Apply changes'),
    'discardChanges': OpenLayers.i18n('Discard changes')
};

gbi.widgets = gbi.widgets || {};

gbi.widgets.ThematicalVectorLegendChangeAttributes = function(thematicalVector, options) {
    gbi.widgets.ThematicalVectorLegend.call(this, thematicalVector, $.extend({}, options));
};
gbi.widgets.ThematicalVectorLegendChangeAttributes.prototype = new gbi.widgets.ThematicalVectorLegend();
$.extend(gbi.widgets.ThematicalVectorLegendChangeAttributes.prototype, {
    render: function() {
        var self = this;
        var element = $('#' + this.options.element);
        gbi.widgets.ThematicalVectorLegend.prototype.render.call(this);
        if(self.legend && self.legend.type == 'exact') {
            element.append(tmpl(
                gbi.widgets.ThematicalVectorLegendChangeAttributes.template
            ));

            element.find('.gbi_widget_legend_color').click(function() {
                var _this = $(this);
                var id = _this.attr('id').split('_')[1]
                self._removeSelectControl(element);
                self._addSelectControl(element, id, self.legend.attribute, _this.children().first().text())
            });

            if(self.activeLayer instanceof gbi.Layers.SaveableVector) {
                self.activeLayer.registerCallback('changes', function() {
                    element.find('#applyChanges').first().removeAttr('disabled');
                    element.find('#discardChanges').first().removeAttr('disabled');
                })
                self.activeLayer.registerCallback('success', function() {
                    element.find('#applyChanges').first().attr('disabled', 'disabled');
                    element.find('#discardChanges').first().attr('disabled', 'disabled');
                })
                element.find('#applyChanges').first().click(function() {
                    self.activeLayer.save();
                    self._removeSelectControl(element);
                    self.render();
                });
                element.find('#discardChanges').first().click(function() {
                    self.activeLayer.olLayer.refresh();
                    self._removeSelectControl(element);
                    element.find('#applyChanges').first().attr('disabled', 'disabled');
                    element.find('#discardChanges').first().attr('disabled', 'disabled');
                });
            }
        }
    },
    _addSelectControl: function(element, id, attribute, value) {
        var self = this;
        element.find('#_' + id + '_row').addClass('warning')
        self.selectControl = new gbi.Controls.Select(self.activeLayer);
        self.selectControlObject = {attribute: attribute, value: value, self: self};
        self.editor.map.addControl(self.selectControl)
        self.activeLayer.registerEvent('featureselected', self.selectControlObject, self._changeFeatureAttributeValue);
        self.selectControl.activate();
    },
    _removeSelectControl: function(element) {
        var self = this;
        if(self.selectControl) {
            self.selectControl.deactivate();
            element.find('tr.warning').removeClass('warning');
            self.activeLayer.unregisterEvent('featureselected', self.selectControlObject, self._changeFeatureAttributeValue)
            self.editor.map.removeControl(self.selectControl);
            self.selectControl = false;
            self.selectControlObject = false;
        }
    },
    _changeFeatureAttributeValue: function(f) {
        this.self.activeLayer.changeFeatureAttribute(f.feature, this.attribute, this.value);
        this.self.selectControl.unselectFeature(f.feature);
        this.self.updateAreas($('#' + this.self.options.element));
    }
});


gbi.widgets.ThematicalVectorLegendChangeAttributes.template = '\
    <button id="applyChanges" class="btn btn-small btn-success" disabled="disabled">' + thematicalVectorLegendChangeAttributesLabel.applyChanges + '</button>\
    <button id="discardChanges" class="btn btn-small" disabled="disabled">' + thematicalVectorLegendChangeAttributesLabel.discardChanges + '</button>\
';
