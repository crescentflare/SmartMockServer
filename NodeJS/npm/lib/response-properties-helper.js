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

//Sorting function for categories
ResponsePropertiesHelper.getSortingResultForCategories = function(c1, c2) {
    var sortValues = [ c1, c2 ];
    for (var i = 0; i < 2; i++) {
        if (sortValues[i] == "Uncategorized") {
            sortValues[i] = "zz" + sortValues[i];
        } else if (sortValues[i] && sortValues[i].indexOf("(undocumented)") >= 0) {
            sortValues[i] = "zzz" + sortValues[i];
        } else if (sortValues[i] == "Undocumented") {
            sortValues[i] = "zzzz" + sortValues[i];
        } else if (sortValues[i] == "Deprecated") {
            sortValues[i] = "zzzzz" + sortValues[i];
        }
    }
    if (sortValues[0] < sortValues[1]) {
        return -1;
    }
    if (sortValues[0] > sortValues[1]) {
        return 1;
    }
    return 0;
}


//////////////////////////////////////////////////
// Property utilities
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
            if (properties.redirect) {
                ResponsePropertiesHelper.readFile(requestPath + "/" + properties.redirect, filePath + "/" + properties.redirect, function(redirectProperties, error) {
                    if (redirectProperties) {
                        for (var key in properties) {
                            redirectProperties[key] = properties[key];
                        }
                    } else {
                        redirectProperties = properties;
                    }
                    redirectProperties.category = redirectProperties.category || "Uncategorized";
                    redirectProperties.responseCode = redirectProperties.responseCode || 200;
                    redirectProperties.responsePath = redirectProperties.responsePath || "response";
                    callback(redirectProperties, error);
                });
            } else {
                properties.category = properties.category || "Uncategorized";
                properties.responseCode = properties.responseCode || 200;
                properties.responsePath = properties.responsePath || "response";
                callback(properties, error);
            }
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
    categories.sort(function(a, b) {
        return ResponsePropertiesHelper.getSortingResultForCategories(a.name, b.name);
    });
    return categories;
}

// Export
exports = module.exports = ResponsePropertiesHelper;
