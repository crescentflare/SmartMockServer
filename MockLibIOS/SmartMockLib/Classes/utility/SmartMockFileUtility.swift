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
    
    fileprivate init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: Utility functions
    // --
    
    static func list(_ path: String) -> [String]? {
        return try? FileManager.default.contentsOfDirectory(atPath: getRawPath(path))
    }
    
    static func open(_ path: String) -> InputStream? {
        if let inputStream = InputStream(fileAtPath: getRawPath(path)) {
            inputStream.open()
            return inputStream
        }
        return nil
    }
    
    static func getLength(_ path: String) -> Int {
        if let attr = try? FileManager.default.attributesOfItem(atPath: getRawPath(path)) {
            if let fileType = attr[FileAttributeKey.type] {
                if fileType as? String == FileAttributeType.typeDirectory.rawValue {
                    return 0
                }
            }
            if let fileSize = attr[FileAttributeKey.size] {
                return (fileSize as! NSNumber).intValue
            }
            return 0
        }
        return -1
    }
    
    static func exists(_ path: String) -> Bool {
        if let _ = try? FileManager.default.attributesOfItem(atPath: getRawPath(path)) {
            return true
        }
        return false
    }
    
    static func readFromInputStream(_ stream: InputStream) -> String {
        let data = NSMutableData()
        var buffer = [UInt8](repeating: 0, count: 4096)
        while stream.hasBytesAvailable {
            let bytesRead = stream.read(&buffer, maxLength: buffer.count)
            data.append(buffer, length: bytesRead)
        }
        let result = String(data: data as Data, encoding: String.Encoding.utf8) ?? ""
        stream.close()
        return result
    }
    
    static func getRawPath(_ path: String) -> String {
        if path.hasPrefix("bundle:///") {
            return (Bundle.main.resourcePath ?? "") + "/" + path.replacingOccurrences(of: "bundle:///", with: "")
        } else if path.hasPrefix("document:///") {
            let paths = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)
            let documentPath = paths[0]
            return documentPath + "/" + path.replacingOccurrences(of: "document:///", with: "")
        }
        return path.replacingOccurrences(of: "file:///", with: "/")
    }
    
}
