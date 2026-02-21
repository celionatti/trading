/* ============================================
   FOREX PULSE — Markets HQ Page
   ============================================ */

import store from '../services/store.js';
import { getDefaultPairs, getDecimals } from '../services/api.js';

export function renderMarketsPage(container) {
  const activeCategory = store.get('ui.marketCategory') || 'Forex';
  const allAssets = getDefaultPairs();
  const quotes = store.get('quotes') || {};
  
  const categories = ['Forex', 'Crypto', 'Stocks', 'Commodities'];
  
  const filteredAssets = allAssets.filter(a => a.category === activeCategory);

  container.innerHTML = `
    <div class="markets-page" style="padding:var(--space-6); max-width:1400px; margin:0 auto;">
      <header style="margin-bottom:var(--space-8); display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <h1 style="font-size:var(--text-3xl); font-weight:var(--font-bold); margin-bottom:var(--space-2);">Markets HQ</h1>
          <p style="color:var(--text-tertiary);">Discovery & real-time monitoring across all asset classes.</p>
        </div>
        <div class="badge badge-info" style="padding:var(--space-2) var(--space-4);">Live Market Feed</div>
      </header>

      <!-- Category Hero Selector -->
      <div class="category-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:var(--space-4); margin-bottom:var(--space-8);">
        ${categories.map(cat => {
          const isActive = activeCategory === cat;
          const icons = { 'Forex': '💱', 'Crypto': '₿', 'Stocks': '📈', 'Commodities': '🛢️' };
          return `
            <div class="category-card ${isActive ? 'active' : ''}" data-category="${cat}" style="
              background: ${isActive ? 'var(--accent-primary-glow)' : 'var(--bg-card)'};
              border: 1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-primary)'};
              padding: var(--space-6);
              border-radius: var(--radius-xl);
              cursor: pointer;
              transition: all var(--transition-base);
              text-align: center;
              box-shadow: ${isActive ? 'var(--shadow-lg)' : 'var(--shadow-sm)'};
            ">
              <div style="font-size:2.5rem; margin-bottom:var(--space-3);">${icons[cat]}</div>
              <div style="font-weight:var(--font-bold); font-size:var(--text-lg); color:${isActive ? 'var(--text-primary)' : 'var(--text-secondary)'};">${cat}</div>
              <div style="font-size:var(--text-xs); color:var(--text-tertiary); margin-top:var(--space-1);">${allAssets.filter(a => a.category === cat).length} Assets</div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="assets-grid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:var(--space-6);">
        ${filteredAssets.map(asset => {
          const quote = quotes[asset.symbol];
          const price = quote ? quote.close : '—';
          const change = quote ? parseFloat(quote.percent_change || 0) : 0;
          const decimals = getDecimals(asset.symbol);

          return `
            <div class="asset-card" data-symbol="${asset.symbol}" style="
              background: var(--bg-card);
              border: 1px solid var(--border-primary);
              border-radius: var(--radius-lg);
              padding: var(--space-5);
              cursor: pointer;
              transition: all var(--transition-fast);
              position: relative;
              overflow: hidden;
            ">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:var(--space-4);">
                <div>
                  <div style="font-weight:var(--font-bold); font-size:var(--text-lg); color:var(--text-primary);">${asset.symbol}</div>
                  <div style="font-size:var(--text-xs); color:var(--text-tertiary);">${asset.group} Asset</div>
                </div>
                <div class="badge ${change >= 0 ? 'badge-profit' : 'badge-loss'}" style="font-size:10px;">
                  ${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%
                </div>
              </div>
              
              <div style="display:flex; align-items:baseline; gap:var(--space-2);">
                <span class="mono" style="font-size:var(--text-2xl); font-weight:var(--font-bold);">${price !== '—' ? parseFloat(price).toFixed(decimals) : price}</span>
                <span style="font-size:var(--text-xs); color:var(--text-tertiary);">USD</span>
              </div>

              <div style="margin-top:var(--space-4); pt:var(--space-4); border-top:1px solid var(--border-primary); display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:var(--text-xs); color:var(--text-tertiary);">Volatility: Medium</span>
                <button class="btn btn-ghost btn-sm" style="border:none; background:var(--bg-tertiary);">Trade Now →</button>
              </div>
              
              <div class="sparkline-placeholder" style="height:30px; margin-top:var(--space-3); opacity:0.3; background:linear-gradient(90deg, transparent, var(--accent-primary-glow), transparent); border-radius:var(--radius-sm);"></div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // === Event Listeners ===

  // Category selection
  container.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const cat = card.dataset.category;
      store.set('ui.marketCategory', cat);
      renderMarketsPage(container);
    });
  });

  // Asset selection -> Go to Trade
  container.querySelectorAll('.asset-card').forEach(card => {
    card.addEventListener('click', () => {
      const symbol = card.dataset.symbol;
      store.set('selectedPair', symbol);
      store.set('ui.currentPage', 'trade');
    });
  });

  const instanceId = `marketspage-${Math.random().toString(36).substr(2, 5)}`;
  store.subscribe('quotes', () => updateMarketPrices(container), `${instanceId}-quotes`);

  return () => {
    store.unsubscribe(`${instanceId}-quotes`);
  };
}

function updateMarketPrices(container) {
  const quotes = store.get('quotes') || {};
  container.querySelectorAll('.asset-card').forEach(card => {
    const symbol = card.dataset.symbol;
    const quote = quotes[symbol];
    if (!quote) return;

    const priceEl = card.querySelector('.mono');
    const badgeEl = card.querySelector('.badge');
    const change = parseFloat(quote.percent_change || 0);
    const decimals = getDecimals(symbol);

    if (priceEl) priceEl.textContent = parseFloat(quote.close).toFixed(decimals);
    if (badgeEl) {
      badgeEl.textContent = `${change >= 0 ? '▲' : '▼'} ${Math.abs(change).toFixed(2)}%`;
      badgeEl.className = `badge ${change >= 0 ? 'badge-profit' : 'badge-loss'}`;
    }
  });
}
