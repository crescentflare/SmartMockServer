//
//  SmartMockProperties.swift
//  SmartMockServer Pod
//
//  Main library model: a properties model
//

class SmartMockProperties {
    
    // --
    // MARK: Members
    // --
    
    var getParameters: [String: String]?
    var postParameters: [String: String]?
    var checkHeaders: [String: String]?
    var postJson: [String: AnyObject]?
    var alternatives: [SmartMockProperties]?
    var name: String?
    var method: String?
    var responsePath: String?
    var generates: String?
    var delay: Int = -1
    var responseCode: Int = -1

    
    // --
    // MARK: Serialization
    // --
    
    func parseJsonDictionary(jsonDictionary: [String: AnyObject]) {
        // Parse parameters, body and header filters
        getParameters = serializeJsonDictionaryStringMap(jsonDictionary["getParameters"])
        postParameters = serializeJsonDictionaryStringMap(jsonDictionary["postParameters"])
        checkHeaders = serializeJsonDictionaryStringMap(jsonDictionary["checkHeaders"])
        postJson = jsonDictionary["postJson"] as? [String: AnyObject]
        
        // Parse alternatives
        if let alternativesArray = jsonDictionary["alternatives"] as? [[String: AnyObject]] {
            alternatives = []
            for alternativeArrayItem in alternativesArray {
                let addProperties = SmartMockProperties()
                addProperties.parseJsonDictionary(alternativeArrayItem)
                alternatives?.append(addProperties)
            }
        }
        
        // Parse basic fields
        name = jsonDictionary["name"] as? String
        method = jsonDictionary["method"] as? String
        responsePath = jsonDictionary["responsePath"] as? String
        generates = jsonDictionary["generates"] as? String
        delay = jsonDictionary["delay"] as? Int ?? -1
        responseCode = jsonDictionary["responseCode"] as? Int ?? -1
    }
    
    
    // --
    // MARK: Helpers
    // --
    
    func forceDefaults() {
        responseCode = responseCode >= 0 ? responseCode : 200
        responsePath = responsePath ?? "response"
    }
    
    private func serializeJsonDictionaryStringMap(dictionary: AnyObject?) -> [String: String]? {
        return dictionary as? [String: String]
    }
    
}