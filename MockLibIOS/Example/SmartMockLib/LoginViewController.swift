//
//  LoginViewController.swift
//  SmartMockLib Example
//
//  The login view can log in the user, when successful, it closes
//

import UIKit

class LoginViewController: UIViewController {

    // --
    // MARK: Members
    // --

    @IBOutlet private var _usernameField: UITextField! = nil
    @IBOutlet private var _passwordField: UITextField! = nil
    @IBOutlet private var _loginButton: UIButton! = nil

    
    // --
    // MARK: Interaction
    // --
    
    @IBAction func loginButtonPressed() {
        _usernameField.isEnabled = false
        _passwordField.isEnabled = false
        _loginButton.isEnabled = false
        Api.authenticationService.login(withUsername: _usernameField.text ?? "", andPassword: _passwordField.text ?? "", success: { user in
            Api.setCurrentUser(user)
            _ = self.navigationController?.popViewController(animated: true)
        }, failure: { apiError in
            self._usernameField.isEnabled = true
            self._passwordField.isEnabled = true
            self._loginButton.isEnabled = true
            UIAlertView(title: "Login failed", message: apiError?.message ?? Api.defaultErrorMessage, delegate: nil, cancelButtonTitle: "OK").show()
        })
    }
    
    @IBAction func toPasswordEditing() {
        _passwordField.becomeFirstResponder()
    }

}
