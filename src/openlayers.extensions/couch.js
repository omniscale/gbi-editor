/**
 * CouchDB specific format
 * Overrides some methods of OpenLayers.Format.GeoJSON
 *
 * @see OpenLayers.Format.GeoJSON
 * @extends OpenLayers.Format.GeoJson
 * @class
 */
OpenLayers.Format.CouchDB = OpenLayers.Class(OpenLayers.Format.GeoJSON, {
    /**
     * Convert json received from couchDB into list of OpenLayer.Feature.Vector
     *
     * @memberof OpenLayers.Format.CouchDB
     * @instance
     * @param {JSON} json
     * @returns {OpenLayers.Feature.Vector[]}
     */
    read: function(json, type, filter) {
        var results = [];
        var obj = null;
        if (typeof json == "string") {
            obj = OpenLayers.Format.JSON.prototype.read.apply(this, [json, filter]);
        } else {
            obj = json;
        }
        if(!obj) {
            OpenLayers.Console.error(OpenLayers.i18n("Bad JSON: ") + json);
        } else if(obj.rows) {
            for(var i = 0; i < obj.rows.length; i++) {
                var geojson = obj.rows[i].doc;
                if(geojson.type && geojson.geometry) {
                    var feature = OpenLayers.Format.GeoJSON.prototype.read.apply(this, [geojson, geojson.type, filter]);
                    feature.fid = geojson._id;
                    feature._rev = geojson._rev;
                    feature._drawType = geojson.drawType;
                    if (geojson.style) {
                        feature.style = geojson.style;
                    }
                    results.push(feature)
                }
            }
        }
        return results
    },
    /**
     * Prepares a list of features for inserting into couchDB
     *
     * @memberof OpenLayers.Format.CouchDB
     * @instance
     * @param {OpenLayers.Feature.Vector[]} obj
     * @returns {JSON} Ready to submit to couchDB
     */
    writeBulk: function(obj, pretty) {
        var bulk = {
            "docs": []
        };
        if(OpenLayers.Util.isArray(obj)) {
            var numFeatures = obj.length;
            features = new Array(numFeatures);
            for(var i=0; i<numFeatures; i++) {
                var geojson = this._prepareGeoJSON(obj[i]);
                bulk.docs.push(geojson)
            }
        }
        return OpenLayers.Format.JSON.prototype.write.apply(this, [bulk, pretty]);
    },
    /**
     * Prepare a features for inserting into couchDB
     *
     * @memberof OpenLayers.Format.CouchDB
     * @instance
     * @param {OpenLayers.Feature.Vector} obj
     * @returns {JSON} Ready to submit to couchDB
     */
    write: function(obj, pretty) {
        var geojson = this._prepareGeoJSON(obj);
        return OpenLayers.Format.JSON.prototype.write.apply(this, [geojson, pretty]);
    },
    /**
     * Adds couch specific parameters to GeoJSON object
     *
     * @memberof OpenLayers.Format.CouchDB
     * @instance
     * @private
     * @param {OpenLayers.Feature.Vector} element
     * @returns GeoJSON with couch specific parameters
     */
    _prepareGeoJSON: function(element) {
        if(!element instanceof OpenLayers.Feature.Vector) {
            var msg = OpenLayers.i18n("Only OpenLayers.Feature.Vector is supported.") + ' ';
            msg += OpenLayers.i18n("Feature was") + ": " + element;
            throw msg;
        }
        var geojson = OpenLayers.Format.GeoJSON.prototype.extract.feature.apply(this, [element]);
        if(element.fid) {
            geojson._id = element.fid;
        }
        if(element._rev) {
            geojson._rev = element._rev;
        }
        if(element._deleted) {
            geojson._deleted = element._deleted;
        }
        if(element._drawType) {
            geojson.drawType = element._drawType;
        }
        if(element.style) {
            geojson.style = element.style;
        }

        return geojson;
    },

    CLASS_NAME: "OpenLayers.Format.GeoCouch"
});

