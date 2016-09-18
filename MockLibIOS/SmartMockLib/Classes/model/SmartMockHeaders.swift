//
//  SmartMockHeaders.swift
//  SmartMockServer Pod
//
//  Main library model: a set of headers
//

open class SmartMockHeaders {
    
    // --
    // MARK: Members
    // --
    
    var values: [String: [String]] = [:]


    // --
    // MARK: Initialization
    // --
    
    fileprivate init() {
        // Private constructor, use factory methods to create an instance
    }
    
    open static func create(_ headers: [String: [String]]?) -> SmartMockHeaders {
        let result = SmartMockHeaders()
        result.values = headers ?? [:]
        return result
    }
    
    open static func createFromFlattenedMap(_ headers: [String: String]) -> SmartMockHeaders {
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
    
    open func getHeaderMap() -> [String: [String]] {
        return values
    }
    
    open func getFlattenedHeaderMap() -> [String: String] {
        var result: [String: String] = [:]
        for (key, _) in values {
            result[key] = getHeaderValue(key)
        }
        return result
    }

    open func overwriteHeaders(_ headers: SmartMockHeaders) {
        for (key, _) in headers.getHeaderMap() {
            setHeader(key, value: headers.getHeaderValue(key) ?? "")
        }
    }
    
    open func getHeaderValue(_ key: String) -> String? {
        for (checkKey, checkValue) in values {
            if checkKey.caseInsensitiveCompare(key) == ComparisonResult.orderedSame {
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
    
    open func setHeader(_ key: String, value: String) {
        let list: [String] = [ value ]
        removeHeader(key)
        values[key] = list
    }
    
    open func addHeader(_ key: String, value: String) {
        for (checkKey, _) in values {
            if checkKey.caseInsensitiveCompare(key) == ComparisonResult.orderedSame {
                values[checkKey]?.append(value)
                return
            }
        }
        setHeader(key, value: value)
    }
    
    open func removeHeader(_ key: String) {
        for (checkKey, _) in values {
            if checkKey.caseInsensitiveCompare(key) == ComparisonResult.orderedSame {
                values.removeValue(forKey: checkKey)
                return
            }
        }
    }
    
}
