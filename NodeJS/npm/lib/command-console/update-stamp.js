//
// UpdateStamp
// Generates a virtual 'timestamp' value which doesn't rely on time (to ensure proper concurrency)
//

'use strict';

// Current value
var virtualTimestamp = 0;


// --
// Initialization
// --

// Constructor
function UpdateStamp() {
}


// --
// Static method
// --

// Generate a new value
UpdateStamp.generateValue = function() {
    virtualTimestamp++;
    return virtualTimestamp;
}


// --
// Export
// --

exports = module.exports = UpdateStamp;
