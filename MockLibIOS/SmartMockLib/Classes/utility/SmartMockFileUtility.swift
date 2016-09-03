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
    
    static func list(path: String) -> [String]? {
        return try? NSFileManager.defaultManager().contentsOfDirectoryAtPath(getRawPath(path))
    }
    
    static func open(path: String) -> NSInputStream? {
        if let inputStream = NSInputStream(fileAtPath: getRawPath(path)) {
            inputStream.open()
            return inputStream
        }
        return nil
    }
    
    static func getLength(path: String) -> Int {
        if let attr = try? NSFileManager.defaultManager().attributesOfItemAtPath(getRawPath(path)) {
            if let fileType = attr[NSFileType] {
                if fileType as? String == NSFileTypeDirectory {
                    return 0
                }
            }
            if let fileSize = attr[NSFileSize] {
                return (fileSize as! NSNumber).longValue
            }
            return 0
        }
        return -1
    }
    
    static func exists(path: String) -> Bool {
        if let _ = try? NSFileManager.defaultManager().attributesOfItemAtPath(getRawPath(path)) {
            return true
        }
        return false
    }
    
    static func readFromInputStream(stream: NSInputStream) -> String {
        let data = NSMutableData()
        var buffer = [UInt8](count: 4096, repeatedValue: 0)
        while stream.hasBytesAvailable {
            let bytesRead = stream.read(&buffer, maxLength: buffer.count)
            data.appendBytes(buffer, length: bytesRead)
        }
        let result = String(data: data, encoding: NSUTF8StringEncoding) ?? ""
        stream.close()
        return result
    }
    
    static func getRawPath(path: String) -> String {
        if path.hasPrefix("bundle:///") {
            return (NSBundle.mainBundle().resourcePath ?? "") + "/" + path.stringByReplacingOccurrencesOfString("bundle:///", withString: "")
        } else if path.hasPrefix("document:///") {
            let paths = NSSearchPathForDirectoriesInDomains(.DocumentDirectory, .UserDomainMask, true)
            let documentPath = paths[0]
            return documentPath + "/" + path.stringByReplacingOccurrencesOfString("document:///", withString: "")
        }
        return path.stringByReplacingOccurrencesOfString("file:///", withString: "/")
    }
    
}