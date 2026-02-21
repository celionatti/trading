/* ============================================
   FOREX PULSE — Watchlist Component
   ============================================ */

import store from '../services/store.js';

export function renderWatchlist(container) {
  const watchlist = store.get('watchlist') || [];
  const quotes = store.get('quotes') || {};
  const selectedPair = store.get('selectedPair');
  const activeCategory = store.get('ui.marketCategory') || 'Forex';

  // Hardcoded categories for scaling
  const CATEGORIES = ['Forex', 'Crypto', 'Stocks', 'Commodities'];

  // Filter watchlist based on active category
  // In a real app we'd fetch this from API/Metadata, here we infer or use defaults
  const filteredWatchlist = watchlist.filter(symbol => {
    if (activeCategory === 'Forex') return symbol.includes('/') && !symbol.includes('BTC') && !symbol.includes('ETH') && !symbol.includes('SOL') && !symbol.includes('XAU') && !symbol.includes('XAG') && !symbol.includes('WTI');
    if (activeCategory === 'Crypto') return symbol.includes('BTC') || symbol.includes('ETH') || symbol.includes('SOL');
    if (activeCategory === 'Stocks') return !symbol.includes('/') && symbol.length <= 5;
    if (activeCategory === 'Commodities') return symbol.includes('XAU') || symbol.includes('XAG') || symbol.includes('WTI');
    return true;
  });

  container.innerHTML = `
    <div class="card" style="overflow:hidden; display:flex; flex-direction:column; height:100%;">
      <div class="card-header" style="flex-shrink:0;">
        <span class="card-title">Watchlist</span>
        <span class="badge badge-neutral">${filteredWatchlist.length} assets</span>
      </div>

      <!-- Category Tabs -->
      <div class="watchlist-tabs" style="display:flex; padding:0 var(--space-2); border-bottom:1px solid var(--border-primary); background:var(--bg-secondary); gap:4px;">
        ${CATEGORIES.map(cat => `
          <div class="watchlist-tab ${activeCategory === cat ? 'active' : ''}" data-category="${cat}" style="
            padding: var(--space-2) var(--space-3);
            font-size: 11px;
            font-weight: var(--font-semibold);
            cursor: pointer;
            color: ${activeCategory === cat ? 'var(--accent-primary)' : 'var(--text-tertiary)'};
            border-bottom: 2px solid ${activeCategory === cat ? 'var(--accent-primary)' : 'transparent'};
            transition: all var(--transition-fast);
            white-space: nowrap;
          ">${cat}</div>
        `).join('')}
      </div>

      <div class="watchlist-items-container" style="flex:1; overflow-y:auto; min-height:300px;">
        ${filteredWatchlist.length > 0 ? filteredWatchlist.map(pair => {
          const quote = quotes[pair];
          const price = quote ? (quote.close || quote.bid || '—') : '—';
          const change = quote ? parseFloat(quote.percent_change || 0) : 0;
          const isSelected = pair === selectedPair;

          return `
            <div class="watchlist-item ${isSelected ? 'selected' : ''}" data-pair="${pair}" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: var(--space-2) var(--space-3);
              cursor: pointer;
              transition: all var(--transition-fast);
              border-left: 3px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'};
              background: ${isSelected ? 'var(--accent-primary-glow)' : 'transparent'};
            ">
              <div>
                <div style="font-weight:var(--font-semibold);font-size:var(--text-sm);">${pair}</div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary);">
                  ${change >= 0 ? '▲' : '▼'}
                  <span class="mono ${change >= 0 ? 'text-profit' : 'text-loss'}" style="font-size:10px;">
                    ${change >= 0 ? '+' : ''}${change.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div style="text-align:right;">
                <div class="mono" style="font-size:var(--text-sm);font-weight:var(--font-semibold);">${price}</div>
                <div style="font-size:var(--text-xs);color:var(--text-tertiary);">
                  ${quote ? `${quote.bid || '—'} / ${quote.ask || '—'}` : '—'}
                </div>
              </div>
            </div>
          `;
        }).join('') : `
          <div style="padding:var(--space-8); text-align:center; color:var(--text-tertiary); font-size:var(--text-sm);">
            No ${activeCategory} assets in watchlist
          </div>
        `}
      </div>
    </div>
  `;

  // Tab switching
  container.querySelectorAll('.watchlist-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.dataset.category;
      store.set('ui.marketCategory', cat);
      renderWatchlist(container); // Re-render self
    });
  });

  const updateSelection = (pair) => {
    container.querySelectorAll('.watchlist-item').forEach(el => {
      const isSelected = el.dataset.pair === pair;
      el.classList.toggle('selected', isSelected);
      el.style.borderLeft = `3px solid ${isSelected ? 'var(--accent-primary)' : 'transparent'}`;
      el.style.background = isSelected ? 'var(--accent-primary-glow)' : 'transparent';
    });
  };

  // Click to select pair
  container.querySelectorAll('.watchlist-item').forEach(el => {
    el.addEventListener('click', () => {
      const pair = el.dataset.pair;
      store.set('selectedPair', pair);
      updateSelection(pair);
    });
  });

  const instanceId = `watchlist-${Math.random().toString(36).substr(2, 5)}`;

  // Stable subscription
  store.subscribe('quotes', () => updateWatchlistPrices(container), `${instanceId}-quotes`);

  return () => {
    store.unsubscribe(`${instanceId}-quotes`);
  };
}

function updateWatchlistPrices(container) {
  const quotes = store.get('quotes') || {};

  container.querySelectorAll('.watchlist-item').forEach(el => {
    const pair = el.dataset.pair;
    const quote = quotes[pair];
    if (!quote) return;

    const priceEl = el.querySelector('.mono');
    const changeEl = el.querySelector('.text-profit, .text-loss');
    const change = parseFloat(quote.percent_change || 0);

    if (priceEl) priceEl.textContent = quote.close || quote.bid || '—';
    if (changeEl) {
      changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
      changeEl.className = `mono ${change >= 0 ? 'text-profit' : 'text-loss'}`;
    }
  });
}
