//
//  SmartMockResponseBody.swift
//  SmartMockServer Pod
//
//  Main library model: a mocked response body to hold large streams or simple strings
//

class SmartMockResponseBody {
    
    // --
    // MARK: Members
    // --
    
    var stringContent: String?
    var filePath: String?
    var contentLength: Int = 0
    
    
    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, use factory methods to create an instance
    }
    
    public static func createFromString(body: String) -> SmartMockResponseBody {
        let result = SmartMockResponseBody()
        result.stringContent = body
        result.contentLength = body.lengthOfBytesUsingEncoding(NSUTF8StringEncoding)
        return result
    }
    
    public static func createFromFile(path: String, fileLength: Int) -> SmartMockResponseBody {
        let result = SmartMockResponseBody()
        result.filePath = path
        result.contentLength = fileLength
        return result
    }
    
    
    // --
    // MARK: Obtain data in several ways
    // --
    
    public func count() -> Int {
        return contentLength
    }
    
    public func getStringData() -> String {
        if stringContent != nil {
            return stringContent!
        } else if filePath != nil {
            return (try? String(contentsOfFile: filePath!)) ?? ""
        }
        return ""
    }
    
    public func getByteData() -> NSData? {
        if stringContent != nil {
            return stringContent!.dataUsingEncoding(NSUTF8StringEncoding)
        } else if filePath != nil {
            return NSData(contentsOfFile: filePath!)
        }
        return nil
    }
    
    public func getInputStream() -> NSInputStream? {
        if stringContent != nil {
            return NSInputStream(data: getByteData()!)
        } else if filePath != nil {
            return NSInputStream(fileAtPath: filePath!)
        }
        return nil
    }
    
}