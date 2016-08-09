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
    return this.text + "<br/>";
}


//////////////////////////////////////////////////
// Heading component
//////////////////////////////////////////////////

function HtmlHeading(text) {
    this.text = text;
}

HtmlHeading.prototype.render = function() {
    return this.text + "<br/><hr>";
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
    var htmlText = "<html><body>";
    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        htmlText += components[i].render();
    }
    htmlText += "</body></html>";
    return htmlText;
}

// Export
exports = module.exports = HtmlGenerator;
