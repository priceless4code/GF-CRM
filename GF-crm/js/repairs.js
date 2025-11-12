// ============================================
// REPAIRS MANAGEMENT MODULE
// ============================================

let repairs = storage.get('repairs', []);

const repairStatuses = ['received', 'diagnosing', 'in repair', 'completed', 'returned'];

// ============================================
// LOAD REPAIRS PAGE
// ============================================
function loadRepairsPage() {
  const statusCounts = {
    received: repairs.filter(r => r.status === 'received').length,
    inProgress: repairs.filter(r => ['diagnosing', 'in repair'].includes(r.status)).length,
    completed: repairs.filter(r => r.status === 'completed').length,
    returned: repairs.filter(r => r.status === 'returned').length
  };

  const content = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Repairs Management</h2>
      <button onclick="openRepairModal()" class="bg-primary hover:bg-secondary text-white px-4 py-2 rounded transition-colors">
        + New Repair
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">New</p>
        <p class="text-2xl font-bold text-yellow-600">${statusCounts.received}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">In Progress</p>
        <p class="text-2xl font-bold text-blue-600">${statusCounts.inProgress}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
        <p class="text-2xl font-bold text-green-600">${statusCounts.completed}</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded shadow text-center">
        <p class="text-gray-500 dark:text-gray-400 text-sm">Returned</p>
        <p class="text-2xl font-bold text-purple-600">${statusCounts.returned}</p>
      </div>
    </div>

    <div class="mb-4 flex flex-col md:flex-row gap-4">
      <input 
        type="text" 
        id="repair-search" 
        placeholder="Search by customer or device..." 
        class="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
      >
      <select 
        id="status-filter" 
        class="p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
        onchange="renderRepairs()"
      >
        <option value="all">All Status</option>
        ${repairStatuses.map(s => `<option value="${s}">${s.charAt(0).toUpperCase() + s.slice(1)}</option>`).join('')}
      </select>
    </div>

    <div class="table-container bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Customer</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Device</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Issue</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cost</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Technician</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody id="repairs-table-body" class="divide-y divide-gray-200 dark:divide-gray-700">
        </tbody>
      </table>
    </div>
    
    <div class="mt-4">
      <button onclick="exportRepairs()" class="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded transition-colors">
        📥 Export Repairs
      </button>
    </div>
  `;
  
  document.getElementById('page-content').innerHTML = content;
  renderRepairs();
  
  const searchInput = document.getElementById('repair-search');
  searchInput.addEventListener('input', debounce(renderRepairs, 300));
  
  setActiveLink('repairs');
}

// ============================================
// RENDER REPAIRS TABLE
// ============================================
function renderRepairs() {
  const searchTerm = document.getElementById('repair-search')?.value || '';
  const statusFilter = document.getElementById('status-filter')?.value || 'all';
  
  let filtered = filterData(repairs, searchTerm, ['customer', 'device', 'issue']);
  
  if (statusFilter !== 'all') {
    filtered = filtered.filter(r => r.status === statusFilter);
  }
  
  // Sort by date (newest first)
  filtered.sort((a, b) => b.id - a.id);
  
  const tbody = document.getElementById('repairs-table-body');
  
  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
          No repair records found
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filtered.map(r => {
    const statusColors = {
      received: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      diagnosing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'in repair': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      returned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    
    return `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <td class="px-4 py-3 font-mono text-sm">#${r.id}</td>
        <td class="px-4 py-3 font-medium">${sanitizeInput(r.customer)}</td>
        <td class="px-4 py-3">${sanitizeInput(r.device)}</td>
        <td class="px-4 py-3 text-sm max-w-xs truncate" title="${r.issue}">${sanitizeInput(r.issue)}</td>
        <td class="px-4 py-3 font-bold">${r.cost ? formatNaira(r.cost) : '-'}</td>
        <td class="px-4 py-3">
          <select 
            onchange="updateRepairStatus(${r.id}, this.value)" 
            class="px-2 py-1 rounded text-xs font-medium border-0 ${statusColors[r.status]}"
          >
            ${repairStatuses.map(s => `
              <option value="${s}" ${r.status === s ? 'selected' : ''}>
                ${s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            `).join('')}
          </select>
        </td>
        <td class="px-4 py-3 text-sm">${r.technician || 'Unassigned'}</td>
        <td class="px-4 py-3">
          <button 
            onclick="editRepair(${r.id})" 
            class="text-blue-600 hover:text-blue-800 dark:text-blue-400 mr-2 font-medium"
            title="Edit"
          >
            ✏️
          </button>
          <button 
            onclick="deleteRepair(${r.id})" 
            class="text-red-600 hover:text-red-800 dark:text-red-400 font-medium"
            title="Delete"
          >
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ============================================
// OPEN REPAIR MODAL (Add or Edit)
// ============================================
function openRepairModal(repairId = null) {
  const customers = storage.get('customers', []);
  const isEdit = repairId !== null;
  const repair = isEdit ? repairs.find(r => r.id === repairId) : null;
  
  const customerOptions = customers.map(c => 
    `<option value="${c.id}" ${isEdit && repair.customerId == c.id ? 'selected' : ''}>
      ${c.name} - ${c.phone}
    </option>`
  ).join('');

  const modal = `
    <div id="repair-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style="opacity: 1; transition: opacity 0.2s;">
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">${isEdit ? 'Edit Repair' : 'Log New Repair'}</h3>
        <form id="repair-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Customer *</label>
            <select 
              id="repair-customer" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >
              <option value="">Select Customer</option>
              ${customerOptions}
              <option value="walk-in">Walk-in Customer</option>
            </select>
          </div>
          
          <div id="walk-in-fields" class="hidden space-y-4">
            <input 
              type="text" 
              id="walk-in-name" 
              placeholder="Customer Name"
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
            <input 
              type="tel" 
              id="walk-in-phone" 
              placeholder="Phone Number"
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Device *</label>
            <input 
              type="text" 
              id="repair-device" 
              value="${isEdit ? repair.device : ''}"
              placeholder="e.g., Inverter, Solar Panel" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Issue Description *</label>
            <textarea 
              id="repair-issue" 
              placeholder="Describe the problem..." 
              rows="3"
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary" 
              required
            >${isEdit ? repair.issue : ''}</textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Estimated Cost (₦)</label>
            <input 
              type="number" 
              id="repair-cost" 
              value="${isEdit && repair.cost ? repair.cost : ''}"
              placeholder="0.00" 
              step="0.01"
              min="0"
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Assign Technician</label>
            <input 
              type="text" 
              id="repair-technician" 
              value="${isEdit && repair.technician ? repair.technician : ''}"
              placeholder="Technician name" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
          </div>
          
          ${isEdit ? `
          <div>
            <label class="block text-sm font-medium mb-1">Status</label>
            <select 
              id="repair-status" 
              class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              ${repairStatuses.map(s => `
                <option value="${s}" ${repair.status === s ? 'selected' : ''}>
                  ${s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              `).join('')}
            </select>
          </div>
          ` : ''}
          
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
              ${isEdit ? 'Update' : 'Save'} Repair
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.getElementById('modal-root').innerHTML = modal;
  
  // Show walk-in fields if selected
  document.getElementById('repair-customer').addEventListener('change', (e) => {
    const walkInFields = document.getElementById('walk-in-fields');
    if (e.target.value === 'walk-in') {
      walkInFields.classList.remove('hidden');
    } else {
      walkInFields.classList.add('hidden');
    }
  });
  
  const form = document.getElementById('repair-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveRepair(repairId);
  });
}

// ============================================
// SAVE REPAIR
// ============================================
function saveRepair(repairId = null) {
  const customerSelect = document.getElementById('repair-customer').value;
  const device = document.getElementById('repair-device').value.trim();
  const issue = document.getElementById('repair-issue').value.trim();
  const cost = parseFloat(document.getElementById('repair-cost').value) || 0;
  const technician = document.getElementById('repair-technician').value.trim();
  
  if (!device || !issue) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }
  
  let customerName, customerId;
  
  if (customerSelect === 'walk-in') {
    customerName = document.getElementById('walk-in-name').value.trim();
    const phone = document.getElementById('walk-in-phone').value.trim();
    if (!customerName || !phone) {
      showNotification('Please enter customer name and phone', 'error');
      return;
    }
    customerId = null;
  } else {
    const customers = storage.get('customers', []);
    const customer = customers.find(c => c.id == customerSelect);
    if (!customer) {
      showNotification('Please select a customer', 'error');
      return;
    }
    customerName = customer.name;
    customerId = customer.id;
  }
  
  const isEdit = repairId !== null;
  
  if (isEdit) {
    const index = repairs.findIndex(r => r.id === repairId);
    if (index !== -1) {
      const status = document.getElementById('repair-status').value;
      repairs[index] = {
        ...repairs[index],
        customer: customerName,
        customerId,
        device,
        issue,
        cost,
        technician: technician || 'Unassigned',
        status,
        updatedAt: new Date().toISOString()
      };
    }
  } else {
    const newRepair = {
      id: Date.now(),
      customer: customerName,
      customerId,
      device,
      issue,
      cost,
      status: 'received',
      technician: technician || 'Unassigned',
      createdAt: new Date().toISOString()
    };
    repairs.push(newRepair);
  }
  
  if (storage.set('repairs', repairs)) {
    closeModal();
    renderRepairs();
    showNotification(
      isEdit ? 'Repair updated!' : 'Repair logged successfully!', 
      'success'
    );
  }
}

// ============================================
// UPDATE REPAIR STATUS
// ============================================
function updateRepairStatus(id, newStatus) {
  const repair = repairs.find(r => r.id === id);
  if (repair) {
    repair.status = newStatus;
    repair.updatedAt = new Date().toISOString();
    storage.set('repairs', repairs);
    showNotification('Status updated!', 'success');
    renderRepairs();
  }
}

// ============================================
// EDIT REPAIR
// ============================================
function editRepair(id) {
  openRepairModal(id);
}

// ============================================
// DELETE REPAIR
// ============================================
function deleteRepair(id) {
  const repair = repairs.find(r => r.id === id);
  if (!repair) return;
  
  confirmAction(
    `Delete repair for ${repair.customer}'s ${repair.device}?`,
    () => {
      repairs = repairs.filter(r => r.id !== id);
      storage.set('repairs', repairs);
      renderRepairs();
      showNotification('Repair deleted', 'info');
    }
  );
}

// ============================================
// EXPORT REPAIRS
// ============================================
function exportRepairs() {
  if (repairs.length === 0) {
    showNotification('No repairs to export', 'error');
    return;
  }
  
  const exportData = repairs.map(r => ({
    ID: r.id,
    Customer: r.customer,
    Device: r.device,
    Issue: r.issue,
    Cost: r.cost || 0,
    Status: r.status,
    Technician: r.technician,
    Created: formatDate(r.createdAt)
  }));
  
  exportToCSV(exportData, 'greenforce_repairs.csv');
}

// Make functions globally available
window.loadRepairsPage = loadRepairsPage;
window.openRepairModal = openRepairModal;
window.updateRepairStatus = updateRepairStatus;
window.editRepair = editRepair;
window.deleteRepair = deleteRepair;
window.exportRepairs = exportRepairs;