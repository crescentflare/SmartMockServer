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
    
    func loadServices(success: [Service] -> Void, failure: ApiError? -> Void) {
        mockableAlamofire.request(.GET, "services").responseArray { (response: Response<[Service], NSError>) in
            if let serviceArray = response.result.value {
                if response.response?.statusCode >= 200 && response.response?.statusCode < 300 {
                    success(serviceArray)
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
    
    func loadService(serviceId: String, success: Service -> Void, failure: ApiError? -> Void) {
        mockableAlamofire.request(.GET, "services/" + serviceId).responseObject { (response: Response<Service, NSError>) in
            if let service = response.result.value {
                if response.response?.statusCode >= 200 && response.response?.statusCode < 300 {
                    success(service)
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
