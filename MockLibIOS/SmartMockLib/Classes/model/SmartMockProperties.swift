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
    var generatesJson = false
    var includeMD5 = false

    
    // --
    // MARK: Serialization
    // --
    
    func parseJsonDictionary(_ jsonDictionary: [String: AnyObject]) {
        // Parse parameters, body and header filters
        getParameters = serializeToStringMap(jsonDictionary: jsonDictionary["getParameters"])
        postParameters = serializeToStringMap(jsonDictionary: jsonDictionary["postParameters"])
        checkHeaders = serializeToStringMap(jsonDictionary: jsonDictionary["checkHeaders"])
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
        generatesJson = jsonDictionary["generatesJson"] as? Bool ?? false
        includeMD5 = jsonDictionary["includeMD5"] as? Bool ?? false
    }
    
    
    // --
    // MARK: Helpers
    // --
    
    func forceDefaults() {
        responseCode = responseCode >= 0 ? responseCode : 200
        responsePath = responsePath ?? "response"
    }
    
    private func serializeToStringMap(jsonDictionary: AnyObject?) -> [String: String]? {
        return jsonDictionary as? [String: String]
    }
    
}
