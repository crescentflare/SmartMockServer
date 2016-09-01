//
//  SmartMockFileUtility.swift
//  SmartMockServer Pod
//
//  Main library utility: easily access files with file:/// or bundle:/// or document:///
//

class SmartMockFileUtility {
    
    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: Utility functions
    // --
    
    public static func list(path: String) -> [String]? {
        return try? NSFileManager.defaultManager().contentsOfDirectoryAtPath(getRawPath(path))
    }
    
    public static func open(path: String) -> NSInputStream? {
        return NSInputStream(fileAtPath: getRawPath(path))
    }
    
    public static func getLength(path: String) -> Int {
        if let attr = try? NSFileManager.defaultManager().attributesOfItemAtPath(getRawPath(path)) {
            if let fileSize = attr[NSFileSize]  {
                return (fileSize as! NSNumber).longValue
            }
            return 0
        }
        return -1
    }
    
    public static func exists(path: String) -> Bool {
        if let attr = try? NSFileManager.defaultManager().attributesOfItemAtPath(getRawPath(path)) {
            return true
        }
        return false
    }
    
    public static func readFromInputStream(stream: NSInputStream) -> String {
        let data = NSMutableData()
        var buffer = [UInt8](count: 4096, repeatedValue: 0)
        while stream.hasBytesAvailable {
            let bytesRead = stream.read(&buffer, maxLength: buffer.count)
            data.appendBytes(buffer, length: bytesRead)
        }
        return String(data: data, encoding: NSUTF8StringEncoding) ?? ""
    }
    
    public static func getRawPath(path: String) -> String {
        if path.hasPrefix("bundle:///") {
            return NSBundle.mainBundle().resourcePath ?? "" + "/" + path.stringByReplacingOccurrencesOfString("bundle:///", withString: "")
        } else if path.hasPrefix("document:///") {
            let paths = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true)
            let documentPath = paths[0]
            return documentPath + "/" + path.stringByReplacingOccurrencesOfString("document:///", withString: "")
        }
        return path.stringByReplacingOccurrencesOfString("file:///", withString: "/")
    }
    
}