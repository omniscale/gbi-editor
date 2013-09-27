gbi.Helper = gbi.Helper || {};

gbi.Helper.extractHostName= function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l.hostname;
};