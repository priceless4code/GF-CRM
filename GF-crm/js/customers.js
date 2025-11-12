// ============================================
// CUSTOMER MANAGEMENT MODULE
// ============================================

let customers = storage.get('customers', [
  { 
    id: 1, 
    name: "John Doe", 
    phone: "08012345678", 
    email: "john@example.com",
    address: "123 Solar St, Lagos", 
    orderType: "purchase", 
    status: "delivered",
    createdAt: new Date().toISOString()
  }
]);

// ============================================
// LOAD CUSTOMERS PAGE
// ============================================
function loadCustomersPage() {
  const content = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Customer Management</h2>
      <button onclick="openCustomerModal()" class="bg-primary hover:bg-secondary text-white px-4 py-2 rounded transition-colors">
        + Add Customer
      </button>
    </div>

    <div class="mb-4 flex flex-col md:flex-row gap-4">
      <input 
        type="text" 
        id="customer-search" 
        placeholder="Search by name, phone, or email..." 
        class="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
      >
      <select 
        id="customer-filter" 
        class="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        onchange="renderCustomers()"
      >
        <option value="all">All Customers</option>
        <option value="purchase">Purchase Orders</option>
        <option value="repair">Repair Orders</option>
      </select>
      <select 
        id="status-filter" 
        class="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        onchange="renderCustomers()"
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="delivered">Delivered</option>
      </select>
    </div>

    <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Total Customers</p>
          <p class="text-2xl font-bold text-primary">${customers.length}</p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Active Orders</p>
          <p class="text-2xl font-bold text-blue-600">${customers.filter(c => c.status === 'processing').length}</p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
          <p class="text-2xl font-bold text-green-600">${customers.filter(c => c.status === 'delivered').length}</p>
        </div>
        <div>
          <p class="text-gray-500 dark:text-gray-400 text-sm">Pending</p>
          <p class="text-2xl font-bold text-yellow-600">${customers.filter(c => c.status === 'pending').length}</p>
        </div>
      </div>
    </div>

    <div class="table-container bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Phone</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Address</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Order Type</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody id="customers-table-body" class="divide-y divide-gray-200 dark:divide-gray-700">
        </tbody>
      </table>
    </div>
  `;
  
  document.getElementById('page-content').innerHTML = content;
  renderCustomers();
  
  // Add search listener with debounce
  const searchInput = document.getElementById('customer-search');
  searchInput.addEventListener('input', debounce(renderCustomers, 300));
  
  setActiveLink('customers');
}

// ============================================
// RENDER CUSTOMERS TABLE
// ============================================
function renderCustomers() {
  const searchTerm = document.getElementById('customer-search')?.value || '';
  const typeFilter = document.getElementById('customer-filter')?.value || 'all';
  const statusFilter = document.getElementById('status-filter')?.value || 'all';
  
  let filtered = filterData(customers, searchTerm, ['name', 'phone', 'email', 'address']);
  
  if (typeFilter !== 'all') {
    filtered = filtered.filter(c => c.orderType === typeFilter);
  }
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(c => c.status === statusFilter);
  }
  
  const tbody = document.getElementById('customers-table-body');
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
          No customers found
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filtered.map(c => `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <td class="px-4 py-3 font-medium">${sanitizeInput(c.name)}</td>
      <td class="px-4 py-3">${sanitizeInput(c.phone)}</td>
      <td class="px-4 py-3 text-sm">${sanitizeInput(c.email || '-')}</td>
      <td class="px-4 py-3 text-sm">${sanitizeInput(c.address)}</td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded text-xs font-medium ${
          c.orderType === 'purchase' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
        }">
          ${c.orderType === 'purchase' ? '🛒 Purchase' : '🔧 Repair'}
        </span>
      </td>
      <td class="px-4 py-3">
        <span class="px-2 py-1 rounded text-xs font-medium ${
          c.status === 'delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
          c.status === 'processing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        }">
          ${c.status}
        </span>
      </td>
      <td class="px-4 py-3">
        <button 
          onclick="editCustomer(${c.id})" 
          class="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-3 font-medium"
          title="Edit"
        >
          ✏️ Edit
        </button>
        <button 
          onclick="deleteCustomer(${c.id})" 
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
// OPEN CUSTOMER MODAL (Add or Edit)
// ============================================
function openCustomerModal(customerId = null) {
  const isEdit = customerId !== null;
  const customer = isEdit ? customers.find(c => c.id === customerId) : null;
  
  const modal = `
    <div id="customer-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style="opacity: 1; transition: opacity 0.2s;">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
        <form id="customer-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Name *</label>
            <input 
              type="text" 
              id="cust-name" 
              value="${isEdit ? customer.name : ''}"
              placeholder="Full Name" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Phone *</label>
            <input 
              type="tel" 
              id="cust-phone" 
              value="${isEdit ? customer.phone : ''}"
              placeholder="08012345678" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >
            <p class="text-xs text-gray-500 mt-1">Format: 08012345678</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              id="cust-email" 
              value="${isEdit ? (customer.email || '') : ''}"
              placeholder="email@example.com" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Address *</label>
            <textarea 
              id="cust-address" 
              placeholder="Full Address" 
              rows="3"
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >${isEdit ? customer.address : ''}</textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Order Type *</label>
            <select 
              id="cust-order-type" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="purchase" ${isEdit && customer.orderType === 'purchase' ? 'selected' : ''}>🛒 Purchase</option>
              <option value="repair" ${isEdit && customer.orderType === 'repair' ? 'selected' : ''}>🔧 Repair</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Status *</label>
            <select 
              id="cust-status" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pending" ${isEdit && customer.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
              <option value="processing" ${isEdit && customer.status === 'processing' ? 'selected' : ''}>🔄 Processing</option>
              <option value="delivered" ${isEdit && customer.status === 'delivered' ? 'selected' : ''}>✅ Delivered</option>
            </select>
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
              ${isEdit ? 'Update' : 'Save'} Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('modal-root').innerHTML = modal;
  
  // Prevent form submission from causing issues
  const form = document.getElementById('customer-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveCustomer(customerId);
  });
}

// ============================================
// SAVE CUSTOMER (Add or Update)
// ============================================
function saveCustomer(customerId = null) {
  const name = document.getElementById('cust-name').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const orderType = document.getElementById('cust-order-type').value;
  const status = document.getElementById('cust-status').value;
  
  // Validation
  if (!name || !phone || !address) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  if (!validatePhone(phone)) {
    showNotification('Invalid phone number format. Use: 08012345678', 'error');
    return;
  }
  
  if (email && !validateEmail(email)) {
    showNotification('Invalid email format', 'error');
    return;
  }
  
  const isEdit = customerId !== null;
  
  if (isEdit) {
    // Update existing customer
    const index = customers.findIndex(c => c.id === customerId);
    if (index !== -1) {
      customers[index] = {
        ...customers[index],
        name,
        phone,
        email,
        address,
        orderType,
        status,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    // Add new customer
    const newCustomer = {
      id: Date.now(),
      name,
      phone,
      email,
      address,
      orderType,
      status,
      createdAt: new Date().toISOString()
    };
    customers.push(newCustomer);
  }
  
  // Save to storage
  if (storage.set('customers', customers)) {
    closeModal();
    renderCustomers();
    showNotification(
      isEdit ? 'Customer updated successfully!' : 'Customer added successfully!', 
      'success'
    );
  }
}

// ============================================
// EDIT CUSTOMER
// ============================================
function editCustomer(id) {
  openCustomerModal(id);
}

// ============================================
// DELETE CUSTOMER
// ============================================
function deleteCustomer(id) {
  const customer = customers.find(c => c.id === id);
  if (!customer) return;
  
  confirmAction(
    `Are you sure you want to delete "${customer.name}"? This action cannot be undone.`,
    () => {
      customers = customers.filter(c => c.id !== id);
      storage.set('customers', customers);
      renderCustomers();
      showNotification('Customer deleted', 'info');
    }
  );
}

// Make functions globally available
window.loadCustomersPage = loadCustomersPage;
window.openCustomerModal = openCustomerModal;
window.editCustomer = editCustomer;
window.deleteCustomer = deleteCustomer;