// Mock user roles
let currentUser = {
  name: "Admin User",
  role: "admin" // 'admin', 'sales', 'technician', 'inventory'
};

// Set role badge
document.getElementById('user-role-badge').textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
document.getElementById('user-name').textContent = currentUser.name;

// Role-based UI (hide/show nav items)
function applyRolePermissions() {
  const navLinks = document.querySelectorAll('nav a[data-page]');
  navLinks.forEach(link => {
    const page = link.dataset.page;
    if (currentUser.role === 'admin') return; // show all

    if (currentUser.role === 'sales') {
      if (!['dashboard', 'customers', 'sales'].includes(page)) link.classList.add('hidden');
    } else if (currentUser.role === 'technician') {
      if (page !== 'repairs') link.classList.add('hidden');
    } else if (currentUser.role === 'inventory') {
      if (!['dashboard', 'inventory'].includes(page)) link.classList.add('hidden');
    }
  });
}

// Initialize
applyRolePermissions();