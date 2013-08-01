var layerManagerLabel = {
    'vectorLayers': OpenLayers.i18n('Vector layer'),
    'rasterLayers': OpenLayers.i18n('Raster layer'),
    'backgroundLayers': OpenLayers.i18n('Background layer'),
    'addVectorLayer': OpenLayers.i18n('Add vector layer')
}

gbi.widgets = gbi.widgets || {};

gbi.widgets.LayerManager = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'layermanager',
        little: false,
        clickPopup: false
    };

    this.layerManager = editor.layerManager;
    this.options = $.extend({}, defaults, options);

    if(this.options.little) {
        this.element = $('<div></div>');
        this.element.addClass('gbi_widgets_LayerManager');
    } else {
        this.element = $('#' + this.options.element);
    }

    this.render();

    if(this.options.little) {
        $('.olMapViewport').append(this.element);
    }
};
gbi.widgets.LayerManager.prototype = {
    CLASS_NAME: 'gbi.widgets.LayerManager',
    render: function() {
        var self = this;
        this.element.empty();
        var layerType = oldLayerType = null;
        var backgroundLayers = [];
        var rasterLayers = [];
        var vectorLayers = []
        $.each(this.layerManager.layers(), function(idx, gbiLayer) {
            if(gbiLayer.options.displayInLayerSwitcher) {
                if(gbiLayer.isVector) {
                    vectorLayers.push(gbiLayer);
                } else if(gbiLayer.isBackground) {
                    backgroundLayers.push(gbiLayer);
                } else {
                    rasterLayers.push(gbiLayer);
                }
            }
        });

        var template = this.options.little ? gbi.widgets.LayerManager.templates.little : gbi.widgets.LayerManager.templates.normal;

        this.element.append(tmpl(template, {
            backgroundLayers: backgroundLayers,
            rasterLayers: rasterLayers,
            vectorLayers: vectorLayers,
            self: this
        }));

        //bind events
        $.each(backgroundLayers.concat(rasterLayers).concat(vectorLayers), function(idx, layer) {
            self.element.find('#visible_' + layer.id)
                .prop('checked', layer.visible())
                .change(function(event) {
                    event.stopPropagation();
                    layer.visible($(this).prop('checked'));
                });
            self.element.find('#up_' + layer.id).click(function(event) {
                event.stopPropagation();
                if(self.layerManager.up(layer)) {
                    self.render();
                }
            });
            self.element.find('#down_' + layer.id).click(function(event) {
                event.stopPropagation();
               if(self.layerManager.down(layer)) {
                    self.render();
                }
            });
            self.element.find('#remove_' + layer.id).click(function(event) {
                event.stopPropagation();
                self.layerManager.removeLayer(layer);
                self.render();
            });
        });

        this.element.find('input:radio').change(function(event) {
            event.stopPropagation();
            self.layerManager.active(self.layerManager.layerById($(this).val()));
        });

        this.element.find('#add_layer').click(function() {
            var newLayer = $('#new_layer').val();
            if(newLayer) {
                var vectorLayer = new gbi.Layers.Vector({
                    name: newLayer,
                    clickPopup: self.clickPopup
                });
                self.layerManager.addLayer(vectorLayer);
                self.render();
            }
        });

        if(this.options.little) {
            this.element.find('.gbi_widgets_LayerManager_Minimize').click(function(event) {
                event.stopPropagation();
                self.element.find('.gbi_widgets_LayerManager_LayerSwitcher').hide();
                self.element.find('.gbi_widgets_LayerManager_Minimize').hide();
                self.element.find('.gbi_widgets_LayerManager_Maximize').show();
            }).show();
            this.element.find('.gbi_widgets_LayerManager_Maximize').click(function(event) {
                event.stopPropagation();
                self.element.find('.gbi_widgets_LayerManager_LayerSwitcher').show();
                self.element.find('.gbi_widgets_LayerManager_Minimize').show();
                self.element.find('.gbi_widgets_LayerManager_Maximize').hide();
            }).hide();
        }
    }
};
gbi.widgets.LayerManager.templates = {
    normal: '\
        <h4>'+layerManagerLabel.vectorLayers+'</h4>\
        <ul>\
            <% for(var i=0; i<vectorLayers.length; i++) { %>\
                <li class="gbi_layer">\
                    <input type="radio" id="active_<%=vectorLayers[i].id%>" name="active" value="<%=vectorLayers[i].id%>" <% if(vectorLayers[i].isActive) { %> checked="checked" <% } %>/>\
                    <input type="checkbox" id="visible_<%=vectorLayers[i].id%>" />\
                    <span><%=vectorLayers[i].olLayer.name%></span>\
                    <button class="btn btn-mini" id="up_<%=vectorLayers[i].id%>">&uarr;</button>\
                    <button class="btn btn-mini" id="down_<%=vectorLayers[i].id%>">&darr;</button>\
                    <button class="btn btn-mini" id="remove_<%=vectorLayers[i].id%>">&Chi;</button>\
                </li>\
            <% } %>\
        </ul>\
        <h4>'+layerManagerLabel.rasterLayers+'</h4>\
        <ul>\
            <% for(var i=0; i<rasterLayers.length; i++) { %>\
                <li class="gbi_layer">\
                    <input type="checkbox" id="visible_<%=rasterLayers[i].id%>" />\
                    <span><%=rasterLayers[i].olLayer.name%></span>\
                    <button class="btn btn-mini" id="up_<%=rasterLayers[i].id%>">&uarr;</button>\
                    <button class="btn btn-mini" id="down_<%=rasterLayers[i].id%>">&darr;</button>\
                </li>\
            <% } %>\
        </ul>\
        <h4>'+layerManagerLabel.backgroundLayers+'</h4>\
        <ul>\
            <% for(var i=0; i<backgroundLayers.length; i++) { %>\
                <li class="gbi_layer">\
                    <input type="checkbox" id="visible_<%=backgroundLayers[i].id%>" />\
                    <span><%=backgroundLayers[i].olLayer.name%></span>\
                    <button class="btn btn-mini" id="up_<%=backgroundLayers[i].id%>">&uarr;</button>\
                    <button class="btn btn-mini" id="down_<%=backgroundLayers[i].id%>">&darr;</button>\
                </li>\
            <% } %>\
        </ul>\
        <input name="new_layer" id="new_layer" placeholder="Layer name"/>\
        <button class="btn btn-small" id="add_layer">'+layerManagerLabel.addVectorLayer+'</button>\
    ',
    little: '\
        <div class="gbi_widgets_LayerManager_Maximize"></div>\
        <div class="gbi_widgets_LayerManager_Minimize"></div>\
        <div class="gbi_widgets_LayerManager_LayerSwitcher">\
            <b>'+layerManagerLabel.vectorLayers+'</b>\
            <ul>\
                <% for(var i=0; i<vectorLayers.length; i++) { %>\
                    <li class="gbi_layer">\
                        <input type="checkbox" id="visible_<%=vectorLayers[i].id%>" />\
                        <div><%=vectorLayers[i].olLayer.name%></div>\
                        <button class="btn btn-mini" id="up_<%=vectorLayers[i].id%>">&uarr;</button>\
                        <button class="btn btn-mini" id="down_<%=vectorLayers[i].id%>">&darr;</button>\
                    </li>\
                <% } %>\
            </ul>\
            <b>'+layerManagerLabel.rasterLayers+'</b>\
            <ul>\
                <% for(var i=0; i<rasterLayers.length; i++) { %>\
                    <li class="gbi_layer">\
                        <input type="checkbox" id="visible_<%=rasterLayers[i].id%>" />\
                        <div><%=rasterLayers[i].olLayer.name%></div>\
                        <button class="btn btn-mini" id="up_<%=rasterLayers[i].id%>">&uarr;</button>\
                        <button class="btn btn-mini" id="down_<%=rasterLayers[i].id%>">&darr;</button>\
                    </li>\
                <% } %>\
            </ul>\
            <b>'+layerManagerLabel.backgroundLayers+'</b>\
            <ul>\
                <% for(var i=0; i<backgroundLayers.length; i++) { %>\
                    <li class="gbi_layer">\
                        <input type="checkbox" id="visible_<%=backgroundLayers[i].id%>" />\
                        <div><%=backgroundLayers[i].olLayer.name%></div>\
                        <button class="btn btn-mini" id="up_<%=backgroundLayers[i].id%>">&uarr;</button>\
                        <button class="btn btn-mini" id="down_<%=backgroundLayers[i].id%>">&darr;</button>\
                    </li>\
                <% } %>\
            </ul>\
        </div>\
    '
};
