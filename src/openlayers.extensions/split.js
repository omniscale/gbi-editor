/**
 * Split feature control
 *
 * @class
 * @extends OpenLayers.Control
 * @param {OpenLayers.Layer.Vector} layer
 * @param options
 * @param {OpenLayers.Control.SelectFeature} [options.selectControl]
  */
OpenLayers.Control.SplitFeature = OpenLayers.Class(OpenLayers.Control, {
    /**
     * Init method
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     * @private
     */
    initialize: function(layer, options) {
        OpenLayers.Control.prototype.initialize.apply(this, [options]);

        var self = this;
        this.jstsFromWkt = new jsts.io.WKTReader();
        this.wktFromOl = new OpenLayers.Format.WKT();
        this.olFromJsts = new jsts.io.OpenLayersParser();
        this.layer = layer;
        this.activatable = false;
        if (options.selectControl) {
            this.selectControl = options.selectControl;
        }
        this.layer.events.register('featureselected', this, this._toggleControlState);
        this.layer.events.register('featureunselected', this, this._toggleControlState);

        this._draw = new OpenLayers.Control.DrawFeature(layer, OpenLayers.Handler.Path, {});
        this._draw.setMap(layer.map)
        this._draw.events.on({
            featureadded: function(e) {
                var splitLine = e.feature;

                if (splitLine.geometry.intersects(self.layer.selectedFeatures[0].geometry)) {
                    if(self.layer.selectedFeatures[0].geometry.CLASS_NAME == 'OpenLayers.Geometry.Polygon') {
                        self.layer.addFeatures(self._splitPolygon(splitLine, self.layer.selectedFeatures[0]));
                    } else if(self.layer.selectedFeatures[0].geometry.CLASS_NAME == 'OpenLayers.Geometry.LineString'){
                        self.layer.addFeatures(self._splitLine(splitLine, self.layer.selectedFeatures[0]));
                    }
                }

                splitLine.destroy();
                self._draw.deactivate();
                self.deactivate();
                self._toggleControlState();
                if (self.selectControl) {
                    self.selectControl.activate();
                }
            }
        });
    },
    /**
     * Sets the map
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     * @param {OpenLayers.Map} map
     */
    setMap: function(map) {
        OpenLayers.Control.prototype.setMap.call(this, map);
        if(this.panel_div) {
            OpenLayers.Element.addClass(this.panel_div, 'itemDisabled');
        }
    },
    /**
     * Sets layer
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     * @param {OpenLayers.Layer.Vector} layer
     */
    setLayer: function(layer) {
        if(this.layer) {
            this.layer.events.unregister('featureselected', this, this._toggleControlState);
            this.layer.events.unregister('featureunselected', this, this._toggleControlState);
        }
        this.layer = layer;

        this.layer.events.register('featureselected', this, this._toggleControlState);
        this.layer.events.register('featureunselected', this, this._toggleControlState);

        this._draw.layer = layer;
        this._toggleControlState();
    },
    /**
     * Checks if control is activatable
     *
     * @private
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     */
    _toggleControlState: function() {
        var selectedFeature = this.layer.selectedFeatures;
        if(selectedFeature.length == 1 && (
            selectedFeature[0].geometry.CLASS_NAME == 'OpenLayers.Geometry.LineString' ||
            selectedFeature[0].geometry.CLASS_NAME == 'OpenLayers.Geometry.Polygon'
          )) {
            this.activatable = true;
            this.type = OpenLayers.Control.TYPE_TOOL;
            if(this.panel_div) {
                OpenLayers.Element.removeClass(this.panel_div, 'itemDisabled');
            }
        } else {
            this.activatable = false;
            this.type = OpenLayers.Control.TYPE_TOGGLE;
            if(this.panel_div) {
                OpenLayers.Element.addClass(this.panel_div, 'itemDisabled');
            }
        }
    },
    /**
     * Activates the control
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     */
    activate: function() {
        if(this.activatable) {
            var activated = OpenLayers.Control.prototype.activate.call(this);
            if(activated) {
                this._draw.activate();
            }
        }
    },
    /**
     * Split operation for polygons
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     * @param {OpenLayers.Feature.Vector} splitFeatures The split line
     * @param {OpenLayers.Feature.Vector} polygonFeatures The polygon to split
     */
    _splitPolygon: function(splitFeature, polygonFeature) {
        var newFeatures = []

        var polygonizer = new jsts.operation.polygonize.Polygonizer();

        var line = this.jstsFromWkt.read(this.wktFromOl.write(splitFeature));
        var polygon = this.jstsFromWkt.read(this.wktFromOl.write(polygonFeature));

        //XXXkai: intersection don't work as expected
        // var intersection = line.intersection(polygon);
        // var union = polygon.getExteriorRing().union(intersection);
        var union = polygon.getExteriorRing().union(line);

        polygonizer.add(union);

        var polygons = polygonizer.getPolygons();
        for(var pIter = polygons.iterator(); pIter.hasNext();) {
            var polygon = pIter.next();

            var feature = new OpenLayers.Feature.Vector(this.olFromJsts.write(polygon), OpenLayers.Util.extend({}, polygonFeature.attributes));
            feature.state = OpenLayers.State.INSERT;
            feature.attributes = polygonFeature.attributes;
            newFeatures.push(feature);
        }
        this._deleteFeature(polygonFeature);
        return newFeatures;
    },
    /**
     * Split operation for lines
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     * @param {OpenLayers.Feature.Vector} splitFeatures The split line
     * @param {OpenLayers.Feature.Vector} lineFeatures The line to split
     */
    _splitLine: function(splitFeature, lineFeature) {
        var newFeatures = []

        var splitLine = this.jstsFromWkt.read(this.wktFromOl.write(splitFeature));
        var targetLine = this.jstsFromWkt.read(this.wktFromOl.write(lineFeature));

        var pointStore = [];
        var endPoint;
        for(var i = 0; i < targetLine.points.length -1; i++) {
            var startPoint = targetLine.points[i];
            endPoint = targetLine.points[i+1];

            var segment = new jsts.geom.LineString([startPoint, endPoint]);

            if(segment.intersects(splitLine)) {
                var splitPoint = segment.intersection(splitLine).coordinate;
                var newLine= new jsts.geom.LineString(pointStore.concat([startPoint, splitPoint]));
                pointStore = [splitPoint];
                newFeatures.push(new OpenLayers.Feature.Vector(this.olFromJsts.write(newLine), OpenLayers.Util.extend({}, lineFeature.attributes)));
            } else {
                pointStore.push(startPoint);
            }
        }
        var restLine = new jsts.geom.LineString(pointStore.concat([endPoint]));
        newFeatures.push(new OpenLayers.Feature.Vector(this.olFromJsts.write(restLine), OpenLayers.Util.extend({}, lineFeature.attributes)));

        this._deleteFeature(lineFeature)
        return newFeatures;
    },
    /**
     * Delete operation
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector} feature
     */
    _deleteFeature: function(feature) {
        // if feature doesn't have a fid, destroy it
        this.selectControl.unselect(feature);
        if(feature.fid == undefined) {
            this.layer.destroyFeatures([feature]);
        } else {
            feature.state = OpenLayers.State.DELETE;
            this.layer.events.triggerEvent("afterfeaturemodified", {feature: feature});
            feature.renderIntent = "delete";
            feature.style = {
                display: 'none'
            }
            this.layer.redraw();
            this.layer.selectedFeatures.splice(this.layer.selectedFeatures.indexOf(feature), 1);
            this.layer.events.triggerEvent("featureunselected", {feature: feature});
        }
    },
    /**
     * Destroy
     *
     * @memberof OpenLayers.Control.SplitFeature
     * @instance
     */
    destroy: function() {
        this._draw.destroy();
        this.layer.event.unregister('featureselected', this, this._toggleControlState);
        this.layer.event.unregister('featureunselected', this, this._toggleControlState);
        OpenLayers.Control.prototype.destroy.apply(this, []);
    },

    CLASS_NAME: "OpenLayers.Control.SplitFeature"
});
