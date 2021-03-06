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
    var redirect: String?
    var replaceToken: String?
    var delay: Int = -1
    var responseCode: Int = -1
    var generatesJson = false
    var includeSHA256 = false

    
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
        redirect = jsonDictionary["redirect"] as? String
        replaceToken = jsonDictionary["replaceToken"] as? String
        delay = jsonDictionary["delay"] as? Int ?? -1
        responseCode = jsonDictionary["responseCode"] as? Int ?? -1
        generatesJson = jsonDictionary["generatesJson"] as? Bool ?? false
        includeSHA256 = jsonDictionary["includeSHA256"] as? Bool ?? false
    }
    
    func fallbackTo(properties: SmartMockProperties) {
        // Parameters, body and header filters
        getParameters = getParameters ?? properties.getParameters
        postParameters = postParameters ?? properties.postParameters
        checkHeaders = checkHeaders ?? properties.checkHeaders
        postJson = postJson ?? properties.postJson
        
        // Alternatives
        alternatives = alternatives ?? properties.alternatives
        
        // Basic fields
        name = name ?? properties.name
        method = method ?? properties.method
        responsePath = responsePath ?? properties.responsePath
        generates = generates ?? properties.generates
        redirect = redirect ?? properties.redirect
        replaceToken = replaceToken ?? properties.replaceToken
        if delay < 0 {
            delay = properties.delay
        }
        if responseCode < 0 {
            responseCode = properties.responseCode
        }
        if !generatesJson {
            generatesJson = properties.generatesJson
        }
        if !includeSHA256 {
            includeSHA256 = properties.includeSHA256
        }
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
