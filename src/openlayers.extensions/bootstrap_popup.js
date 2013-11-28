OpenLayers.Popup.BootstrapAlert = OpenLayers.Class(OpenLayers.Popup, {
    displayClass: "",
    contentDisplayClass: "alert ",
    initialize: function(id, lonlat, contentSize, contentHTML, closeBox, closeBoxCallback, alertClass) {
        this.contentDisplayClass += alertClass || 'alert-error';
        OpenLayers.Popup.prototype.initialize.call(this, id, lonlat, contentSize, contentHTML, false, closeBoxCallback);
        this.backgroundColor = null;
        this.border = null;
        this.div = this.contentDiv;
        this.div.style.padding = '10px 10px';
    },
    destroy: function() {
        this.id = null;
        this.lonlat = null;
        this.size = null;
        this.contentHTML = null;

        this.backgroundColor = null;
        this.opacity = null;
        this.border = null;

        if (this.closeOnMove && this.map) {
            this.map.events.unregister("movestart", this, this.hide);
        }

        this.events.destroy();
        this.events = null;

        this.groupDiv = null;

        if (this.map != null) {
            this.map.removePopup(this);
        }
        this.map = null;
        this.div = null;

        this.autoSize = null;
        this.minSize = null;
        this.maxSize = null;
        this.padding = null;
        this.panMapIfOutOfView = null;
    },
    CLASS_NAME: 'OpenLayers.Popup.BootstrapAlert'
});
