// Automated Inventory Control System
// Step 5: Add Item + render table

const STORAGE_KEY = "inventoryData";

let inventory = loadInventory();

// ---------- Storage ----------
function loadInventory() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveInventory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

// ---------- Status logic ----------
function getStatus(item) {
  if (item.currentQty <= 0) return "out-of-stock";
  if (item.currentQty <= item.minStock) return "low-stock";
  return "in-stock";
}

function statusLabel(status) {
  return { "in-stock": "In Stock", "low-stock": "Low Stock", "out-of-stock": "Out of Stock" }[status];
}

// ---------- Rendering ----------
function renderTable() {
  const tbody = document.getElementById("inventoryTableBody");
  tbody.innerHTML = "";

  inventory.forEach(item => {
    const used = item.initialQty - item.currentQty;
    const status = getStatus(item);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.currentQty}</td>
      <td>${used}</td>
      <td>${item.unit}</td>
      <td>${item.minStock}</td>
      <td><span class="badge badge-${status}">${statusLabel(status)}</span></td>
      <td class="row-actions">
        <button data-action="delete" data-id="${item.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateStats();
}

function updateStats() {
  const totalItems = inventory.length;
  const totalStock = inventory.reduce((sum, i) => sum + Number(i.currentQty), 0);
  const lowStock = inventory.filter(i => getStatus(i) === "low-stock").length;
  const outOfStock = inventory.filter(i => getStatus(i) === "out-of-stock").length;

  document.getElementById("statTotalItems").textContent = totalItems;
  document.getElementById("statTotalStock").textContent = totalStock;
  document.getElementById("statLowStock").textContent = lowStock;
  document.getElementById("statOutOfStock").textContent = outOfStock;
}

// ---------- Add Item ----------
const addItemModal = document.getElementById("addItemModal");
const addItemForm = document.getElementById("addItemForm");

document.getElementById("btnAddItem").addEventListener("click", () => {
  addItemForm.reset();
  addItemModal.showModal();
});

document.getElementById("btnCancelAdd").addEventListener("click", () => {
  addItemModal.close();
});

addItemForm.addEventListener("submit", (e) => {
  const qty = Number(document.getElementById("fQty").value);

  const newItem = {
    id: crypto.randomUUID(),
    name: document.getElementById("fName").value.trim(),
    initialQty: qty,
    currentQty: qty,
    unit: document.getElementById("fUnit").value.trim(),
    sku: document.getElementById("fSku").value.trim(),
    minStock: Number(document.getElementById("fMinStock").value),
    purchaseDate: document.getElementById("fPurchaseDate").value,
    lastUpdated: new Date().toISOString()
  };

  inventory.push(newItem);
  saveInventory();
  renderTable();
});

// ---------- Delete (basic, for testing) ----------
document.getElementById("inventoryTableBody").addEventListener("click", (e) => {
  if (e.target.dataset.action === "delete") {
    inventory = inventory.filter(i => i.id !== e.target.dataset.id);
    saveInventory();
    renderTable();
  }
});

// ---------- Record Usage ----------
const usageModal = document.getElementById("usageModal");
const usageForm = document.getElementById("usageForm");
const uItemSelect = document.getElementById("uItemSelect");
const uQty = document.getElementById("uQty");
const uCurrentQtyHint = document.getElementById("uCurrentQtyHint");

document.getElementById("btnRecordUsage").addEventListener("click", () => {
  if (inventory.length === 0) {
    alert("No items in inventory yet. Add an item first.");
    return;
  }

  uItemSelect.innerHTML = inventory
    .map(i => `<option value="${i.id}">${i.name}</option>`)
    .join("");

  updateUsageHint();
  usageForm.reset();
  uItemSelect.value = inventory[0].id; // reset() clears select, restore it
  usageModal.showModal();
});

uItemSelect.addEventListener("change", updateUsageHint);

function updateUsageHint() {
  const item = inventory.find(i => i.id === uItemSelect.value);
  uCurrentQtyHint.textContent = item
    ? `Current stock: ${item.currentQty} ${item.unit}`
    : "";
}

document.getElementById("btnCancelUsage").addEventListener("click", () => {
  usageModal.close();
});

usageForm.addEventListener("submit", () => {
  const item = inventory.find(i => i.id === uItemSelect.value);
  const usedAmount = Number(uQty.value);

  if (!item) return;

  if (usedAmount <= 0) {
    alert("Usage amount must be greater than 0.");
    return;
  }

  if (usedAmount > item.currentQty) {
    alert(`Cannot use ${usedAmount} ${item.unit} — only ${item.currentQty} ${item.unit} in stock.`);
    return;
  }

  item.currentQty -= usedAmount;
  item.lastUpdated = new Date().toISOString();

  if (!item.usageHistory) item.usageHistory = [];
  item.usageHistory.push({
    date: new Date().toISOString(),
    amount: usedAmount
  });

  saveInventory();
  renderTable();
});

// ---------- Init ----------
renderTable();
