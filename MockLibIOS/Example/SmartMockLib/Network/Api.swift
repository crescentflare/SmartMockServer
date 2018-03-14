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

    static func setCurrentUser(_ user: User?) {
        currentUser = user
    }
    
    static func clearCookies() {
        let storage = HTTPCookieStorage.shared
        if let cookies = storage.cookies {
            for cookie in cookies {
                storage.deleteCookie(cookie)
            }
        }
        UserDefaults.standard.synchronize()
        SmartMockServer.shared.clearCookies()
    }
    
}

class MockableAlamofire {
    
    private let baseUrl: String
    
    init(baseUrl: String) {
        self.baseUrl = baseUrl
    }
    
    func request(_ url: URLConvertible, method: HTTPMethod = .get, parameters: Parameters? = nil, encoding: ParameterEncoding = URLEncoding.default, headers: HTTPHeaders? = nil) -> MockedRequest {
        var path = baseUrl
        var addPath = ""
        if baseUrl[baseUrl.index(baseUrl.endIndex, offsetBy: -1)...] != "/" {
            path += "/"
        }
        if let urlString = try? url.asURL().absoluteString {
            if urlString[..<urlString.index(urlString.startIndex, offsetBy: 1)] == "/" {
                addPath = String(urlString[urlString.index(urlString.startIndex, offsetBy: 1)...])
            } else {
                addPath = urlString
            }
        }
        path += addPath
        
        if (path.range(of: "http://") == nil && path.range(of: "https://") == nil) {
            var body = ""
            SmartMockServer.shared.enableCookies(true)
            if parameters != nil {
                var firstToAdd = true
                if method == .get {
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
                mockHeaders = SmartMockHeaders.makeFromFlattenedHeaderMap(headers!)
            }
            return MockedRequest(mockMethod: method.rawValue, mockRootPath: baseUrl, mockRequestPath: addPath, mockRequestBody: body, mockHeaders: mockHeaders)
        }

        let request = Alamofire.request(path, method: method, parameters: parameters, encoding: encoding, headers: headers)
        return MockedRequest(unmockedRequest: request)
    }

}

class MockedRequest {
    
    var unmockedRequest: DataRequest?
    var mockMethod: String
    var mockRootPath: String
    var mockRequestPath: String
    var mockRequestBody: String?
    var mockRequestHeaders: SmartMockHeaders?
    
    init(unmockedRequest: DataRequest) {
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
    
    func responseObject<T: BaseMappable>(queue: DispatchQueue? = nil, keyPath: String? = nil, mapToObject object: T? = nil, context: MapContext? = nil, completionHandler: @escaping (Alamofire.DataResponse<T>) -> Swift.Void) {
        if unmockedRequest == nil {
            SmartMockServer.shared.obtainResponse(method: mockMethod, rootPath: mockRootPath, requestPath: mockRequestPath, requestBody: mockRequestBody, requestHeaders: mockRequestHeaders, completion: { response in
                let urlRequest = URLRequest(url: URL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath))
                let urlResponse = HTTPURLResponse(url: URL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath), statusCode: response.code, httpVersion: "1.1", headerFields: response.headers.getFlattenedHeaderMap())
                completionHandler(self.mockedSerializedResult(DataRequest.ObjectMapperSerializer(keyPath, context: context), request: urlRequest, response: urlResponse, data: response.body.getByteData(), error: nil))
            })
            return
        }
        unmockedRequest!.responseObject(queue: queue, keyPath: keyPath, mapToObject: object, context: context, completionHandler: completionHandler)
    }

    func responseArray<T: BaseMappable>(queue: DispatchQueue? = nil, keyPath: String? = nil, context: MapContext? = nil, completionHandler: @escaping (Alamofire.DataResponse<[T]>) -> Swift.Void) {
        if unmockedRequest == nil {
            SmartMockServer.shared.obtainResponse(method: mockMethod, rootPath: mockRootPath, requestPath: mockRequestPath, requestBody: mockRequestBody, requestHeaders: mockRequestHeaders, completion: { response in
                let urlRequest = URLRequest(url: URL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath))
                let urlResponse = HTTPURLResponse(url: URL(fileURLWithPath: self.mockRootPath + "/" + self.mockRequestPath), statusCode: response.code, httpVersion: "1.1", headerFields: response.headers.getFlattenedHeaderMap())
                completionHandler(self.mockedSerializedArrayResult(DataRequest.ObjectMapperArraySerializer(keyPath, context: context), request: urlRequest, response: urlResponse, data: response.body.getByteData(), error: nil))
            })
            return
        }
        unmockedRequest!.responseArray(queue: queue, keyPath: keyPath, context: context, completionHandler: completionHandler)
    }
    
    func mockedSerializedResult<T: BaseMappable>(_ responseSerializer: Alamofire.DataResponseSerializer<T>, request: URLRequest, response: HTTPURLResponse?, data: Data?, error: NSError?) -> Alamofire.DataResponse<T> {
        let result = responseSerializer.serializeResponse(
            request,
            response,
            data,
            error
        )
        let response = DataResponse<T>(
            request: request,
            response: response,
            data: data,
            result: result
        )
        return response
    }

    func mockedSerializedArrayResult<T: BaseMappable>(_ responseSerializer: Alamofire.DataResponseSerializer<[T]>, request: URLRequest, response: HTTPURLResponse?, data: Data?, error: NSError?) -> Alamofire.DataResponse<[T]> {
        let result = responseSerializer.serializeResponse(
            request,
            response,
            data,
            error
        )
        let response = DataResponse<[T]>(
            request: request,
            response: response,
            data: data,
            result: result
        )
        return response
    }

}

extension UIImageView {
    
    func setMockableImageUrl(_ URL: Foundation.URL) {
        if URL.scheme == "http" || URL.scheme == "https" {
            af_setImage(withURL: URL)
        } else {
            image = UIImage(contentsOfFile: getRawPath(URL.absoluteString))
        }
    }
    
    fileprivate func getRawPath(_ path: String) -> String {
        if path.hasPrefix("bundle:///") {
            return (Bundle.main.resourcePath ?? "") + "/" + path.replacingOccurrences(of: "bundle:///", with: "")
        } else if path.hasPrefix("document:///") {
            let paths = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)
            let documentPath = paths[0]
            return documentPath + "/" + path.replacingOccurrences(of: "document:///", with: "")
        }
        return path.replacingOccurrences(of: "file:///", with: "/")
    }
    
}
