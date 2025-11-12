// ============================================
// SALES MANAGEMENT MODULE
// ============================================

let sales = storage.get('sales', []);

// ============================================
// LOAD SALES PAGE
// ============================================
function loadSalesPage() {
  // Calculate real totals
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const dailyTotal = sales
    .filter(s => new Date(s.date) >= today)
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);
    
  const weeklyTotal = sales
    .filter(s => new Date(s.date) >= thisWeekStart)
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);
    
  const monthlyTotal = sales
    .filter(s => new Date(s.date) >= thisMonthStart)
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);

  const content = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Sales Management</h2>
      <button onclick="openSalesModal()" class="bg-primary hover:bg-secondary text-white px-4 py-2 rounded transition-colors">
        + New Sale
      </button>
    </div>

    <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <h3 class="font-bold mb-4">Sales Summary</h3>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <p class="text-gray-600 dark:text-gray-300 text-sm font-medium">Today</p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${formatNaira(dailyTotal)}</p>
        </div>
        <div class="text-center p-4 bg-green-50 dark:bg-green-900 rounded">
          <p class="text-gray-600 dark:text-gray-300 text-sm font-medium">This Week</p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">${formatNaira(weeklyTotal)}</p>
        </div>
        <div class="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded">
          <p class="text-gray-600 dark:text-gray-300 text-sm font-medium">This Month</p>
          <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${formatNaira(monthlyTotal)}</p>
        </div>
      </div>
    </div>

    <div class="mb-4 flex flex-col md:flex-row gap-4">
      <input 
        type="text" 
        id="sales-search" 
        placeholder="Search by customer or product..." 
        class="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
      >
      <input 
        type="date" 
        id="sales-date-filter" 
        class="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        onchange="renderSales()"
      >
    </div>

    <div class="table-container bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody id="sales-table-body" class="divide-y divide-gray-200 dark:divide-gray-700">
        </tbody>
      </table>
    </div>
    
    <div class="mt-4 flex gap-2">
      <button onclick="exportSales()" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded transition-colors">
        📥 Export CSV
      </button>
      <button onclick="printSalesReport()" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded transition-colors">
        🖨️ Print Report
      </button>
    </div>
  `;
  
  document.getElementById('page-content').innerHTML = content;
  renderSales();
  
  const searchInput = document.getElementById('sales-search');
  searchInput.addEventListener('input', debounce(renderSales, 300));
  
  setActiveLink('sales');
}

// ============================================
// RENDER SALES TABLE
// ============================================
function renderSales() {
  const searchTerm = document.getElementById('sales-search')?.value || '';
  const dateFilter = document.getElementById('sales-date-filter')?.value || '';
  
  let filtered = filterData(sales, searchTerm, ['customer', 'product']);
  
  if (dateFilter) {
    filtered = filtered.filter(s => {
      const saleDate = new Date(s.date).toISOString().split('T')[0];
      return saleDate === dateFilter;
    });
  }
  
  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const tbody = document.getElementById('sales-table-body');
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
          No sales records found
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filtered.map(s => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td class="px-4 py-3 text-sm">${formatDate(s.date)}</td>
      <td class="px-4 py-3 font-medium">${sanitizeInput(s.customer)}</td>
      <td class="px-4 py-3">${sanitizeInput(s.product)}</td>
      <td class="px-4 py-3 text-center">${s.quantity || 1}</td>
      <td class="px-4 py-3 font-bold text-green-600 dark:text-green-400">${formatNaira(s.amount)}</td>
      <td class="px-4 py-3">
        <button 
          onclick="viewSaleReceipt(${s.id})" 
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-3 font-medium"
          title="View Receipt"
        >
          📄 Receipt
        </button>
        <button 
          onclick="deleteSale(${s.id})" 
          class="text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
          title="Delete"
        >
          🗑️ Delete
        </button>
      </td>
    </tr>
  `).join('');
}

