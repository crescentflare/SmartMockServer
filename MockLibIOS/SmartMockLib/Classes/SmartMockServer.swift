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
    
    public static let shared = SmartMockServer()

    
    // --
    // MARK: Members
    // --

    private var cookieValues: [String] = []
    private var cookiesEnabled = false

    
    // --
    // MARK: Serve the response
    // --
    
    public func obtainResponse(method: String, rootPath: String, requestPath: String, requestBody: String?, requestHeaders: SmartMockHeaders?, completion: @escaping (_ response: SmartMockResponse) -> Void) {
        if !Thread.isMainThread {
            completion(obtainResponseSync(method: method, rootPath: rootPath, requestPath: requestPath, requestBody: requestBody, requestHeaders: requestHeaders))
            return
        }
        let priority = DispatchQueue.GlobalQueuePriority.default
        DispatchQueue.global(priority: priority).async {
            let result = self.obtainResponseSync(method: method, rootPath: rootPath, requestPath: requestPath, requestBody: requestBody, requestHeaders: requestHeaders)
            DispatchQueue.main.async {
                completion(result)
            }
        }
    }
    
    public func obtainResponseSync(method: String, rootPath: String, requestPath: String, requestBody: String?, requestHeaders: SmartMockHeaders?) -> SmartMockResponse {
        // Safety checks
        let body = requestBody ?? ""
        let headers = requestHeaders ?? SmartMockHeaders.makeFromHeaders(nil)
        var path = requestPath
        
        // Fetch parameters from path
        var parameters: [String: String] = [:]
        if let paramMark = path.characters.index(of: "?") {
            let parameterStrings = path.substring(from: path.index(paramMark, offsetBy: 1)).characters.split{ $0 == "&"}.map(String.init)
            for parameterString in parameterStrings {
                let parameterPair = parameterString.characters.split{ $0 == "=" }.map(String.init)
                if parameterPair.count > 1 {
                    parameters[SmartMockStringUtility.urlDecode(parameterPair[0])] = SmartMockStringUtility.urlDecode(parameterPair[1])
                }
            }
            path = path.substring(to: paramMark)
        }
        if !path.hasPrefix("/") {
            path = "/" + path
        }
        
        // Add cookies (if enabled)
        if cookiesEnabled {
            for value in cookieValues {
                headers.addHeader(key: "Cookie", value: value)
            }
        }
        
        // Find location and generate response
        if let filePath = SmartMockEndPointFinder.findLocation(atRootPath: rootPath, checkRequestPath: path) {
            let response = SmartMockResponseFinder.generateResponse(headers: headers, requestMethod: method, requestPath: path, filePath: filePath, requestGetParameters: parameters, requestBody: body)
            if cookiesEnabled {
                if let cookieValue = response.headers.getHeaderValue(key: "Set-Cookie") {
                    if cookieValue.characters.count > 0 {
                        applyToCookies(value: cookieValue)
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
    
    public func enableCookies(_ enabled: Bool) {
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
