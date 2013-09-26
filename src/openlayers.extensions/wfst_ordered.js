/**
 * WFS Protocol with ordered attributes
 *
 * @class
 * @requires OpenLayers/Protocol/WFS/v1_1_0.js
 * @extends OpenLayers.Protocol.WFS.v1_1_0
 * @param options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/WFS/v1_1_0-js.html|OpenLayers.Protocol.WFS.v1_0_0}
 * @param {URL} options.schema URL of schema
 */
OpenLayers.Protocol.WFS.v1_1_0_ordered = OpenLayers.Class(OpenLayers.Protocol.WFS.v1_1_0, {

    version: "1.1.0",

    attribute_order: false,

    events: null,

    initialize: function(options) {
        this.events = new OpenLayers.Events(this);
        if(options.eventListeners instanceof Object) {
            this.events.on(options.eventListeners);
        }

        var schemaURL = options.url;
        switch(schemaURL[schemaURL.length - 1]) {
            case '?':
            case '&':
                break;
            default:
                schemaURL += (schemaURL.indexOf('?') == -1) ? '?' : '&';
        }
        schemaURL += 'service=wfs&request=DescribeFeatureType&version=' + this.version + '&typename=' + options.typename + ':' + options.featureType;
        this.get_attribute_order(schemaURL)
        this.formatOptions = OpenLayers.Util.extend({
            attribute_order: this.attribute_order
        }, this.formatOptions);
        OpenLayers.Protocol.WFS.v1_1_0.prototype.initialize.apply(this, arguments);
    },

    /**
     * Load attribute order for INSERT by calling WFSDescribeFeatureType
     *
     * @memberof OpenLayers.Protocol.WFS.v1_1_0_ordered
     * @instance
     * @private
     * @param {String} url
     */
    get_attribute_order: function(url) {
        var response = OpenLayers.Request.GET({
            url: url,
            async: false
        });
        var feature_type_parser = new OpenLayers.Format.WFSDescribeFeatureType();
        try {
            var properties = feature_type_parser.read(response.responseText).featureTypes[0].properties;
        } catch(e) {
            var properties = false;
        }
        if(properties) {
            var attribute_order = [];
            var attribute_types = {};
            var attribute_requireds = {};
            for(var idx in properties) {
                attribute_order.push(properties[idx].name);
                attribute_types[properties[idx].name] = properties[idx].type;
                attribute_requireds[properties[idx].name] = !properties[idx].nillable;
            }
            this.attribute_order = attribute_order;
            this.attribute_types = attribute_types;
            this.attribute_requireds = attribute_requireds;
            this.events.triggerEvent("schema.loaded", {attribute_order: attribute_order, attribute_types: attribute_types, attribute_requireds: attribute_requireds});
        }

    },

    CLASS_NAME: "OpenLayers.Protocol.WFS.v1_1_0_ordered"
});

/**
 * WFS Protocol with ordered attributes anf get request
 *
 * @class
 * @requires OpenLayers/Protocol/WFS/v1_1_0.js
 * @extends OpenLayers.Protocol.WFS.v1_1_0_ordered
 * @param options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/WFS/v1_1_0-js.html|OpenLayers.Protocol.WFS.v1_0_0}
 * @param {URL} options.schema URL of schema
 * @param {String} [options.additional_feature_ns]
 */
OpenLayers.Protocol.WFS.v1_1_0_ordered_get = OpenLayers.Class(OpenLayers.Protocol.WFS.v1_1_0_ordered, {
    /**
     * Read from wfs
     *
     * @memberof OpenLayers.Protocol.WFS.v1_1_0_ordered_get
     * @instance
     * @param options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Protocol/WFS/v1_1_0-js.html|OpenLayers.Protocol.WFS.v1_0_0}
     * @param {String} [options.additional_feature_ns]
     * @returns {OpenLayers.Protocol.Response}
     */
    read: function(options) {
        OpenLayers.Protocol.prototype.read.apply(this, arguments);
        options = OpenLayers.Util.extend({}, options);
        OpenLayers.Util.applyDefaults(options, this.options || {});
        var response = new OpenLayers.Protocol.Response({requestType: "read"});
        if(options.additional_feature_ns) {
            this.format.setNamespace('feature', options.additional_feature_ns);
        }
        response.priv = OpenLayers.Request.GET({
            url: options.url + '&request=getfeature&service=wfs&version='+this.format.version+'&srsName='+options.srsName+'&typename='+options.typename,
            callback: this.createCallback(this.handleRead, response, options),
            params: options.params
        })
        return response
    },
    CLASS_NAME: "OpenLayers.Protocol.WFS.v1_1_0_ordered_get"
});


/**
 * Format for WFST with ordered attributes
 *
 * @class
 * @extends OpenLayers.Format.WFST.v1_1_0
 * @params options See {@link http://dev.openlayers.org/releases/OpenLayers-2.12/doc/apidocs/files/OpenLayers/Format/WFST/v1_1_0-js.html|OpenLayers.Format.WFST.v1_1_0}
 */
OpenLayers.Format.WFST.v1_1_0_ordered_get = OpenLayers.Format.WFST.v1_1_0_ordered = OpenLayers.Class(
    OpenLayers.Format.WFST.v1_1_0, {

        version: "1.1.0",

        attribute_order: false,

        initialize: function(options) {
            //replace version by original wfst version number
            options.version = this.version
            OpenLayers.Format.WFST.v1_1_0.prototype.initialize.apply(this, [options]);
        },
        readers: {
            "wfs": OpenLayers.Format.WFST.v1_1_0.prototype.readers["wfs"],
            "gml": OpenLayers.Format.WFST.v1_1_0.prototype.readers["gml"],
            "feature": OpenLayers.Format.WFST.v1_1_0.prototype.readers["feature"],
            "ogc": OpenLayers.Format.WFST.v1_1_0.prototype.readers["ogc"],
            "ows": OpenLayers.Format.WFST.v1_1_0.prototype.readers["ows"]
        },
        writers: {
            "wfs": OpenLayers.Format.WFST.v1_1_0.prototype.writers["wfs"],
            "gml": OpenLayers.Format.WFST.v1_1_0.prototype.writers["gml"],
            "feature": OpenLayers.Util.applyDefaults({
                "_typeName": function(feature) {
                    if(this.attribute_order) {
                        var node = this.createElementNSPlus("feature:" + this.featureType, {
                            attributes: {fid: feature.fid}
                        });
                        for(var idx in this.attribute_order) {
                            var prop = this.attribute_order[idx]
                            if(prop == this.geometryName) {
                                this.writeNode("feature:_geometry", feature.geometry, node);
                            } else {
                                var value = feature.attributes[prop];
                                if(value != null) {
                                    this.writeNode(
                                        "feature:_attribute",
                                        {name: prop, value: value}, node
                                    );
                                }
                            }
                        }
                        return node;
                    } else {
                        return OpenLayers.Format.WFST.v1_1_0.prototype.writers["feature"]["_typeName"].call(this, feature);
                    }
                }
            }, OpenLayers.Format.WFST.v1_1_0.prototype.writers["feature"]),
            "ogc": OpenLayers.Format.WFST.v1_1_0.prototype.writers["ogc"],
            "ows": OpenLayers.Format.WFST.v1_1_0.prototype.writers["ows"]
        },

        CLASS_NAME: "OpenLayers.Format.WFST.v1_1_0_ordered"
});
