//
//  SmartMockResponseFinder.swift
//  SmartMockServer Pod
//
//  Main library response generator: find the response at the given path with filtering
//

class SmartMockResponseFinder {
    
    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: Main utility functions
    // --
    
    public static func generateResponse(headers: SmartMockHeaders, requestMethod: String, requestPath: String, filePath: String, requestGetParameters: [String: String], requestBody: String) -> SmartMockResponse {
        // Convert POST data or header overrides in get parameter list
        var method = requestMethod
        var getParameters = requestGetParameters
        var body = requestBody
        if getParameters.keys.contains("methodOverride") {
            method = getParameters["methodOverride"]!
            getParameters.removeValueForKey("methodOverride")
        }
        if getParameters.keys.contains("postBodyOverride") {
            body = getParameters["postBodyOverride"]!
            getParameters.removeValueForKey("postBodyOverride")
        }
        if getParameters.keys.contains("headerOverride") {
            if let addHeaders = SmartMockStringUtility.convertStringToDictionary(getParameters["headerOverride"]!) {
                for (key, value) in addHeaders {
                    headers.addHeader(key, value: value as? String ?? "")
                }
            }
            getParameters.removeValueForKey("headerOverride")
        }
        if getParameters.keys.contains("getAsPostParameters") {
            var paramBody = ""
            for (parameter, value) in getParameters {
                if parameter != "getAsPostParameters" {
                    let paramSet = SmartMockStringUtility.urlEncode(parameter) + "=" + SmartMockStringUtility.urlEncode(value)
                    if !paramBody.isEmpty {
                        paramBody += "&"
                    }
                    paramBody += paramSet
                }
            }
            body = paramBody
            getParameters = [:]
        }
        method = method.uppercaseString
        
        // Obtain properties and continue
        let properties = SmartMockPropertiesUtility.readFile(requestPath, filePath: filePath)
        let useProperties = matchAlternativeProperties(properties, method: method, getParameters: getParameters, body: body, headers: headers)
        if useProperties.method != nil && method != useProperties.method!.uppercaseString {
            let response = SmartMockResponse()
            response.code = 409
            response.mimeType = "text/plain"
            response.setStringBody("Requested method of " + method + " doesn't match required " + useProperties.method!.uppercaseString)
            return response
        }
        if useProperties.delay > 0 && !NSThread.isMainThread() {
            sleep(UInt32(useProperties.delay))
        }
        return collectResponse(requestPath, filePath: filePath, properties: useProperties)
    }
    
