//
//  TextCell.swift
//  SmartMockLib Example
//
//  A text tableview cell for the main screen
//

import UIKit

class TextCell: UITableViewCell {

    // --
    // MARK: Members
    // --

    @IBOutlet private var _label: UILabel! = nil


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

