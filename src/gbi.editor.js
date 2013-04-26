var gbi = gbi || {};

/**
 * Creates the Editor
 *
 * @constructor
 * @param options Options for the editor
 * @param {String} [options.language='en'] Language of texts
 * @param {String} [options.imgPath="../css/theme/default/img/"] OpenLayers ImgPath to use
 * @param {Layer[]} [options.layers] Layers to show in editor
 * @param options.map Map options. See {@linkcode gbi.Map}
 */
gbi.Editor = function(options) {
    var self = this;
    this.options = options;
    OpenLayers.ImgPath = this.options.imgPath || "../css/theme/default/img/";
    this.setLanguage(options.language || 'en');

    OpenLayers.Tile.Image.prototype.onImageError = function() {
            var img = this.imgDiv;
            if (img.src != null) {
                this.imageReloadAttempts++;
                if (this.imageReloadAttempts <= OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
                    this.setImgSrc(this.layer.getURL(this.bounds));
                } else {
                    OpenLayers.Element.addClass(img, "olImageLoadError");
                    this.events.triggerEvent("loaderror");
                    img.src = OpenLayers.ImgPath+"/blank.gif";
                    this.onImageLoad();
                }
            }
    }

    this.map = new gbi.Map(this, this.options.map);
    this.layerManager = new gbi.LayerManager(this.map.olMap);

    if(this.options.layers) {
        this.addLayers(this.options.layers);
    }
};
gbi.Editor.prototype = {
    CLASS_NAME: 'gbi.Editor',
    /**
     * Add a layer
     *
     * @param {Layer} layer Layer to add
     */
    addLayer: function(layer) {
        this.layerManager.addLayer(layer);
    },
    /**
     * Add a lot of layers
     *
     * @param {Layer[]} layers Layers to add
     */
    addLayers: function(layers) {
        this.layerManager.addLayers(layers);
    },
    /**
     * Add a control
     *
     * @param {Control|ToolbarItem} control Control to add
     */
    addControl: function(control) {
        this.map.addControl(control);
    },
    /**
     * Add a lot of controls
     *
     * @param {Control[]|ToolbarItem[]} controls Controls to add
     */
    addControls: function(controls) {
        this.map.addControls(controls);
    },
    /**
     * Removes a layer
     *
     * @param {Layer} layer Layer to remove
     */
    removeLayer: function(layer) {
        this.layerManager.removeLayer(layer);
    },
    /**
     * Sets the language
     *
     * @param {String} language Language to use
     */
    setLanguage: function(language) {
        this.language = language;
        OpenLayers.Lang.setCode(language);
    }
};
