OpenLayers.Popup.BootstrapAlert = OpenLayers.Class(OpenLayers.Popup, {
    displayClass: "",
    contentDisplayClass: "alert ",
    initialize: function(id, lonlat, contentSize, contentHTML, closeBox, closeBoxCallback, alertClass) {
        this.contentDisplayClass += alertClass || 'alert-error';
        OpenLayers.Popup.prototype.initialize.apply(this, arguments);
        this.backgroundColor = null;
        this.border = null;
        this.div = this.contentDiv;
        this.div.style.padding = '10px 10px';
    },
    CLASS_NAME: 'OpenLayers.Popup.BootstrapAlert'
})