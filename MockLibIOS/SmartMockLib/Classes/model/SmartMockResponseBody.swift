//
//  SmartMockResponseBody.swift
//  SmartMockServer Pod
//
//  Main library model: a mocked response body to hold large streams or simple strings
//

public class SmartMockResponseBody {
    
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
    
    public static func makeFromString(_ body: String) -> SmartMockResponseBody {
        let result = SmartMockResponseBody()
        result.stringContent = body
        result.contentLength = body.lengthOfBytes(using: String.Encoding.utf8)
        return result
    }
    
    public static func makeFromFile(path: String, fileLength: Int) -> SmartMockResponseBody {
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
    
    public func getByteData() -> Data? {
        if stringContent != nil {
            return stringContent!.data(using: String.Encoding.utf8)
        } else if filePath != nil {
            return (try? Data(contentsOf: URL(fileURLWithPath: filePath!)))
        }
        return nil
    }
    
    public func getInputStream() -> InputStream? {
        if stringContent != nil {
            return InputStream(data: getByteData()!)
        } else if filePath != nil {
            return InputStream(fileAtPath: filePath!)
        }
        return nil
    }
    
}
