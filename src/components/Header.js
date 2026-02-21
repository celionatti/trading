/* ============================================
   FOREX PULSE — Header Component (Optimized)
   ============================================ */

import store from '../services/store.js';

export function renderHeader(container) {
  const quotes = store.get('quotes') || {};
  const watchlist = store.get('watchlist') || [];
  const balance = store.get('balance');
  const equity = store.get('equity');
  const margin = store.get('margin');
  const theme = store.get('settings.theme');

  container.innerHTML = `
    <div class="header-left">
      <button class="header-toggle" id="sidebar-toggle" title="Toggle Sidebar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 12h18M3 6h18M3 18h18"/>
        </svg>
      </button>
      <div class="header-ticker" id="header-ticker">
        ${watchlist.slice(0, 6).map(pair => {
          const quote = quotes[pair];
          const change = quote ? parseFloat(quote.percent_change || 0) : 0;
          const price = quote ? quote.close || quote.bid || '—' : '—';
          return `
            <div class="ticker-item" data-pair="${pair}">
              <span class="ticker-pair">${pair}</span>
              <span class="ticker-price mono">${price}</span>
              <span class="ticker-change mono ${change >= 0 ? 'text-profit' : 'text-loss'}">
                ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
              </span>
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <div class="header-right">
      <div class="header-account">
        <div class="header-stat">
          <span class="header-stat-label">Balance</span>
          <span class="header-stat-value mono">$${balance.toFixed(2)}</span>
        </div>
        <div class="header-stat">
          <span class="header-stat-label">Equity</span>
          <span class="header-stat-value mono ${equity >= balance ? 'text-profit' : 'text-loss'}">$${equity.toFixed(2)}</span>
        </div>
        <div class="header-stat">
          <span class="header-stat-label">Margin</span>
          <span class="header-stat-value mono">$${margin.toFixed(2)}</span>
        </div>
      </div>

      <button class="btn btn-icon btn-ghost" id="theme-toggle" title="Toggle Theme">
        ${theme === 'dark' ? '🌙' : '☀️'}
      </button>
    </div>
  `;

  // Sidebar toggle
  container.querySelector('#sidebar-toggle')?.addEventListener('click', () => {
    const collapsed = !store.get('ui.sidebarCollapsed');
    store.set('ui.sidebarCollapsed', collapsed);
    document.getElementById('sidebar').classList.toggle('collapsed', collapsed);
  });

  // Theme toggle
  container.querySelector('#theme-toggle')?.addEventListener('click', () => {
    const newTheme = store.get('settings.theme') === 'dark' ? 'light' : 'dark';
    store.set('settings.theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    renderHeader(container);
  });

  // Ticker pair click → select pair
  container.querySelectorAll('.ticker-item').forEach(el => {
    el.addEventListener('click', () => {
      store.set('selectedPair', el.dataset.pair);
    });
  });

  // Stable subscriptions
  store.subscribe('quotes', () => updateTicker(container), 'header-quotes');
  store.subscribe('equity', () => updateAccountStats(container), 'header-equity');
}

function updateTicker(container) {
  const quotes = store.get('quotes') || {};
  container.querySelectorAll('.ticker-item').forEach(el => {
    const pair = el.dataset.pair;
    const quote = quotes[pair];
    if (!quote) return;

    const priceEl = el.querySelector('.ticker-price');
    const changeEl = el.querySelector('.ticker-change');
    const change = parseFloat(quote.percent_change || 0);

    if (priceEl) priceEl.textContent = quote.close || quote.bid || '—';
    if (changeEl) {
      changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
      changeEl.className = `ticker-change mono ${change >= 0 ? 'text-profit' : 'text-loss'}`;
    }
  });
}

function updateAccountStats(container) {
  const balance = store.get('balance');
  const equity = store.get('equity');
  const margin = store.get('margin');

  const stats = container.querySelectorAll('.header-stat-value');
  if (stats[0]) stats[0].textContent = `$${balance.toFixed(2)}`;
  if (stats[1]) {
    stats[1].textContent = `$${equity.toFixed(2)}`;
    stats[1].className = `header-stat-value mono ${equity >= balance ? 'text-profit' : 'text-loss'}`;
  }
  if (stats[2]) stats[2].textContent = `$${margin.toFixed(2)}`;
}
