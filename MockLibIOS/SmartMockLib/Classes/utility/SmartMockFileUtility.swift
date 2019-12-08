//
//  SmartMockFileUtility.swift
//  SmartMockServer Pod
//
//  Main library utility: easily access files with file:/// or bundle:/// or document:///
//

import CommonCrypto

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
    
    static func list(fromPath: String) -> [String]? {
        if let fileList = try? FileManager.default.contentsOfDirectory(atPath: getRawPath(fromPath)) {
            var filteredList: [String] = []
            for fileItem in fileList {
                if fileItem.lowercased() != "thumbs.db" && fileItem.lowercased() != ".ds_store" {
                    filteredList.append(fileItem)
                }
            }
            return filteredList
        }
        return nil
    }
    
    static func recursiveList(fromPath: String) -> [String]? {
        if let items = list(fromPath: fromPath) {
            var files: [String] = []
            for item in items {
                let isFile = SmartMockFileUtility.getLength(ofPath: fromPath + "/" + item) > 0
                if !isFile {
                    if let dirFiles = recursiveList(fromPath: fromPath + "/" + item) {
                        for dirFile in dirFiles {
                            files.append(item + "/" + dirFile)
                        }
                    }
                } else {
                    files.append(item)
                }
            }
            return files
        }
        return nil
    }
    
    static func open(path: String) -> InputStream? {
        if let inputStream = InputStream(fileAtPath: getRawPath(path)) {
            inputStream.open()
            return inputStream
        }
        return nil
    }
    
    static func getLength(ofPath: String) -> Int {
        if let attr = try? FileManager.default.attributesOfItem(atPath: getRawPath(ofPath)) {
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
    
    static func exists(path: String) -> Bool {
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
    
    static func obtainSHA256(path: String) -> String {
        if let inputStream = open(path: path) {
            // Read stream into data
            let inputData = NSMutableData()
            var buffer = [UInt8](repeating: 0, count: 4096)
            while inputStream.hasBytesAvailable {
                let bytesRead = inputStream.read(&buffer, maxLength: buffer.count)
                inputData.append(buffer, length: bytesRead)
            }
            inputStream.close()

            // Obtain the SHA256 hash
            let data = inputData as Data
            let hash = data.withUnsafeBytes { (bytes: UnsafeRawBufferPointer) -> [UInt8] in
                var hash = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
                CC_SHA256(bytes.baseAddress, CC_LONG(data.count), &hash)
                return hash
            }

            // Return SHA256 hash string formatted as hexadecimal
            return hash.map { String(format: "%02hhx", $0) }.joined()
        }
        return ""
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