// ============================================
// OPEN SALES MODAL
// ============================================
function openSalesModal() {
  const customers = storage.get('customers', []);
  const inventory = storage.get('inventory', []);
  
  if (customers.length === 0) {
    showNotification('Please add customers first!', 'error');
    return;
  }
  
  if (inventory.length === 0) {
    showNotification('Please add inventory items first!', 'error');
    return;
  }
  
  const customerOptions = customers.map(c => 
    `<option value="${c.id}">${c.name} - ${c.phone}</option>`
  ).join('');
  
  const productOptions = inventory
    .filter(i => i.stock > 0)
    .map(i => 
      `<option value="${i.id}" data-price="${i.price || 0}" data-stock="${i.stock}">
        ${i.name} (Stock: ${i.stock})
      </option>`
    ).join('');

  const modal = `
    <div id="sales-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style="opacity: 1; transition: opacity 0.2s;">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">Record New Sale</h3>
        <form id="sales-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Customer *</label>
            <select 
              id="sale-customer" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >
              <option value="">Select Customer</option>
              ${customerOptions}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Product *</label>
            <select 
              id="sale-product" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
              onchange="updateSaleAmount()"
            >
              <option value="">Select Product</option>
              ${productOptions}
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Quantity *</label>
            <input 
              type="number" 
              id="sale-quantity" 
              value="1"
              min="1" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
              onchange="updateSaleAmount()"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Amount (₦) *</label>
            <input 
              type="number" 
              id="sale-amount" 
              placeholder="0.00" 
              step="0.01"
              min="0" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Payment Method</label>
            <select 
              id="sale-payment" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="pos">POS</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Notes</label>
            <textarea 
              id="sale-notes" 
              rows="2"
              placeholder="Optional notes..."
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            ></textarea>
          </div>
          
          <div class="flex justify-end space-x-2 pt-4">
            <button 
              type="button" 
              onclick="closeModal()" 
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="px-4 py-2 bg-primary text-white rounded hover:bg-secondary transition-colors"
            >
              Save Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('modal-root').innerHTML = modal;
  
  const form = document.getElementById('sales-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveSale();
  });
}

// ============================================
// UPDATE SALE AMOUNT BASED ON PRODUCT
// ============================================
function updateSaleAmount() {
  const productSelect = document.getElementById('sale-product');
  const quantityInput = document.getElementById('sale-quantity');
  const amountInput = document.getElementById('sale-amount');
  
  const selectedOption = productSelect.options[productSelect.selectedIndex];
  const price = parseFloat(selectedOption.dataset.price) || 0;
  const quantity = parseInt(quantityInput.value) || 1;
  const stock = parseInt(selectedOption.dataset.stock) || 0;
  
  // Check stock
  if (quantity > stock) {
    showNotification(`Only ${stock} units available in stock!`, 'warning');
    quantityInput.value = stock;
    return;
  }
  
  amountInput.value = (price * quantity).toFixed(2);
}

// ============================================
// SAVE SALE
// ============================================
function saveSale() {
  const customerId = document.getElementById('sale-customer').value;
  const productId = document.getElementById('sale-product').value;
  const quantity = parseInt(document.getElementById('sale-quantity').value);
  const amount = parseFloat(document.getElementById('sale-amount').value);
  const paymentMethod = document.getElementById('sale-payment').value;
  const notes = document.getElementById('sale-notes').value.trim();
  
  if (!customerId || !productId || !quantity || !amount) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  const customers = storage.get('customers', []);
  const customer = customers.find(c => c.id == customerId);
  
  const inventory = storage.get('inventory', []);
  const product = inventory.find(i => i.id == productId);
  
  if (!customer || !product) {
    showNotification('Invalid customer or product', 'error');
    return;
  }
  
  // Check stock availability
  if (product.stock < quantity) {
    showNotification(`Insufficient stock! Only ${product.stock} available.`, 'error');
    return;
  }
  
  const newSale = {
    id: Date.now(),
    date: new Date().toISOString(),
    customer: customer.name,
    customerId: customer.id,
    product: product.name,
    productId: product.id,
    quantity: quantity,
    amount: amount,
    paymentMethod: paymentMethod,
    notes: notes
  };
  
  sales.push(newSale);
  storage.set('sales', sales);
  
  // Reduce inventory stock
  product.stock -= quantity;
  storage.set('inventory', inventory);
  
  // Update customer status
  customer.status = 'processing';
  storage.set('customers', customers);
  
  closeModal();
  renderSales();
  showNotification('Sale recorded successfully!', 'success');
}

// ============================================
// VIEW SALE RECEIPT
// ============================================
function viewSaleReceipt(id) {
  const sale = sales.find(s => s.id === id);
  if (!sale) return;
  
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style="opacity: 1; transition: opacity 0.2s;">
      <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-primary">GreenForce CRM</h2>
          <p class="text-sm text-gray-600 dark:text-gray-400">Sales Receipt</p>
        </div>
        
        <div class="border-t border-b border-gray-300 dark:border-gray-600 py-4 mb-4 space-y-2">
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Date:</span>
            <span class="font-medium">${formatDate(sale.date)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Receipt #:</span>
            <span class="font-medium">${sale.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 dark:text-gray-400">Customer:</span>
            <span class="font-medium">${sale.customer}</span>
          </div>
        </div>
        
        <div class="space-y-2 mb-4">
          <div class="flex justify-between">
            <span>Product:</span>
            <span class="font-medium">${sale.product}</span>
          </div>
          <div class="flex justify-between">
            <span>Quantity:</span>
            <span class="font-medium">${sale.quantity}</span>
          </div>
          <div class="flex justify-between">
            <span>Payment:</span>
            <span class="font-medium">${sale.paymentMethod}</span>
          </div>
          ${sale.notes ? `
          <div class="flex justify-between">
            <span>Notes:</span>
            <span class="font-medium text-sm">${sale.notes}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="border-t border-gray-300 dark:border-gray-600 pt-4 mb-6">
          <div class="flex justify-between text-xl font-bold">
            <span>Total:</span>
            <span class="text-primary">${formatNaira(sale.amount)}</span>
          </div>
        </div>
        
        <div class="flex gap-2">
          <button 
            onclick="printReceipt(${sale.id})" 
            class="flex-1 bg-primary text-white px-4 py-2 rounded hover:bg-secondary transition-colors"
          >
            🖨️ Print
          </button>
          <button 
            onclick="closeModal()" 
            class="flex-1 bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modal-root').innerHTML = modal;
}

