// HTML generator class
// Create components and turn them into HTML for viewing
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');


//////////////////////////////////////////////////
// Request block component
//////////////////////////////////////////////////

function HtmlRequestBlock(properties, identifier, insertPathExtra) {
    this.identifier = identifier;
    this.subComponents = [];
    if (properties.name) {
        this.subComponents.push(new HtmlText(properties.name, 1.5, true));
    }
    if (properties.description) {
        this.subComponents.push(new HtmlText(properties.description));
    }
    if (properties.postJson || properties.postParameters) {
        this.subComponents.push(new HtmlParamBlock(properties, false, insertPathExtra, false));
    }
    if (properties.generates == "commandConsole") { // Special case
        this.generateCommandConsoleComponents(properties, insertPathExtra);
        return;
    }
    if (properties.alternatives) {
        for (var i = 0; i < properties.alternatives.length; i++) {
            var alternative = properties.alternatives[i];
            if (!alternative.hidden) {
                alternative.path = alternative.path || properties.path;
                alternative.method = alternative.method || properties.method;
                alternative.getParameters = alternative.getParameters || properties.getParameters;
                this.subComponents.push(new HtmlParamBlock(alternative, true, insertPathExtra, alternative.method != (properties.method || "GET")));
            }
        }
    }
    var link = properties.path;
    var showLink = properties.path;
    if (properties.method && properties.method.toUpperCase() != "GET") {
        link = this.concatLink(link, "methodOverride=" + properties.method);
    }
    if (properties.getParameters) {
        for (var key in properties.getParameters) {
            link = this.concatLink(link, encodeURIComponent(key) + "=" + encodeURIComponent(properties.getParameters[key]));
            showLink = this.concatLink(showLink, encodeURIComponent(key) + "=" + encodeURIComponent(properties.getParameters[key]));
        }
    }
    this.subComponents.push(new HtmlLink(properties.method, insertPathExtra + link, showLink));
}

HtmlRequestBlock.prototype.generateCommandConsoleComponents = function(properties, insertPathExtra) {
    this.subComponents.push(new HtmlLink("GET", insertPathExtra + properties.path + "?ui=1", properties.path + "?ui=1"));
    this.subComponents.push(new HtmlLink("GET", insertPathExtra + properties.path, properties.path));
    this.subComponents.push(new HtmlLink("GET", insertPathExtra + properties.path + "?name=device_name", properties.path + "?name=device_name"));
    this.subComponents.push(new HtmlLink("GET", insertPathExtra + properties.path + "?name=device_name&token=1", properties.path + "?name=device_name&token=1"));
}

HtmlRequestBlock.prototype.concatLink = function(link, param) {
    if (link.indexOf('?') >= 0) {
        link += "&";
    } else {
        link += "?";
    }
    return link + param;
}

HtmlRequestBlock.prototype.render = function() {
    var renderText = "";
    var prevObj = null;
    var idString = '';
    if (this.identifier) {
        idString = 'id="' + this.identifier + '" ';
    }
    renderText += '<div ' + idString + 'style="background:#FFFFFF; padding-left:12px; padding-top:10px; padding-bottom:10px">';
    for (var i = 0; i < this.subComponents.length; i++) {
        var curObj = this.subComponents[i];
        if (prevObj instanceof HtmlText && curObj instanceof HtmlLink) {
            renderText += '<div style="height:20px"></div>';
        }
        if ((!(prevObj instanceof HtmlParamBlock) && curObj instanceof HtmlParamBlock) || (prevObj instanceof HtmlParamBlock && !(curObj instanceof HtmlParamBlock))) {
            renderText += '<div style="height:20px"></div>';
        } else if (prevObj instanceof HtmlParamBlock && curObj instanceof HtmlParamBlock) {
            renderText += '<div style="height:16px"></div>';
        }
        renderText += curObj.render();
        prevObj = curObj;
    }
    renderText += '</div>';
    return renderText;
}


//////////////////////////////////////////////////
// Parameter block component
//////////////////////////////////////////////////

