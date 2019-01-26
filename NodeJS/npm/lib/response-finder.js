// Response finder class
// Find the correct response matching path and parameters
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');

//Other requires
var ParamMatcher = require('./param-matcher');
var ResponseGenerators = require('./response-generators');
var ResponsePropertiesHelper = require('./response-properties-helper');


//////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////

// ResponseFinder constructor
function ResponseFinder() {
}


//////////////////////////////////////////////////
// Output helpers
//////////////////////////////////////////////////

// Generate headers based on content type and an additional (custom) header list
ResponseFinder.compileHeaders = function(contentType, headers) {
    var headerList = {};
    headerList["Content-Type"] = contentType + "; charset=utf-8";
    for (var key in headers) {
        headerList[key] = headers[key];
    }
    return headerList;
}

// End a request with the contents of the given file
ResponseFinder.sendFileResponse = function(res, contentType, filePath, responseCode, headers) {
    fs.readFile(
        filePath,
        function(error, data) {
            if (error || !data) {
                res.writeHead(500, ResponseFinder.compileHeaders("text/plain", {}));
                res.end("Couldn't read file: " + filePath);
                return;
            }
            if (contentType == "application/json") {
                try {
                    var tmp = JSON.parse(data);
                } catch (exception) {
                    res.writeHead(500, ResponseFinder.compileHeaders("text/plain", {}));
                    res.end("Couldn't parse JSON of file: " + filePath);
                    return;
                }
            }
            res.writeHead(responseCode, ResponseFinder.compileHeaders(contentType, headers));
            res.end(data);
        }
    );
}


//////////////////////////////////////////////////
// Search request properties
//////////////////////////////////////////////////

// Try to find an alternative match within the properties (or fall back to the main properties)
ResponseFinder.matchAlternativeProperties = function(properties, method, getParameters, rawBody, headers, callback) {
    if (properties.alternatives) {
        for (var i = 0; i < properties.alternatives.length; i++) {
            // First pass: match method
            var alternative = properties.alternatives[i];
            alternative.method = alternative.method || properties.method;
            if (alternative.method && alternative.method.toUpperCase() != method) {
                continue;
            }
            
            // Second pass: GET parameters
            if (alternative.getParameters) {
                var foundAlternative = true;
                for (var key in alternative.getParameters) {
                    if (!ParamMatcher.paramEquals(alternative.getParameters[key], getParameters[key])) {
                        foundAlternative = false;
                        break;
                    }
                }
                if (!foundAlternative) {
                    continue;
                }
            }
            
            // Third pass: POST parameters
            if (alternative.postParameters) {
                var body = rawBody.toString();
                var postParameters = {};
                var bodySplit = body.split("&");
                for (var j = 0; j < bodySplit.length; j++) {
                    var bodyParamSplit = bodySplit[j].split("=");
                    if (bodyParamSplit.length == 2) {
                        postParameters[decodeURIComponent(bodyParamSplit[0].trim())] = decodeURIComponent(bodyParamSplit[1].trim());
                    }
                }
                var foundAlternative = true;
                for (var key in alternative.postParameters) {
                    if (!ParamMatcher.paramEquals(alternative.postParameters[key], postParameters[key])) {
                        foundAlternative = false;
                        break;
                    }
                }
                if (!foundAlternative) {
                    continue;
                }
            }

            // Fourth pass: POST JSON
            if (alternative.postJson) {
                var bodyJson = {};
                try {
                    bodyJson = JSON.parse(rawBody.toString());
                } catch (exception) {
                    continue;
                }
                if (!ParamMatcher.deepEquals(alternative.postJson, bodyJson)) {
                    continue;
                }
            }
            
            // Fifth pass: headers
            if (alternative.checkHeaders) {
                var foundAlternative = true;
                for (var key in alternative.checkHeaders) {
                    var haveHeader = null;
                    for (var haveKey in headers) {
                        if (haveKey.toLowerCase() == key.toLowerCase()) {
                            haveHeader = headers[haveKey];
                            break;
                        }
                    }
                    if (!ParamMatcher.paramEquals(alternative.checkHeaders[key], haveHeader)) {
                        foundAlternative = false;
                        break;
                    }
                }
                if (!foundAlternative) {
                    continue;
                }
            }
            
            // All passes OK, use alternative
            alternative.responseCode = alternative.responseCode || properties.responseCode;
            alternative.delay = alternative.delay || properties.delay;
            if (!alternative.responsePath) {
                if (alternative.name) {
                    alternative.responsePath = "alternative" + alternative.name;
                } else {
                    alternative.responsePath = "alternative" + i;
                }
            }
            callback(alternative);
            return;
        }
    }
    callback(properties);
}


//////////////////////////////////////////////////
// High-level generate response code
//////////////////////////////////////////////////

