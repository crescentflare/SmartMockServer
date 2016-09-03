//
//  SmartMockHeaders.swift
//  SmartMockServer Pod
//
//  Main library model: a set of headers
//

public class SmartMockHeaders {
    
    // --
    // MARK: Members
    // --
    
    var values: [String: [String]] = [:]


    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, use factory methods to create an instance
    }
    
    public static func create(headers: [String: [String]]?) -> SmartMockHeaders {
        let result = SmartMockHeaders()
        result.values = headers ?? [:]
        return result
    }
    
    public static func createFromFlattenedMap(headers: [String: String]) -> SmartMockHeaders {
        let result = SmartMockHeaders()
        for (key, value) in headers {
            let list: [String] = [ value ]
            result.values[key] = list
        }
        return result
    }
    
    
    // --
    // MARK: Access headers
    // --
    
    public func getHeaderMap() -> [String: [String]] {
        return values
    }
    
    public func getFlattenedHeaderMap() -> [String: String] {
        var result: [String: String] = [:]
        for (key, value) in values {
            result[key] = getHeaderValue(key)
        }
        return result
    }

    public func overwriteHeaders(headers: SmartMockHeaders) {
        for (key, value) in headers.getHeaderMap() {
            setHeader(key, value: headers.getHeaderValue(key) ?? "")
        }
    }
    
    public func getHeaderValue(key: String) -> String? {
        for (checkKey, checkValue) in values {
            if checkKey.caseInsensitiveCompare(key) == NSComparisonResult.OrderedSame {
                var result = ""
                for value in checkValue {
                    if result.characters.count > 0 {
                        result += "; "
                    }
                    result += value
                }
                return result
            }
        }
        return nil
    }
    
    public func setHeader(key: String, value: String) {
        let list: [String] = [ value ]
        removeHeader(key)
        values[key] = list
    }
    
    public func addHeader(key: String, value: String) {
        for (checkKey, checkValue) in values {
            if checkKey.caseInsensitiveCompare(key) == NSComparisonResult.OrderedSame {
                values[checkKey]?.append(value)
                return
            }
        }
        setHeader(key, value: value)
    }
    
    public func removeHeader(key: String) {
        for (checkKey, checkValue) in values {
            if checkKey.caseInsensitiveCompare(key) == NSComparisonResult.OrderedSame {
                values.removeValueForKey(checkKey)
                return
            }
        }
    }
    
}