// ============================================
// PRINT RECEIPT
// ============================================
function printReceipt(id) {
  const sale = sales.find(s => s.id === id);
  if (!sale) return;
  
  const printWindow = window.open('', '', 'height=600,width=400');
  printWindow.document.write(`
    <html>
      <head>
        <title>Receipt #${sale.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { text-align: center; color: #10B981; }
          .info { margin: 20px 0; }
          .row { display: flex; justify-between; margin: 10px 0; }
          .total { border-top: 2px solid #000; padding-top: 10px; font-size: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>GreenForce CRM</h2>
        <p style="text-align: center;">Sales Receipt</p>
        <div class="info">
          <div class="row"><span>Date:</span><span>${formatDate(sale.date)}</span></div>
          <div class="row"><span>Receipt #:</span><span>${sale.id}</span></div>
          <div class="row"><span>Customer:</span><span>${sale.customer}</span></div>
        </div>
        <hr>
        <div class="info">
          <div class="row"><span>Product:</span><span>${sale.product}</span></div>
          <div class="row"><span>Quantity:</span><span>${sale.quantity}</span></div>
          <div class="row"><span>Payment:</span><span>${sale.paymentMethod}</span></div>
        </div>
        <div class="total">
          <div class="row"><span>Total:</span><span>${formatNaira(sale.amount)}</span></div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// ============================================
// DELETE SALE
// ============================================
function deleteSale(id) {
  const sale = sales.find(s => s.id === id);
  if (!sale) return;
  
  confirmAction(
    `Delete sale of ${sale.product} to ${sale.customer}? This will restore inventory.`,
    () => {
      // Restore inventory
      const inventory = storage.get('inventory', []);
      const product = inventory.find(i => i.id == sale.productId);
      if (product) {
        product.stock += sale.quantity;
        storage.set('inventory', inventory);
      }
      
      sales = sales.filter(s => s.id !== id);
      storage.set('sales', sales);
      renderSales();
      showNotification('Sale deleted and inventory restored', 'info');
    }
  );
}

// ============================================
// EXPORT SALES
// ============================================
function exportSales() {
  if (sales.length === 0) {
    showNotification('No sales to export', 'error');
    return;
  }
  
  const exportData = sales.map(s => ({
    Date: formatDate(s.date),
    Customer: s.customer,
    Product: s.product,
    Quantity: s.quantity,
    Amount: s.amount,
    Payment: s.paymentMethod,
    Notes: s.notes || ''
  }));
  
  exportToCSV(exportData, 'greenforce_sales.csv');
}

// ============================================
// PRINT SALES REPORT
// ============================================
function printSalesReport() {
  if (sales.length === 0) {
    showNotification('No sales to print', 'error');
    return;
  }
  
  const total = sales.reduce((sum, s) => sum + parseFloat(s.amount), 0);
  
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(`
    <html>
      <head>
        <title>Sales Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #10B981; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #10B981; color: white; }
          .total { margin-top: 20px; font-size: 18px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>GreenForce CRM - Sales Report</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${sales.map(s => `
              <tr>
                <td>${formatDate(s.date)}</td>
                <td>${s.customer}</td>
                <td>${s.product}</td>
                <td>${s.quantity}</td>
                <td>${formatNaira(s.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total Sales: ${formatNaira(total)}</div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// Make functions globally available
window.loadSalesPage = loadSalesPage;
window.openSalesModal = openSalesModal;
window.updateSaleAmount = updateSaleAmount;
window.viewSaleReceipt = viewSaleReceipt;
window.printReceipt = printReceipt;
window.deleteSale = deleteSale;
window.exportSales = exportSales;
window.printSalesReport = printSalesReport;