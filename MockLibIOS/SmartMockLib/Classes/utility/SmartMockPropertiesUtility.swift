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
    
    fileprivate init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: Utility functions
    // --
    
    static func readFile(_ requestPath: String, filePath: String) -> SmartMockProperties {
        let properties = SmartMockProperties()
        if let responseStream = SmartMockFileUtility.open(filePath + "/properties.json") {
            let result = SmartMockFileUtility.readFromInputStream(responseStream)
            if let dictionary = SmartMockStringUtility.convertStringToDictionary(result) {
                properties.parseJsonDictionary(dictionary)
            }
        }
        properties.forceDefaults()
        return properties
    }
    
}
