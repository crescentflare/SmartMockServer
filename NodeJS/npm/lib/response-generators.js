// Response generators class
// Generates special kind of responses, like the index page
// Defined with the 'generates' value within the endpoint properties
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');

// Other requires
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

// Read through a directory (and split between files/directories)
ResponseGenerators.readDir = function(startDir, dir, callback) {
    var checkFile = function(list, index, files, dirs, callback) {
        if (index >= list.length) {
            dirs.sort();
            files.sort();
            callback(null, files, dirs);
            return;
        }
        var file = dir + "/" + list[index];
        fs.stat(file, function(error, stat) {
            if (stat) {
                if (stat.isDirectory()) {
                    dirs.push(file.replace(startDir + "/", ""));
                } else {
                    files.push(file.replace(startDir + "/", ""));
                }
                checkFile(list, index + 1, files, dirs, callback);
            } else {
                checkFile(list, index + 1, files, dirs, callback);
            }
        });
    }
    fs.readdir(dir, function(error, list) {
        if (error) {
            callback(error, null, null);
            return;
        }
        checkFile(list, 0, [], [], callback);
    });
}

// Read through a directory recursively
ResponseGenerators.readDirRecursive = function(startDir, dir, callback) {
    var checkDir = function(fileList, dirList, index, files, dirs, callback) {
        if (index >= dirList.length) {
            files = files.concat(fileList);
            dirs = dirs.concat(dirList);
            callback(null, files, dirs);
            return;
        }
        var scanDir = dir + "/" + dirList[index];
        ResponseGenerators.readDirRecursive(startDir, scanDir, function(error, resultFiles, resultDirs) {
            if (error) {
                checkDir(fileList, dirList, index + 1, files, dirs, callback);
                return;
            }
            for (var i = 0; i < resultDirs.length; i++) {
                dirs.push(dirList[index] + "/" + resultDirs[i]);
            }
            for (var i = 0; i < resultFiles.length; i++) {
                files.push(dirList[index] + "/" + resultFiles[i]);
            }
            checkDir(fileList, dirList, index + 1, files, dirs, callback);
        });
    }
    ResponseGenerators.readDir(dir, dir, function(error, files, dirs) {
        if (error) {
            callback(error, null, null);
            return;
        }
        checkDir(files, dirs, 0, [], [], callback);
    });
}


//////////////////////////////////////////////////
// Response generator: index page
//////////////////////////////////////////////////

// Recursive function to find requests and properties
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
    // Check if the request path points to a file deeper in the tree of the file path
    var requestPathComponents = requestPath.startsWith("/") ? requestPath.substring(1).split("/") : requestPath.split("/");
    var filePathComponents = filePath.split("/");
    var requestFile = "";
    if (requestPathComponents.length > 0 && requestPathComponents[0].length > 0) {
        for (var i = 0; i < filePathComponents.length; i++) {
            if (filePathComponents[i] == requestPathComponents[0]) {
                var overlapComponents = filePathComponents.length - i;
                for (var j = 0; j < overlapComponents; j++) {
                    if (j < requestPathComponents.length && requestPathComponents[j] == filePathComponents[i + j]) {
                        if (j == overlapComponents - 1) {
                            requestFile = requestPathComponents.slice(overlapComponents).join("/");
                        }
                    } else {
                        break;
                    }
                }
                if (requestFile.length > 0) {
                    break;
                }
            }
        }
    }

    // Serve a file when pointing to a file within the file server
    if (requestFile.length > 0) {
        var serveFile = filePath + "/" + requestFile;
        fs.readFile(serveFile, function(error, data) {
            var response = null;
            if (data) {
                response = data;
            } else {
                res.writeHead(404, { "ContentType": "text/plain; charset=utf-8" });
                res.end("Unable to read file: " + requestFile);
                return;
            }
            setTimeout(function() {
                res.writeHead(properties.responseCode, { "ContentType": ResponseGenerators.fileListGetMimeType(serveFile) + "; charset=utf-8" });
                res.end(response);
            }, properties["delay"] || 0);
        });
        return;
    }

    // Generate an index page of files when pointing to the server root
    ResponseGenerators.readDirRecursive(filePath, filePath, function(error, files, dirs) {
        files = files || []
        if (files.length > 0) {
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
