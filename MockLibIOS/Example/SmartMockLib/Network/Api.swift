//
//  API.swift
//  SmartMockLib Example
//
//  Provides the main API configuration/integration
//

import UIKit
import Alamofire
import ObjectMapper
import AlamofireObjectMapper

class Api {

    static let baseUrl = "http://localhost:2143"
    
    static let defaultErrorMessage = "A technical error occurred, please try again."
    
    static let authenticationService = AuthenticationService(mockableAlamofire: MockableAlamofire(baseUrl: baseUrl))
    static let productService = ProductService(mockableAlamofire: MockableAlamofire(baseUrl: baseUrl))
    static let serviceService = ServiceService(mockableAlamofire: MockableAlamofire(baseUrl: baseUrl))
    
    private static var currentUser: User?
    
    static func getCurrentUser() -> User? {
        return currentUser
    }

    static func setCurrentUser(user: User?) {
        currentUser = user
    }
    
}

class MockableAlamofire {
    
    private let baseUrl: String
    
    init(baseUrl: String) {
        self.baseUrl = baseUrl
    }
    
    func request(method: Alamofire.Method, _ URLString: URLStringConvertible, parameters: [String: AnyObject]? = nil, encoding: ParameterEncoding = .URL, headers: [String: String]? = nil) -> MockedRequest {
        var path = baseUrl
        if baseUrl.substringFromIndex(baseUrl.endIndex.advancedBy(-1)) != "/" {
            path += "/"
        }
        if URLString.URLString.substringToIndex(URLString.URLString.startIndex.advancedBy(1)) == "/" {
            path += URLString.URLString.substringFromIndex(URLString.URLString.startIndex.advancedBy(1))
        } else {
            path += URLString.URLString
        }
        
        if (path.rangeOfString("http://") == nil && path.rangeOfString("https://") == nil) {
            // TODO: mock integration
        }

        let request = Alamofire.request(method, path, parameters: parameters, encoding: encoding, headers: headers)
        return MockedRequest(unmockedRequest: request)
    }

}

class MockedRequest {
    
    let unmockedRequest: Request?
    
    init(unmockedRequest: Request) {
        self.unmockedRequest = unmockedRequest
    }

    func responseObject<T: Mappable>(queue queue: dispatch_queue_t? = nil, keyPath: String? = nil, mapToObject object: T? = nil, context: MapContext? = nil, completionHandler: Response<T, NSError> -> Void) -> Request {
        if unmockedRequest == nil {
            // TODO: mock integration
        }
        return unmockedRequest!.response(queue: queue, responseSerializer: Request.ObjectMapperSerializer(keyPath, mapToObject: object, context: context), completionHandler: completionHandler)
    }

    func responseArray<T: Mappable>(queue queue: dispatch_queue_t? = nil, keyPath: String? = nil, context: MapContext? = nil, completionHandler: Response<[T], NSError> -> Void) -> Request {
        if unmockedRequest == nil {
            // TODO: mock integration
        }
        return unmockedRequest!.response(queue: queue, responseSerializer: Request.ObjectMapperArraySerializer(keyPath, context: context), completionHandler: completionHandler)
    }

}
