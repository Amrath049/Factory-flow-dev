Design a clean and simple **web dashboard UI** for a **Small Factory Order & Inventory Management System** used by small manufacturing businesses (example: areca leaf plate factories). The system is designed for non-technical factory owners, so the interface must be minimal, clear, and easy to use.

The design should follow a modern SaaS dashboard style similar to products built in **Figma**, with a light theme, clear typography, and simple tables and forms.

PHASE 1 SCOPE
This version focuses only on **Orders and Inventory Management**.

AUTHENTICATION
There is no signup flow. Users are created from the backend.

Design:
Login Page with:

* Email
* Password
* Login button

After login redirect to the dashboard.

SIDEBAR NAVIGATION
Left sidebar navigation with icons:

* Dashboard
* Customers
* Products
* Orders
* Inventory

Top navbar should contain:

* Page title
* Search bar
* Profile dropdown

DASHBOARD PAGE
Show summary metrics using cards:

* Total Customers
* Total Products
* Total Orders
* Orders in Production
* Available Stock
* Production Today

Below the cards show:

Recent Orders Table:

* Order ID
* Customer Name
* Delivery Date
* Status

Stock Overview:
Show each product with:

* Available Stock
* Booked Quantity
* Daily Production

CUSTOMERS MODULE

Customers List Page:
Table with columns:

* Customer Name
* Phone
* City
* Total Orders
* Actions (View / Edit)

Button: "Add Customer"

Create Customer Form:
Fields:

* Customer Name
* Phone Number
* Email (optional)

Address section:

* Address Line
* City
* State
* Pincode

Allow adding multiple addresses.

Customer Profile Page:
Show customer details with sections:

Customer Info:

* Name
* Phone
* Email

Addresses:
List of addresses with edit option.

Order History:
Table with:

* Order ID
* Order Date
* Delivery Date
* Status
* Total Products

PRODUCTS MODULE

Products List Page:
Table with:

* Product Name
* Created Date
* Actions

Button: "Add Product"

Create Product Form:
Field:

* Product Name

Keep the form simple because pricing will be handled later.

ORDERS MODULE

Orders List Page:
Table with:

* Order ID
* Customer Name
* Order Date
* Delivery Date
* Products Count
* Status
* Actions (View)

Button: "Create Order"

Create Order Flow:

Step 1: Select Customer
Dropdown or searchable list of customers.

Step 2: Select Address
Show addresses saved for the customer.
Option to add a new address.

Step 3: Add Products
Select predefined products.

Allow adding multiple products with:

* Product name
* Quantity

Step 4: Delivery Details
Fields:

* Delivery Date
* Notes (optional)

Step 5: Review and Create Order

ORDER DETAILS PAGE

Show:

Order Info:

* Customer Name
* Delivery Address
* Delivery Date
* Order Status

Products Ordered:
Table showing:

* Product Name
* Quantity

INVENTORY MODULE

Inventory Overview Page:

Table with:

* Product Name
* Available Stock
* Booked Stock
* Free Stock
* Daily Production Rate

Button: "Update Stock"

Stock Entry Form:

Fields:

* Product
* Current Available Stock

PRODUCTION TRACKING

Daily Production Entry:

Form with:

* Product
* Quantity Produced
* Production Date

Production History Table:

* Product
* Quantity
* Date

VISUAL STYLE

* Clean SaaS dashboard layout
* Card-based metrics
* Minimal icons
* Simple forms
* Clean tables
* Status badges for orders (Pending, In Production, Delivered)

The UI should prioritize simplicity so that a factory owner with minimal technical knowledge can easily manage orders, customers, and inventory.
