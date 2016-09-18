//
//  AuthenticationService.swift
//  SmartMockLib Example
//
//  Provides the authentication API integration
//

import UIKit
import Alamofire
import ObjectMapper

class AuthenticationService {

    let mockableAlamofire: MockableAlamofire
    
    init(mockableAlamofire: MockableAlamofire) {
        self.mockableAlamofire = mockableAlamofire
    }
    
    func login(_ username: String, password: String, success: @escaping (User) -> Void, failure: @escaping (ApiError?) -> Void) {
        mockableAlamofire.request("login", method: .post, parameters: [ "username": username, "password": password ]).responseObject { (response: DataResponse<User>) in
            if let user = response.result.value {
                if response.response?.statusCode ?? 0 >= 200 && response.response?.statusCode ?? 0 < 300 {
                    success(user)
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
    
    func logout() {
        mockableAlamofire.request("logout", method: .post).responseObject { (response: DataResponse<User>) in } // Don't care about the result in the callback
        Api.setCurrentUser(nil)
        Api.clearCookies()
    }
    
}
