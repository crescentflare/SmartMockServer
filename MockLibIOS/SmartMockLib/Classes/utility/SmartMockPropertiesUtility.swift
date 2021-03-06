//
//  SmartMockPropertiesUtility.swift
//  SmartMockServer Pod
//
//  Main library utility: easily read and manage response properties
//

class SmartMockPropertiesUtility {
    
    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: Utility functions
    // --
    
    static func readFile(requestPath: String, filePath: String) -> SmartMockProperties {
        let properties = SmartMockProperties()
        if let responseStream = SmartMockFileUtility.open(path: filePath + "/properties.json") {
            let result = SmartMockFileUtility.readFromInputStream(responseStream)
            if let dictionary = SmartMockStringUtility.parseToDictionary(string: result) {
                properties.parseJsonDictionary(dictionary)
                if let redirect = properties.redirect {
                    let redirectProperties = readFile(requestPath: requestPath, filePath: filePath + "/" + redirect)
                    redirectProperties.fallbackTo(properties: properties)
                    redirectProperties.forceDefaults()
                    return redirectProperties
                }
            }
        }
        properties.forceDefaults()
        return properties
    }
    
}
