//
//  MainViewController.swift
//  SmartMockLib Example
//
//  The main page showing example mock data with the option to open pages and logging in/out
//

import UIKit

// Type of cells
enum MainViewCellType {
    
    case header(String)
    case text(String)
    case error(String)
    case link(String, String)
    case underlinkSpacer
    
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
    
    override func viewDidAppear(_ animated: Bool) {
        refreshData()
    }

    func refreshData() {
        // Fetch products
        Api.productService.loadProducts(success: { products in
            self.products = products
            self.productError = nil
            self.tableView.reloadData()
        }, failure: { apiError in
            self.products = nil
            self.productError = apiError?.message ?? Api.defaultErrorMessage
            self.tableView.reloadData()
        })
        
        // Fetch services
        Api.serviceService.loadServices(success: { services in
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
        items.append(.header("User"))
        if Api.getCurrentUser() != nil {
            items.append(.text("Logged in with user: \(Api.getCurrentUser()!.username!).\nClick logout below to end the session or to log in as a different user."))
            items.append(.link("> Logout", "/logout"))
        } else {
            items.append(.text("The user is not logged in yet, click on login below to show user information and available services."))
            items.append(.link("> Login", "/login"))
        }
        items.append(.underlinkSpacer)
        items.append(.header("Products"))
        if let errorMessage = self.productError {
            items.append(.error(errorMessage))
        } else if products != nil {
            if products?.count ?? 0 > 0 {
                items.append(.text("The following products are available:"))
                for product in products! {
                    items.append(.link("> \(product.name!)", "/products/\(product.productId!)"))
                }
                items.append(.underlinkSpacer)
            } else {
                items.append(.text("No products are found."))
            }
        } else {
            items.append(.text("Products not loaded yet, please wait for them to load."))
        }
        items.append(.header("Services"))
        if let errorMessage = self.serviceError {
            items.append(.error(errorMessage))
        } else if services != nil {
            if services?.count ?? 0 > 0 {
                items.append(.text("The following services can be used:"))
                for service in services! {
                    items.append(.link("> \(service.name!)", "/services/\(service.serviceId!)"))
                }
                items.append(.underlinkSpacer)
            } else {
                items.append(.text("No services are found."))
            }
        } else {
            items.append(.text("Services not loaded yet, please wait for them to load."))
        }
        return items
    }
    
    
    // --
    // MARK: UITableViewDataSource
    // --

    override func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        let items = generateCellData()
        return items.count
    }
    
    override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let items = generateCellData()
        switch items[(indexPath as NSIndexPath).row] {
        case .header(let text):
            let cell: HeaderCell = tableView.dequeueReusableCell(withIdentifier: "table_header") as! HeaderCell
            cell.label = text
            return cell
        case .text(let text):
            let cell: TextCell = tableView.dequeueReusableCell(withIdentifier: "table_text") as! TextCell
            cell.label = text
            return cell
        case .error(let text):
            let cell: ErrorCell = tableView.dequeueReusableCell(withIdentifier: "table_error") as! ErrorCell
            cell.label = text
            return cell
        case .link(let text, let link):
            let cell: LinkCell = tableView.dequeueReusableCell(withIdentifier: "table_link") as! LinkCell
            cell.buttonText = text
            cell.link = link
            cell.delegate = self
            return cell
        case .underlinkSpacer:
            let cell: UITableViewCell = tableView.dequeueReusableCell(withIdentifier: "underlink_spacer")!
            return cell
        }
    }

    
    // --
    // MARK: LinkCellDelegate
    // --
    
    func onLinkClicked(link: String) {
        if link == "/login" {
            performSegue(withIdentifier: "showlogin", sender: self)
        } else if link == "/logout" {
            Api.authenticationService.logout()
            tableView.reloadData()
            refreshData()
        } else if link.hasPrefix("/products/") {
            selectedProduct = link.replacingOccurrences(of: "/products/", with: "")
            performSegue(withIdentifier: "showproductdetails", sender: self)
        } else if link.hasPrefix("/services/") {
            selectedService = link.replacingOccurrences(of: "/services/", with: "")
            performSegue(withIdentifier: "showservicedetails", sender: self)
        }
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "showproductdetails" {
            if let productViewController = segue.destination as? ProductViewController {
                productViewController.productId = selectedProduct
            }
        } else if segue.identifier == "showservicedetails" {
            if let serviceViewController = segue.destination as? ServiceViewController {
                serviceViewController.serviceId = selectedService
            }
        }
    }

}
