# Automated Inventory Control System

A lightweight, standalone inventory management web app built with vanilla HTML, CSS, and JavaScript. No backend, no database setup, no external accounts required — just open the page and it works.

**Live demo:** https://umexrn.github.io/automated-inventory-control-system/

## Features

- **Add inventory items** with name, initial quantity, unit, SKU, minimum stock level, and purchase date
- **Record usage** against existing items — current quantity and used quantity update automatically
- **Automatic stock status** — items are flagged as In Stock, Low Stock, or Out of Stock based on quantity vs. minimum stock level
- **Live dashboard stats** — total items, total stock, low stock count, out of stock count
- **Persistent storage** — data is saved in the browser via `localStorage`, so it survives page refreshes
- **Delete items** directly from the table

## Tech Stack

- HTML5
- CSS3 (custom, no frameworks)
- Vanilla JavaScript (no libraries or dependencies)
- Browser `localStorage` for persistence

## How It Works

Data lives entirely in the browser's `localStorage`. There's no server and no external database — this keeps the project fully self-contained and instantly usable by anyone who opens the page. The tradeoff: data is tied to the specific browser/device it was entered on.

## Data Model

Each inventory item tracks:

| Field | Description |
|---|---|
| Item Name | Name of the item |
| Initial Quantity | Quantity when first added |
| Current Quantity | Quantity remaining after usage |
| Used Quantity | Auto-calculated: Initial − Current |
| Unit | kg, pcs, L, etc. |
| SKU / Serial Number | Optional identifier |
| Minimum Stock Level | Threshold for Low Stock status |
| Purchase Date | When the item was acquired |
| Last Updated | Timestamp of last change |

## Running Locally

Clone the repo and open `index.html` in any browser — no build step, no install required.

```bash
git clone https://github.com/umexrn/automated-inventory-control-system.git
cd automated-inventory-control-system
open index.html
```

## Roadmap / Future Ideas

- Export/import inventory as JSON
- Search and filter functionality
- Usage history view per item
- Edit existing items
- Optional cloud sync (Firebase/Supabase) for cross-device access

## Author

Built by [Umer Nauman](https://github.com/umexrn) as a portfolio project.
