//
//  SmartMockResponseBody.swift
//  SmartMockServer Pod
//
//  Main library model: a mocked response body to hold large streams or simple strings
//

open class SmartMockResponseBody {
    
    // --
    // MARK: Members
    // --
    
    var stringContent: String?
    var filePath: String?
    var contentLength: Int = 0
    
    
    // --
    // MARK: Initialization
    // --
    
    fileprivate init() {
        // Private constructor, use factory methods to create an instance
    }
    
    open static func createFromString(_ body: String) -> SmartMockResponseBody {
        let result = SmartMockResponseBody()
        result.stringContent = body
        result.contentLength = body.lengthOfBytes(using: String.Encoding.utf8)
        return result
    }
    
    open static func createFromFile(_ path: String, fileLength: Int) -> SmartMockResponseBody {
        let result = SmartMockResponseBody()
        result.filePath = path
        result.contentLength = fileLength
        return result
    }
    
    
    // --
    // MARK: Obtain data in several ways
    // --
    
    open func count() -> Int {
        return contentLength
    }
    
    open func getStringData() -> String {
        if stringContent != nil {
            return stringContent!
        } else if filePath != nil {
            return (try? String(contentsOfFile: filePath!)) ?? ""
        }
        return ""
    }
    
    open func getByteData() -> Data? {
        if stringContent != nil {
            return stringContent!.data(using: String.Encoding.utf8)
        } else if filePath != nil {
            return (try? Data(contentsOf: URL(fileURLWithPath: filePath!)))
        }
        return nil
    }
    
    open func getInputStream() -> InputStream? {
        if stringContent != nil {
            return InputStream(data: getByteData()!)
        } else if filePath != nil {
            return InputStream(fileAtPath: filePath!)
        }
        return nil
    }
    
}
