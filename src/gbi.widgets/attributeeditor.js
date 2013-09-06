var attributeEditorLabel = {
    'noAttributes': OpenLayers.i18n('No attributes'),
    'key': OpenLayers.i18n('Key'),
    'val': OpenLayers.i18n('Value'),
    'add': OpenLayers.i18n('Add'),
    'formTitle': OpenLayers.i18n('Add attribute'),
    'addAttributesNotPossible': OpenLayers.i18n('No new attributes posible'),
    'sameKeyDifferentValue': OpenLayers.i18n('Different values for same attribute'),
    'featuresWithInvalidAttributes': OpenLayers.i18n('Features with non valid attributes present'),
    'invalidFeaturesLeft': OpenLayers.i18n('features with invalid attributes left'),
    'next': OpenLayers.i18n('Next'),
    'prev': OpenLayers.i18n('Previous'),
    'additionalProperties': OpenLayers.i18n('Additional attributes'),
    'schemaViolatingAttribute': OpenLayers.i18n('This attribute is not defined in given schema. Remove it!'),
    'addJsonSchemaUrl': OpenLayers.i18n('Add JSONSchema URL')
}

gbi.widgets = gbi.widgets || {};

gbi.widgets.AttributeEditor = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'attributeeditor',
        alpacaSchemaElement: 'alpaca_schema',
        alpacaNonSchemaElement: 'alpaca_non_schema',
        allowNewAttributes: true
    };
    this.layerManager = editor.layerManager;
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);
    this.selectedFeatures = [];
    this.featureChanges = {};
    this.invalidFeatures = [];
    this.selectedInvalidFeature = false;
    this.changed = false;
    this.labelValue = undefined;
    this.renderAttributes = false;
    this.jsonSchema = this.options.jsonSchema || false;

    $.alpaca.registerView(gbi.widgets.AttributeEditor.alpacaViews.edit)
    $.alpaca.registerView(gbi.widgets.AttributeEditor.alpacaViews.display)

    var activeLayer = this.layerManager.active();
    var listenOn = activeLayer instanceof gbi.Layers.Couch ? 'gbi.layer.couch.loadFeaturesEnd' : 'gbi.layer.saveableVector.loadFeaturesEnd';
    if(!activeLayer.loaded) {
        $(activeLayer).on(listenOn, function() {
            self.render();
            $(activeLayer).off(listenOn, this);
        });
    }

    this.registerEvents();

    $(gbi).on('gbi.layermanager.layer.add', function(event, layer) {
       self.registerEvents();
    });

    self.render();
};

