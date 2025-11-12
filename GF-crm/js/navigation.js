// Store recently viewed items
let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];

// Breadcrumb mapping
const breadcrumbMap = {
  dashboard: 'Dashboard',
  customers: 'Customers',
  inventory: 'Inventory',
  sales: 'Sales',
  repairs: 'Repairs',
  delivery: 'Delivery'
};

// Update breadcrumbs
function updateBreadcrumbs(pageKey) {
  document.getElementById('breadcrumbs').textContent = breadcrumbMap[pageKey] || pageKey;
}

// Add to recently viewed
function addToRecent(title, type, id) {
  const newItem = { title, type, id, timestamp: Date.now() };
  // Remove duplicates
  recentlyViewed = recentlyViewed.filter(item => !(item.type === type && item.id === id));
  // Add to top
  recentlyViewed.unshift(newItem);
  // Keep only last 8
  recentlyViewed = recentlyViewed.slice(0, 8);
  localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  renderRecentItems();
}

// Render recent items
function renderRecentItems() {
  const container = document.getElementById('recent-items');
  if (!container) return;

  container.innerHTML = recentlyViewed.length === 0 
    ? '<p class="text-gray-500 text-sm">No recent items</p>'
    : recentlyViewed.map(item => `
        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
             onclick="navigateToItem('${item.type}', ${item.id})">
          <div class="font-medium">${item.title}</div>
          <div class="text-xs text-gray-500 capitalize">${item.type}</div>
        </div>
      `).join('');
}

// Navigate to item (stub - you can expand later)
function navigateToItem(type, id) {
  // For now, just go to the module
  if (type === 'customer') {
    document.querySelector('nav a[data-page="customers"]').click();
  } else if (type === 'product') {
    document.querySelector('nav a[data-page="inventory"]').click();
  } else if (type === 'repair') {
    document.querySelector('nav a[data-page="repairs"]').click();
  }
  showNotification(`Navigating to ${type}...`, 'info');
}

// Global Search
document.getElementById('global-search').addEventListener('input', function(e) {
  const query = e.target.value.trim().toLowerCase();
  const resultsDiv = document.getElementById('search-results');
  
  if (query.length < 2) {
    resultsDiv.classList.add('hidden');
    return;
  }

  const allData = [
    ...JSON.parse(localStorage.getItem('customers') || '[]').map(c => ({ ...c, type: 'customer' })),
    ...JSON.parse(localStorage.getItem('inventory') || '[]').map(i => ({ ...i, type: 'product' })),
    ...JSON.parse(localStorage.getItem('repairs') || '[]').map(r => ({ ...r, type: 'repair' }))
  ];

  const matches = allData.filter(item => 
    (item.name && item.name.toLowerCase().includes(query)) ||
    (item.device && item.device.toLowerCase().includes(query)) ||
    (item.phone && item.phone.includes(query))
  ).slice(0, 6);

  resultsDiv.innerHTML = matches.length 
    ? matches.map(item => `
        <div class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
             onclick="selectSearchResult(${item.id}, '${item.type}')">
          <div class="font-medium">${item.name || item.device}</div>
          <div class="text-sm text-gray-500 capitalize">${item.type}</div>
        </div>
      `).join('')
    : '<div class="p-3 text-gray-500">No results found</div>';

  resultsDiv.classList.remove('hidden');
});

// Close search on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('#global-search') && !e.target.closest('#search-results')) {
    document.getElementById('search-results').classList.add('hidden');
  }
});

// Handle search result click
function selectSearchResult(id, type) {
  document.getElementById('global-search').value = '';
  document.getElementById('search-results').classList.add('hidden');
  addToRecent(
    type === 'customer' ? 
      JSON.parse(localStorage.getItem('customers') || '[]').find(c => c.id === id)?.name || 'Unknown' :
    type === 'product' ? 
      JSON.parse(localStorage.getItem('inventory') || '[]').find(i => i.id === id)?.name || 'Unknown' :
      JSON.parse(localStorage.getItem('repairs') || '[]').find(r => r.id === id)?.customer || 'Unknown',
    type,
    id
  );
  navigateToItem(type, id);
}

// FAB Toggle
document.getElementById('fab').addEventListener('click', function() {
  const menu = document.getElementById('fab-menu');
  menu.classList.toggle('hidden');
});

// Quick Actions
function quickAction(action) {
  document.getElementById('fab-menu').classList.add('hidden');
  if (action === 'customer') openCustomerModal();
  else if (action === 'sale') openSalesModal();
  else if (action === 'repair') openRepairModal();
}

// Initialize
renderRecentItems();