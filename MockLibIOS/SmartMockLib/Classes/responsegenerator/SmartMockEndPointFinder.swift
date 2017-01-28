//
//  SmartMockEndPointFinder.swift
//  SmartMockServer Pod
//
//  Main library response generator: find the end point based on the path (with wildcard matching)
//

class SmartMockEndPointFinder {
    
    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: Utility functions
    // --
    
    private static func findFileServerPath(path: String) -> String? {
        var traversePath = path
        while let slashIndex = traversePath.range(of: "/", options: .backwards)?.lowerBound {
            traversePath = traversePath.substring(to: slashIndex)
            if let inputStream = SmartMockFileUtility.open(path: traversePath + "/properties.json") {
                let jsonString = SmartMockFileUtility.readFromInputStream(inputStream)
                if let jsonDict = SmartMockStringUtility.parseToDictionary(string: jsonString) {
                    if jsonDict["generates"] as? String == "fileList" {
                        return traversePath
                    }
                }
            }
            if traversePath.hasSuffix("//") {
                break
            }
        }
        return nil
    }
    
    static func findLocation(atRootPath: String, checkRequestPath: String) -> String? {
        // Return early if request path is empty
        if checkRequestPath.isEmpty || checkRequestPath == "/" {
            return atRootPath
        }

        // Determine path to traverse
        var requestPath = checkRequestPath
        if requestPath.characters[requestPath.startIndex] == "/" {
            requestPath = requestPath.substring(from: requestPath.characters.index(requestPath.startIndex, offsetBy: 1))
        }
        if requestPath.characters[requestPath.characters.index(requestPath.startIndex, offsetBy: requestPath.characters.count - 1)] == "/" {
            requestPath = requestPath.substring(to: requestPath.characters.index(requestPath.startIndex, offsetBy: requestPath.characters.count - 1))
        }
        let pathComponents = requestPath.characters.split{ $0 == "/" }.map(String.init)
        
        // Start going through the file tree until a path is found
        if pathComponents.count > 0 {
            var checkPath = atRootPath
            for i in 0..<pathComponents.count {
                let pathComponent: String = pathComponents[i]
                if let fileList = SmartMockFileUtility.list(fromPath: checkPath) {
                    if fileList.contains(pathComponent) {
                        var isFile = false
                        if i + 1 == pathComponents.count {
                            isFile = SmartMockFileUtility.getLength(ofPath: checkPath + "/" + pathComponent) > 0
                        }
                        checkPath += "/" + pathComponent
                        if isFile {
                            if let fileServerPath = findFileServerPath(path: checkPath) {
                                checkPath = fileServerPath
                            }
                        }
                    } else if fileList.contains("any") {
                        checkPath += "/any"
                    } else {
                        return nil
                    }
                } else {
                    return nil
                }
            }
            return checkPath
        }
        return atRootPath
    }
    
}
