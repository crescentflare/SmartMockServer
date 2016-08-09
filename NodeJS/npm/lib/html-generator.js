// HTML generator class
// Create components and turn them into HTML for viewing
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');


//////////////////////////////////////////////////
// Simple text component
//////////////////////////////////////////////////

function HtmlSimpleText(text) {
    this.text = text;
}

HtmlSimpleText.prototype.render = function() {
    var renderText = "";
    renderText += '<div style="background:#F4F4F4; padding-left:10px; padding-top:2px; padding-bottom:2px">';
    renderText += this.text;
    renderText += '</div>';
    return renderText;
}


//////////////////////////////////////////////////
// Heading component
//////////////////////////////////////////////////

function HtmlHeading(text) {
    this.text = text;
}

HtmlHeading.prototype.render = function() {
    var renderText = "";
    renderText += '<div style="font-size:1.5em; font-weight:bold; padding-left:10px; padding-top:4px; padding-bottom:4px">';
    renderText += this.text;
    renderText += '</div>';
    return renderText;
}


//////////////////////////////////////////////////
// Initialization and factory methods
//////////////////////////////////////////////////

// HtmlGenerator constructor
function HtmlGenerator() {
}

HtmlGenerator.createSimpleText = function(text) {
    return new HtmlSimpleText(text);
}

HtmlGenerator.createHeading = function(text) {
    return new HtmlHeading(text);
}


//////////////////////////////////////////////////
// Convert to html
//////////////////////////////////////////////////

// Read through a directory recursively
HtmlGenerator.formatAsHtml = function(components) {
    var htmlText = '<html><body leftMargin=0 rightMargin=0 topMargin=0 bottomMargin=0 leftPadding=0 rightPadding=0 topPadding=0 bottomPadding=0 bgColor="#E8E8E8">';
    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        htmlText += components[i].render();
        htmlText += '<div style="background:#BBBBBB; height:1px"></div>';
    }
    htmlText += "</body></html>";
    return htmlText;
}

// Export
exports = module.exports = HtmlGenerator;
