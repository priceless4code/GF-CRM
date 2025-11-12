// Initialize data
let inventory = JSON.parse(localStorage.getItem('inventory')) || [];
let suppliers = JSON.parse(localStorage.getItem('suppliers')) || [
  { id: 1, name: "SolarTech Inc.", contact: "contact@solartech.com", phone: "09034743421" }
];
let stockMovements = JSON.parse(localStorage.getItem('stockMovements')) || [];

// Save helpers
const saveInventory = () => localStorage.setItem('inventory', JSON.stringify(inventory));
const saveSuppliers = () => localStorage.setItem('suppliers', JSON.stringify(suppliers));
const saveMovements = () => localStorage.setItem('stockMovements', JSON.stringify(stockMovements));

// Add stock movement log
function logStockMovement(productId, type, qty, reason = '') {
  const movement = {
    id: Date.now(),
    productId,
    type, // 'in' or 'out'
    qty,
    reason,
    timestamp: new Date().toISOString(),
    user: 'Admin' // In real app: currentUser.name
  };
  stockMovements.unshift(movement);
  saveMovements();
}

// Generate mock barcode (8-digit)
function generateBarcode() {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

// Calculate margin
function calculateMargin(cost, price) {
  return cost && price ? ((price - cost) / price * 100).toFixed(1) : 'N/A';
}

// Main page loader
window.loadInventoryPage = function() {
  const lowStock = inventory.filter(i => i.stock <= i.reorderPoint).length;
  if (lowStock > 0) showNotification(`⚠️ ${lowStock} items below reorder point!`, 'error');

  const content = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Inventory Management
      </h2>
      <div class="flex space-x-2">
        <button onclick="openBulkImportModal()" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded text-sm">📥 Import</button>
        <button onclick="exportInventory()" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-3 py-2 rounded text-sm">📤 Export</button>
        <button onclick="openInventoryModal()" class="bg-primary hover:bg-secondary text-white px-4 py-2 rounded flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Product
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap gap-2">
      <input type="text" id="inv-search" placeholder="Search products..." class="p-2 border rounded dark:bg-gray-800 dark:border-gray-700">
      <select id="inv-category" class="p-2 border rounded dark:bg-gray-800 dark:border-gray-700">
        <option value="">All Categories</option>
        ${[...new Set(inventory.map(i => i.category))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
      </select>
      <select id="inv-sort" class="p-2 border rounded dark:bg-gray-800 dark:border-gray-700">
        <option value="name">Sort by Name</option>
        <option value="stock">Sort by Stock</option>
        <option value="price">Sort by Price</option>
      </select>
    </div>

    <!-- Product Grid -->
    <div id="inventory-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <!-- Products loaded here -->
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;

  // Setup filters
  ['inv-search', 'inv-category', 'inv-sort'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderInventoryGrid);
    if (id === 'inv-search') document.getElementById(id).addEventListener('input', renderInventoryGrid);
  });

  renderInventoryGrid();
};

// Render product cards
function renderInventoryGrid() {
  const search = document.getElementById('inv-search').value.toLowerCase();
  const category = document.getElementById('inv-category').value;
  const sortBy = document.getElementById('inv-sort').value;

  let filtered = inventory.filter(i =>
    (i.name.toLowerCase().includes(search) || i.barcode.includes(search)) &&
    (!category || i.category === category)
  );

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'stock') return b.stock - a.stock;
    if (sortBy === 'price') return (b.price || 0) - (a.price || 0);
    return a.name.localeCompare(b.name);
  });

  const grid = document.getElementById('inventory-grid');
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">No products found.</div>';
    return;
  }

  grid.innerHTML = filtered.map(item => {
    const margin = calculateMargin(item.cost, item.price);
    const isLow = item.stock <= item.reorderPoint;
    return `
      <div class="data-card bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
        <div class="p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="font-bold">${item.name}</h3>
              <p class="text-sm text-gray-500 capitalize">${item.category}</p>
              <p class="text-xs mt-1"><span class="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">${item.barcode}</span></p>
            </div>
            ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-12 h-12 object-cover rounded ml-2" onerror="this.style.display='none'">` : ''}
          </div>

          <div class="mt-3 space-y-1 text-sm">
            <div><span class="font-medium">Stock:</span> 
              <span class="${isLow ? 'text-red-600 font-bold' : ''}">${item.stock}</span>
              ${isLow ? '<span class="text-xs bg-red-100 text-red-800 px-1 rounded ml-1">LOW</span>' : ''}
            </div>
            <div><span class="font-medium">Cost:</span> $${(item.cost || 0).toFixed(2)}</div>
            <div><span class="font-medium">Price:</span> $${(item.price || 0).toFixed(2)}</div>
            <div><span class="font-medium">Margin:</span> ${margin}%</div>
            <div><span class="font-medium">Reorder:</span> ${item.reorderPoint}</div>
            ${item.supplierId ? `<div><span class="font-medium">Supplier:</span> ${suppliers.find(s => s.id === item.supplierId)?.name || 'N/A'}</div>` : ''}
          </div>

          <div class="mt-3 flex space-x-1">
            <button onclick="adjustStock(${item.id}, 'in')" class="flex-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 py-1 rounded">+ Stock In</button>
            <button onclick="adjustStock(${item.id}, 'out')" class="flex-1 text-xs bg-red-100 hover:bg-red-200 text-red-800 py-1 rounded">- Stock Out</button>
            <button onclick="viewProductDetails(${item.id})" class="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded">View</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Add/Edit Product Modal
function openInventoryModal(itemId = null) {
  const item = itemId ? inventory.find(i => i.id === itemId) : null;
  
  const supplierOptions = suppliers.map(s => 
    `<option value="${s.id}" ${item?.supplierId === s.id ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  const categories = ["panels", "inverters", "batteries", "fans", "street lights", "flood lights", "accessories"];

  const modal = `
    <div id="inventory-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${item ? 'Edit Product' : 'Add New Product'}</h3>
        <form id="inventory-form">
          <input type="text" id="prod-name" placeholder="Product Name" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${item?.name || ''}" required>
          
          <select id="prod-category" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" required>
            ${categories.map(cat => `<option value="${cat}" ${item?.category === cat ? 'selected' : ''}>${cat.charAt(0).toUpperCase() + cat.slice(1)}</option>`).join('')}
          </select>

          <input type="number" id="prod-cost" placeholder="Cost Price ($)" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${item?.cost || ''}" step="0.01" min="0">
          <input type="number" id="prod-price" placeholder="Retail Price ($)" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${item?.price || ''}" step="0.01" min="0">
          <input type="number" id="prod-stock" placeholder="Initial Stock" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${item?.stock || ''}" min="0" required>
          <input type="number" id="prod-reorder" placeholder="Reorder Point" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${item?.reorderPoint || 5}" min="0">
          <input type="text" id="prod-image" placeholder="Image URL (optional)" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${item?.imageUrl || ''}">
          <textarea id="prod-specs" placeholder="Specifications (JSON, optional)" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" rows="3">${item?.specs ? JSON.stringify(item.specs, null, 2) : ''}</textarea>

          <label class="block mb-2 font-medium">Supplier</label>
          <div class="flex space-x-2 mb-3">
            <select id="prod-supplier" class="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600">
              <option value="">None</option>
              ${supplierOptions}
            </select>
            <button type="button" onclick="openSupplierModal()" class="bg-gray-200 hover:bg-gray-300 px-3 rounded">+</button>
          </div>

          <div class="flex justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2">Cancel</button>
            <button type="submit" class="bg-primary text-white px-4 py-2 rounded">${item ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;
  document.getElementById('inventory-form').addEventListener('submit', (e) => saveInventoryItem(e, itemId));
}

function saveInventoryItem(e, itemId) {
  e.preventDefault();
  
  let specs = null;
  try {
    const specsInput = document.getElementById('prod-specs').value.trim();
    if (specsInput) specs = JSON.parse(specsInput);
  } catch {
    showNotification('Invalid JSON in specifications', 'error');
    return;
  }

  const newItem = {
    id: itemId || Date.now(),
    name: document.getElementById('prod-name').value,
    category: document.getElementById('prod-category').value,
    cost: parseFloat(document.getElementById('prod-cost').value) || 0,
    price: parseFloat(document.getElementById('prod-price').value) || 0,
    stock: parseInt(document.getElementById('prod-stock').value),
    reorderPoint: parseInt(document.getElementById('prod-reorder').value) || 5,
    imageUrl: document.getElementById('prod-image').value || null,
    specs,
    supplierId: document.getElementById('prod-supplier').value ? parseInt(document.getElementById('prod-supplier').value) : null,
    barcode: itemId ? inventory.find(i => i.id === itemId)?.barcode : generateBarcode()
  };

  if (itemId) {
    const index = inventory.findIndex(i => i.id === itemId);
    inventory[index] = newItem;
  } else {
    inventory.push(newItem);
    logStockMovement(newItem.id, 'in', newItem.stock, 'Initial stock');
  }

  saveInventory();
  closeModal();
  renderInventoryGrid();
  showNotification(`${itemId ? 'Product updated' : 'Product added'}!`, 'success');
}

// Adjust stock
function adjustStock(id, type) {
  const item = inventory.find(i => i.id === id);
  if (!item) return;

  const qty = parseInt(prompt(`Enter quantity to ${type === 'in' ? 'add' : 'remove'}:`, '1'));
  if (!qty || qty <= 0) return;

  if (type === 'out' && qty > item.stock) {
    showNotification(`Cannot remove ${qty}. Only ${item.stock} in stock.`, 'error');
    return;
  }

  item.stock += type === 'in' ? qty : -qty;
  saveInventory();
  logStockMovement(id, type, qty, `Manual ${type}`);
  renderInventoryGrid();
  showNotification(`Stock ${type === 'in' ? 'increased' : 'decreased'} by ${qty}.`, 'success');
}

// View product details (including movement history)
function viewProductDetails(id) {
  const item = inventory.find(i => i.id === id);
  const movements = stockMovements.filter(m => m.productId === id).slice(0, 10);
  
  const modal = `
    <div id="product-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start">
            <h2 class="text-2xl font-bold">${item.name}</h2>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">✕</button>
          </div>
          
          <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              ${item.imageUrl ? `<img src="${item.imageUrl}" class="w-full h-48 object-contain mb-4 rounded" onerror="this.parentElement.innerHTML='<div class=\\'bg-gray-200 dark:bg-gray-700 w-full h-48 flex items-center justify-center\\'>No Image</div>'">` : ''}
              <div class="space-y-2 text-sm">
                <p><span class="font-medium">Barcode:</span> ${item.barcode}</p>
                <p><span class="font-medium">Category:</span> ${item.category}</p>
                <p><span class="font-medium">Stock:</span> ${item.stock}</p>
                <p><span class="font-medium">Cost:</span> $${item.cost.toFixed(2)}</p>
                <p><span class="font-medium">Price:</span> $${item.price.toFixed(2)}</p>
                <p><span class="font-medium">Margin:</span> ${calculateMargin(item.cost, item.price)}%</p>
                <p><span class="font-medium">Reorder Point:</span> ${item.reorderPoint}</p>
                <p><span class="font-medium">Supplier:</span> ${suppliers.find(s => s.id === item.supplierId)?.name || 'None'}</p>
              </div>
            </div>
            
            <div>
              <h3 class="font-bold mb-2">Specifications</h3>
              <pre class="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-auto max-h-32">${item.specs ? JSON.stringify(item.specs, null, 2) : 'None'}</pre>
              
              <h3 class="font-bold mt-4 mb-2">Stock Movement (Last 10)</h3>
              <div class="space-y-2 max-h-40 overflow-y-auto">
                ${movements.length ? movements.map(m => `
                  <div class="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <span class="font-medium ${m.type === 'in' ? 'text-green-600' : 'text-red-600'}">${m.type.toUpperCase()}</span>
                    ${m.qty} units • ${new Date(m.timestamp).toLocaleString()}
                    ${m.reason ? `• ${m.reason}` : ''}
                  </div>
                `).join('') : '<p class="text-gray-500 text-sm">No movements recorded.</p>'}
              </div>
              
              ${item.stock <= item.reorderPoint ? `
                <button onclick="generatePurchaseOrder(${item.id})" class="mt-4 w-full bg-primary hover:bg-secondary text-white py-2 rounded">
                  📄 Generate Purchase Order
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;
}

// Generate mock PO
function generatePurchaseOrder(productId) {
  const item = inventory.find(i => i.id === productId);
  const qty = Math.max(10, item.reorderPoint * 2 - item.stock);
  const supplier = suppliers.find(s => s.id === item.supplierId) || suppliers[0];

  const po = {
    id: Date.now(),
    productId,
    productName: item.name,
    qty,
    cost: item.cost,
    total: (item.cost * qty).toFixed(2),
    supplier: supplier?.name || 'N/A',
    status: 'draft',
    createdAt: new Date().toISOString()
  };

  showNotification(`PO Generated: ${qty} units of ${item.name} from ${po.supplier}`, 'success');
  console.log('Purchase Order:', po); // In real app: save to localStorage or send to API
}

// Supplier Management
function openSupplierModal(supplierId = null) {
  const supplier = supplierId ? suppliers.find(s => s.id === supplierId) : null;
  const modal = `
    <div id="supplier-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">${supplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
        <form id="supplier-form">
          <input type="text" id="sup-name" placeholder="Supplier Name" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${supplier?.name || ''}" required>
          <input type="email" id="sup-email" placeholder="Email" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${supplier?.contact || ''}">
          <input type="text" id="sup-phone" placeholder="Phone" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" value="${supplier?.phone || ''}">
          <div class="flex justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2">Cancel</button>
            <button type="submit" class="bg-primary text-white px-4 py-2 rounded">${supplier ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;
  document.getElementById('supplier-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const newSup = {
      id: supplier?.id || Date.now(),
      name: document.getElementById('sup-name').value,
      contact: document.getElementById('sup-email').value,
      phone: document.getElementById('sup-phone').value
    };
    if (supplier) {
      const idx = suppliers.findIndex(s => s.id === supplier.id);
      suppliers[idx] = newSup;
    } else {
      suppliers.push(newSup);
    }
    saveSuppliers();
    closeModal();
    showNotification('Supplier saved!', 'success');
    // Reopen product modal to refresh supplier list
    const productId = inventory.find(i => i.supplierId === newSup.id)?.id;
    if (productId) viewProductDetails(productId);
    else openInventoryModal();
  });
}

// Bulk Import/Export
function openBulkImportModal() {
  const modal = `
    <div id="import-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-2xl">
        <h3 class="text-xl font-bold mb-4">Bulk Import Products (CSV)</h3>
        <p class="mb-3 text-sm text-gray-600">CSV must include: name, category, cost, price, stock, reorderPoint</p>
        <textarea id="csv-input" placeholder="Paste CSV here..." class="w-full h-40 p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600"></textarea>
        <div class="flex justify-end space-x-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2">Cancel</button>
          <button type="button" onclick="processImport()" class="bg-primary text-white px-4 py-2 rounded">Import</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;
}

function processImport() {
  const csv = document.getElementById('csv-input').value.trim();
  if (!csv) return;
  
  try {
    const lines = csv.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const required = ['name', 'category', 'cost', 'price', 'stock', 'reorderPoint'];
    if (!required.every(r => headers.includes(r))) {
      throw new Error('Missing required columns');
    }

    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',').map(v => v.trim());
      const item = {};
      headers.forEach((h, idx) => {
        if (h === 'cost' || h === 'price') item[h] = parseFloat(values[idx]) || 0;
        else if (h === 'stock' || h === 'reorderPoint') item[h] = parseInt(values[idx]) || 0;
        else item[h] = values[idx];
      });
      item.id = Date.now() + i;
      item.barcode = generateBarcode();
      inventory.push(item);
      imported++;
    }
    saveInventory();
    closeModal();
    renderInventoryGrid();
    showNotification(`${imported} products imported!`, 'success');
  } catch (err) {
    showNotification('Import failed: ' + err.message, 'error');
  }
}

function exportInventory() {
  const headers = ['name', 'category', 'cost', 'price', 'stock', 'reorderPoint', 'barcode'];
  const csv = [
    headers.join(','),
    ...inventory.map(i => 
      headers.map(h => {
        const val = i[h];
        return typeof val === 'string' ? `"${val}"` : val;
      }).join(',')
    )
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'greenforce_inventory.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}