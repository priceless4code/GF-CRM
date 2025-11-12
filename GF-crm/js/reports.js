// js/reports.js

let savedReports = JSON.parse(localStorage.getItem('savedReports')) || [];

// Save report config
function saveReportConfig(name, config) {
  savedReports.push({ id: Date.now(), name, config, createdAt: new Date().toISOString() });
  localStorage.setItem('savedReports', JSON.stringify(savedReports));
  showNotification(`Report "${name}" saved!`, 'success');
}

// Render report dashboard
window.loadReportsPage = function() {
  const content = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Reporting & Analytics</h2>
      <button onclick="openNewReportModal()" class="bg-primary hover:bg-secondary text-white px-4 py-2 rounded">+ New Report</button>
    </div>

    <!-- Saved Reports -->
    ${savedReports.length ? `
      <div class="mb-6">
        <h3 class="font-bold mb-2">Saved Reports</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          ${savedReports.map(r => `
            <div class="bg-white dark:bg-gray-800 p-3 rounded shadow flex justify-between items-center">
              <span>${r.name}</span>
              <div>
                <button onclick="runSavedReport(${r.id})" class="text-blue-600 mr-2">▶️ Run</button>
                <button onclick="deleteReport(${r.id})" class="text-red-600">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}

    <!-- Customizable Dashboard -->
    <div id="report-dashboard" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Widgets will be added here -->
    </div>
  `;
  document.getElementById('page-content').innerHTML = content;
  renderReportDashboard();
  setActiveLink('reports');

  // Make dashboard sortable
  setTimeout(() => {
    new Sortable(document.getElementById('report-dashboard'), {
      animation: 150,
      handle: '.widget-header',
      onEnd: () => {
        // Save widget order (optional)
        console.log('Widget order updated');
      }
    });
  }, 100);
}

function renderReportDashboard() {
  const widgets = [
    { id: 'sales-kpi', title: 'Sales KPI', type: 'kpi', data: getSalesKPI() },
    { id: 'repairs-kpi', title: 'Repairs KPI', type: 'kpi', data: getRepairsKPI() },
    { id: 'sales-trend', title: 'Sales Trend (MoM)', type: 'chart', data: getSalesTrendData() },
    { id: 'inventory-status', title: 'Inventory Status', type: 'chart', data: getInventoryStatusData() }
  ];

  const dashboard = document.getElementById('report-dashboard');
  dashboard.innerHTML = widgets.map(w => `
    <div class="bg-white dark:bg-gray-800 rounded shadow overflow-hidden" data-widget="${w.id}">
      <div class="widget-header p-3 bg-gray-50 dark:bg-gray-700 cursor-move flex justify-between items-center">
        <h3 class="font-bold">${w.title}</h3>
        <button onclick="openReportConfig('${w.id}')" class="text-gray-500 hover:text-gray-700">⚙️</button>
      </div>
      <div class="p-4" id="widget-${w.id}">
        ${w.type === 'kpi' ? renderKPIWidget(w.data) : renderChartWidget(w.id, w.data)}
      </div>
    </div>
  `).join('');

  // Initialize charts
  widgets.forEach(w => {
    if (w.type === 'chart') {
      renderChart(`widget-${w.id}`, w.data);
    }
  });
}

// KPI Widget
function renderKPIWidget(data) {
  return `
    <div class="text-center">
      <div class="text-3xl font-bold text-primary">${data.value}</div>
      <div class="text-sm text-gray-500 mt-1">${data.label}</div>
      <div class="text-xs ${data.change >= 0 ? 'text-green-600' : 'text-red-600'} mt-1">
        ${data.change >= 0 ? '↑' : '↓'} ${Math.abs(data.change)}% vs last period
      </div>
      <div class="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div class="bg-primary h-2 rounded-full" style="width: ${data.progress}%"></div>
      </div>
      <div class="text-xs text-gray-500 mt-1">${data.progress}% of goal</div>
    </div>
  `;
}

// Chart Widget (placeholder)
function renderChartWidget(id, data) {
  return `<canvas id="${id}-chart" height="200"></canvas>`;
}

function renderChart(canvasId, data) {
  const ctx = document.getElementById(canvasId + '-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: data.type || 'bar',
    data: data,
    options: {
      responsive: true,
      plugins: { legend: { position: 'top' } },
      scales: data.scales || {}
    }
  });
}

// Data Fetchers
function getSalesKPI() {
  const sales = JSON.parse(localStorage.getItem('sales')) || [];
  const now = new Date();
  const thisMonth = sales.filter(s => new Date(s.date).getMonth() === now.getMonth());
  const lastMonth = sales.filter(s => new Date(s.date).getMonth() === (now.getMonth() - 1 + 12) % 12);
  
  const thisRevenue = thisMonth.reduce((sum, s) => sum + s.amount, 0);
  const lastRevenue = lastMonth.reduce((sum, s) => sum + s.amount, 0);
  const goal = 15000;
  const change = lastRevenue ? ((thisRevenue - lastRevenue) / lastRevenue * 100) : 0;

  return {
    value: `$${thisRevenue.toLocaleString()}`,
    label: 'This Month Revenue',
    change: change.toFixed(1),
    progress: Math.min(100, (thisRevenue / goal) * 100)
  };
}

function getRepairsKPI() {
  const repairs = JSON.parse(localStorage.getItem('repairs')) || [];
  const completed = repairs.filter(r => r.status === 'completed').length;
  const goal = 100;
  return {
    value: completed,
    label: 'Repairs Completed (MTD)',
    change: 5.2, // mock
    progress: Math.min(100, (completed / goal) * 100)
  };
}

function getSalesTrendData() {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const current = [4000, 5000, 4500, 6000, 7000, 8000];
  const previous = [3500, 4200, 4000, 5200, 6000, 6500];

  return {
    labels,
    datasets: [
      { label: 'This Year', data: current, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 128, 0.2)' },
      { label: 'Last Year', data: previous, borderColor: '#6B7280', backgroundColor: 'rgba(107, 114, 128, 0.2)' }
    ],
    type: 'line',
    scales: {
      y: { beginAtZero: true }
    }
  };
}

function getInventoryStatusData() {
  const inventory = JSON.parse(localStorage.getItem('inventory')) || [];
  const categories = [...new Set(inventory.map(i => i.category))];
  const data = categories.map(cat => 
    inventory.filter(i => i.category === cat).reduce((sum, i) => sum + i.stock, 0)
  );

  return {
    labels: categories,
    datasets: [{
      label: 'Stock by Category',
      data,
      backgroundColor: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B', '#0F766E', '#14B8A6']
    }]
  };
}

// New Report Modal
function openNewReportModal() {
  const modal = `
    <div id="report-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-2xl">
        <h3 class="text-xl font-bold mb-4">Create Custom Report</h3>
        <form id="report-form">
          <input type="text" id="report-name" placeholder="Report Name" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" required>
          
          <label class="block mb-2">Module</label>
          <select id="report-module" class="w-full p-2 mb-3 border rounded dark:bg-gray-700 dark:border-gray-600" required>
            <option value="sales">Sales</option>
            <option value="repairs">Repairs</option>
            <option value="inventory">Inventory</option>
          </select>

          <label class="block mb-2">Date Range</label>
          <div class="grid grid-cols-2 gap-2 mb-3">
            <input type="date" id="report-start" class="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value="${new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]}">
            <input type="date" id="report-end" class="p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value="${new Date().toISOString().split('T')[0]}">
          </div>

          <label class="block mb-2">Format</label>
          <div class="flex space-x-4 mb-4">
            <label><input type="radio" name="format" value="pdf" checked> PDF</label>
            <label><input type="radio" name="format" value="excel"> Excel (CSV)</label>
          </div>

          <div class="flex justify-end space-x-2">
            <button type="button" onclick="closeModal()" class="px-4 py-2">Cancel</button>
            <button type="submit" class="bg-primary text-white px-4 py-2 rounded">Generate Report</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = modal;
  document.getElementById('report-form').addEventListener('submit', generateCustomReport);
}

