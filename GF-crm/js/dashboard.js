function loadDashboard() {
  // Get real data
  const customers = storage.get('customers', []);
  const inventory = storage.get('inventory', []);
  const sales = storage.get('sales', []);
  const repairs = storage.get('repairs', []);
  const deliveries = storage.get('deliveries', []);
  
  // Calculate this month's sales
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlySales = sales
    .filter(s => {
      const saleDate = new Date(s.date);
      return saleDate.getMonth() === thisMonth && saleDate.getFullYear() === thisYear;
    })
    .reduce((sum, s) => sum + parseFloat(s.amount), 0);
  
  const completedRepairs = repairs.filter(r => r.status === 'completed').length;
  const totalInventory = inventory.reduce((sum, i) => sum + i.stock, 0);
  const pendingDeliveries = deliveries.filter(d => d.status === 'pending').length;
  
  // Recent activity
  const recentSales = sales.slice(-5).reverse();
  const recentRepairs = repairs.slice(-5).reverse();
  
  const content = `
    <h2 class="text-2xl font-bold mb-6">Dashboard Overview</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-gray-600 dark:text-gray-300 text-sm font-medium mb-2">Total Sales (This Month)</h3>
        <p class="text-3xl font-bold text-primary">${formatNaira(monthlySales)}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${sales.filter(s => {
          const d = new Date(s.date);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).length} transactions</p>
      </div>
      
      <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-gray-600 dark:text-gray-300 text-sm font-medium mb-2">Repairs Completed</h3>
        <p class="text-3xl font-bold text-blue-600">${completedRepairs}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${repairs.filter(r => ['received', 'in repair'].includes(r.status)).length} in progress</p>
      </div>
      
      <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-gray-600 dark:text-gray-300 text-sm font-medium mb-2">Total Customers</h3>
        <p class="text-3xl font-bold text-purple-600">${customers.length}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${customers.filter(c => c.status === 'pending').length} pending orders</p>
      </div>
      
      <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-6 rounded-lg shadow-lg">
        <h3 class="text-gray-600 dark:text-gray-300 text-sm font-medium mb-2">Pending Deliveries</h3>
        <p class="text-3xl font-bold text-orange-600">${pendingDeliveries}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">${totalInventory} items in stock</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- Recent Sales -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-bold mb-4 text-lg">Recent Sales</h3>
        ${recentSales.length > 0 ? `
          <div class="space-y-3">
            ${recentSales.map(s => `
              <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                <div>
                  <p class="font-medium text-sm">${s.customer}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">${s.product}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-green-600">${formatNaira(s.amount)}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">${formatDate(s.date)}</p>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p class="text-gray-500 dark:text-gray-400 text-sm">No recent sales</p>'}
      </div>

      <!-- Recent Repairs -->
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 class="font-bold mb-4 text-lg">Recent Repairs</h3>
        ${recentRepairs.length > 0 ? `
          <div class="space-y-3">
            ${recentRepairs.map(r => {
              const statusColors = {
                received: 'bg-yellow-100 text-yellow-800',
                'in repair': 'bg-blue-100 text-blue-800',
                completed: 'bg-green-100 text-green-800',
                returned: 'bg-purple-100 text-purple-800'
              };
              return `
                <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-2">
                  <div>
                    <p class="font-medium text-sm">${r.customer}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">${r.device}</p>
                  </div>
                  <span class="px-2 py-1 rounded text-xs font-medium ${statusColors[r.status]}">
                    ${r.status}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        ` : '<p class="text-gray-500 dark:text-gray-400 text-sm">No recent repairs</p>'}
      </div>
    </div>

    <!-- Sales Trend Chart -->
    <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <h3 class="font-bold mb-4 text-lg">Sales Trend (Last 7 Days)</h3>
      <div class="h-64 flex items-end justify-around space-x-2">
        ${generateSalesChart(sales)}
      </div>
    </div>

    <!-- Low Stock Alert -->
    ${(() => {
      const lowStock = inventory.filter(i => i.stock <= i.minStock && i.stock > 0);
      if (lowStock.length > 0) {
        return `
          <div class="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6">
            <h3 class="font-bold text-red-800 dark:text-red-200 mb-3">⚠️ Low Stock Alert</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              ${lowStock.map(item => `
                <p class="text-red-700 dark:text-red-300 text-sm">
                  ${item.name}: <strong>${item.stock} units</strong> (Min: ${item.minStock})
                </p>
              `).join('')}
            </div>
          </div>
        `;
      }
      return '';
    })()}
  `;
  
  document.getElementById('page-content').innerHTML = content;
  setActiveLink('dashboard');
}

function generateSalesChart(sales) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    last7Days.push(date);
  }
  
  const dailySales = last7Days.map(date => {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const total = sales
      .filter(s => {
        const saleDate = new Date(s.date);
        return saleDate >= date && saleDate < nextDay;
      })
      .reduce((sum, s) => sum + parseFloat(s.amount), 0);
    
    return { date, total };
  });
  
  const maxSale = Math.max(...dailySales.map(d => d.total), 1);
  
  return dailySales.map(day => {
    const height = maxSale > 0 ? (day.total / maxSale) * 100 : 0;
    const dayName = day.date.toLocaleDateString('en-NG', { weekday: 'short' });
    
    return `
      <div class="flex-1 flex flex-col items-center">
        <div 
          class="bg-primary w-full rounded-t transition-all hover:bg-secondary" 
          style="height: ${height}%"
          title="${formatNaira(day.total)}"
        ></div>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">${dayName}</p>
      </div>
    `;
  }).join('');
}

// Load dashboard on start
document.addEventListener('DOMContentLoaded', loadDashboard);