//
//  SmartMockStringUtility.swift
//  SmartMockServer Pod
//
//  Main library utility: string and JSON helpers
//

public class SmartMockStringUtility {
    
    // --
    // MARK: Initialization
    // --
    
    private init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: String to (JSON) dictionary
    // --
    
    public static func parseToDictionary(string: String) -> [String: AnyObject]? {
        if let data = string.data(using: String.Encoding.utf8) {
            do {
                return try JSONSerialization.jsonObject(with: data, options: []) as? [String: AnyObject]
            } catch _ {
            }
        }
        return nil
    }
    
    public static func parseToArray(string: String) -> [AnyObject]? {
        if let data = string.data(using: String.Encoding.utf8) {
            do {
                return try JSONSerialization.jsonObject(with: data, options: []) as? [AnyObject]
            } catch _ {
            }
        }
        return nil
    }

    
    // --
    // MARK: URL coding
    // --
    
    public static func urlEncode(_ string: String) -> String {
        let result = string.replacingOccurrences(of: " ", with: "+")
        let characters = (CharacterSet.urlQueryAllowed as NSCharacterSet).mutableCopy() as! NSMutableCharacterSet
        guard let encodedString = result.addingPercentEncoding(withAllowedCharacters: characters as CharacterSet) else {
            return result
        }
        return encodedString
    }
    
    public static func urlDecode(_ string: String) -> String {
        let result = string.replacingOccurrences(of: "+", with: " ")
        return result.removingPercentEncoding!
    }

}
