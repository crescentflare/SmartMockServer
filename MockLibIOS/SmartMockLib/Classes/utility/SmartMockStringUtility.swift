//
//  SmartMockStringUtility.swift
//  SmartMockServer Pod
//
//  Main library utility: string and JSON helpers
//

open class SmartMockStringUtility {
    
    // --
    // MARK: Initialization
    // --
    
    fileprivate init() {
        // Private constructor, only static methods allowed
    }


    // --
    // MARK: String to (JSON) dictionary
    // --
    
    open static func convertStringToDictionary(_ text: String) -> [String: AnyObject]? {
        if let data = text.data(using: String.Encoding.utf8) {
            do {
                return try JSONSerialization.jsonObject(with: data, options: []) as? [String: AnyObject]
            } catch _ {
            }
        }
        return nil
    }
    
    open static func convertStringToArray(_ text: String) -> [AnyObject]? {
        if let data = text.data(using: String.Encoding.utf8) {
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
    
    open static func urlEncode(_ string: String) -> String {
        let result = string.replacingOccurrences(of: " ", with: "+")
        let characters = (CharacterSet.urlQueryAllowed as NSCharacterSet).mutableCopy() as! NSMutableCharacterSet
        guard let encodedString = result.addingPercentEncoding(withAllowedCharacters: characters as CharacterSet) else {
            return result
        }
        return encodedString
    }
    
    open static func urlDecode(_ string: String) -> String {
        let result = string.replacingOccurrences(of: "+", with: " ")
        return result.removingPercentEncoding!
    }

}
