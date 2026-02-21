/* ============================================
   FOREX PULSE — Trade Page
   ============================================ */

import { renderChart } from '../components/Chart.js';
import { renderWatchlist } from '../components/Watchlist.js';
import { renderTradeForm } from '../components/TradeForm.js';
import { renderMarketAnalysis } from '../components/MarketAnalysis.js';
import { renderPositions } from '../components/Positions.js';
import store from '../services/store.js';

export function renderTradePage(container) {
  const getCollapsed = () => store.get('ui.tradeSideCollapsed') || false;

  container.innerHTML = `
    <div class="trade-layout ${getCollapsed() ? 'side-collapsed' : ''}" id="trade-main-grid">
      <div class="trade-chart-area">
        <div id="trade-chart" style="flex:1;min-height:400px;"></div>
        <div id="trade-positions"></div>
      </div>
      <div class="trade-panel">
        <div id="trade-form"></div>
        <div id="trade-watchlist" style="margin-top:var(--space-4);"></div>
        <div id="trade-analysis"></div>
      </div>
    </div>

    <!-- Enhanced Floating Toggle Button -->
    <button id="trade-side-toggle" class="btn btn-icon btn-primary" style="
      position: fixed; 
      bottom: 30px; 
      right: 30px; 
      z-index: 10001; 
      width: 44px; 
      height: 44px; 
      border-radius: 50%; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      border: 2px solid white;
      background: ${getCollapsed() ? 'var(--accent-secondary)' : 'var(--accent-primary)'};
    ">
      ${getCollapsed() ? '◀' : '▶'}
    </button>
  `;

  const cleanups = [];
  cleanups.push(renderChart(container.querySelector('#trade-chart')));
  cleanups.push(renderWatchlist(container.querySelector('#trade-watchlist')));
  cleanups.push(renderTradeForm(container.querySelector('#trade-form')));
  cleanups.push(renderMarketAnalysis(container.querySelector('#trade-analysis')));
  cleanups.push(renderPositions(container.querySelector('#trade-positions'), { compact: true }));

  // Re-sync UI state function
  const syncLayout = () => {
    const collapsed = getCollapsed();
    const grid = container.querySelector('#trade-main-grid');
    const btn = container.querySelector('#trade-side-toggle');
    if (grid) grid.classList.toggle('side-collapsed', collapsed);
    if (btn) {
      btn.innerHTML = collapsed ? '◀' : '▶';
      btn.style.background = collapsed ? 'var(--accent-secondary)' : 'var(--accent-primary)';
    }
    window.dispatchEvent(new Event('resize'));
    setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300);
  };

  // Click handler: ONLY updates state
  container.querySelector('#trade-side-toggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !getCollapsed();
    store.set('ui.tradeSideCollapsed', nextState);
    syncLayout(); // Instant feedback
  });

  // Subscribe for multi-tab/re-render sync
  store.subscribe('ui.tradeSideCollapsed', syncLayout, 'trade-toggle-sync');

  return () => {
    cleanups.forEach(c => c && c());
    store.unsubscribe('trade-toggle-sync');
  };
}