gbi.widgets.AttributeEditor.prototype = {
    CLASS_NAME: 'gbi.widgets.AttributeEditor',

    registerEvents: function() {
        var self = this;
        $.each(self.layerManager.vectorLayers, function(idx, layer) {
            layer.registerEvent('featureselected', self, function(f) {
                if(!(f.feature.id in self.featureChanges)) {
                    self.featureChanges[f.feature.id] = {'added': {}, 'edited': {}, 'removed': []};
                }
                self.jsonSchema = layer.jsonSchema || this.options.jsonSchema || false;
                if(self.invalidFeatures) {
                    var id = self._isInvalidFeature(f.feature);
                    if(id != -1) {
                        self.selectedInvalidFeature = self.invalidFeatures[id];
                    }
                }
                self.selectedFeatures.push(f.feature);
                self.render();
            });
            layer.registerEvent('featureunselected', self, function(f) {
                if(self.selectedInvalidFeature && self.selectedInvalidFeature.feature.id == f.feature.id) {
                    self.selectedInvalidFeature = false;
                }
                var idx = $.inArray(f.feature, self.selectedFeatures);
                if(idx != -1) {
                    self.selectedFeatures.splice(idx, 1);
                    self.render();
                }
            });
        });
    },
    render: function() {
        var self = this;
        var activeLayer = this.layerManager.active();
        self.invalidFeatures = $.isFunction(activeLayer.validateFeaturesAttributes) ? activeLayer.validateFeaturesAttributes() : [];
        var attributes = self.jsonSchema ? activeLayer.schemaAttributes() : this.renderAttributes || activeLayer.featuresAttributes();
        this.element.empty();

        if(!self.jsonSchema) {
            this.element.append(tmpl(gbi.widgets.AttributeEditor.addSchemaTemplate));
            $('#add_json_schema_url').click(function() {
                $(activeLayer).on('gbi.layer.vector.schemaLoaded', function(event, schema) {
                    self.setJsonSchema(schema);
                });
                var schemaURL = $('#json_schema_url').val();
                activeLayer.addSchemaFromUrl(schemaURL);
            })
        }
        if(self.invalidFeatures && self.invalidFeatures.length > 0) {
            self.renderInvalidFeatures(activeLayer);
        } else {
            self.selectedInvalidFeature = false;
        }

        if(self.selectedFeatures.length > 0) {
            self.renderInputMask(attributes, activeLayer);
        }

        //prepare list of all possible rendered attributes
        var renderedAttributes = [];
        if(self.jsonSchema) {
            renderedAttributes = activeLayer.schemaAttributes();
        }
        if(this.renderAttributes) {
            $.each(this.renderAttributes, function(idx, attribute) {
                if($.inArray(attribute, renderedAttributes) == -1) {
                    renderedAttributes.push(attribute);
                }
            });
        }
        $.each(activeLayer.featuresAttributes(), function(idx, attribute) {
            if($.inArray(attribute, renderedAttributes) == -1) {
                renderedAttributes.push(attribute);
            }
        });

        //bind events
        $.each(renderedAttributes, function(idx, key) {
            $('#'+key).change(function() {
                var newVal = $('#'+key).val();
                self.edit(key, newVal);
            });
            $('#_'+key+'_remove').click(function() {
                self.remove(key);
                return false;
            });
            $('#_'+key+'_label').click(function() {
                self.label(key);
                return false;
            });
        });
        $('#addKeyValue').click(function() {
            var key = $('#_newKey').val();
            var val = $('#_newValue').val();
            if (key && val) {
                self.add(key, val);
                self._applyAttributes();
            }
            return false;
        });
    },
    renderInvalidFeatures: function(activeLayer) {
        var self = this;
        this.element.append(tmpl(
            gbi.widgets.AttributeEditor.invalidFeaturesTemplate, {
                features: self.invalidFeatures
            }
        ));

        var id = -1;
        if(self.selectedInvalidFeature) {
            id = self._isInvalidFeature(self.selectedInvalidFeature.feature);
        }
        if(!self.selectedInvalidFeature || id == 0 || self.invalidFeatures.length == 1) {
            $('#prev_invalid_feature').attr('disabled', 'disabled');
        }  else {
            $('#prev_invalid_feature').removeAttr('disabled');
        }
        if(self.selectedInvalidFeature && (id >= self.invalidFeatures.length - 1 || self.invalidFeatures.length == 1)) {
            $('#next_invalid_feature').attr('disabled', 'disabled');
        } else {
            $('#next_invalid_feature').removeAttr('disabled');
        }

        $('#prev_invalid_feature').click(function() {
            var idx = id - 1;
            self.showInvalidFeature(idx, activeLayer);
        });

        $('#next_invalid_feature').click(function() {
            var idx = id + 1;
            self.showInvalidFeature(idx, activeLayer);
        });
    },
    showInvalidFeature: function(idx, activeLayer) {
        var self = this;
        self.selectedInvalidFeature = self.invalidFeatures[idx];
        activeLayer.selectFeature(self.selectedInvalidFeature.feature, true);
        activeLayer.showFeature(self.selectedInvalidFeature.feature);
    },
    renderInputMask: function(attributes, activeLayer) {
        var self = this;
        var selectedFeatureAttributes = {};
        var editable = true;

        $.each(self.selectedFeatures, function(idx, feature) {
            if(feature.layer != activeLayer.olLayer) {
                editable = false;
            }
        });

        if(self.jsonSchema) {
            var schemaOptions = {"fields": {}};
            var nonSchemaOptions = {"fields": {}};

            $.each(self.jsonSchema.properties, function(name, prop) {
                schemaOptions.fields[name] = {'id': name};
            });

            var nonSchema = {
                "title": attributeEditorLabel.additionalProperties,
                "type": "object",
                "properties": {}
            }

            var data = {};
            $.each(this.selectedFeatures, function(idx, feature) {
                $.each(feature.attributes, function(key, value) {
                    //fill options for non schema
                    if(!(key in schemaOptions.fields) && !(key in nonSchemaOptions.fields)) {
                        nonSchemaOptions.fields[key] = {
                            'id': key,
                            'readonly': self.jsonSchema.additionalProperties === false
                        };
                    }

                    //check for different values for same attribute
                    if(key in data && data[key] != value) {
                        data[key] = undefined;
                        if(key in schemaOptions.fields) {
                            schemaOptions.fields[key]['placeholder'] = attributeEditorLabel.sameKeyDifferentValue;
                        } else {
                            nonSchemaOptions.fields[key]['placeholder'] = attributeEditorLabel.sameKeyDifferentValue;
                        }
                    } else {
                        data[key] = value;
                    }
                    //add key to nonSchema if not in jsonSchema and not already in nonSchema
                    if(!(key in self.jsonSchema.properties) && !(key in nonSchema.properties)) {
                        nonSchema.properties[key] = {
                            "type": "any",
                            "title": key
                        }
                    }
                })
            });

            this.element.append(tmpl(gbi.widgets.AttributeEditor.alpacaTemplate));

            $.alpaca(self.options.alpacaSchemaElement, {
                "schema": self.jsonSchema,
                "data": data,
                "options": schemaOptions,
                view: "VIEW_GBI_EDIT"
            });

            var nonSchemaView = self.jsonSchema.additionalProperties === false ? "VIEW_GBI_DISPLAY" : "VIEW_GBI_EDIT";
            $.alpaca(self.options.alpacaNonSchemaElement, {
                "schema": nonSchema,
                "data": data,
                "options": nonSchemaOptions,
                view: nonSchemaView
            });

            if(self.jsonSchema.additionalProperties !== false) {
                this.element.append(tmpl(gbi.widgets.AttributeEditor.newAttributeTemplate));
            }
        } else {
            $.each(this.selectedFeatures, function(idx, feature) {
                $.each(attributes, function(idx, key) {
                    var equal = true;
                    var value = feature.attributes[key];
                    if(key in selectedFeatureAttributes) {
                        equal = selectedFeatureAttributes[key].value == value;
                        if(!equal) {
                            selectedFeatureAttributes[key] = {'equal': false};
                        }
                    } else {
                        selectedFeatureAttributes[key] = {'equal': equal, 'value': value};
                    }
                });
            });
            this.element.append(tmpl(
                gbi.widgets.AttributeEditor.template, {
                    attributes: attributes,
                    selectedFeatureAttributes: selectedFeatureAttributes,
                    editable: editable
                }
            ));
            if(editable && this.options.allowNewAttributes) {
                this.element.append(tmpl(gbi.widgets.AttributeEditor.newAttributeTemplate));
            }
        }
    },
    add: function(key, value) {
        var self = this;
        $.each(this.selectedFeatures, function(idx, feature) {
            self.featureChanges[feature.id]['added'][key] = value;
        });
        this._applyAttributes();
        this.changed = true;
        this.render();
    },
    edit: function(key, value) {
        var self = this;
        $.each(this.selectedFeatures, function(idx, feature) {
            self.featureChanges[feature.id]['edited'][key] = value;
        });
        this.changed = true;
        this._applyAttributes();
        this.render();
    },
    remove: function(key) {
        var self = this;
        $.each(this.selectedFeatures, function(idx, feature) {
            if($.inArray(key, self.featureChanges[feature.id]['removed']) == -1) {
                self.featureChanges[feature.id]['removed'].push(key);
            }
        });
        this.changed = true;
        this._applyAttributes();
        this.render();
    },
    label: function(key) {
        var symbolizers;
        if(this.labelValue == key) {
            symbolizers = {};
            $('#_' + key + '_label i')
                .removeClass('icon-eye-close')
                .addClass('icon-eye-open');
            this.labelValue = undefined;
        } else {
            var symbol = {'label': key + ': ${' + key + '}'};
            var symbolizers = {
                'Point': symbol,
                'Line': symbol,
                'Polygon': symbol
            };
            $('.add-label-button i')
                .removeClass('icon-eye-close')
                .addClass('icon-eye-open');
            $('#_' + key + '_label i')
                .removeClass('icon-eye-open')
                .addClass('icon-eye-close');
            this.labelValue = key;
        }
        this.layerManager.active().setStyle(symbolizers, true)
        return false;
    },
    setAttributes: function(attributes) {
        this.renderAttributes = attributes;
        this.render();
    },
    setJsonSchema: function(schema) {
        this.jsonSchema = schema;
        this.render();
    },
    _applyAttributes: function() {
        var self = this;
        var activeLayer = this.layerManager.active();
        $.each($.extend(true, {}, this.featureChanges), function(featureId, changeSet) {
            var feature = activeLayer.featureById(featureId);
            if (feature) {
                // remove
                $.each(changeSet['removed'], function(idx, key) {
                    activeLayer.removeFeatureAttribute(feature, key);
                });
                self.featureChanges[feature.id]['removed'] = [];
                // edit
                $.each(changeSet['edited'], function(key, value) {
                    activeLayer.changeFeatureAttribute(feature, key, value);
                });
                self.featureChanges[feature.id]['edited'] = {};
                // add
                $.each(changeSet['added'], function(key, value) {
                    activeLayer.changeFeatureAttribute(feature, key, value)
                });
                self.featureChanges[feature.id]['added'] = {};

                // remove not selected features
                if($.inArray(feature, self.selectedFeatures) == -1) {
                    delete self.featureChanges[featureId];
                }
                if(self.selectedInvalidFeature && feature.id == self.selectedInvalidFeature.feature.id && activeLayer.validateFeatureAttributes(feature)) {
                    self.selectedInvalidFeature = false;
                }
            }
        });
    },
    _isInvalidFeature: function(feature) {
        var self = this;
        var id = -1
        $.each(self.invalidFeatures, function(idx, obj) {
            if(obj.feature.id == feature.id) {
                id = idx;
                return false;
            }
        });
        return id;
    }
};

