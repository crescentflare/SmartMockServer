# SmartMockServer

Easily set up a mock server using NodeJS which is able to serve JSON (and several other) responses. Also contains a set of additional features to make the mock server more flexible, like multiple responses on a single endpoint by filtering parameters.


### Features

* Easy to set up, install NodeJS and start the module with only a few lines of code
* Configure the mock server through a JSON file or commandline parameters, like running in SSL mode
* Fully data-driven, endpoints can be created easily by creating folders and placing response JSON (or other formats like HTML) files
* Create alternative responses on a single endpoint using get parameter or post body filters (with wildcard support)
* Easily set up an index page it will automatically list all endpoints inside (including documentation and alternative responses)
* Be able to set up an endpoint as a folder to serve any kind of file (like images)


### Integration

After installing the npm module, create a new file (for example server.js) to contain the startup code. This can be as small as the following:

    var SmartMockServer = require('smart-mock-server');
    var mockServer = SmartMockServer.start(__dirname);
    
The \_\_dirname parameter is the directory in which the javascript file is located and needs to be passed to the mock server module. The mock server module will use this as the root path to read files like the config file or the SSL certificates.


### Configuration

The server can be configured, like starting with a custom port and IP address. The following things can be configured:

- **port:** Run on a specific port, some ports (like port 80) are rejected by NodeJS (defaults to: 2143)
- **externalIp:** Search for another IP address, instead of 127.0.0.1 (defaults to: false)
- **secureConnection:** Start an https server, needs certificates ssl.key and ssl.cert in the root path (defaults to: false)
- **manualIp:** A string to manually configure a specific IP address (defaults to: empty)
- **endPoints:** A relative path to the root path to locate the response endpoints (defaults to: empty)

These can be specified by creating a **config.json** file within the root path. Additionally these can be overridden by using commandline parameters, like:
	
	node server.js port=1237 secureConnection=true



### Status

The project is new, but it should be useful in its current form. The example shows how to set up different kind of responses, alternative responses and how to make an overview index page.