//
//  User.swift
//  SmartMockLib Example
//
//  The user model
//

import UIKit
import ObjectMapper

class User: Mappable {

    var username: String?
    var role: UserRole?
    
    required init?(_ map: Map) {
    }
    
    func mapping(map: Map) {
        username <- map["username"]
        role <- map["role"]
    }
    
}
