//
// CommandClientList
// A list of clients with commands
//

'use strict';

// Requires
var CommandClient = require('./command-client');


// --
// Initialization
// --

// Constructor
function CommandClientList() {
    this.curTokenIndex = 0;
    this.clients = [];
    this.lastUpdate = new Date().getTime();
    this.waitCallbacks = [];
}


// --
// Access items
// --

// Create and add a new client
CommandClientList.prototype.newClient = function(name) {
    var that = this;
    this.curTokenIndex++;
    var client = new CommandClient(name, this.curTokenIndex + "", function() {
        that.setUpdated();
    });
    this.clients.push(client);
    this.setUpdated();
    return client;
}

// Get client list
CommandClientList.prototype.getClients = function() {
    return this.clients;
}

// Find a chat
CommandClientList.prototype.findClient = function(token) {
    for (var i = 0; i < this.clients.length; i++) {
        if (this.clients[i].getToken() == token) {
            return this.clients[i];
        }
    }
    return null;
}

// Get last update timestamp
CommandClientList.prototype.getLastUpdate = function() {
    return this.lastUpdate;
}


// --
// Serialization
// --

// To JSON
CommandClientList.prototype.toJson = function() {
    var clientsJson = [];
    for (var i = 0; i < this.clients.length; i++) {
        clientsJson.push(this.clients[i].toJson());
    }
    return { "lastUpdate": this.lastUpdate, "clients": clientsJson };
}


// --
// Update handling
// --

// Set last updated time stamp and inform waiting callbacks
CommandClientList.prototype.setUpdated = function() {
    this.lastUpdate = new Date().getTime();
    for (var i = 0; i < this.waitCallbacks.length; i++) {
        this.waitCallbacks[i](true);
    }
    this.waitCallbacks = [];
}

// Wait for an update
CommandClientList.prototype.waitUpdate = function(callback, timeout) {
    var that = this;
    this.waitCallbacks.push(callback);
    setTimeout(function() {
        for (var i = 0; i < that.waitCallbacks.length; i++) {
            if (that.waitCallbacks[i] === callback) {
                callback(false);
                that.waitCallbacks = that.waitCallbacks.splice(i, 1);
                break;
            }
        }
    }, timeout);
}


// --
// Export
// --

exports = module.exports = CommandClientList;