gbi.widgets.AttributeEditor.alpacaViews = {
    "edit": {
        "id": "VIEW_GBI_EDIT",
        "parent": "VIEW_BOOTSTRAP_EDIT",
        "templates": {
            "controlFieldContainer": "\
            <div>\
                {{html this.html}}\
                <button id='_${id}_label' title='label' class='btn btn-small add-label-button'>\
                    <i class='icon-eye-open'></i>\
                </button>\
                <button id='_${id}_remove' title='remove' class='btn btn-small'>\
                    <i class='icon-trash'></i>\
                </button>\
            </div>"
        }
    },
    "display": {
        "id": "VIEW_GBI_DISPLAY",
        "parent": "VIEW_GBI_EDIT",
        "templates": {
            "fieldSetItemContainer": '<div class="alpaca-inline-item-container control-group error"></div>',
            "controlField": "\
                <div>\
                    {{html Alpaca.fieldTemplate(this,'controlFieldLabel')}}\
                    {{wrap(null, {}) Alpaca.fieldTemplate(this,'controlFieldContainer',true)}}\
                        {{html Alpaca.fieldTemplate(this,'controlFieldHelper')}}\
                    {{/wrap}}\
                    <span class='icon-exclamation-sign'></span>\
                    <span class='help-inline'>" + attributeEditorLabel.schemaViolatingAttribute + "</span>\
                </div>\
            "
        }
    }
};

