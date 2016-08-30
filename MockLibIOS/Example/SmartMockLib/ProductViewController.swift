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

    @IBOutlet private var _image: UIImageView! = nil
    @IBOutlet private var _title: UILabel! = nil
    @IBOutlet private var _text: UILabel! = nil
    var productId: String?

    
    // --
    // MARK: Lifecycle
    // --
    
    override func viewDidLoad() {
        super.viewDidLoad()
        Api.productService.loadProduct( productId ?? "", success: { product in
            let URL = NSURL(string: Api.baseUrl + product.image!)!
            self._image.af_setImageWithURL(URL)
            self._title.text = product.name
            self._text.text = product.productDescription
        }, failure: { apiError in
            self._title.text = "Error"
            self._text.text = apiError?.message ?? Api.defaultErrorMessage
        })
    }
    
}
