/* ============================================
   FOREX PULSE — Dashboard Page
   ============================================ */

import { renderChart } from '../components/Chart.js';
import { renderWatchlist } from '../components/Watchlist.js';
import { renderMarketAnalysis } from '../components/MarketAnalysis.js';
import { renderPositions } from '../components/Positions.js';
import { renderTradeForm } from '../components/TradeForm.js';
import store from '../services/store.js';

export function renderDashboard(container) {
  const balance = store.get('balance');
  const equity = store.get('equity');
  const positions = store.get('positions') || [];
  const totalUnrealizedPL = positions.reduce((s, p) => s + p.unrealizedPL, 0);

  const getCollapsed = () => store.get('ui.dashboardSideCollapsed') || false;

  container.innerHTML = `
    <div class="dashboard-grid ${getCollapsed() ? 'side-collapsed' : ''}" id="dashboard-main-grid">
      <!-- Top Stats -->
      <div class="dashboard-stats">
        <div class="stat-widget" style="border-left:3px solid var(--accent-primary);">
          <span class="stat-label">Balance</span>
          <span class="stat-value">$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="stat-widget" style="border-left:3px solid var(--color-profit);">
          <span class="stat-label">Equity</span>
          <span class="stat-value">$${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
        <div class="stat-widget" style="border-left:3px solid ${totalUnrealizedPL >= 0 ? 'var(--color-profit)' : 'var(--color-loss)'};">
          <span class="stat-label">Unrealized P&L</span>
          <span class="stat-value ${totalUnrealizedPL >= 0 ? 'text-profit' : 'text-loss'}">${totalUnrealizedPL >= 0 ? '+' : ''}$${totalUnrealizedPL.toFixed(2)}</span>
        </div>
        <div class="stat-widget" style="border-left:3px solid var(--accent-secondary);">
          <span class="stat-label">Open Positions</span>
          <span class="stat-value">${positions.length}</span>
        </div>
      </div>

      <!-- Chart Area -->
      <div class="dashboard-chart" id="dashboard-chart"></div>

      <!-- Right Sidebar -->
      <div class="dashboard-sidebar">
        <div id="dashboard-trade-form"></div>
        <div id="dashboard-analysis"></div>
        <div id="dashboard-watchlist"></div>
      </div>

      <!-- Bottom Positions -->
      <div class="dashboard-bottom" id="dashboard-positions"></div>
    </div>

    <!-- Enhanced Floating Toggle Button -->
    <button id="dashboard-side-toggle" class="btn btn-icon btn-primary" style="
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

  // Components
  const cleanups = [];
  cleanups.push(renderChart(container.querySelector('#dashboard-chart')));
  cleanups.push(renderTradeForm(container.querySelector('#dashboard-trade-form')));
  cleanups.push(renderMarketAnalysis(container.querySelector('#dashboard-analysis')));
  cleanups.push(renderWatchlist(container.querySelector('#dashboard-watchlist')));
  cleanups.push(renderPositions(container.querySelector('#dashboard-positions'), { compact: true }));

  // Re-sync UI state function
  const syncLayout = () => {
    const collapsed = getCollapsed();
    const grid = container.querySelector('#dashboard-main-grid');
    const btn = container.querySelector('#dashboard-side-toggle');
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
  container.querySelector('#dashboard-side-toggle')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !getCollapsed();
    store.set('ui.dashboardSideCollapsed', nextState);
    syncLayout(); // Instant feedback
  });

  // Subscribe for multi-tab/re-render sync
  store.subscribe('ui.dashboardSideCollapsed', syncLayout, 'dash-toggle-sync');

  return () => {
    cleanups.forEach(c => c && c());
    store.unsubscribe('dash-toggle-sync');
  };
}
