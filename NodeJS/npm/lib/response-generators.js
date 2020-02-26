//
// ResponseGenerators
// Generates special kind of responses, like the index page
// Defined with the 'generates' value within the endpoint properties
//

'use strict';

// NodeJS requires
var fs = require('fs');
var crypto = require('crypto');

// Other requires
var ResponsePropertiesHelper = require('./response-properties-helper');
var HtmlGenerator = require('./html-generator');
var CommandClientList = require('./command-console/command-client-list');
var SmartMockUtil = require('./smart-mock-util');

// Connected clients to the command console
var commandClients = new CommandClientList()


// --
// Initialization
// --

// ResponseGenerators constructor
function ResponseGenerators() {
}


// --
// Utility
// --

// Read through a directory (and split between files/directories)
ResponseGenerators.readDir = function(startDir, dir, callback) {
    var checkFile = function(list, index, files, dirs, callback) {
        if (index >= list.length) {
            dirs.sort();
            files.sort();
            callback(null, files, dirs);
            return;
        }
        if (list[index].toLowerCase() == "thumbs.db" || list[index].toLowerCase() == ".ds_store") {
            checkFile(list, index + 1, files, dirs, callback);
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

// Obtain a dictionary value using a case insensitive key
ResponseGenerators.dictionaryValueIgnoringCase = function(dict, key)
{
    for (var k in dict) {
        if (k.toUpperCase() === key.toUpperCase()) {
            return dict[k];
        }
    }
    return null;
}


// --
// Response generator: secret token entry (for protected servers)
// --

ResponseGenerators.secretTokenEntry = function(handler, showError) {
    var path = __dirname + "/html-templates/secret-entry.html";
    fs.readFile(path, function(error, data) {
        if (data) {
            handler.handleResponse(401, data.toString().replace("[Protected message]", showError ? "Incorrect secret, please try again" : "This server is protected, type the secret below"), "text/html");
        } else {
            handler.handleResponse(401, "This server is protected, please set the secret header", "text/plain");
        }
    });
}


// --
// Response generator: index page
// --

// Recursive function to find requests and properties
ResponseGenerators.indexPageRecursiveReadProperties = function(rootPath, files, dirs, index, foundProperties, callback)
{
    if (index < dirs.length) {
        ResponsePropertiesHelper.readFile(dirs[index], rootPath + '/' + dirs[index], function(properties, error) {
            if (!error) {
                properties.path = dirs[index];
                foundProperties.push(properties);
                ResponseGenerators.indexPageRecursiveReadProperties(rootPath, files, dirs, index + 1, foundProperties, callback);
                return;
            }
            var foundItem = SmartMockUtil.arrayContains(files, dirs[index] + '/' + 'responseBody.json', dirs[index] + '/' + 'responseBody.html', dirs[index] + '/' + 'responseBody.txt', dirs[index] + '/' + 'responseBody.js');
            if (!foundItem) {
                foundItem = SmartMockUtil.arrayContains(files, dirs[index] + '/' + 'response.json', dirs[index] + '/' + 'response.html', dirs[index] + '/' + 'response.txt', dirs[index] + '/' + 'response.js');
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

// Search for available schemas and link them to the properties
ResponseGenerators.indexPageMatchPropertySchema = function(properties, files, isAlternative, path) {
    var searchFile;
    if (properties.responsePath) {
        searchFile = path + "/" + properties.responsePath + "Schema.json";
    } else if (isAlternative) {
        searchFile = path + "/alternative" + properties.name + "Schema.json";
    }
    for (var i = 0; i < files.length; i++) {
        if (files[i] == searchFile) {
            return files[i];
        }
    }
    return null;
}

// Search for available schemas and link them to the properties
ResponseGenerators.indexPageSearchSchemas = function(foundProperties, files) {
    for (var i = 0; i < foundProperties.length; i++) {
        var foundItem = ResponseGenerators.indexPageMatchPropertySchema(foundProperties[i], files, false, foundProperties[i].path);
        if (foundItem) {
            foundProperties[i]["schema"] = foundItem;
        }
        if (foundProperties[i].alternatives) {
            for (var j = 0; j < foundProperties[i].alternatives.length; j++) {
                foundItem = ResponseGenerators.indexPageMatchPropertySchema(foundProperties[i].alternatives[j], files, true, foundProperties[i].path);
                if (foundItem) {
                    foundProperties[i].alternatives[j]["schema"] = foundItem;
                }
            }
        }
    }
}

// Convert all found properties into HTML
ResponseGenerators.indexPageToHtml = function(categories, properties, insertPathExtra) {
    var components = [];
    components.push(HtmlGenerator.createHeading(properties.name || "Found end points"));
    for (var i = 0; i < categories.length; i++) {
        var identifier = categories[i].name.toLowerCase().replace(/ /g, "_");
        components.push(HtmlGenerator.createSubHeading(categories[i].name, identifier));
        for (var j = 0; j < categories[i].properties.length; j++) {
            components.push(HtmlGenerator.createRequestBlock(categories[i].properties[j], identifier + (j + 1), insertPathExtra));
        }
    }
    return HtmlGenerator.formatAsHtml(components, properties);
}

// Generates an html index page of all endpoints
ResponseGenerators.indexPage = function(handler, requestPath, filePath, properties, insertPathExtra) {
    ResponseGenerators.readDirRecursive(filePath, filePath, function(error, files, dirs) {
        if (dirs) {
            ResponseGenerators.indexPageRecursiveReadProperties(filePath, files, dirs, 0, [], function(foundProperties) {
                if (foundProperties.length > 0) {
                    ResponseGenerators.indexPageSearchSchemas(foundProperties, files);
                    handler.handleResponse(200, ResponseGenerators.indexPageToHtml(ResponsePropertiesHelper.groupedCategories(foundProperties), properties, insertPathExtra), "text/html");
                } else {
                    handler.handleResponse(404, "No index to generate, no valid endpoints", "text/plain");
                    console.log("Generated an index without valid endpoints, please check your files at: " + filePath);
                }
            });
        } else {
            handler.handleResponse(404, "No index to generate, no files", "text/plain");
            console.log("Generated index without valid files, please check your files at: " + filePath);
        }
    });
}


// --
// Response generator: file list or a single file
// --

// Convert all found files into HTML
ResponseGenerators.fileListToHtml = function(files, properties, insertPathExtra) {
    var components = [];
    components.push(HtmlGenerator.createHeading(properties.name || "Found files"));
    components.push(HtmlGenerator.createFilesBlock(files, insertPathExtra));
    return HtmlGenerator.formatAsHtml(components, properties);
}

// Convert all found files into JSON
ResponseGenerators.endWithFileListJson = function(handler, files, properties, insertPathExtra, getParameters) {
    // Function to traverse files and get their SHA256 hash
    var traverseFiles = function(fileList, files, index, callback) {
        if (index >= files.length) {
            callback(fileList);
            return;
        }
        if (files[index] == "properties.json") {
            traverseFiles(fileList, files, index + 1, callback);
            return;
        }
        var fd = fs.createReadStream(insertPathExtra + "/" + files[index]);
        var hash = crypto.createHash("sha256");
        hash.setEncoding("hex");
        fd.on("end", function() {
            hash.end();
            fileList[files[index]] = hash.read();
            traverseFiles(fileList, files, index + 1, callback);
        });
        fd.pipe(hash);
    }

    // Process file list and convert to JSON
    if (properties["includeSHA256"] || getParameters["includeSHA256"]) {
        traverseFiles({}, files, 0, function(fileList) {
            handler.handleResponse(200, JSON.stringify(fileList, null, "  "), "application/json");
        });
    } else {
        var fileList = [];
        for (var i = 0; i < files.length; i++) {
            if (files[i] == "properties.json") {
                continue;
            }
            fileList.push(files[i]);
        }
        handler.handleResponse(200, JSON.stringify(fileList, null, "  "), "application/json");
    }
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

// Serve the contents of a file
ResponseGenerators.fileListServeFile = function(handler, requestPath, filePath, requestFile, headers, properties) {
    // Block properties.json
    if (requestFile == "properties.json") {
        handler.handleResponse(404, "Couldn't find: " + requestPath, "text/plain");
        return;
    }

    // Continue with other files
    var serveFile = filePath + "/" + requestFile;
    fs.readFile(serveFile, function(error, data) {
        // Function to finalize serving data after all other checks are done
        var outputFileData = function(data, dataSHA256) {
            var response = null;
            if (data) {
                response = data;
            } else {
                handler.handleResponse(404, "Unable to read file: " + requestFile, "text/plain");
                return;
            }
            setTimeout(function() {
                handler.handleResponse(properties.responseCode, response, ResponseGenerators.fileListGetMimeType(serveFile), { "X-Mock-File-Hash": dataSHA256 } );
            }, properties["delay"] || 0);
        };

        // Function to wait for file changes (until timeout) before continuing with output
        var waitFileChange = function(currentData, currentSHA256, checkSHA256, timeout) {
            if (currentSHA256 != checkSHA256) {
                outputFileData(currentData, currentSHA256);
            } else {
                // Wait for file changes
                var fsWait = false;
                var hitTimeout = false;
                var watcher = fs.watch(serveFile, function(event, filename) {
                    if (filename) {
                        if (fsWait) {
                            return;
                        }
                        fsWait = setTimeout(function() {
                            var data = fs.readFileSync(serveFile);
                            var hash = crypto.createHash("sha256");
                            currentSHA256 = "";
                            hash.setEncoding("hex");
                            if (data) {
                                hash.update(data);
                                hash.end();
                                currentSHA256 = hash.read();
                            } else {
                                hash.end();
                            }
                            if (currentSHA256 != checkSHA256 || hitTimeout) {
                                watcher.close();
                                watcher = null;
                                outputFileData(data, currentSHA256);
                            } else {
                                fsWait = false;
                            }
                        }, 100);
                    }
                });

                // Wait for timeout to abort waiting
                setTimeout(function() {
                    if (watcher) {
                        if (fsWait) {
                            hitTimeout = true;
                        } else {
                            watcher.close();
                            watcher = null;
                            outputFileData(currentData, currentSHA256);
                        }
                    }
                }, timeout * 1000);
            }
        }
        
        // When waiting for a file change, get the SHA256 hash of the file and wait, otherwise just continue
        var waitChangeHash = ResponseGenerators.dictionaryValueIgnoringCase(headers, 'X-Mock-Wait-Change-Hash');
        var hash = crypto.createHash("sha256");
        hash.setEncoding("hex");
        if (data) {
            hash.update(data);
        }
        hash.end();
        if (data && waitChangeHash) {
            var timeoutString = ResponseGenerators.dictionaryValueIgnoringCase(headers, 'X-Mock-Wait-Change-Timeout');
            waitFileChange(data, hash.read(), waitChangeHash.toLowerCase(), parseInt(timeoutString || "", 10) || 10);
        } else {
            outputFileData(data, hash.read());
        }
    });
}

// Serve a file
ResponseGenerators.file = function(handler, requestPath, filePath, getParameters, headers, properties, insertPathExtra) {
    ResponseGenerators.fileListServeFile(handler, requestPath, filePath, properties["filename"] || "", headers, properties);
}

// Generates an html index page of all files found within the folder or serve a file directly
ResponseGenerators.fileList = function(handler, requestPath, filePath, getParameters, headers, properties, insertPathExtra) {
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
        ResponseGenerators.fileListServeFile(handler, requestPath, filePath, requestFile, headers, properties);
        return;
    }

    // Generate an index page of files when pointing to the server root
    ResponseGenerators.readDirRecursive(filePath, filePath, function(error, files, dirs) {
        files = files || []
        if (files.length > 0) {
            if (properties["generatesJson"] || getParameters["generatesJson"]) {
                ResponseGenerators.endWithFileListJson(handler, files, properties, filePath, getParameters);
            } else {
                handler.handleResponse(200, ResponseGenerators.fileListToHtml(files, properties, insertPathExtra), "text/html");
            }
        } else {
            handler.handleResponse(404, "No index to generate, no files at: " + filePath, "text/plain");
        }
    });
}


// --
// Response generator: command console
// --

ResponseGenerators.commandConsole = function(handler, requestPath, filePath, getParameters, headers, properties, insertPathExtra) {
    var waitUpdate = Number(getParameters["waitUpdate"]);
    var name = getParameters["name"];
    if (getParameters["ui"]) {
        var path = __dirname + "/html-templates/ui-template.html";
        fs.readFile(path, function(error, data) {
            if (data) {
                handler.handleResponse(200, data, "text/html");
            } else {
                handler.handleResponse(404, "Could not read file: " + path, "text/plain");
            }
        });
    } else if (handler.req.method == "POST") {
        var token = getParameters["token"] || "";
        var client = commandClients.findClient(token)
        if (client) {
            var commandString = getParameters["command"];
            if (commandString == null || commandString.length == 0) {
                handler.handleResponse(400, "Missing parameter: command", "text/plain");
            } else {
                var command = client.addCommand(getParameters["command"]);
                handler.handleResponse(200, JSON.stringify(command.toJson()), "application/json");
            }
        } else {
            handler.handleResponse(404, "Client with token " + token + " not found", "text/plain");
        }
    } else if (name) {
        var token = getParameters["token"] || "";
        var client = commandClients.findClient(token)
        var needsWait = false;
        if (client) {
            client.updateCheck()
            needsWait = waitUpdate && client.getLastUpdate() <= waitUpdate;
        } else {
            client = commandClients.newClient(name)
        }
        if (needsWait) {
            client.waitUpdate(function(success) {
                var clientJson = client.toJson();
                client.setAllCommandsReceived();
                handler.handleResponse(200, JSON.stringify(clientJson), "application/json");
            }, 10000)
        } else {
            var clientJson = client.toJson();
            client.setAllCommandsReceived();
            handler.handleResponse(200, JSON.stringify(clientJson), "application/json");
        }
    } else {
        if (waitUpdate && commandClients.getLastUpdate() <= waitUpdate) {
            commandClients.waitUpdate(function(success) {
                handler.handleResponse(200, JSON.stringify(commandClients.toJson()), "application/json");
            }, 10000)
        } else {
            handler.handleResponse(200, JSON.stringify(commandClients.toJson()), "application/json");
        }
    }
}


// --
// Check for supported response generators
// --

// Returns whether the generator supports multiple methods like GET and POST
ResponseGenerators.supportsMultipleMethods = function(generator) {
    return generator == "commandConsole";
}

// Generates a custom page based on the supported generators
ResponseGenerators.generatesPage = function(handler, requestPath, filePath, getParameters, generator, headers, properties) {
    var lastSlashIndex = requestPath.lastIndexOf('/');
    var insertPathExtra = "";
    if (lastSlashIndex >= 0 && lastSlashIndex < requestPath.length - 1 && requestPath.length > 1) {
        insertPathExtra = requestPath.substring(lastSlashIndex + 1) + "/";
    }
    if (generator == "indexPage") {
        ResponseGenerators.indexPage(handler, requestPath, filePath, properties, insertPathExtra);
        return true;
    }
    if (generator == "fileList") {
        ResponseGenerators.fileList(handler, requestPath, filePath, getParameters, headers, properties, insertPathExtra);
        return true;
    }
    if (generator == "file") {
        ResponseGenerators.file(handler, requestPath, filePath, getParameters, headers, properties, insertPathExtra);
        return true;
    }
    if (generator == "commandConsole") {
        ResponseGenerators.commandConsole(handler, requestPath, filePath, getParameters, headers, properties, insertPathExtra);
        return true;
    }
    return false;
}

// Export
exports = module.exports = ResponseGenerators;
