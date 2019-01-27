//
// CommandClient
// A connected client in the command console
//

'use strict';

// Requires
var CommandItem = require('./command-item');
var UpdateStamp = require('./update-stamp')


// --
// Initialization
// --

// Constructor
function CommandClient(name, token, updateCallback) {
    this.token = token;
    this.name = name;
    this.commands = [];
    this.lastCheck = new Date().getTime();
    this.lastUpdate = UpdateStamp.generateValue();
    this.updateCallback = updateCallback;
    this.waitCallbacks = [];
    this.updateCheck()
}


// --
// Access values
// --

// Set the token
CommandClient.prototype.setToken = function(token) {
    this.token = token;
    this.setUpdated();
}

// Get the name
CommandClient.prototype.getToken = function() {
    return this.token;
}

// Set the name
CommandClient.prototype.setName = function(name) {
    this.name = name;
    this.setUpdated();
}

// Get the name
CommandClient.prototype.getName = function() {
    return this.name;
}

// Get last update timestamp
CommandClient.prototype.getLastUpdate = function() {
    return this.lastUpdate;
}


// --
// Handle commands
// --

// Add a new message
CommandClient.prototype.addCommand = function(command) {
    var command = new CommandItem(command);
    this.commands.push(command);
    this.setUpdated();
    return command;
}

// Return the command list
CommandClient.prototype.getCommands = function() {
    return this.commands;
}

// Determine if commands were already received
CommandClient.prototype.setAllCommandsReceived = function() {
    for (var i = 0; i < this.commands.length; i++) {
        this.commands[i].setReceived();
    }
    this.updateCallback();
}

// Determine if commands were already received
CommandClient.prototype.areAllCommandsReceived = function() {
    for (var i = this.commands.length - 1; i >= 0; i--) {
        if (!this.commands[i].isReceived()) {
            return false;
        }
    }
    return true;
}


// --
// Adjust status
// --

CommandClient.prototype.updateCheck = function(error) {
    this.lastCheck = new Date().getTime();
    var that = this;
    setTimeout(function() {
        if (!that.isActive()) {
            that.setUpdated()
        }
    }, 30 * 1000);
}

CommandClient.prototype.isActive = function() {
    var currentTimeStamp = new Date().getTime();
    if (this.lastCheck < currentTimeStamp - 30 * 1000) {
        return false;
    }
    return true;
}


// --
// Serialization
// --

// To JSON
CommandClient.prototype.toJson = function() {
    var commandsJson = [];
    for (var i = 0; i < this.commands.length; i++) {
        commandsJson.push(this.commands[i].toJson());
    }
    return { "token": this.token, "name": this.name, "commands": commandsJson, "active": this.isActive(), "lastUpdate": this.lastUpdate };
}


// --
// Update handling
// --

// Inform callback of the update
CommandClient.prototype.setUpdated = function() {
    var executeCallbacks = this.waitCallbacks;
    this.waitCallbacks = [];
    this.lastUpdate = UpdateStamp.generateValue();
    this.updateCallback();
    for (var i = 0; i < executeCallbacks.length; i++) {
        executeCallbacks[i](true);
    }
}

// Wait for an update
CommandClient.prototype.waitUpdate = function(callback, timeout) {
    var that = this;
    this.waitCallbacks.push(callback);
    setTimeout(function() {
        for (var i = 0; i < that.waitCallbacks.length; i++) {
            if (that.waitCallbacks[i] === callback) {
                that.waitCallbacks.splice(i, 1);
                callback(false);
                break;
            }
        }
    }, timeout);
}


// --
// Export
// --

exports = module.exports = CommandClient;
