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
            callback(error, null, null);
        }
        var pending = list.length;
        if (!pending) {
            callback(null, files, dirs);
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

// Read through a directory (but not within subdirectories)
ResponseGenerators.readDir = function(startDir, dir, callback) {
    var files = [];
    var dirs = [];
    fs.readdir(dir, function(error, list) {
        if (error) {
            callback(error, null, null);
        }
        var pending = list.length;
        if (!pending) {
            callback(null, files, dirs);
        }
        list.forEach(function(file) {
            file = dir + '/' + file;
            fs.stat(file, function(error, stat) {
                if (stat) {
                    if (stat.isDirectory()) {
                        dirs.push(file.replace(startDir + "/", ""));
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
                foundProperties.push({ "path": dirs[index], "category": "Undocumented" });
            }
            ResponseGenerators.indexPageRecursiveReadProperties(rootPath, files, dirs, index + 1, foundProperties, callback);
        });
        return;
    }
    foundProperties.sort(function(a, b) {
        var nameA = a.name || "zzz";
        var nameB = b.name || "zzz";
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }
        return 0;
    });
    callback(foundProperties);
}

// Convert all found properties into HTML
ResponseGenerators.indexPageToHtml = function(categories, properties, insertPathExtra) {
    var components = [];
    components.push(HtmlGenerator.createHeading(properties.name || "Found end points"));
    for (var i = 0; i < categories.length; i++) {
        var identifier = categories[i].name.toLowerCase();
        components.push(HtmlGenerator.createSubHeading(categories[i].name, identifier));
        for (var j = 0; j < categories[i].properties.length; j++) {
            components.push(HtmlGenerator.createRequestBlock(categories[i].properties[j], identifier + (j + 1), insertPathExtra));
        }
    }
    return HtmlGenerator.formatAsHtml(components, properties);
}

// Generates an html index page of all endpoints
ResponseGenerators.indexPage = function(req, res, requestPath, filePath, properties, insertPathExtra) {
    ResponseGenerators.readDirRecursive(filePath, filePath, function(error, files, dirs) {
        if (dirs) {
            dirs.sort();
            ResponseGenerators.indexPageRecursiveReadProperties(filePath, files, dirs, 0, [], function(foundProperties) {
                if (foundProperties.length > 0) {
                    res.writeHead(200, { "ContentType": "text/html; charset=utf-8" });
                    res.end(ResponseGenerators.indexPageToHtml(ResponsePropertiesHelper.groupedCategories(foundProperties), properties, insertPathExtra));
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
// Response generator: file list
//////////////////////////////////////////////////

// Convert all found files into HTML
ResponseGenerators.fileListToHtml = function(files, properties, insertPathExtra) {
    var components = [];
    components.push(HtmlGenerator.createHeading(properties.name || "Found files"));
    components.push(HtmlGenerator.createFilesBlock(files, insertPathExtra));
    return HtmlGenerator.formatAsHtml(components, properties);
}

// Find the MIME-type for the given extension
ResponseGenerators.fileListGetMimeType = function(filename) {
    var extension = "";
    if (filename) {
        var dotPos = filename.lastIndexOf(".");
        if (dotPos >= 0) {
            extension = filename.substring(dotPos + 1);
        }
    }
    if (extension == "png") {
        return "image/png";
    } else if (extension == "gif") {
        return "image/gif";
    } else if (extension == "jpg" || extension == "jpeg") {
        return "image/jpg";
    } else if (extension == "htm" || extension == "html") {
        return "text/html";
    } else if (extension == "zip") {
        return "application/zip";
    }
    return "text/plain";
}

// Generates an html index page of all files found within the folder
ResponseGenerators.fileList = function(req, res, requestPath, filePath, properties, insertPathExtra) {
    var lastRequestSlashIndex = requestPath.lastIndexOf('/');
    var lastPathSlashIndex = filePath.lastIndexOf('/');
    var requestEndPart = "";
    var fileEndPart = "";
    if (lastRequestSlashIndex >= 0) {
        requestEndPart = requestPath.substring(lastRequestSlashIndex + 1);
    }
    if (lastPathSlashIndex >= 0) {
        fileEndPart = filePath.substring(lastPathSlashIndex + 1);
    }
    if (requestEndPart != "" && requestEndPart != fileEndPart) {
        var serveFile = filePath + "/" + requestEndPart;
        fs.readFile(serveFile, function(error, data) {
            var response = null;
            if (data) {
                response = data;
            } else {
                res.writeHead(500, { "ContentType": "text/plain; charset=utf-8" });
                res.end("Unable to read file: " + requestEndPart);
                return;
            }
            setTimeout(function() {
                res.writeHead(properties.responseCode, { "ContentType": ResponseGenerators.fileListGetMimeType(serveFile) + "; charset=utf-8" });
                res.end(response);
            }, properties["delay"] || 0);
        });
        return;
    }
    ResponseGenerators.readDir(filePath, filePath, function(error, files, dirs) {
        if (files && files.length > 0) {
            files.sort();
            res.writeHead(200, { "ContentType": "text/html; charset=utf-8" });
            res.end(ResponseGenerators.fileListToHtml(files, properties, insertPathExtra));
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
ResponseGenerators.generatesPage = function(req, res, requestPath, filePath, generator, properties) {
    var lastSlashIndex = requestPath.lastIndexOf('/');
    var insertPathExtra = "";
    if (lastSlashIndex >= 0 && lastSlashIndex < requestPath.length - 1 && requestPath.length > 1) {
        insertPathExtra = requestPath.substring(lastSlashIndex + 1) + "/";
    }
    if (generator == "indexPage") {
        ResponseGenerators.indexPage(req, res, requestPath, filePath, properties, insertPathExtra);
        return true;
    }
    if (generator == "fileList") {
        ResponseGenerators.fileList(req, res, requestPath, filePath, properties, insertPathExtra);
        return true;
    }
    return false;
}

// Export
exports = module.exports = ResponseGenerators;