    private static func collectResponse(requestPath: String, filePath: String, properties: SmartMockProperties) -> SmartMockResponse {
        // First collect headers to return
        let returnHeaders = SmartMockHeaders.create(nil)
        let files = SmartMockFileUtility.list(filePath) ?? []
        if let foundFile = fileArraySearch(files, element: properties.responsePath! + "Headers.json", alt1: "responseHeaders.json", alt2: nil, alt3: nil) {
            if let inputStream = SmartMockFileUtility.open(filePath + "/" + foundFile) {
                let fileContent = SmartMockFileUtility.readFromInputStream(inputStream)
                if let headersJson = SmartMockStringUtility.convertStringToDictionary(fileContent) {
                    for (key, value) in headersJson {
                        returnHeaders.addHeader(key, value: value as? String ?? "")
                    }
                }
            }
        }
        
        // Check for response generators, they are not supported (except for a file within the file list)
        if properties.generates != nil && (properties.generates == "indexPage" || properties.generates == "fileList") {
            if properties.generates == "fileList" {
                if let fileResponse = responseFromFileGenerator(requestPath, filePath: filePath) {
                    return fileResponse
                }
            }
            let response = SmartMockResponse()
            response.code = 500
            response.mimeType = "text/plain"
            response.setStringBody("Response generators not supported in app libraries")
            return response
        }
        
        // Check for executable javascript, this is not supported
        if let foundJavascriptFile = fileArraySearch(files, element: properties.responsePath! + "Body.js", alt1: properties.responsePath! + ".js", alt2: "responseBody.js", alt3: "response.js") {
            let response = SmartMockResponse()
            response.code = 500
            response.mimeType = "text/plain"
            response.setStringBody("Executable javascript not supported in app libraries")
            return response
        }
        
        // Check for JSON
        if let foundJsonFile = fileArraySearch(files, element: properties.responsePath! + "Body.json", alt1: properties.responsePath! + ".json", alt2: "responseBody.json", alt3: "response.json") {
            return responseFromFile("application/json", filePath: filePath + "/" + foundJsonFile, responseCode: properties.responseCode, headers: returnHeaders)
        }
        
        // Check for HTML
        if let foundHtmlFile = fileArraySearch(files, element: properties.responsePath! + "Body.html", alt1: properties.responsePath! + ".html", alt2: "responseBody.html", alt3: "response.html") {
            return responseFromFile("text/html", filePath: filePath + "/" + foundHtmlFile, responseCode: properties.responseCode, headers: returnHeaders)
        }
        
        // Check for plain text
        if let foundTextFile = fileArraySearch(files, element: properties.responsePath! + "Body.txt", alt1: properties.responsePath! + ".txt", alt2: "responseBody.txt", alt3: "response.txt") {
            return responseFromFile("text/plain", filePath: filePath + "/" + foundTextFile, responseCode: properties.responseCode, headers: returnHeaders)
        }
        
        // Nothing found, return a not supported message
        let response = SmartMockResponse()
        response.code = 500
        response.mimeType = "text/plain"
        response.setStringBody("Couldn't find response. Only the following formats are supported: JSON, HTML and text")
        return response
    }
    
    
    // --
    // MARK: Property matching
    // --
    
