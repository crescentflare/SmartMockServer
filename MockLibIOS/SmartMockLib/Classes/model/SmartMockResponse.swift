//
//  SmartMockResponse.swift
//  SmartMockServer Pod
//
//  Main library model: a mocked response object
//

public class SmartMockResponse {
    
    // --
    // MARK: Members
    // --
    
    public var headers = SmartMockHeaders.create(nil)
    public var body = SmartMockResponseBody.createFromString("")
    public var mimeType = ""
    public var code = 0

    
    // --
    // MARK: Helper
    // --
    
    public func setStringBody(body: String) {
        self.body = SmartMockResponseBody.createFromString(body)
    }
    
}