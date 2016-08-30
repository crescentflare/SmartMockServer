//
//  MainViewController.swift
//  SmartMockLib Example
//
//  The main page showing example mock data with the option to open pages and logging in/out
//

import UIKit

// Type of cells
enum MainViewCellType {
    
    case Header(String)
    case Text(String)
    case Error(String)
    case Link(String, String)
    case UnderlinkSpacer
    
}

// The view controller
class MainViewController: UITableViewController, LinkCellDelegate {

    // --
    // MARK: Members
    // --

    var productError: String?
    var serviceError: String?
    var products: [Product]?
    var services: [Service]?
    var selectedProduct: String?
    var selectedService: String?
    
    
    // --
    // MARK: Lifecycle
    // --

    override func viewDidLoad() {
        super.viewDidLoad()
        self.tableView.rowHeight = UITableViewAutomaticDimension
        self.tableView.estimatedRowHeight = 44
    }
    
    override func viewDidAppear(animated: Bool) {
        refreshData()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
    }
    
    func refreshData() {
        // Fetch products
        Api.productService.loadProducts( { products in
            self.products = products
            self.productError = nil
            self.tableView.reloadData()
        }, failure: { apiError in
            self.products = nil
            self.productError = apiError?.message ?? Api.defaultErrorMessage
            self.tableView.reloadData()
        })
        
        // Fetch services
        Api.serviceService.loadServices( { services in
            self.services = services
            self.serviceError = nil
            self.tableView.reloadData()
        }, failure: { apiError in
            self.services = nil
            self.serviceError = apiError?.message ?? Api.defaultErrorMessage
            self.tableView.reloadData()
        })
    }
    

    // --
    // MARK: Generate data
    // --

    func generateCellData() -> [MainViewCellType] {
        var items: [MainViewCellType] = []
        items.append(.Header("User"))
        if Api.getCurrentUser() != nil {
            items.append(.Text("Logged in with user: \(Api.getCurrentUser()!.username!).\nClick logout below to end the session or to log in as a different user."))
            items.append(.Link("> Logout", "/logout"))
        } else {
            items.append(.Text("The user is not logged in yet, click on login below to show user information and available services."))
            items.append(.Link("> Login", "/login"))
        }
        items.append(.UnderlinkSpacer)
        items.append(.Header("Products"))
        if let errorMessage = self.productError {
            items.append(.Error(errorMessage))
        } else if products != nil {
            if products?.count > 0 {
                items.append(.Text("The following products are available:"))
                for product in products! {
                    items.append(.Link("> \(product.name!)", "/products/\(product.productId!)"))
                }
                items.append(.UnderlinkSpacer)
            } else {
                items.append(.Text("No products are found."))
            }
        } else {
            items.append(.Text("Products not loaded yet, please wait for them to load."))
        }
        items.append(.Header("Services"))
        if let errorMessage = self.serviceError {
            items.append(.Error(errorMessage))
        } else if services != nil {
            if services?.count > 0 {
                items.append(.Text("The following services can be used:"))
                for service in services! {
                    items.append(.Link("> \(service.name!)", "/services/\(service.serviceId!)"))
                }
                items.append(.UnderlinkSpacer)
            } else {
                items.append(.Text("No services are found."))
            }
        } else {
            items.append(.Text("Services not loaded yet, please wait for them to load."))
        }
        return items
    }
    
    
    // --
    // MARK: UITableViewDataSource
    // --

    override func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        let items = generateCellData()
        return items.count
    }
    
    override func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let items = generateCellData()
        switch items[indexPath.row] {
        case .Header(let text):
            let cell: HeaderCell = tableView.dequeueReusableCellWithIdentifier("table_header") as! HeaderCell
            cell.label = text
            return cell
        case .Text(let text):
            let cell: TextCell = tableView.dequeueReusableCellWithIdentifier("table_text") as! TextCell
            cell.label = text
            return cell
        case .Error(let text):
            let cell: ErrorCell = tableView.dequeueReusableCellWithIdentifier("table_error") as! ErrorCell
            cell.label = text
            return cell
        case .Link(let text, let link):
            let cell: LinkCell = tableView.dequeueReusableCellWithIdentifier("table_link") as! LinkCell
            cell.buttonText = text
            cell.link = link
            cell.delegate = self
            return cell
        case .UnderlinkSpacer:
            let cell: UITableViewCell = tableView.dequeueReusableCellWithIdentifier("underlink_spacer")!
            return cell
        }
    }

    
    // --
    // MARK: LinkCellDelegate
    // --
    
    func onLinkClicked(link: String) {
        if link == "/login" {
            performSegueWithIdentifier("showlogin", sender: self)
        } else if link == "/logout" {
            Api.authenticationService.logout()
            tableView.reloadData()
            refreshData()
        } else if link.hasPrefix("/products/") {
            selectedProduct = link.stringByReplacingOccurrencesOfString("/products/", withString: "")
            performSegueWithIdentifier("showproductdetails", sender: self)
        } else if link.hasPrefix("/services/") {
            selectedService = link.stringByReplacingOccurrencesOfString("/services/", withString: "")
            performSegueWithIdentifier("showservicedetails", sender: self)
        }
    }
    
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        if segue.identifier == "showproductdetails" {
            if let productViewController = segue.destinationViewController as? ProductViewController {
                productViewController.productId = selectedProduct
            }
        } else if segue.identifier == "showservicedetails" {
            if let serviceViewController = segue.destinationViewController as? ServiceViewController {
                serviceViewController.serviceId = selectedService
            }
        }
    }

}
