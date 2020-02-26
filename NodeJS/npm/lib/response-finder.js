//
// ResponseFinder
// Find the correct response matching path and parameters
//

'use strict';

// NodeJS requires
var fs = require('fs');

// Other requires
var ParamMatcher = require('./param-matcher');
var ResponseGenerators = require('./response-generators');
var ResponsePropertiesHelper = require('./response-properties-helper');
var SmartMockUtil = require('./smart-mock-util');


// --
// Initialization
// --

// ResponseFinder constructor
function ResponseFinder() {
}


// --
// Output helpers
// --

// Generate headers based on content type and an additional (custom) header list
ResponseFinder.compileHeaders = function(contentType, headers) {
    var headerList = {};
    headerList["Content-Type"] = contentType + "; charset=utf-8";
    for (var key in headers) {
        headerList[key] = headers[key];
    }
    return headerList;
}

// Load and inject shared schema references (recursive method)
ResponseFinder.injectSharedSchemasRecursive = function(schema, sharedPath, links, index, callback) {
    if (index >= links.length) {
        callback(schema);
        return;
    }
    fs.readFile(
        sharedPath + "/" + links[index].link,
        function(error, data) {
            if (data) {
                try {
                    var sharedSchema = JSON.parse(data);
                    delete sharedSchema["$schema"];
                    schema.definitions[links[index].key] = sharedSchema;
                } catch (ignored) {
                }
            }
            ResponseFinder.injectSharedSchemasRecursive(schema, sharedPath, links, index + 1, callback);
        }
    );
}

// Load and inject shared schema references
ResponseFinder.injectSharedSchemas = function(schema, sharedPath, links, callback) {
    console.log(links);
    ResponseFinder.injectSharedSchemasRecursive(schema, sharedPath, links, 0, callback);
}

// End a request with the contents of the given file
ResponseFinder.sendFileResponse = function(handler, contentType, filePath, responseCode, headers, replaceToken, replaceOutput) {
    fs.readFile(
        filePath,
        function(error, data) {
            if (error || !data) {
                handler.handleResponse(500, "Couldn't read file: " + filePath, "text/plain");
                return;
            }
            if (replaceToken && replaceOutput) {
                var safeToken = replaceToken.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
                data = data.toString().replace(new RegExp(safeToken, 'g'), replaceOutput);
            }
            if (contentType == "application/json") {
                try {
                    var tmp = JSON.parse(data);
                } catch (exception) {
                    handler.handleResponse(500, "Couldn't parse JSON of file: " + filePath, "text/plain");
                    return;
                }
            }
            handler.handleResponse(responseCode, data, contentType, headers);
        }
    );
}

// End a request with the contents of the given schema
ResponseFinder.sendSchemaResponse = function(handler, contentType, requestPath, filePath) {
    fs.readFile(
        filePath,
        function(error, data) {
            if (error || !data) {
                handler.handleResponse(500, "Couldn't read file: " + requestPath, "text/plain");
                return;
            }
            if (contentType == "application/json") {
                try {
                    // Parse and add id to the schema
                    var schema = JSON.parse(data);
                    schema["$id"] = requestPath;

                    // Inject shared schemas
                    var injectSchemaLinks = [];
                    if (schema["definitions"]) {
                        for (var key in schema["definitions"]) {
                            var injectLink = schema["definitions"][key]["$injectSharedSchema"];
                            if (injectLink) {
                                schema["definitions"][key] = {};
                                injectSchemaLinks.push({ "key": key, "link": injectLink });
                            }
                        }
                    }

                    // Inject shared schemas and send result
                    if (handler.config.sharedJsonSchemas) {
                        ResponseFinder.injectSharedSchemas(schema, handler.config.sharedJsonSchemas, injectSchemaLinks, function(schema) {
                            handler.handleResponse(200, JSON.stringify(schema, null, 2), contentType);
                        });
                    } else {
                        handler.handleResponse(200, JSON.stringify(schema, null, 2), contentType);
                    }
                } catch (exception) {
                    handler.handleResponse(500, "Couldn't parse JSON of file: " + requestPath, "text/plain");
                }
                return;
            }
            handler.handleResponse(500, "Unknown schema file: " + requestPath, "text/plain");
        }
    );
}


// --
// Search request properties
// --

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
                        postParameters[SmartMockUtil.safeUrlDecode(bodyParamSplit[0].trim())] = SmartMockUtil.safeUrlDecode(bodyParamSplit[1].trim());
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


// --
// High-level generate response code
// --

