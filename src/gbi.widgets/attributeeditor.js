var attributeEditorLabel = {
    'noAttributes': OpenLayers.i18n('No attributes'),
    'remove': OpenLayers.i18n('remove'),
    'formTitle': OpenLayers.i18n('Add attribute'),
    'key': OpenLayers.i18n('Key'),
    'value': OpenLayers.i18n('Value'),
    'add': OpenLayers.i18n('Add'),
    'saveAttributes': OpenLayers.i18n('Save attributes')

}

gbi.widgets = gbi.widgets || {};

gbi.widgets.AttributeEditor = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'attributeeditor'
    };
    this.keyIDs = {};
    this.keyCounter = 0;
    this.featuresAttributes = {};
    this.newAttributes = {};
    this.layerManager = editor.layerManager;
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);
    this.selectedFeatures = [];
    this.changed = false;

    $.each(this.layerManager.vectorLayers, function(idx, layer) {
        layer.registerEvent('featureselected', self, function(f) {
            this.selectedFeatures.push(f.feature);
            this._attributes();
        });
        layer.registerEvent('featureunselected', self, function(f) {
            var idx = this.selectedFeatures.indexOf(f.feature);
            if(idx != -1) {
                this.selectedFeatures.splice(idx, 1);
                this._attributes();
            }
        });
    });
};
gbi.widgets.AttributeEditor.prototype = {
    CLASS_NAME: 'gbi.widgets.AttributeEditor',
    render: function() {
        var self = this;
        this.element.empty();
        if(this.selectedFeatures.length > 0) {
            this.element.append(tmpl(
                gbi.widgets.AttributeEditor.template,
                {attributes: $.extend({}, this.featuresAttributes, this.newAttributes), keyIDs: this.keyIDs}
            ));
            //bind events
            $.each($.extend({}, this.featuresAttributes, this.newAttributes), function(key, value) {
                $('#_'+self.keyIDs[key]).change(function() {
                    var newVal = $('#_'+self.keyIDs[key]).val();
                    self.edit(key, newVal);
                });
                $('#_'+self.keyIDs[key]+'_remove').click(function() {
                    self.remove(key);
                });
            });
            $('#addKeyValue').click(function() {
                var key = $('#_newKey').val();
                var val = $('#_newValue').val();
                self.add(key, val);
            });
            $('#saveAttributes').click(function() {
                self._applyAttributes();
            });
            if(!this.changed) {
                $('#saveAttributes').attr('disabled', 'disabled');
            }
        }
    },
    add: function(key, value) {
        if(!this.newAttributes[key] && !this.featuresAttributes[key]) {
            this.newAttributes[key] = value;
            this.keyIDs[key] = this.keyCounter++;
            this.changed = true;
            this.render();
        }
    },
    edit: function(key, value) {
        if(key in this.featuresAttributes) {
            this.featuresAttributes[key] = value;
            this.changed = true;
            this.render();
        } else if (key in this.newAttributes) {
            this.newAttributes[key] = value;
            this.changed = true;
            this.render();
        }
    },
    remove: function(key) {
        delete this.featuresAttributes[key];
        delete this.newAttributes[key];
        delete this.keyIDs[key];
        this.changed = true;
        this.render();
    },
    _applyAttributes: function() {
        var self = this;
        $.each(this.selectedFeatures, function(idx, feature) {
            feature.attributes = $.extend({}, self.featuresAttributes, self.newAttributes);
            var gbiLayer = self.layerManager.layerById(feature.layer.gbiId);
            if(gbiLayer instanceof gbi.Layers.SaveableVector) {
                if(feature.state != OpenLayers.State.INSERT) {
                    feature.state = OpenLayers.State.UPDATE;
                }
                gbiLayer.changesMade();
            }
        });
    },
    _attributes: function() {
        var self = this;
        this.element.empty();
        this.featuresAttributes = {};
        var newFeatureAttributes = false;
        if(this.selectedFeatures.length == 0) {
            this.attributeLayers = null;
            this.newAttributes = {};
            this.changed = false;
        } else {
            $.each(this.selectedFeatures, function(idx, feature) {
                $.each(feature.attributes, function(key, value) {
                    if(!(key in self.featuresAttributes)) {
                        self.featuresAttributes[key] = value;
                        self.keyIDs[key] = self.keyCounter++;
                        if(idx>0) {
                            newFeatureAttributes = true;
                        }
                    }
                });
                if(!newFeatureAttributes) {
                    $.each(self.featuresAttributes, function(key, value) {
                        if(!(key in feature.attributes)) {
                            newFeatureAttributes = true;
                        }
                    });
                }
            });
            this.changed = newFeatureAttributes || Object.keys(this.newAttributes).length > 0;
        }
        this.render();
    }
};
gbi.widgets.AttributeEditor.template = '\
<% if(Object.keys(attributes).length == 0) { %>\
    <span>'+attributeEditorLabel.noAttributes+'</span>\
<% } else { %>\
    <% for(var key in attributes) { %>\
        <form id="view_attributes" class="form-inline">\
            <label class="key-label" for="_<%=keyIDs[key]%>"><%=key%></label>\
            <input class="input-medium" type="text" id="_<%=keyIDs[key]%>" value="<%=attributes[key]%>" />\
            <button id="_<%=keyIDs[key]%>_remove" title="remove" class="btn btn-small"> \
                <i class="icon-remove"></i>\
            </button> \
        </form>\
    <% } %>\
<% } %>\
<hr>\
<h5>'+attributeEditorLabel.formTitle+'</h5>\
<form class="form-inline"> \
    <label class="key-label" for="_newKey">'+attributeEditorLabel.key+'</label> \
    <input type="text" id="_newKey" class="input-medium">\
</form>\
<form class="form-inline"> \
    <label class="key-label" for="_newValue">'+attributeEditorLabel.value+'</label> \
    <input type="text" id="_newValue" class="input-medium">\
</form>\
<button id="addKeyValue" class="btn btn-small">'+attributeEditorLabel.add+'</button>\
<hr>\
<button class="btn btn-small" id="saveAttributes">'+attributeEditorLabel.saveAttributes+'</button>\
';
