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
// Helper functions
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

// Read the properties file based on the file path, fall back to defaults if not found
ResponsePropertiesHelper.groupedCategories = function(propertiesList) {
    var categories = [];
    for (var i = 0; i < propertiesList.length; i++) {
        var foundCategory = null;
        for (var j = 0; j < categories.length; j++) {
            if (propertiesList[i].category == categories[j]["name"]) {
                foundCategory = categories[j];
                break;
            }
        }
        if (!foundCategory) {
            foundCategory = { "name": propertiesList[i].category, "properties": [] };
            categories.push(foundCategory);
        }
        foundCategory["properties"].push(propertiesList[i]);
    }
    return categories;
}

// Export
exports = module.exports = ResponsePropertiesHelper;
