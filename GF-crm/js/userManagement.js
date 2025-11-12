// js/userManagement.js

// Mock current user
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || {
  id: 1,
  name: "Admin User",
  email: "admin@greenforce.com",
  role: "admin",
  avatar: "https://i.pravatar.cc/100?img=1",
  permissions: {
    dashboard: { view: true },
    customers: { view: true, create: true, edit: true, delete: true },
    inventory: { view: true, create: true, edit: true, delete: true },
    sales: { view: true, create: true, edit: true, delete: true },
    repairs: { view: true, create: true, edit: true, delete: true },
    delivery: { view: true, create: true, edit: true, delete: true },
    reports: { view: true },
    users: { view: true, create: true, edit: true, delete: true }
  },
  password: "admin123", // In real app: hashed
  twoFactorEnabled: false,
  lastLogin: new Date().toISOString()
};

// Mock online users
const onlineUsers = [
  { id: 1, name: "Admin User", role: "admin", avatar: "https://i.pravatar.cc/100?img=1", status: "online" },
  { id: 2, name: "Sales Rep", role: "sales", avatar: "https://i.pravatar.cc/100?img=2", status: "online" },
  { id: 3, name: "Tech Lead", role: "technician", avatar: "https://i.pravatar.cc/100?img=3", status: "away" }
];

// Activity log
let activityLog = JSON.parse(localStorage.getItem('activityLog')) || [];

function logActivity(action, details = '') {
  const entry = {
    id: Date.now(),
    userId: currentUser.id,
    userName: currentUser.name,
    action,
    details,
    timestamp: new Date().toISOString()
  };
  activityLog.unshift(entry);
  // Keep last 100
  activityLog = activityLog.slice(0, 100);
  localStorage.setItem('activityLog', JSON.stringify(activityLog));
}

// Save current user
function saveCurrentUser() {
  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  updateUI();
}

// Update UI elements
function updateUI() {
  document.getElementById('user-role-badge').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
  document.getElementById('user-name').textContent = currentUser.name;
  document.getElementById('user-avatar').src = currentUser.avatar;
  applyGranularPermissions();
}

// Granular permission check
function hasPermission(module, action = 'view') {
  return currentUser.permissions?.[module]?.[action] === true;
}

// Apply permissions to UI
function applyGranularPermissions() {
  const navLinks = document.querySelectorAll('nav a[data-page]');
  navLinks.forEach(link => {
    const page = link.dataset.page;
    if (page === 'settings') return; // Always show settings
    
    if (hasPermission(page, 'view')) {
      link.classList.remove('hidden');
    } else {
      link.classList.add('hidden');
    }
  });
}

// Initialize
updateUI();