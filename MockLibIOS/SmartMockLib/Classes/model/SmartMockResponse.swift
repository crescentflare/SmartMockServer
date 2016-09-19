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
    
    public var headers = SmartMockHeaders.makeFromHeaders(nil)
    public var body = SmartMockResponseBody.makeFromString("")
    public var mimeType = ""
    public var code = 0

    
    // --
    // MARK: Helper
    // --
    
    public func setStringBody(_ body: String) {
        self.body = SmartMockResponseBody.makeFromString(body)
    }
    
}
