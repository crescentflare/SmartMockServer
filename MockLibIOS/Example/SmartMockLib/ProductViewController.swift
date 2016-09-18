//
//  ProductViewController.swift
//  SmartMockLib Example
//
//  The product view shows details about a single product
//

import UIKit
import AlamofireImage

class ProductViewController: UIViewController {

    // --
    // MARK: Members
    // --

    @IBOutlet fileprivate var _image: UIImageView! = nil
    @IBOutlet fileprivate var _title: UILabel! = nil
    @IBOutlet fileprivate var _text: UILabel! = nil
    var productId: String?

    
    // --
    // MARK: Lifecycle
    // --
    
    override func viewDidLoad() {
        super.viewDidLoad()
        Api.productService.loadProduct( productId ?? "", success: { product in
            let URL = Foundation.URL(string: Api.baseUrl + product.image!)!
            self._image.setMockableImageUrl(URL)
            self._title.text = product.name
            self._text.text = product.productDescription
        }, failure: { apiError in
            self._title.text = "Error"
            self._text.text = apiError?.message ?? Api.defaultErrorMessage
        })
    }
    
}
