/**
 * Create the Map
 *
 * @constructor
 * @param {Editor} editor A reference to the editor
 * @param options Options for the map. All OpenLayers.Map options are allowed. See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Map-js.html|OpenLayers.Map}
 * @param {String} options.element DOM element to show the map in
 * @param {Boolean} [options.snapping=true]
 * @param [options.center] Set the center of the map. See {@linkcode center}
 */
gbi.Map = function (editor, options) {
    var self = this;
    var defaults = {
        theme: '../css/theme/default/style.css',
        projection: new OpenLayers.Projection('EPSG:3857'),
        displayProjection: new OpenLayers.Projection('EPSG:4326'),
        units: 'm',
        maxResolution: 156543.0339,
        maxExtent: new OpenLayers.Bounds(-20037508.3428, -20037508.3428, 20037508.3428, 20037508.3428),
        numZoomLevels: 19,
        controls: [
            new OpenLayers.Control.Navigation({
                documentDrag: true,
                dragPanOptions: {
                    interval: 1,
                    enableKinetic: true
                }
            }),
            new OpenLayers.Control.PanZoomBar({autoActivate: true})
        ],
        snapping: true,
        imageBaseLayer: true,
        autoResize: false
    };

    var centerPosition = options.center;
    delete options.center;

    this.options = $.extend({}, defaults, options);

    this.editor = editor;
    //setup map
    this.olMap = new OpenLayers.Map(this.options.element, this.options);

    this.toolbars = [];


    if(this.options.imageBaseLayer) {
        this.addBlankImageLayer();
    }
    if(this.options.snapping) {
        var snapping = new gbi.Controls.Snap();
        this.olMap.addControls([snapping.olControl]);
        snapping.activate();
        $(gbi).on('gbi.layermanager.layer.active', function(event, layer) {
            snapping.changeLayer(layer);
        });
        $(gbi).on('gbi.layermanager.vectorlayer.add', function(event, layer) {
            snapping.addLayer(layer);
        });
        $(gbi).on('gbi.layermanager.vectorlayer.remove', function(event, layer) {
            snapping.removeLayer(layer);
        });
    }

    $(gbi).on('gbi.toolbar.active', function(event, activeToolbar) {
        $.each(self.toolbars, function(idx, toolbar) {
            if(toolbar != activeToolbar) {
                toolbar.deactivateAllControls();
            }
        });
    });
    if(centerPosition) {
        this.center(centerPosition);
    } else {
        this.zoomToMaxExtent();
    }
    if(this.options.autoResize) {
        this.resizeMap();
        $(window).resize(function() {
            self.resizeMap();
        });
    }
};
gbi.Map.prototype = {
    CLASS_NAME: 'gbi.Map',
    /**
     * Set map center
     *
     * @memberof gbi.Map
     * @instance
     * @param {Number} options.lon
     * @param {Number}options.lat
     * @param {String} options.srs EPSG code of given coordinates
     * @param {Number} options.center.zoom
     */
    center: function(options) {
        if(options) {
            this.olMap.setCenter(
                new OpenLayers.LonLat(options.lon, options.lat).transform(
                    new OpenLayers.Projection(options.srs),
                    this.olMap.getProjectionObject()
                ), options.zoom
            );
        } else {
            this.olMap.zoomToMaxExtent();
        }
    },
    /**
     * Adds a blank image layer to map
     *
     * @memberof gbi.Map
     * @instance
     */
    addBlankImageLayer: function() {
        //setup and add blank image layer as background
        var blankLayer = new OpenLayers.Layer.Image('background',
            this.options.blankImagePath || OpenLayers.ImgPath+'/blank.gif',
            this.options.maxExtent,
            new OpenLayers.Size(500, 500), {
                maxResolution: this.options.maxResolution,
                displayInLayerSwitcher: false,
                isBaseLayer: true
            }
        );
        this.olMap.addLayer(blankLayer);
    },
    /**
     * Adds control to the map
     *
     * @memberof gbi.Map
     * @instance
     * @param {Control} control Control to add
     */
    addControl: function(control) {
        if(control instanceof gbi.Toolbar) {
            this.toolbars.push(control);
        }
        this.olMap.addControl(control.olControl);
    },
    /**
     * Removes control from map
     *
     * @memberof gbi.Map
     * @instance
     * @param {Control} control Control to remove
     */
    removeControl: function(control) {
        if(control instanceof gbi.Toolbar) {
            var idx = $.inArray(control, this.toolbars);
            if(idx != -1) {
                this.toolbars.splice(idx, 1);
            }
        }
        this.olMap.removeControl(control.olControl);
    },
    /**
     * Adds controls to the map
     *
     * @memberof gbi.Map
     * @instance
     * @param {Control[]} controls Controls to add
     */
    addControls: function(controls) {
        var self = this;
        $.each(controls, function(idx, control) {
            self.addControl(control);
        })
    },
    /**
     * Removes controls from map
     *
     * @memberof gbi.Map
     * @instance
     * @param {Control[]} controls Controls to remove
     */
    removeControls: function(controls) {
        var self = this;
        $.each(controls, function(idx, control) {
            self.removeControl(control);
        });
    },
    /**
     * Zoomes to map max extent
     *
     * @memberof gbi.Map
     * @instance
     */
    zoomToMaxExtent: function() {
        this.olMap.zoomToMaxExtent();
    },
    resizeMap: function() {
        var self = this;
        var _map = $('#' + self.options.element);
        var browserHeight = $(window).height();
        var offsetTop = _map.prop('offsetTop');
        _map.css('height', browserHeight - offsetTop);
        if(self.olMap) {
            self.olMap.updateSize()
        }
    }
};
