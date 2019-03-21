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
var ResponseGenerators = require('./response-generators');

// Server configuration
var serverConfig = {};
var cachedExternalIps = null;
var cachedLocalIps = null;


//////////////////////////////////////////////////
// Initialization
//////////////////////////////////////////////////

// Server constructor
function SmartMockServer(serverDir, ip, port) {
    // Server request/response function
    var connectFunction = function(req, res) {
        var rawBody = new Buffer.alloc(0);
        req.on('data', function(data) {
            rawBody = Buffer.concat([rawBody, data]);
            if (rawBody.length > 1e7) { //Too much POST data, kill the connection
                req.connection.destroy();
            }
        });
        req.on('end', function() {
            // Override encryption check if forwarded
            var schema = req.headers["x-forwarded-proto"];
            if (schema === "https") {
                req.connection.encrypted = true;
            }

            // Add security headers
            res.setHeader('Referrer-Policy', 'no-referrer')
            res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'")
            res.setHeader('X-Frame-Options', 'deny')

            // Check server protection
            if (serverConfig.requiresSecret) {
                // Search for a cookie
                var foundHeader = false;
                var correctHeader = false;
                var cookies = req.headers["cookie"];
                if (cookies) {
                    var parsedCookies = {};
                    var cookieStrings = cookies.split(";");
                    for (var i = 0; i < cookieStrings.length; i++) {
                        var cookiePair = cookieStrings[i].split("=");
                        if (cookiePair.length > 1) {
                            parsedCookies[cookiePair[0].trim()] = cookiePair[1].trim();
                        }
                    }
                    if (parsedCookies["x-mock-secret"]) {
                        var rebuiltCookies = "";
                        foundHeader = true;
                        correctHeader = parsedCookies["x-mock-secret"] == serverConfig.requiresSecret;
                        for (var key in parsedCookies) {
                            if (key != "x-mock-secret") {
                                if (rebuiltCookies.length > 0) {
                                    rebuiltCookies += "; ";
                                }
                                rebuiltCookies += key + "=" + parsedCookies[key];
                            }
                        }
                        req.headers["cookie"] = rebuiltCookies;
                    }
                }

                // Search for secret header
                if (req.headers["x-mock-secret"]) {
                    foundHeader = true;
                    correctHeader = req.headers["x-mock-secret"] == serverConfig.requiresSecret;
                }

                // Invalid access, first check for a form submission
                if (!foundHeader || !correctHeader) {
                    if (req.method == "POST" && req.url == "/") {
                        var body = rawBody.toString();
                        var parameterStrings = body.split("&");
                        for (var i = 0; i < parameterStrings.length; i++) {
                            var parameterPair = parameterStrings[i].split("=");
                            if (parameterPair.length > 1 && parameterPair[0] == "secret") {
                                var key = decodeURIComponent(parameterPair[0]);
                                if (key == "secret") {
                                    var secretToken = decodeURIComponent(parameterPair[1]);
                                    foundHeader = true;
                                    correctHeader = secretToken == serverConfig.requiresSecret;
                                    if (correctHeader) {
                                        res.setHeader("Set-Cookie", "x-mock-secret=" + secretToken + "; HttpOnly" + (req.connection.encrypted ? "; Secure" : ""));
                                    }
                                }
                            }
                        }
                        req.method = "GET";
                    }
                }

                // Still invalid access, show form again with optional error message
                if (!foundHeader || !correctHeader) {
                    var tokenError = foundHeader;
                    if (tokenError) {
                        setTimeout(function() {
                            ResponseGenerators.secretTokenEntry(req, res, tokenError);
                        }, 2000);
                    } else {
                        ResponseGenerators.secretTokenEntry(req, res, tokenError);
                    }
                    return;
                }
            }

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

            // Continue with request
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
        https.createServer(sslCertificate, connectFunction).listen(port, ip);
    } else {
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
            if (!serverConfig.manualIp) {
                SmartMockServer.getNetworkIPs(
                    function (error, externalIps, localIps) {
                        var startIp = null;
                        var runningIps = [];
                        if (serverConfig.externalIp) {
                            if (externalIps.length > 0) {
                                startIp = externalIps[0];
                            } else if (localIps.length > 0) {
                                startIp = localIps[0];
                                console.log('No external ip, falling back to internal ip');
                            } else {
                                startIp = "127.0.0.1";
                                console.log('No network, falling back to localhost');
                            }
                            runningIps.push(startIp);
                        } else {
                            runningIps = runningIps.concat(localIps);
                            runningIps = runningIps.concat(externalIps);
                        }
                        if (startIp != null && startIp.length > 0) {
                            var showStartIp = startIp;
                            if (showStartIp == "127.0.0.1") {
                                showStartIp += ":" + serverConfig.port + " (or localhost:" + serverConfig.port + ")";
                            } else {
                                showStartIp += ":" + serverConfig.port;
                            }
                            console.log('Server running at:', showStartIp);
                            console.log('Connect to server in your browser and add the configured endpoints to view their responses');
                            new SmartMockServer(serverDir, startIp, serverConfig.port);
                        } else if (runningIps.length > 0) {
                            var showStartIp = runningIps[0];
                            if (showStartIp == "127.0.0.1") {
                                showStartIp += ":" + serverConfig.port + " (or localhost:" + serverConfig.port + ")";
                            } else {
                                showStartIp += ":" + serverConfig.port;
                            }
                            console.log('Server running at:', showStartIp);
                            console.log('Connect to server in your browser and add the configured endpoints to view their responses');
                            if (runningIps.length > 1) {
                                console.log('\nServer also reachable at:');
                                for (var i = 1; i < runningIps.length; i++) {
                                    console.log(runningIps[i] + ":" + serverConfig.port);
                                }
                            }
                            new SmartMockServer(serverDir, null, serverConfig.port);
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
                var showStartIp = startIp;
                if (showStartIp == "127.0.0.1") {
                    showStartIp += ":" + serverConfig.port + " (or localhost:" + serverConfig.port + ")";
                } else {
                    showStartIp += ":" + serverConfig.port;
                }
                console.log('Server running at:', showStartIp);
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
    if (cachedExternalIps && cachedLocalIps && !bypassCache) {
        callback(null, cachedExternalIps, cachedLocalIps);
        return;
    }

    // Determine command to run
    var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;
    var exec = require('child_process').exec;
    var command, filterRE;
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
            var externalIps = [];
            var internalIps = [];
            var ip;
            var matches = stdout.match(filterRE) || [];
            if (!error) {
                for (var i = 0; i < matches.length; i++) {
                    ip = matches[i].replace(filterRE, '$1');
                    if (!ignoreRE.test(ip)) {
                        externalIps.push(ip);
                    } else {
                        internalIps.push(ip);
                    }
                }
            }
            callback(error, externalIps, internalIps);
         }
    );
}

// Export
exports = module.exports = SmartMockServer;
