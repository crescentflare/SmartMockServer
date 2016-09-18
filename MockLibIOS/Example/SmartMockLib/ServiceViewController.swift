//
//  ServiceViewController.swift
//  SmartMockLib Example
//
//  The service view shows details about a single service
//

import UIKit

class ServiceViewController: UIViewController {

    // --
    // MARK: Members
    // --

    @IBOutlet fileprivate var _title: UILabel! = nil
    @IBOutlet fileprivate var _text: UILabel! = nil
    var serviceId: String?

    
    // --
    // MARK: Lifecycle
    // --
    
    override func viewDidLoad() {
        super.viewDidLoad()
        Api.serviceService.loadService( serviceId ?? "", success: { service in
            self._title.text = service.name
            self._text.text = service.serviceDescription
        }, failure: { apiError in
            self._title.text = "Error"
            self._text.text = apiError?.message ?? Api.defaultErrorMessage
        })
    }
    
}
