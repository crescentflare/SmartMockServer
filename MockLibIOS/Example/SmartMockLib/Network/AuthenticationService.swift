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
    
    func login(username: String, password: String, success: User -> Void, failure: ApiError? -> Void) {
        mockableAlamofire.request(.POST, "login", parameters: [ "username": username, "password": password ]).responseObject { (response: Response<User, NSError>) in
            if let user = response.result.value {
                if response.response?.statusCode >= 200 && response.response?.statusCode < 300 {
                    success(user)
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
    
    func logout() {
        mockableAlamofire.request(.POST, "logout").responseObject { (response: Response<User, NSError>) in } // Don't care about the result in the callback
        Api.setCurrentUser(nil)
        Api.clearCookies()
    }
    
}