// Output the response data based on the given properties
ResponseFinder.outputResponse = function(handler, requestPath, filePath, getParameters, rawBody, headers, properties) {
    // Sanity check for a valid path
    if (!SmartMockUtil.isValidPath(requestPath)) {
        handler.handleResponse(404, "Couldn't find: " + requestPath, "text/plain");
        return false;
    }

    // Determine optional replace header and token
    var replaceToken = properties["replaceToken"];
    var replaceOutput = ResponseGenerators.dictionaryValueIgnoringCase(handler.req.headers, 'X-Mock-Replace-Output')
    
    // Continue on
    var continueWithResponse = function(files, sendHeaders) {
        // Check for response generators
        if (ResponseGenerators.generatesPage(handler, requestPath, filePath, getParameters, properties.generates, headers, properties)) {
            return;
        }
        
        // Check for executable javascript
        var foundJavascriptFile = SmartMockUtil.arrayContains(files, properties.responsePath + "Body.js", properties.responsePath + ".js", "responseBody.js", "response.js");
        if (foundJavascriptFile) {
            require(filePath + "/" + foundJavascriptFile).handleResponse(handler.req, handler.res, requestPath, filePath, getParameters, rawBody, properties, sendHeaders);
            return;
        }

        // Check for JSON
        var foundJsonFile = SmartMockUtil.arrayContains(files, properties.responsePath + "Body.json", properties.responsePath + ".json", "responseBody.json", "response.json");
        if (foundJsonFile) {
            ResponseFinder.sendFileResponse(handler, "application/json", filePath + "/" + foundJsonFile, properties.responseCode, sendHeaders, replaceToken, replaceOutput);
            return;
        }
        
        // Check for HTML
        var foundHtmlFile = SmartMockUtil.arrayContains(files, properties.responsePath + "Body.html", properties.responsePath + ".html", "responseBody.html", "response.html");
        if (foundHtmlFile) {
            ResponseFinder.sendFileResponse(handler, "text/html", filePath + "/" + foundHtmlFile, properties.responseCode, sendHeaders, replaceToken, replaceOutput);
            return;
        }
        
        // Check for plain text
        var foundTextFile = SmartMockUtil.arrayContains(files, properties.responsePath + "Body.txt", properties.responsePath + ".txt", "responseBody.txt", "response.txt");
        if (foundTextFile) {
            ResponseFinder.sendFileResponse(handler, "text/plain", filePath + "/" + foundTextFile, properties.responseCode, sendHeaders, replaceToken, replaceOutput);
            return;
        }

        // Nothing found, return a not supported message
        handler.handleResponse(404, "Couldn't find: " + requestPath, "text/plain");
        console.log("Tried to generate a response, but no matching file was found in the formats:", properties.responsePath + "Body.* or " + properties.responsePath + ".*");
        console.log("Supported file extensions:", ".json,", ".html,", ".txt,", ".js");
    };
    fs.readdir(filePath, function(error, files) {
        files = files || [];
        var foundFile = SmartMockUtil.arrayContains(files, properties.responsePath + "Headers.json", "responseHeaders.json");
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

// Output the response data based on the given properties
ResponseFinder.outputSchema = function(handler, requestPath, filePath, getParameters, rawBody, headers, properties) {
    // Sanity check for a valid path
    if (!SmartMockUtil.isValidPath(requestPath)) {
        handler.handleResponse(404, "Couldn't find: " + requestPath, "text/plain");
        return false;
    }

    // Continue on
    var continueWithResponse = function(files) {
        // Check for JSON
        var foundJsonFile = SmartMockUtil.arrayContains(files, properties.responsePath + "Schema.json", "responseSchema.json");
        if (foundJsonFile) {
            ResponseFinder.sendSchemaResponse(handler, "application/json", requestPath, filePath + "/" + foundJsonFile);
            return;
        }
        
        // Nothing found, return a not supported message
        handler.handleResponse(404, "Couldn't find: " + requestPath, "text/plain");
        console.log("Tried to generate a response, but no matching file was found in the formats:", properties.responsePath + "Schema.json or responseSchema.json");
    };
    fs.readdir(filePath, function(error, files) {
        files = files || [];
        continueWithResponse(files);
    });
}

// Find the right response depending on the parameters and properties in the given folder
ResponseFinder.generateResponse = function(handler, requestPath, filePath, getParameters, rawBody) {
    // Sanity check for a valid path
    if (!SmartMockUtil.isValidPath(requestPath)) {
        handler.handleResponse(404, "Couldn't find: " + requestPath, "text/plain");
        return false;
    }

    // Convert POST data or header overrides in get parameter list
    var headers = handler.req.headers;
    if (getParameters["methodOverride"]) {
        handler.req.method = getParameters["methodOverride"];
        delete getParameters["methodOverride"];
    }
    if (getParameters["postBodyOverride"]) {
        rawBody = Buffer.from(getParameters["postBodyOverride"]);
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
                body += SmartMockUtil.safeUrlEncode(parameter) + "=" + SmartMockUtil.safeUrlEncode(getParameters[parameter]);
            }
        }
        rawBody = Buffer.from(body);
        getParameters = {};
    }
    handler.req.method = handler.req.method.toUpperCase();
    
    // Obtain properties and continue
    ResponsePropertiesHelper.readFile(requestPath, filePath, function(properties) {
        ResponseFinder.matchAlternativeProperties(properties, handler.req.method, getParameters, rawBody, headers, function(useProperties) {
            if (properties.generates != "file" && properties.generates != "fileList" && requestPath.endsWith("Schema.json")) {
                if (properties.redirect) {
                    requestPath += "/" + properties.redirect;
                    filePath += "/" + properties.redirect;
                }
                ResponseFinder.outputSchema(handler, requestPath, filePath, getParameters, rawBody, headers, useProperties);
            } else {
                if (useProperties.method && handler.req.method != useProperties.method.toUpperCase() && !ResponseGenerators.supportsMultipleMethods(useProperties.generates)) {
                    handler.handleResponse(405, "Requested method of " + handler.req.method + " doesn't match required " + useProperties.method.toUpperCase(), "text/plain");
                    return;
                }
                setTimeout(
                    function() {
                        if (properties.redirect) {
                            requestPath += "/" + properties.redirect;
                            filePath += "/" + properties.redirect;
                        }
                        ResponseFinder.outputResponse(handler, requestPath, filePath, getParameters, rawBody, headers, useProperties);
                    },
                    useProperties.delay || 0
                );
            }
        });
    });
}

// Export
exports = module.exports = ResponseFinder;