function HtmlParamBlock(properties, isAlternative, insertPathExtra, isAlternativeMethod) {
    this.subComponents = [];
    if (isAlternative) {
        var name = "Alternative";
        var link = properties.path;
        if (properties.name) {
            name += ": " + properties.name;
        }
        if (isAlternativeMethod) {
            name += " (" + (properties.method || "GET") + ")";
        }
        if (properties.method && properties.method.toUpperCase() != "GET") {
            link = this.concatLink(link, "methodOverride=" + properties.method);
        }
        if (!properties.getParameters && properties.postParameters) {
            link = this.concatLink(link, "getAsPostParameters=1");
            for (var key in properties.postParameters) {
                link = this.concatLink(link, encodeURIComponent(key) + "=" + encodeURIComponent(properties.postParameters[key]));
            }
        } else if (properties.postParameters) {
            var postList = "";
            for (var key in properties.postParameters) {
                if (postList.length > 0) {
                    postList += "&";
                }
                postList += encodeURIComponent(key) + "=" + encodeURIComponent(properties.postParameters[key]);
            }
            link = this.concatLink(link, "postBodyOverride=" + encodeURIComponent(postList));
        } else if (properties.postJson) {
            link = this.concatLink(link, "postBodyOverride=" + encodeURIComponent(JSON.stringify(properties.postJson)));
        }
        if (properties.checkHeaders) {
            link = this.concatLink(link, "headerOverride=" + encodeURIComponent(JSON.stringify(properties.checkHeaders)));
        }
        if (properties.getParameters) {
            for (var key in properties.getParameters) {
                link = this.concatLink(link, encodeURIComponent(key) + "=" + encodeURIComponent(properties.getParameters[key]));
            }
        }
        this.subComponents.push(new HtmlLink(null, insertPathExtra + link, name));
    }
    if (properties.getParameters && isAlternative) {
        var paramString = properties.path;
        for (var key in properties.getParameters) {
            paramString = this.concatLink(paramString, encodeURIComponent(key) + "=" + encodeURIComponent(properties.getParameters[key]));
        }
        this.subComponents.push(new HtmlText(paramString));
    }
    if (properties.postParameters) {
        for (var key in properties.postParameters) {
            this.subComponents.push(new HtmlText(key + '=' + properties.postParameters[key]));
        }
    } else if (properties.postJson) {
        this.subComponents.push(new HtmlText(JSON.stringify(properties.postJson, null, 2)));
    }
    if (properties.checkHeaders) {
        for (var key in properties.checkHeaders) {
            this.subComponents.push(new HtmlText(key + ': ' + properties.checkHeaders[key] + " (header)"));
        }
    }
}

HtmlParamBlock.prototype.concatLink = function(link, param) {
    if (link.indexOf('?') >= 0) {
        link += "&";
    } else {
        link += "?";
    }
    return link + param;
}

HtmlParamBlock.prototype.render = function() {
    var renderText = "";
    renderText += '<div style="padding-left:12px; white-space: pre-wrap; white-space: font-family: monospace; font-size:0.9em; overflow-wrap: break-word">';
    for (var i = 0; i < this.subComponents.length; i++) {
        renderText += this.subComponents[i].render();
    }
    renderText += '</div>';
    return renderText;
}


//////////////////////////////////////////////////
// Files block component
//////////////////////////////////////////////////

function HtmlFilesBlock(files, insertPathExtra) {
    this.subComponents = [];
    for (var i = 0; i < files.length; i++) {
        if (files[i] == "properties.json") {
            continue;
        }
        this.subComponents.push(new HtmlLink(null, insertPathExtra + files[i], files[i]));
    }
}

