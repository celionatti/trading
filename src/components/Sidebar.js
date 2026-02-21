/* ============================================
   FOREX PULSE — Sidebar Component (Optimized)
   ============================================ */

import store from '../services/store.js';

const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'trade', icon: '💹', label: 'Trade' },
  { id: 'positions', icon: '📋', label: 'Positions' },
  { id: 'analytics', icon: '📈', label: 'Analytics' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export function renderSidebar(container) {
  const currentPage = store.get('ui.currentPage');
  const collapsed = store.get('ui.sidebarCollapsed');
  const balance = store.get('balance');
  const positions = store.get('positions') || [];

  container.className = `sidebar${collapsed ? ' collapsed' : ''}`;

  container.innerHTML = `
    <div class="sidebar-brand">
      <div class="sidebar-brand-icon">📈</div>
      <div class="sidebar-brand-text">Forex<span>Pulse</span></div>
    </div>

    <nav class="sidebar-nav">
      <div class="sidebar-section-title">Trading</div>
      ${NAV_ITEMS.slice(0, 3).map(item => `
        <div class="nav-item${currentPage === item.id ? ' active' : ''}" data-page="${item.id}">
          <span class="nav-item-icon">${item.icon}</span>
          <span class="nav-item-text">${item.label}</span>
          ${item.id === 'positions' && positions.length > 0 ? `<span class="badge badge-info" style="margin-left:auto;">${positions.length}</span>` : ''}
        </div>
      `).join('')}

      <div class="sidebar-section-title">Insights</div>
      ${NAV_ITEMS.slice(3, 4).map(item => `
        <div class="nav-item${currentPage === item.id ? ' active' : ''}" data-page="${item.id}">
          <span class="nav-item-icon">${item.icon}</span>
          <span class="nav-item-text">${item.label}</span>
        </div>
      `).join('')}

      <div class="sidebar-section-title">System</div>
      ${NAV_ITEMS.slice(4).map(item => `
        <div class="nav-item${currentPage === item.id ? ' active' : ''}" data-page="${item.id}">
          <span class="nav-item-icon">${item.icon}</span>
          <span class="nav-item-text">${item.label}</span>
        </div>
      `).join('')}
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-balance">
        <div class="sidebar-balance-label">Account Balance</div>
        <div class="sidebar-balance-value ${balance >= 10000 ? 'text-profit' : 'text-loss'}">
          $${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  `;

  // Navigation click handlers
  container.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', () => {
      store.set('ui.currentPage', el.dataset.page);
    });
  });

  // Stable subscriptions (id prevents stacking)
  store.subscribe('ui.currentPage', () => renderSidebar(container), 'sidebar-page');
  store.subscribe('balance', () => {
    const balEl = container.querySelector('.sidebar-balance-value');
    if (balEl) {
      const bal = store.get('balance');
      balEl.textContent = `$${bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      balEl.className = `sidebar-balance-value ${bal >= 10000 ? 'text-profit' : 'text-loss'}`;
    }
  }, 'sidebar-balance');
  store.subscribe('positions', () => {
    const badge = container.querySelector('.nav-item[data-page="positions"] .badge');
    const pos = store.get('positions') || [];
    if (badge) {
      badge.textContent = pos.length;
      badge.style.display = pos.length > 0 ? '' : 'none';
    }
  }, 'sidebar-positions');
}
