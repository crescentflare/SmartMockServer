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
    
    fileprivate init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: Utility functions
    // --
    
    static func findLocation(_ rootPath: String, checkRequestPath: String) -> String? {
        // Return early if request path is empty
        if checkRequestPath.isEmpty || checkRequestPath == "/" {
            return rootPath
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
            var checkPath = rootPath
            for i in 0..<pathComponents.count {
                let pathComponent: String = pathComponents[i]
                if let fileList = SmartMockFileUtility.list(checkPath) {
                    if fileList.contains(pathComponent) {
                        var isFile = false
                        if i + 1 == pathComponents.count {
                            isFile = SmartMockFileUtility.getLength(checkPath + "/" + pathComponent) > 0
                        }
                        if !isFile {
                            checkPath += "/" + pathComponent
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
        return rootPath
    }
    
}
