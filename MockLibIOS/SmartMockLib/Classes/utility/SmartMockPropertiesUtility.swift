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
    
    public static func readFile(requestPath: String, filePath: String) -> SmartMockProperties {
        var properties = SmartMockProperties()
        if let responseStream = SmartMockFileUtility.open(filePath + "/properties.json") {
            let result = SmartMockFileUtility.readFromInputStream(responseStream)
            if let dictionary = convertStringToDictionary(result) {
                properties.parseJsonDictionary(dictionary)
            }
        }
        properties.forceDefaults()
        return properties
    }
    
    public static func convertStringToDictionary(text: String) -> [String: AnyObject]? {
        if let data = text.dataUsingEncoding(NSUTF8StringEncoding) {
            do {
                return try NSJSONSerialization.JSONObjectWithData(data, options: []) as? [String: AnyObject]
            } catch _ {
            }
        }
        return nil
    }

    public static func convertStringToArray(text: String) -> [AnyObject]? {
        if let data = text.dataUsingEncoding(NSUTF8StringEncoding) {
            do {
                return try NSJSONSerialization.JSONObjectWithData(data, options: []) as? [AnyObject]
            } catch _ {
            }
        }
        return nil
    }

}