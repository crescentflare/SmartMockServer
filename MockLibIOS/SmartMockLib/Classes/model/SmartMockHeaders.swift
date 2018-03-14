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
    
    public static func makeFromHeaders(_ headers: [String: [String]]?) -> SmartMockHeaders {
        let result = SmartMockHeaders()
        result.values = headers ?? [:]
        return result
    }
    
    public static func makeFromFlattenedHeaderMap(_ headers: [String: String]) -> SmartMockHeaders {
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
        for (key, _) in values {
            result[key] = getHeaderValue(key: key)
        }
        return result
    }

    public func overwriteHeaders(_ headers: SmartMockHeaders) {
        for (key, _) in headers.getHeaderMap() {
            setHeader(key: key, value: headers.getHeaderValue(key: key) ?? "")
        }
    }
    
    public func getHeaderValue(key: String) -> String? {
        for (checkKey, checkValue) in values {
            if checkKey.caseInsensitiveCompare(key) == ComparisonResult.orderedSame {
                var result = ""
                for value in checkValue {
                    if result.count > 0 {
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
        removeHeader(key: key)
        values[key] = list
    }
    
    public func addHeader(key: String, value: String) {
        for (checkKey, _) in values {
            if checkKey.caseInsensitiveCompare(key) == ComparisonResult.orderedSame {
                values[checkKey]?.append(value)
                return
            }
        }
        setHeader(key: key, value: value)
    }
    
    public func removeHeader(key: String) {
        for (checkKey, _) in values {
            if checkKey.caseInsensitiveCompare(key) == ComparisonResult.orderedSame {
                values.removeValue(forKey: checkKey)
                return
            }
        }
    }
    
}
