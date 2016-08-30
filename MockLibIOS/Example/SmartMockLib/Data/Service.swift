//
//  Service.swift
//  SmartMockLib Example
//
//  The service model
//

import UIKit
import ObjectMapper

class Service: Mappable {

    var serviceId: String?
    var name: String?
    var serviceDescription: String?
    var price: Float?
    
    required init?(_ map: Map) {
    }
    
    func mapping(map: Map) {
        serviceId <- map["id"]
        name <- map["name"]
        serviceDescription <- map["description"]
        price <- map["price"]
    }
    
}
