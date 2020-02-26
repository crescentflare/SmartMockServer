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
// Others
// --

SmartMockUtil.arrayContains = function(array, element, alt1, alt2, alt3) {
    var checkOrderedArray = [];
    if (element) {
        checkOrderedArray.push(element);
    }
    if (alt1) {
        checkOrderedArray.push(alt1);
    }
    if (alt2) {
        checkOrderedArray.push(alt2);
    }
    if (alt3) {
        checkOrderedArray.push(alt3);
    }
    for (var i = 0; i < checkOrderedArray.length; i++) {
        if (checkOrderedArray[i]) {
            for (var j = 0; j < array.length; j++) {
                if (checkOrderedArray[i] == array[j]) {
                    return checkOrderedArray[i];
                }
            }
        }
    }
    return null;
};


// --
// Export
// --

exports = module.exports = SmartMockUtil;
