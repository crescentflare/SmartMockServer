//
//  ApiError.swift
//  SmartMockLib Example
//
//  The API error model
//

import UIKit
import ObjectMapper

class ApiError: Mappable {

    var message: String?
    var errorId: String?
    var code: String?
    var logEntry: String?
    
    required init?(_ map: Map) {
    }
    
    func mapping(map: Map) {
        message <- map["error_message"]
        errorId <- map["error_id"]
        code <- map["error_code"]
        logEntry <- map["log_entry"]
    }
    
}

