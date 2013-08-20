function require(jspath) {
    var scriptName = "gbi.js";
    var r = new RegExp("(^|(.*?\\/))(" + scriptName + ")(\\?|$)"),
        s = document.getElementsByTagName('script'),
        src, m, l = "";
    for(var i=0, len=s.length; i<len; i++) {
        src = s[i].getAttribute('src');
        if(src) {
            m = src.match(r);
            if(m) {
                l = m[1];
                break;
            }
        }
    }
    document.write('<script type="text/javascript" src="'+ l + jspath+'"><\/script>');
}
require("ecma.extensions.js");
require("dateformat.js");
require("openlayers.extensions/couch.js");
require("openlayers.extensions/delete.js");
require("openlayers.extensions/merge.js");
require("openlayers.extensions/split.js");
require("openlayers.extensions/wfst_ordered.js");
require("openlayers.extensions/copy.js")
require("openlayers.extensions/string.format.js")
require("gbi.editor.js");
require("gbi.layermanager.js");
require("gbi.map.js");
require("gbi.layer.js");
require("gbi.controls.js");
require("gbi.toolbar.js");
require("gbi.toolbar.controls.js");

/** @namespace OpenLayers */
/** @namespace OpenLayers.Control */
/** @namespace OpenLayers.Format */
/** @namespace OpenLayers.Protocol */

/** @namespace gbi */
/** @namespace gbi.Layers */
/** @namespace gbi.Controls */
