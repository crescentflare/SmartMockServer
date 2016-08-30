//
//  ProductService.swift
//  SmartMockLib Example
//
//  Provides the products API integration
//

import UIKit
import Alamofire
import ObjectMapper

class ProductService {

    let mockableAlamofire: MockableAlamofire
    
    init(mockableAlamofire: MockableAlamofire) {
        self.mockableAlamofire = mockableAlamofire
    }
    
    func loadProducts(success: [Product] -> Void, failure: ApiError? -> Void) {
        mockableAlamofire.request(.GET, "products").responseArray { (response: Response<[Product], NSError>) in
            if let productArray = response.result.value {
                if response.response?.statusCode >= 200 && response.response?.statusCode < 300 {
                    success(productArray)
                    return
                }
            }
            if response.data != nil {
                failure(Mapper<ApiError>().map(String(data: response.data!, encoding: NSUTF8StringEncoding)))
            } else {
                failure(nil)
            }
        }
    }
    
    func loadProduct(productId: String, success: Product -> Void, failure: ApiError? -> Void) {
        mockableAlamofire.request(.GET, "products/" + productId).responseObject { (response: Response<Product, NSError>) in
            if let product = response.result.value {
                if response.response?.statusCode >= 200 && response.response?.statusCode < 300 {
                    success(product)
                    return
                }
            }
            if response.data != nil {
                failure(Mapper<ApiError>().map(String(data: response.data!, encoding: NSUTF8StringEncoding)))
            } else {
                failure(nil)
            }
        }
    }

}
