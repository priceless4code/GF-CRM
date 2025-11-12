// ============================================
// NOTIFICATION SYSTEM
// ============================================
function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `fixed top-20 right-4 p-3 rounded shadow-lg z-50 transition-opacity duration-300 ${
    type === 'error' ? 'bg-red-500' : 
    type === 'success' ? 'bg-green-500' : 
    type === 'warning' ? 'bg-yellow-500' :
    'bg-blue-500'
  } text-white`;
  notif.textContent = message;
  document.body.appendChild(notif);
  
  // Fade out animation
  setTimeout(() => {
    notif.style.opacity = '0';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// ============================================
// MODAL MANAGEMENT (Fixed click issue)
// ============================================
function closeModal() {
  const modalRoot = document.getElementById('modal-root');
  const modal = modalRoot.firstElementChild;
  
  if (modal) {
    // Add fade out animation
    modal.style.opacity = '0';
    setTimeout(() => {
      modalRoot.innerHTML = '';
    }, 200);
  }
}

// Close modal on background click
document.addEventListener('click', (e) => {
  if (e.target.id && e.target.id.includes('-modal')) {
    closeModal();
  }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ============================================
// CURRENCY FORMATTING (Naira)
// ============================================
function formatNaira(amount) {
  return `₦${parseFloat(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function parseNaira(nairaString) {
  return parseFloat(nairaString.replace(/[₦,]/g, '')) || 0;
}

// ============================================
// EXPORT TO CSV
// ============================================
function exportToCSV(data, filename) {
  if (!data || data.length === 0) {
    showNotification('No data to export', 'error');
    return;
  }

  try {
    // Get headers from first object
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    });
    
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Export successful!', 'success');
  } catch (error) {
    console.error('Export error:', error);
    showNotification('Export failed', 'error');
  }
}

// ============================================
// ACTIVE LINK MANAGEMENT (Centralized)
// ============================================
function setActiveLink(page) {
  document.querySelectorAll('nav a').forEach(a => {
    a.classList.remove('active-link');
  });
  const link = document.querySelector(`nav a[data-page="${page}"]`);
  if (link) {
    link.classList.add('active-link');
  }
}

// ============================================
// STORAGE HELPERS (With error handling)
// ============================================
const storage = {
  get: (key, defaultValue = []) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Storage get error for ${key}:`, error);
      showNotification('Error loading data', 'error');
      return defaultValue;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Storage set error for ${key}:`, error);
      showNotification('Error saving data', 'error');
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Storage remove error for ${key}:`, error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      showNotification('All data cleared', 'info');
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};

// ============================================
// FORM VALIDATION
// ============================================
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePhone(phone) {
  // Nigerian phone number format
  const re = /^(\+234|0)[789]\d{9}$/;
  return re.test(phone.replace(/\s/g, ''));
}

function sanitizeInput(input) {
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
}

// ============================================
// DARK MODE TOGGLE
// ============================================
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// Load saved theme
const isDark = localStorage.getItem('darkMode') === 'true';
if (isDark) {
  document.documentElement.classList.add('dark');
}

// Update icon based on theme
function updateThemeIcon() {
  const isNowDark = document.documentElement.classList.contains('dark');
  themeIcon.innerHTML = isNowDark ?
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />' :
    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
}

updateThemeIcon();

themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isNowDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('darkMode', isNowDark);
  updateThemeIcon();
});

// ============================================
// MOBILE MENU TOGGLE
// ============================================
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');

menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('-translate-x-full');
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
  if (window.innerWidth < 768) {
    if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
      sidebar.classList.add('-translate-x-full');
    }
  }
});

// ============================================
// DATE FORMATTING
// ============================================
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ============================================
// SEARCH/FILTER HELPER
// ============================================
function filterData(data, searchTerm, fields) {
  const term = searchTerm.toLowerCase().trim();
  if (!term) return data;
  
  return data.filter(item => {
    return fields.some(field => {
      const value = item[field];
      return value && String(value).toLowerCase().includes(term);
    });
  });
}

// ============================================
// CONFIRMATION DIALOG
// ============================================
function confirmAction(message, onConfirm) {
  const modal = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" style="opacity: 1; transition: opacity 0.2s;">
      <div class="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-sm">
        <h3 class="text-xl font-bold mb-4">Confirm Action</h3>
        <p class="mb-6 text-gray-600 dark:text-gray-300">${message}</p>
        <div class="flex justify-end space-x-2">
          <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">Cancel</button>
          <button id="confirm-btn" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Confirm</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('modal-root').innerHTML = modal;
  
  document.getElementById('confirm-btn').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

// ============================================
// DEBOUNCE HELPER (for search inputs)
// ============================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}