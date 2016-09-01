//
//  SmartMockResponse.swift
//  SmartMockServer Pod
//
//  Main library model: a mocked response object
//

class SmartMockResponse {
    
    // --
    // MARK: Members
    // --
    
    var headers = SmartMockHeaders.create(nil)
    var body = SmartMockResponseBody.createFromString("")
    var mimeType = ""
    var code = 0

    
    // --
    // MARK: Helper
    // --
    
    public func setStringBody(body: String) {
        self.body = SmartMockResponseBody.createFromString(body)
    }
    
}