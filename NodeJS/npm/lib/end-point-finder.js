// End point finder class
// Locate and find the correct end point location
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var fs = require('fs');


//////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////

// EndPointFinder constructor
function EndPointFinder() {
}


//////////////////////////////////////////////////
// Path checking
//////////////////////////////////////////////////

// Find the file server path for a file path
EndPointFinder.findFileServerPath = function(checkPath, callback) {
    var traversePath = function(path, callback) {
        var slashPos = path.lastIndexOf("/");
        if (slashPos >= 0) {
            var subPath = path.substring(0, slashPos);
            fs.readFile(
                subPath + "/properties.json",
                function(error, data) {
                    if (data) {
                        try {
                            var json = JSON.parse(data);
                            if (json && json["generates"] == "fileList") {
                                callback(subPath);
                            }
                        } catch (exception) {
                            traversePath(subPath, callback);
                        }
                    } else {
                        traversePath(subPath, callback);
                    }
                }
            );
        } else {
            callback(null);
        }
    }
    traversePath(checkPath, callback);
}

// Recursive function to traverse the file system and find a path (including the wildcard "any" path)
EndPointFinder.recursiveCheckPath = function(checkPath, checkPathComponents, componentIndex, callback) {
    var nextPath = checkPath + "/" + checkPathComponents[componentIndex];
    var anyPath = checkPath + "/any";
    fs.exists(nextPath, function(exists) {
        if (exists) {
            if (componentIndex + 1 < checkPathComponents.length) {
                EndPointFinder.recursiveCheckPath(nextPath, checkPathComponents, componentIndex + 1, callback);
            } else {
                fs.stat(nextPath, function(error, stat) {
                    if (stat && !stat.isDirectory()) {
                        EndPointFinder.findFileServerPath(nextPath, function(serverPath) {
                            callback(serverPath || nextPath);
                        });
                    } else {
                        callback(nextPath);
                    }
                });
            }
        } else {
            fs.exists(anyPath, function(exists) {
                if (exists) {
                    if (componentIndex + 1 < checkPathComponents.length) {
                        EndPointFinder.recursiveCheckPath(anyPath, checkPathComponents, componentIndex + 1, callback);
                    } else {
                        callback(anyPath);
                    }
                } else {
                    callback(null);
                }
            });
        }
    });
}

// Find the location (file path) of the given endpoint
EndPointFinder.findLocation = function(serverDir, endPointRoot, requestPath, callback) {
    // Return early if request path is empty
    var currentPath = serverDir + "/" + endPointRoot;
    if (requestPath.length == 0 || requestPath == "/") {
        callback(currentPath);
        return;
    }
    
    // Determine path to traverse
    if (requestPath[0] == '/') {
        requestPath = requestPath.substring(1);
    }
    if (requestPath[requestPath.length - 1] == '/') {
        requestPath = requestPath.substring(0, requestPath.length - 1);
    }
    var pathComponents = requestPath.split("/");
    
    // Start going through the file tree recursively until a path is found
    if (pathComponents.length > 0) {
        EndPointFinder.recursiveCheckPath(currentPath, pathComponents, 0, callback);
    } else {
        callback(currentPath);
    }
}

// Export
exports = module.exports = EndPointFinder;
