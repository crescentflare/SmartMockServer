//
// CommandItem
// A single command in the command console
//

'use strict';


// --
// Initialization
// --

// Constructor
function CommandItem(command) {
    this.command = command;
    this.received = false;
}


// --
// Access values
// --

// Set the text
CommandItem.prototype.setCommand = function(command) {
    this.command = command;
}

// Get the text
CommandItem.prototype.getCommand = function() {
    return this.command;
}

// Set received status
CommandItem.prototype.setReceived = function(received) {
    this.received = received || true;
}

// Return received status
CommandItem.prototype.isReceived = function() {
    return this.received;
}


// --
// Serialization
// --

// To JSON
CommandItem.prototype.toJson = function() {
    return { "command": this.command, "received": this.received };
}


// --
// Export
// --

exports = module.exports = CommandItem;
