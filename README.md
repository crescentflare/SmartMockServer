# SmartMockServer

[![CI Status](http://img.shields.io/travis/crescentflare/SmartMockServer.svg?style=flat)](https://travis-ci.org/crescentflare/SmartMockServer)
[![License](https://img.shields.io/cocoapods/l/SmartMockLib.svg?style=flat)](http://cocoapods.org/pods/SmartMockLib)
[![Version](https://img.shields.io/npm/v/smart-mock-server.svg?style=flat)](https://www.npmjs.com/package/smart-mock-server)
[![Version](https://img.shields.io/cocoapods/v/SmartMockLib.svg?style=flat)](http://cocoapods.org/pods/SmartMockLib)
[![Version](https://img.shields.io/maven-central/v/com.crescentflare.smartmock/SmartMockLib.svg?style=flat)](https://repo1.maven.org/maven2/com/crescentflare/smartmock/SmartMockLib)


Easily set up a mock server, either by running NodeJS, or by using an internal mock library within iOS or Android. Serve JSON (and several other) responses including features to make the mock server more flexible. For example, having multiple responses on the same endpoint depending on the post body.


### Features

* Be able to easily set up an actual server by installing NodeJS. Then start the module with only a few lines of code
* Also be able to serve the mock responses without running an actual server by including an internal app library for iOS and Android
* Configure the mock server through a JSON file or commandline parameters, like running in SSL mode
* Fully data-driven, endpoints can be created easily by creating folders and placing response JSON (or other formats like HTML) files, most of it can be done without even restarting the server
* Create alternative responses on a single endpoint using get parameter or post body filters (with wildcard support), header filters are also supported
* Easily set up an index page. It will automatically list all endpoints inside (including documentation and alternative responses)
* Be able to set up an endpoint as a folder to serve any kind of file (like images), includes an index page in html or json to list the files being served (with optional long polling to wait for a change on a single file using SHA256)
* Use an endpoint as a command console, clients can connect to it and poll for commands (with a long polling mechanism). Includes a UI to select a client and send commands to them


### NodeJS integration guide

The package can be installed through npm with the following command:

```
npm install smart-mock-server
```

After installing the npm module, create a new file (for example server.js) to contain the startup code. This can be as small as the following:

    var SmartMockServer = require('smart-mock-server');
    var mockServer = SmartMockServer.start(__dirname);
    
The \_\_dirname parameter is the directory in which the javascript file is located and needs to be passed to the mock server module. The mock server module will use this as the root path to read files like the config file or the SSL certificates.


### Android integration guide

When using gradle, the library can easily be imported into the build.gradle file of your project. Add the following dependency:

```
implementation 'com.crescentflare.smartmock:SmartMockLib:1.2.1'
```

The library integrates well with retrofit 2+, but can also be used standalone. An example is included on how to use it.

The above library has a minimum deployment target of Android API level 14. Below is an old version which supports Android API level 9 and may rely on an old gradle plugin.

```
compile 'com.crescentflare.smartmock:SmartMockLib:1.0.0'
```


### iOS integration guide

The library is available through [CocoaPods](http://cocoapods.org). To install it, simply add one of the following lines to your Podfile:

```ruby
pod "SmartMockLib", '~> 1.2.1'
```

The above version is for Swift 5.0. For older Swift versions use the following:
- Swift 4.2: SmartMockLib 1.0.1
- Swift 4.1: SmartMockLib 1.0.0
- Swift 4.0: SmartMockLib 0.6.4
- Swift 3: SmartMockLib 0.6.2
- Swift 2.2: SmartMockLib 0.5.0

An example is available which shows how it can be integrated with Alamofire. Though it can also be used with other libraries or separately.


### NodeJS module configuration

The server can be configured, like starting with a custom port and IP address. By default it will run on all external IP addresses and 127.0.0.1. The following things can be configured:

- **port:** Run on a specific port, some ports (like port 80) are rejected by NodeJS (defaults to: 2143)
- **externalIp:** Seach for an external IP address (except 127.0.0.1), the server will run on the first address that it finds (defaults to: false)
- **manualIp:** A string to manually configure a specific IP address (defaults to: empty)
- **secureConnection:** Start an https server, needs certificates ssl.key and ssl.cert in the root path (defaults to: false)
- **endPoints:** A relative path to the root path to locate the response endpoints (defaults to: empty)
- **requiresSecret:** A string to protect the mock server, it requires an X-Mock-Secret header with this string to use it. Otherwise it will give an unauthorized error with an html page to enter the token 

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
- **responseCode:** the HTTP result code, defaults to 200 (OK)
- **alternatives:** provide alternative responses when certain conditions are met (based on parameters), explained further in the chapter below
- **generates:** use this to automatically set up things like an index page or a file server. Supported values: indexPage, fileList and commandConsole
- **redirect:** a path to redirect to. Uses properties, responseBody and other files from the relative path specified by this property
- **replaceToken:** replace all occurrences of this token in the output response. The replacement text can be specified using the X-Mock-Replace-Output header in the request 

Extra settings for file servers (using fileList):

- **generatesJson:** this will generate the file list as a json response when visiting the index page
- **includeSHA256:** generate an sha256 hash of each file being listed in the json response of the file server

All data can be changed realtime without restarting the server. The server will attempt to parse the JSON file before sending it through the response. If it fails, it returns with a parse error text and a 500 response code.

It's recommended to place a properties file with the 'generates: indexPage' value in the root of the endpoint folder.

When using a file server it's possible to use long polling on a single file, the server will wait responding until the file is changed or when the poll expires. Supply the X-Mock-Wait-Change-Hash header to enable this. This header should contain the last known SHA256 hash of the file (which may have been returned by an earlier call in the X-Mock-File-Hash header). The timeout is 10 seconds by default, to customize this use the X-Mock-Wait-Change-Timeout header.

When using the command console, a client should send its name through a GET parameter to start a session. It will return a token which can be sent on new requests to obtain new commands. Use the waitUpdate GET parameter to use long polling (which has a 10 second timeout).


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
- **checkHeaders:** a dictionary of header key/value combinations. Works like matching GET parameters. The keys are case insensitive
- **method:** a different method for the alternative (for example, needed for using DELETE and POST on the same endpoint)
- **delay:** a different delay for the alternative response

As mentioned above, use the post or get parameters properties to define for which kind of parameters the alternative should be called (instead of the default response). For example, it's possible to define an alternative for a login call to respond with a credentials failed message if the username was "error" (based on a certain post parameter).


### Status

The mock server should be ready to use within NodeJS or internally through a library for iOS and Android. Potential new features may be added in the future.