function generateCustomReport(e) {
  e.preventDefault();
  const name = document.getElementById('report-name').value;
  const module = document.getElementById('report-module').value;
  const start = document.getElementById('report-start').value;
  const end = document.getElementById('report-end').value;
  const format = document.querySelector('input[name="format"]:checked').value;

  const config = { module, start, end, format };
  
  if (format === 'pdf') {
    generatePDFReport(name, config);
  } else {
    generateExcelReport(name, config);
  }

  // Optionally save
  if (confirm('Save this report for later?')) {
    saveReportConfig(name, config);
  }
}

function generatePDFReport(name, config) {
  const content = `
    <div id="pdf-report" class="p-8 bg-white">
      <h1 class="text-2xl font-bold mb-6">GreenForce CRM Report</h1>
      <h2 class="text-xl mb-4">${name}</h2>
      <p><strong>Period:</strong> ${config.start} to ${config.end}</p>
      <p><strong>Module:</strong> ${config.module.charAt(0).toUpperCase() + config.module.slice(1)}</p>
      
      <div class="mt-6">
        <h3 class="font-bold mb-2">Data Summary</h3>
        <pre class="bg-gray-100 p-4 rounded">${JSON.stringify(getReportData(config), null, 2)}</pre>
      </div>
      
      <div class="mt-6 text-center">
        <button onclick="window.print()" class="bg-primary text-white px-4 py-2 rounded">🖨️ Print as PDF</button>
        <button onclick="closeModal()" class="ml-2 bg-gray-200 px-4 py-2 rounded">Close</button>
      </div>
    </div>
  `;
  document.getElementById('modal-root').innerHTML = content;
}

function generateExcelReport(name, config) {
  const data = getReportData(config);
  exportToCSV(data, `${name.replace(/\s+/g, '_')}.csv`);
  closeModal();
}

function getReportData(config) {
  const start = new Date(config.start);
  const end = new Date(config.end);
  
  if (config.module === 'sales') {
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    return sales.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    });
  }
  if (config.module === 'repairs') {
    const repairs = JSON.parse(localStorage.getItem('repairs')) || [];
    return repairs.filter(r => {
      const d = r.receivedAt ? new Date(r.receivedAt) : new Date();
      return d >= start && d <= end;
    });
  }
  if (config.module === 'inventory') {
    return JSON.parse(localStorage.getItem('inventory')) || [];
  }
  return [];
}

function runSavedReport(id) {
  const report = savedReports.find(r => r.id === id);
  if (report) {
    const format = report.config.format || 'pdf';
    if (format === 'pdf') {
      generatePDFReport(report.name, report.config);
    } else {
      generateExcelReport(report.name, report.config);
    }
  }
}

function deleteReport(id) {
  savedReports = savedReports.filter(r => r.id !== id);
  localStorage.setItem('savedReports', JSON.stringify(savedReports));
  loadReportsPage();
}

function openReportConfig(widgetId) {
  alert(`Configure widget: ${widgetId}\n(You can add date range, goals, etc. here)`);
}