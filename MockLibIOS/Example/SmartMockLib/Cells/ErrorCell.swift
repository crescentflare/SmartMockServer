//
//  ErrorCell.swift
//  SmartMockLib Example
//
//  An error text tableview cell for the main screen
//

import UIKit

class ErrorCell: UITableViewCell {

    // --
    // MARK: Members
    // --

    @IBOutlet fileprivate var _label: UILabel! = nil


    // --
    // MARK: Properties which can be used in interface builder
    // --

    @IBInspectable var labelText: String = "" {
        didSet {
            label = labelText
        }
    }

    var label: String? {
        set {
            _label!.text = newValue
        }
        get { return _label!.text }
    }
    
}

