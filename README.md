# Automated Inventory Control System

A Google Apps Script-based inventory management system built with Google Sheets and a web-based interface.

The system allows users to record daily inventory consumption and purchases while automatically updating stock levels, maintaining transaction logs, generating low-stock information, and sending a daily inventory report by email.

---

## Features

- Web-based inventory management interface
- Google Sheets used as the inventory database
- Record daily inventory consumption
- Record inventory purchases
- Automatically update:
  - Total Bought
  - Total Consumed
  - Total Left
- Minimum stock threshold monitoring
- Low-stock identification
- Automatic Consumption Log
- Automatic Purchase Log
- Daily inventory report by email
- User and company profile configuration
- Undo the most recently submitted inventory report
- Input validation to prevent invalid quantities
- Prevents consumption of more stock than currently available
- Responsive interface for desktop and mobile devices
- Uses Google Apps Script and Google Sheets without requiring a separate database

---

## Google Sheet Structure

The main inventory sheet should contain the following columns in Row 1:

| Column | Header | Description |
|---|---|---|
| A | Sr. No | Inventory item serial number |
| B | Item Name | Name of the inventory item |
| C | UOM | Unit of measurement |
| D | Total Bought | Total quantity purchased |
| E | Total Consumed | Total quantity consumed |
| F | Total Left | Current remaining quantity |
| G | Min Threshold | Minimum acceptable stock level |

Inventory data should begin from Row 2.

Example:

| Sr. No | Item Name | UOM | Total Bought | Total Consumed | Total Left | Min Threshold |
|---|---|---|---:|---:|---:|---:|
| 1 | Item A | Units | 100 | 30 | 70 | 20 |
| 2 | Item B | Boxes | 50 | 35 | 15 | 10 |

---

## Project Files

The project contains four main files:

### `Code.gs`

Contains the Google Apps Script backend.

It handles:

- Web app deployment
- Reading inventory data
- Updating inventory quantities
- User profile management
- Inventory validation
- Consumption logging
- Purchase logging
- Undo functionality
- Low-stock detection
- Email report generation
- Utility functions

### `InventoryForm.html`

Contains the web application interface.

It handles:

- Inventory display
- Consumption selection
- Purchase selection
- Quantity input
- Profile editing
- Form validation
- Navigation between sections
- Success and error messages
- Communication with the Apps Script backend

### `README.md`

Project documentation and setup instructions.

### `.gitignore`

Used to prevent unnecessary or sensitive local files from being included in the Git repository.

---

## Setup

### 1. Create a Google Spreadsheet

Create a new Google Spreadsheet to use as the inventory database.

Rename the main worksheet to:

`Sheet1`

Or update the `MAIN_SHEET_NAME` value in `Code.gs` if a different sheet name is required.

---

### 2. Create the Required Inventory Columns

In Row 1, create the following headers:

~~~text
Sr. No
Item Name
UOM
Total Bought
Total Consumed
Total Left
Min Threshold
~~~

Add inventory items starting from Row 2.

---

### 3. Open Google Apps Script

From the Google Spreadsheet, open:

**Extensions → Apps Script**

---

### 4. Add `Code.gs`

Replace the default Apps Script code with the contents of `Code.gs` from this repository.

---

### 5. Add `InventoryForm.html`

In the Apps Script project, create an HTML file named:

`InventoryForm`

Then replace its contents with the contents of `InventoryForm.html` from this repository.

---

### 6. Deploy the Web App

In Google Apps Script:

**Deploy → New deployment**

Select:

**Web app**

Configure the deployment according to the intended users and access requirements.

Then deploy the application.

---

### 7. Grant Permissions

Google Apps Script may request permission to access:

- Google Sheets
- Google account information
- Email services

Review and authorize the required permissions.

---

### 8. Open the Web App

After deployment, open the generated web app URL.

The application will load inventory data directly from the connected Google Spreadsheet.

---

## How It Works

### Inventory Consumption

1. Select the inventory items used during the day.
2. Enter the quantity consumed.
3. The system validates that the quantity does not exceed the available stock.
4. The inventory is updated automatically.
5. The transaction is recorded in the Consumption Log.

### Inventory Purchases

1. Enable the purchase option.
2. Select the purchased inventory items.
3. Enter the purchased quantities.
4. The system increases the Total Bought and Total Left values.
5. The transaction is recorded in the Purchase Log.

### Low Stock

Each inventory item is compared against its minimum threshold.

When:

`Total Left <= Min Threshold`

the item is identified as low stock.

The current low-stock inventory is also included in the generated daily report.

---

## Transaction Logs

The system automatically creates two additional Google Sheets when required.

### Consumption Log

Records:

- Timestamp
- Date
- Company
- User
- Email
- Sr. No
- Item Name
- UOM
- Quantity Used

### Purchase Log

Records:

- Timestamp
- Date
- Company
- User
- Email
- Sr. No
- Item Name
- UOM
- Quantity Purchased

---

## Undo

The application includes an **Undo Last Submitted Report** function.

The most recent submission stores the information required to reverse its inventory changes.

Undoing a report:

- Reverses the consumption changes
- Reverses the purchase changes
- Restores the previous inventory quantities
- Removes the corresponding latest log entries

Only the most recent submitted report can be undone.

---

## User Profile

The application allows the user to configure:

- Company Name
- User Name

These details are stored using Google Apps Script User Properties and are used in the generated inventory report and transaction logs.

---

## Technology Stack

- Google Apps Script
- JavaScript
- HTML
- CSS
- Google Sheets
- Google Apps Script HTML Service
- Google Apps Script Mail Service

---

## Project Structure

~~~text
automated-inventory-control-system/
│
├── Code.gs
├── InventoryForm.html
├── README.md
└── .gitignore
~~~

---

## Important Notes

This project is intended as a demonstration and template implementation.

Before using it with sensitive or production inventory data, configure appropriate:

- Authentication
- Web app access permissions
- Google Sheet permissions
- Data access controls
- User authorization
- Data protection policies

The Google Spreadsheet acts as the application's primary data store, so access to the spreadsheet should be carefully controlled.

---

## License

This project is provided for demonstration and educational purposes.

You are free to modify and adapt the implementation for your own projects, subject to the terms of any applicable third-party services or dependencies.