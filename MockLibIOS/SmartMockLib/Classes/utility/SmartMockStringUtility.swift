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

    
    // --
    // MARK: URL coding
    // --
    
    public static func urlEncode(string: String) -> String {
        let result = string.stringByReplacingOccurrencesOfString(" ", withString: "+")
        let characters = NSCharacterSet.URLQueryAllowedCharacterSet().mutableCopy() as! NSMutableCharacterSet
        guard let encodedString = result.stringByAddingPercentEncodingWithAllowedCharacters(characters) else {
            return result
        }
        return encodedString
    }
    
    public static func urlDecode(string: String) -> String {
        let result = string.stringByReplacingOccurrencesOfString("+", withString: " ")
        return result.stringByRemovingPercentEncoding!
    }

}