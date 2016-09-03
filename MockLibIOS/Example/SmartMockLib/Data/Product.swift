//
//  Product.swift
//  SmartMockLib Example
//
//  The product model
//

import UIKit
import ObjectMapper

class Product: Mappable {

    var productId: String?
    var name: String?
    var productDescription: String?
    var image: String?
    var price: Float?
    
    required init?(_ map: Map) {
    }
    
    func mapping(map: Map) {
        productId <- map["id"]
        name <- map["name"]
        productDescription <- map["description"]
        image <- map["image"]
        price <- map["price"]
    }
    
}
