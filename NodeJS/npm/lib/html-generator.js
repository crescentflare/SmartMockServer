// HTML generator class
// Create components and turn them into HTML for viewing
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');


//////////////////////////////////////////////////
// Request block component
//////////////////////////////////////////////////

function HtmlRequestBlock(properties) {
    this.subComponents = [];
    if (properties.name) {
        this.subComponents.push(new HtmlText(properties.name, 1.5, true));
    }
    if (properties.description) {
        this.subComponents.push(new HtmlText(properties.description));
    }
    this.subComponents.push(new HtmlLink(properties.method, this.constructLink(properties.method, properties.path), properties.path));
}

HtmlRequestBlock.prototype.constructLink = function(method, path) {
    var link = path;
    if (method && method != "GET") {
        link += "?methodOverride=" + method;
    }
    return link;
}

HtmlRequestBlock.prototype.render = function() {
    var renderText = "";
    var prevObj = null;
    renderText += '<div style="background:#FFFFFF; padding-left:12px; padding-top:10px; padding-bottom:10px">';
    for (var i = 0; i < this.subComponents.length; i++) {
        if (prevObj instanceof HtmlText && this.subComponents[i] instanceof HtmlLink) {
            renderText += '<div style="height:18px"></div>';
        }
        renderText += this.subComponents[i].render();
        prevObj = this.subComponents[i];
    }
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
    renderText += '<div style="font-size:1.5em; font-weight:bold; padding-left:12px; padding-top:8px; padding-bottom:8px">';
    renderText += this.text;
    renderText += '</div>';
    return renderText;
}


//////////////////////////////////////////////////
// Subheading component
//////////////////////////////////////////////////

function HtmlSubHeading(text) {
    this.text = text;
}

HtmlSubHeading.prototype.render = function() {
    var renderText = "";
    renderText += '<div style="background:#F4F4F4; font-size:1.8em; font-weight:bold; padding-left:12px; padding-top:20px; padding-bottom:12px">';
    renderText += "> " + this.text;
    renderText += '</div>';
    return renderText;
}


//////////////////////////////////////////////////
// Link component
//////////////////////////////////////////////////

function HtmlLink(method, link, text) {
    this.method = method;
    this.link = link;
    this.text = text;
}

HtmlLink.prototype.render = function() {
    var renderText = "";
    renderText += '<div>';
    if (this.method) {
        renderText += this.method + " ";
    }
    renderText += '<a href="' + this.link + '">' + this.text + '</a>';
    renderText += '</div>';
    return renderText;
}


//////////////////////////////////////////////////
// Text component
//////////////////////////////////////////////////

function HtmlText(text, relativeSize, bold) {
    this.text = text;
    this.relativeSize = relativeSize || 1;
    this.bold = bold || false;
}

HtmlText.prototype.addStyle = function(style, add) {
    if (style.length == 0) {
        style += ' style="';
    } else {
        style += '; ';
    }
    style += add;
    return style;
}

HtmlText.prototype.render = function() {
    var renderText = "";
    var style = "";
    if (this.relativeSize != 1) {
        style = this.addStyle(style, 'font-size:' + this.relativeSize + 'em');
    }
    if (this.bold) {
        style = this.addStyle(style, 'font-weight:bold');
    }
    if (style.length > 0) {
        style += '"';
    }
    renderText += '<div' + style + '>';
    if (this.method) {
        renderText += this.method + " ";
    }
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

HtmlGenerator.createRequestBlock = function(properties) {
    return new HtmlRequestBlock(properties);
}

HtmlGenerator.createHeading = function(text) {
    return new HtmlHeading(text);
}

HtmlGenerator.createSubHeading = function(text) {
    return new HtmlSubHeading(text);
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
    htmlText += '<div style="height:18px"></div>';
    htmlText += "</body></html>";
    return htmlText;
}

// Export
exports = module.exports = HtmlGenerator;
