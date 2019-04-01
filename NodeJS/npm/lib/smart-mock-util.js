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
// Export
// --

exports = module.exports = SmartMockUtil;
