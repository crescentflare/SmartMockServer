//
// SmartMockUtil
// Small utility functions used through the mock server
//

'use strict';


// --
// Initialization
// --

// Constructor
function SmartMockUtil() {
}


// --
// URL encoding/decoding
// --

// Encode
SmartMockUtil.safeUrlEncode = function(decodedItem) {
    if (decodedItem == null) {
        return "";
    }
    var encodedItem = decodedItem;
    try {
        encodedItem = encodeURIComponent(decodedItem)
    } catch (exception) {
        return "";
    }
    return encodedItem;
}

// Decode
SmartMockUtil.safeUrlDecode = function(encodedItem) {
    if (encodedItem == null) {
        return "";
    }
    var decodedItem = encodedItem;
    try {
        decodedItem = decodeURIComponent(encodedItem)
    } catch (exception) {
        return "";
    }
    return decodedItem;
}


// --
// Path checker
// --

SmartMockUtil.isValidPath = function(path) {
    if (path == null) {
        return false;
    }
    var pathLevel = 0;
    var pathComponents = path.split("/");
    for (var i = 0; i < pathComponents.length; i++) {
        if (pathComponents[i] == "..") {
            pathLevel--;
        } else if (pathComponents[i] != "." && pathComponents[i].length > 0) {
            pathLevel++;
        }
        if (pathLevel < 0) {
            return false;
        }
    }
    return pathLevel >= 0;
}


// --
// Export
// --

exports = module.exports = SmartMockUtil;
