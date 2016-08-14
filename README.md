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


### Adding mock responses

For each endpoint, create a folder containing the JSON or other relevant data. The following example will show an example using JSON. Inside the folder, create a **responseBody.json** file with response data. 

Use **responseHeaders.json** to add specific response headers, each key/value in the JSON corresponds with a header value. Add **properties.json** for additional data like an http response code (by default it returns with 200, OK) and documentation. Properties include:

- **method:** restrict requests to the given method, such as GET or POST (if the methods don't match, the response will be an error)
- **delay:** delay the response of a request
- **name:** name a request, recommended in combination with other documentation
- **description:** add an additional description to a request, adds a good improvement to the documentation
- **category:** use this to group similar requests together into categories, useful to keep the mock server maintainable when more and more requests are being added
- **getParameters:** a dictionary of GET parameters, like "key": "value". These will be added to the URL
- **postParameters:** same as getParameters, but then used for requests with a body (the parameters will be part of the request body)
- **postJson:** a JSON structure for requests requiring JSON in the body data
- **alternatives:** provide alternative responses when certain conditions are met (based on parameters), explained further in the chapter below
- **generates:** use this to automatically set up things like an index page or a file server. Supported values: indexPage and fileList

All data can be changed realtime without restarting the server. The server will attempt to parse the JSON file before sending it through the response. If it fails, it returns with a parse error text and a 500 response code.

It's recommended to place a properties file with the 'generates: indexPage' value in the root of the endpoint folder.


### Alternative responses for the same request

By default, only one response can be given for any request. However, it's possible to create different responses when certain GET or POST parameters are sent. Start by defining alternatives in the request properties.json file. It's an array of property dictionary objects.

Each object can have the following properties:

- **name:** the name of the alternative, if not specified the index page will just name it "alternative"
- **hidden:** prevent the index page from listing the alternative
- **responsePath:** specify the prefix of the alternative response file, if this value is "alternativeTest", a JSON file being read can be alternativeTest.json. If not given, it will fall back to alternative[name].json or alternative1.json
- **responseCode:** specify a different HTTP result code
- **getParameters:** a dictionary or GET parameters, like "key": "value". If all given parameters have a match, then the alternative is called. The value also supports wildcards (* and ?). Advanced tip: a value or wildcard requires the parameter to be sent, leave the parameter out of the list if it's optional.
- **postParameters:** same as getParameters, but then used to match the request body 
- **postJson:** a JSON body to send with the alternative request, if JSONs match, the alternative is called. These JSON objects can be nested
- **method:** a different method for the alternative (for example, needed for using DELETE and POST on the same endpoint)
- **delay:** a different delay for the alternative response

As mentioned above, use the post or get parameters properties to define for which kind of parameters the alternative should be called (instead of the default response). For example, it's possible to define an alternative for a login call to respond with a credentials failed message if the username was "error" (based on a certain post parameter).


### Status

The project is new, but it should be useful in its current form. The example shows how to set up different kind of responses, alternative responses and how to make an overview index page.