HtmlFilesBlock.prototype.render = function() {
    var renderText = "";
    renderText += '<div style="background:#FFFFFF; padding-left:12px; padding-top:10px; padding-bottom:10px">';
    for (var i = 0; i < this.subComponents.length; i++) {
        renderText += this.subComponents[i].render();
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

function HtmlSubHeading(text, identifier) {
    this.identifier = identifier;
    this.text = text;
}

HtmlSubHeading.prototype.render = function() {
    var renderText = "";
    var clickFuncString = '';
    var cursorString = '';
    if (this.identifier) {
        clickFuncString = 'onClick=toggleExpand("' + this.identifier + '") ';
        cursorString = '; cursor:pointer';
    }
    renderText += '<div ' + clickFuncString + 'style="background:#F4F4F4; font-size:1.8em; font-weight:bold; padding-left:12px; padding-top:20px; padding-bottom:12px' + cursorString + '">';
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
    renderText += '<div style="overflow-wrap: break-word">';
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
// Expandable sub heading javascript component
//////////////////////////////////////////////////

function HtmlExpandableSubHeadingScript() {
}

HtmlExpandableSubHeadingScript.prototype.render = function() {
    var renderText = "";
    renderText += '<script type="text/javascript">';
    renderText += 'function toggleExpand(categoryId, autoStart) {';
    renderText += 'if (categoryId == "") { return }';
    renderText += 'var divs = document.getElementsByTagName("div");';
    renderText += 'var contractedCategories = extractContractedCategories();';
    renderText += 'var isHidden = false;';
    renderText += 'if (!autoStart) {';
    renderText += 'for (var i = 0; i < contractedCategories.length; i++) {';
    renderText += 'if (contractedCategories[i] == categoryId) {';
    renderText += 'isHidden = true;';
    renderText += 'contractedCategories.splice(i, 1);';
    renderText += 'break;';
    renderText += '}';
    renderText += '}';
    renderText += '}';
    renderText += 'for (var i = 0; i < divs.length; i++) {';
    renderText += 'var div = divs[i];';
    renderText += 'if (div.id && div.id.indexOf(categoryId) == 0) { div.hidden = !isHidden; }';
    renderText += '}';
    renderText += 'if (!autoStart) {';
    renderText += 'if (!isHidden) { contractedCategories.push(categoryId); }';
    renderText += 'storeContractedCategories(contractedCategories);';
    renderText += '}';
    renderText += '}';
    
    renderText += 'function extractContractedCategories() {';
    renderText += 'if (typeof(Storage) !== "undefined") {';
    renderText += 'var contractedCategoriesString = sessionStorage.contractedCategories || "";';
    renderText += 'return contractedCategoriesString.split("|");';
    renderText += '}';
    renderText += 'return [];';
    renderText += '}';
    
    renderText += 'function storeContractedCategories(contractedCategories) {';
    renderText += 'contractedCategories = contractedCategories || [];';
    renderText += 'if (typeof(Storage) !== "undefined") {';
    renderText += 'var contractedCategoriesString = contractedCategories.join("|");';
    renderText += 'sessionStorage.contractedCategories = contractedCategoriesString;';
    renderText += '}';
    renderText += 'return [];';
    renderText += '}';
    
    renderText += 'window.onload = function() {';
    renderText += 'if (typeof(Storage) !== "undefined") {';
    renderText += 'var contractedCategories = extractContractedCategories();';
    renderText += 'for (var i = 0; i < contractedCategories.length; i++) { toggleExpand(contractedCategories[i], true); }';
    renderText += '}';
    renderText += '}';
    renderText += '</script>';
    return renderText;
}


//////////////////////////////////////////////////
// Initialization and factory methods
//////////////////////////////////////////////////

// HtmlGenerator constructor
function HtmlGenerator() {
}

HtmlGenerator.createRequestBlock = function(properties, identifier, insertPathExtra) {
    return new HtmlRequestBlock(properties, identifier, insertPathExtra);
}

HtmlGenerator.createFilesBlock = function(files, insertPathExtra) {
    return new HtmlFilesBlock(files, insertPathExtra);
}

HtmlGenerator.createHeading = function(text) {
    return new HtmlHeading(text);
}

HtmlGenerator.createSubHeading = function(text, identifier) {
    return new HtmlSubHeading(text, identifier);
}


//////////////////////////////////////////////////
// Convert to html
//////////////////////////////////////////////////

// Read through a directory recursively
HtmlGenerator.formatAsHtml = function(components, properties) {
    var htmlText = '<html>';
    htmlText += '<head>';
    if (properties.name) {
        htmlText += '<title>' + properties.name + '</title>';
        htmlText += new HtmlExpandableSubHeadingScript().render();
    }
    htmlText += '<meta name=viewport content="width=device-width,initial-scale=1">';
    htmlText += '</head>';
    htmlText += '<body leftMargin=0 rightMargin=0 topMargin=0 bottomMargin=0 leftPadding=0 rightPadding=0 topPadding=0 bottomPadding=0 bgColor="#E8E8E8">';
    for (var i = 0; i < components.length; i++) {
        var component = components[i];
        var idString = '';
        if (component instanceof HtmlRequestBlock && component.identifier) {
            idString = 'id="' + component.identifier + 'line" ';
        }
        htmlText += components[i].render();
        htmlText += '<div ' + idString + 'style="background:#BBBBBB; height:1px"></div>';
    }
    htmlText += '<div style="height:18px"></div>';
    htmlText += "</body></html>";
    return htmlText;
}

// Export
exports = module.exports = HtmlGenerator;
