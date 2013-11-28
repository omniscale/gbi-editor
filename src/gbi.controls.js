gbi.Controls = gbi.Controls || {};

/**
 * Creates an OpenLayers LayerSwitcher control
 *
 * @constructor
 * @param [options] All OpenLayers.Control.LayerSwitcher options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/LayerSwitcher-js.html|OpenLayers.Control.LayerSwitcher}
 */
gbi.Controls.LayerSwitcher = function(options) {
    var defaults = {
        roundedCorner: true
    }
    options = $.extend({}, defaults, options);
    this.olControl = new OpenLayers.Control.LayerSwitcher(options);
};
gbi.Controls.LayerSwitcher.prototype = {
    CLASS_NAME: 'gbi.Controls.LayerSwitcher',
    /**
     * Maximizes the LayerSwitcher
     *
     * @memberof gbi.Controls.LayerSwitcher
     * @instance
     */
    maximize: function() {
        this.olControl.maximizeControl();
    }
};

/**
 * Shows the current mouse coordinates in the map or in a specified element
 *
 * @constructor
 * @param [options] All OpenLayers.Control.MousePosition options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Control/MousePosition-js.html|OpenLayers.Control.MousePosition}
 * @param {String} [options.element] Show mouse coordinates in specified DOM element
 */
gbi.Controls.MousePosition = function(options) {
    //MousePosition expect HTML element, cause internal no document.getElement... is called
    if(options && options.element) {
        options.element = $('#' + options.element)[0];
    }
    this.olControl = new OpenLayers.Control.MousePosition(options);
};
gbi.Controls.MousePosition.prototype = {
    CLASS_NAME: 'gbi.Controls.MousePosition',
    /**
     * Changes the coordinate system of the output
     *
     * @memberof gbi.Controls.MousePosition
     * instance
     * @param {String} srs EPSG code
     */
    updateSRS: function(srs) {
        srs = new OpenLayers.Projection(srs);
        this.olControl.displayProjection = srs;
    }
};

gbi.Controls.ClickPopup = function(options) {
    var self = this;
    self.olMap = options.editor.map.olMap;
    self.popupContent = options.popupContent;
    self.popupSize = new OpenLayers.Size(options.width || 200, options.height || 200);
    self.popup = false;
    self.olControl = new OpenLayers.Control();
    self.olControl.handler = new OpenLayers.Handler.Click(self.olControl, {
        'click': function(e) {
            self.handleClick(e);
        }
    }, {
        'singe': true,
        'stopSingle': true
    });
};
gbi.Controls.ClickPopup.prototype = {
    CLASS_NAME: 'gbi.Controls.ClickPopup',
    handleClick: function(e) {
        var self = this;
        if(self.popup) {
            self.olMap.removePopup(self.popup);
            self.popup.destroy();
            self.popup = false;
        }
        console.log(e.xy)
        self.popup = new OpenLayers.Popup.BootstrapAlert('clickPopup',
            self.olMap.getLonLatFromViewPortPx(e.xy),
            self.popupSize,
            self.popupContent,
            false
        );
        self.olMap.addPopup(self.popup);
    },
    destroy: function() {
        var self = this;
        if(self.popup) {
            self.olMap.removePopup(self.popup);
            self.popup.destroy();
            self.popup = false;
        }
        self.olControl.deactivate();
    }
}