// Output the response data based on the given properties
ResponseFinder.outputResponse = function(req, res, requestPath, filePath, getParameters, rawBody, headers, properties) {
    var arrayContains = function(array, element, alt1, alt2, alt3) {
        var checkOrderedArray = [element, alt1, alt2, alt3];
        for (var i = 0; i < checkOrderedArray.length; i++) {
            if (checkOrderedArray[i]) {
                for (var j = 0; j < array.length; j++) {
                    if (checkOrderedArray[i] == array[j]) {
                        return checkOrderedArray[i];
                    }
                }
            }
        }
        return null;
    };
    var continueWithResponse = function(files, sendHeaders) {
        // Check for response generators
        if (ResponseGenerators.generatesPage(req, res, requestPath, filePath, getParameters, properties.generates, headers, properties)) {
            return;
        }
        
        // Check for executable javascript
        var foundJavascriptFile = arrayContains(files, properties.responsePath + "Body.js", properties.responsePath + ".js", "responseBody.js", "response.js");
        if (foundJavascriptFile) {
            require(filePath + "/" + foundJavascriptFile).handleResponse(req, res, requestPath, filePath, getParameters, rawBody, properties, sendHeaders);
            return;
        }

        // Check for JSON
        var foundJsonFile = arrayContains(files, properties.responsePath + "Body.json", properties.responsePath + ".json", "responseBody.json", "response.json");
        if (foundJsonFile) {
            ResponseFinder.sendFileResponse(res, "application/json", filePath + "/" + foundJsonFile, properties.responseCode, sendHeaders);
            return;
        }
        
        // Check for HTML
        var foundHtmlFile = arrayContains(files, properties.responsePath + "Body.html", properties.responsePath + ".html", "responseBody.html", "response.html");
        if (foundHtmlFile) {
            ResponseFinder.sendFileResponse(res, "text/html", filePath + "/" + foundHtmlFile, properties.responseCode, sendHeaders);
            return;
        }
        
        // Check for plain text
        var foundTextFile = arrayContains(files, properties.responsePath + "Body.txt", properties.responsePath + ".txt", "responseBody.txt", "response.txt");
        if (foundTextFile) {
            ResponseFinder.sendFileResponse(res, "text/plain", filePath + "/" + foundTextFile, properties.responseCode, sendHeaders);
            return;
        }

        // Nothing found, return a not supported message
        res.writeHead(500, ResponseFinder.compileHeaders("text/plain", {}));
        res.end("Couldn't find response. Only the following formats are supported: JSON, HTML, text and executable javascript code");
    };
    fs.readdir(filePath, function(error, files) {
        files = files || [];
        var foundFile = arrayContains(files, properties.responsePath + "Headers.json", "responseHeaders.json");
        if (foundFile) {
            fs.readFile(
                filePath + "/" + foundFile,
                function(error, data) {
                    var sendHeaders = null;
                    if (!error && data) {
                        try {
                            sendHeaders = JSON.parse(data);
                        } catch (ignored) { }
                    }
                    sendHeaders = sendHeaders || {};
                    continueWithResponse(files, sendHeaders);
                }
            );
        } else {
            continueWithResponse(files, {});
        }
    });
}

// Find the right response depending on the parameters and properties in the given folder
ResponseFinder.generateResponse = function(req, res, requestPath, filePath, getParameters, rawBody) {
    // Convert POST data or header overrides in get parameter list
    var headers = req.headers;
    if (getParameters["methodOverride"]) {
        req.method = getParameters["methodOverride"];
        delete getParameters["methodOverride"];
    }
    if (getParameters["postBodyOverride"]) {
        rawBody = new Buffer(getParameters["postBodyOverride"]);
        delete getParameters["postBodyOverride"];
    }
    if (getParameters["headerOverride"]) {
        var addHeaders = {};
        try {
            addHeaders = JSON.parse(getParameters["headerOverride"]);
        } catch (ignored) {
        }
        for (var key in addHeaders) {
            headers[key] = addHeaders[key];
        }
        delete getParameters["headerOverride"];
    }
    if (getParameters["getAsPostParameters"]) {
        var body = "";
        for (var parameter in getParameters) {
            if (parameter != "getAsPostParameters") {
                if (body.length > 0) {
                    body += "&";
                }
                body += encodeURIComponent(parameter) + "=" + encodeURIComponent(getParameters[parameter]);
            }
        }
        rawBody = new Buffer(body);
        getParameters = {};
    }
    req.method = req.method.toUpperCase();
    
    // Obtain properties and continue
    ResponsePropertiesHelper.readFile(requestPath, filePath, function(properties) {
        ResponseFinder.matchAlternativeProperties(properties, req.method, getParameters, rawBody, headers, function(useProperties) {
            if (useProperties.method && req.method != useProperties.method.toUpperCase() && !ResponseGenerators.supportsMultipleMethods(useProperties.generates)) {
                res.writeHead(409, ResponseFinder.compileHeaders("text/plain", {}));
                res.end("Requested method of " + req.method + " doesn't match required " + useProperties.method.toUpperCase());
                return;
            }
            setTimeout(
                function() {
                    if (properties.redirect) {
                        requestPath += "/" + properties.redirect;
                        filePath += "/" + properties.redirect;
                    }
                    ResponseFinder.outputResponse(req, res, requestPath, filePath, getParameters, rawBody, headers, useProperties);
                },
                useProperties.delay || 0
            );
        });
    });
}

// Export
exports = module.exports = ResponseFinder;
