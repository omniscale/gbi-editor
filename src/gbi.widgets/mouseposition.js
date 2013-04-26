gbi.widgets = gbi.widgets || {};

gbi.widgets.MousePosition = function(editor, options) {
    var defaults = {
        element: 'mouseposition',
        selectID: 'position_srs',
        outputID: 'position_output',
        templates: {
            selectTemplate: '<select id="position_srs"></select>',
            outputTemplate: '<div id="position_output"></div>'
        }
    };
    this.options = $.extend({}, defaults, options);
    this.element = $('#' + this.options.element);

    $.extend(this, this.options.templates);

    this.render();
    this.control = new gbi.Controls.MousePosition({
        element: this.options.outputID,
        displayProjection: $('#' + this.options.selectID).val()
    });
    editor.addControls([this.control]);
};
gbi.widgets.MousePosition.prototype = {
    CLASS_NAME: 'gbi.widgets.MousePosition',
    render: function() {
        var self = this;
        this.element.empty();
        var select = $(this.selectTemplate);
        $.each(this.options.srs, function(idx, srs) {
            var option = $('<option value="' + srs + '">'+ srs + '</option>');
            select.append(option);
        });
        select.change(function() {
            self.control.updateSRS($('#' + self.options.selectID).val());
        });
        var output = $(this.outputTemplate);
        this.element
            .append(select)
            .append(output);
    }
};
