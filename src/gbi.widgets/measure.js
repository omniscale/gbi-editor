gbi.widgets = gbi.widgets || {};

gbi.widgets.Measure = function(editor, options) {
    var self = this;
    var defaults = {
        element: 'measurement',
        toolbarId: 'measure_toolbar',
        useToolbar: false,
        outputId: 'measure_output',
        srs: ['EPSG:4326', 'EPSG:3857']
    };

    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);

    this.render();

    this.pointMeasure = new gbi.Controls.Measure({
            measureType: gbi.Controls.Measure.TYPE_POINT,
            mapSRS: editor.map.olMap.projection.projCode,
            displaySRS: this.options.srs[0]
        }, function(event) { self.measureHandler(event); });
    this.pointMeasure.registerEvent('activate', this, function() {
        $('#position_srs').show();
    });
    this.pointMeasure.registerEvent('deactivate', this, function() {
        $('#position_srs').hide();
    });

    this.lineMeasure = new gbi.Controls.Measure({
            measureType: gbi.Controls.Measure.TYPE_LINE
        }, function(event) { self.measureHandler(event); });

    this.polygonMeasure = new gbi.Controls.Measure({
            measureType: gbi.Controls.Measure.TYPE_POLYGON
        }, function(event) { self.measureHandler(event); });

    if(this.options.useToolbar && this.options.useToolbar instanceof gbi.Toolbar) {
        this.toolbar = this.options.useToolbar;
    } else {
        this.toolbar = new gbi.Toolbar(editor, {
            tools : {},
            element: this.options.toolbarId
        });
    }

    this.toolbar.addControls([this.pointMeasure, this.lineMeasure, this.polygonMeasure]);


    $('#position_srs').change(function() {
        self.pointMeasure.updateSRS($(this).val());
    });
};
gbi.widgets.Measure.prototype = {
    CLASS_NAME: 'gbi.widgets.Measure',
    render: function() {
        this.element.append(tmpl(gbi.widgets.Measure.template, {srs: this.options.srs}));
    },
    measureHandler: function(measure) {
        var element = $('#' + this.options.outputId);
        var output = "measure:<br> ";
        switch(measure.type) {
            case gbi.Controls.Measure.TYPE_POINT:
                output += measure.measure[0] + ' | ' + measure.measure[1];
                break;
            case gbi.Controls.Measure.TYPE_LINE:
                output += measure.measure + " " + measure.units;
                break;
            case gbi.Controls.Measure.TYPE_POLYGON:
                output += measure.measure + " " + measure.units + "<sup>2</sup>";
        }
        element.html(output);
    }
};
gbi.widgets.Measure.template = '\
    <div id="measure_toolbar"></div>\
    <div id="measure_output"></div>\
    <select id="position_srs" style="display:none;">\
        <% for(var key in srs) { %>\
            <option value="<%=srs[key]%>"><%=srs[key]%></option>\
        <% } %>\
    </select>\
';
