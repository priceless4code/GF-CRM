let deliveries = JSON.parse(localStorage.getItem('deliveries')) || [];
let drivers = JSON.parse(localStorage.getItem('drivers')) || [
  { id: 1, name: "James Wilson", phone: "555-0201", status: "available" },
  { id: 2, name: "Maria Lopez", phone: "555-0202", status: "on-delivery" }
];

const saveDeliveries = () => localStorage.setItem('deliveries', JSON.stringify(deliveries));
const saveDrivers = () => localStorage.setItem('drivers', JSON.stringify(drivers));

// Simulated delivery time estimate (in minutes)
function estimateDeliveryTime(index) {
  return 30 + index * 15; // First: 30 min, each next +15 min
}

window.loadDeliveryPage = function() {
  // Auto-create deliveries from sales if not exists
  const sales = JSON.parse(localStorage.getItem('sales')) || [];
  if (deliveries.length === 0 && sales.length > 0) {
    deliveries = sales.map(s => ({
      id: s.id,
      customerId: s.customerId,
      customer: s.customer,
      order: s.product,
      qty: s.qty,
      amount: s.amount,
      status: 'pending',
      scheduledAt: null,
      deliveredAt: null,
      driverId: null,
      courier: '',
      signature: null,
      notes: ''
    }));
    saveDeliveries();
  }

  const content = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Delivery Management</h2>
      <button onclick="openDeliveryCalendar()" class="bg-primary hover:bg-secondary text-white px-4 py-2 rounded">📅 Schedule</button>
    </div>

    <!-- Driver Status -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <h3 class="font-bold mb-2">Driver Availability</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        ${drivers.map(d => `
          <div class="flex justify-between text-sm">
            <span>${d.name}</span>
            <span class="${d.status === 'available' ? 'text-green-600' : 'text-yellow-600'}">${d.status}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Route Visualization (Simulated Map) -->
    <div class="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6">
      <h3 class="font-bold mb-3">Today's Delivery Route</h3>
      <div class="relative h-48 bg-blue-50 dark:bg-blue-900/20 rounded overflow-hidden">
        <!-- Simulated map -->
        <div class="absolute inset-0 flex items-center justify-center text-gray-500">Route Map (Simulation)</div>
        <!-- Delivery pins -->
        ${deliveries.filter(d => d.status !== 'delivered').slice(0, 5).map((d, i) => `
          <div class="absolute" style="top: ${30 + i * 15}%; left: ${20 + i * 15}%;">
            <div class="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">${i + 1}</div>
            <div class="text-xs mt-1 max-w-20 truncate">${d.customer}</div>
          </div>
        `).join('')}
      </div>
      <p class="text-sm text-gray-600 mt-2">Estimated completion: ${new Date(Date.now() + estimateDeliveryTime(deliveries.filter(d => d.status !== 'delivered').length) * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
    </div>

    <div class="table-container bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-2 text-left">Customer</th>
            <th class="px-4 py-2 text-left">Order</th>
            <th class="px-4 py-2 text-left">Scheduled</th>
            <th class="px-4 py-2 text-left">Driver</th>
            <th class="px-4 py-2 text-left">Status</th>
            <th class="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody id="delivery-table-body" class="divide-y divide-gray-200 dark:divide-gray-700">
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
  renderDeliveries();
  setActiveLink('delivery');
}

function renderDeliveries() {
  const tbody = document.getElementById('delivery-table-body');
  tbody.innerHTML = deliveries.map(d => {
    const driver = drivers.find(dr => dr.id === d.driverId)?.name || 'Unassigned';
    return `
      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
        <td class="px-4 py-2">${d.customer}</td>
        <td class="px-4 py-2">${d.order} × ${d.qty}</td>
        <td class="px-4 py-2">${d.scheduledAt ? new Date(d.scheduledAt).toLocaleString() : 'Not scheduled'}</td>
        <td class="px-4 py-2">${driver}</td>
        <td class="px-4 py-2">
          <span class="px-2 py-1 rounded text-xs ${
            d.status === 'delivered' ? 'bg-green-100 text-green-800' :
            d.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
          }">${d.status}</span>
        </td>
        <td class="px-4 py-2">
          <button onclick="viewDeliveryDetail(${d.id})" class="text-blue-600 mr-2">👁️ View</button>
          ${d.status !== 'delivered' ? `<button onclick="markAsDelivered(${d.id})" class="text-green-600">✅ Deliver</button>` : ''}
        </td>
      </tr>
    `;
  }).join('');
}

// Schedule Calendar Modal
function openDeliveryCalendar() {
  const pending = deliveries.filter(d => d.status === 'pending');
  if (pending.length === 0) {
    showNotification('No pending deliveries to schedule.', 'info');
    return;
  }

  const driverOptions = drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('');

  const modal = `
    <div id="schedule-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 class="text-xl font-bold mb-4">Schedule Deliveries</h3>
        <div class="space-y-4">
          ${pending.map(d => `
            <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div class="font-medium">${d.customer} - ${d.order}</div>
              <div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                <input type="datetime-local" id="sched-${d.id}" class="p-2 border rounded dark:bg-gray-600">
                <select id="driver-${d.id}" class="p-2 border rounded dark:bg-gray-600">
                  <option value="">Assign Driver</option>
                  ${driverOptions}
                </select>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mt-4 flex justify-end space-x-2">
          <button type="button" onclick="closeModal()" class="px-4 py-2">Cancel</button>
          <button type="button" onclick="saveDeliverySchedule()" class="bg-primary text-white px-4 py-2 rounded">Schedule</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;
}

function saveDeliverySchedule() {
  let updated = 0;
  deliveries.forEach(d => {
    if (d.status !== 'pending') return;
    const timeInput = document.getElementById(`sched-${d.id}`);
    const driverSelect = document.getElementById(`driver-${d.id}`);
    if (timeInput?.value) {
      d.scheduledAt = new Date(timeInput.value).toISOString();
      d.driverId = driverSelect?.value ? parseInt(driverSelect.value) : null;
      d.status = 'scheduled';
      updated++;
    }
  });
  if (updated > 0) {
    saveDeliveries();
    closeModal();
    renderDeliveries();
    showNotification(`${updated} deliveries scheduled!`, 'success');
  } else {
    showNotification('No valid schedules selected.', 'error');
  }
}

// View Delivery Detail
function viewDeliveryDetail(id) {
  const delivery = deliveries.find(d => d.id === id);
  const customer = JSON.parse(localStorage.getItem('customers')) || [];
  const cust = customer.find(c => c.id === delivery.customerId);
  const driver = drivers.find(d => d.id === delivery.driverId);

  const modal = `
    <div id="delivery-detail-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold">Delivery #${delivery.id}</h2>
            <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">✕</button>
          </div>

          <div class="space-y-3">
            <p><span class="font-medium">Customer:</span> ${delivery.customer}</p>
            <p><span class="font-medium">Order:</span> ${delivery.order} × ${delivery.qty}</p>
            <p><span class="font-medium">Amount:</span> $${delivery.amount.toFixed(2)}</p>
            <p><span class="font-medium">Scheduled:</span> ${delivery.scheduledAt ? new Date(delivery.scheduledAt).toLocaleString() : 'Not scheduled'}</p>
            <p><span class="font-medium">Driver:</span> ${driver?.name || 'Unassigned'}</p>
            <p><span class="font-medium">Status:</span> 
              <span class="px-2 py-1 rounded text-xs ${
                delivery.status === 'delivered' ? 'bg-green-100 text-green-800' :
                delivery.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
              }">${delivery.status}</span>
            </p>
            ${cust?.notes ? `<p><span class="font-medium">Customer Notes:</span> ${cust.notes}</p>` : ''}

            <!-- Proof of Delivery -->
            <div class="mt-4">
              <h3 class="font-bold mb-2">Proof of Delivery</h3>
              ${delivery.signature ? `
                <img src="${delivery.signature}" alt="Signature" class="border rounded p-2 max-w-full">
              ` : `
                <div id="signature-pad" class="border rounded h-32 bg-white flex items-center justify-center">
                  <p class="text-gray-500">No signature yet</p>
                </div>
                <button onclick="openSignaturePad(${delivery.id})" class="mt-2 bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">Capture Signature</button>
              `}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;
}

// Signature Pad (Simulated)
function openSignaturePad(deliveryId) {
  const modal = `
    <div id="signature-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-md">
        <h3 class="text-xl font-bold mb-4">Sign for Delivery</h3>
        <canvas id="signature-canvas" width="400" height="150" class="border rounded bg-white w-full"></canvas>
        <div class="mt-2 flex justify-end space-x-2">
          <button type="button" onclick="clearSignature()" class="px-3 py-1 bg-gray-200 rounded">Clear</button>
          <button type="button" onclick="saveSignature(${deliveryId})" class="bg-primary text-white px-4 py-2 rounded">Save</button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;

  const canvas = document.getElementById('signature-canvas');
  const ctx = canvas.getContext('2d');
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
  }

  function draw(e) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
  }

  function stopDrawing() {
    isDrawing = false;
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);
}

function clearSignature() {
  const canvas = document.getElementById('signature-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function saveSignature(deliveryId) {
  const canvas = document.getElementById('signature-canvas');
  const dataURL = canvas.toDataURL('image/png');
  
  const delivery = deliveries.find(d => d.id === deliveryId);
  if (delivery) {
    delivery.signature = dataURL;
    delivery.deliveredAt = new Date().toISOString();
    delivery.status = 'delivered';
    saveDeliveries();
    closeModal();
    showNotification('Delivery confirmed with signature!', 'success');
    renderDeliveries();
  }
}

// Mark as delivered (quick)
function markAsDelivered(id) {
  const delivery = deliveries.find(d => d.id === id);
  if (delivery) {
    delivery.status = 'delivered';
    delivery.deliveredAt = new Date().toISOString();
    saveDeliveries();
    showNotification('Delivery marked as completed!', 'success');
    renderDeliveries();
  }
}