    private static func matchAlternativeProperties(properties: SmartMockProperties, method: String, getParameters: [String:String], body: String, headers: SmartMockHeaders) -> SmartMockProperties {
        if let alternatives = properties.alternatives {
            for i in 0..<alternatives.count {
                // First pass: match method
                let alternative = alternatives[i]
                if alternative.method == nil {
                    alternative.method = properties.method
                }
                if alternative.method != nil && alternative.method?.uppercaseString != method {
                    continue
                }
                
                // Second pass: GET parameters
                if alternative.getParameters != nil {
                    var foundAlternative = true
                    for (key, value) in alternative.getParameters! {
                        if !SmartMockParamMatcher.paramEquals(value, haveParam: getParameters[key]) {
                            foundAlternative = false
                            break
                        }
                    }
                    if !foundAlternative {
                        continue
                    }
                }
                
                // Third pass: POST parameters
                if alternative.postParameters != nil {
                    var postParameters: [String: String] = [:]
                    let bodySplit = body.characters.split{ $0 == "&" }.map(String.init)
                    for j in 0..<bodySplit.count {
                        let bodyParamSplit = bodySplit[j].characters.split{ $0 == "=" }.map(String.init)
                        if bodyParamSplit.count == 2 {
                            postParameters[SmartMockStringUtility.urlDecode(bodyParamSplit[0].stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceCharacterSet()))] = SmartMockStringUtility.urlDecode(bodyParamSplit[1].stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceCharacterSet()))
                        }
                    }
                    var foundAlternative = true
                    for (key, value) in alternative.postParameters! {
                        if !SmartMockParamMatcher.paramEquals(value, haveParam: postParameters[key]) {
                            foundAlternative = false
                            break
                        }
                    }
                    if !foundAlternative {
                        continue
                    }
                }
                
                // Fourth pass: POST JSON
                if alternative.postJson != nil {
                    var bodyJson: [String: AnyObject]? = SmartMockStringUtility.convertStringToDictionary(body)
                    if bodyJson == nil || !SmartMockParamMatcher.deepEquals(alternative.postJson!, haveDictionary: bodyJson!) {
                        continue
                    }
                }
                
                // Fifth pass: headers
                if alternative.checkHeaders != nil {
                    var foundAlternative = true
                    for (key, value) in alternative.checkHeaders! {
                        if !SmartMockParamMatcher.paramEquals(value, haveParam: headers.getHeaderValue(key)) {
                            foundAlternative = false
                            break
                        }
                    }
                    if !foundAlternative {
                        continue
                    }
                }
                
                // All passes OK, use alternative
                if alternative.responseCode < 0 {
                    alternative.responseCode = properties.responseCode
                }
                if alternative.delay < 0 {
                    alternative.delay = properties.delay
                }
                if alternative.responsePath == nil {
                    alternative.responsePath = "alternative" + (alternative.name ?? String(i))
                }
                return alternative
            }
        }
        return properties
    }


    // --
    // MARK: Helpers
    // --
    
    private static func responseFromFile(contentType: String, filePath: String, responseCode: Int, headers: SmartMockHeaders) -> SmartMockResponse {
        let fileLength = SmartMockFileUtility.getLength(filePath)
        if fileLength < 0 {
            let response = SmartMockResponse()
            response.code = 404
            response.mimeType = "text/plain"
            response.setStringBody("Couldn't read file: " + filePath)
            return response
        }
        if contentType == "application/json" {
            var validatedJson = false
            var result: String?
            if let responseStream = SmartMockFileUtility.open(filePath) {
                result = SmartMockFileUtility.readFromInputStream(responseStream)
                if result != nil {
                    if SmartMockStringUtility.convertStringToDictionary(result!) != nil || SmartMockStringUtility.convertStringToArray(result!) != nil {
                        validatedJson = true
                    }
                }
            }
            if !validatedJson {
                let response = SmartMockResponse()
                response.code = 500
                response.mimeType = "text/plain"
                response.setStringBody("Couldn't parse JSON of file: " + filePath)
                return response
            }
            let response = SmartMockResponse()
            response.code = responseCode
            response.mimeType = contentType
            response.headers.overwriteHeaders(headers)
            response.body = SmartMockResponseBody.createFromString(result ?? "")
            return response
        }
        let response = SmartMockResponse()
        response.code = responseCode
        response.mimeType = contentType
        response.headers.overwriteHeaders(headers)
        response.body = SmartMockResponseBody.createFromFile(SmartMockFileUtility.getRawPath(filePath), fileLength: fileLength)
        return response
    }
    
    private static func responseFromFileGenerator(requestPath: String, filePath: String) -> SmartMockResponse? {
        var requestEndPart = ""
        var fileEndPart = ""
        if let lastRequestSlashIndex = requestPath.rangeOfString("/", options: .BackwardsSearch)?.startIndex {
            requestEndPart = requestPath.substringFromIndex(lastRequestSlashIndex.advancedBy(1))
        }
        if let lastPathSlashIndex = filePath.rangeOfString("/", options: .BackwardsSearch)?.startIndex {
            fileEndPart = filePath.substringFromIndex(lastPathSlashIndex.advancedBy(1))
        }
        if !requestEndPart.isEmpty && requestEndPart != fileEndPart {
            let serveFile = filePath + "/" + requestEndPart
            let response = SmartMockResponse()
            response.code = 200
            response.mimeType = getMimeType(serveFile)
            response.body = SmartMockResponseBody.createFromFile(SmartMockFileUtility.getRawPath(serveFile), fileLength: SmartMockFileUtility.getLength(serveFile))
            return response
        }
        return nil
    }
    
    private static func getMimeType(filename: String) -> String {
        var fileExt = ""
        if let dotPos = filename.rangeOfString(".", options: .BackwardsSearch)?.startIndex {
            fileExt = filename.substringFromIndex(dotPos.advancedBy(1))
        }
        if fileExt == "png" {
            return "image/png"
        } else if fileExt == "gif" {
            return "image/gif"
        } else if fileExt == "jpg" || fileExt == "jpeg" {
            return "image/jpg"
        } else if fileExt == "htm" || fileExt == "html" {
            return "text/html"
        } else if fileExt == "zip" {
            return "application/zip"
        }
        return "text/plain"
    }
    
    private static func fileArraySearch(stringArray: [String], element: String, alt1: String?, alt2: String?, alt3: String?) -> String? {
        for check in stringArray {
            if check == element || check == alt1 || check == alt2 || check == alt3 {
                return check
            }
        }
        return nil
    }

}