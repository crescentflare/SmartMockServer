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
import SmartMockLib

class Api {

    static let mocked = true
    static let baseUrl = mocked ? "bundle:///EndPoints" : "http://localhost:2143"
    
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
    
    static func clearCookies() {
        let storage = NSHTTPCookieStorage.sharedHTTPCookieStorage()
        if let cookies = storage.cookies {
            for cookie in cookies {
                storage.deleteCookie(cookie)
            }
        }
        NSUserDefaults.standardUserDefaults().synchronize()
        SmartMockServer.sharedServer.clearCookies()
    }
    
}

class MockableAlamofire {
    
    private let baseUrl: String
    
    init(baseUrl: String) {
        self.baseUrl = baseUrl
    }
    
    func request(method: Alamofire.Method, _ URLString: URLStringConvertible, parameters: [String: AnyObject]? = nil, encoding: ParameterEncoding = .URL, headers: [String: String]? = nil) -> MockedRequest {
        var path = baseUrl
        var addPath = ""
        if baseUrl.substringFromIndex(baseUrl.endIndex.advancedBy(-1)) != "/" {
            path += "/"
        }
        if URLString.URLString.substringToIndex(URLString.URLString.startIndex.advancedBy(1)) == "/" {
            addPath = URLString.URLString.substringFromIndex(URLString.URLString.startIndex.advancedBy(1))
        } else {
            addPath = URLString.URLString
        }
        path += addPath
        
        if (path.rangeOfString("http://") == nil && path.rangeOfString("https://") == nil) {
            var body = ""
            SmartMockServer.sharedServer.enableCookies(true)
            if parameters != nil {
                var firstToAdd = true
                if method == .GET {
                    for (key, value) in parameters! {
                        addPath += firstToAdd ? "?" : "&"
                        addPath += SmartMockStringUtility.urlEncode(key) + "=" + SmartMockStringUtility.urlEncode(value as? String ?? "")
                        firstToAdd = false
                    }
                } else {
                    for (key, value) in parameters! {
                        if !firstToAdd {
                            body += "&"
                        }
                        body += SmartMockStringUtility.urlEncode(key) + "=" + SmartMockStringUtility.urlEncode(value as? String ?? "")
                        firstToAdd = false
                    }
                }
            }
            var mockHeaders: SmartMockHeaders?
            if headers != nil {
                mockHeaders = SmartMockHeaders.createFromFlattenedMap(headers!)
            }
            return MockedRequest(mockMethod: method.rawValue, mockRootPath: baseUrl, mockRequestPath: addPath, mockRequestBody: body, mockHeaders: mockHeaders)
        }

        let request = Alamofire.request(method, path, parameters: parameters, encoding: encoding, headers: headers)
        return MockedRequest(unmockedRequest: request)
    }

}

class MockedRequest {
    
    var unmockedRequest: Request?
    var mockMethod: String
    var mockRootPath: String
    var mockRequestPath: String
    var mockRequestBody: String?
    var mockRequestHeaders: SmartMockHeaders?
    
    init(unmockedRequest: Request) {
        self.unmockedRequest = unmockedRequest
        mockMethod = ""
        mockRootPath = ""
        mockRequestPath = ""
    }
    
    init(mockMethod: String, mockRootPath: String, mockRequestPath: String, mockRequestBody: String?, mockHeaders: SmartMockHeaders?) {
        self.mockMethod = mockMethod
        self.mockRootPath = mockRootPath
        self.mockRequestPath = mockRequestPath
        self.mockRequestBody = mockRequestBody
        self.mockRequestHeaders = mockHeaders
    }

    func responseObject<T: Mappable>(queue queue: dispatch_queue_t? = nil, keyPath: String? = nil, mapToObject object: T? = nil, context: MapContext? = nil, completionHandler: Response<T, NSError> -> Void) {
        if unmockedRequest == nil {
            SmartMockServer.sharedServer.obtainResponse(mockMethod, rootPath: mockRootPath, requestPath: mockRequestPath, requestBody: mockRequestBody, requestHeaders: mockRequestHeaders, completion: { response in
                let urlRequest = NSURLRequest(URL: NSURL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath))
                let urlResponse = NSHTTPURLResponse(URL: NSURL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath), statusCode: response.code, HTTPVersion: "1.1", headerFields: response.headers.getFlattenedHeaderMap())
                completionHandler(self.mockedSerializedResult(Request.ObjectMapperSerializer(keyPath, context: context), request: urlRequest, response: urlResponse, data: response.body.getByteData(), error: nil))
            })
            return
        }
        unmockedRequest!.response(queue: queue, responseSerializer: Request.ObjectMapperSerializer(keyPath, mapToObject: object, context: context), completionHandler: completionHandler)
    }

    func responseArray<T: Mappable>(queue queue: dispatch_queue_t? = nil, keyPath: String? = nil, context: MapContext? = nil, completionHandler: Response<[T], NSError> -> Void) {
        if unmockedRequest == nil {
            SmartMockServer.sharedServer.obtainResponse(mockMethod, rootPath: mockRootPath, requestPath: mockRequestPath, requestBody: mockRequestBody, requestHeaders: mockRequestHeaders, completion: { response in
                let urlRequest = NSURLRequest(URL: NSURL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath))
                let urlResponse = NSHTTPURLResponse(URL: NSURL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath), statusCode: response.code, HTTPVersion: "1.1", headerFields: response.headers.getFlattenedHeaderMap())
                completionHandler(self.mockedSerializedResult(Request.ObjectMapperArraySerializer(keyPath, context: context), request: urlRequest, response: urlResponse, data: response.body.getByteData(), error: nil))
            })
            return
        }
        unmockedRequest!.response(queue: queue, responseSerializer: Request.ObjectMapperArraySerializer(keyPath, context: context), completionHandler: completionHandler)
    }
    
    func mockedSerializedResult<T: ResponseSerializerType>(responseSerializer: T, request: NSURLRequest, response: NSHTTPURLResponse?, data: NSData?, error: NSError?) -> Response<T.SerializedObject, T.ErrorObject> {
        let result = responseSerializer.serializeResponse(
            request,
            response,
            data,
            error
        )
        let response = Response<T.SerializedObject, T.ErrorObject>(
            request: request,
            response: response,
            data: data,
            result: result
        )
        return response
    }

}
