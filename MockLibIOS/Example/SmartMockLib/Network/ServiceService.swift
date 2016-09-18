//
//  ServiceService.swift
//  SmartMockLib Example
//
//  Provides the service API integration
//

import UIKit
import Alamofire
import ObjectMapper

class ServiceService {

    let mockableAlamofire: MockableAlamofire
    
    init(mockableAlamofire: MockableAlamofire) {
        self.mockableAlamofire = mockableAlamofire
    }
    
    func loadServices(_ success: @escaping ([Service]) -> Void, failure: @escaping (ApiError?) -> Void) {
        mockableAlamofire.request("services").responseArray { (response: DataResponse<[Service]>) in
            if let serviceArray = response.result.value {
                if response.response?.statusCode ?? 0 >= 200 && response.response?.statusCode ?? 0 < 300 {
                    success(serviceArray)
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
    
    func loadService(_ serviceId: String, success: @escaping (Service) -> Void, failure: @escaping (ApiError?) -> Void) {
        mockableAlamofire.request("services/" + serviceId).responseObject { (response: DataResponse<Service>) in
            if let service = response.result.value {
                if response.response?.statusCode ?? 0 >= 200 && response.response?.statusCode ?? 0 < 300 {
                    success(service)
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
