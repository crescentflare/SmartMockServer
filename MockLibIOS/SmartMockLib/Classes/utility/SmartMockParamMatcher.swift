//
//  SmartMockParamMatcher.swift
//  SmartMockServer Pod
//
//  Main library utility: match parameters with wildcard support
//

class SmartMockParamMatcher {
    
    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: String or JSON matching
    // --
    
    static func deepEquals(requireDictionary: [String: AnyObject], haveDictionary: [String: AnyObject]) -> Bool {
        let wantKeys = Array(requireDictionary.keys)
        for key in wantKeys {
            if !haveDictionary.keys.contains(key) {
                return false
            } else if haveDictionary[key] is [String: AnyObject] && requireDictionary[key] is [String: AnyObject] {
                if !deepEquals(requireDictionary: requireDictionary[key] as! [String: AnyObject], haveDictionary: haveDictionary[key] as! [String: AnyObject]) {
                    return false
                }
            } else {
                var requireParam = ""
                var haveParam = ""
                if requireDictionary[key] is String {
                    requireParam = requireDictionary[key] as! String
                } else if requireDictionary[key] is Int {
                    requireParam = String(requireDictionary[key] as! Int)
                } else if requireDictionary[key] is Bool {
                    requireParam = String(requireDictionary[key] as! Bool)
                }
                if haveDictionary[key] is String {
                    haveParam = haveDictionary[key] as! String
                } else if haveDictionary[key] is Int {
                    haveParam = String(haveDictionary[key] as! Int)
                } else if haveDictionary[key] is Bool {
                    haveParam = String(haveDictionary[key] as! Bool)
                }
                if !paramEquals(requireParam: requireParam, haveParam: haveParam) {
                    return false
                }
            }
        }
        return true
    }

    static func paramEquals(requireParam: String, haveParam: String?) -> Bool {
        if haveParam == nil {
            return false
        }
        let patternSet = requireParam.characters.split(omittingEmptySubsequences: false, whereSeparator: { $0 == "*" }).map(String.init)
        if patternSet.count == 0 {
            return true
        }
        if patternSet[0].characters.count > 0 && !patternEquals(value: safeSubstring(haveParam!, start: 0, end: patternSet[0].characters.count), pattern: patternSet[0]) {
            return false
        }
        return searchPatternSet(value: haveParam!, paramPatternSet: patternSet) >= 0
    }

    
    // --
    // MARK: Internal pattern matching
    // --
    
    private static func searchPatternSet(value: String, paramPatternSet: [String]) -> Int {
        var patternSet = paramPatternSet
        while patternSet.count > 0 && patternSet[0].characters.count == 0 {
            patternSet = Array(patternSet[1..<patternSet.count])
        }
        if patternSet.count == 0 {
            return 0
        }
        var startPos = 0
        var pos = 0
        var searching = false
        repeat {
            searching = false
            pos = searchPattern(value: safeSubstring(value, start: startPos), pattern: patternSet[0])
            if pos >= 0 {
                if patternSet.count == 1 {
                    if startPos + pos + patternSet[0].characters.count == value.characters.count {
                        return startPos + pos
                    }
                } else {
                    let nextPos = startPos + pos + patternSet[0].characters.count
                    let setPos = searchPatternSet(value: safeSubstring(value, start: nextPos), paramPatternSet: Array(patternSet[1..<patternSet.count]))
                    if setPos >= 0 {
                        return startPos + pos
                    }
                }
                startPos += pos + 1
                searching = true
            }
        } while (searching)
        return -1
    }

    private static func searchPattern(value: String, pattern: String) -> Int {
        if pattern.characters.count == 0 {
            return 0
        }
        var valueIndex = value.startIndex
        for i in 0..<value.characters.count {
            if pattern.characters[pattern.startIndex] == "?" || value.characters[valueIndex] == pattern.characters[pattern.startIndex] {
                if patternEquals(value: safeSubstring(value, start: i, end: i + pattern.characters.count), pattern: pattern) {
                    return i
                }
            }
            valueIndex = value.index(valueIndex, offsetBy: 1)
        }
        return -1
    }

    private static func patternEquals(value: String, pattern: String) -> Bool {
        if value.characters.count != pattern.characters.count {
            return false
        }
        var patternIndex = pattern.startIndex
        var valueIndex = value.startIndex
        for _ in 0..<pattern.characters.count {
            if pattern.characters[patternIndex] != "?" && value.characters[valueIndex] != pattern.characters[patternIndex] {
                return false
            }
            patternIndex = pattern.index(patternIndex, offsetBy: 1)
            valueIndex = value.index(valueIndex, offsetBy: 1)
        }
        return true
    }
    

    // --
    // MARK: String helper
    // --
    
    private static func safeSubstring(_ string: String, start: Int) -> String {
        if start > string.characters.count {
            return ""
        }
        return string.substring(from: string.characters.index(string.startIndex, offsetBy: start))
    }
    
    private static func safeSubstring(_ string: String, start: Int, end: Int) -> String {
        var startPos = start
        var endPos = end
        if startPos > string.characters.count {
            startPos = string.characters.count
        }
        if endPos > string.characters.count {
            endPos = string.characters.count
        }
        if endPos <= startPos {
            return ""
        }
        return string.substring(with: string.characters.index(string.startIndex, offsetBy: startPos)..<string.characters.index(string.startIndex, offsetBy: endPos))
    }
    
}
