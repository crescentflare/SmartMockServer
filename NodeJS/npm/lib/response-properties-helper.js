// Response properties helper class
// Utilities to handle request properties easily
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');


//////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////

// ResponseProperties constructor
function ResponsePropertiesHelper() {
}


//////////////////////////////////////////////////
// Search request properties
//////////////////////////////////////////////////

// Read the properties file based on the file path, fall back to defaults if not found
ResponsePropertiesHelper.readFile = function(requestPath, filePath, callback) {
    fs.readFile(
        filePath + '/' + 'properties.json',
        function(error, data) {
            var properties = null;
            if (!error && data) {
                try {
                    properties = JSON.parse(data);
                } catch (exception) {
                    error = new Error("Can't parse JSON");
                }
            }
            properties = properties || {};
            properties.name = properties.name || requestPath;
            properties.category = properties.category || "Uncategorized";
            properties.responseCode = properties.responseCode || 200;
            properties.responsePath = properties.responsePath || "response";
            callback(properties, error);
        }
    );
}

// Export
exports = module.exports = ResponsePropertiesHelper;
