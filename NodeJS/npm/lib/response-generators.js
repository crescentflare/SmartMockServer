// Response generators class
// Generates special kind of responses, like the index page
// Defined with the 'generates' value within the endpoint properties
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');

//Other requires
var ResponsePropertiesHelper = require('./response-properties-helper');
var HtmlGenerator = require('./html-generator');


//////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////

// ResponseGenerators constructor
function ResponseGenerators() {
}


//////////////////////////////////////////////////
// Utility
//////////////////////////////////////////////////

// Read through a directory recursively
ResponseGenerators.readDirRecursive = function(startDir, dir, callback) {
    var files = [];
    var dirs = [];
    fs.readdir(dir, function(error, list) {
        if (error) {
            callback(error, null);
        }
        var pending = list.length;
        if (!pending) {
            callback(null, results);
        }
        list.forEach(function(file) {
            file = dir + '/' + file;
            fs.stat(file, function(error, stat) {
                if (stat) {
                    if (stat.isDirectory()) {
                        dirs.push(file.replace(startDir + "/", ""));
                        ResponseGenerators.readDirRecursive(startDir, file, function(error, addedFiles, addedDirs) {
                            files = files.concat(addedFiles);
                            dirs = dirs.concat(addedDirs);
                            if (!--pending) {
                                callback(null, files, dirs);
                            }
                        });
                    } else {
                        files.push(file.replace(startDir + "/", ""));
                        if (!--pending) {
                            callback(null, files, dirs);
                        }
                    }
                } else {
                    if (!--pending) {
                        callback(null, files, dirs);
                    }
                }
            });
        });
    });
}


//////////////////////////////////////////////////
// Response generator: index page
//////////////////////////////////////////////////

//Recursive function to find requests and properties
ResponseGenerators.indexPageRecursiveReadProperties = function(rootPath, files, dirs, index, foundProperties, callback)
{
    var arrayContains = function(array, element, alt1, alt2, alt3) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] == element) {
                return element;
            } else if (alt1 && array[i] == alt1) {
                return alt1;
            } else if (alt2 && array[i] == alt2) {
                return alt2;
            } else if (alt3 && array[i] == alt3) {
                return alt3;
            }
        }
    };
    if (index < dirs.length) {
        ResponsePropertiesHelper.readFile(dirs[index], rootPath + '/' + dirs[index], function(properties, error) {
            if (!error) {
                properties.path = dirs[index];
                foundProperties.push(properties);
                ResponseGenerators.indexPageRecursiveReadProperties(rootPath, files, dirs, index + 1, foundProperties, callback);
                return;
            }
            var foundItem = arrayContains(files, dirs[index] + '/' + 'responseBody.json', dirs[index] + '/' + 'responseBody.html', dirs[index] + '/' + 'responseBody.txt', dirs[index] + '/' + 'responseBody.js');
            if (!foundItem) {
                foundItem = arrayContains(files, dirs[index] + '/' + 'response.json', dirs[index] + '/' + 'response.html', dirs[index] + '/' + 'response.txt', dirs[index] + '/' + 'response.js');
            }
            if (foundItem) {
                foundProperties.push({ path: dirs[index] });
            }
            recursiveCheck(rootPath, files, dirs, index + 1, foundProperties, callback);
        });
        return;
    }
    callback(foundProperties);
}

// Convert all found properties into HTML
ResponseGenerators.indexPageToHtml = function(categories) {
    var components = [];
    components.push(HtmlGenerator.createHeading("Found end points"));
    for (var i = 0; i < categories.length; i++) {
        components.push(HtmlGenerator.createSubHeading(categories[i].name));
        for (var j = 0; j < categories[i].properties.length; j++) {
            components.push(HtmlGenerator.createSimpleText(categories[i].properties[j].path));
        }
    }
    return HtmlGenerator.formatAsHtml(components);
}

// Generates an html index page of all endpoints
ResponseGenerators.indexPage = function(req, res, filePath) {
    ResponseGenerators.readDirRecursive(filePath, filePath, function(error, files, dirs) {
        if (dirs) {
            dirs.sort();
            ResponseGenerators.indexPageRecursiveReadProperties(filePath, files, dirs, 0, [], function(foundProperties) {
                if (foundProperties.length > 0) {
                    res.writeHead(200, { "ContentType": "text/html; charset=utf-8" });
                    res.end(ResponseGenerators.indexPageToHtml(ResponsePropertiesHelper.groupedCategories(foundProperties)));
                } else {
                    res.writeHead(404, { "ContentType": "text/plain; charset=utf-8" });
                    res.end("No index to generate, no valid endpoints at: " + filePath);
                }
            });
        } else {
            res.writeHead(404, { "ContentType": "text/plain; charset=utf-8" });
            res.end("No index to generate, no files at: " + filePath);
        }
    });
}


//////////////////////////////////////////////////
// Check for supported response generators
//////////////////////////////////////////////////

// Generates a custom page based on the supported generators
ResponseGenerators.generatesPage = function(req, res, filePath, generator) {
    if (generator == "indexPage") {
        ResponseGenerators.indexPage(req, res, filePath);
        return true;
    }
    return false;
}

// Export
exports = module.exports = ResponseGenerators;
