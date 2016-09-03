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
        _usernameField.enabled = false
        _passwordField.enabled = false
        _loginButton.enabled = false
        Api.authenticationService.login( _usernameField.text ?? "", password: _passwordField.text ?? "", success: { user in
            Api.setCurrentUser(user)
            self.navigationController?.popViewControllerAnimated(true)
        }, failure: { apiError in
            self._usernameField.enabled = true
            self._passwordField.enabled = true
            self._loginButton.enabled = true
            UIAlertView(title: "Login failed", message: apiError?.message ?? Api.defaultErrorMessage, delegate: nil, cancelButtonTitle: "OK").show()
        })
    }
    
    @IBAction func toPasswordEditing() {
        _passwordField.becomeFirstResponder()
    }

}