/**
 * CouchDB specific protocol
 * Overrides some methods of OpenLayers.Protocol.HTTP
 *
 * @see {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/HTTP-js.html|OpenLayers.Protocol.HTTP}
 * @extends OpenLayers.Protocol.HTTP
 * @class
 * @param options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/HTTP-js.html|OpenLayers.Protocol.HTTP}
 */
OpenLayers.Protocol.CouchDB = OpenLayers.Class(OpenLayers.Protocol.HTTP, {
    /**
     * Init
     *
     * @private
     * @memberof OpenLayers.Protocol.CouchDB
     */
    initialize: function(options) {
        OpenLayers.Util.extend(options, {'headers': {'Content-Type': 'application/json'}, callback: this.cb});
        OpenLayers.Protocol.HTTP.prototype.initialize.apply(this, arguments);

    },
    /**
     * Add extension to url for reading couchDB and timestamp to prevent caching
     *
     * @memberof OpenLayers.Protocol.CouchDB
     * @instance
     * @param options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/HTTP-js.html|OpenLayers.Protocol.HTTP}
     * @returns {OpenLayers.Protocol.Response}
     */
    read: function(options) {
        options.url = this.options.url + this.options.readExt + '&' + new Date().getTime();
        return OpenLayers.Protocol.HTTP.prototype.read.apply(this, [options]);
    },
    /**
     * Sends data to couchDB
     *
     * @memberof OpenLayers.Protocol.CouchDB
     * @instance
     * @param {OpenLayers.Feature.Vector[]} features
     * @param options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/HTTP-js.html|OpenLayers.Protocol.HTTP}
     */
    commit: function(features, options) {
        var self = this;
        var deletes = [];
        var updates = [];
        var inserts = [];
        options = OpenLayers.Util.applyDefaults(options, this.options);
        for(var i=0; i < features.length; i++) {
            if(features[i].state != null) {
                if(features[i].state == OpenLayers.State.DELETE) {
                    features[i]._deleted = true;
                    deletes.push(features[i]);
                } else if(features[i].state == OpenLayers.State.UPDATE) {
                    updates.push(features[i]);
                } else {
                    inserts.push(features[i]);
                }
            }
        }

        if(deletes.length > 0) {
            var resp = new OpenLayers.Protocol.Response({reqFeatures: deletes});
            resp.priv = OpenLayers.Request.POST({
                url: this.options.url + this.options.bulkExt,
                headers: options.headers,
                data: this.format.writeBulk(deletes),
                callback: this.createCallback(this.handleCommitResponse, resp, options)
            });
        }
        for(var i=0;i<inserts.length; i++) {
            var resp = new OpenLayers.Protocol.Response({reqFeatures: [inserts[i]]});
            resp.priv = OpenLayers.Request.POST({
                url: this.options.url,
                headers: options.headers,
                data: this.format.write(inserts[i]),
                callback: this.createCallback(this.handleCommitResponse, resp, options)
            });
        }
        for(var i=0;i<updates.length; i++) {
            var resp = new OpenLayers.Protocol.Response({reqFeatures: [updates[i]]});
            resp.priv = OpenLayers.Request.PUT({
                url: this.options.url + updates[i].fid,
                headers: options.headers,
                data: this.format.write(updates[i]),
                callback: this.createCallback(this.handleCommitResponse, resp, options)
            });
        }
    },
    /**
     * Handles responses
     *
     * @memberof OpenLayers.Protocol.CouchDB
     * @instance
     * @param {OpenLayers.Protocol.Response} response
     * @param options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/HTTP-js.html|OpenLayers.Protocol.HTTP}
     */
    handleCommitResponse: function(response, options) {
        this.handleResponse(response, options);
        var format = new OpenLayers.Format.JSON();
        var responseJSON = format.read(response.priv.responseText);

        //only deletes handle more than one feature at a time
        if(response.reqFeatures.length == 1) {
            var feature = response.reqFeatures[0];
            feature.fid = responseJSON.id;
            feature._rev = responseJSON.rev;
            feature.state = null;
        }
    },
    CLASS_NAME: "OpenLayers.Protocol.CouchDB"
});
