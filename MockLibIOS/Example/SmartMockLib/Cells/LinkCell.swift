//
//  LinkCell.swift
//  SmartMockLib Example
//
//  A link tableview cell for the main screen
//

import UIKit

protocol LinkCellDelegate: class {
    
    func onLinkClicked(_ link: String)
    
}

class LinkCell: UITableViewCell {

    // --
    // MARK: Members
    // --

    @IBOutlet fileprivate var _button: UIButton! = nil
    fileprivate var _link: String?
    fileprivate weak var _delegate: LinkCellDelegate?
    fileprivate var buttonEventAttached = false


    // --
    // MARK: Properties which can be used in interface builder
    // --

    @IBInspectable var buttonItemText: String = "" {
        didSet {
            buttonText = buttonItemText
        }
    }

    @IBInspectable var linkValue: String = "" {
        didSet {
            link = linkValue
        }
    }
    
    var buttonText: String? {
        set {
            _button!.setTitle(newValue, for: UIControlState())
        }
        get { return _button!.titleLabel!.text }
    }
    
    var link: String? {
        set {
            _link = newValue
        }
        get { return _link }
    }
    
    var delegate: LinkCellDelegate? {
        didSet {
            _delegate = delegate
            if !buttonEventAttached {
                _button.addTarget(self, action: #selector(buttonPressed), for: .touchUpInside)
                buttonEventAttached = true
            }
        }
    }
    
    @objc fileprivate func buttonPressed() {
        if let pressLink = _link {
            _delegate?.onLinkClicked(pressLink)
        }
    }

}
