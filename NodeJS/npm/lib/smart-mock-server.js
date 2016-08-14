// Main server code
//////////////////////////////////////////////////

'use strict';

// NodeJS requires
var http = require('http');
var https = require('https');
var fs = require('fs');

// Other requires
var EndPointFinder = require('./end-point-finder');
var ResponseFinder = require('./response-finder');

// Server configuration
var serverConfig = {};
var cachedIps = null;


//////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////

// Server constructor
function SmartMockServer(serverDir, ip, port) {
    // Server request/response function
    var connectFunction = function(req, res) {
        // Fetch parameters from URL
        var paramMark = req.url.indexOf("?");
        var requestPath = req.url;
        var parameters = {};
        if (paramMark >= 0) {
            var parameterStrings = requestPath.substring(paramMark + 1).split("&");
            for (var i = 0; i < parameterStrings.length; i++) {
                var parameterPair = parameterStrings[i].split("=");
                if (parameterPair.length > 1) {
                    parameters[decodeURIComponent(parameterPair[0].trim())] = decodeURIComponent(parameterPair[1].trim());
                }
            }
            requestPath = requestPath.substring(0, paramMark);
        }
        
        // Read body and continue with request
        var rawBody = new Buffer(0);
        req.on('data', function(data) {
            rawBody = Buffer.concat([rawBody, data]);
            if (rawBody.length > 1e7) { //Too much POST data, kill the connection
                req.connection.destroy();
            }
        });
        req.on('end', function() {
            EndPointFinder.findLocation(serverDir, serverConfig.endPoints || "", requestPath, function(path) {
                if (path) {
                    ResponseFinder.generateResponse(req, res, requestPath, path, parameters, rawBody);
                } else {
                    res.writeHead(404, { "ContentType": "text/plain; charset=utf-8" });
                    res.end("Couldn't find: " + requestPath);
                }
            });
        });
    };
    
    // Create server
    if (serverConfig.secureConnection) {
        var sslCertificate = {
            key: fs.readFileSync(serverDir + "/ssl.key"),
            cert: fs.readFileSync(serverDir + "/ssl.cert")
        };
        this.listeningAtAddress = "https://" + ip + ":" + port;
        https.createServer(sslCertificate, connectFunction).listen(port, ip);
    } else {
        this.listeningAtAddress = "http://" + ip + ":" + port;
        http.createServer(connectFunction).listen(port, ip);
    }
}

// Creation method
SmartMockServer.start = function(serverDir) {
    serverDir = serverDir || process.cwd()
    fs.readFile(
        serverDir + '/' + 'config.json',
        function(error, data) {
            // Parse config from file data
            if (!error && data) {
                try {
                    serverConfig = JSON.parse(data);
                } catch (ignored) { }
            }
                
            // Add/adjust config based on commandline parameters
            for (var i = 2; i < process.argv.length; i++) {
                var arg = process.argv[i];
                var argSplit = arg.split("=");
                if (argSplit.length > 1) {
                    if (argSplit[1] == "true") {
                        serverConfig[argSplit[0]] = true;
                    } else if (argSplit[1] == "false") {
                        serverConfig[argSplit[0]] = false;
                    } else {
                        serverConfig[argSplit[0]] = argSplit[1];
                    }
                }
            }
                
            // Provide defaults if not given
            serverConfig.port = serverConfig.port || "2143";
                
            // Start
            if (serverConfig.externalIp && !serverConfig.manualIp) {
                SmartMockServer.getNetworkIPs(
                    function (error, ip) {
                        if (ip.length == 0) {
                            ip.push("127.0.0.1");
                            console.log('No network, falling back to localhost');
                        }
                        if (ip.length > 0) {
                            var foundIp = "";
                            for (var i = 0; i < ip.length; i++) {
                                if (ip.indexOf("127.") != 0) {
                                    foundIp = ip[i];
                                }
                            }
                            if (foundIp.length == 0) {
                                foundIp = ip[0];
                            }
                            console.log('Server running at:', foundIp + ":" + serverConfig.port);
                            console.log('Connect to server in your browser and add the configured endpoints to view their responses');
                            new SmartMockServer(serverDir, foundIp, serverConfig.port);
                        }
                        if (error) {
                            console.log('IP address fetch error: ', error);
                        }
                    },
                    false,
                    false
                );
            } else {
                var startIp = serverConfig.manualIp || "127.0.0.1";
                console.log('Server running at:', startIp + ":" + serverConfig.port);
                console.log('Connect to server in your browser and add the configured endpoints to view their responses');
                new SmartMockServer(serverDir, startIp, serverConfig.port);
            }
        }
    );
}


//////////////////////////////////////////////////
// Utility
//////////////////////////////////////////////////

// Utility to get network IP addresses (ignoring local host), to show user the IP it should connect to
SmartMockServer.getNetworkIPs = function(callback, bypassCache, ipv6) {
    // Return early if already cached
    if (cachedIps && !bypassCache) {
        callback(null, cached);
        return;
    }

    // Determine command to run
    var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;
    var exec = require('child_process').exec;
    var cached, command, filterRE;
    switch (process.platform) {
        case 'win32':
        case 'win64':
            command = 'ipconfig';
            filterRE = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
            break;
        case 'darwin':
            command = 'ifconfig';
            filterRE = /\binet\s+([^\s]+)/g;
            if (ipv6) {
                filterRE = /\binet6\s+([^\s]+)/g; // IPv6
            }
            break;
        default:
            command = 'ifconfig';
            filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
            if (ipv6) {
                filterRE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
            }
            break;
    }
    
    // Run command to fetch IP addresses
    exec(
        command,
        function(error, stdout, sterr) {
            cached = [];
            var ip;
            var matches = stdout.match(filterRE) || [];
            if (!error) {
                for (var i = 0; i < matches.length; i++) {
                    ip = matches[i].replace(filterRE, '$1');
                    if (!ignoreRE.test(ip)) {
                        cached.push(ip);
                    }
                }
            }
            callback(error, cached);
         }
    );
}

// Export
exports = module.exports = SmartMockServer;
