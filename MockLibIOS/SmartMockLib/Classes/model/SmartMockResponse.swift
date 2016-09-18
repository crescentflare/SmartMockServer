//
//  SmartMockResponse.swift
//  SmartMockServer Pod
//
//  Main library model: a mocked response object
//

open class SmartMockResponse {
    
    // --
    // MARK: Members
    // --
    
    open var headers = SmartMockHeaders.create(nil)
    open var body = SmartMockResponseBody.createFromString("")
    open var mimeType = ""
    open var code = 0

    
    // --
    // MARK: Helper
    // --
    
    open func setStringBody(_ body: String) {
        self.body = SmartMockResponseBody.createFromString(body)
    }
    
}
