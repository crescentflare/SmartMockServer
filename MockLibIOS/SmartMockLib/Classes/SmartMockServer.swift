//
//  SmartMockServer.swift
//  SmartMockServer Pod
//
//  Main library: obtain responses from the mock server endpoints
//

public class SmartMockServer: UIViewController {
    
    // --
    // MARK: Singleton instance
    // --
    
    public static let sharedServer = SmartMockServer()

    
    // --
    // MARK: Members
    // --

    private var cookieValues: [String] = []
    private var cookiesEnabled = false

    
    // --
    // MARK: Serve the response
    // --
    
    public func obtainResponse(method: String, rootPath: String, requestPath: String, requestBody: String?, requestHeaders: SmartMockHeaders?, completion: (response: SmartMockResponse) -> Void) {
        if !NSThread.isMainThread() {
            completion(response: obtainResponseSync(method, rootPath: rootPath, requestPath: requestPath, requestBody: requestBody, requestHeaders: requestHeaders))
            return
        }
        let priority = DISPATCH_QUEUE_PRIORITY_DEFAULT
        dispatch_async(dispatch_get_global_queue(priority, 0)) {
            let result = self.obtainResponseSync(method, rootPath: rootPath, requestPath: requestPath, requestBody: requestBody, requestHeaders: requestHeaders)
            dispatch_async(dispatch_get_main_queue()) {
                completion(response: result)
            }
        }
    }
    
    public func obtainResponseSync(method: String, rootPath: String, requestPath: String, requestBody: String?, requestHeaders: SmartMockHeaders?) -> SmartMockResponse {
        // Safety checks
        var body = requestBody ?? ""
        var headers = requestHeaders ?? SmartMockHeaders.create(nil)
        var path = requestPath
        
        // Fetch parameters from path
        var parameters: [String: String] = [:]
        if let paramMark = path.characters.indexOf("?") {
            let parameterStrings = path.substringFromIndex(paramMark.advancedBy(1)).characters.split{ $0 == "&"}.map(String.init)
            for parameterString in parameterStrings {
                let parameterPair = parameterString.characters.split{ $0 == "=" }.map(String.init)
                if parameterPair.count > 1 {
                    parameters[SmartMockStringUtility.urlDecode(parameterPair[0])] = SmartMockStringUtility.urlDecode(parameterPair[1])
                }
            }
            path = path.substringToIndex(paramMark)
        }
        if !path.hasPrefix("/") {
            path = "/" + path
        }
        
        // Add cookies (if enabled)
        if cookiesEnabled {
            for value in cookieValues {
                headers.addHeader("Cookie", value: value)
            }
        }
        
        // Find location and generate response
        if let filePath = SmartMockEndPointFinder.findLocation(rootPath, checkRequestPath: path) {
            let response = SmartMockResponseFinder.generateResponse(headers, requestMethod: method, requestPath: path, filePath: filePath, requestGetParameters: parameters, requestBody: body)
            if cookiesEnabled {
                if let cookieValue = response.headers.getHeaderValue("Set-Cookie") {
                    if cookieValue.characters.count > 0 {
                        applyToCookies(cookieValue)
                    }
                }
            }
            return response
        }
        let response = SmartMockResponse()
        response.code = 404
        response.mimeType = "text/plain"
        response.setStringBody("Request path not found: " + path + " (within: " + rootPath + ")")
        return response
    }
    

    // --
    // MARK: Cookie management
    // --
    
    public func enableCookies(enabled: Bool) {
        cookiesEnabled = enabled
    }
    
    public func clearCookies() {
        cookieValues.removeAll()
    }
    
    private func applyToCookies(value: String) {
        let splitValues = value.characters.split{ $0 == ";"}.map(String.init)
        for splitValue in splitValues {
            let valueSet = splitValue.characters.split{ $0 == "=" }.map(String.init)
            if valueSet.count > 0 {
                var foundAtIndex = -1
                for i in 0..<cookieValues.count {
                    let checkValueSet = cookieValues[i].characters.split{ $0 == "=" }.map(String.init)
                    if checkValueSet.count > 0 && checkValueSet[0] == valueSet[0] {
                        foundAtIndex = i
                        break
                    }
                }
                if foundAtIndex >= 0  {
                    cookieValues[foundAtIndex] = splitValue
                } else {
                    cookieValues.append(splitValue)
                }
            }
        }
    }

}