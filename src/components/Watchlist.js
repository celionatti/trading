/* ============================================
   FOREX PULSE — Watchlist Component
   ============================================ */

import store from '../services/store.js';

export function renderWatchlist(container) {
  const watchlist = store.get('watchlist') || [];
  const quotes = store.get('quotes') || {};
  const selectedPair = store.get('selectedPair');

  container.innerHTML = `
    <div class="card" style="overflow:hidden;">
      <div class="card-header">
        <span class="card-title">Watchlist</span>
        <span class="badge badge-neutral">${watchlist.length} pairs</span>
      </div>
      <div style="max-height:400px;overflow-y:auto;">
        ${watchlist.map(pair => {
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
                  <span class="mono ${change >= 0 ? 'text-profit' : 'text-loss'}">
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
        }).join('')}
      </div>
    </div>
  `;

  // Click to select pair
  container.querySelectorAll('.watchlist-item').forEach(el => {
    el.addEventListener('click', () => {
      store.set('selectedPair', el.dataset.pair);
      renderWatchlist(container);
    });
  });

  // Stable subscription
  store.subscribe('quotes', () => updateWatchlistPrices(container), 'watchlist-quotes');
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
