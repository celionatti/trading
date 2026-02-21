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

  const isCollapsed = store.get('ui.dashboardSideCollapsed') || false;

  container.innerHTML = `
    <div class="dashboard-grid ${isCollapsed ? 'side-collapsed' : ''}">
      <!-- Toggle Button -->
      <button id="dashboard-side-toggle" class="btn btn-icon btn-ghost" style="position:fixed; bottom:var(--space-6); right:var(--space-6); z-index:var(--z-modal); border-radius:50%; box-shadow:var(--shadow-lg); background:var(--bg-secondary);">
        ${isCollapsed ? '◀' : '▶'}
      </button>

      <!-- Top Stats -->
      <div class="dashboard-stats">
        <div class="stat-widget" style="border-left:3px solid var(--accent-primary);">
          <span class="stat-label">Balance</span>
          <span class="stat-value">$${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span class="stat-change ${balance >= 10000 ? 'text-profit' : 'text-loss'}">
            ${balance >= 10000 ? '▲' : '▼'} ${((balance - 10000) / 100).toFixed(2)}%
          </span>
        </div>
        <div class="stat-widget" style="border-left:3px solid var(--color-profit);">
          <span class="stat-label">Equity</span>
          <span class="stat-value ${equity >= balance ? 'text-profit' : 'text-loss'}">$${equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
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

      <!-- Chart -->
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
  `;

  // Render sub-components
  const cleanups = [];
  cleanups.push(renderChart(container.querySelector('#dashboard-chart')));
  cleanups.push(renderTradeForm(container.querySelector('#dashboard-trade-form')));
  cleanups.push(renderMarketAnalysis(container.querySelector('#dashboard-analysis')));
  cleanups.push(renderWatchlist(container.querySelector('#dashboard-watchlist')));
  cleanups.push(renderPositions(container.querySelector('#dashboard-positions'), { compact: true }));

  // Side Toggle Handler
  const toggleBtn = container.querySelector('#dashboard-side-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = store.get('ui.dashboardSideCollapsed') || false;
      store.set('ui.dashboardSideCollapsed', !current);
      // Re-render to apply class (or just query and toggle class if we want to avoid full re-render)
      const grid = container.querySelector('.dashboard-grid');
      if (grid) {
        const nowCollapsed = !current;
        grid.classList.toggle('side-collapsed', nowCollapsed);
        toggleBtn.innerHTML = nowCollapsed ? '◀' : '▶';
        // Trigger chart resize
        window.dispatchEvent(new Event('resize'));
      }
    });
  }

  return () => {
    cleanups.forEach(c => c && c());
  };
}