gbi.widgets.AttributeEditor.template = '\
    <% if(attributes.length == 0) { %>\
        <span>'+attributeEditorLabel.noAttributes+'.</span>\
    <% } else { %>\
        <% for(var key in attributes) { %>\
            <form id="view_attributes" class="form-inline">\
                <label class="key-label" for="_<%=attributes[key]%>"><%=attributes[key]%></label>\
                <% if(selectedFeatureAttributes[attributes[key]]) { %>\
                    <% if(selectedFeatureAttributes[attributes[key]]["equal"]) {%>\
                        <input class="input-medium" type="text" id="<%=attributes[key]%>" value="<%=selectedFeatureAttributes[attributes[key]]["value"]%>" \
                    <% } else {%>\
                        <input class="input-medium" type="text" id="<%=attributes[key]%>" placeholder="'+attributeEditorLabel.sameKeyDifferentValue+'" \
                    <% } %>\
                <% } else { %>\
                    <input class="input-medium" type="text" id="<%=attributes[key]%>"\
                <% } %>\
                <% if(!editable) { %>\
                    disabled=disabled \
                <% } %>\
                />\
                <button id="_<%=attributes[key]%>_label" title="label" class="btn btn-small add-label-button"> \
                    <i class="icon-eye-open"></i>\
                </button>\
                <% if(editable) { %>\
                <button id="_<%=attributes[key]%>_remove" title="remove" class="btn btn-small"> \
                    <i class="icon-remove"></i>\
                </button> \
                <% } %>\
            </form>\
        <% } %>\
    <% } %>\
';

