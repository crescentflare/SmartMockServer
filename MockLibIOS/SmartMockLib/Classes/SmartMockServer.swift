//
//  SmartMockServer.swift
//  SmartMockServer Pod
//
//  Main library: obtain responses from the mock server endpoints
//

class SmartMockServer: UIViewController {
    
    // --
    // MARK: Singleton instance
    // --
    
    let sharedServer = SmartMockServer()


    // --
    // MARK: Serve the response
    // --
    
    public func obtainResponseSync(method: String, rootPath: String, path: String, body: String?, headers: SmartMockHeaders?) -> String? {
        return nil
    }
    
}