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
    
    func loadProducts(success: @escaping ([Product]) -> Void, failure: @escaping (ApiError?) -> Void) {
        mockableAlamofire.request("products").responseArray { (response: DataResponse<[Product]>) in
            if let productArray = response.result.value {
                if response.response?.statusCode ?? 0 >= 200 && response.response?.statusCode ?? 0 < 300 {
                    success(productArray)
                    return
                }
            }
            if response.data != nil {
                failure(Mapper<ApiError>().map(JSONString: String(data: response.data!, encoding: String.Encoding.utf8) ?? "{}"))
            } else {
                failure(nil)
            }
        }
    }
    
    func loadProduct(productId: String, success: @escaping (Product) -> Void, failure: @escaping (ApiError?) -> Void) {
        mockableAlamofire.request("products/" + productId).responseObject { (response: DataResponse<Product>) in
            if let product = response.result.value {
                if response.response?.statusCode ?? 0 >= 200 && response.response?.statusCode ?? 0 < 300 {
                    success(product)
                    return
                }
            }
            if response.data != nil {
                failure(Mapper<ApiError>().map(JSONString: String(data: response.data!, encoding: String.Encoding.utf8) ?? "{}"))
            } else {
                failure(nil)
            }
        }
    }

}