gbi.widgets.AttributeEditor.newAttributeTemplate = '\
    <h4>'+attributeEditorLabel.formTitle+'</h4>\
    <form class="form-horizontal"> \
         <div class="control-group"> \
            <label class="control-label" for="_newKey">'+attributeEditorLabel.key+'</label> \
            <div class="controls">\
                <input type="text" id="_newKey" class="input-medium">\
            </div>\
        </div>\
         <div class="control-group"> \
            <label class="control-label" for="_newValue">'+attributeEditorLabel.val+'</label> \
            <div class="controls">\
                <input type="text" id="_newValue" class="input-medium">\
            </div>\
        </div>\
        <button id="addKeyValue" class="btn btn-small">'+attributeEditorLabel.add+'</button>\
    </form>\
';

gbi.widgets.AttributeEditor.addSchemaTemplate = '\
    <div>\
        <div class="input-append">\
            <input id="json_schema_url" name="json_schema_url" type="text" />\
            <button class="btn" id="add_json_schema_url" type="button">'+attributeEditorLabel.addJsonSchemaUrl+'</button>\
        </div>\
    </div>\
';

gbi.widgets.AttributeEditor.alpacaTemplate = '\
    <div id="alpaca_schema"></div>\
    <div id="alpaca_non_schema"></div>\
';

gbi.widgets.AttributeEditor.invalidFeaturesTemplate = '\
    <div>\
        <h4>' + attributeEditorLabel.featuresWithInvalidAttributes + '</h4>\
        <p><%=features.length%> ' + attributeEditorLabel.invalidFeaturesLeft + '</p>\
        <button class="btn btn-small" id="prev_invalid_feature">' + attributeEditorLabel.prev + '</button>\
        <button class="btn btn-small" id="next_invalid_feature">' + attributeEditorLabel.next + '</button>\
    </div>\
';
